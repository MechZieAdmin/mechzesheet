package com.mechzie.server.service;

import com.mechzie.server.entity.*;
import com.mechzie.server.exception.BadRequestException;
import com.mechzie.server.exception.ResourceNotFoundException;
import com.mechzie.server.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class LeaveService {

    private static final Logger logger = LoggerFactory.getLogger(LeaveService.class);

    private final LeaveTypeRepository leaveTypeRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    public LeaveService(LeaveTypeRepository leaveTypeRepository, LeaveBalanceRepository leaveBalanceRepository,
                        LeaveRequestRepository leaveRequestRepository, EmployeeRepository employeeRepository,
                        UserRepository userRepository) {
        this.leaveTypeRepository = leaveTypeRepository;
        this.leaveBalanceRepository = leaveBalanceRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
    }

    public List<Map<String, Object>> getLeaveTypes() {
        return leaveTypeRepository.findAll().stream()
                .filter(LeaveType::getIsActive)
                .map(lt -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", lt.getId());
                    map.put("name", lt.getName());
                    return map;
                }).toList();
    }

    public List<Map<String, Object>> getMyBalance(Long employeeId, int year) {
        List<LeaveBalance> balances = leaveBalanceRepository.findByEmployeeIdAndYear(employeeId, year);
        return balances.stream().map(b -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("leaveTypeName", b.getLeaveType().getName());
            map.put("totalAllotted", b.getTotalAllotted());
            map.put("used", b.getUsed());
            map.put("remaining", b.getRemaining());
            return map;
        }).toList();
    }

    public List<Map<String, Object>> getMyRequests(Long employeeId) {
        List<LeaveRequest> requests = leaveRequestRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId);
        return requests.stream().map(this::toLeaveRequestMap).toList();
    }

    @Transactional
    public Map<String, Object> applyLeave(Long employeeId, Long leaveTypeId, String startDateStr, String endDateStr, String reason) {
        Employee emp = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));
        LeaveType leaveType = leaveTypeRepository.findById(leaveTypeId)
                .orElseThrow(() -> new ResourceNotFoundException("LeaveType", leaveTypeId));

        LocalDate startDate = LocalDate.parse(startDateStr);
        LocalDate endDate = LocalDate.parse(endDateStr);

        if (endDate.isBefore(startDate)) {
            throw new BadRequestException("End date cannot be before start date");
        }
        if (startDate.isBefore(LocalDate.now())) {
            throw new BadRequestException("Cannot apply leave for past dates");
        }

        long days = ChronoUnit.DAYS.between(startDate, endDate) + 1;

        // Check balance
        int year = startDate.getYear();
        Optional<LeaveBalance> balOpt = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(employeeId, leaveTypeId, year);
        if (balOpt.isPresent()) {
            LeaveBalance bal = balOpt.get();
            if (bal.getRemaining() < days) {
                throw new BadRequestException("Insufficient leave balance. Available: " + bal.getRemaining() + ", requested: " + days);
            }
        }

        LeaveRequest request = new LeaveRequest();
        request.setEmployee(emp);
        request.setLeaveType(leaveType);
        request.setStartDate(startDate);
        request.setEndDate(endDate);
        request.setReason(reason);
        request.setStatus(LeaveRequest.Status.PENDING);

        leaveRequestRepository.save(request);
        logger.info("Leave request submitted by employee {} for {} days ({} - {})", emp.getEmployeeCode(), days, startDate, endDate);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Leave request submitted successfully");
        result.put("id", request.getId());
        return result;
    }

    public List<Map<String, Object>> getPendingRequests(String statusFilter) {
        List<LeaveRequest> requests;
        if (statusFilter != null && !statusFilter.isBlank() && !statusFilter.equalsIgnoreCase("pending")) {
            try {
                LeaveRequest.Status status = LeaveRequest.Status.valueOf(statusFilter.toUpperCase());
                requests = leaveRequestRepository.findByStatus(status);
            } catch (IllegalArgumentException e) {
                requests = leaveRequestRepository.findByStatus(LeaveRequest.Status.PENDING);
            }
        } else {
            requests = leaveRequestRepository.findByStatus(LeaveRequest.Status.PENDING);
        }
        return requests.stream().map(this::toAdminLeaveRequestMap).toList();
    }

    public List<Map<String, Object>> getAllRequests() {
        return leaveRequestRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toAdminLeaveRequestMap).toList();
    }

    @Transactional
    public Map<String, Object> reviewLeave(Long leaveId, Long reviewerUserId, String statusStr, String comment) {
        LeaveRequest request = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("LeaveRequest", leaveId));

        if (request.getStatus() != LeaveRequest.Status.PENDING) {
            throw new BadRequestException("This leave request has already been " + request.getStatus().name().toLowerCase());
        }

        LeaveRequest.Status newStatus;
        try {
            newStatus = LeaveRequest.Status.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status. Use 'approved' or 'rejected'.");
        }

        User reviewer = userRepository.findById(reviewerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", reviewerUserId));

        request.setStatus(newStatus);
        request.setReviewer(reviewer);
        request.setReviewerComment(comment);
        request.setReviewedAt(LocalDateTime.now());

        // If approved, deduct from balance
        if (newStatus == LeaveRequest.Status.APPROVED) {
            long days = ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate()) + 1;
            int year = request.getStartDate().getYear();
            Optional<LeaveBalance> balOpt = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeIdAndYear(
                    request.getEmployee().getId(), request.getLeaveType().getId(), year);

            if (balOpt.isPresent()) {
                LeaveBalance bal = balOpt.get();
                bal.setUsed(bal.getUsed() + (int) days);
                bal.setRemaining(bal.getTotalAllotted() - bal.getUsed());
                leaveBalanceRepository.save(bal);
            }
        }

        leaveRequestRepository.save(request);
        logger.info("Leave request {} {} by userId={}", leaveId, newStatus.name().toLowerCase(), reviewerUserId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Leave request " + newStatus.name().toLowerCase());
        return result;
    }

    private Map<String, Object> toLeaveRequestMap(LeaveRequest r) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", r.getId());
        map.put("leaveTypeName", r.getLeaveType().getName());
        map.put("startDate", r.getStartDate());
        map.put("endDate", r.getEndDate());
        map.put("reason", r.getReason());
        map.put("status", r.getStatus().name().toLowerCase());
        map.put("reviewerComment", r.getReviewerComment());
        map.put("createdAt", r.getCreatedAt());
        return map;
    }

    private Map<String, Object> toAdminLeaveRequestMap(LeaveRequest r) {
        Map<String, Object> map = toLeaveRequestMap(r);
        Employee emp = r.getEmployee();
        map.put("employeeId", emp.getId());
        map.put("employeeName", emp.getFullName());
        map.put("employeeCode", emp.getEmployeeCode());
        map.put("department", emp.getDepartment());
        map.put("reviewedAt", r.getReviewedAt());
        return map;
    }
}
