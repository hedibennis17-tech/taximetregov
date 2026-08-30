// ================================================================
// TAXIMÈTRE.GOV — FINANCIAL SUMMARY SERVICE
// Phase DB-17: Ledger · Payout Guard · Snapshots · Statements
// ================================================================

// ─── PUBLIC IDS ──────────────────────────────────────────────

export function formatPayoutCalcId(seq: number): string {
  return `PYC-${seq.toString().padStart(8, '0')}`
}
export function formatStatementId(seq: number): string {
  return `STM-${seq.toString().padStart(8, '0')}`
}

// ─── REVENUE BREAKDOWN ───────────────────────────────────────

export interface RevenueBreakdown {
  taxi:      number
  rideshare: number
  delivery:  number
  other:     number
  total:     number
  tips:      number
}

function round2(v: number): number {
  return Math.round(v * 100) / 100
}

export function computeRevenueBreakdown(entries: {
  sourceType: string
  grossAmount: number
  tipAmount:   number
}[]): RevenueBreakdown {
  let taxi = 0, rideshare = 0, delivery = 0, other = 0, tips = 0

  for (const e of entries) {
    const gross = round2(e.grossAmount)
    const tip   = round2(e.tipAmount)
    tips = round2(tips + tip)

    if (e.sourceType === 'TAXI')                                        taxi      = round2(taxi + gross)
    else if (e.sourceType === 'UBER' || e.sourceType === 'LYFT')        rideshare = round2(rideshare + gross)
    else if (['DOORDASH','INSTACART','UBER_EATS','SKIP'].includes(e.sourceType)) delivery = round2(delivery + gross)
    else                                                                other     = round2(other + gross)
  }

  return { taxi, rideshare, delivery, other, total: round2(taxi + rideshare + delivery + other), tips }
}

// ─── NET REVENUE ─────────────────────────────────────────────

export interface NetRevenueComputation {
  grossTotal:        number
  tips:              number
  platformFees:      number
  taxRemittances:    number
  refundDebits:      number
  adjustmentDebits:  number
  totalDeductions:   number
  netRevenue:        number
}

export function computeNetRevenue(params: {
  grossTotal:       number
  tips:             number
  platformFees:     number
  taxRemittances:   number
  refundDebits:     number
  adjustmentDebits: number
}): NetRevenueComputation {
  const totalDeductions = round2(
    params.platformFees + params.taxRemittances +
    params.refundDebits + params.adjustmentDebits
  )
  const netRevenue = round2(params.grossTotal + params.tips - totalDeductions)
  return { ...params, totalDeductions, netRevenue }
}

// ─── PAYOUT CALCULATION GUARD ────────────────────────────────

export interface PayoutCalculationInput {
  walletBalance:          number
  requestedAmount:        number
  pendingTaxRemittances:  number
  pendingPlatformFees:    number
  pendingRefundDebits:    number
  hasActiveTrip:          boolean
  accountStatus:          string
  hasPendingPayout:       boolean
}

export interface PayoutCalculationResult {
  allowed:              boolean
  hasNegativeBalance:   boolean
  netAvailableAmount:   number
  totalPendingDedns:    number
  approvedAmount:       number | null
  blockers:             string[]
  validationSnapshot:   Record<string, boolean | number | string>
}

export function computePayoutCalculation(input: PayoutCalculationInput): PayoutCalculationResult {
  const blockers: string[] = []

  const totalPendingDedns = round2(
    input.pendingTaxRemittances +
    input.pendingPlatformFees +
    input.pendingRefundDebits
  )

  const netAvailable = round2(input.walletBalance - totalPendingDedns)
  const hasNegativeBalance = netAvailable < 0

  if (hasNegativeBalance)     blockers.push('Solde net négatif — virement impossible')
  if (input.hasActiveTrip)    blockers.push('Course active — virement impossible pendant une course')
  if (input.accountStatus !== 'ACTIVE') blockers.push(`Compte non actif: ${input.accountStatus}`)
  if (input.hasPendingPayout) blockers.push('Virement en cours — attendre avant nouveau virement')
  if (input.requestedAmount <= 0) blockers.push('Montant demandé invalide (≤ 0)')
  if (input.requestedAmount > netAvailable && !hasNegativeBalance) {
    blockers.push(`Montant demandé (${input.requestedAmount}) > solde disponible (${netAvailable})`)
  }

  const approvedAmount = blockers.length === 0 ? input.requestedAmount : null

  const validationSnapshot: Record<string, boolean | number | string> = {
    active_trip_check:      !input.hasActiveTrip,
    account_status_check:   input.accountStatus === 'ACTIVE',
    pending_payout_check:   !input.hasPendingPayout,
    balance_check:          !hasNegativeBalance,
    amount_check:           input.requestedAmount > 0 && input.requestedAmount <= netAvailable,
    wallet_balance:         input.walletBalance,
    total_deductions:       totalPendingDedns,
    net_available:          netAvailable,
    requested_amount:       input.requestedAmount,
  }

  return {
    allowed: blockers.length === 0,
    hasNegativeBalance, netAvailableAmount: netAvailable,
    totalPendingDedns, approvedAmount, blockers, validationSnapshot,
  }
}

