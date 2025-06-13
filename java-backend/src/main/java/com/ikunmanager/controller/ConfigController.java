package com.ikunmanager.controller;

import com.ikunmanager.mapper.ConfigMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
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

        regexConfigs.put("employeeIdRegex", employeeIdRegex);
        regexConfigs.put("studentIdRegex", studentIdRegex);

        return ApiResponse.ok(regexConfigs);
    }
}
