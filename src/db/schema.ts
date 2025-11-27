import { pgTable, serial, varchar, text, timestamp, integer, pgEnum, index } from 'drizzle-orm/pg-core';

export const statusEnum = pgEnum('status', ['pending', 'matched', 'completed', 'failed']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  githubId: varchar('github_id', { length: 255 }).notNull().unique(),
  githubUsername: varchar('github_username', { length: 255 }).notNull(),
  encryptedToken: text('encrypted_token').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  githubIdIdx: index('users_github_id_idx').on(table.githubId)
}));

export const repositories = pgTable('repositories', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  githubRepoId: varchar('github_repo_id', { length: 255 }).notNull().unique(),
  repoName: varchar('repo_name', { length: 255 }).notNull(),
  repoUrl: text('repo_url').notNull(),
  starsCount: integer('stars_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  userIdIdx: index('repositories_user_id_idx').on(table.userId),
  githubRepoIdIdx: index('repositories_github_repo_id_idx').on(table.githubRepoId)
}));

export const starRequests = pgTable('star_requests', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  repositoryId: integer('repository_id').notNull().references(() => repositories.id),
  status: statusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  userIdIdx: index('star_requests_user_id_idx').on(table.userId),
  statusIdx: index('star_requests_status_idx').on(table.status),
  repositoryIdIdx: index('star_requests_repository_id_idx').on(table.repositoryId)
}));

export const matchingQueue = pgTable('matching_queue', {
  id: serial('id').primaryKey(),
  requestId: integer('request_id').notNull().references(() => starRequests.id),
  matchedWithRequestId: integer('matched_with_request_id').references(() => starRequests.id),
  priorityScore: integer('priority_score').notNull().default(0),
  matchedAt: timestamp('matched_at'),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  requestIdIdx: index('matching_queue_request_id_idx').on(table.requestId),
  matchedAtIdx: index('matching_queue_matched_at_idx').on(table.matchedAt)
}));
