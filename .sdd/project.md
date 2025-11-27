Below is a full technical specification for a “GitHub Star Exchange” service inspired by githubstar.com, but rebuilt from scratch with a new UI/UX and architecture, integrated with **GitHub** (it now explicitly allows automation).

Where I say “repository stars/follows/watches/forks”, read it as GitHub equivalents.

---

## 0. Glossary

* **GitHub** – Git hosting platform (GitHub-like).
* **Star / Watch / Fork / Follow** – engagement primitives on GitHub.
* **Action** – a single user operation on GitHub (star, follow, watch, fork).
* **Campaign** – a promotion configuration for a single repository (or account).
* **Credit** – internal currency used to incentivize mutual actions.
* **Exchange job** – background task pairing “giver” and “receiver” for an action.

---

## 1. Product Overview

### 1.1. Goal

Build a SaaS platform that helps GitHub developers mutually grow:

* repository stars;
* repository watches;
* repository forks;
* account followers.

Core idea (similar to githubstar.com): users perform actions on other people’s projects/accounts and earn **credits**. They spend credits to receive actions on their own projects. Features roughly parallel “Reciprocal Stars / Follows / Histories / Block List / Premium” seen on GitHubStar. ([GitHub Star][1])

### 1.2. High-level user flows

1. User signs up on the site.
2. User connects GitHub account via OAuth.
3. User imports their GitHub repositories.
4. User creates a **campaign** for repo/account (e.g. “Get more stars”).
5. User goes to “Earn” and stars/follows other repos/accounts suggested by the system.
6. Each completed action earns **credits**.
7. Credits are spent automatically to drive actions towards campaigns, via other users.
8. User can see detailed **history** of given/received stars/watches/forks/follows and manage **block list**.

---

## 2. Functional Requirements

### 2.1. User & Authentication

#### 2.1.1. Sign-up / Sign-in

* Email/password registration:

  * Fields: email, password, display name.
  * Email verification via one-time link.
* Social login:

  * GitHub OAuth used for:

    * login;
    * linking GitHub account;
    * authorizing API calls.
* Session management:

  * JWT-based stateless sessions (access + refresh tokens).
  * Secure cookies (HTTP-only, SameSite=Lax/Strict) or local storage strategy (configurable).

#### 2.1.2. Roles

* `USER` – default.
* `ADMIN` – manage platform-wide configuration, moderation, bans.
* Optional `MODERATOR` – manage block list escalations, detect abuse.

### 2.2. GitHub Integration

Assume GitHub provides a REST/GraphQL API broadly similar to GitHub’s.

#### 2.2.1. OAuth

* OAuth 2.0 Authorization Code with PKCE:

  * Request scopes:

    * `read:user` – basic profile;
    * `read:repo` – repo list, metadata;
    * `write:star`, `write:follow` (or equivalent) – to star/follow on user’s behalf;
    * `read:events` – to verify actions, if available.
* Store:

  * `access_token`, `refresh_token`, `expires_at`, `scope`.
  * Encrypt tokens at rest (KMS or application-level AES-GCM).

#### 2.2.2. API operations

Minimum required operations:

* Get authenticated user:

  * `GET /user` → `{ id, login, avatar_url, html_url }`.
* Get user repositories:

  * `GET /user/repos?type=owner&per_page=...` → list of repos with:

    * id, name, full_name, description, language, stargazers_count, watchers_count, forks_count, html_url.
* Star repository:

  * `PUT /user/starred/{owner}/{repo}`.
* Watch (if separate concept) – or subscribe:

  * `PUT /repos/{owner}/{repo}/subscription`.
* Fork repository:

  * `POST /repos/{owner}/{repo}/forks`.
* Follow user:

  * `PUT /user/following/{username}`.
* Check if an action already exists:

  * `GET /user/starred/{owner}/{repo}` → 204/404 pattern.
  * `GET /user/following/{username}`.
* (Optional) Webhooks:

  * Listen to events `star`, `fork`, `watch`, `follow` to confirm actions without polling.

> If GitHub API differs, adapt endpoints but keep same abstraction: **perform action**, **verify action**, **list user resources**.

#### 2.2.3. Rate limiting & backoff

