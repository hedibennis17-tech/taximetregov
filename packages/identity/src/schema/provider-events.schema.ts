// ================================================================
// TAXIMÈTRE.GOV — PROVIDER EVENTS INGESTION SCHEMA
// Database Phase 13/20 — Webhook Ingestion · Idempotency · Quarantine
// ================================================================
//
// ARCHITECTURE MASTER RULE (from Master Architecture Document):
// provider_id + external_event_id UNIQUE → never processed twice
// external_transaction_id groups multiple events for ONE activity
// FINAL provider amount is authoritative — never estimated amount
// Taximeter NEVER activated by provider events
//
// RÈGLES ABSOLUES:
// 1. provider_id + external_event_id UNIQUE → idempotency absolu
// 2. provider_id + external_transaction_id → ONE activity (jamais 3 transactions)
// 3. UNKNOWN_DRIVER → QUARANTINED (jamais assigné automatiquement)
// 4. INVALID_SIGNATURE → REJECTED/QUARANTINED (jamais traité)
// 5. Payload brut: JAMAIS en clair en DB → payload_hash(SHA-256) + reference
// 6. Taximeter: JAMAIS activé par événement provider
// 7. Cancelled trip → ne compte JAMAIS comme revenu automatiquement
// 8. Montant estimé ≠ montant final → ledger attend le FARE_FINALIZED
// ================================================================

import {
  pgTable, pgEnum, uuid, text, boolean, integer,
  timestamp, jsonb, uniqueIndex, index, varchar,
  numeric,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users }                  from './auth.schema'
import { driverProfiles }         from './profiles.schema'
import { providers, providerEvents, driverProviderAccounts } from './providers.schema'

// ─── ENUMS ───────────────────────────────────────────────────

export const canonicalEventTypeEnum = pgEnum('canonical_event_type', [
  // Rideshare
  'TRIP_CREATED',
  'TRIP_STARTED',
  'TRIP_COMPLETED',
  'TRIP_UPDATED',
  'TRIP_CANCELLED',
  // Delivery
  'DELIVERY_CREATED',
  'DELIVERY_STARTED',
  'DELIVERY_COMPLETED',
  'DELIVERY_UPDATED',
  'DELIVERY_CANCELLED',
  // Financial
  'FARE_UPDATED',
  'FARE_FINALIZED',    // Authoritative final amount — triggers ledger entry
  'PAYOUT_CREATED',
  'PAYOUT_UPDATED',
  'TIP_ADDED',
  'ADJUSTMENT_CREATED',
  // Account
  'DRIVER_UPDATED',
  'ACCOUNT_UPDATED',
  'TAX_DATA_UPDATED',
  // Other
  'OTHER',
])

export const eventProcessingStatusEnum = pgEnum('event_processing_status', [
  'RECEIVED',
  'VALIDATING',
  'VALIDATED',
  'PROCESSING',
  'PROCESSED',
  'DUPLICATE',        // Same event received again — ignored
  'REJECTED',         // Invalid signature, bad schema, etc.
  'FAILED',           // Processing error — retryable
  'QUARANTINED',      // Unknown driver, suspicious, needs review
])

export const webhookAuthStatusEnum = pgEnum('webhook_auth_status', [
  'NOT_CHECKED',
  'VALID',
  'INVALID',
  'EXPIRED',
  'MISSING',
  'FAILED',
])

export const quarantineReasonEnum = pgEnum('quarantine_reason', [
  'INVALID_SIGNATURE',
  'UNKNOWN_PROVIDER',
  'UNKNOWN_CONNECTION',
  'UNKNOWN_DRIVER',       // Cannot resolve to Government Driver
  'UNKNOWN_ACCOUNT',      // External account not in system
  'INVALID_SCHEMA',
  'DUPLICATE',
  'SUSPICIOUS_PAYLOAD',
  'MISSING_TRANSACTION_ID',
  'UNSUPPORTED_EVENT',
  'DATA_INCONSISTENCY',
  'SUSPENDED_CONNECTION', // Provider connection is suspended
  'REVOKED_CONNECTION',   // Provider connection is revoked
  'OTHER',
])

export const quarantineReviewStatusEnum = pgEnum('quarantine_review_status', [
  'PENDING',
  'UNDER_REVIEW',
  'RESOLVED',
  'REJECTED',
  'ESCALATED',
])

export const providerEventSourceEnum = pgEnum('provider_event_source', [
  'WEBHOOK',
  'API',
  'BATCH',
  'GOVERNMENT_FEED',
  'MANUAL_IMPORT',
])

