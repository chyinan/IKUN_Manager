package com.ikunmanager.mapper;

import com.ikunmanager.entity.Employee;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import java.util.List;
import java.util.Map;

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

    // 获取员工总数
    @Select("SELECT COUNT(*) FROM employee")
    Long getTotalEmployees();

    // 获取在职员工数
    @Select("SELECT COUNT(*) FROM employee WHERE status = '在职'")
    Long getActiveEmployees();

    // 获取所有员工的薪资总和
    @Select("SELECT SUM(salary) FROM employee")
    Double getTotalSalary();

    // 获取部门分布统计
    @Select("SELECT d.dept_name as name, COUNT(e.id) as value FROM employee e JOIN department d ON e.dept_id = d.id GROUP BY d.dept_name")
    List<Map<String, Object>> getDepartmentDistribution();

    // 获取性别分布统计
    @Select("SELECT gender as name, COUNT(id) as value FROM employee GROUP BY gender")
    List<Map<String, Object>> getGenderDistribution();

    // 获取部门平均薪资
    @Select("SELECT d.dept_name as name, AVG(e.salary) as value FROM employee e JOIN department d ON e.dept_id = d.id GROUP BY d.dept_name")
    List<Map<String, Object>> getDepartmentAverageSalary();

} 