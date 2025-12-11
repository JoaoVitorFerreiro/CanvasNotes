import Folder from '../models/Folder.js';

class FolderUseCase {
  static async getAllFolders(userId) {
    return await Folder.findByUserId(userId);
  }

  static async getFolder(id, userId) {
    const folder = await Folder.findById(id);

    if (!folder || folder.user_id !== userId) {
      return null;
    }

    return folder;
  }

  static async createFolder(userId, folderData) {
    return await Folder.create({
      id: folderData.id,
      userId: userId,
      name: folderData.name,
    });
  }

  static async updateFolder(id, userId, name) {
    return await Folder.update(id, userId, name);
  }

  static async deleteFolder(id, userId) {
    return await Folder.delete(id, userId);
  }
}

export default FolderUseCase;
