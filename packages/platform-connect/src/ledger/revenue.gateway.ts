// ============================================================
// TAXIMÈTRE.GOV — UNIVERSAL REVENUE GATEWAY
// Single source of truth for all platform transactions
// ============================================================
import type {
  Transaction, WebhookEvent, PlatformCode, ActivityType,
  AdjustmentEvent, TipEvent, RefundEvent, NormalizedTransaction,
  FinancialStatus, WebhookStatus, SignatureStatus
} from '../types/platform.types'
import { getAdapter } from '../adapters/mock.adapters'

// ─── IN-MEMORY STORES (replace with DB in production) ────────
const transactionStore = new Map<string, Transaction>()
const webhookEventStore = new Map<string, WebhookEvent>()
const adjustmentStore: AdjustmentEvent[] = []
const tipStore: TipEvent[] = []
const refundStore: RefundEvent[] = []
const auditLog: { timestamp: string; type: string; data: unknown }[] = []

// ─── ID GENERATORS ────────────────────────────────────────────
let txCounter = 1000
function genInternalTxId() {
  return `TG-TXN-2026-${String(txCounter++).padStart(10, '0')}`
}
function genId() {
  return Math.random().toString(36).slice(2, 12).toUpperCase()
}
function now() { return new Date().toISOString() }

// ─── AUDIT ────────────────────────────────────────────────────
function audit(type: string, data: unknown) {
  auditLog.push({ timestamp: now(), type, data })
}

// ─── TAX CALCULATION ─────────────────────────────────────────
const TPS_RATE = 0.05
const TVQ_RATE = 0.09975

function calculateTax(taxableAmount: number) {
  return {
    tps: Math.round(taxableAmount * TPS_RATE * 100) / 100,
    tvq: Math.round(taxableAmount * TVQ_RATE * 100) / 100,
    total: Math.round(taxableAmount * (TPS_RATE + TVQ_RATE) * 100) / 100,
  }
}

// ─── UNIQUE KEY for dedup ─────────────────────────────────────
function dedupeKey(provider: PlatformCode, providerTxId: string): string {
  return `${provider}::${providerTxId}`
}

// ═══════════════════════════════════════════════════════════════
// WEBHOOK PIPELINE
// Receive → Validate → Dedup → Normalize → Ledger → Tax → Audit
// ═══════════════════════════════════════════════════════════════
export interface WebhookPipelineInput {
  provider: PlatformCode
  eventId: string
  eventType: string
  headers: Record<string, string>
  body: string
  rawPayload: Record<string, unknown>
  governmentUserId?: string
  platformAccountId?: string
}

export interface WebhookPipelineResult {
  status: WebhookStatus
  eventId: string
  transactionId?: string
  internalTxId?: string
  isDuplicate: boolean
  signatureValid: boolean
  error?: string
  durationMs: number
}

