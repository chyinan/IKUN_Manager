package com.ikunmanager.controller;

import com.ikunmanager.entity.Employee;
import com.ikunmanager.service.EmployeeService;
import com.ikunmanager.mapper.EmployeeMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.ikunmanager.dto.EmployeeStatsDTO;
import com.ikunmanager.common.ApiResponse;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/employee")
public class EmployeeController {

    private final EmployeeService employeeService;
    private final EmployeeMapper employeeMapper;

    @Autowired
    public EmployeeController(EmployeeService employeeService, EmployeeMapper employeeMapper) {
        this.employeeService = employeeService;
        this.employeeMapper = employeeMapper;
    }

    @GetMapping("/list")
    public ApiResponse<List<Employee>> getEmployeeList(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String empId,
            @RequestParam(required = false) String deptName,
            @RequestParam(required = false) String status
    ) {
        return ApiResponse.ok(employeeMapper.findAll(name, empId, deptName, status));
    }

    @GetMapping("/stats")
    public ApiResponse<EmployeeStatsDTO> getEmployeeStats() {
        try {
            EmployeeStatsDTO stats = employeeService.getEmployeeStatistics();
            return ApiResponse.ok(stats);
        } catch (Exception e) {
            return ApiResponse.error(HttpStatus.INTERNAL_SERVER_ERROR.value(), "获取员工统计数据失败: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ApiResponse<Employee> getEmployeeById(@PathVariable Long id) {
        Employee employee = employeeMapper.findById(id);
        if (employee != null) {
            return ApiResponse.ok(employee);
        } else {
            return ApiResponse.error(HttpStatus.NOT_FOUND.value(), "Employee not found");
        }
    }
} 