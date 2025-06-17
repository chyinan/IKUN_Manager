package com.ikunmanager.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class SubmissionGradeRequest {
    private Long submissionId;
    private BigDecimal grade;
    private String teacherComment;
} 