package com.ikunmanager.mapper;

import com.ikunmanager.model.SystemConfig;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface ConfigMapper {

    List<SystemConfig> findAll();

    String findConfigValueByKey(String configKey);
}
