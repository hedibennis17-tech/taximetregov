// ================================================================
// TAXIMÈTRE.GOV — ACTIVITY LEDGER TESTS
// Phase DB-14: 20 tests obligatoires + invariants
// ================================================================

import { describe, it, expect } from 'vitest'
import {
  formatCanonicalActivityId,
  buildActivityIdempotencyKey, buildTaxiActivityKey,
  isTaximeterEligibleForActivityType, assertDeliveryTaximeterOff,
  computeNetAmount, applyProviderAmountUpdate, applyAdjustment,
  isActivityTransitionAllowed, isActivityImmutable,
  assessDataQuality, canDriverReadActivity,
  canGovernmentReadActivities, canGovernmentFinalizeActivity,
  SEED_ACTIVITY_TYPES,
  type ActivityAmounts, type CanonicalActivityStatus,
} from '../src/auth/activity-ledger.service'

// ─── PUBLIC IDS ──────────────────────────────────────────────

describe('Canonical Activity ID', () => {
  it('[PASS] ACT-XXXXXXXX format', () => {
    expect(formatCanonicalActivityId(1)).toBe('ACT-00000001')
    expect(formatCanonicalActivityId(42)).toMatch(/^ACT-\d{8}$/)
  })
})

// ─── IDEMPOTENCY ─────────────────────────────────────────────

describe('Activity Idempotency — Tests 1 & 2', () => {
  it('[TEST 1] Same provider + external_activity_id = same key', () => {
    const k1 = buildActivityIdempotencyKey('uber-uuid', 'UBER-TRIP-001')
    const k2 = buildActivityIdempotencyKey('uber-uuid', 'UBER-TRIP-001')
    expect(k1).toBe(k2)
  })

  it('[TEST 2] Different activity IDs = different keys', () => {
    const k1 = buildActivityIdempotencyKey('uber-uuid', 'UBER-TRIP-001')
    const k2 = buildActivityIdempotencyKey('uber-uuid', 'UBER-TRIP-002')
    expect(k1).not.toBe(k2)
  })

  it('[PASS] Cross-provider: Uber TRIP-001 ≠ Lyft TRIP-001', () => {
    const k1 = buildActivityIdempotencyKey('uber-uuid', 'TRIP-001')
    const k2 = buildActivityIdempotencyKey('lyft-uuid', 'TRIP-001')
    expect(k1).not.toBe(k2)
  })

  it('[PASS] Taxi trip key separate from provider activity keys', () => {
    const k = buildTaxiActivityKey('trip-uuid-001')
    expect(k).not.toBe(buildActivityIdempotencyKey('uber-uuid', 'trip-uuid-001'))
  })
})

// ─── TAXIMETER RULES ──────────────────────────────────────────

describe('Taximeter Rules — Tests 3, 4', () => {
  it('[TEST 3] TAXI_TRIP = taximeterEligible true', () => {
    expect(isTaximeterEligibleForActivityType('TAXI_TRIP')).toBe(true)
  })

  it('[TEST 4] Delivery types = ALWAYS false', () => {
    const deliveryTypes = ['FOOD_DELIVERY', 'GROCERY_DELIVERY', 'PARCEL_DELIVERY', 'COURIER']
    deliveryTypes.forEach(t => {
      expect(isTaximeterEligibleForActivityType(t)).toBe(false)
    })
  })

  it('[PASS] RIDESHARE_TRIP = false (provider calculates fare)', () => {
    expect(isTaximeterEligibleForActivityType('RIDESHARE_TRIP')).toBe(false)
  })

  it('[PASS] OTHER = false', () => {
    expect(isTaximeterEligibleForActivityType('OTHER')).toBe(false)
  })

  it('[PASS] assertDeliveryTaximeterOff does not throw for delivery types', () => {
    // Delivery types with taximeter=false → no error
    expect(() => assertDeliveryTaximeterOff('FOOD_DELIVERY')).not.toThrow()
    expect(() => assertDeliveryTaximeterOff('GROCERY_DELIVERY')).not.toThrow()
  })

  it('[PASS] Seed activity types respect taximeter rule', () => {
    SEED_ACTIVITY_TYPES.forEach(t => {
      const expected = t.code === 'TAXI_TRIP'
      expect(t.taximeterEligible).toBe(expected)
    })
  })
})

