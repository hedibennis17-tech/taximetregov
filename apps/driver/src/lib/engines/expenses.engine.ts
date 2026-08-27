// ============================================================
// TAXIMÈTRE.GOV — EXPENSES, MILEAGE & GPS ACTIVITY ENGINE
// Phase 2 — Step 21
// ============================================================
//
// RÈGLES ABSOLUES:
// 1. Jamais déclarer automatiquement une dépense comme "déductible"
// 2. Jamais considérer chaque km professionnel comme déductible
// 3. Jamais recalculer le prix Uber/Lyft/DoorDash
// 4. Taximeter DISABLED pour Delivery et Rideshare
// 5. GPS ≠ surveillance permanente — privacy-first
// 6. Ne jamais inventer des km manquants (GPS coupé = gap marqué)
// 7. Tax Engine décide du traitement fiscal — pas ce module
// ============================================================

import { type ActivityType } from '@/data/driver.mock'

// ─── EXPENSE TYPES ────────────────────────────────────────────

export type ExpenseCategory =
  | 'FUEL' | 'VEHICLE_MAINTENANCE' | 'VEHICLE_REPAIR'
  | 'VEHICLE_INSURANCE' | 'PARKING' | 'TOLLS'
  | 'PHONE' | 'INTERNET' | 'SOFTWARE'
  | 'PROFESSIONAL_SERVICE' | 'SUPPLIES' | 'OTHER'

export type ExpenseActivity =
  | 'TAXI' | 'RIDESHARE' | 'DELIVERY' | 'MULTI_ACTIVITY' | 'PERSONAL' | 'UNKNOWN'

export type ExpenseStatus = 'DRAFT' | 'CONFIRMED' | 'REVIEW_REQUIRED' | 'REJECTED' | 'ARCHIVED'

export type DeductibilityStatus =
  | 'UNKNOWN' | 'POTENTIALLY_DEDUCTIBLE' | 'NOT_DEDUCTIBLE' | 'REVIEW_REQUIRED'
// ↑ NEVER auto-set to DEDUCTIBLE — Tax Engine decides

export type MileageType = 'BUSINESS' | 'PERSONAL' | 'MIXED' | 'UNKNOWN'

export type GPSMode =
  | 'OFFLINE' | 'AVAILABLE' | 'ON_TRIP' | 'ON_DELIVERY'
  | 'PAUSED' | 'PERSONAL' | 'EMERGENCY'

export type DistanceSource =
  | 'OFFICIAL_PROVIDER_DATA' | 'TAXIMETER_DATA' | 'DEVICE_GPS' | 'MANUAL' | 'IMPORTED'

export type GPSSyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'RETRYING'

export type OdometerSource = 'MANUAL' | 'DEVICE' | 'SERVICE' | 'INSPECTION'

// ─── BUSINESS EXPENSE ─────────────────────────────────────────

export interface BusinessExpense {
  id: string
  driverId: string
  date: string
  supplier: string | null
  description: string
  category: ExpenseCategory
  subtotal: number
  taxAmount: number
  totalAmount: number
  currency: 'CAD'
  paymentMethod: 'CARD' | 'CASH' | 'INTERAC' | 'APP' | 'OTHER'
  receiptId: string | null
  vehicleId: string | null
  activity: ExpenseActivity
  businessUsePercentage: number       // 0-100 — driver-declared, not auto-determined
  businessPortion: number             // computed: totalAmount * businessUsePercentage / 100
  personalPortion: number             // computed: totalAmount - businessPortion
  deductibilityStatus: DeductibilityStatus  // NEVER auto-set to DEDUCTIBLE
  status: ExpenseStatus
  notes: string | null
  possibleDuplicate: boolean
  originalAmount: number | null       // if corrected, store original
  correctionReason: string | null
  createdAt: string
  updatedAt: string
}

// ─── ACTIVITY SEGMENT ─────────────────────────────────────────

export interface ActivitySegment {
  id: string
  driverId: string
  activity: ExpenseActivity
  vehicleId: string | null
  startTime: string
  endTime: string | null
  distanceKm: number | null
  durationMin: number | null
  gpsAccuracy: 'GOOD' | 'ACCEPTABLE' | 'POOR' | 'INVALID' | null
  source: DistanceSource
  syncStatus: GPSSyncStatus
  taximeterEnabled: boolean           // TAXI=true, all else=false
  providerDistanceKm: number | null   // from Uber/Lyft/DoorDash — never recalculated
  deviceGpsDistanceKm: number | null  // from phone GPS
  distanceDifference: number | null   // provider vs GPS — INFO only, never modifies provider
  status: 'ACTIVE' | 'COMPLETED' | 'INCOMPLETE' | 'GPS_GAP'  // GPS_GAP = signal lost, no invented km
  notes: string | null
}

