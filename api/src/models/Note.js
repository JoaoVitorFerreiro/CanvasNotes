import db from '../database/db.js';

class Note {
  static async findById(id) {
    return await db.getAsync('SELECT * FROM notes WHERE id = ?', [id]);
  }

  static async findByUserId(userId) {
    return await db.allAsync('SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC', [userId]);
  }

  static async findByFolderId(folderId, userId) {
    return await db.allAsync('SELECT * FROM notes WHERE folder_id = ? AND user_id = ? ORDER BY updated_at DESC', [folderId, userId]);
  }

  static async create(noteData) {
    await db.runAsync(
      `INSERT INTO notes (
        id, user_id, folder_id, title, type, content,
        thumbnail, canvas_background, path, github_sha, sync_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        noteData.id,
        noteData.userId,
        noteData.folderId,
        noteData.title,
        noteData.type,
        noteData.content || null,
        noteData.thumbnail || null,
        noteData.canvasBackground || 'grid',
        noteData.path || null,
        noteData.githubSha || null,
        noteData.syncStatus || 'pending'
      ]
    );

    return await this.findById(noteData.id);
  }

  static async update(id, userId, updates) {
    const allowedFields = [
      'title', 'content', 'thumbnail', 'canvas_background',
      'path', 'github_sha', 'sync_status'
    ];

    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowedFields.includes(snakeKey)) {
        fields.push(`${snakeKey} = ?`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) {
      return await this.findById(id);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id, userId);

    const result = await db.runAsync(
      `UPDATE notes
       SET ${fields.join(', ')}
       WHERE id = ? AND user_id = ?`,
      values
    );

    if (result.changes === 0) {
      return null;
    }

    return await this.findById(id);
  }

  static async delete(id, userId) {
    const result = await db.runAsync('DELETE FROM notes WHERE id = ? AND user_id = ?', [id, userId]);
    return result.changes > 0;
  }

  static async findPendingSync(userId) {
    return await db.allAsync('SELECT * FROM notes WHERE user_id = ? AND sync_status = ?', [userId, 'pending']);
  }
}

export default Note;
