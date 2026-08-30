// ================================================================
// TAXIMÈTRE.GOV — GOVERNMENT DASHBOARD & REGULATORY SCHEMA
// Database Phase 16/20 — Regulatory Reports · Gov Oversight · Compliance
// ================================================================
//
// ARCHITECTURE NOTE:
// Government views are READ-ONLY into driver data.
// Regulatory actions (suspend, approve) create records HERE.
// Driver data is never duplicated — reports reference canonical tables.
//
// RÈGLES ABSOLUES:
// 1. Government users cannot self-approve regulatory actions
// 2. Reports are snapshots — never authoritative over canonical data
// 3. Driver PII in reports: masked unless specifically authorized
// 4. Regulatory suspension ≠ deactivation — tracked separately
// 5. All regulatory actions require legalAuthority reference
// 6. Cross-jurisdiction access strictly enforced per gov user profile
// 7. Report exports require MFA + audit log
// 8. Soft-delete only — regulatory history never hard-deleted
// ================================================================

import {
  pgTable, pgEnum, uuid, text, boolean, integer,
  timestamp, jsonb, uniqueIndex, index, varchar, date, numeric,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users }           from './auth.schema'
import { driverProfiles }  from './profiles.schema'
import { jurisdictions }   from './pre-db10.schema'

// ─── ENUMS ───────────────────────────────────────────────────

export const regulatoryReportTypeEnum = pgEnum('regulatory_report_type', [
  'DRIVER_ACTIVITY_SUMMARY',
  'REVENUE_SUMMARY',
  'TAX_COMPLIANCE',
  'PROVIDER_ACTIVITY',
  'PLATFORM_OVERSIGHT',
  'INCIDENT_REPORT',
  'AUDIT_TRAIL',
  'GDPR_PROCESSING_REGISTER',
  'FLEET_COMPLIANCE',
  'PILOT_STATUS',
  'CUSTOM',
])

export const regulatoryReportStatusEnum = pgEnum('regulatory_report_status', [
  'SCHEDULED',
  'GENERATING',
  'READY',
  'DELIVERED',
  'FAILED',
  'EXPIRED',
  'ARCHIVED',
])

export const regulatoryActionTypeEnum = pgEnum('regulatory_action_type', [
  'DRIVER_APPROVED',
  'DRIVER_SUSPENDED',
  'DRIVER_REACTIVATED',
  'DRIVER_REVOKED',
  'VEHICLE_APPROVED',
  'VEHICLE_SUSPENDED',
  'PERMIT_APPROVED',
  'PERMIT_SUSPENDED',
  'PERMIT_REVOKED',
  'DOCUMENT_APPROVED',
  'DOCUMENT_REJECTED',
  'TAX_ASSESSMENT',
  'COMPLIANCE_NOTICE',
  'INVESTIGATION_OPENED',
  'INVESTIGATION_CLOSED',
  'FINE_ISSUED',
  'PENALTY_APPLIED',
  'WARNING_ISSUED',
  'OTHER',
])

export const regulatoryActionStatusEnum = pgEnum('regulatory_action_status', [
  'PENDING',
  'ACTIVE',
  'APPEALED',
  'OVERTURNED',
  'UPHELD',
  'EXPIRED',
  'CANCELLED',
])

export const govDriverComplianceEnum = pgEnum('gov_driver_compliance', [
  'COMPLIANT',
  'NON_COMPLIANT',
  'UNDER_REVIEW',
  'SUSPENDED',
  'REVOKED',
  'PENDING_DOCS',
  'UNKNOWN',
])

export const oversightPriorityEnum = pgEnum('oversight_priority', [
  'CRITICAL',
  'HIGH',
  'NORMAL',
  'LOW',
  'INFORMATIONAL',
])

export const reportFormatEnum = pgEnum('report_format', [
  'PDF',
  'CSV',
  'JSON',
  'XML',
  'XLSX',
])

export const dashboardMetricTypeEnum = pgEnum('dashboard_metric_type', [
  'ACTIVE_DRIVERS',
  'SUSPENDED_DRIVERS',
  'PENDING_APPROVALS',
  'ACTIVE_VEHICLES',
  'DAILY_TRIPS',
  'DAILY_DELIVERIES',
  'TAX_COLLECTED',
  'COMPLIANCE_RATE',
  'OPEN_INCIDENTS',
  'PROVIDER_EVENTS_TODAY',
  'QUARANTINE_QUEUE',
  'EXPIRING_DOCUMENTS',
])

// ─── REGULATORY ACTIONS ───────────────────────────────────────

