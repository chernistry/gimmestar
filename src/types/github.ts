export interface RateLimitInfo {
  remaining: number;
  reset: number;
  limit: number;
}

export interface StarResult {
  success: boolean;
  error?: string;
  retryable?: boolean;
}

export interface GitHubError extends Error {
  status?: number;
  retryable?: boolean;
}
