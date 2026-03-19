ALTER TABLE "bgg_games" ADD COLUMN "is_expansion" boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "is_expansion" boolean NOT NULL DEFAULT false;
