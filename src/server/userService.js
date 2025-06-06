const db = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // 导入 JWT
const config = require('./config'); // 导入配置以获取JWT密钥和过期时间
const saltRounds = 10; // Consistent salt rounds
const path = require('path'); // Needed if deleting old avatar
const fs = require('fs');     // Needed if deleting old avatar
const logService = require('./logService'); // <-- 添加 logService 导入

// --- JWT Secret (copied from server.js for consistency) ---
const JWT_SECRET = process.env.JWT_SECRET || config.jwt.secret || 'YOUR_TEMPORARY_SECRET_KEY_CHANGE_ME'; 
if (JWT_SECRET === 'YOUR_TEMPORARY_SECRET_KEY_CHANGE_ME') {
    console.warn('[UserService] WARNING: Using default JWT secret.');
}
const JWT_EXPIRES_IN = config.jwt.expiresIn || '24h';

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
    const query = 'SELECT id, username, password, email, role, avatar, create_time, display_name FROM user WHERE username = ?';
    console.log(`[UserService] Executing query: ${query} with username: ${username}`);
    
    const [userObject] = await db.query(query, [username]);
    console.log(`[UserService] Result from db.query (destructured): ${JSON.stringify(userObject)}`); 
    
    if (userObject) { 
        console.log(`[UserService] User object found: ${JSON.stringify(userObject)}`); 
        return userObject;
    } else {
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
  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    console.error(`[UserService] Invalid ID passed to findUserById: ${id}`);
    return null;
  }
  try {
    const [userFromDb] = await db.query('SELECT id, username, password, email, role, avatar, create_time, display_name FROM user WHERE id = ?', [userId]);

    if (!userFromDb) {
      return null;
    }

    let studentSpecificInfo = null;
    let studentPhone = null; 
    let studentEmail = null; 

    if (userFromDb.role === 'student') {
      const [studentProfile] = await db.query('SELECT id AS student_pk, student_id, name, email, phone FROM student WHERE user_id = ?', [userId]);
      if (studentProfile) {
        studentSpecificInfo = {
          student_pk: studentProfile.student_pk,
          studentIdStr: studentProfile.student_id,
          name: studentProfile.name,
          email: studentProfile.email, 
          phone: studentProfile.phone  
        };
        studentPhone = studentProfile.phone; 
        studentEmail = studentProfile.email; 

        if (!userFromDb.display_name && studentProfile.name) {
            userFromDb.display_name = studentProfile.name;
        }
      } else {
        console.warn(`[UserService] User ID ${userId} has role 'student' but no matching profile in 'student' table via user_id.`);
      }
    }
    
    const finalEmail = (userFromDb.role === 'student' && studentEmail !== null && studentEmail !== undefined) ? studentEmail : userFromDb.email;
    const finalPhone = (userFromDb.role === 'student' && studentPhone !== null && studentPhone !== undefined) ? studentPhone : null; 

    return {
      ...userFromDb, 
      email: finalEmail, 
      phone: finalPhone, 
      studentInfo: studentSpecificInfo,
    };

  } catch (error) {
    console.error(`[UserService] Error in findUserById (ID: ${userId}):`, error);
    throw error; 
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
 * 更新用户信息.
 * This function now handles updating fields in both 'user' and related 'student' tables within a transaction.
 * @param {number} userId - The ID of the user to update.
 * @param {object} updateData - An object containing the data to update (e.g., { display_name, phone, email }).
 * @param {string} operator - The username of the person performing the update, for logging purposes.
 * @returns {Promise<boolean>} - True if any record was successfully updated, false otherwise.
 */
async function updateUser(userId, updateData, operator) {
  console.log(`[UserService] Updating user info for ID: ${userId}, data:`, updateData);
  const connection = await db.getConnection();
  try {
    if (!userId || !updateData || Object.keys(updateData).length === 0) {
      console.warn('[UserService] Invalid update parameters: userId or updateData is missing.');
      return false;
    }
    
    await connection.beginTransaction();

    // 1. Get user role to determine where to save profile info
    const [userRows] = await connection.query('SELECT role FROM user WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      throw new Error('用户不存在');
    }
    const userRole = userRows[0].role;
    
    // 2. Separate data for different tables
    const userTableData = {};
    const studentTableData = {};

    // Assign data to the correct table object based on field name and user role
    if (updateData.display_name !== undefined) userTableData.display_name = updateData.display_name;
    if (updateData.avatar !== undefined) userTableData.avatar = updateData.avatar;
    
    if (updateData.email !== undefined) {
      if (userRole === 'student') studentTableData.email = updateData.email;
      else userTableData.email = updateData.email;
    }
    if (updateData.phone !== undefined) {
      if (userRole === 'student') studentTableData.phone = updateData.phone;
      else console.warn(`[UserService] Phone update requested for non-student role '${userRole}', ignoring.`);
    }
    
    let userUpdateOccurred = false;
    let profileUpdateOccurred = false;

    // 3. Update 'user' table if there's data for it
    if (Object.keys(userTableData).length > 0) {
      // Add validation for fields if necessary (e.g., email format/uniqueness for non-students)
      if (userTableData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userTableData.email)) throw new Error('无效的邮箱格式');
        const [existing] = await connection.query('SELECT id FROM user WHERE email = ? AND id != ?', [userTableData.email, userId]);
        if (existing.length > 0) throw new Error('该邮箱已被其他用户注册');
      }

      const userSetClause = Object.keys(userTableData).map(key => `\`${key}\` = ?`).join(', ');
      const userValues = [...Object.values(userTableData), userId];
      const userSql = `UPDATE user SET ${userSetClause}, update_time = CURRENT_TIMESTAMP WHERE id = ?`;
      const [userResult] = await connection.query(userSql, userValues);
      userUpdateOccurred = userResult.affectedRows > 0;
    }

    // 4. Update 'student' table if the user is a student and there's relevant data
    if (userRole === 'student' && Object.keys(studentTableData).length > 0) {
      // Add validation for student-specific fields
      if (studentTableData.phone) {
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phoneRegex.test(studentTableData.phone)) throw new Error('手机号码格式不正确');
      }
       if (studentTableData.email) {
         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
         if (!emailRegex.test(studentTableData.email)) throw new Error('无效的邮箱格式');
         const [existing] = await connection.query('SELECT id FROM student WHERE email = ? AND user_id != ?', [studentTableData.email, userId]);
         if (existing.length > 0) throw new Error('该邮箱已被其他学生注册');
      }

      const studentSetClause = Object.keys(studentTableData).map(key => `\`${key}\` = ?`).join(', ');
      const studentValues = [...Object.values(studentTableData), userId];
      const studentSql = `UPDATE student SET ${studentSetClause}, update_time = CURRENT_TIMESTAMP WHERE user_id = ?`;
      const [studentResult] = await connection.query(studentSql, studentValues);
      profileUpdateOccurred = studentResult.affectedRows > 0;
    }

    // If we've reached here, the logic is done. Commit the transaction.
    await connection.commit();
    console.log(`[UserService] User profile update transaction committed for user ID: ${userId}. User table changed: ${userUpdateOccurred}, Profile table changed: ${profileUpdateOccurred}`);
    
    // Log the successful update if anything changed
    if (userUpdateOccurred || profileUpdateOccurred) {
        await logService.addLogEntry({
          type: 'database',
          operation: '更新用户资料',
          content: `用户 (ID: ${userId}) 资料已成功更新。`,
          operator: operator,
        });
    }

    return userUpdateOccurred || profileUpdateOccurred; // Return true if at least one update happened

  } catch (error) {
    if (connection) await connection.rollback(); // Ensure rollback on error
    console.error(`[UserService] Error updating user info for ID ${userId}:`, error);
    // Log the detailed error
    await logService.addLogEntry({
        type: 'error',
        operation: '更新用户资料失败',
        content: `用户ID ${userId} 更新资料时出错: ${error.message}`,
        operator: operator,
    });
    throw error; // Re-throw to be handled by the server route
  } finally {
    if (connection) {
        connection.release();
    }
  }
}

