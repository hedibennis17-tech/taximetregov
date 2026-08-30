// ================================================================
// TAXIMÈTRE.GOV — GOVERNMENT DASHBOARD TESTS
// Phase DB-16: 20 tests obligatoires + invariants
// ================================================================

import { describe, it, expect } from 'vitest'
import {
  formatPublicRegulatoryActionId, formatPublicReportId,
  validateRegulatoryAction, buildOversightFlag,
  checkReportAccess, computeDriverRegulatoryStatus,
  buildMetricSnapshot,
  canGovernmentUserAccessDriver, canGovernmentUserGenerateReport,
  canGovernmentUserOpenInvestigation, hashIp,
} from '../src/auth/government.service'

// ─── PUBLIC IDS ──────────────────────────────────────────────

describe('Public IDs', () => {
  it('[PASS] REG-XXXXXXXX format', () => {
    expect(formatPublicRegulatoryActionId(1)).toBe('REG-00000001')
    expect(formatPublicRegulatoryActionId(42)).toMatch(/^REG-\d{8}$/)
  })

  it('[PASS] RPT-XXXXXXXX format', () => {
    expect(formatPublicReportId(1)).toBe('RPT-00000001')
  })
})

// ─── REGULATORY ACTION VALIDATION ────────────────────────────

const baseParams = {
  issuerId:           'gov-user-001',
  subjectDriverId:    'driver-001',
  actionType:         'DRIVER_SUSPENDED',
  legalAuthority:     'Art. 45 Loi sur les transports — Suspension permis taxi',
  issuerPermissions:  ['drivers.suspend', 'drivers.read'],
  issuerJurisdictions: ['QC'],
  subjectJurisdiction: 'QC',
}

describe('Regulatory Action Validation — Tests 1, 2, 3, 4, 5', () => {
  it('[TEST 1] Valid action with legal authority = ALLOW', () => {
    const result = validateRegulatoryAction(baseParams)
    expect(result.allowed).toBe(true)
    expect(result.reason).toBeNull()
  })

  it('[TEST 2] Missing legal authority = DENY', () => {
    const result = validateRegulatoryAction({ ...baseParams, legalAuthority: '' })
    expect(result.allowed).toBe(false)
    expect(result.reason).toMatch(/obligatoire/i)
  })

  it('[TEST 3] Self-action = DENY (gov user cannot act on own account)', () => {
    const result = validateRegulatoryAction({
      ...baseParams,
      subjectDriverId: 'gov-user-001',  // Same as issuerId
    })
    expect(result.allowed).toBe(false)
    expect(result.reason).toMatch(/auto-action/i)
  })

  it('[TEST 4] Wrong jurisdiction = DENY', () => {
    const result = validateRegulatoryAction({
      ...baseParams,
      issuerJurisdictions: ['ON'],
      subjectJurisdiction: 'QC',
    })
    expect(result.allowed).toBe(false)
    expect(result.reason).toMatch(/juridiction/i)
  })

  it('[TEST 5] Missing permission = DENY', () => {
    const result = validateRegulatoryAction({
      ...baseParams,
      issuerPermissions: ['drivers.read'],  // Missing drivers.suspend
    })
    expect(result.allowed).toBe(false)
    expect(result.reason).toMatch(/permission/i)
  })

  it('[PASS] ALL jurisdiction grants cross-jurisdiction access', () => {
    const result = validateRegulatoryAction({
      ...baseParams,
      issuerJurisdictions: ['ALL'],
      subjectJurisdiction: 'ON',
    })
    expect(result.allowed).toBe(true)
  })

  it('[PASS] DRIVER_APPROVED requires drivers.approve', () => {
    const result = validateRegulatoryAction({
      ...baseParams,
      actionType: 'DRIVER_APPROVED',
      issuerPermissions: ['drivers.approve'],
    })
    expect(result.allowed).toBe(true)
  })
})

// ─── OVERSIGHT FLAGS ──────────────────────────────────────────

