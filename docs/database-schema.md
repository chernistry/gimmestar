# Database Schema Documentation

## Overview

The gimmestar database schema is designed to support a GitHub star exchange platform with GDPR compliance (encrypted tokens) and GitHub ToS compliance (randomized matching).

## Technology Stack

- **Database**: PostgreSQL 17
- **ORM**: Drizzle ORM (TypeScript-first, lightweight)
- **Migration Tool**: Drizzle Kit

## Schema Design

### Tables

#### `users`
Stores user account information with encrypted GitHub OAuth tokens.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial | PRIMARY KEY | Auto-incrementing user ID |
| github_id | varchar(255) | NOT NULL, UNIQUE | GitHub user ID |
| github_username | varchar(255) | NOT NULL | GitHub username |
| encrypted_token | text | NOT NULL | AES-256-GCM encrypted OAuth token |
| created_at | timestamp | NOT NULL, DEFAULT now() | Account creation timestamp |
| updated_at | timestamp | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes**: `github_id` (for fast lookups)

#### `repositories`
Stores repository information submitted by users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial | PRIMARY KEY | Auto-incrementing repository ID |
| user_id | integer | NOT NULL, FK → users.id | Repository owner |
| github_repo_id | varchar(255) | NOT NULL, UNIQUE | GitHub repository ID |
| repo_name | varchar(255) | NOT NULL | Repository name |
| repo_url | text | NOT NULL | Full repository URL |
| stars_count | integer | NOT NULL, DEFAULT 0 | Current star count |
| created_at | timestamp | NOT NULL, DEFAULT now() | Record creation timestamp |
| updated_at | timestamp | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes**: `user_id`, `github_repo_id` (for fast lookups and joins)

#### `star_requests`
Tracks user requests to receive stars on their repositories.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial | PRIMARY KEY | Auto-incrementing request ID |
| user_id | integer | NOT NULL, FK → users.id | User making the request |
| repository_id | integer | NOT NULL, FK → repositories.id | Repository to receive stars |
| status | enum | NOT NULL, DEFAULT 'pending' | Request status (pending, matched, completed, failed) |
| created_at | timestamp | NOT NULL, DEFAULT now() | Request creation timestamp |
| updated_at | timestamp | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes**: `user_id`, `status`, `repository_id` (for filtering and joins)

#### `matching_queue`
Manages randomized matching of star requests (GitHub ToS compliance).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial | PRIMARY KEY | Auto-incrementing queue entry ID |
| request_id | integer | NOT NULL, FK → star_requests.id | Star request in queue |
| matched_with_request_id | integer | NULLABLE, FK → star_requests.id | Matched request (null if unmatched) |
| priority_score | integer | NOT NULL, DEFAULT 0 | Randomized priority for matching |
| matched_at | timestamp | NULLABLE | Timestamp when match was made |
| created_at | timestamp | NOT NULL, DEFAULT now() | Queue entry creation timestamp |

**Indexes**: `request_id`, `matched_at` (for queue processing and filtering)

### Enums

#### `status`
Star request status values:
- `pending`: Request created, awaiting match
- `matched`: Request matched with another user
- `completed`: Star successfully given
- `failed`: Star operation failed

## Security & Compliance

### GDPR Compliance
- GitHub OAuth tokens are encrypted using AES-256-GCM before storage
- Encryption key stored in environment variable (`ENCRYPTION_KEY`)
- Each encrypted token includes IV and auth tag for security

### GitHub ToS Compliance
- No direct star-for-star pairing (randomized matching via `priority_score`)
- `matching_queue` table ensures non-deterministic matching
- Foreign key constraints maintain data integrity

## Migrations

### Running Migrations

```bash
# Generate migration from schema changes
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Push schema directly (dev only)
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio
```

### Migration Files

Migrations are stored in `migrations/` directory:
- `0000_amused_wind_dancer.sql` - Initial schema (tables, constraints)
- `0001_boring_skrulls.sql` - Performance indexes

## Performance Considerations

### Indexes
All frequently queried columns have indexes:
- Foreign keys (for joins)
- Status fields (for filtering)
- Unique identifiers (for lookups)
- Timestamp fields (for sorting/filtering)

### Query Optimization
- Use `status` index for filtering pending/matched requests
- Use `matched_at` index for queue processing
- Use `github_id` and `github_repo_id` for external API sync

## Future Enhancements

Potential schema additions:
- `token_expires_at` field for OAuth token refresh logic
- Trust scoring fields in `users` table
- Rate limiting metadata
- Audit log table for compliance
