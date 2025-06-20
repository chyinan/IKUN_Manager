package com.ikunmanager.mapper;

import com.ikunmanager.dto.SubmissionResponse;
import com.ikunmanager.entity.Submission;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SubmissionMapper {
    int insert(Submission submission);
    int update(Submission submission);
    int deleteById(Long id);
    Submission selectById(Long id);
    SubmissionResponse selectSubmissionResponseById(Long id);
    List<Submission> selectAll();
    List<SubmissionResponse> selectByAssignmentId(Long assignmentId);
    Submission selectByAssignmentIdAndStudentId(@Param("assignmentId") Long assignmentId, @Param("studentId") Long studentId);
    List<Submission> selectByStudentId(Long studentId);
} 