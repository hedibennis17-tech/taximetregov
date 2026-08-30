// ================================================================
// TAXIMÈTRE.GOV — AUDIT & PRIVACY SERVICE
// Phase DB-11: Audit · Retention · GDPR · Data Access
// ================================================================

import { createHash, randomBytes } from 'crypto'

// ─── PUBLIC IDS ──────────────────────────────────────────────

export function formatPublicPrivacyRequestId(seq: number): string {
  return `PRQ-${seq.toString().padStart(8, '0')}`
}

// ─── AUDIT LOG BUILDER ───────────────────────────────────────

export interface AuditLogEntry {
  actorId:      string | null
  actorRole:    string | null
  actorType:    'DRIVER' | 'GOVERNMENT' | 'SYSTEM' | 'ANONYMOUS'
  action:       string   // Namespaced: 'module.entity.operation'
  module:       string
  severity:     'DEBUG' | 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL'
  result:       'SUCCESS' | 'FAILURE' | 'BLOCKED' | 'PARTIAL'
  resourceType: string | null
  resourceId:   string | null
  subjectDriverId: string | null
  correlationId: string | null
  metadata:     Record<string, string | number | boolean | null>
}

const FORBIDDEN_AUDIT_KEYS = [
  'password', 'token', 'secret', 'otp', 'pin',
  'nas', 'sin', 'iban', 'card_number', 'cvv',
  'access_token', 'refresh_token', 'api_key',
]

export function buildAuditEntry(entry: AuditLogEntry): AuditLogEntry {
  // Validate metadata — no sensitive keys ever
  for (const key of Object.keys(entry.metadata)) {
    if (FORBIDDEN_AUDIT_KEYS.some(f => key.toLowerCase().includes(f))) {
      throw new Error(`Clé interdite dans audit log: ${key}`)
    }
  }
  // Validate action namespace format
  if (!entry.action.includes('.')) {
    throw new Error(`Action doit être namespacée: 'module.entity.operation' — reçu: ${entry.action}`)
  }
  return entry
}

// ─── AUDIT ACTION NAMING ──────────────────────────────────────

export const AUDIT_ACTIONS = {
  // Auth
  AUTH_LOGIN_SUCCESS:         'auth.session.login_success',
  AUTH_LOGIN_FAILURE:         'auth.session.login_failure',
  AUTH_LOGOUT:                'auth.session.logout',
  AUTH_MFA_ENABLED:           'auth.mfa.enabled',
  AUTH_MFA_DISABLED:          'auth.mfa.disabled',
  AUTH_DEVICE_REVOKED:        'auth.device.revoked',
  AUTH_SESSION_REVOKED:       'auth.session.revoked',
  // Driver
  DRIVER_PROFILE_READ:        'driver.profile.read',
  DRIVER_PROFILE_UPDATED:     'driver.profile.updated',
  DRIVER_SUSPENDED:           'driver.account.suspended',
  DRIVER_REACTIVATED:         'driver.account.reactivated',
  // Vehicle
  VEHICLE_APPROVED:           'vehicle.registration.approved',
  VEHICLE_SUSPENDED:          'vehicle.registration.suspended',
  // Documents
  DOCUMENT_VIEWED:            'document.file.viewed',
  DOCUMENT_APPROVED:          'document.verification.approved',
  DOCUMENT_REJECTED:          'document.verification.rejected',
  // Tax
  TAX_REPORT_GENERATED:       'tax.report.generated',
  TAX_REPORT_FINALIZED:       'tax.report.finalized',
  TAX_REPORT_EXPORTED:        'tax.report.exported',
  // Payments
  PAYMENT_INITIATED:          'payment.transaction.initiated',
  PAYOUT_APPROVED:            'payment.payout.approved',
  REFUND_APPROVED:            'payment.refund.approved',
  // Admin
  ADMIN_PERMISSION_CHANGED:   'admin.rbac.permission_changed',
  ADMIN_ROLE_ASSIGNED:        'admin.rbac.role_assigned',
  // Audit itself
  AUDIT_EXPORT:               'audit.log.exported',
  DATA_ACCESS_SENSITIVE:      'privacy.data.accessed',
} as const

