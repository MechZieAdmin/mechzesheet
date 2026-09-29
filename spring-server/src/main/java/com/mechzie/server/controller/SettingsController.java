package com.mechzie.server.controller;

import com.mechzie.server.security.UserDetailsImpl;
import com.mechzie.server.service.SettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@PreAuthorize("hasAnyRole('ADMIN', 'HR')")
public class SettingsController {

    private final SettingsService settingsService;

    public SettingsController(SettingsService settingsService) {
        this.settingsService = settingsService;
    }

    @GetMapping
    public ResponseEntity<?> getSettings() {
        return ResponseEntity.ok(settingsService.getAllSettings());
    }

    @PutMapping
    public ResponseEntity<?> updateSettings(@RequestBody Map<String, String> settings) {
        UserDetailsImpl user = getCurrentUser();
        settingsService.updateSettings(settings, user.getId());
        return ResponseEntity.ok(Map.of("message", "Settings updated successfully"));
    }

    @GetMapping("/holidays")
    public ResponseEntity<?> getHolidays() {
        return ResponseEntity.ok(settingsService.getAllHolidays());
    }

    @PostMapping("/holidays")
    public ResponseEntity<?> addHoliday(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(settingsService.addHoliday(body.get("date"), body.get("name")));
    }

    @DeleteMapping("/holidays/{id}")
    public ResponseEntity<?> deleteHoliday(@PathVariable Long id) {
        settingsService.deleteHoliday(id);
        return ResponseEntity.ok(Map.of("message", "Holiday deleted"));
    }

    private UserDetailsImpl getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (UserDetailsImpl) auth.getPrincipal();
    }
}
