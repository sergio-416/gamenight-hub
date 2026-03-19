CREATE TYPE "public"."venue_type" AS ENUM('cafe', 'store', 'home', 'public_space', 'other');--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"bgg_id" integer,
	"year_published" integer,
	"min_players" integer,
	"max_players" integer,
	"playing_time" integer,
	"min_age" integer,
	"description" text,
	"categories" text[],
	"mechanics" text[],
	"publisher" text,
	"owned" boolean DEFAULT false NOT NULL,
	"notes" text,
	"complexity" integer,
	"created_by" text NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"address" text,
	"venue_type" "venue_type",
	"capacity" integer,
	"amenities" text[],
	"description" text,
	"host_name" text,
	"created_by" text NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"game_id" uuid,
	"location_id" uuid NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"max_players" integer,
	"description" text,
	"color" text,
	"created_by" text NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bgg_games" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"rank" integer,
	"avg_rating" numeric(5, 2),
	"year_published" integer,
	"geek_rating" numeric(5, 2)
);
--> statement-breakpoint
CREATE INDEX "games_created_by_idx" ON "games" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "games_bgg_id_idx" ON "games" USING btree ("bgg_id");--> statement-breakpoint
CREATE INDEX "locations_created_by_idx" ON "locations" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "locations_coords_idx" ON "locations" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "events_created_by_idx" ON "events" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "events_start_time_idx" ON "events" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "events_location_id_idx" ON "events" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "bgg_games_name_idx" ON "bgg_games" USING btree ("name");
