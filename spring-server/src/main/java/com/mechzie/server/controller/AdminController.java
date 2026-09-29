package com.mechzie.server.controller;

import com.mechzie.server.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/attendance-trend")
    public ResponseEntity<?> getAttendanceTrend(@RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(adminService.getAttendanceTrend(days));
    }

    @GetMapping("/timesheet")
    public ResponseEntity<?> getTimesheetReport(@RequestParam String month) {
        return ResponseEntity.ok(adminService.getTimesheetReport(month));
    }

    @GetMapping("/department-summary")
    public ResponseEntity<?> getDepartmentSummary(@RequestParam String month) {
        return ResponseEntity.ok(adminService.getDepartmentSummary(month));
    }
}
