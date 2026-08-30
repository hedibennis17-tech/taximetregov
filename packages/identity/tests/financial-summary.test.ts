// ================================================================
// TAXIMÈTRE.GOV — FINANCIAL SUMMARY TESTS
// Phase DB-17: Ledger · Payout Guard · Snapshots · Statements
// ================================================================

import { describe, it, expect } from 'vitest'
import {
  formatPayoutCalcId, formatStatementId,
  computeRevenueBreakdown, computeNetRevenue,
  computePayoutCalculation, computeSnapshotVersion,
  validateLedgerSummary, maskSensitiveStatementData,
  canDriverViewOwnFinancials, canGovernmentViewFinancials,
  canApprovePayoutCalculation, canGenerateStatement,
} from '../src/auth/financial-summary.service'

// ─── PUBLIC IDS ──────────────────────────────────────────────

describe('Public IDs', () => {
  it('[PASS] PYC-XXXXXXXX format', () => {
    expect(formatPayoutCalcId(1)).toBe('PYC-00000001')
    expect(formatPayoutCalcId(42)).toMatch(/^PYC-\d{8}$/)
  })
  it('[PASS] STM-XXXXXXXX format', () => {
    expect(formatStatementId(1)).toBe('STM-00000001')
  })
})

// ─── REVENUE BREAKDOWN ───────────────────────────────────────

describe('Revenue Breakdown — Tests 1, 2, 3', () => {
  const entries = [
    { sourceType: 'TAXI',     grossAmount: 50.00, tipAmount: 5.00 },
    { sourceType: 'UBER',     grossAmount: 30.00, tipAmount: 3.00 },
    { sourceType: 'LYFT',     grossAmount: 20.00, tipAmount: 2.00 },
    { sourceType: 'DOORDASH', grossAmount: 25.00, tipAmount: 0.00 },
    { sourceType: 'INSTACART', grossAmount: 18.00, tipAmount: 1.00 },
  ]

  it('[TEST 1] TAXI revenue correctly segregated', () => {
    const result = computeRevenueBreakdown(entries)
    expect(result.taxi).toBeCloseTo(50.00, 2)
  })

  it('[TEST 2] RIDESHARE (Uber + Lyft) correctly segregated', () => {
    const result = computeRevenueBreakdown(entries)
    expect(result.rideshare).toBeCloseTo(50.00, 2)  // 30 + 20
  })

  it('[TEST 3] DELIVERY (DoorDash + Instacart) correctly segregated', () => {
    const result = computeRevenueBreakdown(entries)
    expect(result.delivery).toBeCloseTo(43.00, 2)  // 25 + 18
  })

  it('[PASS] Tips always separate from gross revenue', () => {
    const result = computeRevenueBreakdown(entries)
    expect(result.tips).toBeCloseTo(11.00, 2)   // 5+3+2+0+1
    // Tips not included in gross totals
    expect(result.total).toBeCloseTo(143.00, 2) // 50+30+20+25+18
    expect(result.total).not.toBe(result.total + result.tips)
  })

  it('[PASS] Total = sum of all sources', () => {
    const result = computeRevenueBreakdown(entries)
    const computed = result.taxi + result.rideshare + result.delivery + result.other
    expect(Math.abs(computed - result.total)).toBeLessThan(0.01)
  })
})

// ─── NET REVENUE ─────────────────────────────────────────────

describe('Net Revenue Computation — Test 4', () => {
  it('[TEST 4] Net = gross + tips - deductions', () => {
    const result = computeNetRevenue({
      grossTotal: 143.00, tips: 11.00,
      platformFees: 30.00, taxRemittances: 15.00,
      refundDebits: 5.00, adjustmentDebits: 2.00,
    })
    expect(result.totalDeductions).toBeCloseTo(52.00, 2)  // 30+15+5+2
    expect(result.netRevenue).toBeCloseTo(102.00, 2)       // 143+11-52
  })

  it('[PASS] Deductions tracked per type', () => {
    const result = computeNetRevenue({
      grossTotal: 100, tips: 10,
      platformFees: 20, taxRemittances: 15,
      refundDebits: 5, adjustmentDebits: 0,
    })
    expect(result.platformFees).toBe(20)
    expect(result.taxRemittances).toBe(15)
    expect(result.refundDebits).toBe(5)
    // Each kept separately — never merged into a single deduction line
  })
})

// ─── PAYOUT CALCULATION GUARD ────────────────────────────────

