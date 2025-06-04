const db = require('./db');
const path = require('path');
const fs = require('fs');
const logService = require('./logService'); // For logging actions

const UPLOADS_SUBDIR = 'carousel'; // Subdirectory within 'uploads' for carousel images
const UPLOADS_DIR = path.join(__dirname, 'uploads', UPLOADS_SUBDIR);

// Ensure the carousel uploads directory exists
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

/**
 * Get all carousel images, optionally filtered by active status.
 * @param {boolean} [onlyActive=false] - If true, returns only active images.
 * @returns {Promise<Array>} List of carousel images.
 */
async function getCarouselImages(onlyActive = false) {
  let query = 'SELECT id, image_url, title, link_url, display_order, is_active, created_at, updated_at FROM carousel_images';
  const params = [];
  if (onlyActive) {
    query += ' WHERE is_active = ?';
    params.push(1);
  }
  query += ' ORDER BY display_order ASC, id ASC'; // Order by display_order, then by id for consistent ordering

  try {
    const rows = await db.query(query, params);
    // Transform image_url to be a full path if it's not already
    return rows.map(row => ({
      ...row,
      image_url: row.image_url.startsWith('/') ? row.image_url : `/${path.join('uploads', UPLOADS_SUBDIR, path.basename(row.image_url)).replace(/\\/g, '/')}`
    }));
  } catch (error) {
    console.error('[CarouselService] Error fetching carousel images:', error);
    throw new Error('获取轮播图数据失败');
  }
}

/**
 * Get a single carousel image by its ID.
 * @param {number} id - The ID of the carousel image.
 * @returns {Promise<Object|null>} The carousel image object or null if not found.
 */
async function getCarouselImageById(id) {
  const query = 'SELECT id, image_url, title, link_url, display_order, is_active, created_at, updated_at FROM carousel_images WHERE id = ?';
  try {
    const rows = await db.query(query, [id]);
    if (rows && rows.length > 0) {
      const row = rows[0];
      return {
        ...row,
        image_url: row.image_url.startsWith('/') ? row.image_url : `/${path.join('uploads', UPLOADS_SUBDIR, path.basename(row.image_url)).replace(/\\/g, '/')}`
      };
    }
    return null;
  } catch (error) {
    console.error(`[CarouselService] Error fetching carousel image with ID ${id}:`, error);
    throw new Error('获取轮播图详情失败');
  }
}

/**
 * Add a new carousel image.
 * @param {Object} imageData - Data for the new image.
 * @param {string} imageData.image_filename - The filename of the uploaded image.
 * @param {string} [imageData.title] - Optional title.
 * @param {string} [imageData.link_url] - Optional link URL.
 * @param {number} [imageData.display_order=0] - Optional display order.
 * @param {boolean} [imageData.is_active=true] - Optional active status.
 * @param {string} operatorUsername - Username of the operator for logging.
 * @returns {Promise<Object>} The newly added carousel image object.
 */
async function addCarouselImage(imageData, operatorUsername) {
  const {
    image_filename, // This will be just the filename, e.g., 'my-image.jpg'
    title = null,
    link_url = null,
    display_order = 0,
    is_active = 1 // Store as 1 for true, 0 for false
  } = imageData;

  // Construct the image_url path that will be stored in the DB
  // It should be relative to the '/uploads/' static path configured in server.js
  // So, it becomes 'carousel/my-image.jpg' which results in '/uploads/carousel/my-image.jpg' when served
  const imageUrlInDb = path.join(UPLOADS_SUBDIR, image_filename).replace(/\\/g, '/');

  const query = 'INSERT INTO carousel_images (image_url, title, link_url, display_order, is_active) VALUES (?, ?, ?, ?, ?)';
  const params = [imageUrlInDb, title, link_url, display_order, is_active ? 1 : 0];

  try {
    const dbOperationResult = await db.query(query, params);
    const newImageId = dbOperationResult.insertId;
    await logService.addLogEntry({
      type: 'management',
      operation: '添加轮播图',
      content: `添加了新的轮播图: ID=${newImageId}, 文件名='${image_filename}', 标题='${title || ''}'`,
      operator: operatorUsername
    });
    return { id: newImageId, image_url: `/${path.join('uploads', imageUrlInDb).replace(/\\/g, '/')}`, title, link_url, display_order, is_active: Boolean(is_active) };
  } catch (error) {
    console.error('[CarouselService] Error adding carousel image:', error);
    // If it's a duplicate entry or other constraint, it might throw specific DB errors
    throw new Error(`添加轮播图失败: ${error.message}`);
  }
}

/**
 * Update an existing carousel image.
 * @param {number} id - The ID of the image to update.
 * @param {Object} imageData - Data to update. Can include title, link_url, display_order, is_active.
 * @param {string} operatorUsername - Username of the operator for logging.
 * @returns {Promise<Object|null>} The updated carousel image object or null if not found.
 */
