import request from '@/utils/request';

// === Thread Interfaces ===
export interface Thread {
  id: number;
  title: string;
  status: 'open' | 'replied_by_admin' | 'replied_by_student' | 'closed';
  created_at: string;
  last_reply_at: string;
  unread_count?: number; // Optional, for student view
  student_name?: string; // Optional, for admin view
  student_username?: string; // Optional, for admin view
}

export interface CreateThreadData {
  title: string;
  content: string;
}

// === Message Interfaces ===
export interface Message {
    id: number;
    thread_id: number;
    sender_user_id: number;
    content: string;
    created_at: string;
    sender_role: 'student' | 'admin';
    sender_name: string;
    sender_avatar: string | null;
}

export interface ReplyData {
    content: string;
}

/**
 * [Student] Fetches all message threads for the current student.
 */
export function getStudentThreads() {
  return request<Thread[]>({
    url: '/mailbox/student-threads',
    method: 'get',
  });
}

/**
 * [Admin] Fetches all message threads for the admin panel.
 */
export function getAdminThreads() {
  return request<Thread[]>({
    url: '/mailbox/admin-threads',
    method: 'get',
  });
}

/**
 * [Student] Creates a new message thread.
 * @param data - The thread title and initial message content.
 */
export function createThread(data: CreateThreadData) {
  return request({
    url: '/mailbox/threads',
    method: 'post',
    data,
  });
}

/**
 * Fetches all messages within a specific thread.
 * @param threadId - The ID of the thread.
 */
export function getMessages(threadId: number) {
  return request<Message[]>({
    url: `/mailbox/threads/${threadId}`,
    method: 'get',
  });
}

/**
 * Posts a reply to a specific thread.
 * @param threadId - The ID of the thread.
 * @param data - The reply content.
 */
export function postReply(threadId: number, data: ReplyData) {
  return request({
    url: `/mailbox/threads/${threadId}/reply`,
    method: 'post',
    data,
  });
} 