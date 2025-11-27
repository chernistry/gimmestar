CREATE TYPE "public"."status" AS ENUM('pending', 'matched', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "matching_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"matched_with_request_id" integer,
	"priority_score" integer DEFAULT 0 NOT NULL,
	"matched_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repositories" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"github_repo_id" varchar(255) NOT NULL,
	"repo_name" varchar(255) NOT NULL,
	"repo_url" text NOT NULL,
	"stars_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "repositories_github_repo_id_unique" UNIQUE("github_repo_id")
);
--> statement-breakpoint
CREATE TABLE "star_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"repository_id" integer NOT NULL,
	"status" "status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"github_id" varchar(255) NOT NULL,
	"github_username" varchar(255) NOT NULL,
	"encrypted_token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_github_id_unique" UNIQUE("github_id")
);
--> statement-breakpoint
ALTER TABLE "matching_queue" ADD CONSTRAINT "matching_queue_request_id_star_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."star_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matching_queue" ADD CONSTRAINT "matching_queue_matched_with_request_id_star_requests_id_fk" FOREIGN KEY ("matched_with_request_id") REFERENCES "public"."star_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "star_requests" ADD CONSTRAINT "star_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "star_requests" ADD CONSTRAINT "star_requests_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE no action ON UPDATE no action;