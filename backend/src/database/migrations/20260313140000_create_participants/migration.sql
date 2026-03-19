CREATE TYPE "public"."participant_status" AS ENUM('joined', 'cancelled');--> statement-breakpoint
CREATE TABLE "participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"status" "participant_status" DEFAULT 'joined' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_user_id_profiles_uid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_event_user_unique" UNIQUE("event_id", "user_id");--> statement-breakpoint
CREATE INDEX "participants_event_id_idx" ON "participants" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "participants_user_id_idx" ON "participants" USING btree ("user_id");
