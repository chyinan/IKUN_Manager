import express from 'express'
import db from '../config/db.js'

const router = express.Router()

// 获取员工列表
router.get('/list', async (req, res) => {
  try {
    console.log('请求员工列表')
    const [rows] = await db.query(`
      SELECT e.*, d.dept_name as department 
      FROM employee e
      LEFT JOIN department d ON e.dept_id = d.id
    `)
    console.log('查询结果:', rows)
    res.json({
      code: 200,
      data: rows,
      message: '获取成功'
    })
  } catch (err) {
    console.error('查询错误:', err)
    res.status(500).json({
      code: 500,
      message: err.message
    })
  }
})

// 添加员工
router.post('/add', async (req, res) => {
  try {
    const { empId, name, gender, age, position, department, salary, status, phone, email, joinDate } = req.body
    
    // 先获取部门ID
    const [deptRows] = await db.query('SELECT id FROM department WHERE dept_name = ?', [department])
    if (deptRows.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '部门不存在'
      })
    }
    const deptId = deptRows[0].id
    
    // 插入员工数据
    const [result] = await db.query(
      'INSERT INTO employee (emp_id, name, gender, age, position, dept_id, salary, status, phone, email, join_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [empId, name, gender, age, position, deptId, salary, status, phone, email, joinDate]
    )
    
    res.json({
      code: 200,
      message: '添加成功'
    })
  } catch (err) {
    console.error('添加错误:', err)
    res.status(500).json({
      code: 500,
      message: err.message
    })
  }
})

// 更新员工
router.put('/update/:id', async (req, res) => {
  try {
    console.log('更新员工数据:', req.body);
    const { empId, name, gender, age, position, department, salary, status, phone, email, joinDate } = req.body;
    
    // 获取部门ID
    const [deptRows] = await db.query('SELECT id FROM department WHERE dept_name = ?', [department]);
    if (deptRows.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '部门不存在'
      });
    }
    const deptId = deptRows[0].id;
    
    // 格式化日期
    const formattedDate = new Date(joinDate).toISOString().split('T')[0];
    
    // 更新员工数据
    const [result] = await db.query(
      `UPDATE employee 
       SET emp_id=?, name=?, gender=?, age=?, position=?, dept_id=?, 
           salary=?, status=?, phone=?, email=?, join_date=? 
       WHERE id=?`,
      [empId, name, gender, age, position, deptId, salary, status, phone, email, formattedDate, req.params.id]
    );
    
    console.log('更新结果:', result);
    
    if (result.affectedRows > 0) {
      res.json({
        code: 200,
        message: '更新成功'
      });
    } else {
      throw new Error('未找到要更新的员工');
    }
  } catch (err) {
    console.error('更新错误:', err);
    res.status(500).json({
      code: 500,
      message: err.message
    });
  }
});

// 删除员工
router.delete('/delete/:id', async (req, res) => {
  try {
    console.log('删除员工ID:', req.params.id)
    const [result] = await db.query('DELETE FROM employee WHERE id = ?', [req.params.id])
    res.json({
      code: 200,
      message: '删除成功'
    })
  } catch (err) {
    console.error('删除错误:', err)
    res.status(500).json({
      code: 500,
      message: err.message
    })
  }
})

export default router