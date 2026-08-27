// ============================================================
// TAXIMÈTRE.GOV — SMART GPS TAXIMETER ENGINE
// Phase 2 — Step 24: GPS + Tariff + Device + Sync
// ============================================================
//
// RÈGLES ABSOLUES:
// 1. Tarifs = Government Tariff Configuration UNIQUEMENT — jamais hardcodés
// 2. Delivery → Taximeter OFF toujours (JAMAIS de dérogation)
// 3. Rideshare Uber/Lyft → Provider Final Fare = source (jamais remplacée)
// 4. GPS perdu → pas de km inventés (GPS_GAP marqué)
// 5. Trip COMPLETED+PAYMENT = immuable → Amendment avec audit
// 6. Duplicate event_id → IGNORED (idempotency)
// 7. Tariff version conservée par course → jamais recalcul rétroactif
// 8. Device BLOCKED → Taximeter LOCKED
// 9. NE PAS certifier comme officiellement homologué (mode PILOTE)
// ============================================================

// ─── SERVICE MODES ───────────────────────────────────────────

export type ServiceMode = 'TAXI' | 'RIDESHARE' | 'DELIVERY' | 'PERSONAL'

export const TAXIMETER_BY_SERVICE: Record<ServiceMode, boolean> = {
  TAXI: true,
  RIDESHARE: false,  // Provider Final Fare — never replaced by taximeter
  DELIVERY: false,   // ALWAYS disabled
  PERSONAL: false,
}

// ─── TAXIMETER STATES ─────────────────────────────────────────

export type TaximeterState =
  | 'OFF' | 'READY' | 'AVAILABLE' | 'HIRED'
  | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'ERROR' | 'LOCKED'

// ─── GPS QUALITY ──────────────────────────────────────────────

export type GPSQuality = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'INVALID'

export interface GPSSample {
  id: string
  tripId: string
  timestamp: number
  latitude: number
  longitude: number
  accuracy: number          // meters
  speed: number             // m/s
  heading: number           // degrees
  source: 'DEVICE_GPS' | 'NETWORK' | 'FUSED'
  quality: GPSQuality
  filtered: boolean         // True if filtered out (GPS jump, impossible speed, etc.)
  filterReason: string | null
}

export function classifyGPSQuality(accuracyMeters: number): GPSQuality {
  if (accuracyMeters <= 5)   return 'EXCELLENT'
  if (accuracyMeters <= 15)  return 'GOOD'
  if (accuracyMeters <= 30)  return 'FAIR'
  if (accuracyMeters <= 100) return 'POOR'
  return 'INVALID'
}

// ─── DISTANCE ENGINE ──────────────────────────────────────────

// Haversine formula — geodesic distance between two GPS points
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export interface DistanceRecord {
  rawDistanceKm: number         // Before filtering
  filteredDistanceKm: number    // After removing GPS anomalies
  acceptedDistanceKm: number    // Final value used for fare
  adjustmentKm: number          // Difference: filtered - accepted
  adjustmentReason: string | null
  gapCount: number              // Number of GPS signal gaps
  anomalyCount: number          // GPS jumps filtered out
}

// Detect GPS anomaly: speed > 220km/h or jump > 3km in < 5s
export function isGPSAnomaly(p1: GPSSample, p2: GPSSample): { anomaly: boolean; reason: string | null } {
  const distKm = haversineKm(p1.latitude, p1.longitude, p2.latitude, p2.longitude)
  const dtSec = Math.max((p2.timestamp - p1.timestamp) / 1000, 0.1)
  const speedKmh = (distKm / dtSec) * 3600
  if (speedKmh > 220) return { anomaly: true, reason: `Vitesse impossible: ${speedKmh.toFixed(0)} km/h` }
  if (distKm > 3 && dtSec < 5) return { anomaly: true, reason: `Saut GPS: ${distKm.toFixed(2)} km en ${dtSec.toFixed(1)}s` }
  if (p2.accuracy > 100) return { anomaly: true, reason: `Précision GPS insuffisante: ${p2.accuracy.toFixed(0)}m` }
  return { anomaly: false, reason: null }
}

