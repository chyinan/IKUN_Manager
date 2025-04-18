const db = require('./db');
const dayjs = require('dayjs'); // Import dayjs
const logService = require('./logService'); // Import logService

// 在服务启动时加载配置
let configCache = {};
async function loadConfig() {
  try {
    configCache = await db.getAllConfig();
    console.log('Student Service: Loaded config:', configCache);
  } catch (error) {
    console.error('Student Service: Failed to load config:', error);
    // Fallback or default regex can be set here if needed
    configCache.studentIdRegex = '^S\\d{8}$'; // Example fallback
  }
}
loadConfig(); // Load config when the service initializes

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
  console.log('准备添加学生数据:', studentData);
  
  // 使用缓存的配置进行验证
  const regexPattern = configCache.studentIdRegex;
  if (!regexPattern) {
     console.warn('Student Service: studentIdRegex not found in config cache, using default.');
  }
  const studentIdRegex = new RegExp(regexPattern || '^S\\d{8}$'); // Use loaded or fallback

  if (!studentIdRegex.test(studentData.student_id)) {
    console.log(`学号 ${studentData.student_id} 格式无效 (规则: ${regexPattern})`);
    throw new Error('学号格式无效');
  }

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
    const exists = await db.query(checkQuery, [studentData.student_id]);
    if (exists.length > 0) {
      throw new Error(`学号 "${studentData.student_id}" 已存在`);
    }

    // 插入学生记录
    const insertQuery = `
      INSERT INTO student 
        (student_id, name, gender, class_id, phone, email, join_date) 
      VALUES 
        (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await db.query(insertQuery, [
      studentData.student_id,
      studentData.name,
      studentData.gender,
      classId,
      studentData.phone || null,
      studentData.email || null,
      studentData.join_date
    ]);
    
    // 返回新添加的学生信息
    await logService.addLogEntry('database', 'create', `添加学生 ${studentData.name} (ID: ${result.insertId})`, 'System');
    return await getStudentDetail(result.insertId);
  } catch (error) {
    console.error('添加学生失败:', error);
    await logService.addLogEntry('database', 'error', `添加学生失败: ${error.message}`, 'System');
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
  console.log(`准备更新学生 ID ${id} 的数据:`, studentData);
  
  // 使用缓存的配置进行验证 (如果允许更新学号)
  if (studentData.student_id) { // Only validate if student_id is part of the update
      const regexPattern = configCache.studentIdRegex;
      if (!regexPattern) {
         console.warn('Student Service: studentIdRegex not found in config cache, using default.');
      }
      const studentIdRegex = new RegExp(regexPattern || '^S\\d{8}$'); // Use loaded or fallback
      if (!studentIdRegex.test(studentData.student_id)) {
        console.log(`学号 ${studentData.student_id} 格式无效 (规则: ${regexPattern})`);
        throw new Error('学号格式无效');
      }
  }

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
 * @param {number} id 学生ID
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

    // 1. 先查询学生学号
    const selectQuery = 'SELECT student_id FROM student WHERE id = ?';
    const [rows] = await connection.query(selectQuery, [id]);
    const student_id_str = rows.length > 0 ? rows[0].student_id : null;

    // 2. 执行删除操作
    // 假设数据库已设置级联删除学生成绩（ON DELETE CASCADE）
    const deleteQuery = 'DELETE FROM student WHERE id = ?';
    const [result] = await connection.query(deleteQuery, [id]);
    const success = result.affectedRows > 0;

    await connection.commit();

    if (success) {
      console.log(`学生删除成功, ID: ${id}, 学号: ${student_id_str}`);
    } else {
      console.log(`尝试删除学生失败或未找到记录, ID: ${id}`);
    }

    return { success, student_id_str };

  } catch (error) {
    if (connection) await connection.rollback();
    // Handle potential foreign key constraints if cascade delete is not set
    console.error(`删除学生数据库操作失败 (ID: ${id}):`, error);
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

// --- 新增：批量添加/更新学生 --- 
async function batchAddStudents(students) {
    console.log('[Batch Student Add] Starting batch add/update for', students.length, 'students.');
    const connection = await db.getConnection();
    let processedCount = 0;
    const errors = [];

    if (!students || students.length === 0) {
        return { success: true, processedCount: 0, errors: [] };
    }

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
        const studentIdsInBatch = new Set(); // 检查批次内学号是否重复
        for (let i = 0; i < students.length; i++) {
            const student = students[i];
            const rowNum = i + 2; // Assuming row number for error reporting

            // 检查批次内学号重复
            if (studentIdsInBatch.has(student.student_id)) {
                 errors.push({ row: rowNum, error: `学号 ${student.student_id} 在文件中重复` });
                 continue; // 跳过重复学号
            }
            studentIdsInBatch.add(student.student_id);

            // 查找班级ID
            const classId = classNameToIdMap[student.class_name];
            if (!classId) {
                errors.push({ row: rowNum, error: `班级 '${student.class_name}' 不存在` });
                continue; // 跳过无效班级
            }

            // 准备插入值 (确保与表列顺序一致)
            values.push([
                student.student_id, // 学号
                student.name,       // 姓名
                student.gender,     // 性别
                classId,            // 班级ID
                student.phone,      // 电话
                student.email,      // 邮箱
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
        logService.addLog({
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
        logService.addLog({
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
  getStudentStats,
  getMaxStudentId,
  batchAddStudents
}; 