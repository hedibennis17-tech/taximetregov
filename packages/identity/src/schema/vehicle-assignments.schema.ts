// ================================================================
// TAXIMÈTRE.GOV — VEHICLE ASSIGNMENTS & REGISTRATION SCHEMA
// Database Phase 4/20 — Driver ↔ Vehicle · Registrations · Regulatory
// ================================================================
//
// RÈGLES ABSOLUES:
// 1. VIN/plaque: hash (SHA-256) pour recherche + encrypted pour valeur
//    → vin_hash (index) · vin_encrypted (valeur) · vin_last4 (affichage)
// 2. Jamais retourner vin_encrypted / plate_encrypted par défaut
// 3. Historique des affectations: jamais supprimé
// 4. Chevauchements: détectés et bloqués par validation métier
// 5. Delivery → taximeter ALWAYS DISABLED (aucun lien avec vehicle_type)
// 6. Soft delete uniquement (archived_at) — jamais hard delete si trips/payments
// 7. Approbation: uniquement par utilisateur gouvernemental autorisé
//    → jamais auto-approbation par le chauffeur
// 8. Requête temporelle supportée: quel chauffeur à date X ?
// ================================================================

import {
  pgTable, pgEnum, uuid, text, boolean,
  timestamp, jsonb, uniqueIndex, index,
  varchar, date,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { users }          from './auth.schema'
import { driverProfiles } from './profiles.schema'
import { vehicles }       from './vehicles.schema'

// ─── ENUMS ───────────────────────────────────────────────────

export const assignmentTypeEnum = pgEnum('assignment_type', [
  'OWNER',            // Chauffeur = propriétaire
  'PRIMARY_DRIVER',   // Conducteur principal (propriétaire différent)
  'AUTHORIZED_DRIVER',// Conducteur autorisé secondaire
  'LEASED',           // Location longue durée
  'RENTED',           // Location courte durée
  'OTHER',
])

export const assignmentStatusEnum = pgEnum('assignment_status', [
  'ACTIVE',     // Affectation courante
  'SCHEDULED',  // Planifiée mais pas encore active
  'ENDED',      // Terminée normalement
  'REVOKED',    // Révoquée par autorité
])

export const registrationStatusEnum = pgEnum('registration_status', [
  'UNKNOWN',
  'PENDING',
  'VALID',
  'EXPIRED',
  'SUSPENDED',
  'REVOKED',
])

export const operationalStatusEnum = pgEnum('operational_status', [
  'ACTIVE',
  'INACTIVE',
  'OUT_OF_SERVICE',
  'RETIRED',
])

export const vehicleRegulatoryStatusEnum = pgEnum('vehicle_regulatory_status', [
  'PENDING',
  'UNDER_REVIEW',
  'APPROVED',
  'CONDITIONAL',
  'SUSPENDED',
  'EXPIRED',
  'REVOKED',
  'INACTIVE',
])

// ─── VEHICLE EXTENSIONS ───────────────────────────────────────
// DB-4 adds columns that were missing from DB-3 vehicles table.
// These are added via ALTER TABLE in the migration.
// New columns: public_vehicle_id, vin_hash, plate_hash,
//              registration_status, operational_status, approved_by, approved_at

// Note: The vehicles table itself is defined in vehicles.schema.ts (DB-3).
// DB-4 migration adds the new columns via ALTER TABLE.

// ─── VEHICLE REGISTRATIONS ────────────────────────────────────

export const vehicleRegistrations = pgTable('vehicle_registrations', {
  id:        uuid('id').primaryKey().defaultRandom(),
  vehicleId: uuid('vehicle_id').notNull()
    .references(() => vehicles.id, { onDelete: 'cascade' }),

  jurisdiction: varchar('jurisdiction', { length: 10 }).notNull().default('QC'),

  // Registration number — encrypted + hash for search + last4 for display
  registrationNumberEncrypted: text('registration_number_encrypted'),
  registrationNumberEncKeyVer: varchar('registration_number_enc_key_ver', { length: 20 }),
  registrationHash:            varchar('registration_hash', { length: 64 }),
  // SHA-256(normalized_registration) — index for exact lookup without decrypting
  registrationLast4:           varchar('registration_last4', { length: 4 }),
  // Display only: ••••1234

  validFrom:  date('valid_from').notNull(),
  validUntil: date('valid_until').notNull(),

  status: registrationStatusEnum('status').notNull().default('PENDING'),

  // Verification
  verifiedBy: uuid('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),

  // Notification tracking
  expiryNotifiedAt: timestamp('expiry_notified_at', { withTimezone: true }),

  // Document reference — signed URL only
  documentRef: text('document_ref'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_vehicle_reg_vehicle').on(t.vehicleId),
  index('idx_vehicle_reg_jurisdiction').on(t.jurisdiction),
  index('idx_vehicle_reg_valid_until').on(t.validUntil),
  index('idx_vehicle_reg_status').on(t.status),
  index('idx_vehicle_reg_hash').on(t.registrationHash),
])

// ─── VEHICLE REGULATORY PROFILES ─────────────────────────────

export const vehicleRegulatoryProfiles = pgTable('vehicle_regulatory_profiles', {
  id:        uuid('id').primaryKey().defaultRandom(),
  vehicleId: uuid('vehicle_id').notNull()
    .references(() => vehicles.id, { onDelete: 'cascade' }),

  jurisdiction:     varchar('jurisdiction', { length: 10 }).notNull().default('QC'),
  regulatoryStatus: vehicleRegulatoryStatusEnum('regulatory_status').notNull().default('PENDING'),

  effectiveFrom:  date('effective_from').notNull(),
  effectiveUntil: date('effective_until'),
  // null = indefinite approval

  // Approval
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  // Driver can NEVER self-approve

  // Conditions (e.g. "Max 7 ans — véhicule accessible requis")
  conditions: text('conditions').array().default(sql`'{}'`),

  // Review notes — internal only, never returned to driver
  reviewNotes: text('review_notes'),
  rejectionReason: text('rejection_reason'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_vehicle_reg_profile_vehicle').on(t.vehicleId),
  index('idx_vehicle_reg_profile_status').on(t.regulatoryStatus),
  index('idx_vehicle_reg_profile_jurisdiction').on(t.jurisdiction),
  index('idx_vehicle_reg_profile_effective').on(t.effectiveFrom, t.effectiveUntil),
])

// ─── DRIVER VEHICLE ASSIGNMENTS ───────────────────────────────
//
// Many-to-many with temporal validity.
// A driver can have multiple vehicles over time.
// A vehicle can be assigned to multiple drivers over time (sequential).
// Overlap detection is enforced at the application layer.

export const driverVehicleAssignments = pgTable('driver_vehicle_assignments', {
  id:       uuid('id').primaryKey().defaultRandom(),
  driverId: uuid('driver_id').notNull()
    .references(() => driverProfiles.id, { onDelete: 'cascade' }),
  vehicleId: uuid('vehicle_id').notNull()
    .references(() => vehicles.id, { onDelete: 'restrict' }),
  // RESTRICT: cannot delete vehicle with active assignment

  assignmentType: assignmentTypeEnum('assignment_type').notNull().default('PRIMARY_DRIVER'),
  status:         assignmentStatusEnum('assignment_status').notNull().default('ACTIVE'),

  // Temporal validity — enables historical queries
  validFrom:  timestamp('valid_from', { withTimezone: true }).notNull(),
  validUntil: timestamp('valid_until', { withTimezone: true }),
  // null = still active

  assignedBy: uuid('assigned_by').references(() => users.id),
  // Who created this assignment (could be driver or government user)

  endedBy:   uuid('ended_by').references(() => users.id),
  endReason: text('end_reason'),

  // Notes
  notes: text('notes'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_dva_driver').on(t.driverId),
  index('idx_dva_vehicle').on(t.vehicleId),
  index('idx_dva_valid_from').on(t.validFrom),
  index('idx_dva_valid_until').on(t.validUntil),
  index('idx_dva_status').on(t.status),
  // Composite index for temporal queries: "who had vehicle X on date Y?"
  index('idx_dva_vehicle_temporal').on(t.vehicleId, t.validFrom, t.validUntil),
  // Composite index for "what vehicles did driver X have on date Y?"
  index('idx_dva_driver_temporal').on(t.driverId, t.validFrom, t.validUntil),
])

// ─── VEHICLE STATUS HISTORY ───────────────────────────────────

export const vehicleStatusHistory = pgTable('vehicle_status_history', {
  id:        uuid('id').primaryKey().defaultRandom(),
  vehicleId: uuid('vehicle_id').notNull()
    .references(() => vehicles.id, { onDelete: 'cascade' }),

  previousStatus: varchar('previous_status', { length: 40 }),
  // Can reference either operational_status or regulatory_status
  newStatus:      varchar('new_status', { length: 40 }).notNull(),

  statusType: varchar('status_type', { length: 30 }).notNull(),
  // 'OPERATIONAL' | 'REGULATORY' | 'REGISTRATION'

  reason:    text('reason').notNull(),
  changedBy: uuid('changed_by').references(() => users.id),
  // Government user or system — never self-approved by driver

  metadata: jsonb('metadata').notNull().default({}),
  // Additional context without exposing sensitive values

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_vehicle_status_hist_vehicle').on(t.vehicleId),
  index('idx_vehicle_status_hist_created').on(t.createdAt),
  index('idx_vehicle_status_hist_type').on(t.statusType),
])

// ─── RELATIONS ────────────────────────────────────────────────

export const vehicleRegistrationsRelations = relations(vehicleRegistrations, ({ one }) => ({
  vehicle:    one(vehicles, { fields: [vehicleRegistrations.vehicleId],  references: [vehicles.id] }),
  verifiedBy: one(users,    { fields: [vehicleRegistrations.verifiedBy], references: [users.id] }),
}))

export const vehicleRegulatoryProfilesRelations = relations(vehicleRegulatoryProfiles, ({ one }) => ({
  vehicle:    one(vehicles, { fields: [vehicleRegulatoryProfiles.vehicleId],   references: [vehicles.id] }),
  approvedBy: one(users,    { fields: [vehicleRegulatoryProfiles.approvedBy],  references: [users.id] }),
}))

export const driverVehicleAssignmentsRelations = relations(driverVehicleAssignments, ({ one }) => ({
  driver:     one(driverProfiles, { fields: [driverVehicleAssignments.driverId],   references: [driverProfiles.id] }),
  vehicle:    one(vehicles,       { fields: [driverVehicleAssignments.vehicleId],  references: [vehicles.id] }),
  assignedBy: one(users,          { fields: [driverVehicleAssignments.assignedBy], references: [users.id] }),
  endedBy:    one(users,          { fields: [driverVehicleAssignments.endedBy],    references: [users.id] }),
}))

export const vehicleStatusHistoryRelations = relations(vehicleStatusHistory, ({ one }) => ({
  vehicle:   one(vehicles, { fields: [vehicleStatusHistory.vehicleId],   references: [vehicles.id] }),
  changedBy: one(users,    { fields: [vehicleStatusHistory.changedBy],   references: [users.id] }),
}))
