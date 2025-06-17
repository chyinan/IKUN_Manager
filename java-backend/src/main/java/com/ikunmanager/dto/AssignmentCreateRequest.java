package com.ikunmanager.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class AssignmentCreateRequest {
    private String title;
    private String content;
    private String attachmentUrl;
    private LocalDateTime dueDate;
    private String status;
    private List<Long> classIds;
} 