// ─── RETENTION POLICIES ───────────────────────────────────────

export interface RetentionPolicy {
  category:       string
  retentionDays:  number | null  // null = indefinite
  canDelete:      boolean
  archivalAction: 'ARCHIVE' | 'ANONYMIZE' | 'DELETE'
  legalBasis:     string
}

// Development reference — actual values configured per jurisdiction in DB
export const REFERENCE_RETENTION_POLICIES: Record<string, RetentionPolicy> = {
  FINANCIAL_TRANSACTIONS: {
    category:      'FINANCIAL_TRANSACTIONS',
    retentionDays: null,       // Indefinite — legal obligation
    canDelete:     false,
    archivalAction: 'ARCHIVE',
    legalBasis:    'Obligations fiscales — LIR Canada · LIS Québec',
  },
  TAX_RECORDS: {
    category:      'TAX_RECORDS',
    retentionDays: null,       // Configurable per jurisdiction (≥ 7 ans typiquement)
    canDelete:     false,
    archivalAction: 'ARCHIVE',
    legalBasis:    'Loi de l\'impôt sur le revenu · Loi sur la TVQ',
  },
  AUDIT_LOGS: {
    category:      'AUDIT_LOGS',
    retentionDays: null,       // Indefinite for security audit
    canDelete:     false,
    archivalAction: 'ARCHIVE',
    legalBasis:    'Obligations gouvernementales de traçabilité',
  },
  GPS_DATA: {
    category:      'GPS_DATA',
    retentionDays: 30,         // Configurable · privacy-first
    canDelete:     true,
    archivalAction: 'ANONYMIZE',
    legalBasis:    'Politique de confidentialité · minimisation des données',
  },
  SESSION_LOGS: {
    category:      'SESSION_LOGS',
    retentionDays: 90,         // Configurable
    canDelete:     true,
    archivalAction: 'DELETE',
    legalBasis:    'Sécurité · audit d\'accès',
  },
  NOTIFICATIONS: {
    category:      'NOTIFICATIONS',
    retentionDays: 90,         // Configurable
    canDelete:     true,
    archivalAction: 'DELETE',
    legalBasis:    'Opérationnel',
  },
  PERSONAL_DATA: {
    category:      'PERSONAL_DATA',
    retentionDays: null,       // Until account closed + legal hold period
    canDelete:     false,      // Subject to GDPR erasure where permitted
    archivalAction: 'ANONYMIZE',
    legalBasis:    'GDPR Art. 17 · sous réserve obligations légales',
  },
}

export function canDataBeDeleted(category: string): boolean {
  const policy = REFERENCE_RETENTION_POLICIES[category]
  return policy?.canDelete ?? false
}

export function getArchivalAction(category: string): string {
  return REFERENCE_RETENTION_POLICIES[category]?.archivalAction ?? 'ARCHIVE'
}

// ─── GDPR PRIVACY REQUESTS ────────────────────────────────────

export interface PrivacyRequestValidation {
  valid:   boolean
  errors:  string[]
}

export function validatePrivacyRequest(params: {
  requestType:  string
  userId:       string
  specificData: string[]
}): PrivacyRequestValidation {
  const errors: string[] = []

  const validTypes = [
    'ACCESS', 'PORTABILITY', 'RECTIFICATION',
    'ERASURE', 'RESTRICTION', 'OBJECTION',
  ]
  if (!validTypes.includes(params.requestType)) {
    errors.push(`Type de demande invalide: ${params.requestType}`)
  }

  if (!params.userId) errors.push('userId requis')

  return { valid: errors.length === 0, errors }
}

export function computePrivacyRequestDueDate(
  receivedAt:     Date,
  deadlineDays:   number = 30,  // Configurable per jurisdiction (GDPR = 30j)
): Date {
  const due = new Date(receivedAt)
  due.setDate(due.getDate() + deadlineDays)
  return due
}

