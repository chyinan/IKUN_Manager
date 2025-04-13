const db = require('./db');

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
 * @returns {Promise<Object>} 包含新增班级ID的对象
 */
async function addClass(classData) {
  try {
    const { class_name, teacher, description } = classData;

    if (!class_name || !teacher) {
      throw new Error('班级名称和班主任不能为空');
    }

    const sql = `
      INSERT INTO class (class_name, teacher, description)
      VALUES (?, ?, ?)
    `;

    const result = await db.query(sql, [class_name, teacher, description]);

    if (result.insertId) {
      console.log(`新增班级成功, ID: ${result.insertId}`);
      // 返回包含ID和传入数据的新对象
      return { id: result.insertId, class_name, teacher, description }; 
    } else {
      throw new Error('新增班级失败，数据库未返回插入ID');
    }
  } catch (error) {
    console.error('新增班级失败:', error);
    // 检查是否是唯一性约束错误 (uk_class_name)
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('班级名称已存在');
    }
    throw error; // 重新抛出其他错误
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

    // 1. 先查询班级名称
    const selectQuery = 'SELECT class_name FROM class WHERE id = ?';
    const [rows] = await connection.query(selectQuery, [id]);
    const class_name = rows.length > 0 ? rows[0].class_name : null;

    // 2. 执行删除操作
    const deleteQuery = 'DELETE FROM class WHERE id = ?';
    const [result] = await connection.query(deleteQuery, [id]);
    const success = result.affectedRows > 0;

    await connection.commit();

    if (success) {
      console.log(`班级删除成功, ID: ${id}, 名称: ${class_name}`);
    } else {
      console.log(`尝试删除班级失败或未找到记录, ID: ${id}`);
    }

    return { success, class_name };

  } catch (error) {
    if (connection) await connection.rollback();
    // Check for foreign key constraint (students in class)
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
        throw new Error('无法删除：该班级下仍有学生');
    }
    console.error(`删除班级数据库操作失败 (ID: ${id}):`, error);
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

module.exports = {
  getClassList,
  getClassDetail,
  getStudentsInClass,
  addClass,
  deleteClass,
  updateClass
}; 