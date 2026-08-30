// ================================================================
// TAXIMÈTRE.GOV — AUDIT, SECURITY & PRIVACY SCHEMA
// Database Phase 11/20 — Audit · Traceability · GDPR · Retention
// ================================================================
//
// RÈGLES ABSOLUES:
// 1. Audit logs: APPEND-ONLY · jamais modifiés ni supprimés
// 2. Données financières: retention_days=null (configurable) · canDelete=false
// 3. Accès données sensibles: DATA_ACCESS event obligatoire
// 4. GDPR: privacy_requests traitées dans délai légal (30j configurable)
// 5. Logs: JAMAIS password/token/NAS/données sensibles en clair
// 6. Suppression: jamais physique sur entités financières/légales
//    → archival_records pour soft-archive avec justification
// 7. Corrélation: correlation_id obligatoire pour tracer flux complet
// 8. Accès audit: AUDITOR+MFA minimum · EXPORT requiert MFA
// ================================================================

import {
  pgTable, pgEnum, uuid, text, boolean, integer,
  timestamp, jsonb, index, varchar, date, uniqueIndex,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users }          from './auth.schema'
import { driverProfiles } from './profiles.schema'

// ─── ENUMS ───────────────────────────────────────────────────

export const auditSeverityEnum = pgEnum('audit_severity', [
  'DEBUG',
  'INFO',
  'WARNING',
  'HIGH',
  'CRITICAL',
])

export const auditResultEnum = pgEnum('audit_result', [
  'SUCCESS',
  'FAILURE',
  'BLOCKED',
  'PARTIAL',
])

export const dataAccessTypeEnum = pgEnum('data_access_type', [
  'VIEW',
  'EXPORT',
  'DOWNLOAD',
  'PRINT',
  'API_READ',
  'BULK_EXPORT',
])

export const sensitiveDataCategoryEnum = pgEnum('sensitive_data_category', [
  'NAS_SIN',
  'FINANCIAL',
  'TAX',
  'PERSONAL_IDENTITY',
  'GPS_LOCATION',
  'HEALTH',      // future
  'OTHER',
])

export const retentionCategoryEnum = pgEnum('retention_category', [
  'FINANCIAL_TRANSACTIONS',
  'TAX_RECORDS',
  'AUDIT_LOGS',
  'GPS_DATA',
  'DOCUMENTS',
  'NOTIFICATIONS',
  'WEBHOOK_EVENTS',
  'SESSION_LOGS',
  'PERSONAL_DATA',
  'COMPLIANCE_RECORDS',
])

export const privacyRequestTypeEnum = pgEnum('privacy_request_type', [
  'ACCESS',        // GDPR Art. 15 — right to access
  'PORTABILITY',   // GDPR Art. 20 — right to portability
  'RECTIFICATION', // GDPR Art. 16 — right to correction
  'ERASURE',       // GDPR Art. 17 — right to be forgotten (subject to legal obligations)
  'RESTRICTION',   // GDPR Art. 18 — right to restrict processing
  'OBJECTION',     // GDPR Art. 21 — right to object
])

export const privacyRequestStatusEnum = pgEnum('privacy_request_status', [
  'RECEIVED',
  'UNDER_REVIEW',
  'PROCESSING',
  'COMPLETED',
  'PARTIALLY_COMPLETED',  // Some data retained for legal obligation
  'REJECTED',             // With legal justification
  'CANCELLED',
])

export const archivalReasonEnum = pgEnum('archival_reason', [
  'RETENTION_POLICY',       // Normal retention expiry
  'USER_REQUESTED',         // GDPR erasure (where permitted)
  'LEGAL_OBLIGATION',       // Must archive, cannot delete
  'ADMIN_ACTION',
  'ACCOUNT_CLOSED',
])

