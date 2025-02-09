const express = require('express')
const router = express.Router()
const db = require('../config/db')

// 获取部门列表
router.get('/list', async (req, res) => {
  try {
    console.log('请求部门列表')
    const [rows] = await db.query('SELECT * FROM department')
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

// 添加部门
router.post('/add', async (req, res) => {
  try {
    console.log('新增部门数据:', req.body)
    const { deptName, manager, memberCount, description } = req.body
    const [result] = await db.query(
      'INSERT INTO department (dept_name, manager, member_count, description) VALUES (?, ?, ?, ?)',
      [deptName, manager, memberCount || 0, description]
    )
    console.log('插入结果:', result)
    res.json({
      code: 200,
      message: '添加成功'
    })
  } catch (err) {
    console.error('新增错误:', err)
    res.status(500).json({
      code: 500,
      message: err.message
    })
  }
})

// 更新部门
router.put('/update/:id', async (req, res) => {
  try {
    const { deptName, manager, memberCount, description } = req.body
    await db.query(
      'UPDATE department SET dept_name=?, manager=?, member_count=?, description=? WHERE id=?',
      [deptName, manager, memberCount, description, req.params.id]
    )
    res.json({ code: 200, message: '更新成功' })
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message })
  }
})

// 删除部门
router.delete('/delete/:id', async (req, res) => {
  try {
    console.log('删除部门ID:', req.params.id)
    
    // 先检查部门是否存在
    const [dept] = await db.query('SELECT * FROM department WHERE id = ?', [req.params.id])
    if (dept.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '未找到该部门'
      })
    }

    // 执行删除
    const [result] = await db.query('DELETE FROM department WHERE id = ?', [req.params.id])
    
    if (result.affectedRows > 0) {
      res.json({
        code: 200,
        message: '删除成功'
      })
    } else {
      throw new Error('删除失败')
    }
    
  } catch (err) {
    console.error('删除错误:', err)
    res.status(500).json({
      code: 500,
      message: err.message
    })
  }
})

module.exports = router