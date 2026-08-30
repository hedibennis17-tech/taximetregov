// ================================================================
// TAXIMÈTRE.GOV — AUDIT & PRIVACY TESTS
// Phase DB-11: 24 tests obligatoires + invariants
// ================================================================

import { describe, it, expect } from 'vitest'
import {
  formatPublicPrivacyRequestId,
  buildAuditEntry, AUDIT_ACTIONS,
  canDataBeDeleted, getArchivalAction,
  validatePrivacyRequest, computePrivacyRequestDueDate,
  isDueDateBreached, assessErasureRequest,
  validateGovernmentAccess, canDriverAccessOwnAuditLog,
  canExportAuditLog, canReadAuditLog, hashIpForAudit,
  REFERENCE_RETENTION_POLICIES, SEED_RETENTION_POLICIES,
  type AuditLogEntry,
} from '../src/auth/audit.service'

// ─── PUBLIC IDS ──────────────────────────────────────────────

describe('Public Privacy Request ID', () => {
  it('[PASS] PRQ-XXXXXXXX format', () => {
    expect(formatPublicPrivacyRequestId(1)).toBe('PRQ-00000001')
    expect(formatPublicPrivacyRequestId(42)).toMatch(/^PRQ-\d{8}$/)
  })
})

// ─── AUDIT LOG BUILDER ───────────────────────────────────────

describe('Audit Log Builder — Tests 1, 2, 3', () => {
  const validEntry: AuditLogEntry = {
    actorId:         'user-uuid-001',
    actorRole:       'GOV_ADMIN',
    actorType:       'GOVERNMENT',
    action:          AUDIT_ACTIONS.DRIVER_PROFILE_READ,
    module:          'DRIVER',
    severity:        'INFO',
    result:          'SUCCESS',
    resourceType:    'DRIVER_PROFILE',
    resourceId:      'DRV-00000001',
    subjectDriverId: 'driver-uuid-001',
    correlationId:   'corr-001',
    metadata:        { driverNumber: 'DR-00001234', reason: 'REGULATORY_AUDIT' },
  }

  it('[TEST 1] Valid audit entry built successfully', () => {
    const entry = buildAuditEntry(validEntry)
    expect(entry.action).toBe(AUDIT_ACTIONS.DRIVER_PROFILE_READ)
    expect(entry.module).toBe('DRIVER')
    expect(entry.result).toBe('SUCCESS')
  })

  it('[TEST 2] Audit entry with sensitive key throws', () => {
    expect(() => buildAuditEntry({
      ...validEntry,
      metadata: { password: 'secret-value' },  // FORBIDDEN
    })).toThrow(/interdite/i)

    expect(() => buildAuditEntry({
      ...validEntry,
      metadata: { access_token: 'eyJ...' },  // FORBIDDEN
    })).toThrow(/interdite/i)

    expect(() => buildAuditEntry({
      ...validEntry,
      metadata: { nas: '123-456-789' },  // FORBIDDEN
    })).toThrow(/interdite/i)
  })

  it('[TEST 3] Action must be namespaced (module.entity.operation)', () => {
    expect(() => buildAuditEntry({
      ...validEntry,
      action: 'read',  // Not namespaced
    })).toThrow(/namespacée/i)
  })

  it('[PASS] All predefined AUDIT_ACTIONS are namespaced', () => {
    Object.values(AUDIT_ACTIONS).forEach(action => {
      expect(action.split('.').length).toBeGreaterThanOrEqual(3)
    })
  })

  it('[PASS] Audit log has no updatedAt concept (append-only)', () => {
    // Schema has occurredAt but no updatedAt — immutable
    const entry = buildAuditEntry(validEntry)
    expect(entry).not.toHaveProperty('updatedAt')
  })
})

// ─── RETENTION POLICIES ───────────────────────────────────────

describe('Retention Policies — Tests 4, 5, 6', () => {
  it('[TEST 4] Financial records: canDelete=false (absolute)', () => {
    expect(canDataBeDeleted('FINANCIAL_TRANSACTIONS')).toBe(false)
    expect(canDataBeDeleted('TAX_RECORDS')).toBe(false)
    expect(canDataBeDeleted('AUDIT_LOGS')).toBe(false)
  })

  it('[TEST 5] GPS data: canDelete=true (privacy-first)', () => {
    expect(canDataBeDeleted('GPS_DATA')).toBe(true)
    expect(getArchivalAction('GPS_DATA')).toBe('ANONYMIZE')
  })

  it('[TEST 6] Session logs can be deleted after retention period', () => {
    expect(canDataBeDeleted('SESSION_LOGS')).toBe(true)
    expect(getArchivalAction('SESSION_LOGS')).toBe('DELETE')
  })

  it('[PASS] All financial categories are protected from deletion', () => {
    const financial = ['FINANCIAL_TRANSACTIONS', 'TAX_RECORDS']
    financial.forEach(cat => {
      const policy = REFERENCE_RETENTION_POLICIES[cat]
      expect(policy?.canDelete).toBe(false)
    })
  })

  it('[PASS] retentionDays=null means indefinite (legal obligation)', () => {
    const financial = REFERENCE_RETENTION_POLICIES['FINANCIAL_TRANSACTIONS']
    expect(financial?.retentionDays).toBeNull()
    // null = configurable per jurisdiction / indefinite
  })

  it('[PASS] All policies have legal basis documented', () => {
    SEED_RETENTION_POLICIES.forEach(policy => {
      expect(policy.legalBasis.length).toBeGreaterThan(0)
      // Never invented — always references real regulation
    })
  })
})

