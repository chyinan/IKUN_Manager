package com.ikunmanager.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ikunmanager.model.Student;
import com.ikunmanager.service.StudentService;
import com.ikunmanager.mapper.ClassMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import com.ikunmanager.model.IkunClass;

import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.hasSize;

@SpringBootTest
@AutoConfigureMockMvc
public class StudentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private StudentService studentService;

    @MockBean
    private ClassMapper classMapper;

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
        student1.setGender("男");
        student1.setClassName("高三(1)班");

        student2 = new Student();
        student2.setId(2L);
        student2.setName("王芳");
        student2.setStudentId("S2023002");
        student2.setGender("女");
        student2.setClassName("高三(2)班");

        IkunClass mockIkunClass1 = new IkunClass();
        mockIkunClass1.setId(101L);
        mockIkunClass1.setClassName("高三(1)班");

        IkunClass mockIkunClass2 = new IkunClass();
        mockIkunClass2.setId(102L);
        mockIkunClass2.setClassName("高三(2)班");
        
        given(classMapper.findByClassName("高三(1)班")).willReturn(mockIkunClass1);
        given(classMapper.findByClassName("高三(2)班")).willReturn(mockIkunClass2);
    }

    @Test
    public void getStudentList_shouldReturnListOfStudents() throws Exception {
        List<Student> students = Arrays.asList(student1, student2);
        given(studentService.getAllStudents(null, null)).willReturn(students);

        mockMvc.perform(get("/api/student/list").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[0].name", is("张伟")))
                .andExpect(jsonPath("$.data[1].name", is("王芳")));
    }

    @Test
    public void getStudentById_whenStudentExists_shouldReturnStudent() throws Exception {
        given(studentService.getStudentById(1L)).willReturn(student1);

        mockMvc.perform(get("/api/student/1").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.data.name", is("张伟")));
    }

    @Test
    public void addStudent_shouldReturnCreatedStudent() throws Exception {
        given(studentService.addStudent(any(Student.class))).willReturn(student1);

        mockMvc.perform(post("/api/student/add")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(student1))
                .with(user("admin").roles("ADMIN")))
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.data.name", is("张伟")));
    }

    @Test
    public void updateStudent_whenStudentExists_shouldReturnUpdatedStudent() throws Exception {
        given(studentService.updateStudent(any(Student.class))).willReturn(student1);
        
        mockMvc.perform(put("/api/student/update")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(student1))
                .with(user("admin").roles("ADMIN")))
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.data.name", is("张伟")));
    }

    @Test
    public void deleteStudent_whenStudentExists_shouldReturnOk() throws Exception {
        mockMvc.perform(delete("/api/student/delete/1").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)));
    }
}
