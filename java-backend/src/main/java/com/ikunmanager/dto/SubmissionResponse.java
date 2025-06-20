package com.ikunmanager.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Data
public class SubmissionResponse {
    private Long id;
    private Long assignmentId;
    private String assignmentTitle;
    private Long studentId;
    private String studentName;
    private String studentNumber;
    private String submissionContent;
    private String submissionFileUrl;
    private String submissionFileOriginalName;
    private LocalDateTime submittedAt;
    private BigDecimal grade;
    private String teacherComment;
    private String status;
    private LocalDateTime updatedAt;
} 