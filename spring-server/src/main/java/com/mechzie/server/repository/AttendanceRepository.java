package com.mechzie.server.repository;

import com.mechzie.server.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByDate(LocalDate date);

    List<Attendance> findByDateBetween(LocalDate start, LocalDate end);

    Optional<Attendance> findByEmployeeIdAndDate(Long employeeId, LocalDate date);

    List<Attendance> findByEmployeeIdAndDateBetweenOrderByDateDesc(Long employeeId, LocalDate start, LocalDate end);

    List<Attendance> findByEmployeeId(Long employeeId);
}
