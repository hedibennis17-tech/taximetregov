// ================================================================
// TAXIMÈTRE.GOV — UNIFIED ACTIVITY LEDGER SCHEMA
// Database Phase 14/20 — Canonical Activities · Normalization
// ================================================================
//
// MASTER ARCHITECTURE RULE:
// ONE canonical activity per provider + external_activity_id
// Multiple provider events → ONE driver_activity (never N activities)
// Delivery NEVER activates taximeter (enforced here + service)
//
// RÈGLES ABSOLUES:
// 1. provider_id + external_activity_id UNIQUE → jamais deux activités pour même course
// 2. estimated_amount ≠ final_amount → FARE_FINALIZED seul est autoritaire
// 3. gross_amount ≠ net_amount → feeAmount toujours séparé
// 4. tip_amount TOUJOURS séparé → jamais intégré dans finalAmount
// 5. CANCELLED → jamais revenu automatique
// 6. VOIDED → jamais hard delete · status uniquement
// 7. TAXIMETER source UNIQUEMENT pour TAXI_TRIP (enforced in service)
// 8. All amounts: NUMERIC(12,2) — NEVER FLOAT
// 9. driver_id OBLIGATOIRE → sinon quarantine (jamais auto-assigné)
// 10. adjustment history: tracé via adjustments table (jamais écrasé)
// ================================================================

import {
  pgTable, pgEnum, uuid, text, boolean, integer,
  timestamp, jsonb, uniqueIndex, index, varchar,
  numeric,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users }                  from './auth.schema'
import { driverProfiles }         from './profiles.schema'
import { vehicles }               from './vehicles.schema'
import { providers, providerEvents, driverProviderAccounts } from './providers.schema'
import { jurisdictions }          from './pre-db10.schema'
import { taxiTrips }              from './taximeter.schema'

// ─── ENUMS ───────────────────────────────────────────────────

export const canonicalActivityTypeEnum = pgEnum('canonical_activity_type', [
  'TAXI_TRIP',          // Government taximeter — fare engine
  'RIDESHARE_TRIP',     // Uber, Lyft — provider final fare
  'FOOD_DELIVERY',      // DoorDash, UberEats, Skip — taximeter OFF
  'GROCERY_DELIVERY',   // Instacart — taximeter OFF
  'PARCEL_DELIVERY',    // Intelcom — taximeter OFF
  'COURIER',            // General courier
  'SHOPPING',           // Shopping/errand activities
  'OTHER',
])

export const activityStatusEnum = pgEnum('canonical_activity_status', [
  'PENDING',     // Created, not yet started
  'STARTED',     // In progress
  'COMPLETED',   // Provider confirmed completed
  'CANCELLED',   // Cancelled — no automatic revenue
  'FINALIZED',   // Final amounts confirmed — ready for revenue ledger
  'REJECTED',    // Rejected by validation
  'DISPUTED',    // Under dispute — original preserved
  'VOIDED',      // Administratively voided — never hard deleted
])

export const activitySourceTypeEnum = pgEnum('activity_source_type', [
  'TAXIMETER',             // Government taximeter (taxi only)
  'PROVIDER_WEBHOOK',      // Real-time webhook from provider
  'PROVIDER_API',          // Pulled from provider API
  'BATCH_IMPORT',          // Authorized batch file
  'GOVERNMENT_FEED',       // Government data feed
  'MANUAL_AUTHORIZED',     // Admin-authorized manual entry
  'OTHER',
])

export const dataQualityStatusEnum = pgEnum('data_quality_status', [
  'VALIDATED',        // All required fields present and consistent
  'PARTIAL',          // Some optional fields missing
  'INCONSISTENT',     // Data inconsistency detected — needs review
  'PENDING_REVIEW',   // Awaiting human review
  'REJECTED',         // Rejected — cannot proceed to financial
])

export const reconciliationStatusEnum = pgEnum('activity_reconciliation_status', [
  'NOT_RECONCILED',
  'MATCHED',
  'PARTIAL_MATCH',
  'MISMATCH',
  'UNDER_REVIEW',
  'RESOLVED',
])

