package com.mechzie.server.controller;

import com.mechzie.server.dto.Dtos.*;
import com.mechzie.server.entity.Employee;
import com.mechzie.server.entity.User;
import com.mechzie.server.repository.EmployeeRepository;
import com.mechzie.server.repository.UserRepository;
import com.mechzie.server.security.JwtUtils;
import com.mechzie.server.security.UserDetailsImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder encoder;
    private final JwtUtils jwtUtils;

    public AuthController(AuthenticationManager authenticationManager, UserRepository userRepository,
                          EmployeeRepository employeeRepository, PasswordEncoder encoder, JwtUtils jwtUtils) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.encoder = encoder;
        this.jwtUtils = jwtUtils;
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        if (loginRequest.email == null || loginRequest.password == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Email and password are required"));
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.email, loginRequest.password));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

            String jwt = jwtUtils.generateAccessToken(userDetails);
            String refreshJwt = jwtUtils.generateRefreshToken(userDetails);

            User user = userRepository.findById(userDetails.getId()).orElseThrow();
            user.setRefreshToken(refreshJwt);
            userRepository.save(user);

            UserDto userDto = buildUserDto(user);
            logger.info("User logged in: {}", loginRequest.email);

            return ResponseEntity.ok(new LoginResponse(jwt, refreshJwt, userDto));
        } catch (Exception e) {
            logger.warn("Failed login attempt for: {}", loginRequest.email);
            return ResponseEntity.status(401).body(new MessageResponse("Invalid email or password"));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody TokenRefreshRequest request) {
        String requestRefreshToken = request.refreshToken;
        if (requestRefreshToken == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Refresh token required"));
        }

        if (jwtUtils.validateJwtToken(requestRefreshToken)) {
            String email = jwtUtils.getEmailFromJwtToken(requestRefreshToken);
            Optional<User> userOpt = userRepository.findByEmailAndIsActiveTrue(email);

            if (userOpt.isPresent() && requestRefreshToken.equals(userOpt.get().getRefreshToken())) {
                User user = userOpt.get();
                UserDetailsImpl userDetails = new UserDetailsImpl(
                        user.getId(), user.getEmail(), user.getPasswordHash(),
                        user.getRole(), user.getEmployee() != null ? user.getEmployee().getId() : null, null);
                
                String newJwt = jwtUtils.generateAccessToken(userDetails);
                return ResponseEntity.ok(new TokenRefreshResponse(newJwt));
            }
        }
        return ResponseEntity.status(401).body(new MessageResponse("Invalid refresh token"));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
            User user = userRepository.findById(userDetails.getId()).orElseThrow();
            user.setRefreshToken(null);
            userRepository.save(user);
            logger.info("User logged out: {}", userDetails.getEmail());
        }
        return ResponseEntity.ok(new MessageResponse("Logged out successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserDetailsImpl)) {
            return ResponseEntity.status(401).build();
        }
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElseThrow();
        return ResponseEntity.ok(buildUserDto(user));
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {
        if (request.currentPassword == null || request.newPassword == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Current and new password required"));
        }
        if (request.newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(new MessageResponse("Password must be at least 6 characters"));
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElseThrow();

        if (!encoder.matches(request.currentPassword, user.getPasswordHash())) {
            return ResponseEntity.status(401).body(new MessageResponse("Current password is incorrect"));
        }

        user.setPasswordHash(encoder.encode(request.newPassword));
        userRepository.save(user);
        logger.info("Password changed for user: {}", userDetails.getEmail());

        return ResponseEntity.ok(new MessageResponse("Password changed successfully"));
    }

    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN') or hasRole('HR')")
    @Transactional
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest request) {
        if (userRepository.findByEmail(request.email).isPresent()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is already in use!"));
        }

        User user = new User();
        user.setEmail(request.email);
        user.setPasswordHash(encoder.encode(request.password));

        if ("HR".equalsIgnoreCase(request.role)) {
            user.setRole(User.Role.HR);
            userRepository.save(user);
            logger.info("HR user registered: {}", request.email);
            return ResponseEntity.ok(new MessageResponse("HR registered successfully!"));
        } else if ("EMPLOYEE".equalsIgnoreCase(request.role)) {
            user.setRole(User.Role.EMPLOYEE);
            
            // Create employee profile
            Employee emp = new Employee();
            emp.setEmployeeCode(request.employeeCode != null ? request.employeeCode : "EMP-" + System.currentTimeMillis());
            emp.setFullName(request.fullName != null ? request.fullName : "New Employee");
            emp.setDepartment(request.department != null ? request.department : "General");
            emp.setDesignation(request.designation != null ? request.designation : "Staff");
            emp.setEmail(request.email);
            emp.setDateOfJoining(java.time.LocalDate.now());
            
            Employee savedEmp = employeeRepository.save(emp);
            user.setEmployee(savedEmp);
            userRepository.save(user);
            logger.info("Employee user registered: {}", request.email);
            
            return ResponseEntity.ok(new MessageResponse("Employee registered successfully!"));
        }

        return ResponseEntity.badRequest().body(new MessageResponse("Error: Invalid role specified. Use HR or EMPLOYEE."));
    }

    private UserDto buildUserDto(User user) {
        UserDto dto = new UserDto();
        dto.id = user.getId();
        dto.email = user.getEmail();
        dto.role = user.getRole().name().toLowerCase();
        dto.employeeId = user.getEmployee() != null ? user.getEmployee().getId() : null;

        if (user.getEmployee() != null) {
            Employee emp = user.getEmployee();
            dto.name = emp.getFullName();
            dto.department = emp.getDepartment();
            dto.designation = emp.getDesignation();
            dto.photoUrl = emp.getPhotoUrl();
        } else {
            dto.name = user.getRole() == User.Role.ADMIN ? "Admin" : user.getRole().name();
        }
        return dto;
    }
}
