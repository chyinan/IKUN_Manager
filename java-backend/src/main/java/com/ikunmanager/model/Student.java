package com.ikunmanager.model;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class Student {
    private Long id;
    private String studentId;
    private String name;
    private String gender;
    private Long classId;
    private String phone;
    private String email;
    private Long userId;
    private LocalDate joinDate;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
