CREATE TYPE "public"."health_report_category" AS ENUM('profil', 'imunisasi', 'penyakit', 'spm', 'gizi', 'lainnya');--> statement-breakpoint
CREATE TABLE "district_health_data" (
	"id" text PRIMARY KEY NOT NULL,
	"district_name" text NOT NULL,
	"population" text NOT NULL,
	"puskesmas" integer DEFAULT 0 NOT NULL,
	"hospitals" integer DEFAULT 0 NOT NULL,
	"doctors" integer DEFAULT 0 NOT NULL,
	"nurses" integer DEFAULT 0 NOT NULL,
	"midwives" integer DEFAULT 0 NOT NULL,
	"year" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" "health_report_category" NOT NULL,
	"year" integer NOT NULL,
	"file_url" text NOT NULL,
	"file_size" text NOT NULL,
	"file_type" text DEFAULT 'PDF' NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp,
	"status" "status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_statistics" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"icon" text NOT NULL,
	"change" text,
	"year" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
