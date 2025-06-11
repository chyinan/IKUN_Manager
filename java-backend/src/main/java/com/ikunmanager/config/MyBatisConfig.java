package com.ikunmanager.config;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@MapperScan("com.ikunmanager.mapper")
public class MyBatisConfig {
} 