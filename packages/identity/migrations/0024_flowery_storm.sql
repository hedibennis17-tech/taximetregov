CREATE TYPE "public"."driver_presence_status" AS ENUM('OFFLINE', 'ONLINE');--> statement-breakpoint
CREATE TABLE "driver_presences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"status" "driver_presence_status" DEFAULT 'OFFLINE' NOT NULL,
	"location_label" varchar(100),
	"last_online_at" timestamp with time zone,
	"last_offline_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "driver_presences_driver_id_unique" UNIQUE("driver_id")
);
--> statement-breakpoint
ALTER TABLE "driver_presences" ADD CONSTRAINT "driver_presences_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_driver_presences_status" ON "driver_presences" USING btree ("status");