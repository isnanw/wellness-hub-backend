CREATE TABLE "puskesmas" (
	"id" text PRIMARY KEY NOT NULL,
	"district_name" text NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"address" text,
	"phone" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "puskesmas_code_unique" UNIQUE("code")
);
