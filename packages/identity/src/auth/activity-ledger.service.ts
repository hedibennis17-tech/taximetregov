// ================================================================
// TAXIMÈTRE.GOV — ACTIVITY LEDGER SERVICE
// Phase DB-14: Normalization · Idempotency · Amount Lifecycle
// ================================================================

import { createHash } from 'crypto'

// ─── PUBLIC ACTIVITY ID ──────────────────────────────────────

export function formatCanonicalActivityId(seq: number): string {
  return `ACT-${seq.toString().padStart(8, '0')}`
}

// ─── IDEMPOTENCY ─────────────────────────────────────────────

export function buildActivityIdempotencyKey(
  providerId: string,
  externalActivityId: string,
): string {
  return createHash('sha256')
    .update(`${providerId}:activity:${externalActivityId}`)
    .digest('hex')
}

export function buildTaxiActivityKey(taxiTripId: string): string {
  // Taxi trips have their own unique reference
  return createHash('sha256')
    .update(`taximeter:${taxiTripId}`)
    .digest('hex')
}

// ─── ACTIVITY TYPE SEED DATA ─────────────────────────────────

export const SEED_ACTIVITY_TYPES = [
  {
    code: 'TAXI_TRIP',
    label: 'Course taxi',
    labelFr: 'Course taxi',
    labelEn: 'Taxi Trip',
    taximeterEligible: true,   // ONLY type where taximeter can be true
    description: 'Course effectuée avec taximètre gouvernemental officiel',
  },
  {
    code: 'RIDESHARE_TRIP',
    label: 'Course covoiturage',
    labelFr: 'Course covoiturage',
    labelEn: 'Rideshare Trip',
    taximeterEligible: false,  // Provider calculates fare
    description: 'Course Uber, Lyft — tarif calculé par le fournisseur',
  },
  {
    code: 'FOOD_DELIVERY',
    label: 'Livraison repas',
    labelFr: 'Livraison repas',
    labelEn: 'Food Delivery',
    taximeterEligible: false,  // NEVER
    description: 'DoorDash, UberEats, Skip — taximètre DÉSACTIVÉ',
  },
  {
    code: 'GROCERY_DELIVERY',
    label: 'Livraison épicerie',
    labelFr: 'Livraison épicerie',
    labelEn: 'Grocery Delivery',
    taximeterEligible: false,  // NEVER
    description: 'Instacart — taximètre DÉSACTIVÉ',
  },
  {
    code: 'PARCEL_DELIVERY',
    label: 'Livraison colis',
    labelFr: 'Livraison colis',
    labelEn: 'Parcel Delivery',
    taximeterEligible: false,  // NEVER
    description: 'Intelcom, autres — taximètre DÉSACTIVÉ',
  },
  {
    code: 'COURIER',
    label: 'Service coursier',
    labelFr: 'Service coursier',
    labelEn: 'Courier Service',
    taximeterEligible: false,
    description: 'Service coursier général',
  },
  {
    code: 'OTHER',
    label: 'Autre activité',
    labelFr: 'Autre activité autorisée',
    labelEn: 'Other Authorized Activity',
    taximeterEligible: false,
    description: 'Autre activité de travail indépendant autorisée',
  },
] as const

// ─── TAXIMETER RULE ──────────────────────────────────────────

export function isTaximeterEligibleForActivityType(activityTypeCode: string): boolean {
  // ONLY TAXI_TRIP — no other type, ever
  return activityTypeCode === 'TAXI_TRIP'
}

export function assertDeliveryTaximeterOff(activityTypeCode: string): void {
  const deliveryTypes = ['FOOD_DELIVERY', 'GROCERY_DELIVERY', 'PARCEL_DELIVERY', 'COURIER']
  if (deliveryTypes.includes(activityTypeCode)) {
    // Delivery types NEVER have taximeter — assertion for safety
    if (isTaximeterEligibleForActivityType(activityTypeCode)) {
      throw new Error(`IMPOSSIBLE: ${activityTypeCode} cannot have taximeterEligible=true`)
    }
  }
}

// ─── AMOUNT LIFECYCLE ────────────────────────────────────────

export interface ActivityAmounts {
  estimatedAmount:  number | null
  grossAmount:      number | null
  adjustmentAmount: number
  finalAmount:      number | null
  tipAmount:        number
  feeAmount:        number
  taxAmount:        number
  netAmount:        number | null
  currency:         string
}

function round2(v: number): number {
  return Math.round(v * 100) / 100
}

export function computeNetAmount(
  finalAmount: number | null,
  feeAmount:   number,
): number | null {
  if (finalAmount === null) return null
  return round2(finalAmount - feeAmount)
}