// ─── MILEAGE RECORD ───────────────────────────────────────────

export interface MileageRecord {
  id: string
  driverId: string
  vehicleId: string
  date: string
  startOdometer: number | null
  endOdometer: number | null
  calculatedDistanceKm: number | null
  activity: ExpenseActivity
  mileageType: MileageType
  source: DistanceSource
  odometerValidated: boolean          // false if end < start → REVIEW_REQUIRED
  notes: string | null
  createdAt: string
}

// ─── VEHICLE ODOMETER ─────────────────────────────────────────

export interface VehicleOdometer {
  id: string
  vehicleId: string
  driverId: string
  reading: number                     // km
  date: string
  source: OdometerSource
  previousReading: number | null
  isValid: boolean                    // false if reading < previousReading
  validationNote: string | null
}

// ─── MILEAGE AGGREGATION ──────────────────────────────────────

export interface MileageAggregation {
  period: string
  taxiKm: number
  rideshareKm: number
  deliveryKm: number
  otherBusinessKm: number
  personalKm: number
  totalBusinessKm: number
  totalVehicleKm: number
  businessUsePercent: number          // computed ratio — not a tax claim
  dataQuality: 'COMPLETE' | 'PARTIAL' | 'REVIEW_REQUIRED'
}

// ─── GPS SESSION ──────────────────────────────────────────────

export interface GPSActivitySession {
  sessionId: string
  driverId: string
  vehicleId: string | null
  mode: GPSMode
  startedAt: string
  endedAt: string | null
  syncStatus: GPSSyncStatus
  totalDistanceKm: number | null
  gapCount: number                    // number of GPS signal losses
  retentionPolicy: 'SESSION_ONLY' | 'AGGREGATED_7D' | 'AUDIT_30D'
  // Raw GPS points stored with short retention — aggregate after N days
  // Coordinates: stored server-side only, never exposed raw to frontend
}

// ─── DISTANCE RESOLVER ────────────────────────────────────────

export interface DistanceResolverResult {
  resolvedDistanceKm: number
  source: DistanceSource
  providerKm: number | null
  taximeterKm: number | null
  deviceGpsKm: number | null
  manualKm: number | null
  difference: number | null           // INFO only — never modifies provider data
  status: 'RESOLVED' | 'PARTIAL' | 'REVIEW_REQUIRED'
  note: string
}

export function resolveDistance(
  providerKm: number | null,
  taximeterKm: number | null,
  deviceGpsKm: number | null,
  activity: ExpenseActivity
): DistanceResolverResult {
  // Priority: OFFICIAL_PROVIDER_DATA > TAXIMETER_DATA > DEVICE_GPS > MANUAL
  if (activity === 'TAXI' && taximeterKm !== null) {
    const diff = deviceGpsKm !== null ? Math.abs(taximeterKm - deviceGpsKm) : null
    return { resolvedDistanceKm: taximeterKm, source: 'TAXIMETER_DATA', providerKm, taximeterKm, deviceGpsKm, manualKm: null, difference: diff, status: 'RESOLVED', note: 'Distance taximètre utilisée' }
  }
  if (providerKm !== null) {
    const diff = deviceGpsKm !== null ? Math.abs(providerKm - deviceGpsKm) : null
    return { resolvedDistanceKm: providerKm, source: 'OFFICIAL_PROVIDER_DATA', providerKm, taximeterKm, deviceGpsKm, manualKm: null, difference: diff, status: diff && diff > 1 ? 'REVIEW_REQUIRED' : 'RESOLVED', note: 'Distance fournisseur officielle' }
  }
  if (deviceGpsKm !== null) {
    return { resolvedDistanceKm: deviceGpsKm, source: 'DEVICE_GPS', providerKm, taximeterKm, deviceGpsKm, manualKm: null, difference: null, status: 'PARTIAL', note: 'GPS appareil — vérification recommandée' }
  }
  return { resolvedDistanceKm: 0, source: 'MANUAL', providerKm, taximeterKm, deviceGpsKm, manualKm: null, difference: null, status: 'REVIEW_REQUIRED', note: 'Aucune source de distance disponible' }
}

