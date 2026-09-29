package com.mechzie.server.repository;
import com.mechzie.server.entity.Setting;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface SettingRepository extends JpaRepository<Setting, Long> {
    Optional<Setting> findByKey(String key);
}