export function applyProviderAmountUpdate(
  current:    ActivityAmounts,
  eventType:  string,   // canonical event type
  newAmount:  number | null,
  tip?:       number | null,
  fee?:       number | null,
): ActivityAmounts {
  const updated = { ...current }

  if (eventType === 'TRIP_CREATED' || eventType === 'DELIVERY_CREATED') {
    if (current.finalAmount === null) {
      updated.estimatedAmount = newAmount
    }
    // Never override finalized amount
  }

  if (eventType === 'FARE_UPDATED' || eventType === 'TRIP_UPDATED' || eventType === 'DELIVERY_UPDATED') {
    if (current.finalAmount === null) {
      // Still in progress — update estimate
      updated.estimatedAmount = newAmount
    }
    // If already finalized → ignore fare update
  }

  if (eventType === 'TRIP_COMPLETED' || eventType === 'DELIVERY_COMPLETED') {
    // Completed but may not be finalized (might still get FARE_FINALIZED)
    if (newAmount !== null) {
      updated.grossAmount = newAmount
    }
  }

  if (eventType === 'FARE_FINALIZED') {
    // AUTHORITATIVE final amount
    if (newAmount !== null) {
      updated.finalAmount = newAmount
      updated.grossAmount = updated.grossAmount ?? newAmount
    }
  }

  if (tip !== null && tip !== undefined) {
    updated.tipAmount = round2(tip)
    // tip always separate
  }

  if (fee !== null && fee !== undefined) {
    updated.feeAmount = round2(fee)
  }

  // Recompute net
  updated.netAmount = computeNetAmount(updated.finalAmount, updated.feeAmount)

  return updated
}

export function applyAdjustment(
  current:          ActivityAmounts,
  adjustmentAmount: number,
  direction:        'CREDIT' | 'DEBIT',
): ActivityAmounts {
  const updated = { ...current }
  const signed = direction === 'CREDIT' ? adjustmentAmount : -adjustmentAmount
  updated.adjustmentAmount = round2(current.adjustmentAmount + signed)
  if (current.finalAmount !== null) {
    updated.finalAmount = round2(current.finalAmount + signed)
    updated.netAmount = computeNetAmount(updated.finalAmount, updated.feeAmount)
  }
  return updated
}

// ─── ACTIVITY STATUS MACHINE ──────────────────────────────────

export type CanonicalActivityStatus =
  | 'PENDING' | 'STARTED' | 'COMPLETED' | 'CANCELLED'
  | 'FINALIZED' | 'REJECTED' | 'DISPUTED' | 'VOIDED'

export const ALLOWED_ACTIVITY_TRANSITIONS: Record<CanonicalActivityStatus, CanonicalActivityStatus[]> = {
  PENDING:    ['STARTED', 'CANCELLED', 'REJECTED'],
  STARTED:    ['COMPLETED', 'CANCELLED'],
  COMPLETED:  ['FINALIZED', 'CANCELLED', 'DISPUTED'],
  CANCELLED:  ['DISPUTED'],        // Dispute over cancellation fee
  FINALIZED:  ['DISPUTED'],        // Immutable otherwise
  REJECTED:   [],                  // Terminal
  DISPUTED:   ['FINALIZED', 'VOIDED'],
  VOIDED:     [],                  // Terminal — never hard deleted
}

export function isActivityTransitionAllowed(
  from: CanonicalActivityStatus,
  to:   CanonicalActivityStatus,
): boolean {
  return ALLOWED_ACTIVITY_TRANSITIONS[from]?.includes(to) ?? false
}

export function isActivityImmutable(status: CanonicalActivityStatus): boolean {
  return status === 'FINALIZED' || status === 'VOIDED' || status === 'REJECTED'
}

// ─── DATA QUALITY ASSESSMENT ──────────────────────────────────

export interface DataQualityResult {
  status:   'VALIDATED' | 'PARTIAL' | 'INCONSISTENT' | 'PENDING_REVIEW'
  issues:   string[]
}

export function assessDataQuality(params: {
  driverId:          string | null
  providerId:        string | null
  externalActivityId: string | null
  startedAt:         Date | null
  finalAmount:       number | null
  currency:          string | null
  activityTypeCode:  string
}): DataQualityResult {
  const issues: string[] = []

  if (!params.driverId)           issues.push('driverId manquant')
  if (!params.externalActivityId && params.activityTypeCode !== 'TAXI_TRIP') {
    issues.push('externalActivityId manquant')
  }
  if (!params.startedAt)          issues.push('startedAt manquant')
  if (!params.currency)           issues.push('currency manquante')

  // Inconsistency checks
  if (params.finalAmount !== null && params.finalAmount < 0) {
    issues.push('finalAmount négatif — incohérent')
  }

  if (issues.length === 0) return { status: 'VALIDATED', issues: [] }
  if (issues.some(i => i.includes('manquant') && i.includes('driverId'))) {
    return { status: 'INCONSISTENT', issues }
  }
  if (issues.length <= 1) return { status: 'PARTIAL', issues }
  return { status: 'PENDING_REVIEW', issues }
}

// ─── ACCESS CONTROL ───────────────────────────────────────────

export function canDriverReadActivity(
  requestorDriverId: string,
  activityDriverId:  string,
): boolean {
  return requestorDriverId === activityDriverId
}

export function canGovernmentReadActivities(
  permissions:   string[],
  jurisdictions: string[],
  activityJurisdictionCode: string,
): boolean {
  const hasPerm = permissions.includes('activities.read')
  const hasJurisdiction = jurisdictions.includes(activityJurisdictionCode) ||
    jurisdictions.includes('ALL')
  return hasPerm && hasJurisdiction
}

export function canGovernmentFinalizeActivity(permissions: string[]): boolean {
  return permissions.includes('activities.review') || permissions.includes('activities.reconcile')
}
