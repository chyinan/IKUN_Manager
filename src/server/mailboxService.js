const db = require('./db');
const logService = require('./logService');

async function createThread(studentUserId, title, content) {
  const connection = await db.getConnection();
  try {
    if (!studentUserId || !title || !content) {
      throw new Error('学生ID、标题和内容不能为空');
    }

    await connection.beginTransaction();

    const threadSql = 'INSERT INTO message_threads (student_user_id, title, status) VALUES (?, ?, ?)';
    const [threadResult] = await connection.query(threadSql, [studentUserId, title, 'open']);
    const threadId = threadResult.insertId;

    if (!threadId) {
      throw new Error('创建对话主题失败');
    }

    const messageSql = 'INSERT INTO messages (thread_id, sender_user_id, content) VALUES (?, ?, ?)';
    await connection.query(messageSql, [threadId, studentUserId, content]);
    
    await connection.commit();

    logService.addLogEntry({
      type: 'mailbox',
      operation: '创建主题',
      content: `学生 (用户ID: ${studentUserId}) 创建了新的信箱主题: "${title}" (主题ID: ${threadId})`,
      operator: `User:${studentUserId}`
    });
    
    return { id: threadId, student_user_id: studentUserId, title, status: 'open' };

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('[MailboxService] Error creating thread:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

async function replyToThread(threadId, senderUserId, content) {
    console.log('--- [IKUN DEBUG] Running latest mailboxService.js code from 2025-06-07 ---');
    const connection = await db.getConnection();
    try {
        if (!threadId || !senderUserId || !content) {
            throw new Error('主题ID、发送者ID和内容不能为空');
        }

        await connection.beginTransaction();

        const [[sender], [thread]] = await Promise.all([
            connection.query('SELECT role FROM user WHERE id = ?', [senderUserId]),
            connection.query('SELECT student_user_id, status FROM message_threads WHERE id = ?', [threadId])
        ]);

        if (!sender) throw new Error('发送用户不存在');
        if (!thread) throw new Error('对话主题不存在');

        const messageSql = 'INSERT INTO messages (thread_id, sender_user_id, content) VALUES (?, ?, ?)';
        const [messageResult] = await connection.query(messageSql, [threadId, senderUserId, content]);
        const newMessageId = messageResult.insertId;

        // No more variables, determine status directly in SQL to be safe.
        const updateThreadSql = `
            UPDATE message_threads 
            SET status = CASE 
                WHEN (SELECT role FROM user WHERE id = ?) = 'admin' THEN 'replied'
                ELSE 'open' 
            END 
            WHERE id = ?
        `;
        await connection.query(updateThreadSql, [senderUserId, threadId]);

        await connection.commit();

        logService.addLogEntry({
            type: 'mailbox',
            operation: '回复消息',
            content: `用户 (ID: ${senderUserId}) 在主题 (ID: ${threadId}) 中发布了新回复`,
            operator: `User:${senderUserId}`
        });

        return { id: newMessageId, thread_id: threadId, sender_user_id: senderUserId, content };

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('[MailboxService] Error replying to thread:', error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

async function updateThreadStatus(threadId, newStatus, operatorUsername) {
    try {
        const allowedStatus = ['open', 'in_progress', 'replied', 'resolved', 'rejected'];
        if (!allowedStatus.includes(newStatus)) {
            throw new Error(`无效的状态: ${newStatus}`);
        }
        console.log(`[MailboxService] Updating thread ${threadId} to status '${newStatus}' by ${operatorUsername}`);

        const sql = 'UPDATE message_threads SET status = ? WHERE id = ?';
        const result = await db.query(sql, [newStatus, threadId]);

        if (result.affectedRows > 0) {
            logService.addLogEntry({
                type: 'mailbox',
                operation: '更新状态',
                content: `管理员 '${operatorUsername}' 将主题 (ID: ${threadId}) 的状态更新为 '${newStatus}'`,
                operator: operatorUsername
            });
            return true;
        } else {
            console.warn(`[MailboxService] Attempted to update status for non-existent thread ID: ${threadId}`);
            return false;
        }
    } catch (error) {
        console.error(`[MailboxService] Error updating thread status for thread ${threadId}:`, error);
        throw error;
    }
}

async function getThreadsForStudent(studentUserId) {
    try {
        const sql = `
            SELECT 
                t.id,
                t.title,
                t.status,
                t.create_time AS created_at,
                t.update_time AS last_reply_at,
                (SELECT m.content FROM messages m WHERE m.thread_id = t.id ORDER BY m.create_time DESC LIMIT 1) as last_message_content,
                (SELECT COUNT(*) FROM messages m WHERE m.thread_id = t.id AND m.is_read = 0 AND m.sender_user_id != ?) as unread_count
            FROM message_threads t
            WHERE t.student_user_id = ?
            ORDER BY t.update_time DESC;
        `;
        
        const threads = await db.query(sql, [studentUserId, studentUserId]);
        
        return Array.isArray(threads) ? threads : [];
    } catch (error) {
        console.error('[MailboxService] Error getting threads for student:', error);
        throw error;
    }
}

async function getThreadsForAdmin(params = {}) {
    try {
        const sql = `
            SELECT 
                t.id, 
                t.title, 
                t.status,
                u.display_name as student_name,
                u.username as student_username,
                t.create_time as created_at,
                t.update_time as last_reply_at,
                (SELECT COUNT(*) FROM messages m WHERE m.thread_id = t.id AND m.is_read = 0 AND m.sender_user_id = t.student_user_id) as unread_count
            FROM message_threads t
            JOIN user u ON t.student_user_id = u.id
            ORDER BY t.update_time DESC, t.create_time DESC
        `;
        const threads = await db.query(sql);
        return Array.isArray(threads) ? threads : [];
    } catch (error) {
        console.error('[MailboxService] Error getting threads for admin:', error);
        throw error;
    }
}

async function getMessagesInThread(threadId, requesterUserId) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const getMessagesSql = `
            SELECT 
                m.id,
                m.thread_id,
                m.sender_user_id,
                m.content,
                m.create_time,
                u.role as sender_role,
                u.display_name as sender_name,
                u.avatar as sender_avatar
            FROM messages m
            JOIN user u ON m.sender_user_id = u.id
            WHERE m.thread_id = ?
            ORDER BY m.create_time ASC
        `;
        const [messages] = await connection.query(getMessagesSql, [threadId]);

        const markAsReadSql = `
            UPDATE messages 
            SET is_read = 1 
            WHERE thread_id = ? AND sender_user_id != ? AND is_read = 0
        `;
        await connection.query(markAsReadSql, [threadId, requesterUserId]);

        await connection.commit();
        
        messages.forEach(msg => {
            if (msg.sender_avatar) {
                msg.sender_avatar = `/uploads/${msg.sender_avatar}`;
            }
        });

        return messages;

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('[MailboxService] Error getting messages in thread:', error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

module.exports = {
  createThread,
  replyToThread,
  getThreadsForStudent,
  getThreadsForAdmin,
  getMessagesInThread,
  updateThreadStatus,
};