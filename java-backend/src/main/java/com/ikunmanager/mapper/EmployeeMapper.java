package com.ikunmanager.mapper;

import com.ikunmanager.model.Employee;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface EmployeeMapper {

    List<Employee> findAll(@Param("name") String name, 
                           @Param("empId") String empId, 
                           @Param("deptName") String deptName, 
                           @Param("status") String status);

    Employee findById(@Param("id") Long id);

    int insert(Employee employee);

    int update(Employee employee);

    int delete(@Param("id") Long id);

    int batchDelete(@Param("ids") List<Long> ids);
    
    int batchInsert(@Param("employees") List<Employee> employees);

    long countTotalEmployees();

} 