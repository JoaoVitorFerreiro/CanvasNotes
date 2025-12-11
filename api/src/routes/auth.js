import express from 'express';
import AuthUseCase from '../usecases/AuthUseCase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const result = await AuthUseCase.register(email, password, name);

    res.status(201).json(result);
  } catch (error) {
    console.error('Register error:', error);
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await AuthUseCase.login(email, password);

    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message || 'Login failed' });
  }
});

// GET /api/auth/validate - Validate JWT token
router.get('/validate', authenticateToken, (req, res) => {
  res.json({ valid: true, userId: req.userId });
});

export default router;
