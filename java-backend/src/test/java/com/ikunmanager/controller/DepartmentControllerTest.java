package com.ikunmanager.controller;

import com.ikunmanager.entity.Department;
import com.ikunmanager.mapper.DepartmentMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.ikunmanager.IkunManagerApplication; // 新增导入
import org.springframework.security.test.context.support.WithMockUser;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.is;

import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc; // 新增导入

@SpringBootTest(classes = IkunManagerApplication.class)
@AutoConfigureMockMvc // 新增
@WithMockUser
public class DepartmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DepartmentMapper departmentMapper;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testGetAllDepartments() throws Exception {
        Department dept1 = new Department();
        dept1.setId(1L);
        dept1.setDeptName("技术部");
        dept1.setManager("张三");
        dept1.setDescription("负责公司技术研发工作");
        dept1.setCreateTime(LocalDateTime.now());
        dept1.setUpdateTime(LocalDateTime.now());

        Department dept2 = new Department();
        dept2.setId(2L);
        dept2.setDeptName("市场部");
        dept2.setManager("李四");
        dept2.setDescription("负责市场营销和推广");
        dept2.setCreateTime(LocalDateTime.now());
        dept2.setUpdateTime(LocalDateTime.now());

        List<Department> allDepartments = Arrays.asList(dept1, dept2);

        when(departmentMapper.findAll()).thenReturn(allDepartments);

        mockMvc.perform(get("/api/departments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.data[0].dept_name").value("技术部"))
                .andExpect(jsonPath("$.data[1].dept_name").value("市场部"));
    }

    @Test
    void testGetDepartmentById() throws Exception {
        Department dept = new Department();
        dept.setId(1L);
        dept.setDeptName("技术部");
        dept.setManager("张三");
        dept.setDescription("负责公司技术研发工作");
        dept.setCreateTime(LocalDateTime.now());
        dept.setUpdateTime(LocalDateTime.now());

        when(departmentMapper.findById(1L)).thenReturn(dept);

        mockMvc.perform(get("/api/departments/{id}", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.data.dept_name").value("技术部"));
    }

    @Test
    void testCreateDepartment() throws Exception {
        Department newDept = new Department();
        newDept.setDeptName("新部门");
        newDept.setManager("王五");
        newDept.setDescription("新部门描述");

        doReturn(null).when(departmentMapper).findByDeptName(any(String.class));
        doNothing().when(departmentMapper).insert(any(Department.class));

        mockMvc.perform(post("/api/departments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newDept)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.data.dept_name").value("新部门"));

        verify(departmentMapper).findByDeptName(any(String.class));
        verify(departmentMapper).insert(any(Department.class));
    }

    @Test
    void testCreateDepartment_nameExists() throws Exception {
        Department existingDept = new Department();
        existingDept.setId(1L);
        existingDept.setDeptName("技术部");

        Department newDept = new Department();
        newDept.setDeptName("技术部");

        doReturn(existingDept).when(departmentMapper).findByDeptName("技术部");

        mockMvc.perform(post("/api/departments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newDept)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(409)));

        verify(departmentMapper).findByDeptName("技术部");
    }

    @Test
    void testUpdateDepartment() throws Exception {
        Department existingDept = new Department();
        existingDept.setId(1L);
        existingDept.setDeptName("旧技术部");

        Department updatedDept = new Department();
        updatedDept.setId(1L);
        updatedDept.setDeptName("更新技术部");

        when(departmentMapper.findById(1L)).thenReturn(existingDept);
        when(departmentMapper.findByDeptName("更新技术部")).thenReturn(null);
        doNothing().when(departmentMapper).update(any(Department.class));

        mockMvc.perform(put("/api/departments/{id}", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedDept)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.data.dept_name").value("更新技术部"));
    }

    @Test
    void testUpdateDepartment_nameExistsForOtherDept() throws Exception {
        Department existingDeptForUpdate = new Department();
        existingDeptForUpdate.setId(1L);

        Department otherExistingDept = new Department();
        otherExistingDept.setId(2L);
        otherExistingDept.setDeptName("市场部");

        Department updatedDept = new Department();
        updatedDept.setId(1L);
        updatedDept.setDeptName("市场部");

        when(departmentMapper.findById(1L)).thenReturn(existingDeptForUpdate);
        when(departmentMapper.findByDeptName("市场部")).thenReturn(otherExistingDept);

        mockMvc.perform(put("/api/departments/{id}", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedDept)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(409)));
    }

    @Test
    void testDeleteDepartment() throws Exception {
        Department existingDept = new Department();
        existingDept.setId(1L);
        existingDept.setDeptName("待删除部门");

        when(departmentMapper.findById(1L)).thenReturn(existingDept);
        doNothing().when(departmentMapper).delete(1L);

        mockMvc.perform(delete("/api/departments/{id}", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)));
    }

    @Test
    void testBatchInsertDepartments_success() throws Exception {
        List<Department> newDepartments = Arrays.asList(new Department(), new Department());
        newDepartments.get(0).setDeptName("新部门A");
        newDepartments.get(1).setDeptName("新部门B");

        doReturn(2).when(departmentMapper).batchInsert(anyList());

        mockMvc.perform(post("/api/departments/batch")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newDepartments)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(200)));

        verify(departmentMapper).batchInsert(anyList());
    }

    @Test
    void testBatchInsertDepartments_nameExists() throws Exception {
        Department existingDept = new Department();
        existingDept.setDeptName("现有部门");

        List<Department> newDepartments = Arrays.asList(new Department(), new Department());
        newDepartments.get(0).setDeptName("现有部门"); // This name already exists

        when(departmentMapper.findByDeptName("现有部门")).thenReturn(existingDept);

        mockMvc.perform(post("/api/departments/batch")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newDepartments)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(409)));
    }
}
