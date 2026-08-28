// ================================================================
// TAXIMÈTRE.GOV — PROVIDERS & EXTERNAL ACCOUNTS SCHEMA
// Database Phase 6/20 — OAuth · API Connections · Idempotency
// ================================================================
//
// RÈGLES ABSOLUES:
// 1. Jamais stocker mot de passe Uber/Lyft/DoorDash/etc.
// 2. Tokens (access/refresh): chiffrés AES-256 · jamais loggés · jamais retournés à l'app
// 3. Client_id/client_secret: externalisés (env/KMS) · jamais dans PostgreSQL
// 4. OAuth state: hash(state) + expiration courte · CSRF/replay protection
// 5. external_account_id: encrypted + hash(pour recherche) + last4
// 6. provider_id + external_event_id UNIQUE → idempotency (doublon ignoré)
// 7. provider_id + external_account_id_hash UNIQUE → 1 compte = 1 driver
// 8. Disconnect ≠ delete history → DISCONNECTED + archived_at
// 9. Delivery/Rideshare provider → taximeter NEVER enabled
// 10. Provider INACTIVE → nouvelles connexions bloquées · historique conservé
// ================================================================

import {
  pgTable, pgEnum, uuid, text, boolean,
  timestamp, jsonb, uniqueIndex, index, varchar,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users }          from './auth.schema'
import { driverProfiles } from './profiles.schema'

// ─── ENUMS ───────────────────────────────────────────────────

export const providerTypeEnum = pgEnum('provider_type', [
  'RIDESHARE',        // Uber, Lyft
  'DELIVERY',         // DoorDash, UberEats, Instacart, Skip
  'FOOD_DELIVERY',    // Spécifique nourriture
  'GROCERY_DELIVERY', // Spécifique épicerie
  'MULTI_SERVICE',    // Uber (rideshare + delivery)
  'OTHER',
])

export const providerStatusEnum = pgEnum('provider_status', [
  'ACTIVE',       // Connexions autorisées
  'INACTIVE',     // Nouvelles connexions bloquées · historique préservé
  'DEPRECATED',   // Provider en fin de vie
  'MAINTENANCE',  // Temporairement indisponible
])

export const providerAccountStatusEnum = pgEnum('provider_account_status', [
  'PENDING',          // Connexion initiée, pas encore confirmée
  'ACTIVE',           // Connexion active et valide
  'REAUTH_REQUIRED',  // Token expiré → reconfiguration requise
  'EXPIRED',          // Connexion expirée
  'ERROR',            // Erreur technique
  'DISCONNECTED',     // Déconnecté par le chauffeur
  'SUSPENDED',        // Suspendu par action gouvernementale ou admin
])

export const connectionAttemptStatusEnum = pgEnum('connection_attempt_status', [
  'INITIATED',    // Attempt créé
  'PENDING',      // Redirect vers provider
  'COMPLETED',    // Callback reçu avec succès
  'FAILED',       // Échec
  'EXPIRED',      // Timeout
  'CANCELLED',    // Annulé par le chauffeur
])

export const providerEventStatusEnum = pgEnum('provider_event_status', [
  'RECEIVED',         // Reçu · signature non encore vérifiée
  'VERIFIED',         // Signature vérifiée
  'PROCESSING',       // En cours de traitement
  'PROCESSED',        // Traité avec succès
  'DUPLICATE',        // Doublon → ignoré (idempotency)
  'FAILED',           // Traitement échoué
  'DEAD_LETTER',      // Non traitable après retries
  'REJECTED',         // Signature invalide → rejeté
])

export const providerIntegrationTypeEnum = pgEnum('provider_integration_type', [
  'OAUTH',
  'REST_API',
  'WEBHOOK',
  'SFTP',
  'PARTNER_API',
  'OTHER',
])

export const accountClaimStatusEnum = pgEnum('account_claim_status', [
  'OPEN',
  'UNDER_REVIEW',
  'RESOLVED',
  'REJECTED',
  'CANCELLED',
])

export const providerVerificationMethodEnum = pgEnum('provider_verification_method', [
  'OAUTH',
  'PROVIDER_API',
  'MANUAL',
  'AUTOMATED',
  'OTHER',
])

// ─── PROVIDERS ────────────────────────────────────────────────

