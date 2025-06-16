package com.ikunmanager.controller;

import com.ikunmanager.mapper.ConfigMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.ikunmanager.common.ApiResponse;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/config")
public class ConfigController {

    @Autowired
    private ConfigMapper configMapper;

    @GetMapping("/regex")
    public ApiResponse<Map<String, String>> getRegexConfigs() {
        Map<String, String> regexConfigs = new HashMap<>();
        String employeeIdRegex = configMapper.findConfigValueByKey("employeeIdRegex");
        String studentIdRegex = configMapper.findConfigValueByKey("studentIdRegex");
        String logRetentionDays = configMapper.findConfigValueByKey("logRetentionDays");

        regexConfigs.put("employeeIdRegex", employeeIdRegex);
        regexConfigs.put("studentIdRegex", studentIdRegex);
        regexConfigs.put("logRetentionDays", logRetentionDays);

        return ApiResponse.ok(regexConfigs);
    }

    @PutMapping("/regex")
    public ApiResponse<Void> updateRegexConfigs(@RequestBody Map<String, Object> regexConfigs) {
        for (Map.Entry<String, Object> entry : regexConfigs.entrySet()) {
            String valueStr = String.valueOf(entry.getValue());
            configMapper.updateConfigValueByKey(entry.getKey(), valueStr);
        }
        return ApiResponse.ok(null);
    }

    @GetMapping("/carousel-interval")
    public ApiResponse<Integer> getCarouselIntervalConfig() {
        String intervalStr = configMapper.findConfigValueByKey("carouselInterval");
        try {
            Integer interval = Integer.parseInt(intervalStr);
            return ApiResponse.ok(interval);
        } catch (NumberFormatException e) {
            return ApiResponse.error(500, "Carousel interval config is invalid.");
        }
    }

    @PutMapping("/carousel-interval")
    public ApiResponse<Void> updateCarouselIntervalConfig(@RequestBody Integer interval) {
        try {
            configMapper.updateConfigValueByKey("carouselInterval", String.valueOf(interval));
            return ApiResponse.ok(null);
        } catch (Exception e) {
            return ApiResponse.error(500, "更新轮播图切换时间失败: " + e.getMessage());
        }
    }
}
