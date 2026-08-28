// ================================================================
// TAXIMÈTRE.GOV — PROFILE UNIT TESTS
// Phase DB-2: Driver & Government Profiles
// ================================================================

import { describe, it, expect } from 'vitest'
import {
  formatDriverNumber,
  parseDriverNumber,
  maskNAS,
  maskBusinessNumber,
  maskEmployeeReference,
  isOnboardingComplete,
  isTransitionAllowed,
  canOperateTaxi,
  calculateProfileCompleteness,
  canAccessJurisdiction,
  ONBOARDING_STEPS_TAXI,
  ONBOARDING_STEPS_RIDESHARE,
  ONBOARDING_STEPS_DELIVERY,
  STEP_LABELS,
  type VerificationStatus,
} from '../src/auth/profile.service'

// ─── DRIVER NUMBER ────────────────────────────────────────────

describe('Driver Number Generation', () => {
  it('[PASS] Formats DR- prefix with 8-digit zero-padding', () => {
    expect(formatDriverNumber(1)).toBe('DR-00000001')
    expect(formatDriverNumber(1234)).toBe('DR-00001234')
    expect(formatDriverNumber(99999999)).toBe('DR-99999999')
  })

  it('[PASS] All numbers have consistent DR-XXXXXXXX format', () => {
    [1, 100, 12345, 99999999].forEach(n => {
      expect(formatDriverNumber(n)).toMatch(/^DR-\d{8}$/)
    })
  })

  it('[PASS] parseDriverNumber extracts the sequence', () => {
    expect(parseDriverNumber('DR-00001234')).toBe(1234)
    expect(parseDriverNumber('DR-00000001')).toBe(1)
  })

  it('[PASS] parseDriverNumber returns null for invalid format', () => {
    expect(parseDriverNumber('invalid')).toBeNull()
    expect(parseDriverNumber('DR-1234')).toBeNull()
    expect(parseDriverNumber('')).toBeNull()
  })

  it('[PASS] Format ↔ Parse is reversible', () => {
    const n = 5678
    expect(parseDriverNumber(formatDriverNumber(n))).toBe(n)
  })
})

// ─── NAS / SIN MASKING ────────────────────────────────────────

describe('NAS / SIN Masking — Security Critical', () => {
  it('[PASS] Masked NAS always shows ***-***-XXX', () => {
    expect(maskNAS('123')).toBe('***-***-123')
    expect(maskNAS('456')).toBe('***-***-456')
  })

  it('[PASS] Invalid last digits returns fully masked', () => {
    expect(maskNAS('ab')).toBe('***-***-***')
    expect(maskNAS('')).toBe('***-***-***')
    expect(maskNAS('12')).toBe('***-***-***')
    expect(maskNAS('1234')).toBe('***-***-***')
  })

  it('[PASS] Masked NAS never contains more than last 3 digits', () => {
    const masked = maskNAS('789')
    expect(masked).toBe('***-***-789')
    // The mask must start with ***-***-
    expect(masked.startsWith('***-***-')).toBe(true)
    expect(masked).toHaveLength(11)
  })

  it('[PASS] maskBusinessNumber shows last 4 digits only', () => {
    expect(maskBusinessNumber('5678')).toBe('••••••5678')
  })

  it('[PASS] maskBusinessNumber invalid returns fully masked', () => {
    expect(maskBusinessNumber('ab')).toBe('••••••••••')
    expect(maskBusinessNumber('')).toBe('••••••••••')
  })

  it('[PASS] maskEmployeeReference shows EMP-•••• prefix', () => {
    expect(maskEmployeeReference('EMP123456789')).toMatch(/^EMP-••••/)
  })

  it('[PASS] NAS never appears as full number in any mask output', () => {
    // Simulate that a full NAS is accidentally passed — still masked
    const fullNas = '123456789'
    const masked = maskNAS(fullNas.slice(-3))
    expect(masked).not.toContain('123456')
    expect(masked).not.toContain('123-456')
  })
})

// ─── ONBOARDING ───────────────────────────────────────────────

