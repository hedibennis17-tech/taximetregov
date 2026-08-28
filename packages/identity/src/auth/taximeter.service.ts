// ================================================================
// TAXIMÈTRE.GOV — TAXIMETER SERVICE
// Phase DB-8: Fare Calc · Trip Lifecycle · GPS · Idempotency
// ================================================================

import { createHash, randomBytes } from 'crypto'

// ─── PUBLIC IDS ──────────────────────────────────────────────

export function formatPublicTaximeterId(sequence: number): string {
  return `TXM-${sequence.toString().padStart(8, '0')}`
}

export function formatPublicTripId(sequence: number): string {
  return `TRP-${sequence.toString().padStart(8, '0')}`
}

// Immutable official government reference — never reused
export function formatTripReference(year: number, sequence: number): string {
  return `TXG-${year}-${sequence.toString().padStart(9, '0')}`
}

export function parsePublicTripId(id: string): number | null {
  const m = id.match(/^TRP-(\d{8})$/)
  if (!m || !m[1]) return null
  return parseInt(m[1], 10)
}

// ─── COMMAND ID (IDEMPOTENCY) ─────────────────────────────────

export function generateCommandId(): string {
  return randomBytes(24).toString('base64url')
  // 192 bits — collision probability negligible
}

export function isCommandIdSafe(commandId: string): boolean {
  return commandId.length >= 20 && commandId.length <= 60
}

// ─── FARE CALCULATION ────────────────────────────────────────

export interface FareConfig {
  baseFare:             number  // CAD, DECIMAL
  distanceRatePer100m: number
  timeRatePerMinute:   number
  waitingRatePerMinute: number
  minimumFare:         number
  airportSurcharge:    number
  nightSurcharge:      number
  currency:            string
  version:             string
  isPilot:             boolean
}

export interface FareCalculationInput {
  distanceMeters:  number
  elapsedSeconds:  number
  waitingSeconds:  number
  isAirportTrip:   boolean
  isNightTrip:     boolean
  config:          FareConfig
}

export interface FareCalculationResult {
  baseFare:         number
  distanceCharge:   number
  timeCharge:       number
  waitingCharge:    number
  airportSurcharge: number
  nightSurcharge:   number
  subtotal:         number
  finalAmount:      number  // max(subtotal, minimumFare)
  currency:         string
  fareVersion:      string
  isEstimate:       boolean // always true until trip COMPLETED
  isPilot:          boolean
  // Amounts: NUMERIC(12,2) — truncated to 2 decimal places
}

export function calculateFare(input: FareCalculationInput): FareCalculationResult {
  const cfg = input.config

  const baseFare       = round2(cfg.baseFare)
  const distanceCharge = round2((input.distanceMeters / 100) * cfg.distanceRatePer100m)
  const timeCharge     = round2((input.elapsedSeconds / 60) * cfg.timeRatePerMinute)
  const waitingCharge  = round2((input.waitingSeconds / 60) * cfg.waitingRatePerMinute)
  const airportSurcharge = input.isAirportTrip ? round2(cfg.airportSurcharge) : 0
  const nightSurcharge   = input.isNightTrip   ? round2(cfg.nightSurcharge)   : 0

  const subtotal    = round2(baseFare + distanceCharge + timeCharge + waitingCharge + airportSurcharge + nightSurcharge)
  const finalAmount = round2(Math.max(subtotal, cfg.minimumFare))

  return {
    baseFare, distanceCharge, timeCharge, waitingCharge,
    airportSurcharge, nightSurcharge, subtotal, finalAmount,
    currency:    cfg.currency,
    fareVersion: cfg.version,
    isEstimate:  true,  // always true until COMPLETED
    isPilot:     cfg.isPilot,
  }
}

// NUMERIC(12,2) — never float precision errors
function round2(value: number): number {
  return Math.round(value * 100) / 100
}

// ─── GPS VALIDATION ──────────────────────────────────────────

const MAX_SPEED_MPS = 55.6   // 200 km/h — absolute impossibility threshold
const MIN_ACCURACY_M = 100   // Points > 100m accuracy filtered
const MAX_DISTANCE_PER_POINT_M = 2000 // Max plausible distance between consecutive points

export interface GpsPoint {
  latitude:       number
  longitude:      number
  accuracyMeters: number | null
  speedMps:       number | null
  serverTimestamp: Date
  eventSequence:  number
}

export interface GpsValidationResult {
  valid:        boolean
  filtered:     boolean
  filterReason: string | null
  anomalyType:  string | null
}

export function validateGpsPoint(
  point: GpsPoint,
  previous: GpsPoint | null,
): GpsValidationResult {
  // Low accuracy → filter (not error)
  if (point.accuracyMeters !== null && point.accuracyMeters > MIN_ACCURACY_M) {
    return { valid: false, filtered: true, filterReason: 'LOW_ACCURACY', anomalyType: 'LOW_ACCURACY' }
  }

  // Impossible speed → anomaly
  if (point.speedMps !== null && point.speedMps > MAX_SPEED_MPS) {
    return { valid: false, filtered: true, filterReason: 'IMPOSSIBLE_SPEED', anomalyType: 'IMPOSSIBLE_SPEED' }
  }

  if (previous !== null) {
    const dist = haversineMeters(
      previous.latitude, previous.longitude,
      point.latitude,    point.longitude,
    )

    // Teleportation → anomaly
    if (dist > MAX_DISTANCE_PER_POINT_M) {
      return { valid: false, filtered: true, filterReason: 'TELEPORTATION', anomalyType: 'TELEPORTATION' }
    }

    // Clock anomaly: client timestamp before previous point
    if (point.serverTimestamp <= previous.serverTimestamp) {
      return { valid: false, filtered: true, filterReason: 'CLOCK_ANOMALY', anomalyType: 'CLOCK_ANOMALY' }
    }
  }

  return { valid: true, filtered: false, filterReason: null, anomalyType: null }
}

