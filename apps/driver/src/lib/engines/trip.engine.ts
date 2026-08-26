// ============================================================
// TAXIMÈTRE.GOV — TAXI TRIP ENGINE
// Phase 2 — Step 14: Taxi Trip Engine
// Full trip lifecycle: request → active → receipt → ledger
// ============================================================

import type { FareBreakdown, PaymentMethod, MeterSession } from './taximeter.engine'

// ─── TYPES ───────────────────────────────────────────────────
export type TripStatus =
  | 'QUEUED'        // Passager en attente
  | 'ACCEPTED'      // Chauffeur accepté
  | 'EN_ROUTE'      // En route vers passager
  | 'ARRIVED'       // Arrivé au point de prise
  | 'PASSENGER_ON'  // Passager à bord
  | 'ACTIVE'        // Course en cours
  | 'COMPLETING'    // Destination atteinte
  | 'COMPLETED'     // Payé + transaction envoyée
  | 'CANCELLED'     // Annulé (chauffeur ou passager)
  | 'NO_SHOW'       // Passager absent

export type TripSource = 'METER'  // Taxi hêlé ou réservé directement
export type CancellationReason =
  | 'DRIVER_CANCELLED' | 'PASSENGER_NO_SHOW'
  | 'PASSENGER_CANCELLED' | 'TECHNICAL_ERROR'

// ─── PICKUP / DROPOFF POINT ───────────────────────────────────
export interface TripPoint {
  label: string | null
  lat: number
  lng: number
  timestamp: number
  gpsAccuracyM: number
}

// ─── TRIP RECEIPT ─────────────────────────────────────────────
export interface TripReceipt {
  receiptId: string
  transactionId: string
  tripId: string
  driverId: string
  vehiclePlate: string
  meterId: string
  jurisdiction: string
  rulesVersion: string
  pickup: TripPoint
  dropoff: TripPoint
  distanceKm: number
  durationSec: number
  waitingSec: number
  fareBreakdown: FareBreakdown
  paymentMethod: PaymentMethod
  issuedAt: number
  // No passenger PII stored here — privacy by design
}

// ─── TRIP RECORD ──────────────────────────────────────────────
export interface TripRecord {
  tripId: string
  source: TripSource
  status: TripStatus
  driverId: string
  vehicleId: string
  vehiclePlate: string
  meterId: string
  jurisdictionId: string
  pickup: TripPoint | null
  dropoff: TripPoint | null
  meterSessionId: string | null
  transactionId: string | null
  fareBreakdown: FareBreakdown | null
  paymentMethod: PaymentMethod | null
  receipt: TripReceipt | null
  startedAt: number
  completedAt: number | null
  cancelledAt: number | null
  cancellationReason: CancellationReason | null
  ledgerSynced: boolean
  auditId: string
}

// ─── TRIP HISTORY ENTRY (for display) ────────────────────────
export interface TripHistoryEntry {
  tripId: string
  date: string
  startTime: string
  endTime: string
  distanceKm: number
  durationSec: number
  fare: number
  tip: number
  tax: number
  total: number
  paymentMethod: PaymentMethod
  status: TripStatus
  ledgerSynced: boolean
}

// ─── FACTORY ──────────────────────────────────────────────────
export function createTripRecord(
  driverId: string,
  vehicleId: string,
  vehiclePlate: string,
  meterId: string,
  meterSessionId: string,
  jurisdictionId = 'QC-CA'
): TripRecord {
  return {
    tripId: `TRIP-TAXI-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`,
    source: 'METER',
    status: 'ACTIVE',
    driverId,
    vehicleId,
    vehiclePlate,
    meterId,
    jurisdictionId,
    pickup: null,
    dropoff: null,
    meterSessionId,
    transactionId: null,
    fareBreakdown: null,
    paymentMethod: null,
    receipt: null,
    startedAt: Date.now(),
    completedAt: null,
    cancelledAt: null,
    cancellationReason: null,
    ledgerSynced: false,
    auditId: `AUD-TRIP-${Date.now()}`,
  }
}

