// ============================================================
// TAXIMÈTRE.GOV — SECURITY ENGINE
// Phase 2 — Step 28: Identity · Auth · RBAC · API Gateway · Audit
// ============================================================
//
// RÈGLES ABSOLUES:
// 1. NAS/SIN: jamais clé primaire · jamais exposé · chiffrement field-level
// 2. OAuth only: jamais collecter mot de passe Uber/Lyft/etc.
// 3. Tokens: jamais loggés · rotation automatique · révocables
// 4. Driver A → Driver B: toujours 403 FORBIDDEN
// 5. Secrets: externalisés · jamais dans le code · rotation obligatoire
// 6. Production: no debug · no mock payment · no fake gov submission
// 7. App → DB: toujours via API → Authorization → Service → DB
// 8. Actions critiques: MFA + reason + audit (suspend/finalize/export)
// 9. DELIVERY: taximeterEnabled = toujours false (non contournable par RBAC)
// ============================================================

// ─── USER IDENTITY ───────────────────────────────────────────

export type UserType = 'DRIVER' | 'GOVERNMENT_USER' | 'AUDITOR' | 'SUPPORT' | 'SYSTEM'
export type AccountStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'DEACTIVATED'
export type DeviceStatus = 'TRUSTED' | 'PENDING' | 'BLOCKED' | 'REVOKED'
export type SessionStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED'
export type DataClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'HIGHLY_SENSITIVE'

export interface UserIdentity {
  id: string                    // Internal — never exposed in URLs
  publicId: string              // Safe to use in app (e.g. DRV-XXXX-XXXX)
  userType: UserType
  status: AccountStatus
  mfaRequired: boolean
  createdAt: string
  updatedAt: string
}

export interface DriverAccount {
  id: string
  userId: string
  driverNumber: string          // DR-00001234
  status: AccountStatus
  verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED' | 'MANUAL_REVIEW'
  createdAt: string
  updatedAt: string
}

export interface GovernmentAccount {
  id: string
  userId: string
  department: string
  employeeReference: string     // Masked
  status: AccountStatus
  mfaRequired: true             // Always required for government accounts
  createdAt: string
}

// ─── MFA ─────────────────────────────────────────────────────

export type MFAType = 'TOTP' | 'SECURITY_KEY' | 'PASSKEY' | 'SMS' | 'EMAIL'

export interface MFAConfiguration {
  userId: string
  enabled: boolean
  primaryMethod: MFAType
  backupMethods: MFAType[]
  lastUsedAt: string | null
  // Government accounts: MFA always required
  // Driver: configurable or required based on risk level
}

// ─── SESSION ─────────────────────────────────────────────────

export interface UserSession {
  id: string
  userId: string
  deviceId: string
  createdAt: string
  lastActivity: string
  expiresAt: string
  revokedAt: string | null
  ipMetadata: string | null     // Hashed — never raw IP in logs
  status: SessionStatus
  // Revoked on: logout, device revoked, account suspended, security incident
}

// ─── DEVICE ──────────────────────────────────────────────────

export interface Device {
  id: string
  userId: string
  deviceIdentifier: string     // Hashed device fingerprint
  platform: 'iOS' | 'Android' | 'Web'
  appVersion: string
  name: string                 // User-visible label
  lastSeen: string
  status: DeviceStatus
  createdAt: string
}

// ─── RBAC ────────────────────────────────────────────────────

export type RoleName =
  | 'SUPER_ADMIN' | 'GOV_ADMIN' | 'TAX_ADMIN' | 'AUDITOR'
  | 'FINANCE_REVIEWER' | 'SUPPORT' | 'READ_ONLY' | 'DRIVER'

export type PermissionKey =
  | 'drivers.read'    | 'drivers.update'   | 'drivers.suspend'
  | 'vehicles.read'   | 'vehicles.approve'
  | 'transactions.read' | 'transactions.review'
  | 'revenue.read'    | 'revenue.export'
  | 'tax.read'        | 'tax.review'       | 'tax.finalize'
  | 'documents.read'  | 'documents.verify'
  | 'audit.read'      | 'audit.export'
  | 'users.manage'    | 'settings.manage'
  | 'security.view'   | 'security.manage'
  | 'webhooks.view'   | 'webhooks.manage'

export interface Role {
  name: RoleName
  label: string
  permissions: PermissionKey[]
  requiresMFA: boolean
  description: string
}

