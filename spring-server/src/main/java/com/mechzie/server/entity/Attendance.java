package com.mechzie.server.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"employee_id", "date"})
})
public class Attendance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "clock_in")
    private LocalDateTime clockIn;

    @Column(name = "clock_out")
    private LocalDateTime clockOut;

    @Column(name = "clock_in_lat")
    private Double clockInLat;

    @Column(name = "clock_in_lng")
    private Double clockInLng;

    @Column(name = "clock_out_lat")
    private Double clockOutLat;

    @Column(name = "clock_out_lng")
    private Double clockOutLng;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.ABSENT;

    @Column(name = "hours_worked")
    private Double hoursWorked;

    @Column(name = "is_manual_edit", nullable = false)
    private Boolean isManualEdit = false;

    @Column(name = "edited_by")
    private Long editedBy;

    @Column(name = "edit_reason")
    private String editReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Status {
        PRESENT, ABSENT, LATE, HALF_DAY, LEAVE, HOLIDAY, WEEKLY_OFF
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public LocalDateTime getClockIn() { return clockIn; }
    public void setClockIn(LocalDateTime clockIn) { this.clockIn = clockIn; }
    public LocalDateTime getClockOut() { return clockOut; }
    public void setClockOut(LocalDateTime clockOut) { this.clockOut = clockOut; }
    public Double getClockInLat() { return clockInLat; }
    public void setClockInLat(Double clockInLat) { this.clockInLat = clockInLat; }
    public Double getClockInLng() { return clockInLng; }
    public void setClockInLng(Double clockInLng) { this.clockInLng = clockInLng; }
    public Double getClockOutLat() { return clockOutLat; }
    public void setClockOutLat(Double clockOutLat) { this.clockOutLat = clockOutLat; }
    public Double getClockOutLng() { return clockOutLng; }
    public void setClockOutLng(Double clockOutLng) { this.clockOutLng = clockOutLng; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public Double getHoursWorked() { return hoursWorked; }
    public void setHoursWorked(Double hoursWorked) { this.hoursWorked = hoursWorked; }
    public Boolean getIsManualEdit() { return isManualEdit; }
    public void setIsManualEdit(Boolean isManualEdit) { this.isManualEdit = isManualEdit; }
    public Long getEditedBy() { return editedBy; }
    public void setEditedBy(Long editedBy) { this.editedBy = editedBy; }
    public String getEditReason() { return editReason; }
    public void setEditReason(String editReason) { this.editReason = editReason; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
