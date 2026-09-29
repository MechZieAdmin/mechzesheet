package com.mechzie.server.repository;

import com.mechzie.server.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    boolean existsByEmail(String email);

    boolean existsByEmployeeCode(String employeeCode);

    Optional<Employee> findByEmail(String email);

    List<Employee> findByIsActiveTrue();

    List<Employee> findByDepartment(String department);

    long countByIsActiveTrue();

    @Query("SELECT DISTINCT e.department FROM Employee e WHERE e.isActive = true ORDER BY e.department")
    List<String> findDistinctDepartments();

    @Query("SELECT e FROM Employee e WHERE e.isActive = true AND " +
           "(LOWER(e.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.employeeCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Employee> searchEmployees(@Param("search") String search, Pageable pageable);

    @Query("SELECT e FROM Employee e WHERE e.isActive = true AND e.department = :department AND " +
           "(LOWER(e.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.employeeCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Employee> searchEmployeesByDepartment(@Param("search") String search, @Param("department") String department, Pageable pageable);

    Page<Employee> findByIsActiveTrue(Pageable pageable);

    Page<Employee> findByIsActiveTrueAndDepartment(String department, Pageable pageable);
}
