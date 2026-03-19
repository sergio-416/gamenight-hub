-- Create user_played_games table for tracking played game history
-- This is an append-only table - records should never be deleted

CREATE TABLE IF NOT EXISTS "user_played_games" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL,
    "game_id" uuid NOT NULL,
    "played_at" timestamptz NOT NULL DEFAULT NOW(),
    "created_at" timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE("user_id", "game_id")
);

-- Index for querying played games by user
CREATE INDEX IF NOT EXISTS "user_played_games_user_id_idx" ON "user_played_games" ("user_id");

-- Index for querying played games by game
CREATE INDEX IF NOT EXISTS "user_played_games_game_id_idx" ON "user_played_games" ("game_id");
