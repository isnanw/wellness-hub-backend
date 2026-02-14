ALTER TABLE "district_health_data" ADD COLUMN IF NOT EXISTS "puskesmas_id" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "puskesmas_id" text;--> statement-breakpoint
ALTER TABLE "health_disease_data" ADD COLUMN IF NOT EXISTS "puskesmas_id" text;--> statement-breakpoint
ALTER TABLE "health_program_coverage" ADD COLUMN IF NOT EXISTS "puskesmas_id" text;--> statement-breakpoint
ALTER TABLE "health_reports" ADD COLUMN IF NOT EXISTS "puskesmas_id" text;--> statement-breakpoint
ALTER TABLE "health_statistics" ADD COLUMN IF NOT EXISTS "puskesmas_id" text;--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN IF NOT EXISTS "puskesmas_id" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN IF NOT EXISTS "puskesmas_id" text;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "puskesmas_id" text;--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN IF NOT EXISTS "puskesmas_id" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "puskesmas_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "district_health_data" ADD CONSTRAINT "district_health_data_puskesmas_id_puskesmas_id_fk" FOREIGN KEY ("puskesmas_id") REFERENCES "public"."puskesmas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_puskesmas_id_puskesmas_id_fk" FOREIGN KEY ("puskesmas_id") REFERENCES "public"."puskesmas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "health_disease_data" ADD CONSTRAINT "health_disease_data_puskesmas_id_puskesmas_id_fk" FOREIGN KEY ("puskesmas_id") REFERENCES "public"."puskesmas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "health_program_coverage" ADD CONSTRAINT "health_program_coverage_puskesmas_id_puskesmas_id_fk" FOREIGN KEY ("puskesmas_id") REFERENCES "public"."puskesmas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "health_reports" ADD CONSTRAINT "health_reports_puskesmas_id_puskesmas_id_fk" FOREIGN KEY ("puskesmas_id") REFERENCES "public"."puskesmas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "health_statistics" ADD CONSTRAINT "health_statistics_puskesmas_id_puskesmas_id_fk" FOREIGN KEY ("puskesmas_id") REFERENCES "public"."puskesmas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "news" ADD CONSTRAINT "news_puskesmas_id_puskesmas_id_fk" FOREIGN KEY ("puskesmas_id") REFERENCES "public"."puskesmas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "programs" ADD CONSTRAINT "programs_puskesmas_id_puskesmas_id_fk" FOREIGN KEY ("puskesmas_id") REFERENCES "public"."puskesmas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "registrations" ADD CONSTRAINT "registrations_puskesmas_id_puskesmas_id_fk" FOREIGN KEY ("puskesmas_id") REFERENCES "public"."puskesmas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedules" ADD CONSTRAINT "schedules_puskesmas_id_puskesmas_id_fk" FOREIGN KEY ("puskesmas_id") REFERENCES "public"."puskesmas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "services" ADD CONSTRAINT "services_puskesmas_id_puskesmas_id_fk" FOREIGN KEY ("puskesmas_id") REFERENCES "public"."puskesmas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "registrations" DROP COLUMN IF EXISTS "puskesmas";