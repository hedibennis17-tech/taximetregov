// ================================================================
// TAXIMÈTRE.GOV — MONITORING, INCIDENTS & SYSTEM CONFIG SCHEMA
// Database Phase 12/20 — Monitoring · Incidents · Jobs · Config
// ================================================================
//
// RÈGLES ABSOLUES:
// 1. Ce schema OBSERVE les services existants — jamais second système de données
// 2. Incidents: données financières JAMAIS supprimées pendant incident
// 3. Feature flags: activation progressive · jamais déploiement tout-ou-rien
// 4. System config: valeurs sensibles jamais en clair (encrypted_value)
// 5. Jobs: idempotency_key UNIQUE → relance safe · jamais double-exécution
// 6. Service health: NEVER assume HEALTHY si pas de heartbeat récent
// 7. Alert rules: configurable · jamais hardcoded thresholds
// 8. isPilot=true: homologation officielle requise avant production commerciale
// ================================================================

import {
  pgTable, pgEnum, uuid, text, boolean, integer,
  timestamp, jsonb, uniqueIndex, index, varchar,
  numeric, date,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './auth.schema'

// ─── ENUMS ───────────────────────────────────────────────────

export const serviceStatusEnum = pgEnum('service_status', [
  'HEALTHY',
  'DEGRADED',
  'DOWN',
  'MAINTENANCE',
  'UNKNOWN',
])

export const incidentSeverityEnum = pgEnum('incident_severity', [
  'P1_CRITICAL',  // Full outage — immediate response
  'P2_HIGH',      // Major degradation
  'P3_MEDIUM',    // Partial degradation
  'P4_LOW',       // Minor issue
])

export const incidentStatusEnum = pgEnum('incident_status', [
  'DETECTED',
  'ACKNOWLEDGED',
  'INVESTIGATING',
  'IDENTIFIED',    // Root cause identified
  'MITIGATING',
  'MONITORING',    // Fix applied, watching for recurrence
  'RESOLVED',
  'CLOSED',
  'POST_MORTEM',
])

export const alertSeverityEnum = pgEnum('alert_severity', [
  'CRITICAL',
  'HIGH',
  'WARNING',
  'INFO',
])

export const alertStatusEnum = pgEnum('alert_status', [
  'FIRING',
  'ACKNOWLEDGED',
  'RESOLVED',
  'SUPPRESSED',
])

export const jobStatusEnum = pgEnum('job_status', [
  'QUEUED',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'RETRYING',
  'CANCELLED',
  'DEAD_LETTER',
])

export const jobPriorityEnum = pgEnum('job_priority', [
  'CRITICAL',
  'HIGH',
  'NORMAL',
  'LOW',
])

export const configValueTypeEnum = pgEnum('config_value_type', [
  'STRING',
  'INTEGER',
  'DECIMAL',
  'BOOLEAN',
  'JSON',
  'ENCRYPTED',  // Sensitive — value stored encrypted, never returned in plain
])

export const featureFlagStateEnum = pgEnum('feature_flag_state', [
  'DISABLED',
  'ENABLED',
  'ROLLOUT',       // Percentage rollout
  'PILOT_ONLY',    // Only for pilot environment
  'DEPRECATED',
])

export const maintenanceWindowStatusEnum = pgEnum('maintenance_window_status', [
  'SCHEDULED',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
])

// ─── SERVICE HEALTH ───────────────────────────────────────────

export const serviceHealthChecks = pgTable('service_health_checks', {
  id:          uuid('id').primaryKey().defaultRandom(),
  serviceName: varchar('service_name', { length: 60 }).notNull(),
  // e.g. 'api-gateway', 'auth-service', 'taximeter-engine', 'payment-service'

  status:    serviceStatusEnum('service_status').notNull().default('UNKNOWN'),
  // UNKNOWN until first heartbeat received

  // Metrics — NUMERIC for precision
  latencyMs:   numeric('latency_ms',   { precision: 8, scale: 2 }),
  errorRatePC: numeric('error_rate_pc', { precision: 6, scale: 3 }),
  // Percentage 0.000 to 100.000

  // Version info
  version:      varchar('version',      { length: 30 }),
  instanceId:   varchar('instance_id',  { length: 60 }),

  // Last heartbeat
  lastHeartbeatAt: timestamp('last_heartbeat_at', { withTimezone: true }),
  // If no heartbeat for configurable window → status = UNKNOWN

  // Dependency health
  dependencyStatus: jsonb('dependency_status').default({}),
  // { 'database': 'HEALTHY', 'cache': 'DEGRADED' }

  // Non-sensitive metadata
  metadata: jsonb('metadata').default({}),

  checkedAt: timestamp('checked_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_health_service_name').on(t.serviceName),
  index('idx_health_status').on(t.status),
  index('idx_health_checked').on(t.checkedAt),
  index('idx_health_heartbeat').on(t.lastHeartbeatAt),
])

// ─── HEALTH HISTORY ───────────────────────────────────────────

export const serviceHealthHistory = pgTable('service_health_history', {
  id:          uuid('id').primaryKey().defaultRandom(),
  serviceName: varchar('service_name', { length: 60 }).notNull(),

  status:      serviceStatusEnum('service_status').notNull(),
  latencyMs:   numeric('latency_ms',   { precision: 8, scale: 2 }),
  errorRatePC: numeric('error_rate_pc', { precision: 6, scale: 3 }),

  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_health_hist_service').on(t.serviceName),
  index('idx_health_hist_recorded').on(t.recordedAt),
  index('idx_health_hist_service_recorded').on(t.serviceName, t.recordedAt),
])

// ─── ALERT RULES ──────────────────────────────────────────────

export const alertRules = pgTable('alert_rules', {
  id:       uuid('id').primaryKey().defaultRandom(),
  name:     varchar('name',        { length: 100 }).notNull(),
  code:     varchar('code',        { length: 60  }).notNull().unique(),
  // Stable code: 'HIGH_ERROR_RATE', 'SERVICE_DOWN', 'PAYMENT_SPIKE', etc.

  serviceName: varchar('service_name', { length: 60 }),
  // null = global rule

  severity: alertSeverityEnum('alert_severity').notNull(),

  // Threshold — NUMERIC, configurable · never hardcoded
  thresholdValue: numeric('threshold_value', { precision: 12, scale: 4 }),
  thresholdUnit:  varchar('threshold_unit',  { length: 30 }),
  // e.g. 'percentage', 'count', 'ms', 'per_minute'

  // Evaluation window
  evaluationWindowSeconds: integer('evaluation_window_seconds').notNull().default(300),
  // Configurable — default 5 min

  // Whether the rule is active
  isActive: boolean('is_active').notNull().default(true),

  // Notification targets
  notifyChannels: text('notify_channels').array(),
  // ['SLACK_OPS', 'EMAIL_GOV', 'PAGERDUTY'] — resolved at app layer

  description: text('description'),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_alert_rule_service').on(t.serviceName),
  index('idx_alert_rule_severity').on(t.severity),
  index('idx_alert_rule_active').on(t.isActive),
])

// ─── ALERTS ───────────────────────────────────────────────────

export const alerts = pgTable('alerts', {
  id:          uuid('id').primaryKey().defaultRandom(),
  alertRuleId: uuid('alert_rule_id')
    .references(() => alertRules.id, { onDelete: 'set null' }),

  serviceName: varchar('service_name', { length: 60 }),
  severity:    alertSeverityEnum('alert_severity').notNull(),
  status:      alertStatusEnum('alert_status').notNull().default('FIRING'),

  title:   varchar('title',   { length: 200 }).notNull(),
  message: text('message').notNull(),

  // Triggered value that caused the alert
  triggeredValue:   numeric('triggered_value',   { precision: 12, scale: 4 }),
  thresholdValue:   numeric('threshold_value',   { precision: 12, scale: 4 }),

  // Assignment
  assignedTo:   uuid('assigned_to').references(() => users.id),
  acknowledgedBy: uuid('acknowledged_by').references(() => users.id),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  resolvedBy:   uuid('resolved_by').references(() => users.id),
  resolvedAt:   timestamp('resolved_at', { withTimezone: true }),
  resolution:   text('resolution'),

  correlationId: uuid('correlation_id'),

  firedAt:   timestamp('fired_at',   { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_alert_severity').on(t.severity),
  index('idx_alert_status').on(t.status),
  index('idx_alert_service').on(t.serviceName),
  index('idx_alert_assigned').on(t.assignedTo),
  index('idx_alert_fired').on(t.firedAt),
  index('idx_alert_correlation').on(t.correlationId),
])

// ─── INCIDENTS ────────────────────────────────────────────────

export const incidents = pgTable('incidents', {
  id:              uuid('id').primaryKey().defaultRandom(),
  publicIncidentId: varchar('public_incident_id', { length: 22 }).notNull().unique(),
  // Format: INC-XXXXXXXX

  title:    varchar('title',    { length: 200 }).notNull(),
  severity: incidentSeverityEnum('incident_severity').notNull(),
  status:   incidentStatusEnum('incident_status').notNull().default('DETECTED'),

  // Affected services
  affectedServices: text('affected_services').array().notNull(),
  affectedJurisdictions: text('affected_jurisdictions').array(),

  // Impact assessment
  impactDescription: text('impact_description'),
  userImpactCount:   integer('user_impact_count'),

  // Ownership
  incidentCommander: uuid('incident_commander').references(() => users.id),
  assignedTeam:      varchar('assigned_team', { length: 60 }),

  // Timeline
  detectedAt:    timestamp('detected_at',    { withTimezone: true }).notNull().defaultNow(),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  identifiedAt:   timestamp('identified_at',   { withTimezone: true }),
  mitigatedAt:    timestamp('mitigated_at',    { withTimezone: true }),
  resolvedAt:     timestamp('resolved_at',     { withTimezone: true }),
  closedAt:       timestamp('closed_at',       { withTimezone: true }),

  // Root cause & resolution
  rootCause:        text('root_cause'),
  resolutionSummary: text('resolution_summary'),

  // CRITICAL: financial data NEVER deleted during incident
  financialDataIntact: boolean('financial_data_intact').notNull().default(true),
  // Flag confirming financial records were not affected

  // Post-mortem
  postMortemUrl:  varchar('post_mortem_url',  { length: 500 }),
  postMortemDone: boolean('post_mortem_done').notNull().default(false),

  correlationId: uuid('correlation_id'),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_incident_severity').on(t.severity),
  index('idx_incident_status').on(t.status),
  index('idx_incident_detected').on(t.detectedAt),
  index('idx_incident_commander').on(t.incidentCommander),
])

// ─── INCIDENT TIMELINE ────────────────────────────────────────

export const incidentTimeline = pgTable('incident_timeline', {
  id:         uuid('id').primaryKey().defaultRandom(),
  incidentId: uuid('incident_id').notNull()
    .references(() => incidents.id, { onDelete: 'cascade' }),

  actorId:    uuid('actor_id').references(() => users.id),
  actorType:  varchar('actor_type', { length: 20 }).notNull().default('HUMAN'),
  // 'HUMAN' | 'SYSTEM' | 'AUTOMATED'

  action:     varchar('action', { length: 60 }).notNull(),
  // 'DETECTED' | 'ACKNOWLEDGED' | 'IDENTIFIED' | 'UPDATE' | 'RESOLVED' | 'NOTE'

  comment:    text('comment').notNull(),
  isPublic:   boolean('is_public').notNull().default(false),
  // Public entries visible in status page (no driver PII)

  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_incident_timeline_incident').on(t.incidentId),
  index('idx_incident_timeline_occurred').on(t.occurredAt),
])

// ─── BACKGROUND JOBS ──────────────────────────────────────────

export const backgroundJobs = pgTable('background_jobs', {
  id:     uuid('id').primaryKey().defaultRandom(),
  jobType: varchar('job_type', { length: 60 }).notNull(),
  // 'TAX_RECALCULATION' | 'REVENUE_RECONCILIATION' | 'DOCUMENT_EXPIRY_SCAN'
  // | 'PROVIDER_SYNC' | 'COMPLIANCE_REFRESH' | 'GPS_CLEANUP' | 'REPORT_GENERATION'
  // | 'NOTIFICATION_BATCH' | 'AUDIT_EXPORT'

  status:   jobStatusEnum('job_status').notNull().default('QUEUED'),
  priority: jobPriorityEnum('job_priority').notNull().default('NORMAL'),

  // Idempotency — same job never runs twice
  idempotencyKey: varchar('idempotency_key', { length: 100 }).notNull().unique(),

  // Input — non-sensitive params only
  inputPayload: jsonb('input_payload').notNull().default({}),
  // NEVER: tokens, passwords, raw financial data

  // Output summary
  resultSummary: jsonb('result_summary').default({}),
  errorCode:     varchar('error_code',   { length: 100 }),
  errorDetail:   text('error_detail'),

  // Retry
  attemptCount: integer('attempt_count').notNull().default(0),
  maxAttempts:  integer('max_attempts').notNull().default(3),
  nextRetryAt:  timestamp('next_retry_at', { withTimezone: true }),

  // Scheduling
  scheduledAt:  timestamp('scheduled_at',  { withTimezone: true }),
  startedAt:    timestamp('started_at',    { withTimezone: true }),
  completedAt:  timestamp('completed_at',  { withTimezone: true }),
  failedAt:     timestamp('failed_at',     { withTimezone: true }),

  // Worker that picked up this job
  workerInstance: varchar('worker_instance', { length: 60 }),

  correlationId: uuid('correlation_id'),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_job_type').on(t.jobType),
  index('idx_job_status').on(t.status),
  index('idx_job_priority').on(t.priority),
  index('idx_job_scheduled').on(t.scheduledAt),
  index('idx_job_next_retry').on(t.nextRetryAt),
  index('idx_job_correlation').on(t.correlationId),
])

// ─── FEATURE FLAGS ────────────────────────────────────────────

export const featureFlags = pgTable('feature_flags', {
  id:   uuid('id').primaryKey().defaultRandom(),
  key:  varchar('key',   { length: 80 }).notNull().unique(),
  // Stable key: 'taximeter.enabled', 'delivery.enabled', 'uber.oauth.enabled'

  label:       varchar('label',       { length: 100 }).notNull(),
  description: text('description'),
  module:      varchar('module',      { length: 50 }).notNull(),
  // 'TAXIMETER' | 'DELIVERY' | 'PROVIDERS' | 'TAX' | 'PAYMENTS' | 'COMPLIANCE'

  state: featureFlagStateEnum('feature_flag_state').notNull().default('DISABLED'),

  // Rollout percentage (for ROLLOUT state)
  rolloutPercentage: integer('rollout_percentage').default(0),
  // 0-100 — only used when state=ROLLOUT

  // Conditions (JSON) — evaluated at app layer
  conditions: jsonb('conditions').default({}),
  // e.g. { "jurisdictions": ["QC"], "isPilot": true }

  isSystem:   boolean('is_system').notNull().default(false),
  // System flags cannot be deleted (only disabled)

  // Approval chain for sensitive flags
  enabledBy:  uuid('enabled_by').references(() => users.id),
  enabledAt:  timestamp('enabled_at',  { withTimezone: true }),
  disabledBy: uuid('disabled_by').references(() => users.id),
  disabledAt: timestamp('disabled_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_ff_key').on(t.key),
  index('idx_ff_state').on(t.state),
  index('idx_ff_module').on(t.module),
])

// ─── SYSTEM CONFIG ────────────────────────────────────────────

export const systemConfigs = pgTable('system_configs', {
  id:           uuid('id').primaryKey().defaultRandom(),
  key:          varchar('key',           { length: 100 }).notNull(),
  jurisdiction: varchar('jurisdiction',  { length: 10  }).notNull().default('GLOBAL'),
  // 'GLOBAL' | 'QC' | 'ON' — jurisdiction-specific configs

  label:       varchar('label',       { length: 100 }).notNull(),
  description: text('description'),
  module:      varchar('module',      { length: 50  }).notNull(),

  valueType: configValueTypeEnum('value_type').notNull(),

  // The actual value — based on type
  valueString:  text('value_string'),
  valueInt:     integer('value_int'),
  valueDecimal: numeric('value_decimal', { precision: 12, scale: 6 }),
  valueBool:    boolean('value_bool'),
  valueJson:    jsonb('value_json'),
  // ENCRYPTED type: value stored in value_encrypted_ref (reference to KMS)
  valueEncryptedRef: varchar('value_encrypted_ref', { length: 200 }),
  // Opaque KMS reference — never the actual secret

  isEditable: boolean('is_editable').notNull().default(true),
  isSecret:   boolean('is_secret').notNull().default(false),
  // is_secret=true → ENCRYPTED type · never returned in API

  // Version tracking
  version:    integer('version').notNull().default(1),
  updatedBy:  uuid('updated_by').references(() => users.id),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_sys_config_key_jurisdiction').on(t.key, t.jurisdiction),
  index('idx_sys_config_module').on(t.module),
  index('idx_sys_config_secret').on(t.isSecret),
])

// ─── PILOT CONFIGURATIONS ─────────────────────────────────────

export const pilotConfigurations = pgTable('pilot_configurations', {
  id:      uuid('id').primaryKey().defaultRandom(),
  pilotId: varchar('pilot_id', { length: 30 }).notNull().unique(),
  // e.g. 'PILOT-QC-2026'

  name:         varchar('name',         { length: 100 }).notNull(),
  jurisdiction: varchar('jurisdiction', { length: 10  }).notNull().default('QC'),

  // Active services in this pilot
  activeTaxiService:     boolean('active_taxi_service').notNull().default(true),
  activeRideshareService: boolean('active_rideshare_service').notNull().default(true),
  activeDeliveryService:  boolean('active_delivery_service').notNull().default(true),

  // Geographic scope
  activeCities: text('active_cities').array().notNull(),

  // Capacity
  maxDrivers:         integer('max_drivers').notNull().default(50),
  currentDriverCount: integer('current_driver_count').notNull().default(0),

  // Official certification
  isPilot:                  boolean('is_pilot').notNull().default(true),
  // ALWAYS true until official regulatory homologation obtained
  regulatoryHomologationRef: varchar('regulatory_homologation_ref', { length: 100 }),
  // null = not yet homologated — isPilot must remain true

  startDate: date('start_date').notNull(),
  endDate:   date('end_date'),

  status: varchar('status', { length: 20 }).notNull().default('ACTIVE'),
  // 'PLANNING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED'

  notes: text('notes'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_pilot_jurisdiction').on(t.jurisdiction),
  index('idx_pilot_status').on(t.status),
])

// ─── MAINTENANCE WINDOWS ──────────────────────────────────────

export const maintenanceWindows = pgTable('maintenance_windows', {
  id:    uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 200 }).notNull(),

  affectedServices:      text('affected_services').array().notNull(),
  affectedJurisdictions: text('affected_jurisdictions').array(),

  status: maintenanceWindowStatusEnum('maintenance_window_status').notNull().default('SCHEDULED'),

  scheduledStart: timestamp('scheduled_start', { withTimezone: true }).notNull(),
  scheduledEnd:   timestamp('scheduled_end',   { withTimezone: true }).notNull(),
  actualStart:    timestamp('actual_start',    { withTimezone: true }),
  actualEnd:      timestamp('actual_end',      { withTimezone: true }),

  description:  text('description').notNull(),
  isPublic:     boolean('is_public').notNull().default(false),
  // Public maintenance shown on status page without PII

  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_maint_status').on(t.status),
  index('idx_maint_scheduled_start').on(t.scheduledStart),
])

// ─── RELATIONS ────────────────────────────────────────────────

export const alertsRelations = relations(alerts, ({ one }) => ({
  alertRule:      one(alertRules, { fields: [alerts.alertRuleId],     references: [alertRules.id] }),
  assignedTo:     one(users,      { fields: [alerts.assignedTo],      references: [users.id] }),
  acknowledgedBy: one(users,      { fields: [alerts.acknowledgedBy],  references: [users.id] }),
  resolvedBy:     one(users,      { fields: [alerts.resolvedBy],      references: [users.id] }),
}))

export const incidentsRelations = relations(incidents, ({ one, many }) => ({
  commander: one(users,             { fields: [incidents.incidentCommander], references: [users.id] }),
  timeline:  many(incidentTimeline),
}))

export const incidentTimelineRelations = relations(incidentTimeline, ({ one }) => ({
  incident: one(incidents, { fields: [incidentTimeline.incidentId], references: [incidents.id] }),
  actor:    one(users,     { fields: [incidentTimeline.actorId],    references: [users.id] }),
}))

export const featureFlagsRelations = relations(featureFlags, ({ one }) => ({
  enabledBy:  one(users, { fields: [featureFlags.enabledBy],  references: [users.id] }),
  disabledBy: one(users, { fields: [featureFlags.disabledBy], references: [users.id] }),
}))

export const systemConfigsRelations = relations(systemConfigs, ({ one }) => ({
  updatedBy: one(users, { fields: [systemConfigs.updatedBy], references: [users.id] }),
}))
