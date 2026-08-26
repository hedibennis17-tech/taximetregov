// ============================================================
// TAXIMÈTRE.GOV — DIGITAL TAXIMETER ENGINE
// Phase 2 — Step 13: Digital Taximeter
// Certified fare calculation engine — TAXI activity only
// ============================================================

// RÈGLE ABSOLUE: Ce moteur ne s'active QUE pour l'activité TAXI
// Rideshare/Delivery → prix fourni par la plateforme, jamais ici

// ─── TYPES ───────────────────────────────────────────────────

export type MeterState =
  | 'OFF'           // Taximètre éteint
  | 'AVAILABLE'     // Prêt, en attente passager
  | 'PASSENGER_ENTERING' // Passager monte
  | 'ACTIVE'        // Course en cours
  | 'WAITING'       // Attente (feux, passager)
  | 'COMPLETING'    // Calcul final, sélection paiement
  | 'COMPLETED'     // Payé, transaction envoyée
  | 'ERROR'         // Erreur taximètre

export type PaymentMethod = 'CARD' | 'INTERAC' | 'CASH' | 'WALLET'
export type FareComponent = 'BASE' | 'DISTANCE' | 'TIME' | 'WAITING' | 'SURCHARGE'
export type MeterEventType =
  | 'SESSION_START' | 'PASSENGER_ENTER' | 'TRIP_START'
  | 'WAITING_START' | 'WAITING_END' | 'TRIP_END'
  | 'PAYMENT_SELECTED' | 'PAYMENT_CONFIRMED' | 'SESSION_END'
  | 'GPS_LOST' | 'GPS_RECOVERED' | 'ERROR'

// ─── FARE RULE SET (configurable — never hardcoded) ──────────
// Taux viennent de la configuration officielle MTQ/ARQ
// Ne jamais écrire les tarifs en dur dans le code applicatif
export interface FareRuleSet {
  ruleSetId: string
  jurisdiction: string      // ex: 'QC-CA'
  effectiveDate: string
  expiryDate: string | null
  currency: 'CAD'
  baseFare: number          // Prise en charge
  perKmRate: number         // $/km
  perMinuteRate: number     // $/min (course en mouvement)
  waitingPerMinuteRate: number  // $/min (attente)
  minimumFare: number
  airportSurcharge: number  // 0 si non applicable
  nightSurchargeRate: number    // % supplémentaire nuit
  nightSurchargeStartHour: number  // ex: 23
  nightSurchargeEndHour: number    // ex: 5
  tpsRate: number           // 0.05 (5%)
  tvqRate: number           // 0.09975 (9.975%)
  version: string
}

// Règles actives — chargées depuis Tax Rule Service (simulation)
export const ACTIVE_FARE_RULES: FareRuleSet = {
  ruleSetId: 'QC-TAXI-2026-V1',
  jurisdiction: 'QC-CA',
  effectiveDate: '2026-01-01',
  expiryDate: '2026-12-31',
  currency: 'CAD',
  baseFare: 3.45,
  perKmRate: 1.95,
  perMinuteRate: 0.50,
  waitingPerMinuteRate: 0.50,
  minimumFare: 4.05,
  airportSurcharge: 0,
  nightSurchargeRate: 0,      // Configurable
  nightSurchargeStartHour: 23,
  nightSurchargeEndHour: 5,
  tpsRate: 0.05,
  tvqRate: 0.09975,
  version: '1.0.0',
}

// ─── FARE BREAKDOWN ───────────────────────────────────────────
export interface FareBreakdown {
  baseFare: number
  distanceFare: number
  timeFare: number
  waitingFare: number
  surcharges: number
  subtotal: number
  tps: number
  tvq: number
  totalTax: number
  total: number
  // Audit trail
  distanceKm: number
  durationSec: number
  waitingSec: number
  rulesVersion: string
  calculatedAt: number
}

// ─── METER SESSION ────────────────────────────────────────────
export interface MeterSession {
  sessionId: string
  meterId: string
  meterVersion: string
  driverId: string
  vehicleId: string
  vehiclePlate: string
  jurisdictionId: string
  rulesVersion: string
  state: MeterState
  startedAt: number | null
  endedAt: number | null
  tripStartAt: number | null
  tripEndAt: number | null
  waitingStartAt: number | null
  totalWaitingSec: number
  distanceKm: number
  durationSec: number
  fareBreakdown: FareBreakdown | null
  paymentMethod: PaymentMethod | null
  transactionId: string | null
  ledgerSynced: boolean
  gpsSessionId: string | null
  events: MeterEvent[]
}

// ─── METER EVENT (audit trail immuable) ───────────────────────
export interface MeterEvent {
  eventId: string
  timestamp: number
  type: MeterEventType
  state: MeterState
  distanceKm: number
  durationSec: number
  fareAtEvent: number
  gpsAccuracyM: number | null
  notes: string | null
}

