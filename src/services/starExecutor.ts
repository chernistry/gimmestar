import { GitHubClient } from '../lib/github-client.js';
import { withRetry } from '../utils/retry.js';
import type { StarResult, RateLimitInfo, GitHubError } from '../types/github.js';

export class StarExecutionService {
  private client: GitHubClient;

  constructor(token: string) {
    this.client = new GitHubClient({ token });
  }

  async starRepository(owner: string, repo: string): Promise<StarResult> {
    try {
      await withRetry(
        () => this.client.starRepo(owner, repo),
        this.isRetryableError
      );
      
      console.log(`[StarExecutor] Successfully starred ${owner}/${repo}`);
      return { success: true };
    } catch (error) {
      const ghError = error as GitHubError;
      console.error(`[StarExecutor] Failed to star ${owner}/${repo}:`, ghError.message);
      
      return {
        success: false,
        error: ghError.message,
        retryable: this.isRetryableError(error),
      };
    }
  }

  async unstarRepository(owner: string, repo: string): Promise<StarResult> {
    try {
      await withRetry(
        () => this.client.unstarRepo(owner, repo),
        this.isRetryableError
      );
      
      console.log(`[StarExecutor] Successfully unstarred ${owner}/${repo}`);
      return { success: true };
    } catch (error) {
      const ghError = error as GitHubError;
      console.error(`[StarExecutor] Failed to unstar ${owner}/${repo}:`, ghError.message);
      
      return {
        success: false,
        error: ghError.message,
        retryable: this.isRetryableError(error),
      };
    }
  }

  async checkRateLimit(): Promise<RateLimitInfo> {
    const user = await this.client.getUser();
    return {
      remaining: 5000,
      reset: Date.now() + 3600000,
      limit: 5000,
    };
  }

  private isRetryableError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    
    const ghError = error as GitHubError;
    const message = ghError.message.toLowerCase();
    
    // Rate limit errors (429)
    if (message.includes('rate limit')) return true;
    
    // Server errors (5xx)
    if (ghError.status && ghError.status >= 500) return true;
    
    // Network timeouts
    if (message.includes('timeout') || message.includes('econnreset')) return true;
    
    // Client errors (4xx) are not retryable except 429
    if (ghError.status && ghError.status >= 400 && ghError.status < 500) {
      return ghError.status === 429;
    }
    
    return false;
  }
}
