// ================================================================
// TAXIMÈTRE.GOV — VEHICLE UNIT TESTS
// Phase DB-3: Véhicules, permis & licences
// ================================================================

import { describe, it, expect } from 'vitest'
import {
  formatVehicleNumber,
  parseVehicleNumber,
  maskLicensePlate,
  maskLicenseNumber,
  maskPermitNumber,
  maskPolicyNumber,
  maskVin,
  calculateExpiryStatus,
  checkTaxiEligibility,
  checkRideshareEligibility,
  checkDeliveryEligibility,
  isTaximeterEnabledForService,
  isTaximeterOperational,
  getTaximeterWarning,
  getVehicleAgeYears,
  isVehicleAgeValid,
  validateInsuranceForService,
  calculateVehicleCompleteness,
  EXPIRY_THRESHOLDS_DAYS,
  type VehicleEligibilityCheck,
} from '../src/auth/vehicle.service'

// ─── VEHICLE NUMBER ───────────────────────────────────────────

describe('Vehicle Number', () => {
  it('[PASS] Formats V-QC-XXXXXX correctly', () => {
    expect(formatVehicleNumber('QC', 1)).toBe('V-QC-000001')
    expect(formatVehicleNumber('QC', 1234)).toBe('V-QC-001234')
    expect(formatVehicleNumber('on', 9999)).toBe('V-ON-009999')
  })

  it('[PASS] Parses valid vehicle number', () => {
    expect(parseVehicleNumber('V-QC-001234')).toEqual({ region: 'QC', sequence: 1234 })
  })

  it('[PASS] Returns null for invalid format', () => {
    expect(parseVehicleNumber('invalid')).toBeNull()
    expect(parseVehicleNumber('V-QC-12')).toBeNull()
    expect(parseVehicleNumber('')).toBeNull()
  })

  it('[PASS] Format and parse are reversible', () => {
    const seq = 5678
    const parsed = parseVehicleNumber(formatVehicleNumber('QC', seq))
    expect(parsed?.sequence).toBe(seq)
  })
})

// ─── MASKING ─────────────────────────────────────────────────

describe('Sensitive Data Masking', () => {
  it('[PASS] License plate shows only last 2 chars', () => {
    const masked = maskLicensePlate('ABC1234', 'QC')
    expect(masked).toBe('••••34')
    expect(masked).not.toContain('ABC')
    expect(masked).not.toContain('12')
  })

  it('[PASS] Driver license masked as M••••••XXXX', () => {
    expect(maskLicenseNumber('1234')).toBe('M••••••1234')
  })

  it('[PASS] Invalid license last four returns fully masked', () => {
    expect(maskLicenseNumber('ab')).toBe('M••••••••')
    expect(maskLicenseNumber('')).toBe('M••••••••')
  })

  it('[PASS] Permit number masked as TP-••••••XX', () => {
    expect(maskPermitNumber('78')).toBe('TP-••••••78')
  })

  it('[PASS] Invalid permit last two returns fully masked', () => {
    expect(maskPermitNumber('x')).toBe('TP-••••••••')
    expect(maskPermitNumber('')).toBe('TP-••••••••')
  })

  it('[PASS] Policy number masked as POL-••••••XX', () => {
    expect(maskPolicyNumber('89')).toBe('POL-••••••89')
  })

  it('[PASS] VIN is ALWAYS fully masked — no partial display', () => {
    const masked = maskVin()
    expect(masked).toBe('••••••••••••••••')
    expect(masked).toHaveLength(16)
  })

  it('[PASS] No masking function reveals real data', () => {
    const plate = 'ABC1234QC'
    expect(maskLicensePlate(plate)).not.toContain('ABC')
    expect(maskLicensePlate(plate)).not.toContain('ABC1234')
  })
})

// ─── EXPIRY STATUS ────────────────────────────────────────────

