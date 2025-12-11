import Note from '../models/Note.js';

class NoteUseCase {
  static async getAllNotes(userId) {
    return await Note.findByUserId(userId);
  }

  static async getNotesByFolder(folderId, userId) {
    return await Note.findByFolderId(folderId, userId);
  }

  static async getNote(id, userId) {
    const note = await Note.findById(id);

    if (!note || note.user_id !== userId) {
      return null;
    }

    return note;
  }

  static async createNote(userId, noteData) {
    return await Note.create({
      id: noteData.id,
      userId: userId,
      folderId: noteData.folderId,
      title: noteData.title,
      type: noteData.type,
      content: noteData.content,
      thumbnail: noteData.thumbnail,
      canvasBackground: noteData.canvasBackground,
      path: noteData.path,
      githubSha: noteData.githubSha,
      syncStatus: noteData.syncStatus || 'pending',
    });
  }

  static async updateNote(id, userId, updates) {
    return await Note.update(id, userId, updates);
  }

  static async deleteNote(id, userId) {
    return await Note.delete(id, userId);
  }

  static async getPendingNotes(userId) {
    return await Note.findPendingSync(userId);
  }
}

export default NoteUseCase;
