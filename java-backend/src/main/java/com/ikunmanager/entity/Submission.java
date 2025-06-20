package com.ikunmanager.entity;

import lombok.Data;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Data
public class Submission {
    private Long id;
    private Long assignmentId;
    private Long studentId;
    private String submissionContent;
    private String submissionFileUrl;
    private String submissionFileOriginalName;
    private LocalDateTime submittedAt;
    private BigDecimal grade;
    private String teacherComment;
    private String status; // submitted, graded, late
    private LocalDateTime updatedAt;
} 