export const providers = pgTable('providers', {
  id:               uuid('id').primaryKey().defaultRandom(),
  publicProviderId: varchar('public_provider_id', { length: 20 }).notNull().unique(),
  // Format: PRV-XXXXXXXX

  code: varchar('code', { length: 30 }).notNull().unique(),
  // Stable internal code: 'UBER' | 'LYFT' | 'DOORDASH' | 'UBER_EATS' | 'INSTACART' | 'SKIP'

  name:         varchar('name', { length: 100 }).notNull(),
  providerType: providerTypeEnum('provider_type').notNull(),
  status:       providerStatusEnum('provider_status').notNull().default('ACTIVE'),

  country: varchar('country', { length: 2 }).notNull().default('CA'),
  // ISO country code

  // What this provider enables — never hardcoded API values
  // Real capabilities filled after official partner validation only
  supportsOauth:   boolean('supports_oauth').notNull().default(false),
  supportsWebhook: boolean('supports_webhook').notNull().default(false),
  supportsApiSync: boolean('supports_api_sync').notNull().default(false),

  // IMPORTANT: taximeter is never activated by provider connection
  // taximeter is ONLY for TAXI mode — never for rideshare/delivery
  taximeterEnabled: boolean('taximeter_enabled').notNull().default(false),
  // Always false for all external providers — enforced here

  // Development note — remove in production
  isDevelopmentSeed: boolean('is_development_seed').notNull().default(false),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_providers_code').on(t.code),
  index('idx_providers_status').on(t.status),
  index('idx_providers_type').on(t.providerType),
])

// ─── PROVIDER INTEGRATIONS ────────────────────────────────────
// Configuration metadata — NO secrets stored here

export const providerIntegrations = pgTable('provider_integrations', {
  id:         uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id').notNull()
    .references(() => providers.id, { onDelete: 'cascade' }),

  integrationType: providerIntegrationTypeEnum('integration_type').notNull(),
  apiVersion:      varchar('api_version', { length: 20 }),
  // e.g. 'v1', 'v2', '2024-01-01'

  // Reference only — never the actual URL with secrets embedded
  baseUrlReference: varchar('base_url_reference', { length: 200 }),
  // e.g. 'uber_api_base' — resolved from env, never stored with secrets

  // Scopes — informational, actual scopes configured in env
  requiredScopes: text('required_scopes').array(),
  // e.g. ['partner.accounts', 'partner.trips', 'partner.payments']
  // These are INFORMATIONAL ONLY — real approval required from provider

  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  // 'PENDING' | 'SANDBOX' | 'PILOT' | 'PRODUCTION'
  // All start at PENDING until official partner program approval

  notes: text('notes'),
  // e.g. 'Uber: requires official Uber partner program approval'

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_prov_integ_provider').on(t.providerId),
  index('idx_prov_integ_type').on(t.integrationType),
])

// ─── DRIVER PROVIDER ACCOUNTS ─────────────────────────────────

export const driverProviderAccounts = pgTable('driver_provider_accounts', {
  id:                    uuid('id').primaryKey().defaultRandom(),
  publicProviderAccountId: varchar('public_provider_account_id', { length: 25 }).notNull().unique(),
  // Format: DPA-XXXXXXXX

  driverId:   uuid('driver_id').notNull()
    .references(() => driverProfiles.id, { onDelete: 'cascade' }),
  providerId: uuid('provider_id').notNull()
    .references(() => providers.id, { onDelete: 'restrict' }),
  // RESTRICT: cannot delete provider if accounts exist

  status: providerAccountStatusEnum('provider_account_status').notNull().default('PENDING'),

  // External account identifier — encrypted + hash + last4
  externalAccountIdEncrypted:    text('external_account_id_encrypted'),
  externalAccountIdEncKeyVer:    varchar('external_account_id_enc_key_ver', { length: 20 }),
  externalAccountIdHash:         varchar('external_account_id_hash', { length: 64 }),
  // SHA-256(normalized_external_id) — used for uniqueness check + search
  externalAccountIdLast4:        varchar('external_account_id_last4', { length: 4 }),
  // Display: ••••XXXX

  // Display name from provider (e.g. provider's display for this account)
  displayName: varchar('display_name', { length: 100 }),
  // Non-sensitive display info only

  jurisdiction: varchar('jurisdiction', { length: 10 }).default('QC'),

  // Verification
  verifiedAt:          timestamp('verified_at',           { withTimezone: true }),
  verificationMethod:  providerVerificationMethodEnum('verification_method'),

  // Timeline
  connectedAt:    timestamp('connected_at',    { withTimezone: true }),
  lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }),
  disconnectedAt: timestamp('disconnected_at', { withTimezone: true }),
  lastSyncAt:     timestamp('last_sync_at',    { withTimezone: true }),

  // Disconnect preserves history — soft delete only
  archivedAt:    timestamp('archived_at',     { withTimezone: true }),
  disconnectReason: text('disconnect_reason'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  // KEY CONSTRAINT: same external account can only belong to one driver per provider
  uniqueIndex('idx_dpa_provider_account_unique').on(t.providerId, t.externalAccountIdHash),
  index('idx_dpa_driver').on(t.driverId),
  index('idx_dpa_provider').on(t.providerId),
  index('idx_dpa_status').on(t.status),
  index('idx_dpa_hash').on(t.externalAccountIdHash),
  index('idx_dpa_driver_provider').on(t.driverId, t.providerId),
])