export const transactionRefStatusEnum = pgEnum('transaction_ref_status', [
  'OPEN',          // Events received, not yet finalized
  'FINALIZED',     // FARE_FINALIZED received — authoritative amount set
  'CANCELLED',     // Trip/delivery cancelled
  'DISPUTED',      // Under dispute
  'CLOSED',        // Fully processed into revenue ledger
])

// ─── PROVIDER EVENT MAPPINGS ──────────────────────────────────
// Maps provider-specific event names to canonical internal types
// Prevents provider terminology from spreading through the application

export const providerEventMappings = pgTable('provider_event_mappings', {
  id:         uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id').notNull()
    .references(() => providers.id, { onDelete: 'cascade' }),

  // Provider's own event type name (raw)
  providerEventType: varchar('provider_event_type', { length: 100 }).notNull(),
  // e.g. 'trips.completed', 'delivery_complete', 'ride.finished'

  // Canonical internal type
  canonicalEventType: canonicalEventTypeEnum('canonical_event_type').notNull(),
  // e.g. TRIP_COMPLETED, DELIVERY_COMPLETED

  // Schema version this mapping applies to
  providerSchemaVersion: varchar('provider_schema_version', { length: 20 }),

  enabled: boolean('enabled').notNull().default(true),

  notes: text('notes'),
  // e.g. 'Uber uses trips.completed for both rideshare and uberEats — check context'

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_event_mapping_unique').on(t.providerId, t.providerEventType, t.providerSchemaVersion),
  index('idx_event_mapping_provider').on(t.providerId),
  index('idx_event_mapping_canonical').on(t.canonicalEventType),
])

// ─── PROVIDER WEBHOOK DELIVERIES ──────────────────────────────
// Tracks each individual webhook HTTP delivery attempt