// ─── GDPR PRIVACY REQUESTS ────────────────────────────────────

describe('GDPR Privacy Requests — Tests 7, 8, 9', () => {
  it('[TEST 7] Valid ACCESS request', () => {
    const result = validatePrivacyRequest({
      requestType: 'ACCESS', userId: 'user-001', specificData: ['PERSONAL_DATA'],
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('[TEST 8] Valid ERASURE request', () => {
    const result = validatePrivacyRequest({
      requestType: 'ERASURE', userId: 'user-001', specificData: ['GPS_DATA'],
    })
    expect(result.valid).toBe(true)
  })

  it('[TEST 9] Invalid request type rejected', () => {
    const result = validatePrivacyRequest({
      requestType: 'HACK_THE_DB', userId: 'user-001', specificData: [],
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('invalide'))).toBe(true)
  })

  it('[PASS] Due date computed correctly (30-day default)', () => {
    const received = new Date('2026-08-01T00:00:00Z')
    const due = computePrivacyRequestDueDate(received, 30)
    expect(due.getDate()).toBe(31)  // Aug 31
    expect(due.getMonth()).toBe(7)  // August (0-indexed)
  })

  it('[PASS] isDueDateBreached detects overdue requests', () => {
    const pastDate = new Date('2025-01-01')
    expect(isDueDateBreached(pastDate)).toBe(true)
    const futureDate = new Date(Date.now() + 86400000 * 30)
    expect(isDueDateBreached(futureDate)).toBe(false)
  })
})

// ─── ERASURE ASSESSMENT ───────────────────────────────────────

describe('GDPR Erasure Assessment — Tests 10, 11, 12', () => {
  it('[TEST 10] Driver with financial records cannot be fully erased', () => {
    const result = assessErasureRequest(true, false, false, false)
    expect(result.canErase).toBe(false)
    expect(result.retainedData).toContain('FINANCIAL_TRANSACTIONS')
    expect(result.legalNote).toMatch(/obligations légales/i)
  })

  it('[TEST 11] Driver with open tax period cannot be erased', () => {
    const result = assessErasureRequest(false, false, true, false)
    expect(result.canErase).toBe(false)
    expect(result.retainedData).toContain('TAX_RECORDS')
  })

  it('[TEST 12] Driver with legal hold cannot be erased', () => {
    const result = assessErasureRequest(false, false, false, true)
    expect(result.canErase).toBe(false)
    expect(result.retainedData).toContain('LEGAL_HOLD_DATA')
  })

  it('[PASS] Driver with no obligations → erasure possible', () => {
    const result = assessErasureRequest(false, false, false, false)
    expect(result.canErase).toBe(true)
    expect(result.erasableData.length).toBeGreaterThan(0)
    expect(result.legalNote).toMatch(/possible/i)
  })

  it('[PASS] Active trip blocks erasure', () => {
    const result = assessErasureRequest(false, true, false, false)
    expect(result.retainedData).toContain('TRIP_RECORDS')
  })
})

// ─── GOVERNMENT ACCESS ────────────────────────────────────────

describe('Government Data Access — Tests 13, 14, 15', () => {
  it('[TEST 13] Access with valid permission + legal authority = ALLOW', () => {
    const result = validateGovernmentAccess({
      actorPermissions:   ['audit.read', 'drivers.read'],
      actorJurisdictions: ['QC'],
      dataJurisdiction:   'QC',
      dataCategory:       'TAX',
      legalAuthority:     'TAX_AUDIT_2026_Q2',
    })
    expect(result.authorized).toBe(true)
    expect(result.reason).toBeNull()
  })

  it('[TEST 14] Access without legal authority = DENY', () => {
    const result = validateGovernmentAccess({
      actorPermissions:   ['audit.read'],
      actorJurisdictions: ['QC'],
      dataJurisdiction:   'QC',
      dataCategory:       'NAS_SIN',
      legalAuthority:     '',  // Missing — mandatory
    })
    expect(result.authorized).toBe(false)
    expect(result.reason).toMatch(/obligatoire/i)
  })

  it('[TEST 15] Access wrong jurisdiction = DENY', () => {
    const result = validateGovernmentAccess({
      actorPermissions:   ['audit.read'],
      actorJurisdictions: ['ON'],
      dataJurisdiction:   'QC',
      dataCategory:       'TAX',
      legalAuthority:     'AUDIT_REF_001',
    })
    expect(result.authorized).toBe(false)
    expect(result.reason).toMatch(/juridiction/i)
  })

  it('[PASS] ALL jurisdiction grants cross-jurisdictional access', () => {
    const result = validateGovernmentAccess({
      actorPermissions:   ['audit.read'],
      actorJurisdictions: ['ALL'],
      dataJurisdiction:   'QC',
      dataCategory:       'TAX',
      legalAuthority:     'FEDERAL_AUDIT_2026',
    })
    expect(result.authorized).toBe(true)
  })

  it('[PASS] Insufficient permission = DENY (even with legal authority)', () => {
    const result = validateGovernmentAccess({
      actorPermissions:   ['users.manage'],  // No relevant permission
      actorJurisdictions: ['QC'],
      dataJurisdiction:   'QC',
      dataCategory:       'TAX',
      legalAuthority:     'AUDIT_REF_002',
    })
    expect(result.authorized).toBe(false)
    expect(result.reason).toMatch(/permission/i)
  })
})

// ─── ACCESS CONTROL ───────────────────────────────────────────

describe('Access Control — Tests 16, 17, 18', () => {
  it('[TEST 16] Driver can access own audit log only', () => {
    expect(canDriverAccessOwnAuditLog('user-A', 'user-A')).toBe(true)
    expect(canDriverAccessOwnAuditLog('user-A', 'user-B')).toBe(false)
    expect(canDriverAccessOwnAuditLog('user-A', null)).toBe(false)
  })

  it('[TEST 17] Audit export requires audit.export + MFA', () => {
    expect(canExportAuditLog(['audit.export'], true)).toBe(true)
    // Without MFA: DENIED
    expect(canExportAuditLog(['audit.export'], false)).toBe(false)
    // Without permission: DENIED
    expect(canExportAuditLog(['audit.read'], true)).toBe(false)
  })

  it('[TEST 18] Audit read requires audit.read', () => {
    expect(canReadAuditLog(['audit.read'])).toBe(true)
    expect(canReadAuditLog(['drivers.read'])).toBe(false)
    expect(canReadAuditLog([])).toBe(false)
  })
})

// ─── IP HASHING ───────────────────────────────────────────────

describe('IP Hashing — Privacy', () => {
  it('[PASS] IP is hashed — never stored in clear', () => {
    const ip = '192.168.1.100'
    const hash = hashIpForAudit(ip)
    expect(hash).not.toContain('192')
    expect(hash).not.toContain('168')
    expect(hash).toHaveLength(16)
  })

  it('[PASS] Same IP = same hash (deterministic)', () => {
    expect(hashIpForAudit('10.0.0.1')).toBe(hashIpForAudit('10.0.0.1'))
  })

  it('[PASS] Different IPs = different hashes', () => {
    expect(hashIpForAudit('10.0.0.1')).not.toBe(hashIpForAudit('10.0.0.2'))
  })
})

// ─── AUDIT ACTIONS CATALOGUE ─────────────────────────────────

describe('Audit Actions Catalogue', () => {
  it('[PASS] All actions are properly namespaced', () => {
    Object.entries(AUDIT_ACTIONS).forEach(([name, action]) => {
      const parts = action.split('.')
      expect(parts.length, `${name}: ${action}`).toBeGreaterThanOrEqual(3)
    })
  })

  it('[PASS] No duplicate action values', () => {
    const values = Object.values(AUDIT_ACTIONS)
    const unique = new Set(values)
    expect(unique.size).toBe(values.length)
  })
})

// ─── SCHEMA INVARIANTS ────────────────────────────────────────

describe('Schema Invariants', () => {
  it('[PASS] Financial data is always canDelete=false', () => {
    const financialCats = ['FINANCIAL_TRANSACTIONS', 'TAX_RECORDS', 'AUDIT_LOGS']
    financialCats.forEach(cat => {
      expect(canDataBeDeleted(cat)).toBe(false)
    })
  })

  it('[PASS] Audit entry with sensitive key always throws', () => {
    const sensitive = ['password', 'token', 'nas', 'sin', 'iban', 'cvv', 'api_key']
    const base: AuditLogEntry = {
      actorId: null, actorRole: null, actorType: 'SYSTEM',
      action: 'auth.session.login_success', module: 'AUTH',
      severity: 'INFO', result: 'SUCCESS', resourceType: null,
      resourceId: null, subjectDriverId: null, correlationId: null,
      metadata: {},
    }
    sensitive.forEach(key => {
      expect(() => buildAuditEntry({ ...base, metadata: { [key]: 'value' } })).toThrow()
    })
  })

  it('[PASS] Privacy request deadline is configurable (not hardcoded)', () => {
    const r1 = computePrivacyRequestDueDate(new Date('2026-01-01'), 30)
    const r2 = computePrivacyRequestDueDate(new Date('2026-01-01'), 45)
    // Different deadlines produce different due dates
    expect(r1.getTime()).not.toBe(r2.getTime())
  })
})