// ─── EXPENSE CATEGORY CONFIG ──────────────────────────────────

export const EXPENSE_CATEGORY_CONFIG: Record<ExpenseCategory, { icon: string; label: string; color: string }> = {
  FUEL:                  { icon:'⛽', label:'Carburant',            color:'text-amber-400' },
  VEHICLE_MAINTENANCE:   { icon:'🔧', label:'Entretien véhicule',  color:'text-blue-400' },
  VEHICLE_REPAIR:        { icon:'🛠️', label:'Réparation',           color:'text-orange-400' },
  VEHICLE_INSURANCE:     { icon:'🛡️', label:'Assurance véhicule',  color:'text-green-400' },
  PARKING:               { icon:'🅿️', label:'Stationnement',        color:'text-purple-400' },
  TOLLS:                 { icon:'🛣️', label:'Péages',               color:'text-slate-300' },
  PHONE:                 { icon:'📱', label:'Téléphone',            color:'text-cyan-400' },
  INTERNET:              { icon:'🌐', label:'Internet',             color:'text-cyan-400' },
  SOFTWARE:              { icon:'💻', label:'Logiciels',            color:'text-indigo-400' },
  PROFESSIONAL_SERVICE:  { icon:'📋', label:'Services professionnels', color:'text-rose-400' },
  SUPPLIES:              { icon:'📦', label:'Fournitures',          color:'text-yellow-400' },
  OTHER:                 { icon:'💼', label:'Autre',                color:'text-slate-400' },
}

export const ACTIVITY_ICONS_EXPENSE: Record<ExpenseActivity, string> = {
  TAXI: '🚕', RIDESHARE: '🚗', DELIVERY: '📦',
  MULTI_ACTIVITY: '🔀', PERSONAL: '🏠', UNKNOWN: '❓'
}

// ─── MOCK DATA ────────────────────────────────────────────────

const fmt = (v: number) => Math.round(v * 100) / 100

function makeExpense(id: string, date: string, cat: ExpenseCategory, supplier: string, desc: string, subtotal: number, taxAmt: number, activity: ExpenseActivity, buPct: number, vehicleId: string | null = 'V-QC-001234'): BusinessExpense {
  const total = fmt(subtotal + taxAmt)
  const biz = fmt(total * buPct / 100)
  return {
    id, driverId:'DR-00001234', date, supplier, description:desc, category:cat,
    subtotal, taxAmount:taxAmt, totalAmount:total, currency:'CAD',
    paymentMethod:'CARD', receiptId:`REC-${id}`, vehicleId, activity,
    businessUsePercentage:buPct, businessPortion:biz, personalPortion:fmt(total - biz),
    deductibilityStatus:'UNKNOWN',  // NEVER auto-declared deductible
    status:'CONFIRMED', notes:null, possibleDuplicate:false,
    originalAmount:null, correctionReason:null,
    createdAt:date+'T08:00:00Z', updatedAt:date+'T08:00:00Z',
  }
}

export const mockExpenses: BusinessExpense[] = [
  makeExpense('EXP-001','2026-08-24','FUEL','Shell — Montréal','Carburant Aug 24',68.00,3.40+6.78,'MULTI_ACTIVITY',90),
  makeExpense('EXP-002','2026-08-24','PARKING','Stationnement Vieux-Port','Stationnement Aug 24',18.00,0.90+1.80,'TAXI',100),
  makeExpense('EXP-003','2026-08-23','FUEL','Petro-Canada — Laval','Carburant Aug 23',72.00,3.60+7.17,'MULTI_ACTIVITY',90),
  makeExpense('EXP-004','2026-08-22','VEHICLE_MAINTENANCE','Speedy Auto — Brossard','Vidange + filtre',185.00,9.25+18.44,'MULTI_ACTIVITY',100),
  makeExpense('EXP-005','2026-08-20','TOLLS','A25 — Transpac','Péages semaine',12.50,0.625+1.25,'MULTI_ACTIVITY',95),
  makeExpense('EXP-006','2026-08-18','PHONE','Telus','Forfait professionnel',89.99,4.50+8.97,'MULTI_ACTIVITY',80),
  makeExpense('EXP-007','2026-08-15','VEHICLE_INSURANCE','Intact Assurance','Assurance commerciale mensuelle',320.00,0,'MULTI_ACTIVITY',100),
  makeExpense('EXP-008','2026-08-10','SOFTWARE','Google Maps Platform','Abonnement pro navigation',24.99,1.25+2.49,'MULTI_ACTIVITY',100),
  makeExpense('EXP-009','2026-08-05','VEHICLE_MAINTENANCE','Couche-Tard — Longueuil','Lave-glace + gonflage',14.25,0.71+1.42,'MULTI_ACTIVITY',100),
]

