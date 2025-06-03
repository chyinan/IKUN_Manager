const db = require('./db');
const dayjs = require('dayjs'); // Import dayjs
const logService = require('./logService'); // Import logService

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
 * @param {Object} studentData 学生数据 { student_id, name, gender, className, phone, email, join_date }
 * @returns {Promise<Object>} 添加的学生完整信息
 */
async function addStudent(studentData) {
  console.log('准备添加学生数据:', studentData);
  let connection;
  
  // --- Regex Validation ---
  const studentIdRegex = /^S\d{7}$/;
  // Frontend might send studentId (camelCase) or student_id (snake_case from other backend calls)
  const studentIdFromData = studentData.studentId || studentData.student_id;
  const studentIdToTest = studentIdFromData ? String(studentIdFromData).trim() : ''; 
  console.log(`Student Service: Validating trimmed ID '${studentIdToTest}' against hardcoded regex ${studentIdRegex}`);
  if (!studentIdToTest || !studentIdRegex.test(studentIdToTest)) { 
    console.log(`学号 '${studentIdToTest}' (原始: '${studentIdFromData}') 格式无效 (硬编码规则: /^S\d{7}$/)`);
    throw new Error('学号格式无效');
  }
  // --- End Regex Validation ---

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. 先获取班级ID (use className from studentData)
    let classId = null;
    if (studentData.className) {
      const classQuery = 'SELECT id FROM class WHERE class_name = ?';
      const [classResult] = await connection.query(classQuery, [studentData.className]);
      if (classResult && classResult.length > 0) {
        classId = classResult[0].id;
      } else {
        throw new Error(`班级 "${studentData.className}" 不存在`);
      }
    }

    // 2. 检查学号是否已存在 (use trimmed ID for check)
    const checkQuery = 'SELECT id FROM student WHERE student_id = ?';
    const [exists] = await connection.query(checkQuery, [studentIdToTest]); 
    if (exists && exists.length > 0) {
      throw new Error(`学号 "${studentIdToTest}" 已存在`);
    }

    // 3. 插入学生记录 (use trimmed ID for insert)
    const insertQuery = `
      INSERT INTO student 
        (student_id, name, gender, class_id, phone, email, join_date) 
      VALUES 
        (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [insertResult] = await connection.query(insertQuery, [
      studentIdToTest, 
      studentData.name,
      studentData.gender,
      classId,
      studentData.phone || null,
      studentData.email || null,
      studentData.join_date
    ]);
    const newStudentId = insertResult.insertId;

    if (!newStudentId) {
      throw new Error('新增学生失败，数据库未返回插入ID');
    }
    
    // Commit the transaction FIRST
    await connection.commit();
    console.log(`[studentService] 新增学生记录 (ID: ${newStudentId}, 学号: ${studentIdToTest}) 已成功提交到数据库.`);

    // Log AFTER successful commit
    await logService.addLogEntry({
      type: 'database',
      operation: '新增',
      content: `新增学生: ${studentData.name} (学号: ${studentIdToTest}, 班级: ${studentData.className})`,
      operator: 'system' // Or context-based operator
    });
    console.log(`[studentService] 新增学生日志已记录.`);

    // Fetch and return the newly added student's complete information
    return getStudentDetail(newStudentId); // getStudentDetail uses its own connection management

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('[studentService] 添加学生失败:', error);
    // Log error using correct object structure
    await logService.addLogEntry({
        type: 'database', 
        operation: '新增失败', 
        content: `添加学生 ${studentData.name || '未知'} (学号: ${studentIdToTest || '未知'}) 失败: ${error.message}`,
        operator: 'system'
    });
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * 更新学生
 * @param {number} id 学生ID
 * @param {Object} studentData 学生数据
 * @returns {Promise<Object>} 更新后的学生
 */
async function updateStudent(id, studentData) {
  console.log(`准备更新学生 ID ${id} 的数据:`, studentData);
  
  // --- Hardcoded Validation (if student_id is being updated) ---
  let studentIdToTest = null;
  if (studentData.student_id !== undefined) { 
      studentIdToTest = String(studentData.student_id).trim();
      const studentIdRegex = /^S\d{7}$/; // Use literal directly
      console.log(`Student Service Update: Validating trimmed ID '${studentIdToTest}' against hardcoded regex ${studentIdRegex}`);
      if (!studentIdToTest || !studentIdRegex.test(studentIdToTest)) {
        console.log(`学号 '${studentIdToTest}' (原始: '${studentData.student_id}') 格式无效 (硬编码规则: /^S\d{7}$/)`);
        throw new Error('学号格式无效');
      }
      studentData.student_id = studentIdToTest; 
  }
  // --- End Hardcoded Validation ---

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
    const fields = [];
    const values = [];
    const allowedFields = ['student_id', 'name', 'gender', 'class_id', 'phone', 'email', 'join_date'];

    for (const field of allowedFields) {
      if (studentData[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(studentData[field]);
      }
    }

    if (fields.length === 0) {
      throw new Error('没有提供需要更新的字段');
    }

    const sql = `UPDATE student SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);

    const result = await db.query(sql, values);
    if (result.affectedRows === 0) {
      throw new Error('未找到要更新的学生');
    }
    console.log(`学生 ID ${id} 更新成功`);
    await logService.addLogEntry('database', 'update', `更新学生 ID ${id} 的信息`, 'System');
    return await getStudentDetail(id);
  } catch (error) {
    console.error(`更新学生失败 (ID: ${id}):`, error);
    await logService.addLogEntry('database', 'error', `更新学生 ID ${id} 失败: ${error.message}`, 'System');
    throw error;
  }
}