export const providerWebhookDeliveries = pgTable('provider_webhook_deliveries', {
  id:         uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id').notNull()
    .references(() => providers.id, { onDelete: 'restrict' }),
  providerEventId: uuid('provider_event_id')
    .references(() => providerEvents.id, { onDelete: 'set null' }),
  providerAccountId: uuid('provider_account_id')
    .references(() => driverProviderAccounts.id, { onDelete: 'set null' }),

  // Provider's delivery identifier (for replay protection)
  externalDeliveryId: varchar('external_delivery_id', { length: 200 }),

  // Authentication & signature
  authStatus:       webhookAuthStatusEnum('auth_status').notNull().default('NOT_CHECKED'),
  signatureStatus:  webhookAuthStatusEnum('signature_status').notNull().default('NOT_CHECKED'),
  signatureMethod:  varchar('signature_method', { length: 50 }),
  // 'HMAC_SHA256' | 'RSA_SHA256' | 'PROVIDER_SPECIFIC'

  // HTTP metadata
  httpMethod:     varchar('http_method',      { length: 10 }).notNull().default('POST'),
  httpStatusCode: integer('http_status_code'),
  responseTimeMs: integer('response_time_ms'),

  // Payload integrity — hash only, NEVER raw body
  payloadHash: varchar('payload_hash', { length: 64 }).notNull(),
  payloadSize: integer('payload_size'),

  status:        eventProcessingStatusEnum('processing_status').notNull().default('RECEIVED'),
  attemptNumber: integer('attempt_number').notNull().default(1),
  maxAttempts:   integer('max_attempts').notNull().default(5),

  source: providerEventSourceEnum('source').notNull().default('WEBHOOK'),

  errorCode:    varchar('error_code',    { length: 100 }),
  errorMessage: text('error_message'),

  receivedAt:   timestamp('received_at',   { withTimezone: true }).notNull().defaultNow(),
  processedAt:  timestamp('processed_at',  { withTimezone: true }),
  nextRetryAt:  timestamp('next_retry_at', { withTimezone: true }),

  correlationId: uuid('correlation_id'),
  createdAt:     timestamp('created_at',   { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp('updated_at',   { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  // Replay protection: same provider + same delivery ID = same delivery
  uniqueIndex('idx_webhook_delivery_idempotency').on(t.providerId, t.externalDeliveryId),
  index('idx_webhook_delivery_provider').on(t.providerId),
  index('idx_webhook_delivery_event').on(t.providerEventId),
  index('idx_webhook_delivery_status').on(t.status),
  index('idx_webhook_delivery_received').on(t.receivedAt),
  index('idx_webhook_delivery_correlation').on(t.correlationId),
])

// ─── PROVIDER TRANSACTION REFERENCES ─────────────────────────
// Groups multiple events for the same external transaction
// ONE transaction → POTENTIALLY MANY events → ONE revenue entry

export const providerTransactionReferences = pgTable('provider_transaction_references', {
  id:         uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id').notNull()
    .references(() => providers.id, { onDelete: 'restrict' }),
  providerAccountId: uuid('provider_account_id')
    .references(() => driverProviderAccounts.id, { onDelete: 'set null' }),
  driverId: uuid('driver_id')
    .references(() => driverProfiles.id, { onDelete: 'set null' }),
  // set null: transaction preserved if driver account changes

  // Provider's external transaction/trip/delivery ID
  externalTransactionId: varchar('external_transaction_id', { length: 200 }).notNull(),

  // Canonical activity type
  canonicalEventType: canonicalEventTypeEnum('canonical_event_type').notNull(),
  // The dominant type for this transaction

  status: transactionRefStatusEnum('transaction_ref_status').notNull().default('OPEN'),

  // Amount lifecycle — ALL NUMERIC(12,2), NEVER FLOAT
  // Initial estimate (NOT authoritative)
  estimatedAmount: numeric('estimated_amount', { precision: 12, scale: 2 }),
  // Actual final amount after FARE_FINALIZED
  finalAmount:     numeric('final_amount',     { precision: 12, scale: 2 }),
  // Total adjustments
  totalAdjustments: numeric('total_adjustments', { precision: 12, scale: 2 }).default('0'),
  tipAmount:         numeric('tip_amount',        { precision: 12, scale: 2 }).default('0'),
  feeAmount:         numeric('fee_amount',         { precision: 12, scale: 2 }).default('0'),

  currency: varchar('currency', { length: 3 }).notNull().default('CAD'),

  // When the final event was received
  finalizedAt:   timestamp('finalized_at',  { withTimezone: true }),
  // When this was closed into revenue ledger
  reconciledAt:  timestamp('reconciled_at', { withTimezone: true }),

  // Event count for this transaction
  eventCount: integer('event_count').notNull().default(1),

  // TAXIMETER ABSOLUTE RULE
  taximeterEnabled: boolean('taximeter_enabled').notNull().default(false),
  // Always false for all provider transactions — no exception

  jurisdiction: varchar('jurisdiction', { length: 10 }).notNull().default('QC'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  // CRITICAL: ONE transaction per provider per external ID
  uniqueIndex('idx_txn_ref_idempotency').on(t.providerId, t.externalTransactionId),
  index('idx_txn_ref_provider').on(t.providerId),
  index('idx_txn_ref_account').on(t.providerAccountId),
  index('idx_txn_ref_driver').on(t.driverId),
  index('idx_txn_ref_status').on(t.status),
  index('idx_txn_ref_canonical').on(t.canonicalEventType),
  index('idx_txn_ref_driver_created').on(t.driverId, t.createdAt),
])

// ─── PROVIDER EVENT QUARANTINE ────────────────────────────────

export const providerEventQuarantine = pgTable('provider_event_quarantine', {
  id:             uuid('id').primaryKey().defaultRandom(),
  providerEventId: uuid('provider_event_id')
    .references(() => providerEvents.id, { onDelete: 'cascade' }),
  webhookDeliveryId: uuid('webhook_delivery_id')
    .references(() => providerWebhookDeliveries.id, { onDelete: 'set null' }),
  providerId: uuid('provider_id').notNull()
    .references(() => providers.id, { onDelete: 'restrict' }),

  reasonCode:   quarantineReasonEnum('reason_code').notNull(),
  reasonDetail: text('reason_detail').notNull(),
  // NEVER includes: raw payload, tokens, passwords, full account IDs

  // Context for resolution
  externalEventId:       varchar('external_event_id',       { length: 200 }),
  externalTransactionId: varchar('external_transaction_id', { length: 200 }),
  externalAccountId:     varchar('external_account_id',     { length: 200 }),
  // Last 4 only for display

  reviewStatus: quarantineReviewStatusEnum('review_status').notNull().default('PENDING'),
  assignedTo:   uuid('assigned_to').references(() => users.id),
  reviewedBy:   uuid('reviewed_by').references(() => users.id),
  reviewedAt:   timestamp('reviewed_at', { withTimezone: true }),
  resolution:   text('resolution'),

  // CRITICAL: No financial activity until resolved
  // Financial records created ONLY after quarantine resolved + event reprocessed
  quarantinedAt: timestamp('quarantined_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt:     timestamp('created_at',      { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp('updated_at',      { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_quarantine_provider_event').on(t.providerEventId),
  index('idx_quarantine_provider').on(t.providerId),
  index('idx_quarantine_reason').on(t.reasonCode),
  index('idx_quarantine_review').on(t.reviewStatus),
  index('idx_quarantine_quarantined').on(t.quarantinedAt),
])

// ─── DRIVER RESOLUTION LOG ────────────────────────────────────
// Tracks how an external provider account was resolved to a Government Driver

export const driverResolutionLog = pgTable('driver_resolution_log', {
  id:         uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id').notNull()
    .references(() => providers.id, { onDelete: 'restrict' }),

  // Input identifiers from provider event
  externalAccountId: varchar('external_account_id', { length: 200 }),
  externalDriverId:  varchar('external_driver_id',  { length: 200 }),

  // Resolution result
  resolved:          boolean('resolved').notNull(),
  resolvedDriverId:  uuid('resolved_driver_id')
    .references(() => driverProfiles.id, { onDelete: 'set null' }),
  resolutionMethod:  varchar('resolution_method', { length: 50 }),
  // 'PROVIDER_ACCOUNT_MATCH' | 'EXTERNAL_DRIVER_ID' | 'MANUAL_MATCH'

  // Failure reason if not resolved
  failureReason: varchar('failure_reason', { length: 100 }),
  // 'UNKNOWN_ACCOUNT' | 'MULTIPLE_MATCHES' | 'SUSPENDED_CONNECTION' | etc.

  // Source event
  providerEventId:      uuid('provider_event_id')
    .references(() => providerEvents.id, { onDelete: 'set null' }),
  webhookDeliveryId:    uuid('webhook_delivery_id')
    .references(() => providerWebhookDeliveries.id, { onDelete: 'set null' }),

  resolvedAt: timestamp('resolved_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt:  timestamp('created_at',  { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_driver_res_provider').on(t.providerId),
  index('idx_driver_res_resolved').on(t.resolved),
  index('idx_driver_res_driver').on(t.resolvedDriverId),
  index('idx_driver_res_event').on(t.providerEventId),
])

// ─── RELATIONS ────────────────────────────────────────────────

export const providerEventMappingsRelations = relations(providerEventMappings, ({ one }) => ({
  provider: one(providers, { fields: [providerEventMappings.providerId], references: [providers.id] }),
}))

export const providerWebhookDeliveriesRelations = relations(providerWebhookDeliveries, ({ one }) => ({
  provider:         one(providers,              { fields: [providerWebhookDeliveries.providerId],        references: [providers.id] }),
  providerEvent:    one(providerEvents,         { fields: [providerWebhookDeliveries.providerEventId],   references: [providerEvents.id] }),
  providerAccount:  one(driverProviderAccounts, { fields: [providerWebhookDeliveries.providerAccountId], references: [driverProviderAccounts.id] }),
}))

export const providerTransactionReferencesRelations = relations(providerTransactionReferences, ({ one }) => ({
  provider:        one(providers,              { fields: [providerTransactionReferences.providerId],        references: [providers.id] }),
  providerAccount: one(driverProviderAccounts, { fields: [providerTransactionReferences.providerAccountId], references: [driverProviderAccounts.id] }),
  driver:          one(driverProfiles,         { fields: [providerTransactionReferences.driverId],          references: [driverProfiles.id] }),
}))

export const providerEventQuarantineRelations = relations(providerEventQuarantine, ({ one }) => ({
  providerEvent:    one(providerEvents,             { fields: [providerEventQuarantine.providerEventId],    references: [providerEvents.id] }),
  webhookDelivery:  one(providerWebhookDeliveries,  { fields: [providerEventQuarantine.webhookDeliveryId],  references: [providerWebhookDeliveries.id] }),
  provider:         one(providers,                  { fields: [providerEventQuarantine.providerId],         references: [providers.id] }),
  assignedTo:       one(users,                      { fields: [providerEventQuarantine.assignedTo],         references: [users.id] }),
  reviewedBy:       one(users,                      { fields: [providerEventQuarantine.reviewedBy],         references: [users.id] }),
}))

export const driverResolutionLogRelations = relations(driverResolutionLog, ({ one }) => ({
  provider:         one(providers,              { fields: [driverResolutionLog.providerId],        references: [providers.id] }),
  resolvedDriver:   one(driverProfiles,         { fields: [driverResolutionLog.resolvedDriverId],  references: [driverProfiles.id] }),
  providerEvent:    one(providerEvents,         { fields: [driverResolutionLog.providerEventId],   references: [providerEvents.id] }),
  webhookDelivery:  one(providerWebhookDeliveries, { fields: [driverResolutionLog.webhookDeliveryId], references: [providerWebhookDeliveries.id] }),
}))