// ─── CENTRAL AUDIT LOG ───────────────────────────────────────
// Append-only — NEVER modified, NEVER hard-deleted
// Single authoritative audit trail for all system actions

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Actor
  actorId:          uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
  actorRole:        varchar('actor_role',        { length: 50  }),
  actorPublicId:    varchar('actor_public_id',   { length: 20  }),
  actorType:        varchar('actor_type',        { length: 20  }),
  // 'DRIVER' | 'GOVERNMENT' | 'SYSTEM' | 'ANONYMOUS'

  // Action
  action:           varchar('action',            { length: 80  }).notNull(),
  // Namespaced: 'driver.profile.read', 'tax.report.finalize', 'admin.suspend.driver'
  module:           varchar('module',            { length: 50  }).notNull(),
  // 'AUTH' | 'DRIVER' | 'VEHICLE' | 'TAX' | 'PAYMENT' | 'SECURITY' | etc.

  severity:  auditSeverityEnum('severity').notNull().default('INFO'),
  result:    auditResultEnum('result').notNull(),

  // Resource
  resourceType: varchar('resource_type', { length: 50  }),
  resourceId:   varchar('resource_id',   { length: 100 }),
  // Public ID only — never internal UUID in exposed logs

  // Subject (who the action was performed on)
  subjectDriverId: uuid('subject_driver_id')
    .references(() => driverProfiles.id, { onDelete: 'set null' }),

  // Tracing
  correlationId:  uuid('correlation_id'),
  sessionId:      uuid('session_id'),
  requestId:      varchar('request_id', { length: 60 }),

  // Network context — hashed for privacy
  ipHash:    varchar('ip_hash',    { length: 64 }),
  userAgent: text('user_agent'),

  // Metadata — NEVER includes password/token/NAS/card data
  metadata: jsonb('metadata').notNull().default({}),

  // Immutable timestamp — server-side only
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),

  // No updatedAt — append-only immutable
}, (t) => [
  index('idx_audit_actor').on(t.actorId),
  index('idx_audit_action').on(t.action),
  index('idx_audit_module').on(t.module),
  index('idx_audit_severity').on(t.severity),
  index('idx_audit_result').on(t.result),
  index('idx_audit_resource').on(t.resourceType, t.resourceId),
  index('idx_audit_subject_driver').on(t.subjectDriverId),
  index('idx_audit_correlation').on(t.correlationId),
  index('idx_audit_occurred').on(t.occurredAt),
  // Range queries for compliance exports
  index('idx_audit_actor_occurred').on(t.actorId, t.occurredAt),
])

// ─── SECURITY AUDIT LOG ──────────────────────────────────────
// Dedicated security-specific log — higher retention, separate access control

export const securityAuditLogs = pgTable('security_audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),

  userId:    uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  actorRole: varchar('actor_role', { length: 50 }),

  eventCategory: varchar('event_category', { length: 40 }).notNull(),
  // 'AUTH' | 'RBAC' | 'SESSION' | 'MFA' | 'DEVICE' | 'RATE_LIMIT'
  // | 'SUSPICIOUS' | 'PERMISSION' | 'DATA_ACCESS' | 'ADMIN_ACTION'

  eventCode: varchar('event_code', { length: 60 }).notNull(),
  // e.g. 'LOGIN_SUCCESS', 'MFA_BYPASSED_ATTEMPT', 'BRUTE_FORCE_BLOCKED'

  severity: auditSeverityEnum('severity').notNull(),
  result:   auditResultEnum('result').notNull(),

  // Session & device context
  sessionId:           uuid('session_id'),
  deviceFingerprintHash: varchar('device_fingerprint_hash', { length: 64 }),
  ipHash:              varchar('ip_hash',    { length: 64 }),
  // Never raw IP

  correlationId: uuid('correlation_id'),

  // Non-sensitive metadata — NEVER token, password, OTP, NAS
  metadata: jsonb('metadata').notNull().default({}),

  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_sec_audit_user').on(t.userId),
  index('idx_sec_audit_category').on(t.eventCategory),
  index('idx_sec_audit_code').on(t.eventCode),
  index('idx_sec_audit_severity').on(t.severity),
  index('idx_sec_audit_occurred').on(t.occurredAt),
  index('idx_sec_audit_correlation').on(t.correlationId),
])

// ─── DATA ACCESS LOG ──────────────────────────────────────────
// Tracks every access to sensitive data categories

export const dataAccessLogs = pgTable('data_access_logs', {
  id: uuid('id').primaryKey().defaultRandom(),

  actorId:   uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
  actorRole: varchar('actor_role', { length: 50 }),

  accessType: dataAccessTypeEnum('access_type').notNull(),
  dataCategory: sensitiveDataCategoryEnum('data_category').notNull(),

  // What was accessed
  resourceType: varchar('resource_type', { length: 50 }).notNull(),
  resourceId:   varchar('resource_id',   { length: 100 }),

  // Subject of the accessed data
  subjectUserId:   uuid('subject_user_id').references(() => users.id, { onDelete: 'set null' }),
  subjectDriverId: uuid('subject_driver_id')
    .references(() => driverProfiles.id, { onDelete: 'set null' }),

  // Legal justification for access
  legalBasis: varchar('legal_basis', { length: 100 }),
  // e.g. 'REGULATORY_COMPLIANCE', 'TAX_AUDIT', 'DRIVER_CONSENT'

  correlationId: uuid('correlation_id'),

  // Number of records accessed (for bulk exports)
  recordCount: integer('record_count'),

  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_data_access_actor').on(t.actorId),
  index('idx_data_access_category').on(t.dataCategory),
  index('idx_data_access_type').on(t.accessType),
  index('idx_data_access_subject_driver').on(t.subjectDriverId),
  index('idx_data_access_occurred').on(t.occurredAt),
  index('idx_data_access_correlation').on(t.correlationId),
])