describe('Oversight Flags — Tests 6, 7', () => {
  it('[TEST 6] Valid flag (REVIEW_REQUIRED language)', () => {
    const flag = buildOversightFlag({
      driverId:    'driver-001',
      flagType:    'GPS_ANOMALY_PATTERN',
      priority:    'HIGH',
      description: 'Anomalies GPS répétées détectées — REVIEW_REQUIRED par inspecteur',
      sourceType:  'AUTOMATED_DETECTION',
      sourceRef:   'GPS-ALERT-001',
    })
    expect(flag.flagType).toBe('GPS_ANOMALY_PATTERN')
    expect(flag.priority).toBe('HIGH')
  })

  it('[TEST 7] Flag with fraud accusation = THROW', () => {
    expect(() => buildOversightFlag({
      driverId:    'driver-001',
      flagType:    'TAX_DISCREPANCY',
      priority:    'CRITICAL',
      description: 'Est fraudeur confirmé — fraude confirmée',  // FORBIDDEN
      sourceType:  'AUTOMATED_DETECTION',
      sourceRef:   null,
    })).toThrow(/REVIEW_REQUIRED/i)
  })

  it('[PASS] Flag without fraud language passes', () => {
    expect(() => buildOversightFlag({
      driverId:    'driver-001',
      flagType:    'TAX_DISCREPANCY',
      priority:    'HIGH',
      description: 'Écart fiscal détecté — révision requise par inspecteur autorisé',
      sourceType:  'AUTOMATED_DETECTION',
      sourceRef:   null,
    })).not.toThrow()
  })
})

// ─── REPORT ACCESS ────────────────────────────────────────────

describe('Report Access Control — Tests 8, 9, 10', () => {
  const baseAccess = {
    requestorPermissions: ['reports.read', 'reports.generate'],
    requestorJurisdictions: ['QC'],
    reportJurisdiction:   'QC',
    reportContainsPii:    false,
    mfaVerified:          true,
    accessType:           'VIEW' as const,
  }

  it('[TEST 8] View report with correct permissions = ALLOW', () => {
    const result = checkReportAccess(baseAccess)
    expect(result.allowed).toBe(true)
  })

  it('[TEST 9] Download without MFA = DENY', () => {
    const result = checkReportAccess({
      ...baseAccess,
      accessType:  'DOWNLOAD',
      mfaVerified: false,
    })
    expect(result.allowed).toBe(false)
    expect(result.reason).toMatch(/MFA/i)
  })

  it('[TEST 10] PII report without reports.pii permission = DENY', () => {
    const result = checkReportAccess({
      ...baseAccess,
      reportContainsPii: true,
      requestorPermissions: ['reports.read'],  // Missing reports.pii
    })
    expect(result.allowed).toBe(false)
    expect(result.reason).toMatch(/reports\.pii/i)
  })

  it('[PASS] Download + MFA + correct perms = ALLOW', () => {
    const result = checkReportAccess({
      ...baseAccess,
      accessType:  'DOWNLOAD',
      mfaVerified: true,
    })
    expect(result.allowed).toBe(true)
  })

  it('[PASS] Wrong jurisdiction = DENY', () => {
    const result = checkReportAccess({
      ...baseAccess,
      requestorJurisdictions: ['ON'],
      reportJurisdiction: 'QC',
    })
    expect(result.allowed).toBe(false)
  })
})

// ─── DRIVER REGULATORY STATUS ─────────────────────────────────