export function isDueDateBreached(dueAt: Date): boolean {
  return new Date() > dueAt
}

// ─── ERASURE ASSESSMENT ───────────────────────────────────────

export interface ErasureAssessment {
  canErase:        boolean
  retainedData:    string[]  // Categories that must be retained
  erasableData:    string[]  // Categories that can be erased
  legalNote:       string
}

export function assessErasureRequest(
  hasActiveFinancialRecords: boolean,
  hasActiveTrips:            boolean,
  hasOpenTaxPeriods:         boolean,
  hasLegalHold:              boolean,
): ErasureAssessment {
  const retainedData: string[] = []
  const erasableData: string[] = []

  if (hasActiveFinancialRecords) {
    retainedData.push('FINANCIAL_TRANSACTIONS')
  } else {
    erasableData.push('WALLET_HISTORY')
  }

  if (hasOpenTaxPeriods) {
    retainedData.push('TAX_RECORDS')
  }

  if (hasActiveTrips) {
    retainedData.push('TRIP_RECORDS')
  }

  if (hasLegalHold) {
    retainedData.push('LEGAL_HOLD_DATA')
  }

  // Personal data can be anonymized if no legal obligation
  if (!hasActiveFinancialRecords && !hasOpenTaxPeriods && !hasLegalHold) {
    erasableData.push('PERSONAL_IDENTITY', 'CONTACT_INFO', 'SESSION_LOGS')
  }

  const canErase = retainedData.length === 0

  return {
    canErase,
    retainedData,
    erasableData,
    legalNote: retainedData.length > 0
      ? `Données conservées pour obligations légales: ${retainedData.join(', ')}`
      : 'Effacement possible — aucune obligation légale bloquante',
  }
}

// ─── GOVERNMENT ACCESS JUSTIFICATION ─────────────────────────

export interface GovernmentAccessValidation {
  authorized: boolean
  reason:     string | null
}

export function validateGovernmentAccess(params: {
  actorPermissions:  string[]
  actorJurisdictions: string[]
  dataJurisdiction:  string
  dataCategory:      string
  legalAuthority:    string  // Must be provided
}): GovernmentAccessValidation {
  if (!params.legalAuthority || params.legalAuthority.trim() === '') {
    return { authorized: false, reason: 'Autorité légale obligatoire pour accès aux données sensibles' }
  }

  const hasPerm = params.actorPermissions.includes('audit.read') ||
    params.actorPermissions.includes('drivers.read') ||
    params.actorPermissions.includes('tax.read')

  if (!hasPerm) {
    return { authorized: false, reason: 'Permission insuffisante' }
  }

  const hasJurisdiction = params.actorJurisdictions.includes(params.dataJurisdiction) ||
    params.actorJurisdictions.includes('ALL')

  if (!hasJurisdiction) {
    return { authorized: false, reason: `Accès hors juridiction: ${params.dataJurisdiction}` }
  }

  return { authorized: true, reason: null }
}

// ─── ACCESS CONTROL ──────────────────────────────────────────

export function canDriverAccessOwnAuditLog(
  requestorUserId: string,
  logSubjectUserId: string | null,
): boolean {
  if (!logSubjectUserId) return false
  return requestorUserId === logSubjectUserId
}

export function canExportAuditLog(
  permissions:   string[],
  mfaCompleted:  boolean,
): boolean {
  // Export always requires MFA
  if (!mfaCompleted) return false
  return permissions.includes('audit.export')
}

export function canReadAuditLog(permissions: string[]): boolean {
  return permissions.includes('audit.read')
}

// ─── HASH IP (privacy) ────────────────────────────────────────

export function hashIpForAudit(ip: string): string {
  return createHash('sha256').update(ip.trim()).digest('hex').slice(0, 16)
}

// ─── SEED RETENTION POLICIES ─────────────────────────────────

export const SEED_RETENTION_POLICIES = Object.values(REFERENCE_RETENTION_POLICIES)