export interface UserRole {
  userId: string
  role: RoleName
  assignedBy: string
  assignedAt: string
  expiresAt: string | null
}

// ─── ROLE DEFINITIONS ────────────────────────────────────────

export const ROLES: Record<RoleName, Role> = {
  SUPER_ADMIN: {
    name:'SUPER_ADMIN', label:'Super Admin', requiresMFA:true,
    description:'Accès total — toutes les permissions',
    permissions:['drivers.read','drivers.update','drivers.suspend','vehicles.read','vehicles.approve','transactions.read','transactions.review','revenue.read','revenue.export','tax.read','tax.review','tax.finalize','documents.read','documents.verify','audit.read','audit.export','users.manage','settings.manage','security.view','security.manage','webhooks.view','webhooks.manage'],
  },
  GOV_ADMIN: {
    name:'GOV_ADMIN', label:'Administrateur Gouvernemental', requiresMFA:true,
    description:'Administration gouvernementale — gestion chauffeurs et véhicules',
    permissions:['drivers.read','drivers.update','drivers.suspend','vehicles.read','vehicles.approve','transactions.read','revenue.read','tax.read','tax.review','documents.read','documents.verify','audit.read','security.view','webhooks.view'],
  },
  TAX_ADMIN: {
    name:'TAX_ADMIN', label:'Administrateur Fiscal', requiresMFA:true,
    description:'Gestion fiscale — calculs · rapports · finalisation',
    permissions:['drivers.read','transactions.read','revenue.read','revenue.export','tax.read','tax.review','tax.finalize','documents.read','audit.read','security.view'],
  },
  AUDITOR: {
    name:'AUDITOR', label:'Auditeur', requiresMFA:true,
    description:'Lecture seule + audit — pas de modification',
    permissions:['drivers.read','transactions.read','revenue.read','tax.read','documents.read','audit.read','audit.export','security.view'],
  },
  FINANCE_REVIEWER: {
    name:'FINANCE_REVIEWER', label:'Réviseur Financier', requiresMFA:true,
    description:'Révision financière — transactions et revenus',
    permissions:['transactions.read','transactions.review','revenue.read','revenue.export','tax.read','audit.read'],
  },
  SUPPORT: {
    name:'SUPPORT', label:'Support', requiresMFA:false,
    description:'Support client — lecture limitée · pas de données fiscales',
    permissions:['drivers.read','vehicles.read','documents.read'],
  },
  READ_ONLY: {
    name:'READ_ONLY', label:'Lecture seule', requiresMFA:false,
    description:'Accès en lecture uniquement',
    permissions:['drivers.read','revenue.read','audit.read'],
  },
  DRIVER: {
    name:'DRIVER', label:'Chauffeur', requiresMFA:false,
    description:'Accès chauffeur — données propres uniquement',
    permissions:['drivers.read'],
  },
}

export function hasPermission(role: RoleName, permission: PermissionKey): boolean {
  return ROLES[role]?.permissions.includes(permission) ?? false
}

// Resource-level authorization: Driver A cannot access Driver B
export function canAccessDriverData(requestorId: string, targetDriverId: string, role: RoleName): boolean {
  if (role === 'DRIVER') return requestorId === targetDriverId  // Own data only
  return hasPermission(role, 'drivers.read')
}

// ─── SENSITIVE IDENTIFIER ────────────────────────────────────

export interface SensitiveGovernmentIdentifier {
  id: string
  userId: string
  identifierType: 'SIN_NAS' | 'BUSINESS_NUMBER' | 'TAX_ACCOUNT' | 'OTHER'
  // Field-level encrypted — never returned in API responses
  encryptedValue: 'ENCRYPTED'    // Literal — never the actual value
  maskedDisplay: string          // Always: ***-***-XXX
  keyVersion: string             // For key rotation tracking
  lastAccessedAt: string | null
  accessLog: string[]            // Audit trail of who accessed
}

// ─── API GATEWAY CONCEPTS ────────────────────────────────────

export type ProviderHealth = 'CONNECTED' | 'AVAILABLE' | 'DEGRADED' | 'ERROR' | 'NOT_CONFIGURED'
export type Environment = 'LOCAL' | 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION'

export interface APIEndpoint {
  path: string
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  requiredPermission: PermissionKey | null
  rateLimit: 'STRICT' | 'NORMAL' | 'LOOSE'
  requiresMFA: boolean
  version: 'v1'
  requiresResourceOwnership: boolean
}

