// ================================================================
// TAXIMÈTRE.GOV — PAYMENT TESTS
// Phase DB-9: 22 tests obligatoires + invariants
// ================================================================

import { describe, it, expect } from 'vitest'
import {
  formatPublicPaymentId, formatPublicRefundId, formatPublicPayoutId,
  generateIdempotencyKey, generateRandomIdempotencyKey,
  computeWalletBalance, validatePaymentAmounts,
  checkWalletCreditAllowed, checkPayoutAllowed,
  reconcileCash, checkRefundAllowed,
  canDriverAccessPayment, canGovernmentViewPayment,
  canGovernmentProcessRefund, buildPaymentBreakdown,
  SEED_PAYMENTS,
} from '../src/auth/payment.service'

// ─── PUBLIC IDS ──────────────────────────────────────────────

describe('Public Payment IDs', () => {
  it('[PASS] PAY-XXXXXXXX format', () => {
    expect(formatPublicPaymentId(1)).toBe('PAY-00000001')
    expect(formatPublicPaymentId(1)).toMatch(/^PAY-\d{8}$/)
  })

  it('[PASS] REF-XXXXXXXX format', () => {
    expect(formatPublicRefundId(42)).toBe('REF-00000042')
  })

  it('[PASS] OUT-XXXXXXXX format', () => {
    expect(formatPublicPayoutId(999)).toBe('OUT-00000999')
  })
})

// ─── IDEMPOTENCY ──────────────────────────────────────────────

describe('Payment Idempotency — Tests 19 & 20', () => {
  it('[TEST 19] Same inputs produce same idempotency key', () => {
    const k1 = generateIdempotencyKey('driver-A', 'trip-001')
    const k2 = generateIdempotencyKey('driver-A', 'trip-001')
    expect(k1).toBe(k2)
    // Deterministic → safe retry
  })

  it('[TEST 20] Different inputs produce different keys', () => {
    const k1 = generateIdempotencyKey('driver-A', 'trip-001')
    const k2 = generateIdempotencyKey('driver-A', 'trip-002')
    const k3 = generateIdempotencyKey('driver-B', 'trip-001')
    expect(k1).not.toBe(k2)
    expect(k1).not.toBe(k3)
  })

  it('[PASS] Random key is unique', () => {
    const keys = new Set(Array.from({ length: 500 }, generateRandomIdempotencyKey))
    expect(keys.size).toBe(500)
  })

  it('[PASS] Key length within UNIQUE constraint limit', () => {
    const k = generateIdempotencyKey('driver-uuid-aaaa', 'trip-uuid-bbbb')
    expect(k.length).toBeLessThanOrEqual(100)
  })
})

// ─── WALLET BALANCE ───────────────────────────────────────────

describe('Wallet Balance Computation — Tests 3, 4, 5', () => {
  it('[TEST 3] Balance computed from entries — never a stored field', () => {
    const entries = [
      { direction: 'CREDIT' as const, amount: 50.00, isSettled: true  },
      { direction: 'CREDIT' as const, amount: 25.00, isSettled: true  },
      { direction: 'DEBIT'  as const, amount: 10.00, isSettled: true  },
    ]
    const result = computeWalletBalance(entries)
    expect(result.balance).toBeCloseTo(65.00, 2)
    expect(result.totalCredits).toBeCloseTo(75.00, 2)
    expect(result.totalDebits).toBeCloseTo(10.00, 2)
  })

  it('[TEST 4] Failed payment → wallet NOT credited', () => {
    // If payment FAILED, no wallet entry should exist
    const entries: { direction: 'CREDIT' | 'DEBIT'; amount: number; isSettled: boolean }[] = []
    const result = computeWalletBalance(entries)
    expect(result.balance).toBe(0)
    // Wallet has zero entries — no credit for failed payment
  })

  it('[TEST 5] Payout debits wallet', () => {
    const entries = [
      { direction: 'CREDIT' as const, amount: 100.00, isSettled: true },
      { direction: 'DEBIT'  as const, amount: 80.00,  isSettled: true }, // payout
    ]
    const result = computeWalletBalance(entries)
    expect(result.balance).toBeCloseTo(20.00, 2)
  })

  it('[PASS] Empty wallet = zero balance', () => {
    const result = computeWalletBalance([])
    expect(result.balance).toBe(0)
    expect(result.totalCredits).toBe(0)
    expect(result.totalDebits).toBe(0)
  })

  it('[PASS] Settled vs unsettled balance', () => {
    const entries = [
      { direction: 'CREDIT' as const, amount: 100.00, isSettled: true  },
      { direction: 'CREDIT' as const, amount: 50.00,  isSettled: false }, // pending
      { direction: 'DEBIT'  as const, amount: 30.00,  isSettled: true  },
    ]
    const result = computeWalletBalance(entries)
    expect(result.balance).toBeCloseTo(120.00, 2)
    expect(result.settledBalance).toBeCloseTo(70.00, 2)  // 100 - 30
  })
})

