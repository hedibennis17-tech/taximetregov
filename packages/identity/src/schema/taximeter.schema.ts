// ================================================================
// TAXIMÈTRE.GOV — DIGITAL TAXIMETER SCHEMA
// Database Phase 8/20 — Taximeter · GPS · Taxi Trips · Fare Engine
// ================================================================
//
// RÈGLES ABSOLUES:
// 1. Tarifs: JAMAIS hardcodés → fare_configurations versionnées
// 2. trip_reference UNIQUE + immuable → référence officielle gouvernementale
// 3. Course COMPLETED → verrouillée · corrections via taxi_trip_adjustments
// 4. 1 seule course ACTIVE par chauffeur (contrainte applicative + index)
// 5. 1 seule course ACTIVE par véhicule (idem)
// 6. GPS: le serveur valide · client ne déclare pas distance officielle
// 7. Temps officiel = server_timestamp (jamais heure téléphone)
// 8. GPS anomaly ≠ fraude automatique → REVIEW_REQUIRED
// 9. command_id UNIQUE → idempotency (double tap/retry safe)
// 10. Provider activities (DB7) NEVER create taxi_trips (systèmes séparés)
// 11. Montants: NUMERIC(12,2) · jamais FLOAT
// 12. Soft delete uniquement · jamais hard delete sur course historique
// ================================================================

