package com.ikunmanager.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import javax.persistence.Transient;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class Exam {
    private Long id;

    @JsonProperty("exam_name")
    private String examName;

    @JsonProperty("exam_type")
    private String examType;

    @JsonProperty("exam_date")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime examDate;

    private Integer duration;

    // 数据库中存储的逗号分隔的科目名称字符串
    private String subjects;

    private Integer status; // 0:未开始, 1:进行中, 2:已结束

    private String remark;

    @JsonProperty("create_time")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;

    @JsonProperty("update_time")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updateTime;

    // 瞬态字段，用于前端传递和接收数据，不直接映射到exam表
    @Transient
    @JsonProperty("subjectIds")
    private List<Long> subjectIds;

    @Transient
    @JsonProperty("classIds")
    private List<Long> classIds;

    @Transient
    @JsonProperty("classNames")
    private List<String> classNames;
} 