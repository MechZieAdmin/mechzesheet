package com.mechzie.server.service;

import com.mechzie.server.entity.Attendance;
import com.mechzie.server.entity.Employee;
import com.mechzie.server.exception.BadRequestException;
import com.mechzie.server.exception.ResourceNotFoundException;
import com.mechzie.server.repository.AttendanceRepository;
import com.mechzie.server.repository.EmployeeRepository;
import com.mechzie.server.repository.SettingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.*;

@Service
public class AttendanceService {

    private static final Logger logger = LoggerFactory.getLogger(AttendanceService.class);

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final SettingRepository settingRepository;

    public AttendanceService(AttendanceRepository attendanceRepository, EmployeeRepository employeeRepository,
                             SettingRepository settingRepository) {
        this.attendanceRepository = attendanceRepository;
        this.employeeRepository = employeeRepository;
        this.settingRepository = settingRepository;
    }

    @Transactional
    public Map<String, Object> clockIn(Long employeeId, Double lat, Double lng) {
        Employee emp = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));

        LocalDate today = LocalDate.now();
        Optional<Attendance> existing = attendanceRepository.findByEmployeeIdAndDate(employeeId, today);
        if (existing.isPresent() && existing.get().getClockIn() != null) {
            throw new BadRequestException("Already clocked in today");
        }

        LocalDateTime now = LocalDateTime.now();
        Attendance att = existing.orElseGet(Attendance::new);
        att.setEmployee(emp);
        att.setDate(today);
        att.setClockIn(now);

        // Determine status: PRESENT or LATE based on shift start + grace period
        String shiftStart = emp.getShiftStart() != null ? emp.getShiftStart() : "09:00";
        int gracePeriod = getGracePeriodMinutes();
        LocalTime shiftTime = LocalTime.parse(shiftStart);
        LocalTime lateThreshold = shiftTime.plusMinutes(gracePeriod);

        if (now.toLocalTime().isAfter(lateThreshold)) {
            att.setStatus(Attendance.Status.LATE);
        } else {
            att.setStatus(Attendance.Status.PRESENT);
        }

        if (lat != null) att.setClockInLat(lat);
        if (lng != null) att.setClockInLng(lng);

        attendanceRepository.save(att);
        logger.info("Clock-in recorded for employee {} at {}", emp.getEmployeeCode(), now);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Clocked in successfully at " + now.toLocalTime().toString().substring(0, 5));
        result.put("status", att.getStatus().name().toLowerCase());
        return result;
    }

    @Transactional
    public Map<String, Object> clockOut(Long employeeId, Double lat, Double lng) {
        LocalDate today = LocalDate.now();
        Attendance att = attendanceRepository.findByEmployeeIdAndDate(employeeId, today)
                .orElseThrow(() -> new BadRequestException("No clock-in record found for today. Please clock in first."));

        if (att.getClockIn() == null) {
            throw new BadRequestException("No clock-in record found for today. Please clock in first.");
        }
        if (att.getClockOut() != null) {
            throw new BadRequestException("Already clocked out today");
        }

        LocalDateTime now = LocalDateTime.now();
        att.setClockOut(now);

        if (lat != null) att.setClockOutLat(lat);
        if (lng != null) att.setClockOutLng(lng);

        // Calculate hours worked
        Duration duration = Duration.between(att.getClockIn(), now);
        double hours = duration.toMinutes() / 60.0;
        att.setHoursWorked(Math.round(hours * 100.0) / 100.0);

        attendanceRepository.save(att);
        logger.info("Clock-out recorded for employeeId {} at {}, hoursWorked={}", employeeId, now, att.getHoursWorked());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Clocked out successfully. Hours worked: " + String.format("%.1f", att.getHoursWorked()));
        result.put("hoursWorked", att.getHoursWorked());
        return result;
    }

    public Map<String, Object> getTodayRecord(Long employeeId) {
        LocalDate today = LocalDate.now();
        Optional<Attendance> attOpt = attendanceRepository.findByEmployeeIdAndDate(employeeId, today);
        if (attOpt.isEmpty()) {
            Map<String, Object> empty = new LinkedHashMap<>();
            empty.put("date", today);
            empty.put("status", "absent");
            empty.put("clockIn", null);
            empty.put("clockOut", null);
            empty.put("hoursWorked", null);
            return empty;
        }
        return toMap(attOpt.get());
    }

    public Map<String, Object> getMyHistory(Long employeeId, String month, int limit) {
        LocalDate start;
        LocalDate end;

        if (month != null && !month.isBlank()) {
            YearMonth ym = YearMonth.parse(month);
            start = ym.atDay(1);
            end = ym.atEndOfMonth();
        } else {
            end = LocalDate.now();
            start = end.minusDays(limit);
        }

        List<Attendance> records = attendanceRepository.findByEmployeeIdAndDateBetweenOrderByDateDesc(employeeId, start, end);
        List<Map<String, Object>> data = records.stream().map(this::toMap).toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("data", data);
        return result;
    }

    public List<Map<String, Object>> getLiveGrid() {
        LocalDate today = LocalDate.now();
        List<Employee> activeEmployees = employeeRepository.findByIsActiveTrue();
        List<Attendance> todayRecords = attendanceRepository.findByDate(today);

        Map<Long, Attendance> attMap = new HashMap<>();
        for (Attendance a : todayRecords) {
            attMap.put(a.getEmployee().getId(), a);
        }

        List<Map<String, Object>> grid = new ArrayList<>();
        for (Employee emp : activeEmployees) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("employeeId", emp.getId());
            row.put("employeeCode", emp.getEmployeeCode());
            row.put("fullName", emp.getFullName());
            row.put("department", emp.getDepartment());

            Attendance att = attMap.get(emp.getId());
            if (att != null) {
                row.put("status", att.getStatus().name().toLowerCase());
                row.put("clockIn", att.getClockIn());
                row.put("clockOut", att.getClockOut());
                row.put("hoursWorked", att.getHoursWorked());
            } else {
                row.put("status", "absent");
                row.put("clockIn", null);
                row.put("clockOut", null);
                row.put("hoursWorked", null);
            }
            grid.add(row);
        }
        return grid;
    }

    public Map<String, Object> getAttendanceRecords(String dateStr, String department, int page, int limit) {
        LocalDate date = dateStr != null && !dateStr.isBlank() ? LocalDate.parse(dateStr) : LocalDate.now();
        List<Attendance> records = attendanceRepository.findByDate(date);

        List<Map<String, Object>> data = records.stream()
                .filter(a -> department == null || department.isBlank() || a.getEmployee().getDepartment().equals(department))
                .map(a -> {
                    Map<String, Object> row = toMap(a);
                    row.put("employeeId", a.getEmployee().getId());
                    row.put("employeeCode", a.getEmployee().getEmployeeCode());
                    row.put("fullName", a.getEmployee().getFullName());
                    row.put("department", a.getEmployee().getDepartment());
                    row.put("isManualEdit", a.getIsManualEdit());
                    row.put("editReason", a.getEditReason());
                    return row;
                }).toList();

        // Simple in-memory pagination
        int fromIndex = Math.min((page - 1) * limit, data.size());
        int toIndex = Math.min(fromIndex + limit, data.size());
        List<Map<String, Object>> paged = data.subList(fromIndex, toIndex);

        Map<String, Object> pagination = new LinkedHashMap<>();
        pagination.put("page", page);
        pagination.put("limit", limit);
        pagination.put("totalPages", (int) Math.ceil((double) data.size() / limit));
        pagination.put("totalItems", data.size());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("data", paged);
        result.put("pagination", pagination);
        return result;
    }

    @Transactional
    public Map<String, Object> updateAttendance(Long id, String status, String clockIn, String clockOut,
                                                  String editReason, Long editorUserId) {
        Attendance att = attendanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance", id));

        if (status != null && !status.isBlank()) {
            att.setStatus(Attendance.Status.valueOf(status.toUpperCase()));
        }
        if (clockIn != null && !clockIn.isBlank()) {
            att.setClockIn(LocalDateTime.parse(clockIn));
        }
        if (clockOut != null && !clockOut.isBlank()) {
            att.setClockOut(LocalDateTime.parse(clockOut));
        }

        // Recalculate hours if both clock-in and clock-out are set
        if (att.getClockIn() != null && att.getClockOut() != null) {
            Duration duration = Duration.between(att.getClockIn(), att.getClockOut());
            att.setHoursWorked(Math.round(duration.toMinutes() / 60.0 * 100.0) / 100.0);
        }

        att.setIsManualEdit(true);
        att.setEditedBy(editorUserId);
        att.setEditReason(editReason);

        attendanceRepository.save(att);
        logger.info("Attendance {} manually edited by userId={}", id, editorUserId);

        return toMap(att);
    }

    private int getGracePeriodMinutes() {
        return settingRepository.findByKey("grace_period_minutes")
                .map(s -> Integer.parseInt(s.getValue()))
                .orElse(15);
    }

    private Map<String, Object> toMap(Attendance a) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", a.getId());
        map.put("date", a.getDate());
        map.put("status", a.getStatus().name().toLowerCase());
        map.put("clockIn", a.getClockIn());
        map.put("clockOut", a.getClockOut());
        map.put("hoursWorked", a.getHoursWorked());
        return map;
    }
}