import {
  pgTable, pgEnum, uuid, text, boolean, integer,
  timestamp, jsonb, uniqueIndex, index, varchar,
  numeric, smallint,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { users }          from './auth.schema'
import { driverProfiles } from './profiles.schema'
import { vehicles }       from './vehicles.schema'

// ─── ENUMS ───────────────────────────────────────────────────

export const taximeterInstanceStatusEnum = pgEnum('taximeter_instance_status', [
  'OFFLINE',    // Not connected / inactive
  'READY',      // Ready to accept a trip
  'IN_TRIP',    // Actively running a trip
  'SUSPENDED',  // Suspended by government or admin
  'LOCKED',     // Locked — requires resolution before use
])

export const taximeterModeEnum = pgEnum('taximeter_mode', [
  'OFF',
  'AVAILABLE',  // Driver available, waiting for passenger
  'OCCUPIED',   // Passenger on board, meter running
  'PAUSED',     // Trip paused (traffic stop, etc.)
  'COMPLETED',
  'ERROR',
])

export const tripStatusEnum = pgEnum('taxi_trip_status', [
  'CREATED',    // Trip object created, not yet started
  'STARTED',    // Meter running
  'PAUSED',     // Temporarily paused
  'RESUMED',    // Resumed from pause
  'COMPLETED',  // Finalized — immutable from this point
  'CANCELLED',  // Cancelled before completion — remains historical
  'VOIDED',     // Void (administrative action) — remains historical
  'DISPUTED',   // Under dispute review
])

export const tripIntegrityStatusEnum = pgEnum('trip_integrity_status', [
  'NORMAL',
  'WARNING',
  'REVIEW_REQUIRED',
  'SUSPICIOUS',
  'VERIFIED',      // Reviewed and cleared by authorized reviewer
])

export const gpsSourceEnum = pgEnum('gps_source', [
  'DEVICE_GPS',
  'NETWORK',
  'FUSED',
  'OTHER',
])

export const gpsAnomalyTypeEnum = pgEnum('gps_anomaly_type', [
  'GPS_LOST',
  'LOW_ACCURACY',
  'IMPOSSIBLE_SPEED',
  'TELEPORTATION',
  'MISSING_POINTS',
  'SUSPICIOUS_ROUTE',
  'CLOCK_ANOMALY',
])

export const meterEventTypeEnum = pgEnum('meter_event_type', [
  'TAXIMETER_ACTIVATED',
  'TAXIMETER_DEACTIVATED',
  'TAXIMETER_LOCKED',
  'TAXIMETER_SUSPENDED',
  'TRIP_CREATED',
  'TRIP_STARTED',
  'TRIP_PAUSED',
  'TRIP_RESUMED',
  'TRIP_COMPLETED',
  'TRIP_CANCELLED',
  'TRIP_VOIDED',
  'TARIFF_APPLIED',
  'GPS_STARTED',
  'GPS_LOST',
  'GPS_RESTORED',
  'METER_ERROR',
  'ANOMALY_DETECTED',
  'ADJUSTMENT_APPLIED',
])

export const fareComponentTypeEnum = pgEnum('fare_component_type', [
  'BASE_FARE',
  'DISTANCE_RATE',
  'TIME_RATE',
  'WAITING_RATE',
  'MINIMUM_FARE',
  'SURCHARGE',
  'AIRPORT_FEE',
  'OTHER_REGULATED_FEE',
])

export const adjustmentTypeEnum = pgEnum('trip_adjustment_type', [
  'FARE_CORRECTION',
  'ROUNDING_CORRECTION',
  'AUTHORIZED_SURCHARGE',
  'REFUND_ADJUSTMENT',
  'GOVERNMENT_CORRECTION',
  'OTHER',
])

// ─── FARE CONFIGURATIONS ──────────────────────────────────────
// Versioned fare rules — NEVER hardcoded
// Each trip locks to the version active at trip start

export const fareConfigurations = pgTable('fare_configurations', {
  id:      uuid('id').primaryKey().defaultRandom(),
  version: varchar('version', { length: 30 }).notNull(),
  // e.g. 'QC-TAXI-2026.01', 'QC-TAXI-2026.06'

  jurisdiction: varchar('jurisdiction', { length: 10 }).notNull().default('QC'),
  currency:     varchar('currency',     { length: 3  }).notNull().default('CAD'),
  label:        varchar('label',        { length: 100 }).notNull(),
  // Human-readable: 'Tarif taxi Québec — en vigueur 1er janvier 2026'

  // Fare rules — all amounts NUMERIC, never FLOAT
  baseFare:        numeric('base_fare',         { precision: 12, scale: 2 }).notNull(),
  distanceRatePer100m: numeric('distance_rate_per_100m', { precision: 12, scale: 4 }).notNull(),
  timeRatePerMinute:   numeric('time_rate_per_minute',   { precision: 12, scale: 4 }).notNull(),
  waitingRatePerMinute: numeric('waiting_rate_per_minute', { precision: 12, scale: 4 }).notNull(),
  minimumFare:     numeric('minimum_fare',      { precision: 12, scale: 2 }).notNull(),

  // Configurable surcharge flags
  airportSurcharge: numeric('airport_surcharge', { precision: 12, scale: 2 }).default('0'),
  nightSurcharge:   numeric('night_surcharge',   { precision: 12, scale: 2 }).default('0'),
  // Additional fees configured per jurisdiction — never hardcoded

  effectiveFrom:  varchar('effective_from',  { length: 10 }).notNull(),
  // ISO date string: '2026-01-01'
  effectiveUntil: varchar('effective_until', { length: 10 }),
  // null = still in effect

  // Approved by government authority — never self-approved
  approvedBy:  uuid('approved_by').references(() => users.id),
  approvedAt:  timestamp('approved_at', { withTimezone: true }),
  isActive:    boolean('is_active').notNull().default(false),
  isPilot:     boolean('is_pilot').notNull().default(true),
  // isPilot=true = not officially certified yet

  sourceReference: text('source_reference'),
  // Official regulation reference: e.g. 'Décret 2026-001 Québec'

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_fare_config_version').on(t.version),
  index('idx_fare_config_jurisdiction').on(t.jurisdiction),
  index('idx_fare_config_active').on(t.isActive),
  index('idx_fare_config_effective').on(t.effectiveFrom, t.effectiveUntil),
])

// ─── TAXIMETERS ───────────────────────────────────────────────
// One taximeter instance per active driver+vehicle session

export const taximeters = pgTable('taximeters', {
  id:              uuid('id').primaryKey().defaultRandom(),
  publicTaximeterId: varchar('public_taximeter_id', { length: 20 }).notNull().unique(),
  // Format: TXM-XXXXXXXX

  driverId:  uuid('driver_id').notNull()
    .references(() => driverProfiles.id, { onDelete: 'cascade' }),
  vehicleId: uuid('vehicle_id').notNull()
    .references(() => vehicles.id, { onDelete: 'restrict' }),

  status:      taximeterInstanceStatusEnum('status').notNull().default('OFFLINE'),
  currentMode: taximeterModeEnum('current_mode').notNull().default('OFF'),

  jurisdiction: varchar('jurisdiction', { length: 10 }).notNull().default('QC'),

  // Device tracking
  deviceId:   varchar('device_id', { length: 100 }),
  // Hashed device fingerprint — never raw identifier
  appVersion: varchar('app_version', { length: 20 }),

  activatedAt:   timestamp('activated_at',   { withTimezone: true }),
  deactivatedAt: timestamp('deactivated_at', { withTimezone: true }),

  // Only 1 active taximeter per driver enforced at application layer
  // + partial unique index on (driver_id) WHERE status IN ('READY','IN_TRIP')

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_taximeter_driver').on(t.driverId),
  index('idx_taximeter_vehicle').on(t.vehicleId),
  index('idx_taximeter_status').on(t.status),
])

// ─── TAXI TRIPS ───────────────────────────────────────────────

export const taxiTrips = pgTable('taxi_trips', {
  id:            uuid('id').primaryKey().defaultRandom(),
  publicTripId:  varchar('public_trip_id', { length: 20 }).notNull().unique(),
  // Format: TRP-XXXXXXXX

  // Unique government reference — immutable once created
  tripReference: varchar('trip_reference', { length: 30 }).notNull().unique(),
  // Format: TXG-2026-000000001 — used in payment, receipt, audit, gov reporting

  taximeterId: uuid('taximeter_id').notNull()
    .references(() => taximeters.id, { onDelete: 'restrict' }),
  driverId:    uuid('driver_id').notNull()
    .references(() => driverProfiles.id, { onDelete: 'restrict' }),
  vehicleId:   uuid('vehicle_id').notNull()
    .references(() => vehicles.id, { onDelete: 'restrict' }),

  tripStatus: tripStatusEnum('trip_status').notNull().default('CREATED'),
  integrityStatus: tripIntegrityStatusEnum('trip_integrity_status').notNull().default('NORMAL'),

  // Fare version — locked at trip start · historical trips never updated
  fareConfigurationId: uuid('fare_configuration_id')
    .references(() => fareConfigurations.id, { onDelete: 'restrict' }),
  fareVersion: varchar('fare_version', { length: 30 }),
  // Denormalized snapshot of version — preserved even if config changes

  jurisdiction: varchar('jurisdiction', { length: 10 }).notNull().default('QC'),
  currency:     varchar('currency',     { length: 3  }).notNull().default('CAD'),

  // Server-authoritative timestamps (never client-declared)
  startedAt:   timestamp('started_at',   { withTimezone: true }),
  pausedAt:    timestamp('paused_at',    { withTimezone: true }),
  resumedAt:   timestamp('resumed_at',   { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),

  // Accumulated distances — computed server-side from GPS points
  distanceMeters:  integer('distance_meters').notNull().default(0),
  // Official distance — client cannot override
  elapsedSeconds:  integer('elapsed_seconds').notNull().default(0),
  waitingSeconds:  integer('waiting_seconds').notNull().default(0),

  // Amounts — NUMERIC(12,2), never FLOAT
  estimatedAmount: numeric('estimated_amount', { precision: 12, scale: 2 }),
  finalAmount:     numeric('final_amount',     { precision: 12, scale: 2 }),
  // finalAmount only set when status = COMPLETED

  // Receipt reference — for future payment + receipt system
  receiptReference: varchar('receipt_reference', { length: 30 }).unique(),
  // Format: RCP-TXG-2026-000001

  // Idempotency — command IDs prevent double-actions
  startCommandId:    varchar('start_command_id',    { length: 60 }).unique(),
  completeCommandId: varchar('complete_command_id', { length: 60 }).unique(),

  // Device context (never used as driver identity)
  deviceId:   varchar('device_id',   { length: 100 }),
  appVersion: varchar('app_version', { length: 20  }),

  // Fare snapshot — preserved forever
  fareSnapshot: jsonb('fare_snapshot'),
  // Full fare config at time of trip start — immutable

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_taxi_trip_driver').on(t.driverId),
  index('idx_taxi_trip_vehicle').on(t.vehicleId),
  index('idx_taxi_trip_taximeter').on(t.taximeterId),
  index('idx_taxi_trip_status').on(t.tripStatus),
  index('idx_taxi_trip_started').on(t.startedAt),
  index('idx_taxi_trip_reference').on(t.tripReference),
  // Active trip per driver — partial index concept
  index('idx_taxi_trip_driver_active').on(t.driverId, t.tripStatus),
])

// ─── GPS POINTS ───────────────────────────────────────────────

export const tripGpsPoints = pgTable('trip_gps_points', {
  id:     uuid('id').primaryKey().defaultRandom(),
  tripId: uuid('trip_id').notNull()
    .references(() => taxiTrips.id, { onDelete: 'cascade' }),

  // Server-recorded timestamp — not client-declared
  serverTimestamp: timestamp('server_timestamp', { withTimezone: true }).notNull().defaultNow(),
  // Client-reported timestamp (informational — not authoritative)
  clientTimestamp: timestamp('client_timestamp', { withTimezone: true }),

  // DECIMAL precision for coordinates
  latitude:  numeric('latitude',  { precision: 10, scale: 7 }).notNull(),
  longitude: numeric('longitude', { precision: 10, scale: 7 }).notNull(),

  accuracyMeters: numeric('accuracy_meters', { precision: 8, scale: 2 }),
  speedMps:       numeric('speed_mps',       { precision: 8, scale: 3 }),
  // meters per second — not km/h (avoid ambiguity)
  heading:        numeric('heading',         { precision: 6, scale: 2 }),
  // degrees 0-360
  altitude:       numeric('altitude',        { precision: 8, scale: 2 }),

  source: gpsSourceEnum('gps_source').notNull().default('DEVICE_GPS'),

  // Sequence — enables detection of missing/out-of-order points
  eventSequence: integer('event_sequence').notNull(),

  // Flag low-quality points
  isFiltered:   boolean('is_filtered').notNull().default(false),
  filterReason: varchar('filter_reason', { length: 50 }),
  // 'LOW_ACCURACY' | 'IMPOSSIBLE_SPEED' | 'DUPLICATE' | etc.

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_gps_trip').on(t.tripId),
  index('idx_gps_trip_seq').on(t.tripId, t.eventSequence),
  index('idx_gps_server_ts').on(t.serverTimestamp),
])

// ─── METER READINGS ───────────────────────────────────────────
// Periodic snapshots of meter state during trip

export const tripMeterReadings = pgTable('trip_meter_readings', {
  id:     uuid('id').primaryKey().defaultRandom(),
  tripId: uuid('trip_id').notNull()
    .references(() => taxiTrips.id, { onDelete: 'cascade' }),

  serverTimestamp: timestamp('server_timestamp', { withTimezone: true }).notNull().defaultNow(),

  distanceMeters:  integer('distance_meters').notNull().default(0),
  elapsedSeconds:  integer('elapsed_seconds').notNull().default(0),
  waitingSeconds:  integer('waiting_seconds').notNull().default(0),

  // Calculated meter amount at this point — NUMERIC
  runningAmount: numeric('running_amount', { precision: 12, scale: 2 }),
  currency:      varchar('currency', { length: 3 }),

  meterStatus: varchar('meter_status', { length: 20 }),
  // 'RUNNING' | 'PAUSED' | 'WAITING'

  eventSequence: integer('event_sequence').notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_meter_reading_trip').on(t.tripId),
  index('idx_meter_reading_seq').on(t.tripId, t.eventSequence),
])

// ─── TAXIMETER EVENTS ────────────────────────────────────────

export const taxiMeterEvents = pgTable('taxi_meter_events', {
  id:     uuid('id').primaryKey().defaultRandom(),
  tripId: uuid('trip_id')
    .references(() => taxiTrips.id, { onDelete: 'set null' }),
  taximeterId: uuid('taximeter_id')
    .references(() => taximeters.id, { onDelete: 'set null' }),
  driverId: uuid('driver_id')
    .references(() => driverProfiles.id, { onDelete: 'set null' }),

  eventType: meterEventTypeEnum('event_type').notNull(),

  // Sequence within the trip — enables missing event detection
  eventSequence: integer('event_sequence'),

  // State transition
  previousState: varchar('previous_state', { length: 30 }),
  newState:      varchar('new_state',      { length: 30 }),

  // Idempotency — command that triggered this event
  commandId: varchar('command_id', { length: 60 }).unique(),

  // Device context
  deviceId:        varchar('device_id',   { length: 100 }),
  appVersion:      varchar('app_version', { length: 20  }),

  // Server timestamp — authoritative
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),

  // Non-sensitive metadata
  metadata: jsonb('metadata').notNull().default({}),
  // Never includes: password, token, fare manipulation attempt

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_meter_event_trip').on(t.tripId),
  index('idx_meter_event_taximeter').on(t.taximeterId),
  index('idx_meter_event_driver').on(t.driverId),
  index('idx_meter_event_type').on(t.eventType),
  index('idx_meter_event_seq').on(t.tripId, t.eventSequence),
  index('idx_meter_event_occurred').on(t.occurredAt),
])

// ─── GPS ANOMALIES ────────────────────────────────────────────

export const tripGpsAnomalies = pgTable('trip_gps_anomalies', {
  id:     uuid('id').primaryKey().defaultRandom(),
  tripId: uuid('trip_id').notNull()
    .references(() => taxiTrips.id, { onDelete: 'cascade' }),

  anomalyType: gpsAnomalyTypeEnum('anomaly_type').notNull(),

  // Affected GPS point (if applicable)
  gpsPointId: uuid('gps_point_id')
    .references(() => tripGpsPoints.id, { onDelete: 'set null' }),

  description: text('description').notNull(),
  severity:    varchar('severity', { length: 20 }).notNull().default('WARNING'),
  // 'INFO' | 'WARNING' | 'CRITICAL'

  // CRITICAL: anomaly ≠ automatic fraud accusation
  reviewRequired: boolean('review_required').notNull().default(true),
  reviewedBy:     uuid('reviewed_by').references(() => users.id),
  reviewedAt:     timestamp('reviewed_at', { withTimezone: true }),
  reviewDecision: varchar('review_decision', { length: 30 }),
  // 'FALSE_POSITIVE' | 'CONFIRMED_ANOMALY' | 'FRAUD_SUSPECTED' | 'RESOLVED'

  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt:  timestamp('created_at',  { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_gps_anomaly_trip').on(t.tripId),
  index('idx_gps_anomaly_type').on(t.anomalyType),
  index('idx_gps_anomaly_review').on(t.reviewRequired),
])

// ─── TRIP ADJUSTMENTS ────────────────────────────────────────

export const taxiTripAdjustments = pgTable('taxi_trip_adjustments', {
  id:     uuid('id').primaryKey().defaultRandom(),
  tripId: uuid('trip_id').notNull()
    .references(() => taxiTrips.id, { onDelete: 'restrict' }),

  adjustmentType: adjustmentTypeEnum('adjustment_type').notNull(),

  // Amount — NUMERIC, never FLOAT
  amount:   numeric('amount',   { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('CAD'),

  reason:    text('reason').notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  // Government authorized user — never self-adjusted by driver

  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_trip_adj_trip').on(t.tripId),
  index('idx_trip_adj_type').on(t.adjustmentType),
])

// ─── RELATIONS ────────────────────────────────────────────────

export const fareConfigurationsRelations = relations(fareConfigurations, ({ one, many }) => ({
  approvedBy: one(users, { fields: [fareConfigurations.approvedBy], references: [users.id] }),
  trips:      many(taxiTrips),
}))

export const taximetersRelations = relations(taximeters, ({ one, many }) => ({
  driver:  one(driverProfiles, { fields: [taximeters.driverId],  references: [driverProfiles.id] }),
  vehicle: one(vehicles,       { fields: [taximeters.vehicleId], references: [vehicles.id] }),
  trips:   many(taxiTrips),
  events:  many(taxiMeterEvents),
}))

export const taxiTripsRelations = relations(taxiTrips, ({ one, many }) => ({
  taximeter:         one(taximeters,        { fields: [taxiTrips.taximeterId],         references: [taximeters.id] }),
  driver:            one(driverProfiles,    { fields: [taxiTrips.driverId],            references: [driverProfiles.id] }),
  vehicle:           one(vehicles,          { fields: [taxiTrips.vehicleId],           references: [vehicles.id] }),
  fareConfiguration: one(fareConfigurations, { fields: [taxiTrips.fareConfigurationId], references: [fareConfigurations.id] }),
  gpsPoints:         many(tripGpsPoints),
  meterReadings:     many(tripMeterReadings),
  events:            many(taxiMeterEvents),
  anomalies:         many(tripGpsAnomalies),
  adjustments:       many(taxiTripAdjustments),
}))

export const tripGpsAnomaliesRelations = relations(tripGpsAnomalies, ({ one }) => ({
  trip:       one(taxiTrips,     { fields: [tripGpsAnomalies.tripId],     references: [taxiTrips.id] }),
  gpsPoint:   one(tripGpsPoints, { fields: [tripGpsAnomalies.gpsPointId], references: [tripGpsPoints.id] }),
  reviewedBy: one(users,         { fields: [tripGpsAnomalies.reviewedBy], references: [users.id] }),
}))

export const taxiTripAdjustmentsRelations = relations(taxiTripAdjustments, ({ one }) => ({
  trip:       one(taxiTrips, { fields: [taxiTripAdjustments.tripId],       references: [taxiTrips.id] }),
  createdBy:  one(users,     { fields: [taxiTripAdjustments.createdBy],    references: [users.id] }),
  approvedBy: one(users,     { fields: [taxiTripAdjustments.approvedBy],   references: [users.id] }),
}))
