CREATE TYPE "public"."document_category" AS ENUM('pendaftaran', 'rujukan', 'administrasi', 'laporan');--> statement-breakpoint
CREATE TYPE "public"."document_format" AS ENUM('PDF', 'XLSX', 'DOC', 'DOCX');--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"category" "document_category" NOT NULL,
	"format" "document_format" NOT NULL,
	"file_url" text NOT NULL,
	"file_size" text NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"status" "status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "documents_code_unique" UNIQUE("code")
);
