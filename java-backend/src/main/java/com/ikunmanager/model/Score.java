package com.ikunmanager.model;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class Score {
    private Long id;
    private Long studentId;
    private Long examId;
    private String subject;
    private BigDecimal score;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
} 