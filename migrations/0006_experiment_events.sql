CREATE TABLE IF NOT EXISTS "experimentEvent" (
  "eventId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" varchar(100) NOT NULL,
  "variant" varchar(20) NOT NULL,
  "event" varchar(20) NOT NULL,
  "meta" jsonb,
  "createdAt" timestamp NOT NULL DEFAULT now()
);