* Maintain per-user and global API rate-limit counters.
* Implement exponential backoff on 429 / rate-limit headers.
* Maintain “cooldown windows” per user for outbound actions.

### 2.3. Repository & Campaign Management

#### 2.3.1. Repo import & sync

* On first link:

  * Fetch all owned repositories; store in DB.
* Subsequent sync:

  * On demand (“Sync now” button).
  * Nightly background job to refresh star/fork/watch/follow counts.
* Fields per repo:

  * external_id, full_name, owner_login, description, language, stars, forks, watchers, last_synced_at.

#### 2.3.2. Campaign model

For each repo or account, user can create **campaigns**:

* Types:

  * `STAR`, `WATCH`, `FORK`, `FOLLOW_ACCOUNT` (for their GitHub user).
* Settings per campaign:

  * Target entity: repository_id or github_user_id.
  * Status: `ACTIVE`, `PAUSED`, `COMPLETED`.
  * Daily budget in credits.
  * Max total actions.
  * Per-user limit (e.g. one action per user per X days).
  * GEO / language / tag filters (optional, for future extension).
* System ensures:

  * Credits are reserved when a match is created.
  * Credits are spent when action is verified.

### 2.4. Earning Actions (“Earn” flow)

#### 2.4.1. Matching model

* A user visiting **Earn** selects:

  * Which action types they are willing to perform: star/watch/fork/follow.
  * Optional filters (language, tags).
* System returns a **queue of tasks**:

  * Each task is “Perform STAR on repo X for Y credits”.
  * Tasks are ranked by:

    * campaign priority (e.g. higher credit per action);
    * campaign age;
    * fairness (prevent same user repeatedly starring same owner).
* Each task:

  * Contains minimal repo info + owner + link to open in new tab.
  * “Mark as done” button to confirm action.

#### 2.4.2. Action verification

To prevent cheating, verification must use GitHub API:

* When user hits “Mark as done”:

  1. Frontend calls `POST /api/actions/{task_id}/complete`.
  2. Backend:

     * Uses user’s GitHub token.
     * Calls GitHub to check if action exists (e.g. `GET /user/starred/{owner}/{repo}`).

       * If not found:

         * Option 1: try to create the action automatically via API.
         * Option 2: return “Action not found; please star and retry.”
     * On success:

       * Mark action as `COMPLETED`.
       * Credit earnings to the user’s balance.
       * Mark the mapping in history for the target campaign (for the receiver).
* Background watchdog:

  * Randomly re-checks a percentage of actions to make sure users do not unstar/unfollow immediately.
  * If reversal detected within X hours:

    * Revoke credits.
    * Increment user’s “trust penalty” score.

### 2.5. Credit & Premium System

#### 2.5.1. Credits

* 1 action (e.g. star) yields N credits (configurable per type).
* Receiving action consumes M credits.
* Typical mapping:

  * Earn 1–2 credits per star.
  * Spend 2–3 credits per incoming star.
* Balance:

  * `user.credit_balance`:

    * Updated in transactions table (`credit_transactions`) with type, source, metadata.
* Edge cases:

  * If campaign has no credits:

    * It stops showing in Earn feed.
  * If user has no credits:

    * They can only earn, not run campaigns (unless free tier includes some free impressions).

#### 2.5.2. Premium

Based on GitHubStar’s “Upgrade Premium” concept. ([GitHub Star][1])

* Plans:

  * Free: daily limits on actions performed and received; limited campaigns.
  * Pro: higher limits; priority in matching; can configure multiple concurrent campaigns.
* Billing:

  * Implementation left for later (Stripe/YooKassa etc).
  * Subscription table: `subscription_plan`, `status`, `renews_at`.

### 2.6. Histories & Analytics

Mirroring “Star History / Watch History / Fork History / Follow History” features. ([GitHub Star][1])

* History views:

  * Given Stars/Received Stars.
  * Given Watches/Received Watches.
  * Given Forks/Received Forks.
  * Given Follows/Received Follows.
* Columns:

  * Date/time.
  * Counterparty user.
  * Repo/account.
  * Action type.
  * Credits earned/spent.
  * Status (completed, reversed, disputed).
* Filters:

  * Date range, repo, action type.
* Export as CSV.