/**
 * 用户登录逻辑
 * @param {string} username 用户名
 * @param {string} password 密码
 * @returns {Promise<object>} 包含 token 和用户信息的对象
 * @throws {Error} 如果用户不存在或密码错误
 */
async function loginUser(usernameInput, password) {
  console.log(`[UserService] Attempting login for username/student_id: ${usernameInput}`);
  let userForToken = null;
  let studentDataForResponse = null;
  let userEmail = null; 
  let studentIdUsedForLogin = null; // Track if student ID was used
  let displayNameForToken = null; // For storing display_name

  let existingUser = await findUserByUsername(usernameInput);

  if (existingUser) {
    console.log(`[UserService] Found user by username: ${existingUser.username}`);
    userEmail = existingUser.email;
    displayNameForToken = existingUser.display_name; // Get display_name
    const passwordMatch = await comparePassword(password, existingUser.password);

    if (passwordMatch) {
      userForToken = {
        id: existingUser.id,
        username: existingUser.username,
        role: existingUser.role,
        avatar: existingUser.avatar,
        display_name: existingUser.display_name // ADD display_name
      };
      if (existingUser.role === 'student') {
        const [studentProfile] = await db.query('SELECT id AS student_pk, student_id, name FROM student WHERE user_id = ?', [existingUser.id]);
        if (studentProfile) {
          studentDataForResponse = { student_pk: studentProfile.student_pk, studentIdStr: studentProfile.student_id, name: studentProfile.name };
          // If user.display_name is still null/empty for a student, use student's name
          if (!userForToken.display_name && studentProfile.name) {
            userForToken.display_name = studentProfile.name; // also update for final return
          }
        }
      }
    } else {
      console.log(`[UserService] Password mismatch for user: ${existingUser.username}`);
      await logService.addLogEntry({ type: 'auth', operation: '登录失败', content: "用户 '" + usernameInput + "' 密码错误.", operator: usernameInput });
      throw new Error('密码错误');
    }
  } else {
    const studentIdRegex = /^S\d{7}$/;
    if (studentIdRegex.test(usernameInput)) {
      studentIdUsedForLogin = usernameInput;
      console.log(`[UserService] Input '${usernameInput}' matches student ID format.`);
      
      const [studentByStudentId] = await db.query('SELECT id, student_id, name, user_id, email FROM student WHERE student_id = ?', [studentIdUsedForLogin]);

      if (!studentByStudentId) {
        console.log(`[UserService] No student found with student_id: ${studentIdUsedForLogin}`);
        await logService.addLogEntry({ type: 'auth', operation: '登录失败', content: "学号 '" + studentIdUsedForLogin + "' 不存在.", operator: studentIdUsedForLogin });
        throw new Error('学号不存在');
      }

      console.log(`[UserService] Found student in 'student' table: ${JSON.stringify(studentByStudentId)}`);
      userEmail = studentByStudentId.email; 
      displayNameForToken = studentByStudentId.name; // Student's actual name for display_name

      if (studentByStudentId.user_id) {
        console.log(`[UserService] Student ${studentIdUsedForLogin} has existing user_id: ${studentByStudentId.user_id}. Verifying password for this existing user account.`);
        existingUser = await findUserById(studentByStudentId.user_id); // This will now include display_name
        if (!existingUser) {
           console.error(`[UserService] Data inconsistency: Student ${studentIdUsedForLogin} has user_id ${studentByStudentId.user_id}, but no such user found in user table.`);
           await logService.addLogEntry({ type: 'auth', operation: '登录失败', content: "用户数据异常，学生关联用户丢失，学号：'"+ studentIdUsedForLogin +"'", operator: studentIdUsedForLogin });
           throw new Error('用户数据异常，请联系管理员');
        }
        displayNameForToken = existingUser.display_name || studentByStudentId.name; // Prioritize user.display_name, fallback to student.name
        userEmail = existingUser.email; // User table email is more authoritative

        const passwordMatch = await comparePassword(password, existingUser.password);
        if (passwordMatch) {
          userForToken = {
            id: existingUser.id,
            username: existingUser.username,
            role: existingUser.role,
            avatar: existingUser.avatar,
            display_name: displayNameForToken // ADD display_name
          };
          studentDataForResponse = { student_pk: studentByStudentId.id, studentIdStr: studentByStudentId.student_id, name: studentByStudentId.name };
        } else {
          console.log(`[UserService] Password mismatch for existing user account linked to student ${studentIdUsedForLogin}.`);
          await logService.addLogEntry({ type: 'auth', operation: '登录失败', content: "学号 '" + studentIdUsedForLogin + "' 对应账户密码错误.", operator: studentIdUsedForLogin });
          throw new Error('密码错误');
        }
      } else {
        console.log(`[UserService] Student ${studentIdUsedForLogin} found, no user_id. Attempting first-time login.`);
        if (password === config.studentDefaultPassword) {
          console.log(`[UserService] Student ${studentIdUsedForLogin} used default password. Proceeding to create user account.`);
          const newUsername = studentIdUsedForLogin; 
          
          const checkUserConflict = await findUserByUsername(newUsername);
          if (checkUserConflict) {
            console.error(`[UserService] Username conflict: Student ID ${newUsername} already exists as a username, but student.user_id was null. Data inconsistency.`);
             await logService.addLogEntry({ type: 'auth', operation: '登录失败', content: "账户创建失败：用户名冲突，学号：'"+ newUsername +"'", operator: studentIdUsedForLogin });
            throw new Error('账户创建失败：用户名冲突');
          }

          const hashedPassword = await hashPassword(password);
          const newUser = {
            username: studentByStudentId.student_id,
            password: hashedPassword,
            role: 'student',
            email: studentByStudentId.email || `${studentByStudentId.student_id}@example.com`, // Use student email or generate a default one
            display_name: studentByStudentId.name,
            create_time: new Date() 
          };
          console.log(`[UserService] Creating user with data for student ${studentByStudentId.student_id}: ${JSON.stringify(newUser)}`);
          displayNameForToken = studentByStudentId.name; // Set for final return object

          let createdUserId;
          try {
            const columns = Object.keys(newUser);
            const placeholders = columns.map(() => '?').join(', ');
            const values = Object.values(newUser);
            const sql = `INSERT INTO user (${columns.join(', ')}) VALUES (${placeholders})`;
            
            const insertResult = await db.query(sql, values);
            if (!insertResult || !insertResult.insertId) {
              throw new Error('获取新用户ID失败');
            }
            createdUserId = insertResult.insertId;
            console.log(`[UserService] New user account created for student ${studentIdUsedForLogin} with user_id: ${createdUserId}`);
            await logService.addLogEntry({ type: 'user', operation: '创建用户', content: "为学号 '" + studentIdUsedForLogin + "' 自动创建新用户，ID: " + createdUserId + ".", operator: 'system' });
          } catch (dbError) {
            console.error(`[UserService] Database error creating user for student ${studentIdUsedForLogin}:`, dbError);
            await logService.addLogEntry({ type: 'auth', operation: '登录失败', content: "账户创建失败（数据库操作失败），学号：'" + studentIdUsedForLogin +"'", operator: studentIdUsedForLogin });
            throw new Error('账户创建失败');
          }

          try {
            const updateStudentResult = await db.query('UPDATE student SET user_id = ? WHERE id = ?', [createdUserId, studentByStudentId.id]);
            if (!updateStudentResult || updateStudentResult.affectedRows === 0) {
                console.error(`[UserService] Failed to update student table with user_id for student ${studentIdUsedForLogin} (student PK: ${studentByStudentId.id}).`);
                 // This is critical. If this fails, we might have an orphan user or inconsistent state.
                 // For now, we log and throw, but a rollback mechanism might be needed in a real-world app.
                await logService.addLogEntry({ type: 'error', operation: '更新学生用户ID失败', content: "更新学号 '" + studentIdUsedForLogin + "' 的用户ID关联失败（student PK: '"+ studentByStudentId.id +"' 到 user ID: '" + createdUserId + "').", operator: 'system' });
                throw new Error('更新学生用户ID失败');
            }
            console.log(`[UserService] Successfully updated student ${studentIdUsedForLogin} (student PK: ${studentByStudentId.id}) with new user_id: ${createdUserId}`);
          } catch (dbUpdateError) {
            console.error(`[UserService] Database error updating student ${studentIdUsedForLogin} with user_id:`, dbUpdateError);
            await logService.addLogEntry({ type: 'error', operation: '更新学生用户ID失败', content: "更新学号 '" + studentIdUsedForLogin + "' 的用户ID关联时数据库出错: '" + dbUpdateError.message + "'.", operator: 'system' });
            throw new Error('更新学生表关联用户ID时数据库出错'); // Specific error for server.js to handle
          }
          
          userForToken = {
            id: createdUserId,
            username: studentByStudentId.student_id,
            role: 'student',
            display_name: displayNameForToken // ADD display_name
          };
          studentDataForResponse = { student_pk: studentByStudentId.id, studentIdStr: studentByStudentId.student_id, name: studentByStudentId.name };
          // userEmail is already set from studentByStudentId.email

        } else {
          console.log(`[UserService] Student ${studentIdUsedForLogin} provided incorrect password for first-time login.`);
          await logService.addLogEntry({ type: 'auth', operation: '登录失败', content: "学号 '" + studentIdUsedForLogin + "' 首次登录密码错误.", operator: studentIdUsedForLogin });
          throw new Error('学生首次登录密码错误');
        }
      }
    } else {
      // Not found by username and not a valid student ID format
      console.log(`[UserService] User '${usernameInput}' not found and not a valid student ID format.`);
      await logService.addLogEntry({ type: 'auth', operation: '登录失败', content: "用户 '" + usernameInput + "' 不存在或学号格式不正确.", operator: usernameInput });
      throw new Error('用户不存在或学号格式不正确');
    }
  }

  if (!userForToken) {
    console.error(`[UserService] Login failed for ${usernameInput} due to an unexpected condition where userForToken was not set (post-logic).`);
    await logService.addLogEntry({ type: 'auth', operation: '登录异常', content: `用户 '${usernameInput}' 登录验证失败(内部逻辑错误).`, operator: 'system' });
    throw new Error('登录验证失败');
  }

  const finalUserData = await findUserById(userForToken.id);

  if (!finalUserData) {
    console.error(`[UserService] Login succeeded for user ID ${userForToken.id} but findUserById returned null. Critical data inconsistency.`);
    await logService.addLogEntry({ type: 'error', operation: '登录数据不一致', content: `用户ID ${userForToken.id} 登录后无法检索完整信息。`, operator: 'system' });
    throw new Error('登录成功但无法检索用户信息');
  }

  const tokenPayload = { 
    id: finalUserData.id, 
    username: finalUserData.username, 
    role: finalUserData.role, 
    display_name: finalUserData.display_name 
  };
  
  // Use config.jwt.secret and config.jwt.expiresIn
  const secret = config.jwt?.secret;
  const expiresIn = config.jwt?.expiresIn || '24h'; // Default expiresIn if not in config

  if (!secret) {
      console.error('[UserService] CRITICAL ERROR: JWT secret is missing from config.jwt.secret. Cannot sign token securely.');
      // 在生产环境中，这里应该抛出错误或采取更严厉的措施
      // 为了开发流程继续，暂时使用一个临时的、不安全的密钥，但这绝不应用于生产
      // throw new Error('JWT signing secret is not configured.'); 
      // 使用一个固定的备用密钥以便开发，但日志会警告
      console.warn('[UserService] DEVELOPMENT FALLBACK: Signing JWT with a DANGEROUS hardcoded secret because config.jwt.secret is missing. DO NOT USE IN PRODUCTION.');
      const fallbackSecret = 'DEV_ONLY_FALLBACK_SECRET_CHANGE_THIS_NOW';
      const token = jwt.sign(tokenPayload, fallbackSecret, { expiresIn: expiresIn });
      console.log(`[UserService] Token generated for user: ${finalUserData.username} (USING FALLBACK SECRET)`);
      return {
        token,
        data: {
          id: finalUserData.id,
          username: finalUserData.username,
          role: finalUserData.role,
          avatar: finalUserData.avatar,
          email: finalUserData.email,
          display_name: finalUserData.display_name,
          studentInfo: studentDataForResponse, 
          phone: finalUserData.phone
        }
      };
  }

  const token = jwt.sign(tokenPayload, secret, { expiresIn: expiresIn });
  console.log(`[UserService] Token generated for user: ${finalUserData.username} (using configured secret)`);

  await logService.addLogEntry({
    type: 'auth',
    operation: '登录成功',
    content: `用户 '${finalUserData.username}' (显示名: '${finalUserData.display_name || 'N/A'}', ID: ${finalUserData.id}, Role: ${finalUserData.role}) 登录成功.${studentIdUsedForLogin ? ` (使用学号 '${studentIdUsedForLogin}')` : ''}`,
    operator: finalUserData.username,
    user_id: finalUserData.id
  });

  const { password: _, ...safeFinalUserData } = finalUserData;

  return {
    token,
    data: { 
      id: safeFinalUserData.id,
      username: safeFinalUserData.username,
      role: safeFinalUserData.role,
      avatar: safeFinalUserData.avatar, 
      display_name: safeFinalUserData.display_name,
      studentInfo: safeFinalUserData.studentInfo, 
      email: safeFinalUserData.email,             
      phone: safeFinalUserData.phone              
    },
  };
}

