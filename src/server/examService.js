// 考试服务
const db = require('./db');
const logService = require('./logService'); // Ensure logService is imported
const dayjs = require('dayjs');

/**
 * 获取考试统计数据
 * @returns {Promise<Object>} 统计数据
 */
async function getExamStats() {
  try {
    // 获取考试总数
    const totalQuery = 'SELECT COUNT(*) as total FROM exam';
    const totalResult = await db.query(totalQuery);
    const total = totalResult[0].total;

    // 获取已完成考试数量
    const completedQuery = "SELECT COUNT(*) as count FROM exam WHERE status = 2"; // 2表示已结束
    const completedResult = await db.query(completedQuery);
    const completedCount = completedResult[0].count;

    // 获取进行中考试数量
    const inProgressQuery = "SELECT COUNT(*) as count FROM exam WHERE status = 1"; // 1表示进行中
    const inProgressResult = await db.query(inProgressQuery);
    const inProgressCount = inProgressResult[0].count;

    // 获取未开始考试数量
    const upcomingQuery = "SELECT COUNT(*) as count FROM exam WHERE status = 0"; // 0表示未开始
    const upcomingResult = await db.query(upcomingQuery);
    const upcomingCount = upcomingResult[0].count;

    // 获取考试类型分布
    const typeQuery = `
      SELECT 
        exam_type as type, 
        COUNT(*) as count 
      FROM 
        exam 
      GROUP BY 
        exam_type
    `;
    const typeDistribution = await db.query(typeQuery);

    return {
      total,
      completedCount,
      inProgressCount,
      upcomingCount,
      typeDistribution
    };
  } catch (error) {
    console.error('获取考试统计数据失败:', error);
    throw error;
  }
}

/**
 * 获取考试列表
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 包含考试列表和总数的对象
 */
async function getExamList(params = {}) {
  try {
    // --- 构建查询条件和基础查询语句 ---
    let baseQuery = `
      SELECT
        e.id,
        e.exam_name,
        e.exam_type,
        DATE_FORMAT(e.exam_date, '%Y-%m-%d %H:%i:%s') as exam_date,
        DATE_FORMAT(DATE_ADD(e.exam_date, INTERVAL e.duration MINUTE), '%Y-%m-%d %H:%i:%s') as end_time,
        e.duration,
        e.subjects,
        e.status,
        e.remark,
        e.create_time,
        GROUP_CONCAT(DISTINCT c.id ORDER BY c.id) as class_ids,
        GROUP_CONCAT(DISTINCT c.class_name ORDER BY c.id) as class_names,
        GROUP_CONCAT(DISTINCT s.id ORDER BY s.id) as subject_ids
      FROM
        exam e
      LEFT JOIN
        exam_class_link ecl ON e.id = ecl.exam_id
      LEFT JOIN
        class c ON ecl.class_id = c.id
      LEFT JOIN
        exam_subject es ON e.id = es.exam_id
      LEFT JOIN
        subject s ON es.subject_id = s.id
    `;
    // 用于计算总数的查询语句（不包含 LIMIT 和 ORDER BY）
    let countQuery = 'SELECT COUNT(DISTINCT e.id) as total FROM exam e';

    const conditions = [];
    const values = []; // 用于 baseQuery 的参数
    const countValues = []; // 用于 countQuery 的参数

    // --- 构建 WHERE 条件 (同时添加到 baseQuery 和 countQuery) ---
    if (params.keyword) {
      conditions.push('(e.exam_name LIKE ? OR e.exam_type LIKE ? OR e.subjects LIKE ?)');
      const keywordLike = `%${params.keyword}%`;
      values.push(keywordLike, keywordLike, keywordLike);
      countValues.push(keywordLike, keywordLike, keywordLike);
    }
    if (params.examType) {
      conditions.push('e.exam_type = ?');
      values.push(params.examType);
      countValues.push(params.examType);
    }
    // 确保 status 是有效值 (0, 1, 2) 才加入条件
    if (params.status !== undefined && params.status !== null && params.status !== '') {
       const statusNum = parseInt(params.status, 10);
       // 确保转换后是数字才加入条件
       if (!isNaN(statusNum)) {
         conditions.push('e.status = ?');
         values.push(statusNum);
         countValues.push(statusNum);
       }
    }
    if (params.startDate) {
      conditions.push('DATE(e.exam_date) >= ?');
      values.push(params.startDate);
      countValues.push(params.startDate);
    }
    if (params.endDate) {
      conditions.push('DATE(e.exam_date) <= ?');
      values.push(params.endDate);
      countValues.push(params.endDate);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      baseQuery += whereClause;
      countQuery += whereClause;
    }

    // --- 添加 GROUP BY ---
    baseQuery += ' GROUP BY e.id';

    // --- 查询总数 ---
    console.log('Executing Count Query:', countQuery, countValues); // 调试日志
    const totalResult = await db.query(countQuery, countValues);
    const total = totalResult[0].total;

    // --- 添加排序 ---
    baseQuery += ' ORDER BY e.exam_date DESC'; // 或者其他排序逻辑

    // --- 添加分页 (直接构建 LIMIT 子句，不使用占位符) ---
    if (params.page && params.pageSize) {
      const page = parseInt(params.page, 10);
      const pageSize = parseInt(params.pageSize, 10);

      // 验证 page 和 pageSize 是有效的正整数
      if (Number.isInteger(page) && page > 0 && Number.isInteger(pageSize) && pageSize > 0) {
        const offset = (page - 1) * pageSize;
        // 直接将验证后的整数值拼接到 SQL 字符串
        baseQuery += ` LIMIT ${offset}, ${pageSize}`;
        // 注意：不再将 offset 和 pageSize 添加到 values 数组中
      } else {
        // 如果分页参数无效，可以选择记录警告或应用默认限制，这里仅记录警告
        console.warn(`Received invalid pagination parameters: page=${params.page}, pageSize=${params.pageSize}. Skipping LIMIT clause.`);
      }
    }

    // --- 执行列表查询 ---
    // 此时 'values' 数组只包含 WHERE 子句对应的参数
    console.log('Executing List Query:', baseQuery, values); // 调试日志
    const exams = await db.query(baseQuery, values); // 传递 baseQuery 和仅包含 WHERE 参数的 values

    console.log(`获取到 ${exams.length} 条考试记录，总计 ${total} 条`);
    // 返回包含列表和总数的对象
    return { list: exams, total: total };

  } catch (error) {
    console.error('获取考试列表失败:', error);
    // 在错误时打印最终尝试执行的 SQL 和参数，帮助调试
    console.error('Failed Query String:', baseQuery); // 打印最终构建的 SQL 字符串
    console.error('Failed Query Params (for WHERE):', values); // 打印传递给 WHERE 子句的参数
    // 向上抛出错误，让路由处理函数捕获并返回 500
    throw error;
  }
}

