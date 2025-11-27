# Ticket: 01 Implement GitHub OAuth Authentication

Spec version: v1.0 / Initial MVP

## User Problem
- Users need a secure way to authenticate with GitHub to participate in the star exchange platform.
- GitHub tokens must be stored securely to comply with GDPR/PII requirements.

## Outcome / Success Signals
- Users can click "Login with GitHub" and complete OAuth flow.
- GitHub access tokens are encrypted at rest.
- OAuth scopes are limited to `read:user`, `read:repo`, `write:star` only.
- Successful authentication redirects to dashboard/home page.

## Post-Release Observations
- Monitor OAuth failure rates.
- Track token refresh cycles.
- Verify no plaintext tokens in logs or database.

## Context
- Implements authentication layer required for all subsequent features.
- Must comply with GitHub ToS: only authorized scopes, no automation beyond permitted actions.
- GDPR compliance: encrypt tokens using industry-standard encryption (AES-256).

## Objective & Definition of Done
Implement GitHub OAuth 2.0 authentication flow with secure token storage. Users can authenticate via GitHub, tokens are encrypted before storage, and the system can retrieve/decrypt tokens for API calls.

**Definition of Done:**
- OAuth flow redirects to GitHub and back successfully.
- Access tokens are encrypted using AES-256 before database storage.
- Tokens are decrypted only when needed for GitHub API calls.
- Environment variables configured for GitHub OAuth App credentials.
- Test coverage for OAuth callback handler and encryption/decryption functions.
- Changes committed to git.

## Steps
1. Register GitHub OAuth App and obtain Client ID and Client Secret.
2. Create environment configuration file (`.env.example`) with placeholders for `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ENCRYPTION_KEY`, `SESSION_SECRET`.
3. Install dependencies: OAuth library (e.g., `passport-github2` for Node.js or equivalent), encryption library (e.g., `crypto` built-in or `bcrypt`).
4. Implement OAuth initiation endpoint (`/auth/github`) that redirects to GitHub with required scopes: `read:user`, `read:repo`, `write:star`.
5. Implement OAuth callback endpoint (`/auth/github/callback`) that receives authorization code and exchanges it for access token.
6. Create encryption utility functions: `encryptToken(token)` and `decryptToken(encryptedToken)` using AES-256.
7. Store encrypted token in database with user ID mapping.
8. Create session management to maintain authenticated state.
9. Implement logout endpoint that clears session and optionally revokes token.
10. Add middleware to protect routes requiring authentication.
11. Write unit tests for encryption/decryption functions.
12. Write integration tests for OAuth flow (mock GitHub responses).
13. Run test suite: `npm test` (or equivalent).
14. Commit changes to git with message: "feat: implement GitHub OAuth authentication with encrypted token storage".

## Affected files/modules
- `src/auth/oauth.js` (or equivalent)
- `src/auth/encryption.js`
- `src/middleware/auth.js`
- `src/routes/auth.js`
- `src/models/User.js` (or database schema)
- `.env.example`
- `tests/auth/oauth.test.js`
- `tests/auth/encryption.test.js`

## Tests
- **Unit tests:**
  - `encryptToken()` produces different output for same input (IV randomization).
  - `decryptToken(encryptToken(token))` returns original token.
  - Invalid encrypted data throws appropriate error.
- **Integration tests:**
  - Mock GitHub OAuth callback with valid code returns success.
  - Invalid/expired code returns error.
  - Protected routes reject unauthenticated requests.
  - Authenticated requests include decrypted token.
- **Command:** `npm test` or `yarn test`

## Risks & Edge Cases
- **Token expiration:** GitHub tokens don't expire by default, but handle revocation gracefully.
- **Encryption key rotation:** Document process for key rotation without losing existing tokens.
- **Rate limiting:** GitHub OAuth endpoints have rate limits; implement exponential backoff.
- **CSRF attacks:** Use state parameter in OAuth flow to prevent CSRF.
- **Session hijacking:** Use secure, httpOnly cookies with appropriate SameSite settings.
- **Scope creep:** Ensure only minimal required scopes are requested.

## Dependencies
- **Upstream tickets:** None (first ticket).
- **Downstream tickets:** All features requiring GitHub API access depend on this authentication layer.