### 2.7. Block List & Trust

* Block list:

  * User can block:

    * specific GitHub users;
    * specific repos;
    * entire languages/tags (optional).
  * Blocking prevents:

    * their campaigns from appearing in your Earn feed;
    * them from receiving your actions.
* Trust mechanisms:

  * Track “reversal ratio” (how often given actions are undone soon after).
  * Automatically:

    * reduce credit rewards for low trust;
    * deprioritize them in matching;
    * or flag for admin review.

### 2.8. Localization & Settings

GitHubStar has multi-language UI; we mirror that. ([GitHub Star][1])

* UI languages: EN, RU initially (extendable).
* Settings:

  * Preferred UI language.
  * Timezone.
  * Email notifications toggle.
  * Default action types to perform.

### 2.9. Notifications

* In-app notifications:

  * “You received 10 new stars on repo X.”
  * “Campaign Y paused due to low credits.”
* Email notifications (optional):

  * Periodic summary.
  * Account warnings (abuse, trust score changes).

### 2.10. Admin Panel

* View users, campaigns, balances.
* Global block list:

  * For spammy GitHub accounts or repos.
* Abuse detection dashboard:

  * Users with high reversal ratio.
  * Suspicious patterns (very high volume in short time).
* Manual adjustments:

  * Freeze credit balance.
  * Force cancel campaigns.
  * Ban users.

---

## 3. Non-Functional Requirements

* Availability: 99.5% monthly (single region).
* Latency:

  * API responses < 300 ms P95 (excluding GitHub API latency).
* Scalability:

  * Must handle:

    * 10–50k users.
    * Up to 10 actions/s average.
* Security:

  * HTTPS everywhere.
  * Encrypted tokens & secrets.
  * Role-based access control.
* Observability:

  * Structured logs.
  * Metrics (Prometheus style).
  * Basic traces (optional).

---

## 4. System Architecture

### 4.1. Components

1. **Frontend SPA**

   * Tech: React + TypeScript + Next.js or Vite.
   * Uses REST/GraphQL API.
   * Handles auth (JWT in cookie / local storage).

2. **Backend API**

   * Tech: Node.js + TypeScript + NestJS/Express.
   * Concerns:

     * Auth & sessions.
     * GitHub OAuth integration.
     * Credit & campaign logic.
     * History, block list.
   * Exposes JSON REST API.

3. **Background Worker**

   * Tech: Node.js service (separate process/container).
   * Responsibilities:

     * Action verification.
     * Matching and queue scheduling.
     * Periodic GitHub sync.
     * Trust scoring.

4. **Database**

   * PostgreSQL on Render (managed Postgres). ([Render][2])

5. **Cache / Queue**

   * Redis or Render Key Value (or Redis-compatible) for:

     * job queue (BullMQ / custom);
     * rate-limit counters;
     * short-term state. ([Render][3])

6. **Render deployment**

   * One web service for API + SPA.
   * One background worker service.
   * One Postgres instance.
   * One Redis/Key-Value instance. ([Render][4])

### 4.2. Data flow examples

#### 4.2.1. User performs star to earn credits

1. User opens Earn page → `GET /api/tasks?type=STAR`.
2. API returns prioritized list of tasks.
3. User clicks “Open on GitHub” → new tab with repo.
4. User stars repo on GitHub.
5. User clicks “Mark as done”.
6. API enqueues verification job:

   * Worker uses GitHub token to verify.
   * On success, writes `actions` record, updates credit balance, updates campaign counters.

#### 4.2.2. Campaign consumption

1. Worker periodically:

   * Selects campaigns with available credits.
   * Creates tasks and inserts into `exchange_queue`.
2. When other users request tasks, they consume from queue.
3. Completed tasks spend credits.

---

## 5. Data Model (Relational Schema)

Using PostgreSQL. Primary key type: `bigserial` or UUID.

### 5.1. `users`

* `id`
* `email` (unique, nullable if OAuth-only)
* `password_hash` (nullable if OAuth-only)
* `display_name`
* `role` (`USER`, `ADMIN`, `MODERATOR`)
* `created_at`, `updated_at`
* `last_login_at`
* `credit_balance` (int, default 0)
* `ui_language` (e.g. `en`, `ru`)
* `timezone`

