const express = require('express')
const router = express.Router()
const db = require('../config/db')

// 获取班级列表
router.get('/list', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM class')
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

// 添加班级
router.post('/add', async (req, res) => {
  try {
    const { className, studentCount, teacher } = req.body
    const [result] = await db.query(
      'INSERT INTO class (class_name, student_count, teacher) VALUES (?, ?, ?)',
      [className, studentCount, teacher]
    )
    
    res.json({
      code: 200,
      message: '添加成功'
    })
  } catch (err) {
    console.error('添加班级失败:', err)
    res.status(500).json({
      code: 500,
      message: err.message
    })
  }
})

// 更新班级
router.put('/update/:id', (req, res) => {
  const { className, studentCount, teacher } = req.body
  const sql = 'UPDATE class SET class_name=?, student_count=?, teacher=? WHERE id=?'
  db.query(sql, [className, studentCount, teacher, req.params.id], (err, result) => {
    if (err) {
      res.status(500).json({ message: err.message })
    } else {
      res.json({
        code: 200,
        message: '更新成功'
      })
    }
  })
})

// 删除班级
router.delete('/delete/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM class WHERE id = ?', [req.params.id])
    
    res.json({
      code: 200,
      message: '删除成功'
    })
  } catch (err) {
    console.error('删除班级失败:', err)
    res.status(500).json({
      code: 500,
      message: err.message
    })
  }
})

// 添加获取班级学生数量的路由
router.get('/studentCount/:classId', async (req, res) => {
  try {
    const [result] = await db.query(
      'SELECT COUNT(*) as count FROM student WHERE class_id = ?',
      [req.params.classId]
    )
    
    res.json({
      code: 200,
      data: result[0].count,
      message: '获取成功'
    })
  } catch (err) {
    console.error('获取班级学生数量失败:', err)
    res.status(500).json({
      code: 500,
      message: err.message
    })
  }
})

module.exports = router