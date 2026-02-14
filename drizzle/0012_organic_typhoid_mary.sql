CREATE TABLE "program_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"icon" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "program_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "category_id" text;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_category_id_program_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."program_categories"("id") ON DELETE no action ON UPDATE no action;