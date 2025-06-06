const db = require('./db');
const logService = require('./logService');
const dayjs = require('dayjs');

/**
 * 获取学生成绩列表
 * @param {Object} params 查询参数
 * @returns {Promise<Array>} 成绩列表
 */
async function getScoreList(params = {}) {
  try {
    // 构建基础查询
    let query = `
      SELECT 
        ss.id, 
        s.student_id, 
        s.name as student_name,
        c.class_name,
        ss.subject,
        ss.score,
        DATE_FORMAT(e.exam_date, '%Y-%m-%d') as exam_time,
        e.exam_type,
        e.exam_name,
        e.id as exam_id
      FROM 
        student_score ss
      JOIN
        student s ON ss.student_id = s.id
      LEFT JOIN
        class c ON s.class_id = c.id
      JOIN
        exam e ON ss.exam_id = e.id
    `;

    // 添加查询条件
    const conditions = [];
    const values = [];

    if (params.studentId) {
      conditions.push('s.id = ?');
      values.push(params.studentId);
    }

    if (params.studentName) {
      conditions.push('s.name LIKE ?');
      values.push(`%${params.studentName}%`);
    }

    if (params.className) {
      conditions.push('c.class_name LIKE ?');
      values.push(`%${params.className}%`);
    }

    if (params.examId) {
      conditions.push('e.id = ?');
      values.push(params.examId);
    }

    if (params.examType) {
      conditions.push('e.exam_type = ?');
      values.push(params.examType);
    }

    if (params.subject) {
      conditions.push('ss.subject = ?');
      values.push(params.subject);
    }

    if (params.startDate) {
      conditions.push('e.exam_date >= ?');
      values.push(params.startDate);
    }

    if (params.endDate) {
      conditions.push('e.exam_date <= ?');
      values.push(params.endDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // 添加排序
    query += ' ORDER BY e.exam_date DESC, s.student_id ASC';

    // 执行查询
    const scores = await db.query(query, values);
    
    console.log(`获取到 ${scores.length} 条成绩记录`);
    return scores;
  } catch (error) {
    console.error('获取学生成绩列表失败:', error);
    throw error;
  }
}

/**
 * 获取成绩详情
 * @param {number} id 成绩ID
 * @returns {Promise<Object>} 成绩详情
 */
async function getScoreDetail(id) {
  try {
    const query = `
      SELECT 
        ss.id, 
        s.student_id, 
        s.name as student_name,
        c.class_name,
        ss.subject,
        ss.score,
        DATE_FORMAT(e.exam_date, '%Y-%m-%d') as exam_time,
        e.exam_type,
        e.exam_name,
        e.id as exam_id
      FROM 
        student_score ss
      JOIN
        student s ON ss.student_id = s.id
      LEFT JOIN
        class c ON s.class_id = c.id
      JOIN
        exam e ON ss.exam_id = e.id
      WHERE 
        ss.id = ?
    `;
    
    const scores = await db.query(query, [id]);
    return scores[0] || null;
  } catch (error) {
    console.error(`获取成绩详情失败 (ID: ${id}):`, error);
    throw error;
  }
}

/**
 * 获取学生成绩（根据考试ID）
 * @param {number} studentId - 学生ID
 * @param {number} examId - 考试ID
 * @returns {Promise<object|null>} - 返回学生成绩信息及考试科目列表，或 null
 */
async function getStudentScoreByExamId(studentId, examId) {
  try {
    if (!studentId || !examId) {
      console.log('获取学生成绩失败: 学生ID或考试ID为空');
      return null;
    }

    console.log(`查询学生ID: ${studentId}, 考试ID: ${examId} 的成绩`);

    // 获取考试信息，包括科目列表
    const examQuery = 'SELECT id, exam_type, exam_date, exam_name, subjects FROM exam WHERE id = ?'; 
    const exams = await db.query(examQuery, [examId]);

    if (!exams || exams.length === 0) {
      console.log(`找不到ID为 ${examId} 的考试记录`);
      return null;
    }

    const exam = exams[0];
    const subjectListString = exam.subjects; 

    // 查询学生在该考试中的所有科目成绩
    const scoresQuery = `
      SELECT ss.subject, ss.score 
      FROM student_score ss
      WHERE ss.student_id = ? AND ss.exam_id = ?
    `;

    const scores = await db.query(scoresQuery, [studentId, examId]) || [];
    console.log(`查询到 ${scores.length} 条成绩记录`);

    // 构建返回结果
    const result = {
      exam_id: examId,
      exam_type: exam.exam_type,
      exam_time: exam.exam_date,
      exam_name: exam.exam_name,
      subjects: subjectListString ? subjectListString.split(',').map(s => s.trim()).filter(s => s) : [], 
      scores: {} 
    };

    // 遍历所有科目成绩，添加到结果的 scores 对象中
    for (const scoreItem of scores) {
      const score = parseFloat(scoreItem.score);
      result.scores[scoreItem.subject] = isNaN(score) ? null : score;
    }
    
    console.log('返回的学生成绩及科目信息:', result);
    return result;
  } catch (error) {
    console.error('获取学生成绩失败:', error);
    return null;
  }
}

/**
 * 获取学生成绩（根据考试类型，向后兼容旧接口）
 * @param {number} studentId - 学生ID
 * @param {string} examType - 考试类型
 * @returns {Promise<object>} - 返回学生成绩信息
 */
async function getStudentScore(studentId, examType) {
  try {
    if (!studentId || !examType) {
      console.log('获取学生成绩失败: 学生ID或考试类型为空');
      return null;
    }

    console.log(`查询学生ID: ${studentId}, 考试类型: ${examType} 的成绩`);
    
    // 查找该类型的最新考试
    const latestExamQuery = `
      SELECT id FROM exam 
      WHERE exam_type = ? 
      ORDER BY exam_date DESC 
      LIMIT 1
    `;
    
    const [exams] = await db.query(latestExamQuery, [examType]);
    
    if (!exams || exams.length === 0) {
      console.log(`找不到类型为 ${examType} 的考试记录`);
      return null;
    }
    
    const examId = exams[0].id;
    console.log(`找到最新 ${examType} 考试, ID: ${examId}`);
    
    // 使用考试ID获取成绩
    return await getStudentScoreByExamId(studentId, examId);
  } catch (error) {
    console.error('获取学生成绩失败:', error);
    return null;
  }
}

/**
 * 保存学生成绩
 * @param {Object} data 成绩数据, 包含 student_id, exam_id, 和各科成绩键值对
 * @param {string} operator 操作人
 * @returns {Promise<boolean>} 保存结果
 */
async function saveStudentScore(data, operator) {
  if (!data || !data.student_id || !data.exam_id) {
    console.log('[scoreService] 保存学生成绩失败: 数据、学生ID或考试ID为空');
    return false;
  }

  const { student_id, exam_id, ...subjectsFromFrontend } = data;
  let successful = true;
  let connection;
  let studentName = '未知学生';
  let examName = '未知考试';
  let subjectCount = 0;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      const [[student]] = await connection.query('SELECT name FROM student WHERE id = ?', [student_id]);
      if (student) studentName = student.name;

      const [[exam]] = await connection.query('SELECT exam_name FROM exam WHERE id = ?', [exam_id]);
      if (exam) examName = exam.exam_name;
    } catch (queryError) {
      console.warn(`[scoreService] 查询学生/考试名称时出错 (忽略): ${queryError.message}`);
    }

    let upsertedCount = 0;
    const insertPromises = [];

    for (const subject in subjectsFromFrontend) {
      if (Object.prototype.hasOwnProperty.call(subjectsFromFrontend, subject)) {
        const score = subjectsFromFrontend[subject];
        if (typeof score === 'number' && !isNaN(score)) {
          subjectCount++;
          const upsertQuery = `
            INSERT INTO student_score (student_id, exam_id, subject, score)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE score = VALUES(score)
          `;
          insertPromises.push(
            connection.query(upsertQuery, [
              student_id,
              exam_id,
              subject,
              score
            ])
          );
        } else {
          console.warn(`[scoreService] Student ID ${student_id}, Exam ID ${exam_id}: Skipping subject '${subject}' due to invalid score value:`, score);
        }
      }
    }

    if (insertPromises.length > 0) {
      const results = await Promise.all(insertPromises);
      results.forEach(([result]) => {
        if (result.affectedRows > 0 || result.warningStatus === 0) {
          upsertedCount++;
        }
      });
      console.log(`[scoreService] Student ID ${student_id}, Exam ID ${exam_id}: Successfully executed ${insertPromises.length} upsert queries, ${upsertedCount} rows affected/updated.`);
    } else {
      console.log(`[scoreService] Student ID ${student_id}, Exam ID ${exam_id}: No valid subject scores provided to save.`);
    }

    await connection.commit();
    console.log(`[scoreService] 成功保存/更新学生ID: ${student_id}, 考试ID: ${exam_id} 的成绩事务已提交.`);

    await logService.addLogEntry({
      type: 'database',
      operation: '保存/更新成绩',
      content: `${operator} 保存/更新了学生 "${studentName}" (ID: ${student_id}) 在考试 "${examName}" (ID: ${exam_id}) 的 ${subjectCount} 门科目成绩.`,
      operator: operator
    });
    console.log(`[scoreService] 保存/更新成绩日志已记录.`);

  } catch (error) {
    successful = false;
    if (connection) {
      try { await connection.rollback(); } catch (rbError) { console.error('[scoreService] Rollback failed:', rbError); }
    }
    console.error(`[scoreService] 保存/更新学生成绩事务失败 (Student: ${student_id}, Exam: ${exam_id}):`, error);

    await logService.addLogEntry({
      type: 'database',
      operation: '保存/更新成绩失败',
      content: `${operator || '系统'} 尝试保存/更新学生 "${studentName}" (ID: ${student_id}) 在考试 "${examName}" (ID: ${exam_id}) 的成绩失败: ${error.message}`,
      operator: operator || 'system'
    });

  } finally {
    if (connection) {
      try { connection.release(); } catch (rlError) { console.error('[scoreService] Release connection failed:', rlError); }
    }
  }

  return successful;
}

