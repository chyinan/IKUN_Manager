package com.ikunmanager.controller;

import com.ikunmanager.common.ApiResponse;
import com.ikunmanager.model.IkunClass;
import com.ikunmanager.model.Student;
import com.ikunmanager.service.StudentService;
import com.ikunmanager.mapper.ClassMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.alibaba.excel.EasyExcel;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/student")
public class StudentController {

    @Autowired
    private StudentService studentService;

    @Autowired
    private ClassMapper classMapper;

    @GetMapping("/list")
    public ApiResponse<List<Student>> getStudentList(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String studentId) {
        return ApiResponse.ok(studentService.getAllStudents(name, studentId));
    }

    @GetMapping("/{id}")
    public ApiResponse<Student> getStudentById(@PathVariable Long id) {
        Student student = studentService.getStudentById(id);
        if (student != null) {
            return ApiResponse.ok(student);
        } else {
            return ApiResponse.error(HttpStatus.NOT_FOUND.value(), "Student not found");
        }
    }

    @PostMapping("/add")
    public ApiResponse<Student> addStudent(@RequestBody Student student) {
        // Find class id by class name
        IkunClass classInfo = classMapper.findByClassName(student.getClassName());
        if (classInfo == null) {
            return ApiResponse.error(HttpStatus.BAD_REQUEST.value(), "Class not found: " + student.getClassName());
        }
        student.setClassId(classInfo.getId());
        Student newStudent = studentService.addStudent(student);
        return ApiResponse.ok(newStudent);
    }

    @PutMapping("/update")
    public ApiResponse<Student> updateStudent(@RequestBody Student student) {
         // Find class id by class name
        IkunClass classInfo = classMapper.findByClassName(student.getClassName());
        if (classInfo == null) {
            return ApiResponse.error(HttpStatus.BAD_REQUEST.value(), "Class not found: " + student.getClassName());
        }
        student.setClassId(classInfo.getId());
        Student updatedStudent = studentService.updateStudent(student);
        return ApiResponse.ok(updatedStudent);
    }

    @DeleteMapping("/delete/{id}")
    public ApiResponse<Void> deleteStudent(@PathVariable Long id) {
        studentService.deleteStudent(id);
        return ApiResponse.ok(null);
    }

    @GetMapping("/max-id")
    public ApiResponse<String> getMaxStudentId() {
        return ApiResponse.ok(studentService.getMaxStudentId());
    }

    @PostMapping("/import")
    public ApiResponse<Void> importStudents(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ApiResponse.error(HttpStatus.BAD_REQUEST.value(), "文件不能为空");
        }

        try (InputStream inputStream = file.getInputStream()) {
            List<Map<Integer, String>> data = EasyExcel.read(inputStream).sheet().headRowNumber(1).doReadSync();

            if (data == null || data.isEmpty()) {
                return ApiResponse.error(HttpStatus.BAD_REQUEST.value(), "Excel文件内容为空或格式不正确");
            }
            
            List<Student> students = new ArrayList<>();
            List<IkunClass> classes = classMapper.findAll(null);
            Map<String, Long> classMap = classes.stream().collect(Collectors.toMap(IkunClass::getClassName, IkunClass::getId));

            for (Map<Integer, String> row : data) {
                Student student = new Student();
                student.setStudentId(row.get(0));
                student.setName(row.get(1));
                student.setGender(row.get(2));
                
                String className = row.get(3);
                if (!classMap.containsKey(className)) {
                     return ApiResponse.error(HttpStatus.BAD_REQUEST.value(), "班级 '" + className + "' 不存在。");
                }
                student.setClassId(classMap.get(className));

                student.setPhone(row.get(4));
                student.setEmail(row.get(5));
                // Note: JoinDate might need special handling for date format
                // student.setJoinDate(...);
                students.add(student);
            }

            studentService.batchAddStudents(students);
            return ApiResponse.ok(null);

        } catch (Exception e) {
            return ApiResponse.error(HttpStatus.INTERNAL_SERVER_ERROR.value(), "导入失败: " + e.getMessage());
        }
    }
}