export function buildReceipt(trip: TripRecord): TripReceipt | null {
  if (!trip.fareBreakdown || !trip.paymentMethod || !trip.transactionId) return null
  return {
    receiptId: `RCP-${trip.tripId}`,
    transactionId: trip.transactionId,
    tripId: trip.tripId,
    driverId: trip.driverId,
    vehiclePlate: trip.vehiclePlate,
    meterId: trip.meterId,
    jurisdiction: trip.jurisdictionId,
    rulesVersion: trip.fareBreakdown.rulesVersion,
    pickup: trip.pickup ?? { label:null, lat:0, lng:0, timestamp:trip.startedAt, gpsAccuracyM:0 },
    dropoff: trip.dropoff ?? { label:null, lat:0, lng:0, timestamp:trip.completedAt ?? Date.now(), gpsAccuracyM:0 },
    distanceKm: trip.fareBreakdown.distanceKm,
    durationSec: trip.fareBreakdown.durationSec,
    waitingSec: trip.fareBreakdown.waitingSec,
    fareBreakdown: trip.fareBreakdown,
    paymentMethod: trip.paymentMethod,
    issuedAt: Date.now(),
  }
}

// ─── MOCK TRIP HISTORY ────────────────────────────────────────
export const mockTripHistory: TripHistoryEntry[] = [
  { tripId:'TRIP-TAXI-001', date:'2026-08-24', startTime:'15:02', endTime:'15:20', distanceKm:7.2, durationSec:1080, fare:17.49, tip:5.00, tax:3.37, total:25.86, paymentMethod:'CARD', status:'COMPLETED', ledgerSynced:true },
  { tripId:'TRIP-TAXI-002', date:'2026-08-24', startTime:'11:15', endTime:'11:47', distanceKm:12.4, durationSec:1920, fare:29.93, tip:8.00, tax:5.69, total:43.62, paymentMethod:'INTERAC', status:'COMPLETED', ledgerSynced:true },
  { tripId:'TRIP-TAXI-003', date:'2026-08-23', startTime:'18:30', endTime:'18:58', distanceKm:9.8, durationSec:1680, fare:24.51, tip:4.00, tax:4.28, total:32.79, paymentMethod:'CARD', status:'COMPLETED', ledgerSynced:true },
  { tripId:'TRIP-TAXI-004', date:'2026-08-23', startTime:'14:10', endTime:'14:36', distanceKm:8.1, durationSec:1560, fare:21.00, tip:3.00, tax:3.60, total:27.60, paymentMethod:'CASH', status:'COMPLETED', ledgerSynced:true },
  { tripId:'TRIP-TAXI-005', date:'2026-08-22', startTime:'09:05', endTime:'09:29', distanceKm:6.3, durationSec:1440, fare:16.79, tip:2.00, tax:2.82, total:21.61, paymentMethod:'CARD', status:'COMPLETED', ledgerSynced:true },
  { tripId:'TRIP-TAXI-006', date:'2026-08-22', startTime:'07:45', endTime:'07:58', distanceKm:3.2, durationSec:780, fare:9.69, tip:0, tax:1.45, total:11.14, paymentMethod:'CARD', status:'COMPLETED', ledgerSynced:true },
  { tripId:'TRIP-TAXI-007', date:'2026-08-21', startTime:'21:30', endTime:'21:52', distanceKm:5.8, durationSec:1320, fare:15.57, tip:5.00, tax:3.08, total:23.65, paymentMethod:'INTERAC', status:'COMPLETED', ledgerSynced:true },
  { tripId:'TRIP-TAXI-008', date:'2026-08-21', startTime:'16:20', endTime:'16:51', distanceKm:11.2, durationSec:1860, fare:27.69, tip:6.00, tax:5.06, total:38.75, paymentMethod:'WALLET', status:'COMPLETED', ledgerSynced:true },
]

// ─── TRIP STATS ───────────────────────────────────────────────
export function computeTripStats(trips: TripHistoryEntry[]) {
  const completed = trips.filter(t => t.status === 'COMPLETED')
  return {
    totalTrips: completed.length,
    totalRevenue: Math.round(completed.reduce((s,t) => s+t.fare, 0) * 100) / 100,
    totalTips: Math.round(completed.reduce((s,t) => s+t.tip, 0) * 100) / 100,
    totalTax: Math.round(completed.reduce((s,t) => s+t.tax, 0) * 100) / 100,
    totalGross: Math.round(completed.reduce((s,t) => s+t.total, 0) * 100) / 100,
    avgFare: completed.length > 0 ? Math.round(completed.reduce((s,t) => s+t.fare, 0) / completed.length * 100) / 100 : 0,
    avgDistance: completed.length > 0 ? Math.round(completed.reduce((s,t) => s+t.distanceKm, 0) / completed.length * 10) / 10 : 0,
    avgDurationMin: completed.length > 0 ? Math.round(completed.reduce((s,t) => s+t.durationSec, 0) / completed.length / 60) : 0,
    synced: completed.filter(t => t.ledgerSynced).length,
  }
}
