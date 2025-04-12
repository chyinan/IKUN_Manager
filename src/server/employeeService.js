// 员工服务
const db = require('./db');
const xlsx = require('xlsx'); // 引入 xlsx
const papaparse = require('papaparse'); // 引入 papaparse
const fs = require('fs'); // 引入 fs 用于文件操作

/**
 * 获取员工列表
 * @param {Object} params 查询参数
 * @returns {Promise<Array>} 员工列表
 */
async function getEmployeeList(params = {}) {
  try {
    // 构建基础查询
    let query = `
      SELECT 
        e.id, 
        e.emp_id, 
        e.name, 
        e.gender, 
        e.age, 
        e.position, 
        e.salary, 
        e.status, 
        e.phone, 
        e.email, 
        e.join_date, 
        e.create_time,
        d.dept_name
      FROM 
        employee e
      LEFT JOIN 
        department d ON e.dept_id = d.id
    `;

    // 添加查询条件
    const conditions = [];
    const values = [];

    if (params.name) {
      conditions.push('e.name LIKE ?');
      values.push(`%${params.name}%`);
    }

    if (params.empId) {
      conditions.push('e.emp_id LIKE ?');
      values.push(`%${params.empId}%`);
    }

    if (params.deptName) {
      conditions.push('d.dept_name = ?');
      values.push(params.deptName);
    }

    if (params.status) {
      conditions.push('e.status = ?');
      values.push(params.status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // 添加排序
    query += ' ORDER BY e.id DESC';

    // 执行查询
    const employees = await db.query(query, values);
    
    console.log(`获取到 ${employees.length} 条员工记录`);
    return employees;
  } catch (error) {
    console.error('获取员工列表失败:', error);
    throw error;
  }
}

/**
 * 获取员工详情
 * @param {number} id 员工ID
 * @returns {Promise<Object>} 员工详情
 */
async function getEmployeeDetail(id) {
  try {
    const query = `
      SELECT 
        e.id, 
        e.emp_id, 
        e.name, 
        e.gender, 
        e.age, 
        e.position, 
        e.salary, 
        e.status, 
        e.phone, 
        e.email, 
        e.join_date, 
        e.create_time,
        d.dept_name
      FROM 
        employee e
      LEFT JOIN 
        department d ON e.dept_id = d.id
      WHERE 
        e.id = ?
    `;
    
    const employees = await db.query(query, [id]);
    return employees[0] || null;
  } catch (error) {
    console.error(`获取员工详情失败 (ID: ${id}):`, error);
    throw error;
  }
}

/**
 * 添加员工
 * @param {Object} employeeData 员工数据
 * @returns {Promise<Object>} 添加结果
 */
async function addEmployee(employeeData) {
  try {
    // 先查询部门ID
    let deptId = null;
    if (employeeData.deptName) {
      const deptQuery = 'SELECT id FROM department WHERE dept_name = ?';
      const depts = await db.query(deptQuery, [employeeData.deptName]);
      if (depts.length > 0) {
        deptId = depts[0].id;
      } else {
        throw new Error(`部门 "${employeeData.deptName}" 不存在`);
      }
    }

    // 插入员工数据
    const query = `
      INSERT INTO employee (
        emp_id, 
        name, 
        gender, 
        age, 
        position, 
        dept_id, 
        salary, 
        status, 
        phone, 
        email, 
        join_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      employeeData.empId,
      employeeData.name,
      employeeData.gender,
      employeeData.age,
      employeeData.position,
      deptId,
      employeeData.salary,
      employeeData.status,
      employeeData.phone || null,
      employeeData.email || null,
      employeeData.joinDate
    ];
    
    const result = await db.query(query, values);
    
    // 获取新添加的员工详情
    if (result.insertId) {
      return getEmployeeDetail(result.insertId);
    }
    
    return null;
  } catch (error) {
    console.error('添加员工失败:', error);
    throw error;
  }
}

/**
 * 更新员工
 * @param {number} id 员工ID
 * @param {Object} employeeData 员工数据
 * @returns {Promise<Object>} 更新结果
 */
async function updateEmployee(id, employeeData) {
  try {
    // 先查询部门ID
    let deptId = null;
    if (employeeData.deptName) {
      const deptQuery = 'SELECT id FROM department WHERE dept_name = ?';
      const depts = await db.query(deptQuery, [employeeData.deptName]);
      if (depts.length > 0) {
        deptId = depts[0].id;
      } else {
        throw new Error(`部门 "${employeeData.deptName}" 不存在`);
      }
    }

    // 更新员工数据
    const query = `
      UPDATE employee SET
        name = ?,
        gender = ?,
        age = ?,
        position = ?,
        dept_id = ?,
        salary = ?,
        status = ?,
        phone = ?,
        email = ?,
        join_date = ?
      WHERE id = ?
    `;
    
    const values = [
      employeeData.name,
      employeeData.gender,
      employeeData.age,
      employeeData.position,
      deptId,
      employeeData.salary,
      employeeData.status,
      employeeData.phone || null,
      employeeData.email || null,
      employeeData.joinDate,
      id
    ];
    
    await db.query(query, values);
    
    // 获取更新后的员工详情
    return getEmployeeDetail(id);
  } catch (error) {
    console.error(`更新员工失败 (ID: ${id}):`, error);
    throw error;
  }
}

/**
 * 删除员工
 * @param {number} id 员工ID
 * @returns {Promise<{success: boolean, emp_id: string | null}>} 删除结果及员工工号
 */
async function deleteEmployee(id) {
  let connection;
  try {
    if (!id || isNaN(id)) {
      throw new Error('无效的员工ID');
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. 先查询员工工号
    const selectQuery = 'SELECT emp_id FROM employee WHERE id = ?';
    const [rows] = await connection.query(selectQuery, [id]);
    const emp_id = rows.length > 0 ? rows[0].emp_id : null;

    // 2. 执行删除操作
    const deleteQuery = 'DELETE FROM employee WHERE id = ?';
    const [result] = await connection.query(deleteQuery, [id]);
    const success = result.affectedRows > 0;

    await connection.commit();

    if (success) {
      console.log(`员工删除成功, ID: ${id}, 工号: ${emp_id}`);
    } else {
      console.log(`尝试删除员工失败或未找到记录, ID: ${id}`);
    }

    // 返回包含成功状态和工号的对象
    return { success, emp_id }; 

  } catch (error) {
    if (connection) await connection.rollback();
    console.error(`删除员工数据库操作失败 (ID: ${id}):`, error);
    throw error; // Re-throw
  } finally {
    if (connection) connection.release();
  }
}

/**
 * 批量删除员工
 * @param {Array<number>} ids 员工ID数组
 * @returns {Promise<boolean>} 删除结果
 */
async function batchDeleteEmployee(ids) {
  try {
    if (!ids || ids.length === 0) {
      return false;
    }
    
    const placeholders = ids.map(() => '?').join(',');
    const query = `DELETE FROM employee WHERE id IN (${placeholders})`;
    const result = await db.query(query, ids);
    return result.affectedRows > 0;
  } catch (error) {
    console.error(`批量删除员工失败 (IDs: ${ids}):`, error);
    throw error;
  }
}

/**
 * 获取员工统计数据
 * @returns {Promise<Object>} 统计数据
 */
async function getEmployeeStats() {
  try {
    // 获取员工总数
    const totalQuery = 'SELECT COUNT(*) as total FROM employee';
    const totalResult = await db.query(totalQuery);
    const total = totalResult[0].total;

    // 获取在职员工数量
    const activeQuery = "SELECT COUNT(*) as count FROM employee WHERE status = '在职'";
    const activeResult = await db.query(activeQuery);
    const activeCount = activeResult[0].count;

    // 获取部门分布
    const deptQuery = `
      SELECT 
        d.dept_name as name, 
        COUNT(e.id) as value 
      FROM 
        department d 
      LEFT JOIN 
        employee e ON d.id = e.dept_id 
      GROUP BY 
        d.id
    `;
    const deptDistribution = await db.query(deptQuery);

    // 获取薪资分布
    const salaryRanges = [
      { range: '5k以下', min: 0, max: 5000 },
      { range: '5k-10k', min: 5000, max: 10000 },
      { range: '10k-15k', min: 10000, max: 15000 },
      { range: '15k-20k', min: 15000, max: 20000 },
      { range: '20k以上', min: 20000, max: Number.MAX_SAFE_INTEGER }
    ];

    const salaryDistribution = [];
    for (const range of salaryRanges) {
      const query = `
        SELECT COUNT(*) as count 
        FROM employee 
        WHERE salary >= ? AND salary < ?
      `;
      const result = await db.query(query, [range.min, range.max]);
      salaryDistribution.push({
        range: range.range,
        count: result[0].count
      });
    }

    return {
      total,
      activeCount,
      deptDistribution,
      salaryDistribution
    };
  } catch (error) {
    console.error('获取员工统计数据失败:', error);
    throw error;
  }
}

/**
 * 批量添加员工 (用于导入)
 * @param {Array<Object>} employees 经过验证的员工数据数组 (使用数据库字段名)
 * @returns {Promise<{ success: boolean, addedCount: number, errors: Array<{ rowData: object, error: string }> }>} 导入结果
 */
async function batchAddEmployees(employees) {
  if (!employees || employees.length === 0) {
    return { success: false, addedCount: 0, errors: [{ rowData: {}, error: '没有提供有效的员工数据' }] };
  }

  let connection;
  let addedCount = 0;
  const errors = [];

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. 获取所有部门信息，方便查找 ID
    const [departments] = await connection.query('SELECT id, dept_name FROM department');
    const deptMap = new Map(departments.map(dept => [dept.dept_name, dept.id]));
    console.log('[Batch Add] Department Map:', deptMap);

    // 2. 构建批量插入语句
    // 注意：一次性插入大量数据可能有限制，分批次插入可能更稳健，但这里简化处理
    const placeholders = employees.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'); // 11 placeholders + create_time
    const sql = `
      INSERT INTO employee (
        emp_id, name, gender, age, position, dept_id, salary, status, phone, email, join_date, create_time
      ) VALUES ${placeholders.join(', ')}
      ON DUPLICATE KEY UPDATE name=VALUES(name) -- 简单处理，如果工号重复则仅更新姓名，避免插入失败
    `;

    const values = [];
    const validEmployeesForInsert = []; // 只包含有效部门的员工

    for (const emp of employees) {
      const deptId = deptMap.get(emp.deptName); // 从 Map 获取部门 ID
      if (deptId === undefined) {
        console.warn(`[Batch Add] Skipped row: Department '${emp.deptName}' not found for emp_id ${emp.emp_id}`);
        errors.push({ rowData: emp, error: `部门 '${emp.deptName}' 不存在` });
        continue; // 跳过这条记录
      }
      validEmployeesForInsert.push(emp); // 添加到待插入列表
      values.push(
        emp.emp_id,
        emp.name,
        emp.gender,
        emp.age,
        emp.position,
        deptId, // 使用查到的 deptId
        emp.salary,
        emp.status,
        emp.phone || null,
        emp.email || null,
        emp.join_date // 确保日期格式正确
      );
    }

    if (values.length > 0) {
       // 执行批量插入
       const [result] = await connection.query(sql, values);
       console.log('[Batch Add] DB Insert Result:', result);
       addedCount = result.affectedRows; // affectedRows 可能包含更新的行数，对于纯插入，用 insertId 可能更好，但批量复杂
    } else {
      console.log('[Batch Add] No valid employees to insert after department check.');
    }


    await connection.commit();
    console.log(`[Batch Add] Transaction committed. Added/Updated: ${addedCount} employees.`);

    return { success: true, addedCount: addedCount, errors: errors }; // 返回成功数量和跳过的错误

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('[Batch Add] Error during batch employee add:', error);
    // 将通用错误添加到错误列表
    errors.push({ rowData: {}, error: `数据库批量插入失败: ${error.message}` });
    return { success: false, addedCount: 0, errors: errors }; // 返回失败状态和错误
  } finally {
    if (connection) connection.release();
  }
}

/**
 * 获取用于导出的员工数据 (包含所有字段)
 * @param {Object} params 查询参数 (与列表查询一致)
 * @returns {Promise<Array>} 员工数据数组
 */
async function getEmployeesForExport(params = {}) {
  try {
    // 构建与 getEmployeeList 类似的查询，但选择所有导出需要的字段
    let query = `
      SELECT 
        e.emp_id, 
        e.name, 
        e.gender, 
        e.age, 
        e.position, 
        d.dept_name, 
        e.salary, 
        e.status, 
        e.phone, 
        e.email, 
        DATE_FORMAT(e.join_date, '%Y-%m-%d') as join_date 
      FROM 
        employee e
      LEFT JOIN 
        department d ON e.dept_id = d.id
    `;

    const conditions = [];
    const values = [];

    // 应用与列表查询相同的过滤条件
    if (params.name) {
      conditions.push('e.name LIKE ?');
      values.push(`%${params.name}%`);
    }
    if (params.empId) {
      conditions.push('e.emp_id LIKE ?');
      values.push(`%${params.empId}%`);
    }
    if (params.deptName) {
      conditions.push('d.dept_name = ?');
      values.push(params.deptName);
    }
    if (params.status) {
      conditions.push('e.status = ?');
      values.push(params.status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // 导出通常不需要分页，按 ID 排序即可
    query += ' ORDER BY e.id ASC';

    const employees = await db.query(query, values);
    console.log(`[Export Service] Fetched ${employees.length} records for export.`);
    return employees;
  } catch (error) {
    console.error('[Export Service] Error fetching employees for export:', error);
    throw error;
  }
}

module.exports = {
  getEmployeeList,
  getEmployeeDetail,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  batchDeleteEmployee,
  getEmployeeStats,
  batchAddEmployees,
  getEmployeesForExport
}; 