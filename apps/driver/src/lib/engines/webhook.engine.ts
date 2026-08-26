// ============================================================
// TAXIMÈTRE.GOV — WEBHOOK & TRANSACTION SYNC ENGINE
// Phase 2 — Step 16
// Central pipeline: Provider events → Ledger
// ============================================================
//
// RÈGLES ABSOLUES:
// 1. Never trust webhook blindly — signature + timestamp required
// 2. Never duplicate a transaction — provider+provider_transaction_id = UNIQUE
// 3. Never assign unknown transactions automatically
// 4. Never calculate Uber/Lyft price from GPS
// 5. Taximeter DISABLED for Rideshare + Delivery (always)
// 6. Never modify finalized financial record silently
// ============================================================

import { TAXIMETER_ENABLED_BY_ACTIVITY, type ActivityType } from '@/data/driver.mock'

// ─── PROVIDER TYPES ──────────────────────────────────────────

export type Provider =
  | 'uber' | 'lyft' | 'doordash' | 'instacart'
  | 'uber_eats' | 'skip' | 'taxi' | 'other'

export type EventType =
  | 'TRIP_STARTED' | 'TRIP_UPDATED' | 'TRIP_COMPLETED'
  | 'PAYMENT_UPDATED' | 'ADJUSTMENT' | 'REFUND'
  | 'DELIVERY_STARTED' | 'DELIVERY_COMPLETED'
  | 'ACCOUNT_UPDATED' | 'UNKNOWN'

export type SignatureStatus = 'VERIFIED' | 'INVALID' | 'MISSING' | 'SKIPPED_MOCK'
export type ProcessingStatus =
  | 'RECEIVED' | 'AUTHENTICATING' | 'VALIDATING' | 'DEDUPLICATED'
  | 'QUEUED' | 'NORMALIZING' | 'MATCHING' | 'PROCESSING'
  | 'PENDING_FINAL' | 'FINALIZED' | 'REJECTED' | 'ERROR' | 'DEAD_LETTER'

export type TransactionStatus =
  | 'RECEIVED' | 'VALIDATING' | 'MATCHED' | 'PROCESSING'
  | 'PENDING_FINAL' | 'FINALIZED' | 'ADJUSTED' | 'REFUNDED'
  | 'UNMATCHED' | 'REVIEW_REQUIRED' | 'REJECTED' | 'ERROR'

export type MatchStatus = 'MATCHED' | 'UNMATCHED' | 'REVIEW_REQUIRED'
export type SyncStatus = 'CONNECTED' | 'SYNCING' | 'ERROR' | 'OFFLINE'
export type AmountStatus = 'ESTIMATED' | 'INTERMEDIATE' | 'FINAL'

// ─── PROVIDER PLATFORM CONFIG ─────────────────────────────────

export interface PlatformConfig {
  provider: Provider
  name: string
  icon: string
  activityType: ActivityType
  taximeterEnabled: false   // ALWAYS false for external platforms
  webhookPath: string
  signatureHeader: string
  signatureAlgorithm: string
  supportsOAuth: boolean
  apiApprovalRequired: boolean  // Uber/Lyft require approval
  status: 'CONFIGURED' | 'NOT_CONFIGURED' | 'MOCK'
  syncStatus: SyncStatus
}

