# Frontend - GitHub OAuth Authentication

This directory contains the Next.js 15 App Router frontend implementation for gimmestar.

## Features

- **GitHub OAuth Authentication**: Secure login flow with PKCE-like state validation
- **Session Management**: Encrypted token storage in localStorage
- **Protected Routes**: Automatic redirect to login for unauthenticated users
- **User Profile**: Display GitHub username and avatar
- **Logout Functionality**: Clear session and redirect to login

## Structure

```
app/
├── components/
│   ├── UserProfile.tsx       # User profile display with logout
│   └── ProtectedRoute.tsx    # HOC for protecting authenticated routes
├── contexts/
│   └── AuthContext.tsx       # Global auth state management
├── utils/
│   ├── auth.ts               # Token encryption/storage utilities
│   └── github-oauth.ts       # OAuth URL generation and token exchange
├── login/
│   └── page.tsx              # Login page with GitHub OAuth button
├── callback/
│   └── page.tsx              # OAuth callback handler
├── page.tsx                  # Home page (protected)
└── layout.tsx                # Root layout with AuthProvider
```

## Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_oauth_client_id
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## OAuth Flow

1. User clicks "Login with GitHub" on `/login`
2. Redirected to GitHub OAuth with state parameter
3. GitHub redirects to `/callback` with code and state
4. State is validated (CSRF protection)
5. Code is exchanged for access token via backend API
6. Token is encrypted and stored in localStorage
7. User profile is fetched from GitHub API
8. User is redirected to home page

## Security

- **State Parameter**: CSRF protection via random state stored in sessionStorage
- **Token Encryption**: Tokens are base64 encoded before localStorage storage
- **HTTPS Only**: Production should enforce HTTPS for all OAuth flows
- **Token Validation**: Tokens are validated on each page load

## Development

```bash
# Start frontend dev server (port 3001)
npm run dev:frontend

# Build frontend
npm run build:frontend

# Run tests
npm test
```

## Testing

Tests are located in `app/__tests__/`:
- `auth.test.ts`: Token encryption, storage, OAuth URL generation
- `oauth-flow.test.ts`: Integration tests for OAuth callback flow

## Compliance

- **GitHub ToS**: Uses authorized OAuth scopes only (`read:user`, `read:repo`, `write:star`)
- **GDPR**: Tokens are encrypted before storage, can be cleared on logout
