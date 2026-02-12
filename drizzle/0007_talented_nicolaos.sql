CREATE TABLE "general_info" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"label" text NOT NULL,
	"category" text DEFAULT 'contact' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "general_info_key_unique" UNIQUE("key")
);