describe('Driver Regulatory Status — Tests 11, 12, 13', () => {
  it('[TEST 11] Suspended driver = cannot operate', () => {
    const status = computeDriverRegulatoryStatus({
      driverId: 'driver-001', documentStatus: 'COMPLIANT',
      hasSuspension: true, activeActionsCount: 1,
      criticalActionsCount: 0, taxCompliant: true,
    })
    expect(status.canOperate).toBe(false)
    expect(status.overallCompliance).toBe('SUSPENDED')
    expect(status.reasons).toContain('Suspension active')
  })

  it('[TEST 12] Critical actions block operations', () => {
    const status = computeDriverRegulatoryStatus({
      driverId: 'driver-001', documentStatus: 'COMPLIANT',
      hasSuspension: false, activeActionsCount: 1,
      criticalActionsCount: 1, taxCompliant: true,
    })
    expect(status.canOperate).toBe(false)
    expect(status.reasons.some(r => r.includes('critique'))).toBe(true)
  })

  it('[TEST 13] Fully compliant driver = can operate', () => {
    const status = computeDriverRegulatoryStatus({
      driverId: 'driver-001', documentStatus: 'COMPLIANT',
      hasSuspension: false, activeActionsCount: 0,
      criticalActionsCount: 0, taxCompliant: true,
    })
    expect(status.canOperate).toBe(true)
    expect(status.overallCompliance).toBe('COMPLIANT')
    expect(status.reasons).toHaveLength(0)
  })

  it('[PASS] Non-compliant docs reduce compliance status', () => {
    const status = computeDriverRegulatoryStatus({
      driverId: 'driver-001', documentStatus: 'PENDING_DOCS',
      hasSuspension: false, activeActionsCount: 0,
      criticalActionsCount: 0, taxCompliant: true,
    })
    expect(status.canOperate).toBe(false)
    expect(status.reasons.some(r => r.includes('Documents'))).toBe(true)
  })
})

// ─── DASHBOARD METRICS ────────────────────────────────────────

describe('Dashboard Metrics — Tests 14, 15', () => {
  it('[TEST 14] Snapshot marked with computedAt (never real-time by default)', () => {
    const metric = buildMetricSnapshot('ACTIVE_DRIVERS', 150, 'count', 'DAILY')
    expect(metric.computedAt).toBeInstanceOf(Date)
    expect(metric.isRealtime).toBe(false)
    expect(metric.periodType).toBe('DAILY')
  })

  it('[TEST 15] REALTIME metric flagged as real-time', () => {
    const metric = buildMetricSnapshot('ACTIVE_DRIVERS', 12, 'count', 'REALTIME')
    expect(metric.isRealtime).toBe(true)
    // Only REALTIME presented as live data — others are snapshots
  })

  it('[PASS] Multiple metric types trackable', () => {
    const types = ['ACTIVE_DRIVERS', 'DAILY_TRIPS', 'TAX_COLLECTED', 'QUARANTINE_QUEUE']
    types.forEach(type => {
      const metric = buildMetricSnapshot(type, 42, 'count', 'DAILY')
      expect(metric.metricType).toBe(type)
    })
  })
})

// ─── ACCESS CONTROL ───────────────────────────────────────────

describe('Access Control — Tests 16, 17, 18, 19, 20', () => {
  it('[TEST 16] Gov user with drivers.read + correct jurisdiction = ALLOW', () => {
    expect(canGovernmentUserAccessDriver(['QC'], 'QC', ['drivers.read'])).toBe(true)
  })

  it('[TEST 17] Gov user wrong jurisdiction = DENY', () => {
    expect(canGovernmentUserAccessDriver(['ON'], 'QC', ['drivers.read'])).toBe(false)
  })

  it('[TEST 18] Report generation requires reports.generate + jurisdiction', () => {
    expect(canGovernmentUserGenerateReport(['reports.generate'], ['QC'], 'QC')).toBe(true)
    expect(canGovernmentUserGenerateReport(['reports.read'], ['QC'], 'QC')).toBe(false)
  })

  it('[TEST 19] Investigation requires investigation.open', () => {
    expect(canGovernmentUserOpenInvestigation(['investigation.open'])).toBe(true)
    expect(canGovernmentUserOpenInvestigation(['drivers.read'])).toBe(false)
  })

  it('[TEST 20] ALL jurisdiction = universal access', () => {
    expect(canGovernmentUserAccessDriver(['ALL'], 'QC', ['drivers.read'])).toBe(true)
    expect(canGovernmentUserAccessDriver(['ALL'], 'ON', ['drivers.read'])).toBe(true)
  })
})

// ─── IP HASH ──────────────────────────────────────────────────

describe('IP Hash (report access log)', () => {
  it('[PASS] IP never stored in clear', () => {
    const hash = hashIp('192.168.1.100')
    expect(hash).not.toContain('192')
    expect(hash.length).toBe(16)
  })

  it('[PASS] Same IP = same hash (deterministic)', () => {
    expect(hashIp('10.0.0.1')).toBe(hashIp('10.0.0.1'))
  })
})
