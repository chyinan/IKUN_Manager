// src/server/examService.js (Final Corrected Version)

const db = require('./db');
const logService = require('./logService');
const dayjs = require('dayjs');

/**
 * 获取考试统计数据 (动态计算)
 * @returns {Promise<Object>} 统计数据
 */
async function getExamStats() {
  try {
    const allExamsQuery = 'SELECT exam_date, duration, exam_type FROM exam';
    const allExams = await db.query(allExamsQuery);
    const total = allExams.length;

    let completedCount = 0;
    let inProgressCount = 0;
    let upcomingCount = 0;
    const typeDistributionMap = new Map();
    const now = dayjs();

    allExams.forEach(exam => {
      const startTime = dayjs(exam.exam_date);
      const endTime = exam.duration ? startTime.add(exam.duration, 'minute') : startTime.endOf('day');
      
      if (now.isBefore(startTime)) {
        upcomingCount++;
      } else if (now.isAfter(endTime)) {
        completedCount++;
      } else {
        inProgressCount++;
      }
      
      if (exam.exam_type) {
        typeDistributionMap.set(exam.exam_type, (typeDistributionMap.get(exam.exam_type) || 0) + 1);
      }
    });
    
    const typeDistribution = Array.from(typeDistributionMap, ([type, count]) => ({ type, count }));

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
 * 获取考试列表 (动态状态)
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 包含考试列表和总数的对象
 */
async function getExamList(params = {}) {
  const now = dayjs();
  try {
    let baseQuery = `
      SELECT
        e.id,
        e.exam_name,
        e.exam_type,
        DATE_FORMAT(e.exam_date, '%Y-%m-%d %H:%i:%s') as exam_date,
        e.duration,
        e.subjects,
        e.status,
        e.remark,
        e.create_time,
        GROUP_CONCAT(DISTINCT c.id ORDER BY c.id) as class_ids,
        GROUP_CONCAT(DISTINCT c.class_name ORDER BY c.id) as class_names
      FROM exam e
      LEFT JOIN exam_class_link ecl ON e.id = ecl.exam_id
      LEFT JOIN class c ON ecl.class_id = c.id
    `;
    let countQuery = 'SELECT COUNT(DISTINCT e.id) as total FROM exam e';

    const conditions = [];
    const values = [];
    const countValues = [];

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

    baseQuery += ' GROUP BY e.id ORDER BY e.exam_date DESC';

    const totalResult = await db.query(countQuery, countValues);
    const total = totalResult[0].total;

    if (params.page && params.pageSize) {
      const page = parseInt(params.page, 10);
      const pageSize = parseInt(params.pageSize, 10);
      if (Number.isInteger(page) && page > 0 && Number.isInteger(pageSize) && pageSize > 0) {
        const offset = (page - 1) * pageSize;
        baseQuery += ` LIMIT ${offset}, ${pageSize}`;
      }
    }

    const exams = await db.query(baseQuery, values); 

    const processedExams = exams.map(exam => {
      const startTime = dayjs(exam.exam_date);
      const endTime = exam.duration ? startTime.add(exam.duration, 'minute') : startTime.endOf('day');
      let dynamicStatus = '';
      if (now.isBefore(startTime)) {
        dynamicStatus = '未开始';
      } else if (now.isAfter(endTime)) {
        dynamicStatus = '已结束';
      } else {
        dynamicStatus = '进行中';
      }
      return { ...exam, status: dynamicStatus };
    });

    return { list: processedExams, total: total };
  } catch (error) {
    console.error('获取考试列表失败:', error);
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
    const examQuery = `
      SELECT 
        e.id, 
        e.exam_name, 
        e.exam_type, 
        DATE_FORMAT(e.exam_date, '%Y-%m-%d %H:%i:%s') as start_time,
        DATE_FORMAT(DATE_ADD(e.exam_date, INTERVAL e.duration MINUTE), '%Y-%m-%d %H:%i:%s') as end_time,
        e.duration,
        e.remark as description,
        GROUP_CONCAT(DISTINCT es.subject_id) as subjects,
        GROUP_CONCAT(DISTINCT ecl.class_id) as classIds
      FROM exam e
      LEFT JOIN exam_subject es ON e.id = es.exam_id
      LEFT JOIN exam_class_link ecl ON e.id = ecl.exam_id
      WHERE e.id = ?
      GROUP BY e.id
    `;
    const [exam] = await db.query(examQuery, [id]);
    if (!exam) return null;
    
    exam.subjects = exam.subjects ? exam.subjects.split(',').map(Number) : [];
    exam.classIds = exam.classIds ? exam.classIds.split(',').map(Number) : [];
    return exam;
  } catch (error) {
    console.error(`获取考试详情失败 (ID: ${id}):`, error);
    throw error;
  }
}

/**
 * 新增考试
 * @param {Object} examData 考试数据
 * @param {string} operator 操作人
 * @returns {Promise<Object>} 新增的考试对象
 */
async function addExam(examData, operator) {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const { subjects, classIds, start_time, duration, description, ...examInfo } = examData;

    const examRecord = {
      ...examInfo,
      exam_date: dayjs(start_time).format('YYYY-MM-DD HH:mm:ss'),
      duration: duration,
      remark: description
    };
    
    const insertExamQuery = 'INSERT INTO exam SET ?';
    const [result] = await connection.query(insertExamQuery, examRecord);
    const newExamId = result.insertId;

    if (subjects && subjects.length > 0) {
      const subjectLinks = subjects.map(subjectId => [newExamId, subjectId]);
      await connection.query('INSERT INTO exam_subject (exam_id, subject_id) VALUES ?', [subjectLinks]);
    }

    if (classIds && classIds.length > 0) {
      const classLinks = classIds.map(classId => [newExamId, classId]);
      await connection.query('INSERT INTO exam_class_link (exam_id, class_id) VALUES ?', [classLinks]);
    }

    await connection.commit();
    
    logService.addLogEntry({
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
 * 更新考试信息
 * @param {number} id 考试ID
 * @param {Object} examData 考试更新数据
 * @param {string} operator 操作人
 * @returns {Promise<Object>} 更新后的考试信息
 */
async function updateExam(id, examData, operator) {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const { subjects, classIds, start_time, duration, description, ...examInfo } = examData;
    
    const fieldsToUpdate = [];
    const values = [];

    // Manually map fields to avoid SQL injection and incorrect column names
    if (examInfo.exam_name !== undefined) {
      fieldsToUpdate.push('exam_name = ?');
      values.push(examInfo.exam_name);
    }
    if (examInfo.exam_type !== undefined) {
      fieldsToUpdate.push('exam_type = ?');
      values.push(examInfo.exam_type);
    }
    if (start_time) {
      fieldsToUpdate.push('exam_date = ?');
      values.push(dayjs(start_time).format('YYYY-MM-DD HH:mm:ss'));
    }
    if (duration !== undefined) {
      fieldsToUpdate.push('duration = ?');
      values.push(duration);
    }
    if (description !== undefined) {
      fieldsToUpdate.push('remark = ?');
      values.push(description);
    }
    
    if (fieldsToUpdate.length > 0) {
        const updateExamQuery = `UPDATE exam SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
        values.push(id);
        await connection.query(updateExamQuery, values);
    }
    
    // Update link tables
    if (subjects) {
      await connection.query('DELETE FROM exam_subject WHERE exam_id = ?', [id]);
      if (subjects.length > 0) {
        const subjectLinks = subjects.map(subjectId => [id, subjectId]);
        await connection.query('INSERT INTO exam_subject (exam_id, subject_id) VALUES ?', [subjectLinks]);
      }
    }

    if (classIds) {
      await connection.query('DELETE FROM exam_class_link WHERE exam_id = ?', [id]);
      if (classIds.length > 0) {
        const classLinks = classIds.map(classId => [id, classId]);
        await connection.query('INSERT INTO exam_class_link (exam_id, class_id) VALUES ?', [classLinks]);
      }
    }

    await connection.commit();
    
    logService.addLogEntry({
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
 * 删除考试 (带关联检查)
 * @param {number} id 考试ID
 * @param {string} operator 操作人
 * @returns {Promise<boolean>} 是否删除成功
 */
async function deleteExam(id, operator) {
  const connection = await db.getConnection();
  await connection.beginTransaction();
  try {
    const [scoreCheck] = await connection.query('SELECT COUNT(*) as count FROM student_score WHERE exam_id = ?', [id]);
    if (scoreCheck && scoreCheck[0].count > 0) {
      throw new Error(`无法删除：该考试下已有 ${scoreCheck[0].count} 条学生成绩记录。`);
    }

    const [exam] = await connection.query('SELECT exam_name FROM exam WHERE id = ?', [id]);
    const examName = exam && exam.length > 0 ? exam[0].exam_name : `ID ${id}`;

    await connection.query('DELETE FROM exam_subject WHERE exam_id = ?', [id]);
    await connection.query('DELETE FROM exam_class_link WHERE exam_id = ?', [id]);
    const [result] = await connection.query('DELETE FROM exam WHERE id = ?', [id]);

    await connection.commit();

    logService.addLogEntry({
         type: 'database',
         operation: '删除',
         content: `${operator} 删除了考试: "${examName}"`,
         operator: operator,
     });

    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    console.error(`删除考试失败 (ID: ${id}):`, error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * 获取不重复的考试类型 (用于筛选)
 * @returns {Promise<string[]>}
 */
async function getDistinctExamTypes() { // <-- RENAMED
  try {
    const result = await db.query('SELECT DISTINCT exam_type FROM exam WHERE exam_type IS NOT NULL ORDER BY exam_type ASC');
    return result.map(row => row.exam_type);
  } catch (error) {
    console.error('获取不重复考试类型失败:', error);
    throw error;
  }
}

/**
 * 获取所有科目 (用于下拉选择)
 * @returns {Promise<Object[]>}
 */
async function getSubjectOptions() {
  try {
    return await db.query('SELECT id, subject_name FROM subject ORDER BY id');
  } catch (error)
  {
    console.error('获取所有科目失败:', error);
    throw error;
  }
}

module.exports = {
  getExamStats,
  getExamList,
  getExamDetail,
  addExam,
  updateExam,
  deleteExam,
  getDistinctExamTypes, // <-- RENAMED
  getSubjectOptions,
};