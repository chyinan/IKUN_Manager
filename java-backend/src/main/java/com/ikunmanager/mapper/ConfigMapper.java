package com.ikunmanager.mapper;

import com.ikunmanager.model.SystemConfig;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface ConfigMapper {

    List<SystemConfig> findAll();

    String findConfigValueByKey(String configKey);

    @Update("UPDATE system_config SET config_value = #{configValue} WHERE config_key = #{configKey}")
    int updateConfigValueByKey(@Param("configKey") String configKey, @Param("configValue") String configValue);
}
