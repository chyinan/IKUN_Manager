package com.ikunmanager.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ikunmanager.model.IkunClass;
import com.ikunmanager.service.ClassService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.security.test.context.support.WithMockUser;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

@SpringBootTest
@AutoConfigureMockMvc
public class ClassControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ClassService classService;

    @BeforeEach
    void setUp() {
        // 在每个测试方法执行前设置一个模拟用户，这样就不需要为每个请求单独添加Authorization头了
        // Mock User details can be customized here if needed for role-based testing
    }

    @Test
    void testGetClassList() throws Exception {
        IkunClass ikunClass = new IkunClass();
        ikunClass.setId(1L);
        ikunClass.setClassName("高三（1）班");
        when(classService.getAllClasses(null)).thenReturn(Collections.singletonList(ikunClass));

        mockMvc.perform(get("/api/class/list").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.data[0].class_name", is("高三（1）班")));
    }

    @Test
    void testAddClass_Success() throws Exception {
        IkunClass newClass = new IkunClass();
        newClass.setClassName("新班级");

        when(classService.addClass(any(IkunClass.class))).thenReturn(newClass);

        mockMvc.perform(post("/api/class/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newClass))
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.data.class_name", is("新班级")));
    }

    @Test
    void testUpdateClass_Success() throws Exception {
        IkunClass updatedClass = new IkunClass();
        updatedClass.setId(1L);
        updatedClass.setClassName("更新后的班级");

        when(classService.updateClass(any(IkunClass.class))).thenReturn(updatedClass);

        mockMvc.perform(put("/api/class/update")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedClass))
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.data.class_name", is("更新后的班级")));
    }
    
    @Test
    void testDeleteClass_Success() throws Exception {
        mockMvc.perform(delete("/api/class/delete/1").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)));

        verify(classService, times(1)).deleteClass(1L);
    }
} 