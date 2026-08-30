CREATE TYPE "public"."event_status" AS ENUM('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED', 'SKIPPED', 'DEAD_LETTER');--> statement-breakpoint
CREATE TYPE "public"."system_event_type" AS ENUM('DRIVER_REGISTERED', 'DRIVER_VERIFIED', 'DRIVER_SUSPENDED', 'DRIVER_ACTIVATED', 'VEHICLE_ADDED', 'VEHICLE_APPROVED', 'DOCUMENT_UPLOADED', 'DOCUMENT_VERIFIED', 'TRIP_CREATED', 'TRIP_STARTED', 'TRIP_COMPLETED', 'TRIP_CANCELLED', 'PAYMENT_SUCCEEDED', 'PAYMENT_FAILED', 'WALLET_CREDITED', 'PAYOUT_REQUESTED', 'PAYOUT_COMPLETED', 'PROVIDER_EVENT_RECEIVED', 'PROVIDER_ACTIVITY_CREATED', 'PROVIDER_ACCOUNT_CONNECTED', 'TAX_PERIOD_CLOSED', 'TAX_CALCULATION_COMPLETED', 'SECURITY_EVENT', 'AUTH_EVENT', 'COMPLIANCE_CHECK_COMPLETED', 'WEBHOOK_RECEIVED', 'WEBHOOK_PROCESSED', 'WEBHOOK_FAILED', 'WEBHOOK_DEAD_LETTER', 'SYNC_COMPLETED', 'SYNC_FAILED', 'SYSTEM_HEALTH_DEGRADED', 'SYSTEM_HEALTH_RESTORED');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('PUSH', 'EMAIL', 'SMS', 'IN_APP', 'WEBHOOK');--> statement-breakpoint
CREATE TYPE "public"."notification_priority" AS ENUM('CRITICAL', 'HIGH', 'NORMAL', 'LOW');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('PENDING', 'QUEUED', 'SENDING', 'DELIVERED', 'READ', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('SECURITY_ALERT', 'NEW_DEVICE_LOGIN', 'ACCOUNT_LOCKED', 'PASSWORD_CHANGED', 'SUSPICIOUS_ACTIVITY', 'ACCOUNT_APPROVED', 'ACCOUNT_SUSPENDED', 'VERIFICATION_REQUIRED', 'TRIP_STARTED', 'TRIP_COMPLETED', 'TRIP_CANCELLED', 'TRIP_DISPUTED', 'PAYMENT_RECEIVED', 'PAYMENT_FAILED', 'PAYOUT_COMPLETED', 'PAYOUT_FAILED', 'REFUND_PROCESSED', 'DOCUMENT_APPROVED', 'DOCUMENT_REJECTED', 'DOCUMENT_EXPIRING', 'DOCUMENT_EXPIRED', 'PROVIDER_CONNECTED', 'PROVIDER_DISCONNECTED', 'PROVIDER_REAUTH_REQUIRED', 'TAX_PERIOD_OPEN', 'TAX_FILING_DUE', 'TAX_FILING_ACCEPTED', 'COMPLIANCE_REQUIRED', 'COMPLIANCE_APPROVED', 'SYSTEM_MAINTENANCE', 'SYSTEM_ANNOUNCEMENT');--> statement-breakpoint
CREATE TYPE "public"."pref_channel" AS ENUM('PUSH', 'EMAIL', 'SMS', 'IN_APP');--> statement-breakpoint
CREATE TYPE "public"."sync_queue_status" AS ENUM('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETRYING', 'CANCELLED', 'DEAD_LETTER');--> statement-breakpoint
CREATE TYPE "public"."webhook_delivery_status" AS ENUM('PENDING', 'SENDING', 'DELIVERED', 'FAILED', 'RETRYING', 'DEAD_LETTER');--> statement-breakpoint
CREATE TABLE "dead_letter_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_type" varchar(30) NOT NULL,
	"source_id" uuid NOT NULL,
	"failure_code" varchar(100),
	"failure_detail" text,
	"total_attempts" integer DEFAULT 0 NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by" uuid,
	"resolution_note" text,
	"requires_manual_review" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"subscribed_events" text[] NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"push_enabled" boolean DEFAULT true NOT NULL,
	"push_token" text,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"sms_enabled" boolean DEFAULT false NOT NULL,
	"in_app_enabled" boolean DEFAULT true NOT NULL,
	"disabled_types" text[],
	"preferred_language" varchar(5) DEFAULT 'fr' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_notification_id" varchar(22) NOT NULL,
	"user_id" uuid NOT NULL,
	"driver_id" uuid,
	"notif_type" "notification_type" NOT NULL,
	"priority" "notification_priority" DEFAULT 'NORMAL' NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"status" "notification_status" DEFAULT 'PENDING' NOT NULL,
	"title_fr" varchar(200) NOT NULL,
	"title_en" varchar(200),
	"body_fr" text NOT NULL,
	"body_en" text,
	"action_url" varchar(500),
	"correlation_id" uuid,
	"source_event_id" uuid,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"failure_code" varchar(50),
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"next_retry_at" timestamp with time zone,
	"is_mandatory" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_public_notification_id_unique" UNIQUE("public_notification_id")
);
--> statement-breakpoint
CREATE TABLE "sync_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"operation_type" varchar(60) NOT NULL,
	"priority" "notification_priority" DEFAULT 'NORMAL' NOT NULL,
	"sync_queue_status" "sync_queue_status" DEFAULT 'QUEUED' NOT NULL,
	"resource_type" varchar(50),
	"resource_id" varchar(100),
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"next_attempt_at" timestamp with time zone,
	"last_attempt_at" timestamp with time zone,
	"error_code" varchar(100),
	"error_detail" text,
	"correlation_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"parent_sync_id" uuid,
	"created_offline_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar(100) NOT NULL,
	"source_service" varchar(50) NOT NULL,
	"event_type" "system_event_type" NOT NULL,
	"priority" "notification_priority" DEFAULT 'NORMAL' NOT NULL,
	"event_status" "event_status" DEFAULT 'PENDING' NOT NULL,
	"actor_id" uuid,
	"actor_role" varchar(50),
	"driver_id" uuid,
	"resource_type" varchar(50),
	"resource_id" varchar(100),
	"correlation_id" uuid NOT NULL,
	"parent_event_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"processed_at" timestamp with time zone,
	"failure_code" varchar(100),
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"next_retry_at" timestamp with time zone,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_delivery_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"external_event_id" varchar(200) NOT NULL,
	"payload_hash" varchar(64) NOT NULL,
	"payload_size" integer,
	"signature_verified" boolean DEFAULT false NOT NULL,
	"signature_method" varchar(50),
	"delivery_status" "webhook_delivery_status" DEFAULT 'PENDING' NOT NULL,
	"http_status_code" integer,
	"response_time_ms" integer,
	"attempt_count" integer DEFAULT 1 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"next_retry_at" timestamp with time zone,
	"last_attempt_at" timestamp with time zone,
	"dead_letter_reason" text,
	"correlation_id" uuid,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint_url_encrypted" text NOT NULL,
	"endpoint_url_enc_key_ver" varchar(20),
	"signing_secret_encrypted" text NOT NULL,
	"signing_secret_enc_key_ver" varchar(20),
	"subscribed_events" text[] NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_success_at" timestamp with time zone,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deactivated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "dead_letter_queue" ADD CONSTRAINT "dead_letter_queue_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_queue" ADD CONSTRAINT "sync_queue_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_events" ADD CONSTRAINT "system_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_events" ADD CONSTRAINT "system_events_driver_id_driver_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_delivery_log" ADD CONSTRAINT "webhook_delivery_log_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_subscriptions" ADD CONSTRAINT "webhook_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_dlq_source" ON "dead_letter_queue" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "idx_dlq_source_type" ON "dead_letter_queue" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "idx_dlq_resolved" ON "dead_letter_queue" USING btree ("resolved_at");--> statement-breakpoint