// ─── FARE CALCULATOR ──────────────────────────────────────────
export function calculateFare(
  distanceKm: number,
  durationSec: number,
  waitingSec: number,
  rules: FareRuleSet,
  nowHour?: number
): FareBreakdown {
  const distanceFare = Math.round(distanceKm * rules.perKmRate * 100) / 100
  const timeFare = Math.round((durationSec / 60) * rules.perMinuteRate * 100) / 100
  const waitingFare = Math.round((waitingSec / 60) * rules.waitingPerMinuteRate * 100) / 100

  // Night surcharge (configurable)
  let nightSurcharge = 0
  if (rules.nightSurchargeRate > 0 && nowHour !== undefined) {
    const isNight = nowHour >= rules.nightSurchargeStartHour || nowHour < rules.nightSurchargeEndHour
    if (isNight) nightSurcharge = Math.round((distanceFare + timeFare) * rules.nightSurchargeRate * 100) / 100
  }

  const surcharges = rules.airportSurcharge + nightSurcharge
  const subtotalBeforeMin = rules.baseFare + distanceFare + timeFare + waitingFare + surcharges
  const subtotal = Math.max(subtotalBeforeMin, rules.minimumFare)
  const subtotalRounded = Math.round(subtotal * 100) / 100

  // TPS + TVQ sur le sous-total
  const tps = Math.round(subtotalRounded * rules.tpsRate * 100) / 100
  const tvq = Math.round(subtotalRounded * rules.tvqRate * 100) / 100
  const totalTax = Math.round((tps + tvq) * 100) / 100
  const total = Math.round((subtotalRounded + totalTax) * 100) / 100

  return {
    baseFare: rules.baseFare,
    distanceFare,
    timeFare,
    waitingFare,
    surcharges,
    subtotal: subtotalRounded,
    tps,
    tvq,
    totalTax,
    total,
    distanceKm: Math.round(distanceKm * 1000) / 1000,
    durationSec,
    waitingSec,
    rulesVersion: rules.ruleSetId,
    calculatedAt: Date.now(),
  }
}

// ─── TRANSACTION BUILDER ──────────────────────────────────────
// Construit la transaction finale vers le Ledger
export interface TaxiTransaction {
  transactionId: string
  provider: 'taxi'          // Toujours 'taxi' pour le taximètre interne
  providerTripId: string    // Clé d'idempotence: provider + providerTripId = unique
  driverId: string
  vehicleId: string
  meterId: string
  activityType: 'TAXI'
  jurisdictionId: string
  currency: 'CAD'
  fareBreakdown: FareBreakdown
  paymentMethod: PaymentMethod
  gpsSessionId: string | null
  startedAt: number
  endedAt: number
  createdAt: number
  ledgerStatus: 'PENDING' | 'CONFIRMED' | 'FAILED'
  auditSessionId: string
}

export function buildTaxiTransaction(
  session: MeterSession,
  fareBreakdown: FareBreakdown
): TaxiTransaction {
  const providerTripId = `TAXI-${session.sessionId.slice(-8).toUpperCase()}`
  return {
    transactionId: `TXN-TAXI-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`,
    provider: 'taxi',
    providerTripId,           // provider + providerTripId = idempotence key
    driverId: session.driverId,
    vehicleId: session.vehicleId,
    meterId: session.meterId,
    activityType: 'TAXI',
    jurisdictionId: session.jurisdictionId,
    currency: 'CAD',
    fareBreakdown,
    paymentMethod: session.paymentMethod!,
    gpsSessionId: session.gpsSessionId,
    startedAt: session.tripStartAt!,
    endedAt: session.tripEndAt!,
    createdAt: Date.now(),
    ledgerStatus: 'PENDING',
    auditSessionId: `AUD-${session.sessionId}`,
  }
}

// ─── SESSION FACTORY ──────────────────────────────────────────
export function createMeterSession(
  driverId: string,
  vehicleId: string,
  vehiclePlate: string,
  meterId: string,
  meterVersion: string,
  jurisdictionId = 'QC-CA'
): MeterSession {
  return {
    sessionId: `MSESS-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    meterId,
    meterVersion,
    driverId,
    vehicleId,
    vehiclePlate,
    jurisdictionId,
    rulesVersion: ACTIVE_FARE_RULES.ruleSetId,
    state: 'AVAILABLE',
    startedAt: Date.now(),
    endedAt: null,
    tripStartAt: null,
    tripEndAt: null,
    waitingStartAt: null,
    totalWaitingSec: 0,
    distanceKm: 0,
    durationSec: 0,
    fareBreakdown: null,
    paymentMethod: null,
    transactionId: null,
    ledgerSynced: false,
    gpsSessionId: null,
    events: [],
  }
}

// ─── EVENT FACTORY ────────────────────────────────────────────
export function createMeterEvent(
  type: MeterEventType,
  state: MeterState,
  session: MeterSession,
  gpsAccuracyM: number | null = null,
  notes: string | null = null
): MeterEvent {
  return {
    eventId: `MEVT-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    timestamp: Date.now(),
    type,
    state,
    distanceKm: session.distanceKm,
    durationSec: session.durationSec,
    fareAtEvent: session.fareBreakdown?.subtotal ?? ACTIVE_FARE_RULES.baseFare,
    gpsAccuracyM,
    notes,
  }
}

// ─── FORMAT HELPERS ───────────────────────────────────────────
export function formatCAD(amount: number): string {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency', currency: 'CAD', minimumFractionDigits: 2
  }).format(amount)
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}
