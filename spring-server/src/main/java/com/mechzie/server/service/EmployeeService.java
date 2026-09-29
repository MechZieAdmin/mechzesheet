package com.mechzie.server.service;

import com.mechzie.server.entity.Employee;
import com.mechzie.server.entity.User;
import com.mechzie.server.exception.BadRequestException;
import com.mechzie.server.exception.ResourceNotFoundException;
import com.mechzie.server.repository.EmployeeRepository;
import com.mechzie.server.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
public class EmployeeService {

    private static final Logger logger = LoggerFactory.getLogger(EmployeeService.class);

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public EmployeeService(EmployeeRepository employeeRepository, UserRepository userRepository,
                           PasswordEncoder passwordEncoder) {
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Map<String, Object> listEmployees(String search, String department, int page, int limit) {
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by("fullName").ascending());
        Page<Employee> empPage;

        boolean hasSearch = search != null && !search.isBlank();
        boolean hasDept = department != null && !department.isBlank();

        if (hasSearch && hasDept) {
            empPage = employeeRepository.searchEmployeesByDepartment(search, department, pageable);
        } else if (hasSearch) {
            empPage = employeeRepository.searchEmployees(search, pageable);
        } else if (hasDept) {
            empPage = employeeRepository.findByIsActiveTrueAndDepartment(department, pageable);
        } else {
            empPage = employeeRepository.findByIsActiveTrue(pageable);
        }

        List<Map<String, Object>> data = empPage.getContent().stream().map(this::toMap).toList();

        Map<String, Object> pagination = new LinkedHashMap<>();
        pagination.put("page", empPage.getNumber() + 1);
        pagination.put("limit", empPage.getSize());
        pagination.put("totalPages", empPage.getTotalPages());
        pagination.put("totalItems", empPage.getTotalElements());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("data", data);
        result.put("pagination", pagination);
        return result;
    }

    public List<String> getDistinctDepartments() {
        return employeeRepository.findDistinctDepartments();
    }

