package com.ikunmanager.mapper;

import com.ikunmanager.entity.Department;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional // Ensures the test is rolled back
public class DepartmentMapperTest {

    @Autowired
    private DepartmentMapper departmentMapper;

    @Test
    void testFindAll() {
        List<Department> departments = departmentMapper.findAll();
        assertNotNull(departments);
        assertFalse(departments.isEmpty());
        departments.forEach(System.out::println);
    }

    @Test
    void testFindById() {
        // Assuming there is a department with ID 1 in the database
        Department department = departmentMapper.findById(1L);
        assertNotNull(department);
        assertEquals("技术部", department.getDeptName());
    }

    @Test
    void testInsert() {
        Department newDepartment = new Department();
        newDepartment.setDeptName("测试部");
        newDepartment.setManager("测试经理");
        newDepartment.setDescription("这是一个测试部门");
        newDepartment.setCreateTime(LocalDateTime.now());
        newDepartment.setUpdateTime(LocalDateTime.now());

        departmentMapper.insert(newDepartment);
        assertNotNull(newDepartment.getId());

        Department fetchedDepartment = departmentMapper.findById(newDepartment.getId());
        assertNotNull(fetchedDepartment);
        assertEquals("测试部", fetchedDepartment.getDeptName());
    }

    @Test
    void testUpdate() {
        // Assuming department with ID 1 exists
        Department existingDepartment = departmentMapper.findById(1L);
        assertNotNull(existingDepartment);

        existingDepartment.setDeptName("技术部-更新");
        existingDepartment.setManager("更新经理");
        existingDepartment.setUpdateTime(LocalDateTime.now());

        departmentMapper.update(existingDepartment);

        Department updatedDepartment = departmentMapper.findById(1L);
        assertNotNull(updatedDepartment);
        assertEquals("技术部-更新", updatedDepartment.getDeptName());
        assertEquals("更新经理", updatedDepartment.getManager());
    }

    @Test
    void testDelete() {
        // Insert a new department to delete
        Department departmentToDelete = new Department();
        departmentToDelete.setDeptName("待删除部门");
        departmentToDelete.setManager("删除经理");
        departmentToDelete.setDescription("将被删除的部门");
        departmentToDelete.setCreateTime(LocalDateTime.now());
        departmentToDelete.setUpdateTime(LocalDateTime.now());

        departmentMapper.insert(departmentToDelete);
        assertNotNull(departmentToDelete.getId());

        departmentMapper.delete(departmentToDelete.getId());
        assertNull(departmentMapper.findById(departmentToDelete.getId())); // Should be null after deletion
    }
}
