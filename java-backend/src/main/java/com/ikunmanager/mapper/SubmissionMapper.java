package com.ikunmanager.mapper;

import com.ikunmanager.entity.Submission;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface SubmissionMapper {
    int insert(Submission submission);
    int update(Submission submission);
    int deleteById(Long id);
    Submission selectById(Long id);
    List<Submission> selectAll();
    List<Submission> selectByAssignmentId(Long assignmentId);
    Submission selectByAssignmentIdAndStudentId(Long assignmentId, Long studentId);
    List<Submission> selectByStudentId(Long studentId);
} 