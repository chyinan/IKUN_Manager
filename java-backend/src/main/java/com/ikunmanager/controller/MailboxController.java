package com.ikunmanager.controller;

import com.ikunmanager.common.ApiResponse;
import com.ikunmanager.model.Message;
import com.ikunmanager.model.MessageThread;
import com.ikunmanager.service.MailboxService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mailbox")
public class MailboxController {

    @Autowired
    private MailboxService mailboxService;

    @GetMapping("/admin-threads")
    public ApiResponse<List<MessageThread>> getAdminThreads() {
        List<MessageThread> threads = mailboxService.getAdminMessageThreads();
        return ApiResponse.ok(threads);
    }

    @GetMapping("/student-threads/{studentUserId}")
    public ApiResponse<List<MessageThread>> getStudentThreads(@PathVariable Long studentUserId) {
        List<MessageThread> threads = mailboxService.getStudentMessageThreads(studentUserId);
        return ApiResponse.ok(threads);
    }

    @GetMapping("/threads/{threadId}")
    public ApiResponse<MessageThread> getThreadById(@PathVariable Long threadId) {
        MessageThread thread = mailboxService.getMessageThreadById(threadId);
        if (thread != null) {
            return ApiResponse.ok(thread);
        } else {
            return ApiResponse.error(404, "Message thread not found.");
        }
    }

    @PostMapping("/threads/create")
    public ApiResponse<MessageThread> createThread(@RequestBody MessageThread messageThread) {
        MessageThread newThread = mailboxService.createMessageThread(messageThread);
        return ApiResponse.ok(newThread);
    }

    @PutMapping("/threads/update")
    public ApiResponse<MessageThread> updateThread(@RequestBody MessageThread messageThread) {
        MessageThread updatedThread = mailboxService.updateMessageThread(messageThread);
        return ApiResponse.ok(updatedThread);
    }

    @DeleteMapping("/threads/delete/{id}")
    public ApiResponse<Void> deleteThread(@PathVariable Long id) {
        mailboxService.deleteMessageThread(id);
        return ApiResponse.ok(null);
    }

    @GetMapping("/messages/thread/{threadId}")
    public ApiResponse<List<Message>> getMessagesByThread(@PathVariable Long threadId) {
        List<Message> messages = mailboxService.getMessagesByThreadId(threadId);
        return ApiResponse.ok(messages);
    }

    @PostMapping("/messages/add")
    public ApiResponse<Message> addMessage(@RequestBody Message message) {
        Message newMessage = mailboxService.addMessage(message);
        return ApiResponse.ok(newMessage);
    }

    @PutMapping("/messages/mark-read/{threadId}/user/{userId}")
    public ApiResponse<Void> markMessagesAsRead(
            @PathVariable Long threadId, @PathVariable Long userId) {
        mailboxService.markMessagesAsRead(threadId, userId);
        return ApiResponse.ok(null);
    }
} 