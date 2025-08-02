package com.ikunmanager.controller;

import com.ikunmanager.service.SystemConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/config")
public class ConfigController {

    @Autowired
    private SystemConfigService systemConfigService;

    @GetMapping("/regex")
    public ResponseEntity<Map<String, Object>> getRegexConfig() {
        Map<String, Object> regexConfig = systemConfigService.getRegexConfig();
        return ResponseEntity.ok(Map.of("code", 200, "message", "成功", "data", regexConfig));
    }

    @GetMapping("/carousel-interval")
    public ResponseEntity<Map<String, Object>> getCarouselInterval() {
        Integer interval = systemConfigService.getCarouselInterval();
        return ResponseEntity.ok(Map.of("code", 200, "message", "成功", "data", Map.of("carouselInterval", interval)));
    }

    @PutMapping("/carousel-interval")
    public ResponseEntity<Map<String, Object>> updateCarouselInterval(@RequestBody Integer interval) {
        systemConfigService.updateCarouselInterval(interval);
        return ResponseEntity.ok(Map.of("code", 200, "message", "更新成功"));
    }
}
