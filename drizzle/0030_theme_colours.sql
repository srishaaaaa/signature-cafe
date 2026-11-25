-- Colour theme picked in Settings → Theme colours (brand, dark, light). Defaults are the Signature gold palette.
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "theme_accent" text DEFAULT '#9a7420' NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "theme_dark" text DEFAULT '#0d0d0d' NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "theme_light" text DEFAULT '#f6f1e2' NOT NULL;
