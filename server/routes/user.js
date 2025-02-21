const express = require('express')
const router = express.Router()
const db = require('../config/db')

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    
    const [rows] = await db.query(
      'SELECT * FROM user WHERE username = ? AND password = ?',
      [username, password]
    )

    if (rows.length > 0) {
      res.json({
        code: 200,
        data: {
          username: rows[0].username,
          email: rows[0].email
        },
        message: '登录成功'
      })
    } else {
      res.json({
        code: 401,
        message: '用户名或密码错误'
      })
    }
  } catch (err) {
    console.error('登录失败:', err)
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    })
  }
})

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body

    // 检查用户名是否已存在
    const [existingUser] = await db.query(
      'SELECT * FROM user WHERE username = ? OR email = ?',
      [username, email]
    )

    if (existingUser.length > 0) {
      return res.json({
        code: 400,
        message: '用户名或邮箱已存在'
      })
    }

    // 插入新用户
    await db.query(
      'INSERT INTO user (username, password, email) VALUES (?, ?, ?)',
      [username, password, email]
    )

    res.json({
      code: 200,
      message: '注册成功'
    })
  } catch (err) {
    console.error('注册失败:', err)
    res.status(500).json({
      code: 500,
      message: '服务器错误'
    })
  }
})

// 修改密码
router.post('/updatePassword', async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body
    console.log('修改密码请求:', { username, oldPassword: '***', newPassword: '***' })

    // 首先验证原密码
    const [users] = await db.query(
      'SELECT * FROM user WHERE username = ?',
      [username]
    )

    if (users.length === 0) {
      return res.json({
        code: 400,
        message: '用户不存在'
      })
    }

    const user = users[0]
    if (user.password !== oldPassword) {
      return res.json({
        code: 400,
        message: '原密码错误'
      })
    }

    // 更新密码
    await db.query(
      'UPDATE user SET password = ? WHERE username = ?',
      [newPassword, username]
    )

    console.log('密码修改成功')
    res.json({
      code: 200,
      message: '密码修改成功'
    })
  } catch (err) {
    console.error('修改密码失败:', err)
    res.status(500).json({
      code: 500,
      message: err.message || '修改密码失败'
    })
  }
})

module.exports = router