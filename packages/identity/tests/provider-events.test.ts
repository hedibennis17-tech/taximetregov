// ================================================================
// TAXIMÈTRE.GOV — PROVIDER EVENTS INGESTION TESTS
// Phase DB-13: Idempotency · Driver Resolution · Quarantine · Amounts
// ================================================================

import { describe, it, expect } from 'vitest'
import {
  buildEventIdempotencyKey, buildTransactionIdempotencyKey,
  mapProviderEventToCanonical, DEV_EVENT_MAPPINGS,
  resolveDriverFromEvent, assessQuarantine,
  getTransactionStatus, applyAmountUpdate,
  isProviderEventTaximeterEnabled, hashWebhookBody,
  canGovernmentViewProviderEvents, canGovernmentResolveQuarantine,
  type DriverResolutionInput, type TransactionAmounts,
} from '../src/auth/provider-events.service'

// ─── IDEMPOTENCY ─────────────────────────────────────────────

describe('Event Idempotency — Tests 1 & 2', () => {
  it('[TEST 1] Same provider + same event_id = same key (duplicate)', () => {
    const k1 = buildEventIdempotencyKey('uber-uuid', 'UBER-EVENT-001')
    const k2 = buildEventIdempotencyKey('uber-uuid', 'UBER-EVENT-001')
    expect(k1).toBe(k2)
  })

  it('[TEST 2] Different event_id = different key (not duplicate)', () => {
    const k1 = buildEventIdempotencyKey('uber-uuid', 'UBER-EVENT-001')
    const k2 = buildEventIdempotencyKey('uber-uuid', 'UBER-EVENT-002')
    expect(k1).not.toBe(k2)
  })

  it('[PASS] Same transaction, different events = same transaction key', () => {
    const t1 = buildTransactionIdempotencyKey('uber-uuid', 'TRIP-001')
    const t2 = buildTransactionIdempotencyKey('uber-uuid', 'TRIP-001')
    expect(t1).toBe(t2)
    // Groups TRIP_COMPLETED + FARE_UPDATED + FARE_FINALIZED for same trip
  })

  it('[PASS] Cross-provider namespace: Uber TRIP-001 ≠ Lyft TRIP-001', () => {
    const uber = buildEventIdempotencyKey('uber-uuid', 'TRIP-001')
    const lyft = buildEventIdempotencyKey('lyft-uuid', 'TRIP-001')
    expect(uber).not.toBe(lyft)
  })
})

// ─── CANONICAL EVENT MAPPING ──────────────────────────────────

describe('Canonical Event Mapping', () => {
  it('[PASS] Uber trip.completed → TRIP_COMPLETED', () => {
    expect(mapProviderEventToCanonical('UBER', 'trips.completed')).toBe('TRIP_COMPLETED')
  })

  it('[PASS] DoorDash delivery_complete → DELIVERY_COMPLETED', () => {
    expect(mapProviderEventToCanonical('DOORDASH', 'delivery_complete')).toBe('DELIVERY_COMPLETED')
  })

  it('[PASS] Uber fare_finalized → FARE_FINALIZED (authoritative amount trigger)', () => {
    expect(mapProviderEventToCanonical('UBER', 'trips.fare_finalized')).toBe('FARE_FINALIZED')
  })

  it('[PASS] Unknown event → OTHER (never rejected on type alone)', () => {
    expect(mapProviderEventToCanonical('UBER', 'unknown.event.type')).toBe('OTHER')
    expect(mapProviderEventToCanonical('UNKNOWN_PROVIDER', 'some.event')).toBe('OTHER')
  })

  it('[PASS] All providers have mappings defined', () => {
    const providers = ['UBER', 'LYFT', 'DOORDASH', 'INSTACART', 'UBER_EATS', 'SKIP']
    providers.forEach(p => {
      expect(DEV_EVENT_MAPPINGS[p]).toBeDefined()
      expect(Object.keys(DEV_EVENT_MAPPINGS[p]!).length).toBeGreaterThan(0)
    })
  })
})

// ─── DRIVER RESOLUTION ────────────────────────────────────────

