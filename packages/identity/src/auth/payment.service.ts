// ================================================================
// TAXIMÈTRE.GOV — PAYMENT SERVICE
// Phase DB-9: Wallet · Idempotency · Cash · Payout guards
// ================================================================

import { createHash, randomBytes } from 'crypto'

// ─── PUBLIC IDS ──────────────────────────────────────────────

export function formatPublicPaymentId(seq: number): string {
  return `PAY-${seq.toString().padStart(8, '0')}`
}
export function formatPublicRefundId(seq: number): string {
  return `REF-${seq.toString().padStart(8, '0')}`
}
export function formatPublicPayoutId(seq: number): string {
  return `OUT-${seq.toString().padStart(8, '0')}`
}

// ─── IDEMPOTENCY KEY ──────────────────────────────────────────

export function generateIdempotencyKey(
  driverId: string,
  tripOrActivityId: string,
  suffix: string = '',
): string {
  // Deterministic from input — same inputs always produce same key
  const base = `${driverId}:${tripOrActivityId}${suffix ? ':' + suffix : ''}`
  return createHash('sha256').update(base).digest('hex').slice(0, 64)
}

export function generateRandomIdempotencyKey(): string {
  return randomBytes(32).toString('base64url').slice(0, 64)
}

// ─── WALLET BALANCE COMPUTATION ───────────────────────────────
// Balance ALWAYS computed from entries — never a stored field

export interface WalletEntry {
  direction: 'CREDIT' | 'DEBIT'
  amount:    number  // always positive NUMERIC(12,2)
  isSettled: boolean
}

export function computeWalletBalance(entries: WalletEntry[]): {
  totalCredits:  number
  totalDebits:   number
  balance:       number
  settledBalance: number
} {
  let totalCredits  = 0
  let totalDebits   = 0
  let settledCredits = 0
  let settledDebits  = 0

  for (const e of entries) {
    const amt = round2(e.amount)
    if (e.direction === 'CREDIT') {
      totalCredits = round2(totalCredits + amt)
      if (e.isSettled) settledCredits = round2(settledCredits + amt)
    } else {
      totalDebits = round2(totalDebits + amt)
      if (e.isSettled) settledDebits = round2(settledDebits + amt)
    }
  }

  return {
    totalCredits,
    totalDebits,
    balance:        round2(totalCredits - totalDebits),
    settledBalance: round2(settledCredits - settledDebits),
  }
}

function round2(v: number): number {
  return Math.round(v * 100) / 100
}

// ─── PAYMENT VALIDATION ───────────────────────────────────────

export interface PaymentAmountValidation {
  valid:   boolean
  errors:  string[]
}

export function validatePaymentAmounts(params: {
  fareAmount:    number
  tipAmount:     number
  feeAmount:     number
  surchargeAmount: number
  grossAmount:   number
  driverNetAmount: number
}): PaymentAmountValidation {
  const errors: string[] = []

  const computedGross = round2(params.fareAmount + params.tipAmount + params.surchargeAmount)
  if (Math.abs(computedGross - params.grossAmount) > 0.01) {
    errors.push(`grossAmount (${params.grossAmount}) ≠ fareAmount+tipAmount+surcharge (${computedGross})`)
  }

  const computedNet = round2(params.grossAmount - params.feeAmount)
  if (Math.abs(computedNet - params.driverNetAmount) > 0.01) {
    errors.push(`driverNetAmount (${params.driverNetAmount}) ≠ grossAmount-feeAmount (${computedNet})`)
  }

  if (params.fareAmount < 0)   errors.push('fareAmount cannot be negative')
  if (params.tipAmount < 0)    errors.push('tipAmount cannot be negative')
  if (params.feeAmount < 0)    errors.push('feeAmount cannot be negative')
  if (params.grossAmount <= 0) errors.push('grossAmount must be positive')

  return { valid: errors.length === 0, errors }
}

