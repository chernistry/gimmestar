import { verifySession } from '../../auth/session.js';
import { Request, Response, Middleware } from '../types.js';

export const authenticate: Middleware = (req: Request, res: Response, next: () => void) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.error('Unauthorized', 401);
    return;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const payload = verifySession(token);
    req.user = payload;
    next();
  } catch (error) {
    res.error('Invalid or expired token', 401);
  }
};
