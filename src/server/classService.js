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
 * @returns {Promise<boolean>} 删除是否成功
 */
async function deleteClass(id) {
  try {
    // 注意：删除班级会级联删除关联的学生和成绩（根据外键约束）
    // 如果不希望级联删除，需要修改数据库外键设置或先处理关联数据
    // 这里我们假设级联删除是期望的行为

    // 检查班级是否存在
    const checkSql = 'SELECT id FROM class WHERE id = ?';
    const checkResult = await db.query(checkSql, [id]);
    if (checkResult.length === 0) {
      console.log(`尝试删除班级 ID ${id}，但未找到该班级`);
      return false; // 班级不存在
    }

    // 执行删除
    const sql = 'DELETE FROM class WHERE id = ?';
    const result = await db.query(sql, [id]);

    if (result.affectedRows > 0) {
      console.log(`删除班级成功, ID: ${id}`);
      return true; // 删除成功
    } else {
      // 理论上因为上面检查过，不应该到这里，但也处理一下
      console.log(`尝试删除班级 ID ${id}，但删除操作未影响任何行`);
      return false; 
    }
  } catch (error) {
    console.error(`删除班级失败 (ID: ${id}):`, error);
    // 可以根据 error.code 判断是否是外键约束等问题
    throw error; // 将错误向上抛出
  }
}

module.exports = {
  getClassList,
  getClassDetail,
  getStudentsInClass,
  addClass,
  deleteClass
}; 