// ─── WALLET CREDIT GUARD ──────────────────────────────────────

export interface WalletCreditGuardResult {
  canCredit: boolean
  reason:    string | null
}

export function checkWalletCreditAllowed(
  paymentStatus: string,
): WalletCreditGuardResult {
  // ABSOLUTE RULE: wallet credited ONLY when payment SUCCEEDED
  if (paymentStatus !== 'SUCCEEDED') {
    return {
      canCredit: false,
      reason: `Wallet non crédité — statut paiement: ${paymentStatus} (SUCCEEDED requis)`,
    }
  }
  return { canCredit: true, reason: null }
}

// ─── PAYOUT GUARD ────────────────────────────────────────────

export interface PayoutGuardResult {
  canPayout: boolean
  reason:    string | null
}

export function checkPayoutAllowed(params: {
  walletBalance:    number
  requestedAmount:  number
  hasActiveTrip:    boolean
  accountStatus:    string
  hasPendingPayout: boolean
}): PayoutGuardResult {
  if (params.hasActiveTrip) {
    return { canPayout: false, reason: 'Course active — paiement impossible pendant une course' }
  }

  if (params.accountStatus !== 'ACTIVE') {
    return { canPayout: false, reason: `Compte non actif: ${params.accountStatus}` }
  }

  if (params.hasPendingPayout) {
    return { canPayout: false, reason: 'Virement en cours — attendre la complétion avant nouveau virement' }
  }

  if (params.requestedAmount <= 0) {
    return { canPayout: false, reason: 'Montant du virement doit être positif' }
  }

  if (params.requestedAmount > params.walletBalance) {
    return {
      canPayout: false,
      reason: `Solde insuffisant — solde: ${params.walletBalance} · demandé: ${params.requestedAmount}`,
    }
  }

  return { canPayout: true, reason: null }
}

// ─── CASH VALIDATION ─────────────────────────────────────────

export interface CashReconciliationResult {
  status:     'RECONCILED' | 'DISCREPANCY'
  difference: number
  note:       string
}

export function reconcileCash(
  expectedAmount:  number,
  collectedAmount: number,
  tolerance = 0.05,  // configurable rounding tolerance in CAD
): CashReconciliationResult {
  const difference = round2(collectedAmount - expectedAmount)
  const absDiff    = Math.abs(difference)

  if (absDiff <= tolerance) {
    return {
      status: 'RECONCILED',
      difference,
      note: 'Cash réconcilié dans la tolérance de rounding configurée',
    }
  }

  return {
    status: 'DISCREPANCY',
    difference,
    // CRITICAL: discrepancy ≠ fraud — requires human review
    note: `Écart de ${difference > 0 ? '+' : ''}${difference.toFixed(2)} CAD — révision requise · pas une preuve de fraude`,
  }
}

// ─── REFUND VALIDATION ────────────────────────────────────────

export interface RefundValidationResult {
  canRefund: boolean
  reason:    string | null
}

export function checkRefundAllowed(params: {
  paymentStatus:  string
  refundAmount:   number
  originalAmount: number
  alreadyRefunded: number
}): RefundValidationResult {
  if (params.paymentStatus === 'FAILED' || params.paymentStatus === 'CANCELLED') {
    return { canRefund: false, reason: `Remboursement impossible — paiement ${params.paymentStatus}` }
  }

  if (params.refundAmount <= 0) {
    return { canRefund: false, reason: 'Montant remboursement doit être positif' }
  }

  const totalRefundable = round2(params.originalAmount - params.alreadyRefunded)
  if (params.refundAmount > totalRefundable) {
    return {
      canRefund: false,
      reason: `Remboursement (${params.refundAmount}) dépasse montant remboursable (${totalRefundable})`,
    }
  }

  return { canRefund: true, reason: null }
}

// ─── ACCESS CONTROL ──────────────────────────────────────────

