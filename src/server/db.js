const mysql = require('mysql2/promise');
const config = require('./config');

// 创建数据库连接池
const pool = mysql.createPool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/**
 * 执行SQL查询
 * @param {string} sql SQL语句
 * @param {Array} params 查询参数
 * @returns {Promise<Array>} 查询结果
 */
async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('数据库查询错误:', error);
    throw error;
  }
}

/**
 * 测试数据库连接
 * @returns {Promise<boolean>} 连接是否成功
 */
async function testConnection() {
  try {
    await query('SELECT 1');
    console.log('数据库连接成功');
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error);
    return false;
  }
}

// 封装查询函数
async function getConnection() {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    console.error('获取数据库连接失败:', error);
    throw error; // Re-throw error
  }
}

// 获取所有系统配置
async function getAllConfig() {
  const sql = 'SELECT config_key, config_value FROM system_config';
  try {
    const [rows] = await pool.query(sql);
    // 将结果转换为 key-value 对象
    const config = rows.reduce((acc, row) => {
      acc[row.config_key] = row.config_value;
      return acc;
    }, {});
    return config;
  } catch (error) {
    console.error('Error fetching config:', error);
    throw error;
  }
}

// 更新单个系统配置项
async function updateConfig(key, value) {
  const sql = 'INSERT INTO system_config (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)';
  try {
    const [result] = await pool.query(sql, [key, value]);
    return result;
  } catch (error) {
    console.error(`Error updating config key ${key}:`, error);
    throw error;
  }
}

module.exports = {
  query,
  testConnection,
  getConnection,
  getAllConfig,
  updateConfig
}; 