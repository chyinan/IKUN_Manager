package com.ikunmanager.mapper;

import com.ikunmanager.entity.Department;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import java.util.List;

@Mapper
public interface DepartmentMapper {

    List<Department> findAll();

    Department findById(@Param("id") Long id);

    void insert(Department department);

    void update(Department department);

    void delete(@Param("id") Long id);

    Department findByDeptName(@Param("deptName") String deptName);

    List<Long> findIdsByDeptNames(List<String> deptNames);

    int batchInsert(@Param("departments") List<Department> departments);

    // You might also consider batch operations if needed later
    // int batchInsert(@Param("departments") List<Department> departments);

    // 获取部门总数
    @Select("SELECT COUNT(*) FROM department")
    Long getTotalDepartments();

}
