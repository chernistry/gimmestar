import { vi } from 'vitest';

export function mockGitHubAPI() {
  return {
    getUser: vi.fn().mockResolvedValue({ id: 123, login: 'testuser' }),
    starRepository: vi.fn().mockResolvedValue(undefined),
    unstarRepository: vi.fn().mockResolvedValue(undefined),
    getRepository: vi.fn().mockResolvedValue({ 
      id: 456, 
      full_name: 'owner/repo',
      stargazers_count: 10 
    })
  };
}
