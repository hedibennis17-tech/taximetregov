// ================================================================
// TAXIMÈTRE.GOV — NOTIFICATIONS, EVENTS & WEBHOOKS SCHEMA
// Database Phase 10/20 — Notifications · EventBus · Webhooks · Sync
// ================================================================
//
// RÈGLES ABSOLUES:
// 1. event_id UNIQUE par source → idempotency (jamais traité deux fois)
// 2. DEAD_LETTER = fin de chaîne retry · jamais supprimé · analysable
// 3. Payload webhook: hash(SHA-256) stocké · payload brut jamais en clair
// 4. Notification sécurité: OBLIGATOIRE (jamais opt-out)
// 5. Driver A ne reçoit jamais notifications Driver B (resource auth)
// 6. correlation_id: trace end-to-end de chaque flux d'événement
// 7. Logs: jamais password/token/NAS/données sensibles
// 8. Retry: backoff exponentiel configurable · jamais boucle infinie
// ================================================================

import {
  pgTable, pgEnum, uuid, text, boolean, integer,
  timestamp, jsonb, uniqueIndex, index, varchar, numeric,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users }          from './auth.schema'
import { driverProfiles } from './profiles.schema'
import { providers }      from './providers.schema'

// ─── ENUMS ───────────────────────────────────────────────────

export const notificationChannelEnum = pgEnum('notification_channel', [
  'PUSH',
  'EMAIL',
  'SMS',
  'IN_APP',
  'WEBHOOK',
])

export const notificationPriorityEnum = pgEnum('notification_priority', [
  'CRITICAL',  // Security events — NEVER opt-out
  'HIGH',      // Document expiry, payment failures
  'NORMAL',    // Trip completion, routine updates
  'LOW',       // Marketing, tips, informational
])

export const notificationStatusEnum = pgEnum('notification_status', [
  'PENDING',
  'QUEUED',
  'SENDING',
  'DELIVERED',
  'READ',
  'FAILED',
  'CANCELLED',
])

export const notificationTypeEnum = pgEnum('notification_type', [
  // Security — ALWAYS sent, cannot be opted out
  'SECURITY_ALERT',
  'NEW_DEVICE_LOGIN',
  'ACCOUNT_LOCKED',
  'PASSWORD_CHANGED',
  'SUSPICIOUS_ACTIVITY',
  // Account
  'ACCOUNT_APPROVED',
  'ACCOUNT_SUSPENDED',
  'VERIFICATION_REQUIRED',
  // Trip
  'TRIP_STARTED',
  'TRIP_COMPLETED',
  'TRIP_CANCELLED',
  'TRIP_DISPUTED',
  // Payment
  'PAYMENT_RECEIVED',
  'PAYMENT_FAILED',
  'PAYOUT_COMPLETED',
  'PAYOUT_FAILED',
  'REFUND_PROCESSED',
  // Document
  'DOCUMENT_APPROVED',
  'DOCUMENT_REJECTED',
  'DOCUMENT_EXPIRING',
  'DOCUMENT_EXPIRED',
  // Provider
  'PROVIDER_CONNECTED',
  'PROVIDER_DISCONNECTED',
  'PROVIDER_REAUTH_REQUIRED',
  // Tax
  'TAX_PERIOD_OPEN',
  'TAX_FILING_DUE',
  'TAX_FILING_ACCEPTED',
  // Compliance
  'COMPLIANCE_REQUIRED',
  'COMPLIANCE_APPROVED',
  // System
  'SYSTEM_MAINTENANCE',
  'SYSTEM_ANNOUNCEMENT',
])