async function updateCarouselImage(id, imageData, operatorUsername) {
  const imageToUpdate = await getCarouselImageById(id);
  if (!imageToUpdate) {
    return null; // Or throw new Error('轮播图不存在');
  }

  const fieldsToUpdate = {};
  if (imageData.title !== undefined) fieldsToUpdate.title = imageData.title;
  if (imageData.link_url !== undefined) fieldsToUpdate.link_url = imageData.link_url;
  if (imageData.display_order !== undefined) fieldsToUpdate.display_order = imageData.display_order;
  if (imageData.is_active !== undefined) fieldsToUpdate.is_active = imageData.is_active ? 1 : 0;

  if (Object.keys(fieldsToUpdate).length === 0) {
    return imageToUpdate; // No changes provided
  }

  const setClauses = [];
  const queryParams = [];
  Object.entries(fieldsToUpdate).forEach(([key, value]) => {
    setClauses.push(`${key} = ?`);
    queryParams.push(value);
  });

  // This check should ideally be redundant if the one above works, but as a safeguard:
  if (setClauses.length === 0) {
      console.warn('[CarouselService] Update called with no fields to update, though initial check passed. ID:', id);
      return imageToUpdate; 
  }

  const sqlQuery = `UPDATE carousel_images SET ${setClauses.join(', ')} WHERE id = ?`;
  queryParams.push(id); // Add the id for the WHERE clause

  try {
    await db.query(sqlQuery, queryParams); // Use the dynamically built query
    await logService.addLogEntry({
      type: 'management',
      operation: '更新轮播图',
      content: `更新了轮播图: ID=${id}, 更新内容: ${JSON.stringify(fieldsToUpdate)}`,
      operator: operatorUsername
    });
    return getCarouselImageById(id); // Fetch and return updated
  } catch (error) {
    console.error(`[CarouselService] Error updating carousel image ${id}:`, error);
    throw new Error(`更新轮播图 ID ${id} 失败: ${error.message}`);
  }
}

/**
 * Delete a carousel image.
 * Also deletes the actual image file from the server.
 * @param {number} id - The ID of the image to delete.
 * @param {string} operatorUsername - Username of the operator for logging.
 * @returns {Promise<boolean>} True if deletion was successful, false otherwise.
 */
async function deleteCarouselImage(id, operatorUsername) {
  const imageToDelete = await getCarouselImageById(id);
  if (!imageToDelete) {
    console.warn(`[CarouselService] Attempted to delete non-existent carousel image with ID: ${id}`);
    return false; // Not found
  }

  const query = 'DELETE FROM carousel_images WHERE id = ?';
  try {
    const result = await db.query(query, [id]);

    if (result.affectedRows > 0) {
      // Try to delete the actual file
      // imageToDelete.image_url is like '/uploads/carousel/filename.jpg'
      // We need a path relative to __dirname or an absolute path
      const filename = path.basename(imageToDelete.image_url); // 'filename.jpg'
      const filePath = path.join(UPLOADS_DIR, filename);

      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`[CarouselService] Deleted image file: ${filePath}`);
        } catch (fileError) {
          console.error(`[CarouselService] Error deleting image file ${filePath}: ${fileError.message}`);
          // Log this error, but don't let it fail the DB record deletion status
          await logService.addLogEntry({
            type: 'error',
            operation: '删除轮播图文件失败',
            content: `删除轮播图 ID ${id} 的关联文件 ${filePath} 失败: ${fileError.message}`,
            operator: operatorUsername
          });
        }
      } else {
        console.warn(`[CarouselService] Image file not found for deletion: ${filePath} (for ID: ${id})`);
      }

      await logService.addLogEntry({
        type: 'management',
        operation: '删除轮播图',
        content: `删除了轮播图: ID=${id}, 文件名='${filename}', 标题='${imageToDelete.title || ''}'`,
        operator: operatorUsername
      });
      return true;
    }
    return false; // No rows affected, possibly already deleted
  } catch (error) {
    console.error(`[CarouselService] Error deleting carousel image ${id}:`, error);
    throw new Error(`删除轮播图 ID ${id} 失败: ${error.message}`);
  }
}

/**
 * Updates the display order of multiple carousel images.
 * @param {Array<Object>} orderUpdates - Array of objects like { id: imageId, display_order: newOrder }
 * @param {string} operatorUsername - Username of the operator for logging.
 * @returns {Promise<boolean>} True if all updates were successful.
 */
async function updateCarouselOrder(orderUpdates, operatorUsername) {
  if (!Array.isArray(orderUpdates) || orderUpdates.length === 0) {
    return true; // Nothing to update
  }

  const connection = await db.getConnection(); // Get a connection for transaction
  try {
    await connection.beginTransaction();
    let allSuccessful = true;

    for (const update of orderUpdates) {
      if (typeof update.id !== 'number' || typeof update.display_order !== 'number') {
        console.warn('[CarouselService] Invalid data in orderUpdates:', update);
        continue; // Skip invalid entries
      }
      const [result] = await connection.query(
        'UPDATE carousel_images SET display_order = ? WHERE id = ?',
        [update.display_order, update.id]
      );
      if (result.affectedRows === 0) {
        // This could mean an ID was invalid, or order didn't change.
        // For simplicity, we'll consider it potentially problematic if an ID was expected to update.
        // If an ID is not found, it won't throw an error but affectedRows will be 0.
        console.warn(`[CarouselService] No rows updated for ID ${update.id} during order update. It might not exist or order was same.`);
      }
    }

    await connection.commit();
    await logService.addLogEntry({
      type: 'management',
      operation: '更新轮播图顺序',
      content: `批量更新了 ${orderUpdates.length} 个轮播图的显示顺序。`,
      operator: operatorUsername
    });
    return allSuccessful;
  } catch (error) {
    await connection.rollback();
    console.error('[CarouselService] Error updating carousel order:', error);
    throw new Error(`更新轮播图顺序失败: ${error.message}`);
  } finally {
    connection.release();
  }
}


module.exports = {
  getCarouselImages,
  getCarouselImageById,
  addCarouselImage,
  updateCarouselImage,
  deleteCarouselImage,
  updateCarouselOrder,
  UPLOADS_DIR, // Exporting for Multer setup if needed directly in server.js
  UPLOADS_SUBDIR
}; 