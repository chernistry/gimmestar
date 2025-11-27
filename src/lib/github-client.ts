export interface GitHubClientConfig {
  token: string;
  baseURL?: string;
}

interface RateLimitInfo {
  remaining: number;
  reset: number;
}

export class GitHubClient {
  private token: string;
  private baseURL: string;
  private rateLimit: RateLimitInfo = { remaining: 5000, reset: 0 };

  constructor(config: GitHubClientConfig) {
    this.token = config.token;
    this.baseURL = config.baseURL || 'https://api.github.com';
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Check rate limit before request
    if (this.rateLimit.remaining < 5 && this.rateLimit.reset > Date.now()) {
      const waitTime = this.rateLimit.reset - Date.now();
      await this.sleep(waitTime);
    }

    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers,
    };

    let attempt = 0;
    const maxRetries = 5;
    let backoffMs = 1000;

    while (attempt < maxRetries) {
      try {
        const response = await fetch(url, { ...options, headers });

        // Update rate limit info
        const remaining = response.headers.get('X-RateLimit-Remaining');
        const reset = response.headers.get('X-RateLimit-Reset');
        if (remaining && reset) {
          this.rateLimit = {
            remaining: parseInt(remaining, 10),
            reset: parseInt(reset, 10) * 1000,
          };
        }

        // Handle rate limit errors
        if (response.status === 429 || 
            (response.status === 403 && response.headers.get('X-RateLimit-Remaining') === '0')) {
          attempt++;
          if (attempt >= maxRetries) {
            throw new Error(`Rate limit exceeded after ${maxRetries} retries`);
          }
          await this.sleep(Math.min(backoffMs, 60000));
          backoffMs *= 2;
          continue;
        }

        // Handle server errors with retry
        if (response.status >= 500) {
          attempt++;
          if (attempt >= maxRetries) {
            throw new Error(`Server error after ${maxRetries} retries: ${response.status}`);
          }
          await this.sleep(Math.min(backoffMs, 60000));
          backoffMs *= 2;
          continue;
        }

        // Handle client errors (no retry)
        if (!response.ok) {
          const error = await response.text();
          throw new Error(`GitHub API error (${response.status}): ${error}`);
        }

        // Handle 204 No Content
        if (response.status === 204) {
          return undefined as unknown as T;
        }

        return (await response.json()) as T;
      } catch (error) {
        if (error instanceof Error && error.message.includes('GitHub API error')) {
          throw error;
        }
        // Network errors - retry
        attempt++;
        if (attempt >= maxRetries) {
          throw error;
        }
        await this.sleep(Math.min(backoffMs, 60000));
        backoffMs *= 2;
      }
    }

    throw new Error('Max retries exceeded');
  }

  async getUser(username?: string): Promise<any> {
    const endpoint = username ? `/users/${username}` : '/user';
    return this.request(endpoint);
  }

  async getRepo(owner: string, repo: string): Promise<any> {
    return this.request(`/repos/${owner}/${repo}`);
  }

  async starRepo(owner: string, repo: string): Promise<void> {
    await this.request(`/user/starred/${owner}/${repo}`, {
      method: 'PUT',
      headers: { 'Content-Length': '0' },
    });
  }

  async unstarRepo(owner: string, repo: string): Promise<void> {
    await this.request(`/user/starred/${owner}/${repo}`, {
      method: 'DELETE',
    });
  }
}
