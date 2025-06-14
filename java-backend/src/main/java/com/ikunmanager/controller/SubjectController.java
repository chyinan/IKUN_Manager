package com.ikunmanager.controller;

import com.ikunmanager.common.ApiResponse;
import com.ikunmanager.model.Subject;
import com.ikunmanager.service.SubjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subject")
public class SubjectController {

    @Autowired
    private SubjectService subjectService;

    @GetMapping("/list")
    public ApiResponse<List<Subject>> getAllSubjects() {
        return ApiResponse.ok(subjectService.getAllSubjects());
    }

    @GetMapping("/{id}")
    public ApiResponse<Subject> getSubjectById(@PathVariable Long id) {
        Subject subject = subjectService.getSubjectById(id);
        if (subject != null) {
            return ApiResponse.ok(subject);
        } else {
            return ApiResponse.error(404, "Subject not found.");
        }
    }

    @PostMapping("/add")
    public ApiResponse<Subject> addSubject(@RequestBody Subject subject) {
        Subject newSubject = subjectService.addSubject(subject);
        return ApiResponse.ok(newSubject);
    }

    @PutMapping("/update/{id}")
    public ApiResponse<Subject> updateSubject(@PathVariable Long id, @RequestBody Subject subject) {
        subject.setId(id);
        Subject updatedSubject = subjectService.updateSubject(subject);
        return ApiResponse.ok(updatedSubject);
    }

    @DeleteMapping("/delete/{id}")
    public ApiResponse<Void> deleteSubject(@PathVariable Long id) {
        subjectService.deleteSubject(id);
        return ApiResponse.ok(null);
    }
} 