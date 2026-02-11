-- First, delete existing registrations since they don't have queue numbers
DELETE FROM "registrations";
-- Then add the column
ALTER TABLE "registrations" ADD COLUMN "queue_number" text NOT NULL;