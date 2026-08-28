// ================================================================
// TAXIMÈTRE.GOV — PROVIDER ACTIVITY SERVICE
// Phase DB-7: Idempotency · Matching · Access · Taximeter rules
// ================================================================

import { createHash } from 'crypto'

// ─── PUBLIC ACTIVITY ID ───────────────────────────────────────

export function formatPublicActivityId(sequence: number): string {
  return `ACT-${sequence.toString().padStart(8, '0')}`
}

export function parsePublicActivityId(id: string): number | null {
  const m = id.match(/^ACT-(\d{8})$/)
  if (!m || !m[1]) return null
  return parseInt(m[1], 10)
}

// ─── IDEMPOTENCY ──────────────────────────────────────────────

export function buildActivityHash(
  providerId: string,
  providerAccountId: string,
  externalActivityId: string,
): string {
  // Namespaced hash: provider + account + external ID
  return createHash('sha256')
    .update(`${providerId}:${providerAccountId}:${externalActivityId.trim()}`)
    .digest('hex')
}

export interface IdempotencyResult {
  isDuplicate: boolean
  existingActivityId: string | null
  existingStatus: string | null
}

export function checkActivityIdempotency(
  providerId: string,
  providerAccountId: string,
  externalActivityId: string,
  existing: { hash: string; activityId: string; status: string }[],
): IdempotencyResult {
  const hash = buildActivityHash(providerId, providerAccountId, externalActivityId)
  const match = existing.find(e => e.hash === hash)
  if (match) {
    return {
      isDuplicate: true,
      existingActivityId: match.activityId,
      existingStatus: match.status,
    }
  }
  return { isDuplicate: false, existingActivityId: null, existingStatus: null }
}

// ─── OUT-OF-ORDER EVENT HANDLING ─────────────────────────────

export interface EventOrderResult {
  shouldProcess: boolean
  reason: string | null
}

export function shouldProcessEvent(
  incomingVersion: number | null,
  currentVersion: number | null,
): EventOrderResult {
  // If no versioning info → always process (conservative)
  if (incomingVersion === null || currentVersion === null) {
    return { shouldProcess: true, reason: null }
  }
  // Stale update: incoming version <= current version
  if (incomingVersion <= currentVersion) {
    return {
      shouldProcess: false,
      reason: `Événement obsolète: version ${incomingVersion} ≤ courante ${currentVersion}`,
    }
  }
  return { shouldProcess: true, reason: null }
}

// ─── ACTIVITY MATCHING ────────────────────────────────────────

export interface MatchResult {
  status: 'MATCHED' | 'UNMATCHED' | 'REVIEW_REQUIRED'
  driverId: string | null
  reason: string | null
}

export function matchActivityToDriver(
  providerAccountId: string | null,
  providerAccounts: {
    providerAccountId: string
    driverId: string
    status: string
  }[],
): MatchResult {
  if (!providerAccountId) {
    return { status: 'UNMATCHED', driverId: null, reason: 'Aucun provider_account_id fourni' }
  }

  const account = providerAccounts.find(a => a.providerAccountId === providerAccountId)

  if (!account) {
    return { status: 'UNMATCHED', driverId: null, reason: 'Compte provider inconnu — jamais inventé' }
  }

  if (account.status === 'SUSPENDED' || account.status === 'DISCONNECTED') {
    return { status: 'REVIEW_REQUIRED', driverId: account.driverId, reason: `Compte ${account.status}` }
  }

  return { status: 'MATCHED', driverId: account.driverId, reason: null }
}

// ─── TAXIMETER RULES ──────────────────────────────────────────

export function getActivityTaximeterEnabled(activityType: string): false {
  // ABSOLUTE RULE: Provider activities NEVER enable taximeter
  // Taximeter is ONLY for TAXIMETER_GOV activities (different system)
  return false
}

export function assertNoTaximeter(activityType: string, sourceType: string): void {
  if (sourceType === 'PROVIDER') {
    if (activityType === 'RIDESHARE_TRIP' || activityType === 'DELIVERY' ||
        activityType === 'FOOD_DELIVERY' || activityType === 'GROCERY_DELIVERY' ||
        activityType === 'PACKAGE_DELIVERY') {
      // This is expected — provider activities never use taximeter
      return
    }
  }
  // If somehow reaching here for TAXIMETER_GOV, it's the separate system
}

// ─── VERSION TRACKING ─────────────────────────────────────────

export interface ActivityVersionEntry {
  versionNumber: number
  previousStatus: string | null
  newStatus: string
  amountSnapshot: number | null
  currency: string | null
  changeReason: string
}