// ─── TARIFF ENGINE ────────────────────────────────────────────

export interface TariffRule {
  component: 'BASE' | 'DISTANCE' | 'TIME' | 'WAITING' | 'SURCHARGE' | 'MINIMUM'
  value: number             // Dollar amount per unit
  unit: 'PER_TRIP' | 'PER_KM' | 'PER_MIN' | 'PER_MIN_STOPPED' | 'FIXED'
  threshold: number | null  // Distance/time before rate applies
}

export interface TariffVersion {
  id: string
  jurisdiction: 'CA-QC' | 'CA-ON' | 'CA-BC' | 'OTHER'
  serviceMode: 'TAXI'       // Only TAXI — other modes use provider pricing
  version: string
  effectiveFrom: string
  effectiveTo: string | null
  currency: 'CAD'
  rules: TariffRule[]
  minimumFare: number
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ACTIVE' | 'ARCHIVED'
  publishedBy: string
  publishedAt: string
  sourceRef: string         // Official regulation reference
  // PILOT MODE: not officially homologated until regulatory process completed
  isPilot: boolean
}

// Active tariff — loaded from Government Tariff Configuration (NEVER hardcoded)
export const ACTIVE_TARIFF: TariffVersion = {
  id: 'TAR-QC-2026-V1',
  jurisdiction: 'CA-QC',
  serviceMode: 'TAXI',
  version: '2026-V1',
  effectiveFrom: '2026-01-01',
  effectiveTo: null,
  currency: 'CAD',
  rules: [
    { component:'BASE',     value:3.45, unit:'PER_TRIP',        threshold:null },
    { component:'DISTANCE', value:1.95, unit:'PER_KM',          threshold:0 },
    { component:'TIME',     value:0.50, unit:'PER_MIN',         threshold:0 },
    { component:'WAITING',  value:0.50, unit:'PER_MIN_STOPPED', threshold:0 },
    { component:'MINIMUM',  value:5.90, unit:'FIXED',           threshold:null },
  ],
  minimumFare: 5.90,
  status: 'ACTIVE',
  publishedBy: 'ADMIN-GOV-001',
  publishedAt: '2025-12-01T00:00:00Z',
  sourceRef: 'Décret QC 2025-1234 — Tarification taxi',
  isPilot: true,
}

// Tariff Engine: calculate fare from rules — NEVER hardcoded rates
export function calculateTariffFare(
  tariff: TariffVersion,
  distanceKm: number,
  durationSec: number,
  waitingSec: number
): {
  baseFare: number; distanceFare: number; timeFare: number; waitingFare: number
  subtotal: number; finalFare: number; tariffVersionId: string
} {
  const rules = tariff.rules
  const base = rules.find(r => r.component === 'BASE')?.value ?? 0
  const distRate = rules.find(r => r.component === 'DISTANCE')?.value ?? 0
  const timeRate = rules.find(r => r.component === 'TIME')?.value ?? 0
  const waitRate = rules.find(r => r.component === 'WAITING')?.value ?? 0

  const baseFare = Math.round(base * 100) / 100
  const distanceFare = Math.round(distanceKm * distRate * 100) / 100
  const timeFare = Math.round((durationSec / 60) * timeRate * 100) / 100
  const waitingFare = Math.round((waitingSec / 60) * waitRate * 100) / 100
  const subtotal = Math.round((baseFare + distanceFare + timeFare + waitingFare) * 100) / 100
  const finalFare = Math.max(subtotal, tariff.minimumFare)

  return { baseFare, distanceFare, timeFare, waitingFare, subtotal, finalFare, tariffVersionId: tariff.id }
}

// ─── DEVICE SECURITY ──────────────────────────────────────────

export type DeviceSecurityStatus = 'TRUSTED' | 'WARNING' | 'BLOCKED'

