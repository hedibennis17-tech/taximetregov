// ================================================================
// TAXIMÈTRE.GOV — PLATFORM CONNECTORS & SYNC ENGINE SCHEMA
// Database Phase 18/20 — Connectors · Pipeline · Checkpoints · Rate Limits
// ================================================================
//
// RÉUTILISÉ DE DB6/DB7/DB13:
//   providers(DB-6)                → provider registry
//   providerSyncState(DB-7)        → per-account sync cursor
//   providerWebhookDeliveries(DB-13) → individual webhook deliveries
//   syncQueue(DB-10)               → pending sync operations
//
// DB-18 AJOUTE:
//   platform_connectors        → named connector per provider (UberConnector, etc.)
//   connector_configurations   → versioned config, PUBLISHED = immuable
//   connector_health_checks    → per-connector health tracking
//   pipeline_runs              → end-to-end pipeline execution records
//   pipeline_stages            → per-stage results within a run
//   data_sync_checkpoints      → resumable sync state per driver+provider
//   sync_errors                → categorized error registry
//   connector_rate_limits      → rate limit tracking per connector
//
// RÈGLES ABSOLUES:
// 1. Secrets (API keys, tokens): JAMAIS en DB → KMS/env uniquement
// 2. connector_configurations: PUBLISHED = immuable · nouvelle version si changement
// 3. Pipeline runs: APPEND-ONLY audit trail
// 4. Rate limits: vérifiés côté app avant chaque appel provider
// 5. MOCK_ONLY: flag permanent jusqu'à approbation officielle partenaire
// 6. Taximeter: JAMAIS activé par événement sync provider
// 7. driver_id résolu via provider_account_id UNIQUEMENT (jamais nom/email)
// 8. Checkpoint: reprend là où arrêté · jamais retraite depuis zéro sans raison
// ================================================================

import {
  pgTable, pgEnum, uuid, text, boolean, integer,
  timestamp, jsonb, uniqueIndex, index, varchar,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users }                   from './auth.schema'
import { driverProfiles }          from './profiles.schema'
import { providers, driverProviderAccounts } from './providers.schema'

// ─── ENUMS ───────────────────────────────────────────────────

export const connectorTypeEnum = pgEnum('connector_type', [
  'UBER',
  'LYFT',
  'DOORDASH',
  'INSTACART',
  'UBER_EATS',
  'SKIP',
  'OTHER',
])

export const connectorStatusEnum = pgEnum('connector_status', [
  'MOCK_ONLY',     // Dev — aucun appel API réel
  'SANDBOX',       // Environnement sandbox provider
  'PILOT',         // Production limitée avec supervision
  'PRODUCTION',    // Production complète
  'DEPRECATED',    // En cours de retrait
  'DISABLED',      // Désactivé par admin
])

export const connectorAuthTypeEnum = pgEnum('connector_auth_type', [
  'OAUTH2_AUTHORIZATION_CODE',
  'OAUTH2_CLIENT_CREDENTIALS',
  'API_KEY',        // Clé dans env uniquement — jamais en DB
  'HMAC',           // Signature webhook uniquement
  'PARTNER_API',    // Programme partenaire spécial
  'NONE',           // Aucune auth (mock)
])

export const configStatusEnum = pgEnum('connector_config_status', [
  'DRAFT',
  'REVIEW',
  'APPROVED',
  'PUBLISHED',    // Immuable une fois publié
  'DEPRECATED',
])

export const pipelineRunStatusEnum = pgEnum('pipeline_run_status', [
  'QUEUED',
  'RUNNING',
  'COMPLETED',
  'PARTIAL',      // Certaines étapes réussies, d'autres échouées
  'FAILED',
  'CANCELLED',
  'RETRYING',
])

export const pipelineStageStatusEnum = pgEnum('pipeline_stage_status', [
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'SKIPPED',
  'RETRYING',
])

export const pipelineStageTypeEnum = pgEnum('pipeline_stage_type', [
  'FETCH',       // Pull données depuis provider
  'VALIDATE',    // Validation schéma + signature
  'NORMALIZE',   // Mappage vers format canonique
  'ENRICH',      // Ajout contexte interne (résolution driver)
  'PERSIST',     // Écriture en DB
  'NOTIFY',      // Envoi notifications
  'RECONCILE',   // Vérification croisée montants
  'FINALIZE',    // Fermeture période
])

