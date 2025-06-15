package com.ikunmanager.dto;

import java.util.List;
import java.util.Map;

public class ExamStatsDTO {
    private Long total;
    private List<Map<String, Object>> typeDistribution;

    public Long getTotal() {
        return total;
    }

    public void setTotal(Long total) {
        this.total = total;
    }

    public List<Map<String, Object>> getTypeDistribution() {
        return typeDistribution;
    }

    public void setTypeDistribution(List<Map<String, Object>> typeDistribution) {
        this.typeDistribution = typeDistribution;
    }
} 