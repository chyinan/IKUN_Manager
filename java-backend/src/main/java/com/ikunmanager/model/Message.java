package com.ikunmanager.model;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Message {
    private Long id;
    private Long threadId;
    private Long senderUserId;
    private String content;
    private Boolean isRead;
    private LocalDateTime createTime;
} 