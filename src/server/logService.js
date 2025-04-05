const db = require('./db');

/**
 * 获取日志列表
 * @param {Object} params 查询参数 { page, pageSize, type, operator, startTime, endTime, keyword }
 * @returns {Promise<Array>} 日志列表
 */
async function getLogs(params = {}) {
  try {
    let query = 'SELECT * FROM system_log';
    const conditions = [];
    const values = [];

    if (params.type) {
      conditions.push('type = ?');
      values.push(params.type);
    }
    if (params.operator) {
      conditions.push('operator LIKE ?');
      values.push(`%${params.operator}%`);
    }
    if (params.startTime) {
      conditions.push('create_time >= ?');
      values.push(params.startTime);
    }
    if (params.endTime) {
      conditions.push('create_time <= ?');
      values.push(params.endTime);
    }
    if (params.keyword) {
      conditions.push('(content LIKE ? OR operation LIKE ?)');
      values.push(`%${params.keyword}%`);
      values.push(`%${params.keyword}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY create_time DESC'; // Default sort: newest first

    // Pagination
    const page = parseInt(params.page || 1);
    let pageSize = parseInt(params.pageSize || 100); // Default 100 logs per page
    let offset = (page - 1) * pageSize;

    // Validate pageSize and offset to prevent SQL injection through non-numeric values
    if (isNaN(pageSize) || pageSize <= 0) {
        pageSize = 100; // Fallback to default if invalid
    }
    if (isNaN(offset) || offset < 0) {
        offset = 0; // Fallback to 0 if invalid
    }

    // Directly interpolate validated numbers into the query for LIMIT/OFFSET
    query += ` LIMIT ${pageSize} OFFSET ${offset}`;

    // Note: `values` array no longer includes pageSize and offset
    console.log('Executing log query:', query, values);
    const logs = await db.query(query, values);
    console.log(`获取到 ${logs.length} 条日志记录`);
    return logs;
  } catch (error) {
    console.error('获取日志列表失败:', error);
    throw error; // Re-throw the error to be caught by the route handler
  }
}

/**
 * 删除单条日志
 * @param {number} id 日志ID
 * @returns {Promise<boolean>} 删除结果
 */
async function deleteLog(id) {
    try {
        if (!id) {
            throw new Error('日志ID不能为空');
        }
        const query = 'DELETE FROM system_log WHERE id = ?';
        const result = await db.query(query, [id]);
        // Correct access to affectedRows
        return result.affectedRows > 0;
    } catch (error) {
        console.error(`删除日志失败 (ID: ${id}):`, error);
        throw error;
    }
}

/**
 * 批量删除日志
 * @param {Array<number>} ids 日志ID数组
 * @returns {Promise<number>} 删除的记录数
 */
async function batchDeleteLog(ids) {
    try {
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            throw new Error('无效的日志ID列表');
        }
        // Ensure all IDs are numbers
        const numericIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));
        if (numericIds.length === 0) {
             throw new Error('ID列表为空或无效');
        }

        const placeholders = numericIds.map(() => '?').join(',');
        const query = `DELETE FROM system_log WHERE id IN (${placeholders})`;
        const result = await db.query(query, numericIds);
        // Correct access to affectedRows
        return result.affectedRows; // Returns the number of deleted rows
    } catch (error) {
        console.error('批量删除日志失败:', error);
        throw error;
    }
}


/**
 * 清空所有日志
 * @returns {Promise<boolean>} 清空结果
 */
async function clearLogs() {
  try {
    const query = 'DELETE FROM system_log'; // Be careful with this!
    await db.query(query);
    console.log('系统日志已清空');
    return true;
  } catch (error) {
    console.error('清空日志失败:', error);
    throw error;
  }
}

/**
 * 添加日志条目并广播
 * @param {Object} logData { type, operation, content, operator }
 * @returns {Promise<Object|null>} 新日志条目或 null
 */
async function addLog(logData) {
    let connection;
    try {
        const { type, operation, content, operator } = logData;
        if (!type || !operation || !content) {
            console.warn('尝试添加无效日志:', logData);
            return null; // Return null for invalid log data
        }

        connection = await db.getConnection(); // Get connection for transaction
        await connection.beginTransaction();

        // Check if content already starts with the operation word
        let finalContent = content;
        if (typeof content === 'string' && content.trim().startsWith(operation)) {
            console.warn(`Log content already starts with operation '${operation}'. Keeping original content.`);
            // Keep original content, don't prepend operation again
        } else {
            // Prepend operation if it's not already there
            finalContent = `${operation} ${content}`;
        }

        const insertQuery = `
            INSERT INTO system_log (type, operation, content, operator)
            VALUES (?, ?, ?, ?)
        `;
        // Correct access to insertId
        const [insertResult] = await connection.query(insertQuery, [type, operation, finalContent, operator || 'system']);
        const newLogId = insertResult.insertId;

        if (!newLogId) {
            throw new Error('日志插入后未能获取ID');
        }

        // Fetch the complete log entry to get the database-generated timestamp
        const selectQuery = 'SELECT * FROM system_log WHERE id = ?';
        // Correct access to rows
        const [rows] = await connection.query(selectQuery, [newLogId]);
        const newLogEntry = rows[0];

        await connection.commit(); // Commit transaction

        if (newLogEntry && typeof global.broadcastLog === 'function') {
             // Format create_time before broadcasting if necessary
            // newLogEntry.createTime = new Date(newLogEntry.create_time).toLocaleString(); // Example formatting
            global.broadcastLog(newLogEntry);
        } else {
            console.warn('新日志条目未找到或 broadcastLog 函数不可用', newLogEntry);
        }

        return newLogEntry; // Return the full log entry

    } catch (error) {
        if (connection) await connection.rollback(); // Rollback on error
        console.error('添加日志失败:', error);
        // Don't throw error here usually, as logging failure shouldn't stop the main operation
        return null;
    } finally {
        if (connection) connection.release(); // Always release connection
    }
}


module.exports = {
  getLogs,
  deleteLog,
  batchDeleteLog,
  clearLogs,
  addLog
}; 