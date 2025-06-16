package com.ikunmanager.dto;

import lombok.Data;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
public class StudentInfo {
    @JsonProperty("student_id_str")
    private String studentIdStr;
    private String phone;
    @JsonProperty("student_pk")
    private Long studentPk;
} 