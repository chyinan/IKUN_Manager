const db = require('./db');
const logService = require('./logService'); // Assuming you have a log service

/**
 * [Student] Get all published announcements.
 * @param {object} params - Optional parameters for pagination (e.g., page, pageSize).
 * @returns {Promise<Array>} - A list of published announcements.
 */
async function getPublishedAnnouncements(params = {}) {
  try {
    console.log('[AnnouncementService] Fetching published announcements for students.');
    
    // Base query to get published announcements, ordered by pin status and then publish date
    let query = `
      SELECT 
        id, 
        title, 
        content, 
        author_name, 
        is_pinned,
        DATE_FORMAT(published_at, '%Y-%m-%d %H:%i') as published_at
      FROM 
        announcements
      WHERE 
        status = 'published'
      ORDER BY 
        is_pinned DESC, 
        published_at DESC
    `;

    const values = [];

    // Add pagination if provided
    if (params.page && params.pageSize) {
      const offset = (parseInt(params.page, 10) - 1) * parseInt(params.pageSize, 10);
      query += ' LIMIT ?, ?';
      values.push(offset, parseInt(params.pageSize, 10));
    }

    const announcements = await db.query(query, values);
    console.log(`[AnnouncementService] Found ${announcements.length} published announcements.`);
    return announcements;

  } catch (error) {
    console.error('[AnnouncementService] Error fetching published announcements:', error);
    // Optionally log this error to your database log
    await logService.addLogEntry({
        type: 'error',
        operation: '获取通知失败',
        content: `获取已发布通知时出错: ${error.message}`,
        operator: 'system'
    });
    throw error; // Re-throw the error to be handled by the route
  }
}

/**
 * [Admin] Get all announcements (published and drafts).
 * @param {object} params - Optional parameters for pagination and filtering.
 * @returns {Promise<Array>} - A list of all announcements.
 */
async function getAllAnnouncements(params = {}) {
  try {
    console.log('[AnnouncementService] Fetching ALL announcements for admin.');
    
    let query = `
      SELECT 
        id, 
        title, 
        author_name, 
        status, 
        is_pinned,
        DATE_FORMAT(published_at, '%Y-%m-%d %H:%i') as published_at,
        DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i') as updated_at
      FROM 
        announcements
      ORDER BY 
        created_at DESC
    `;

    // Simple pagination for admin view
    const values = [];
    if (params.page && params.pageSize) {
      const offset = (parseInt(params.page, 10) - 1) * parseInt(params.pageSize, 10);
      query += ' LIMIT ?, ?';
      values.push(offset, parseInt(params.pageSize, 10));
    }

    const announcements = await db.query(query, values);
    console.log(`[AnnouncementService] Found ${announcements.length} total announcements.`);
    return announcements;

  } catch (error) {
    console.error('[AnnouncementService] Error fetching all announcements for admin:', error);
    await logService.addLogEntry({
        type: 'error',
        operation: '获取所有通知失败',
        content: `后台获取所有通知时出错: ${error.message}`,
        operator: 'system'
    });
    throw error;
  }
}

/**
 * [Admin] Create a new announcement.
 * @param {object} announcementData - The data for the new announcement.
 * @param {string} operator - The username of the admin performing the action.
 * @returns {Promise<object>} - The newly created announcement object.
 */
