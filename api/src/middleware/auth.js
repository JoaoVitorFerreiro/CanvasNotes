import AuthUseCase from '../usecases/AuthUseCase.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.log('❌ Auth middleware: No token provided for', req.method, req.path);
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = AuthUseCase.verifyToken(token);
    req.userId = decoded.userId;
    req.githubId = decoded.githubId;
    console.log(`✅ Auth middleware: User ${req.userId} authenticated for ${req.method} ${req.path}`);
    next();
  } catch (error) {
    console.log('❌ Auth middleware: Invalid token for', req.method, req.path, '-', error.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
