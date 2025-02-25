import express from 'express'
import db from '../config/db.js'

const router = express.Router()

// 获取学生列表
router.get('/list', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.*, c.class_name 
      FROM student s
      LEFT JOIN class c ON s.class_id = c.id
    `)
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

// 添加学生
router.post('/add', async (req, res) => {
  try {
    const { studentId, name, gender, className, phone, email, joinDate } = req.body
    // 先获取班级ID
    const [classRows] = await db.query('SELECT id FROM class WHERE class_name = ?', [className])
    if (classRows.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '班级不存在'
      })
    }
    const classId = classRows[0].id
    
    // 插入学生数据
    const [result] = await db.query(
      'INSERT INTO student (student_id, name, gender, class_id, phone, email, join_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [studentId, name, gender, classId, phone, email, joinDate]
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

// 更新学生
router.put('/update/:id', async (req, res) => {
  try {
    const { studentId, name, gender, className, phone, email, joinDate } = req.body
    
    // 格式化日期为 YYYY-MM-DD
    const formattedDate = new Date(joinDate).toISOString().split('T')[0]
    
    // 获取班级ID
    const [classRows] = await db.query('SELECT id FROM class WHERE class_name = ?', [className])
    if (classRows.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '班级不存在'
      })
    }
    const classId = classRows[0].id
    
    // 更新学生数据
    const [result] = await db.query(
      'UPDATE student SET student_id=?, name=?, gender=?, class_id=?, phone=?, email=?, join_date=? WHERE id=?',
      [studentId, name, gender, classId, phone, email, formattedDate, req.params.id]
    )
    
    res.json({
      code: 200,
      message: '更新成功'
    })
  } catch (err) {
    console.error('更新错误:', err)
    res.status(500).json({
      code: 500,
      message: err.message
    })
  }
})

// 删除学生
router.delete('/delete/:id', async (req, res) => {
  try {
    console.log('删除学生ID:', req.params.id)
    
    // 先检查学生是否存在
    const [student] = await db.query('SELECT * FROM student WHERE id = ?', [req.params.id])
    if (student.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '未找到该学生'
      })
    }

    // 删除学生记录
    await db.query('DELETE FROM student WHERE id = ?', [req.params.id])
    
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

router.get('/maxStudentId', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT MAX(student_id) as maxId FROM student')
    res.json({
      code: 200,
      data: rows[0].maxId,
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

export default router