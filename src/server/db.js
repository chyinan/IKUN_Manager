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

// --- Config Cache ---
let configCache = {}; // In-memory cache for config values
let lastCacheUpdateTime = 0;
const CACHE_DURATION = 60 * 1000; // Cache duration in ms (e.g., 60 seconds)

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

/**
 * Get all configuration values from the database or cache
 * @returns {Promise<Object>} Object containing all config key-value pairs
 */
async function getAllConfig() {
    const now = Date.now();
    // Check cache validity
    if (now - lastCacheUpdateTime < CACHE_DURATION && Object.keys(configCache).length > 0) {
        console.log('[DB Config] Returning config from cache.');
        return configCache;
    }

    console.log('[DB Config] Fetching config from database...');
    try {
        const [rows] = await pool.query('SELECT config_key, config_value FROM system_config');
        configCache = rows.reduce((acc, row) => {
            acc[row.config_key] = row.config_value;
            return acc;
        }, {});

        // Ensure essential keys have default values if missing from DB
        if (!configCache.studentIdRegex) configCache.studentIdRegex = '^S\\d{8}$';
        if (!configCache.employeeIdRegex) configCache.employeeIdRegex = '^E\\d{5}$';
        if (configCache.logRetentionDays === undefined) configCache.logRetentionDays = '0'; // Default to '0' (string)

        lastCacheUpdateTime = now;
        console.log('[DB Config] Config cache updated:', configCache);
        return configCache;
    } catch (error) {
        console.error('获取系统配置失败:', error);
        // Return defaults or last known cache on error to prevent total failure?
        // For now, return defaults including the new one
        return {
            studentIdRegex: '^S\\d{8}$',
            employeeIdRegex: '^E\\d{5}$',
            logRetentionDays: '0'
        };
    }
}

/**
 * Update or insert a specific configuration value
 * @param {string} key Configuration key
 * @param {string} value Configuration value
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function updateConfig(key, value) {
    if (typeof key !== 'string' || key.trim() === '') {
        console.error('无效的配置键:', key);
        return false;
    }
    // Ensure value is treated as a string for DB storage
    const stringValue = String(value);

    console.log(`[DB Config] Attempting to update/insert config: ${key} = ${stringValue}`);
    try {
        const query = `
            INSERT INTO system_config (config_key, config_value, description, update_time)
            VALUES (?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE config_value = ?, description = ?, update_time = NOW()
        `;
        // Provide a default description or derive it
        let description = `Configuration for ${key}`;
        if (key === 'studentIdRegex') description = '学号正则表达式';
        else if (key === 'employeeIdRegex') description = '员工号正则表达式';
        else if (key === 'logRetentionDays') description = '日志保留天数 (0表示不自动删除)';

        const [result] = await pool.query(query, [key, stringValue, description, stringValue, description]);

        // Invalidate cache immediately after successful update
        lastCacheUpdateTime = 0;
        configCache = {}; // Clear cache
        console.log(`[DB Config] Config '${key}' updated/inserted successfully. Cache invalidated.`);
        // Check affectedRows or changedRows depending on insert/update
        return result.affectedRows > 0 || result.changedRows > 0;
    } catch (error) {
        console.error(`更新配置项 '${key}' 失败:`, error);
        return false;
    }
}

module.exports = {
  query,
  testConnection,
  getConnection,
  getAllConfig,
  updateConfig,
  configEmitter
}; 