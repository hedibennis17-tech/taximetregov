// ================================================================
// TAXIMÈTRE.GOV — IDENTITY & AUTH SCHEMA
// Database Phase 1/20 — PostgreSQL via Drizzle ORM
// ================================================================
//
// RÈGLES ABSOLUES:
// 1. Jamais password en clair — Argon2id uniquement
// 2. UUID (v4) pour toutes les PK — jamais NAS/email/phone comme PK
// 3. Jamais token/password dans les logs ou colonnes audit
// 4. RBAC + resource-level authorization (pas RBAC seul)
// 5. Gouvernement: MFA obligatoire
// 6. Sessions révocables individuellement ou en masse
// 7. Un seul système d'identité pour Driver App + Government App
// ================================================================

import {
  pgTable, pgEnum, uuid, text, boolean,
  timestamp, integer, jsonb, uniqueIndex, index,
  varchar, primaryKey,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─── ENUMS ───────────────────────────────────────────────────

export const userStatusEnum = pgEnum('user_status', [
  'PENDING',     // Registered but not verified
  'ACTIVE',      // Fully active
  'SUSPENDED',   // Temporarily suspended
  'LOCKED',      // Locked after failed attempts
  'DISABLED',    // Permanently disabled
])

export const userTypeEnum = pgEnum('user_type', [
  'DRIVER',
  'GOVERNMENT',
  'SYSTEM',      // Internal service accounts
])

export const sessionStatusEnum = pgEnum('session_status', [
  'ACTIVE',
  'EXPIRED',
  'REVOKED',
])

export const mfaTypeEnum = pgEnum('mfa_type', [
  'TOTP',          // Google Authenticator / Authy
  'WEBAUTHN',      // Passkey / Security key
  'RECOVERY_CODE', // Backup codes
  'SMS',           // Fallback (lower security)
  'EMAIL',         // Fallback (lower security)
])

export const securityEventTypeEnum = pgEnum('security_event_type', [
  'LOGIN_SUCCESS',
  'LOGIN_FAILURE',
  'LOGIN_MFA_REQUIRED',
  'LOGIN_MFA_SUCCESS',
  'LOGIN_MFA_FAILURE',
  'ACCOUNT_LOCKED',
  'ACCOUNT_UNLOCKED',
  'PASSWORD_CHANGED',
  'PASSWORD_RESET_REQUESTED',
  'MFA_ENABLED',
  'MFA_DISABLED',
  'SESSION_CREATED',
  'SESSION_REVOKED',
  'SESSION_EXPIRED',
  'SESSION_ALL_REVOKED',
  'TOKEN_ROTATED',
  'TOKEN_REVOKED',
  'NEW_DEVICE_DETECTED',
  'DEVICE_REVOKED',
  'SUSPICIOUS_ACCESS',
  'PERMISSION_DENIED',
])

export const deviceStatusEnum = pgEnum('device_status', [
  'TRUSTED',
  'PENDING',   // New — awaiting verification
  'BLOCKED',
  'REVOKED',
])

// ─── USERS ───────────────────────────────────────────────────

export const users = pgTable('users', {
  // Internal PK — UUID, never exposed in URLs
  id: uuid('id').primaryKey().defaultRandom(),

  // Public-facing identifier — safe to use in UI/URLs
  publicId: varchar('public_id', { length: 20 }).notNull().unique(),
  // Format: DRV-XXXX-XXXX for drivers, GOV-XXXX-XXXX for gov

  userType: userTypeEnum('user_type').notNull(),
  status:   userStatusEnum('status').notNull().default('PENDING'),

  // Contact — both UNIQUE but never used as PK
  email: text('email').notNull().unique(),
  // Normalized to lowercase in application layer before storage
  // citext = case-insensitive text (PostgreSQL extension)
  phone: varchar('phone', { length: 20 }).unique(),

  // Auth
  // password_hash = Argon2id hash — NEVER plaintext
  // null = OAuth / passkey only account
  passwordHash: text('password_hash'),

  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  phoneVerifiedAt: timestamp('phone_verified_at', { withTimezone: true }),
  lastLoginAt:     timestamp('last_login_at',     { withTimezone: true }),

  // Government accounts MUST have MFA
  mfaRequired: boolean('mfa_required').notNull().default(false),
  mfaEnabledAt: timestamp('mfa_enabled_at', { withTimezone: true }),

  // Brute-force protection
  failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),

  // Audit
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  // Soft delete — never hard delete identity records
}, (t) => [
  index('idx_users_email').on(t.email),
  index('idx_users_public_id').on(t.publicId),
  index('idx_users_status').on(t.status),
  index('idx_users_type').on(t.userType),
])

// ─── ROLES ───────────────────────────────────────────────────