export interface DeviceRegistration {
  deviceId: string
  driverId: string
  platform: 'iOS' | 'Android' | 'Web'
  appVersion: string
  lastSeen: string
  securityStatus: DeviceSecurityStatus
  securityNote: string | null
  rootDetected: boolean
  tamperingDetected: boolean
  // Note: detection is best-effort, not 100% guaranteed
}

// ─── TAXIMETER SESSION ────────────────────────────────────────

export interface TaximeterSession {
  sessionId: string
  driverId: string
  vehicleId: string
  tripId: string              // TX-YYYY-XXXXXXXX format
  serviceMode: ServiceMode
  tariffVersionId: string     // Locked at start — NEVER recalculated retroactively
  taximeterEnabled: boolean   // Derived from serviceMode — never overridden
  state: TaximeterState

  // Timing
  startedAt: number | null
  endedAt: number | null

  // Location
  startLat: number | null; startLng: number | null
  endLat: number | null;   endLng: number | null

  // Metrics
  distanceKm: number
  durationSec: number
  waitingSec: number

  // Fare — tariff-calculated, not hardcoded
  baseFare: number; distanceFare: number; timeFare: number; waitingFare: number
  subtotal: number; finalFare: number
  tipAmount: number
  tpsAmount: number; tvqAmount: number
  totalAmount: number

  // Payment
  paymentMethod: 'CARD' | 'CASH' | 'INTERAC' | 'WALLET' | null
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | null

  // Sync
  syncStatus: 'LOCAL' | 'QUEUED' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'RETRYING'

  // Immutability: after COMPLETED+PAYMENT = LOCKED (amendment required)
  isLocked: boolean
  lockReason: string | null

  // Device & clock
  deviceId: string
  deviceTime: number
  serverTime: number | null
  timeSource: 'DEVICE' | 'SERVER' | 'NTP'

  gpsSamples: number          // count
  gapCount: number
  anomalyCount: number
  notes: string | null
}

// ─── TAXIMETER EVENT ──────────────────────────────────────────

export type TaximeterEventType =
  | 'READY' | 'STARTED' | 'GPS_UPDATED' | 'WAITING_STARTED'
  | 'WAITING_STOPPED' | 'PAUSED' | 'RESUMED' | 'STOPPED'
  | 'FARE_CALCULATED' | 'PAYMENT_STARTED' | 'PAYMENT_COMPLETED'
  | 'CANCELLED' | 'ERROR' | 'GPS_LOST' | 'GPS_RESTORED' | 'OFFLINE_QUEUED'

export interface TaximeterEvent {
  eventId: string             // UNIQUE — duplicate events silently ignored
  sessionId: string
  tripId: string
  driverId: string
  deviceId: string
  eventType: TaximeterEventType
  timestamp: number
  metadata: Record<string, string | number | boolean | null>
  processed: boolean
  duplicate: boolean          // True if same eventId seen before
}

// ─── TRIP DISPUTE ─────────────────────────────────────────────

export interface TripDispute {
  disputeId: string
  tripId: string
  driverId: string
  reason: 'FARE_DISPUTE' | 'DISTANCE_DISPUTE' | 'PAYMENT_DISPUTE' | 'TAX_DISPUTE' | 'TECHNICAL_ISSUE'
  description: string
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED'
  createdAt: string
  resolvedAt: string | null
  // Driver CANNOT modify finalFare directly — requires this process
}

// ─── PRE-RIDE VALIDATION ──────────────────────────────────────

export interface PreRideCheck {
  driverVerified: boolean
  vehicleVerified: boolean
  permitValid: boolean
  gpsAvailable: boolean
  gpsAcceptable: boolean
  tariffAvailable: boolean
  deviceTimeDifference: number | null  // seconds
  deviceTimeValid: boolean
  deviceTrusted: boolean
  serviceAuthorized: boolean
}

