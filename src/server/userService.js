const db = require('./db');
const bcrypt = require('bcrypt');
const saltRounds = 10; // Consistent salt rounds

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

/**
 * Find user by ID
 * @param {number} id User ID
 * @returns {Promise<Object|null>} User object or null if not found
 */
async function findUserById(id) {
  const userId = parseInt(id, 10); // Ensure ID is an integer
  console.log(`[UserService] Finding user by ID: ${userId} (type: ${typeof userId})`);
  if (isNaN(userId)) {
    console.error(`[UserService] Invalid ID passed: ${id}`);
    return null;
  }
  try {
    const query = 'SELECT id, username, password, email FROM user WHERE id = ?';
    // Use destructuring, expecting a single user object if found
    const [userObject] = await db.query(query, [userId]); 
    console.log(`[UserService] Result from db.query for ID ${userId} (destructured): ${JSON.stringify(userObject)}`); 

    // Check if the destructured object exists
    if (userObject) { 
      console.log(`[UserService] User found for ID: ${userId}`);
      return userObject; // Return the user object found
    } else {
      console.log(`[UserService] User not found for ID: ${userId}`);
      return null;
    }
  } catch (error) {
    console.error(`[UserService] Error finding user by ID ${userId}:`, error);
    throw error; // Re-throw the error for the caller to handle
  }
}

/**
 * Hash a plain password
 * @param {string} plainPassword
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(plainPassword) {
  console.log('[UserService] Hashing new password...');
  try {
    const hash = await bcrypt.hash(plainPassword, saltRounds);
    console.log('[UserService] Password hashed successfully.');
    return hash;
  } catch (error) {
    console.error('[UserService] Error hashing password:', error);
    throw error;
  }
}

/**
 * Update user's password hash in the database
 * @param {number} userId
 * @param {string} newPasswordHash
 * @returns {Promise<boolean>} True if update was successful, false otherwise
 */
async function updateUserPassword(userId, newPasswordHash) {
  console.log(`[UserService] Updating password hash for user ID: ${userId}`);
  try {
    const query = 'UPDATE user SET password = ?, update_time = CURRENT_TIMESTAMP WHERE id = ?';
    // Correctly handle the result object from UPDATE query (do not destructure as array)
    const result = await db.query(query, [newPasswordHash, userId]); 
    console.log(`[UserService] DB update result: ${JSON.stringify(result)}`); // Log the actual result object
    // Check affectedRows directly from the result object
    const success = result && result.affectedRows > 0; 
    if (success) {
      console.log(`[UserService] Password updated successfully for user ID: ${userId}`);
    } else {
      console.warn(`[UserService] Password update failed for user ID: ${userId}. User might not exist or password was the same.`);
    }
    return success;
  } catch (error) {
    console.error(`[UserService] Error updating password for user ID ${userId}:`, error);
    throw error;
  }
}

/**
 * Update user's email in the database
 * @param {number} userId
 * @param {string} newEmail
 * @returns {Promise<boolean>} True if update was successful, false otherwise
 */
async function updateUserEmail(userId, newEmail) {
  console.log(`[UserService] Updating email for user ID: ${userId}`);
  try {
    // Optional: Add check for email format and uniqueness before updating
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email regex
    if (!emailRegex.test(newEmail)) {
        console.warn(`[UserService] Invalid email format: ${newEmail}`);
        throw new Error('无效的邮箱格式');
    }
    // Optional: Check if email already exists for another user
    // const checkQuery = 'SELECT id FROM user WHERE email = ? AND id != ?';
    // const [existingUser] = await db.query(checkQuery, [newEmail, userId]);
    // if (existingUser) {
    //     console.warn(`[UserService] Email already exists: ${newEmail}`);
    //     throw new Error('该邮箱已被其他用户注册');
    // }

    const query = 'UPDATE user SET email = ?, update_time = CURRENT_TIMESTAMP WHERE id = ?';
    const result = await db.query(query, [newEmail, userId]);
    console.log(`[UserService] DB update email result: ${JSON.stringify(result)}`);
    const success = result && result.affectedRows > 0;
    if (success) {
      console.log(`[UserService] Email updated successfully for user ID: ${userId}`);
    } else {
      console.warn(`[UserService] Email update failed for user ID: ${userId}. User might not exist.`);
    }
    return success;
  } catch (error) {
    console.error(`[UserService] Error updating email for user ID ${userId}:`, error);
    throw error; // Re-throw to be caught by route handler
  }
}

/**
 * 更新用户信息
 * @param {number} userId 用户ID
 * @param {object} updateData 要更新的数据对象
 * @returns {Promise<boolean>} 更新是否成功
 */
async function updateUser(userId, updateData) {
  console.log(`[UserService] Updating user info for ID: ${userId}, data:`, updateData);
  try {
    if (!userId || !updateData || Object.keys(updateData).length === 0) {
      console.warn('[UserService] Invalid update parameters');
      return false;
    }

    // 构建更新字段和值的数组
    const fields = Object.keys(updateData);
    const values = fields.map(field => updateData[field]);
    values.push(userId); // 添加 userId 作为 WHERE 条件

    // 构建 SET 子句
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const query = `UPDATE user SET ${setClause}, update_time = CURRENT_TIMESTAMP WHERE id = ?`;

    const result = await db.query(query, values);
    const success = result && result.affectedRows > 0;

    if (success) {
      console.log(`[UserService] User info updated successfully for ID: ${userId}`);
    } else {
      console.warn(`[UserService] User info update failed for ID: ${userId}`);
    }

    return success;
  } catch (error) {
    console.error(`[UserService] Error updating user info for ID ${userId}:`, error);
    throw error;
  }
}

module.exports = {
  findUserByUsername,
  comparePassword,
  findUserById,
  hashPassword,
  updateUserPassword,
  updateUserEmail,
  updateUser
}; 