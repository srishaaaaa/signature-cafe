-- One bill per Billing attempt: a retried "Complete" finds the bill it already saved.
ALTER TABLE "bills" ADD COLUMN IF NOT EXISTS "client_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bills_client_key_uq" ON "bills" USING btree ("client_key");