### 5.2. `oauth_accounts`

* `id`
* `user_id` FK → users
* `provider` (`github`)
* `provider_user_id` (string)
* `access_token` (encrypted)
* `refresh_token` (encrypted, nullable)
* `expires_at` (timestamp)
* `scope` (string)
* `created_at`, `updated_at`
* Unique `(provider, provider_user_id)`.

### 5.3. `github_profiles`

* `id`
* `user_id` FK → users
* `github_login`
* `github_user_id` (string)
* `avatar_url`
* `html_url`
* `public_repos_count`
* `followers_count`
* `following_count`
* `last_synced_at`

### 5.4. `repositories`

* `id`
* `user_id` FK → users (owner on platform)
* `github_repo_id` (string)
* `full_name` (`owner/name`)
* `name`
* `owner_login`
* `description`
* `language`
* `stars_count`
* `forks_count`
* `watchers_count`
* `html_url`
* `is_private`
* `last_synced_at`
* Unique `github_repo_id`.

### 5.5. `campaigns`

* `id`
* `user_id` (campaign owner)
* `type` (`STAR`, `WATCH`, `FORK`, `FOLLOW_ACCOUNT`)
* `repository_id` FK → repositories (nullable for account follow)
* `target_github_user_id` (for FOLLOW_ACCOUNT)
* `status` (`ACTIVE`, `PAUSED`, `COMPLETED`)
* `daily_credit_budget`
* `total_credit_budget`
* `credits_spent` (int)
* `max_actions_total`
* `actions_per_user_limit` (int)
* `title` (optional)
* `created_at`, `updated_at`
* `starts_at`, `ends_at` (nullable)

### 5.6. `tasks` (exchange queue)

* `id`
* `campaign_id`
* `action_type` (`STAR`, `WATCH`, `FORK`, `FOLLOW_ACCOUNT`)
* `target_repository_id` or `target_github_user_id`
* `assigned_to_user_id` (nullable until reserved)
* `status` (`PENDING`, `RESERVED`, `EXPIRED`, `CANCELLED`, `COMPLETED`)
* `reward_credits`
* `created_at`
* `reserved_at` (when shown to user)
* `expires_at`

### 5.7. `actions` (history of actions)

* `id`
* `task_id` FK → tasks
* `campaign_id`
* `actor_user_id` (who did the action)
* `target_user_id` (owner receiving action)
* `action_type`
* `target_repository_id` / `target_github_user_id`
* `status` (`PENDING_VERIFICATION`, `CONFIRMED`, `REVOKED`, `DISPUTED`)
* `verified_at`
* `reversed_at` (if undone later)
* `credits_earned`
* `credits_spent`
* `github_event_id` (if available)
* `created_at`

### 5.8. `credit_transactions`

* `id`
* `user_id`
* `delta` (positive or negative int)
* `balance_after`
* `reason` (`EARN_ACTION`, `SPEND_CAMPAIGN`, `ADJUSTMENT`, `BONUS`, `PENALTY`)
* `metadata` (JSONB)
* `created_at`

### 5.9. `block_list`

* `id`
* `user_id` (owner of block list)
* `blocked_github_user_id` (string, nullable)
* `blocked_repository_id` FK → repositories (nullable)
* `reason` (text)
* `created_at`

### 5.10. `subscriptions`

* `id`
* `user_id`
* `plan` (`FREE`, `PRO`, etc.)
* `status` (`ACTIVE`, `CANCELLED`, `EXPIRED`)
* `renews_at`
* `created_at`, `updated_at`

### 5.11. `audit_logs`

* `id`
* `actor_user_id` (nullable for system)
* `action` (string)
* `target_type` (e.g. `USER`, `CAMPAIGN`, `ACTION`)
* `target_id`
* `metadata` (JSONB)
* `created_at`

---

## 6. Backend API Design (REST)

Base: `/api/v1`.

### 6.1. Auth

* `POST /auth/register`

  * Body: `{ email, password, display_name }`
* `POST /auth/login`

  * Body: `{ email, password }`
  * Response: tokens + user profile.
* `POST /auth/logout`
* `POST /auth/refresh`
* `GET /auth/me`

  * Returns current user.