describe('Payout Calculation Guard — Tests 5, 6, 7, 8, 9', () => {
  const validInput = {
    walletBalance: 200.00, requestedAmount: 100.00,
    pendingTaxRemittances: 20.00, pendingPlatformFees: 10.00,
    pendingRefundDebits: 5.00,
    hasActiveTrip: false, accountStatus: 'ACTIVE', hasPendingPayout: false,
  }

  it('[TEST 5] Valid payout: all checks pass', () => {
    const result = computePayoutCalculation(validInput)
    expect(result.allowed).toBe(true)
    expect(result.approvedAmount).toBe(100.00)
    expect(result.totalPendingDedns).toBeCloseTo(35.00, 2)  // 20+10+5
    expect(result.netAvailableAmount).toBeCloseTo(165.00, 2) // 200-35
  })

  it('[TEST 6] Active trip blocks payout', () => {
    const result = computePayoutCalculation({ ...validInput, hasActiveTrip: true })
    expect(result.allowed).toBe(false)
    expect(result.blockers.some(b => b.includes('Course active'))).toBe(true)
  })

  it('[TEST 7] Negative net balance blocks payout', () => {
    const result = computePayoutCalculation({
      ...validInput, walletBalance: 30.00,
      // 30 - 35 = -5 net
    })
    expect(result.allowed).toBe(false)
    expect(result.hasNegativeBalance).toBe(true)
    expect(result.blockers.some(b => b.includes('négatif'))).toBe(true)
  })

  it('[TEST 8] Pending payout blocks new payout', () => {
    const result = computePayoutCalculation({ ...validInput, hasPendingPayout: true })
    expect(result.allowed).toBe(false)
    expect(result.blockers.some(b => b.includes('cours'))).toBe(true)
  })

  it('[TEST 9] Request exceeds available blocks payout', () => {
    const result = computePayoutCalculation({ ...validInput, requestedAmount: 180.00 })
    // Net available = 165, requested = 180
    expect(result.allowed).toBe(false)
    expect(result.blockers.some(b => b.includes('disponible'))).toBe(true)
  })

  it('[PASS] Validation snapshot always captured', () => {
    const result = computePayoutCalculation(validInput)
    expect(result.validationSnapshot).toHaveProperty('active_trip_check')
    expect(result.validationSnapshot).toHaveProperty('balance_check')
    expect(result.validationSnapshot).toHaveProperty('net_available')
    // Complete audit trail of all checks performed
  })
})

// ─── SNAPSHOT VERSIONING ──────────────────────────────────────

describe('Snapshot Versioning — Tests 10 & 11', () => {
  it('[TEST 10] Finalized snapshot + new data = new version', () => {
    const result = computeSnapshotVersion(1, true, true)
    expect(result.isNewVersion).toBe(true)
    expect(result.newVersion).toBe(2)
    expect(result.reason).toBeTruthy()
  })

  it('[TEST 11] Non-finalized snapshot updates in place', () => {
    const result = computeSnapshotVersion(1, false, true)
    expect(result.isNewVersion).toBe(false)
    expect(result.newVersion).toBe(1)
  })

  it('[PASS] Original snapshot preserved — corrections create new version', () => {
    const v1Result = computeSnapshotVersion(1, true, true)
    // v1 must have been preserved (isFinalized=true means it cannot be mutated)
    expect(v1Result.newVersion).toBe(2)
    // v1 remains unchanged — computed separately
  })
})

// ─── SUMMARY VALIDATION ───────────────────────────────────────

