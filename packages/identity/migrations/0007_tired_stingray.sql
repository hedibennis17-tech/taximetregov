CREATE TYPE "public"."trip_adjustment_type" AS ENUM('FARE_CORRECTION', 'ROUNDING_CORRECTION', 'AUTHORIZED_SURCHARGE', 'REFUND_ADJUSTMENT', 'GOVERNMENT_CORRECTION', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."fare_component_type" AS ENUM('BASE_FARE', 'DISTANCE_RATE', 'TIME_RATE', 'WAITING_RATE', 'MINIMUM_FARE', 'SURCHARGE', 'AIRPORT_FEE', 'OTHER_REGULATED_FEE');--> statement-breakpoint
CREATE TYPE "public"."gps_anomaly_type" AS ENUM('GPS_LOST', 'LOW_ACCURACY', 'IMPOSSIBLE_SPEED', 'TELEPORTATION', 'MISSING_POINTS', 'SUSPICIOUS_ROUTE', 'CLOCK_ANOMALY');--> statement-breakpoint
CREATE TYPE "public"."gps_source" AS ENUM('DEVICE_GPS', 'NETWORK', 'FUSED', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."meter_event_type" AS ENUM('TAXIMETER_ACTIVATED', 'TAXIMETER_DEACTIVATED', 'TAXIMETER_LOCKED', 'TAXIMETER_SUSPENDED', 'TRIP_CREATED', 'TRIP_STARTED', 'TRIP_PAUSED', 'TRIP_RESUMED', 'TRIP_COMPLETED', 'TRIP_CANCELLED', 'TRIP_VOIDED', 'TARIFF_APPLIED', 'GPS_STARTED', 'GPS_LOST', 'GPS_RESTORED', 'METER_ERROR', 'ANOMALY_DETECTED', 'ADJUSTMENT_APPLIED');--> statement-breakpoint
CREATE TYPE "public"."taximeter_instance_status" AS ENUM('OFFLINE', 'READY', 'IN_TRIP', 'SUSPENDED', 'LOCKED');--> statement-breakpoint
CREATE TYPE "public"."taximeter_mode" AS ENUM('OFF', 'AVAILABLE', 'OCCUPIED', 'PAUSED', 'COMPLETED', 'ERROR');--> statement-breakpoint
CREATE TYPE "public"."trip_integrity_status" AS ENUM('NORMAL', 'WARNING', 'REVIEW_REQUIRED', 'SUSPICIOUS', 'VERIFIED');--> statement-breakpoint
CREATE TYPE "public"."taxi_trip_status" AS ENUM('CREATED', 'STARTED', 'PAUSED', 'RESUMED', 'COMPLETED', 'CANCELLED', 'VOIDED', 'DISPUTED');--> statement-breakpoint
CREATE TABLE "fare_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" varchar(30) NOT NULL,
	"jurisdiction" varchar(10) DEFAULT 'QC' NOT NULL,
	"currency" varchar(3) DEFAULT 'CAD' NOT NULL,
	"label" varchar(100) NOT NULL,
	"base_fare" numeric(12, 2) NOT NULL,
	"distance_rate_per_100m" numeric(12, 4) NOT NULL,
	"time_rate_per_minute" numeric(12, 4) NOT NULL,
	"waiting_rate_per_minute" numeric(12, 4) NOT NULL,
	"minimum_fare" numeric(12, 2) NOT NULL,
	"airport_surcharge" numeric(12, 2) DEFAULT '0',
	"night_surcharge" numeric(12, 2) DEFAULT '0',
	"effective_from" varchar(10) NOT NULL,
	"effective_until" varchar(10),
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"is_active" boolean DEFAULT false NOT NULL,
	"is_pilot" boolean DEFAULT true NOT NULL,
	"source_reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxi_meter_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid,
	"taximeter_id" uuid,
	"driver_id" uuid,
	"event_type" "meter_event_type" NOT NULL,
	"event_sequence" integer,
	"previous_state" varchar(30),
	"new_state" varchar(30),
	"command_id" varchar(60),
	"device_id" varchar(100),
	"app_version" varchar(20),
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "taxi_meter_events_command_id_unique" UNIQUE("command_id")
);
--> statement-breakpoint
CREATE TABLE "taxi_trip_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"adjustment_type" "trip_adjustment_type" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'CAD' NOT NULL,
	"reason" text NOT NULL,
	"created_by" uuid,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxi_trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_trip_id" varchar(20) NOT NULL,
	"trip_reference" varchar(30) NOT NULL,
	"taximeter_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"trip_status" "taxi_trip_status" DEFAULT 'CREATED' NOT NULL,
	"trip_integrity_status" "trip_integrity_status" DEFAULT 'NORMAL' NOT NULL,
	"fare_configuration_id" uuid,
	"fare_version" varchar(30),
	"jurisdiction" varchar(10) DEFAULT 'QC' NOT NULL,
	"currency" varchar(3) DEFAULT 'CAD' NOT NULL,
	"started_at" timestamp with time zone,
	"paused_at" timestamp with time zone,
	"resumed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"distance_meters" integer DEFAULT 0 NOT NULL,
	"elapsed_seconds" integer DEFAULT 0 NOT NULL,
	"waiting_seconds" integer DEFAULT 0 NOT NULL,
	"estimated_amount" numeric(12, 2),
	"final_amount" numeric(12, 2),
	"receipt_reference" varchar(30),
	"start_command_id" varchar(60),
	"complete_command_id" varchar(60),
	"device_id" varchar(100),
	"app_version" varchar(20),
	"fare_snapshot" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "taxi_trips_public_trip_id_unique" UNIQUE("public_trip_id"),
	CONSTRAINT "taxi_trips_trip_reference_unique" UNIQUE("trip_reference"),
	CONSTRAINT "taxi_trips_receipt_reference_unique" UNIQUE("receipt_reference"),
	CONSTRAINT "taxi_trips_start_command_id_unique" UNIQUE("start_command_id"),
	CONSTRAINT "taxi_trips_complete_command_id_unique" UNIQUE("complete_command_id")
);
--> statement-breakpoint
CREATE TABLE "taximeters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_taximeter_id" varchar(20) NOT NULL,
	"driver_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"status" "taximeter_instance_status" DEFAULT 'OFFLINE' NOT NULL,
	"current_mode" "taximeter_mode" DEFAULT 'OFF' NOT NULL,
	"jurisdiction" varchar(10) DEFAULT 'QC' NOT NULL,
	"device_id" varchar(100),
	"app_version" varchar(20),
	"activated_at" timestamp with time zone,
	"deactivated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "taximeters_public_taximeter_id_unique" UNIQUE("public_taximeter_id")
);
--> statement-breakpoint
CREATE TABLE "trip_gps_anomalies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"anomaly_type" "gps_anomaly_type" NOT NULL,
	"gps_point_id" uuid,
	"description" text NOT NULL,
	"severity" varchar(20) DEFAULT 'WARNING' NOT NULL,
	"review_required" boolean DEFAULT true NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_decision" varchar(30),
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_gps_points" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"server_timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"client_timestamp" timestamp with time zone,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"accuracy_meters" numeric(8, 2),
	"speed_mps" numeric(8, 3),
	"heading" numeric(6, 2),
	"altitude" numeric(8, 2),
	"gps_source" "gps_source" DEFAULT 'DEVICE_GPS' NOT NULL,
	"event_sequence" integer NOT NULL,
	"is_filtered" boolean DEFAULT false NOT NULL,
	"filter_reason" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_meter_readings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"server_timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"distance_meters" integer DEFAULT 0 NOT NULL,
	"elapsed_seconds" integer DEFAULT 0 NOT NULL,
	"waiting_seconds" integer DEFAULT 0 NOT NULL,
	"running_amount" numeric(12, 2),
	"currency" varchar(3),
	"meter_status" varchar(20),
	"event_sequence" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fare_configurations" ADD CONSTRAINT "fare_configurations_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxi_meter_events" ADD CONSTRAINT "taxi_meter_events_trip_id_taxi_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."taxi_trips"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxi_meter_events" ADD CONSTRAINT "taxi_meter_events_taximeter_id_taximeters_id_fk" FOREIGN KEY ("taximeter_id") REFERENCES "public"."taximeters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxi_meter_events" ADD CONSTRAINT "taxi_meter_events_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxi_trip_adjustments" ADD CONSTRAINT "taxi_trip_adjustments_trip_id_taxi_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."taxi_trips"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxi_trip_adjustments" ADD CONSTRAINT "taxi_trip_adjustments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxi_trip_adjustments" ADD CONSTRAINT "taxi_trip_adjustments_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxi_trips" ADD CONSTRAINT "taxi_trips_taximeter_id_taximeters_id_fk" FOREIGN KEY ("taximeter_id") REFERENCES "public"."taximeters"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxi_trips" ADD CONSTRAINT "taxi_trips_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxi_trips" ADD CONSTRAINT "taxi_trips_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxi_trips" ADD CONSTRAINT "taxi_trips_fare_configuration_id_fare_configurations_id_fk" FOREIGN KEY ("fare_configuration_id") REFERENCES "public"."fare_configurations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taximeters" ADD CONSTRAINT "taximeters_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taximeters" ADD CONSTRAINT "taximeters_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_gps_anomalies" ADD CONSTRAINT "trip_gps_anomalies_trip_id_taxi_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."taxi_trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_gps_anomalies" ADD CONSTRAINT "trip_gps_anomalies_gps_point_id_trip_gps_points_id_fk" FOREIGN KEY ("gps_point_id") REFERENCES "public"."trip_gps_points"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_gps_anomalies" ADD CONSTRAINT "trip_gps_anomalies_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_gps_points" ADD CONSTRAINT "trip_gps_points_trip_id_taxi_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."taxi_trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_meter_readings" ADD CONSTRAINT "trip_meter_readings_trip_id_taxi_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."taxi_trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_fare_config_version" ON "fare_configurations" USING btree ("version");--> statement-breakpoint
