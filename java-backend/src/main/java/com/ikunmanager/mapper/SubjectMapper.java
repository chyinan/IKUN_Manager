package com.ikunmanager.mapper;

import com.ikunmanager.model.Subject;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface SubjectMapper {
    List<Subject> findAll();
    Subject findById(@Param("id") Long id);
    Subject findBySubjectName(@Param("subjectName") String subjectName);
    int insertSubject(Subject subject);
    int updateSubject(Subject subject);
    int deleteSubject(@Param("id") Long id);
} 