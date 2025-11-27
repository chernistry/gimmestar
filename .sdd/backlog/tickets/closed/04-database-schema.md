# Ticket: 01 Design and Implement Database Schema

Spec version: v1.0 / Initial Architecture

## User Problem
- The application needs persistent storage for users, repositories, star requests, and matching queue data
- GitHub tokens must be encrypted at rest to comply with GDPR/PII requirements
- No database schema exists to support the star exchange matching system

## Outcome / Success Signals
- Database tables created with proper relationships and constraints
- GitHub tokens are encrypted using industry-standard encryption
- Schema supports randomized matching to comply with GitHub ToS
- Migration scripts are version-controlled and repeatable

## Post-Release Observations
- Monitor query performance on matching queue table
- Track encryption/decryption overhead
- Validate that no PII is stored in plaintext

## Context
- Architecture Plan specifies: GDPR/PII compliance requires encrypted GitHub tokens
- GitHub ToS compliance requires randomized matching (no direct star-for-star pairing)
- System needs to track users, their repositories, star requests, and matching queue

## Objective & Definition of Done
Create a complete database schema that supports user management, repository tracking, star request handling, and randomized matching queue with encrypted token storage. Done when migrations run successfully, all tables are created with proper indexes and constraints, and token encryption/decryption utilities are implemented and tested.

- Database migration files created
- Users table with encrypted token field
- Repositories table with GitHub metadata
- Star requests table tracking user requests
- Matching queue table for randomized pairing
- Encryption/decryption utilities implemented
- Foreign key relationships established
- Indexes added for query optimization
- All tests pass

## Steps
1. Choose database system (PostgreSQL recommended for encryption support)
2. Set up migration framework (e.g., Knex, Prisma, Alembic, or native migrations)
3. Create encryption utility module with key management
4. Design and create `users` table:
   - id (primary key)
   - github_id (unique, indexed)
   - github_username
   - encrypted_token (encrypted GitHub OAuth token)
   - created_at, updated_at
5. Design and create `repositories` table:
   - id (primary key)
   - user_id (foreign key to users)
   - github_repo_id (unique, indexed)
   - repo_name
   - repo_url
   - stars_count
   - created_at, updated_at
6. Design and create `star_requests` table:
   - id (primary key)
   - user_id (foreign key to users)
   - repository_id (foreign key to repositories)
   - status (enum: pending, matched, completed, failed)
   - created_at, updated_at
7. Design and create `matching_queue` table:
   - id (primary key)
   - request_id (foreign key to star_requests)
   - matched_with_request_id (nullable foreign key to star_requests)
   - priority_score (for randomized matching)
   - matched_at (nullable timestamp)
   - created_at
8. Add indexes on frequently queried columns (github_id, status, matched_at)
9. Write unit tests for encryption/decryption utilities
10. Write integration tests for schema creation and constraints
11. Run migrations in test environment and verify schema
12. Document schema design and encryption approach in README or docs
13. Commit changes to git with message: "feat: implement database schema with encrypted token storage"

## Affected files/modules
- `migrations/001_create_users_table.sql` (or equivalent)
- `migrations/002_create_repositories_table.sql`
- `migrations/003_create_star_requests_table.sql`
- `migrations/004_create_matching_queue_table.sql`
- `src/utils/encryption.js` (or equivalent)
- `src/config/database.js`
- `tests/utils/encryption.test.js`
- `tests/integration/schema.test.js`

## Tests
- Unit tests for encryption utilities:
  - Test encrypt/decrypt round-trip
  - Test key rotation capability
  - Test handling of invalid keys
- Integration tests:
  - Test all tables are created
  - Test foreign key constraints work
  - Test unique constraints prevent duplicates
  - Test encrypted token storage and retrieval
- Run: `npm test` or `pytest` or equivalent test command

## Risks & Edge Cases
- Encryption key management: Store keys in environment variables or secrets manager, never in code
- Key rotation: Design encryption utility to support key versioning
- Token expiration: Consider adding token_expires_at field for future OAuth refresh logic
- Race conditions: Ensure matching_queue updates are atomic
- Migration rollback: Test down migrations work correctly
- Database connection pooling: Configure appropriate pool size for concurrent operations

## Dependencies
- Upstream tickets: None (this is the first implementation ticket)
- Downstream tickets: User authentication, GitHub OAuth integration, Matching algorithm implementation