export const mockActivitySegments: ActivitySegment[] = [
  { id:'SEG-001', driverId:'DR-00001234', activity:'TAXI', vehicleId:'V-QC-001234', startTime:'2026-08-24T15:02:00Z', endTime:'2026-08-24T15:22:00Z', distanceKm:7.2, durationMin:20, gpsAccuracy:'GOOD', source:'TAXIMETER_DATA', syncStatus:'SYNCED', taximeterEnabled:true, providerDistanceKm:null, deviceGpsDistanceKm:7.4, distanceDifference:0.2, status:'COMPLETED', notes:null },
  { id:'SEG-002', driverId:'DR-00001234', activity:'RIDESHARE', vehicleId:'V-QC-001234', startTime:'2026-08-24T13:30:00Z', endTime:'2026-08-24T13:52:00Z', distanceKm:9.1, durationMin:22, gpsAccuracy:'GOOD', source:'OFFICIAL_PROVIDER_DATA', syncStatus:'SYNCED', taximeterEnabled:false, providerDistanceKm:9.1, deviceGpsDistanceKm:9.4, distanceDifference:0.3, status:'COMPLETED', notes:'Uber — prix fourni par Uber' },
  { id:'SEG-003', driverId:'DR-00001234', activity:'DELIVERY', vehicleId:'V-QC-001234', startTime:'2026-08-24T14:15:00Z', endTime:'2026-08-24T14:40:00Z', distanceKm:4.8, durationMin:25, gpsAccuracy:'GOOD', source:'OFFICIAL_PROVIDER_DATA', syncStatus:'SYNCED', taximeterEnabled:false, providerDistanceKm:4.8, deviceGpsDistanceKm:5.1, distanceDifference:0.3, status:'COMPLETED', notes:'DoorDash — taximètre désactivé' },
  { id:'SEG-004', driverId:'DR-00001234', activity:'PERSONAL', vehicleId:'V-QC-001234', startTime:'2026-08-24T08:00:00Z', endTime:'2026-08-24T09:00:00Z', distanceKm:18.2, durationMin:60, gpsAccuracy:'GOOD', source:'DEVICE_GPS', syncStatus:'SYNCED', taximeterEnabled:false, providerDistanceKm:null, deviceGpsDistanceKm:18.2, distanceDifference:null, status:'COMPLETED', notes:'Trajet domicile-début de service' },
  { id:'SEG-005', driverId:'DR-00001234', activity:'TAXI', vehicleId:'V-QC-001234', startTime:'2026-08-24T11:15:00Z', endTime:'2026-08-24T11:47:00Z', distanceKm:12.4, durationMin:32, gpsAccuracy:'ACCEPTABLE', source:'TAXIMETER_DATA', syncStatus:'SYNCED', taximeterEnabled:true, providerDistanceKm:null, deviceGpsDistanceKm:12.1, distanceDifference:0.3, status:'COMPLETED', notes:null },
  { id:'SEG-006', driverId:'DR-00001234', activity:'RIDESHARE', vehicleId:'V-QC-001234', startTime:'2026-08-24T10:05:00Z', endTime:'2026-08-24T10:32:00Z', distanceKm:11.2, durationMin:27, gpsAccuracy:'GOOD', source:'OFFICIAL_PROVIDER_DATA', syncStatus:'SYNCED', taximeterEnabled:false, providerDistanceKm:11.2, deviceGpsDistanceKm:null, distanceDifference:null, status:'COMPLETED', notes:'GPS appareil indisponible — données fournisseur utilisées' },
]

export const mockMileageRecords: MileageRecord[] = [
  { id:'ML-001', driverId:'DR-00001234', vehicleId:'V-QC-001234', date:'2026-08-24', startOdometer:82140, endOdometer:82203, calculatedDistanceKm:63, activity:'MULTI_ACTIVITY', mileageType:'BUSINESS', source:'MANUAL', odometerValidated:true, notes:'Journée complète', createdAt:'2026-08-24T22:00:00Z' },
  { id:'ML-002', driverId:'DR-00001234', vehicleId:'V-QC-001234', date:'2026-08-23', startOdometer:82076, endOdometer:82140, calculatedDistanceKm:64, activity:'MULTI_ACTIVITY', mileageType:'BUSINESS', source:'MANUAL', odometerValidated:true, notes:null, createdAt:'2026-08-23T22:00:00Z' },
]

