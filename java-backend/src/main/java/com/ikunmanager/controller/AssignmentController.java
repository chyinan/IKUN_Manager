package com.ikunmanager.controller;

import com.ikunmanager.common.ApiResponse;
import com.ikunmanager.common.CustomException;
import com.ikunmanager.dto.AssignmentCreateRequest;
import com.ikunmanager.dto.AssignmentResponse;
import com.ikunmanager.entity.Assignment;
import com.ikunmanager.service.AssignmentService;
import com.ikunmanager.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {

    @Autowired
    private AssignmentService assignmentService;

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
    @PreAuthorize("hasRole(\'TEACHER\') or hasRole(\'ADMIN\')")
    public ResponseEntity<ApiResponse<Assignment>> createAssignment(@RequestBody AssignmentCreateRequest request, HttpServletRequest httpRequest) {
        Long teacherId = getUserIdFromRequest(httpRequest);
        ApiResponse<Assignment> response = assignmentService.createAssignment(request, teacherId);
        return ResponseEntity.status(response.getCode()).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole(\'TEACHER\') or hasRole(\'ADMIN\')")
    public ResponseEntity<ApiResponse<Assignment>> updateAssignment(@PathVariable Long id, @RequestBody AssignmentCreateRequest request, HttpServletRequest httpRequest) {
        Long teacherId = getUserIdFromRequest(httpRequest);
        ApiResponse<Assignment> response = assignmentService.updateAssignment(id, request, teacherId);
        return ResponseEntity.status(response.getCode()).body(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole(\'TEACHER\') or hasRole(\'ADMIN\')")
    public ResponseEntity<ApiResponse<Void>> deleteAssignment(@PathVariable Long id, HttpServletRequest httpRequest) {
        Long teacherId = getUserIdFromRequest(httpRequest);
        ApiResponse<Void> response = assignmentService.deleteAssignment(id, teacherId);
        return ResponseEntity.status(response.getCode()).body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole(\'TEACHER\', \'ADMIN\', \'STUDENT\')")
    public ResponseEntity<ApiResponse<AssignmentResponse>> getAssignmentById(@PathVariable Long id) {
        ApiResponse<AssignmentResponse> response = assignmentService.getAssignmentById(id);
        return ResponseEntity.status(response.getCode()).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole(\'TEACHER\', \'ADMIN\')")
    public ResponseEntity<ApiResponse<List<AssignmentResponse>>> getAllAssignments() {
        ApiResponse<List<AssignmentResponse>> response = assignmentService.getAllAssignments();
        return ResponseEntity.status(response.getCode()).body(response);
    }

    @GetMapping("/teacher/{teacherId}")
    @PreAuthorize("hasRole(\'TEACHER\') or hasRole(\'ADMIN\')")
    public ResponseEntity<ApiResponse<List<AssignmentResponse>>> getAssignmentsByTeacher(@PathVariable Long teacherId) {
        // A teacher can only see their own assignments unless they are an admin
        // For now, let's allow fetching by specific teacherId, assuming authentication layer handles this.
        ApiResponse<List<AssignmentResponse>> response = assignmentService.getAssignmentsByTeacherId(teacherId);
        return ResponseEntity.status(response.getCode()).body(response);
    }

    @GetMapping("/student")
    @PreAuthorize("hasRole(\'STUDENT\')")
    public ResponseEntity<ApiResponse<List<AssignmentResponse>>> getAssignmentsForStudent(HttpServletRequest httpRequest) {
        Long studentId = getUserIdFromRequest(httpRequest);
        ApiResponse<List<AssignmentResponse>> response = assignmentService.getAssignmentsByStudentId(studentId);
        return ResponseEntity.status(response.getCode()).body(response);
    }
} 