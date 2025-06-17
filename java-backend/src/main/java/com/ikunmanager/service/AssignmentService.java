package com.ikunmanager.service;

import com.ikunmanager.common.ApiResponse;
import com.ikunmanager.dto.AssignmentCreateRequest;
import com.ikunmanager.dto.AssignmentResponse;
import com.ikunmanager.entity.Assignment;
import java.util.List;

public interface AssignmentService {
    ApiResponse<Assignment> createAssignment(AssignmentCreateRequest request, Long teacherId);
    ApiResponse<Assignment> updateAssignment(Long id, AssignmentCreateRequest request, Long teacherId);
    ApiResponse<Void> deleteAssignment(Long id, Long teacherId);
    ApiResponse<AssignmentResponse> getAssignmentById(Long id);
    ApiResponse<List<AssignmentResponse>> getAllAssignments();
    ApiResponse<List<AssignmentResponse>> getAssignmentsByTeacherId(Long teacherId);
    ApiResponse<List<AssignmentResponse>> getAssignmentsByStudentId(Long studentId);
} 