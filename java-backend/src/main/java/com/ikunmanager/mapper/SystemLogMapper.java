package com.ikunmanager.mapper;

import com.ikunmanager.model.SystemLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface SystemLogMapper {
    List<SystemLog> findByPage(@Param("type") String type, 
                               @Param("operation") String operation, 
                               @Param("content") String content, 
                               @Param("operator") String operator, 
                               @Param("startDate") String startDate, 
                               @Param("endDate") String endDate,
                               @Param("offset") int offset, 
                               @Param("pageSize") int pageSize);

    int countByPage(@Param("type") String type, 
                    @Param("operation") String operation, 
                    @Param("content") String content, 
                    @Param("operator") String operator, 
                    @Param("startDate") String startDate, 
                    @Param("endDate") String endDate);

    int insert(SystemLog systemLog);

    int deleteByIds(@Param("ids") List<Long> ids);
} 