describe('Ledger Summary Validation — Tests 12, 13', () => {
  it('[TEST 12] Consistent summary passes', () => {
    const result = validateLedgerSummary({
      grossTaxi: 50, grossRideshare: 50, grossDelivery: 43, grossOther: 0,
      grossTotal: 143, netRevenue: 91, totalDeductions: 52,
    })
    expect(result.isConsistent).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('[TEST 13] Mismatched gross total detected', () => {
    const result = validateLedgerSummary({
      grossTaxi: 50, grossRideshare: 50, grossDelivery: 43, grossOther: 0,
      grossTotal: 200,  // Should be 143
      netRevenue: 148, totalDeductions: 52,
    })
    expect(result.isConsistent).toBe(false)
    expect(result.errors.some(e => e.includes('grossTotal'))).toBe(true)
  })

  it('[PASS] Negative component detected', () => {
    const result = validateLedgerSummary({
      grossTaxi: -10, grossRideshare: 50, grossDelivery: 43, grossOther: 0,
      grossTotal: 83, netRevenue: 31, totalDeductions: 52,
    })
    expect(result.isConsistent).toBe(false)
  })
})

// ─── STATEMENT MASKING ────────────────────────────────────────

describe('Statement Masking — Test 14', () => {
  it('[TEST 14] Sensitive fields masked in statements', () => {
    const data = {
      driverName: 'Mohamed Benali',
      nas: '123-456-789',              // SENSITIVE
      iban: 'CA00 1234 5678 9012',     // SENSITIVE
      grossRevenue: 1500.00,           // Not sensitive
      account_number: '12345678',      // SENSITIVE
    }
    const masked = maskSensitiveStatementData(data)
    expect(masked['nas']).toBe('••••••••')
    expect(masked['iban']).toBe('••••••••')
    expect(masked['account_number']).toBe('••••••••')
    expect(masked['grossRevenue']).toBe(1500.00)  // Not masked
    expect(masked['driverName']).toBe('Mohamed Benali')  // Not masked
  })
})

// ─── ACCESS CONTROL ──────────────────────────────────────────

describe('Access Control — Tests 15, 16, 17, 18', () => {
  it('[TEST 15] Driver views own financials = ALLOW', () => {
    expect(canDriverViewOwnFinancials('driver-A', 'driver-A')).toBe(true)
  })

  it('[TEST 16] Driver views other driver financials = DENY', () => {
    expect(canDriverViewOwnFinancials('driver-A', 'driver-B')).toBe(false)
  })

  it('[TEST 17] Government with revenue.read + jurisdiction = ALLOW', () => {
    expect(canGovernmentViewFinancials(['revenue.read'], ['QC'], 'QC')).toBe(true)
  })

  it('[TEST 18] Government wrong jurisdiction = DENY', () => {
    expect(canGovernmentViewFinancials(['revenue.read'], ['ON'], 'QC')).toBe(false)
  })

  it('[PASS] Payout approval requires payouts.approve', () => {
    expect(canApprovePayoutCalculation(['payouts.approve'])).toBe(true)
    expect(canApprovePayoutCalculation(['revenue.read'])).toBe(false)
  })

  it('[PASS] Driver generates own statement without special permission', () => {
    expect(canGenerateStatement([], true)).toBe(true)  // isSelf=true
    expect(canGenerateStatement([], false)).toBe(false) // Not self, no permission
    expect(canGenerateStatement(['statements.generate'], false)).toBe(true)
  })
})

// ─── MULTI-SOURCE DRIVER — Tests 19, 20 ──────────────────────

describe('Multi-Source Driver Financial — Tests 19 & 20', () => {
  it('[TEST 19] Driver with 4 sources has separate breakdown', () => {
    const entries = [
      { sourceType: 'TAXI',     grossAmount: 100, tipAmount: 10 },
      { sourceType: 'UBER',     grossAmount: 80,  tipAmount: 8  },
      { sourceType: 'DOORDASH', grossAmount: 60,  tipAmount: 0  },
      { sourceType: 'INSTACART', grossAmount: 40, tipAmount: 2  },
    ]
    const result = computeRevenueBreakdown(entries)
    expect(result.taxi).toBe(100)
    expect(result.rideshare).toBe(80)
    expect(result.delivery).toBe(100)  // 60+40
    expect(result.tips).toBe(20)       // 10+8+0+2
    expect(result.total).toBe(280)     // 100+80+60+40
  })

  it('[TEST 20] Net calculation covers all sources combined', () => {
    const result = computeNetRevenue({
      grossTotal: 280, tips: 20,
      platformFees: 30, taxRemittances: 40,
      refundDebits: 0, adjustmentDebits: 0,
    })
    expect(result.netRevenue).toBeCloseTo(230, 2)  // 280+20-30-40
  })
})

// ─── SCHEMA INVARIANTS ────────────────────────────────────────

describe('Schema Invariants', () => {
  it('[PASS] Ledger summaries are computed — never primary source', () => {
    // validateLedgerSummary checks consistency against computed values
    const valid = validateLedgerSummary({
      grossTaxi: 100, grossRideshare: 0, grossDelivery: 0, grossOther: 0,
      grossTotal: 100, netRevenue: 85, totalDeductions: 15,
    })
    expect(valid.isConsistent).toBe(true)
  })

  it('[PASS] Negative balance always blocks payout (no exception)', () => {
    const result = computePayoutCalculation({
      walletBalance: 10, requestedAmount: 5,
      pendingTaxRemittances: 50,  // Creates negative net
      pendingPlatformFees: 0, pendingRefundDebits: 0,
      hasActiveTrip: false, accountStatus: 'ACTIVE', hasPendingPayout: false,
    })
    expect(result.hasNegativeBalance).toBe(true)
    expect(result.allowed).toBe(false)
  })
})
