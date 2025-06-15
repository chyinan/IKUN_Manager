package com.ikunmanager.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ScoreDetailDTO {
    private Long id;
    private Long studentId;
    private String studentName;
    private String className;
    private Long examId;
    private String subject;
    private BigDecimal score;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
} 