/**
 * 更新用户头像
 * @param {number} userId 用户ID
 * @param {string} avatarFilename 头像文件名 (由 Multer 生成)
 * @returns {Promise<boolean>} 更新是否成功
 */
async function updateUserAvatar(userId, avatarFilename) {
  try {
    console.log(`[UserService] 准备更新用户 ${userId} 的头像为: ${avatarFilename}`);
    if (!userId || !avatarFilename) {
      throw new Error('用户ID或头像文件名不能为空');
    }

    // 在更新前，可以考虑删除旧头像文件（可选）
    // const oldUserInfo = await findUserById(userId); 
    // if (oldUserInfo && oldUserInfo.avatar) { 
    //   const oldAvatarPath = path.join(__dirname, 'uploads', oldUserInfo.avatar);
    //   fs.unlink(oldAvatarPath, (err) => { if (err) console.error(`删除旧头像失败: ${oldAvatarPath}`, err); });
    // }

    const query = 'UPDATE user SET avatar = ?, update_time = CURRENT_TIMESTAMP WHERE id = ?';
    // 不使用数组解构，直接获取结果对象
    const result = await db.query(query, [avatarFilename, userId]);

    // 检查 result 对象和 affectedRows
    if (result && result.affectedRows > 0) { 
      console.log(`[UserService] 用户 ${userId} 头像更新成功`);
      await logService.addLogEntry('database', '更新', `用户 ${userId} 更新头像`, `User:${userId}`);
      return true;
    } else {
      console.warn(`[UserService] 更新用户 ${userId} 头像失败，未找到用户或未更改`);
      return false;
    }
  } catch (error) {
    console.error(`[UserService] 更新用户 ${userId} 头像时出错:`, error);
    // 确保 logService 在这里可用
    if (logService && typeof logService.addLogEntry === 'function') {
         await logService.addLogEntry('database', 'error', `用户 ${userId} 更新头像失败: ${error.message}`, `User:${userId}`);
    } else {
         console.error('[UserService] logService is not available in catch block!');
    }
    throw error; 
  }
}

module.exports = {
  findUserByUsername,
  comparePassword,
  findUserById,
  loginUser,
  hashPassword,
  updateUserPassword,
  updateUserEmail,
  updateUser,
  updateUserAvatar
}; 