export const syncCheckpointStatusEnum = pgEnum('sync_checkpoint_status', [
  'ACTIVE',       // Utilisé activement
  'PAUSED',       // Sync suspendu pour ce driver/provider
  'COMPLETED',    // Sync complet
  'ERROR',        // Erreur — nécessite attention
  'EXPIRED',      // Cursor expiré — resync complet nécessaire
])

export const syncErrorCategoryEnum = pgEnum('sync_error_category', [
  'AUTHENTICATION',
  'AUTHORIZATION',
  'RATE_LIMIT',
  'NETWORK',
  'SCHEMA_MISMATCH',
  'DATA_INCONSISTENCY',
  'DRIVER_UNRESOLVED',
  'DUPLICATE_EVENT',
  'QUOTA_EXCEEDED',
  'PROVIDER_ERROR',
  'INTERNAL_ERROR',
  'OTHER',
])

export const rateLimitScopeEnum = pgEnum('rate_limit_scope', [
  'PER_SECOND',
  'PER_MINUTE',
  'PER_HOUR',
  'PER_DAY',
  'PER_MONTH',
])

// ─── PLATFORM CONNECTORS ──────────────────────────────────────

export const platformConnectors = pgTable('platform_connectors', {
  id:       uuid('id').primaryKey().defaultRandom(),
  publicId: varchar('public_id', { length: 22 }).notNull().unique(),
  // Format: CON-XXXXXXXX

  providerId: uuid('provider_id').notNull()
    .references(() => providers.id, { onDelete: 'restrict' }),

  connectorType: connectorTypeEnum('connector_type').notNull(),
  name:          varchar('name', { length: 100 }).notNull(),
  // e.g. 'UberConnector', 'LyftConnector', 'DoorDashConnector'

  status:   connectorStatusEnum('connector_status').notNull().default('MOCK_ONLY'),
  authType: connectorAuthTypeEnum('auth_type').notNull().default('NONE'),

  // Référence URL — JAMAIS l'URL avec credentials intégrés
  apiBaseUrlReference: varchar('api_base_url_reference', { length: 200 }),

  // Capacités (informatives — accès réel nécessite approbation partenaire)
  supportsWebhook:     boolean('supports_webhook').notNull().default(false),
  supportsApiPull:     boolean('supports_api_pull').notNull().default(false),
  supportsOauth:       boolean('supports_oauth').notNull().default(false),
  supportsBatchExport: boolean('supports_batch_export').notNull().default(false),

  // Taximeter — TOUJOURS false pour tous les connecteurs externes
  taximeterEnabled: boolean('taximeter_enabled').notNull().default(false),

  isActive: boolean('is_active').notNull().default(true),

  // Référence approbation programme partenaire
  partnerApprovalReference: varchar('partner_approval_reference', { length: 200 }),
  // null = pas encore approuvé (MOCK_ONLY imposé)

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_platform_connector_provider_type').on(t.providerId, t.connectorType),
  index('idx_platform_connector_status').on(t.status),
  index('idx_platform_connector_type').on(t.connectorType),
])

// ─── CONNECTOR CONFIGURATIONS ─────────────────────────────────

