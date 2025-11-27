import { db } from '../../../src/config/database';
import { users, starRequests, matches } from '../../../src/db/schema';
import { sql } from 'drizzle-orm';

export async function resetDatabase() {
  await db.delete(matches);
  await db.delete(starRequests);
  await db.delete(users);
}

export async function seedTestUser(githubId: number, username: string) {
  const [user] = await db.insert(users).values({
    githubId,
    username,
    encryptedToken: 'test_encrypted_token',
    trustScore: 100
  }).returning();
  return user;
}
