package com.ikunmanager.model;

import lombok.Data;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonFormat;

@Data
public class Message {
    private Long id;
    private Long threadId;
    private Long senderUserId;
    private String content;
    private Boolean isRead;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;
    private String senderName;
    private String senderAvatar;
} 