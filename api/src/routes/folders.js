import express from 'express';
import FolderUseCase from '../usecases/FolderUseCase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/folders - Get all folders
router.get('/', async (req, res) => {
  try {
    const folders = await FolderUseCase.getAllFolders(req.userId);
    res.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// GET /api/folders/:id - Get specific folder
router.get('/:id', async (req, res) => {
  try {
    const folder = await FolderUseCase.getFolder(req.params.id, req.userId);

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    res.json(folder);
  } catch (error) {
    console.error('Error fetching folder:', error);
    res.status(500).json({ error: 'Failed to fetch folder' });
  }
});

// POST /api/folders - Create folder
router.post('/', async (req, res) => {
  try {
    const { id, name } = req.body;

    if (!id || !name) {
      return res.status(400).json({ error: 'ID and name are required' });
    }

    const folder = await FolderUseCase.createFolder(req.userId, { id, name });
    res.status(201).json(folder);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// PUT /api/folders/:id - Update folder
router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const folder = await FolderUseCase.updateFolder(req.params.id, req.userId, name);

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    res.json(folder);
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({ error: 'Failed to update folder' });
  }
});

// DELETE /api/folders/:id - Delete folder
router.delete('/:id', async (req, res) => {
  try {
    const success = await FolderUseCase.deleteFolder(req.params.id, req.userId);

    if (!success) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

export default router;
