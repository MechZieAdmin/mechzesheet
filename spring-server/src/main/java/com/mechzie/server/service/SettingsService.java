package com.mechzie.server.service;

import com.mechzie.server.entity.Holiday;
import com.mechzie.server.entity.Setting;
import com.mechzie.server.exception.BadRequestException;
import com.mechzie.server.exception.ResourceNotFoundException;
import com.mechzie.server.repository.HolidayRepository;
import com.mechzie.server.repository.SettingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
public class SettingsService {

    private static final Logger logger = LoggerFactory.getLogger(SettingsService.class);

    private final SettingRepository settingRepository;
    private final HolidayRepository holidayRepository;

    public SettingsService(SettingRepository settingRepository, HolidayRepository holidayRepository) {
        this.settingRepository = settingRepository;
        this.holidayRepository = holidayRepository;
    }

    public Map<String, String> getAllSettings() {
        Map<String, String> map = new LinkedHashMap<>();
        settingRepository.findAll().forEach(s -> map.put(s.getKey(), s.getValue()));
        return map;
    }

    @Transactional
    public void updateSettings(Map<String, String> settings, Long userId) {
        for (Map.Entry<String, String> entry : settings.entrySet()) {
            Optional<Setting> existing = settingRepository.findByKey(entry.getKey());
            if (existing.isPresent()) {
                Setting s = existing.get();
                s.setValue(entry.getValue());
                s.setUpdatedBy(userId);
                settingRepository.save(s);
            } else {
                Setting s = new Setting();
                s.setKey(entry.getKey());
                s.setValue(entry.getValue());
                s.setUpdatedBy(userId);
                settingRepository.save(s);
            }
        }
        logger.info("Settings updated by userId={}: {}", userId, settings.keySet());
    }

    public List<Map<String, Object>> getAllHolidays() {
        return holidayRepository.findAllByOrderByDateAsc().stream()
                .map(this::toHolidayMap).toList();
    }

    @Transactional
    public Map<String, Object> addHoliday(String dateStr, String name) {
        if (dateStr == null || dateStr.isBlank()) throw new BadRequestException("Date is required");
        if (name == null || name.isBlank()) throw new BadRequestException("Holiday name is required");

        LocalDate date = LocalDate.parse(dateStr);
        Holiday h = new Holiday();
        h.setDate(date);
        h.setName(name);
        Holiday saved = holidayRepository.save(h);

        logger.info("Holiday added: {} on {}", name, date);
        return toHolidayMap(saved);
    }

    @Transactional
    public void deleteHoliday(Long id) {
        if (!holidayRepository.existsById(id)) {
            throw new ResourceNotFoundException("Holiday", id);
        }
        holidayRepository.deleteById(id);
        logger.info("Holiday deleted: id={}", id);
    }

    private Map<String, Object> toHolidayMap(Holiday h) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", h.getId());
        map.put("date", h.getDate());
        map.put("name", h.getName());
        map.put("isRecurring", h.getIsRecurring());
        return map;
    }
}