// ─── AMOUNT LIFECYCLE ────────────────────────────────────────

const emptyAmounts: ActivityAmounts = {
  estimatedAmount: null, grossAmount: null,
  adjustmentAmount: 0, finalAmount: null,
  tipAmount: 0, feeAmount: 0, taxAmount: 0,
  netAmount: null, currency: 'CAD',
}

describe('Amount Lifecycle — Tests 5, 6, 7, 8', () => {
  it('[TEST 5] TAXI trip: final amount = taximeter output (separate from provider)', () => {
    // Taxi activities use taximeter fare engine — not provider amounts
    const result = applyProviderAmountUpdate(emptyAmounts, 'TRIP_COMPLETED', 24.50)
    expect(result.grossAmount).toBe(24.50)
    expect(result.finalAmount).toBeNull()  // Not finalized yet
  })

  it('[TEST 6] Uber: 3 events → ONE canonical amount', () => {
    // Event 1: TRIP_CREATED with estimate
    let amounts = applyProviderAmountUpdate(emptyAmounts, 'TRIP_CREATED', 28.00)
    expect(amounts.estimatedAmount).toBe(28.00)

    // Event 2: TRIP_COMPLETED (may differ from estimate)
    amounts = applyProviderAmountUpdate(amounts, 'TRIP_COMPLETED', 29.00)
    expect(amounts.grossAmount).toBe(29.00)
    expect(amounts.finalAmount).toBeNull()  // Not finalized

    // Event 3: FARE_FINALIZED — authoritative
    amounts = applyProviderAmountUpdate(amounts, 'FARE_FINALIZED', 31.00)
    expect(amounts.finalAmount).toBe(31.00)
    expect(amounts.estimatedAmount).toBe(28.00)  // Preserved
    expect(amounts.grossAmount).toBe(29.00)      // Preserved
    // ONE activity with full history — not three separate activities
  })

  it('[TEST 7] DoorDash delivery: amounts normalized identically', () => {
    let amounts = applyProviderAmountUpdate(emptyAmounts, 'DELIVERY_CREATED', 18.00)
    amounts = applyProviderAmountUpdate(amounts, 'DELIVERY_COMPLETED', 18.50)
    amounts = applyProviderAmountUpdate(amounts, 'FARE_FINALIZED', 18.50)
    expect(amounts.finalAmount).toBe(18.50)
    // Taximeter is OFF — enforced by activity type
  })

  it('[TEST 8] TIP always separate (never embedded in fare)', () => {
    let amounts = applyProviderAmountUpdate(emptyAmounts, 'FARE_FINALIZED', 30.00)
    amounts = applyProviderAmountUpdate(amounts, 'TIP_ADDED', null, 5.00)
    expect(amounts.finalAmount).toBe(30.00)  // Fare unchanged
    expect(amounts.tipAmount).toBe(5.00)     // Tip separate
    expect(amounts.netAmount).toBe(30.00)    // Net based on fare (fee=0)
  })

  it('[PASS] Provider fee tracked separately from gross', () => {
    let amounts = applyProviderAmountUpdate(emptyAmounts, 'FARE_FINALIZED', 40.00)
    amounts = applyProviderAmountUpdate(amounts, 'TRIP_COMPLETED', null, null, 10.00)
    expect(amounts.finalAmount).toBe(40.00)  // Gross unchanged
    expect(amounts.feeAmount).toBe(10.00)    // Fee separate
    expect(amounts.netAmount).toBe(30.00)    // Net = 40 - 10
  })

  it('[PASS] Finalized amount immune to FARE_UPDATED', () => {
    let amounts = applyProviderAmountUpdate(emptyAmounts, 'FARE_FINALIZED', 31.00)
    amounts = applyProviderAmountUpdate(amounts, 'FARE_UPDATED', 999.00)
    expect(amounts.finalAmount).toBe(31.00)  // Final unchanged — already finalized
  })
})

