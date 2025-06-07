const db = require('./db');
const logService = require('./logService'); // Import logService

/**
 * 获取班级列表
 * @param {Object} params 查询参数
 * @returns {Promise<Array>} 班级列表
 */
async function getClassList(params = {}) {
  try {
    // 构建基础查询
    let query = `
      SELECT 
        c.id, 
        c.class_name, 
        c.teacher, 
        c.description,
        c.create_time,
        (SELECT COUNT(*) FROM student s WHERE s.class_id = c.id) AS student_count 
      FROM 
        class c
    `;

    // 添加查询条件
    const conditions = [];
    const values = [];

    if (params.className) {
      conditions.push('c.class_name LIKE ?');
      values.push(`%${params.className}%`);
    }

    if (params.teacher) {
      conditions.push('c.teacher LIKE ?');
      values.push(`%${params.teacher}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // 添加排序
    query += ' ORDER BY c.id ASC';

    // 执行查询
    const classes = await db.query(query, values);
    
    console.log(`获取到 ${classes.length} 条班级记录`);
    return classes;
  } catch (error) {
    console.error('获取班级列表失败:', error);
    throw error;
  }
}

/**
 * 获取班级详情
 * @param {number} id 班级ID
 * @returns {Promise<Object>} 班级详情
 */
async function getClassDetail(id) {
  try {
    const query = `
      SELECT 
        c.id, 
        c.class_name, 
        c.teacher, 
        c.description,
        c.create_time
      FROM 
        class c
      WHERE 
        c.id = ?
    `;
    
    const classes = await db.query(query, [id]);
    return classes[0] || null;
  } catch (error) {
    console.error(`获取班级详情失败 (ID: ${id}):`, error);
    throw error;
  }
}

/**
 * 获取班级中的学生列表
 * @param {number} classId 班级ID
 * @returns {Promise<Array>} 学生列表
 */
async function getStudentsInClass(classId) {
  try {
    const query = `
      SELECT 
        s.id, 
        s.student_id, 
        s.name, 
        s.gender,
        s.phone,
        s.email,
        s.join_date,
        c.class_name
      FROM 
        student s
      JOIN
        class c ON s.class_id = c.id
      WHERE 
        s.class_id = ?
      ORDER BY
        s.name ASC
    `;
    
    const students = await db.query(query, [classId]);
    return students;
  } catch (error) {
    console.error(`获取班级学生失败 (班级ID: ${classId}):`, error);
    throw error;
  }
}

/**
 * 新增班级
 * @param {Object} classData 班级数据 { class_name, teacher, description }
 * @returns {Promise<Object>} 包含新增班级ID和完整信息的对象
 */
async function addClass(classData) {
  let connection;
  try {
    const { class_name, teacher, description } = classData;

    if (!class_name || !teacher) {
      throw new Error('班级名称和班主任不能为空');
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const sql = `
      INSERT INTO class (class_name, teacher, description)
      VALUES (?, ?, ?)
    `;
    const [insertResult] = await connection.query(sql, [class_name, teacher, description]);
    const newClassId = insertResult.insertId;

    if (!newClassId) {
      throw new Error('新增班级失败，数据库未返回插入ID');
    }

    // Commit the transaction FIRST
    await connection.commit();
    console.log(`[classService] 班级记录 (ID: ${newClassId}) 已成功提交到数据库.`);

    // Log AFTER successful commit
    await logService.addLogEntry({
      type: 'database',
      operation: '新增',
      content: `新增班级: ${class_name} (ID: ${newClassId}, 班主任: ${teacher})`,
      operator: 'system' // Or get operator from request context if available
    });
    console.log(`[classService] 新增班级日志已记录.`);

    // Fetch the newly created class to return complete info (optional but good practice)
    const [rows] = await connection.query('SELECT * FROM class WHERE id = ?', [newClassId]);
    
    // Return the fetched class data
    return rows[0]; 

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('[classService] 新增班级失败:', error);
    // Check for unique constraint error
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('班级名称已存在');
    }
    throw error; // Re-throw other errors
  } finally {
    if (connection) connection.release();
  }
}

/**
 * 删除班级
 * @param {number} id 班级ID
 * @returns {Promise<{success: boolean, class_name: string | null}>} 删除结果及班级名称
 */
async function deleteClass(id) {
  let connection;
  try {
    if (!id || isNaN(id)) {
      throw new Error('无效的班级ID');
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. 检查班级下是否有学生
    const checkStudentsQuery = 'SELECT COUNT(*) as studentCount FROM student WHERE class_id = ?';
    const [studentRows] = await connection.query(checkStudentsQuery, [id]);
    const studentCount = studentRows[0].studentCount;

    if (studentCount > 0) {
      // 如果有学生，则抛出错误，阻止删除
      throw new Error(`无法删除：该班级下仍有 ${studentCount} 名学生`);
    }

    // 2. 先查询班级名称 (for logging)
    const selectQuery = 'SELECT class_name FROM class WHERE id = ?';
    const [rows] = await connection.query(selectQuery, [id]);
    const class_name = rows.length > 0 ? rows[0].class_name : null;

    // 如果班级不存在
    if (!class_name) {
        await connection.rollback(); // 回滚事务
        return { success: false, class_name: null };
    }

    // 3. 执行删除操作
    const deleteQuery = 'DELETE FROM class WHERE id = ?';
    const [result] = await connection.query(deleteQuery, [id]);
    const success = result.affectedRows > 0;

    // Commit the transaction FIRST
    await connection.commit();
    console.log(`[classService] 删除班级操作 (ID: ${id}) 已成功提交到数据库.`);

    // Log AFTER successful commit and if deletion was successful
    if (success && class_name) {
      await logService.addLogEntry({
        type: 'database',
        operation: '删除',
        content: `删除班级: ${class_name} (ID: ${id})`,
        operator: 'system' // Or get operator from context
      });
      console.log(`[classService] 删除班级日志已记录.`);
    }

    return { success, class_name };

  } catch (error) {
    if (connection) await connection.rollback();
    // 检查是否是我们主动抛出的错误
    if (error.message.includes('无法删除：该班级下仍有')) {
        throw error; // 直接重新抛出业务逻辑错误
    }
    // 检查数据库级别的外键约束错误 (以防万一)
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
        throw new Error('无法删除：该班级下仍有学生 (数据库约束)');
    }
    console.error(`[classService] 删除班级数据库操作失败 (ID: ${id}):`, error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * 更新班级信息
 * @param {number} id 班级ID
 * @param {Object} classData 班级更新数据 { class_name?, teacher?, description? }
 * @returns {Promise<Object>} 更新后的班级信息
 */
async function updateClass(id, classData) {
  try {
    const allowedFields = ['class_name', 'teacher', 'description'];
    const fieldsToUpdate = {};
    
    for (const field of allowedFields) {
      // 允许更新为空字符串或 null，但不允许 undefined
      if (classData[field] !== undefined) { 
        fieldsToUpdate[field] = classData[field];
      }
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
      throw new Error('没有提供有效的更新字段');
    }
    
    // 检查核心字段是否为空（如果它们在更新字段中）
    if (fieldsToUpdate.class_name === '') {
        throw new Error('班级名称不能为空');
    }
    if (fieldsToUpdate.teacher === '') {
        throw new Error('班主任不能为空');
    }

    const setClauses = Object.keys(fieldsToUpdate).map(key => `${key} = ?`).join(', ');
    const sql = `UPDATE class SET ${setClauses}, update_time = CURRENT_TIMESTAMP WHERE id = ?`;
    const updateValues = [...Object.values(fieldsToUpdate), id];

    console.log('Executing Class Update Query:', sql, updateValues);
    const result = await db.query(sql, updateValues);

    if (result.affectedRows === 0) {
      throw new Error(`未找到 ID 为 ${id} 的班级记录`);
    }

    console.log(`班级 ID ${id} 更新成功`);
    // 返回更新后的信息（可以重新查询以获取最新数据，这里简化处理）
    return { id, ...fieldsToUpdate }; 

  } catch (error) {
    console.error(`更新班级 ID ${id} 失败:`, error);
    // 检查是否是唯一性约束错误 (uk_class_name)
    if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('班级名称已存在');
    }
    throw error; // 重新抛出错误
  }
}

/**
 * 批量添加班级 (用于导入)
 * @param {Array<Object>} classes 经过验证的班级数据数组 { class_name, teacher, description }
 * @returns {Promise<{ success: boolean, processedCount: number, errors: Array<{ rowData: object, error: string }> }>} 导入结果
 */
async function batchAddClasses(classes) {
  if (!classes || classes.length === 0) {
    return { success: false, processedCount: 0, errors: [{ rowData: {}, error: '没有提供有效的班级数据' }] };
  }

  let connection;
  let processedCount = 0;
  const errors = [];

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 构建批量插入/更新语句 (基于 class_name 唯一键)
    const placeholders = classes.map(() => '(?, ?, ?, CURRENT_TIMESTAMP)'); // class_name, teacher, description, create_time
    const sql = `
      INSERT INTO class (class_name, teacher, description, create_time)
      VALUES ${placeholders.join(', ')}
      ON DUPLICATE KEY UPDATE teacher=VALUES(teacher), description=VALUES(description), update_time=CURRENT_TIMESTAMP
    `;

    const values = [];
    for (const cls of classes) {
      // 简单验证 (更复杂的验证应在路由层完成)
      if (!cls.class_name || !cls.teacher) {
          errors.push({ rowData: cls, error: '班级名称或班主任不能为空' });
          continue; // 跳过无效数据
      }
      values.push(
        cls.class_name,
        cls.teacher,
        cls.description || null // 允许 description 为空
      );
    }

    if (values.length > 0) {
       // 将 values 数组扁平化
       const flatValues = values.flat();
       processedCount = values.length / 3; // 每个班级有3个值
       const [result] = await connection.query(sql, flatValues);
       console.log('[Batch Class Add] DB Insert/Update Result:', result);
    } else {
      console.log('[Batch Class Add] No valid classes to insert/update.');
    }

    await connection.commit();
    console.log(`[Batch Class Add] Transaction committed. Processed rows: ${processedCount}. Skipped: ${errors.length}`);

    return { success: true, processedCount: processedCount, errors: errors };

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('[Batch Class Add] Error during batch class add:', error);
    errors.push({ rowData: {}, error: `数据库批量操作失败: ${error.message}` });
    return { success: false, processedCount: 0, errors: errors };
  } finally {
    if (connection) connection.release();
  }
}

module.exports = {
  getClassList,
  getClassDetail,
  getStudentsInClass,
  addClass,
  deleteClass,
  updateClass,
  batchAddClasses
}; 