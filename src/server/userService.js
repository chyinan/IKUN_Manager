const db = require('./db');
const bcrypt = require('bcrypt');

/**
 * 根据用户名查找用户
 * @param {string} username 用户名
 * @returns {Promise<object | null>} 用户对象或 null
 */
async function findUserByUsername(username) {
  console.log(`[UserService] Attempting to find user by username: ${username}`);
  try {
    if (!username) {
      console.log('[UserService] Username is empty, returning null.');
      return null;
    }
    const query = 'SELECT id, username, password, email FROM user WHERE username = ?'; 
    console.log(`[UserService] Executing query: ${query} with username: ${username}`);
    
    // Use destructuring - assuming [rows] might yield the first row object directly if one exists
    const [userObject] = await db.query(query, [username]);
    console.log(`[UserService] Result from db.query (destructured): ${JSON.stringify(userObject)}`); 
    
    // --- Check if an object was actually returned --- 
    if (userObject) { 
        // User found, return the user object directly
        console.log(`[UserService] User object found: ${JSON.stringify(userObject)}`); 
        return userObject;
    } else {
        // No user object returned from destructuring
        console.log(`[UserService] No user object returned from query.`); 
        return null;
    }
  } catch (error) {
    console.error(`[UserService] Error finding user by username (username: ${username}):`, error);
    throw error; 
  }
}

/**
 * 比较密码
 * @param {string} plainPassword 用户输入的明文密码
 * @param {string} hashedPassword 数据库中存储的哈希密码
 * @returns {Promise<boolean>} 密码是否匹配
 */
async function comparePassword(plainPassword, hashedPassword) {
  console.log(`[UserService] Comparing password. Plain provided: ${plainPassword ? 'Yes' : 'No'}, Hash provided: ${hashedPassword ? 'Yes' : 'No'}`);
  try {
    if (!plainPassword || !hashedPassword) {
        console.log('[UserService] Plain password or hashed password missing.');
        return false;
    }
    console.log(`[UserService] Hashed password from DB (start): ${hashedPassword.substring(0, 10)}...`); 
    const match = await bcrypt.compare(plainPassword, hashedPassword);
    console.log(`[UserService] Password comparison result: ${match}`);
    return match;
  } catch (error) {
    console.error('[UserService] Error during password comparison:', error);
    return false; 
  }
}

module.exports = {
  findUserByUsername,
  comparePassword,
}; 