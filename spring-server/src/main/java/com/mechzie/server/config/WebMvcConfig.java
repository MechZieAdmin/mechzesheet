package com.mechzie.server.config;

import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class WebMvcConfig implements ErrorController {

    // Forward all non-API, non-static 404s to React's index.html
    @RequestMapping("/error")
    public String handleError() {
        return "forward:/index.html";
    }
}
