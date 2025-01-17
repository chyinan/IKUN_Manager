const router = express.Router()

// 获取部门列表
router.get('/depts', (req, res) => {
  const sql = 'SELECT * FROM department'
  db.query(sql, (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message })
    } else {
      res.json({
        code: 200,
        data: result,
        message: '获取成功'
      })
    }
  })
})

// 添加部门
router.post('/depts', (req, res) => {
  const { deptName, manager, description } = req.body
  const sql = 'INSERT INTO department (dept_name, manager, description) VALUES (?, ?, ?)'
  
  db.query(sql, [deptName, manager, description], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message })
    } else {
      res.json({
        code: 200,
        message: '添加成功'
      })
    }
  })
})

// 更新部门
router.put('/depts', (req, res) => {
  const { id, deptName, manager, description } = req.body
  const sql = 'UPDATE department SET dept_name = ?, manager = ?, description = ? WHERE id = ?'
  
  db.query(sql, [deptName, manager, description, id], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message })
    } else {
      res.json({
        code: 200,
        message: '更新成功'
      })
    }
  })
})

// 删除部门
router.delete('/depts', (req, res) => {
  const { id } = req.query
  const sql = 'DELETE FROM department WHERE id = ?'
  
  db.query(sql, [id], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message })
    } else {
      res.json({
        code: 200,
        message: '删除成功'
      })
    }
  })
})