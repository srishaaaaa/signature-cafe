-- The paper the Print button uses without asking (changeable in Settings). Default: 3 inch thermal roll.
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "print_format" text DEFAULT 'thermal3' NOT NULL;