/**
 * 获取班级成绩
 * @param {number} classId 班级ID
 * @param {string} examType 考试类型
 * @returns {Promise<Array>} 班级成绩
 */
async function getClassScores(classId, examType) {
  try {
    // 验证参数
    if (!classId) {
      throw new Error('班级ID不能为空');
    }
    
    if (!examType) {
      throw new Error('考试类型不能为空');
    }

    // 获取班级最新一次指定类型的考试成绩
    const query = `
      SELECT 
        s.id as student_id,
        s.student_id as student_number,
        s.name as student_name,
        ss.subject,
        ss.score,
        DATE_FORMAT(e.exam_date, '%Y-%m-%d') as exam_time,
        e.exam_type,
        e.exam_name
      FROM 
        student s
      JOIN
        student_score ss ON s.id = ss.student_id
      JOIN
        exam e ON ss.exam_id = e.id
      WHERE 
        s.class_id = ? AND e.exam_type = ?
      ORDER BY 
        s.student_id ASC, ss.subject ASC
    `;
    
    const scores = await db.query(query, [classId, examType]);
    
    if (scores.length === 0) {
      return []; // 没有找到成绩
    }
    
    // 格式化班级成绩数据
    const studentScores = {};
    
    // 处理各学生的各科目成绩
    for (const score of scores) {
      const studentId = score.student_id;
      
      // 如果学生还没有记录，创建一个新的
      if (!studentScores[studentId]) {
        studentScores[studentId] = {
          student_id: studentId,
          student_number: score.student_number,
          student_name: score.student_name,
          exam_time: score.exam_time,
          exam_type: score.exam_type,
          exam_name: score.exam_name,
          subjects: {}
        };
      }
      
      // 添加科目成绩
      studentScores[studentId].subjects[score.subject] = parseFloat(score.score);
    }
    
    // 转换为数组
    return Object.values(studentScores);
  } catch (error) {
    console.error(`获取班级成绩失败 (班级ID: ${classId}, 考试类型: ${examType}):`, error);
    throw error;
  }
}

