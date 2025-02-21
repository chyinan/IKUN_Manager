const express = require('express')
const router = express.Router()
const db = require('../config/db')

// 添加测试路由
router.get('/test', (req, res) => {
  console.log('访问测试路由')
  res.json({
    code: 200,
    message: '成绩路由测试成功'
  })
})

// 获取成绩
router.get('/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params
    const { exam_type } = req.query
    
    const [rows] = await db.query(
      'SELECT subject, score, exam_type, exam_time FROM student_score WHERE student_id = ? AND exam_type = ?',
      [studentId, exam_type]
    )
    
    if (rows.length === 0) {
      // 如果没有找到对应考试类型的成绩，返回空数据
      return res.json({
        code: 200,
        data: null,
        message: '暂无成绩数据'
      })
    }

    const scores = rows.reduce((acc, curr) => {
      acc[curr.subject] = parseFloat(curr.score)
      return acc
    }, {})

    // 添加考试类型和时间信息
    scores.exam_type = rows[0].exam_type
    scores.exam_time = rows[0].exam_time

    res.json({
      code: 200,
      data: scores,
      message: '获取成功'
    })
  } catch (err) {
    console.error('获取成绩失败:', err)
    res.status(500).json({
      code: 500,
      message: err.message
    })
  }
})

// 保存成绩
router.post('/save', async (req, res) => {
  try {
    const { student_id, scores, exam_type, exam_time } = req.body
    
    // 为每个科目保存成绩
    for (const [subject, score] of Object.entries(scores)) {
      await db.query(
        `INSERT INTO student_score 
        (student_id, subject, score, exam_type, exam_time) 
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE score = ?`,
        [student_id, subject, score, exam_type, exam_time, score]
      )
    }

    res.json({
      code: 200,
      message: '保存成功'
    })
  } catch (err) {
    console.error('保存成绩失败:', err)
    res.status(500).json({
      code: 500,
      message: err.message
    })
  }
})

module.exports = router