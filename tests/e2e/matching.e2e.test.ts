import { describe, it, expect, beforeEach } from 'vitest';
import { resetDatabase, seedTestUser } from './helpers/db';
import { db } from '../../src/config/database';
import { starRequests, matches } from '../../src/db/schema';
import { RandomMatcher } from '../../src/matching/RandomMatcher';

describe('E2E: Matching Flow', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('should match users and create star tasks', async () => {
    const user1 = await seedTestUser(1, 'user1');
    const user2 = await seedTestUser(2, 'user2');

    await db.insert(starRequests).values([
      { userId: user1.id, repoUrl: 'https://github.com/user1/repo1', status: 'pending' },
      { userId: user2.id, repoUrl: 'https://github.com/user2/repo2', status: 'pending' }
    ]);

    const matcher = new RandomMatcher();
    const matchResults = await matcher.match();

    expect(matchResults.length).toBeGreaterThan(0);
    
    const createdMatches = await db.select().from(matches);
    expect(createdMatches.length).toBeGreaterThan(0);
  });

  it('should not match when no pending requests', async () => {
    const matcher = new RandomMatcher();
    const matchResults = await matcher.match();

    expect(matchResults.length).toBe(0);
  });
});
