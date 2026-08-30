// ================================================================
// TAXIMÈTRE.GOV — PROVIDER EVENT INGESTION SERVICE
// Phase DB-13: Idempotency · Driver Resolution · Quarantine · Tx Grouping
// ================================================================

import { createHash } from 'crypto'

// ─── EVENT IDEMPOTENCY ───────────────────────────────────────

export function buildEventIdempotencyKey(
  providerId: string,
  externalEventId: string,
): string {
  // provider_id + external_event_id = UNIQUE constraint
  return createHash('sha256')
    .update(`${providerId}:${externalEventId}`)
    .digest('hex')
}

export function buildTransactionIdempotencyKey(
  providerId: string,
  externalTransactionId: string,
): string {
  // Groups multiple events for the same external transaction
  return createHash('sha256')
    .update(`${providerId}:txn:${externalTransactionId}`)
    .digest('hex')
}

// ─── CANONICAL EVENT MAPPING ──────────────────────────────────

export type CanonicalEventType =
  | 'TRIP_CREATED' | 'TRIP_STARTED' | 'TRIP_COMPLETED' | 'TRIP_UPDATED' | 'TRIP_CANCELLED'
  | 'DELIVERY_CREATED' | 'DELIVERY_STARTED' | 'DELIVERY_COMPLETED' | 'DELIVERY_UPDATED' | 'DELIVERY_CANCELLED'
  | 'FARE_UPDATED' | 'FARE_FINALIZED' | 'PAYOUT_CREATED' | 'PAYOUT_UPDATED'
  | 'TIP_ADDED' | 'ADJUSTMENT_CREATED'
  | 'DRIVER_UPDATED' | 'ACCOUNT_UPDATED' | 'TAX_DATA_UPDATED' | 'OTHER'

// Development mapping reference — real mappings stored in DB and per-provider
export const DEV_EVENT_MAPPINGS: Record<string, Record<string, CanonicalEventType>> = {
  UBER: {
    'trips.completed':          'TRIP_COMPLETED',
    'trips.started':            'TRIP_STARTED',
    'trips.cancelled':          'TRIP_CANCELLED',
    'trips.fare_split':         'FARE_UPDATED',
    'trips.fare_finalized':     'FARE_FINALIZED',
    'earnings.payout_created':  'PAYOUT_CREATED',
  },
  LYFT: {
    'ride.completed':           'TRIP_COMPLETED',
    'ride.canceled':            'TRIP_CANCELLED',
    'fare.finalized':           'FARE_FINALIZED',
  },
  DOORDASH: {
    'delivery_complete':        'DELIVERY_COMPLETED',
    'delivery_cancelled':       'DELIVERY_CANCELLED',
    'pay.deposited':            'PAYOUT_CREATED',
  },
  INSTACART: {
    'batch.completed':          'DELIVERY_COMPLETED',
    'batch.cancelled':          'DELIVERY_CANCELLED',
  },
  UBER_EATS: {
    'delivery.completed':       'DELIVERY_COMPLETED',
    'delivery.cancelled':       'DELIVERY_CANCELLED',
  },
  SKIP: {
    'order.delivered':          'DELIVERY_COMPLETED',
    'order.cancelled':          'DELIVERY_CANCELLED',
  },
}

export function mapProviderEventToCanonical(
  providerCode: string,
  providerEventType: string,
): CanonicalEventType {
  const mapping = DEV_EVENT_MAPPINGS[providerCode]?.[providerEventType]
  return mapping ?? 'OTHER'
}

// ─── DRIVER RESOLUTION ────────────────────────────────────────

export interface DriverResolutionInput {
  providerId:        string
  externalAccountId: string | null
  externalDriverId:  string | null
  knownAccounts: {
    externalAccountId:     string
    externalDriverId:      string | null
    driverId:              string
    connectionStatus:      string
  }[]
}

export interface DriverResolutionResult {
  resolved:          boolean
  driverId:          string | null
  resolutionMethod:  string | null
  failureReason:     string | null
}