export const eventTypeEnum = pgEnum('system_event_type', [
  // Driver lifecycle
  'DRIVER_REGISTERED',
  'DRIVER_VERIFIED',
  'DRIVER_SUSPENDED',
  'DRIVER_ACTIVATED',
  // Vehicle
  'VEHICLE_ADDED',
  'VEHICLE_APPROVED',
  // Document
  'DOCUMENT_UPLOADED',
  'DOCUMENT_VERIFIED',
  // Trip
  'TRIP_CREATED',
  'TRIP_STARTED',
  'TRIP_COMPLETED',
  'TRIP_CANCELLED',
  // Payment
  'PAYMENT_SUCCEEDED',
  'PAYMENT_FAILED',
  'WALLET_CREDITED',
  'PAYOUT_REQUESTED',
  'PAYOUT_COMPLETED',
  // Provider
  'PROVIDER_EVENT_RECEIVED',
  'PROVIDER_ACTIVITY_CREATED',
  'PROVIDER_ACCOUNT_CONNECTED',
  // Tax
  'TAX_PERIOD_CLOSED',
  'TAX_CALCULATION_COMPLETED',
  // Security
  'SECURITY_EVENT',
  'AUTH_EVENT',
  // Compliance
  'COMPLIANCE_CHECK_COMPLETED',
  // Webhook
  'WEBHOOK_RECEIVED',
  'WEBHOOK_PROCESSED',
  'WEBHOOK_FAILED',
  'WEBHOOK_DEAD_LETTER',
  // Sync
  'SYNC_COMPLETED',
  'SYNC_FAILED',
  // System
  'SYSTEM_HEALTH_DEGRADED',
  'SYSTEM_HEALTH_RESTORED',
])

export const eventStatusEnum = pgEnum('event_status', [
  'PENDING',
  'PROCESSING',
  'PROCESSED',
  'FAILED',
  'SKIPPED',       // Intentionally skipped (e.g. duplicate)
  'DEAD_LETTER',   // Max retries exhausted — preserved for analysis
])

export const webhookDeliveryStatusEnum = pgEnum('webhook_delivery_status', [
  'PENDING',
  'SENDING',
  'DELIVERED',    // 2xx response received
  'FAILED',       // Non-2xx or timeout
  'RETRYING',
  'DEAD_LETTER',  // Max retries exhausted
])

export const syncQueueStatusEnum = pgEnum('sync_queue_status', [
  'QUEUED',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'RETRYING',
  'CANCELLED',
  'DEAD_LETTER',
])

export const preferenceChannelEnum = pgEnum('pref_channel', [
  'PUSH',
  'EMAIL',
  'SMS',
  'IN_APP',
])

// ─── NOTIFICATION PREFERENCES ─────────────────────────────────