    public Employee getEmployeeById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", id));
    }

    public Map<String, Object> getMyProfile(Long employeeId) {
        Employee emp = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));
        Map<String, Object> profile = toMap(emp);
        profile.put("address", emp.getAddress());
        profile.put("emergencyContact", emp.getEmergencyContact());
        profile.put("shiftStart", emp.getShiftStart());
        profile.put("shiftEnd", emp.getShiftEnd());
        profile.put("baseSalary", emp.getBaseSalary());
        profile.put("reportingManager", emp.getReportingManager());
        profile.put("photoUrl", emp.getPhotoUrl());
        return profile;
    }

    @Transactional
    public Map<String, Object> createEmployee(Map<String, Object> dto, Long createdByUserId) {
        String email = (String) dto.get("email");
        String employeeCode = (String) dto.get("employeeCode");

        if (email == null || email.isBlank()) throw new BadRequestException("Email is required");
        if (employeeCode == null || employeeCode.isBlank()) throw new BadRequestException("Employee code is required");
        if (employeeRepository.existsByEmail(email)) throw new BadRequestException("Email already in use");
        if (employeeRepository.existsByEmployeeCode(employeeCode)) throw new BadRequestException("Employee code already exists");
        if (userRepository.findByEmail(email).isPresent()) throw new BadRequestException("A user with this email already exists");

        Employee emp = new Employee();
        emp.setEmployeeCode(employeeCode);
        emp.setFullName((String) dto.getOrDefault("fullName", "New Employee"));
        emp.setDepartment((String) dto.getOrDefault("department", "General"));
        emp.setDesignation((String) dto.getOrDefault("designation", "Staff"));
        emp.setEmail(email);
        emp.setPhone((String) dto.get("phone"));
        emp.setReportingManager((String) dto.get("reportingManager"));
        emp.setShiftStart((String) dto.getOrDefault("shiftStart", "09:00"));
        emp.setShiftEnd((String) dto.getOrDefault("shiftEnd", "18:00"));
        emp.setCreatedBy(createdByUserId);

        String dateStr = (String) dto.get("dateOfJoining");
        emp.setDateOfJoining(dateStr != null ? LocalDate.parse(dateStr) : LocalDate.now());

        Object salaryObj = dto.get("baseSalary");
        if (salaryObj != null) {
            emp.setBaseSalary(salaryObj instanceof Number ? ((Number) salaryObj).doubleValue() : Double.parseDouble(salaryObj.toString()));
        }

        String statusStr = (String) dto.get("employmentStatus");
        if (statusStr != null && !statusStr.isBlank()) {
            emp.setEmploymentStatus(Employee.EmploymentStatus.valueOf(statusStr.toUpperCase()));
        }

        Employee saved = employeeRepository.save(emp);

        // Create user account with temp password
        String tempPassword = "Emp@" + System.currentTimeMillis() % 100000;
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(tempPassword));
        user.setRole(User.Role.EMPLOYEE);
        user.setEmployee(saved);
        userRepository.save(user);

        logger.info("Employee created: {} ({}), user account created by userId={}", saved.getFullName(), saved.getEmployeeCode(), createdByUserId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("employee", toMap(saved));
        Map<String, String> credentials = new LinkedHashMap<>();
        credentials.put("email", email);
        credentials.put("tempPassword", tempPassword);
        result.put("credentials", credentials);
        return result;
    }

    @Transactional
    public Map<String, Object> updateEmployee(Long id, Map<String, Object> dto) {
        Employee emp = getEmployeeById(id);

        if (dto.containsKey("fullName")) emp.setFullName((String) dto.get("fullName"));
        if (dto.containsKey("department")) emp.setDepartment((String) dto.get("department"));
        if (dto.containsKey("designation")) emp.setDesignation((String) dto.get("designation"));
        if (dto.containsKey("phone")) emp.setPhone((String) dto.get("phone"));
        if (dto.containsKey("reportingManager")) emp.setReportingManager((String) dto.get("reportingManager"));
        if (dto.containsKey("shiftStart")) emp.setShiftStart((String) dto.get("shiftStart"));
        if (dto.containsKey("shiftEnd")) emp.setShiftEnd((String) dto.get("shiftEnd"));
        if (dto.containsKey("address")) emp.setAddress((String) dto.get("address"));
        if (dto.containsKey("emergencyContact")) emp.setEmergencyContact((String) dto.get("emergencyContact"));

        if (dto.containsKey("dateOfJoining") && dto.get("dateOfJoining") != null) {
            emp.setDateOfJoining(LocalDate.parse((String) dto.get("dateOfJoining")));
        }

        Object salaryObj = dto.get("baseSalary");
        if (salaryObj != null) {
            emp.setBaseSalary(salaryObj instanceof Number ? ((Number) salaryObj).doubleValue() : Double.parseDouble(salaryObj.toString()));
        }

        String statusStr = (String) dto.get("employmentStatus");
        if (statusStr != null && !statusStr.isBlank()) {
            emp.setEmploymentStatus(Employee.EmploymentStatus.valueOf(statusStr.toUpperCase()));
        }

        Employee saved = employeeRepository.save(emp);
        return toMap(saved);
    }

    @Transactional
    public void updateMyProfile(Long employeeId, Map<String, Object> dto) {
        Employee emp = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));

        // Employees can only update limited fields
        if (dto.containsKey("phone")) emp.setPhone((String) dto.get("phone"));
        if (dto.containsKey("address")) emp.setAddress((String) dto.get("address"));
        if (dto.containsKey("emergencyContact")) emp.setEmergencyContact((String) dto.get("emergencyContact"));

        employeeRepository.save(emp);
    }

    @Transactional
    public void deactivateEmployee(Long id) {
        Employee emp = getEmployeeById(id);
        emp.setIsActive(false);
        emp.setEmploymentStatus(Employee.EmploymentStatus.TERMINATED);
        employeeRepository.save(emp);

        // Deactivate user account too
        userRepository.findByEmail(emp.getEmail()).ifPresent(user -> {
            user.setIsActive(false);
            user.setRefreshToken(null);
            userRepository.save(user);
        });

        logger.info("Employee deactivated: {} ({})", emp.getFullName(), emp.getEmployeeCode());
    }

    private Map<String, Object> toMap(Employee e) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", e.getId());
        map.put("employeeCode", e.getEmployeeCode());
        map.put("fullName", e.getFullName());
        map.put("department", e.getDepartment());
        map.put("designation", e.getDesignation());
        map.put("email", e.getEmail());
        map.put("phone", e.getPhone());
        map.put("dateOfJoining", e.getDateOfJoining());
        map.put("employmentStatus", e.getEmploymentStatus().name().toLowerCase());
        map.put("isActive", e.getIsActive());
        return map;
    }
}
