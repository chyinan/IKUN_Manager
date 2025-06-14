package com.ikunmanager.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class Subject {
    private Long id;

    @JsonProperty("subject_name")
    private String subjectName;

    @JsonProperty("subject_code")
    private String subjectCode;

    @JsonProperty("create_time")
    private LocalDateTime createTime;

    @JsonProperty("update_time")
    private LocalDateTime updateTime;
} 