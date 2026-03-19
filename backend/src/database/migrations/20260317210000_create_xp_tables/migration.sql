CREATE TYPE "public"."xp_action" AS ENUM('game_added', 'event_created', 'participant_joined');--> statement-breakpoint
CREATE TABLE "xp_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"xp_total" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"streak_weeks" integer DEFAULT 0 NOT NULL,
	"last_activity_at" timestamp,
	"monthly_game_adds" integer DEFAULT 0 NOT NULL,
	"monthly_game_adds_reset_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "xp_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"action" "xp_action" NOT NULL,
	"base_xp" integer NOT NULL,
	"multiplier" numeric(5, 4) DEFAULT '1.0000' NOT NULL,
	"final_xp" integer NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"daily_action_total" integer NOT NULL,
	"daily_grand_total" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "xp_profiles" ADD CONSTRAINT "xp_profiles_user_id_profiles_uid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_transactions" ADD CONSTRAINT "xp_transactions_user_id_profiles_uid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "xp_profiles_level_idx" ON "xp_profiles" USING btree ("level");--> statement-breakpoint
CREATE INDEX "xp_transactions_user_created_idx" ON "xp_transactions" USING btree ("user_id", "created_at");--> statement-breakpoint
CREATE INDEX "xp_transactions_user_action_created_idx" ON "xp_transactions" USING btree ("user_id", "action", "created_at");
