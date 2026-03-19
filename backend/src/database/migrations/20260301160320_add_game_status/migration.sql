-- Add status column to games table
ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "status" varchar(20) NOT NULL DEFAULT 'want_to_play';

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS "games_status_idx" ON "games" ("status");

-- Convert existing owned=true games to 'owned' status
UPDATE "games" SET "status" = 'owned' WHERE "owned" = true;

-- Convert existing owned=false games to 'want_to_play' status
UPDATE "games" SET "status" = 'want_to_play' WHERE "owned" = false;

-- Drop the old owned column (optional - keeping for now for backwards compatibility)
-- ALTER TABLE "games" DROP COLUMN "owned";
