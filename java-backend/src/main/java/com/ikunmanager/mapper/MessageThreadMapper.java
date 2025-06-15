package com.ikunmanager.mapper;

import com.ikunmanager.model.MessageThread;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface MessageThreadMapper {
    List<MessageThread> findAllAdminThreads();
    List<MessageThread> findStudentThreads(@Param("studentUserId") Long studentUserId);
    MessageThread findById(@Param("id") Long id);
    int insert(MessageThread messageThread);
    int update(MessageThread messageThread);
    int deleteById(@Param("id") Long id);
} 