export function resolveDriverFromEvent(input: DriverResolutionInput): DriverResolutionResult {
  // Priority 1: Match via external_account_id (most reliable)
  if (input.externalAccountId) {
    const match = input.knownAccounts.find(
      a => a.externalAccountId === input.externalAccountId
    )
    if (match) {
      if (match.connectionStatus === 'SUSPENDED' || match.connectionStatus === 'REVOKED') {
        return {
          resolved: false, driverId: null,
          resolutionMethod: null,
          failureReason: `SUSPENDED_CONNECTION: ${match.connectionStatus}`,
        }
      }
      if (match.connectionStatus === 'DISCONNECTED') {
        return {
          resolved: false, driverId: null,
          resolutionMethod: null,
          failureReason: 'REVOKED_CONNECTION: account disconnected',
        }
      }
      return {
        resolved: true,
        driverId: match.driverId,
        resolutionMethod: 'PROVIDER_ACCOUNT_MATCH',
        failureReason: null,
      }
    }
    return {
      resolved: false, driverId: null,
      resolutionMethod: null,
      failureReason: 'UNKNOWN_ACCOUNT',
    }
  }

  // Priority 2: Match via external_driver_id
  if (input.externalDriverId) {
    const match = input.knownAccounts.find(
      a => a.externalDriverId === input.externalDriverId
    )
    if (match) {
      return {
        resolved: true,
        driverId: match.driverId,
        resolutionMethod: 'EXTERNAL_DRIVER_ID',
        failureReason: null,
      }
    }
    return {
      resolved: false, driverId: null,
      resolutionMethod: null,
      failureReason: 'UNKNOWN_DRIVER',
    }
  }

  // Cannot resolve without identifier
  return {
    resolved: false, driverId: null,
    resolutionMethod: null,
    failureReason: 'MISSING_TRANSACTION_ID',
  }
}

// ─── QUARANTINE DECISION ──────────────────────────────────────

export type QuarantineReason =
  | 'INVALID_SIGNATURE' | 'UNKNOWN_PROVIDER' | 'UNKNOWN_CONNECTION'
  | 'UNKNOWN_DRIVER' | 'UNKNOWN_ACCOUNT' | 'INVALID_SCHEMA'
  | 'DUPLICATE' | 'SUSPICIOUS_PAYLOAD' | 'MISSING_TRANSACTION_ID'
  | 'UNSUPPORTED_EVENT' | 'DATA_INCONSISTENCY'
  | 'SUSPENDED_CONNECTION' | 'REVOKED_CONNECTION' | 'OTHER'

export interface QuarantineDecision {
  shouldQuarantine: boolean
  reason:           QuarantineReason | null
  detail:           string | null
  // NEVER includes: raw payload, tokens, full account IDs
}

export function assessQuarantine(params: {
  signatureValid:     boolean
  providerKnown:      boolean
  driverResolved:     boolean
  driverResolutionFailure: string | null
  eventTypeSupported: boolean
  isDuplicate:        boolean
}): QuarantineDecision {
  if (params.isDuplicate) {
    return { shouldQuarantine: false, reason: 'DUPLICATE', detail: 'Événement déjà traité — ignoré' }
  }
  if (!params.signatureValid) {
    return { shouldQuarantine: true, reason: 'INVALID_SIGNATURE', detail: 'Signature webhook invalide' }
  }
  if (!params.providerKnown) {
    return { shouldQuarantine: true, reason: 'UNKNOWN_PROVIDER', detail: 'Provider non enregistré' }
  }
  if (!params.eventTypeSupported) {
    return { shouldQuarantine: true, reason: 'UNSUPPORTED_EVENT', detail: 'Type événement non supporté' }
  }
  if (!params.driverResolved) {
    const reason = (params.driverResolutionFailure as QuarantineReason) ?? 'UNKNOWN_DRIVER'
    return { shouldQuarantine: true, reason, detail: `Impossible de résoudre le chauffeur: ${reason}` }
  }
  return { shouldQuarantine: false, reason: null, detail: null }
}