// ─── SNAPSHOT VERSIONING ──────────────────────────────────────

export interface SnapshotVersionResult {
  isNewVersion: boolean
  newVersion:   number
  reason:       string | null
}

export function computeSnapshotVersion(
  currentVersion:  number,
  isFinalized:     boolean,
  hasNewData:      boolean,
): SnapshotVersionResult {
  if (isFinalized && hasNewData) {
    // Finalized snapshot + new data → create new version
    return {
      isNewVersion: true,
      newVersion:   currentVersion + 1,
      reason:       'Données nouvelles après finalisation — nouvelle version créée',
    }
  }
  return {
    isNewVersion: false,
    newVersion:   currentVersion,
    reason:       null,
  }
}

// ─── SUMMARY VALIDATION ──────────────────────────────────────

export interface SummaryValidation {
  isConsistent: boolean
  errors:       string[]
}

export function validateLedgerSummary(params: {
  grossTaxi:       number
  grossRideshare:  number
  grossDelivery:   number
  grossOther:      number
  grossTotal:      number
  netRevenue:      number
  totalDeductions: number
}): SummaryValidation {
  const errors: string[] = []

  const computedTotal = round2(
    params.grossTaxi + params.grossRideshare +
    params.grossDelivery + params.grossOther
  )

  if (Math.abs(computedTotal - params.grossTotal) > 0.01) {
    errors.push(`grossTotal (${params.grossTotal}) ≠ sum of sources (${computedTotal})`)
  }

  const computedNet = round2(params.grossTotal - params.totalDeductions)
  if (Math.abs(computedNet - params.netRevenue) > 0.01) {
    errors.push(`netRevenue (${params.netRevenue}) ≠ grossTotal - deductions (${computedNet})`)
  }

  if (params.grossTaxi < 0 || params.grossRideshare < 0 ||
      params.grossDelivery < 0 || params.grossOther < 0) {
    errors.push('Negative gross revenue component detected')
  }

  return { isConsistent: errors.length === 0, errors }
}

// ─── STATEMENT MASKING ───────────────────────────────────────

export function maskSensitiveStatementData(data: Record<string, unknown>): Record<string, unknown> {
  const masked = { ...data }
  const sensitiveKeys = ['nas', 'sin', 'iban', 'account_number', 'card_number', 'routing_number']
  for (const key of Object.keys(masked)) {
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
      masked[key] = '••••••••'
    }
  }
  return masked
}

// ─── ACCESS CONTROL ──────────────────────────────────────────

export function canDriverViewOwnFinancials(
  requestorDriverId: string,
  financialDriverId: string,
): boolean {
  return requestorDriverId === financialDriverId
}

export function canGovernmentViewFinancials(
  permissions:   string[],
  jurisdictions: string[],
  dataJurisdiction: string,
): boolean {
  const hasPerm = permissions.includes('revenue.read') ||
    permissions.includes('tax.read')
  const hasJurisdiction = jurisdictions.includes(dataJurisdiction) ||
    jurisdictions.includes('ALL')
  return hasPerm && hasJurisdiction
}

export function canApprovePayoutCalculation(permissions: string[]): boolean {
  return permissions.includes('payouts.approve')
}

export function canGenerateStatement(permissions: string[], isSelf: boolean): boolean {
  if (isSelf) return true  // Driver generates their own statement
  return permissions.includes('statements.generate')
}