export function buildNextVersion(
  currentVersionNumber: number,
  previousStatus: string,
  newStatus: string,
  changeReason: string,
  amountSnapshot?: number,
  currency?: string,
): ActivityVersionEntry {
  return {
    versionNumber:  currentVersionNumber + 1,
    previousStatus,
    newStatus,
    amountSnapshot: amountSnapshot ?? null,
    currency:       currency ?? null,
    changeReason,
  }
}

// ─── ACCESS CONTROL ──────────────────────────────────────────

export function canDriverAccessActivity(
  requestorDriverId: string,
  activityDriverId:  string | null,
): boolean {
  if (!activityDriverId) return false
  return requestorDriverId === activityDriverId
}

export function canGovernmentViewActivity(
  permissions:   string[],
  jurisdictions: string[],
  activityJurisdiction: string,
): boolean {
  const hasPerm = permissions.includes('transactions.read') ||
    permissions.includes('drivers.read') ||
    permissions.includes('revenue.read')
  const hasJurisdiction = jurisdictions.includes(activityJurisdiction) ||
    jurisdictions.includes('ALL')
  return hasPerm && hasJurisdiction
}

// ─── RECONCILIATION ──────────────────────────────────────────

export type ReconciliationStatus =
  | 'NOT_RECONCILED'
  | 'MATCHED'
  | 'MISMATCH'
  | 'DUPLICATE'
  | 'MISSING_DATA'
  | 'UNDER_REVIEW'
  | 'RESOLVED'

export interface ReconciliationResult {
  status: ReconciliationStatus
  difference: number | null
  reason: string | null
}

export function reconcileActivity(
  providerAmount: number | null,
  taximeterAmount: number | null,
  tolerance = 0.01,   // Configurable rounding tolerance
): ReconciliationResult {
  if (providerAmount === null || taximeterAmount === null) {
    return { status: 'MISSING_DATA', difference: null, reason: 'Montant manquant' }
  }

  const diff = Math.abs(providerAmount - taximeterAmount)

  if (diff <= tolerance) {
    return { status: 'MATCHED', difference: diff, reason: null }
  }

  return {
    status: 'MISMATCH',
    difference: diff,
    reason: `Écart de ${diff.toFixed(2)} — révision requise`,
    // Never auto-correct — always flag for review
  }
}

// ─── SEED DATA (development only) ────────────────────────────

export const SEED_ACTIVITIES = [
  {
    publicActivityId: 'ACT-00000001',
    sourceType: 'PROVIDER',
    providerCode: 'UBER',
    activityType: 'RIDESHARE_TRIP',
    activityStatus: 'COMPLETED',
    externalActivityId: 'UBER-TEST-TRIP-001',
    currency: 'CAD',
    jurisdiction: 'QC',
    taximeterEnabled: false,
    isDevelopmentSeed: true,
  },
  {
    publicActivityId: 'ACT-00000002',
    sourceType: 'PROVIDER',
    providerCode: 'LYFT',
    activityType: 'RIDESHARE_TRIP',
    activityStatus: 'COMPLETED',
    externalActivityId: 'LYFT-TEST-TRIP-001',
    currency: 'CAD',
    jurisdiction: 'QC',
    taximeterEnabled: false,
    isDevelopmentSeed: true,
  },
  {
    publicActivityId: 'ACT-00000003',
    sourceType: 'PROVIDER',
    providerCode: 'DOORDASH',
    activityType: 'DELIVERY',
    activityStatus: 'COMPLETED',
    externalActivityId: 'DASH-TEST-001',
    currency: 'CAD',
    jurisdiction: 'QC',
    taximeterEnabled: false,
    isDevelopmentSeed: true,
  },
  {
    publicActivityId: 'ACT-00000004',
    sourceType: 'PROVIDER',
    providerCode: 'INSTACART',
    activityType: 'GROCERY_DELIVERY',
    activityStatus: 'COMPLETED',
    externalActivityId: 'INST-TEST-001',
    currency: 'CAD',
    jurisdiction: 'QC',
    taximeterEnabled: false,
    isDevelopmentSeed: true,
  },
  {
    publicActivityId: 'ACT-00000005',
    sourceType: 'PROVIDER',
    providerCode: 'SKIP',
    activityType: 'FOOD_DELIVERY',
    activityStatus: 'CANCELLED',
    // CANCELLED ≠ DELETE → remains historical
    externalActivityId: 'SKIP-TEST-001',
    currency: 'CAD',
    jurisdiction: 'QC',
    taximeterEnabled: false,
    isDevelopmentSeed: true,
  },
] as const
