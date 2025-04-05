// 员工服务
const db = require('./db');

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

module.exports = {
  getEmployeeList,
  getEmployeeDetail,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  batchDeleteEmployee,
  getEmployeeStats
}; 