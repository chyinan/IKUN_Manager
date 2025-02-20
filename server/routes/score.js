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

// 获取学生成绩
router.get('/:studentId', async (req, res) => {
  try {
    console.log('获取学生成绩, ID:', req.params.studentId)
    
    const [rows] = await db.query(
      `SELECT subject, score 
       FROM student_score 
       WHERE student_id = ?`,
      [req.params.studentId]
    )

    console.log('查询结果:', rows)

    const scores = {}
    rows.forEach(row => {
      scores[row.subject] = parseFloat(row.score)
    })

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

// 保存学生成绩
router.post('/save', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { student_id, scores } = req.body;
    const exam_time = new Date().toISOString().split('T')[0];
    const exam_type = '月考';

    console.log('保存成绩数据:', { student_id, scores, exam_time, exam_type });
    
    await connection.beginTransaction();

    // 删除该学生当天的成绩记录
    await connection.query(
      'DELETE FROM student_score WHERE student_id = ? AND exam_time = ?',
      [student_id, exam_time]
    );

    // 插入新的成绩记录
    for (const [subject, score] of Object.entries(scores)) {
      await connection.query(
        'INSERT INTO student_score (student_id, subject, score, exam_time, exam_type) VALUES (?, ?, ?, ?, ?)',
        [student_id, subject, score, exam_time, exam_type]
      );
    }

    await connection.commit();
    
    res.json({
      code: 200,
      message: '保存成功'
    });
  } catch (err) {
    await connection.rollback();
    console.error('保存成绩失败:', err);
    res.status(500).json({
      code: 500,
      message: err.message
    });
  } finally {
    connection.release();
  }
});

module.exports = router