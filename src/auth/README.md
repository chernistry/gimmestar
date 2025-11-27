# Authentication Module

This module implements GitHub OAuth 2.0 authentication with PKCE, secure token storage, and JWT-based session management.

## Files

### `oauth.ts`
GitHub OAuth flow implementation with PKCE support.

**Functions:**
- `initiateOAuth()` - Generates OAuth URL with state and code challenge
- `exchangeCodeForToken(code, codeVerifier)` - Exchanges authorization code for access token

**Features:**
- PKCE (SHA-256 code challenge)
- CSRF protection via state parameter
- Minimal scopes: `read:user`, `read:repo`, `write:star`

### `session.ts`
JWT-based session management.

**Functions:**
- `createSession(payload)` - Creates signed JWT token (7-day expiry)
- `verifySession(token)` - Verifies and decodes JWT token

**Security:**
- RS256 signing algorithm
- httpOnly cookie storage recommended
- Automatic expiration handling

### `middleware.ts`
Authentication middleware for route protection.

**Functions:**
- `extractToken(authHeader)` - Extracts Bearer token from Authorization header
- `authenticate(authHeader)` - Validates token and returns user info

**Usage:**
```typescript
const user = authenticate(req.headers.authorization);
// user: { userId, githubId, githubUsername }
```

### `user-service.ts`
User management for OAuth flow.

**Functions:**
- `findOrCreateUser(githubUser, accessToken, db?)` - Creates or updates user with encrypted token

**Features:**
- Automatic user creation on first login
- Token update on subsequent logins
- Encrypted token storage (AES-256-GCM)

## Quick Start

1. **Set environment variables:**
```bash
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
SESSION_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
```

2. **Initiate OAuth:**
```typescript
import { initiateOAuth } from './auth/oauth.js';

const { url, state } = initiateOAuth();
// Store state.codeVerifier and state.state in cookies
// Redirect user to url
```

3. **Handle callback:**
```typescript
import { exchangeCodeForToken } from './auth/oauth.js';
import { findOrCreateUser } from './auth/user-service.js';
import { createSession } from './auth/session.js';

const token = await exchangeCodeForToken(code, codeVerifier);
const githubUser = await githubClient.getUser();
const user = await findOrCreateUser(githubUser, token);
const session = createSession(user);
```

4. **Protect routes:**
```typescript
import { authenticate } from './auth/middleware.js';

const user = authenticate(req.headers.authorization);
```

## Testing

```bash
npm test tests/auth/
```

All tests include:
- OAuth URL generation
- Token exchange
- Session creation/verification
- Middleware authentication
- Error handling

## Security Considerations

1. **PKCE** - Prevents authorization code interception
2. **State parameter** - Prevents CSRF attacks
3. **Encrypted tokens** - GitHub tokens encrypted at rest
4. **httpOnly cookies** - Prevents XSS attacks
5. **Secure flag** - HTTPS-only in production
6. **SameSite** - Additional CSRF protection

## Dependencies

- `jsonwebtoken` - JWT creation and verification
- `crypto` (built-in) - PKCE code challenge generation
- `drizzle-orm` - Database operations
- `../utils/encryption` - Token encryption

## Error Handling

All functions throw descriptive errors:
- `"GitHub OAuth configuration missing"` - Missing env vars
- `"OAuth token exchange failed"` - Invalid code or credentials
- `"Invalid or expired session token"` - JWT verification failed
- `"No authentication token provided"` - Missing Authorization header

## Compliance

- **GitHub ToS**: Only authorized scopes, no automation abuse
- **GDPR**: Encrypted PII, user data protection
