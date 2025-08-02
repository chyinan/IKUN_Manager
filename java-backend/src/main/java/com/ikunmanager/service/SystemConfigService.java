package com.ikunmanager.service;

import com.ikunmanager.model.SystemConfig;
import com.ikunmanager.repository.SystemConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class SystemConfigService {

    @Autowired
    private SystemConfigRepository systemConfigRepository;

    public Map<String, Object> getRegexConfig() {
        Map<String, Object> configMap = new HashMap<>();
        systemConfigRepository.findByConfigKey("studentIdRegex")
                .ifPresent(config -> configMap.put("studentIdRegex", config.getConfigValue()));
        systemConfigRepository.findByConfigKey("employeeIdRegex")
                .ifPresent(config -> configMap.put("employeeIdRegex", config.getConfigValue()));
        return configMap;
    }

    public Integer getCarouselInterval() {
        return systemConfigRepository.findByConfigKey("carouselInterval")
                .map(config -> Integer.parseInt(config.getConfigValue()))
                .orElse(3000); // 默认值
    }

    public void updateCarouselInterval(Integer interval) {
        SystemConfig config = systemConfigRepository.findByConfigKey("carouselInterval")
                .orElseGet(() -> {
                    SystemConfig newConfig = new SystemConfig();
                    newConfig.setConfigKey("carouselInterval");
                    return newConfig;
                });
        config.setConfigValue(String.valueOf(interval));
        systemConfigRepository.save(config);
    }
}
