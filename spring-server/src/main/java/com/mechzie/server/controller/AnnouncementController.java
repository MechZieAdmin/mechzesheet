package com.mechzie.server.controller;

import com.mechzie.server.dto.Dtos.AnnouncementRequest;
import com.mechzie.server.dto.Dtos.AnnouncementResponse;
import com.mechzie.server.dto.Dtos.MessageResponse;
import com.mechzie.server.entity.Announcement;
import com.mechzie.server.repository.AnnouncementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class AnnouncementController {

    @Autowired
    private AnnouncementRepository announcementRepository;

    private AnnouncementResponse mapToResponse(Announcement a) {
        return new AnnouncementResponse(
                a.getId(),
                a.getTitle(),
                a.getDescription(),
                a.getImageUrl(),
                a.getIsActive(),
                a.getCreatedAt().toString()
        );
    }

    // Public endpoint for employees/HR to get active announcements
    @GetMapping("/announcements/active")
    public ResponseEntity<List<AnnouncementResponse>> getActiveAnnouncements() {
        List<AnnouncementResponse> announcements = announcementRepository.findByIsActiveTrueOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(announcements);
    }

    // Admin endpoint to list all announcements (active and inactive)
    @GetMapping("/admin/announcements")
    @PreAuthorize("hasRole('ADMIN') or hasRole('HR')")
    public ResponseEntity<List<AnnouncementResponse>> getAllAnnouncements() {
        List<AnnouncementResponse> announcements = announcementRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(announcements);
    }

    // Admin endpoint to create announcement
    @PostMapping("/admin/announcements")
    @PreAuthorize("hasRole('ADMIN') or hasRole('HR')")
    public ResponseEntity<AnnouncementResponse> createAnnouncement(@RequestBody AnnouncementRequest request) {
        Announcement a = new Announcement();
        a.setTitle(request.title);
        a.setDescription(request.description);
        a.setImageUrl(request.imageUrl);
        a.setIsActive(request.isActive != null ? request.isActive : true);

        Announcement saved = announcementRepository.save(a);
        return ResponseEntity.ok(mapToResponse(saved));
    }

    // Admin endpoint to update announcement
    @PutMapping("/admin/announcements/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('HR')")
    public ResponseEntity<?> updateAnnouncement(@PathVariable Long id, @RequestBody AnnouncementRequest request) {
        return announcementRepository.findById(id).map(a -> {
            if (request.title != null) a.setTitle(request.title);
            if (request.description != null) a.setDescription(request.description);
            if (request.imageUrl != null) a.setImageUrl(request.imageUrl);
            if (request.isActive != null) a.setIsActive(request.isActive);

            Announcement saved = announcementRepository.save(a);
            return ResponseEntity.ok(mapToResponse(saved));
        }).orElse(ResponseEntity.notFound().build());
    }

    // Admin endpoint to delete announcement
    @DeleteMapping("/admin/announcements/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('HR')")
    public ResponseEntity<?> deleteAnnouncement(@PathVariable Long id) {
        if (!announcementRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        announcementRepository.deleteById(id);
        return ResponseEntity.ok(new MessageResponse("Announcement deleted successfully"));
    }
}