export const mockOdometer: VehicleOdometer[] = [
  { id:'ODO-001', vehicleId:'V-QC-001234', driverId:'DR-00001234', reading:82203, date:'2026-08-24', source:'MANUAL', previousReading:82140, isValid:true, validationNote:null },
  { id:'ODO-002', vehicleId:'V-QC-001234', driverId:'DR-00001234', reading:82140, date:'2026-08-23', source:'MANUAL', previousReading:82076, isValid:true, validationNote:null },
]

export const mockMileageAggregation: MileageAggregation[] = [
  { period:'2026-08', taxiKm:1245, rideshareKm:1840, deliveryKm:920, otherBusinessKm:0, personalKm:680, totalBusinessKm:4005, totalVehicleKm:4685, businessUsePercent:85.5, dataQuality:'PARTIAL' },
  { period:'2026-07', taxiKm:1180, rideshareKm:1650, deliveryKm:880, otherBusinessKm:20, personalKm:720, totalBusinessKm:3730, totalVehicleKm:4450, businessUsePercent:83.8, dataQuality:'COMPLETE' },
  { period:'2026-06', taxiKm:1310, rideshareKm:1920, deliveryKm:780, otherBusinessKm:15, personalKm:650, totalBusinessKm:4025, totalVehicleKm:4675, businessUsePercent:86.1, dataQuality:'COMPLETE' },
]

// ─── AGGREGATION HELPER ───────────────────────────────────────

export function aggregateExpenses(expenses: BusinessExpense[], catFilter?: ExpenseCategory): {
  total: number; businessTotal: number; byCategory: Record<string, number>
} {
  const filtered = catFilter ? expenses.filter(e => e.category === catFilter) : expenses
  const total = filtered.reduce((a, e) => a + e.totalAmount, 0)
  const businessTotal = filtered.reduce((a, e) => a + e.businessPortion, 0)
  const byCategory: Record<string, number> = {}
  filtered.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.totalAmount
  })
  return { total: fmt(total), businessTotal: fmt(businessTotal), byCategory }
}

export function formatCAD(v: number): string {
  return new Intl.NumberFormat('fr-CA', { style:'currency', currency:'CAD' }).format(v)
}

// ─── GPS ACTIVITY TIMELINE (mock) ────────────────────────────

export interface ActivityTimelineEntry {
  time: string
  activity: ExpenseActivity
  label: string
  distanceKm: number | null
  taximeterEnabled: boolean
  source: DistanceSource
}

export const mockActivityTimeline: ActivityTimelineEntry[] = [
  { time:'08:00', activity:'PERSONAL', label:'Trajet domicile', distanceKm:18.2, taximeterEnabled:false, source:'DEVICE_GPS' },
  { time:'09:05', activity:'TAXI', label:'Course taxi #1', distanceKm:12.4, taximeterEnabled:true, source:'TAXIMETER_DATA' },
  { time:'09:47', activity:'TAXI', label:'Attente disponible', distanceKm:null, taximeterEnabled:true, source:'DEVICE_GPS' },
  { time:'10:05', activity:'RIDESHARE', label:'Course Uber', distanceKm:11.2, taximeterEnabled:false, source:'OFFICIAL_PROVIDER_DATA' },
  { time:'10:32', activity:'RIDESHARE', label:'Attente Uber', distanceKm:null, taximeterEnabled:false, source:'DEVICE_GPS' },
  { time:'11:15', activity:'TAXI', label:'Course taxi #2', distanceKm:7.2, taximeterEnabled:true, source:'TAXIMETER_DATA' },
  { time:'13:30', activity:'RIDESHARE', label:'Course Uber', distanceKm:9.1, taximeterEnabled:false, source:'OFFICIAL_PROVIDER_DATA' },
  { time:'14:15', activity:'DELIVERY', label:'Livraison DoorDash', distanceKm:4.8, taximeterEnabled:false, source:'OFFICIAL_PROVIDER_DATA' },
  { time:'15:02', activity:'TAXI', label:'Course taxi #3', distanceKm:7.2, taximeterEnabled:true, source:'TAXIMETER_DATA' },
  { time:'15:45', activity:'PERSONAL', label:'Retour domicile', distanceKm:16.5, taximeterEnabled:false, source:'DEVICE_GPS' },
]
