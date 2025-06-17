package com.ikunmanager.service.impl;

import com.ikunmanager.common.ApiResponse;
import com.ikunmanager.common.CustomException;
import com.ikunmanager.dto.AssignmentCreateRequest;
import com.ikunmanager.dto.AssignmentResponse;
import com.ikunmanager.entity.Assignment;
import com.ikunmanager.model.User;
import com.ikunmanager.model.IkunClass;
import com.ikunmanager.model.Student;
import com.ikunmanager.mapper.AssignmentMapper;
import com.ikunmanager.mapper.ClassMapper;
import com.ikunmanager.mapper.UserMapper;
import com.ikunmanager.mapper.StudentMapper;
import com.ikunmanager.service.AssignmentService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AssignmentServiceImpl implements AssignmentService {

    @Autowired
    private AssignmentMapper assignmentMapper;

    @Autowired
    private ClassMapper classMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private StudentMapper studentMapper;

    @Override
    @Transactional
    public ApiResponse<Assignment> createAssignment(AssignmentCreateRequest request, Long teacherId) {
        Assignment assignment = new Assignment();
        BeanUtils.copyProperties(request, assignment);
        assignment.setTeacherId(teacherId);
        assignment.setStatus(request.getStatus() != null ? request.getStatus() : "draft");

        int inserted = assignmentMapper.insert(assignment);
        if (inserted <= 0) {
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, "创建作业失败");
        }

        // Handle assignment-class links
        if (request.getClassIds() != null && !request.getClassIds().isEmpty()) {
            for (Long classId : request.getClassIds()) {
                // Optionally, check if classId exists
                if (classMapper.findById(classId) == null) {
                    throw new CustomException(HttpStatus.BAD_REQUEST, "班级ID " + classId + " 不存在");
                }
                assignmentMapper.insertAssignmentClassLink(assignment.getId(), classId);
            }
        }

        return ApiResponse.ok("作业创建成功", assignment);
    }

    @Override
    @Transactional
    public ApiResponse<Assignment> updateAssignment(Long id, AssignmentCreateRequest request, Long teacherId) {
        Assignment existingAssignment = assignmentMapper.selectById(id);
        if (existingAssignment == null) {
            throw new CustomException(HttpStatus.NOT_FOUND, "作业不存在");
        }

        // Only the original teacher can update their assignment
        if (!existingAssignment.getTeacherId().equals(teacherId)) {
            throw new CustomException(HttpStatus.FORBIDDEN, "无权限修改该作业");
        }

        BeanUtils.copyProperties(request, existingAssignment, "id", "teacherId", "createdAt");
        existingAssignment.setUpdatedAt(LocalDateTime.now());

        int updated = assignmentMapper.update(existingAssignment);
        if (updated <= 0) {
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, "更新作业失败");
        }

        // Update assignment-class links
        assignmentMapper.deleteAssignmentClassLinkByAssignmentId(id);
        if (request.getClassIds() != null && !request.getClassIds().isEmpty()) {
            for (Long classId : request.getClassIds()) {
                if (classMapper.findById(classId) == null) {
                    throw new CustomException(HttpStatus.BAD_REQUEST, "班级ID " + classId + " 不存在");
                }
                assignmentMapper.insertAssignmentClassLink(id, classId);
            }
        }

        return ApiResponse.ok("作业更新成功", existingAssignment);
    }

    @Override
    @Transactional
    public ApiResponse<Void> deleteAssignment(Long id, Long teacherId) {
        Assignment existingAssignment = assignmentMapper.selectById(id);
        if (existingAssignment == null) {
            throw new CustomException(HttpStatus.NOT_FOUND, "作业不存在");
        }

        // Only the original teacher can delete their assignment
        if (!existingAssignment.getTeacherId().equals(teacherId)) {
            throw new CustomException(HttpStatus.FORBIDDEN, "无权限删除该作业");
        }

        // Delete associated links first
        assignmentMapper.deleteAssignmentClassLinkByAssignmentId(id);

        int deleted = assignmentMapper.deleteById(id);
        if (deleted <= 0) {
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, "删除作业失败");
        }
        return ApiResponse.ok("作业删除成功", null);
    }

    @Override
    public ApiResponse<AssignmentResponse> getAssignmentById(Long id) {
        Assignment assignment = assignmentMapper.selectById(id);
        if (assignment == null) {
            throw new CustomException(HttpStatus.NOT_FOUND, "作业不存在");
        }
        return ApiResponse.ok(mapToAssignmentResponse(assignment));
    }

    @Override
    public ApiResponse<List<AssignmentResponse>> getAllAssignments() {
        List<Assignment> assignments = assignmentMapper.selectAll();
        List<AssignmentResponse> responses = assignments.stream()
                .map(this::mapToAssignmentResponse)
                .collect(Collectors.toList());
        return ApiResponse.ok(responses);
    }

    @Override
    public ApiResponse<List<AssignmentResponse>> getAssignmentsByTeacherId(Long teacherId) {
        List<Assignment> assignments = assignmentMapper.selectByTeacherId(teacherId);
        List<AssignmentResponse> responses = assignments.stream()
                .map(this::mapToAssignmentResponse)
                .collect(Collectors.toList());
        return ApiResponse.ok(responses);
    }

    @Override
    public ApiResponse<List<AssignmentResponse>> getAssignmentsByStudentId(Long studentId) {
        User studentUser = userMapper.findById(studentId);
        if (studentUser == null || !"student".equals(studentUser.getRole())) {
            throw new CustomException(HttpStatus.NOT_FOUND, "学生用户不存在或角色不符");
        }

        Student studentEntity = studentMapper.selectByUserId(studentId);
        if (studentEntity == null) {
            throw new CustomException(HttpStatus.NOT_FOUND, "未找到该学生的用户信息");
        }

        Long classId = studentEntity.getClassId();
        List<Assignment> assignments = new ArrayList<>();
        if (classId != null) {
            assignments = assignmentMapper.selectByClassId(classId);
        }

        List<AssignmentResponse> responses = assignments.stream()
                .map(this::mapToAssignmentResponse)
                .collect(Collectors.toList());
        return ApiResponse.ok(responses);
    }

    private AssignmentResponse mapToAssignmentResponse(Assignment assignment) {
        AssignmentResponse response = new AssignmentResponse();
        BeanUtils.copyProperties(assignment, response);

        // Get teacher name
        User teacher = userMapper.findById(assignment.getTeacherId());
        if (teacher != null) {
            response.setTeacherName(teacher.getDisplayName() != null ? teacher.getDisplayName() : teacher.getUsername());
        }

        // Get class names
        List<Long> classIds = assignmentMapper.selectClassIdsByAssignmentId(assignment.getId());
        response.setClassIds(classIds);
        if (classIds != null && !classIds.isEmpty()) {
            List<String> classNames = classIds.stream()
                    .map(classMapper::findById)
                    .filter(c -> c != null)
                    .map(IkunClass::getClassName)
                    .collect(Collectors.toList());
            response.setClassNames(classNames);
        }

        return response;
    }
} 