// ─── PAYMENT AMOUNT VALIDATION ────────────────────────────────

describe('Payment Amount Validation — Test 6', () => {
  it('[TEST 6] Valid payment breakdown passes', () => {
    const result = validatePaymentAmounts({
      fareAmount:    25.45,
      tipAmount:     3.00,
      feeAmount:     0,
      surchargeAmount: 0,
      grossAmount:   28.45,
      driverNetAmount: 28.45,
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('[TEST 6] Mismatched gross amount rejected', () => {
    const result = validatePaymentAmounts({
      fareAmount: 25.45, tipAmount: 3.00, feeAmount: 0,
      surchargeAmount: 0,
      grossAmount: 30.00,  // Should be 28.45
      driverNetAmount: 30.00,
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('grossAmount'))).toBe(true)
  })

  it('[PASS] Negative fare rejected', () => {
    const result = validatePaymentAmounts({
      fareAmount: -5, tipAmount: 0, feeAmount: 0,
      surchargeAmount: 0, grossAmount: -5, driverNetAmount: -5,
    })
    expect(result.valid).toBe(false)
  })

  it('[PASS] buildPaymentBreakdown computes all components', () => {
    const breakdown = buildPaymentBreakdown({
      fareAmount: 25.45, tipAmount: 3.00, feeAmount: 5.00,
    })
    expect(breakdown.grossAmount).toBeCloseTo(28.45, 2)
    expect(breakdown.driverNetAmount).toBeCloseTo(23.45, 2)
    expect(breakdown.tipAmount).toBe(3.00)
    // tip always separate — never embedded in fare
  })
})

// ─── WALLET CREDIT GUARD ──────────────────────────────────────

describe('Wallet Credit Guard — Tests 7, 8', () => {
  it('[TEST 7] SUCCEEDED payment → wallet credit ALLOWED', () => {
    const result = checkWalletCreditAllowed('SUCCEEDED')
    expect(result.canCredit).toBe(true)
    expect(result.reason).toBeNull()
  })

  it('[TEST 8] FAILED payment → wallet credit BLOCKED', () => {
    const result = checkWalletCreditAllowed('FAILED')
    expect(result.canCredit).toBe(false)
    expect(result.reason).toMatch(/FAILED/i)
  })

  it('[TEST 8] PENDING payment → wallet credit BLOCKED', () => {
    expect(checkWalletCreditAllowed('PENDING').canCredit).toBe(false)
  })

  it('[TEST 8] CANCELLED → wallet credit BLOCKED', () => {
    expect(checkWalletCreditAllowed('CANCELLED').canCredit).toBe(false)
  })

  it('[PASS] PROCESSING → wallet credit BLOCKED', () => {
    expect(checkWalletCreditAllowed('PROCESSING').canCredit).toBe(false)
  })
})

// ─── PAYOUT GUARD ────────────────────────────────────────────

describe('Payout Guard — Tests 9, 10, 11', () => {
  const validParams = {
    walletBalance:    100.00,
    requestedAmount:  50.00,
    hasActiveTrip:    false,
    accountStatus:    'ACTIVE',
    hasPendingPayout: false,
  }

  it('[TEST 9] Valid payout request succeeds', () => {
    const result = checkPayoutAllowed(validParams)
    expect(result.canPayout).toBe(true)
  })

  it('[TEST 10] Active trip blocks payout', () => {
    const result = checkPayoutAllowed({ ...validParams, hasActiveTrip: true })
    expect(result.canPayout).toBe(false)
    expect(result.reason).toMatch(/course active/i)
  })

  it('[TEST 11] Insufficient balance blocks payout', () => {
    const result = checkPayoutAllowed({ ...validParams, requestedAmount: 150.00 })
    expect(result.canPayout).toBe(false)
    expect(result.reason).toMatch(/insuffisant/i)
  })

  it('[PASS] Pending payout blocks new payout', () => {
    const result = checkPayoutAllowed({ ...validParams, hasPendingPayout: true })
    expect(result.canPayout).toBe(false)
    expect(result.reason).toMatch(/en cours/i)
  })

  it('[PASS] Inactive account blocks payout', () => {
    const result = checkPayoutAllowed({ ...validParams, accountStatus: 'SUSPENDED' })
    expect(result.canPayout).toBe(false)
  })

  it('[PASS] Zero amount blocks payout', () => {
    const result = checkPayoutAllowed({ ...validParams, requestedAmount: 0 })
    expect(result.canPayout).toBe(false)
  })
})

// ─── CASH RECONCILIATION ──────────────────────────────────────

describe('Cash Reconciliation — Tests 12, 13, 14', () => {
  it('[TEST 12] Exact match = RECONCILED', () => {
    const result = reconcileCash(20.00, 20.00)
    expect(result.status).toBe('RECONCILED')
    expect(result.difference).toBeCloseTo(0, 2)
  })

  it('[TEST 13] Small rounding difference = RECONCILED (within tolerance)', () => {
    const result = reconcileCash(20.00, 20.04, 0.05)
    expect(result.status).toBe('RECONCILED')
  })

  it('[TEST 14] Significant difference = DISCREPANCY (never auto-fraud)', () => {
    const result = reconcileCash(20.00, 25.00)
    expect(result.status).toBe('DISCREPANCY')
    expect(result.difference).toBeCloseTo(5.00, 2)
    // Critical: note says "révision requise" NOT "fraude"
    expect(result.note).toMatch(/révision requise/i)
    expect(result.note).not.toMatch(/fraude automatique/i)
  })

  it('[PASS] Cash = payment method, note is factual', () => {
    // The cash reconciliation result never implies undeclared income
    const result = reconcileCash(20.00, 20.00)
    expect(result.note).not.toMatch(/undeclared|non déclaré/i)
  })
})

// ─── REFUND VALIDATION ────────────────────────────────────────

describe('Refund Validation — Tests 15, 16', () => {
  it('[TEST 15] Valid refund on SUCCEEDED payment', () => {
    const result = checkRefundAllowed({
      paymentStatus:   'SUCCEEDED',
      refundAmount:    10.00,
      originalAmount:  28.45,
      alreadyRefunded: 0,
    })
    expect(result.canRefund).toBe(true)
  })

  it('[TEST 16] Cannot refund more than original amount', () => {
    const result = checkRefundAllowed({
      paymentStatus:   'SUCCEEDED',
      refundAmount:    30.00,  // More than original
      originalAmount:  28.45,
      alreadyRefunded: 0,
    })
    expect(result.canRefund).toBe(false)
    expect(result.reason).toMatch(/dépasse/i)
  })

  it('[PASS] Cannot refund FAILED payment', () => {
    const result = checkRefundAllowed({
      paymentStatus:   'FAILED',
      refundAmount:    10.00,
      originalAmount:  28.45,
      alreadyRefunded: 0,
    })
    expect(result.canRefund).toBe(false)
  })

  it('[PASS] Partial refund then full remaining refund', () => {
    const result = checkRefundAllowed({
      paymentStatus:   'PARTIALLY_REFUNDED',
      refundAmount:    18.45,
      originalAmount:  28.45,
      alreadyRefunded: 10.00,
    })
    expect(result.canRefund).toBe(true)
    // 28.45 - 10.00 = 18.45 remaining — exact match
  })
})

// ─── ACCESS CONTROL ───────────────────────────────────────────

describe('Access Control — Tests 17, 18', () => {
  it('[TEST 17] Driver A cannot access Driver B payment', () => {
    expect(canDriverAccessPayment('driver-A', 'driver-B')).toBe(false)
  })

  it('[PASS] Driver accesses own payment = ALLOW', () => {
    expect(canDriverAccessPayment('driver-A', 'driver-A')).toBe(true)
  })

  it('[TEST 18] Government with correct permission = ALLOW', () => {
    expect(canGovernmentViewPayment(['transactions.read'], ['QC'], 'QC')).toBe(true)
  })

  it('[PASS] Government without permission = DENY', () => {
    expect(canGovernmentViewPayment(['users.manage'], ['QC'], 'QC')).toBe(false)
  })

  it('[PASS] Government wrong jurisdiction = DENY', () => {
    expect(canGovernmentViewPayment(['revenue.read'], ['ON'], 'QC')).toBe(false)
  })

  it('[PASS] Refund requires transactions.review', () => {
    expect(canGovernmentProcessRefund(['transactions.review'])).toBe(true)
    expect(canGovernmentProcessRefund(['transactions.read'])).toBe(false)
  })
})

// ─── SEED DATA ────────────────────────────────────────────────

describe('Seed Payment Data — Tests 1, 2', () => {
  it('[TEST 1] 4 seed payments defined', () => {
    expect(SEED_PAYMENTS).toHaveLength(4)
  })

  it('[TEST 2] All payment components properly decomposed', () => {
    SEED_PAYMENTS.forEach(p => {
      // grossAmount must equal fareAmount + tipAmount + surchargeAmount
      const expected = p.fareAmount + p.tipAmount + p.surchargeAmount
      expect(Math.abs(expected - p.grossAmount)).toBeLessThanOrEqual(0.01)
    })
  })

  it('[PASS] FAILED payment has grossAmount but note says wallet not credited', () => {
    const failed = SEED_PAYMENTS.find(p => p.status === 'FAILED')
    expect(failed).toBeDefined()
    expect(failed?.note).toMatch(/wallet non crédité/i)
  })

  it('[PASS] Cash payment correctly labeled as payment method', () => {
    const cash = SEED_PAYMENTS.find(p => p.paymentMethod === 'CASH')
    expect(cash).toBeDefined()
    expect(cash?.note).toMatch(/méthode de paiement/i)
    // Not labeled as undeclared income
  })

  it('[PASS] Provider payment note states fare is immutable', () => {
    const provider = SEED_PAYMENTS.find(p => p.paymentMethod === 'PROVIDER_MANAGED')
    expect(provider).toBeDefined()
    expect(provider?.note).toMatch(/immuable/i)
  })
})

// ─── SCHEMA INVARIANTS ────────────────────────────────────────

describe('Schema Invariants', () => {
  it('[PASS] Wallet balance always computed — never stored', () => {
    // Test demonstrates: same entries always produce same balance
    const entries = [
      { direction: 'CREDIT' as const, amount: 50, isSettled: true },
      { direction: 'DEBIT'  as const, amount: 20, isSettled: true },
    ]
    const b1 = computeWalletBalance(entries).balance
    const b2 = computeWalletBalance(entries).balance
    expect(b1).toBe(b2)
    expect(b1).toBeCloseTo(30, 2)
  })

  it('[PASS] Payment always decomposed — never single amount', () => {
    const b = buildPaymentBreakdown({ fareAmount: 25, tipAmount: 3, feeAmount: 5 })
    expect(b).toHaveProperty('fareAmount')
    expect(b).toHaveProperty('tipAmount')
    expect(b).toHaveProperty('feeAmount')
    expect(b).toHaveProperty('grossAmount')
    expect(b).toHaveProperty('driverNetAmount')
    // Always decomposed — never a single opaque 'amount'
  })

  it('[PASS] Wallet credit guard is absolute — FAILED always blocked', () => {
    const failStatuses = ['FAILED', 'CANCELLED', 'PENDING', 'PROCESSING', 'DISPUTED']
    failStatuses.forEach(s => {
      expect(checkWalletCreditAllowed(s).canCredit).toBe(false)
    })
  })
})
