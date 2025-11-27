import { verifySession } from './session.js';

export interface AuthenticatedRequest {
  userId: number;
  githubId: string;
  githubUsername: string;
}

export function extractToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export function authenticate(authHeader?: string): AuthenticatedRequest {
  const token = extractToken(authHeader);
  
  if (!token) {
    throw new Error('No authentication token provided');
  }

  return verifySession(token);
}
