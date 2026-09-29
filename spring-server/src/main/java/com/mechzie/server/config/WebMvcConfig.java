package com.mechzie.server.config;

import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.core.io.ClassPathResource;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.RequestDispatcher;
import java.util.Map;
import java.util.HashMap;

@Controller
public class WebMvcConfig implements ErrorController {

    // Forward all non-API, non-static 404s to React's index.html
    @RequestMapping("/error")
    public ResponseEntity<?> handleError(HttpServletRequest request) {
        String originalUri = (String) request.getAttribute(RequestDispatcher.FORWARD_REQUEST_URI);
        
        // If it was an API request, don't return HTML
        if (originalUri != null && originalUri.startsWith("/api/")) {
            Integer statusCode = (Integer) request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
            Map<String, Object> error = new HashMap<>();
            error.put("status", statusCode != null ? statusCode : 500);
            error.put("error", "API Error");
            error.put("path", originalUri);
            return ResponseEntity.status(statusCode != null ? statusCode : 500).body(error);
        }

        Resource resource = new ClassPathResource("static/index.html");
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(resource);
    }
}