export interface ProviderConnectionHealth {
  provider: string
  status: ProviderHealth
  lastChecked: string
  webhooksReceived: number
  webhooksFailed: number
  webhooksDuplicate: number
  lastError: string | null
  note: string
}

// ─── SECURITY AUDIT LOG ───────────────────────────────────────

export type SecurityAction =
  | 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILURE' | 'ACCOUNT_LOCK'
  | 'NEW_DEVICE' | 'DEVICE_REVOKED' | 'TOKEN_REVOKED'
  | 'PERMISSION_DENIED' | 'PERMISSION_CHANGE'
  | 'DRIVER_SUSPENDED' | 'DRIVER_REACTIVATED'
  | 'TAX_FINALIZED' | 'EXPORT_CREATED'
  | 'PROVIDER_CONNECTED' | 'PROVIDER_DISCONNECTED'
  | 'WEBHOOK_FAILURE' | 'WEBHOOK_REJECTED'
  | 'SUSPICIOUS_ACCESS' | 'MFA_ENABLED' | 'MFA_DISABLED'
  | 'EMERGENCY_REVOCATION'

export interface SecurityAuditLog {
  id: string
  actorId: string
  actorRole: RoleName
  action: SecurityAction
  resourceType: string
  resourceId: string | null
  timestamp: string
  result: 'SUCCESS' | 'FAILURE' | 'BLOCKED'
  metadata: Record<string, string | boolean | null>
  // Never log: password, OTP, access_token, refresh_token, full SIN/NAS
}

export interface SecurityEvent {
  eventId: string
  type: SecurityAction
  userId: string | null
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  description: string
  timestamp: string
  resolved: boolean
}

// ─── RATE LIMIT CONFIG ────────────────────────────────────────

export interface RateLimitConfig {
  endpoint: string
  windowSeconds: number
  maxRequests: number
  blockDurationSeconds: number
  note: string   // All values configurable — never hardcoded in UI
}

export const RATE_LIMIT_CONCEPTS: RateLimitConfig[] = [
  { endpoint:'LOGIN', windowSeconds:300, maxRequests:5, blockDurationSeconds:900, note:'Anti-brute-force · lockout après 5 tentatives' },
  { endpoint:'OTP', windowSeconds:60, maxRequests:3, blockDurationSeconds:300, note:'Anti-abus OTP' },
  { endpoint:'PASSWORD_RESET', windowSeconds:3600, maxRequests:3, blockDurationSeconds:3600, note:'Reset limité' },
  { endpoint:'API_READ', windowSeconds:60, maxRequests:200, blockDurationSeconds:60, note:'Normal API read' },
  { endpoint:'API_WRITE', windowSeconds:60, maxRequests:60, blockDurationSeconds:60, note:'Normal API write' },
  { endpoint:'WEBHOOK', windowSeconds:60, maxRequests:1000, blockDurationSeconds:30, note:'Provider-specific · configurable' },
  { endpoint:'EXPORT', windowSeconds:3600, maxRequests:5, blockDurationSeconds:3600, note:'Exports sensibles — strict' },
]

// ─── SECURITY HEADERS CONCEPTS ────────────────────────────────

export const SECURITY_HEADERS = {
  HSTS: 'max-age=31536000; includeSubDomains',
  CSP: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  'Cache-Control': 'no-store',
} as const

// ─── MOCK DATA ────────────────────────────────────────────────

export const mockUserIdentity: UserIdentity = {
  id:'uid-internal-001',
  publicId:'DRV-A7K2-M9P3',
  userType:'DRIVER', status:'ACTIVE', mfaRequired:false,
  createdAt:'2025-03-01T00:00:00Z', updatedAt:'2026-08-24T10:00:00Z',
}

export const mockDriverAccount: DriverAccount = {
  id:'acc-dr-001', userId:'uid-internal-001', driverNumber:'DR-00001234',
  status:'ACTIVE', verificationStatus:'VERIFIED',
  createdAt:'2025-03-01T00:00:00Z', updatedAt:'2026-08-01T00:00:00Z',
}

export const mockMFAConfig: MFAConfiguration = {
  userId:'uid-internal-001', enabled:true, primaryMethod:'TOTP',
  backupMethods:['EMAIL'], lastUsedAt:'2026-08-24T08:00:00Z',
}