export const PLATFORM_CONFIGS: Record<Provider, PlatformConfig> = {
  uber: {
    provider: 'uber', name: 'Uber', icon: '⬛',
    activityType: 'RIDESHARE', taximeterEnabled: false,
    webhookPath: '/webhooks/uber',
    signatureHeader: 'X-Uber-Signature',
    signatureAlgorithm: 'HMAC-SHA256',
    supportsOAuth: true,
    apiApprovalRequired: true,   // Requires Uber partner approval
    status: 'MOCK', syncStatus: 'CONNECTED',
  },
  lyft: {
    provider: 'lyft', name: 'Lyft', icon: '🔵',
    activityType: 'RIDESHARE', taximeterEnabled: false,
    webhookPath: '/webhooks/lyft',
    signatureHeader: 'X-Lyft-Signature',
    signatureAlgorithm: 'HMAC-SHA256',
    supportsOAuth: true,
    apiApprovalRequired: true,
    status: 'MOCK', syncStatus: 'OFFLINE',
  },
  doordash: {
    provider: 'doordash', name: 'DoorDash', icon: '🔴',
    activityType: 'FOOD_DELIVERY', taximeterEnabled: false,
    webhookPath: '/webhooks/doordash',
    signatureHeader: 'X-DoorDash-Signature',
    signatureAlgorithm: 'HMAC-SHA256',
    supportsOAuth: true,
    apiApprovalRequired: true,
    status: 'MOCK', syncStatus: 'CONNECTED',
  },
  instacart: {
    provider: 'instacart', name: 'Instacart', icon: '🛒',
    activityType: 'GROCERY', taximeterEnabled: false,
    webhookPath: '/webhooks/instacart',
    signatureHeader: 'X-Instacart-Signature',
    signatureAlgorithm: 'HMAC-SHA256',
    supportsOAuth: false,
    apiApprovalRequired: true,
    status: 'NOT_CONFIGURED', syncStatus: 'OFFLINE',
  },
  uber_eats: {
    provider: 'uber_eats', name: 'Uber Eats', icon: '🟢',
    activityType: 'FOOD_DELIVERY', taximeterEnabled: false,
    webhookPath: '/webhooks/uber-eats',
    signatureHeader: 'X-Uber-Signature',
    signatureAlgorithm: 'HMAC-SHA256',
    supportsOAuth: true,
    apiApprovalRequired: true,
    status: 'NOT_CONFIGURED', syncStatus: 'OFFLINE',
  },
  skip: {
    provider: 'skip', name: 'Skip', icon: '🟠',
    activityType: 'FOOD_DELIVERY', taximeterEnabled: false,
    webhookPath: '/webhooks/skip',
    signatureHeader: 'X-Skip-Signature',
    signatureAlgorithm: 'HMAC-SHA256',
    supportsOAuth: false,
    apiApprovalRequired: true,
    status: 'MOCK', syncStatus: 'SYNCING',
  },
  taxi: {
    provider: 'taxi', name: 'Taxi (Taximètre.GOV)', icon: '🚕',
    activityType: 'TAXI', taximeterEnabled: false,  // taximeter is separate engine
    webhookPath: '/internal/taxi',
    signatureHeader: 'X-Internal-Signature',
    signatureAlgorithm: 'HMAC-SHA256',
    supportsOAuth: false,
    apiApprovalRequired: false,
    status: 'CONFIGURED', syncStatus: 'CONNECTED',
  },
  other: {
    provider: 'other', name: 'Autre', icon: '🔌',
    activityType: 'FOOD_DELIVERY', taximeterEnabled: false,
    webhookPath: '/webhooks/other',
    signatureHeader: 'X-Provider-Signature',
    signatureAlgorithm: 'HMAC-SHA256',
    supportsOAuth: false,
    apiApprovalRequired: true,
    status: 'NOT_CONFIGURED', syncStatus: 'OFFLINE',
  },
}

// ─── RAW PROVIDER EVENT (stored as-is for audit) ─────────────

export interface ProviderRawEvent {
  rawEventId: string
  provider: Provider
  providerEventId: string
  receivedAt: number
  payloadHash: string           // SHA-256 of raw payload
  signatureStatus: SignatureStatus
  retentionStatus: 'ACTIVE' | 'ARCHIVED' | 'DELETED'
  // Raw payload stored encrypted — never logged in plain text
}

// ─── NORMALIZED PROVIDER EVENT ────────────────────────────────

export interface ProviderEvent {
  eventId: string               // Internal ID
  provider: Provider
  eventType: EventType
  providerEventId: string       // Provider's own event ID
  providerTripId: string        // Provider's trip/delivery ID
  receivedAt: number
  occurredAt: number            // When it happened on provider side
  processingStatus: ProcessingStatus
  signatureStatus: SignatureStatus
  driverExternalId: string | null   // Provider's driver account ID
  driverId: string | null           // Matched internal driver ID
  matchStatus: MatchStatus
  matchingMethod: string | null
  rawEventId: string            // Reference to raw event
  retryCount: number
  nextRetryAt: number | null
  lastError: string | null
  notes: string | null
}

// ─── CANONICAL TRANSACTION ────────────────────────────────────
// Normalized model — common across all providers

export interface CanonicalTransaction {
  // Identity
  transactionId: string
  provider: Provider
  providerTransactionId: string   // IDEMPOTENCY KEY (with provider)
  providerEventId: string
  driverId: string | null
  driverExternalId: string | null
  activityType: ActivityType
  taximeterEnabled: false         // ALWAYS false for external providers

