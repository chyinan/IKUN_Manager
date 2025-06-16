package com.ikunmanager.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import javax.persistence.*;
import java.util.Date;

@Data
@Entity
@Table(name = "class")
public class IkunClass {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonProperty("class_name")
    @Column(name = "class_name", unique = true, nullable = false)
    private String className;

    @JsonProperty("teacher")
    @Column(name = "teacher")
    private String teacher;

    @JsonProperty("description")
    @Column(name = "description")
    private String description;

    @JsonProperty("create_time")
    @Column(name = "create_time", updatable = false)
    @Temporal(TemporalType.TIMESTAMP)
    @JsonFormat(pattern="yyyy-MM-dd HH:mm:ss")
    private Date createTime;

    @JsonProperty("update_time")
    @Column(name = "update_time")
    @Temporal(TemporalType.TIMESTAMP)
    @JsonFormat(pattern="yyyy-MM-dd HH:mm:ss")
    private Date updateTime;

    @JsonProperty("student_count")
    @Transient // Not mapped to DB column directly, only for query result
    private Long studentCount;
} 