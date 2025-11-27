# End-to-End Testing

## Overview

E2E tests validate the complete user journey from authentication through star execution using Vitest. These tests ensure that all components work together correctly in an integrated environment.

## Prerequisites

### Test Database Setup

E2E tests require a separate PostgreSQL test database to avoid data loss.

**Option 1: Local PostgreSQL**
```bash
# Create test database
createdb gimmestar_test

# Set environment variable
export DATABASE_URL=postgresql://user:password@localhost:5432/gimmestar_test
```

**Option 2: Docker**
```bash
# Start PostgreSQL container
docker run -d \
  --name gimmestar-test-db \
  -e POSTGRES_PASSWORD=testpass \
  -e POSTGRES_DB=gimmestar_test \
  -p 5433:5432 \
  postgres:17

# Set environment variable
export DATABASE_URL=postgresql://postgres:testpass@localhost:5433/gimmestar_test
```

**Option 3: .env file**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/gimmestar_test
```

**Important**: Always use a separate test database. E2E tests will delete all data during cleanup.

### Run Migrations

```bash
npm run db:push
```

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run all tests (unit + E2E)
npm test

# Watch mode for development
npm run test:watch

# Run with UI
npm run test:ui

# Run specific test file
npx vitest run tests/e2e/auth.e2e.test.ts
```

## Test Structure

```
tests/e2e/
├── helpers/
│   ├── db.ts           # Database setup/teardown utilities
│   └── github-mock.ts  # GitHub API mock implementations
├── setup.ts                   # Global E2E test setup
├── auth.e2e.test.ts           # OAuth flow tests
├── matching.e2e.test.ts       # Matching algorithm tests
├── star-execution.e2e.test.ts # Star execution tests
└── user-journey.e2e.test.ts   # Complete user flow tests
```

## Test Coverage

### Authentication Flow (`auth.e2e.test.ts`)
- OAuth code exchange
- User creation and retrieval
- Session management
- Token encryption

### Matching Flow (`matching.e2e.test.ts`)
- User pairing algorithm
- Match creation
- Pending request handling
- Edge cases (no matches, single user)

### Star Execution (`star-execution.e2e.test.ts`)
- GitHub API star operations
- Error handling and retries
- Rate limit handling
- API failure scenarios

### Complete User Journey (`user-journey.e2e.test.ts`)
- End-to-end flow: auth → submit → match → execute
- Multi-user scenarios
- Data consistency validation

## Mocking Strategy

### GitHub API Mocking
GitHub API calls are mocked to:
- Avoid rate limits (5,000 requests/hour)
- Ensure test reliability
- Speed up test execution
- Test error scenarios

Mock implementation in `tests/e2e/helpers/github-mock.ts`:
```typescript
export function mockGitHubAPI() {
  return {
    getUser: vi.fn().mockResolvedValue({ id: 123, login: 'testuser' }),
    starRepository: vi.fn().mockResolvedValue(undefined),
    unstarRepository: vi.fn().mockResolvedValue(undefined),
    getRepository: vi.fn().mockResolvedValue({ 
      id: 456, 
      full_name: 'owner/repo',
      stargazers_count: 10 
    })
  };
}
```

### Database Strategy
- **Real database**: Tests use actual PostgreSQL for integration accuracy
- **Cleanup**: `resetDatabase()` deletes all data before each test
- **Isolation**: Each test runs independently

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on:
  pull_request:
  push:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:17
        env:
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: gimmestar_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run migrations
        env:
          DATABASE_URL: postgresql://postgres:testpass@localhost:5432/gimmestar_test
        run: npm run db:push
      
      - name: Run E2E tests
        env:
          DATABASE_URL: postgresql://postgres:testpass@localhost:5432/gimmestar_test
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        if: always()
```

## Troubleshooting

### Database Connection Errors

**Error**: `DATABASE_URL environment variable is not set`

**Solution**: Set the environment variable:
```bash
export DATABASE_URL=postgresql://user:password@localhost:5432/gimmestar_test
```

**Error**: `Connection refused`

**Solution**: Ensure PostgreSQL is running:
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL (macOS)
brew services start postgresql@17

# Start PostgreSQL (Linux)
sudo systemctl start postgresql
```

### Test Failures

**Error**: `relation "users" does not exist`

**Solution**: Run migrations:
```bash
npm run db:push
```

**Error**: Tests hang or timeout

**Solution**: 
1. Check database connection
2. Ensure no other tests are holding locks
3. Restart PostgreSQL

### Performance Issues

If tests are slow:
1. Use a local database (not remote)
2. Run tests in parallel: `vitest run --pool=threads`
3. Optimize database cleanup queries

## Best Practices

### Test Isolation
```typescript
beforeEach(async () => {
  await resetDatabase(); // Clean slate for each test
});
```

### Descriptive Test Names
```typescript
it('should complete OAuth flow and create user', async () => {
  // Test implementation
});
```

### Test Both Success and Failure
```typescript
it('should execute star action via GitHub API', async () => {
  // Happy path
});

it('should handle API failures gracefully', async () => {
  // Error scenario
});
```

### Keep Tests Fast
- Mock external APIs
- Use database transactions where possible
- Avoid unnecessary waits

### Clear Assertions
```typescript
expect(result).toHaveProperty('accessToken');
expect(mockGitHub.starRepository).toHaveBeenCalledWith('owner/repo');
```

## Maintenance

### Adding New E2E Tests

1. Create test file in `tests/e2e/`
2. Import helpers: `resetDatabase`, `seedTestUser`, `mockGitHubAPI`
3. Add `beforeEach` cleanup
4. Write test cases
5. Update this documentation

### Updating Mocks

When GitHub API changes:
1. Update `tests/e2e/helpers/github-mock.ts`
2. Update affected tests
3. Verify all E2E tests pass

## Coverage Goals

- **Target**: >80% integration coverage
- **Critical paths**: 100% coverage
  - Authentication flow
  - Star execution
  - Matching algorithm

Run coverage report:
```bash
npm test -- --coverage
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
