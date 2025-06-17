package com.ikunmanager.service;

import com.ikunmanager.common.ApiResponse;
import com.ikunmanager.dto.SubmissionGradeRequest;
import com.ikunmanager.dto.SubmissionRequest;
import com.ikunmanager.dto.SubmissionResponse;
import com.ikunmanager.entity.Submission;
import java.util.List;

public interface SubmissionService {
    ApiResponse<Submission> submitAssignment(SubmissionRequest request, Long studentId);
    ApiResponse<Submission> updateSubmission(Long id, SubmissionRequest request, Long studentId);
    ApiResponse<Void> deleteSubmission(Long id, Long studentId);
    ApiResponse<SubmissionResponse> getSubmissionById(Long id);
    ApiResponse<List<SubmissionResponse>> getSubmissionsByAssignmentId(Long assignmentId);
    ApiResponse<SubmissionResponse> getSubmissionByAssignmentIdAndStudentId(Long assignmentId, Long studentId);
    ApiResponse<List<SubmissionResponse>> getSubmissionsByStudentId(Long studentId);
    ApiResponse<Submission> gradeSubmission(SubmissionGradeRequest request, Long teacherId);
} 