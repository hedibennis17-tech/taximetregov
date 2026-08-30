CREATE TYPE "public"."alert_severity" AS ENUM('CRITICAL', 'HIGH', 'WARNING', 'INFO');--> statement-breakpoint
CREATE TYPE "public"."alert_status" AS ENUM('FIRING', 'ACKNOWLEDGED', 'RESOLVED', 'SUPPRESSED');--> statement-breakpoint
CREATE TYPE "public"."config_value_type" AS ENUM('STRING', 'INTEGER', 'DECIMAL', 'BOOLEAN', 'JSON', 'ENCRYPTED');--> statement-breakpoint
CREATE TYPE "public"."feature_flag_state" AS ENUM('DISABLED', 'ENABLED', 'ROLLOUT', 'PILOT_ONLY', 'DEPRECATED');--> statement-breakpoint
CREATE TYPE "public"."incident_severity" AS ENUM('P1_CRITICAL', 'P2_HIGH', 'P3_MEDIUM', 'P4_LOW');--> statement-breakpoint
CREATE TYPE "public"."incident_status" AS ENUM('DETECTED', 'ACKNOWLEDGED', 'INVESTIGATING', 'IDENTIFIED', 'MITIGATING', 'MONITORING', 'RESOLVED', 'CLOSED', 'POST_MORTEM');--> statement-breakpoint
CREATE TYPE "public"."job_priority" AS ENUM('CRITICAL', 'HIGH', 'NORMAL', 'LOW');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'CANCELLED', 'DEAD_LETTER');--> statement-breakpoint
CREATE TYPE "public"."maintenance_window_status" AS ENUM('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."service_status" AS ENUM('HEALTHY', 'DEGRADED', 'DOWN', 'MAINTENANCE', 'UNKNOWN');--> statement-breakpoint
CREATE TABLE "alert_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(60) NOT NULL,
	"service_name" varchar(60),
	"alert_severity" "alert_severity" NOT NULL,
	"threshold_value" numeric(12, 4),
	"threshold_unit" varchar(30),
	"evaluation_window_seconds" integer DEFAULT 300 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notify_channels" text[],
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "alert_rules_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_rule_id" uuid,
	"service_name" varchar(60),
	"alert_severity" "alert_severity" NOT NULL,
	"alert_status" "alert_status" DEFAULT 'FIRING' NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"triggered_value" numeric(12, 4),
	"threshold_value" numeric(12, 4),
	"assigned_to" uuid,
	"acknowledged_by" uuid,
	"acknowledged_at" timestamp with time zone,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"resolution" text,
	"correlation_id" uuid,
	"fired_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "background_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_type" varchar(60) NOT NULL,
	"job_status" "job_status" DEFAULT 'QUEUED' NOT NULL,
	"job_priority" "job_priority" DEFAULT 'NORMAL' NOT NULL,
	"idempotency_key" varchar(100) NOT NULL,
	"input_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"result_summary" jsonb DEFAULT '{}'::jsonb,
	"error_code" varchar(100),
	"error_detail" text,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"next_retry_at" timestamp with time zone,
	"scheduled_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"worker_instance" varchar(60),
	"correlation_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "background_jobs_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(80) NOT NULL,
	"label" varchar(100) NOT NULL,
	"description" text,
	"module" varchar(50) NOT NULL,
	"feature_flag_state" "feature_flag_state" DEFAULT 'DISABLED' NOT NULL,
	"rollout_percentage" integer DEFAULT 0,
	"conditions" jsonb DEFAULT '{}'::jsonb,
	"is_system" boolean DEFAULT false NOT NULL,
	"enabled_by" uuid,
	"enabled_at" timestamp with time zone,
	"disabled_by" uuid,
	"disabled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flags_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "incident_timeline" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"incident_id" uuid NOT NULL,
	"actor_id" uuid,
	"actor_type" varchar(20) DEFAULT 'HUMAN' NOT NULL,
	"action" varchar(60) NOT NULL,
	"comment" text NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_incident_id" varchar(22) NOT NULL,
	"title" varchar(200) NOT NULL,
	"incident_severity" "incident_severity" NOT NULL,
	"incident_status" "incident_status" DEFAULT 'DETECTED' NOT NULL,
	"affected_services" text[] NOT NULL,
	"affected_jurisdictions" text[],
	"impact_description" text,
	"user_impact_count" integer,
	"incident_commander" uuid,
	"assigned_team" varchar(60),
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"acknowledged_at" timestamp with time zone,
	"identified_at" timestamp with time zone,
	"mitigated_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"root_cause" text,
	"resolution_summary" text,
	"financial_data_intact" boolean DEFAULT true NOT NULL,
	"post_mortem_url" varchar(500),
	"post_mortem_done" boolean DEFAULT false NOT NULL,
	"correlation_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "incidents_public_incident_id_unique" UNIQUE("public_incident_id")
);
--> statement-breakpoint
CREATE TABLE "maintenance_windows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"affected_services" text[] NOT NULL,
	"affected_jurisdictions" text[],
	"maintenance_window_status" "maintenance_window_status" DEFAULT 'SCHEDULED' NOT NULL,
	"scheduled_start" timestamp with time zone NOT NULL,
	"scheduled_end" timestamp with time zone NOT NULL,
	"actual_start" timestamp with time zone,
	"actual_end" timestamp with time zone,
	"description" text NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pilot_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pilot_id" varchar(30) NOT NULL,
	"name" varchar(100) NOT NULL,
	"jurisdiction" varchar(10) DEFAULT 'QC' NOT NULL,
	"active_taxi_service" boolean DEFAULT true NOT NULL,
	"active_rideshare_service" boolean DEFAULT true NOT NULL,
	"active_delivery_service" boolean DEFAULT true NOT NULL,
	"active_cities" text[] NOT NULL,
	"max_drivers" integer DEFAULT 50 NOT NULL,
	"current_driver_count" integer DEFAULT 0 NOT NULL,
	"is_pilot" boolean DEFAULT true NOT NULL,
	"regulatory_homologation_ref" varchar(100),
	"start_date" date NOT NULL,
	"end_date" date,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pilot_configurations_pilot_id_unique" UNIQUE("pilot_id")
);
--> statement-breakpoint
CREATE TABLE "service_health_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_name" varchar(60) NOT NULL,
	"service_status" "service_status" DEFAULT 'UNKNOWN' NOT NULL,
	"latency_ms" numeric(8, 2),
	"error_rate_pc" numeric(6, 3),
	"version" varchar(30),
	"instance_id" varchar(60),
	"last_heartbeat_at" timestamp with time zone,
	"dependency_status" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_health_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_name" varchar(60) NOT NULL,
	"service_status" "service_status" NOT NULL,
	"latency_ms" numeric(8, 2),
	"error_rate_pc" numeric(6, 3),
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"jurisdiction" varchar(10) DEFAULT 'GLOBAL' NOT NULL,
	"label" varchar(100) NOT NULL,
	"description" text,
	"module" varchar(50) NOT NULL,
	"value_type" "config_value_type" NOT NULL,
	"value_string" text,
	"value_int" integer,
	"value_decimal" numeric(12, 6),
	"value_bool" boolean,
	"value_json" jsonb,
	"value_encrypted_ref" varchar(200),
	"is_editable" boolean DEFAULT true NOT NULL,
	"is_secret" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_alert_rule_id_alert_rules_id_fk" FOREIGN KEY ("alert_rule_id") REFERENCES "public"."alert_rules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_acknowledged_by_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_enabled_by_users_id_fk" FOREIGN KEY ("enabled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_disabled_by_users_id_fk" FOREIGN KEY ("disabled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_timeline" ADD CONSTRAINT "incident_timeline_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_timeline" ADD CONSTRAINT "incident_timeline_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_incident_commander_users_id_fk" FOREIGN KEY ("incident_commander") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_windows" ADD CONSTRAINT "maintenance_windows_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_configs" ADD CONSTRAINT "system_configs_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_alert_rule_service" ON "alert_rules" USING btree ("service_name");--> statement-breakpoint
