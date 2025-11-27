# GitHub OAuth Authentication Flow

This document describes the GitHub OAuth 2.0 authentication implementation with PKCE (Proof Key for Code Exchange) for enhanced security.

## Overview

The authentication flow consists of three main steps:

1. **Initiate OAuth** - Generate authorization URL and redirect user to GitHub
2. **Handle Callback** - Exchange authorization code for access token
3. **Create Session** - Store user data and create JWT session token

## Configuration

Required environment variables (see `.env.example`):

```env
GITHUB_CLIENT_ID=your_github_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
SESSION_SECRET=base64_encoded_32_byte_secret
ENCRYPTION_KEY=base64_encoded_32_byte_key
```

### Registering GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: gimmestar
   - **Homepage URL**: http://localhost:3000
   - **Authorization callback URL**: http://localhost:3000/auth/github/callback
4. Copy Client ID and Client Secret to `.env`

## OAuth Scopes

The application requests minimal required scopes:

- `read:user` - Read user profile information
- `read:repo` - Read repository information
- `write:star` - Star/unstar repositories

## Implementation Example

### Step 1: Initiate OAuth Flow

```typescript
import { initiateOAuth } from './auth/oauth.js';

// In your login route handler
app.get('/auth/github', (req, res) => {
  const { url, state } = initiateOAuth();
  
  // Store state.codeVerifier in session/cookie for callback verification
  // This is required for PKCE
  res.cookie('oauth_verifier', state.codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000, // 10 minutes
  });
  
  res.cookie('oauth_state', state.state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
  });
  
  res.redirect(url);
});
```

### Step 2: Handle OAuth Callback

```typescript
import { exchangeCodeForToken } from './auth/oauth.js';
import { findOrCreateUser } from './auth/user-service.js';
import { createSession } from './auth/session.js';
import { GitHubClient } from './lib/github-client.js';

app.get('/auth/github/callback', async (req, res) => {
  const { code, state } = req.query;
  const storedState = req.cookies.oauth_state;
  const codeVerifier = req.cookies.oauth_verifier;
  
  // Verify state to prevent CSRF attacks
  if (!state || state !== storedState) {
    return res.status(400).json({ error: 'Invalid state parameter' });
  }
  
  if (!code || !codeVerifier) {
    return res.status(400).json({ error: 'Missing code or verifier' });
  }
  
  try {
    // Exchange code for access token
    const accessToken = await exchangeCodeForToken(code, codeVerifier);
    
    // Get GitHub user info
    const githubClient = new GitHubClient({ token: accessToken });
    const githubUser = await githubClient.getUser();
    
    // Create or update user in database
    const user = await findOrCreateUser(githubUser, accessToken);
    
    // Create session token
    const sessionToken = createSession({
      userId: user.id,
      githubId: user.githubId,
      githubUsername: user.githubUsername,
    });
    
    // Clear OAuth cookies
    res.clearCookie('oauth_state');
    res.clearCookie('oauth_verifier');
    
    // Set session cookie
    res.cookie('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    // Redirect to dashboard
    res.redirect('/dashboard');
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});
```

### Step 3: Protect Routes with Authentication

```typescript
import { authenticate } from './auth/middleware.js';

app.get('/api/profile', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const user = authenticate(authHeader);
    
    res.json({
      userId: user.userId,
      githubUsername: user.githubUsername,
    });
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});
```

### Logout

```typescript
app.post('/auth/logout', (req, res) => {
  res.clearCookie('session');
  res.json({ message: 'Logged out successfully' });
});
```

## Security Features

### PKCE (Proof Key for Code Exchange)

- Generates random `code_verifier` (32 bytes, base64url encoded)
- Creates `code_challenge` using SHA-256 hash of verifier
- Sends challenge to GitHub during authorization
- Sends verifier during token exchange
- Prevents authorization code interception attacks

### CSRF Protection

- Random `state` parameter generated for each OAuth flow
- State stored in httpOnly cookie
- Verified on callback to prevent CSRF attacks

### Token Storage

- GitHub access tokens encrypted using AES-256-GCM
- Encryption key stored in environment variable
- Tokens never stored in plaintext

### Session Management

- JWT tokens signed with secret key
- httpOnly cookies prevent XSS attacks
- Secure flag enabled in production
- SameSite attribute prevents CSRF

## Token Refresh

GitHub OAuth tokens don't expire by default, but the application handles token revocation gracefully:

1. If API calls fail with 401, clear session and redirect to login
2. User can revoke access at https://github.com/settings/applications
3. Application updates token on each login

## Rate Limiting

The GitHub client implements:

- Exponential backoff on rate limit errors (429)
- Automatic retry with backoff on 5xx errors
- Rate limit header tracking
- Maximum 5 retries before failing

## Testing

Run OAuth tests:

```bash
npm test tests/auth/oauth.test.ts
npm test tests/auth/session.test.ts
npm test tests/auth/middleware.test.ts
```

## Compliance

### GitHub Terms of Service

- ✅ Only authorized scopes requested
- ✅ No direct star-for-star pairing (randomized matching)
- ✅ Exponential backoff on API calls
- ✅ Rate limit respect

### GDPR

- ✅ Encrypted token storage (AES-256-GCM)
- ✅ User data protection
- ✅ Right to deletion (user can revoke access)
- ✅ Minimal data collection

## Troubleshooting

### "GitHub OAuth configuration missing"

Ensure all required environment variables are set:
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_CALLBACK_URL`

### "Invalid state parameter"

State mismatch indicates:
- CSRF attack attempt
- Cookie not persisted (check cookie settings)
- Multiple OAuth flows in parallel

### "OAuth token exchange failed"

Common causes:
- Invalid authorization code (expired or already used)
- Incorrect client credentials
- Callback URL mismatch with GitHub app settings

### "SESSION_SECRET environment variable is not set"

Generate a session secret:
```bash
openssl rand -base64 32
```

Add to `.env`:
```env
SESSION_SECRET=generated_secret_here
```
