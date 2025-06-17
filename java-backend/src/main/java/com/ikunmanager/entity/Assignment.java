package com.ikunmanager.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Assignment {
    private Long id;
    private Long teacherId;
    private String title;
    private String content;
    private String attachmentUrl;
    private LocalDateTime dueDate;
    private String status; // draft, published, archived
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 