CREATE INDEX "idx_alert_rule_severity" ON "alert_rules" USING btree ("alert_severity");--> statement-breakpoint
CREATE INDEX "idx_alert_rule_active" ON "alert_rules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_alert_severity" ON "alerts" USING btree ("alert_severity");--> statement-breakpoint
CREATE INDEX "idx_alert_status" ON "alerts" USING btree ("alert_status");--> statement-breakpoint
CREATE INDEX "idx_alert_service" ON "alerts" USING btree ("service_name");--> statement-breakpoint
CREATE INDEX "idx_alert_assigned" ON "alerts" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "idx_alert_fired" ON "alerts" USING btree ("fired_at");--> statement-breakpoint
CREATE INDEX "idx_alert_correlation" ON "alerts" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "idx_job_type" ON "background_jobs" USING btree ("job_type");--> statement-breakpoint
CREATE INDEX "idx_job_status" ON "background_jobs" USING btree ("job_status");--> statement-breakpoint
CREATE INDEX "idx_job_priority" ON "background_jobs" USING btree ("job_priority");--> statement-breakpoint
CREATE INDEX "idx_job_scheduled" ON "background_jobs" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_job_next_retry" ON "background_jobs" USING btree ("next_retry_at");--> statement-breakpoint
CREATE INDEX "idx_job_correlation" ON "background_jobs" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "idx_ff_key" ON "feature_flags" USING btree ("key");--> statement-breakpoint
CREATE INDEX "idx_ff_state" ON "feature_flags" USING btree ("feature_flag_state");--> statement-breakpoint
CREATE INDEX "idx_ff_module" ON "feature_flags" USING btree ("module");--> statement-breakpoint
CREATE INDEX "idx_incident_timeline_incident" ON "incident_timeline" USING btree ("incident_id");--> statement-breakpoint
CREATE INDEX "idx_incident_timeline_occurred" ON "incident_timeline" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_incident_severity" ON "incidents" USING btree ("incident_severity");--> statement-breakpoint
CREATE INDEX "idx_incident_status" ON "incidents" USING btree ("incident_status");--> statement-breakpoint
CREATE INDEX "idx_incident_detected" ON "incidents" USING btree ("detected_at");--> statement-breakpoint
CREATE INDEX "idx_incident_commander" ON "incidents" USING btree ("incident_commander");--> statement-breakpoint
CREATE INDEX "idx_maint_status" ON "maintenance_windows" USING btree ("maintenance_window_status");--> statement-breakpoint
CREATE INDEX "idx_maint_scheduled_start" ON "maintenance_windows" USING btree ("scheduled_start");--> statement-breakpoint
CREATE INDEX "idx_pilot_jurisdiction" ON "pilot_configurations" USING btree ("jurisdiction");--> statement-breakpoint
CREATE INDEX "idx_pilot_status" ON "pilot_configurations" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_health_service_name" ON "service_health_checks" USING btree ("service_name");--> statement-breakpoint
CREATE INDEX "idx_health_status" ON "service_health_checks" USING btree ("service_status");--> statement-breakpoint
CREATE INDEX "idx_health_checked" ON "service_health_checks" USING btree ("checked_at");--> statement-breakpoint
CREATE INDEX "idx_health_heartbeat" ON "service_health_checks" USING btree ("last_heartbeat_at");--> statement-breakpoint
CREATE INDEX "idx_health_hist_service" ON "service_health_history" USING btree ("service_name");--> statement-breakpoint
CREATE INDEX "idx_health_hist_recorded" ON "service_health_history" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "idx_health_hist_service_recorded" ON "service_health_history" USING btree ("service_name","recorded_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sys_config_key_jurisdiction" ON "system_configs" USING btree ("key","jurisdiction");--> statement-breakpoint
CREATE INDEX "idx_sys_config_module" ON "system_configs" USING btree ("module");--> statement-breakpoint
CREATE INDEX "idx_sys_config_secret" ON "system_configs" USING btree ("is_secret");