CREATE INDEX "idx_dlq_review" ON "dead_letter_queue" USING btree ("requires_manual_review");--> statement-breakpoint
CREATE INDEX "idx_event_sub_active" ON "event_subscriptions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_notif_pref_user" ON "notification_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notif_user" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notif_driver" ON "notifications" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_notif_type" ON "notifications" USING btree ("notif_type");--> statement-breakpoint
CREATE INDEX "idx_notif_status" ON "notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_notif_priority" ON "notifications" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_notif_created" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_notif_correlation" ON "notifications" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "idx_sync_queue_driver" ON "sync_queue" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_sync_queue_status" ON "sync_queue" USING btree ("sync_queue_status");--> statement-breakpoint
CREATE INDEX "idx_sync_queue_priority" ON "sync_queue" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_sync_queue_operation" ON "sync_queue" USING btree ("operation_type");--> statement-breakpoint
CREATE INDEX "idx_sync_queue_next_attempt" ON "sync_queue" USING btree ("next_attempt_at");--> statement-breakpoint
CREATE INDEX "idx_sync_queue_correlation" ON "sync_queue" USING btree ("correlation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sys_event_idempotency" ON "system_events" USING btree ("source_service","event_id");--> statement-breakpoint
CREATE INDEX "idx_sys_event_type" ON "system_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_sys_event_status" ON "system_events" USING btree ("event_status");--> statement-breakpoint
CREATE INDEX "idx_sys_event_driver" ON "system_events" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_sys_event_correlation" ON "system_events" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "idx_sys_event_occurred" ON "system_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_sys_event_priority" ON "system_events" USING btree ("priority");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_webhook_log_idempotency" ON "webhook_delivery_log" USING btree ("provider_id","external_event_id");--> statement-breakpoint
CREATE INDEX "idx_webhook_log_provider" ON "webhook_delivery_log" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_webhook_log_status" ON "webhook_delivery_log" USING btree ("delivery_status");--> statement-breakpoint
CREATE INDEX "idx_webhook_log_received" ON "webhook_delivery_log" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "idx_webhook_log_correlation" ON "webhook_delivery_log" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "idx_webhook_sub_user" ON "webhook_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_webhook_sub_active" ON "webhook_subscriptions" USING btree ("is_active");