async function createAnnouncement(announcementData, operator) {
  try {
    const { title, content, author_name, status, is_pinned } = announcementData;
    console.log(`[AnnouncementService] Admin '${operator}' creating announcement:`, title);

    if (!title || !content) {
      throw new Error('标题和内容不能为空');
    }

    const query = `
      INSERT INTO announcements (title, content, author_name, status, is_pinned, published_at) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    // Set published_at only if status is 'published'
    const published_at = (status === 'published') ? new Date() : null;

    const [result] = await db.query(query, [title, content, author_name, status, is_pinned, published_at]);
    const newId = result.insertId;

    await logService.addLogEntry({
      type: 'database',
      operation: '新增通知',
      content: `${operator} 创建了通知: "${title}" (ID: ${newId})`,
      operator: operator
    });

    return { id: newId, ...announcementData, published_at };

  } catch (error) {
    console.error('[AnnouncementService] Error creating announcement:', error);
    await logService.addLogEntry({
        type: 'error',
        operation: '新增通知失败',
        content: `创建通知 "${announcementData.title}" 时出错: ${error.message}`,
        operator: operator
    });
    throw error;
  }
}

/**
 * [Admin] Update an existing announcement.
 * @param {number} id - The ID of the announcement to update.
 * @param {object} announcementData - The new data for the announcement.
 * @param {string} operator - The username of the admin.
 * @returns {Promise<object>} - The updated announcement object.
 */
async function updateAnnouncement(id, announcementData, operator) {
  try {
    const { title, content, author_name, status, is_pinned } = announcementData;
    console.log(`[AnnouncementService] Admin '${operator}' updating announcement ID: ${id}`);
    
    // Fetch the current status to see if we are publishing a draft
    const [existing] = await db.query('SELECT status, published_at FROM announcements WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      throw new Error('找不到要更新的通知');
    }

    const updateFields = [];
    const values = [];
    
    if (title !== undefined) { updateFields.push('title = ?'); values.push(title); }
    if (content !== undefined) { updateFields.push('content = ?'); values.push(content); }
    if (author_name !== undefined) { updateFields.push('author_name = ?'); values.push(author_name); }
    if (status !== undefined) { updateFields.push('status = ?'); values.push(status); }
    if (is_pinned !== undefined) { updateFields.push('is_pinned = ?'); values.push(is_pinned); }
    
    // If a draft is being published now, set the published_at date.
    if (status === 'published' && existing[0].status === 'draft') {
      updateFields.push('published_at = ?');
      values.push(new Date());
    }

    if (updateFields.length === 0) {
      return { message: "没有提供可更新的字段" };
    }

    const query = `UPDATE announcements SET ${updateFields.join(', ')} WHERE id = ?`;
    values.push(id);
    
    await db.query(query, values);

    await logService.addLogEntry({
      type: 'database',
      operation: '更新通知',
      content: `${operator} 更新了通知: (ID: ${id})`,
      operator: operator
    });
    
    // Return the updated object by fetching it again (or just returning the input)
    return { id, ...announcementData };

  } catch (error) {
    console.error(`[AnnouncementService] Error updating announcement ${id}:`, error);
    await logService.addLogEntry({
        type: 'error',
        operation: '更新通知失败',
        content: `更新通知 (ID: ${id}) 时出错: ${error.message}`,
        operator: operator
    });
    throw error;
  }
}

/**
 * [Admin] Delete an announcement.
 * @param {number} id - The ID of the announcement to delete.
 * @param {string} operator - The username of the admin.
 * @returns {Promise<boolean>} - True if deletion was successful.
 */
async function deleteAnnouncement(id, operator) {
  try {
    console.log(`[AnnouncementService] Admin '${operator}' deleting announcement ID: ${id}`);
    const query = 'DELETE FROM announcements WHERE id = ?';
    const [result] = await db.query(query, [id]);

    if (result.affectedRows === 0) {
      console.warn(`[AnnouncementService] Announcement ID ${id} not found for deletion.`);
      return false;
    }

    await logService.addLogEntry({
      type: 'database',
      operation: '删除通知',
      content: `${operator} 删除了通知 (ID: ${id})`,
      operator: operator
    });

    return true;

  } catch (error) {
    console.error(`[AnnouncementService] Error deleting announcement ${id}:`, error);
    await logService.addLogEntry({
        type: 'error',
        operation: '删除通知失败',
        content: `删除通知 (ID: ${id}) 时出错: ${error.message}`,
        operator: operator
    });
    throw error;
  }
}

// TODO: Add functions for admin (create, update, delete, get all) in the next phase.

module.exports = {
  getPublishedAnnouncements,
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
}; 