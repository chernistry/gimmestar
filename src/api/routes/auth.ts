import { exchangeCodeForToken } from '../../auth/oauth.js';
import { createSession } from '../../auth/session.js';
import { encrypt } from '../../utils/encryption.js';
import { db } from '../../config/database.js';
import { users } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { Request, Response, Handler } from '../types.js';

interface GitHubUser {
  id: number;
  login: string;
}

async function fetchGitHubUser(accessToken: string): Promise<GitHubUser> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch GitHub user');
  }

  return response.json() as Promise<GitHubUser>;
}

export const handleGitHubCallback: Handler = async (req: Request, res: Response) => {
  const { code, codeVerifier } = req.body;

  if (!code || !codeVerifier) {
    res.error('Missing code or codeVerifier', 400);
    return;
  }

  try {
    const accessToken = await exchangeCodeForToken(code, codeVerifier);
    const githubUser = await fetchGitHubUser(accessToken);
    const encryptedToken = encrypt(accessToken);

    const [user] = await db
      .insert(users)
      .values({
        githubId: String(githubUser.id),
        githubUsername: githubUser.login,
        encryptedToken,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.githubId,
        set: {
          githubUsername: githubUser.login,
          encryptedToken,
          updatedAt: new Date(),
        },
      })
      .returning();

    const sessionToken = createSession({
      userId: user.id,
      githubId: user.githubId,
      githubUsername: user.githubUsername,
    });

    res.json({ token: sessionToken, user: { id: user.id, username: user.githubUsername } });
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.error('Authentication failed', 401);
  }
};