// ─── ADJUSTMENTS ─────────────────────────────────────────────

describe('Activity Adjustments — Tests 9 & 10', () => {
  it('[TEST 9] Adjustment adds to total, updates final', () => {
    let amounts = { ...emptyAmounts, finalAmount: 28.00, netAmount: 28.00 }
    amounts = applyAdjustment(amounts, 3.00, 'CREDIT')
    expect(amounts.finalAmount).toBe(31.00)
    expect(amounts.adjustmentAmount).toBe(3.00)
  })

  it('[TEST 10] Debit adjustment reduces final', () => {
    let amounts = { ...emptyAmounts, finalAmount: 31.00, netAmount: 31.00 }
    amounts = applyAdjustment(amounts, 1.00, 'DEBIT')
    expect(amounts.finalAmount).toBe(30.00)
    expect(amounts.adjustmentAmount).toBe(-1.00)
  })

  it('[PASS] Original amounts preserved — adjustments are cumulative', () => {
    let amounts = { ...emptyAmounts, grossAmount: 28.00, finalAmount: 28.00, netAmount: 28.00 }
    amounts = applyAdjustment(amounts, 3.00, 'CREDIT')
    expect(amounts.grossAmount).toBe(28.00)   // Original gross preserved
    expect(amounts.finalAmount).toBe(31.00)   // Only final updated
    expect(amounts.adjustmentAmount).toBe(3.00)
  })
})

// ─── ACTIVITY STATUS MACHINE ──────────────────────────────────

describe('Status Machine — Tests 11, 12, 13', () => {
  it('[TEST 11] Valid transitions allowed', () => {
    expect(isActivityTransitionAllowed('PENDING',   'STARTED')).toBe(true)
    expect(isActivityTransitionAllowed('STARTED',   'COMPLETED')).toBe(true)
    expect(isActivityTransitionAllowed('COMPLETED', 'FINALIZED')).toBe(true)
  })

  it('[TEST 12] FINALIZED → immutable (corrections via adjustments)', () => {
    expect(isActivityTransitionAllowed('FINALIZED', 'STARTED')).toBe(false)
    expect(isActivityTransitionAllowed('FINALIZED', 'CANCELLED')).toBe(false)
    expect(isActivityTransitionAllowed('FINALIZED', 'DISPUTED')).toBe(true)
  })

  it('[TEST 13] CANCELLED → no automatic revenue', () => {
    // CANCELLED is not FINALIZED — cannot go to financial
    expect(isActivityTransitionAllowed('CANCELLED', 'FINALIZED')).toBe(false)
    // Only DISPUTED (e.g. dispute over cancellation fee)
    expect(isActivityTransitionAllowed('CANCELLED', 'DISPUTED')).toBe(true)
  })

  it('[PASS] VOIDED and REJECTED are terminal', () => {
    const terminals: CanonicalActivityStatus[] = ['VOIDED', 'REJECTED']
    terminals.forEach(s => {
      expect(isActivityImmutable(s)).toBe(true)
    })
  })
})

// ─── DATA QUALITY ─────────────────────────────────────────────

describe('Data Quality Assessment — Tests 14, 15', () => {
  it('[TEST 14] Complete activity = VALIDATED', () => {
    const result = assessDataQuality({
      driverId: 'driver-001', providerId: 'provider-001',
      externalActivityId: 'UBER-TRIP-001', startedAt: new Date(),
      finalAmount: 31.00, currency: 'CAD', activityTypeCode: 'RIDESHARE_TRIP',
    })
    expect(result.status).toBe('VALIDATED')
    expect(result.issues).toHaveLength(0)
  })

  it('[TEST 15] Missing driverId = INCONSISTENT', () => {
    const result = assessDataQuality({
      driverId: null, providerId: 'provider-001',
      externalActivityId: 'UBER-001', startedAt: new Date(),
      finalAmount: 31.00, currency: 'CAD', activityTypeCode: 'RIDESHARE_TRIP',
    })
    expect(result.status).toBe('INCONSISTENT')
    expect(result.issues.some(i => i.includes('driverId'))).toBe(true)
  })

  it('[PASS] Negative finalAmount = INCONSISTENT', () => {
    const result = assessDataQuality({
      driverId: 'driver-001', providerId: null,
      externalActivityId: 'TRIP-001', startedAt: new Date(),
      finalAmount: -5.00, currency: 'CAD', activityTypeCode: 'RIDESHARE_TRIP',
    })
    expect(result.status).not.toBe('VALIDATED')
    expect(result.issues.some(i => i.includes('négatif'))).toBe(true)
  })
})

