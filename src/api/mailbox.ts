import request from '@/utils/request';
import type { ApiResponse } from '@/types/common';

// --- Enums and Types ---
export type ThreadStatus = 'open' | 'in_progress' | 'replied' | 'resolved' | 'rejected';
export type ReplierRole = 'student' | 'admin';

export interface MailboxThread {
  id: number;
  title: string;
  status: ThreadStatus;
  create_time: string;
  update_time: string;
  last_replier_name: string;
  last_replier_role: ReplierRole;
  student_name?: string; 
  student_username?: string;
}

export interface Message {
  id: number;
  thread_id: number;
  sender_user_id: number;
  content: string;
  create_time: string;
  sender_role: ReplierRole;
  sender_name: string;
  sender_avatar: string | null;
}

/**
 * [Student] Fetches all message threads for the current student.
 */
export function getStudentThreads(): Promise<ApiResponse<MailboxThread[]>> {
  return request.get('/mailbox/student-threads');
}

/**
 * [Admin] Fetches all message threads for the admin panel.
 * @param params - Optional query params for filtering/pagination
 */
export function getAdminThreads(params?: any): Promise<ApiResponse<MailboxThread[]>> {
  return request.get('/mailbox/admin-threads', { params });
}

/**
 * [Student] Creates a new message thread.
 * @param title - The thread title.
 * @param content - The initial message content.
 */
export function createThread(title: string, content: string): Promise<ApiResponse<MailboxThread & { id: number }>> {
  return request.post('/mailbox/threads', { title, content });
}

/**
 * Fetches all messages within a specific thread.
 * @param threadId - The ID of the thread.
 */
export function getMessagesInThread(threadId: number): Promise<ApiResponse<Message[]>> {
  return request.get(`/mailbox/threads/${threadId}`);
}

/**
 * Posts a reply to a specific thread.
 * @param threadId - The ID of the thread.
 * @param content - The reply content.
 */
export function replyToThread(threadId: number, content: string): Promise<ApiResponse<Message>> {
  return request.post(`/mailbox/threads/${threadId}/reply`, { content });
}

/**
 * [Admin] Updates the status of a message thread.
 * @param threadId - The ID of the thread.
 * @param status - The new status to set.
 */
export function updateThreadStatus(threadId: number, status: ThreadStatus): Promise<ApiResponse<any>> {
    return request.put(`/mailbox/threads/${threadId}/status`, { status });
} 