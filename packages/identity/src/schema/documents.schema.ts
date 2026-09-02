// ================================================================
// TAXIMÈTRE.GOV — DOCUMENTS, COMPLIANCE & VERIFICATION SCHEMA
// Database Phase 5/20 — Documents · Permits · Inspections · Compliance
// ================================================================
//
// RÈGLES ABSOLUES:
// 1. Jamais stocker le fichier binaire dans PostgreSQL
//    → storage_reference = chemin opaque · URL signée via backend
// 2. public_document_id ≠ storage path (IDOR protection)
// 3. Document approuvé uniquement par utilisateur gouvernemental autorisé
//    → jamais auto-approbation chauffeur
// 4. Versions: jamais écraser · toujours conserver l'historique
// 5. Delivery → taximeter DISABLED (aucun lien avec les documents)
// 6. OCR = proposition uniquement · jamais décision réglementaire finale
// 7. Malware scan PENDING → jamais APPROVED automatiquement
// 8. Numéros sensibles (permis, licences) → encrypted + hash + last4
// 9. Soft delete: archived_at · jamais hard delete si données légales
// ================================================================

import {
  pgTable, pgEnum, uuid, text, boolean, integer,
  timestamp, jsonb, uniqueIndex, index, varchar, date,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { users }                  from './auth.schema'
import { driverProfiles, verificationMethodEnum } from './profiles.schema'
import { vehicles }               from './vehicles.schema'

// ─── ENUMS ───────────────────────────────────────────────────

export const documentStatusEnum = pgEnum('document_status', [
  'DRAFT',            // Créé mais pas encore soumis
  'UPLOADED',         // Fichier reçu
  'PENDING_REVIEW',   // En attente de révision
  'UNDER_REVIEW',     // En cours de révision active
  'APPROVED',         // Approuvé par autorité habilitée
  'REJECTED',         // Rejeté avec raison obligatoire
  'EXPIRED',          // Expiré naturellement
  'SUSPENDED',        // Suspendu par action gouvernementale
  'REPLACED',         // Remplacé par nouvelle version
  'REVOKED',          // Révoqué — plus valide
  'ARCHIVED',         // Archivé selon politique de rétention
])

export const verificationStatusEnum = pgEnum('doc_verification_status', [
  'NOT_STARTED',
  'PENDING',
  'IN_REVIEW',
  'VERIFIED',
  'REJECTED',
  'UNABLE_TO_VERIFY',
])

export const rejectionReasonEnum = pgEnum('rejection_reason', [
  'DOCUMENT_ILLEGIBLE',
  'EXPIRED',
  'WRONG_DOCUMENT_TYPE',
  'MISSING_INFORMATION',
  'INVALID_FORMAT',
  'UNVERIFIABLE',
  'SUSPECTED_FRAUD',   // → REVIEW_REQUIRED · jamais accusation auto
  'MISMATCH',          // Données ne correspondent pas au dossier
  'OTHER',
])

export const scanStatusEnum = pgEnum('scan_status', [
  'SCAN_PENDING',
  'SCAN_CLEAN',
  'SCAN_INFECTED',
  'SCAN_FAILED',
])

export const ocrStatusEnum = pgEnum('ocr_status', [
  'NOT_REQUESTED',
  'OCR_PENDING',
  'OCR_COMPLETE',
  'OCR_FAILED',
])

export const complianceStatusEnum = pgEnum('compliance_status', [
  'COMPLIANT',
  'NON_COMPLIANT',
  'REVIEW_REQUIRED',
  'PENDING',           // Documents not yet submitted
  'UNKNOWN',
])

export const ownerTypeEnum = pgEnum('owner_type', [
  'DRIVER',
  'VEHICLE',
  'BUSINESS',
  'OTHER',
])

export const inspectionTypeEnum = pgEnum('inspection_type_v2', [
  'SAFETY',
  'MECHANICAL',
  'REGULATORY',
  'ANNUAL',
  'COMMERCIAL',
  'TAXIMETER',         // Taximètre homologation
  'OTHER',
])

export const inspectionResultEnum = pgEnum('inspection_result', [
  'SCHEDULED',
  'PENDING',
  'PASSED',
  'FAILED',
  'EXPIRED',
  'CANCELLED',
])

// ─── DOCUMENT TYPES ───────────────────────────────────────────
// Extensible table — NOT an enum
// Allows adding new types without migrations

export const documentTypes = pgTable('document_types', {
  id:   uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 60 }).notNull().unique(),
  // e.g. 'DRIVER_LICENSE', 'TAXI_PERMIT', 'VEHICLE_INSURANCE'

  label:            varchar('label', { length: 100 }).notNull(),
  labelFr:          varchar('label_fr', { length: 100 }),
  labelEn:          varchar('label_en', { length: 100 }),
  ownerType:        ownerTypeEnum('owner_type').notNull(),
  // Who owns this document: DRIVER | VEHICLE | BUSINESS

  hasExpiryDate:    boolean('has_expiry_date').notNull().default(true),
  hasIssueDate:     boolean('has_issue_date').notNull().default(true),
  requiresVerification: boolean('requires_verification').notNull().default(true),
  requiresManualReview: boolean('requires_manual_review').notNull().default(false),

  // Configurable validity window (days)
  defaultValidityDays:    integer('default_validity_days'),
  renewalNoticeDays:      integer('renewal_notice_days').notNull().default(30),

  isActive: boolean('is_active').notNull().default(true),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_doc_types_owner').on(t.ownerType),
  index('idx_doc_types_active').on(t.isActive),
])