/**
 * 删除学生
 * @param {number} id 学生ID (internal DB id)
 * @returns {Promise<{success: boolean, student_id_str: string | null}>} 删除结果及学生学号
 */
async function deleteStudent(id) {
  let connection;
  try {
    if (!id || isNaN(id)) {
      throw new Error('无效的学生ID');
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. 先查询学生学号、姓名和班级名称 (for logging)
    const selectQuery = `
      SELECT s.student_id, s.name, c.class_name 
      FROM student s
      LEFT JOIN class c ON s.class_id = c.id
      WHERE s.id = ?
    `;
    const [rows] = await connection.query(selectQuery, [id]);
    const student_id_str = rows.length > 0 ? rows[0].student_id : null;
    const student_name = rows.length > 0 ? rows[0].name : '未知学生';
    const class_name = rows.length > 0 ? rows[0].class_name : '未知班级';

    // 2. 执行删除操作
    const deleteQuery = 'DELETE FROM student WHERE id = ?';
    const [result] = await connection.query(deleteQuery, [id]);
    const success = result.affectedRows > 0;

    // Commit the transaction FIRST
    await connection.commit();
    console.log(`[studentService] 删除学生操作 (ID: ${id}, 学号: ${student_id_str}) 已成功提交到数据库.`);

    // Log AFTER successful commit and if deletion was successful
    if (success && student_id_str) {
      await logService.addLogEntry({
        type: 'database',
        operation: '删除',
        content: `删除学生: ${student_name} (学号: ${student_id_str}, 班级: ${class_name})`,
        operator: 'system' // Or context-based operator
      });
      console.log(`[studentService] 删除学生日志已记录 (学号: ${student_id_str}).`);
    } else if (success) {
      console.log(`[studentService] 学生 (ID: ${id}) 已删除，但未找到足够信息用于完整日志记录。`);
    } else {
      console.log(`[studentService] 尝试删除学生失败或未找到记录, ID: ${id}`);
    }

    return { success, student_id_str };

  } catch (error) {
    if (connection) await connection.rollback();
    console.error(`[studentService] 删除学生数据库操作失败 (ID: ${id}):`, error);
    // Log error using correct object structure
    await logService.addLogEntry({
        type: 'database', 
        operation: '删除失败', 
        content: `删除学生 (ID: ${id}) 失败: ${error.message}`,
        operator: 'system'
    });
    throw error;
  } finally {
    if (connection) connection.release();
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
 * @returns {Promise<Object>} 学生统计数据
 */
async function getStudentStats() {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. 学生总数
    const [totalStudentsRows] = await connection.query('SELECT COUNT(*) as totalStudents FROM student');
    const totalStudents = totalStudentsRows[0].totalStudents;

    // 2. 按性别统计
    const [genderCountsRows] = await connection.query('SELECT gender, COUNT(*) as count FROM student GROUP BY gender');
    const genderCounts = genderCountsRows.reduce((acc, row) => {
      acc[row.gender] = row.count;
      return acc;
    }, {});

    // 3. 按班级统计 (显示班级名称)
    const [classCountsRows] = await connection.query(`
      SELECT c.class_name as className, COUNT(s.id) as count 
      FROM student s
      JOIN class c ON s.class_id = c.id
      GROUP BY c.class_name
      ORDER BY count DESC
    `);
    // classCounts is already an array of { className: string, count: number }

    await connection.commit();

    const stats = {
      totalStudents,
      genderCounts,
      classCounts: classCountsRows 
    };

    // Log the operation
    await logService.addLogEntry({
      type: 'system',
      operation: '统计查询',
      content: '查询学生统计数据成功',
      operator: 'system' 
    });

    return stats;

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('获取学生统计数据失败:', error);
    await logService.addLogEntry({
        type: 'error',
        operation: '统计查询失败',
        content: `查询学生统计数据时出错: ${error.message}`,
        operator: 'system'
    });
    throw error;
  } finally {
    if (connection) connection.release();
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

// --- 批量添加/更新学生 --- 
async function batchAddStudents(students) {
    console.log('[Batch Student Add] Starting batch add/update for', students.length, 'students.');
    const connection = await db.getConnection();
    let processedCount = 0;
    const errors = [];

    if (!students || students.length === 0) {
        return { success: true, processedCount: 0, errors: [] };
    }

    // --- Hardcoded Validation using Regex Literal ---
    const studentIdRegex = /^S\d{7}$/; // Use literal directly
    console.log(`[Batch Student Add] Using hardcoded regex for validation: ${studentIdRegex}`);
    // --- End Hardcoded Validation ---

    try {
        await connection.beginTransaction();
        console.log('[Batch Student Add] Transaction started.');

        // 1. 获取所有班级名称到ID的映射
        const [classes] = await connection.query('SELECT id, class_name FROM class');
        const classNameToIdMap = classes.reduce((map, cls) => {
            map[cls.class_name] = cls.id;
            return map;
        }, {});
        console.log('[Batch Student Add] Class name to ID map created.');

        // 2. 准备批量插入/更新的数据
        const values = [];
        const studentIdsInBatch = new Set(); 
        for (let i = 0; i < students.length; i++) {
            const student = students[i];
            const rowNum = i + 2; 

            const studentIdToTest = student.student_id ? String(student.student_id).trim() : '';

            if (studentIdsInBatch.has(studentIdToTest)) {
                 errors.push({ row: rowNum, error: `学号 ${studentIdToTest} 在文件中重复` });
                 continue; 
            }
            if(studentIdToTest) studentIdsInBatch.add(studentIdToTest);

            // -- Validate student_id format using hardcoded regex --
            if (!studentIdToTest || !studentIdRegex.test(studentIdToTest)) {
                 errors.push({ row: rowNum, error: `学号 ${studentIdToTest} 格式无效 (硬编码规则: /^S\d{7}$/)` });
                 continue;
            }

            // 查找班级ID
            const classId = classNameToIdMap[student.class_name];
            if (!classId) {
                errors.push({ row: rowNum, error: `班级 '${student.class_name}' 不存在` });
                continue; // 跳过无效班级
            }

            // 准备插入值 (确保与表列顺序一致, use trimmed ID)
            values.push([
                studentIdToTest,    // 学号
                student.name,       // 姓名
                student.gender,     // 性别
                classId,            // 班级ID
                student.phone || null, // 电话 (allow null)
                student.email || null, // 邮箱 (allow null)
                student.join_date   // 入学时间
            ]);
        }

        if (values.length === 0) {
            console.log('[Batch Student Add] No valid student data to process after validation.');
            await connection.rollback();
            return { success: true, processedCount: 0, errors };
        }

        // 3. 执行批量插入/更新
        const sql = `
            INSERT INTO student (student_id, name, gender, class_id, phone, email, join_date) 
            VALUES ? 
            ON DUPLICATE KEY UPDATE 
                name = VALUES(name),
                gender = VALUES(gender),
                class_id = VALUES(class_id),
                phone = VALUES(phone),
                email = VALUES(email),
                join_date = VALUES(join_date),
                update_time = CURRENT_TIMESTAMP
        `;

        console.log(`[Batch Student Add] Executing batch INSERT/UPDATE for ${values.length} students.`);
        const [result] = await connection.query(sql, [values]);
        console.log('[Batch Student Add] DB Insert/Update Result:', result);

        // affectedRows 返回的是 (新增数 + 更新数 * 2), processedCount 更准确反映处理的行数
        processedCount = values.length; 

        await connection.commit();
        console.log('[Batch Student Add] Transaction committed. Processed rows:', processedCount);

        // 记录日志
        logService.addLogEntry({
            type: 'database',
            operation: '批量导入',
            content: `学生: 处理了 ${processedCount} 条记录，其中错误 ${errors.length} 条`,
            operator: 'system' // 或者从请求中获取用户名
        });

        return { success: true, processedCount, errors };

    } catch (error) {
        await connection.rollback();
        console.error('[Batch Student Add] Error during batch operation:', error);
        // 记录错误日志
        logService.addLogEntry({
            type: 'database',
            operation: '批量导入失败',
            content: `学生: ${error.message}`,
            operator: 'system'
        });
        // 返回包含数据库错误的通用消息和详细错误
        errors.push({ row: 'N/A', error: `数据库操作失败: ${error.message}` });
        return { success: false, processedCount, errors };
    } finally {
        if (connection) {
            connection.release();
            console.log('[Batch Student Add] Database connection released.');
        }
    }
}
// --- 结束：批量添加/更新学生 ---

module.exports = {
  getStudentList,
  getStudentDetail,
  addStudent,
  updateStudent,
  deleteStudent,
  batchDeleteStudent,
  batchAddStudents,
  getStudentStats
}; 