CREATE TABLE "health_disease_data" (
	"id" text PRIMARY KEY NOT NULL,
	"disease_name" text NOT NULL,
	"cases" integer NOT NULL,
	"year" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_program_coverage" (
	"id" text PRIMARY KEY NOT NULL,
	"program_name" text NOT NULL,
	"coverage_percent" real NOT NULL,
	"year" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
