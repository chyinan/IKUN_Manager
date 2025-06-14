package com.ikunmanager.service;

import com.ikunmanager.dto.EmployeeStatsDTO;
import com.ikunmanager.mapper.DepartmentMapper;
import com.ikunmanager.mapper.EmployeeMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class EmployeeService {

    @Autowired
    private EmployeeMapper employeeMapper;

    @Autowired
    private DepartmentMapper departmentMapper;

    public EmployeeStatsDTO getEmployeeStatistics() {
        EmployeeStatsDTO stats = new EmployeeStatsDTO();

        // 员工总数
        Long totalEmployees = employeeMapper.getTotalEmployees();
        stats.setTotal(totalEmployees);

        // 部门数量
        Long totalDepartments = departmentMapper.getTotalDepartments();
        stats.setDeptCount(totalDepartments);

        // 平均薪资
        Double totalSalary = employeeMapper.getTotalSalary();
        if (totalEmployees != null && totalEmployees > 0) {
            stats.setAverageSalary(totalSalary / totalEmployees);
        } else {
            stats.setAverageSalary(0.0);
        }

        // 在职员工数
        Long activeEmployees = employeeMapper.getActiveEmployees();
        stats.setActiveCount(activeEmployees);

        // 部门分布
        stats.setDeptDistribution(employeeMapper.getDepartmentDistribution());

        // 性别分布
        stats.setGenderDistribution(employeeMapper.getGenderDistribution());

        // 部门平均薪资
        stats.setSalaryDistribution(employeeMapper.getDepartmentAverageSalary());

        return stats;
    }
} 