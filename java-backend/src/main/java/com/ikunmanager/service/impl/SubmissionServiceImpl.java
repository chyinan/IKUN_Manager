package com.ikunmanager.service.impl;

import com.ikunmanager.common.ApiResponse;
import com.ikunmanager.common.CustomException;
import com.ikunmanager.dto.SubmissionGradeRequest;
import com.ikunmanager.dto.SubmissionRequest;
import com.ikunmanager.dto.SubmissionResponse;
import com.ikunmanager.entity.Assignment;
import com.ikunmanager.entity.Submission;
import com.ikunmanager.model.Student;
import com.ikunmanager.model.User;
import com.ikunmanager.mapper.AssignmentMapper;
import com.ikunmanager.mapper.SubmissionMapper;
import com.ikunmanager.mapper.StudentMapper;
import com.ikunmanager.mapper.UserMapper;
import com.ikunmanager.service.SubmissionService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SubmissionServiceImpl implements SubmissionService {

    @Autowired
    private SubmissionMapper submissionMapper;

    @Autowired
    private AssignmentMapper assignmentMapper;

    @Autowired
    private StudentMapper studentMapper;

    @Autowired
    private UserMapper userMapper;

    @Override
    @Transactional
    public ApiResponse<Submission> submitAssignment(SubmissionRequest request, Long studentUserId) {
        // 1. 验证作业是否存在
        Assignment assignment = assignmentMapper.selectById(request.getAssignmentId());
        if (assignment == null) {
            throw new CustomException(HttpStatus.NOT_FOUND, "作业不存在");
        }

        // 2. 验证学生用户是否存在且是学生角色
        User studentUser = userMapper.findById(studentUserId);
        if (studentUser == null || !"student".equals(studentUser.getRole())) {
            throw new CustomException(HttpStatus.FORBIDDEN, "非学生用户或用户不存在");
        }

        // 3. 获取学生实体ID
        Student student = studentMapper.selectByUserId(studentUserId);
        if (student == null) {
            throw new CustomException(HttpStatus.NOT_FOUND, "未找到对应的学生信息");
        }

        // 4. 检查是否重复提交 (一个作业一个学生只能提交一次)
        Submission existingSubmission = submissionMapper.selectByAssignmentIdAndStudentId(request.getAssignmentId(), student.getId());
        if (existingSubmission != null) {
            throw new CustomException(HttpStatus.CONFLICT, "你已提交过该作业，请勿重复提交");
        }

        // 5. 判断是否迟交
        String status = "submitted";
        if (LocalDateTime.now().isAfter(assignment.getDueDate())) {
            status = "late";
        }

        // 6. 构建并插入提交记录
        Submission submission = new Submission();
        BeanUtils.copyProperties(request, submission);
        submission.setStudentId(student.getId()); // 使用学生实体ID
        submission.setStatus(status);
        submission.setSubmittedAt(LocalDateTime.now());

        int inserted = submissionMapper.insert(submission);
        if (inserted <= 0) {
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, "作业提交失败");
        }

        return ApiResponse.ok("作业提交成功", submission);
    }

    @Override
    @Transactional
    public ApiResponse<Submission> updateSubmission(Long id, SubmissionRequest request, Long studentUserId) {
        // 1. 验证提交记录是否存在
        Submission existingSubmission = submissionMapper.selectById(id);
        if (existingSubmission == null) {
            throw new CustomException(HttpStatus.NOT_FOUND, "提交记录不存在");
        }

        // 2. 验证当前用户是否有权限修改 (只能修改自己的提交)
        Student student = studentMapper.selectByUserId(studentUserId);
        if (student == null || !existingSubmission.getStudentId().equals(student.getId())) {
            throw new CustomException(HttpStatus.FORBIDDEN, "无权限修改该提交");
        }

        // 3. 验证作业是否存在
        Assignment assignment = assignmentMapper.selectById(existingSubmission.getAssignmentId());
        if (assignment == null) {
            // 这通常不应该发生，除非作业被删除而提交记录未级联删除
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, "关联作业不存在");
        }

        // 4. 不允许修改已批改的作业
        if ("graded".equals(existingSubmission.getStatus())) {
            throw new CustomException(HttpStatus.BAD_REQUEST, "已批改的作业不允许修改");
        }

        // 5. 更新内容和文件URL
        BeanUtils.copyProperties(request, existingSubmission, "id", "assignmentId", "studentId", "submittedAt", "grade", "teacherComment");
        existingSubmission.setUpdatedAt(LocalDateTime.now());

        // 重新判断是否迟交（如果之前不是迟交，现在修改可能变成迟交）
        if (!"late".equals(existingSubmission.getStatus()) && LocalDateTime.now().isAfter(assignment.getDueDate())) {
            existingSubmission.setStatus("late");
        } else if ("late".equals(existingSubmission.getStatus()) && !LocalDateTime.now().isAfter(assignment.getDueDate())) {
            // 如果之前是迟交，但现在在截止日期前（比如修改了截止日期），可以变回 submitted
            existingSubmission.setStatus("submitted");
        }

        int updated = submissionMapper.update(existingSubmission);
        if (updated <= 0) {
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, "更新提交失败");
        }

        return ApiResponse.ok("提交更新成功", existingSubmission);
    }

    @Override
    @Transactional
    public ApiResponse<Void> deleteSubmission(Long id, Long studentUserId) {
        // 1. 验证提交记录是否存在
        Submission existingSubmission = submissionMapper.selectById(id);
        if (existingSubmission == null) {
            throw new CustomException(HttpStatus.NOT_FOUND, "提交记录不存在");
        }

        // 2. 验证当前用户是否有权限删除 (只能删除自己的提交)
        Student student = studentMapper.selectByUserId(studentUserId);
        if (student == null || !existingSubmission.getStudentId().equals(student.getId())) {
            throw new CustomException(HttpStatus.FORBIDDEN, "无权限删除该提交");
        }

        // 3. 不允许删除已批改的作业
        if ("graded".equals(existingSubmission.getStatus())) {
            throw new CustomException(HttpStatus.BAD_REQUEST, "已批改的作业不允许删除");
        }

        int deleted = submissionMapper.deleteById(id);
        if (deleted <= 0) {
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, "删除提交失败");
        }

        return ApiResponse.ok("提交删除成功", null);
    }

    @Override
    public ApiResponse<SubmissionResponse> getSubmissionById(Long id) {
        Submission submission = submissionMapper.selectById(id);
        if (submission == null) {
            throw new CustomException(HttpStatus.NOT_FOUND, "提交记录不存在");
        }
        return ApiResponse.ok(mapToSubmissionResponse(submission));
    }

    @Override
    public ApiResponse<List<SubmissionResponse>> getSubmissionsByAssignmentId(Long assignmentId) {
        List<Submission> submissions = submissionMapper.selectByAssignmentId(assignmentId);
        List<SubmissionResponse> responses = submissions.stream()
                .map(this::mapToSubmissionResponse)
                .collect(Collectors.toList());
        return ApiResponse.ok(responses);
    }

    @Override
    public ApiResponse<SubmissionResponse> getSubmissionByAssignmentIdAndStudentId(Long assignmentId, Long studentUserId) {
        Student student = studentMapper.selectByUserId(studentUserId);
        if (student == null) {
            throw new CustomException(HttpStatus.NOT_FOUND, "学生信息不存在");
        }
        Submission submission = submissionMapper.selectByAssignmentIdAndStudentId(assignmentId, student.getId());
        if (submission == null) {
            throw new CustomException(HttpStatus.NOT_FOUND, "未找到该作业的提交记录");
        }
        return ApiResponse.ok(mapToSubmissionResponse(submission));
    }

    @Override
    public ApiResponse<List<SubmissionResponse>> getSubmissionsByStudentId(Long studentUserId) {
        Student student = studentMapper.selectByUserId(studentUserId);
        if (student == null) {
            throw new CustomException(HttpStatus.NOT_FOUND, "学生信息不存在");
        }
        List<Submission> submissions = submissionMapper.selectByStudentId(student.getId());
        List<SubmissionResponse> responses = submissions.stream()
                .map(this::mapToSubmissionResponse)
                .collect(Collectors.toList());
        return ApiResponse.ok(responses);
    }

    @Override
    @Transactional
    public ApiResponse<Submission> gradeSubmission(SubmissionGradeRequest request, Long teacherId) {
        // 1. 验证提交记录是否存在
        Submission existingSubmission = submissionMapper.selectById(request.getSubmissionId());
        if (existingSubmission == null) {
            throw new CustomException(HttpStatus.NOT_FOUND, "提交记录不存在");
        }

        // 2. 验证该教师是否有权限批改此作业 (检查是否为作业发布者)
        Assignment assignment = assignmentMapper.selectById(existingSubmission.getAssignmentId());
        if (assignment == null) {
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, "关联作业不存在");
        }
        if (!assignment.getTeacherId().equals(teacherId)) {
            throw new CustomException(HttpStatus.FORBIDDEN, "无权限批改该作业");
        }

        // 3. 更新分数和评语，并设置状态为 graded
        existingSubmission.setGrade(request.getGrade());
        existingSubmission.setTeacherComment(request.getTeacherComment());
        existingSubmission.setStatus("graded");
        existingSubmission.setUpdatedAt(LocalDateTime.now());

        int updated = submissionMapper.update(existingSubmission);
        if (updated <= 0) {
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, "批改作业失败");
        }

        return ApiResponse.ok("作业批改成功", existingSubmission);
    }

    private SubmissionResponse mapToSubmissionResponse(Submission submission) {
        SubmissionResponse response = new SubmissionResponse();
        BeanUtils.copyProperties(submission, response);

        // 获取作业标题
        Assignment assignment = assignmentMapper.selectById(submission.getAssignmentId());
        if (assignment != null) {
            response.setAssignmentTitle(assignment.getTitle());
        }

        // 获取学生姓名和学号
        Student student = studentMapper.findById(submission.getStudentId());
        if (student != null) {
            response.setStudentName(student.getName());
            response.setStudentNumber(student.getStudentId());
        }

        return response;
    }
} 