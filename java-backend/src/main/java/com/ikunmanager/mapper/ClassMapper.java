package com.ikunmanager.mapper;

import com.ikunmanager.model.IkunClass;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface ClassMapper {
    
    List<IkunClass> findAll(@Param("className") String className);
    
    IkunClass findById(@Param("id") Long id);
    
    IkunClass findByClassName(@Param("className") String className);
    
    int insert(IkunClass ikunClass);
    
    int update(IkunClass ikunClass);
    
    int delete(@Param("id") Long id);
    
    int batchInsert(@Param("classes") List<IkunClass> classes);
} 