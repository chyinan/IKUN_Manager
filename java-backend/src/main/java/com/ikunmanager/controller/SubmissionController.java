package com.ikunmanager.controller;

import com.ikunmanager.common.ApiResponse;
import com.ikunmanager.common.CustomException;
import com.ikunmanager.dto.SubmissionGradeRequest;
import com.ikunmanager.dto.SubmissionRequest;
import com.ikunmanager.dto.SubmissionResponse;
import com.ikunmanager.entity.Submission;
import com.ikunmanager.service.SubmissionService;
import com.ikunmanager.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/api/submissions")
public class SubmissionController {

    @Autowired
    private SubmissionService submissionService;

    @Autowired
    private JwtTokenProvider tokenProvider;

    // Helper method to get user ID from token
    private Long getUserIdFromRequest(HttpServletRequest request) {
        String jwt = tokenProvider.getJwtFromRequest(request);
        if (jwt == null) {
            throw new CustomException(HttpStatus.UNAUTHORIZED, "未认证或令牌无效");
        }
        return tokenProvider.getUserIdFromJWT(jwt);
    }

    @PostMapping
    @PreAuthorize("hasRole(\'STUDENT\')")
    public ResponseEntity<ApiResponse<Submission>> submitAssignment(@RequestBody SubmissionRequest request, HttpServletRequest httpRequest) {
        Long studentId = getUserIdFromRequest(httpRequest);
        ApiResponse<Submission> response = submissionService.submitAssignment(request, studentId);
        return ResponseEntity.status(response.getCode()).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole(\'STUDENT\')")
    public ResponseEntity<ApiResponse<Submission>> updateSubmission(@PathVariable Long id, @RequestBody SubmissionRequest request, HttpServletRequest httpRequest) {
        Long studentId = getUserIdFromRequest(httpRequest);
        ApiResponse<Submission> response = submissionService.updateSubmission(id, request, studentId);
        return ResponseEntity.status(response.getCode()).body(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole(\'STUDENT\')")
    public ResponseEntity<ApiResponse<Void>> deleteSubmission(@PathVariable Long id, HttpServletRequest httpRequest) {
        Long studentId = getUserIdFromRequest(httpRequest);
        ApiResponse<Void> response = submissionService.deleteSubmission(id, studentId);
        return ResponseEntity.status(response.getCode()).body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole(\'STUDENT\', \'TEACHER\', \'ADMIN\')")
    public ResponseEntity<ApiResponse<SubmissionResponse>> getSubmissionById(@PathVariable Long id) {
        ApiResponse<SubmissionResponse> response = submissionService.getSubmissionById(id);
        return ResponseEntity.status(response.getCode()).body(response);
    }

    @GetMapping("/assignment/{assignmentId}")
    @PreAuthorize("hasAnyRole(\'TEACHER\', \'ADMIN\')")
    public ResponseEntity<ApiResponse<List<SubmissionResponse>>> getSubmissionsByAssignment(@PathVariable Long assignmentId) {
        ApiResponse<List<SubmissionResponse>> response = submissionService.getSubmissionsByAssignmentId(assignmentId);
        return ResponseEntity.status(response.getCode()).body(response);
    }

    @GetMapping("/my-submission/{assignmentId}")
    @PreAuthorize("hasRole(\'STUDENT\')")
    public ResponseEntity<ApiResponse<SubmissionResponse>> getMySubmissionForAssignment(@PathVariable Long assignmentId, HttpServletRequest httpRequest) {
        Long studentId = getUserIdFromRequest(httpRequest);
        ApiResponse<SubmissionResponse> response = submissionService.getSubmissionByAssignmentIdAndStudentId(assignmentId, studentId);
        return ResponseEntity.status(response.getCode()).body(response);
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole(\'TEACHER\', \'ADMIN\')")
    public ResponseEntity<ApiResponse<List<SubmissionResponse>>> getSubmissionsByStudent(@PathVariable Long studentId) {
        ApiResponse<List<SubmissionResponse>> response = submissionService.getSubmissionsByStudentId(studentId);
        return ResponseEntity.status(response.getCode()).body(response);
    }

    @PostMapping("/grade")
    @PreAuthorize("hasRole(\'TEACHER\') or hasRole(\'ADMIN\')")
    public ResponseEntity<ApiResponse<Submission>> gradeSubmission(@RequestBody SubmissionGradeRequest request, HttpServletRequest httpRequest) {
        Long teacherId = getUserIdFromRequest(httpRequest);
        ApiResponse<Submission> response = submissionService.gradeSubmission(request, teacherId);
        return ResponseEntity.status(response.getCode()).body(response);
    }
} 