/**
 * 获取成绩统计数据
 * @returns {Promise<Object>} 统计数据
 */
async function getScoreStats() {
  try {
    // 获取总成绩记录数
    const totalQuery = 'SELECT COUNT(*) as total FROM student_score';
    const totalResult = await db.query(totalQuery);
    const total = totalResult[0].total;

    // 获取考试类型分布
    const examTypeQuery = `
      SELECT 
        e.exam_type,
        COUNT(*) as count
      FROM 
        student_score ss
      JOIN
        exam e ON ss.exam_id = e.id
      GROUP BY
        e.exam_type
      ORDER BY
        count DESC
    `;
    const examTypeDistribution = await db.query(examTypeQuery);

    // 获取科目分布
    const subjectQuery = `
      SELECT 
        subject,
        COUNT(*) as count
      FROM 
        student_score
      GROUP BY
        subject
      ORDER BY
        count DESC
    `;
    const subjectDistribution = await db.query(subjectQuery);

    // 获取最近考试记录
    const recentExamsQuery = `
      SELECT 
        e.id,
        e.exam_name,
        e.exam_type,
        DATE_FORMAT(e.exam_date, '%Y-%m-%d') as exam_date,
        e.subjects,
        e.status
      FROM 
        exam e
      ORDER BY
        e.exam_date DESC
      LIMIT 5
    `;
    const recentExams = await db.query(recentExamsQuery);
    
    // 获取成绩平均分统计
    const avgScoreQuery = `
      SELECT 
        subject,
        AVG(score) as avg_score
      FROM 
        student_score
      GROUP BY
        subject
      ORDER BY
        avg_score DESC
    `;
    const avgScores = await db.query(avgScoreQuery);
    
    // 获取考试及格率统计
    const passRateQuery = `
      SELECT 
        subject,
        COUNT(*) as total,
        SUM(CASE WHEN score >= 60 THEN 1 ELSE 0 END) as passed,
        (SUM(CASE WHEN score >= 60 THEN 1 ELSE 0 END) / COUNT(*)) * 100 as pass_rate
      FROM 
        student_score
      GROUP BY
        subject
      ORDER BY
        pass_rate DESC
    `;
    const passRates = await db.query(passRateQuery);
    
    return {
      total,
      examTypeDistribution,
      subjectDistribution,
      recentExams,
      avgScores,
      passRates
    };
  } catch (error) {
    console.error('获取成绩统计数据失败:', error);
    throw error;
  }
}

/**
 * 获取考试类型选项
 * @returns {Promise<Array>} 考试类型选项
 */
async function getExamTypeOptions() {
  try {
    const query = `
      SELECT DISTINCT exam_type 
      FROM exam 
      ORDER BY exam_type
    `;
    
    const result = await db.query(query);
    return result.map(item => item.exam_type);
  } catch (error) {
    console.error('获取考试类型选项失败:', error);
    throw error;
  }
}

/**
 * 获取科目选项
 * @returns {Promise<Array>} 科目选项
 */
