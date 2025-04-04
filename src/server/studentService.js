const db = require('./db');

/**
 * 获取学生列表
 * @param {Object} params 查询参数
 * @returns {Promise<Array>} 学生列表
 */
async function getStudentList(params = {}) {
  try {
    // 构建基础查询
    let query = `
      SELECT 
        s.id, 
        s.student_id, 
        s.name, 
        s.gender,
        c.class_name,
        s.phone,
        s.email,
        s.join_date,
        s.create_time
      FROM 
        student s
      LEFT JOIN
        class c ON s.class_id = c.id
    `;

    // 添加查询条件
    const conditions = [];
    const values = [];

    if (params.name) {
      conditions.push('s.name LIKE ?');
      values.push(`%${params.name}%`);
    }

    if (params.studentId) {
      conditions.push('s.student_id LIKE ?');
      values.push(`%${params.studentId}%`);
    }

    if (params.classId) {
      conditions.push('s.class_id = ?');
      values.push(params.classId);
    }

    if (params.className) {
      conditions.push('c.class_name LIKE ?');
      values.push(`%${params.className}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // 添加排序
    query += ' ORDER BY s.student_id ASC';

    // 分页
    if (params.page && params.pageSize) {
      const offset = (params.page - 1) * params.pageSize;
      query += ' LIMIT ?, ?';
      values.push(offset, parseInt(params.pageSize));
    }

    // 执行查询
    const students = await db.query(query, values);
    
    console.log(`获取到 ${students.length} 条学生记录`);
    return students;
  } catch (error) {
    console.error('获取学生列表失败:', error);
    throw error;
  }
}

/**
 * 获取学生详情
 * @param {number} id 学生ID
 * @returns {Promise<Object>} 学生详情
 */
async function getStudentDetail(id) {
  try {
    const query = `
      SELECT 
        s.id, 
        s.student_id, 
        s.name, 
        s.gender,
        s.class_id,
        c.class_name,
        s.phone,
        s.email,
        s.join_date,
        s.create_time
      FROM 
        student s
      LEFT JOIN
        class c ON s.class_id = c.id
      WHERE 
        s.id = ?
    `;
    
    const students = await db.query(query, [id]);
    return students[0] || null;
  } catch (error) {
    console.error(`获取学生详情失败 (ID: ${id}):`, error);
    throw error;
  }
}

/**
 * 添加学生
 * @param {Object} studentData 学生数据
 * @returns {Promise<Object>} 添加的学生
 */
async function addStudent(studentData) {
  try {
    // 先获取班级ID
    let classId = null;
    if (studentData.className) {
      const classQuery = 'SELECT id FROM class WHERE class_name = ?';
      const classResult = await db.query(classQuery, [studentData.className]);
      if (classResult.length > 0) {
        classId = classResult[0].id;
      } else {
        throw new Error(`班级 "${studentData.className}" 不存在`);
      }
    }

    // 检查学号是否已存在
    const checkQuery = 'SELECT id FROM student WHERE student_id = ?';
    const exists = await db.query(checkQuery, [studentData.studentId]);
    if (exists.length > 0) {
      throw new Error(`学号 "${studentData.studentId}" 已存在`);
    }

    // 插入学生记录
    const insertQuery = `
      INSERT INTO student 
        (student_id, name, gender, class_id, phone, email, join_date) 
      VALUES 
        (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await db.query(insertQuery, [
      studentData.studentId,
      studentData.name,
      studentData.gender,
      classId,
      studentData.phone || null,
      studentData.email || null,
      studentData.joinDate
    ]);
    
    // 返回新添加的学生信息
    return await getStudentDetail(result.insertId);
  } catch (error) {
    console.error('添加学生失败:', error);
    throw error;
  }
}

/**
 * 更新学生
 * @param {number} id 学生ID
 * @param {Object} studentData 学生数据
 * @returns {Promise<Object>} 更新后的学生
 */
async function updateStudent(id, studentData) {
  try {
    // 获取新班级ID
    let newClassId = null; // Default to null or handle as needed
    if (studentData.className) {
      const classQuery = 'SELECT id FROM class WHERE class_name = ?';
      const classResult = await db.query(classQuery, [studentData.className]);
      if (classResult.length > 0) {
        newClassId = classResult[0].id;
      } else {
        throw new Error(`班级 "${studentData.className}" 不存在`);
      }
    }

    // 更新学生记录
    const updateQuery = `
      UPDATE student 
      SET 
        name = ?, 
        gender = ?, 
        class_id = ?, 
        phone = ?, 
        email = ?, 
        join_date = ?
      WHERE 
        id = ?
    `;
    
    await db.query(updateQuery, [
      studentData.name,
      studentData.gender,
      newClassId, // Use the potentially new class ID
      studentData.phone || null,
      studentData.email || null,
      studentData.joinDate,
      id
    ]);
    
    // 返回更新后的学生信息
    return await getStudentDetail(id);
  } catch (error) {
    console.error(`更新学生失败 (ID: ${id}):`, error);
    throw error;
  }
}

/**
 * 删除学生
 * @param {number} id 学生ID
 * @returns {Promise<boolean>} 删除结果
 */
async function deleteStudent(id) {
  try {
    // 删除学生记录
    const deleteQuery = 'DELETE FROM student WHERE id = ?';
    const result = await db.query(deleteQuery, [id]);
    
    return result.affectedRows === 1;
  } catch (error) {
    console.error(`删除学生失败 (ID: ${id}):`, error);
    throw error;
  }
}

/**
 * 批量删除学生
 * @param {number[]} ids 学生ID数组
 * @returns {Promise<boolean>} 删除结果
 */
async function batchDeleteStudent(ids) {
  try {
    // 批量删除学生
    const deleteQuery = 'DELETE FROM student WHERE id IN (?)';
    const result = await db.query(deleteQuery, [ids]);
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error(`批量删除学生失败 (IDs: ${ids.join(',')}):`, error);
    throw error;
  }
}

/**
 * 获取学生统计数据
 * @returns {Promise<Object>} 统计数据
 */
async function getStudentStats() {
  try {
    // 获取学生总数
    const totalQuery = 'SELECT COUNT(*) as total FROM student';
    const totalResult = await db.query(totalQuery);
    const total = totalResult[0].total;

    // 获取班级分布
    const classDistributionQuery = `
      SELECT 
        c.class_name,
        COUNT(s.id) as count
      FROM 
        student s
      JOIN
        class c ON s.class_id = c.id
      GROUP BY
        c.class_name
      ORDER BY
        count DESC
    `;
    const classDistribution = await db.query(classDistributionQuery);

    // 获取性别分布
    const genderDistributionQuery = `
      SELECT 
        gender,
        COUNT(*) as count
      FROM 
        student
      GROUP BY
        gender
    `;
    const genderDistribution = await db.query(genderDistributionQuery);

    // 获取最近入学学生
    const recentStudentsQuery = `
      SELECT 
        s.id, 
        s.student_id, 
        s.name, 
        c.class_name,
        s.join_date
      FROM 
        student s
      LEFT JOIN
        class c ON s.class_id = c.id
      ORDER BY
        s.join_date DESC
      LIMIT 5
    `;
    const recentStudents = await db.query(recentStudentsQuery);

    return {
      total,
      classDistribution,
      genderDistribution,
      recentStudents
    };
  } catch (error) {
    console.error('获取学生统计数据失败:', error);
    throw error;
  }
}

/**
 * 获取最大学生ID
 * @returns {Promise<string>} 最大学生ID
 */
async function getMaxStudentId() {
  try {
    const query = 'SELECT MAX(student_id) as maxId FROM student';
    const result = await db.query(query);
    return result[0].maxId || '2024000';
  } catch (error) {
    console.error('获取最大学生ID失败:', error);
    throw error;
  }
}

module.exports = {
  getStudentList,
  getStudentDetail,
  addStudent,
  updateStudent,
  deleteStudent,
  batchDeleteStudent,
  getStudentStats,
  getMaxStudentId
}; 