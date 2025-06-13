package com.ikunmanager.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Department {

    private Long id;

    @JsonProperty("dept_name")
    private String deptName;

    private String manager;
    private String description;

    @JsonProperty("member_count")
    private Long memberCount;

    @JsonProperty("create_time")
    private LocalDateTime createTime;

    @JsonProperty("update_time")
    private LocalDateTime updateTime;
} 