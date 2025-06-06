const db = require('./db');

/**
 * 获取所有科目列表
 * @returns {Promise<Array>} 科目列表，包含 id 和 subject_name
 */
async function getSubjectList() {
  try {
    const query = 'SELECT id, subject_name FROM subject ORDER BY id;';
    const subjects = await db.query(query);
    return subjects;
  } catch (error) {
    console.error('获取科目列表失败:', error);
    throw error;
  }
}

module.exports = {
  getSubjectList
}; 