export async function processWebhookEvent(input: WebhookPipelineInput): Promise<WebhookPipelineResult> {
  const startTime = Date.now()
  const correlationId = genId()

  // 1. RECEIVE
  audit('WEBHOOK_RECEIVED', { provider: input.provider, eventId: input.eventId, correlationId })

  // 2. CHECK DUPLICATE WEBHOOK EVENT
  const webhookKey = `${input.provider}::${input.eventId}`
  if (webhookEventStore.has(webhookKey)) {
    const existingEvent = webhookEventStore.get(webhookKey)!
    audit('WEBHOOK_DUPLICATE', { provider: input.provider, eventId: input.eventId, correlationId })
    return {
      status: 'DUPLICATE',
      eventId: input.eventId,
      transactionId: existingEvent.providerTransactionId,
      isDuplicate: true,
      signatureValid: true,
      durationMs: Date.now() - startTime,
    }
  }

  // 3. VERIFY SIGNATURE
  const adapter = getAdapter(input.provider)
  const signatureValid = adapter.verifyWebhook(input.headers, input.body)
  const signatureStatus: SignatureStatus = signatureValid ? 'valid' : 'invalid'

  if (!signatureValid) {
    const event: WebhookEvent = {
      id: genId(), provider: input.provider, eventId: input.eventId,
      eventType: input.eventType, payloadHash: hashPayload(input.body),
      signatureStatus: 'invalid', receivedAt: now(),
      processingStatus: 'REJECTED', retryCount: 0,
      errorMessage: 'Signature HMAC invalide — Webhook rejeté',
      correlationId,
    }
    webhookEventStore.set(webhookKey, event)
    audit('WEBHOOK_REJECTED', { reason: 'invalid_signature', correlationId })
    return { status: 'REJECTED', eventId: input.eventId, isDuplicate: false, signatureValid: false, error: 'Invalid signature', durationMs: Date.now() - startTime }
  }

  // 4. PERSIST RAW EVENT
  const eventRecord: WebhookEvent = {
    id: genId(), provider: input.provider, eventId: input.eventId,
    eventType: input.eventType,
    providerTransactionId: input.rawPayload.trip_id as string ?? input.rawPayload.order_id as string,
    payloadHash: hashPayload(input.body), signatureStatus,
    receivedAt: now(), processingStatus: 'VERIFIED', retryCount: 0, correlationId,
  }
  webhookEventStore.set(webhookKey, eventRecord)
  audit('WEBHOOK_VERIFIED', { correlationId })

  // 5. NORMALIZE
  const normalized = adapter.normalizeEvent(input.rawPayload, input.eventType)
  if (!normalized) {
    eventRecord.processingStatus = 'FAILED'
    eventRecord.errorMessage = 'Normalization failed — unknown event type'
    return { status: 'FAILED', eventId: input.eventId, isDuplicate: false, signatureValid: true, error: 'Normalization failed', durationMs: Date.now() - startTime }
  }

  // 6. CHECK TRANSACTION DUPLICATE (UNIQUE constraint)
  const providerTxId = normalized.activityId
  const txKey = dedupeKey(input.provider, providerTxId)

  if (transactionStore.has(txKey)) {
    const existing = transactionStore.get(txKey)!
    eventRecord.processingStatus = 'DUPLICATE'
    audit('WEBHOOK_DUPLICATE', { transactionId: existing.internalTransactionId, correlationId })
    return {
      status: 'DUPLICATE', eventId: input.eventId,
      transactionId: providerTxId, internalTxId: existing.internalTransactionId,
      isDuplicate: true, signatureValid: true, durationMs: Date.now() - startTime,
    }
  }

  // 7. CREATE TRANSACTION (LEDGER WRITE)
  const taxableAmount = normalized.grossAmount - normalized.platformFee
  const tax = calculateTax(taxableAmount)

  const transaction: Transaction = {
    id: genId(),
    internalTransactionId: genInternalTxId(),
    provider: input.provider,
    providerTransactionId: providerTxId,
    platformAccountId: input.platformAccountId ?? 'unmatched',
    governmentUserId: input.governmentUserId ?? 'UNMATCHED',
    activityId: normalized.activityId,
    activityType: normalized.activityType,
    grossAmount: normalized.grossAmount,
    platformFee: normalized.platformFee,
    tip: normalized.tip,
    adjustment: normalized.adjustment,
    refund: 0,
    taxAmount: tax.total,
    netAmount: Math.round((normalized.grossAmount - normalized.platformFee + normalized.tip + normalized.adjustment) * 100) / 100,
    currency: 'CAD',
    status: 'COMPLETED',
    financialStatus: 'PROVISIONAL',
    createdAt: now(),
    rawProviderData: input.rawPayload,
    normalizedData: normalized,
  }

  transactionStore.set(txKey, transaction)
  eventRecord.processingStatus = 'PROCESSED'
  eventRecord.processedAt = now()
  eventRecord.durationMs = Date.now() - startTime

  // 8. AUDIT
  audit('TRANSACTION_CREATED', { internalId: transaction.internalTransactionId, provider: input.provider, amount: transaction.grossAmount, correlationId })

  // 9. FINALIZE if event is terminal
  if (['TRIP_COMPLETED', 'DELIVERY_COMPLETE', 'PAYMENT_RECEIVED', 'ORDER_DELIVERED'].includes(input.eventType)) {
    transaction.financialStatus = 'FINALIZED'
    transaction.finalizedAt = now()
    transaction.status = 'FINALIZED'
    audit('TRANSACTION_FINALIZED', { internalId: transaction.internalTransactionId, correlationId })
  }

  return {
    status: 'PROCESSED', eventId: input.eventId,
    transactionId: providerTxId, internalTxId: transaction.internalTransactionId,
    isDuplicate: false, signatureValid: true, durationMs: Date.now() - startTime,
  }
}

