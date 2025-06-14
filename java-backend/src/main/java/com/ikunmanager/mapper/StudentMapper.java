package com.ikunmanager.mapper;

import com.ikunmanager.model.Student;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface StudentMapper {

    List<Student> findAll(@Param("name") String name, @Param("studentId") String studentId);

    Student findById(@Param("id") Long id);

    int insert(Student student);

    int update(Student student);

    int delete(@Param("id") Long id);

    @Select("SELECT student_id FROM student ORDER BY student_id DESC LIMIT 1")
    String getMaxStudentId();
    
    int batchInsert(@Param("students") List<Student> students);
}
