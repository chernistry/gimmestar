import jwt from 'jsonwebtoken';

const TOKEN_EXPIRY = '7d';

interface SessionPayload {
  userId: number;
  githubId: string;
  githubUsername: string;
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is not set');
  }

  return secret;
}

export function createSession(payload: SessionPayload): string {
  const secret = getSessionSecret();
  return jwt.sign(payload, secret, { expiresIn: TOKEN_EXPIRY });
}

export function verifySession(token: string): SessionPayload {
  const secret = getSessionSecret();
  
  try {
    return jwt.verify(token, secret) as SessionPayload;
  } catch (error) {
    throw new Error('Invalid or expired session token');
  }
}