### 6.2. GitHub OAuth

* `GET /auth/github/url`

  * Returns OAuth authorization URL.
* `GET /auth/github/callback`

  * Exchange code → token, link to user.
* `DELETE /auth/github`

  * Unlink GitHub account.

### 6.3. Repositories & Campaigns

* `GET /repositories`

  * Query: pagination, search.
* `POST /repositories/sync`

  * Triggers sync from GitHub.
* `GET /campaigns`
* `POST /campaigns`

  * Body:

    * `type`, `repository_id` or `target_github_user_id`,
    * `daily_credit_budget`, `total_credit_budget`, `max_actions_total`, `actions_per_user_limit`.
* `PATCH /campaigns/:id`
* `POST /campaigns/:id/pause`
* `POST /campaigns/:id/resume`
* `POST /campaigns/:id/complete`

### 6.4. Tasks & Actions

* `GET /tasks`

  * Query:

    * `type` (STAR/WATCH/FORK/FOLLOW_ACCOUNT),
    * `limit`,
    * filters.
  * Server:

    * Picks tasks from queue not created by this user; respects block list and per-user limits.
* `POST /tasks/:id/reserve`

  * Optional if we want explicit reservation step.
* `POST /tasks/:id/complete`

  * Backend:

    * Verifies via GitHub API.
    * On success:

      * Creates `actions` record;
      * Updates transactions & balances;
      * Marks task completed.

### 6.5. History & Block list

* `GET /actions`

  * Filters: direction (given/received), type, date range.
* `GET /history/stars`, `/history/forks`, `/history/watches`, `/history/follows`

  * Convenience endpoints.
* `GET /blocks`
* `POST /blocks`

  * Body: `blocked_github_user_id` or `blocked_repository_id`.
* `DELETE /blocks/:id`

### 6.6. User settings

* `GET /settings`
* `PATCH /settings`

  * Update language, timezone, etc.

### 6.7. Admin

* `GET /admin/users`
* `GET /admin/users/:id`
* `POST /admin/users/:id/ban`
* `GET /admin/actions/suspicious`
* `POST /admin/actions/:id/revoke`
* etc.

---

## 7. Exchange & Fairness Algorithm (Detailed)

### 7.1. Matching algorithm for tasks

Goal: fair distribution, no obvious “star for star” pairs, avoid spam.

Pseudo-logic (simplified):

```text
When user U requests tasks for type T:

1. Build candidate campaigns C:
   - C where campaign.type == T
   - campaign.status == ACTIVE
   - campaign owner != U
   - campaign has enough available credits for at least one action
   - U is not blocked by campaign owner
   - U has not exceeded actions_per_user_limit for this campaign
   - U has not performed this action on this repo/account within a cooldown window

2. Score each campaign c in C:
   score(c) =
       w1 * priority_by_plan(c.owner.subscription)
     + w2 * log(1 + credits_remaining(c))
     + w3 * age_factor(c.created_at)
     + w4 * random_jitter

3. Select top K campaigns.

4. For each selected campaign:
   - Create task record:
     - reward_credits determined by campaign configuration or global rules.
   - Insert into queue & return to client.
```

### 7.2. Credit handling

* When task `t` is created:

  * **Reserved debit**:

    * Deduct `reward_credits` from campaign owner’s balance or mark as reserved in separate field.
* When action is confirmed:

  * **Confirm debit / credit**:

    * Finalize debit from owner.
    * Add `reward_credits` (or `reward_credits * factor`) to actor’s balance.
    * Create `credit_transactions` rows for both.

### 7.3. Anti-abuse / trust score

Maintain `user_trust_score` (0–100):

* Start: 100.
* On reversal of an action within 24–48 hours:

  * Decrement trust score.
* On long periods with no reversals:

  * Slowly increase back towards 100.
* Use trust score in:

  * matching (low-trust users get fewer tasks);
  * campaign visibility;
  * detection for admin review.

### 7.4. Reversal detection

* Scheduled job:

  * For actions `status = CONFIRMED` and `verified_at` in last N days:

    * Call GitHub API to check if star/follow/etc. still present.
  * If missing:

    * Mark `status = REVOKED`.
    * Reverse credits:

      * Deduct from actor (if available).
      * Optionally refund owner.
    * Increase penalty for actor.