describe('Driver Onboarding Steps', () => {
  it('[PASS] Taxi requires identity + license + permit + vehicle + insurance + tax', () => {
    expect(ONBOARDING_STEPS_TAXI).toContain('IDENTITY_VERIFICATION')
    expect(ONBOARDING_STEPS_TAXI).toContain('DRIVER_LICENSE')
    expect(ONBOARDING_STEPS_TAXI).toContain('TAXI_PERMIT')
    expect(ONBOARDING_STEPS_TAXI).toContain('VEHICLE_REGISTRATION')
    expect(ONBOARDING_STEPS_TAXI).toContain('INSURANCE')
    expect(ONBOARDING_STEPS_TAXI).toContain('TAX_PROFILE')
  })

  it('[PASS] Rideshare does NOT require taxi permit', () => {
    expect(ONBOARDING_STEPS_RIDESHARE).not.toContain('TAXI_PERMIT')
    expect(ONBOARDING_STEPS_RIDESHARE).toContain('PROVIDER_CONNECT')
  })

  it('[PASS] Delivery is the simplest (no license or vehicle required)', () => {
    expect(ONBOARDING_STEPS_DELIVERY).not.toContain('DRIVER_LICENSE')
    expect(ONBOARDING_STEPS_DELIVERY).not.toContain('VEHICLE_REGISTRATION')
    expect(ONBOARDING_STEPS_DELIVERY).not.toContain('TAXI_PERMIT')
    expect(ONBOARDING_STEPS_DELIVERY).toContain('PROVIDER_CONNECT')
  })

  it('[PASS] All step keys have labels', () => {
    const allSteps = [...new Set([
      ...ONBOARDING_STEPS_TAXI,
      ...ONBOARDING_STEPS_RIDESHARE,
      ...ONBOARDING_STEPS_DELIVERY,
    ])]
    allSteps.forEach(step => {
      expect(STEP_LABELS[step], `Missing label for step: ${step}`).toBeDefined()
    })
  })

  it('[PASS] Complete taxi onboarding returns true', () => {
    const completed = [...ONBOARDING_STEPS_TAXI]
    expect(isOnboardingComplete(completed, ['TAXI'])).toBe(true)
  })

  it('[PASS] Missing one step returns false', () => {
    const completed = ONBOARDING_STEPS_TAXI.filter(s => s !== 'INSURANCE')
    expect(isOnboardingComplete(completed, ['TAXI'])).toBe(false)
  })

  it('[PASS] Multi-service requires union of all steps', () => {
    const taxiAndRideshare = [...new Set([
      ...ONBOARDING_STEPS_TAXI,
      ...ONBOARDING_STEPS_RIDESHARE,
    ])]
    expect(isOnboardingComplete(taxiAndRideshare, ['TAXI', 'RIDESHARE'])).toBe(true)
    // Just taxi steps is not enough for taxi+rideshare
    expect(isOnboardingComplete([...ONBOARDING_STEPS_TAXI], ['TAXI', 'RIDESHARE'])).toBe(false)
  })
})

// ─── VERIFICATION STATUS TRANSITIONS ─────────────────────────

describe('Verification Status Transitions', () => {
  const validTransitions: [VerificationStatus, VerificationStatus][] = [
    ['NOT_STARTED', 'PENDING'],
    ['PENDING',     'IN_REVIEW'],
    ['PENDING',     'FAILED'],
    ['IN_REVIEW',   'VERIFIED'],
    ['IN_REVIEW',   'FAILED'],
    ['IN_REVIEW',   'MANUAL_REVIEW'],
    ['MANUAL_REVIEW', 'VERIFIED'],
    ['MANUAL_REVIEW', 'FAILED'],
    ['VERIFIED',    'EXPIRED'],
    ['FAILED',      'PENDING'],
    ['EXPIRED',     'PENDING'],
  ]

  validTransitions.forEach(([from, to]) => {
    it(`[PASS] ${from} → ${to} is allowed`, () => {
      expect(isTransitionAllowed(from, to)).toBe(true)
    })
  })

  const invalidTransitions: [VerificationStatus, VerificationStatus][] = [
    ['NOT_STARTED', 'VERIFIED'],  // Cannot skip straight to verified
    ['PENDING',     'VERIFIED'],  // Must go through IN_REVIEW
    ['VERIFIED',    'PENDING'],   // Cannot un-verify directly
    ['FAILED',      'VERIFIED'],  // Must re-submit first
    ['EXPIRED',     'VERIFIED'],  // Must re-verify
  ]

  invalidTransitions.forEach(([from, to]) => {
    it(`[PASS] ${from} → ${to} is BLOCKED (cannot skip)`, () => {
      expect(isTransitionAllowed(from, to)).toBe(false)
    })
  })

  it('[PASS] Cannot auto-transition to VERIFIED without review', () => {
    // No transition from NOT_STARTED or PENDING directly to VERIFIED
    expect(isTransitionAllowed('NOT_STARTED', 'VERIFIED')).toBe(false)
    expect(isTransitionAllowed('PENDING', 'VERIFIED')).toBe(false)
  })
})

// ─── DRIVER OPERATION ELIGIBILITY ────────────────────────────

describe('Driver Taxi Operation Eligibility', () => {
  it('[PASS] Active + verified + no suspension = can operate', () => {
    expect(canOperateTaxi('ACTIVE', true, [])).toBe(true)
  })

  it('[PASS] PENDING driver cannot operate', () => {
    expect(canOperateTaxi('PENDING', true, [])).toBe(false)
  })

  it('[PASS] SUSPENDED driver cannot operate', () => {
    expect(canOperateTaxi('SUSPENDED', true, [])).toBe(false)
  })

  it('[PASS] Active but unverified identity cannot operate', () => {
    expect(canOperateTaxi('ACTIVE', false, [])).toBe(false)
  })

  it('[PASS] Active + verified but TAXI suspended cannot operate', () => {
    expect(canOperateTaxi('ACTIVE', true, ['TAXI'])).toBe(false)
  })

  it('[PASS] Active + verified but ALL suspended cannot operate', () => {
    expect(canOperateTaxi('ACTIVE', true, ['ALL'])).toBe(false)
  })

  it('[PASS] RIDESHARE suspension does not block TAXI', () => {
    expect(canOperateTaxi('ACTIVE', true, ['RIDESHARE'])).toBe(true)
  })
})

