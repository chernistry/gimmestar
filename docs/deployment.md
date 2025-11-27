# Deployment Guide

## Prerequisites

1. **GitHub OAuth App**: Register at https://github.com/settings/developers
2. **PostgreSQL Database**: Production database (e.g., Vercel Postgres, Supabase, Neon)
3. **Vercel Account**: For deployment

## Environment Variables

All environment variables must be configured in your deployment platform. See `.env.example` for the complete list.

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Encryption (generate with: openssl rand -base64 32)
ENCRYPTION_KEY=<base64-encoded-32-byte-key>

# GitHub OAuth
GITHUB_CLIENT_ID=<your-github-oauth-client-id>
GITHUB_CLIENT_SECRET=<your-github-oauth-client-secret>

# Session (generate with: openssl rand -base64 32)
SESSION_SECRET=<base64-encoded-32-byte-key>

# Frontend
NEXT_PUBLIC_GITHUB_CLIENT_ID=<your-github-oauth-client-id>
NEXT_PUBLIC_API_URL=https://your-domain.vercel.app
```

## Deployment to Vercel

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Configure Environment Variables

```bash
# Add environment variables to Vercel
vercel env add DATABASE_URL
vercel env add ENCRYPTION_KEY
vercel env add GITHUB_CLIENT_ID
vercel env add GITHUB_CLIENT_SECRET
vercel env add SESSION_SECRET
vercel env add NEXT_PUBLIC_GITHUB_CLIENT_ID
vercel env add NEXT_PUBLIC_API_URL
```

### 3. Deploy

```bash
# Deploy to production
vercel --prod
```

### 4. Update GitHub OAuth Callback

After deployment, update your GitHub OAuth App callback URL to:
```
https://your-domain.vercel.app/callback
```

## Database Migration

Run migrations after deployment:

```bash
# Generate migration files
npm run db:generate

# Apply migrations
npm run db:migrate
```

## Verification

1. Check environment variables are loaded: Application will fail to start if required variables are missing
2. Test OAuth flow: Visit `/login` and authenticate with GitHub
3. Monitor logs: Check Vercel logs for any errors

## Security Checklist

- [ ] All environment variables are set
- [ ] ENCRYPTION_KEY is 32 bytes (base64 encoded)
- [ ] SESSION_SECRET is at least 32 bytes (base64 encoded)
- [ ] GitHub OAuth callback URL is updated
- [ ] HTTPS is enforced (automatic on Vercel)
- [ ] Database connection uses SSL
- [ ] Secrets are not committed to version control

## Troubleshooting

### Application fails to start

Check that all required environment variables are set:
```bash
vercel env ls
```

### OAuth callback fails

Verify the callback URL in your GitHub OAuth App matches your deployment URL.

### Database connection fails

Ensure DATABASE_URL is correct and the database is accessible from Vercel.