export const mockSessions: UserSession[] = [
  { id:'sess-001', userId:'uid-internal-001', deviceId:'dev-001', createdAt:'2026-08-24T08:00:00Z', lastActivity:'2026-08-24T15:30:00Z', expiresAt:'2026-08-24T20:00:00Z', revokedAt:null, ipMetadata:'hash:••••a3f2', status:'ACTIVE' },
  { id:'sess-002', userId:'uid-internal-001', deviceId:'dev-002', createdAt:'2026-08-20T09:00:00Z', lastActivity:'2026-08-22T18:00:00Z', expiresAt:'2026-08-22T18:30:00Z', revokedAt:null, ipMetadata:'hash:••••b7c1', status:'EXPIRED' },
]

export const mockDevices: Device[] = [
  { id:'dev-001', userId:'uid-internal-001', deviceIdentifier:'hash:ios-••••-8832', platform:'iOS', appVersion:'1.2.0', name:'iPhone 15 Pro — Mohamed', lastSeen:'2026-08-24T15:30:00Z', status:'TRUSTED', createdAt:'2025-03-01T00:00:00Z' },
  { id:'dev-002', userId:'uid-internal-001', deviceIdentifier:'hash:web-••••-4421', platform:'Web', appVersion:'1.1.8', name:'Chrome — Bureau', lastSeen:'2026-08-22T18:00:00Z', status:'TRUSTED', createdAt:'2025-09-01T00:00:00Z' },
]

export const mockUserRole: UserRole = {
  userId:'uid-internal-001', role:'DRIVER',
  assignedBy:'SYSTEM', assignedAt:'2025-03-01T00:00:00Z', expiresAt:null,
}

export const mockSensitiveId: SensitiveGovernmentIdentifier = {
  id:'sid-001', userId:'uid-internal-001',
  identifierType:'SIN_NAS', encryptedValue:'ENCRYPTED',
  maskedDisplay:'***-***-XXX',
  keyVersion:'KEY-v2-2026', lastAccessedAt:null, accessLog:[],
}

export const mockProviderHealth: ProviderConnectionHealth[] = [
  { provider:'Uber', status:'CONNECTED', lastChecked:'2026-08-24T15:45:00Z', webhooksReceived:142, webhooksFailed:2, webhooksDuplicate:1, lastError:null, note:'MOCK_ONLY — approbation Uber partenaire requise' },
  { provider:'Lyft', status:'DEGRADED', lastChecked:'2026-08-24T15:45:00Z', webhooksReceived:87, webhooksFailed:14, webhooksDuplicate:0, lastError:'OAuth token REAUTH_REQUIRED', note:'MOCK_ONLY' },
  { provider:'DoorDash', status:'CONNECTED', lastChecked:'2026-08-24T15:45:00Z', webhooksReceived:96, webhooksFailed:1, webhooksDuplicate:0, lastError:null, note:'MOCK_ONLY' },
  { provider:'Instacart', status:'CONNECTED', lastChecked:'2026-08-24T15:45:00Z', webhooksReceived:43, webhooksFailed:0, webhooksDuplicate:0, lastError:null, note:'MOCK_ONLY' },
  { provider:'Uber Eats', status:'CONNECTED', lastChecked:'2026-08-24T15:45:00Z', webhooksReceived:61, webhooksFailed:0, webhooksDuplicate:0, lastError:null, note:'MOCK_ONLY' },
  { provider:'Skip', status:'ERROR', lastChecked:'2026-08-24T15:45:00Z', webhooksReceived:12, webhooksFailed:8, webhooksDuplicate:0, lastError:'Connection timeout — API évaluation en cours', note:'MOCK_ONLY' },
]

export const mockSecurityAudit: SecurityAuditLog[] = [
  { id:'SAL-001', actorId:'uid-internal-001', actorRole:'DRIVER', action:'LOGIN', resourceType:'SESSION', resourceId:'sess-001', timestamp:'2026-08-24T08:00:00Z', result:'SUCCESS', metadata:{device:'dev-001',mfa:'TOTP'} },
  { id:'SAL-002', actorId:'uid-internal-001', actorRole:'DRIVER', action:'MFA_ENABLED', resourceType:'MFA', resourceId:'uid-internal-001', timestamp:'2026-08-01T10:00:00Z', result:'SUCCESS', metadata:{method:'TOTP'} },
  { id:'SAL-003', actorId:'uid-internal-001', actorRole:'DRIVER', action:'PROVIDER_CONNECTED', resourceType:'PROVIDER', resourceId:'uber', timestamp:'2026-06-01T10:00:00Z', result:'SUCCESS', metadata:{provider:'uber',scopes:'partner.accounts,partner.trips'} },
  { id:'SAL-004', actorId:'uid-external-attacker', actorRole:'DRIVER', action:'LOGIN_FAILURE', resourceType:'SESSION', resourceId:null, timestamp:'2026-08-24T14:00:00Z', result:'BLOCKED', metadata:{reason:'brute_force_detected',attempts:'6'} },
  { id:'SAL-005', actorId:'uid-internal-001', actorRole:'DRIVER', action:'PERMISSION_DENIED', resourceType:'DRIVER', resourceId:'DR-00009999', timestamp:'2026-08-24T14:30:00Z', result:'FAILURE', metadata:{reason:'403_forbidden',attempted_resource:'DR-00009999'} },
]

