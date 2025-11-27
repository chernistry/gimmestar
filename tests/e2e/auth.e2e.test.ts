import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetDatabase, seedTestUser } from './helpers/db';
import { mockGitHubAPI } from './helpers/github-mock';
import { exchangeCodeForToken } from '../../src/auth/oauth';

describe('E2E: Authentication Flow', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('should complete OAuth flow and create user', async () => {
    const mockGitHub = mockGitHubAPI();
    vi.mock('../../src/lib/github-client', () => ({ GitHubClient: vi.fn(() => mockGitHub) }));

    const result = await exchangeCodeForToken('test_code', 'test_state');
    
    expect(result).toHaveProperty('accessToken');
    expect(mockGitHub.getUser).toHaveBeenCalled();
  });

  it('should retrieve existing user session', async () => {
    const user = await seedTestUser(123, 'testuser');
    
    expect(user.githubId).toBe(123);
    expect(user.username).toBe('testuser');
  });
});
