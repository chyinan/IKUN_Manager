const db = require('./db');

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
 * @param {Object} data 成绩数据
 * @returns {Promise<boolean>} 保存结果
 */
async function saveStudentScore(data) {
  if (!data || !data.student_id || !data.exam_id) {
    console.log('保存学生成绩失败: 数据、学生ID或考试ID为空');
    return false;
  }

  const { student_id, exam_id, ...subjectsFromFrontend } = data;
  let successful = true;
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    let upsertedCount = 0;
    const insertPromises = [];

    // Iterate through subjects sent from the frontend
    for (const subject in subjectsFromFrontend) {
      if (subjectsFromFrontend.hasOwnProperty(subject)) {
        const score = subjectsFromFrontend[subject];
        // Ensure score is a valid number before inserting
        if (typeof score === 'number' && !isNaN(score)) {
          const upsertQuery = `
            INSERT INTO student_score (student_id, exam_id, subject, score)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE score = VALUES(score)
          `;
          // Add the promise to the array
          insertPromises.push(
            connection.query(upsertQuery, [
              student_id,
              exam_id,
              subject,
              score
            ])
          );
        } else {
            console.warn(`Skipping subject '${subject}' due to invalid score value:`, score);
        }
      }
    }

    // Execute all insert/update queries concurrently within the transaction
    const results = await Promise.all(insertPromises);
    
    // Count successful upserts (both inserts and updates)
    results.forEach(([result]) => {
        if (result.affectedRows > 0 || result.warningStatus === 0) { // affectedRows > 0 for INSERT, warningStatus=0 usually for UPDATE
            upsertedCount++;
        }
    });

    console.log(`DEBUG: Upserted ${upsertedCount} score records for Student ID ${student_id}, Exam ID ${exam_id}.`);
    await connection.commit();
    console.log(`成功保存/更新学生ID: ${student_id}, 考试ID: ${exam_id} 的成绩`);

  } catch (error) {
    if (connection) await connection.rollback();
    console.error(`保存/更新学生成绩事务失败 (Student: ${student_id}, Exam: ${exam_id}):`, error);
    successful = false;
  } finally {
    if (connection) connection.release();
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
  getScoresByStudentAndExam
}; 