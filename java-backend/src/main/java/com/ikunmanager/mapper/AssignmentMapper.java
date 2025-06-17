package com.ikunmanager.mapper;

import com.ikunmanager.entity.Assignment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface AssignmentMapper {
    int insert(Assignment assignment);
    int update(Assignment assignment);
    int deleteById(Long id);
    Assignment selectById(Long id);
    List<Assignment> selectAll();
    List<Assignment> selectByTeacherId(Long teacherId);
    List<Assignment> selectByClassId(Long classId);
    
    // Assignment-Class Link methods
    int insertAssignmentClassLink(@Param("assignmentId") Long assignmentId, @Param("classId") Long classId);
    int deleteAssignmentClassLinkByAssignmentId(Long assignmentId);
    List<Long> selectClassIdsByAssignmentId(Long assignmentId);
} 