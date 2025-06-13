package com.ikunmanager.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ikunmanager.mapper.StudentMapper;
import com.ikunmanager.model.Student;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.hasSize;

import com.ikunmanager.IkunManagerApplication; // 新增导入
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc; // 新增导入
@SpringBootTest(classes = IkunManagerApplication.class)
@AutoConfigureMockMvc // 新增
@WithMockUser
public class StudentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private StudentMapper studentMapper;

    @Autowired
    private ObjectMapper objectMapper;

    private Student student1;
    private Student student2;

    @BeforeEach
    void setUp() {
        student1 = new Student();
        student1.setId(1L);
        student1.setName("张伟");
        student1.setStudentId("S2023001");

        student2 = new Student();
        student2.setId(2L);
        student2.setName("王芳");
        student2.setStudentId("S2023002");
    }

    @Test
    public void getAllStudents_shouldReturnListOfStudents() throws Exception {
        List<Student> students = Arrays.asList(student1, student2);
        given(studentMapper.findAll()).willReturn(students);

        mockMvc.perform(get("/api/students"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].name", is("张伟")))
                .andExpect(jsonPath("$[1].name", is("王芳")));
    }

    @Test
    public void getStudentById_whenStudentExists_shouldReturnStudent() throws Exception {
        given(studentMapper.findById(1L)).willReturn(student1);

        mockMvc.perform(get("/api/students/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("张伟")));
    }

    @Test
    public void getStudentById_whenStudentDoesNotExist_shouldReturnNotFound() throws Exception {
        given(studentMapper.findById(99L)).willReturn(null);

        mockMvc.perform(get("/api/students/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    public void createStudent_shouldReturnCreatedStudent() throws Exception {
        given(studentMapper.insert(any(Student.class))).willReturn(1);

        mockMvc.perform(post("/api/students")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(student1)))
                .andExpect(status().isOk()) // Based on your controller implementation returning the object directly
                .andExpect(jsonPath("$.name", is("张伟")));
    }

    @Test
    public void updateStudent_whenStudentExists_shouldReturnUpdatedStudent() throws Exception {
        given(studentMapper.findById(1L)).willReturn(student1);
        given(studentMapper.update(any(Student.class))).willReturn(1);
        
        Student updatedDetails = new Student();
        updatedDetails.setName("张伟-Updated");

        mockMvc.perform(put("/api/students/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedDetails)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("张伟-Updated")));
    }
    
    @Test
    public void updateStudent_whenStudentDoesNotExist_shouldReturnNotFound() throws Exception {
        given(studentMapper.findById(99L)).willReturn(null);

        Student updatedDetails = new Student();
        updatedDetails.setName("不存在的学生");

        mockMvc.perform(put("/api/students/99")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedDetails)))
                .andExpect(status().isNotFound());
    }

    @Test
    public void deleteStudent_whenStudentExists_shouldReturnNoContent() throws Exception {
        given(studentMapper.findById(1L)).willReturn(student1);
        given(studentMapper.delete(1L)).willReturn(1);

        mockMvc.perform(delete("/api/students/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    public void deleteStudent_whenStudentDoesNotExist_shouldReturnNotFound() throws Exception {
        given(studentMapper.findById(99L)).willReturn(null);

        mockMvc.perform(delete("/api/students/99"))
                .andExpect(status().isNotFound());
    }
}
