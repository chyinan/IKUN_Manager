package com.ikunmanager.controller;

import com.ikunmanager.model.Department;
import com.ikunmanager.mapper.DepartmentMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    @Autowired
    private DepartmentMapper departmentMapper;

    @GetMapping
    public ResponseEntity<List<Department>> getAllDepartments() {
        List<Department> departments = departmentMapper.findAll();
        return new ResponseEntity<>(departments, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Department> getDepartmentById(@PathVariable Long id) {
        Department department = departmentMapper.findById(id);
        if (department != null) {
            return new ResponseEntity<>(department, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping
    public ResponseEntity<Department> addDepartment(@RequestBody Department department) {
        // Check for duplicate department name before inserting
        Department existingDepartment = departmentMapper.findByDeptName(department.getDeptName());
        if (existingDepartment != null) {
            return new ResponseEntity<>(HttpStatus.CONFLICT); // 409 Conflict
        }
        departmentMapper.insert(department);
        return new ResponseEntity<>(department, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Department> updateDepartment(@PathVariable Long id, @RequestBody Department department) {
        // Check if the department exists
        Department existingDepartmentById = departmentMapper.findById(id);
        if (existingDepartmentById == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND); // 404 Not Found
        }

        // Check for duplicate department name for *other* departments
        Department existingDepartmentByName = departmentMapper.findByDeptName(department.getDeptName());
        if (existingDepartmentByName != null && !existingDepartmentByName.getId().equals(id)) {
            return new ResponseEntity<>(HttpStatus.CONFLICT); // 409 Conflict
        }

        department.setId(id);
        int result = departmentMapper.update(department);
        if (result > 0) {
            return new ResponseEntity<>(department, HttpStatus.OK);
        } else {
            // This case should ideally not be reached if existingDepartmentById was found
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<HttpStatus> deleteDepartment(@PathVariable Long id) {
        int result = departmentMapper.delete(id);
        if (result > 0) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/batch")
    public ResponseEntity<HttpStatus> batchDeleteDepartments(@RequestBody List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST); // 400 Bad Request if no IDs are provided
        }
        int result = departmentMapper.batchDelete(ids);
        if (result > 0) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT); // 204 No Content for successful deletion
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND); // 404 Not Found if no records were deleted (e.g., IDs not found)
        }
    }

    @PostMapping("/batch")
    public ResponseEntity<HttpStatus> batchInsertDepartments(@RequestBody List<Department> departments) {
        if (departments == null || departments.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST); // 400 Bad Request if no departments are provided
        }
        int result = departmentMapper.batchInsert(departments);
        if (result > 0) {
            return new ResponseEntity<>(HttpStatus.CREATED); // 201 Created for successful insertion
        } else {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST); // Or other appropriate status if no records were inserted
        }
    }
}