// ─── PROVIDER ACCOUNT SCOPES ──────────────────────────────────

export const providerAccountScopes = pgTable('provider_account_scopes', {
  id:               uuid('id').primaryKey().defaultRandom(),
  providerAccountId: uuid('provider_account_id').notNull()
    .references(() => driverProviderAccounts.id, { onDelete: 'cascade' }),

  scope:     varchar('scope', { length: 100 }).notNull(),
  // e.g. 'partner.accounts', 'partner.trips', 'partner.payments'
  // Values informational — real scopes come from provider OAuth response

  grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
}, (t) => [
  uniqueIndex('idx_prov_scope_unique').on(t.providerAccountId, t.scope),
  index('idx_prov_scope_account').on(t.providerAccountId),
])

// ─── PROVIDER CREDENTIALS ─────────────────────────────────────
// Encrypted tokens — NEVER returned to frontend/mobile

export const providerCredentials = pgTable('provider_credentials', {
  id:               uuid('id').primaryKey().defaultRandom(),
  providerAccountId: uuid('provider_account_id').notNull().unique()
    .references(() => driverProviderAccounts.id, { onDelete: 'cascade' }),
  // 1:1 with provider account

  // Tokens — AES-256 encrypted, key from KMS/env
  // NEVER logged · NEVER returned to app · NEVER committed to Git
  accessTokenEncrypted:    text('access_token_encrypted'),
  accessTokenEncKeyVer:    varchar('access_token_enc_key_ver',    { length: 20 }),
  refreshTokenEncrypted:   text('refresh_token_encrypted'),
  refreshTokenEncKeyVer:   varchar('refresh_token_enc_key_ver',   { length: 20 }),

  tokenType: varchar('token_type', { length: 30 }),
  // e.g. 'Bearer'

  // Scope stored as text — informational only
  scopeGranted: text('scope_granted'),

  expiresAt: timestamp('expires_at', { withTimezone: true }),
  // When access token expires → trigger REAUTH_REQUIRED

  revokedAt:  timestamp('revoked_at',  { withTimezone: true }),
  createdAt:  timestamp('created_at',  { withTimezone: true }).notNull().defaultNow(),
  updatedAt:  timestamp('updated_at',  { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_prov_cred_account').on(t.providerAccountId),
  index('idx_prov_cred_expires').on(t.expiresAt),
])

// ─── CONNECTION ATTEMPTS ──────────────────────────────────────

export const providerConnectionAttempts = pgTable('provider_connection_attempts', {
  id:         uuid('id').primaryKey().defaultRandom(),
  driverId:   uuid('driver_id').notNull()
    .references(() => driverProfiles.id, { onDelete: 'cascade' }),
  providerId: uuid('provider_id').notNull()
    .references(() => providers.id, { onDelete: 'cascade' }),

  // OAuth state — stored as SHA-256 hash only (never plaintext)
  // Actual state value sent to provider, never stored raw
  stateHash: varchar('state_hash', { length: 64 }),
  // Short-lived (< 15 min) — for CSRF + replay protection

  status: connectionAttemptStatusEnum('connection_attempt_status').notNull().default('INITIATED'),

  startedAt:    timestamp('started_at',    { withTimezone: true }).notNull().defaultNow(),
  completedAt:  timestamp('completed_at',  { withTimezone: true }),
  expiresAt:    timestamp('expires_at',    { withTimezone: true }).notNull(),
  // Attempt expires after short window (configurable, e.g. 15 min)

  failureCode: varchar('failure_code', { length: 50 }),
  // 'TIMEOUT' | 'USER_CANCELLED' | 'PROVIDER_ERROR' | 'INVALID_STATE' | etc.

  // Correlation ID for tracing this attempt end-to-end
  correlationId: uuid('correlation_id').notNull().defaultRandom(),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_conn_attempt_driver').on(t.driverId),
  index('idx_conn_attempt_provider').on(t.providerId),
  index('idx_conn_attempt_state').on(t.stateHash),
  index('idx_conn_attempt_expires').on(t.expiresAt),
  index('idx_conn_attempt_status').on(t.status),
])

// ─── PROVIDER EVENTS ──────────────────────────────────────────
// Incoming webhooks and API events from providers

export const providerEvents = pgTable('provider_events', {
  id:               uuid('id').primaryKey().defaultRandom(),
  providerId:       uuid('provider_id').notNull()
    .references(() => providers.id, { onDelete: 'restrict' }),
  providerAccountId: uuid('provider_account_id')
    .references(() => driverProviderAccounts.id, { onDelete: 'set null' }),

  // IDEMPOTENCY KEY: provider_id + external_event_id UNIQUE
  externalEventId: varchar('external_event_id', { length: 200 }).notNull(),
  // The event ID from the provider — e.g. Uber's trip ID or payment ID

  eventType: varchar('event_type', { length: 100 }).notNull(),
  // e.g. 'trip.completed', 'payment.processed', 'delivery.completed'

  eventTimestamp: timestamp('event_timestamp', { withTimezone: true }).notNull(),
  // Timestamp from the provider — used for ordering

  receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),

  // Payload integrity — hash of raw payload (never store sensitive payload raw)
  payloadHash: varchar('payload_hash', { length: 64 }),
  // SHA-256 of the raw webhook body — for integrity verification

  // Signature validation result
  signatureVerified: boolean('signature_verified').notNull().default(false),
  signatureMethod:   varchar('signature_method', { length: 50 }),
  // e.g. 'HMAC_SHA256'

  processingStatus: providerEventStatusEnum('processing_status').notNull().default('RECEIVED'),
  processedAt:      timestamp('processed_at',   { withTimezone: true }),
  failureCode:      varchar('failure_code',      { length: 100 }),
  retryCount:       varchar('retry_count',       { length: 5 }).notNull().default('0'),

  // Correlation for end-to-end tracing
  correlationId: uuid('correlation_id'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  // CRITICAL: idempotency — same event never processed twice
  uniqueIndex('idx_prov_event_idempotency').on(t.providerId, t.externalEventId),
  index('idx_prov_event_provider').on(t.providerId),
  index('idx_prov_event_account').on(t.providerAccountId),
  index('idx_prov_event_status').on(t.processingStatus),
  index('idx_prov_event_timestamp').on(t.eventTimestamp),
  index('idx_prov_event_received').on(t.receivedAt),
])

// ─── ACCOUNT CLAIM DISPUTES ───────────────────────────────────

export const providerAccountClaims = pgTable('provider_account_claims', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Driver claiming the account
  claimantDriverId: uuid('claimant_driver_id').notNull()
    .references(() => driverProfiles.id, { onDelete: 'cascade' }),

  // The account being claimed
  providerAccountId: uuid('provider_account_id').notNull()
    .references(() => driverProviderAccounts.id, { onDelete: 'cascade' }),

  status: accountClaimStatusEnum('account_claim_status').notNull().default('OPEN'),

  reason:     text('reason').notNull(),
  reviewNotes: text('review_notes'),
  // Internal — never exposed to claimant

  resolvedBy: uuid('resolved_by').references(() => users.id),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_claim_claimant').on(t.claimantDriverId),
  index('idx_claim_account').on(t.providerAccountId),
  index('idx_claim_status').on(t.status),
])

// ─── RELATIONS ────────────────────────────────────────────────

export const providersRelations = relations(providers, ({ many }) => ({
  integrations:    many(providerIntegrations),
  driverAccounts:  many(driverProviderAccounts),
  events:          many(providerEvents),
}))

export const driverProviderAccountsRelations = relations(driverProviderAccounts, ({ one, many }) => ({
  driver:      one(driverProfiles, { fields: [driverProviderAccounts.driverId],   references: [driverProfiles.id] }),
  provider:    one(providers,      { fields: [driverProviderAccounts.providerId], references: [providers.id] }),
  credentials: one(providerCredentials, { fields: [driverProviderAccounts.id],   references: [providerCredentials.providerAccountId] }),
  scopes:      many(providerAccountScopes),
  events:      many(providerEvents),
  claims:      many(providerAccountClaims),
}))

export const providerEventsRelations = relations(providerEvents, ({ one }) => ({
  provider:        one(providers,              { fields: [providerEvents.providerId],        references: [providers.id] }),
  providerAccount: one(driverProviderAccounts, { fields: [providerEvents.providerAccountId], references: [driverProviderAccounts.id] }),
}))

export const providerConnectionAttemptsRelations = relations(providerConnectionAttempts, ({ one }) => ({
  driver:   one(driverProfiles, { fields: [providerConnectionAttempts.driverId],   references: [driverProfiles.id] }),
  provider: one(providers,      { fields: [providerConnectionAttempts.providerId], references: [providers.id] }),
}))