describe('Driver Resolution — Tests 3, 4, 5, 6', () => {
  const knownAccounts = [
    { externalAccountId: 'ACC-UBER-001', externalDriverId: 'DRV-UBER-001', driverId: 'driver-A', connectionStatus: 'CONNECTED' },
    { externalAccountId: 'ACC-LYFT-002', externalDriverId: 'DRV-LYFT-002', driverId: 'driver-A', connectionStatus: 'CONNECTED' },
    { externalAccountId: 'ACC-UBER-003', externalDriverId: null, driverId: 'driver-B', connectionStatus: 'CONNECTED' },
    { externalAccountId: 'ACC-SUSPENDED', externalDriverId: null, driverId: 'driver-C', connectionStatus: 'SUSPENDED' },
  ]

  it('[TEST 3] Resolve via external_account_id = MATCHED to driver', () => {
    const result = resolveDriverFromEvent({
      providerId: 'uber-uuid',
      externalAccountId: 'ACC-UBER-001',
      externalDriverId: null,
      knownAccounts,
    })
    expect(result.resolved).toBe(true)
    expect(result.driverId).toBe('driver-A')
    expect(result.resolutionMethod).toBe('PROVIDER_ACCOUNT_MATCH')
  })

  it('[TEST 4] Unknown external account = UNKNOWN_ACCOUNT (never guessed)', () => {
    const result = resolveDriverFromEvent({
      providerId: 'uber-uuid',
      externalAccountId: 'ACC-UNKNOWN-999',
      externalDriverId: null,
      knownAccounts,
    })
    expect(result.resolved).toBe(false)
    expect(result.driverId).toBeNull()
    expect(result.failureReason).toBe('UNKNOWN_ACCOUNT')
  })

  it('[TEST 5] No identifiers at all = MISSING_TRANSACTION_ID', () => {
    const result = resolveDriverFromEvent({
      providerId: 'uber-uuid',
      externalAccountId: null,
      externalDriverId: null,
      knownAccounts,
    })
    expect(result.resolved).toBe(false)
    expect(result.failureReason).toBe('MISSING_TRANSACTION_ID')
  })

  it('[TEST 6] Suspended connection = NOT resolved even if account found', () => {
    const result = resolveDriverFromEvent({
      providerId: 'uber-uuid',
      externalAccountId: 'ACC-SUSPENDED',
      externalDriverId: null,
      knownAccounts,
    })
    expect(result.resolved).toBe(false)
    expect(result.failureReason).toMatch(/SUSPENDED/i)
  })

  it('[PASS] Resolve via external_driver_id as fallback', () => {
    const result = resolveDriverFromEvent({
      providerId: 'lyft-uuid',
      externalAccountId: null,
      externalDriverId: 'DRV-LYFT-002',
      knownAccounts,
    })
    expect(result.resolved).toBe(true)
    expect(result.driverId).toBe('driver-A')
    expect(result.resolutionMethod).toBe('EXTERNAL_DRIVER_ID')
  })

  it('[PASS] Driver A + Driver B have different accounts — no cross-assignment', () => {
    const rA = resolveDriverFromEvent({
      providerId: 'uber-uuid', externalAccountId: 'ACC-UBER-001',
      externalDriverId: null, knownAccounts,
    })
    const rB = resolveDriverFromEvent({
      providerId: 'uber-uuid', externalAccountId: 'ACC-UBER-003',
      externalDriverId: null, knownAccounts,
    })
    expect(rA.driverId).toBe('driver-A')
    expect(rB.driverId).toBe('driver-B')
    expect(rA.driverId).not.toBe(rB.driverId)
  })
})

// ─── QUARANTINE ASSESSMENT ───────────────────────────────────

