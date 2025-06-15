package com.ikunmanager.model;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MessageThread {
    private Long id;
    private Long studentUserId;
    private String title;
    private String status;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
} 