  // Financial (multi-component — never a single 'amount' field)
  currency: 'CAD'
  grossAmount: number
  providerFee: number
  platformFee: number
  tip: number
  adjustments: number             // positive = bonus, negative = deduction
  refunds: number                 // always negative
  netAmount: number
  amountStatus: AmountStatus

  // Timing
  startedAt: number | null
  completedAt: number | null

  // Location (optional — not all providers share)
  pickupLocation: string | null
  dropoffLocation: string | null
  distanceKm: number | null
  durationSec: number | null

  // Status
  transactionStatus: TransactionStatus
  matchStatus: MatchStatus
  ledgerStatus: 'NOT_POSTED' | 'PENDING' | 'POSTED' | 'FAILED'
  taxStatus: 'NOT_PROCESSED' | 'PROCESSING' | 'PROCESSED'

  // Audit
  createdAt: number
  finalizedAt: number | null
  sourceEventIds: string[]
}

// ─── DRIVER PROVIDER LINK ─────────────────────────────────────
// Links internal driver ID to external provider account

export interface DriverProviderLink {
  linkId: string
  driverId: string
  provider: Provider
  externalAccountId: string
  connectionStatus: 'CONNECTED' | 'EXPIRED' | 'REVOKED' | 'PENDING'
  linkedAt: number
  lastSyncAt: number | null
  oauthScope: string[]            // Never store tokens here
  // OAuth tokens stored in secure vault — never in this model
}

// ─── DEAD LETTER EVENT ────────────────────────────────────────

export interface DeadLetterEvent {
  deadLetterId: string
  eventId: string
  provider: Provider
  providerEventId: string
  reason: string
  attemptCount: number
  lastError: string
  createdAt: number
  resolvedAt: number | null
  resolvedBy: string | null
}

// ─── RECONCILIATION RECORD ────────────────────────────────────

export interface ReconciliationRecord {
  reconciliationId: string
  provider: Provider
  periodStart: number
  periodEnd: number
  providerCount: number
  internalCount: number
  providerTotal: number
  internalTotal: number
  status: 'MATCHED' | 'MISMATCH' | 'MISSING' | 'DUPLICATE' | 'REVIEW_REQUIRED'
  difference: number
  reviewedAt: number | null
}

// ─── AUDIT EVENT ──────────────────────────────────────────────

export interface TransactionAuditEvent {
  auditId: string
  transactionId: string | null
  eventId: string | null
  provider: Provider
  action: string
  timestamp: number
  result: 'SUCCESS' | 'FAILURE' | 'WARNING'
  details: string | null
}

