import { createDatabaseConnection, type Database } from '../config/database.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { encrypt } from '../utils/encryption.js';

interface GitHubUser {
  id: number;
  login: string;
}

export async function findOrCreateUser(
  githubUser: GitHubUser,
  accessToken: string,
  db?: Database
): Promise<{ id: number; githubId: string; githubUsername: string }> {
  const connection = db || createDatabaseConnection();
  const githubId = githubUser.id.toString();
  const encryptedToken = encrypt(accessToken);

  const existing = await connection
    .select()
    .from(users)
    .where(eq(users.githubId, githubId))
    .limit(1);

  if (existing.length > 0) {
    await connection
      .update(users)
      .set({ 
        encryptedToken,
        githubUsername: githubUser.login,
        updatedAt: new Date()
      })
      .where(eq(users.githubId, githubId));

    return {
      id: existing[0].id,
      githubId: existing[0].githubId,
      githubUsername: githubUser.login,
    };
  }

  const [newUser] = await connection
    .insert(users)
    .values({
      githubId,
      githubUsername: githubUser.login,
      encryptedToken,
    })
    .returning();

  return {
    id: newUser.id,
    githubId: newUser.githubId,
    githubUsername: newUser.githubUsername,
  };
}
