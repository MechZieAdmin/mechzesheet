package com.mechzie.server.seeder;

import com.mechzie.server.entity.*;
import com.mechzie.server.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class DataLoader implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataLoader.class);

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final SettingRepository settingRepository;
    private final HolidayRepository holidayRepository;
    private final AttendanceRepository attendanceRepository;
    private final AnnouncementRepository announcementRepository;
    private final PasswordEncoder passwordEncoder;

    public DataLoader(UserRepository userRepository, EmployeeRepository employeeRepository,
                      LeaveTypeRepository leaveTypeRepository, LeaveBalanceRepository leaveBalanceRepository,
                      SettingRepository settingRepository, HolidayRepository holidayRepository,
                      AttendanceRepository attendanceRepository, AnnouncementRepository announcementRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.leaveTypeRepository = leaveTypeRepository;
        this.leaveBalanceRepository = leaveBalanceRepository;
        this.settingRepository = settingRepository;
        this.holidayRepository = holidayRepository;
        this.attendanceRepository = attendanceRepository;
        this.announcementRepository = announcementRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            logger.info("Seeding database...");



            // 2. Create Users
            String adminPassword = passwordEncoder.encode("Admin@123");

            // Admin
            User admin = new User();
            admin.setEmail("admin@mechzie.com");
            admin.setPasswordHash(adminPassword);
            admin.setRole(User.Role.ADMIN);
            userRepository.save(admin);
            
            // HR
            User hr = new User();
            hr.setEmail("hr@mechzie.com");
            hr.setPasswordHash(adminPassword);
            hr.setRole(User.Role.HR);
            userRepository.save(hr);



            // 3. Leave Types
            LeaveType casualLeave = createLeaveType("Casual Leave");
            LeaveType sickLeave = createLeaveType("Sick Leave");
            LeaveType earnedLeave = createLeaveType("Earned Leave");

            // 4. Leave Balances for current year
            int currentYear = LocalDate.now().getYear();

            // 5. Holidays
            createHoliday(LocalDate.of(currentYear, 1, 26), "Republic Day");
            createHoliday(LocalDate.of(currentYear, 8, 15), "Independence Day");
            createHoliday(LocalDate.of(currentYear, 10, 2), "Gandhi Jayanti");
            createHoliday(LocalDate.of(currentYear, 11, 1), "Diwali");
            createHoliday(LocalDate.of(currentYear, 12, 25), "Christmas");

            // 6. Settings
            createSetting("company_name", "MechZie");
            createSetting("work_hours", "9");
            createSetting("shift_start", "09:00");
            createSetting("shift_end", "18:00");
            createSetting("grace_period_minutes", "15");
            createSetting("weekly_offs", "saturday,sunday");
            createSetting("geo_required", "false");
            


            // 8. Announcements
            createAnnouncement("Welcome to MechZie HR!", "We are excited to launch the new enterprise HR portal. Explore your dashboard to track attendance, leaves, and more.", "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800", true);
            createAnnouncement("Company Townhall Meeting", "Join us this Friday at 4 PM in the main conference room for our monthly townhall meeting. Snacks will be provided.", null, true);

            logger.info("Seed complete!");
            logger.info("Admin: admin@mechzie.com / Admin@123");
            logger.info("HR: hr@mechzie.com / Admin@123");
        }
    }

    private Employee createEmployee(String code, String name, String dept, String desig, String email) {
        Employee e = new Employee();
        e.setEmployeeCode(code);
        e.setFullName(name);
        e.setDepartment(dept);
        e.setDesignation(desig);
        e.setDateOfJoining(LocalDate.of(2024, 1, 1));
        e.setEmail(email);
        e.setShiftStart("09:00");
        e.setShiftEnd("18:00");
        return employeeRepository.save(e);
    }

    private void createUser(Employee emp, String pass) {
        User u = new User();
        u.setEmail(emp.getEmail());
        u.setPasswordHash(pass);
        u.setRole(User.Role.EMPLOYEE);
        u.setEmployee(emp);
        userRepository.save(u);
    }

    private LeaveType createLeaveType(String name) {
        LeaveType lt = new LeaveType();
        lt.setName(name);
        return leaveTypeRepository.save(lt);
    }

    private void createLeaveBalance(Employee emp, LeaveType leaveType, int year, int allotted) {
        LeaveBalance lb = new LeaveBalance();
        lb.setEmployee(emp);
        lb.setLeaveType(leaveType);
        lb.setYear(year);
        lb.setTotalAllotted(allotted);
        lb.setUsed(0);
        lb.setRemaining(allotted);
        leaveBalanceRepository.save(lb);
    }

    private void createHoliday(LocalDate date, String name) {
        Holiday h = new Holiday();
        h.setDate(date);
        h.setName(name);
        holidayRepository.save(h);
    }

    private void createSetting(String key, String value) {
        Setting s = new Setting();
        s.setKey(key);
        s.setValue(value);
        settingRepository.save(s);
    }

    private void createAnnouncement(String title, String description, String imageUrl, boolean isActive) {
        Announcement a = new Announcement();
        a.setTitle(title);
        a.setDescription(description);
        a.setImageUrl(imageUrl);
        a.setIsActive(isActive);
        announcementRepository.save(a);
    }
}
