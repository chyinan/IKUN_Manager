package com.ikunmanager.service;

import com.ikunmanager.model.Student;
import com.ikunmanager.mapper.StudentMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StudentService {

    @Autowired
    private StudentMapper studentMapper;

    public List<Student> getAllStudents(String name, String studentId) {
        return studentMapper.findAll(name, studentId);
    }

    public Student getStudentById(Long id) {
        return studentMapper.findById(id);
    }

    public Student addStudent(Student student) {
        studentMapper.insert(student);
        return student;
    }

    public Student updateStudent(Student student) {
        studentMapper.update(student);
        return studentMapper.findById(student.getId());
    }

    public void deleteStudent(Long id) {
        studentMapper.delete(id);
    }

    public String getMaxStudentId() {
        return studentMapper.getMaxStudentId();
    }
    
    public void batchAddStudents(List<Student> students) {
        if (students != null && !students.isEmpty()) {
            studentMapper.batchInsert(students);
        }
    }
} 