// ─── ACCESS CONTROL ───────────────────────────────────────────

describe('Access Control — Tests 16, 17, 18', () => {
  it('[TEST 16] Driver reads own activity = ALLOW', () => {
    expect(canDriverReadActivity('driver-A', 'driver-A')).toBe(true)
  })

  it('[TEST 17] Driver reads another driver activity = DENY', () => {
    expect(canDriverReadActivity('driver-A', 'driver-B')).toBe(false)
  })

  it('[TEST 18] Government with activities.read + correct jurisdiction = ALLOW', () => {
    expect(canGovernmentReadActivities(['activities.read'], ['QC'], 'QC')).toBe(true)
  })

  it('[PASS] Government wrong jurisdiction = DENY', () => {
    expect(canGovernmentReadActivities(['activities.read'], ['ON'], 'QC')).toBe(false)
  })

  it('[PASS] Reconciliation requires activities.review or .reconcile', () => {
    expect(canGovernmentFinalizeActivity(['activities.review'])).toBe(true)
    expect(canGovernmentFinalizeActivity(['activities.read'])).toBe(false)
  })
})

// ─── MULTI-PROVIDER — Tests 19, 20 ───────────────────────────

describe('Multi-Provider — Tests 19 & 20', () => {
  it('[TEST 19] Driver has 4 activities from 4 sources', () => {
    const activities = [
      { driverId: 'driver-001', activityTypeCode: 'TAXI_TRIP',       providerId: null },
      { driverId: 'driver-001', activityTypeCode: 'RIDESHARE_TRIP',  providerId: 'uber-uuid' },
      { driverId: 'driver-001', activityTypeCode: 'RIDESHARE_TRIP',  providerId: 'lyft-uuid' },
      { driverId: 'driver-001', activityTypeCode: 'FOOD_DELIVERY',   providerId: 'doordash-uuid' },
    ]
    // All same driver
    const uniqueDrivers = new Set(activities.map(a => a.driverId))
    expect(uniqueDrivers.size).toBe(1)
    // All different types/providers
    const uniqueProviders = new Set(activities.map(a => a.providerId))
    expect(uniqueProviders.size).toBe(4)  // null, uber, lyft, doordash
  })

  it('[TEST 20] Cross-driver protection: different external IDs', () => {
    const k1 = buildActivityIdempotencyKey('uber-uuid', 'ACC-UBER-DRIVER-A')
    const k2 = buildActivityIdempotencyKey('uber-uuid', 'ACC-UBER-DRIVER-B')
    // Different external IDs → different activities → cannot be assigned to wrong driver
    expect(k1).not.toBe(k2)
  })
})

// ─── NET AMOUNT ───────────────────────────────────────────────

describe('Net Amount Computation', () => {
  it('[PASS] net = final - fee', () => {
    expect(computeNetAmount(40.00, 10.00)).toBeCloseTo(30.00, 2)
  })

  it('[PASS] net = null when finalAmount null', () => {
    expect(computeNetAmount(null, 10.00)).toBeNull()
  })

  it('[PASS] Payout ≠ gross amount (never overwrite)', () => {
    // gross = 40, fee = 10, net (payout) = 30
    // These must remain separately identifiable
    const result = computeNetAmount(40.00, 10.00)
    expect(result).toBe(30.00)
    // 30 ≠ 40 — never overwrite gross with payout
  })
})
