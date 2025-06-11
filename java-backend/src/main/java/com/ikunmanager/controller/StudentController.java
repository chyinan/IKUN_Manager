package com.ikunmanager.controller;

import com.ikunmanager.model.Student;
import com.ikunmanager.mapper.StudentMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentMapper studentMapper;

    @Autowired
    public StudentController(StudentMapper studentMapper) {
        this.studentMapper = studentMapper;
    }

    @GetMapping
    public List<Student> getAllStudents() {
        return studentMapper.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Student> getStudentById(@PathVariable Long id) {
        Student student = studentMapper.findById(id);
        if (student == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(student);
    }

    @PostMapping
    public Student createStudent(@RequestBody Student student) {
        studentMapper.insert(student);
        return student;
    }

    @PutMapping("/{id}")
    public ResponseEntity<Student> updateStudent(@PathVariable Long id, @RequestBody Student studentDetails) {
        Student student = studentMapper.findById(id);
        if (student == null) {
            return ResponseEntity.notFound().build();
        }
        studentDetails.setId(id);
        studentMapper.update(studentDetails);
        return ResponseEntity.ok(studentDetails);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long id) {
        Student student = studentMapper.findById(id);
        if (student == null) {
            return ResponseEntity.notFound().build();
        }
        studentMapper.delete(id);
        return ResponseEntity.noContent().build();
    }
}
