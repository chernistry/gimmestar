# REST API Endpoints

## Overview

The gimmestar API provides endpoints for GitHub OAuth authentication, star request management, and user profile access.

**Base URL**: `http://localhost:3000`

**Authentication**: Bearer token in `Authorization` header (except for auth endpoints)

## Endpoints

### Authentication

#### POST /api/auth/github

Exchange GitHub OAuth code for session token.

**Request Body**:
```json
{
  "code": "github_oauth_code",
  "codeVerifier": "pkce_code_verifier"
}
```

**Response** (200):
```json
{
  "token": "session_jwt_token",
  "user": {
    "id": 1,
    "username": "githubuser"
  }
}
```

**Errors**:
- `400`: Missing code or codeVerifier
- `401`: Authentication failed

---

### Star Requests

#### POST /api/stars/request

Create a new star request for a GitHub repository.

**Authentication**: Required

**Request Body**:
```json
{
  "repoUrl": "https://github.com/owner/repo"
}
```

**Response** (201):
```json
{
  "requestId": 123,
  "status": "pending"
}
```

**Errors**:
- `400`: Invalid GitHub repository URL
- `401`: Unauthorized
- `500`: Failed to create star request

---

#### GET /api/stars/matches

Get user's match history.

**Authentication**: Required

**Response** (200):
```json
{
  "matches": [
    {
      "id": 1,
      "requestId": 123,
      "matchedWithRequestId": 456,
      "matchedAt": "2025-11-27T12:00:00Z",
      "status": "completed"
    }
  ]
}
```

**Errors**:
- `401`: Unauthorized
- `500`: Failed to retrieve matches

---

### User Profile

#### GET /api/user/profile

Get authenticated user's profile and statistics.

**Authentication**: Required

**Response** (200):
```json
{
  "user": {
    "id": 1,
    "username": "githubuser",
    "memberSince": "2025-01-01T00:00:00Z"
  },
  "stats": {
    "totalRequests": 5
  }
}
```

**Errors**:
- `401`: Unauthorized
- `404`: User not found
- `500`: Failed to retrieve profile

---

## Error Response Format

All errors follow this format:

```json
{
  "error": "Error message"
}
```

For validation errors:

```json
{
  "error": "Validation failed",
  "errors": {
    "field": "Error message for field"
  }
}
```

## Authentication

To authenticate requests, include the session token in the Authorization header:

```
Authorization: Bearer <session_token>
```

The session token is obtained from the `/api/auth/github` endpoint after successful OAuth authentication.

## Rate Limiting

The API respects GitHub's rate limits. Requests that exceed rate limits will be automatically retried with exponential backoff.

## CORS

CORS headers should be configured based on your frontend origin in production.
