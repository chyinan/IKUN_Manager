package com.ikunmanager.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import javax.persistence.*;
import java.util.Date;

@Data
@Entity
@Table(name = "employee")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonProperty("emp_id")
    @Column(name = "emp_id", unique = true, nullable = false)
    private String empId;

    @Column(nullable = false)
    private String name;

    private String gender;

    private Integer age;

    private String position;

    @JsonProperty("dept_id")
    @Column(name = "dept_id")
    private Long deptId;
    
    // This field is for joining and displaying, not a direct column in employee table
    @Transient
    @JsonProperty("dept_name")
    private String deptName;

    private Double salary;

    private String status;

    private String phone;

    private String email;

    @JsonProperty("join_date")
    @Column(name = "join_date")
    @Temporal(TemporalType.DATE)
    private Date joinDate;

    @JsonProperty("create_time")
    @Column(name = "create_time", updatable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createTime;

    @JsonProperty("update_time")
    @Column(name = "update_time")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updateTime;
} 