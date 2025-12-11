import db from '../database/db.js';

class Folder {
  static async findById(id) {
    return await db.getAsync('SELECT * FROM folders WHERE id = ?', [id]);
  }

  static async findByUserId(userId) {
    return await db.allAsync('SELECT * FROM folders WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  }

  static async create(folderData) {
    await db.runAsync(
      'INSERT INTO folders (id, user_id, name) VALUES (?, ?, ?)',
      [folderData.id, folderData.userId, folderData.name]
    );
    return await this.findById(folderData.id);
  }

  static async update(id, userId, name) {
    const result = await db.runAsync(
      `UPDATE folders
       SET name = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [name, id, userId]
    );

    if (result.changes === 0) {
      return null;
    }

    return await this.findById(id);
  }

  static async delete(id, userId) {
    const result = await db.runAsync('DELETE FROM folders WHERE id = ? AND user_id = ?', [id, userId]);
    return result.changes > 0;
  }
}

export default Folder;
