import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetDatabase, seedTestUser } from './helpers/db';
import { mockGitHubAPI } from './helpers/github-mock';
import { db } from '../../src/config/database';
import { starRequests, matches } from '../../src/db/schema';
import { RandomMatcher } from '../../src/matching/RandomMatcher';
import { StarExecutor } from '../../src/services/starExecutor';

describe('E2E: Complete User Journey', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('should complete full flow: auth -> submit -> match -> execute', async () => {
    // 1. Create users (simulating OAuth)
    const user1 = await seedTestUser(1, 'alice');
    const user2 = await seedTestUser(2, 'bob');

    // 2. Submit star requests
    await db.insert(starRequests).values([
      { userId: user1.id, repoUrl: 'https://github.com/alice/project', status: 'pending' },
      { userId: user2.id, repoUrl: 'https://github.com/bob/project', status: 'pending' }
    ]);

    // 3. Run matching algorithm
    const matcher = new RandomMatcher();
    const matchResults = await matcher.match();
    expect(matchResults.length).toBeGreaterThan(0);

    // 4. Execute stars
    const mockGitHub = mockGitHubAPI();
    const executor = new StarExecutor(mockGitHub as any);
    
    const createdMatches = await db.select().from(matches);
    for (const match of createdMatches) {
      const request = await db.query.starRequests.findFirst({
        where: (sr, { eq }) => eq(sr.id, match.requestId)
      });
      if (request) {
        const repoName = request.repoUrl.replace('https://github.com/', '');
        await executor.executeStar(match.id, repoName);
      }
    }

    expect(mockGitHub.starRepository).toHaveBeenCalled();
  });
});
