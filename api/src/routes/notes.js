import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import NoteUseCase from '../usecases/NoteUseCase.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/notes/pending - Get notes pending sync
router.get('/pending', async (req, res) => {
  try {
    const notes = await NoteUseCase.getPendingNotes(req.userId);
    res.json(notes);
  } catch (error) {
    console.error('Error fetching pending notes:', error);
    res.status(500).json({ error: 'Failed to fetch pending notes' });
  }
});

// GET /api/notes - Get all notes or notes by folder
router.get('/', async (req, res) => {
  try {
    const { folderId } = req.query;

    const notes = folderId
      ? await NoteUseCase.getNotesByFolder(folderId, req.userId)
      : await NoteUseCase.getAllNotes(req.userId);

    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// GET /api/notes/:id - Get specific note
router.get('/:id', async (req, res) => {
  try {
    const note = await NoteUseCase.getNote(req.params.id, req.userId);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(note);
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// POST /api/notes - Create note
router.post('/', async (req, res) => {
  try {
    const {
      id,
      folderId,
      title,
      type,
      content,
      thumbnail,
      canvasBackground,
      path,
      githubSha,
      syncStatus,
    } = req.body;

    if (!id || !folderId || !title || !type) {
      return res.status(400).json({
        error: 'ID, folderId, title, and type are required',
      });
    }

    if (!['text', 'drawing'].includes(type)) {
      return res.status(400).json({
        error: 'Type must be either "text" or "drawing"',
      });
    }

    const note = await NoteUseCase.createNote(req.userId, {
      id,
      folderId,
      title,
      type,
      content,
      thumbnail,
      canvasBackground,
      path,
      githubSha,
      syncStatus,
    });

    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// PUT /api/notes/:id - Update note
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;

    const note = await NoteUseCase.updateNote(req.params.id, req.userId, updates);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// DELETE /api/notes/:id - Delete note
router.delete('/:id', async (req, res) => {
  try {
    const success = await NoteUseCase.deleteNote(req.params.id, req.userId);

    if (!success) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router;
