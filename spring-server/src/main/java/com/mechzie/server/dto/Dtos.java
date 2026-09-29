package com.mechzie.server.dto;

public class Dtos {
    public static class LoginRequest {
        public String email;
        public String password;
    }

    public static class LoginResponse {
        public String accessToken;
        public String refreshToken;
        public UserDto user;
        public LoginResponse(String a, String r, UserDto u) { accessToken=a; refreshToken=r; user=u; }
    }

    public static class UserDto {
        public Long id;
        public String email;
        public String role;
        public Long employeeId;
        public String name;
        public String department;
        public String designation;
        public String photoUrl;
    }

    public static class TokenRefreshRequest {
        public String refreshToken;
    }
    
    public static class TokenRefreshResponse {
        public String accessToken;
        public TokenRefreshResponse(String a) { accessToken=a; }
    }
    
    public static class ChangePasswordRequest {
        public String currentPassword;
        public String newPassword;
    }

    public static class MessageResponse {
        public String message;
        public MessageResponse(String m) { message = m; }
    }

    public static class RegisterRequest {
        public String email;
        public String password;
        public String role; // "HR" or "EMPLOYEE"
        
        // Employee details (optional if just registering HR, but required for employee)
        public String fullName;
        public String employeeCode;
        public String department;
        public String designation;
    }

    public static class AnnouncementRequest {
        public String title;
        public String description;
        public String imageUrl;
        public Boolean isActive;
    }

    public static class AnnouncementResponse {
        public Long id;
        public String title;
        public String description;
        public String imageUrl;
        public Boolean isActive;
        public String createdAt;

        public AnnouncementResponse(Long id, String title, String description, String imageUrl, Boolean isActive, String createdAt) {
            this.id = id;
            this.title = title;
            this.description = description;
            this.imageUrl = imageUrl;
            this.isActive = isActive;
            this.createdAt = createdAt;
        }
    }
}
