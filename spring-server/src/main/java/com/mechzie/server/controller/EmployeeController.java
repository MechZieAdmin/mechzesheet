package com.mechzie.server.controller;

import com.mechzie.server.security.UserDetailsImpl;
import com.mechzie.server.service.EmployeeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<?> listEmployees(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String department,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(employeeService.listEmployees(search, department, page, limit));
    }

    @GetMapping("/departments")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<?> getDepartments() {
        return ResponseEntity.ok(employeeService.getDistinctDepartments());
    }

    @GetMapping("/me/profile")
    public ResponseEntity<?> getMyProfile() {
        UserDetailsImpl userDetails = getCurrentUser();
        if (userDetails.getEmployeeId() == null) {
            return ResponseEntity.ok(Map.of(
                    "fullName", userDetails.getRole().name(),
                    "email", userDetails.getEmail(),
                    "role", userDetails.getRole().name().toLowerCase()
            ));
        }
        return ResponseEntity.ok(employeeService.getMyProfile(userDetails.getEmployeeId()));
    }

    @PutMapping("/me/profile")
    public ResponseEntity<?> updateMyProfile(@RequestBody Map<String, Object> dto) {
        UserDetailsImpl userDetails = getCurrentUser();
        if (userDetails.getEmployeeId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "No employee profile linked"));
        }
        employeeService.updateMyProfile(userDetails.getEmployeeId(), dto);
        return ResponseEntity.ok(Map.of("message", "Profile updated successfully"));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<?> createEmployee(@RequestBody Map<String, Object> dto) {
        UserDetailsImpl userDetails = getCurrentUser();
        Map<String, Object> result = employeeService.createEmployee(dto, userDetails.getId());
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<?> updateEmployee(@PathVariable Long id, @RequestBody Map<String, Object> dto) {
        return ResponseEntity.ok(employeeService.updateEmployee(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<?> deactivateEmployee(@PathVariable Long id) {
        employeeService.deactivateEmployee(id);
        return ResponseEntity.ok(Map.of("message", "Employee deactivated successfully"));
    }

    private UserDetailsImpl getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (UserDetailsImpl) auth.getPrincipal();
    }
}
