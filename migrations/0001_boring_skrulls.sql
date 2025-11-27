CREATE INDEX "matching_queue_request_id_idx" ON "matching_queue" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "matching_queue_matched_at_idx" ON "matching_queue" USING btree ("matched_at");--> statement-breakpoint
CREATE INDEX "repositories_user_id_idx" ON "repositories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "repositories_github_repo_id_idx" ON "repositories" USING btree ("github_repo_id");--> statement-breakpoint
CREATE INDEX "star_requests_user_id_idx" ON "star_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "star_requests_status_idx" ON "star_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "star_requests_repository_id_idx" ON "star_requests" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX "users_github_id_idx" ON "users" USING btree ("github_id");