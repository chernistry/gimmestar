import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetDatabase, seedTestUser } from './helpers/db';
import { mockGitHubAPI } from './helpers/github-mock';
import { db } from '../../src/config/database';
import { starRequests, matches } from '../../src/db/schema';
import { StarExecutor } from '../../src/services/starExecutor';

describe('E2E: Star Execution', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('should execute star action via GitHub API', async () => {
    const user = await seedTestUser(123, 'testuser');
    const mockGitHub = mockGitHubAPI();

    const [request] = await db.insert(starRequests).values({
      userId: user.id,
      repoUrl: 'https://github.com/owner/repo',
      status: 'pending'
    }).returning();

    const [match] = await db.insert(matches).values({
      requestId: request.id,
      targetUserId: user.id,
      status: 'pending'
    }).returning();

    const executor = new StarExecutor(mockGitHub as any);
    await executor.executeStar(match.id, 'owner/repo');

    expect(mockGitHub.starRepository).toHaveBeenCalledWith('owner/repo');
  });

  it('should handle API failures gracefully', async () => {
    const user = await seedTestUser(123, 'testuser');
    const mockGitHub = mockGitHubAPI();
    mockGitHub.starRepository.mockRejectedValue(new Error('API Error'));

    const [request] = await db.insert(starRequests).values({
      userId: user.id,
      repoUrl: 'https://github.com/owner/repo',
      status: 'pending'
    }).returning();

    const [match] = await db.insert(matches).values({
      requestId: request.id,
      targetUserId: user.id,
      status: 'pending'
    }).returning();

    const executor = new StarExecutor(mockGitHub as any);
    
    await expect(executor.executeStar(match.id, 'owner/repo')).rejects.toThrow('API Error');
  });
});
