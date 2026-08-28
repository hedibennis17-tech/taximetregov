// ================================================================
// TAXIMÈTRE.GOV — USER PROFILES SCHEMA
// Database Phase 2/20 — Driver & Government Profiles
// ================================================================
//
// RÈGLES ABSOLUES:
// 1. NAS/SIN: jamais en clair · field-level encrypted · jamais FK
// 2. Références masquées uniquement dans les vues/API
// 3. driver_number ≠ user.id — identifiant public séparé
// 4. Gouvernement: department + mfa_required permanent
// 5. Verification: PENDING par défaut — jamais auto-VERIFIED
// 6. Soft delete uniquement — jamais hard delete
// 7. Un user_id ↔ un profil (1:1) — jamais plusieurs profils actifs
// ================================================================

import {
  pgTable, pgEnum, uuid, text, boolean,
  timestamp, integer, jsonb, uniqueIndex, index,
  varchar, date,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { users } from './auth.schema'

// ─── ENUMS ───────────────────────────────────────────────────

export const verificationStatusEnum = pgEnum('verification_status', [
  'NOT_STARTED',   // No verification attempt yet
  'PENDING',       // Submitted, awaiting review
  'IN_REVIEW',     // Under active review
  'VERIFIED',      // Approved — only after real check
  'FAILED',        // Rejected
  'EXPIRED',       // Previously verified, now expired
  'MANUAL_REVIEW', // Requires human reviewer
])

export const driverStatusEnum = pgEnum('driver_status', [
  'PENDING',       // Registration incomplete
  'UNDER_REVIEW',  // Docs submitted, under review
  'ACTIVE',        // Fully approved and active
  'SUSPENDED',     // Temporarily suspended (per service)
  'DEACTIVATED',   // Permanently deactivated
  'REJECTED',      // Application rejected
])

export const languageEnum = pgEnum('language', [
  'fr', 'en',
])

export const businessStatusEnum = pgEnum('business_status', [
  'SOLE_PROPRIETOR',  // Travailleur autonome
  'INCORPORATED',     // Société incorporée
  'PARTNERSHIP',      // Société de personnes
  'NOT_APPLICABLE',   // Gouvernement / autre
])

export const identifierTypeEnum = pgEnum('identifier_type', [
  'SIN_NAS',          // Social Insurance Number / NAS
  'BUSINESS_NUMBER',  // Numéro d'entreprise (NEQ/BN)
  'TAX_ACCOUNT',      // Numéro de compte fiscal
  'OTHER',
])

export const governmentDepartmentEnum = pgEnum('government_department', [
  'TRANSPORT_QC',
  'REVENU_QC',
  'SAAQ',
  'CMQ',         // Commission des droits de la personne
  'MTQ',         // Ministère des Transports du Québec
  'OTHER',
])

export const verificationMethodEnum = pgEnum('verification_method', [
  'OFFICIAL_API',          // Direct government API (future)
  'DOCUMENT_REVIEW',       // Manual document review (pilot mode)
  'AUTHORIZED_PROVIDER',   // Via authorized third-party
  'MANUAL_REVIEW',         // Internal reviewer
])

// ─── DRIVER PROFILES ──────────────────────────────────────────

export const driverProfiles = pgTable('driver_profiles', {
  id:     uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  // 1:1 with users — UNIQUE enforces one active profile per user

  // Public driver identifier — safe to use in UI
  driverNumber: varchar('driver_number', { length: 20 }).notNull().unique(),
  // Format: DR-XXXXXXXX · e.g. DR-00001234

  status: driverStatusEnum('status').notNull().default('PENDING'),

  // Personal info
  firstName:     varchar('first_name',      { length: 100 }).notNull(),
  lastName:      varchar('last_name',       { length: 100 }).notNull(),
  preferredName: varchar('preferred_name',  { length: 100 }),
  dateOfBirth:   date('date_of_birth'),

  // Contact (normalized/masked in API responses)
  phone:    varchar('phone',    { length: 20 }),
  province: varchar('province', { length: 10 }).notNull().default('QC'),
  country:  varchar('country',  { length: 2  }).notNull().default('CA'),
  language: languageEnum('language').notNull().default('fr'),

  // Address — stored encrypted, masked in API
  addressEncrypted: text('address_encrypted'),
  // Never returned in API · accessible only by authorized backend services

  businessStatus: businessStatusEnum('business_status')
    .notNull().default('SOLE_PROPRIETOR'),

  // Identity verification — see identity_verifications table
  identityVerificationStatus: verificationStatusEnum('identity_verification_status')
    .notNull().default('NOT_STARTED'),

  // Profile photo — reference only, never raw binary in DB
  profilePhotoRef: text('profile_photo_ref'),
  // Points to encrypted storage — API returns signed URL

  // Onboarding progress
  onboardingCompletedAt: timestamp('onboarding_completed_at', { withTimezone: true }),

  // Audit
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => [
  index('idx_driver_profiles_user').on(t.userId),
  index('idx_driver_profiles_number').on(t.driverNumber),
  index('idx_driver_profiles_status').on(t.status),
])

// ─── GOVERNMENT PROFILES ──────────────────────────────────────

export const governmentProfiles = pgTable('government_profiles', {
  id:     uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique()
    .references(() => users.id, { onDelete: 'cascade' }),

  department: governmentDepartmentEnum('department').notNull(),
  jobTitle:   varchar('job_title', { length: 100 }),

  // Employee reference — masked in API: EMP-••••1234
  employeeReference: varchar('employee_reference', { length: 50 }),

  // Government accounts always require MFA — enforced at auth layer
  // This flag is informational, actual enforcement is in users.mfa_required
  mfaRequired: boolean('mfa_required').notNull().default(true),

  // Access scope — which jurisdictions this user can access data for
  jurisdictions: text('jurisdictions').array().notNull().default(sql`'{QC}'`),
  // e.g. ['QC'] for Québec only, ['QC', 'FED'] for federal cross-access

  // Supervisor — for approval workflow
  supervisorUserId: uuid('supervisor_user_id').references(() => users.id),

  // Onboarding + last review
  activatedAt:  timestamp('activated_at',  { withTimezone: true }),
  lastReviewAt: timestamp('last_review_at', { withTimezone: true }),

  // Audit
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => [
  index('idx_gov_profiles_user').on(t.userId),
  index('idx_gov_profiles_dept').on(t.department),
])

// ─── SENSITIVE GOVERNMENT IDENTIFIERS ────────────────────────
//
// NAS/SIN and business numbers stored here ONLY.
// NEVER stored anywhere else in the database.
// Field-level encrypted at application layer before INSERT.
// NEVER returned in API responses — only verified/status returned.

export const sensitiveIdentifiers = pgTable('sensitive_identifiers', {
  id:     uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  identifierType: identifierTypeEnum('identifier_type').notNull(),

  // The actual value — AES-256 encrypted at application layer
  // Never decrypted except by Tax Engine with elevated access
  encryptedValue: text('encrypted_value').notNull(),

  // Key version — for key rotation tracking
  encryptionKeyVersion: varchar('encryption_key_version', { length: 20 }).notNull(),

  // Masked display — what the UI shows: ***-***-XXX
  maskedDisplay: varchar('masked_display', { length: 20 }).notNull(),
  // Always in format ***-***-XXX — never the actual number

  jurisdiction: varchar('jurisdiction', { length: 10 }).notNull().default('CA'),

  // Verification — who/when confirmed this is valid
  verificationStatus: verificationStatusEnum('verification_status')
    .notNull().default('PENDING'),
  verifiedAt:        timestamp('verified_at',  { withTimezone: true }),
  verifiedBy:        uuid('verified_by').references(() => users.id),
  verificationMethod: verificationMethodEnum('verification_method'),

  // Access audit — who accessed this record
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),
  accessCount:    integer('access_count').notNull().default(0),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  // One NAS per user per type
  uniqueIndex('idx_sensitive_id_user_type').on(t.userId, t.identifierType),
  index('idx_sensitive_id_user').on(t.userId),
  // No index on encrypted_value — never queried by value
])

// ─── IDENTITY VERIFICATIONS ───────────────────────────────────

export const identityVerifications = pgTable('identity_verifications', {
  id:     uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  status: verificationStatusEnum('status').notNull().default('PENDING'),
  method: verificationMethodEnum('method').notNull().default('DOCUMENT_REVIEW'),

  // Who performed the verification
  verifiedBy: uuid('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  expiresAt:  timestamp('expires_at',  { withTimezone: true }),

  // Rejection/review
  rejectionReason: text('rejection_reason'),
  reviewNotes:     text('review_notes'),
  // Internal notes — never returned to driver

  // Pilot mode flag — DOCUMENT_REVIEW means no official API available
  isPilotVerification: boolean('is_pilot_verification').notNull().default(true),
  pilotNote:           text('pilot_note'),
  // e.g. "Vérifié par examen documentaire — mode pilote"

  // Audit
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_identity_verif_user').on(t.userId),
  index('idx_identity_verif_status').on(t.status),
  index('idx_identity_verif_expires').on(t.expiresAt),
])

// ─── DRIVER SUSPENSIONS ───────────────────────────────────────
//
// Suspension is PER SERVICE — not an all-or-nothing flag.
// A driver can be suspended for TAXI but active for RIDESHARE.

export const driverSuspensions = pgTable('driver_suspensions', {
  id:       uuid('id').primaryKey().defaultRandom(),
  driverId: uuid('driver_id').notNull()
    .references(() => driverProfiles.id, { onDelete: 'cascade' }),

  // Which service is suspended
  serviceType: varchar('service_type', { length: 30 }).notNull(),
  // 'TAXI' | 'RIDESHARE' | 'DELIVERY' | 'ALL'

  reason:    text('reason').notNull(),
  suspendedBy: uuid('suspended_by').references(() => users.id),

  startedAt:  timestamp('started_at',  { withTimezone: true }).notNull().defaultNow(),
  endsAt:     timestamp('ends_at',     { withTimezone: true }),
  // null = indefinite

  liftedAt:   timestamp('lifted_at',   { withTimezone: true }),
  liftedBy:   uuid('lifted_by').references(() => users.id),
  liftReason: text('lift_reason'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_suspensions_driver').on(t.driverId),
  index('idx_suspensions_service').on(t.serviceType),
  index('idx_suspensions_ends').on(t.endsAt),
])

// ─── DRIVER ONBOARDING STEPS ──────────────────────────────────

export const driverOnboardingSteps = pgTable('driver_onboarding_steps', {
  id:       uuid('id').primaryKey().defaultRandom(),
  driverId: uuid('driver_id').notNull()
    .references(() => driverProfiles.id, { onDelete: 'cascade' }),

  stepKey: varchar('step_key', { length: 50 }).notNull(),
  // 'IDENTITY_VERIFICATION' | 'DRIVER_LICENSE' | 'TAXI_PERMIT'
  // | 'VEHICLE_REGISTRATION' | 'INSURANCE' | 'PROVIDER_CONNECT'
  // | 'TAX_PROFILE' | 'BACKGROUND_CHECK'

  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  // 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'SKIPPED'

  completedAt: timestamp('completed_at', { withTimezone: true }),
  blockedReason: text('blocked_reason'),

  // Step-specific metadata (e.g. document IDs submitted)
  metadata: jsonb('metadata').notNull().default({}),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_onboarding_driver_step').on(t.driverId, t.stepKey),
  index('idx_onboarding_driver').on(t.driverId),
])

// ─── PROFILE AUDIT EVENTS ─────────────────────────────────────

export const profileAuditEvents = pgTable('profile_audit_events', {
  id:     uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull()
    .references(() => users.id, { onDelete: 'set null' }),

  actorId:   uuid('actor_id').references(() => users.id),
  actorRole: varchar('actor_role', { length: 50 }),

  action: varchar('action', { length: 60 }).notNull(),
  // 'PROFILE_CREATED' | 'PROFILE_UPDATED' | 'STATUS_CHANGED'
  // | 'IDENTITY_VERIFIED' | 'IDENTITY_REJECTED' | 'SUSPENDED'
  // | 'REACTIVATED' | 'SENSITIVE_ID_ADDED' | 'SENSITIVE_ID_ACCESSED'

  // Changed fields — never includes sensitive values
  changedFields: text('changed_fields').array(),
  oldValues:     jsonb('old_values'),
  newValues:     jsonb('new_values'),
  // NEVER includes: NAS, encrypted values, passwords, tokens

  metadata: jsonb('metadata').notNull().default({}),

  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_profile_audit_user').on(t.userId),
  index('idx_profile_audit_actor').on(t.actorId),
  index('idx_profile_audit_action').on(t.action),
  index('idx_profile_audit_occurred').on(t.occurredAt),
])

// ─── RELATIONS ────────────────────────────────────────────────

export const driverProfilesRelations = relations(driverProfiles, ({ one, many }) => ({
  user:              one(users, { fields: [driverProfiles.userId], references: [users.id] }),
  suspensions:       many(driverSuspensions),
  onboardingSteps:   many(driverOnboardingSteps),
  identityVerification: one(identityVerifications, {
    fields:     [driverProfiles.userId],
    references: [identityVerifications.userId],
  }),
}))

export const governmentProfilesRelations = relations(governmentProfiles, ({ one }) => ({
  user:       one(users, { fields: [governmentProfiles.userId],       references: [users.id] }),
  supervisor: one(users, { fields: [governmentProfiles.supervisorUserId], references: [users.id] }),
}))

export const sensitiveIdentifiersRelations = relations(sensitiveIdentifiers, ({ one }) => ({
  user:       one(users, { fields: [sensitiveIdentifiers.userId],      references: [users.id] }),
  verifiedBy: one(users, { fields: [sensitiveIdentifiers.verifiedBy],  references: [users.id] }),
}))

export const identityVerificationsRelations = relations(identityVerifications, ({ one }) => ({
  user:       one(users, { fields: [identityVerifications.userId],     references: [users.id] }),
  verifiedBy: one(users, { fields: [identityVerifications.verifiedBy], references: [users.id] }),
}))

export const driverSuspensionsRelations = relations(driverSuspensions, ({ one }) => ({
  driver:     one(driverProfiles, { fields: [driverSuspensions.driverId],    references: [driverProfiles.id] }),
  suspendedBy: one(users,         { fields: [driverSuspensions.suspendedBy], references: [users.id] }),
  liftedBy:   one(users,          { fields: [driverSuspensions.liftedBy],    references: [users.id] }),
}))

export const driverOnboardingStepsRelations = relations(driverOnboardingSteps, ({ one }) => ({
  driver: one(driverProfiles, { fields: [driverOnboardingSteps.driverId], references: [driverProfiles.id] }),
}))
