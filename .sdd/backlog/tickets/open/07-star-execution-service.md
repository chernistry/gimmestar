# Ticket: 05 Build Star Execution Service

Spec version: v1.0

## User Problem
- Users need a reliable service that can execute star/unstar actions on GitHub repositories through the GitHub API
- The system must handle API rate limits, transient failures, and GitHub ToS compliance requirements

## Outcome / Success Signals
- Star execution service successfully stars repositories via GitHub API
- Proper error handling and retry logic with exponential backoff implemented
- API rate limits respected and monitored
- All star actions logged for audit purposes

## Post-Release Observations
- Monitor GitHub API rate limit consumption
- Track retry success rates
- Log any API ban warnings or throttling events

## Context
- Must comply with GitHub ToS: no direct star-for-star pairing, use randomized matching
- Implement exponential backoff on API calls to avoid bans
- Use authorized scopes: `read:user`, `read:repo`, `write:star`
- Related to architecture plan constraint on GitHub API compliance

## Objective & Definition of Done
Implement a service that executes star actions on GitHub repositories with proper error handling, retry logic with exponential backoff, and rate limit management. The service must be testable, handle transient failures gracefully, and comply with GitHub ToS requirements.

**Definition of Done:**
- Service can star a repository given a GitHub token and repo identifier
- Service can unstar a repository
- Exponential backoff retry logic implemented for transient failures
- Rate limit checking and handling implemented
- Error responses properly categorized (retryable vs non-retryable)
- Unit tests written and passing
- Service logs all actions and errors

## Steps
1. Create `src/services/starExecutor.ts` (or appropriate language/path)
2. Implement `StarExecutionService` class with methods:
   - `starRepository(token: string, owner: string, repo: string): Promise<Result>`
   - `unstarRepository(token: string, owner: string, repo: string): Promise<Result>`
   - `checkRateLimit(token: string): Promise<RateLimitInfo>`
3. Implement exponential backoff utility:
   - Initial delay: 1s
   - Max retries: 3
   - Backoff multiplier: 2
   - Max delay: 10s
4. Add error classification logic:
   - Retryable: 5xx errors, rate limit errors, network timeouts
   - Non-retryable: 4xx errors (except 429), authentication failures
5. Implement rate limit checking before each API call
6. Add comprehensive logging for all operations (success, failure, retry attempts)
7. Write unit tests:
   - Test successful star/unstar operations
   - Test retry logic with mocked failures
   - Test rate limit handling
   - Test error classification
8. Run tests to verify implementation: `npm test` (or equivalent)
9. Commit changes to git with message: "feat: implement star execution service with retry logic and rate limiting"

## Affected files/modules
- `src/services/starExecutor.ts` (new)
- `src/utils/retry.ts` (new - exponential backoff utility)
- `src/types/github.ts` (update - add result types)
- `tests/services/starExecutor.test.ts` (new)

## Tests
- Unit tests for `StarExecutionService`:
  - `should successfully star a repository`
  - `should successfully unstar a repository`
  - `should retry on transient failures with exponential backoff`
  - `should not retry on non-retryable errors`
  - `should respect rate limits`
  - `should handle authentication failures`
  - `should log all operations`
- Run command: `npm test` or `yarn test` or equivalent

## Risks & Edge Cases
- GitHub API rate limit exhaustion (handle with 429 response and Retry-After header)
- Token expiration mid-operation (return clear error, don't retry)
- Repository deleted/renamed between queue and execution (handle 404 gracefully)
- Network timeouts (implement request timeout, retry with backoff)
- Concurrent requests from same token (track rate limit state)
- GitHub API changes or deprecations (version API calls, monitor responses)

## Dependencies
- Upstream tickets: Token encryption/storage, GitHub API client setup
- Downstream tickets: Queue processing service, matching algorithm integration