# Ticket: 02 Build GitHub API Client with Rate Limiting

Spec version: v1.0

## User Problem
- The application needs to interact with GitHub's API to read user/repo data and manage stars while respecting rate limits and avoiding API bans.
- Direct API calls without proper rate limiting and backoff can lead to account suspension or service disruption.

## Outcome / Success Signals
- GitHub API client successfully authenticates with authorized scopes (`read:user`, `read:repo`, `write:star`).
- Rate limiting is enforced with exponential backoff on 429/403 responses.
- API calls respect GitHub's rate limit headers and pause when limits are approached.
- Client handles network errors gracefully with retry logic.

## Post-Release Observations
- Monitor rate limit consumption patterns.
- Track backoff trigger frequency.
- Log API error rates and response times.

## Context
- Implements GitHub ToS compliance requirement: exponential backoff on API calls to avoid bans.
- Foundation for all GitHub integration features (starring, following, user data retrieval).
- Must encrypt tokens per GDPR/PII requirements (handled in separate ticket).

## Objective & Definition of Done
Create a reusable GitHub API client module that wraps the GitHub REST API with built-in rate limiting, exponential backoff, and proper error handling. The client must support the authorized OAuth scopes and prevent API abuse.

**Definition of Done:**
- API client class/module created with methods for: `getUser()`, `getRepo()`, `starRepo()`, `unstarRepo()`.
- Rate limiting implemented using GitHub's `X-RateLimit-*` headers.
- Exponential backoff (starting at 1s, max 60s) on 429/403/5xx responses.
- Configuration accepts GitHub token and base URL.
- Unit tests cover rate limiting, backoff, and error scenarios.
- All tests pass.
- Changes committed to git.

## Steps
1. Create `src/lib/github-client.ts` (or appropriate language/path).
2. Implement `GitHubClient` class with constructor accepting `{ token: string, baseURL?: string }`.
3. Add private method `_request(endpoint, options)` that:
   - Sets `Authorization: Bearer ${token}` header.
   - Checks rate limit headers before making requests.
   - Implements exponential backoff on rate limit errors (429, 403 with rate limit message).
   - Retries on 5xx errors with backoff.
4. Implement public methods:
   - `getUser(username?: string)`: GET `/user` or `/users/{username}`.
   - `getRepo(owner, repo)`: GET `/repos/{owner}/{repo}`.
   - `starRepo(owner, repo)`: PUT `/user/starred/{owner}/{repo}`.
   - `unstarRepo(owner, repo)`: DELETE `/user/starred/{owner}/{repo}`.
5. Add rate limit tracking:
   - Parse `X-RateLimit-Remaining` and `X-RateLimit-Reset` headers.
   - Sleep until reset time if remaining < 5.
6. Configure test harness if not already present (Vitest/Jest).
7. Create `tests/lib/github-client.test.ts` with tests for:
   - Successful API calls.
   - Rate limit enforcement (mock 429 response).
   - Exponential backoff (verify retry delays).
   - Error handling (network errors, 404, 403).
8. Run tests: `npm test` (or equivalent).
9. Commit changes to git with message: "feat: implement GitHub API client with rate limiting and exponential backoff".

## Affected files/modules
- `src/lib/github-client.ts` (new)
- `tests/lib/github-client.test.ts` (new)
- `package.json` (if adding dependencies like `octokit` or `axios`)

## Tests
- **Test cases:**
  - `should authenticate and fetch user data`
  - `should respect rate limit headers and pause when limit approached`
  - `should apply exponential backoff on 429 response`
  - `should retry on 5xx errors with backoff`
  - `should throw on 404/401 errors`
  - `should star and unstar repositories`
- **Commands:** `npm test` or `pnpm test`

## Risks & Edge Cases
- **Risk:** GitHub changes rate limit headers or API structure.
  - Mitigation: Use official Octokit SDK if possible; version-lock dependencies.
- **Edge case:** Token expires mid-operation.
  - Handle 401 responses gracefully; surface error to caller.
- **Edge case:** Network timeout during backoff.
  - Implement request timeout (30s default); fail after max retries (3-5).
- **Risk:** Backoff logic causes indefinite hangs.
  - Cap max backoff at 60s; limit total retry attempts.

## Dependencies
- **Upstream tickets:** 01-setup-core (project structure, config)
- **Downstream tickets:** OAuth flow implementation, star matching logic, token encryption