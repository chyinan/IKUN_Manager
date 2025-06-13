package com.ikunmanager.service;

import com.ikunmanager.mapper.EmployeeMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class EmployeeService {

    private final EmployeeMapper employeeMapper;

    @Autowired
    public EmployeeService(EmployeeMapper employeeMapper) {
        this.employeeMapper = employeeMapper;
    }

    public Map<String, Object> getEmployeeStats() {
        long total = employeeMapper.countTotalEmployees();
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        // 未来可以在这里添加更多统计数据
        return stats;
    }
} 