// ─── NORMALIZERS (one per provider) ──────────────────────────
// Translates provider-specific payload to CanonicalTransaction

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`
}

export function normalizeUberEvent(mockPayload: Record<string,number | string>): Partial<CanonicalTransaction> {
  return {
    provider: 'uber',
    activityType: 'RIDESHARE',
    taximeterEnabled: false,
    grossAmount: Number(mockPayload.fareAmount ?? 0),
    providerFee: Number(mockPayload.uberFee ?? 0),
    platformFee: 0,
    tip: Number(mockPayload.tip ?? 0),
    adjustments: Number(mockPayload.adjustment ?? 0),
    refunds: Number(mockPayload.refund ?? 0),
    netAmount: Number(mockPayload.driverEarnings ?? 0),
    amountStatus: 'FINAL',
    pickupLocation: (mockPayload.pickup as string) ?? null,
    dropoffLocation: (mockPayload.dropoff as string) ?? null,
  }
}

export function normalizeDoorDashEvent(mockPayload: Record<string,number | string>): Partial<CanonicalTransaction> {
  return {
    provider: 'doordash',
    activityType: 'FOOD_DELIVERY',
    taximeterEnabled: false,
    grossAmount: Number(mockPayload.basePayAmount ?? 0),
    providerFee: 0,
    platformFee: Number(mockPayload.dasherServiceFee ?? 0),
    tip: Number(mockPayload.consumerTip ?? 0),
    adjustments: Number(mockPayload.peakPayBonus ?? 0),
    refunds: 0,
    netAmount: Number(mockPayload.dasherTotal ?? 0),
    amountStatus: 'FINAL',
  }
}

// ─── IDEMPOTENCY CHECK ────────────────────────────────────────
// provider + providerTransactionId = UNIQUE constraint
// If already exists → return DUPLICATE, do not create new transaction

export function buildIdempotenceKey(provider: Provider, providerTransactionId: string): string {
  return `${provider.toUpperCase()}::${providerTransactionId}`
}

// ─── WEBHOOK PROCESSING PIPELINE (simulated) ─────────────────

export interface PipelineResult {
  accepted: boolean
  eventId: string | null
  reason: string
  stage: string
  duplicate: boolean
  transactionId: string | null
}

export function processMockWebhookEvent(
  provider: Provider,
  providerEventId: string,
  providerTripId: string,
  eventType: EventType,
  payload: Record<string, number | string>,
  existingIdempotenceKeys: Set<string>
): PipelineResult {
  const key = buildIdempotenceKey(provider, providerTripId)

  // Stage 1: Authentication (mock — VERIFIED in demo)
  // Stage 2: Signature verification (mock — SKIPPED_MOCK in demo)
  // Stage 3: Duplicate check
  if (existingIdempotenceKeys.has(key)) {
    return { accepted: false, eventId: null, reason: 'DUPLICATE — already processed', stage: 'DEDUPLICATION', duplicate: true, transactionId: null }
  }

  // Stage 4: Normalize
  const normalized = provider === 'uber' ? normalizeUberEvent(payload)
    : provider === 'doordash' ? normalizeDoorDashEvent(payload)
    : { grossAmount: Number(payload.amount ?? 0), activityType: 'FOOD_DELIVERY' as ActivityType, taximeterEnabled: false as const }

  // Stage 5: Driver matching (mock — MATCHED via DriverProviderLink)
  // Stage 6: Build canonical transaction
  const transactionId = makeId('TXN')
  const eventId = makeId('EVT')

  return {
    accepted: true,
    eventId,
    reason: 'Processed successfully',
    stage: 'FINALIZED',
    duplicate: false,
    transactionId,
  }
}

// ─── MOCK SYNC STATUS ─────────────────────────────────────────

export interface ProviderSyncStatus {
  provider: Provider
  name: string
  icon: string
  status: SyncStatus
  lastSync: string | null
  todayEvents: number
  todayTransactions: number
  todayGross: number
  pendingEvents: number
  errorCount: number
  activityType: ActivityType
}

export const mockSyncStatus: ProviderSyncStatus[] = [
  { provider:'uber', name:'Uber', icon:'⬛', status:'CONNECTED', lastSync:'2026-08-24T14:55:00Z', todayEvents:6, todayTransactions:3, todayGross:87.30, pendingEvents:0, errorCount:0, activityType:'RIDESHARE' },
  { provider:'lyft', name:'Lyft', icon:'🔵', status:'OFFLINE', lastSync:'2026-08-23T18:00:00Z', todayEvents:0, todayTransactions:0, todayGross:0, pendingEvents:0, errorCount:1, activityType:'RIDESHARE' },
  { provider:'doordash', name:'DoorDash', icon:'🔴', status:'CONNECTED', lastSync:'2026-08-24T15:10:00Z', todayEvents:24, todayTransactions:8, todayGross:112.40, pendingEvents:0, errorCount:0, activityType:'FOOD_DELIVERY' },
  { provider:'skip', name:'Skip', icon:'🟠', status:'SYNCING', lastSync:'2026-08-24T13:48:00Z', todayEvents:2, todayTransactions:0, todayGross:0, pendingEvents:2, errorCount:0, activityType:'FOOD_DELIVERY' },
  { provider:'uber_eats', name:'Uber Eats', icon:'🟢', status:'OFFLINE', lastSync:null, todayEvents:0, todayTransactions:0, todayGross:0, pendingEvents:0, errorCount:0, activityType:'FOOD_DELIVERY' },
  { provider:'instacart', name:'Instacart', icon:'🛒', status:'OFFLINE', lastSync:null, todayEvents:0, todayTransactions:0, todayGross:0, pendingEvents:0, errorCount:0, activityType:'GROCERY' },
]

// ─── MOCK TRANSACTION HISTORY ─────────────────────────────────

export interface MockTransaction {
  transactionId: string
  provider: Provider
  providerTransactionId: string
  activityType: ActivityType
  taximeterEnabled: boolean
  grossAmount: number
  tip: number
  providerFee: number
  netAmount: number
  status: TransactionStatus
  matchStatus: MatchStatus
  ledgerStatus: 'POSTED' | 'PENDING' | 'FAILED'
  syncStatus: SyncStatus
  occurredAt: string
  idempotenceKey: string
}

export const mockTransactions: MockTransaction[] = [
  { transactionId:'TXN-001', provider:'taxi', providerTransactionId:'TAXI-MSESS-A1B2C3', activityType:'TAXI', taximeterEnabled:true, grossAmount:42.50, tip:5.00, providerFee:0, netAmount:47.50, status:'FINALIZED', matchStatus:'MATCHED', ledgerStatus:'POSTED', syncStatus:'CONNECTED', occurredAt:'2026-08-24T15:02:00Z', idempotenceKey:'TAXI::TAXI-MSESS-A1B2C3' },
  { transactionId:'TXN-002', provider:'uber', providerTransactionId:'UBER-8F72A91', activityType:'RIDESHARE', taximeterEnabled:false, grossAmount:28.40, tip:4.00, providerFee:6.20, netAmount:26.20, status:'FINALIZED', matchStatus:'MATCHED', ledgerStatus:'POSTED', syncStatus:'CONNECTED', occurredAt:'2026-08-24T13:30:00Z', idempotenceKey:'UBER::UBER-8F72A91' },
  { transactionId:'TXN-003', provider:'doordash', providerTransactionId:'DD-DELIVERY-9X2K', activityType:'FOOD_DELIVERY', taximeterEnabled:false, grossAmount:18.90, tip:3.00, providerFee:2.50, netAmount:19.40, status:'FINALIZED', matchStatus:'MATCHED', ledgerStatus:'POSTED', syncStatus:'CONNECTED', occurredAt:'2026-08-24T14:15:00Z', idempotenceKey:'DOORDASH::DD-DELIVERY-9X2K' },
  { transactionId:'TXN-004', provider:'uber', providerTransactionId:'UBER-TEST-DUP', activityType:'RIDESHARE', taximeterEnabled:false, grossAmount:33.20, tip:0, providerFee:7.10, netAmount:26.10, status:'FINALIZED', matchStatus:'MATCHED', ledgerStatus:'POSTED', syncStatus:'CONNECTED', occurredAt:'2026-08-24T10:00:00Z', idempotenceKey:'UBER::UBER-TEST-DUP' },
  { transactionId:'TXN-005', provider:'doordash', providerTransactionId:'DD-PENDING-001', activityType:'FOOD_DELIVERY', taximeterEnabled:false, grossAmount:15.20, tip:2.50, providerFee:2.00, netAmount:15.70, status:'PENDING_FINAL', matchStatus:'MATCHED', ledgerStatus:'PENDING', syncStatus:'SYNCING', occurredAt:'2026-08-24T15:45:00Z', idempotenceKey:'DOORDASH::DD-PENDING-001' },
]

export const mockDeadLetterEvents: DeadLetterEvent[] = [
  { deadLetterId:'DLQ-001', eventId:'EVT-ERR-001', provider:'lyft', providerEventId:'LYFT-EVT-999', reason:'DRIVER_NOT_FOUND — No DriverProviderLink for LYFT-XYZ-UNKNOWN', attemptCount:3, lastError:'MatchStatus: UNMATCHED after 3 retries', createdAt:Date.now()-3600000, resolvedAt:null, resolvedBy:null },
  { deadLetterId:'DLQ-002', eventId:'EVT-ERR-002', provider:'skip', providerEventId:'SKIP-EVT-888', reason:'SIGNATURE_INVALID — HMAC verification failed', attemptCount:1, lastError:'SignatureStatus: INVALID', createdAt:Date.now()-7200000, resolvedAt:null, resolvedBy:null },
]

export const mockReconciliation: ReconciliationRecord[] = [
  { reconciliationId:'REC-001', provider:'uber', periodStart:Date.now()-86400000, periodEnd:Date.now(), providerCount:3, internalCount:3, providerTotal:87.30, internalTotal:87.30, status:'MATCHED', difference:0, reviewedAt:null },
  { reconciliationId:'REC-002', provider:'doordash', periodStart:Date.now()-86400000, periodEnd:Date.now(), providerCount:9, internalCount:8, providerTotal:128.60, internalTotal:112.40, status:'MISMATCH', difference:16.20, reviewedAt:null },
]
