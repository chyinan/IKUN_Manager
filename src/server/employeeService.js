// 员工服务
const db = require('./db');
const xlsx = require('xlsx'); // 引入 xlsx
const papaparse = require('papaparse'); // 引入 papaparse
const fs = require('fs'); // 引入 fs 用于文件操作
const logService = require('./logService');

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
 * @returns {Promise<Object>} 添加的员工
 */
async function addEmployee(employeeData) {
  console.log('准备添加员工数据:', employeeData);
  let connection;

  // --- Regex Validation ---
  const employeeIdRegex = /^EMP.{3}$/;
  const empIdFromData = employeeData.empId || employeeData.emp_id;
  const empIdToTest = empIdFromData ? String(empIdFromData).trim() : '';
  console.log(`Employee Service: Validating trimmed ID '${empIdToTest}' against hardcoded regex ${employeeIdRegex}`);
  if (!empIdToTest || !employeeIdRegex.test(empIdToTest)) {
    console.log(`工号 '${empIdToTest}' (原始: '${empIdFromData}') 格式无效 (硬编码规则: /^EMP.{3}$/)`);
    throw new Error('工号格式无效');
  }
  // --- End Regex Validation ---

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. 先查询部门ID
    let deptId = null;
    if (employeeData.deptName) {
      const deptQuery = 'SELECT id FROM department WHERE dept_name = ?';
      const [depts] = await connection.query(deptQuery, [employeeData.deptName]);
      if (depts && depts.length > 0) {
        deptId = depts[0].id;
      } else {
        throw new Error(`部门 "${employeeData.deptName}" 不存在`);
      }
    }

    // 2. 插入员工数据
    const insertSql = `
      INSERT INTO employee (
        emp_id, name, gender, age, position, dept_id, 
        salary, status, phone, email, join_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      empIdToTest,
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
    
    const [insertResult] = await connection.query(insertSql, values);
    const newEmployeeId = insertResult.insertId;

    if (!newEmployeeId) {
      throw new Error('新增员工失败，数据库未返回插入ID');
    }

    // Commit the transaction FIRST
    await connection.commit();
    console.log(`[employeeService] 新增员工记录 (ID: ${newEmployeeId}, 工号: ${empIdToTest}) 已成功提交到数据库.`);

    // Log AFTER successful commit
    await logService.addLogEntry({
      type: 'database',
      operation: '新增',
      content: `新增员工: ${employeeData.name} (工号: ${empIdToTest}, 部门: ${employeeData.deptName})`,
      operator: 'system' // Or context-based operator
    });
    console.log(`[employeeService] 新增员工日志已记录.`);

    // Fetch the newly created employee to return complete info
    return getEmployeeDetail(newEmployeeId); // getEmployeeDetail uses its own connection

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('[employeeService] 添加员工失败:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('员工工号已存在');
    }
    throw error; 
  } finally {
    if (connection) connection.release();
  }
}

/**
 * 更新员工
 * @param {number} id 员工ID
 * @param {Object} employeeData 员工数据
 * @returns {Promise<Object>} 更新后的员工
 */
async function updateEmployee(id, employeeData) {
  console.log(`准备更新员工 ID ${id} 的数据:`, employeeData);

  // --- Hardcoded Validation (if emp_id is being updated) ---
  let empIdToTest = null;
  // Use employeeData.empId (camelCase) from frontend, fall back to emp_id if needed for other callers
  const empIdFromDataForUpdate = employeeData.empId || employeeData.emp_id;
  if (empIdFromDataForUpdate !== undefined) { // Check if empId was provided for update
    empIdToTest = String(empIdFromDataForUpdate).trim();
    const employeeIdRegex = /^EMP.{3}$/; // Use literal directly
    console.log(`Employee Service Update: Validating trimmed ID '${empIdToTest}' against hardcoded regex ${employeeIdRegex}`);
    if (!empIdToTest || !employeeIdRegex.test(empIdToTest)) {
      console.log(`工号 '${empIdToTest}' (原始: '${empIdFromDataForUpdate}') 格式无效 (硬编码规则: /^EMP.{3}$/)`);
      throw new Error('工号格式无效');
    }
    // If we validated empId, ensure the object being used for DB has the correct field name if service expects emp_id
    // However, the INSERT/UPDATE query uses emp_id, so this might not be needed if empIdToTest is used directly.
    // For clarity, if your DB insert/update logic strictly expects `emp_id`, you might need to map it.
    // But since `empIdToTest` is used in `values` array for `addEmployee` which corresponds to `emp_id` in SQL, this should be fine.
  }
  // --- End Hardcoded Validation ---

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

    // 1. 先查询员工工号、姓名和部门名称 (for logging)
    const selectQuery = `
      SELECT e.emp_id, e.name, d.dept_name 
      FROM employee e
      LEFT JOIN department d ON e.dept_id = d.id
      WHERE e.id = ?
    `;
    const [rows] = await connection.query(selectQuery, [id]);
    const emp_id = rows.length > 0 ? rows[0].emp_id : null;
    const emp_name = rows.length > 0 ? rows[0].name : '未知员工';
    const dept_name = rows.length > 0 ? rows[0].dept_name : '未知部门'; // Get department name

    // 2. 执行删除操作
    const deleteQuery = 'DELETE FROM employee WHERE id = ?';
    const [result] = await connection.query(deleteQuery, [id]);
    const success = result.affectedRows > 0;

    // Commit the transaction FIRST
    await connection.commit();
    console.log(`[employeeService] 删除员工操作 (ID: ${id}, 工号: ${emp_id}) 已成功提交到数据库.`);

    // Log AFTER successful commit and if deletion was successful
    if (success && emp_id) {
      await logService.addLogEntry({
        type: 'database',
        operation: '删除',
        content: `删除员工: ${emp_name} (工号: ${emp_id}, 部门: ${dept_name})`,
        operator: 'system' // Or context-based operator
      });
      console.log(`[employeeService] 删除员工日志已记录 (工号: ${emp_id}).`);
    } else if (success) {
      console.log(`[employeeService] 员工 (ID: ${id}) 已删除，但未找到工号或部门用于完整日志记录。`);
    } else {
      console.log(`[employeeService] 尝试删除员工失败或未找到记录, ID: ${id}`);
    }

    return { success, emp_id }; 

  } catch (error) {
    if (connection) await connection.rollback();
    console.error(`[employeeService] 删除员工数据库操作失败 (ID: ${id}):`, error);
    throw error;
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
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 获取员工总数
    const [totalRows] = await connection.query('SELECT COUNT(*) as total FROM employee');
    const total = totalRows.length > 0 ? totalRows[0].total : 0;

    // 获取在职员工数量
    const [activeRows] = await connection.query("SELECT COUNT(*) as count FROM employee WHERE status = '在职'");
    const activeCount = activeRows.length > 0 ? activeRows[0].count : 0;

    // 获取部门分布
    const [deptDistribution] = await connection.query(`
      SELECT 
        d.dept_name as name, 
        COUNT(e.id) as value 
      FROM 
        department d 
      LEFT JOIN 
        employee e ON d.id = e.dept_id 
      GROUP BY 
        d.id
    `);

    // 获取部门平均薪资分布 (替换旧的薪资范围统计)
    const [salaryDistribution] = await connection.query(`
      SELECT
        d.dept_name as name,
        COALESCE(AVG(e.salary), 0) as value
      FROM
        department d
      LEFT JOIN
        employee e ON d.id = e.dept_id
      GROUP BY
        d.id, d.dept_name
      ORDER BY
        value DESC
    `);

    // 获取性别分布
    const [genderDistribution] = await connection.query(`
      SELECT 
        gender as name, 
        COUNT(*) as value 
      FROM 
        employee 
      GROUP BY 
        gender
    `);
    
    // 获取总平均薪资
    const [avgSalaryRows] = await connection.query('SELECT AVG(salary) as averageSalary FROM employee WHERE salary IS NOT NULL');
    const averageSalary = avgSalaryRows.length > 0 ? (avgSalaryRows[0].averageSalary || 0) : 0;

    // 获取部门数量
    const [deptCountRows] = await connection.query('SELECT COUNT(*) as deptCount FROM department');
    const deptCount = deptCountRows.length > 0 ? deptCountRows[0].deptCount : 0;

    await connection.commit();

    return {
      total,
      activeCount,
      deptDistribution,
      salaryDistribution,
      genderDistribution,
      averageSalary,
      deptCount,
    };
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('获取员工统计数据失败:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * 批量添加员工 (用于导入)
 * @param {Array<Object>} employees 经过验证的员工数据数组 (使用数据库字段名)
 * @returns {Promise<{ success: boolean, addedCount: number, errors: Array<{ rowData: object, error: string }> }>} 导入结果
 */
async function batchAddEmployees(employees) {
  console.log('[Batch Employee Add] Starting batch add/update for', employees.length, 'employees.');
  const connection = await db.getConnection();
  let addedCount = 0;
  const errors = [];

  if (!employees || employees.length === 0) {
    return { success: true, addedCount: 0, errors: [] };
  }

  // --- Hardcoded Validation using Regex Literal ---
  const employeeIdRegex = /^EMP.{3}$/; // Use literal directly
  console.log(`[Batch Employee Add] Using hardcoded regex for validation: ${employeeIdRegex}`);
  // --- End Hardcoded Validation ---

  try {
    // 1. 获取所有部门信息，方便查找 ID
    const [departments] = await connection.query('SELECT id, dept_name FROM department');
    const deptMap = new Map(departments.map(dept => [dept.dept_name, dept.id]));
    console.log('[Batch Add] Department Map:', deptMap);

    // 2. 准备批量插入/更新的数据
    const values = [];
    const empIdsInBatch = new Set();
    for (let i = 0; i < employees.length; i++) {
        const emp = employees[i];
        const rowNum = i + 2; 

        const empIdToTest = emp.emp_id ? String(emp.emp_id).trim() : '';

        if (empIdsInBatch.has(empIdToTest)) {
            errors.push({ row: rowNum, error: `工号 ${empIdToTest} 在文件中重复` });
            continue;
        }
        if(empIdToTest) empIdsInBatch.add(empIdToTest);

        // -- Validate emp_id format using hardcoded regex --
        if (!empIdToTest || !employeeIdRegex.test(empIdToTest)) {
            errors.push({ row: rowNum, error: `工号 ${empIdToTest} 格式无效 (硬编码规则: /^EMP.{3}$/)` });
            continue;
        }
        
        const deptId = deptMap.get(emp.deptName); // 从 Map 获取部门 ID
        if (deptId === undefined) {
          console.warn(`[Batch Add] Skipped row: Department '${emp.deptName}' not found for emp_id ${emp.emp_id}`);
          errors.push({ rowData: emp, error: `部门 '${emp.deptName}' 不存在` });
          continue; // 跳过这条记录
        }

        values.push(
          empIdToTest,
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
       const [result] = await connection.query('INSERT INTO employee (emp_id, name, gender, age, position, dept_id, salary, status, phone, email, join_date) VALUES ? ON DUPLICATE KEY UPDATE name=VALUES(name)', [values]);
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
  getEmployeesForExport,
  batchAddEmployees
}; 