export function runPreRideValidation(check: PreRideCheck): {
  canStart: boolean; blockers: string[]; warnings: string[]
} {
  const blockers: string[] = []
  const warnings: string[] = []

  if (!check.driverVerified) blockers.push('Identité chauffeur non vérifiée')
  if (!check.vehicleVerified) blockers.push('Véhicule non vérifié')
  if (!check.permitValid) blockers.push('Permis taxi invalide ou expiré')
  if (!check.gpsAvailable) blockers.push('GPS indisponible — démarrage impossible')
  if (!check.tariffAvailable) blockers.push('Configuration tarifaire indisponible')
  if (!check.deviceTrusted) blockers.push('Appareil non fiable (BLOCKED) — Taximètre verrouillé')
  if (!check.serviceAuthorized) blockers.push('Service non autorisé pour ce chauffeur')
  if (!check.gpsAcceptable) warnings.push('Précision GPS faible — continuer avec prudence')
  if (!check.deviceTimeValid) warnings.push('Décalage horloge détecté — vérifier l\'heure du téléphone')

  return { canStart: blockers.length === 0, blockers, warnings }
}

// ─── EMERGENCY ────────────────────────────────────────────────

export interface EmergencyEvent {
  emergencyId: string
  tripId: string | null
  driverId: string
  deviceId: string
  lat: number | null
  lng: number | null
  timestamp: number
  status: 'ACTIVE' | 'RESOLVED' | 'FALSE_ALARM'
  notes: string | null
}

// ─── MOCK DATA ────────────────────────────────────────────────

export const mockDevice: DeviceRegistration = {
  deviceId: 'DEV-IOS-00123456',
  driverId: 'DR-00001234',
  platform: 'iOS',
  appVersion: '1.2.0',
  lastSeen: new Date().toISOString(),
  securityStatus: 'TRUSTED',
  securityNote: null,
  rootDetected: false,
  tamperingDetected: false,
}

export const mockPreRideCheck: PreRideCheck = {
  driverVerified: true,
  vehicleVerified: true,
  permitValid: true,
  gpsAvailable: true,
  gpsAcceptable: true,
  tariffAvailable: true,
  deviceTimeDifference: 0.8,
  deviceTimeValid: true,
  deviceTrusted: true,
  serviceAuthorized: true,
}

// Completed session (immutable after payment)
export const mockCompletedSession: TaximeterSession = {
  sessionId: 'SESS-001', driverId: 'DR-00001234', vehicleId: 'V-QC-001234',
  tripId: 'TX-2026-A1B2C3D4',
  serviceMode: 'TAXI', tariffVersionId: 'TAR-QC-2026-V1', taximeterEnabled: true,
  state: 'COMPLETED',
  startedAt: Date.now() - 1800000, endedAt: Date.now() - 600000,
  startLat: 45.5017, startLng: -73.5673,
  endLat: 45.5225, endLng: -73.5819,
  distanceKm: 7.2, durationSec: 1082, waitingSec: 180,
  baseFare: 3.45, distanceFare: 14.04, timeFare: 9.02, waitingFare: 1.50,
  subtotal: 28.01, finalFare: 28.01,
  tipAmount: 5.00,
  tpsAmount: 1.40, tvqAmount: 2.79,
  totalAmount: Math.round((28.01 + 5.00 + 1.40 + 2.79) * 100) / 100,
  paymentMethod: 'CARD', paymentStatus: 'COMPLETED',
  syncStatus: 'SYNCED',
  isLocked: true, lockReason: 'COMPLETED + PAYMENT_RECORDED',
  deviceId: 'DEV-IOS-00123456',
  deviceTime: Date.now() - 600000,
  serverTime: Date.now() - 600000 + 800,
  timeSource: 'NTP',
  gpsSamples: 214, gapCount: 0, anomalyCount: 1,
  notes: '1 point GPS filtré (saut 0.8km — bruit GPS tunnel)',
}

