package com.ikunmanager.controller;

import com.ikunmanager.model.Department;
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

import java.util.Arrays;
import java.util.Date;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyList;

import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

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
        Department dept1 = new Department(1L, "技术部", "张三", "负责公司技术研发工作", new Date(), new Date());
        Department dept2 = new Department(2L, "市场部", "李四", "负责市场营销和推广", new Date(), new Date());
        List<Department> allDepartments = Arrays.asList(dept1, dept2);

        when(departmentMapper.findAll()).thenReturn(allDepartments);

        mockMvc.perform(get("/api/departments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].dept_name").value("技术部"))
                .andExpect(jsonPath("$[1].dept_name").value("市场部"));
    }

    @Test
    void testGetDepartmentById() throws Exception {
        Department dept = new Department(1L, "技术部", "张三", "负责公司技术研发工作", new Date(), new Date());

        when(departmentMapper.findById(1L)).thenReturn(dept);

        mockMvc.perform(get("/api/departments/{id}", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dept_name").value("技术部"));
    }

    @Test
    void testCreateDepartment() throws Exception {
        Department newDept = new Department(null, "新部门", "王五", "新部门描述", null, null);
        Department savedDept = new Department(3L, "新部门", "王五", "新部门描述", new Date(), new Date());

        System.out.println("Attempting to create department with name: " + newDept.getDeptName());

        doReturn(null).when(departmentMapper).findByDeptName(any(String.class)); // Simulate no existing department with this name
        doReturn(1).when(departmentMapper).insert(any(Department.class));

        mockMvc.perform(post("/api/departments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newDept)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.dept_name").value("新部门"));

        verify(departmentMapper).findByDeptName(any(String.class)); // Verify findByDeptName was called
        verify(departmentMapper).insert(any(Department.class)); // Verify insert was called
    }

    @Test
    void testCreateDepartment_nameExists() throws Exception {
        Department existingDept = new Department(1L, "技术部", "张三", "描述", new Date(), new Date());
        Department newDept = new Department(null, "技术部", "张三", "描述", null, null);

        doReturn(existingDept).when(departmentMapper).findByDeptName("技术部"); // Simulate existing department with this name

        mockMvc.perform(post("/api/departments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newDept)))
                .andExpect(status().isConflict()); // Expect 409 Conflict

        verify(departmentMapper).findByDeptName("技术部"); // Verify findByDeptName was called
    }

    @Test
    void testUpdateDepartment() throws Exception {
        Department existingDept = new Department(1L, "旧技术部", "旧张三", "旧描述", new Date(), new Date());
        Department updatedDept = new Department(1L, "更新技术部", "李四", "更新后的描述", null, null);

        when(departmentMapper.findById(1L)).thenReturn(existingDept); // Simulate department exists
        when(departmentMapper.findByDeptName("更新技术部")).thenReturn(null); // Simulate no existing department with this name
        when(departmentMapper.update(any(Department.class))).thenReturn(1);

        mockMvc.perform(put("/api/departments/{id}", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedDept)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dept_name").value("更新技术部"));
    }
    @Test
    void testUpdateDepartment_nameExistsForOtherDept() throws Exception {
        Department existingDeptForUpdate = new Department(1L, "技术部", "张三", "技术部描述", new Date(), new Date());
        Department otherExistingDept = new Department(2L, "市场部", "李四", "市场部描述", new Date(), new Date());
        Department updatedDept = new Department(1L, "市场部", "王五", "技术部更新描述", null, null); // Trying to change dept1 to "市场部"

        when(departmentMapper.findById(1L)).thenReturn(existingDeptForUpdate); // Simulate department to be updated exists
        when(departmentMapper.findByDeptName("市场部")).thenReturn(otherExistingDept); // Simulate "市场部" already exists with ID 2

        mockMvc.perform(put("/api/departments/{id}", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedDept)))
                .andExpect(status().isConflict()); // Expect 409 Conflict
    }
    @Test
    void testDeleteDepartment() throws Exception {
        when(departmentMapper.delete(1L)).thenReturn(1);

        mockMvc.perform(delete("/api/departments/{id}", 1L))
                .andExpect(status().isNoContent()); // 204 No Content for successful deletion
    }

    @Test
    void testBatchDeleteDepartments_success() throws Exception {
        List<Long> idsToDelete = Arrays.asList(1L, 2L);
        doReturn(2).when(departmentMapper).batchDelete(idsToDelete);

        mockMvc.perform(delete("/api/departments/batch")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(idsToDelete)))
                .andExpect(status().isNoContent()); // 204 No Content

        verify(departmentMapper).batchDelete(idsToDelete);
    }

    @Test
    void testBatchDeleteDepartments_emptyList() throws Exception {
        List<Long> emptyIds = Arrays.asList();

        mockMvc.perform(delete("/api/departments/batch")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(emptyIds)))
                .andExpect(status().isBadRequest()); // 400 Bad Request

        // Verify that batchDelete is not called for an empty list
        verify(departmentMapper, never()).batchDelete(anyList());
    }

    @Test
    void testBatchDeleteDepartments_notFound() throws Exception {
        List<Long> idsToDelete = Arrays.asList(99L, 100L);
        doReturn(0).when(departmentMapper).batchDelete(idsToDelete);

        mockMvc.perform(delete("/api/departments/batch")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(idsToDelete)))
                .andExpect(status().isNotFound()); // 404 Not Found

        verify(departmentMapper).batchDelete(idsToDelete);
    }

    @Test
    void testBatchInsertDepartments_success() throws Exception {
        List<Department> newDepartments = Arrays.asList(
                new Department(null, "新部门A", "经理A", "描述A", new Date(), new Date()),
                new Department(null, "新部门B", "经理B", "描述B", new Date(), new Date())
        );

        doReturn(2).when(departmentMapper).batchInsert(anyList());

        mockMvc.perform(post("/api/departments/batch")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newDepartments)))
                .andExpect(status().isCreated()); // Expect 201 Created

        verify(departmentMapper).batchInsert(anyList());
    }

    @Test
    void testBatchInsertDepartments_emptyList() throws Exception {
        List<Department> emptyDepartments = Arrays.asList();

        mockMvc.perform(post("/api/departments/batch")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(emptyDepartments)))
                .andExpect(status().isBadRequest()); // Expect 400 Bad Request

        verify(departmentMapper, never()).batchInsert(anyList());
    }
}