CREATE INDEX "idx_fare_config_jurisdiction" ON "fare_configurations" USING btree ("jurisdiction");--> statement-breakpoint
CREATE INDEX "idx_fare_config_active" ON "fare_configurations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_fare_config_effective" ON "fare_configurations" USING btree ("effective_from","effective_until");--> statement-breakpoint
CREATE INDEX "idx_meter_event_trip" ON "taxi_meter_events" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "idx_meter_event_taximeter" ON "taxi_meter_events" USING btree ("taximeter_id");--> statement-breakpoint
CREATE INDEX "idx_meter_event_driver" ON "taxi_meter_events" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_meter_event_type" ON "taxi_meter_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_meter_event_seq" ON "taxi_meter_events" USING btree ("trip_id","event_sequence");--> statement-breakpoint
CREATE INDEX "idx_meter_event_occurred" ON "taxi_meter_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_trip_adj_trip" ON "taxi_trip_adjustments" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "idx_trip_adj_type" ON "taxi_trip_adjustments" USING btree ("adjustment_type");--> statement-breakpoint
CREATE INDEX "idx_taxi_trip_driver" ON "taxi_trips" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_taxi_trip_vehicle" ON "taxi_trips" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "idx_taxi_trip_taximeter" ON "taxi_trips" USING btree ("taximeter_id");--> statement-breakpoint
CREATE INDEX "idx_taxi_trip_status" ON "taxi_trips" USING btree ("trip_status");--> statement-breakpoint
CREATE INDEX "idx_taxi_trip_started" ON "taxi_trips" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_taxi_trip_reference" ON "taxi_trips" USING btree ("trip_reference");--> statement-breakpoint
CREATE INDEX "idx_taxi_trip_driver_active" ON "taxi_trips" USING btree ("driver_id","trip_status");--> statement-breakpoint
CREATE INDEX "idx_taximeter_driver" ON "taximeters" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_taximeter_vehicle" ON "taximeters" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "idx_taximeter_status" ON "taximeters" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_gps_anomaly_trip" ON "trip_gps_anomalies" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "idx_gps_anomaly_type" ON "trip_gps_anomalies" USING btree ("anomaly_type");--> statement-breakpoint
CREATE INDEX "idx_gps_anomaly_review" ON "trip_gps_anomalies" USING btree ("review_required");--> statement-breakpoint
CREATE INDEX "idx_gps_trip" ON "trip_gps_points" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "idx_gps_trip_seq" ON "trip_gps_points" USING btree ("trip_id","event_sequence");--> statement-breakpoint
CREATE INDEX "idx_gps_server_ts" ON "trip_gps_points" USING btree ("server_timestamp");--> statement-breakpoint
CREATE INDEX "idx_meter_reading_trip" ON "trip_meter_readings" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "idx_meter_reading_seq" ON "trip_meter_readings" USING btree ("trip_id","event_sequence");