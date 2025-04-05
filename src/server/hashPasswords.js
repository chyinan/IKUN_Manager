// hashPasswords.js
// One-time script to hash plain text passwords in the user table.

const bcrypt = require('bcrypt');
const db = require('./db'); // Reuse your existing db connection module

const SALT_ROUNDS = 10; // Standard salt rounds for bcrypt

async function hashExistingPasswords() {
  let connection;
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  console.log('[SCRIPT START] Starting password hashing process...');

  try {
    connection = await db.getConnection();
    console.log('[DB CONNECT] Database connection established.');

    // Select users whose password does NOT look like a bcrypt hash
    // Bcrypt hashes start with $2a$, $2b$, or $2y$
    const selectQuery = 'SELECT id, username, password FROM user WHERE password NOT LIKE "$2a$%%" AND password NOT LIKE "$2b$%%" AND password NOT LIKE "$2y$%%"';
    console.log(`[DB QUERY] Executing: ${selectQuery}`);
    const [usersToUpdate] = await connection.query(selectQuery);
    console.log(`[DB RESULT] Found ${usersToUpdate.length} user(s) with potentially plain text passwords.`);

    if (usersToUpdate.length === 0) {
      console.log('[INFO] No users found with plain text passwords to update. Exiting.');
      // Close connection early if nothing to do
       if (connection) await connection.release();
       if (db.pool && typeof db.pool.end === 'function') await db.pool.end();
      return;
    }

    for (const user of usersToUpdate) {
       console.log(`\n[LOOP START] Processing user ID ${user.id} (${user.username}). Current password: ${user.password ? user.password.substring(0, 15) + '...' : '(empty)'}`); // Log entry and part of password
      try {
        if (!user.password || user.password.length === 0) {
             console.warn(`[SKIP] Skipping user ID ${user.id} (${user.username}) due to empty password.`);
             skippedCount++;
             continue;
        }
        // Check again if it somehow already looks like a hash (belt and suspenders)
        if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')){
            console.log(`[SKIP] Skipping user ID ${user.id} (${user.username}) - password already looks hashed.`);
            skippedCount++;
            continue;
        }

        console.log(`[HASHING] Hashing password for user ID ${user.id} (${user.username})...`);
        const plainPassword = user.password; // The current plain text password
        const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);
        console.log(`[HASHED] New hash generated: ${hashedPassword.substring(0,15)}...`);
        
        // Update the user's password in the database
        console.log(`[DB UPDATE] Updating password for user ID ${user.id} in database...`);
        const [updateResult] = await connection.query(
          'UPDATE user SET password = ? WHERE id = ?',
          [hashedPassword, user.id]
        );
         console.log(`[DB UPDATED] Update result for user ID ${user.id}:`, updateResult.info);
        console.log(`[SUCCESS] Successfully updated password for user ID ${user.id} (${user.username}).`);
        updatedCount++;

      } catch (hashOrUpdateError) {
        console.error(`[ERROR LOOP] Error processing user ID ${user.id} (${user.username}):`, hashOrUpdateError);
        errorCount++;
      }
    }

    console.log('\n[SCRIPT END] Password hashing process finished.');
    console.log(`- Successfully updated: ${updatedCount}`);
    console.log(`- Skipped (empty or already hashed): ${skippedCount}`);
    console.log(`- Errors: ${errorCount}`);

  } catch (error) {
    console.error('[SCRIPT ERROR] An error occurred during the password hashing script:', error);
  } finally {
    if (connection) {
      await connection.release();
      console.log('[DB CLOSE] Database connection released.');
    }
    // Ensure the pool itself is closed after the script runs if db.js uses a pool
    if (db.pool && typeof db.pool.end === 'function') { 
        await db.pool.end();
        console.log('[DB POOL CLOSE] Database pool closed.');
    }
  }
}

// Run the function
// Wrap the main call in a try/catch as well
try {
    hashExistingPasswords();
} catch (topLevelError) {
    console.error("[FATAL ERROR] Uncaught error executing hashExistingPasswords:", topLevelError);
} 