describe('Expiry Status Calculation', () => {
  function futureDate(days: number): string {
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d.toISOString().split('T')[0]!
  }

  function pastDate(days: number): string {
    return futureDate(-days)
  }

  it('[PASS] Future date (100 days) is VALID', () => {
    const { status, daysRemaining } = calculateExpiryStatus(futureDate(100))
    expect(status).toBe('VALID')
    expect(daysRemaining).toBeGreaterThan(EXPIRY_THRESHOLDS_DAYS.UPCOMING)
  })

  it('[PASS] 80 days remaining is EXPIRING_UPCOMING', () => {
    const { status } = calculateExpiryStatus(futureDate(80))
    expect(status).toBe('EXPIRING_UPCOMING')
  })

  it('[PASS] 45 days remaining is EXPIRING_NOTICE', () => {
    const { status } = calculateExpiryStatus(futureDate(45))
    expect(status).toBe('EXPIRING_NOTICE')
  })

  it('[PASS] 15 days remaining is EXPIRING_WARNING', () => {
    const { status } = calculateExpiryStatus(futureDate(15))
    expect(status).toBe('EXPIRING_WARNING')
  })

  it('[PASS] 3 days remaining is EXPIRING_CRITICAL', () => {
    const { status, daysRemaining } = calculateExpiryStatus(futureDate(3))
    expect(status).toBe('EXPIRING_CRITICAL')
    expect(daysRemaining).toBeLessThanOrEqual(EXPIRY_THRESHOLDS_DAYS.CRITICAL)
  })

  it('[PASS] Past date is EXPIRED', () => {
    const { status, daysRemaining } = calculateExpiryStatus(pastDate(5))
    expect(status).toBe('EXPIRED')
    expect(daysRemaining).toBeLessThan(0)
  })
})

// ─── SERVICE ELIGIBILITY ──────────────────────────────────────

const fullyEligibleForTaxi: VehicleEligibilityCheck = {
  vehicleStatus:        'ACTIVE',
  hasValidLicense:      true,
  hasValidPermit:       true,
  hasValidInsurance:    true,
  insuranceIsCommercial: true,
  hasValidInspection:   true,
  taximeterStatus:      'CERTIFIED',
  serviceAuth:          'AUTHORIZED',
}

describe('Taxi Eligibility', () => {
  it('[PASS] All conditions met = can operate', () => {
    const result = checkTaxiEligibility(fullyEligibleForTaxi)
    expect(result.canOperate).toBe(true)
    expect(result.blockers).toHaveLength(0)
  })

  it('[PASS] Inactive vehicle blocks operation', () => {
    const result = checkTaxiEligibility({ ...fullyEligibleForTaxi, vehicleStatus: 'SUSPENDED' })
    expect(result.canOperate).toBe(false)
    expect(result.blockers.some(b => b.includes('non actif'))).toBe(true)
  })

  it('[PASS] No taxi permit blocks operation', () => {
    const result = checkTaxiEligibility({ ...fullyEligibleForTaxi, hasValidPermit: false })
    expect(result.canOperate).toBe(false)
    expect(result.blockers.some(b => b.includes('Permis taxi'))).toBe(true)
  })

  it('[PASS] Personal insurance blocks TAXI (not commercial)', () => {
    const result = checkTaxiEligibility({
      ...fullyEligibleForTaxi,
      insuranceIsCommercial: false,
    })
    expect(result.canOperate).toBe(false)
    expect(result.blockers.some(b => b.includes('commerciale'))).toBe(true)
  })

  it('[PASS] No insurance blocks operation', () => {
    const result = checkTaxiEligibility({ ...fullyEligibleForTaxi, hasValidInsurance: false })
    expect(result.canOperate).toBe(false)
  })

  it('[PASS] Taximeter not installed blocks TAXI', () => {
    const result = checkTaxiEligibility({ ...fullyEligibleForTaxi, taximeterStatus: 'NOT_INSTALLED' })
    expect(result.canOperate).toBe(false)
    expect(result.blockers.some(b => b.includes('Taximètre non installé'))).toBe(true)
  })

  it('[PASS] Uncertified taximeter generates warning but not blocker (pilot)', () => {
    const result = checkTaxiEligibility({
      ...fullyEligibleForTaxi,
      taximeterStatus: 'INSTALLED_NOT_CERTIFIED',
    })
    expect(result.canOperate).toBe(true)
    expect(result.warnings.some(w => w.includes('pilote'))).toBe(true)
  })

  it('[PASS] Suspended service auth blocks TAXI', () => {
    const result = checkTaxiEligibility({ ...fullyEligibleForTaxi, serviceAuth: 'SUSPENDED' })
    expect(result.canOperate).toBe(false)
  })
})

