package com.mechzie.server.controller;

import com.mechzie.server.security.UserDetailsImpl;
import com.mechzie.server.service.LeaveService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/leaves")
public class LeaveController {

    private final LeaveService leaveService;

    public LeaveController(LeaveService leaveService) {
        this.leaveService = leaveService;
    }

    @GetMapping("/types")
    public ResponseEntity<?> getLeaveTypes() {
        return ResponseEntity.ok(leaveService.getLeaveTypes());
    }

    @GetMapping("/my-balance")
    public ResponseEntity<?> getMyBalance() {
        UserDetailsImpl user = getCurrentUser();
        if (user.getEmployeeId() == null) {
            return ResponseEntity.ok(java.util.List.of());
        }
        int year = LocalDate.now().getYear();
        return ResponseEntity.ok(leaveService.getMyBalance(user.getEmployeeId(), year));
    }

    @GetMapping("/my-requests")
    public ResponseEntity<?> getMyRequests() {
        UserDetailsImpl user = getCurrentUser();
        if (user.getEmployeeId() == null) {
            return ResponseEntity.ok(java.util.List.of());
        }
        return ResponseEntity.ok(leaveService.getMyRequests(user.getEmployeeId()));
    }

    @PostMapping("/apply")
    public ResponseEntity<?> applyLeave(@RequestBody Map<String, Object> body) {
        UserDetailsImpl user = getCurrentUser();
        if (user.getEmployeeId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "No employee profile linked to this account"));
        }

        Long leaveTypeId = body.get("leaveTypeId") instanceof Number
                ? ((Number) body.get("leaveTypeId")).longValue()
                : Long.parseLong(body.get("leaveTypeId").toString());

        String startDate = (String) body.get("startDate");
        String endDate = (String) body.get("endDate");
        String reason = (String) body.get("reason");

        return ResponseEntity.ok(leaveService.applyLeave(user.getEmployeeId(), leaveTypeId, startDate, endDate, reason));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<?> getPendingRequests(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(leaveService.getPendingRequests(status));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<?> getAllRequests() {
        return ResponseEntity.ok(leaveService.getAllRequests());
    }

    @PutMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<?> reviewLeave(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        UserDetailsImpl user = getCurrentUser();
        String status = (String) body.get("status");
        String comment = (String) body.get("comment");
        return ResponseEntity.ok(leaveService.reviewLeave(id, user.getId(), status, comment));
    }

    private UserDetailsImpl getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (UserDetailsImpl) auth.getPrincipal();
    }
}
