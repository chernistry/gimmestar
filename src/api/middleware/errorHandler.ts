import { Request, Response } from '../types.js';

export function errorHandler(err: Error, req: Request, res: Response): void {
  console.error('API Error:', err);
  
  const status = (err as any).status || 500;
  const message = err.message || 'Internal server error';
  
  res.json({ error: message }, status);
}
