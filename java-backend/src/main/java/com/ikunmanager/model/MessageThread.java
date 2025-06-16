package com.ikunmanager.model;

import lombok.Data;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
public class MessageThread {
    private Long id;
    private Long studentUserId;
    @JsonProperty("student_name")
    private String studentName;
    private String title;
    private String status;
    @JsonProperty("last_reply_at")
    private LocalDateTime lastReplyAt;
    @JsonProperty("created_at")
    private LocalDateTime createdAt;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
} 