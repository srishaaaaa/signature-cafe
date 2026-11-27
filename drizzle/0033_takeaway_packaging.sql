-- Dine-in / takeaway on every bill, with a packaging charge on takeaway (default amount set in Settings).
ALTER TABLE "bills" ADD COLUMN IF NOT EXISTS "order_type" text DEFAULT 'dine_in' NOT NULL;--> statement-breakpoint
ALTER TABLE "bills" ADD COLUMN IF NOT EXISTS "packaging" numeric(12, 2) DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "packaging_charge" numeric(12, 2) DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "packaging_per" text DEFAULT 'bill' NOT NULL;