/**
 * 获取考试详情
 * @param {number} id 考试ID
 * @returns {Promise<Object>} 考试详情
 */
async function getExamDetail(id) {
  try {
    // 获取考试基本信息
    const examQuery = `
      SELECT 
        e.id, 
        e.exam_name, 
        e.exam_type, 
        DATE_FORMAT(e.exam_date, '%Y-%m-%d %H:%i:%s') as exam_date,
        DATE_FORMAT(DATE_ADD(e.exam_date, INTERVAL e.duration MINUTE), '%Y-%m-%d %H:%i:%s') as end_time,
        e.duration,
        e.subjects,
        e.status, 
        e.remark, 
        e.create_time,
        GROUP_CONCAT(DISTINCT es.subject_id ORDER BY es.subject_id) as subject_ids,
        GROUP_CONCAT(DISTINCT ecl.class_id ORDER BY ecl.class_id) as class_ids,
        GROUP_CONCAT(DISTINCT c.class_name ORDER BY c.id) as class_names
      FROM 
        exam e
      LEFT JOIN 
        exam_subject es ON e.id = es.exam_id
      LEFT JOIN
        exam_class_link ecl ON e.id = ecl.exam_id
      LEFT JOIN
        class c ON ecl.class_id = c.id
      WHERE 
        e.id = ?
      GROUP BY
        e.id
    `;
    
    const exams = await db.query(examQuery, [id]);
    const exam = exams[0];
    
    if (!exam) {
      return null;
    }
    
    // 将逗号分隔的字符串转换为ID数组
    exam.subject_ids = exam.subject_ids ? exam.subject_ids.split(',').map(Number) : [];
    exam.class_ids = exam.class_ids ? exam.class_ids.split(',').map(Number) : [];
    exam.class_names = exam.class_names ? exam.class_names.split(',') : [];

    return exam;
  } catch (error) {
    console.error(`获取考试详情失败 (ID: ${id}):`, error);
    throw error;
  }
}

/**
 * 更新考试信息
 * @param {number} id 考试ID
 * @param {Object} examData 考试更新数据 { exam_name, exam_type, start_time, end_time, subjects, classIds, ... }
 * @param {string} operator 操作人
 * @returns {Promise<Object>} 更新后的考试信息
 */
