CREATE TYPE "public"."visibility" AS ENUM('public', 'internal');--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "visibility" "visibility" DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE "health_reports" ADD COLUMN "visibility" "visibility" DEFAULT 'public' NOT NULL;