package com.ikunmanager.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class AssignmentResponse {
    private Long id;
    private Long teacherId;
    private String teacherName;
    private String title;
    private String content;
    private String attachmentUrl;
    private LocalDateTime dueDate;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<Long> classIds;
    private List<String> classNames;
} 