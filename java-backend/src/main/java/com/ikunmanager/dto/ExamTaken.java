package com.ikunmanager.dto;

import lombok.Data;
import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
public class ExamTaken {
    @JsonProperty("exam_id")
    private Long examId;

    @JsonProperty("exam_name")
    private String examName;

    @JsonProperty("exam_date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate examDate;

    @JsonProperty("exam_type")
    private String examType;

    private String subjects; // Optional, can be null
} 