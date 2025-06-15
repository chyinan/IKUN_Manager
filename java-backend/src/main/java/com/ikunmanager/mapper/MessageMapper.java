package com.ikunmanager.mapper;

import com.ikunmanager.model.Message;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface MessageMapper {
    List<Message> findByThreadId(@Param("threadId") Long threadId);
    Message findById(@Param("id") Long id);
    int insert(Message message);
    int update(Message message);
    int deleteById(@Param("id") Long id);
    int markMessagesAsRead(@Param("threadId") Long threadId, @Param("userId") Long userId);
} 