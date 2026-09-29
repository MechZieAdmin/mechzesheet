package com.mechzie.server.service;

import com.mechzie.server.entity.Attendance;
import com.mechzie.server.entity.Employee;
import com.mechzie.server.entity.LeaveRequest;
import com.mechzie.server.repository.AttendanceRepository;
import com.mechzie.server.repository.EmployeeRepository;
import com.mechzie.server.repository.LeaveRequestRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;
    private final LeaveRequestRepository leaveRequestRepository;

    public AdminService(EmployeeRepository employeeRepository,
                        AttendanceRepository attendanceRepository,
                        LeaveRequestRepository leaveRequestRepository) {
        this.employeeRepository = employeeRepository;
        this.attendanceRepository = attendanceRepository;
        this.leaveRequestRepository = leaveRequestRepository;
    }

    public Map<String, Object> getDashboardStats() {
        long totalActive = employeeRepository.countByIsActiveTrue();
        LocalDate today = LocalDate.now();
        List<Attendance> todayRecords = attendanceRepository.findByDate(today);

        long present = todayRecords.stream().filter(a -> a.getStatus() == Attendance.Status.PRESENT).count();
        long late = todayRecords.stream().filter(a -> a.getStatus() == Attendance.Status.LATE).count();
        long absent = totalActive - todayRecords.size();

        long pendingLeaves = leaveRequestRepository.findByStatus(LeaveRequest.Status.PENDING).size();

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("totalEmployees", totalActive);
        data.put("presentToday", present);
        data.put("absentToday", Math.max(0, absent));
        data.put("lateToday", late);
        data.put("pendingLeaves", pendingLeaves);
        return data;
    }

    public List<Map<String, Object>> getAttendanceTrend(int days) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(days);
        List<Attendance> records = attendanceRepository.findByDateBetween(start, end);
        long totalEmployees = employeeRepository.countByIsActiveTrue();

        // Group by date
        Map<LocalDate, List<Attendance>> byDate = records.stream()
                .collect(Collectors.groupingBy(Attendance::getDate));

        List<Map<String, Object>> trend = new ArrayList<>();
        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            // Skip weekends
            if (date.getDayOfWeek().getValue() >= 6) continue;

            List<Attendance> dayRecords = byDate.getOrDefault(date, Collections.emptyList());
            long present = dayRecords.stream().filter(a -> a.getStatus() == Attendance.Status.PRESENT).count();
            long late = dayRecords.stream().filter(a -> a.getStatus() == Attendance.Status.LATE).count();
            long leave = dayRecords.stream().filter(a -> a.getStatus() == Attendance.Status.LEAVE).count();
            long absent = totalEmployees - dayRecords.size();

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("date", date);
            entry.put("present", present);
            entry.put("late", late);
            entry.put("absent", Math.max(0, absent));
            entry.put("leave", leave);
            trend.add(entry);
        }
        return trend;
    }

    public List<Map<String, Object>> getTimesheetReport(String month) {
        YearMonth ym = YearMonth.parse(month);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        List<Employee> employees = employeeRepository.findByIsActiveTrue();
        List<Attendance> allRecords = attendanceRepository.findByDateBetween(start, end);

        Map<Long, List<Attendance>> byEmpId = allRecords.stream()
                .collect(Collectors.groupingBy(a -> a.getEmployee().getId()));

        List<Map<String, Object>> report = new ArrayList<>();
        for (Employee emp : employees) {
            List<Attendance> empRecords = byEmpId.getOrDefault(emp.getId(), Collections.emptyList());

            long presentDays = empRecords.stream().filter(a -> a.getStatus() == Attendance.Status.PRESENT || a.getStatus() == Attendance.Status.LATE).count();
            long lateDays = empRecords.stream().filter(a -> a.getStatus() == Attendance.Status.LATE).count();
            double totalHours = empRecords.stream().mapToDouble(a -> a.getHoursWorked() != null ? a.getHoursWorked() : 0).sum();

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("employeeId", emp.getId());
            entry.put("employeeCode", emp.getEmployeeCode());
            entry.put("fullName", emp.getFullName());
            entry.put("department", emp.getDepartment());
            entry.put("presentDays", presentDays);
            entry.put("lateDays", lateDays);
            entry.put("totalHours", Math.round(totalHours * 100.0) / 100.0);
            report.add(entry);
        }
        return report;
    }

    public List<Map<String, Object>> getDepartmentSummary(String month) {
        YearMonth ym = YearMonth.parse(month);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        List<Employee> employees = employeeRepository.findByIsActiveTrue();
        List<Attendance> allRecords = attendanceRepository.findByDateBetween(start, end);

        Map<Long, List<Attendance>> byEmpId = allRecords.stream()
                .collect(Collectors.groupingBy(a -> a.getEmployee().getId()));

        // Group employees by department
        Map<String, List<Employee>> byDept = employees.stream()
                .collect(Collectors.groupingBy(Employee::getDepartment));

        List<Map<String, Object>> summary = new ArrayList<>();
        for (Map.Entry<String, List<Employee>> deptEntry : byDept.entrySet()) {
            String dept = deptEntry.getKey();
            List<Employee> deptEmployees = deptEntry.getValue();

            long totalPresent = 0;
            long totalLate = 0;
            double totalHours = 0;

            for (Employee emp : deptEmployees) {
                List<Attendance> empRecords = byEmpId.getOrDefault(emp.getId(), Collections.emptyList());
                totalPresent += empRecords.stream().filter(a -> a.getStatus() == Attendance.Status.PRESENT || a.getStatus() == Attendance.Status.LATE).count();
                totalLate += empRecords.stream().filter(a -> a.getStatus() == Attendance.Status.LATE).count();
                totalHours += empRecords.stream().mapToDouble(a -> a.getHoursWorked() != null ? a.getHoursWorked() : 0).sum();
            }

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("department", dept);
            entry.put("employeeCount", deptEmployees.size());
            entry.put("totalPresent", totalPresent);
            entry.put("totalLate", totalLate);
            entry.put("totalHours", Math.round(totalHours * 100.0) / 100.0);
            entry.put("avgHoursPerEmployee", deptEmployees.isEmpty() ? 0 : Math.round(totalHours / deptEmployees.size() * 100.0) / 100.0);
            summary.add(entry);
        }
        return summary;
    }
}
