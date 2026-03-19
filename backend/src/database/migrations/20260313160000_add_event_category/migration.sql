CREATE TYPE "public"."event_category" AS ENUM('strategy', 'rpg', 'party', 'classic', 'cooperative', 'trivia', 'miniatures', 'family', 'other');--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "category" "event_category";
