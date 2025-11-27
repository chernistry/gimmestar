# gimmestar - GitHub Star Exchange

A platform for organic repository discovery and engagement, compliant with GitHub ToS and GDPR.

## Features

- **GitHub OAuth Authentication**: Secure login with PKCE-like state validation
- **Frontend UI**: Next.js 15 App Router with React 19
- **Backend API**: NestJS 11 (planned) with REST endpoints
- Randomized repository matching (no direct star-for-star pairing)
- Encrypted token storage (GDPR compliant)
- Trust scoring system
- Queue-based GitHub API operations

## Tech Stack

- **Backend**: Node.js 22 LTS with TypeScript
- **Frontend**: Next.js 15 App Router with React 19
- **Database**: PostgreSQL 17 with Drizzle ORM (planned)
- **Queue**: BullMQ 5+ on Redis (planned)

## Setup

### Prerequisites

- Node.js >= 22.0.0
- npm or yarn
- PostgreSQL 17+ (for database features)
- GitHub OAuth App (for authentication)

### Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

### Environment Variables

Create a `.env` file in the root directory (see `.env.example`):

```env
NODE_ENV=development

# Database connection string (REQUIRED)
DATABASE_URL=postgresql://user:password@localhost:5432/gimmestar

# Encryption key for GitHub tokens (REQUIRED)
# Generate with: openssl rand -base64 32
ENCRYPTION_KEY=your_base64_encoded_32_byte_key

# GitHub OAuth Configuration (REQUIRED)
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret

# Frontend Configuration (REQUIRED)
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_oauth_client_id
NEXT_PUBLIC_API_URL=http://localhost:3000

# Session Secret (REQUIRED)
SESSION_SECRET=your_base64_encoded_32_byte_key
```

**Important**: 
- Register a GitHub OAuth App at https://github.com/settings/developers
- Set callback URL to `http://localhost:3000/callback` for development
- Generate secure keys using `openssl rand -base64 32`

### Database Setup

```bash
# Generate migration files from schema
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Or push schema directly (development only)
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio
```

See [Database Schema Documentation](docs/database-schema.md) for detailed schema information.

## Project Structure

```
gimmestar/
├── src/              # Backend source code
│   ├── api/          # API routes and server
│   ├── auth/         # Authentication logic
│   ├── config/       # Configuration files
│   ├── db/           # Database schema
│   ├── lib/          # GitHub client
│   ├── services/     # Business logic
│   └── utils/        # Utility functions
├── app/              # Next.js frontend
│   ├── components/   # React components
│   ├── contexts/     # React contexts
│   ├── utils/        # Frontend utilities
│   ├── login/        # Login page
│   ├── callback/     # OAuth callback
│   └── page.tsx      # Home page
├── tests/            # Backend tests
├── dist/             # Compiled backend (generated)
└── .next/            # Next.js build (generated)
```

## Development

### Backend

```bash
# Run backend in development mode
npm run dev

# Build backend
npm run build:backend
```

### Frontend

```bash
# Run frontend dev server (port 3001)
npm run dev:frontend

# Build frontend
npm run build:frontend

# Start production frontend
npm start:frontend
```

## Deployment

See [Deployment Guide](docs/deployment.md) for detailed instructions.

### Quick Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Configure environment variables (see docs/deployment.md)
vercel env add DATABASE_URL
vercel env add ENCRYPTION_KEY
# ... add all required variables

# Deploy
vercel --prod
```

**Important**: Update your GitHub OAuth App callback URL after deployment.

### Testing

```bash
# Run all tests (unit + E2E)
npm test

# Run E2E tests only
npm run test:e2e

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

## Authentication Flow

1. User visits `/login` and clicks "Login with GitHub"
2. Redirected to GitHub OAuth with state parameter (CSRF protection)
3. User authorizes the app on GitHub
4. GitHub redirects to `/callback` with authorization code
5. Frontend validates state and exchanges code for access token
6. Token is encrypted and stored in localStorage
7. User profile is fetched from GitHub API
8. User is redirected to home page

## Compliance

- **GitHub ToS**: No direct star-for-star pairing, randomized matching, authorized OAuth scopes only (`read:user`, `read:repo`, `write:star`)
- **GDPR**: Encrypted GitHub tokens, user data protection, right to deletion

## Security

- **Token Encryption**: All GitHub tokens are encrypted before storage
- **CSRF Protection**: OAuth state parameter validation
- **HTTPS Only**: Production enforces HTTPS for all OAuth flows
- **Rate Limiting**: Exponential backoff on GitHub API calls
- **Session Management**: Secure token storage with automatic expiration

## License

MIT

## Documentation

- [Frontend Authentication](app/README.md)
- [Database Schema](docs/database-schema.md)
- [OAuth Flow](docs/oauth-flow.md)
- [API Implementation](docs/api-implementation.md)
- [E2E Testing](docs/e2e-testing.md)