async function getSubjectOptions() {
  try {
    const query = `
      SELECT subject_name 
      FROM subject 
      ORDER BY id
    `;
    
    const result = await db.query(query);
    return result.map(item => item.subject_name);
  } catch (error) {
    console.error('获取科目选项失败:', error);
    throw error;
  }
}

/**
 * 测试API连接
 * @returns {Promise<boolean>} 测试结果
 */
async function testApi() {
  try {
    const connection = await db.testConnection();
    return connection;
  } catch (error) {
    console.error('测试API连接失败:', error);
    return false;
  }
}

/**
 * 获取学生成绩详细统计
 * @param {Object} params 查询参数 {studentId, examId, classId, examType}
 * @returns {Promise<Array>} 学生成绩统计
 */
async function getStudentScoreStats(params = {}) {
  try {
    // 构建基础查询
    let query = `
      SELECT * FROM v_student_score_stats
    `;

    // 添加查询条件
    const conditions = [];
    const values = [];

    if (params.studentId) {
      conditions.push('student_id = ?');
      values.push(params.studentId);
    }

    if (params.examId) {
      conditions.push('exam_id = ?');
      values.push(params.examId);
    }

    if (params.classId) {
      conditions.push('class_id = ?');
      values.push(params.classId);
    }

    if (params.examType) {
      conditions.push('exam_type = ?');
      values.push(params.examType);
    }

    if (params.subject) {
      conditions.push('subject = ?');
      values.push(params.subject);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // 添加排序
    query += ' ORDER BY student_number ASC, subject ASC, exam_date DESC';

    // 执行查询
    const stats = await db.query(query, values);
    
    console.log(`获取到 ${stats.length} 条成绩统计记录`);
    return stats;
  } catch (error) {
    console.error('获取学生成绩统计失败:', error);
    throw error;
  }
}

/**
 * 获取学生成绩汇总
 * @param {Object} params 查询参数 {studentId, examId, classId, examType}
 * @returns {Promise<Array>} 学生成绩汇总
 */
async function getStudentScoreSummary(params = {}) {
  try {
    // 构建基础查询
    let query = `
      SELECT * FROM v_student_score_summary
    `;

    // 添加查询条件
    const conditions = [];
    const values = [];

    if (params.studentId) {
      conditions.push('student_id = ?');
      values.push(params.studentId);
    }

    if (params.examId) {
      conditions.push('exam_id = ?');
      values.push(params.examId);
    }

    if (params.studentNumber) {
      conditions.push('student_number = ?');
      values.push(params.studentNumber);
    }

    if (params.examType) {
      conditions.push('exam_type = ?');
      values.push(params.examType);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // 添加排序
    query += ' ORDER BY exam_date DESC, student_number ASC';

    // 执行查询
    const summary = await db.query(query, values);
    
    console.log(`获取到 ${summary.length} 条成绩汇总记录`);
    return summary;
  } catch (error) {
    console.error('获取学生成绩汇总失败:', error);
    throw error;
  }
}

/**
 * 获取班级成绩统计
 * @param {Object} params 查询参数 {classId, examId, examType, subject}
 * @returns {Promise<Array>} 班级成绩统计
 */
async function getClassScoreStats(params = {}) {
  try {
    // 构建基础查询
    let query = `
      SELECT * FROM v_class_score_stats
    `;

    // 添加查询条件
    const conditions = [];
    const values = [];

    if (params.classId) {
      conditions.push('class_id = ?');
      values.push(params.classId);
    }

    if (params.examId) {
      conditions.push('exam_id = ?');
      values.push(params.examId);
    }

    if (params.examType) {
      conditions.push('exam_type = ?');
      values.push(params.examType);
    }

    if (params.subject) {
      conditions.push('subject = ?');
      values.push(params.subject);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // 添加排序
    query += ' ORDER BY exam_date DESC, class_name ASC, subject ASC';

    // 执行查询
    const stats = await db.query(query, values);
    
    console.log(`获取到 ${stats.length} 条班级成绩统计记录`);
    return stats;
  } catch (error) {
    console.error('获取班级成绩统计失败:', error);
    throw error;
  }
}

/**
 * 根据学生ID和考试ID获取该学生在该次考试的成绩及考试科目信息
 * @param {number} studentId 学生ID
 * @param {number} examId 考试ID
 * @returns {Promise<Object|null>} 返回包含考试信息、完整科目列表和学生成绩的对象，或在找不到时返回 null
 *  例: { exam_id: 4, exam_name: '月考1', subjects: ['语文', '数学', '英语'], scores: { '数学': 95.0, '英语': 88.0 } }
 */
async function getScoresByStudentAndExam(studentId, examId) {
  try {
    console.log(`[ScoreService] 获取学生 ${studentId} 在考试 ${examId} 的成绩和科目信息`);
    if (!studentId || !examId) {
      console.warn('[ScoreService] 学生ID或考试ID无效');
      throw new Error('学生ID和考试ID不能为空');
    }

    // 1. 获取考试信息 (包括科目列表字符串)
    const examQuery = 'SELECT id, exam_name, exam_type, exam_date, subjects FROM exam WHERE id = ?';
    const exams = await db.query(examQuery, [examId]);

    if (!exams || exams.length === 0) {
      console.warn(`[ScoreService] 找不到考试 ID: ${examId}`);
      return null; // 明确返回 null 表示未找到考试
    }
    const exam = exams[0];
    // 解析科目列表，确保处理空字符串或null的情况
    const subjectList = exam.subjects ? exam.subjects.split(',').map(s => s.trim()).filter(s => s) : [];
    console.log(`[ScoreService] 考试 ${examId} 的科目列表:`, subjectList);

    // 2. 获取该学生在该考试的已有成绩
    const scoresQuery = `
      SELECT subject, score 
      FROM student_score 
      WHERE student_id = ? AND exam_id = ?
    `;
    const existingScores = await db.query(scoresQuery, [studentId, examId]);
    console.log(`[ScoreService] 查询到学生 ${studentId} 在考试 ${examId} 的 ${existingScores.length} 条成绩记录`);

    // 3. 格式化成绩为 { subject: score } 的对象
    const scoresMap = existingScores.reduce((acc, item) => {
      // 确保分数是数字，如果数据库存的是字符串
      const scoreValue = parseFloat(item.score);
      acc[item.subject] = isNaN(scoreValue) ? null : scoreValue; // 无效分数记为 null
      return acc;
    }, {});

    // 4. 构建最终返回结果
    const result = {
      exam_id: exam.id,
      exam_name: exam.exam_name,
      exam_type: exam.exam_type,
      exam_date: exam.exam_date, // 可能前端需要
      subjects: subjectList,      // 完整的科目列表
      scores: scoresMap           // 学生已有的成绩
    };

    console.log(`[ScoreService] 返回给路由的数据:`, result);
    return result;

  } catch (error) {
    console.error(`[ScoreService] 获取学生成绩及科目失败 (Student: ${studentId}, Exam: ${examId}):`, error);
    // 避免在这里记录日志，让路由处理器决定如何处理和记录
    // await logService.addLogEntry('database', 'error', `获取学生成绩失败...`);
    throw error; // 将错误抛给路由处理器
  }
}

/**
 * 获取学生已参加的考试列表 (包含考试类型)
 * @param {number} studentId - 学生ID (user.id, not student.id from student table)
 * @returns {Promise<Array>} - 返回包含 { exam_id, exam_name, exam_date, exam_type } 的对象数组
 */
async function getExamsTakenByStudent(studentId) {
  try {
    if (!studentId) {
      console.warn('[getExamsTakenByStudent] Student ID is required.');
      return [];
    }
    const [studentEntry] = await db.query('SELECT id FROM student WHERE user_id = ?', [studentId]);
    if (!studentEntry) {
      console.warn(`[getExamsTakenByStudent] No student record found for user_id: ${studentId}`);
      return [];
    }
    const studentTablePk = studentEntry.id;

    const query = `
      SELECT DISTINCT
        e.id AS exam_id,
        e.exam_name,
        DATE_FORMAT(e.exam_date, '%Y-%m-%d') AS exam_date, 
        e.exam_type,
        e.exam_date AS raw_exam_date 
      FROM
        student_score ss
      JOIN
        exam e ON ss.exam_id = e.id
      WHERE
        ss.student_id = ? 
      ORDER BY
        raw_exam_date DESC, e.exam_name ASC;
    `;
    const examsFromDb = await db.query(query, [studentTablePk]);
    
    // Map results to exclude raw_exam_date, ensuring exam_date is the formatted one
    const exams = examsFromDb.map(exam => ({
      exam_id: exam.exam_id,
      exam_name: exam.exam_name,
      exam_date: exam.exam_date, // This is already the formatted 'YYYY-MM-DD' string from DATE_FORMAT
      exam_type: exam.exam_type
    }));

    console.log(`[getExamsTakenByStudent] Found ${exams.length} exams taken by student (user_id: ${studentId}, student_pk: ${studentTablePk})`);
    return exams;
  } catch (error) {
    console.error(`[getExamsTakenByStudent] Error fetching exams for student ID ${studentId}:\n`, error);
    throw error; 
  }
}

// Helper function to calculate rank
// This function should be defined in a scope accessible by generateDetailedScoreReport
// If it's already defined elsewhere with the same logic, this can be adapted.
function calculateRank(studentScore, scoresArray, sortOrder = 'desc') {
    // If the student's own score is null or undefined, they are unranked for this item.
    if (studentScore === null || studentScore === undefined) {
        return null;
    }

    // Filter out null/undefined scores from the comparison array, as these students are also unranked.
    const validScoresArray = scoresArray.filter(s => s !== null && s !== undefined);

    if (validScoresArray.length === 0) {
        return null; // No one to rank against or no valid scores in the pool to form ranks.
    }

    const uniqueScores = [...new Set(validScoresArray)];
    uniqueScores.sort((a, b) => sortOrder === 'desc' ? b - a : a - b);
    
    const rankIndex = uniqueScores.indexOf(studentScore);

    // If studentScore (which is non-null here) is not found in the unique valid scores,
    // it implies it wasn't part of the valid pool, so it can't be ranked.
    return rankIndex !== -1 ? rankIndex + 1 : null; // Convert 0-based index to 1-based rank
}

/**
 * 生成指定学生在特定考试中的详细成绩报告
 * @param {number} studentId - 学生在 student 表中的主键 ID
 * @param {number} examId - 考试在 exam 表中的主键 ID
 * @returns {Promise<Object|null>} 详细成绩报告对象或 null
 */
async function generateDetailedScoreReport(studentId, examId) {
    console.log(`[scoreService] Generating detailed score report for student ID: ${studentId}, exam ID: ${examId}`);
    try {
        // 1. 获取学生基本信息 (预期只有一行)
        const studentQuery = `
            SELECT 
                s.id as student_db_id, 
                s.student_id as student_identifier, 
                s.name as student_name,
                c.id as class_id,
                c.class_name,
                u.display_name as user_display_name,
                u.avatar as user_avatar
            FROM student s
            LEFT JOIN class c ON s.class_id = c.id
            LEFT JOIN user u ON s.user_id = u.id
            WHERE s.id = ?;
        `;
        const studentInfoRows = await db.query(studentQuery, [studentId]);
        if (!studentInfoRows || studentInfoRows.length === 0) {
            console.warn(`[scoreService] Student with ID ${studentId} not found.`);
            return null;
        }
        const studentInfo = studentInfoRows[0];

        // 2. 获取考试基本信息 (预期只有一行)
        const examQuery = 'SELECT id as exam_db_id, exam_name, exam_type, exam_date FROM exam WHERE id = ?;';
        const examInfoRows = await db.query(examQuery, [examId]);
        if (!examInfoRows || examInfoRows.length === 0) {
            console.warn(`[scoreService] Exam with ID ${examId} not found.`);
            return null;
        }
        const examInfo = examInfoRows[0];

        // 3. 获取本次考试的所有科目及其满分 (预期多行)
        const examSubjectsQuery = `
            SELECT 
                s.subject_name as subject_name, 
                es.full_score,
                s.id as subject_id 
            FROM exam_subject es
            JOIN subject s ON es.subject_id = s.id
            WHERE es.exam_id = ?
            ORDER BY s.subject_name; 
        `;
        const examSubjects = await db.query(examSubjectsQuery, [examId]);
        
        const subjectFullScoreMap = {};
        if (Array.isArray(examSubjects)) {
            examSubjects.forEach(sub => {
                subjectFullScoreMap[sub.subject_name] = sub.full_score;
            });
        }

        // 4. 获取该学生本次考试的各科成绩 (预期多行)
        const studentScoresQuery = `
            SELECT subject, score 
            FROM student_score 
            WHERE student_id = ? AND exam_id = ?;
        `;
        const studentScoresRows = await db.query(studentScoresQuery, [studentInfo.student_db_id, examId]);
        
        const studentScoresMap = studentScoresRows.reduce((acc, row) => {
            acc[row.subject] = parseFloat(row.score);
            return acc;
        }, {});

        // 构建报告对象以匹配前端期望的结构
        const report = {
            student_info: {
                name: studentInfo.user_display_name || studentInfo.student_name,
                student_id_str: studentInfo.student_identifier,
                avatar: studentInfo.user_avatar ? `/uploads/${studentInfo.user_avatar}` : null,
            },
            class_info: {
                name: studentInfo.class_name,
            },
            exam_info: {
                id: examInfo.exam_db_id,
                name: examInfo.exam_name,
                type: examInfo.exam_type,
                date: dayjs(examInfo.exam_date).format('YYYY-MM-DD HH:mm'),
            },
            subject_details: [],
            total_score_details: {
                student_total_score: 0,
                class_average_total_score: null,
                class_total_score_rank: null,
                grade_total_score_rank: null,
            },
        };

        let studentTotalScore = 0;
        for (const subjectData of examSubjects) {
            const subjectName = subjectData.subject_name;
            const studentScore = studentScoresMap[subjectName] ?? null;

            report.subject_details.push({
                subject: subjectName,
                subject_id: subjectData.subject_id,
                student_score: studentScore,
                full_score: parseFloat(subjectFullScoreMap[subjectName] || 100),
                class_rank: null,
                grade_rank: null,
                class_average_score: null,
                grade_average: null,
                class_highest: null,
                grade_highest: null,
            });
            if (studentScore !== null) {
                studentTotalScore += studentScore;
            }
        }
        report.total_score_details.student_total_score = parseFloat(studentTotalScore.toFixed(2));
        
        // 5. 获取班级所有学生在此次考试的各科成绩和总分
        const classStudentsQuery = 'SELECT id FROM student WHERE class_id = ?;';
        const classStudentRows = await db.query(classStudentsQuery, [studentInfo.class_id]);
        const classStudentIds = classStudentRows.map(s => s.id);

        let allClassScoresForExam = [];
        if (classStudentIds.length > 0) {
            // 为 IN 子句创建占位符 '?, ?, ?'
            const placeholders = classStudentIds.map(() => '?').join(',');
            
            const allClassScoresQuery = `
                SELECT student_id, subject, score 
                FROM student_score 
                WHERE exam_id = ? AND student_id IN (${placeholders});
            `;
            // 将 examId 和所有学生ID平铺到参数数组中
            allClassScoresForExam = await db.query(allClassScoresQuery, [examId, ...classStudentIds]);
        }
        console.log(`[scoreService] Fetched ${allClassScoresForExam.length} score entries for ${classStudentIds.length} students in class for exam ${examId}`);

        // 定义一个通用的统计处理函数
        const processScoreGroup = (rawScoresForGroup, groupType) => {
            // 按学生ID聚合，计算每个学生的总分
            const groupStudentTotals = rawScoresForGroup.reduce((acc, scoreEntry) => {
                const studentId = scoreEntry.student_id;
                const scoreValue = parseFloat(scoreEntry.score);
                if (!isNaN(scoreValue)) {
                    acc[studentId] = (acc[studentId] || 0) + scoreValue;
                }
                return acc;
            }, {});

            // 按科目聚合，计算每个科目的分数列表
            const subjectScoresInGroup = rawScoresForGroup.reduce((acc, scoreEntry) => {
                const subject = scoreEntry.subject;
                const scoreValue = parseFloat(scoreEntry.score);
                if (!isNaN(scoreValue)) {
                    if (!acc[subject]) {
                        acc[subject] = [];
                    }
                    acc[subject].push(scoreValue);
                }
                return acc;
            }, {});

            const allStudentTotalScores = Object.values(groupStudentTotals);

            // 如果是班级维度，更新报告中的班级统计信息
            if (groupType === 'class') {
                // 计算总分班级平均和排名
                if (allStudentTotalScores.length > 0) {
                    const totalSum = allStudentTotalScores.reduce((a, b) => a + b, 0);
                    report.total_score_details.class_average_total_score = parseFloat((totalSum / allStudentTotalScores.length).toFixed(2));
                }
                report.total_score_details.class_total_score_rank = calculateRank(
                    report.total_score_details.student_total_score,
                    allStudentTotalScores
                );
                
                // 遍历报告中的每个科目详情，更新班级统计数据
                report.subject_details.forEach(detail => {
                    const subject = detail.subject;
                    const scoresForSubject = subjectScoresInGroup[subject] || [];
                    
                    if (scoresForSubject.length > 0) {
                        const subjectSum = scoresForSubject.reduce((a, b) => a + b, 0);
                        detail.class_average_score = parseFloat((subjectSum / scoresForSubject.length).toFixed(2));
                        detail.class_highest = Math.max(...scoresForSubject);
                        
                        // 计算单科排名
                        detail.class_rank = calculateRank(detail.student_score, scoresForSubject);
                    }
                });
            }
        };
        
        // 使用新逻辑处理班级成绩
        processScoreGroup(allClassScoresForExam, 'class');

        // 6. 年级排名和统计 - 逻辑重构
        // a. 检查本次考试是否关联了特定班级
        const examLinkedClassesQuery = 'SELECT class_id FROM exam_class_link WHERE exam_id = ?;';
        const linkedClassRows = await db.query(examLinkedClassesQuery, [examId]);
        const linkedClassIds = linkedClassRows.map(r => r.class_id);

        let rankingStudentIds = []; // 用于排名的学生ID池

        if (linkedClassIds.length > 0) {
            // b. 如果考试关联了班级，排名范围限定在这些班级内
            console.log(`[scoreService] Exam ${examId} is linked to specific classes. Ranking within these classes.`);
            const rankingStudentsQuery = `SELECT id FROM student WHERE class_id IN (?);`;
            const rankingStudentRows = await db.query(rankingStudentsQuery, [linkedClassIds]);
            rankingStudentIds = rankingStudentRows.map(s => s.id);
        } else {
            // c. 如果考试未关联任何班级 (全体考试)，则按年级进行排名
            console.log(`[scoreService] Exam ${examId} is a grade-wide exam. Ranking within the grade.`);
            const gradeMatch = studentInfo.class_name ? studentInfo.class_name.match(/^(高一|高二|高三|初一|初二|初三|九年级|[一二三四五六]年级)/) : null;
            const studentGrade = gradeMatch ? gradeMatch[0] : null;

            if (studentGrade) {
                const gradeClassesQuery = 'SELECT id FROM class WHERE class_name LIKE ?;';
                const gradeClassRows = await db.query(gradeClassesQuery, [`${studentGrade}%`]);
                const gradeClassIds = gradeClassRows.map(c => c.id);
                console.log(`[scoreService] Found grade class IDs for grade '${studentGrade}':`, gradeClassIds);
                if (gradeClassIds.length > 0) {
                    const placeholders = gradeClassIds.map(() => '?').join(',');
                    const gradeStudentsQuery = `SELECT id FROM student WHERE class_id IN (${placeholders});`;
                    const gradeStudentRows = await db.query(gradeStudentsQuery, gradeClassIds);
                    rankingStudentIds = gradeStudentRows.map(s => s.id);
                }
            }
        }
        
        if (rankingStudentIds.length > 0) {
            const studentPlaceholders = rankingStudentIds.map(() => '?').join(',');
            const allRankingScoresQuery = `
                SELECT student_id, subject, score 
                FROM student_score 
                WHERE exam_id = ? AND student_id IN (${studentPlaceholders});
            `;
            const allRankingScoresForExam = await db.query(allRankingScoresQuery, [examId, ...rankingStudentIds]);
            console.log(`[scoreService] Fetched ${allRankingScoresForExam.length} score entries for ${rankingStudentIds.length} students in the ranking pool for exam ${examId}`);

            if (allRankingScoresForExam.length > 0) {
                // d. 计算排名池的总分
                const rankingScoresByStudent = allRankingScoresForExam.reduce((acc, score) => {
                    const studentId = score.student_id;
                    const scoreValue = parseFloat(score.score);
                    if(!isNaN(scoreValue)) {
                        acc[studentId] = (acc[studentId] || 0) + scoreValue;
                    }
                    return acc;
                }, {});
                const allRankingTotalScores = Object.values(rankingScoresByStudent);
                report.total_score_details.grade_total_score_rank = calculateRank(
                    report.total_score_details.student_total_score,
                    allRankingTotalScores
                );

                // e. 计算排名池的单科成绩
                const rankingScoresBySubject = allRankingScoresForExam.reduce((acc, scoreEntry) => {
                    const subject = scoreEntry.subject;
                    const scoreValue = parseFloat(scoreEntry.score);
                    if (!isNaN(scoreValue)) {
                        if (!acc[subject]) acc[subject] = [];
                        acc[subject].push(scoreValue);
                    }
                    return acc;
                }, {});

                report.subject_details.forEach(detail => {
                    const scoresForSubject = rankingScoresBySubject[detail.subject] || [];
                    detail.grade_rank = calculateRank(detail.student_score, scoresForSubject);
                });
            }
        }
        
        console.log('[scoreService] Final report object after rank/stats calculation:', JSON.stringify(report, null, 2));
        return report;

    } catch (error) {
        console.error(`[scoreService] Error in generateDetailedScoreReport for student ID: ${studentId}, exam ID: ${examId}:`, error);
        throw error;
    }
}

/**
 * 获取学生即将参加的考试列表
 * @param {number} userId - 用户的 ID (user.id)
 * @returns {Promise<Array>} - 返回包含 { exam_id, exam_name, exam_date, exam_type, subjects } 的对象数组
 */
async function getUpcomingExamsByStudent(userId) {
    try {
        if (!userId) {
            console.warn('[getUpcomingExamsByStudent] User ID is required.');
            return [];
        }

        // 1. 从 user.id 获取学生信息，特别是 班级ID (class_id)
        const studentInfoQuery = 'SELECT class_id FROM student WHERE user_id = ?;';
        const [studentInfo] = await db.query(studentInfoQuery, [userId]);

        if (!studentInfo || !studentInfo.class_id) {
            console.warn(`[getUpcomingExamsByStudent] No student or class info found for user_id: ${userId}`);
            return [];
        }

        // 2. 查询与该学生班级直接关联的考试ID，以及所有未关联任何班级的"全体"考试ID
        const upcomingExamsQuery = `
            SELECT
                e.id AS exam_id,
                e.exam_name,
                DATE_FORMAT(e.exam_date, '%Y-%m-%d %H:%i') AS exam_date,
                e.exam_type,
                COALESCE(GROUP_CONCAT(sub.subject_name ORDER BY sub.id SEPARATOR ','), '') AS subjects
            FROM
                exam e
            LEFT JOIN 
                exam_subject es ON e.id = es.exam_id
            LEFT JOIN 
                subject sub ON es.subject_id = sub.id
            WHERE
                e.exam_date >= CURDATE() AND
                e.status IN (0, 1) AND (
                    -- 匹配与学生班级关联的考试
                    EXISTS (
                        SELECT 1
                        FROM exam_class_link ecl
                        WHERE ecl.exam_id = e.id AND ecl.class_id = ?
                    )
                    OR
                    -- 匹配没有关联任何班级的"全体"考试
                    NOT EXISTS (
                        SELECT 1
                        FROM exam_class_link ecl2
                        WHERE ecl2.exam_id = e.id
                    )
                )
            GROUP BY
                e.id, e.exam_name, e.exam_date, e.exam_type
            ORDER BY
                e.exam_date ASC;
        `;
        
        const exams = await db.query(upcomingExamsQuery, [studentInfo.class_id]);
        
        console.log(`[getUpcomingExamsByStudent] Found ${exams.length} upcoming exams for student with user_id ${userId} in class_id ${studentInfo.class_id}.`);
        return exams;

    } catch (error) {
        console.error(`[getUpcomingExamsByStudent] Error fetching upcoming exams for user ID ${userId}:\n`, error);
        throw error;
    }
}

module.exports = {
  getScoreList,
  getScoreDetail,
  getStudentScore,
  getStudentScoreByExamId,
  saveStudentScore,
  getClassScores,
  getScoreStats,
  getExamTypeOptions,
  getSubjectOptions,
  testApi,
  getStudentScoreStats,
  getStudentScoreSummary,
  getClassScoreStats,
  getScoresByStudentAndExam,
  generateDetailedScoreReport,
  getExamsTakenByStudent,
  getUpcomingExamsByStudent,
}; 