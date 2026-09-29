package com.mechzie.server.repository;

import com.mechzie.server.entity.Holiday;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface HolidayRepository extends JpaRepository<Holiday, Long> {
    List<Holiday> findByDateBetween(LocalDate start, LocalDate end);

    List<Holiday> findAllByOrderByDateAsc();
}