---

## 8. Frontend UX / UI Specification

Requirement: **modern, simple, not similar to existing GitHubStar UI**.

### 8.1. General design language

* Clean, card-based layout.
* Light & dark themes.
* Primary navigation in left sidebar.
* Top bar:

  * Profile avatar.
  * Credit balance pill (e.g. “Credits: 1240”).
  * Quick link to “Earn”.

Main sections:

1. Dashboard
2. Earn
3. Promote (Campaigns)
4. History
5. Block List
6. Settings
7. Admin (role-based)

### 8.2. Dashboard

* Tiles:

  * “Credits” – current balance, delta vs yesterday.
  * “Active campaigns” – count, actions in last 24h.
  * “Latest activity” – recent received actions.
* Graph:

  * Actions received over last 7/30 days.
* CTA buttons:

  * “Start earning credits”.
  * “Start a new campaign”.

### 8.3. Earn page

* Filter bar:

  * Action type chip selector: Stars / Watches / Forks / Follows.
  * Language dropdown (All, Python, JS, Rust, etc.).
* Task list:

  * Each row as card:

    * Repo name + owner.
    * Language + tags.
    * Brief description.
    * Reward (e.g. “+2 credits”).
    * Buttons:

      * `Open on GitHub` – icon + text.
      * `Mark as done`.
* UX flow:

  * Clicking `Open on GitHub` opens new tab `https://github.com/...`.
  * After user stars → returns and clicks `Mark as done`.
  * Card changes to “Verifying…” then “Completed! +2 credits”.
* Empty state:

  * “No tasks right now. Try changing filters or check again later.”

### 8.4. Promote (Campaigns) page

Tabs:

1. “My campaigns”
2. “Create campaign”

#### 8.4.1. My campaigns

* Table/card layout with columns:

  * Campaign name.
  * Type (star/fork/watch/follow).
  * Target (repo/account).
  * Status.
  * Today: actions received.
  * Total: credits spent / actions.
* Each row: quick actions:

  * Pause/resume toggle.
  * Edit.
  * View details.

#### 8.4.2. Create campaign wizard

Step 1: Choose what you want:

* [ ] Get more stars for my repo.
* [ ] Get more forks for my repo.
* [ ] Get more watchers for my repo.
* [ ] Get more followers for my GitHub account.

Step 2: Select target:

* Dropdown of imported repos or “My GitHub account”.

Step 3: Configure budget:

* Slider for daily budget (credits).
* Input for max total actions.
* Per-user limit (default 1).

Step 4: Review & create:

* Summary card:

  * “You’ll spend up to X credits/day, estimated ~Y actions/day”.
* “Create campaign” button.

### 8.5. History page

* Tabbed:

  * Stars
  * Watches
  * Forks
  * Follows
  * All actions

* Each tab: data table:

  * Date/time.
  * Direction (given/received).
  * Peer (user/repo).
  * Action type.
  * Credits earned/spent.
  * Status (confirmed, revoked).

* Filters:

  * Date range picker.
  * Direction.
  * Repo.

* Export button.

### 8.6. Block List page

* List of blocked entities:

  * Type: User / Repo.
  * Name.
  * Reason.
  * Date.

* “Add block” dialog:

  * Input: GitHub username or repo full name.
  * Helper: search as user types (via GitHub API).

### 8.7. Settings

* Profile:

  * Display name, avatar preview.
* GitHub connection:

  * Status: Connected/Not connected.
  * “Connect GitHub account” / “Reconnect”.
* Preferences:

  * Preferred UI language.
  * Timezone.
  * Default task types to show.
* Notifications:

  * On/off toggles for email digests.

---

## 9. Background Jobs & Schedules

### 9.1. Queue processing

Use Redis-backed queue (e.g. BullMQ):

* `verify-action` queue:

  * Worker concurrency ~5–20.
* `campaign-scheduler` queue:

  * Periodic job (every minute) to generate tasks for active campaigns.
* `sync-repositories` queue:

  * Nightly job per user.

### 9.2. Cron jobs

* Every 5 minutes:

  * Process pending verifications.
* Every hour:

  * Recalculate trust scores.
