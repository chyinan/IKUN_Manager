package com.ikunmanager.controller;

import com.ikunmanager.model.Employee;
import com.ikunmanager.service.EmployeeService;
import com.ikunmanager.mapper.EmployeeMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
    public List<Employee> getEmployeeList(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String empId,
            @RequestParam(required = false) String deptName,
            @RequestParam(required = false) String status
    ) {
        return employeeMapper.findAll(name, empId, deptName, status);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getEmployeeStats() {
        Map<String, Object> stats = employeeService.getEmployeeStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Employee> getEmployeeById(@PathVariable Long id) {
        Employee employee = employeeMapper.findById(id);
        if (employee != null) {
            return ResponseEntity.ok(employee);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
} 