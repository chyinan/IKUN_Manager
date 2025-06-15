package com.ikunmanager.model;

import lombok.Data;
import java.time.LocalDateTime;
import com.ikunmanager.dto.StudentInfo;

@Data
public class User {
    private Long id;
    private String username;
    private String password;
    private String email;
    private String avatar;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    private String role;
    private String displayName;
    private String phone;
    private StudentInfo studentInfo;
}