export const connectorConfigurations = pgTable('connector_configurations', {
  id:          uuid('id').primaryKey().defaultRandom(),
  connectorId: uuid('connector_id').notNull()
    .references(() => platformConnectors.id, { onDelete: 'cascade' }),

  version: varchar('version', { length: 20 }).notNull(),
  // e.g. '1.0', '1.1', '2.0'
  status:  configStatusEnum('connector_config_status').notNull().default('DRAFT'),

  // Configuration — champs non-sensibles uniquement
  // Valeurs sensibles (clés API, secrets) → KMS/env, référencées par nom de variable seulement
  config: jsonb('config').notNull().default({}),
  // e.g. { "timeout_ms": 30000, "retry_count": 3, "batch_size": 100,
  //         "api_key_env_var": "UBER_API_KEY" }  ← NOM de la var uniquement, JAMAIS la valeur

  apiSchemaVersion: varchar('api_schema_version', { length: 20 }),

  publishedBy: uuid('published_by').references(() => users.id),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  // PUBLISHED → config immuable

  deprecatedAt: timestamp('deprecated_at', { withTimezone: true }),
  notes:        text('notes'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_connector_config_version').on(t.connectorId, t.version),
  index('idx_connector_config_connector').on(t.connectorId),
  index('idx_connector_config_status').on(t.status),
])

// ─── CONNECTOR HEALTH CHECKS ──────────────────────────────────

export const connectorHealthChecks = pgTable('connector_health_checks', {
  id:          uuid('id').primaryKey().defaultRandom(),
  connectorId: uuid('connector_id').notNull()
    .references(() => platformConnectors.id, { onDelete: 'cascade' }),

  status:         varchar('status', { length: 20 }).notNull(),
  // 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN'
  responseTimeMs: integer('response_time_ms'),
  httpStatusCode: integer('http_status_code'),

  checkType: varchar('check_type', { length: 40 }).notNull().default('PING'),
  // 'PING' | 'AUTH_CHECK' | 'SCHEMA_CHECK' | 'DATA_CHECK'

  errorCode:    varchar('error_code',    { length: 100 }),
  errorMessage: text('error_message'),

  checkedAt: timestamp('checked_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_connector_health_connector').on(t.connectorId),
  index('idx_connector_health_status').on(t.status),
  index('idx_connector_health_checked').on(t.checkedAt),
])

// ─── PIPELINE RUNS ────────────────────────────────────────────

export const pipelineRuns = pgTable('pipeline_runs', {
  id:       uuid('id').primaryKey().defaultRandom(),
  publicId: varchar('public_id', { length: 22 }).notNull().unique(),
  // Format: PLR-XXXXXXXX

  connectorId: uuid('connector_id').notNull()
    .references(() => platformConnectors.id, { onDelete: 'restrict' }),
  providerId:  uuid('provider_id').notNull()
    .references(() => providers.id, { onDelete: 'restrict' }),

  runType: varchar('run_type', { length: 30 }).notNull(),
  // 'FULL_SYNC' | 'INCREMENTAL' | 'BACKFILL' | 'RETRY' | 'WEBHOOK_BATCH'

  status: pipelineRunStatusEnum('pipeline_run_status').notNull().default('QUEUED'),

  driverId:          uuid('driver_id')
    .references(() => driverProfiles.id, { onDelete: 'set null' }),
  providerAccountId: uuid('provider_account_id')
    .references(() => driverProviderAccounts.id, { onDelete: 'set null' }),

  // Compteurs
  recordsProcessed: integer('records_processed').notNull().default(0),
  recordsSucceeded: integer('records_succeeded').notNull().default(0),
  recordsFailed:    integer('records_failed').notNull().default(0),
  recordsSkipped:   integer('records_skipped').notNull().default(0),

  startedAt:   timestamp('started_at',   { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  durationMs:  integer('duration_ms'),

  errorCode:    varchar('error_code',    { length: 100 }),
  errorSummary: text('error_summary'),

  // Idempotency — même run jamais re-déclenché
  runKey: varchar('run_key', { length: 100 }).unique(),

  triggeredBy: varchar('triggered_by', { length: 30 }).notNull().default('SCHEDULER'),
  // 'SCHEDULER' | 'WEBHOOK' | 'MANUAL' | 'RETRY'

  correlationId: uuid('correlation_id'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_pipeline_run_connector').on(t.connectorId),
  index('idx_pipeline_run_provider').on(t.providerId),
  index('idx_pipeline_run_status').on(t.status),
  index('idx_pipeline_run_driver').on(t.driverId),
  index('idx_pipeline_run_started').on(t.startedAt),
  index('idx_pipeline_run_correlation').on(t.correlationId),
])

// ─── PIPELINE STAGES ──────────────────────────────────────────

export const pipelineStages = pgTable('pipeline_stages', {
  id:           uuid('id').primaryKey().defaultRandom(),
  pipelineRunId: uuid('pipeline_run_id').notNull()
    .references(() => pipelineRuns.id, { onDelete: 'cascade' }),

  stageType:  pipelineStageTypeEnum('stage_type').notNull(),
  stageOrder: integer('stage_order').notNull(),

  status: pipelineStageStatusEnum('stage_status').notNull().default('PENDING'),

  recordsIn:       integer('records_in').notNull().default(0),
  recordsOut:      integer('records_out').notNull().default(0),
  recordsFailed:   integer('records_failed').notNull().default(0),
  recordsFiltered: integer('records_filtered').notNull().default(0),

  startedAt:   timestamp('started_at',   { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  durationMs:  integer('duration_ms'),

  errorCode:    varchar('error_code',    { length: 100 }),
  errorMessage: text('error_message'),

  // Métadonnées non-sensibles de l'étape
  metadata: jsonb('metadata').notNull().default({}),
  // JAMAIS: tokens, payloads bruts, PII chauffeur

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_pipeline_stage_run_order').on(t.pipelineRunId, t.stageOrder),
  index('idx_pipeline_stage_run').on(t.pipelineRunId),
  index('idx_pipeline_stage_type').on(t.stageType),
  index('idx_pipeline_stage_status').on(t.status),
])

// ─── DATA SYNC CHECKPOINTS ────────────────────────────────────

export const dataSyncCheckpoints = pgTable('data_sync_checkpoints', {
  id:                uuid('id').primaryKey().defaultRandom(),
  connectorId:       uuid('connector_id').notNull()
    .references(() => platformConnectors.id, { onDelete: 'cascade' }),
  providerAccountId: uuid('provider_account_id')
    .references(() => driverProviderAccounts.id, { onDelete: 'cascade' }),
  driverId:          uuid('driver_id')
    .references(() => driverProfiles.id, { onDelete: 'set null' }),

  status: syncCheckpointStatusEnum('sync_checkpoint_status').notNull().default('ACTIVE'),

  // Cursor reprend là où arrêté — opaque, vient du provider
  cursorValue:     text('cursor_value'),
  cursorType:      varchar('cursor_type', { length: 30 }).notNull().default('TIMESTAMP'),
  // 'TIMESTAMP' | 'EVENT_ID' | 'PAGE_TOKEN' | 'OFFSET'
  cursorExpiresAt: timestamp('cursor_expires_at', { withTimezone: true }),

  lastSyncedAt:          timestamp('last_synced_at',           { withTimezone: true }),
  lastSuccessfulSyncAt:  timestamp('last_successful_sync_at',  { withTimezone: true }),
  totalRecordsSynced:    integer('total_records_synced').notNull().default(0),
  consecutiveErrors:     integer('consecutive_errors').notNull().default(0),

  lastPipelineRunId: uuid('last_pipeline_run_id')
    .references(() => pipelineRuns.id, { onDelete: 'set null' }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_sync_checkpoint_connector_account').on(t.connectorId, t.providerAccountId),
  index('idx_sync_checkpoint_connector').on(t.connectorId),
  index('idx_sync_checkpoint_driver').on(t.driverId),
  index('idx_sync_checkpoint_status').on(t.status),
  index('idx_sync_checkpoint_last_sync').on(t.lastSyncedAt),
])

// ─── SYNC ERRORS ──────────────────────────────────────────────

export const syncErrors = pgTable('sync_errors', {
  id:            uuid('id').primaryKey().defaultRandom(),
  pipelineRunId: uuid('pipeline_run_id')
    .references(() => pipelineRuns.id, { onDelete: 'cascade' }),
  connectorId:   uuid('connector_id').notNull()
    .references(() => platformConnectors.id, { onDelete: 'restrict' }),

  category:  syncErrorCategoryEnum('error_category').notNull(),
  errorCode: varchar('error_code', { length: 100 }).notNull(),
  message:   text('message').notNull(),
  // Non-sensible — jamais tokens ni payloads complets

  externalEventId:    varchar('external_event_id',    { length: 200 }),
  externalActivityId: varchar('external_activity_id', { length: 200 }),
  driverId:           uuid('driver_id').references(() => driverProfiles.id, { onDelete: 'set null' }),

  attemptCount: integer('attempt_count').notNull().default(1),
  isRetryable:  boolean('is_retryable').notNull().default(true),
  resolvedAt:   timestamp('resolved_at', { withTimezone: true }),

  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_sync_error_pipeline').on(t.pipelineRunId),
  index('idx_sync_error_connector').on(t.connectorId),
  index('idx_sync_error_category').on(t.category),
  index('idx_sync_error_driver').on(t.driverId),
  index('idx_sync_error_occurred').on(t.occurredAt),
])

// ─── CONNECTOR RATE LIMITS ────────────────────────────────────

export const connectorRateLimits = pgTable('connector_rate_limits', {
  id:          uuid('id').primaryKey().defaultRandom(),
  connectorId: uuid('connector_id').notNull()
    .references(() => platformConnectors.id, { onDelete: 'cascade' }),

  scope:     rateLimitScopeEnum('rate_limit_scope').notNull(),
  limitType: varchar('limit_type', { length: 50 }).notNull(),
  // 'API_CALLS' | 'WEBHOOK_EVENTS' | 'BATCH_REQUESTS'

  maxRequests:   integer('max_requests').notNull(),
  windowSeconds: integer('window_seconds').notNull(),

  currentCount:  integer('current_count').notNull().default(0),
  windowStartAt: timestamp('window_start_at', { withTimezone: true }),
  windowResetAt: timestamp('window_reset_at', { withTimezone: true }),

  backoffSeconds: integer('backoff_seconds').notNull().default(60),

  isActive:  boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_rate_limit_connector_type_scope').on(t.connectorId, t.limitType, t.scope),
  index('idx_rate_limit_connector').on(t.connectorId),
  index('idx_rate_limit_reset').on(t.windowResetAt),
])

// ─── RELATIONS ────────────────────────────────────────────────

export const platformConnectorsRelations = relations(platformConnectors, ({ one, many }) => ({
  provider:       one(providers, { fields: [platformConnectors.providerId], references: [providers.id] }),
  configurations: many(connectorConfigurations),
  healthChecks:   many(connectorHealthChecks),
  pipelineRuns:   many(pipelineRuns),
  checkpoints:    many(dataSyncCheckpoints),
  rateLimits:     many(connectorRateLimits),
  errors:         many(syncErrors),
}))

export const connectorConfigurationsRelations = relations(connectorConfigurations, ({ one }) => ({
  connector:   one(platformConnectors, { fields: [connectorConfigurations.connectorId], references: [platformConnectors.id] }),
  publishedBy: one(users, { fields: [connectorConfigurations.publishedBy], references: [users.id] }),
}))

export const pipelineRunsRelations = relations(pipelineRuns, ({ one, many }) => ({
  connector:       one(platformConnectors,     { fields: [pipelineRuns.connectorId],        references: [platformConnectors.id] }),
  provider:        one(providers,              { fields: [pipelineRuns.providerId],          references: [providers.id] }),
  driver:          one(driverProfiles,         { fields: [pipelineRuns.driverId],            references: [driverProfiles.id] }),
  providerAccount: one(driverProviderAccounts, { fields: [pipelineRuns.providerAccountId],   references: [driverProviderAccounts.id] }),
  stages:          many(pipelineStages),
  errors:          many(syncErrors),
}))

export const pipelineStagesRelations = relations(pipelineStages, ({ one }) => ({
  pipelineRun: one(pipelineRuns, { fields: [pipelineStages.pipelineRunId], references: [pipelineRuns.id] }),
}))

export const dataSyncCheckpointsRelations = relations(dataSyncCheckpoints, ({ one }) => ({
  connector:       one(platformConnectors,     { fields: [dataSyncCheckpoints.connectorId],        references: [platformConnectors.id] }),
  providerAccount: one(driverProviderAccounts, { fields: [dataSyncCheckpoints.providerAccountId],  references: [driverProviderAccounts.id] }),
  driver:          one(driverProfiles,         { fields: [dataSyncCheckpoints.driverId],            references: [driverProfiles.id] }),
  lastPipelineRun: one(pipelineRuns,           { fields: [dataSyncCheckpoints.lastPipelineRunId],   references: [pipelineRuns.id] }),
}))

export const syncErrorsRelations = relations(syncErrors, ({ one }) => ({
  pipelineRun: one(pipelineRuns,       { fields: [syncErrors.pipelineRunId], references: [pipelineRuns.id] }),
  connector:   one(platformConnectors, { fields: [syncErrors.connectorId],   references: [platformConnectors.id] }),
  driver:      one(driverProfiles,     { fields: [syncErrors.driverId],       references: [driverProfiles.id] }),
}))
