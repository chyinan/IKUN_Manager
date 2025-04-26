const mysql = require('mysql2/promise');
const config = require('./config');
const { EventEmitter } = require('events');

// Create and export an event emitter for config changes
const configEmitter = new EventEmitter();

let pool;

// Function to create the connection pool
async function createPool() {
  try {
    pool = mysql.createPool(config.db);
    console.log('数据库连接池创建成功');
    // Test connection on startup
    const connection = await pool.getConnection();
    console.log('数据库连接测试成功');
    connection.release();
  } catch (error) {
    console.error('数据库连接池创建或连接测试失败:', error);
    throw error; // Propagate the error to stop the server if needed
  }
}

// Call createPool immediately when the module is loaded
createPool();

/**
 * 执行SQL查询
 * @param {string} sql SQL语句
 * @param {Array} params 查询参数
 * @returns {Promise<Array>} 查询结果
 */
async function query(sql, params = []) {
  if (!pool) {
    console.error('错误: 数据库连接池未初始化!');
    throw new Error('数据库连接池未初始化');
  }
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error(`数据库查询失败: ${sql}`, error);
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
  if (!pool) {
    console.error('错误: 数据库连接池未初始化!');
    throw new Error('数据库连接池未初始化');
  }
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    console.error('获取数据库连接失败:', error);
    throw error;
  }
}

// 获取所有系统配置
async function getAllConfig() {
  try {
    const rows = await query('SELECT config_key, config_value FROM system_config');
    const configData = rows.reduce((acc, row) => {
      acc[row.config_key] = row.config_value;
      return acc;
    }, {});
    return configData;
  } catch (error) {
    console.error('获取所有配置失败:', error);
    return {}; // Return empty object on failure
  }
}

// Get a specific config value
async function getConfig(key) {
  try {
    const rows = await query('SELECT config_value FROM system_config WHERE config_key = ?', [key]);
    return rows.length > 0 ? rows[0].config_value : null;
  } catch (error) {
    console.error(`获取配置项 ${key} 失败:`, error);
    return null;
  }
}

// Update or insert a config value
async function updateConfig(key, value) {
  try {
    // Simplified SQL: Removed the subquery for description to avoid ER_UPDATE_TABLE_USED error.
    // Now, updating a config value will reset its description if it was inserted, 
    // or keep the existing description if it was updated (standard ON DUPLICATE KEY behavior for other columns isn't affected).
    const sql = `
      INSERT INTO system_config (config_key, config_value, update_time) 
      VALUES (?, ?, NOW()) 
      ON DUPLICATE KEY UPDATE config_value = ?, update_time = NOW()
    `;
    // Parameters: key, value (for INSERT), value (for UPDATE)
    const result = await query(sql, [key, value, value]);
    
    // Check if the insert or update actually happened
    if (result.affectedRows > 0 || result.warningStatus === 0) { // warningStatus 0 often indicates a successful update with no change
      console.log(`配置项 '${key}' 更新或插入成功`);
      // Emit event only if update/insert was successful
      configEmitter.emit('configUpdated', key, value); // <-- Emit event
      return true;
    } else {
      console.warn(`配置项 '${key}' 更新似乎没有影响行数，可能值未改变`);
       // Still emit event if value might be the same but user intended to save
       configEmitter.emit('configUpdated', key, value); 
      return true; // Consider it a success even if value didn't change
    }
  } catch (error) {
    console.error(`更新配置项 ${key} 失败:`, error);
    return false;
  }
}

module.exports = {
  query,
  testConnection,
  getConnection,
  getAllConfig,
  getConfig,
  updateConfig,
  configEmitter
}; 