export const mockSecurityEvents: SecurityEvent[] = [
  { eventId:'EVT-SEC-001', type:'LOGIN_FAILURE', userId:'uid-external-attacker', severity:'WARNING', description:'6 tentatives de connexion échouées — rate limit activé', timestamp:'2026-08-24T14:00:00Z', resolved:true },
  { eventId:'EVT-SEC-002', type:'NEW_DEVICE', userId:'uid-internal-001', severity:'INFO', description:'Nouvel appareil détecté — vérification demandée', timestamp:'2026-08-20T09:00:00Z', resolved:true },
  { eventId:'EVT-SEC-003', type:'WEBHOOK_REJECTED', userId:null, severity:'WARNING', description:'Webhook Lyft — signature invalide — aucune transaction créée', timestamp:'2026-08-24T16:00:00Z', resolved:true },
]

export const mockAPIEndpoints: APIEndpoint[] = [
  { path:'/api/v1/driver/profile', method:'GET', requiredPermission:'drivers.read', rateLimit:'NORMAL', requiresMFA:false, version:'v1', requiresResourceOwnership:true },
  { path:'/api/v1/driver/taximeter/start', method:'POST', requiredPermission:null, rateLimit:'NORMAL', requiresMFA:false, version:'v1', requiresResourceOwnership:true },
  { path:'/api/v1/driver/revenue', method:'GET', requiredPermission:'revenue.read', rateLimit:'NORMAL', requiresMFA:false, version:'v1', requiresResourceOwnership:true },
  { path:'/api/v1/driver/tax/reports/finalize', method:'POST', requiredPermission:'tax.finalize', rateLimit:'STRICT', requiresMFA:true, version:'v1', requiresResourceOwnership:true },
  { path:'/api/v1/admin/drivers/:id/suspend', method:'POST', requiredPermission:'drivers.suspend', rateLimit:'STRICT', requiresMFA:true, version:'v1', requiresResourceOwnership:false },
  { path:'/api/v1/admin/revenue/export', method:'POST', requiredPermission:'revenue.export', rateLimit:'STRICT', requiresMFA:true, version:'v1', requiresResourceOwnership:false },
  { path:'/api/v1/webhooks/:provider', method:'POST', requiredPermission:null, rateLimit:'LOOSE', requiresMFA:false, version:'v1', requiresResourceOwnership:false },
]

// ─── HELPERS ─────────────────────────────────────────────────

export const PROVIDER_HEALTH_CONF: Record<ProviderHealth, { icon: string; color: string; bg: string }> = {
  CONNECTED:      { icon:'✅', color:'text-green-400',  bg:'bg-green-500/10' },
  AVAILABLE:      { icon:'🟡', color:'text-amber-400',  bg:'bg-amber-500/10' },
  DEGRADED:       { icon:'⚠️', color:'text-amber-400',  bg:'bg-amber-500/10' },
  ERROR:          { icon:'❌', color:'text-red-400',    bg:'bg-red-500/10' },
  NOT_CONFIGURED: { icon:'○',  color:'text-slate-500',  bg:'bg-slate-800/50' },
}

export const SESSION_STATUS_CONF: Record<SessionStatus, { icon: string; color: string }> = {
  ACTIVE:  { icon:'🟢', color:'text-green-400' },
  EXPIRED: { icon:'⏱',  color:'text-slate-500' },
  REVOKED: { icon:'❌', color:'text-red-400' },
}

export const SEVERITY_CONF = {
  INFO:     { color:'text-blue-400',   bg:'bg-blue-500/10',   icon:'ℹ️' },
  WARNING:  { color:'text-amber-400',  bg:'bg-amber-500/10',  icon:'⚠️' },
  CRITICAL: { color:'text-red-400',    bg:'bg-red-500/10',    icon:'🚨' },
}