export const regulatoryActions = pgTable('regulatory_actions', {
  id:     uuid('id').primaryKey().defaultRandom(),
  publicActionId: varchar('public_action_id', { length: 20 }).notNull().unique(),
  // Format: REG-XXXXXXXX

  // Actor
  issuedBy:   uuid('issued_by').notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  // NEVER self-issued — server enforces issuer ≠ subject gov user
  approvedBy: uuid('approved_by').references(() => users.id),
  // May require secondary approval for high-severity actions

  // Subject
  subjectDriverId: uuid('subject_driver_id')
    .references(() => driverProfiles.id, { onDelete: 'restrict' }),

  jurisdictionId: uuid('jurisdiction_id').notNull()
    .references(() => jurisdictions.id),

  actionType: regulatoryActionTypeEnum('action_type').notNull(),
  status:     regulatoryActionStatusEnum('status').notNull().default('ACTIVE'),
  priority:   oversightPriorityEnum('priority').notNull().default('NORMAL'),

  // Legal mandate — REQUIRED for all regulatory actions
  legalAuthority:    varchar('legal_authority',    { length: 200 }).notNull(),
  // e.g. 'Art. 45 Loi sur les transports — Suspension permis taxi'
  legalReference:    varchar('legal_reference',    { length: 100 }),
  // Specific article/section reference

  // Duration
  effectiveAt:    timestamp('effective_at',    { withTimezone: true }).notNull(),
  expiresAt:      timestamp('expires_at',      { withTimezone: true }),
  // null = indefinite

  // Penalty (if applicable)
  penaltyAmount:  numeric('penalty_amount',    { precision: 12, scale: 2 }),
  penaltyCurrency: varchar('penalty_currency', { length: 3 }),

  reason:      text('reason').notNull(),
  internalNote: text('internal_note'),
  // Never exposed to driver by default

  // Appeal tracking
  appealDeadlineAt: timestamp('appeal_deadline_at', { withTimezone: true }),
  appealedAt:       timestamp('appealed_at',         { withTimezone: true }),
  appealNote:       text('appeal_note'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_reg_action_issued_by').on(t.issuedBy),
  index('idx_reg_action_driver').on(t.subjectDriverId),
  index('idx_reg_action_type').on(t.actionType),
  index('idx_reg_action_status').on(t.status),
  index('idx_reg_action_jurisdiction').on(t.jurisdictionId),
  index('idx_reg_action_effective').on(t.effectiveAt),
  index('idx_reg_action_expires').on(t.expiresAt),
])

// ─── DRIVER REGULATORY PROFILES ──────────────────────────────
// Government view of each driver — computed/updated periodically

export const driverRegulatoryProfiles = pgTable('driver_regulatory_profiles', {
  id:       uuid('id').primaryKey().defaultRandom(),
  driverId: uuid('driver_id').notNull().unique()
    .references(() => driverProfiles.id, { onDelete: 'restrict' }),

  jurisdictionId: uuid('jurisdiction_id').notNull()
    .references(() => jurisdictions.id),

  overallCompliance: govDriverComplianceEnum('overall_compliance').notNull().default('UNKNOWN'),

  // Document status summary
  documentsValid:    boolean('documents_valid').notNull().default(false),
  documentsExpiring: boolean('documents_expiring').notNull().default(false),
  missingDocuments:  text('missing_documents').array(),

  // Active regulatory actions
  activeActionsCount:    integer('active_actions_count').notNull().default(0),
  criticalActionsCount:  integer('critical_actions_count').notNull().default(0),
  hasSuspension:         boolean('has_suspension').notNull().default(false),

  // Activity summary (last 30 days — configurable)
  totalActivities:   integer('total_activities').notNull().default(0),
  taxiTrips:         integer('taxi_trips').notNull().default(0),
  rideshareTrips:    integer('rideshare_trips').notNull().default(0),
  deliveries:        integer('deliveries').notNull().default(0),

  // Tax compliance
  taxCompliant:      boolean('tax_compliant').notNull().default(false),
  openTaxPeriods:    integer('open_tax_periods').notNull().default(0),

  // Last snapshot info
  snapshotAt:       timestamp('snapshot_at',  { withTimezone: true }).notNull().defaultNow(),
  snapshotVersion:  integer('snapshot_version').notNull().default(1),
  // Snapshot = never authoritative — canonical data is source of truth

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_drp_driver').on(t.driverId),
  index('idx_drp_jurisdiction').on(t.jurisdictionId),
  index('idx_drp_compliance').on(t.overallCompliance),
  index('idx_drp_suspension').on(t.hasSuspension),
  index('idx_drp_snapshot').on(t.snapshotAt),
])

// ─── REGULATORY REPORTS ───────────────────────────────────────

export const regulatoryReports = pgTable('regulatory_reports', {
  id:      uuid('id').primaryKey().defaultRandom(),
  publicReportId: varchar('public_report_id', { length: 22 }).notNull().unique(),
  // Format: RPT-XXXXXXXX

  requestedBy:   uuid('requested_by').notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  jurisdictionId: uuid('jurisdiction_id').notNull()
    .references(() => jurisdictions.id),

  reportType:    regulatoryReportTypeEnum('report_type').notNull(),
  status:        regulatoryReportStatusEnum('status').notNull().default('SCHEDULED'),
  outputFormat:  reportFormatEnum('format').notNull().default('PDF'),

  // Report parameters
  periodStart:   date('period_start').notNull(),
  periodEnd:     date('period_end').notNull(),
  filters:       jsonb('filters').notNull().default({}),
  // e.g. { jurisdictionCode: 'QC', activityType: 'TAXI_TRIP' }

  // Output
  reportRefMasked: varchar('report_ref_masked', { length: 200 }),
  // Signed reference to report file — expires after download window
  reportSizeBytes: integer('report_size_bytes'),
  recordCount:     integer('record_count'),

  // Privacy
  containsPii: boolean('contains_pii').notNull().default(false),
  // If true: access requires elevated permissions

  generatedAt:  timestamp('generated_at',  { withTimezone: true }),
  deliveredAt:  timestamp('delivered_at',  { withTimezone: true }),
  expiresAt:    timestamp('expires_at',    { withTimezone: true }),
  failureReason: text('failure_reason'),

  // Download audit
  downloadCount: integer('download_count').notNull().default(0),
  lastDownloadAt: timestamp('last_download_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_reg_report_requested_by').on(t.requestedBy),
  index('idx_reg_report_jurisdiction').on(t.jurisdictionId),
  index('idx_reg_report_type').on(t.reportType),
  index('idx_reg_report_status').on(t.status),
  index('idx_reg_report_period').on(t.periodStart, t.periodEnd),
])

// ─── OVERSIGHT FLAGS ──────────────────────────────────────────

export const oversightFlags = pgTable('oversight_flags', {
  id:       uuid('id').primaryKey().defaultRandom(),
  driverId: uuid('driver_id')
    .references(() => driverProfiles.id, { onDelete: 'cascade' }),

  flagType: varchar('flag_type', { length: 60 }).notNull(),
  // 'GPS_ANOMALY_PATTERN' | 'TAX_DISCREPANCY' | 'DOCUMENT_FRAUD_SUSPECTED'
  // | 'PROVIDER_MISMATCH' | 'UNUSUAL_ACTIVITY_VOLUME' | 'CROSS_JURISDICTION'

  priority:    oversightPriorityEnum('priority').notNull().default('NORMAL'),
  description: text('description').notNull(),
  // NEVER: contains accusation of fraud — 'REVIEW_REQUIRED' language

  // Source of the flag
  sourceType: varchar('source_type', { length: 50 }).notNull(),
  // 'AUTOMATED_DETECTION' | 'MANUAL_FLAG' | 'PROVIDER_REPORT' | 'AUDIT_TRIGGER'
  sourceRef:  varchar('source_ref', { length: 100 }),

  jurisdictionId: uuid('jurisdiction_id')
    .references(() => jurisdictions.id),

  // Review lifecycle
  isOpen:      boolean('is_open').notNull().default(true),
  assignedTo:  uuid('assigned_to').references(() => users.id),
  reviewedBy:  uuid('reviewed_by').references(() => users.id),
  reviewedAt:  timestamp('reviewed_at', { withTimezone: true }),
  resolution:  varchar('resolution', { length: 30 }),
  // 'FALSE_POSITIVE' | 'RESOLVED' | 'ESCALATED' | 'ACTION_TAKEN'
  resolutionNote: text('resolution_note'),

  createdAt:  timestamp('created_at',  { withTimezone: true }).notNull().defaultNow(),
  updatedAt:  timestamp('updated_at',  { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
}, (t) => [
  index('idx_oversight_driver').on(t.driverId),
  index('idx_oversight_type').on(t.flagType),
  index('idx_oversight_priority').on(t.priority),
  index('idx_oversight_open').on(t.isOpen),
  index('idx_oversight_jurisdiction').on(t.jurisdictionId),
])

// ─── DASHBOARD METRICS SNAPSHOTS ─────────────────────────────

export const dashboardMetricSnapshots = pgTable('dashboard_metric_snapshots', {
  id:            uuid('id').primaryKey().defaultRandom(),
  jurisdictionId: uuid('jurisdiction_id').notNull()
    .references(() => jurisdictions.id),

  metricType:  dashboardMetricTypeEnum('metric_type').notNull(),
  metricValue: numeric('metric_value', { precision: 19, scale: 4 }).notNull(),
  metricUnit:  varchar('metric_unit', { length: 20 }),
  // 'count' | 'CAD' | 'percent'

  periodType:  varchar('period_type',  { length: 20 }).notNull().default('DAILY'),
  // 'REALTIME' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY'

  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd:   timestamp('period_end',   { withTimezone: true }).notNull(),

  // These are snapshots — always show computedAt for display
  computedAt:  timestamp('computed_at',  { withTimezone: true }).notNull().defaultNow(),
  // Never present as real-time unless periodType='REALTIME'

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_dash_metric_unique').on(t.jurisdictionId, t.metricType, t.periodStart, t.periodType),
  index('idx_dash_metric_jurisdiction').on(t.jurisdictionId),
  index('idx_dash_metric_type').on(t.metricType),
  index('idx_dash_metric_period').on(t.periodStart, t.periodEnd),
  index('idx_dash_metric_computed').on(t.computedAt),
])

// ─── REGULATORY REPORT ACCESS LOG ────────────────────────────

export const reportAccessLog = pgTable('report_access_log', {
  id:            uuid('id').primaryKey().defaultRandom(),
  reportId:      uuid('report_id').notNull()
    .references(() => regulatoryReports.id, { onDelete: 'restrict' }),
  accessedBy:    uuid('accessed_by').notNull()
    .references(() => users.id, { onDelete: 'restrict' }),

  accessType:    varchar('access_type', { length: 20 }).notNull(),
  // 'VIEW' | 'DOWNLOAD' | 'EXPORT' | 'PRINT'

  mfaVerified:   boolean('mfa_verified').notNull().default(false),
  // Downloads always require MFA

  ipHash:        varchar('ip_hash', { length: 64 }),
  correlationId: uuid('correlation_id'),

  accessedAt: timestamp('accessed_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_report_access_report').on(t.reportId),
  index('idx_report_access_user').on(t.accessedBy),
  index('idx_report_access_at').on(t.accessedAt),
])

// ─── RELATIONS ────────────────────────────────────────────────

export const regulatoryActionsRelations = relations(regulatoryActions, ({ one }) => ({
  issuedBy:     one(users,          { fields: [regulatoryActions.issuedBy],         references: [users.id] }),
  approvedBy:   one(users,          { fields: [regulatoryActions.approvedBy],        references: [users.id] }),
  subjectDriver: one(driverProfiles, { fields: [regulatoryActions.subjectDriverId],  references: [driverProfiles.id] }),
  jurisdiction: one(jurisdictions,  { fields: [regulatoryActions.jurisdictionId],    references: [jurisdictions.id] }),
}))

export const driverRegulatoryProfilesRelations = relations(driverRegulatoryProfiles, ({ one }) => ({
  driver:       one(driverProfiles, { fields: [driverRegulatoryProfiles.driverId],        references: [driverProfiles.id] }),
  jurisdiction: one(jurisdictions,  { fields: [driverRegulatoryProfiles.jurisdictionId],   references: [jurisdictions.id] }),
}))

export const regulatoryReportsRelations = relations(regulatoryReports, ({ one, many }) => ({
  requestedBy:   one(users,         { fields: [regulatoryReports.requestedBy],    references: [users.id] }),
  jurisdiction:  one(jurisdictions, { fields: [regulatoryReports.jurisdictionId], references: [jurisdictions.id] }),
  accessLogs:    many(reportAccessLog),
}))

export const oversightFlagsRelations = relations(oversightFlags, ({ one }) => ({
  driver:       one(driverProfiles, { fields: [oversightFlags.driverId],       references: [driverProfiles.id] }),
  jurisdiction: one(jurisdictions,  { fields: [oversightFlags.jurisdictionId],  references: [jurisdictions.id] }),
  assignedTo:   one(users,          { fields: [oversightFlags.assignedTo],      references: [users.id] }),
  reviewedBy:   one(users,          { fields: [oversightFlags.reviewedBy],      references: [users.id] }),
}))

export const reportAccessLogRelations = relations(reportAccessLog, ({ one }) => ({
  report:     one(regulatoryReports, { fields: [reportAccessLog.reportId],   references: [regulatoryReports.id] }),
  accessedBy: one(users,             { fields: [reportAccessLog.accessedBy], references: [users.id] }),
}))