export const roles = pgTable('roles', {
  id:          uuid('id').primaryKey().defaultRandom(),
  name:        varchar('name', { length: 50 }).notNull().unique(),
  // SUPER_ADMIN | GOV_ADMIN | TAX_ADMIN | FINANCE_REVIEWER |
  // AUDITOR | SUPPORT | READ_ONLY | DRIVER

  label:       varchar('label', { length: 100 }).notNull(),
  description: text('description'),
  requiresMfa: boolean('requires_mfa').notNull().default(false),
  isSystem:    boolean('is_system').notNull().default(true),
  // System roles cannot be deleted

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── PERMISSIONS ─────────────────────────────────────────────

export const permissions = pgTable('permissions', {
  id:          uuid('id').primaryKey().defaultRandom(),
  key:         varchar('key', { length: 100 }).notNull().unique(),
  // e.g. "drivers.read", "tax.finalize", "revenue.export"

  label:       varchar('label', { length: 100 }).notNull(),
  description: text('description'),
  module:      varchar('module', { length: 50 }).notNull(),
  // e.g. "DRIVERS", "TAX", "REVENUE", "AUDIT", "SECURITY"

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_permissions_module').on(t.module),
  index('idx_permissions_key').on(t.key),
])

// ─── ROLE_PERMISSIONS (N:N) ───────────────────────────────────

export const rolePermissions = pgTable('role_permissions', {
  roleId:       uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  grantedAt:    timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
  grantedBy:    uuid('granted_by').references(() => users.id),
}, (t) => [
  primaryKey({ columns: [t.roleId, t.permissionId] }),
])

// ─── USER_ROLES (N:N) ─────────────────────────────────────────

export const userRoles = pgTable('user_roles', {
  id:         uuid('id').primaryKey().defaultRandom(),
  userId:     uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId:     uuid('role_id').notNull().references(() => roles.id, { onDelete: 'restrict' }),
  // A user can have multiple roles (e.g. GOV_ADMIN + TAX_ADMIN)

  assignedBy: uuid('assigned_by').references(() => users.id),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt:  timestamp('expires_at',  { withTimezone: true }),
  // null = no expiry; set for temporary elevated access

  revokedAt:  timestamp('revoked_at',  { withTimezone: true }),
  revokedBy:  uuid('revoked_by').references(() => users.id),
}, (t) => [
  uniqueIndex('idx_user_roles_unique').on(t.userId, t.roleId),
  index('idx_user_roles_user').on(t.userId),
  index('idx_user_roles_role').on(t.roleId),
  index('idx_user_roles_expires').on(t.expiresAt),
])

// ─── DEVICES ─────────────────────────────────────────────────

export const devices = pgTable('devices', {
  id:     uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Hashed device fingerprint — never raw device identifier
  deviceFingerprintHash: varchar('device_fingerprint_hash', { length: 64 }).notNull(),

  platform:   varchar('platform', { length: 20 }).notNull(),
  // 'iOS' | 'Android' | 'Web'

  appVersion: varchar('app_version', { length: 20 }),
  name:       varchar('name', { length: 100 }),
  // User-visible label: "iPhone 15 Pro — Mohamed"

  status:    deviceStatusEnum('status').notNull().default('PENDING'),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),

  // Geo context — hashed/anonymized
  lastIpHash: varchar('last_ip_hash', { length: 64 }),

  trustedAt:  timestamp('trusted_at',  { withTimezone: true }),
  revokedAt:  timestamp('revoked_at',  { withTimezone: true }),
  revokedBy:  uuid('revoked_by').references(() => users.id),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_devices_fingerprint_user').on(t.userId, t.deviceFingerprintHash),
  index('idx_devices_user').on(t.userId),
  index('idx_devices_status').on(t.status),
])

// ─── SESSIONS ────────────────────────────────────────────────

export const sessions = pgTable('sessions', {
  id:     uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  deviceId: uuid('device_id').references(() => devices.id, { onDelete: 'set null' }),

  // IP metadata — hashed, never raw
  ipHash:    varchar('ip_hash', { length: 64 }),
  userAgent: text('user_agent'),
  // User agent stored for anomaly detection, not for tracking

  status:         sessionStatusEnum('status').notNull().default('ACTIVE'),
  mfaCompleted:   boolean('mfa_completed').notNull().default(false),
  // Government sessions must have mfa_completed = true

  createdAt:      timestamp('created_at',      { withTimezone: true }).notNull().defaultNow(),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt:      timestamp('expires_at',       { withTimezone: true }).notNull(),
  revokedAt:      timestamp('revoked_at',       { withTimezone: true }),
  revokedReason:  varchar('revoked_reason', { length: 100 }),
  // 'LOGOUT' | 'DEVICE_REVOKED' | 'ACCOUNT_SUSPENDED' | 'SECURITY_INCIDENT' | 'EXPIRED'
}, (t) => [
  index('idx_sessions_user').on(t.userId),
  index('idx_sessions_status').on(t.status),
  index('idx_sessions_expires').on(t.expiresAt),
  index('idx_sessions_device').on(t.deviceId),
])

// ─── REFRESH TOKENS ──────────────────────────────────────────

export const refreshTokens = pgTable('refresh_tokens', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionId: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),

  // SHA-256 hash of the token — never the raw token
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),

  // Token rotation: each use creates a new token and revokes the old
  replacedByTokenId: uuid('replaced_by_token_id'),

  expiresAt:  timestamp('expires_at',  { withTimezone: true }).notNull(),
  revokedAt:  timestamp('revoked_at',  { withTimezone: true }),
  createdAt:  timestamp('created_at',  { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_refresh_tokens_user').on(t.userId),
  index('idx_refresh_tokens_session').on(t.sessionId),
  index('idx_refresh_tokens_hash').on(t.tokenHash),
  index('idx_refresh_tokens_expires').on(t.expiresAt),
])