export const notificationPreferences = pgTable('notification_preferences', {
  id:       uuid('id').primaryKey().defaultRandom(),
  userId:   uuid('user_id').notNull().unique()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Push
  pushEnabled:  boolean('push_enabled').notNull().default(true),
  pushToken:    text('push_token'),
  // Device push token — encrypted at application layer

  // Email
  emailEnabled: boolean('email_enabled').notNull().default(true),

  // SMS
  smsEnabled:   boolean('sms_enabled').notNull().default(false),

  // In-app
  inAppEnabled: boolean('in_app_enabled').notNull().default(true),

  // Granular type preferences (LOW priority only — CRITICAL never opts out)
  disabledTypes: text('disabled_types').array(),
  // Types the user has muted — SECURITY types ignored (always sent)

  // Language
  preferredLanguage: varchar('preferred_language', { length: 5 }).notNull().default('fr'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_notif_pref_user').on(t.userId),
])

// ─── NOTIFICATIONS ────────────────────────────────────────────

export const notifications = pgTable('notifications', {
  id:     uuid('id').primaryKey().defaultRandom(),
  publicNotificationId: varchar('public_notification_id', { length: 22 }).notNull().unique(),
  // Format: NTF-XXXXXXXX

  userId:   uuid('user_id').notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  driverId: uuid('driver_id')
    .references(() => driverProfiles.id, { onDelete: 'cascade' }),
  // Driver-specific notifications have driverId set

  notifType: notificationTypeEnum('notif_type').notNull(),
  priority:  notificationPriorityEnum('priority').notNull().default('NORMAL'),
  channel:   notificationChannelEnum('channel').notNull(),
  status:    notificationStatusEnum('status').notNull().default('PENDING'),

  // Content — localized
  titleFr: varchar('title_fr', { length: 200 }).notNull(),
  titleEn: varchar('title_en', { length: 200 }),
  bodyFr:  text('body_fr').notNull(),
  bodyEn:  text('body_en'),

  // Deep link for in-app navigation
  actionUrl: varchar('action_url', { length: 500 }),
  // e.g. 'taximetregov://trips/TRP-00001234'

  // Source correlation
  correlationId: uuid('correlation_id'),
  sourceEventId: uuid('source_event_id'),

  sentAt:      timestamp('sent_at',      { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  readAt:      timestamp('read_at',      { withTimezone: true }),
  failedAt:    timestamp('failed_at',    { withTimezone: true }),
  failureCode: varchar('failure_code',   { length: 50 }),

  // Retry tracking
  attemptCount: integer('attempt_count').notNull().default(0),
  nextRetryAt:  timestamp('next_retry_at', { withTimezone: true }),

  // CRITICAL: security notifications always sent regardless of preferences
  isMandatory: boolean('is_mandatory').notNull().default(false),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_notif_user').on(t.userId),
  index('idx_notif_driver').on(t.driverId),
  index('idx_notif_type').on(t.notifType),
  index('idx_notif_status').on(t.status),
  index('idx_notif_priority').on(t.priority),
  index('idx_notif_created').on(t.createdAt),
  index('idx_notif_correlation').on(t.correlationId),
])

// ─── SYSTEM EVENT BUS ────────────────────────────────────────

export const systemEvents = pgTable('system_events', {
  id:      uuid('id').primaryKey().defaultRandom(),
  eventId: varchar('event_id', { length: 100 }).notNull(),
  // Source-provided unique event identifier
  // UNIQUE(source_service, event_id) → idempotency

  sourceService: varchar('source_service', { length: 50 }).notNull(),
  // 'taximeter' | 'payment' | 'webhook' | 'auth' | etc.

  eventType: eventTypeEnum('event_type').notNull(),
  priority:  notificationPriorityEnum('priority').notNull().default('NORMAL'),
  status:    eventStatusEnum('event_status').notNull().default('PENDING'),

  // Actor (who triggered this event)
  actorId:   uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
  actorRole: varchar('actor_role', { length: 50 }),
  driverId:  uuid('driver_id').references(() => driverProfiles.id, { onDelete: 'set null' }),

  // Resource reference
  resourceType: varchar('resource_type', { length: 50 }),
  resourceId:   varchar('resource_id',   { length: 100 }),
  // e.g. resourceType='TRIP', resourceId='TRP-00001234'

  // Correlation for end-to-end tracing
  correlationId: uuid('correlation_id').notNull(),
  parentEventId: uuid('parent_event_id'),
  // Parent event that triggered this one

  // Non-sensitive payload summary (never raw tokens/passwords)
  metadata: jsonb('metadata').notNull().default({}),

  processedAt: timestamp('processed_at', { withTimezone: true }),
  failureCode: varchar('failure_code',   { length: 100 }),

  attemptCount: integer('attempt_count').notNull().default(0),
  nextRetryAt:  timestamp('next_retry_at', { withTimezone: true }),

  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  createdAt:  timestamp('created_at',  { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  // Idempotency: same source service + event_id = same event
  uniqueIndex('idx_sys_event_idempotency').on(t.sourceService, t.eventId),
  index('idx_sys_event_type').on(t.eventType),
  index('idx_sys_event_status').on(t.status),
  index('idx_sys_event_driver').on(t.driverId),
  index('idx_sys_event_correlation').on(t.correlationId),
  index('idx_sys_event_occurred').on(t.occurredAt),
  index('idx_sys_event_priority').on(t.priority),
])

// ─── WEBHOOK DELIVERY LOG ─────────────────────────────────────

export const webhookDeliveryLog = pgTable('webhook_delivery_log', {
  id:         uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id').notNull()
    .references(() => providers.id, { onDelete: 'restrict' }),

  // External event identifier — idempotency
  externalEventId: varchar('external_event_id', { length: 200 }).notNull(),

  // Payload integrity — hash only, never raw payload
  payloadHash:  varchar('payload_hash', { length: 64 }).notNull(),
  // SHA-256 of raw webhook body — never the body itself

  payloadSize:  integer('payload_size'),
  // Bytes — for monitoring

  // Signature
  signatureVerified: boolean('signature_verified').notNull().default(false),
  signatureMethod:   varchar('signature_method', { length: 50 }),
  // 'HMAC_SHA256' | 'RSA_SHA256' | etc.

  status: webhookDeliveryStatusEnum('delivery_status').notNull().default('PENDING'),

  // HTTP metadata (non-sensitive)
  httpStatusCode: integer('http_status_code'),
  responseTimeMs: integer('response_time_ms'),

  // Retry
  attemptCount: integer('attempt_count').notNull().default(1),
  maxAttempts:  integer('max_attempts').notNull().default(5),
  nextRetryAt:  timestamp('next_retry_at', { withTimezone: true }),
  lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),

  // Dead letter reason
  deadLetterReason: text('dead_letter_reason'),

  correlationId: uuid('correlation_id'),

  receivedAt:  timestamp('received_at',  { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt:   timestamp('created_at',   { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  // Idempotency: same provider + external event = same delivery
  uniqueIndex('idx_webhook_log_idempotency').on(t.providerId, t.externalEventId),
  index('idx_webhook_log_provider').on(t.providerId),
  index('idx_webhook_log_status').on(t.status),
  index('idx_webhook_log_received').on(t.receivedAt),
  index('idx_webhook_log_correlation').on(t.correlationId),
])

// ─── OUTBOUND WEBHOOK SUBSCRIPTIONS ──────────────────────────

export const webhookSubscriptions = pgTable('webhook_subscriptions', {
  id:     uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Target URL — stored encrypted at application layer
  endpointUrlEncrypted:    text('endpoint_url_encrypted').notNull(),
  endpointUrlEncKeyVer:    varchar('endpoint_url_enc_key_ver', { length: 20 }),

  // Secret for HMAC signing — encrypted
  signingSecretEncrypted:  text('signing_secret_encrypted').notNull(),
  signingSecretEncKeyVer:  varchar('signing_secret_enc_key_ver', { length: 20 }),

  // Which events to deliver
  subscribedEvents: text('subscribed_events').array().notNull(),
  // e.g. ['TRIP_COMPLETED', 'PAYMENT_SUCCEEDED']

  isActive: boolean('is_active').notNull().default(true),

  // Health tracking
  lastSuccessAt: timestamp('last_success_at', { withTimezone: true }),
  failureCount:  integer('failure_count').notNull().default(0),
  // Deactivate after configurable consecutive failures

  createdAt:    timestamp('created_at',    { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp('updated_at',    { withTimezone: true }).notNull().defaultNow(),
  deactivatedAt: timestamp('deactivated_at', { withTimezone: true }),
}, (t) => [
  index('idx_webhook_sub_user').on(t.userId),
  index('idx_webhook_sub_active').on(t.isActive),
])

// ─── SYNC QUEUE ───────────────────────────────────────────────

export const syncQueue = pgTable('sync_queue', {
  id:       uuid('id').primaryKey().defaultRandom(),
  driverId: uuid('driver_id').notNull()
    .references(() => driverProfiles.id, { onDelete: 'cascade' }),

  // What needs to be synced
  operationType: varchar('operation_type', { length: 60 }).notNull(),
  // 'ACTIVITY_SYNC' | 'PAYMENT_CONFIRM' | 'GPS_FLUSH' | 'DOCUMENT_UPLOAD'
  // | 'COMPLIANCE_REFRESH' | 'TAX_RECALC'

  priority: notificationPriorityEnum('priority').notNull().default('NORMAL'),
  status:   syncQueueStatusEnum('sync_queue_status').notNull().default('QUEUED'),

  // Resource reference
  resourceType: varchar('resource_type', { length: 50 }),
  resourceId:   varchar('resource_id',   { length: 100 }),

  // Payload — non-sensitive summary only
  payload: jsonb('payload').notNull().default({}),
  // NEVER: tokens, passwords, full card data

  // Retry logic
  attemptCount: integer('attempt_count').notNull().default(0),
  maxAttempts:  integer('max_attempts').notNull().default(5),
  nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }),
  lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),

  errorCode:   varchar('error_code',   { length: 100 }),
  errorDetail: text('error_detail'),

  // Correlation
  correlationId: uuid('correlation_id').notNull().defaultRandom(),
  parentSyncId:  uuid('parent_sync_id'),

  // Offline origin — when operation was created offline
  createdOfflineAt: timestamp('created_offline_at', { withTimezone: true }),
  // null = created online

  completedAt: timestamp('completed_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_sync_queue_driver').on(t.driverId),
  index('idx_sync_queue_status').on(t.status),
  index('idx_sync_queue_priority').on(t.priority),
  index('idx_sync_queue_operation').on(t.operationType),
  index('idx_sync_queue_next_attempt').on(t.nextAttemptAt),
  index('idx_sync_queue_correlation').on(t.correlationId),
])

// ─── DEAD LETTER QUEUE ───────────────────────────────────────

export const deadLetterQueue = pgTable('dead_letter_queue', {
  id:          uuid('id').primaryKey().defaultRandom(),
  sourceType:  varchar('source_type', { length: 30 }).notNull(),
  // 'WEBHOOK' | 'SYNC_QUEUE' | 'SYSTEM_EVENT' | 'NOTIFICATION'

  sourceId:    uuid('source_id').notNull(),
  // ID from the source table (webhook_delivery_log, sync_queue, etc.)

  // Why it ended up here
  failureCode:   varchar('failure_code',   { length: 100 }),
  failureDetail: text('failure_detail'),
  totalAttempts: integer('total_attempts').notNull().default(0),
  // Non-sensitive — never includes token/password content

  // Resolution
  resolvedAt:    timestamp('resolved_at',   { withTimezone: true }),
  resolvedBy:    uuid('resolved_by').references(() => users.id),
  resolutionNote: text('resolution_note'),

  // DEAD_LETTER = end of retry chain — NEVER auto-deleted
  // Requires human review to resolve or archive
  requiresManualReview: boolean('requires_manual_review').notNull().default(true),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_dlq_source').on(t.sourceType, t.sourceId),
  index('idx_dlq_source_type').on(t.sourceType),
  index('idx_dlq_resolved').on(t.resolvedAt),
  index('idx_dlq_review').on(t.requiresManualReview),
])

// ─── EVENT SUBSCRIPTIONS ──────────────────────────────────────

export const eventSubscriptions = pgTable('event_subscriptions', {
  id:      uuid('id').primaryKey().defaultRandom(),
  name:    varchar('name', { length: 100 }).notNull(),
  // Subscriber name: 'NotificationService' | 'TaxEngine' | 'AuditService'

  subscribedEvents: text('subscribed_events').array().notNull(),
  // Which event types this subscriber listens to

  isActive:  boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_event_sub_active').on(t.isActive),
])

// ─── RELATIONS ────────────────────────────────────────────────

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user:   one(users,          { fields: [notifications.userId],   references: [users.id] }),
  driver: one(driverProfiles, { fields: [notifications.driverId], references: [driverProfiles.id] }),
}))

export const systemEventsRelations = relations(systemEvents, ({ one }) => ({
  actor:  one(users,          { fields: [systemEvents.actorId],  references: [users.id] }),
  driver: one(driverProfiles, { fields: [systemEvents.driverId], references: [driverProfiles.id] }),
}))

export const webhookDeliveryLogRelations = relations(webhookDeliveryLog, ({ one }) => ({
  provider: one(providers, { fields: [webhookDeliveryLog.providerId], references: [providers.id] }),
}))

export const syncQueueRelations = relations(syncQueue, ({ one }) => ({
  driver: one(driverProfiles, { fields: [syncQueue.driverId], references: [driverProfiles.id] }),
}))

export const deadLetterQueueRelations = relations(deadLetterQueue, ({ one }) => ({
  resolvedBy: one(users, { fields: [deadLetterQueue.resolvedBy], references: [users.id] }),
}))
