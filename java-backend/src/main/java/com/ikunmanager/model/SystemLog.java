package com.ikunmanager.model;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SystemLog {
    private Long id;
    private String type;
    private String operation;
    private String content;
    private String operator;
    private LocalDateTime createTime;
} 