// ─── TRANSACTION LIFECYCLE ────────────────────────────────────

export type TransactionRefStatus = 'OPEN' | 'FINALIZED' | 'CANCELLED' | 'DISPUTED' | 'CLOSED'

export function getTransactionStatus(
  canonicalEventType: CanonicalEventType,
  currentStatus: TransactionRefStatus,
): TransactionRefStatus {
  // State machine for transaction references
  // CANCELLED is terminal — no event can resurrect it
  if (currentStatus === 'CANCELLED') return 'CANCELLED'
  if (canonicalEventType === 'FARE_FINALIZED') return 'FINALIZED'
  if (canonicalEventType === 'TRIP_CANCELLED' || canonicalEventType === 'DELIVERY_CANCELLED') return 'CANCELLED'
  return currentStatus
}

// ─── AMOUNT LIFECYCLE ─────────────────────────────────────────

export interface TransactionAmounts {
  estimatedAmount:  number | null
  finalAmount:      number | null
  totalAdjustments: number
  tipAmount:        number
  feeAmount:        number
  currency:         string
  isFinalized:      boolean
}

export function applyAmountUpdate(
  current: TransactionAmounts,
  eventType: CanonicalEventType,
  newAmount: number | null,
  adjustmentAmount: number | null,
  tipAmount: number | null,
  feeAmount: number | null,
): TransactionAmounts {
  const updated = { ...current }

  if (eventType === 'TRIP_CREATED' || eventType === 'DELIVERY_CREATED') {
    // Only set estimate on creation — never override final
    if (!current.isFinalized) {
      updated.estimatedAmount = newAmount
    }
  }

  if (eventType === 'FARE_FINALIZED') {
    // Authoritative amount — overrides estimate
    updated.finalAmount = newAmount
    updated.isFinalized = true
    // estimatedAmount preserved for comparison
  }

  if (eventType === 'FARE_UPDATED') {
    if (!current.isFinalized) {
      updated.estimatedAmount = newAmount
    }
  }

  if (eventType === 'ADJUSTMENT_CREATED' && adjustmentAmount !== null) {
    // Add adjustment — NEVER overwrite history
    updated.totalAdjustments = Math.round(
      (current.totalAdjustments + adjustmentAmount) * 100
    ) / 100
  }

  if (eventType === 'TIP_ADDED' && tipAmount !== null) {
    updated.tipAmount = Math.round((current.tipAmount + tipAmount) * 100) / 100
  }

  if (feeAmount !== null) {
    updated.feeAmount = feeAmount
  }

  return updated
}

// ─── TAXIMETER RULE ───────────────────────────────────────────

export function isProviderEventTaximeterEnabled(_canonicalType: CanonicalEventType): false {
  // ABSOLUTE RULE: Provider events NEVER enable taximeter
  // Taximeter is ONLY for Taxi mode (internal system)
  return false
}

// ─── PAYLOAD HASH ────────────────────────────────────────────

export function hashWebhookBody(rawBody: string | Buffer): string {
  return createHash('sha256')
    .update(typeof rawBody === 'string' ? rawBody : rawBody)
    .digest('hex')
}

// ─── ACCESS CONTROL ──────────────────────────────────────────

export function canGovernmentViewProviderEvents(
  permissions:   string[],
  jurisdictions: string[],
  eventJurisdiction: string,
): boolean {
  const hasPerm = permissions.includes('provider_events.read') ||
    permissions.includes('revenue.read')
  const hasJurisdiction = jurisdictions.includes(eventJurisdiction) ||
    jurisdictions.includes('ALL')
  return hasPerm && hasJurisdiction
}

export function canGovernmentResolveQuarantine(permissions: string[]): boolean {
  return permissions.includes('provider_quarantine.resolve')
}