export function canDriverAccessPayment(
  requestorDriverId: string,
  paymentDriverId:   string,
): boolean {
  return requestorDriverId === paymentDriverId
}

export function canGovernmentViewPayment(
  permissions:   string[],
  jurisdictions: string[],
  paymentJurisdiction: string,
): boolean {
  const hasPerm = permissions.includes('transactions.read') ||
    permissions.includes('revenue.read')
  const hasJurisdiction = jurisdictions.includes(paymentJurisdiction) ||
    jurisdictions.includes('ALL')
  return hasPerm && hasJurisdiction
}

export function canGovernmentProcessRefund(
  permissions: string[],
): boolean {
  return permissions.includes('transactions.review')
}

// ─── PAYMENT COMPONENT BREAKDOWN ─────────────────────────────

export interface PaymentBreakdown {
  fareAmount:      number
  tipAmount:       number
  feeAmount:       number
  surchargeAmount: number
  grossAmount:     number
  driverNetAmount: number
  currency:        string
  // NEVER a single opaque 'amount' — always decomposed
}

export function buildPaymentBreakdown(params: {
  fareAmount:      number
  tipAmount?:      number
  feeAmount?:      number
  surchargeAmount?: number
  currency?:       string
}): PaymentBreakdown {
  const fareAmount      = round2(params.fareAmount)
  const tipAmount       = round2(params.tipAmount      ?? 0)
  const feeAmount       = round2(params.feeAmount      ?? 0)
  const surchargeAmount = round2(params.surchargeAmount ?? 0)
  const grossAmount     = round2(fareAmount + tipAmount + surchargeAmount)
  const driverNetAmount = round2(grossAmount - feeAmount)

  return {
    fareAmount, tipAmount, feeAmount, surchargeAmount,
    grossAmount, driverNetAmount,
    currency: params.currency ?? 'CAD',
  }
}

// ─── SEED DATA ────────────────────────────────────────────────

export const SEED_PAYMENTS = [
  {
    publicPaymentId: 'PAY-00000001',
    paymentMethod:   'CREDIT_CARD',
    status:          'SUCCEEDED',
    fareAmount:      25.45,
    tipAmount:       3.00,
    feeAmount:       0,
    surchargeAmount: 0,
    grossAmount:     28.45,
    driverNetAmount: 28.45,
    currency:        'CAD',
    note:            'Paiement taxi — carte crédit',
    isDev:           true,
  },
  {
    publicPaymentId: 'PAY-00000002',
    paymentMethod:   'CASH',
    status:          'SUCCEEDED',
    fareAmount:      18.20,
    tipAmount:       2.00,
    feeAmount:       0,
    surchargeAmount: 0,
    grossAmount:     20.20,
    driverNetAmount: 20.20,
    currency:        'CAD',
    // Cash = payment method — not automatically undeclared
    note:            'Cash collecté — méthode de paiement normale · déclaration via Tax Engine',
    isDev:           true,
  },
  {
    publicPaymentId: 'PAY-00000003',
    paymentMethod:   'PROVIDER_MANAGED',
    status:          'SUCCEEDED',
    fareAmount:      31.60,
    tipAmount:       0,
    feeAmount:       7.90,    // Provider fee
    surchargeAmount: 0,
    grossAmount:     31.60,
    driverNetAmount: 23.70,   // After provider fee
    currency:        'CAD',
    note:            'Paiement Uber géré par provider · montant fournisseur immuable',
    isDev:           true,
  },
  {
    publicPaymentId: 'PAY-00000004',
    paymentMethod:   'CREDIT_CARD',
    status:          'FAILED',
    fareAmount:      15.80,
    tipAmount:       0,
    feeAmount:       0,
    surchargeAmount: 0,
    grossAmount:     15.80,
    driverNetAmount: 15.80,
    currency:        'CAD',
    // FAILED → wallet NOT credited
    note:            'Paiement échoué — carte refusée · wallet non crédité',
    isDev:           true,
  },
] as const
