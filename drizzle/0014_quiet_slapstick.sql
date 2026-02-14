CREATE TABLE "unit_kerja" (
	"id" text PRIMARY KEY NOT NULL,
	"district_name" text NOT NULL,
	"district_id" text,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"address" text,
	"phone" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unit_kerja_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "puskesmas" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "puskesmas" CASCADE;--> statement-breakpoint
ALTER TABLE "district_health_data" ADD COLUMN "unit_kerja" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "district_health_data" ADD COLUMN "unit_kerja_id" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "unit_kerja_id" text;--> statement-breakpoint
ALTER TABLE "health_disease_data" ADD COLUMN "unit_kerja_id" text;--> statement-breakpoint
ALTER TABLE "health_program_coverage" ADD COLUMN "unit_kerja_id" text;--> statement-breakpoint
ALTER TABLE "health_reports" ADD COLUMN "unit_kerja_id" text;--> statement-breakpoint
ALTER TABLE "health_statistics" ADD COLUMN "unit_kerja_id" text;--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "unit_kerja_id" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "unit_kerja_id" text;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "unit_kerja_id" text;--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "unit_kerja_id" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "unit_kerja_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "unit_kerja_id" text;--> statement-breakpoint
ALTER TABLE "unit_kerja" ADD CONSTRAINT "unit_kerja_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "district_health_data" ADD CONSTRAINT "district_health_data_unit_kerja_id_unit_kerja_id_fk" FOREIGN KEY ("unit_kerja_id") REFERENCES "public"."unit_kerja"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_unit_kerja_id_unit_kerja_id_fk" FOREIGN KEY ("unit_kerja_id") REFERENCES "public"."unit_kerja"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_disease_data" ADD CONSTRAINT "health_disease_data_unit_kerja_id_unit_kerja_id_fk" FOREIGN KEY ("unit_kerja_id") REFERENCES "public"."unit_kerja"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_program_coverage" ADD CONSTRAINT "health_program_coverage_unit_kerja_id_unit_kerja_id_fk" FOREIGN KEY ("unit_kerja_id") REFERENCES "public"."unit_kerja"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_reports" ADD CONSTRAINT "health_reports_unit_kerja_id_unit_kerja_id_fk" FOREIGN KEY ("unit_kerja_id") REFERENCES "public"."unit_kerja"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_statistics" ADD CONSTRAINT "health_statistics_unit_kerja_id_unit_kerja_id_fk" FOREIGN KEY ("unit_kerja_id") REFERENCES "public"."unit_kerja"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news" ADD CONSTRAINT "news_unit_kerja_id_unit_kerja_id_fk" FOREIGN KEY ("unit_kerja_id") REFERENCES "public"."unit_kerja"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_unit_kerja_id_unit_kerja_id_fk" FOREIGN KEY ("unit_kerja_id") REFERENCES "public"."unit_kerja"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_unit_kerja_id_unit_kerja_id_fk" FOREIGN KEY ("unit_kerja_id") REFERENCES "public"."unit_kerja"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_unit_kerja_id_unit_kerja_id_fk" FOREIGN KEY ("unit_kerja_id") REFERENCES "public"."unit_kerja"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_unit_kerja_id_unit_kerja_id_fk" FOREIGN KEY ("unit_kerja_id") REFERENCES "public"."unit_kerja"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_unit_kerja_id_unit_kerja_id_fk" FOREIGN KEY ("unit_kerja_id") REFERENCES "public"."unit_kerja"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "district_health_data" DROP COLUMN "puskesmas";--> statement-breakpoint
ALTER TABLE "district_health_data" DROP COLUMN "puskesmas_id";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "puskesmas_id";--> statement-breakpoint
ALTER TABLE "health_disease_data" DROP COLUMN "puskesmas_id";--> statement-breakpoint
ALTER TABLE "health_program_coverage" DROP COLUMN "puskesmas_id";--> statement-breakpoint
ALTER TABLE "health_reports" DROP COLUMN "puskesmas_id";--> statement-breakpoint
ALTER TABLE "health_statistics" DROP COLUMN "puskesmas_id";--> statement-breakpoint
ALTER TABLE "news" DROP COLUMN "puskesmas_id";--> statement-breakpoint
ALTER TABLE "programs" DROP COLUMN "puskesmas_id";--> statement-breakpoint
ALTER TABLE "registrations" DROP COLUMN "puskesmas_id";--> statement-breakpoint
ALTER TABLE "schedules" DROP COLUMN "puskesmas_id";--> statement-breakpoint
ALTER TABLE "services" DROP COLUMN "puskesmas_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "puskesmas_id";