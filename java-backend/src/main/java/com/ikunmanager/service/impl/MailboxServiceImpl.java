package com.ikunmanager.service.impl;

import com.ikunmanager.mapper.MessageMapper;
import com.ikunmanager.mapper.MessageThreadMapper;
import com.ikunmanager.model.Message;
import com.ikunmanager.model.MessageThread;
import com.ikunmanager.service.MailboxService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MailboxServiceImpl implements MailboxService {

    @Autowired
    private MessageThreadMapper messageThreadMapper;

    @Autowired
    private MessageMapper messageMapper;

    @Override
    public List<MessageThread> getAdminMessageThreads() {
        return messageThreadMapper.findAllAdminThreads();
    }

    @Override
    public List<MessageThread> getStudentMessageThreads(Long studentUserId) {
        return messageThreadMapper.findStudentThreads(studentUserId);
    }

    @Override
    public MessageThread getMessageThreadById(Long id) {
        return messageThreadMapper.findById(id);
    }

    @Override
    @Transactional
    public MessageThread createMessageThread(MessageThread messageThread) {
        messageThreadMapper.insert(messageThread);
        return messageThread;
    }

    @Override
    @Transactional
    public MessageThread updateMessageThread(MessageThread messageThread) {
        messageThreadMapper.update(messageThread);
        return messageThread;
    }

    @Override
    @Transactional
    public void deleteMessageThread(Long id) {
        // 在删除主题之前，可能需要删除所有关联的消息
        // messageMapper.deleteByThreadId(id); // 如果有这样的方法
        messageThreadMapper.deleteById(id);
    }

    @Override
    public List<Message> getMessagesByThreadId(Long threadId) {
        return messageMapper.findByThreadId(threadId);
    }

    @Override
    public Message addMessage(Message message) {
        messageMapper.insert(message);
        return message;
    }

    @Override
    public void markMessagesAsRead(Long threadId, Long userId) {
        messageMapper.markMessagesAsRead(threadId, userId);
    }
} 