* Nightly:

  * Full sync of repo stats.
  * Backup / maintenance tasks.

On Render, these can be implemented as:

* Worker service with `cron` package or Render “cron job” services hitting dedicated endpoints.

---

## 10. Deployment Plan on Render

Render supports web services, Postgres, and Key-Value/Redis-like services suitable for this architecture. ([Render][4])

### 10.1. Repositories

* Single mono-repo (e.g. `github-star-exchange`):

  * `backend/` – Node.js + NestJS.
  * `frontend/` – React + Vite/Next.
  * `Dockerfile` – multi-stage build (or separate Dockerfiles per service).

### 10.2. Datastores

1. **Render Postgres**

   * Create via Render → New → Postgres.
   * Choose region (e.g. Frankfurt) and instance size.
   * Configure:

     * `DATABASE_URL` env var for backend & worker (internal URL). ([Render][2])

2. **Redis / Key Value**

   * If using Redis:

     * New → Redis (or generic Key Value) via documentation. ([Render][3])
     * Configure `REDIS_URL`.

### 10.3. Web service (API + Frontend)

Option A: Single web service with Node backend serving both API and built frontend.

* On Render:

  * New → Web Service.
  * Source: Git repository.
  * Language: Node.
  * Build command:

    * `cd frontend && npm ci && npm run build`
    * `cd ../backend && npm ci && npm run build`
  * Start command:

    * `cd backend && node dist/main.js`
  * Environment variables:

    * `PORT=10000` (or default).
    * `DATABASE_URL`, `REDIS_URL`.
    * `GRUHUB_CLIENT_ID`, `GRUHUB_CLIENT_SECRET`, `GRUHUB_OAUTH_REDIRECT_URL`.
    * `JWT_SECRET`, `ENCRYPTION_KEY`.

Option B: Separate services for API and static frontend:

* Frontend:

  * Use Render Static Site.
  * Build output from `frontend/`.
* Backend:

  * Web Service with Node.

### 10.4. Worker service

* Another Render **Web Service** (or “Background Worker” if available) using same repo:

  * Language: Node or Docker.
  * Build command: same as backend.
  * Start command: `cd backend && node dist/worker.js` (worker entry).
  * Attach same `DATABASE_URL`, `REDIS_URL`.

### 10.5. Auto-deploys & environments

Render supports auto-deploy from Git providers. ([Render][5])

* Production:

  * Branch: `main`.
  * Auto-deploy on commit.
* Staging:

  * Branch: `develop` or `staging`.
* Environment-specific:

  * Separate Postgres & Redis per environment.

### 10.6. Monitoring & logs

* Use Render logs for basic monitoring.
* Add lightweight metrics endpoint `/metrics` (Prometheus style) and connect to external monitoring if needed.

---

## 11. Security & Compliance Considerations

* Sensitive data (GitHub tokens) stored encrypted.
* Rate-limit on login endpoints.
* CSRF protection for browser-based flows; recommend same-site cookies or CSRF tokens.
* Strict CORS.
* Minimal GitHub scopes; revoke on unlink.

---

## 12. Future Extensions (Optional)

* Webhooks from GitHub (if available) for real-time verification.
* Mobile-friendly PWA with push notifications.
* Advanced targeting:

  * filter by repo topics, stars range.
* Social features:

  * “Mutual promotion groups,” chat, etc.

---

This specification covers:

* full feature set patterned on GitHubStar (stars/follows/forks/watches, history, block list, premium); ([GitHub Star][1])
* GitHub OAuth and API integration;
* multi-user system with credits and campaigns;
* complete data model and backend API;
* modern UX/UI concept clearly distinct from the original site;
* and explicit deployment plan on Render for web service, worker, Postgres, and Redis.

[1]: https://www.githubstar.com/ "GitHub Star Exchange - Quickly Gain Stars – GITHUBSTAR"
[2]: https://render.com/docs/postgresql-creating-connecting "Create and Connect to Render Postgres"
[3]: https://render.com/docs/deploy-webdis-docker "Deploy Webdis and Redis with Docker"
[4]: https://render.com/docs/web-services "Web Services"
[5]: https://render.com/docs/deploys "Deploying on Render"
