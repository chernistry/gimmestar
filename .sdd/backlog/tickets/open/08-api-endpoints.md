# Ticket: 01 Create REST API Endpoints

Spec version: v1.0 / initial

## User Problem
- Users need a way to register, submit star requests, check match status, and view their profile through a programmatic interface.
- The application requires a backend API to handle GitHub OAuth, star exchange logic, and user data management.

## Outcome / Success Signals
- API endpoints are accessible and return correct HTTP status codes.
- User registration flow works end-to-end with GitHub OAuth.
- Star request submission creates entries in the database.
- Match status endpoint returns current user's pending/completed matches.
- User profile endpoint returns authenticated user data.
- All endpoints enforce authentication where required.
- API responses follow consistent JSON structure.

## Post-Release Observations
- Monitor API response times (target <200ms for most endpoints).
- Track error rates and failed authentication attempts.
- Observe GitHub API rate limit consumption.

## Context
- This implements the core backend API layer for the gimmestar application.
- Must comply with GitHub ToS: no direct star-for-star pairing, use randomized matching.
- GitHub tokens must be encrypted at rest (GDPR/PII compliance).
- Required GitHub OAuth scopes: `read:user`, `read:repo`, `write:star`.

## Objective & Definition of Done
Build the REST API layer that handles user authentication via GitHub OAuth, star request submissions, match status retrieval, and user profile access. The API must enforce authentication, validate inputs, handle errors gracefully, and return consistent JSON responses.

**Definition of Done:**
- POST `/api/auth/github` endpoint handles OAuth callback and creates/updates user session.
- POST `/api/stars/request` endpoint accepts repo URL and creates star request.
- GET `/api/stars/matches` endpoint returns user's match history.
- GET `/api/user/profile` endpoint returns authenticated user data.
- All endpoints validate authentication tokens.
- Input validation implemented for all POST endpoints.
- Error responses follow consistent format with appropriate HTTP status codes.
- GitHub tokens are encrypted before storage.
- Tests written and passing for all endpoints.
- Changes committed to git.

## Steps
1. Create `src/api/routes/` directory structure.
2. Implement authentication middleware in `src/api/middleware/auth.js` to verify JWT/session tokens.
3. Create `src/api/routes/auth.js` with POST `/api/auth/github` endpoint:
   - Accept GitHub OAuth code.
   - Exchange code for access token via GitHub API.
   - Encrypt token before storing.
   - Create user record if new, update if existing.
   - Return session token/JWT.
4. Create `src/api/routes/stars.js` with:
   - POST `/api/stars/request`: validate repo URL, create star request record, return request ID.
   - GET `/api/stars/matches`: fetch user's match history from database, return array of matches with status.
5. Create `src/api/routes/user.js` with GET `/api/user/profile`:
   - Fetch authenticated user data from database.
   - Return user profile (username, avatar, stats).
6. Implement input validation middleware in `src/api/middleware/validate.js`.
7. Create `src/api/utils/encryption.js` with functions to encrypt/decrypt GitHub tokens using AES-256.
8. Set up error handling middleware in `src/api/middleware/errorHandler.js` to catch and format errors consistently.
9. Create `src/api/index.js` to register all routes and middleware.
10. Write tests in `tests/api/` covering:
    - Successful authentication flow.
    - Star request creation with valid/invalid inputs.
    - Match status retrieval.
    - Profile retrieval.
    - Authentication failures.
    - Input validation errors.
11. Run tests with `npm test` and verify all pass.
12. Commit changes to git with message: "feat: implement REST API endpoints for auth, stars, and user profile".

## Affected files/modules
- `src/api/routes/auth.js` (new)
- `src/api/routes/stars.js` (new)
- `src/api/routes/user.js` (new)
- `src/api/middleware/auth.js` (new)
- `src/api/middleware/validate.js` (new)
- `src/api/middleware/errorHandler.js` (new)
- `src/api/utils/encryption.js` (new)
- `src/api/index.js` (new)
- `tests/api/auth.test.js` (new)
- `tests/api/stars.test.js` (new)
- `tests/api/user.test.js` (new)

## Tests
- **Authentication tests** (`tests/api/auth.test.js`):
  - Valid GitHub OAuth code returns session token.
  - Invalid OAuth code returns 401.
  - Token encryption/decryption works correctly.
- **Star request tests** (`tests/api/stars.test.js`):
  - Valid repo URL creates star request.
  - Invalid repo URL returns 400.
  - Unauthenticated request returns 401.
  - Match status returns correct data structure.
- **User profile tests** (`tests/api/user.test.js`):
  - Authenticated request returns user profile.
  - Unauthenticated request returns 401.
- Run with: `npm test`

## Risks & Edge Cases
- **GitHub API rate limits**: Implement exponential backoff and cache user data where possible.
- **Token expiration**: Handle expired GitHub tokens gracefully, prompt re-authentication.
- **Invalid repo URLs**: Validate format and check repo existence before creating request.
- **Concurrent requests**: Ensure database operations are atomic to prevent race conditions.
- **Encryption key management**: Store encryption key in environment variable, never commit to repo.
- **CORS**: Configure CORS headers appropriately for frontend origin.

## Dependencies
- **Upstream tickets**: 
  - Ticket 00: Setup project structure, database schema, and test harness.
- **Downstream tickets**:
  - Ticket 02: Implement matching algorithm.
  - Ticket 03: Build frontend UI components.