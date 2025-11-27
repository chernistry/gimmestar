# gimmestar - GitHub Star Exchange

A platform for organic repository discovery and engagement, compliant with GitHub ToS and GDPR.

## Features

- Randomized repository matching (no direct star-for-star pairing)
- GitHub OAuth integration with PKCE
- Encrypted token storage
- Trust scoring system
- Queue-based GitHub API operations

## Tech Stack

- **Backend**: NestJS 11 (planned)
- **Frontend**: Next.js 15 App Router (planned)
- **Database**: PostgreSQL 17 with Drizzle ORM (planned)
- **Queue**: BullMQ 5+ on Redis (planned)
- **Runtime**: Node.js 22 LTS

## Setup

### Prerequisites

- Node.js >= 22.0.0
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Development mode
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Add environment variables as needed
NODE_ENV=development
```

## Project Structure

```
gimmestar/
├── src/
│   ├── config/       # Configuration files
│   ├── utils/        # Utility functions
│   └── index.ts      # Application entry point
├── tests/            # Test files
├── dist/             # Compiled output (generated)
└── package.json
```

## Development

- `npm run build` - Compile TypeScript to JavaScript
- `npm test` - Run tests with Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Run tests with UI
- `npm run dev` - Run in development mode with hot reload

## Compliance

- **GitHub ToS**: No direct star-for-star pairing, randomized matching, authorized OAuth scopes only
- **GDPR**: Encrypted GitHub tokens, user data protection

## License

MIT