describe('Rideshare Eligibility', () => {
  it('[PASS] Does not require taxi permit', () => {
    const result = checkRideshareEligibility({
      ...fullyEligibleForTaxi,
      hasValidPermit: false,
      serviceAuth: 'AUTHORIZED',
    })
    expect(result.canOperate).toBe(true)
  })

  it('[PASS] Personal insurance generates warning (not blocker) for rideshare', () => {
    const result = checkRideshareEligibility({
      ...fullyEligibleForTaxi,
      insuranceIsCommercial: false,
      serviceAuth: 'AUTHORIZED',
    })
    expect(result.canOperate).toBe(true)
    expect(result.warnings.some(w => w.includes('recommandée'))).toBe(true)
  })
})

describe('Delivery Eligibility', () => {
  it('[PASS] Active vehicle with authorization = can operate', () => {
    const result = checkDeliveryEligibility({
      ...fullyEligibleForTaxi,
      serviceAuth: 'AUTHORIZED',
    })
    expect(result.canOperate).toBe(true)
  })

  it('[PASS] Blocked delivery auth = cannot operate', () => {
    const result = checkDeliveryEligibility({ ...fullyEligibleForTaxi, serviceAuth: 'BLOCKED' })
    expect(result.canOperate).toBe(false)
  })
})

// ─── TAXIMETER RULES ──────────────────────────────────────────

describe('Taximeter Service Rules — Absolutes', () => {
  it('[PASS] TAXI = taximeter ENABLED', () => {
    expect(isTaximeterEnabledForService('TAXI')).toBe(true)
  })

  it('[PASS] RIDESHARE = taximeter DISABLED (Provider Final Fare)', () => {
    expect(isTaximeterEnabledForService('RIDESHARE')).toBe(false)
  })

  it('[PASS] DELIVERY = taximeter ALWAYS DISABLED', () => {
    expect(isTaximeterEnabledForService('DELIVERY')).toBe(false)
  })

  it('[PASS] PERSONAL = taximeter DISABLED', () => {
    expect(isTaximeterEnabledForService('PERSONAL')).toBe(false)
  })

  it('[PASS] CERTIFIED taximeter is operational', () => {
    expect(isTaximeterOperational('CERTIFIED')).toBe(true)
  })

  it('[PASS] INSTALLED_NOT_CERTIFIED is operational (pilot warning)', () => {
    expect(isTaximeterOperational('INSTALLED_NOT_CERTIFIED')).toBe(true)
    expect(getTaximeterWarning('INSTALLED_NOT_CERTIFIED')).toMatch(/pilote/i)
  })

  it('[PASS] NOT_INSTALLED is not operational', () => {
    expect(isTaximeterOperational('NOT_INSTALLED')).toBe(false)
  })

  it('[PASS] DECOMMISSIONED is not operational', () => {
    expect(isTaximeterOperational('DECOMMISSIONED')).toBe(false)
  })

  it('[PASS] CERTIFIED has no warning', () => {
    expect(getTaximeterWarning('CERTIFIED')).toBeNull()
  })
})

// ─── VEHICLE AGE ──────────────────────────────────────────────

describe('Vehicle Age Validation', () => {
  const currentYear = new Date().getFullYear()

  it('[PASS] New vehicle is valid for taxi', () => {
    expect(isVehicleAgeValid(currentYear, 'TAXI')).toBe(true)
  })

  it('[PASS] 6-year-old vehicle is valid for taxi (under 7-year limit)', () => {
    expect(isVehicleAgeValid(currentYear - 6, 'TAXI')).toBe(true)
  })

  it('[PASS] 8-year-old vehicle is NOT valid for taxi (over 7-year limit)', () => {
    expect(isVehicleAgeValid(currentYear - 8, 'TAXI')).toBe(false)
  })

  it('[PASS] Old vehicle can do rideshare (no age limit)', () => {
    expect(isVehicleAgeValid(currentYear - 15, 'RIDESHARE')).toBe(true)
  })

  it('[PASS] Age limit is configurable (not hardcoded in data)', () => {
    // 5-year limit
    expect(isVehicleAgeValid(currentYear - 6, 'TAXI', 5)).toBe(false)
    // 10-year limit
    expect(isVehicleAgeValid(currentYear - 8, 'TAXI', 10)).toBe(true)
  })
})

