package com.ikunmanager.dto;

import java.util.List;
import java.util.Map;

public class EmployeeStatsDTO {
    private Long total;
    private Long deptCount;
    private Double averageSalary;
    private Long activeCount;
    private List<Map<String, Object>> deptDistribution;
    private List<Map<String, Object>> genderDistribution;
    private List<Map<String, Object>> salaryDistribution;

    public Long getTotal() {
        return total;
    }

    public void setTotal(Long total) {
        this.total = total;
    }

    public Long getDeptCount() {
        return deptCount;
    }

    public void setDeptCount(Long deptCount) {
        this.deptCount = deptCount;
    }

    public Double getAverageSalary() {
        return averageSalary;
    }

    public void setAverageSalary(Double averageSalary) {
        this.averageSalary = averageSalary;
    }

    public Long getActiveCount() {
        return activeCount;
    }

    public void setActiveCount(Long activeCount) {
        this.activeCount = activeCount;
    }

    public List<Map<String, Object>> getDeptDistribution() {
        return deptDistribution;
    }

    public void setDeptDistribution(List<Map<String, Object>> deptDistribution) {
        this.deptDistribution = deptDistribution;
    }

    public List<Map<String, Object>> getGenderDistribution() {
        return genderDistribution;
    }

    public void setGenderDistribution(List<Map<String, Object>> genderDistribution) {
        this.genderDistribution = genderDistribution;
    }

    public List<Map<String, Object>> getSalaryDistribution() {
        return salaryDistribution;
    }

    public void setSalaryDistribution(List<Map<String, Object>> salaryDistribution) {
        this.salaryDistribution = salaryDistribution;
    }
} 