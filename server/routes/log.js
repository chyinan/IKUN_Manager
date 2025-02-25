import express from 'express'
import db from '../config/db.js'
import Logger from '../utils/logger.js'

const router = express.Router()

// 获取日志列表
router.get('/list', async (req, res) => {
  try {
    const { type, startTime, endTime, limit = 1000 } = req.query
    
    let query = 'SELECT * FROM system_log'
    const params = []
    
    if (type) {
      query += ' WHERE type = ?'
      params.push(type)
    }
    
    if (startTime && endTime) {
      query += type ? ' AND' : ' WHERE'
      query += ' create_time BETWEEN ? AND ?'
      params.push(startTime, endTime)
    }
    
    query += ' ORDER BY create_time DESC LIMIT ?'
    params.push(Number(limit))
    
    const [rows] = await db.query(query, params)
    
    res.json({
      code: 200,
      data: rows,
      message: '获取成功'
    })
  } catch (error) {
    console.error('获取日志失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message
    })
  }
})

// 清空日志
router.delete('/clear', async (req, res) => {
  try {
    await db.query('TRUNCATE TABLE system_log')
    res.json({
      code: 200,
      message: '日志已清空'
    })
  } catch (error) {
    console.error('清空日志失败:', error)
    res.status(500).json({
      code: 500,
      message: error.message
    })
  }
})

export default router