// ─── RETENTION POLICIES ───────────────────────────────────────

export const retentionPolicies = pgTable('retention_policies', {
  id:           uuid('id').primaryKey().defaultRandom(),
  jurisdiction: varchar('jurisdiction', { length: 10 }).notNull().default('QC'),
  category:     retentionCategoryEnum('category').notNull(),

  // null = indefinite (required by law) OR not yet configured
  retentionDays: integer('retention_days'),
  // Configured per jurisdiction — never hardcoded

  // Whether this data can ever be deleted
  canDelete: boolean('can_delete').notNull().default(false),
  // Financial/legal records: canDelete=false always

  legalBasis: text('legal_basis').notNull(),
  // Reference to applicable law/regulation — never invented

  // Archival behavior (what to do when retention expires)
  archivalAction: varchar('archival_action', { length: 30 }).notNull().default('ARCHIVE'),
  // 'ARCHIVE' | 'ANONYMIZE' | 'DELETE' (only if canDelete=true)

  notes: text('notes'),

  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_retention_unique').on(t.jurisdiction, t.category),
  index('idx_retention_jurisdiction').on(t.jurisdiction),
  index('idx_retention_category').on(t.category),
  index('idx_retention_can_delete').on(t.canDelete),
])

// ─── PRIVACY REQUESTS (GDPR) ──────────────────────────────────

export const privacyRequests = pgTable('privacy_requests', {
  id:             uuid('id').primaryKey().defaultRandom(),
  publicRequestId: varchar('public_request_id', { length: 22 }).notNull().unique(),
  // Format: PRQ-XXXXXXXX

  userId:         uuid('user_id').notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  driverId:       uuid('driver_id')
    .references(() => driverProfiles.id, { onDelete: 'restrict' }),

  requestType: privacyRequestTypeEnum('request_type').notNull(),
  status:      privacyRequestStatusEnum('status').notNull().default('RECEIVED'),

  // Request details
  reason:       text('reason'),
  specificData: text('specific_data').array(),
  // Which specific data categories the request covers

  // Legal assessment
  legalAssessmentNote: text('legal_assessment_note'),
  // e.g. 'Financial data retained per Tax Act obligations'

  // Processing
  assignedTo:  uuid('assigned_to').references(() => users.id),
  reviewedBy:  uuid('reviewed_by').references(() => users.id),

  // Statutory deadline tracking (configurable — default 30 days)
  receivedAt:  timestamp('received_at',  { withTimezone: true }).notNull().defaultNow(),
  dueAt:       timestamp('due_at',       { withTimezone: true }).notNull(),
  // Computed: receivedAt + jurisdictionDeadlineDays

  completedAt: timestamp('completed_at', { withTimezone: true }),
  rejectedAt:  timestamp('rejected_at',  { withTimezone: true }),

  rejectionReason: text('rejection_reason'),
  completionNote:  text('completion_note'),

  // Reference to exported data package (for ACCESS/PORTABILITY)
  dataPackageRef: varchar('data_package_ref', { length: 200 }),
  // Secure reference — expires after download window

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_privacy_req_user').on(t.userId),
  index('idx_privacy_req_driver').on(t.driverId),
  index('idx_privacy_req_type').on(t.requestType),
  index('idx_privacy_req_status').on(t.status),
  index('idx_privacy_req_due').on(t.dueAt),
])

// ─── ARCHIVAL RECORDS ────────────────────────────────────────
// Tracks soft-archived records with justification

export const archivalRecords = pgTable('archival_records', {
  id: uuid('id').primaryKey().defaultRandom(),

  // What was archived
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  // e.g. 'driver_profile', 'session', 'notification'
  entityId:   uuid('entity_id').notNull(),
  // Original PK of the archived entity

  archivedBy:     uuid('archived_by').references(() => users.id),
  archivalReason: archivalReasonEnum('archival_reason').notNull(),

  // Legal justification — required for any archival
  legalJustification: text('legal_justification').notNull(),

  privacyRequestId: uuid('privacy_request_id')
    .references(() => privacyRequests.id, { onDelete: 'set null' }),

  // Whether underlying data was anonymized or preserved
  wasAnonymized: boolean('was_anonymized').notNull().default(false),
  wasDeleted:    boolean('was_deleted').notNull().default(false),
  // was_deleted=true ONLY if canDelete=true in retention policy

  archivedAt: timestamp('archived_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_archival_entity').on(t.entityType, t.entityId),
  index('idx_archival_reason').on(t.archivalReason),
  index('idx_archival_privacy_req').on(t.privacyRequestId),
  index('idx_archival_archived_at').on(t.archivedAt),
])

// ─── CONSENT RECORDS ──────────────────────────────────────────

