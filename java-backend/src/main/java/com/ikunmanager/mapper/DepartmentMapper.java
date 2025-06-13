package com.ikunmanager.mapper;

import com.ikunmanager.model.Department;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface DepartmentMapper {

    List<Department> findAll();

    Department findById(@Param("id") Long id);

    int insert(Department department);

    int update(Department department);

    int delete(@Param("id") Long id);

    Department findByDeptName(@Param("deptName") String deptName);

    int batchDelete(@Param("ids") List<Long> ids);

    int batchInsert(@Param("departments") List<Department> departments);

    // You might also consider batch operations if needed later
    // int batchInsert(@Param("departments") List<Department> departments);

}