describe('Quarantine Assessment — Tests 7, 8, 9, 10', () => {
  const baseParams = {
    signatureValid: true, providerKnown: true, driverResolved: true,
    driverResolutionFailure: null, eventTypeSupported: true, isDuplicate: false,
  }

  it('[TEST 7] All valid = no quarantine', () => {
    const result = assessQuarantine(baseParams)
    expect(result.shouldQuarantine).toBe(false)
    expect(result.reason).toBeNull()
  })

  it('[TEST 8] Invalid signature = QUARANTINED (INVALID_SIGNATURE)', () => {
    const result = assessQuarantine({ ...baseParams, signatureValid: false })
    expect(result.shouldQuarantine).toBe(true)
    expect(result.reason).toBe('INVALID_SIGNATURE')
  })

  it('[TEST 9] Unknown driver = QUARANTINED (UNKNOWN_DRIVER)', () => {
    const result = assessQuarantine({
      ...baseParams, driverResolved: false,
      driverResolutionFailure: 'UNKNOWN_DRIVER',
    })
    expect(result.shouldQuarantine).toBe(true)
    expect(result.reason).toBe('UNKNOWN_DRIVER')
  })

  it('[TEST 10] Duplicate event = NOT quarantined (just ignored)', () => {
    const result = assessQuarantine({ ...baseParams, isDuplicate: true })
    expect(result.shouldQuarantine).toBe(false)
    expect(result.reason).toBe('DUPLICATE')
  })

  it('[PASS] Unknown provider = QUARANTINED', () => {
    const result = assessQuarantine({ ...baseParams, providerKnown: false })
    expect(result.shouldQuarantine).toBe(true)
    expect(result.reason).toBe('UNKNOWN_PROVIDER')
  })
})

// ─── TRANSACTION LIFECYCLE ───────────────────────────────────

describe('Transaction Lifecycle — Tests 11, 12, 13', () => {
  it('[TEST 11] FARE_FINALIZED → status = FINALIZED', () => {
    expect(getTransactionStatus('FARE_FINALIZED', 'OPEN')).toBe('FINALIZED')
  })

  it('[TEST 12] TRIP_CANCELLED → status = CANCELLED', () => {
    expect(getTransactionStatus('TRIP_CANCELLED', 'OPEN')).toBe('CANCELLED')
    expect(getTransactionStatus('DELIVERY_CANCELLED', 'OPEN')).toBe('CANCELLED')
  })

  it('[TEST 13] CANCELLED stays CANCELLED even after more events', () => {
    // A cancelled trip cannot become FINALIZED by a late fare event
    expect(getTransactionStatus('FARE_FINALIZED', 'CANCELLED')).toBe('CANCELLED')
    expect(getTransactionStatus('FARE_UPDATED', 'CANCELLED')).toBe('CANCELLED')
  })

  it('[PASS] Other events on OPEN transaction keep it OPEN', () => {
    expect(getTransactionStatus('TRIP_UPDATED', 'OPEN')).toBe('OPEN')
    expect(getTransactionStatus('FARE_UPDATED', 'OPEN')).toBe('OPEN')
  })
})

// ─── AMOUNT LIFECYCLE ────────────────────────────────────────

describe('Amount Lifecycle — Tests 14, 15, 16', () => {
  const emptyAmounts: TransactionAmounts = {
    estimatedAmount: null, finalAmount: null,
    totalAdjustments: 0, tipAmount: 0, feeAmount: 0,
    currency: 'CAD', isFinalized: false,
  }

  it('[TEST 14] TRIP_CREATED sets estimate (not final)', () => {
    const result = applyAmountUpdate(emptyAmounts, 'TRIP_CREATED', 28.00, null, null, null)
    expect(result.estimatedAmount).toBe(28.00)
    expect(result.finalAmount).toBeNull()
    expect(result.isFinalized).toBe(false)
  })

  it('[TEST 15] FARE_FINALIZED sets authoritative final amount', () => {
    const withEstimate = { ...emptyAmounts, estimatedAmount: 28.00 }
    const result = applyAmountUpdate(withEstimate, 'FARE_FINALIZED', 31.00, null, null, null)
    expect(result.finalAmount).toBe(31.00)
    expect(result.estimatedAmount).toBe(28.00)  // Estimate preserved
    expect(result.isFinalized).toBe(true)
  })

  it('[TEST 16] ADJUSTMENT adds to total (never overwrites)', () => {
    const finalized = { ...emptyAmounts, finalAmount: 31.00, isFinalized: true }
    const result = applyAmountUpdate(finalized, 'ADJUSTMENT_CREATED', null, 3.00, null, null)
    expect(result.totalAdjustments).toBeCloseTo(3.00, 2)
    expect(result.finalAmount).toBe(31.00)  // Final amount unchanged
  })

  it('[PASS] TIP_ADDED accumulates (separate from fare)', () => {
    const result = applyAmountUpdate(emptyAmounts, 'TIP_ADDED', null, null, 5.00, null)
    expect(result.tipAmount).toBe(5.00)
    // tip is always separate — never embedded in fare
  })

  it('[PASS] Finalized amount is NOT updated by FARE_UPDATED', () => {
    const finalized = { ...emptyAmounts, estimatedAmount: 28.00, finalAmount: 31.00, isFinalized: true }
    const result = applyAmountUpdate(finalized, 'FARE_UPDATED', 35.00, null, null, null)
    // Already finalized — FARE_UPDATED does NOT change estimate or final
    expect(result.finalAmount).toBe(31.00)  // Unchanged
    expect(result.estimatedAmount).toBe(28.00)  // Unchanged
  })
})

