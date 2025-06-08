const db = require('./db');
const logService = require('./logService');

/**
 * 获取科目列表
 */
async function getSubjectList() {
    console.log('[Subject Service] Getting subject list');
    const sql = 'SELECT * FROM subject ORDER BY id ASC';
    try {
        const results = await db.query(sql);
        return {
            list: results,
            total: results.length
        };
    } catch (error) {
        console.error('[Subject Service] Error fetching subject list:', error);
        throw new Error('获取科目列表失败');
    }
}

/**
 * 添加新科目
 * @param {object} subjectData - { name, subject_code }
 * @param {string} operator - 操作人
 */
async function addSubject(subjectData, operator) {
    const { name, subject_code } = subjectData;
    console.log(`[Subject Service] Adding new subject: ${name} with code ${subject_code} by ${operator}`);

    if (!name) {
        throw new Error('科目名称不能为空');
    }

    const existingSubject = await db.query('SELECT id FROM subject WHERE subject_name = ?', [name]);
    if (existingSubject.length > 0) {
        throw new Error(`科目 "${name}" 已存在`);
    }

    if (subject_code) {
        const existingCode = await db.query('SELECT id FROM subject WHERE subject_code = ?', [subject_code]);
        if (existingCode.length > 0) {
            throw new Error(`科目代码 "${subject_code}" 已存在`);
        }
    }

    const insertSql = 'INSERT INTO subject (subject_name, subject_code) VALUES (?, ?)';
    try {
        const result = await db.query(insertSql, [name, subject_code || null]);
        const newSubjectId = result.insertId;
        logService.addLogEntry({
            type: 'insert',
            operation: '添加科目',
            content: `添加了新科目: ${name}`,
            operator,
        });
        return { id: newSubjectId, subject_name: name, subject_code: subject_code || null };
    } catch (error) {
        console.error('[Subject Service] Error adding subject:', error);
        throw new Error('添加科目失败');
    }
}

/**
 * 更新科目信息
 * @param {number} id - 科目ID
 * @param {object} subjectData - { name, subject_code }
 * @param {string} operator - 操作人
 * @returns {Promise<object|null>} 更新后的科目对象或null
 */
async function updateSubject(id, subjectData, operator) {
    const { name, subject_code } = subjectData;
    console.log(`[Subject Service] Updating subject ${id} by ${operator} with data:`, subjectData);

    if (!name) {
        throw new Error('科目名称不能为空');
    }
    
    // 1. 检查更新后的名称是否与其他科目冲突
    const existingSubject = await db.query(
        'SELECT id FROM subject WHERE subject_name = ? AND id != ?',
        [name, id]
    );
    if (existingSubject.length > 0) {
        throw new Error(`更新失败：科目名称 "${name}" 已被其他科目使用`);
    }

    // 2. 检查更新后的代码是否与其他科目冲突
    if (subject_code) {
        const existingCode = await db.query(
            'SELECT id FROM subject WHERE subject_code = ? AND id != ?',
            [subject_code, id]
        );
        if (existingCode.length > 0) {
            throw new Error(`更新失败：科目代码 "${subject_code}" 已被其他科目使用`);
        }
    }

    const updateSql = 'UPDATE subject SET subject_name = ?, subject_code = ? WHERE id = ?';
    try {
        const result = await db.query(updateSql, [name, subject_code || null, id]);
        if (result.affectedRows === 0) {
            return null; // Not found
        }
        logService.addLogEntry({
            type: 'update',
            operation: '更新科目',
            content: `更新了科目 #${id} 的信息`,
            operator,
        });
        return { id, subject_name: name, subject_code: subject_code || null };
    } catch (error) {
        console.error(`[Subject Service] Error updating subject ${id}:`, error);
        throw new Error('更新科目失败');
    }
}

/**
 * 删除科目
 * @param {number} id - 科目ID
 * @param {string} operator - 操作人
 */
async function deleteSubject(id, operator) {
    console.log(`[Subject Service] Deleting subject ${id} by ${operator}`);

    // Check if the subject is referenced in exam_subject
    const checkExamSql = 'SELECT COUNT(*) as count FROM exam_subject WHERE subject_id = ?';
    const examResult = await db.query(checkExamSql, [id]);
    if (examResult[0].count > 0) {
        throw new Error('删除失败：该科目已被考试关联，请先在考试中解绑该科目');
    }
    
    const deleteSql = 'DELETE FROM subject WHERE id = ?';
    try {
        const result = await db.query(deleteSql, [id]);
        if (result.affectedRows === 0) {
            return false; // Not found
        }
        logService.addLogEntry({
            type: 'delete',
            operation: '删除科目',
            content: `删除了科目 #${id}`,
            operator,
        });
        return true;
    } catch (error) {
        console.error(`[Subject Service] Error deleting subject ${id}:`, error);
        throw new Error('删除科目失败');
    }
}

module.exports = {
    getSubjectList,
    addSubject,
    updateSubject,
    deleteSubject,
};