export const activityAdjustmentTypeEnum = pgEnum('activity_adjustment_type', [
  'FARE_CORRECTION',
  'TIP_ADJUSTMENT',
  'FEE_ADJUSTMENT',
  'CANCELLATION_FEE',
  'GOVERNMENT_CORRECTION',
  'PROVIDER_CORRECTION',
  'OTHER',
])

// ─── CANONICAL ACTIVITY TYPES TABLE ───────────────────────────
// Extensible lookup — never add new activity types as code changes

export const activityTypes = pgTable('activity_types', {
  id:          uuid('id').primaryKey().defaultRandom(),
  code:        varchar('code',         { length: 50  }).notNull().unique(),
  // 'TAXI_TRIP' | 'RIDESHARE_TRIP' | 'FOOD_DELIVERY' etc.
  label:       varchar('label',        { length: 100 }).notNull(),
  labelFr:     varchar('label_fr',     { length: 100 }),
  labelEn:     varchar('label_en',     { length: 100 }),
  description: text('description'),

  // Taximeter rule at type level
  taximeterEligible: boolean('taximeter_eligible').notNull().default(false),
  // TAXI_TRIP: true · ALL OTHERS: false (absolute)

  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_activity_types_code').on(t.code),
  index('idx_activity_types_taximeter').on(t.taximeterEligible),
])

// ─── DRIVER ACTIVITIES (CANONICAL LEDGER) ─────────────────────

