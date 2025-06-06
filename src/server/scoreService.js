const db = require('./db');
const logService = require('./logService');

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
  const report = {
    student_info: null,
    class_info: null,
    exam_info: null,
    subject_details: [],
    total_score_details: {
      student_total_score: null, // Initialize to null
      class_average_total_score: null,
      class_total_score_rank: null,
      grade_total_score_rank: null
    }
  };

  try {
    console.log(`[scoreService] Generating detailed score report for student ID: ${studentId}, exam ID: ${examId}`);

    // --- 1. Fetch Basic Information ---
    const studentInfoQuery = `
      SELECT 
        s.id, 
        s.name, 
        s.student_id as student_id_str, 
        c.id as class_id, 
        c.class_name 
      FROM student s 
      LEFT JOIN class c ON s.class_id = c.id 
      WHERE s.id = ?
    `;
    const studentRows = await db.query(studentInfoQuery, [studentId]);
    if (!studentRows || studentRows.length === 0) {
      console.warn(`[scoreService] generateDetailedScoreReport: Student not found for ID ${studentId}`);
      return null;
    }
    const studentData = studentRows[0];
    report.student_info = { id: studentData.id, name: studentData.name, student_id_str: studentData.student_id_str };
    report.class_info = studentData.class_id ? { id: studentData.class_id, name: studentData.class_name } : null;

    const examInfoQuery = `
      SELECT 
        e.id, 
        e.exam_name, 
        DATE_FORMAT(e.exam_date, '%Y-%m-%d') as exam_date, 
        e.subjects 
      FROM exam e 
      WHERE e.id = ?
    `;
    const examRows = await db.query(examInfoQuery, [examId]);
    if (!examRows || examRows.length === 0) {
      console.warn(`[scoreService] generateDetailedScoreReport: Exam not found for ID ${examId}`);
      return null;
    }
    const examData = examRows[0];
    const examSubjectList = examData.subjects ? examData.subjects.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
    report.exam_info = { id: examData.id, name: examData.exam_name, date: examData.exam_date, subjects: examSubjectList };

    if (examSubjectList.length === 0) {
      console.warn(`[scoreService] generateDetailedScoreReport: Exam ID ${examId} has no subjects listed.`);
      return report; // Return report with basic info and empty scores
    }

    const subjectPlaceholders = examSubjectList.map(() => '?').join(',');
    
    // --- 2. Fetch student's specific scores for each subject ---
    const studentScoresParams = [studentId, examId, ...examSubjectList];
    // Ensure subjectPlaceholders is not empty before using it in IN clause
    let studentSpecificScoresRaw = [];
    if (subjectPlaceholders.length > 0) {
        const studentScoresQuery = `
            SELECT subject, score 
            FROM student_score 
            WHERE student_id = ? AND exam_id = ? AND subject IN (${subjectPlaceholders})
        `;
        studentSpecificScoresRaw = await db.query(studentScoresQuery, studentScoresParams);
    }
    
    const studentScoresMap = studentSpecificScoresRaw.reduce((map, item) => {
        const scoreVal = parseFloat(item.score);
        map[item.subject] = !isNaN(scoreVal) ? scoreVal : null; // Store null if score is not a valid number
        return map;
    }, {});

    let studentTotalScoreSum = 0;
    let studentValidScoresCount = 0;

    report.subject_details = examSubjectList.map(subject => {
        const score = studentScoresMap[subject]; 
        const finalStudentScore = (score !== undefined && score !== null) ? score : null;

        if (finalStudentScore !== null) {
            studentTotalScoreSum += finalStudentScore;
            studentValidScoresCount++;
        }
        return {
            subject: subject,
            student_score: finalStudentScore,
            class_average_score: null,
            class_rank: null,
        };
    });

    report.total_score_details.student_total_score = studentValidScoresCount > 0 ? parseFloat(studentTotalScoreSum.toFixed(2)) : null;

    // --- 3. Fetch scores for CLASS statistics ---
    let classRawScores = [];
    if (report.class_info && report.class_info.id && subjectPlaceholders.length > 0) {
        const classScoresParams = [report.class_info.id, examId, ...examSubjectList];
        const classScoresQuery = `
            SELECT ss.student_id, s.name as student_name, ss.subject, ss.score 
            FROM student_score ss 
            JOIN student s ON ss.student_id = s.id 
            WHERE s.class_id = ? AND ss.exam_id = ? AND ss.subject IN (${subjectPlaceholders})
        `;
        classRawScores = await db.query(classScoresQuery, classScoresParams);
    }
    
    // --- 4. Fetch scores for GRADE statistics (all students in the exam) ---
    let gradeRawScores = [];
    if (subjectPlaceholders.length > 0) {
        const gradeAllScoresParams = [examId, ...examSubjectList];
        const gradeAllScoresQuery = `
            SELECT ss.student_id, s.name as student_name, ss.subject, ss.score 
            FROM student_score ss 
            JOIN student s ON ss.student_id = s.id 
            WHERE ss.exam_id = ? AND ss.subject IN (${subjectPlaceholders})
        `;
        gradeRawScores = await db.query(gradeAllScoresQuery, gradeAllScoresParams);
    }

    // Helper to process raw scores (for class or grade)
    // This helper can be an inner function or defined in the same scope as calculateRank
    // Helper to process raw scores (for class or grade)
    // This helper should be an inner function of generateDetailedScoreReport or defined in a scope it can access report and calculateRank
    const processScoreGroup = (rawScoresForGroup, groupType) => {
      const scoresByStudentSubject = rawScoresForGroup.reduce((acc, item) => {
          acc[item.student_id] = acc[item.student_id] || {};
          const scoreVal = parseFloat(item.score);
          acc[item.student_id][item.subject] = !isNaN(scoreVal) ? scoreVal : null;
          return acc;
      }, {});

      // Calculate subject averages and ranks if this is for the class
      if (groupType === 'class') {
          report.subject_details.forEach(subjectDetail => { // This loop iterates through each subject ONCE for class stats
              const scoresForThisSubjectInGroup = [];
              for (const sidInGroup in scoresByStudentSubject) {
                  if (scoresByStudentSubject[sidInGroup].hasOwnProperty(subjectDetail.subject)) {
                      const score = scoresByStudentSubject[sidInGroup][subjectDetail.subject];
                      if (score !== null) { // Only consider non-null scores for average and ranking pool
                          scoresForThisSubjectInGroup.push(score);
                      }
                  }
              }

              if (scoresForThisSubjectInGroup.length > 0) {
                  const sum = scoresForThisSubjectInGroup.reduce((a, b) => a + b, 0);
                  subjectDetail.class_average_score = parseFloat((sum / scoresForThisSubjectInGroup.length).toFixed(2));
              } else {
                  subjectDetail.class_average_score = null; // No participants, average is null
              }
              
              // Student's rank for this subject within the class
              console.log(`[scoreService DEBUG] Calculating class_rank for subject: '${subjectDetail.subject}'`);
              console.log(`[scoreService DEBUG]   - Student's score for this subject:`, subjectDetail.student_score);
              console.log(`[scoreService DEBUG]   - Scores in class for this subject (for ranking pool):`, JSON.stringify(scoresForThisSubjectInGroup));
              
              subjectDetail.class_rank = calculateRank(subjectDetail.student_score, scoresForThisSubjectInGroup);
              
              console.log(`[scoreService DEBUG]   - Calculated class_rank:`, subjectDetail.class_rank);
          });
      }

      // Calculate total scores and ranks for the group (class or grade)
      const groupTotalScoresArray = []; // Array of valid total scores for ranking and average
      for (const sidInGroup in scoresByStudentSubject) {
          let currentStudentTotal = 0;
          let currentStudentValidSubjects = 0;
          examSubjectList.forEach(subject => { // Iterate through all possible subjects for the exam
              const score = scoresByStudentSubject[sidInGroup][subject]; 
              if (score !== null && score !== undefined) { 
                  currentStudentTotal += score;
                  currentStudentValidSubjects++;
              }
          });
          if (currentStudentValidSubjects > 0) { 
              groupTotalScoresArray.push(parseFloat(currentStudentTotal.toFixed(2)));
          }
      }

      if (groupType === 'class') {
          if (groupTotalScoresArray.length > 0) {
              const totalSum = groupTotalScoresArray.reduce((a, b) => a + b, 0);
              report.total_score_details.class_average_total_score = parseFloat((totalSum / groupTotalScoresArray.length).toFixed(2));
          } else {
              report.total_score_details.class_average_total_score = null; 
          }
          report.total_score_details.class_total_score_rank = calculateRank(report.total_score_details.student_total_score, groupTotalScoresArray);
      } else if (groupType === 'grade') {
          report.total_score_details.grade_total_score_rank = calculateRank(report.total_score_details.student_total_score, groupTotalScoresArray);
      }
  };

    // Process for class if class_info exists
    if (report.class_info && report.class_info.id) {
        processScoreGroup(classRawScores, 'class');
    }
    // Process for grade (using all exam scores)
    processScoreGroup(gradeRawScores, 'grade'); 

    console.log(`[scoreService] Successfully generated detailed score report for student ID: ${studentId}, exam ID: ${examId}`);
    return report;

  } catch (error) {
    console.error(`[scoreService] Error in generateDetailedScoreReport for student ID: ${studentId}, exam ID: ${examId}:`, error);
    // Consider logging with a logging service if available, e.g.:
    // if (global.logService) { // Or however logService is accessed
    //   await global.logService.addLogEntry('error', 'score_report_generation', `Failed for student ${studentId}, exam ${examId}: ${error.message}`, 'system');
    // }
    throw error; // Re-throw to be handled by the route
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
}; 