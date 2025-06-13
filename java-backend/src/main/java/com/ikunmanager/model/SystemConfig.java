package com.ikunmanager.model;

import lombok.Data;

import java.util.Date;

@Data
public class SystemConfig {
    private String configKey;
    private String configValue;
    private String description;
    private Date updateTime;
}