export const consentRecords = pgTable('consent_records', {
  id:     uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull()
    .references(() => users.id, { onDelete: 'restrict' }),

  consentType: varchar('consent_type', { length: 60 }).notNull(),
  // 'GPS_TRACKING' | 'DATA_PROCESSING' | 'MARKETING'
  // | 'THIRD_PARTY_SHARING' | 'ANALYTICS' | 'PROVIDER_DATA_SHARE'

  version: varchar('version', { length: 20 }).notNull(),
  // Policy version at time of consent

  granted:   boolean('granted').notNull(),
  grantedAt: timestamp('granted_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),

  // How consent was obtained
  consentMethod: varchar('consent_method', { length: 30 }).notNull(),
  // 'EXPLICIT_CHECKBOX' | 'TERMS_ACCEPTANCE' | 'IN_APP_PROMPT'

  ipHash: varchar('ip_hash', { length: 64 }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_consent_user').on(t.userId),
  index('idx_consent_type').on(t.consentType),
  index('idx_consent_granted').on(t.granted),
  index('idx_consent_revoked').on(t.revokedAt),
])

// ─── GOVERNMENT ACCESS LOG ───────────────────────────────────
// Dedicated log for government user access to driver data

export const governmentAccessLogs = pgTable('government_access_logs', {
  id:             uuid('id').primaryKey().defaultRandom(),
  governmentUserId: uuid('government_user_id').notNull()
    .references(() => users.id, { onDelete: 'restrict' }),

  // Driver whose data was accessed
  subjectDriverId: uuid('subject_driver_id').notNull()
    .references(() => driverProfiles.id, { onDelete: 'restrict' }),

  accessType:   dataAccessTypeEnum('access_type').notNull(),
  dataCategory: sensitiveDataCategoryEnum('data_category').notNull(),

  // Justification — mandatory for government access
  legalAuthority: varchar('legal_authority', { length: 100 }).notNull(),
  // e.g. 'TAX_AUDIT_2026_Q2', 'REGULATORY_COMPLIANCE', 'COURT_ORDER_NO_2026-001'

  accessedFields: text('accessed_fields').array(),
  // Which specific fields were accessed — for GDPR Article 30 record

  jurisdiction: varchar('jurisdiction', { length: 10 }).notNull(),

  correlationId: uuid('correlation_id'),
  occurredAt:    timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_gov_access_gov_user').on(t.governmentUserId),
  index('idx_gov_access_driver').on(t.subjectDriverId),
  index('idx_gov_access_type').on(t.accessType),
  index('idx_gov_access_category').on(t.dataCategory),
  index('idx_gov_access_occurred').on(t.occurredAt),
])

// ─── RELATIONS ────────────────────────────────────────────────

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor:         one(users,          { fields: [auditLogs.actorId],         references: [users.id] }),
  subjectDriver: one(driverProfiles, { fields: [auditLogs.subjectDriverId], references: [driverProfiles.id] }),
}))

export const securityAuditLogsRelations = relations(securityAuditLogs, ({ one }) => ({
  user: one(users, { fields: [securityAuditLogs.userId], references: [users.id] }),
}))

export const dataAccessLogsRelations = relations(dataAccessLogs, ({ one }) => ({
  actor:         one(users,          { fields: [dataAccessLogs.actorId],         references: [users.id] }),
  subjectUser:   one(users,          { fields: [dataAccessLogs.subjectUserId],   references: [users.id] }),
  subjectDriver: one(driverProfiles, { fields: [dataAccessLogs.subjectDriverId], references: [driverProfiles.id] }),
}))

export const privacyRequestsRelations = relations(privacyRequests, ({ one }) => ({
  user:       one(users,          { fields: [privacyRequests.userId],     references: [users.id] }),
  driver:     one(driverProfiles, { fields: [privacyRequests.driverId],   references: [driverProfiles.id] }),
  assignedTo: one(users,          { fields: [privacyRequests.assignedTo], references: [users.id] }),
  reviewedBy: one(users,          { fields: [privacyRequests.reviewedBy], references: [users.id] }),
}))

export const archivalRecordsRelations = relations(archivalRecords, ({ one }) => ({
  archivedBy:      one(users,           { fields: [archivalRecords.archivedBy],       references: [users.id] }),
  privacyRequest:  one(privacyRequests, { fields: [archivalRecords.privacyRequestId], references: [privacyRequests.id] }),
}))

export const governmentAccessLogsRelations = relations(governmentAccessLogs, ({ one }) => ({
  governmentUser: one(users,          { fields: [governmentAccessLogs.governmentUserId], references: [users.id] }),
  subjectDriver:  one(driverProfiles, { fields: [governmentAccessLogs.subjectDriverId],  references: [driverProfiles.id] }),
}))
