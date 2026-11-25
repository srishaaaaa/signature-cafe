-- Billing shows counter sales only by default; the Customer tab option is switched on in Settings.
ALTER TABLE "settings" ALTER COLUMN "walk_ins_only" SET DEFAULT true;--> statement-breakpoint
UPDATE "settings" SET "walk_ins_only" = true WHERE "id" = 1;
