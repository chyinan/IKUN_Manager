package com.ikunmanager.mapper;

import com.ikunmanager.model.Student;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface StudentMapper {
    List<Student> findAll();
    Student findById(Long id);
    int insert(Student student);
    int update(Student student);
    int delete(Long id);
}
