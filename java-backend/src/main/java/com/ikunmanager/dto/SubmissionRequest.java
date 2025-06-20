package com.ikunmanager.dto;

import lombok.Data;

@Data
public class SubmissionRequest {
    private Long assignmentId;
    private String submissionContent;
    private String submissionFileUrl;
    private String submissionFileOriginalName;
} 