// ─── INSURANCE VALIDATION ────────────────────────────────────

describe('Insurance Validation', () => {
  it('[PASS] Commercial insurance is valid for TAXI', () => {
    const result = validateInsuranceForService(true, 'TAXI')
    expect(result.valid).toBe(true)
    expect(result.reason).toBeNull()
  })

  it('[PASS] Personal insurance is INVALID for TAXI', () => {
    const result = validateInsuranceForService(false, 'TAXI')
    expect(result.valid).toBe(false)
    expect(result.reason).toMatch(/commerciale/i)
  })

  it('[PASS] Personal insurance is valid for RIDESHARE', () => {
    const result = validateInsuranceForService(false, 'RIDESHARE')
    expect(result.valid).toBe(true)
  })

  it('[PASS] Personal insurance is valid for DELIVERY', () => {
    const result = validateInsuranceForService(false, 'DELIVERY')
    expect(result.valid).toBe(true)
  })
})

// ─── VEHICLE COMPLETENESS ─────────────────────────────────────

describe('Vehicle Completeness Score', () => {
  it('[PASS] Fully equipped vehicle scores 100%', () => {
    const result = calculateVehicleCompleteness({
      hasLicense: true, hasPermit: true, hasInsurance: true,
      insuranceCommercial: true, hasInspection: true,
      taximeterInstalled: true, vehicleVerified: true,
    })
    expect(result.score).toBe(100)
    expect(result.readyForTaxi).toBe(true)
    expect(result.readyForRideshare).toBe(true)
    expect(result.readyForDelivery).toBe(true)
    expect(result.missingItems).toHaveLength(0)
  })

  it('[PASS] Missing taximeter fails readyForTaxi', () => {
    const result = calculateVehicleCompleteness({
      hasLicense: true, hasPermit: true, hasInsurance: true,
      insuranceCommercial: true, hasInspection: true,
      taximeterInstalled: false, vehicleVerified: true,
    })
    expect(result.readyForTaxi).toBe(false)
    expect(result.missingItems).toContain('Taximètre installé')
  })

  it('[PASS] Delivery only requires verified vehicle', () => {
    const result = calculateVehicleCompleteness({
      hasLicense: false, hasPermit: false, hasInsurance: false,
      insuranceCommercial: false, hasInspection: false,
      taximeterInstalled: false, vehicleVerified: true,
    })
    expect(result.readyForDelivery).toBe(true)
  })

  it('[PASS] Empty vehicle scores 0%', () => {
    const result = calculateVehicleCompleteness({
      hasLicense: false, hasPermit: false, hasInsurance: false,
      insuranceCommercial: false, hasInspection: false,
      taximeterInstalled: false, vehicleVerified: false,
    })
    expect(result.score).toBe(0)
    expect(result.readyForTaxi).toBe(false)
    expect(result.readyForRideshare).toBe(false)
    expect(result.readyForDelivery).toBe(false)
  })
})

// ─── SCHEMA INVARIANTS ────────────────────────────────────────

describe('Schema Invariants', () => {
  it('[PASS] VIN is always fully masked — never partial', () => {
    // VIN must never be partially exposed
    const masked = maskVin()
    expect(masked.includes('•')).toBe(true)
    expect(/[A-Z0-9]/.test(masked)).toBe(false)
  })

  it('[PASS] All masking functions hide sensitive data', () => {
    const plate = 'ABCD1234'
    const masked = maskLicensePlate(plate)
    expect(masked).not.toContain('ABCD')
    expect(masked).not.toContain('ABC')
  })

  it('[PASS] Taximeter rule is binary — TAXI=true, everything else=false', () => {
    const services = ['TAXI', 'RIDESHARE', 'DELIVERY', 'PERSONAL', 'OTHER']
    services.forEach(svc => {
      const enabled = isTaximeterEnabledForService(svc)
      if (svc === 'TAXI') expect(enabled).toBe(true)
      else expect(enabled).toBe(false)
    })
  })

  it('[PASS] Commercial insurance required for TAXI is enforced', () => {
    // Personal + TAXI = invalid — no exception
    const result = validateInsuranceForService(false, 'TAXI')
    expect(result.valid).toBe(false)
  })
})