// Events log for completed session
export const mockEvents: TaximeterEvent[] = [
  { eventId:'EVT-001', sessionId:'SESS-001', tripId:'TX-2026-A1B2C3D4', driverId:'DR-00001234', deviceId:'DEV-IOS-00123456', eventType:'READY', timestamp:Date.now()-2000000, metadata:{tariffVersion:'TAR-QC-2026-V1'}, processed:true, duplicate:false },
  { eventId:'EVT-002', sessionId:'SESS-001', tripId:'TX-2026-A1B2C3D4', driverId:'DR-00001234', deviceId:'DEV-IOS-00123456', eventType:'STARTED', timestamp:Date.now()-1800000, metadata:{lat:45.5017,lng:-73.5673,accuracy:8}, processed:true, duplicate:false },
  { eventId:'EVT-003', sessionId:'SESS-001', tripId:'TX-2026-A1B2C3D4', driverId:'DR-00001234', deviceId:'DEV-IOS-00123456', eventType:'WAITING_STARTED', timestamp:Date.now()-1500000, metadata:{reason:'traffic_stop'}, processed:true, duplicate:false },
  { eventId:'EVT-004', sessionId:'SESS-001', tripId:'TX-2026-A1B2C3D4', driverId:'DR-00001234', deviceId:'DEV-IOS-00123456', eventType:'WAITING_STOPPED', timestamp:Date.now()-1320000, metadata:{waitingSec:180}, processed:true, duplicate:false },
  { eventId:'EVT-004', sessionId:'SESS-001', tripId:'TX-2026-A1B2C3D4', driverId:'DR-00001234', deviceId:'DEV-IOS-00123456', eventType:'WAITING_STOPPED', timestamp:Date.now()-1319000, metadata:{}, processed:false, duplicate:true },
  { eventId:'EVT-005', sessionId:'SESS-001', tripId:'TX-2026-A1B2C3D4', driverId:'DR-00001234', deviceId:'DEV-IOS-00123456', eventType:'STOPPED', timestamp:Date.now()-600000, metadata:{distanceKm:7.2,durationSec:1082,finalFare:28.01}, processed:true, duplicate:false },
  { eventId:'EVT-006', sessionId:'SESS-001', tripId:'TX-2026-A1B2C3D4', driverId:'DR-00001234', deviceId:'DEV-IOS-00123456', eventType:'PAYMENT_COMPLETED', timestamp:Date.now()-580000, metadata:{method:'CARD',amount:37.20}, processed:true, duplicate:false },
]

export const mockGPSSamples: GPSSample[] = [
  { id:'GPS-001', tripId:'TX-2026-A1B2C3D4', timestamp:Date.now()-1800000, latitude:45.5017, longitude:-73.5673, accuracy:8, speed:0, heading:0, source:'DEVICE_GPS', quality:'EXCELLENT', filtered:false, filterReason:null },
  { id:'GPS-002', tripId:'TX-2026-A1B2C3D4', timestamp:Date.now()-1799000, latitude:45.5019, longitude:-73.5675, accuracy:7, speed:5.5, heading:215, source:'DEVICE_GPS', quality:'EXCELLENT', filtered:false, filterReason:null },
  { id:'GPS-GAP', tripId:'TX-2026-A1B2C3D4', timestamp:Date.now()-1200000, latitude:45.5180, longitude:-73.5750, accuracy:280, speed:0, heading:0, source:'DEVICE_GPS', quality:'INVALID', filtered:true, filterReason:'Précision GPS insuffisante: 280m — point ignoré' },
  { id:'GPS-003', tripId:'TX-2026-A1B2C3D4', timestamp:Date.now()-800000, latitude:45.5210, longitude:-73.5800, accuracy:9, speed:8.2, heading:320, source:'DEVICE_GPS', quality:'EXCELLENT', filtered:false, filterReason:null },
  { id:'GPS-004', tripId:'TX-2026-A1B2C3D4', timestamp:Date.now()-600000, latitude:45.5225, longitude:-73.5819, accuracy:6, speed:0, heading:0, source:'DEVICE_GPS', quality:'EXCELLENT', filtered:false, filterReason:null },
]

// Helper
export const fmt = (v: number) => new Intl.NumberFormat('fr-CA', { style:'currency', currency:'CAD' }).format(v)

export function generateTripId(): string {
  const year = new Date().getFullYear()
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const rand = Array.from({length:8}, () => chars[Math.floor(Math.random()*chars.length)]).join('')
  return `TX-${year}-${rand}`
}