export const driverActivities = pgTable('driver_activities', {
  id:       uuid('id').primaryKey().defaultRandom(),
  publicId: varchar('public_id', { length: 20 }).notNull().unique(),
  // Format: ACT-XXXXXXXX (canonical, not reusing provider ACT IDs)

  // MANDATORY: Every activity belongs to exactly one Government Driver
  driverId: uuid('driver_id').notNull()
    .references(() => driverProfiles.id, { onDelete: 'restrict' }),

  // Source
  providerId:        uuid('provider_id')
    .references(() => providers.id, { onDelete: 'restrict' }),
  providerAccountId: uuid('provider_account_id')
    .references(() => driverProviderAccounts.id, { onDelete: 'set null' }),
  jurisdictionId:    uuid('jurisdiction_id')
    .references(() => jurisdictions.id, { onDelete: 'restrict' }),

  // Activity classification
  activityTypeCode: canonicalActivityTypeEnum('activity_type_code').notNull(),
  // Denormalized for query performance — source of truth is activity_types table
  status:           activityStatusEnum('status').notNull().default('PENDING'),
  sourceType:       activitySourceTypeEnum('source_type').notNull(),

  // External identifiers — provider-scoped
  externalActivityId:    varchar('external_activity_id',    { length: 200 }),
  externalTransactionId: varchar('external_transaction_id', { length: 200 }),
  // These are provider's IDs — never used as PK

  // Source references
  sourceProviderEventId: uuid('source_provider_event_id')
    .references(() => providerEvents.id, { onDelete: 'set null' }),
  sourceTaxiTripId:      uuid('source_taxi_trip_id')
    .references(() => taxiTrips.id, { onDelete: 'restrict' }),
  // Either sourceProviderEventId OR sourceTaxiTripId — not both

  // Vehicle (for taxi/rideshare where vehicle is required)
  vehicleId: uuid('vehicle_id')
    .references(() => vehicles.id, { onDelete: 'set null' }),

  // Timestamps — all UTC
  startedAt:   timestamp('started_at',   { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  finalizedAt: timestamp('finalized_at', { withTimezone: true }),
  // finalizedAt = when FARE_FINALIZED received or taximeter completed

  // Amount breakdown — ALL NUMERIC(12,2), NEVER FLOAT
  estimatedAmount:  numeric('estimated_amount',  { precision: 12, scale: 2 }),
  // Provider estimate — NOT authoritative
  grossAmount:      numeric('gross_amount',       { precision: 12, scale: 2 }),
  // Completed activity amount before adjustments
  adjustmentAmount: numeric('adjustment_amount',  { precision: 12, scale: 2 }).notNull().default('0'),
  // Sum of all adjustments
  finalAmount:      numeric('final_amount',       { precision: 12, scale: 2 }),
  // Authoritative final — set when FINALIZED
  tipAmount:        numeric('tip_amount',         { precision: 12, scale: 2 }).notNull().default('0'),
  // ALWAYS separate — never embedded in fare
  feeAmount:        numeric('fee_amount',         { precision: 12, scale: 2 }).notNull().default('0'),
  // Provider fee — NOT the driver's revenue
  taxAmount:        numeric('tax_amount',         { precision: 12, scale: 2 }).notNull().default('0'),
  // Tax if provider reports it — NOT Taximètre.gov calculation
  netAmount:        numeric('net_amount',         { precision: 12, scale: 2 }),
  // netAmount = finalAmount - feeAmount (driver's gross revenue)

  currency: varchar('currency', { length: 3 }).notNull().default('CAD'),

  // Location references — no raw GPS stored here (GPS in trip_gps_points)
  locationStartReference: varchar('location_start_reference', { length: 100 }),
  locationEndReference:   varchar('location_end_reference',   { length: 100 }),
  // Area/zone reference — e.g. 'Plateau-Mont-Royal'

  // Customer/passenger — only when legally required, minimal data
  passengerOrCustomerReference: varchar('passenger_or_customer_reference', { length: 100 }),
  // Opaque reference — never raw name/contact

  // Quality & reconciliation
  dataQualityStatus:    dataQualityStatusEnum('data_quality_status').notNull().default('PENDING_REVIEW'),
  reconciliationStatus: reconciliationStatusEnum('reconciliation_status').notNull().default('NOT_RECONCILED'),

  // TAXIMETER RULE — redundant safety at schema level
  taximeterEnabled: boolean('taximeter_enabled').notNull().default(false),
  // TAXI_TRIP: may be true · ALL DELIVERY types: always false

  // Version counter for optimistic locking
  version: integer('version').notNull().default(1),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  // CRITICAL: ONE activity per provider + external activity ID
  uniqueIndex('idx_activity_ext_id').on(t.providerId, t.externalActivityId),
  // ONE activity per taxi trip
  uniqueIndex('idx_activity_taxi_trip').on(t.sourceTaxiTripId),

  index('idx_activity_driver').on(t.driverId),
  index('idx_activity_provider').on(t.providerId),
  index('idx_activity_status').on(t.status),
  index('idx_activity_type').on(t.activityTypeCode),
  index('idx_activity_source').on(t.sourceType),
  index('idx_activity_jurisdiction').on(t.jurisdictionId),
  index('idx_activity_started').on(t.startedAt),
  index('idx_activity_finalized').on(t.finalizedAt),
  index('idx_activity_reconciliation').on(t.reconciliationStatus),
  index('idx_activity_data_quality').on(t.dataQualityStatus),
  // Temporal queries per driver — most common pattern
  index('idx_activity_driver_started').on(t.driverId, t.startedAt),
  // Provider-scoped lookups
  index('idx_activity_provider_ext_txn').on(t.providerId, t.externalTransactionId),
  index('idx_activity_driver_provider').on(t.driverId, t.providerId),
])

// ─── ACTIVITY ADJUSTMENTS ────────────────────────────────────
// Immutable history of every amount change on an activity

export const activityAdjustments = pgTable('activity_adjustments', {
  id:         uuid('id').primaryKey().defaultRandom(),
  activityId: uuid('activity_id').notNull()
    .references(() => driverActivities.id, { onDelete: 'restrict' }),

  adjustmentType: activityAdjustmentTypeEnum('adjustment_type').notNull(),

  // Amount — always positive; direction indicated by type
  amount:   numeric('amount',   { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('CAD'),

  // Direction: CREDIT = adds to driver revenue, DEBIT = reduces it
  direction: varchar('direction', { length: 10 }).notNull(),
  // 'CREDIT' | 'DEBIT'

  reason:    text('reason').notNull(),
  // Human-readable reason — logged for audit

  // Source of this adjustment
  sourceProviderEventId: uuid('source_provider_event_id')
    .references(() => providerEvents.id, { onDelete: 'set null' }),
  createdBy: uuid('created_by').references(() => users.id),

  // Previous/new amount snapshot for traceability
  previousFinalAmount: numeric('previous_final_amount', { precision: 12, scale: 2 }),
  newFinalAmount:      numeric('new_final_amount',       { precision: 12, scale: 2 }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  // No updatedAt — append-only
}, (t) => [
  index('idx_adj_activity').on(t.activityId),
  index('idx_adj_type').on(t.adjustmentType),
  index('idx_adj_created').on(t.createdAt),
])

// ─── ACTIVITY AUDIT EVENTS ───────────────────────────────────

export const activityLedgerAudit = pgTable('activity_ledger_audit', {
  id:         uuid('id').primaryKey().defaultRandom(),
  activityId: uuid('activity_id').notNull()
    .references(() => driverActivities.id, { onDelete: 'restrict' }),

  actorId:   uuid('actor_id').references(() => users.id),
  actorRole: varchar('actor_role', { length: 50 }),

  action: varchar('action', { length: 60 }).notNull(),
  // 'ACTIVITY_CREATED' | 'ACTIVITY_UPDATED' | 'ACTIVITY_FINALIZED'
  // | 'ACTIVITY_CANCELLED' | 'ACTIVITY_DISPUTED' | 'ACTIVITY_VOIDED'
  // | 'ACTIVITY_RECONCILED' | 'AMOUNT_ADJUSTED'

  previousStatus: varchar('previous_status', { length: 30 }),
  newStatus:      varchar('new_status',      { length: 30 }),

  // NEVER: tokens, passwords, raw provider payloads
  metadata: jsonb('metadata').notNull().default({}),

  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_ledger_audit_activity').on(t.activityId),
  index('idx_ledger_audit_actor').on(t.actorId),
  index('idx_ledger_audit_action').on(t.action),
  index('idx_ledger_audit_occurred').on(t.occurredAt),
])

// ─── RELATIONS ────────────────────────────────────────────────

export const driverActivitiesRelations = relations(driverActivities, ({ one, many }) => ({
  driver:            one(driverProfiles,        { fields: [driverActivities.driverId],              references: [driverProfiles.id] }),
  provider:          one(providers,             { fields: [driverActivities.providerId],             references: [providers.id] }),
  providerAccount:   one(driverProviderAccounts, { fields: [driverActivities.providerAccountId],    references: [driverProviderAccounts.id] }),
  jurisdiction:      one(jurisdictions,         { fields: [driverActivities.jurisdictionId],         references: [jurisdictions.id] }),
  vehicle:           one(vehicles,              { fields: [driverActivities.vehicleId],              references: [vehicles.id] }),
  sourceProviderEvent: one(providerEvents,      { fields: [driverActivities.sourceProviderEventId],  references: [providerEvents.id] }),
  sourceTaxiTrip:    one(taxiTrips,             { fields: [driverActivities.sourceTaxiTripId],       references: [taxiTrips.id] }),
  adjustments:       many(activityAdjustments),
  auditEvents:       many(activityLedgerAudit),
}))

export const activityAdjustmentsRelations = relations(activityAdjustments, ({ one }) => ({
  activity:    one(driverActivities, { fields: [activityAdjustments.activityId],              references: [driverActivities.id] }),
  sourceEvent: one(providerEvents,   { fields: [activityAdjustments.sourceProviderEventId],   references: [providerEvents.id] }),
  createdBy:   one(users,            { fields: [activityAdjustments.createdBy],                references: [users.id] }),
}))

export const activityLedgerAuditRelations = relations(activityLedgerAudit, ({ one }) => ({
  activity: one(driverActivities, { fields: [activityLedgerAudit.activityId], references: [driverActivities.id] }),
  actor:    one(users,            { fields: [activityLedgerAudit.actorId],    references: [users.id] }),
}))

export const activityTypesRelations = relations(activityTypes, ({ many }) => ({
  activities: many(driverActivities),
}))
