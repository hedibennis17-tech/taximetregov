// ================================================================
// TAXIMÈTRE.GOV — VEHICLES, LICENCES & PERMITS SCHEMA
// Database Phase 3/20 — Véhicules, permis & licences
// ================================================================
//
// RÈGLES ABSOLUES:
// 1. VIN chiffré côté application — jamais en clair en DB
// 2. Plaques masquées dans les API (ex: ••••QC22)
// 3. Un seul véhicule ACTIVE par chauffeur par session
// 4. Permis/licence: VERIFIED uniquement après vérification réelle
// 5. Inspection: EXPIRING_SOON déclenchée automatiquement (configurable)
// 6. Assurance commerciale OBLIGATOIRE pour TAXI (vérification séparée)
// 7. Taximètre: certifié ≠ installé (deux champs distincts)
// 8. Soft delete uniquement — jamais hard delete sur véhicule actif
// ================================================================

import {
  pgTable, pgEnum, uuid, text, boolean,
  timestamp, integer, jsonb, uniqueIndex, index,
  varchar, date, smallint,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { users }          from './auth.schema'
import { driverProfiles } from './profiles.schema'

// ─── ENUMS ───────────────────────────────────────────────────

export const vehicleStatusEnum = pgEnum('vehicle_status', [
  'PENDING',       // Soumis, en attente de vérification
  'UNDER_REVIEW',  // En cours de révision
  'ACTIVE',        // Approuvé et actif
  'SUSPENDED',     // Suspendu temporairement
  'REJECTED',      // Refusé
  'DEACTIVATED',   // Désactivé définitivement
  'ARCHIVED',      // Archivé (ex: vendu)
])

export const vehicleTypeEnum = pgEnum('vehicle_type', [
  'SEDAN',
  'SUV',
  'MINIVAN',
  'VAN',
  'HYBRID',
  'ELECTRIC',
  'MOTORCYCLE',
  'TRUCK',
  'OTHER',
])

export const fuelTypeEnum = pgEnum('fuel_type', [
  'GASOLINE',
  'DIESEL',
  'HYBRID',
  'ELECTRIC',
  'PLUG_IN_HYBRID',
  'HYDROGEN',
  'OTHER',
])

export const licenseClassEnum = pgEnum('license_class', [
  'CLASS_1',  // Véhicule lourd articulé
  'CLASS_2',  // Autobus
  'CLASS_3',  // Véhicule lourd rigide
  'CLASS_4A', // Taxi / transport rémunéré
  'CLASS_4B', // Autobus scolaire
  'CLASS_4C', // Minibus
  'CLASS_5',  // Véhicule de promenade standard
  'CLASS_6A', // Moto
  'CLASS_6B', // Motocyclette restreinte
  'CLASS_8',  // Véhicule hors route
  'OTHER',
])

export const permitStatusEnum = pgEnum('permit_status', [
  'PENDING',
  'ACTIVE',
  'SUSPENDED',
  'EXPIRED',
  'REVOKED',
  'UNDER_REVIEW',
  'RENEWAL_PENDING',
])

export const inspectionStatusEnum = pgEnum('inspection_status', [
  'VALID',
  'EXPIRING_SOON',  // < configurable threshold (ex: 60 jours)
  'EXPIRED',
  'FAILED',
  'PENDING',
  'SCHEDULED',
])

export const insuranceStatusEnum = pgEnum('insurance_status', [
  'VALID',
  'EXPIRING_SOON',
  'EXPIRED',
  'CANCELLED',
  'PENDING_VERIFICATION',
])

export const taximeterStatusEnum = pgEnum('taximeter_status', [
  'NOT_INSTALLED',
  'INSTALLED_NOT_CERTIFIED',  // Pilote — certification officielle requise
  'CERTIFIED',                // Homologué par autorité compétente
  'DECOMMISSIONED',
  'NEEDS_RECERTIFICATION',
])

export const serviceAuthStatusEnum = pgEnum('service_auth_status', [
  'AUTHORIZED',
  'PENDING',
  'SUSPENDED',
  'BLOCKED',
  'NOT_APPLICABLE',
])

// ─── VEHICLES ─────────────────────────────────────────────────

export const vehicles = pgTable('vehicles', {
  id:       uuid('id').primaryKey().defaultRandom(),
  driverId: uuid('driver_id').notNull()
    .references(() => driverProfiles.id, { onDelete: 'cascade' }),

  // Public vehicle identifier
  vehicleNumber: varchar('vehicle_number', { length: 20 }).notNull().unique(),
  // Format: V-QC-XXXXXX · e.g. V-QC-001234

  // VIN — chiffré au niveau application (AES-256)
  // Jamais retourné dans les API publiques
  vinEncrypted:        text('vin_encrypted'),
  vinEncryptionKeyVer: varchar('vin_encryption_key_ver', { length: 20 }),
  // Last 4 chars of VIN for display only
  vinLastFour:         varchar('vin_last_four', { length: 4 }),

  // Plaque — masquée dans les API: ••••QC22
  licensePlateEncrypted:    text('license_plate_encrypted'),
  licensePlateRegion:       varchar('license_plate_region', { length: 10 }).default('QC'),
  licensePlateMasked:       varchar('license_plate_masked', { length: 20 }),
  // ex: ••••QC22 — jamais la plaque complète

  make:        varchar('make',  { length: 50 }).notNull(),  // Toyota
  model:       varchar('model', { length: 50 }).notNull(),  // Prius
  year:        smallint('year').notNull(),                  // 2022
  color:       varchar('color', { length: 30 }),
  vehicleType: vehicleTypeEnum('vehicle_type').notNull(),
  fuelType:    fuelTypeEnum('fuel_type').notNull().default('GASOLINE'),

  // Capacity
  seatingCapacity:    smallint('seating_capacity').default(4),
  accessibilityFeatures: text('accessibility_features').array().default(sql`'{}'`),
  // e.g. ['WHEELCHAIR_RAMP', 'HEARING_LOOP']

  status:   vehicleStatusEnum('vehicle_status').notNull().default('PENDING'),
  isActive: boolean('is_active').notNull().default(false),
  // Un seul isActive=true par driver à la fois (enforced by application)

  // Taximètre
  taximeterStatus:       taximeterStatusEnum('taximeter_status').notNull().default('NOT_INSTALLED'),
  taximeterSerialMasked: varchar('taximeter_serial_masked', { length: 20 }),
  taximeterCertifiedAt:  timestamp('taximeter_certified_at',  { withTimezone: true }),
  taximeterCertifiedBy:  varchar('taximeter_certified_by', { length: 100 }),
  // Note: isPilot = certification non officielle en mode pilote

  verifiedBy: uuid('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),

  // Odometer at registration (km)
  odometerAtRegistration: integer('odometer_at_registration'),

  notes: text('notes'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => [
  index('idx_vehicles_driver').on(t.driverId),
  index('idx_vehicles_status').on(t.status),
  index('idx_vehicles_active').on(t.driverId, t.isActive),
  index('idx_vehicles_number').on(t.vehicleNumber),
])

// ─── VEHICLE SERVICE AUTHORIZATIONS ──────────────────────────

export const vehicleServiceAuthorizations = pgTable('vehicle_service_authorizations', {
  id:        uuid('id').primaryKey().defaultRandom(),
  vehicleId: uuid('vehicle_id').notNull()
    .references(() => vehicles.id, { onDelete: 'cascade' }),
  driverId:  uuid('driver_id').notNull()
    .references(() => driverProfiles.id, { onDelete: 'cascade' }),

  // Authorization per service type — fully independent
  taxiStatus:      serviceAuthStatusEnum('taxi_status').notNull().default('PENDING'),
  rideshareStatus: serviceAuthStatusEnum('rideshare_status').notNull().default('PENDING'),
  deliveryStatus:  serviceAuthStatusEnum('delivery_status').notNull().default('NOT_APPLICABLE'),
  personalStatus:  serviceAuthStatusEnum('personal_status').notNull().default('AUTHORIZED'),

  // Suspension reason per service (if suspended)
  taxiSuspensionReason:      text('taxi_suspension_reason'),
  rideshareSuspensionReason: text('rideshare_suspension_reason'),
  deliverySuspensionReason:  text('delivery_suspension_reason'),

  authorizedBy: uuid('authorized_by').references(() => users.id),
  authorizedAt: timestamp('authorized_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_vehicle_service_auth_unique').on(t.vehicleId, t.driverId),
  index('idx_vehicle_service_auth_vehicle').on(t.vehicleId),
  index('idx_vehicle_service_auth_driver').on(t.driverId),
])

// ─── DRIVER LICENSES ──────────────────────────────────────────

export const driverLicenses = pgTable('driver_licenses', {
  id:       uuid('id').primaryKey().defaultRandom(),
  driverId: uuid('driver_id').notNull()
    .references(() => driverProfiles.id, { onDelete: 'cascade' }),

  licenseClass:  licenseClassEnum('license_class').notNull(),
  jurisdiction:  varchar('jurisdiction', { length: 10 }).notNull().default('QC'),

  // License number — chiffré · jamais en clair
  licenseNumberEncrypted:    text('license_number_encrypted'),
  licenseNumberEncKeyVer:    varchar('license_number_enc_key_ver', { length: 20 }),
  // Masked for display: M••••••1234
  licenseNumberMasked:       varchar('license_number_masked', { length: 20 }).notNull(),

  issueDate:  date('issue_date').notNull(),
  expiryDate: date('expiry_date').notNull(),

  status:             permitStatusEnum('status').notNull().default('PENDING'),
  restrictions:       text('restrictions').array().default(sql`'{}'`),
  // e.g. ['CORRECTIVE_LENSES', 'AUTOMATIC_ONLY']

  verificationStatus: varchar('verification_status', { length: 30 }).notNull().default('NOT_STARTED'),
  // NOT_STARTED | PENDING | VERIFIED | FAILED | EXPIRED

  verifiedBy: uuid('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),

  // Days until expiry — computed at query time by application
  // Not stored: calculated from expiry_date - CURRENT_DATE

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_driver_licenses_driver').on(t.driverId),
  index('idx_driver_licenses_expiry').on(t.expiryDate),
  index('idx_driver_licenses_status').on(t.status),
  index('idx_driver_licenses_class').on(t.licenseClass),
])

// ─── TAXI PERMITS ─────────────────────────────────────────────

export const taxiPermits = pgTable('taxi_permits', {
  id:       uuid('id').primaryKey().defaultRandom(),
  driverId: uuid('driver_id').notNull()
    .references(() => driverProfiles.id, { onDelete: 'cascade' }),

  jurisdiction: varchar('jurisdiction', { length: 10 }).notNull().default('QC'),
  permitType:   varchar('permit_type', { length: 50 }).notNull().default('TAXI'),
  // 'TAXI' | 'LIMOUSINE' | 'RIDESHARE' | 'AIRPORT_EXCLUSIVE'

  // Permit number — masked: TP-••••••78
  permitNumberEncrypted: text('permit_number_encrypted'),
  permitNumberEncKeyVer: varchar('permit_number_enc_key_ver', { length: 20 }),
  permitNumberMasked:    varchar('permit_number_masked', { length: 20 }).notNull(),
  // Format: TP-••••••78

  status:     permitStatusEnum('status').notNull().default('PENDING'),
  issueDate:  date('issue_date').notNull(),
  expiryDate: date('expiry_date').notNull(),

  // Vehicle requirement for this permit
  vehicleRequirement: text('vehicle_requirement'),
  // e.g. 'Sedan ou VUS — max 7 ans'

  // Zone restrictions
  allowedZones: text('allowed_zones').array().default(sql`'{}'`),
  // e.g. ['MONTREAL', 'LAVAL', 'LONGUEUIL']

  verificationStatus: varchar('verification_status', { length: 30 }).notNull().default('NOT_STARTED'),
  verifiedBy: uuid('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),

  // Issuing authority
  issuingAuthority: varchar('issuing_authority', { length: 100 }),
  // e.g. 'Bureau du taxi de Montréal'

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_taxi_permits_driver').on(t.driverId),
  index('idx_taxi_permits_expiry').on(t.expiryDate),
  index('idx_taxi_permits_status').on(t.status),
  index('idx_taxi_permits_jurisdiction').on(t.jurisdiction),
])

// ─── VEHICLE INSPECTIONS ──────────────────────────────────────

export const vehicleInspections = pgTable('vehicle_inspections', {
  id:        uuid('id').primaryKey().defaultRandom(),
  vehicleId: uuid('vehicle_id').notNull()
    .references(() => vehicles.id, { onDelete: 'cascade' }),
  driverId:  uuid('driver_id').notNull()
    .references(() => driverProfiles.id),

  inspectionType: varchar('inspection_type', { length: 50 }).notNull().default('SAAQ_MECHANICAL'),
  // 'SAAQ_MECHANICAL' | 'TAXI_SPECIFIC' | 'EMISSION' | 'OTHER'

  status:          inspectionStatusEnum('status').notNull().default('PENDING'),
  inspectionDate:  date('inspection_date'),
  expiryDate:      date('expiry_date'),

  // Inspector
  inspectorName:       varchar('inspector_name', { length: 100 }),
  inspectionCenterRef: varchar('inspection_center_ref', { length: 100 }),
  // Masked reference — never sensitive

  // Result
  passed:           boolean('passed'),
  failureReasons:   text('failure_reasons').array().default(sql`'{}'`),
  conditionNotes:   text('condition_notes'),

  // Document reference — signed URL via storage
  certificateRef: text('certificate_ref'),
  // storageReferenceMasked — signed temp URL

  // Notification tracking
  expiryNotifiedAt: timestamp('expiry_notified_at', { withTimezone: true }),

  verifiedBy: uuid('verified_by').references(() => users.id),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_inspections_vehicle').on(t.vehicleId),
  index('idx_inspections_driver').on(t.driverId),
  index('idx_inspections_expiry').on(t.expiryDate),
  index('idx_inspections_status').on(t.status),
])

// ─── INSURANCE DOCUMENTS ──────────────────────────────────────

export const insuranceDocuments = pgTable('insurance_documents', {
  id:        uuid('id').primaryKey().defaultRandom(),
  vehicleId: uuid('vehicle_id').notNull()
    .references(() => vehicles.id, { onDelete: 'cascade' }),
  driverId:  uuid('driver_id').notNull()
    .references(() => driverProfiles.id),

  insuranceProvider: varchar('insurance_provider', { length: 100 }).notNull(),
  // e.g. 'Intact Assurance', 'Desjardins', 'Belairdirect'

  // Policy number — masked: POL-••••••89
  policyNumberEncrypted: text('policy_number_encrypted'),
  policyNumberEncKeyVer: varchar('policy_number_enc_key_ver', { length: 20 }),
  policyNumberMasked:    varchar('policy_number_masked', { length: 20 }).notNull(),

  // Commercial insurance = obligatoire pour TAXI
  // Rejected if personal insurance for taxi use
  isCommercial: boolean('is_commercial').notNull().default(false),

  coverageType: varchar('coverage_type', { length: 50 }),
  // 'COMPREHENSIVE' | 'THIRD_PARTY' | 'COMMERCIAL_AUTO' | 'TAXI_SPECIFIC'

  effectiveDate:  date('effective_date').notNull(),
  expiryDate:     date('expiry_date').notNull(),

  status:             insuranceStatusEnum('status').notNull().default('PENDING_VERIFICATION'),
  verificationStatus: varchar('verification_status', { length: 30 }).notNull().default('NOT_STARTED'),
  verifiedBy:         uuid('verified_by').references(() => users.id),
  verifiedAt:         timestamp('verified_at', { withTimezone: true }),

  // Rejection
  rejectionReason: text('rejection_reason'),
  // e.g. 'Assurance personnelle — assurance commerciale requise pour TAXI'

  // Document reference
  documentRef: text('document_ref'),

  // Notification tracking
  expiryNotifiedAt: timestamp('expiry_notified_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_insurance_vehicle').on(t.vehicleId),
  index('idx_insurance_driver').on(t.driverId),
  index('idx_insurance_expiry').on(t.expiryDate),
  index('idx_insurance_status').on(t.status),
  index('idx_insurance_commercial').on(t.isCommercial),
])

// ─── VEHICLE DOCUMENTS ────────────────────────────────────────

export const vehicleDocuments = pgTable('vehicle_documents', {
  id:        uuid('id').primaryKey().defaultRandom(),
  vehicleId: uuid('vehicle_id').notNull()
    .references(() => vehicles.id, { onDelete: 'cascade' }),
  driverId:  uuid('driver_id').notNull()
    .references(() => driverProfiles.id),

  docType: varchar('doc_type', { length: 50 }).notNull(),
  // 'REGISTRATION' | 'INSURANCE' | 'INSPECTION_CERTIFICATE'
  // | 'TAXIMETER_CERTIFICATE' | 'OTHER'

  label:   varchar('label', { length: 100 }).notNull(),
  version: integer('version').notNull().default(1),
  // Nouvelle version = ancien conservé toujours

  // Storage reference — signed URL · jamais bucket public
  storageRefMasked: text('storage_ref_masked').notNull(),

  // Integrity
  fileHash:  varchar('file_hash', { length: 64 }),
  // SHA-256 of original file

  mimeType:  varchar('mime_type', { length: 50 }),
  fileSizeBytes: integer('file_size_bytes'),

  status: varchar('status', { length: 30 }).notNull().default('PENDING'),
  // 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED' | 'EXPIRING_SOON'

  expiryDate: date('expiry_date'),
  verifiedBy: uuid('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_vehicle_docs_vehicle').on(t.vehicleId),
  index('idx_vehicle_docs_driver').on(t.driverId),
  index('idx_vehicle_docs_type').on(t.docType),
  index('idx_vehicle_docs_expiry').on(t.expiryDate),
])

// ─── VEHICLE AUDIT EVENTS ─────────────────────────────────────

export const vehicleAuditEvents = pgTable('vehicle_audit_events', {
  id:        uuid('id').primaryKey().defaultRandom(),
  vehicleId: uuid('vehicle_id').notNull()
    .references(() => vehicles.id, { onDelete: 'cascade' }),
  driverId:  uuid('driver_id').notNull()
    .references(() => driverProfiles.id),

  actorId:   uuid('actor_id').references(() => users.id),
  actorRole: varchar('actor_role', { length: 50 }),

  action: varchar('action', { length: 60 }).notNull(),
  // 'VEHICLE_ADDED' | 'VEHICLE_VERIFIED' | 'VEHICLE_REJECTED'
  // | 'VEHICLE_ACTIVATED' | 'VEHICLE_SUSPENDED' | 'VEHICLE_ARCHIVED'
  // | 'LICENSE_VERIFIED' | 'PERMIT_VERIFIED' | 'INSURANCE_VERIFIED'
  // | 'INSPECTION_UPLOADED' | 'TAXIMETER_INSTALLED' | 'TAXIMETER_CERTIFIED'
  // | 'SERVICE_AUTH_CHANGED'

  oldStatus: varchar('old_status', { length: 30 }),
  newStatus: varchar('new_status', { length: 30 }),

  // Changed fields — jamais VIN, plaques ou données sensibles brutes
  metadata: jsonb('metadata').notNull().default({}),

  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_vehicle_audit_vehicle').on(t.vehicleId),
  index('idx_vehicle_audit_driver').on(t.driverId),
  index('idx_vehicle_audit_action').on(t.action),
  index('idx_vehicle_audit_occurred').on(t.occurredAt),
])

// ─── RELATIONS ────────────────────────────────────────────────

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  driver:              one(driverProfiles, { fields: [vehicles.driverId],    references: [driverProfiles.id] }),
  verifiedBy:          one(users,          { fields: [vehicles.verifiedBy],  references: [users.id] }),
  serviceAuth:         one(vehicleServiceAuthorizations, { fields: [vehicles.id], references: [vehicleServiceAuthorizations.vehicleId] }),
  inspections:         many(vehicleInspections),
  insuranceDocuments:  many(insuranceDocuments),
  vehicleDocuments:    many(vehicleDocuments),
  auditEvents:         many(vehicleAuditEvents),
}))

export const vehicleServiceAuthRelations = relations(vehicleServiceAuthorizations, ({ one }) => ({
  vehicle:      one(vehicles,       { fields: [vehicleServiceAuthorizations.vehicleId],  references: [vehicles.id] }),
  driver:       one(driverProfiles, { fields: [vehicleServiceAuthorizations.driverId],   references: [driverProfiles.id] }),
  authorizedBy: one(users,          { fields: [vehicleServiceAuthorizations.authorizedBy], references: [users.id] }),
}))

export const driverLicensesRelations = relations(driverLicenses, ({ one }) => ({
  driver:     one(driverProfiles, { fields: [driverLicenses.driverId],    references: [driverProfiles.id] }),
  verifiedBy: one(users,          { fields: [driverLicenses.verifiedBy],  references: [users.id] }),
}))

export const taxiPermitsRelations = relations(taxiPermits, ({ one }) => ({
  driver:     one(driverProfiles, { fields: [taxiPermits.driverId],    references: [driverProfiles.id] }),
  verifiedBy: one(users,          { fields: [taxiPermits.verifiedBy],  references: [users.id] }),
}))

export const vehicleInspectionsRelations = relations(vehicleInspections, ({ one }) => ({
  vehicle:    one(vehicles,       { fields: [vehicleInspections.vehicleId], references: [vehicles.id] }),
  driver:     one(driverProfiles, { fields: [vehicleInspections.driverId],  references: [driverProfiles.id] }),
  verifiedBy: one(users,          { fields: [vehicleInspections.verifiedBy], references: [users.id] }),
}))

export const insuranceDocumentsRelations = relations(insuranceDocuments, ({ one }) => ({
  vehicle:    one(vehicles,       { fields: [insuranceDocuments.vehicleId], references: [vehicles.id] }),
  driver:     one(driverProfiles, { fields: [insuranceDocuments.driverId],  references: [driverProfiles.id] }),
  verifiedBy: one(users,          { fields: [insuranceDocuments.verifiedBy], references: [users.id] }),
}))