async function updateExam(id, examData, operator) {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const { subjects, classIds, start_time, end_time, ...examInfo } = examData;

    // 1. 更新 exam 主表
    // 移除 'end_time'，因为它不是一个真实的列。
    // 'exam_date' 和 'duration' 将被特殊处理。
    const allowedFields = ['exam_name', 'exam_type', 'status', 'remark'];
    const fieldsToUpdate = [];
    const values = [];

    // 动态计算 duration
    if (start_time && end_time) {
        const start = dayjs(start_time);
        const end = dayjs(end_time);
        if (start.isValid() && end.isValid() && end.isAfter(start)) {
            fieldsToUpdate.push('duration = ?');
            values.push(end.diff(start, 'minute'));
        } else {
            // 如果日期无效或逻辑错误，可以选择抛出错误
            throw new Error('无效的开始或结束时间');
        }
    }
    
    // 将 start_time 映射到 exam_date
    if (start_time) {
        fieldsToUpdate.push('exam_date = ?');
        values.push(start_time);
    }

    for (const field of allowedFields) {
      if (examInfo[field] !== undefined) {
        fieldsToUpdate.push(`${field} = ?`);
        values.push(examInfo[field]);
      }
    }
    
    if (fieldsToUpdate.length > 0) {
        const updateExamQuery = `UPDATE exam SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
        values.push(id);
        await connection.query(updateExamQuery, values);
    }
    
    // 2. 更新 exam_subject 关联表
    // 先删除旧的关联
    await connection.query('DELETE FROM exam_subject WHERE exam_id = ?', [id]);
    // 插入新的关联
    if (subjects && subjects.length > 0) {
        const subjectLinks = subjects.map(subjectId => [id, subjectId]);
        await connection.query('INSERT INTO exam_subject (exam_id, subject_id) VALUES ?', [subjectLinks]);
    }

    // 3. 更新 exam_class_link 关联表
    // 先删除旧的关联
    await connection.query('DELETE FROM exam_class_link WHERE exam_id = ?', [id]);
    // 插入新的关联
    if (classIds && classIds.length > 0) {
        const classLinks = classIds.map(classId => [id, classId]);
        await connection.query('INSERT INTO exam_class_link (exam_id, class_id) VALUES ?', [classLinks]);
    }

    // 4. 更新 exam 表中冗余的 subjects 字符串字段
    if (subjects && subjects.length > 0) {
        // 根据 subjects (ID数组) 查询 subject_name
        const [subjectNames] = await connection.query(
            'SELECT subject_name FROM subject WHERE id IN (?) ORDER BY FIELD(id, ?)', 
            [subjects, subjects]
        );
        const subjectNamesString = subjectNames.map(s => s.subject_name).join(',');
        // 更新 exam 表
        await connection.query('UPDATE exam SET subjects = ? WHERE id = ?', [subjectNamesString, id]);
    } else {
        // 如果没有科目，则设置为空字符串 `''` 而不是 `NULL`
        await connection.query("UPDATE exam SET subjects = '' WHERE id = ?", [id]);
    }

    await connection.commit();
    
    // 记录日志
    await logService.addLogEntry({
        type: 'database',
        operation: '更新',
        content: `${operator} 更新了考试 (ID: ${id}) 的信息。`,
        operator: operator
    });

    return getExamDetail(id);

  } catch (error) {
    await connection.rollback();
    console.error(`[examService] 更新考试失败 (ID: ${id}):`, error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * 获取考试类型选项
 * @returns {Promise<Array>} 考试类型列表
 */
async function getExamTypeOptions() {
  try {
    const query = `
      SELECT DISTINCT exam_type 
      FROM exam 
      ORDER BY exam_type
    `;
    
    const results = await db.query(query);
    return results.map(item => item.exam_type);
  } catch (error) {
    console.error('获取考试类型选项失败:', error);
    throw error;
  }
}

/**
 * 获取科目选项
 * @returns {Promise<Array>} 科目列表
 */
async function getSubjectOptions() {
  try {
    const query = `
      SELECT subject_name, subject_code
      FROM subject
      ORDER BY subject_name
    `;
    
    return await db.query(query);
  } catch (error) {
    console.error('获取科目选项失败:', error);
    throw error;
  }
}

/**
 * 获取所有不同的考试类型
 * @returns {Promise<Array<string>>} 包含所有不同考试类型的数组
 */
async function getDistinctExamTypes() {
  try {
    const query = 'SELECT DISTINCT exam_type FROM exam WHERE exam_type IS NOT NULL ORDER BY exam_type ASC';
    const results = await db.query(query);
    // 从结果对象数组中提取 exam_type 字符串
    const types = results.map(row => row.exam_type);
    console.log('获取到不同的考试类型:', types);
    return types;
  } catch (error) {
    console.error('获取不同考试类型失败:', error);
    await logService.addLogEntry('database', 'error', `获取不同考试类型失败: ${error.message}`, 'System');
    throw error; // Re-throw the error to be caught by the route handler
  }
}

/**
 * 新增考试
 * @param {Object} examData 考试数据 { exam_name, exam_type, exam_date, duration, subjects, status, remark }
 * @param {string} operator 操作人
 * @returns {Promise<Object>} 新增的考试对象 (包含ID)
 */
async function addExam(examData, operator) {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // 1. 准备 exam 主表数据
    // 将前端的 start_time 映射到数据库的 exam_date
    const examRecord = {
      exam_name: examData.exam_name,
      exam_type: examData.exam_type,
      exam_date: examData.start_time,
      end_time: examData.end_time,
      duration: examData.duration,
      status: examData.status,
      remark: examData.description
    };
    
    // 2. 插入 exam 主表记录
    const insertExamQuery = 'INSERT INTO exam SET ?';
    const [result] = await connection.query(insertExamQuery, examRecord);
    const newExamId = result.insertId;

    // 3. 插入 exam_subject 关联记录
    if (examData.subjects && examData.subjects.length > 0) {
      const subjectLinks = examData.subjects.map(subjectId => [newExamId, subjectId]);
      const insertSubjectsQuery = 'INSERT INTO exam_subject (exam_id, subject_id) VALUES ?';
      await connection.query(insertSubjectsQuery, [subjectLinks]);
    }

    // 4. 插入 exam_class_link 关联记录
    if (examData.classIds && examData.classIds.length > 0) {
      const classLinks = examData.classIds.map(classId => [newExamId, classId]);
      const insertClassesQuery = 'INSERT INTO exam_class_link (exam_id, class_id) VALUES ?';
      await connection.query(insertClassesQuery, [classLinks]);
    }

    await connection.commit();
    
    // 记录日志
    await logService.addLogEntry({
        type: 'database',
        operation: '新增',
        content: `${operator} 新增了考试: ${examData.exam_name} (ID: ${newExamId})`,
        operator: operator
    });

    return getExamDetail(newExamId);
    
  } catch (error) {
    await connection.rollback();
    console.error('[examService] 新增考试失败:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * 删除考试
 * @param {number} id 考试ID
 * @param {string} operator 操作人
 * @returns {Promise<boolean>} 是否删除成功
 */
async function deleteExam(id, operator) {
  let connection;
  try {
    if (!id || isNaN(id)) {
      throw new Error('无效的考试ID');
    }
    
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Fetch exam_name and exam_type for logging before deletion
    const [examRows] = await connection.query('SELECT exam_name, exam_type FROM exam WHERE id = ?', [id]);
    const exam_name = (examRows && examRows.length > 0) ? examRows[0].exam_name : '未知考试';
    const exam_type = (examRows && examRows.length > 0) ? examRows[0].exam_type : '未知类型'; // Get exam type

    const query = 'DELETE FROM exam WHERE id = ?';
    const [result] = await connection.query(query, [id]);
    const success = result.affectedRows > 0;
    
    await connection.commit();
    console.log(`[examService] 删除考试操作 (ID: ${id}, 名称: ${exam_name}) 已成功提交到数据库.`);

    if (success) {
      await logService.addLogEntry({
        type: 'database',
        operation: '删除考试',
        content: `${operator} 删除了考试 "${exam_name}" (类型: ${exam_type}, ID: ${id})`,
        operator: operator
      });
      console.log(`[examService] 删除考试日志已记录.`);
    } else {
       console.log(`[examService] 尝试删除考试 (ID: ${id}) 未影响任何行，但事务已提交。`);
    }
    return success;
  } catch (error) {
    if (connection) await connection.rollback();
    console.error(`[examService] 删除考试数据库操作失败 (ID: ${id}):`, error);
    const examNameToLog = (typeof exam_name !== 'undefined') ? exam_name : `ID ${id}`;
    await logService.addLogEntry({
        type: 'database',
        operation: '删除考试失败',
        content: `${operator || '系统'} 尝试删除考试 "${examNameToLog}" (类型: ${exam_type || '未知'}) 失败: ${error.message}`,
        operator: operator || 'system'
    });
    throw error; 
  } finally {
    if (connection) connection.release();
  }
}

module.exports = {
  getExamStats,
  getExamList,
  getExamDetail,
  getExamTypeOptions,
  getSubjectOptions,
  getDistinctExamTypes,
  updateExam,
  addExam,
  deleteExam
}; 