# Ticket: 001 Build Star Request Interface

Spec version: v1.0 / Initial MVP

## User Problem
- Users need a way to submit their GitHub repositories to participate in the star exchange system
- No interface exists for users to request stars for their repositories

## Outcome / Success Signals
- Users can view a form to submit repository URLs
- Form validates GitHub repository URLs
- Submitted requests are stored for matching
- Users receive confirmation after submission

## Post-Release Observations
- Monitor submission success rate
- Track validation error frequency
- Measure time from submission to first match

## Context
- This implements the core user-facing feature for repository submission
- Must comply with GitHub ToS: no direct star-for-star pairing
- Requires GitHub OAuth for user authentication (read:user, read:repo scopes)
- Links to randomized matching system (future ticket)

## Objective & Definition of Done
Create a user interface that allows authenticated GitHub users to submit their repositories for star exchange participation. The interface must validate repository URLs, prevent duplicate submissions, and store requests securely.

**Definition of Done:**
- UI form accepts GitHub repository URLs
- Client-side validation for URL format (github.com/owner/repo)
- Server-side validation confirms repository exists and user has access
- Submissions stored in database with user ID, repo URL, timestamp
- Success/error feedback displayed to user
- Tests written and passing
- Changes committed to git

## Steps
1. Create database schema for star_requests table (id, user_id, repo_url, created_at, status)
2. Build API endpoint POST /api/star-requests with validation logic
3. Implement repository existence check via GitHub API
4. Create React component StarRequestForm with input field and submit button
5. Add client-side URL validation (regex for github.com/owner/repo pattern)
6. Connect form to API endpoint with error handling
7. Display success message and clear form on successful submission
8. Add rate limiting to prevent spam (max 5 submissions per hour per user)
9. Write unit tests for validation logic
10. Write integration tests for API endpoint
11. Run test suite and verify all tests pass
12. Commit changes to git with message: "feat: add star request submission interface"

## Affected files/modules
- `src/db/schema/star_requests.sql`
- `src/api/routes/star-requests.ts`
- `src/api/validators/github-repo.ts`
- `src/components/StarRequestForm.tsx`
- `src/utils/validation.ts`
- `tests/api/star-requests.test.ts`
- `tests/components/StarRequestForm.test.tsx`

## Tests
- Unit tests:
  - Validate correct GitHub URL formats (github.com/owner/repo)
  - Reject invalid URLs (missing owner, invalid domain, etc.)
  - Test rate limiting logic
- Integration tests:
  - POST /api/star-requests with valid repo returns 201
  - POST with invalid repo returns 400 with error message
  - POST without authentication returns 401
  - Duplicate submission returns 409
- Run: `npm test` or `vitest run`

## Risks & Edge Cases
- Private repositories: verify user has read access before accepting
- Deleted repositories: handle 404 from GitHub API gracefully
- Rate limiting: GitHub API has limits (5000/hour authenticated); implement exponential backoff
- Malformed URLs: sanitize input to prevent injection attacks
- Concurrent submissions: use database constraints to prevent race conditions
- User submits repository they don't own: validate ownership via GitHub API

## Dependencies
- Upstream tickets: GitHub OAuth authentication setup (must exist first)
- Downstream tickets: Star matching algorithm, notification system