-- Instagram handle for the shop (editable in Settings), and the shop details for The Signature Café.
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "instagram" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "owner_name" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "location" SET DEFAULT 'Valasaravakkam, Chennai';--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "address" SET DEFAULT 'No.63, Radha Avenue Main Road
Valasaravakkam, Chennai - 600087';--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "email" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "whatsapp1" SET DEFAULT '9884217588';--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "customer_care" SET DEFAULT '9884217588';--> statement-breakpoint
UPDATE "settings" SET
  "shop_name" = 'The Signature Café',
  "owner_name" = '',
  "location" = 'Valasaravakkam, Chennai',
  "address" = 'No.63, Radha Avenue Main Road
Valasaravakkam, Chennai - 600087',
  "email" = '',
  "address2" = '',
  "whatsapp1" = '9884217588',
  "whatsapp2" = '',
  "customer_care" = '9884217588',
  "maps_url" = '',
  "instagram" = ''
WHERE "id" = 1;
--> statement-breakpoint
UPDATE "birthday_config" SET "template" = replace("template", E'\nFollow us on Instagram @grace_cafe_valliyur', '');
