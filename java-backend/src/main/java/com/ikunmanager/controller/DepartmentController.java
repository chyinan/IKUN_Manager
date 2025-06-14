package com.ikunmanager.controller;

import com.ikunmanager.common.ApiResponse;
import com.ikunmanager.entity.Department;
import com.ikunmanager.mapper.DepartmentMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    @Autowired
    private DepartmentMapper departmentMapper;

    @GetMapping
    public ApiResponse<List<Department>> getAllDepartments() {
        List<Department> departments = departmentMapper.findAll();
        return ApiResponse.ok(departments);
    }

    @GetMapping("/{id}")
    public ApiResponse<Department> getDepartmentById(@PathVariable Long id) {
        Department department = departmentMapper.findById(id);
        if (department != null) {
            return ApiResponse.ok(department);
        } else {
            return ApiResponse.error(HttpStatus.NOT_FOUND.value(), "Department not found");
        }
    }

    @PostMapping
    public ApiResponse<Department> addDepartment(@RequestBody Department department) {
        Department existingDepartment = departmentMapper.findByDeptName(department.getDeptName());
        if (existingDepartment != null) {
            return ApiResponse.error(HttpStatus.CONFLICT.value(), "Department name already exists");
        }
        department.setCreateTime(LocalDateTime.now());
        department.setUpdateTime(LocalDateTime.now());
        departmentMapper.insert(department);
        return ApiResponse.ok(department);
    }

    @PutMapping("/{id}")
    public ApiResponse<Department> updateDepartment(@PathVariable Long id, @RequestBody Department department) {
        Department existingDepartmentById = departmentMapper.findById(id);
        if (existingDepartmentById == null) {
            return ApiResponse.error(HttpStatus.NOT_FOUND.value(), "Department not found");
        }

        Department existingDepartmentByName = departmentMapper.findByDeptName(department.getDeptName());
        if (existingDepartmentByName != null && !existingDepartmentByName.getId().equals(id)) {
            return ApiResponse.error(HttpStatus.CONFLICT.value(), "Department name already exists");
        }

        department.setId(id);
        department.setUpdateTime(LocalDateTime.now());
        departmentMapper.update(department);
        return ApiResponse.ok(department);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteDepartment(@PathVariable Long id) {
        Department departmentToDelete = departmentMapper.findById(id);
        if (departmentToDelete == null) {
            return ApiResponse.error(HttpStatus.NOT_FOUND.value(), "Department not found");
        }
        departmentMapper.delete(id);
        return ApiResponse.ok(null);
    }

    @PostMapping("/batch")
    public ApiResponse<Void> batchInsertDepartments(@RequestBody List<Department> departments) {
        if (departments == null || departments.isEmpty()) {
            return ApiResponse.error(HttpStatus.BAD_REQUEST.value(), "Department list cannot be empty");
        }

        for (Department department : departments) {
            Department existingDepartment = departmentMapper.findByDeptName(department.getDeptName());
            if (existingDepartment != null) {
                return ApiResponse.error(HttpStatus.CONFLICT.value(), "Duplicate department name found in batch: " + department.getDeptName());
            }
            department.setCreateTime(LocalDateTime.now());
            department.setUpdateTime(LocalDateTime.now());
        }

        int result = departmentMapper.batchInsert(departments);
        if (result > 0) {
            return ApiResponse.ok(null);
        } else {
            return ApiResponse.error(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Batch insert failed");
        }
    }
}
