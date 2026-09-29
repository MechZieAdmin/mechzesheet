package com.mechzie.server.controller;

import com.mechzie.server.security.UserDetailsImpl;
import com.mechzie.server.service.AttendanceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping("/clock-in")
    public ResponseEntity<?> clockIn(@RequestBody(required = false) Map<String, Object> body) {
        UserDetailsImpl user = getCurrentUser();
        if (user.getEmployeeId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "No employee profile linked to this account"));
        }
        Double lat = body != null && body.get("latitude") != null ? ((Number) body.get("latitude")).doubleValue() : null;
        Double lng = body != null && body.get("longitude") != null ? ((Number) body.get("longitude")).doubleValue() : null;
        return ResponseEntity.ok(attendanceService.clockIn(user.getEmployeeId(), lat, lng));
    }

    @PostMapping("/clock-out")
    public ResponseEntity<?> clockOut(@RequestBody(required = false) Map<String, Object> body) {
        UserDetailsImpl user = getCurrentUser();
        if (user.getEmployeeId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "No employee profile linked to this account"));
        }
        Double lat = body != null && body.get("latitude") != null ? ((Number) body.get("latitude")).doubleValue() : null;
        Double lng = body != null && body.get("longitude") != null ? ((Number) body.get("longitude")).doubleValue() : null;
        return ResponseEntity.ok(attendanceService.clockOut(user.getEmployeeId(), lat, lng));
    }

    @GetMapping("/today")
    public ResponseEntity<?> getToday() {
        UserDetailsImpl user = getCurrentUser();
        if (user.getEmployeeId() == null) {
            return ResponseEntity.ok(Map.of("date", java.time.LocalDate.now(), "status", "absent", "clockIn", "", "clockOut", "", "hoursWorked", 0));
        }
        return ResponseEntity.ok(attendanceService.getTodayRecord(user.getEmployeeId()));
    }

    @GetMapping("/my-history")
    public ResponseEntity<?> getMyHistory(
            @RequestParam(required = false) String month,
            @RequestParam(defaultValue = "31") int limit) {
        UserDetailsImpl user = getCurrentUser();
        if (user.getEmployeeId() == null) {
            return ResponseEntity.ok(Map.of("data", java.util.List.of()));
        }
        return ResponseEntity.ok(attendanceService.getMyHistory(user.getEmployeeId(), month, limit));
    }

    @GetMapping("/live-grid")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<?> getLiveGrid() {
        return ResponseEntity.ok(attendanceService.getLiveGrid());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<?> getAttendanceRecords(
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String department,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(attendanceService.getAttendanceRecords(date, department, page, limit));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<?> updateAttendance(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        UserDetailsImpl user = getCurrentUser();
        String status = (String) body.get("status");
        String clockIn = (String) body.get("clockIn");
        String clockOut = (String) body.get("clockOut");
        String editReason = (String) body.get("editReason");
        return ResponseEntity.ok(attendanceService.updateAttendance(id, status, clockIn, clockOut, editReason, user.getId()));
    }

    private UserDetailsImpl getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (UserDetailsImpl) auth.getPrincipal();
    }
}