// ─── HAVERSINE DISTANCE ───────────────────────────────────────

export function haversineMeters(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371000  // Earth radius in meters
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return round2(R * c)
}

function toRad(deg: number): number { return deg * Math.PI / 180 }

// ─── TRIP LIFECYCLE ───────────────────────────────────────────

export type TripStatus = 'CREATED' | 'STARTED' | 'PAUSED' | 'RESUMED' |
  'COMPLETED' | 'CANCELLED' | 'VOIDED' | 'DISPUTED'

export const ALLOWED_TRIP_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  CREATED:   ['STARTED', 'CANCELLED'],
  STARTED:   ['PAUSED', 'COMPLETED', 'CANCELLED'],
  PAUSED:    ['RESUMED', 'COMPLETED', 'CANCELLED'],
  RESUMED:   ['PAUSED', 'COMPLETED', 'CANCELLED'],
  COMPLETED: ['DISPUTED'],          // Immutable otherwise — use adjustments
  CANCELLED: [],                    // Terminal — never re-opened
  VOIDED:    [],                    // Terminal — administrative only
  DISPUTED:  ['COMPLETED'],         // Back to COMPLETED once resolved
}

export function isTripTransitionAllowed(from: TripStatus, to: TripStatus): boolean {
  return ALLOWED_TRIP_TRANSITIONS[from]?.includes(to) ?? false
}

export function isTripImmutable(status: TripStatus): boolean {
  return status === 'COMPLETED' || status === 'CANCELLED' ||
    status === 'VOIDED'
}

// ─── ACTIVE TRIP GUARD ────────────────────────────────────────

export interface ActiveTripCheck {
  hasActiveTrip: boolean
  activeTripId:  string | null
  reason:        string | null
}

export function checkActiveTrip(
  driverId: string,
  existingTrips: { driverId: string; tripStatus: TripStatus; publicTripId: string }[],
): ActiveTripCheck {
  const active = existingTrips.find(
    t => t.driverId === driverId &&
      (t.tripStatus === 'STARTED' || t.tripStatus === 'PAUSED' || t.tripStatus === 'RESUMED')
  )
  if (active) {
    return {
      hasActiveTrip: true,
      activeTripId: active.publicTripId,
      reason: `Course active: ${active.publicTripId} — compléter avant d'en démarrer une nouvelle`,
    }
  }
  return { hasActiveTrip: false, activeTripId: null, reason: null }
}

// ─── ANOMALY CLASSIFICATION ───────────────────────────────────

export interface AnomalyAssessment {
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  reviewRequired: boolean
  // NEVER: isConfirmedFraud — anomaly ≠ fraud
  description: string
}

export function classifyGpsAnomaly(anomalyType: string): AnomalyAssessment {
  switch (anomalyType) {
    case 'LOW_ACCURACY':
      return { severity: 'INFO', reviewRequired: false, description: 'Point GPS filtré — précision insuffisante' }
    case 'MISSING_POINTS':
      return { severity: 'WARNING', reviewRequired: true, description: 'Données GPS manquantes — révision recommandée' }
    case 'IMPOSSIBLE_SPEED':
      return { severity: 'WARNING', reviewRequired: true, description: 'Vitesse impossible détectée — REVIEW_REQUIRED' }
    case 'TELEPORTATION':
      return { severity: 'WARNING', reviewRequired: true, description: 'Saut de position détecté — REVIEW_REQUIRED' }
    case 'SUSPICIOUS_ROUTE':
      return { severity: 'CRITICAL', reviewRequired: true, description: 'Trajet suspect — REVIEW_REQUIRED · jamais fraude automatique' }
    case 'CLOCK_ANOMALY':
      return { severity: 'WARNING', reviewRequired: true, description: 'Anomalie horloge — server_timestamp utilisé' }
    default:
      return { severity: 'WARNING', reviewRequired: true, description: `Anomalie GPS: ${anomalyType}` }
  }
}

// ─── ACCESS CONTROL ──────────────────────────────────────────

export function canDriverAccessTrip(
  requestorDriverId: string,
  tripDriverId:      string,
): boolean {
  return requestorDriverId === tripDriverId
}

export function canGovernmentViewTrip(
  permissions:   string[],
  jurisdictions: string[],
  tripJurisdiction: string,
): boolean {
  const hasPerm = permissions.includes('transactions.read') ||
    permissions.includes('drivers.read')
  const hasJurisdiction = jurisdictions.includes(tripJurisdiction) ||
    jurisdictions.includes('ALL')
  return hasPerm && hasJurisdiction
}

export function canGovernmentAdjustTrip(
  permissions: string[],
): boolean {
  return permissions.includes('transactions.review') ||
    permissions.includes('tax.finalize')
}

// ─── SEED FARE CONFIGURATION (development only) ───────────────

export const SEED_FARE_CONFIG: FareConfig = {
  version:              'QC-TAXI-PILOT-2026',
  currency:             'CAD',
  baseFare:             4.10,
  distanceRatePer100m:  0.185,  // $1.85/km
  timeRatePerMinute:    0.55,
  waitingRatePerMinute: 0.55,
  minimumFare:          4.10,
  airportSurcharge:     1.50,
  nightSurcharge:       0.00,
  isPilot:              true,
  // isPilot = not officially certified · pilot mode only
}