// ─── TAXIMETER RULE ───────────────────────────────────────────

describe('Taximeter Rule — Absolute', () => {
  it('[PASS] Provider events NEVER enable taximeter', () => {
    const types: Parameters<typeof isProviderEventTaximeterEnabled>[0][] = [
      'TRIP_COMPLETED', 'DELIVERY_COMPLETED', 'FARE_FINALIZED',
      'PAYOUT_CREATED', 'DRIVER_UPDATED', 'OTHER'
    ]
    types.forEach(t => {
      expect(isProviderEventTaximeterEnabled(t)).toBe(false)
    })
  })
})

// ─── WEBHOOK HASH ─────────────────────────────────────────────

describe('Webhook Payload Hash', () => {
  it('[PASS] Hash is deterministic', () => {
    const body = '{"event":"trip.completed","amount":31.00}'
    expect(hashWebhookBody(body)).toBe(hashWebhookBody(body))
  })

  it('[PASS] Hash different payloads differently', () => {
    expect(hashWebhookBody('{"a":1}')).not.toBe(hashWebhookBody('{"a":2}'))
  })

  it('[PASS] Raw body never returned — only hash', () => {
    const hash = hashWebhookBody('{"event":"fare.finalized","amount":31.00}')
    expect(hash).not.toContain('fare')
    expect(hash).not.toContain('31.00')
  })
})

// ─── MULTI-PROVIDER ───────────────────────────────────────────

describe('Multi-Provider Separation', () => {
  it('[PASS] Uber TRIP-001 and DoorDash TRIP-001 are separate transactions', () => {
    const uber = buildTransactionIdempotencyKey('uber-uuid', 'TRIP-001')
    const dd   = buildTransactionIdempotencyKey('dash-uuid', 'TRIP-001')
    expect(uber).not.toBe(dd)
  })

  it('[PASS] Multiple events for same transaction = ONE transaction reference', () => {
    // TRIP_COMPLETED + FARE_UPDATED + FARE_FINALIZED for TRIP-001
    const k1 = buildTransactionIdempotencyKey('uber-uuid', 'TRIP-001')
    const k2 = buildTransactionIdempotencyKey('uber-uuid', 'TRIP-001')
    const k3 = buildTransactionIdempotencyKey('uber-uuid', 'TRIP-001')
    // All three resolve to the same transaction
    expect(k1).toBe(k2)
    expect(k2).toBe(k3)
    // Only ONE revenue ledger entry created — not three
  })
})

// ─── ACCESS CONTROL ───────────────────────────────────────────

describe('Access Control', () => {
  it('[PASS] Government with correct permissions = ALLOW', () => {
    expect(canGovernmentViewProviderEvents(['provider_events.read'], ['QC'], 'QC')).toBe(true)
    expect(canGovernmentViewProviderEvents(['revenue.read'], ['ALL'], 'QC')).toBe(true)
  })

  it('[PASS] Wrong jurisdiction = DENY', () => {
    expect(canGovernmentViewProviderEvents(['provider_events.read'], ['ON'], 'QC')).toBe(false)
  })

  it('[PASS] Quarantine resolution requires specific permission', () => {
    expect(canGovernmentResolveQuarantine(['provider_quarantine.resolve'])).toBe(true)
    expect(canGovernmentResolveQuarantine(['provider_events.read'])).toBe(false)
  })

  it('[PASS] Driver cannot access raw provider events (no driver check in service = no access path)', () => {
    // Access is only via canGovernmentViewProviderEvents
    // Driver permissions never include provider_events.read
    expect(canGovernmentViewProviderEvents(['profile.read.self'], ['QC'], 'QC')).toBe(false)
  })
})