// ─── DOCUMENT TYPE REQUIREMENTS ───────────────────────────────
// Which documents are required per service + jurisdiction

export const documentTypeRequirements = pgTable('document_type_requirements', {
  id:             uuid('id').primaryKey().defaultRandom(),
  documentTypeId: uuid('document_type_id').notNull()
    .references(() => documentTypes.id, { onDelete: 'cascade' }),

  serviceType:  varchar('service_type', { length: 30 }).notNull(),
  // 'TAXI' | 'RIDESHARE' | 'DELIVERY' | 'ALL'

  jurisdiction: varchar('jurisdiction', { length: 10 }).notNull().default('QC'),

  isRequired:   boolean('is_required').notNull().default(true),
  notes:        text('notes'),

  effectiveFrom:  date('effective_from').notNull(),
  effectiveUntil: date('effective_until'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_doc_req_unique').on(t.documentTypeId, t.serviceType, t.jurisdiction),
  index('idx_doc_req_service').on(t.serviceType),
  index('idx_doc_req_jurisdiction').on(t.jurisdiction),
])

// ─── DOCUMENTS ────────────────────────────────────────────────

export const documents = pgTable('documents', {
  id:             uuid('id').primaryKey().defaultRandom(),
  publicDocumentId: varchar('public_document_id', { length: 20 }).notNull().unique(),
  // Format: DOC-XXXXXXXX · never exposes storage path

  documentTypeId: uuid('document_type_id').notNull()
    .references(() => documentTypes.id),

  // Owner — polymorphic via owner_type + owner_id
  // Separate FK columns for referential integrity
  ownerType: ownerTypeEnum('owner_type').notNull(),
  driverOwnerId:  uuid('driver_owner_id').references(() => driverProfiles.id, { onDelete: 'cascade' }),
  vehicleOwnerId: uuid('vehicle_owner_id').references(() => vehicles.id, { onDelete: 'cascade' }),
  // business_owner_id added in future Business phase

  jurisdiction: varchar('jurisdiction', { length: 10 }).notNull().default('QC'),

  status: documentStatusEnum('status').notNull().default('DRAFT'),

  // Issue and expiry dates — from the document itself
  issuedAt:   date('issued_at'),
  expiresAt:  date('expires_at'),

  // Current version reference (updated on new upload)
  currentVersionId: uuid('current_version_id'),
  // FK set after document_versions is created

  // Sensitive document number (if applicable)
  docNumberEncrypted:    text('doc_number_encrypted'),
  docNumberEncKeyVer:    varchar('doc_number_enc_key_ver', { length: 20 }),
  docNumberHash:         varchar('doc_number_hash', { length: 64 }),
  // SHA-256 for duplicate detection — never logged
  docNumberLast4:        varchar('doc_number_last4', { length: 4 }),
  // Display: ••••XXXX

  // OCR extracted data (proposal only — never auto-approves)
  ocrExtractedData: jsonb('ocr_extracted_data'),
  ocrStatus:        ocrStatusEnum('ocr_status').notNull().default('NOT_REQUESTED'),
  // OCR is a proposal — human review always required for regulatory decisions

  // Legal hold — prevents auto-deletion
  isLegalHold:     boolean('is_legal_hold').notNull().default(false),
  legalHoldReason: text('legal_hold_reason'),

  notes: text('notes'),

  createdAt:  timestamp('created_at',  { withTimezone: true }).notNull().defaultNow(),
  updatedAt:  timestamp('updated_at',  { withTimezone: true }).notNull().defaultNow(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  // archived ≠ deleted — history always preserved
}, (t) => [
  index('idx_docs_public_id').on(t.publicDocumentId),
  index('idx_docs_type').on(t.documentTypeId),
  index('idx_docs_driver_owner').on(t.driverOwnerId),
  index('idx_docs_vehicle_owner').on(t.vehicleOwnerId),
  index('idx_docs_status').on(t.status),
  index('idx_docs_expires').on(t.expiresAt),
  index('idx_docs_jurisdiction').on(t.jurisdiction),
  index('idx_docs_number_hash').on(t.docNumberHash),
  // Composite: expiry search per owner
  index('idx_docs_driver_expires').on(t.driverOwnerId, t.expiresAt),
])

// ─── DOCUMENT VERSIONS ────────────────────────────────────────

export const documentVersions = pgTable('document_versions', {
  id:         uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull()
    .references(() => documents.id, { onDelete: 'cascade' }),

  versionNumber: integer('version_number').notNull(),
  // Starts at 1, increments on each upload

  // Storage — opaque reference only
  storageReference: text('storage_reference').notNull(),
  // Never a raw S3/Supabase URL — a reference resolved server-side

  // File metadata
  originalFileName: varchar('original_file_name', { length: 255 }),
  // Sanitized — never used for storage paths
  mimeType:         varchar('mime_type', { length: 100 }),
  fileSizeBytes:    integer('file_size_bytes'),
  checksum:         varchar('checksum', { length: 64 }).notNull(),
  // SHA-256 of file content — for integrity + duplicate detection

  // Scan status — never APPROVED while scan pending
  scanStatus: scanStatusEnum('scan_status').notNull().default('SCAN_PENDING'),
  scanCompletedAt: timestamp('scan_completed_at', { withTimezone: true }),

  uploadedBy: uuid('uploaded_by').references(() => users.id),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),

  status: varchar('status', { length: 20 }).notNull().default('ACTIVE'),
  // 'ACTIVE' | 'SUPERSEDED' | 'REJECTED' | 'ARCHIVED'

  replacedByVersionId: uuid('replaced_by_version_id'),
  // Points to newer version — enables version chain navigation

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_doc_versions_doc_num').on(t.documentId, t.versionNumber),
  index('idx_doc_versions_document').on(t.documentId),
  index('idx_doc_versions_checksum').on(t.checksum),
  index('idx_doc_versions_scan').on(t.scanStatus),
  index('idx_doc_versions_uploaded').on(t.uploadedAt),
])

// ─── DOCUMENT VERIFICATIONS ───────────────────────────────────

export const documentVerifications = pgTable('document_verifications', {
  id:              uuid('id').primaryKey().defaultRandom(),
  documentId:      uuid('document_id').notNull()
    .references(() => documents.id, { onDelete: 'cascade' }),
  documentVersionId: uuid('document_version_id')
    .references(() => documentVersions.id, { onDelete: 'set null' }),

  verificationStatus: verificationStatusEnum('verification_status').notNull().default('NOT_STARTED'),
  verificationMethod: verificationMethodEnum('verification_method').notNull().default('DOCUMENT_REVIEW'),

  verifiedBy: uuid('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  // null = not yet verified

  rejectionReason: rejectionReasonEnum('rejection_reason'),
  rejectionNote:   text('rejection_note'),
  // More detail for the reviewer — may be shared with driver in redacted form

  reviewNotes: text('review_notes'),
  // Internal only — never exposed to driver

  // Government jurisdiction constraint
  reviewerJurisdiction: varchar('reviewer_jurisdiction', { length: 10 }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_doc_verif_document').on(t.documentId),
  index('idx_doc_verif_status').on(t.verificationStatus),
  index('idx_doc_verif_verified_by').on(t.verifiedBy),
  index('idx_doc_verif_jurisdiction').on(t.reviewerJurisdiction),
])

// ─── DOCUMENT AUDIT EVENTS ────────────────────────────────────

export const documentAuditEvents = pgTable('document_audit_events', {
  id:         uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull()
    .references(() => documents.id, { onDelete: 'cascade' }),

  actorId:   uuid('actor_id').references(() => users.id),
  actorRole: varchar('actor_role', { length: 50 }),

  action: varchar('action', { length: 60 }).notNull(),
  // 'DOCUMENT_CREATED' | 'DOCUMENT_UPLOADED' | 'VERSION_CREATED'
  // | 'REVIEW_STARTED' | 'DOCUMENT_APPROVED' | 'DOCUMENT_REJECTED'
  // | 'DOCUMENT_REPLACED' | 'DOCUMENT_EXPIRED' | 'DOCUMENT_ARCHIVED'
  // | 'DOCUMENT_DOWNLOADED' | 'DOCUMENT_VIEWED'

  versionId: uuid('version_id').references(() => documentVersions.id, { onDelete: 'set null' }),

  // Changed data — NEVER includes storage paths, encryption keys, raw doc numbers
  metadata: jsonb('metadata').notNull().default({}),

  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_doc_audit_document').on(t.documentId),
  index('idx_doc_audit_actor').on(t.actorId),
  index('idx_doc_audit_action').on(t.action),
  index('idx_doc_audit_occurred').on(t.occurredAt),
])

// ─── COMPLIANCE SNAPSHOTS ─────────────────────────────────────
// Computed compliance state — recalculable, never definitive on its own

export const complianceSnapshots = pgTable('compliance_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Who this compliance check is for
  ownerType:     ownerTypeEnum('owner_type').notNull(),
  driverOwnerId: uuid('driver_owner_id').references(() => driverProfiles.id, { onDelete: 'cascade' }),
  vehicleOwnerId: uuid('vehicle_owner_id').references(() => vehicles.id, { onDelete: 'cascade' }),

  serviceType:  varchar('service_type', { length: 30 }).notNull(),
  // 'TAXI' | 'RIDESHARE' | 'DELIVERY'

  jurisdiction: varchar('jurisdiction', { length: 10 }).notNull().default('QC'),

  overallStatus: complianceStatusEnum('overall_status').notNull(),

  // Document breakdown — which are missing/expired
  missingDocuments: jsonb('missing_documents').notNull().default(sql`'[]'`),
  expiredDocuments: jsonb('expired_documents').notNull().default(sql`'[]'`),
  expiringDocuments: jsonb('expiring_documents').notNull().default(sql`'[]'`),
  // Arrays of public_document_id — never raw IDs exposed

  // Computed score 0-100
  completenessScore: integer('completeness_score').notNull().default(0),

  // This is a snapshot — must be recomputed when documents change
  computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),
  // Always mark when it was computed — never treat as real-time

  // Which document states triggered which results
  details: jsonb('details').notNull().default({}),
  // Never includes storage refs or sensitive values
}, (t) => [
  index('idx_compliance_driver').on(t.driverOwnerId),
  index('idx_compliance_vehicle').on(t.vehicleOwnerId),
  index('idx_compliance_service').on(t.serviceType),
  index('idx_compliance_status').on(t.overallStatus),
  index('idx_compliance_computed').on(t.computedAt),
])

// ─── CENTRAL INSPECTIONS ──────────────────────────────────────
// Central inspection table (extends vehicle_inspections from DB-3)
// DB-3 has vehicle_inspections for vehicle-specific checks
// This table is the general inspection record usable for any entity

export const inspectionRecords = pgTable('inspection_records', {
  id:        uuid('id').primaryKey().defaultRandom(),
  vehicleId: uuid('vehicle_id')
    .references(() => vehicles.id, { onDelete: 'cascade' }),
  driverId:  uuid('driver_id')
    .references(() => driverProfiles.id, { onDelete: 'set null' }),

  inspectionType: inspectionTypeEnum('inspection_type_v2').notNull(),
  jurisdiction:   varchar('jurisdiction', { length: 10 }).notNull().default('QC'),

  // Dates
  scheduledAt:    timestamp('scheduled_at',   { withTimezone: true }),
  inspectedAt:    timestamp('inspected_at',   { withTimezone: true }),
  validFrom:      date('valid_from'),
  validUntil:     date('valid_until'),

  result: inspectionResultEnum('result').notNull().default('SCHEDULED'),

  // Inspector — may be external (not a Taximètre.gov user)
  inspectorReference: varchar('inspector_reference', { length: 100 }),
  // Opaque reference — not a users.id FK (external inspector possible)

  inspectionCenterReference: varchar('inspection_center_reference', { length: 100 }),

  // Proof document
  documentId: uuid('document_id').references(() => documents.id, { onDelete: 'set null' }),
  // The inspection certificate document

  failureNotes: text('failure_notes'),
  // What failed — NOT a driver-visible field by default
  conditions:   text('conditions').array().default(sql`'{}'`),

  // Notification tracking
  expiryNotifiedAt: timestamp('expiry_notified_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_inspection_vehicle').on(t.vehicleId),
  index('idx_inspection_driver').on(t.driverId),
  index('idx_inspection_type').on(t.inspectionType),
  index('idx_inspection_result').on(t.result),
  index('idx_inspection_valid_until').on(t.validUntil),
])

// ─── RELATIONS ────────────────────────────────────────────────

export const documentTypesRelations = relations(documentTypes, ({ many }) => ({
  documents:    many(documents),
  requirements: many(documentTypeRequirements),
}))

export const documentsRelations = relations(documents, ({ one, many }) => ({
  documentType:  one(documentTypes, { fields: [documents.documentTypeId], references: [documentTypes.id] }),
  driverOwner:   one(driverProfiles, { fields: [documents.driverOwnerId],  references: [driverProfiles.id] }),
  vehicleOwner:  one(vehicles,       { fields: [documents.vehicleOwnerId], references: [vehicles.id] }),
  versions:      many(documentVersions),
  verifications: many(documentVerifications),
  auditEvents:   many(documentAuditEvents),
}))

export const documentVersionsRelations = relations(documentVersions, ({ one }) => ({
  document:   one(documents, { fields: [documentVersions.documentId],  references: [documents.id] }),
  uploadedBy: one(users,     { fields: [documentVersions.uploadedBy],  references: [users.id] }),
}))

export const documentVerificationsRelations = relations(documentVerifications, ({ one }) => ({
  document: one(documents,        { fields: [documentVerifications.documentId],       references: [documents.id] }),
  version:  one(documentVersions, { fields: [documentVerifications.documentVersionId], references: [documentVersions.id] }),
  verifiedBy: one(users,          { fields: [documentVerifications.verifiedBy],        references: [users.id] }),
}))

export const inspectionRecordsRelations = relations(inspectionRecords, ({ one }) => ({
  vehicle:  one(vehicles,       { fields: [inspectionRecords.vehicleId],  references: [vehicles.id] }),
  driver:   one(driverProfiles, { fields: [inspectionRecords.driverId],   references: [driverProfiles.id] }),
  document: one(documents,      { fields: [inspectionRecords.documentId], references: [documents.id] }),
}))