// ─── MFA CREDENTIALS ─────────────────────────────────────────

export const mfaCredentials = pgTable('mfa_credentials', {
  id:     uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  mfaType: mfaTypeEnum('mfa_type').notNull(),
  isPrimary: boolean('is_primary').notNull().default(false),

  // The secret/credential — encrypted at application level before storage
  // Never stored in plaintext
  encryptedSecret: text('encrypted_secret'),
  // For WebAuthn: public key credential data
  credentialData:  jsonb('credential_data'),

  // Recovery codes stored as bcrypt hashes, comma-delimited or array
  // Never raw codes stored
  recoveryCodeHashes: text('recovery_code_hashes').array(),

  label:      varchar('label', { length: 100 }),
  // e.g. "Mon iPhone", "YubiKey bureau"

  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  enabledAt:  timestamp('enabled_at',   { withTimezone: true }).notNull().defaultNow(),
  revokedAt:  timestamp('revoked_at',   { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_mfa_user').on(t.userId),
  index('idx_mfa_type').on(t.mfaType),
])

// ─── LOGIN ATTEMPTS ───────────────────────────────────────────

export const loginAttempts = pgTable('login_attempts', {
  id:        uuid('id').primaryKey().defaultRandom(),
  // Identifier attempted — hashed email, never raw email in failed log
  identifierHash: varchar('identifier_hash', { length: 64 }).notNull(),
  ipHash:    varchar('ip_hash', { length: 64 }),
  userAgent: text('user_agent'),

  success:   boolean('success').notNull(),
  failReason: varchar('fail_reason', { length: 100 }),
  // 'INVALID_CREDENTIALS' | 'ACCOUNT_LOCKED' | 'MFA_FAILED' | 'RATE_LIMITED'
  // NEVER: 'email not found' or 'wrong password' — always same generic message to client

  attemptedAt: timestamp('attempted_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_login_attempts_identifier').on(t.identifierHash),
  index('idx_login_attempts_ip').on(t.ipHash),
  index('idx_login_attempts_at').on(t.attemptedAt),
  // Used for rate limiting: count attempts per identifier + IP in sliding window
])

// ─── SECURITY EVENTS ──────────────────────────────────────────

export const securityEvents = pgTable('security_events', {
  id:     uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  // Nullable: some events (e.g. failed login for non-existent account) have no user

  eventType: securityEventTypeEnum('event_type').notNull(),
  severity:  varchar('severity', { length: 20 }).notNull().default('INFO'),
  // 'INFO' | 'WARNING' | 'CRITICAL'

  sessionId:  uuid('session_id').references(() => sessions.id, { onDelete: 'set null' }),
  deviceId:   uuid('device_id').references(() => devices.id,  { onDelete: 'set null' }),
  ipHash:     varchar('ip_hash', { length: 64 }),

  // Structured metadata — never includes password, token, NAS, or full identifiers
  metadata:   jsonb('metadata').notNull().default({}),

  correlationId: uuid('correlation_id'),
  // Trace an event chain end-to-end

  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_sec_events_user').on(t.userId),
  index('idx_sec_events_type').on(t.eventType),
  index('idx_sec_events_occurred').on(t.occurredAt),
  index('idx_sec_events_correlation').on(t.correlationId),
  index('idx_sec_events_severity').on(t.severity),
])

// ─── RELATIONS ────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  userRoles:      many(userRoles),
  sessions:       many(sessions),
  refreshTokens:  many(refreshTokens),
  devices:        many(devices),
  mfaCredentials: many(mfaCredentials),
  securityEvents: many(securityEvents),
}))

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles:       many(userRoles),
  rolePermissions: many(rolePermissions),
}))

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}))

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
}))

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role:       one(roles,       { fields: [rolePermissions.roleId],       references: [roles.id] }),
  permission: one(permissions, { fields: [rolePermissions.permissionId], references: [permissions.id] }),
}))

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  user:          one(users,   { fields: [sessions.userId],   references: [users.id] }),
  device:        one(devices, { fields: [sessions.deviceId], references: [devices.id] }),
  refreshTokens: many(refreshTokens),
}))

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user:    one(users,    { fields: [refreshTokens.userId],    references: [users.id] }),
  session: one(sessions, { fields: [refreshTokens.sessionId], references: [sessions.id] }),
}))

export const mfaCredentialsRelations = relations(mfaCredentials, ({ one }) => ({
  user: one(users, { fields: [mfaCredentials.userId], references: [users.id] }),
}))
