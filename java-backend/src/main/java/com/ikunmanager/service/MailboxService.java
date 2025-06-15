package com.ikunmanager.service;

import com.ikunmanager.model.Message;
import com.ikunmanager.model.MessageThread;

import java.util.List;

public interface MailboxService {
    List<MessageThread> getAdminMessageThreads();
    List<MessageThread> getStudentMessageThreads(Long studentUserId);
    MessageThread getMessageThreadById(Long id);
    MessageThread createMessageThread(MessageThread messageThread);
    MessageThread updateMessageThread(MessageThread messageThread);
    void deleteMessageThread(Long id);
    List<Message> getMessagesByThreadId(Long threadId);
    Message addMessage(Message message);
    void markMessagesAsRead(Long threadId, Long userId);
} 