const db = require('./db');

/**
 * 获取部门列表
 * @param {Object} params 查询参数
 * @returns {Promise<Array>} 部门列表
 */
async function getDeptList(params = {}) {
  try {
    // 构建基础查询
    let query = `
      SELECT 
        d.id, 
        d.dept_name, 
        d.manager, 
        d.description, 
        d.create_time,
        (SELECT COUNT(*) FROM employee e WHERE e.dept_id = d.id) as member_count
      FROM 
        department d
    `;

    // 添加查询条件
    const conditions = [];
    const values = [];

    if (params.deptName) {
      conditions.push('d.dept_name LIKE ?');
      values.push(`%${params.deptName}%`);
    }

    if (params.manager) {
      conditions.push('d.manager LIKE ?');
      values.push(`%${params.manager}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // 添加排序
    query += ' ORDER BY d.id ASC';

    // 执行查询
    const departments = await db.query(query, values);
    
    console.log(`获取到 ${departments.length} 条部门记录`);
    return departments;
  } catch (error) {
    console.error('获取部门列表失败:', error);
    throw error;
  }
}

/**
 * 获取部门详情
 * @param {number} id 部门ID
 * @returns {Promise<Object>} 部门详情
 */
async function getDeptDetail(id) {
  try {
    const query = `
      SELECT 
        d.id, 
        d.dept_name, 
        d.manager, 
        d.description, 
        d.create_time,
        (SELECT COUNT(*) FROM employee e WHERE e.dept_id = d.id) as member_count
      FROM 
        department d
      WHERE 
        d.id = ?
    `;
    
    const departments = await db.query(query, [id]);
    return departments[0] || null;
  } catch (error) {
    console.error(`获取部门详情失败 (ID: ${id}):`, error);
    throw error;
  }
}

/**
 * 新增部门
 * @param {Object} deptData 部门数据 { dept_name, manager, description }
 * @returns {Promise<Object>} 包含新增部门ID的对象
 */
async function addDept(deptData) {
  try {
    const { dept_name, manager, description } = deptData;
    
    if (!dept_name || !manager) {
      throw new Error('部门名称和部门主管不能为空');
    }

    const sql = `
      INSERT INTO department (dept_name, manager, description)
      VALUES (?, ?, ?)
    `;
    
    const result = await db.query(sql, [dept_name, manager, description]);

    if (result.insertId) {
      console.log(`新增部门成功, ID: ${result.insertId}`);
      return { id: result.insertId, ...deptData }; // 返回包含新ID的对象
    } else {
      throw new Error('新增部门失败，数据库未返回插入ID');
    }
  } catch (error) {
    console.error('新增部门失败:', error);
    // 检查是否是唯一性约束错误
    if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('部门名称已存在');
    }
    throw error; // 将其他错误向上抛出
  }
}

/**
 * 删除部门
 * @param {number} id 部门ID
 * @returns {Promise<{success: boolean, dept_name: string | null}>} 删除结果及部门名称
 */
async function deleteDept(id) {
  let connection;
  try {
    if (!id || isNaN(id)) {
      throw new Error('无效的部门ID');
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. 先查询部门名称
    const selectQuery = 'SELECT dept_name FROM department WHERE id = ?';
    const [rows] = await connection.query(selectQuery, [id]);
    const dept_name = rows.length > 0 ? rows[0].dept_name : null;

    // 2. 执行删除操作
    const deleteQuery = 'DELETE FROM department WHERE id = ?';
    const [result] = await connection.query(deleteQuery, [id]);
    const success = result.affectedRows > 0;

    await connection.commit();

    if (success) {
      console.log(`部门删除成功, ID: ${id}, 名称: ${dept_name}`);
    } else {
      console.log(`尝试删除部门失败或未找到记录, ID: ${id}`);
    }

    return { success, dept_name };

  } catch (error) {
    if (connection) await connection.rollback();
    // Check for foreign key constraint error (e.g., employees still in dept)
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
        throw new Error('无法删除：该部门下仍有员工');
    }
    console.error(`删除部门数据库操作失败 (ID: ${id}):`, error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * 更新部门信息
 * @param {number} id 部门ID
 * @param {Object} deptData 部门更新数据 { dept_name?, manager?, description? }
 * @returns {Promise<Object>} 更新后的部门信息
 */
async function updateDept(id, deptData) {
  try {
    const allowedFields = ['dept_name', 'manager', 'description'];
    const fieldsToUpdate = {};
    
    for (const field of allowedFields) {
      if (deptData[field] !== undefined) { // 允许更新为空字符串，但不允许 undefined
        fieldsToUpdate[field] = deptData[field];
      }
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
      throw new Error('没有提供有效的更新字段');
    }
    
    // 检查部门名称和主管是否为空（如果它们在更新字段中）
    if (fieldsToUpdate.dept_name === '') {
        throw new Error('部门名称不能为空');
    }
    if (fieldsToUpdate.manager === '') {
        throw new Error('部门主管不能为空');
    }

    const setClauses = Object.keys(fieldsToUpdate).map(key => `${key} = ?`).join(', ');
    const sql = `UPDATE department SET ${setClauses}, update_time = CURRENT_TIMESTAMP WHERE id = ?`;
    const updateValues = [...Object.values(fieldsToUpdate), id];

    console.log('Executing Dept Update Query:', sql, updateValues);
    const result = await db.query(sql, updateValues);

    if (result.affectedRows === 0) {
      throw new Error(`未找到 ID 为 ${id} 的部门记录`);
    }

    console.log(`部门 ID ${id} 更新成功`);
    // 返回更新后的信息（可以重新查询以获取最新数据）
    return { id, ...fieldsToUpdate }; 

  } catch (error) {
    console.error(`更新部门 ID ${id} 失败:`, error);
    // 检查是否是唯一性约束错误
    if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('部门名称已存在');
    }
    throw error; // 重新抛出错误
  }
}

/**
 * 批量添加部门 (用于导入)
 * @param {Array<Object>} departments 经过验证的部门数据数组 (使用数据库字段名)
 * @returns {Promise<{ success: boolean, processedCount: number, errors: Array<{ rowData: object, error: string }> }>} 导入结果
 */
async function batchAddDepts(departments) {
  if (!departments || departments.length === 0) {
    return { success: false, processedCount: 0, errors: [{ rowData: {}, error: '没有提供有效的部门数据' }] };
  }

  let connection;
  let addedCount = 0;
  let processedCount = 0;
  const errors = [];

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 构建批量插入语句
    // ON DUPLICATE KEY UPDATE 可选：如果部门名称已存在，可以选择更新或跳过
    // 这里选择更新主管和描述，如果名称重复
    const placeholders = departments.map(() => '(?, ?, ?, CURRENT_TIMESTAMP)'); // dept_name, manager, description, create_time
    const sql = `
      INSERT INTO department (dept_name, manager, description, create_time)
      VALUES ${placeholders.join(', ')}
      ON DUPLICATE KEY UPDATE manager=VALUES(manager), description=VALUES(description), update_time=CURRENT_TIMESTAMP
    `;

    const values = [];
    for (const dept of departments) {
      // 简单验证，确保核心字段存在 (更复杂的验证应在路由层完成)
      if (!dept.dept_name || !dept.manager) {
          errors.push({ rowData: dept, error: '部门名称或主管不能为空' });
          continue; // 跳过无效数据
      }
      values.push(
        dept.dept_name,
        dept.manager,
        dept.description || null // 允许 description 为空
      );
    }

    if (values.length > 0) {
       // 将 values 数组扁平化以匹配 placeholders 数量
       const flatValues = values.flat();
       processedCount = values.length / 3; // Each dept has 3 values
       const [result] = await connection.query(sql, flatValues);
       console.log('[Batch Dept Add] DB Insert/Update Result:', result);
       // affectedRows 包含插入和更新的行数
       // 对于纯插入可以使用 result.insertId，但有 ON DUPLICATE UPDATE 时 affectedRows 更合适
       // addedCount = result.affectedRows; // We no longer use affectedRows directly for the final count
    } else {
      console.log('[Batch Dept Add] No valid departments to insert/update.');
    }

    await connection.commit();
    console.log(`[Batch Dept Add] Transaction committed. Processed rows: ${processedCount}. Skipped: ${errors.length}`);

    return { success: true, processedCount: processedCount, errors: errors }; 

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('[Batch Dept Add] Error during batch department add:', error);
    // 将通用错误添加到错误列表
    errors.push({ rowData: {}, error: `数据库批量操作失败: ${error.message}` });
    return { success: false, processedCount: 0, errors: errors }; 
  } finally {
    if (connection) connection.release();
  }
}

module.exports = {
  getDeptList,
  getDeptDetail,
  addDept,
  deleteDept,
  updateDept,
  batchAddDepts
}; 