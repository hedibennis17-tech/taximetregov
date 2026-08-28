// ================================================================
// TAXIMÈTRE.GOV — PROVIDER ACTIVITIES SCHEMA
// Database Phase 7/20 — Activities · Trips · Deliveries · Sync
// ================================================================
//
// RÈGLES ABSOLUES:
// 1. provider_id + provider_account_id + external_activity_id UNIQUE
//    → même activité jamais enregistrée deux fois
// 2. CANCELLED ≠ DELETE → activité reste historique
// 3. Delivery/Rideshare provider → taximeter NEVER enabled
// 4. Provider Activity ≠ Financial Transaction (DB8+ gère les tx)
// 5. Out-of-order events supportés → event_version, received_at
// 6. Ajustement: jamais écraser montant précédent → ActivityVersion
// 7. Driver résolu via provider_account_id (jamais via nom/email/téléphone)
// 8. Payload sensible: jamais exposé au chauffeur
// 9. Token provider: jamais stocké dans cette table
// 10. Soft delete uniquement — jamais hard delete sur activité historique
// ================================================================

import {
  pgTable, pgEnum, uuid, text, boolean, integer,
  timestamp, jsonb, uniqueIndex, index, varchar,
  numeric,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { users }                  from './auth.schema'
import { driverProfiles }         from './profiles.schema'
import { providers, driverProviderAccounts, providerEvents } from './providers.schema'

// ─── ENUMS ───────────────────────────────────────────────────

export const activityTypeEnum = pgEnum('activity_type', [
  'RIDESHARE_TRIP',
  'DELIVERY',
  'FOOD_DELIVERY',
  'GROCERY_DELIVERY',
  'PACKAGE_DELIVERY',
  'TAXIMETER_TRIP',   // Taximètre.gov internal (co-exists, never confused)
  'OTHER',
])

export const activityStatusEnum = pgEnum('activity_status', [
  'RECEIVED',    // Événement reçu, non encore traité
  'PENDING',     // En cours de traitement
  'ACTIVE',      // Activité en cours
  'COMPLETED',   // Terminée avec succès
  'CANCELLED',   // Annulée — reste historique, jamais supprimée
  'FAILED',      // Échec technique
  'ADJUSTED',    // Montant ou données modifiés après coup
  'DISPUTED',    // En litige
  'UNKNOWN',     // État non déterminable
])

export const activitySourceEnum = pgEnum('activity_source', [
  'PROVIDER',         // Uber/Lyft/DoorDash/etc.
  'TAXIMETER_GOV',    // Propre système Taximètre.gov
  'MANUAL',           // Saisie manuelle
  'IMPORT',           // Importation externe
  'OTHER',
])

export const matchStatusEnum = pgEnum('match_status', [
  'UNMATCHED',      // Activité reçue, aucun chauffeur identifié
  'MATCHED',        // Chauffeur identifié via provider_account_id
  'REVIEW_REQUIRED', // Correspondance ambiguë
  'REJECTED',       // Rejeté — données incohérentes
])

export const reconciliationStatusEnum = pgEnum('reconciliation_status', [
  'NOT_RECONCILED',
  'MATCHED',
  'MISMATCH',
  'DUPLICATE',
  'MISSING_DATA',
  'UNDER_REVIEW',
  'RESOLVED',
])

export const disputeStatusEnum = pgEnum('activity_dispute_status', [
  'OPEN',
  'UNDER_REVIEW',
  'RESOLVED',
  'REJECTED',
  'CANCELLED',
])

export const syncStatusEnum = pgEnum('sync_status', [
  'NOT_STARTED',
  'RUNNING',
  'COMPLETED',
  'PARTIAL',
  'FAILED',
  'RETRYING',
])

// ─── PROVIDER ACTIVITIES ──────────────────────────────────────

export const providerActivities = pgTable('provider_activities', {
  id:               uuid('id').primaryKey().defaultRandom(),
  publicActivityId: varchar('public_activity_id', { length: 20 }).notNull().unique(),
  // Format: ACT-XXXXXXXX — internal ID, never the provider's ID

  // Source
  sourceType:        activitySourceEnum('source_type').notNull().default('PROVIDER'),
  providerId:        uuid('provider_id')
    .references(() => providers.id, { onDelete: 'restrict' }),
  providerAccountId: uuid('provider_account_id')
    .references(() => driverProviderAccounts.id, { onDelete: 'set null' }),
  driverId:          uuid('driver_id')
    .references(() => driverProfiles.id, { onDelete: 'set null' }),
  // set null: activity history preserved even if driver account is deactivated

  // External identifiers
  externalActivityId:   varchar('external_activity_id', { length: 200 }),
  // The provider's own ID: Uber trip_id, DoorDash delivery_id, etc.
  externalActivityHash: varchar('external_activity_hash', { length: 64 }),
  // SHA-256(provider_id + ':' + external_activity_id) — for dedup + search

  // Source webhook
  sourceProviderEventId: uuid('source_provider_event_id')
    .references(() => providerEvents.id, { onDelete: 'set null' }),
  // Which webhook created/updated this activity

  // Activity details
  activityType:   activityTypeEnum('activity_type').notNull(),
  activityStatus: activityStatusEnum('activity_status').notNull().default('RECEIVED'),

  // Match status
  matchStatus: matchStatusEnum('match_status').notNull().default('UNMATCHED'),

  // Timing — always TIMESTAMPTZ
  startedAt:   timestamp('started_at',   { withTimezone: true }),
  endedAt:     timestamp('ended_at',     { withTimezone: true }),
  receivedAt:  timestamp('received_at',  { withTimezone: true }).notNull().defaultNow(),
  timezone:    varchar('timezone', { length: 50 }),
  // e.g. 'America/Montreal'

  // Currency — ISO 4217
  currency: varchar('currency', { length: 3 }).notNull().default('CAD'),

  // Jurisdiction
  jurisdiction: varchar('jurisdiction', { length: 10 }).default('QC'),

  // Out-of-order event handling
  providerEventVersion: integer('provider_event_version'),
  // Provider's version/sequence — used to detect stale updates

  // TAXIMETER RULE: always false for provider activities
  taximeterEnabled: boolean('taximeter_enabled').notNull().default(false),
  // NEVER true for Uber/Lyft/DoorDash/etc. — absolute rule

  // Non-sensitive metadata (no tokens, no raw payload, no PII)
  metadata: jsonb('metadata').notNull().default({}),

  // Version counter for this activity record
  version: integer('version').notNull().default(1),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  // Soft archive only — never hard delete
}, (t) => [
  // CRITICAL: idempotency — same activity never created twice
  uniqueIndex('idx_prov_act_idempotency').on(t.providerId, t.providerAccountId, t.externalActivityHash),
  index('idx_prov_act_public_id').on(t.publicActivityId),
  index('idx_prov_act_provider').on(t.providerId),
  index('idx_prov_act_account').on(t.providerAccountId),
  index('idx_prov_act_driver').on(t.driverId),
  index('idx_prov_act_type').on(t.activityType),
  index('idx_prov_act_status').on(t.activityStatus),
  index('idx_prov_act_match').on(t.matchStatus),
  // Temporal queries: driver activities by date range
  index('idx_prov_act_driver_started').on(t.driverId, t.startedAt),
  index('idx_prov_act_started').on(t.startedAt),
  index('idx_prov_act_hash').on(t.externalActivityHash),
])

// ─── PROVIDER TRIPS (rideshare) ───────────────────────────────

export const providerTrips = pgTable('provider_trips', {
  id:         uuid('id').primaryKey().defaultRandom(),
  activityId: uuid('activity_id').notNull().unique()
    .references(() => providerActivities.id, { onDelete: 'cascade' }),

  pickupAt:   timestamp('pickup_at',  { withTimezone: true }),
  dropoffAt:  timestamp('dropoff_at', { withTimezone: true }),

  // Location — area reference only (privacy: no full passenger address)
  pickupAreaReference:  varchar('pickup_area_reference',  { length: 100 }),
  dropoffAreaReference: varchar('dropoff_area_reference', { length: 100 }),
  // e.g. 'Plateau-Mont-Royal, Montréal' — never full address

  passengerCount: integer('passenger_count'),

  tripStatus: varchar('trip_status', { length: 30 }),
  // Provider's own status string — not transformed

  // Do NOT store: passenger name, phone, full address, email
  // Privacy minimization — regulatory data only

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_prov_trip_activity').on(t.activityId),
  index('idx_prov_trip_pickup').on(t.pickupAt),
  index('idx_prov_trip_dropoff').on(t.dropoffAt),
])

// ─── PROVIDER DELIVERIES ──────────────────────────────────────

export const providerDeliveries = pgTable('provider_deliveries', {
  id:         uuid('id').primaryKey().defaultRandom(),
  activityId: uuid('activity_id').notNull().unique()
    .references(() => providerActivities.id, { onDelete: 'cascade' }),

  deliveryType: varchar('delivery_type', { length: 30 }),
  // 'FOOD' | 'GROCERY' | 'PACKAGE' | 'OTHER'

  pickupAt:  timestamp('pickup_at',  { withTimezone: true }),
  dropoffAt: timestamp('dropoff_at', { withTimezone: true }),

  // External order/delivery ID from provider
  externalOrderId:    varchar('external_order_id',    { length: 200 }),
  externalDeliveryId: varchar('external_delivery_id', { length: 200 }),
  // Preserved for reconciliation — not exposed as primary identifier

  deliveryStatus: varchar('delivery_status', { length: 30 }),
  // Provider's own status string

  // TAXIMETER RULE — redundant safety check
  taximeterEnabled: boolean('taximeter_enabled').notNull().default(false),
  // Always false for delivery — enforced at schema level

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_prov_del_activity').on(t.activityId),
  index('idx_prov_del_pickup').on(t.pickupAt),
])

// ─── ACTIVITY VERSIONS ────────────────────────────────────────
// Preserves history when activity amounts or status change

export const activityVersions = pgTable('activity_versions', {
  id:         uuid('id').primaryKey().defaultRandom(),
  activityId: uuid('activity_id').notNull()
    .references(() => providerActivities.id, { onDelete: 'cascade' }),

  versionNumber: integer('version_number').notNull(),
  // Monotonically increasing — never reset

  // What changed
  previousStatus: varchar('previous_status', { length: 30 }),
  newStatus:      varchar('new_status',      { length: 30 }),

  // Amount snapshot — DECIMAL not float (financial data)
  // Stored here for historical reference — Financial Engine owns final amounts
  amountSnapshot: numeric('amount_snapshot', { precision: 12, scale: 2 }),
  amountCurrency: varchar('amount_currency', { length: 3 }),

  changeReason: varchar('change_reason', { length: 100 }),
  // 'FARE_ADJUSTMENT' | 'TIP_ADDED' | 'CANCELLATION' | 'DISPUTE_RESOLVED' | etc.

  // Source event that triggered this version
  sourceEventId: uuid('source_event_id')
    .references(() => providerEvents.id, { onDelete: 'set null' }),

  // Never overwrite — append only
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_act_version_unique').on(t.activityId, t.versionNumber),
  index('idx_act_version_activity').on(t.activityId),
  index('idx_act_version_created').on(t.createdAt),
])

// ─── ACTIVITY DISPUTES ────────────────────────────────────────

export const activityDisputes = pgTable('activity_disputes', {
  id:         uuid('id').primaryKey().defaultRandom(),
  activityId: uuid('activity_id').notNull()
    .references(() => providerActivities.id, { onDelete: 'cascade' }),
  driverId:   uuid('driver_id').notNull()
    .references(() => driverProfiles.id),

  status: disputeStatusEnum('activity_dispute_status').notNull().default('OPEN'),

  disputeType: varchar('dispute_type', { length: 50 }).notNull(),
  // 'AMOUNT_MISMATCH' | 'DUPLICATE' | 'WRONG_DRIVER' | 'MISSING_ACTIVITY' | 'OTHER'

  reason: text('reason').notNull(),

  // Reviewer — government authorized user
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  resolution: text('resolution'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_dispute_activity').on(t.activityId),
  index('idx_dispute_driver').on(t.driverId),
  index('idx_dispute_status').on(t.status),
])

// ─── PROVIDER SYNC STATE ──────────────────────────────────────

export const providerSyncState = pgTable('provider_sync_state', {
  id:               uuid('id').primaryKey().defaultRandom(),
  providerAccountId: uuid('provider_account_id').notNull()
    .references(() => driverProviderAccounts.id, { onDelete: 'cascade' }),

  syncType: varchar('sync_type', { length: 30 }).notNull(),
  // 'INITIAL' | 'INCREMENTAL' | 'BACKFILL' | 'RETRY'

  status: syncStatusEnum('sync_status').notNull().default('NOT_STARTED'),

  // Opaque cursor — not a token or secret
  cursorReference: varchar('cursor_reference', { length: 500 }),
  // Provider's pagination token/timestamp — stored safely (not a secret)

  lastSuccessfulSyncAt: timestamp('last_successful_sync_at', { withTimezone: true }),
  lastAttemptAt:        timestamp('last_attempt_at',         { withTimezone: true }),

  activitiesSynced: integer('activities_synced').notNull().default(0),
  errorCode:        varchar('error_code', { length: 100 }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_sync_state_account').on(t.providerAccountId),
  index('idx_sync_state_status').on(t.status),
  index('idx_sync_state_last_sync').on(t.lastSuccessfulSyncAt),
])

// ─── ACTIVITY AUDIT EVENTS ────────────────────────────────────

export const activityAuditEvents = pgTable('activity_audit_events', {
  id:         uuid('id').primaryKey().defaultRandom(),
  activityId: uuid('activity_id').notNull()
    .references(() => providerActivities.id, { onDelete: 'cascade' }),

  actorId:   uuid('actor_id').references(() => users.id),
  actorRole: varchar('actor_role', { length: 50 }),

  action: varchar('action', { length: 60 }).notNull(),
  // 'ACTIVITY_CREATED' | 'ACTIVITY_UPDATED' | 'ACTIVITY_COMPLETED'
  // | 'ACTIVITY_CANCELLED' | 'ACTIVITY_MATCHED' | 'ACTIVITY_UNMATCHED'
  // | 'ACTIVITY_DISPUTED' | 'ACTIVITY_RESOLVED' | 'ACTIVITY_ADJUSTED'

  // NEVER includes: token, payload, PII, raw provider data
  metadata: jsonb('metadata').notNull().default({}),

  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_act_audit_activity').on(t.activityId),
  index('idx_act_audit_actor').on(t.actorId),
  index('idx_act_audit_action').on(t.action),
  index('idx_act_audit_occurred').on(t.occurredAt),
])

// ─── RELATIONS ────────────────────────────────────────────────

export const providerActivitiesRelations = relations(providerActivities, ({ one, many }) => ({
  provider:        one(providers,              { fields: [providerActivities.providerId],        references: [providers.id] }),
  providerAccount: one(driverProviderAccounts, { fields: [providerActivities.providerAccountId], references: [driverProviderAccounts.id] }),
  driver:          one(driverProfiles,         { fields: [providerActivities.driverId],          references: [driverProfiles.id] }),
  sourceEvent:     one(providerEvents,         { fields: [providerActivities.sourceProviderEventId], references: [providerEvents.id] }),
  trip:            one(providerTrips,          { fields: [providerActivities.id], references: [providerTrips.activityId] }),
  delivery:        one(providerDeliveries,     { fields: [providerActivities.id], references: [providerDeliveries.activityId] }),
  versions:        many(activityVersions),
  disputes:        many(activityDisputes),
  auditEvents:     many(activityAuditEvents),
}))

export const activityVersionsRelations = relations(activityVersions, ({ one }) => ({
  activity:    one(providerActivities, { fields: [activityVersions.activityId],  references: [providerActivities.id] }),
  sourceEvent: one(providerEvents,     { fields: [activityVersions.sourceEventId], references: [providerEvents.id] }),
}))

export const activityDisputesRelations = relations(activityDisputes, ({ one }) => ({
  activity:   one(providerActivities, { fields: [activityDisputes.activityId], references: [providerActivities.id] }),
  driver:     one(driverProfiles,     { fields: [activityDisputes.driverId],   references: [driverProfiles.id] }),
  reviewedBy: one(users,              { fields: [activityDisputes.reviewedBy], references: [users.id] }),
}))

export const providerSyncStateRelations = relations(providerSyncState, ({ one }) => ({
  providerAccount: one(driverProviderAccounts, { fields: [providerSyncState.providerAccountId], references: [driverProviderAccounts.id] }),
}))
