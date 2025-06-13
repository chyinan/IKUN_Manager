package com.ikunmanager.mapper;

import com.ikunmanager.model.Employee;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional // Ensures the test is rolled back
public class EmployeeMapperTest {

    @Autowired
    private EmployeeMapper employeeMapper;

    @Test
    void testFindAll() {
        List<Employee> employees = employeeMapper.findAll(null, null, null, null);
        assertNotNull(employees);
        assertFalse(employees.isEmpty());
        employees.forEach(System.out::println);
    }

    @Test
    void testFindById() {
        // Assuming there is an employee with ID 1 in the database
        Employee employee = employeeMapper.findById(1L);
        assertNotNull(employee);
        assertEquals("EMP001", employee.getEmpId());
        assertEquals("张三", employee.getName());
    }

    @Test
    void testInsert() {
        Employee newEmployee = new Employee();
        newEmployee.setEmpId("EMP00TEST");
        newEmployee.setName("测试员工");
        newEmployee.setGender("男");
        newEmployee.setAge(25);
        newEmployee.setPosition("测试职位");
        newEmployee.setDeptId(1L); // Assuming department with ID 1 exists
        newEmployee.setSalary(9999.99);
        newEmployee.setStatus("在职");
        newEmployee.setPhone("12345678900");
        newEmployee.setEmail("test@example.com");
        newEmployee.setJoinDate(new Date());
        newEmployee.setCreateTime(new Date());
        newEmployee.setUpdateTime(new Date());

        employeeMapper.insert(newEmployee);
        assertNotNull(newEmployee.getId()); // ID should be generated after insert

        Employee fetchedEmployee = employeeMapper.findById(newEmployee.getId());
        assertNotNull(fetchedEmployee);
        assertEquals("测试员工", fetchedEmployee.getName());
    }

    @Test
    void testUpdate() {
        // Assuming employee with ID 1 exists
        Employee existingEmployee = employeeMapper.findById(1L);
        assertNotNull(existingEmployee);

        existingEmployee.setName("张三-更新");
        existingEmployee.setSalary(16000.00);
        existingEmployee.setUpdateTime(new Date());

        employeeMapper.update(existingEmployee);

        Employee updatedEmployee = employeeMapper.findById(1L);
        assertNotNull(updatedEmployee);
        assertEquals("张三-更新", updatedEmployee.getName());
        assertEquals(16000.00, updatedEmployee.getSalary());
    }

    @Test
    void testDelete() {
        // Insert a new employee to delete
        Employee employeeToDelete = new Employee();
        employeeToDelete.setEmpId("EMPDELETE");
        employeeToDelete.setName("待删除员工");
        employeeToDelete.setGender("女");
        employeeToDelete.setAge(30);
        employeeToDelete.setPosition("临时工");
        employeeToDelete.setDeptId(1L);
        employeeToDelete.setSalary(100.00);
        employeeToDelete.setStatus("在职");
        employeeToDelete.setJoinDate(new Date());
        employeeToDelete.setCreateTime(new Date());
        employeeToDelete.setUpdateTime(new Date());

        employeeMapper.insert(employeeToDelete);
        assertNotNull(employeeToDelete.getId());

        employeeMapper.delete(employeeToDelete.getId());
        assertNull(employeeMapper.findById(employeeToDelete.getId())); // Should be null after deletion
    }
}