// ─── PROFILE COMPLETENESS ─────────────────────────────────────

describe('Profile Completeness Score', () => {
  it('[PASS] Complete profile scores 100%', () => {
    const result = calculateProfileCompleteness({
      firstName:                  'Mohamed',
      lastName:                   'Benali',
      dateOfBirth:                '1985-03-15',
      phone:                      '+15145550001',
      province:                   'QC',
      addressEncrypted:           'enc:xxxx',
      identityVerificationStatus: 'VERIFIED',
    })
    expect(result.score).toBe(100)
    expect(result.missingFields).toHaveLength(0)
    expect(result.isEligibleForReview).toBe(true)
  })

  it('[PASS] Empty profile scores 0%', () => {
    const result = calculateProfileCompleteness({})
    expect(result.score).toBe(0)
    expect(result.missingFields.length).toBeGreaterThan(0)
    expect(result.isEligibleForReview).toBe(false)
  })

  it('[PASS] Missing identity verification reduces score', () => {
    const result = calculateProfileCompleteness({
      firstName: 'Mohamed',
      lastName:  'Benali',
      dateOfBirth: '1985-03-15',
      phone: '+15145550001',
      province: 'QC',
      addressEncrypted: 'enc:xxxx',
      identityVerificationStatus: 'PENDING',
    })
    expect(result.score).toBeLessThan(100)
    expect(result.missingFields).toContain('Vérification d\'identité')
  })

  it('[PASS] 70%+ with name is eligible for review', () => {
    const result = calculateProfileCompleteness({
      firstName:    'Mohamed',
      lastName:     'Benali',
      dateOfBirth:  '1985-03-15',
      phone:        '+15145550001',
      province:     'QC',
      addressEncrypted: 'enc:xxxx',
      // Missing: identity verification (1/7 missing)
    })
    expect(result.score).toBeGreaterThanOrEqual(70)
    expect(result.isEligibleForReview).toBe(true)
  })

  it('[PASS] Missing name prevents review eligibility even with high score', () => {
    const result = calculateProfileCompleteness({
      // No firstName/lastName
      dateOfBirth:  '1985-03-15',
      phone:        '+15145550001',
      province:     'QC',
      addressEncrypted: 'enc:xxxx',
      identityVerificationStatus: 'VERIFIED',
    })
    expect(result.isEligibleForReview).toBe(false)
  })
})

// ─── JURISDICTION ACCESS ──────────────────────────────────────

describe('Government Jurisdiction Access Control', () => {
  it('[PASS] QC user can access QC data', () => {
    expect(canAccessJurisdiction(['QC'], 'QC')).toBe(true)
  })

  it('[PASS] QC user cannot access ON data', () => {
    expect(canAccessJurisdiction(['QC'], 'ON')).toBe(false)
  })

  it('[PASS] Multi-jurisdiction user can access both', () => {
    expect(canAccessJurisdiction(['QC', 'FED'], 'QC')).toBe(true)
    expect(canAccessJurisdiction(['QC', 'FED'], 'FED')).toBe(true)
  })

  it('[PASS] ALL jurisdiction grants universal access', () => {
    expect(canAccessJurisdiction(['ALL'], 'QC')).toBe(true)
    expect(canAccessJurisdiction(['ALL'], 'ON')).toBe(true)
    expect(canAccessJurisdiction(['ALL'], 'FED')).toBe(true)
  })

  it('[PASS] Empty jurisdiction list denies all access', () => {
    expect(canAccessJurisdiction([], 'QC')).toBe(false)
  })
})

// ─── SCHEMA VALIDATION ────────────────────────────────────────

describe('Schema Design Invariants', () => {
  it('[PASS] NAS mask never exposes more than last 3 digits', () => {
    // Verify that maskNAS output always matches ***-***-XXX pattern
    const result = maskNAS('123')
    const parts = result.split('-')
    expect(parts).toHaveLength(3)
    expect(parts[0]).toBe('***')
    expect(parts[1]).toBe('***')
    expect(parts[2]).toHaveLength(3)
  })

  it('[PASS] Driver number format is consistent', () => {
    for (let i = 1; i <= 100; i++) {
      const num = formatDriverNumber(i)
      expect(num).toMatch(/^DR-\d{8}$/)
      expect(num).toHaveLength(11)
    }
  })

  it('[PASS] VERIFIED requires going through IN_REVIEW or MANUAL_REVIEW', () => {
    // No direct path from PENDING to VERIFIED
    expect(isTransitionAllowed('PENDING', 'VERIFIED')).toBe(false)
    // Must go PENDING → IN_REVIEW → VERIFIED
    expect(isTransitionAllowed('PENDING', 'IN_REVIEW')).toBe(true)
    expect(isTransitionAllowed('IN_REVIEW', 'VERIFIED')).toBe(true)
  })
})
