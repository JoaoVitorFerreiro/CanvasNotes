import db from '../database/db.js';

class User {
  static async findByEmail(email) {
    return await db.getAsync('SELECT * FROM users WHERE email = ?', [email]);
  }

  static async findById(id) {
    return await db.getAsync('SELECT * FROM users WHERE id = ?', [id]);
  }

  static async create(userData) {
    const result = await db.runAsync(
      `INSERT INTO users (email, password, name)
       VALUES (?, ?, ?)`,
      [
        userData.email,
        userData.password, // Already hashed
        userData.name
      ]
    );

    return await this.findById(result.lastID);
  }

  static async update(id, userData) {
    const fields = [];
    const values = [];

    if (userData.name) {
      fields.push('name = ?');
      values.push(userData.name);
    }

    if (userData.password) {
      fields.push('password = ?');
      values.push(userData.password);
    }

    if (fields.length === 0) {
      return await this.findById(id);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await db.runAsync(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return await this.findById(id);
  }
}

export default User;