// ─── ADJUSTMENT ───────────────────────────────────────────────
export function applyAdjustment(originalTxId: string, amount: number, reason: string, providerRef?: string): AdjustmentEvent | null {
  // Find transaction by internal ID
  const tx = Array.from(transactionStore.values()).find(t => t.internalTransactionId === originalTxId)
  if (!tx) return null

  const adj: AdjustmentEvent = {
    id: genId(), originalTransactionId: originalTxId,
    amount, reason, providerReference: providerRef, createdAt: now(),
  }
  adjustmentStore.push(adj)

  // Update transaction (never overwrite — add delta)
  tx.adjustment += amount
  tx.netAmount = Math.round((tx.grossAmount - tx.platformFee + tx.tip + tx.adjustment - tx.refund) * 100) / 100
  tx.financialStatus = 'ADJUSTED'

  audit('TRANSACTION_ADJUSTED', { internalId: originalTxId, amount, reason })
  return adj
}

// ─── TIP ─────────────────────────────────────────────────────
export function applyTip(originalTxId: string, amount: number): TipEvent | null {
  const tx = Array.from(transactionStore.values()).find(t => t.internalTransactionId === originalTxId)
  if (!tx) return null

  const tip: TipEvent = { id: genId(), originalTransactionId: originalTxId, amount, createdAt: now() }
  tipStore.push(tip)
  tx.tip += amount
  tx.netAmount = Math.round((tx.grossAmount - tx.platformFee + tx.tip + tx.adjustment - tx.refund) * 100) / 100
  audit('TRANSACTION_ADJUSTED', { internalId: originalTxId, tipAmount: amount })
  return tip
}

// ─── REFUND ──────────────────────────────────────────────────
export function applyRefund(originalTxId: string, amount: number, reason: string): RefundEvent | null {
  const tx = Array.from(transactionStore.values()).find(t => t.internalTransactionId === originalTxId)
  if (!tx) return null

  const refund: RefundEvent = { id: genId(), originalTransactionId: originalTxId, amount, reason, createdAt: now() }
  refundStore.push(refund)
  tx.refund += amount
  tx.netAmount = Math.round((tx.grossAmount - tx.platformFee + tx.tip + tx.adjustment - tx.refund) * 100) / 100
  tx.financialStatus = 'REFUNDED'
  tx.status = 'REFUNDED'
  audit('REFUND_CREATED', { internalId: originalTxId, amount, reason })
  return refund
}

// ─── READS ───────────────────────────────────────────────────
export function getAllTransactions(): Transaction[] {
  return Array.from(transactionStore.values())
}

export function getTransactionsByDriver(govUserId: string): Transaction[] {
  return Array.from(transactionStore.values()).filter(t => t.governmentUserId === govUserId)
}

export function getAllWebhookEvents(): WebhookEvent[] {
  return Array.from(webhookEventStore.values())
}

export function getAuditLog() { return auditLog }
export function getAdjustments() { return adjustmentStore }
export function getTips() { return tipStore }
export function getRefunds() { return refundStore }

// ─── HELPER ──────────────────────────────────────────────────
function hashPayload(body: string): string {
  // Simplified hash for demo
  let hash = 0
  for (let i = 0; i < body.length; i++) hash = ((hash << 5) - hash) + body.charCodeAt(i)
  return 'sha256-mock-' + Math.abs(hash).toString(16)
}
