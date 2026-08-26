// ============================================================
// TAXIMÈTRE.GOV — REVENUE ENGINE
// Phase 2 — Step 18: Revenue & Earnings Center
// ============================================================
//
// RÈGLES ABSOLUES:
// 1. Revenue Center = vue calculée depuis Ledger — jamais source de vérité
// 2. Jamais mélanger les sources (TAXI ≠ RIDESHARE ≠ DELIVERY)
// 3. Conserver gross/fees/tips/adjustments/refunds séparément — jamais écraser
// 4. Taximeter DISABLED pour Rideshare et Delivery
// 5. Cash enregistré séparément — jamais ignoré
// 6. Corrections via Adjustment uniquement — jamais modification silencieuse
// ============================================================

// ─── TYPES ───────────────────────────────────────────────────

export type RevenueSource =
  | 'TAXIMETER' | 'UBER' | 'LYFT' | 'DOORDASH'
  | 'INSTACART' | 'UBER_EATS' | 'SKIP' | 'CASH' | 'OTHER'

export type ActivityCategory = 'TAXI' | 'RIDESHARE' | 'DELIVERY'
export type PaymentStatus =
  | 'PENDING' | 'AUTHORIZED' | 'PAID' | 'FAILED'
  | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'CASH_RECORDED' | 'UNKNOWN'
export type AmountStatus = 'ESTIMATED' | 'UPDATED' | 'FINAL'
export type RevSyncStatus = 'SYNCED' | 'PENDING' | 'PROCESSING' | 'ERROR' | 'UNMATCHED' | 'REVIEW_REQUIRED'

export const SOURCE_TO_ACTIVITY: Record<RevenueSource, ActivityCategory> = {
  TAXIMETER: 'TAXI',
  UBER:      'RIDESHARE',
  LYFT:      'RIDESHARE',
  DOORDASH:  'DELIVERY',
  INSTACART: 'DELIVERY',
  UBER_EATS: 'DELIVERY',
  SKIP:      'DELIVERY',
  CASH:      'TAXI',
  OTHER:     'DELIVERY',
}

export const SOURCE_TAXIMETER_ENABLED: Record<RevenueSource, boolean> = {
  TAXIMETER: true,
  UBER: false, LYFT: false, DOORDASH: false,
  INSTACART: false, UBER_EATS: false, SKIP: false,
  CASH: false, OTHER: false,
}

// ─── REVENUE TRANSACTION ─────────────────────────────────────

export interface RevenueTransaction {
  transactionId: string
  driverId: string
  source: RevenueSource
  activity: ActivityCategory
  taximeterEnabled: boolean

  // Provider reference — always kept
  providerReference: string | null   // e.g. "UBER-TRIP-8F72A91"
  providerName: string

  // Financial components — ALWAYS separate, never collapsed
  grossAmount: number
  providerFee: number
  platformFee: number
  tip: number
  positiveAdjustments: number
  negativeAdjustments: number
  refunds: number
  netAmount: number

  // Amount status
  amountStatus: AmountStatus
  paymentMethod: 'CARD' | 'INTERAC' | 'CASH' | 'WALLET' | 'APP' | 'UNKNOWN'
  paymentStatus: PaymentStatus

  // Timing
  occurredAt: string
  completedAt: string | null

  // Status
  syncStatus: RevSyncStatus
  ledgerPosted: boolean
  notes: string | null

  // Trip metadata (optional)
  distanceKm: number | null
  durationMin: number | null
}

// ─── REVENUE AGGREGATION ─────────────────────────────────────

export interface RevenueAggregation {
  // Total
  grossRevenue: number
  totalFees: number
  totalTips: number
  totalAdjustments: number      // net (positive - negative)
  totalRefunds: number
  netRevenue: number

  // By activity
  taxiGross: number
  rideshareGross: number
  deliveryGross: number

  // By source
  bySource: Record<RevenueSource, number>

  // Counts
  transactionCount: number
  taxiTrips: number
  rideshareTrips: number
  deliveryOrders: number

  // Period
  period: string
  from: string
  to: string
}

// ─── DAILY/WEEKLY/MONTHLY SUMMARY ────────────────────────────

export interface DailyRevenueSummary {
  date: string
  taxiGross: number
  rideshareGross: number
  deliveryGross: number
  tips: number
  fees: number
  adjustments: number
  refunds: number
  netRevenue: number
  transactionCount: number
}

export interface MonthlyRevenueSummary {
  month: string           // "2026-08"
  label: string           // "Août 2026"
  taxi: number
  rideshare: number
  delivery: number
  tips: number
  fees: number
  adjustments: number
  refunds: number
  net: number
  trips: number
}

// ─── REVENUE ADJUSTMENT ──────────────────────────────────────

export interface RevenueAdjustment {
  adjustmentId: string
  transactionId: string
  reason: string
  amount: number
  authorizedBy: string
  createdAt: string
  providerReference: string | null
}

// ─── RECONCILIATION ──────────────────────────────────────────

export interface RevenueReconciliation {
  provider: string
  providerTotal: number
  internalTotal: number
  difference: number
  status: 'MATCHED' | 'MISMATCH' | 'MISSING' | 'REVIEW_REQUIRED'
  transactionCount: number
  missingCount: number
}

// ─── MOCK TRANSACTION DATA ────────────────────────────────────

const fmt = (v: number) => Math.round(v * 100) / 100

export const mockRevenueTransactions: RevenueTransaction[] = [
  // TAXI trips
  { transactionId:'REV-001', driverId:'DR-00001234', source:'TAXIMETER', activity:'TAXI', taximeterEnabled:true, providerReference:'TAXI-MSESS-A1B2C3', providerName:'Taxi (Taximètre.GOV)', grossAmount:42.50, providerFee:0, platformFee:0, tip:5.00, positiveAdjustments:0, negativeAdjustments:0, refunds:0, netAmount:47.50, amountStatus:'FINAL', paymentMethod:'CARD', paymentStatus:'PAID', occurredAt:'2026-08-24T15:02:00Z', completedAt:'2026-08-24T15:22:00Z', syncStatus:'SYNCED', ledgerPosted:true, notes:null, distanceKm:7.2, durationMin:18 },
  { transactionId:'REV-002', driverId:'DR-00001234', source:'TAXIMETER', activity:'TAXI', taximeterEnabled:true, providerReference:'TAXI-MSESS-B3C4D5', providerName:'Taxi (Taximètre.GOV)', grossAmount:58.00, providerFee:0, platformFee:0, tip:8.00, positiveAdjustments:0, negativeAdjustments:0, refunds:0, netAmount:66.00, amountStatus:'FINAL', paymentMethod:'INTERAC', paymentStatus:'PAID', occurredAt:'2026-08-24T11:15:00Z', completedAt:'2026-08-24T11:47:00Z', syncStatus:'SYNCED', ledgerPosted:true, notes:null, distanceKm:12.4, durationMin:32 },
  { transactionId:'REV-003', driverId:'DR-00001234', source:'CASH', activity:'TAXI', taximeterEnabled:false, providerReference:'TAXI-CASH-C5D6E7', providerName:'Taxi — Comptant', grossAmount:35.00, providerFee:0, platformFee:0, tip:3.00, positiveAdjustments:0, negativeAdjustments:0, refunds:0, netAmount:38.00, amountStatus:'FINAL', paymentMethod:'CASH', paymentStatus:'CASH_RECORDED', occurredAt:'2026-08-24T09:10:00Z', completedAt:'2026-08-24T09:35:00Z', syncStatus:'SYNCED', ledgerPosted:true, notes:'Paiement comptant confirmé par chauffeur', distanceKm:6.1, durationMin:15 },

  // RIDESHARE trips
  { transactionId:'REV-004', driverId:'DR-00001234', source:'UBER', activity:'RIDESHARE', taximeterEnabled:false, providerReference:'UBER-8F72A91', providerName:'Uber', grossAmount:28.40, providerFee:6.20, platformFee:0, tip:4.00, positiveAdjustments:0, negativeAdjustments:0, refunds:0, netAmount:26.20, amountStatus:'FINAL', paymentMethod:'APP', paymentStatus:'PAID', occurredAt:'2026-08-24T13:30:00Z', completedAt:'2026-08-24T13:52:00Z', syncStatus:'SYNCED', ledgerPosted:true, notes:null, distanceKm:9.1, durationMin:22 },
  { transactionId:'REV-005', driverId:'DR-00001234', source:'UBER', activity:'RIDESHARE', taximeterEnabled:false, providerReference:'UBER-B92KL3', providerName:'Uber', grossAmount:33.20, providerFee:7.10, platformFee:0, tip:0, positiveAdjustments:0, negativeAdjustments:0, refunds:0, netAmount:26.10, amountStatus:'FINAL', paymentMethod:'APP', paymentStatus:'PAID', occurredAt:'2026-08-24T10:05:00Z', completedAt:'2026-08-24T10:32:00Z', syncStatus:'SYNCED', ledgerPosted:true, notes:null, distanceKm:11.2, durationMin:27 },
  { transactionId:'REV-006', driverId:'DR-00001234', source:'UBER', activity:'RIDESHARE', taximeterEnabled:false, providerReference:'UBER-C34MN8', providerName:'Uber', grossAmount:25.70, providerFee:5.60, platformFee:0, tip:3.00, positiveAdjustments:2.50, negativeAdjustments:0, refunds:0, netAmount:25.60, amountStatus:'FINAL', paymentMethod:'APP', paymentStatus:'PAID', occurredAt:'2026-08-23T16:20:00Z', completedAt:'2026-08-23T16:42:00Z', syncStatus:'SYNCED', ledgerPosted:true, notes:'Ajustement Peak: +2.50$', distanceKm:7.8, durationMin:22 },

  // DELIVERY orders
  { transactionId:'REV-007', driverId:'DR-00001234', source:'DOORDASH', activity:'DELIVERY', taximeterEnabled:false, providerReference:'DD-DELIVERY-9X2K', providerName:'DoorDash', grossAmount:18.90, providerFee:2.50, platformFee:0, tip:3.00, positiveAdjustments:2.00, negativeAdjustments:0, refunds:0, netAmount:21.40, amountStatus:'FINAL', paymentMethod:'APP', paymentStatus:'PAID', occurredAt:'2026-08-24T14:15:00Z', completedAt:'2026-08-24T14:40:00Z', syncStatus:'SYNCED', ledgerPosted:true, notes:'Peak Pay +2.00$', distanceKm:4.8, durationMin:25 },
  { transactionId:'REV-008', driverId:'DR-00001234', source:'DOORDASH', activity:'DELIVERY', taximeterEnabled:false, providerReference:'DD-DELIVERY-4Y5Z', providerName:'DoorDash', grossAmount:15.20, providerFee:2.00, platformFee:0, tip:2.50, positiveAdjustments:0, negativeAdjustments:0, refunds:0, netAmount:15.70, amountStatus:'FINAL', paymentMethod:'APP', paymentStatus:'PAID', occurredAt:'2026-08-24T12:45:00Z', completedAt:'2026-08-24T13:10:00Z', syncStatus:'SYNCED', ledgerPosted:true, notes:null, distanceKm:3.2, durationMin:25 },
  { transactionId:'REV-009', driverId:'DR-00001234', source:'DOORDASH', activity:'DELIVERY', taximeterEnabled:false, providerReference:'DD-PENDING-001', providerName:'DoorDash', grossAmount:14.50, providerFee:1.80, platformFee:0, tip:2.00, positiveAdjustments:0, negativeAdjustments:0, refunds:0, netAmount:14.70, amountStatus:'ESTIMATED', paymentMethod:'APP', paymentStatus:'PENDING', occurredAt:'2026-08-24T15:45:00Z', completedAt:null, syncStatus:'PENDING', ledgerPosted:false, notes:'Montant estimé — finalisation en attente', distanceKm:null, durationMin:null },
]

// ─── AGGREGATION FUNCTION ─────────────────────────────────────

export function aggregateRevenue(
  transactions: RevenueTransaction[],
  filter?: { activity?: ActivityCategory; source?: RevenueSource }
): RevenueAggregation {
  const filtered = transactions.filter(t => {
    if (filter?.activity && t.activity !== filter.activity) return false
    if (filter?.source && t.source !== filter.source) return false
    return true
  })

  const bySource = {} as Record<RevenueSource, number>
  const sources: RevenueSource[] = ['TAXIMETER','UBER','LYFT','DOORDASH','INSTACART','UBER_EATS','SKIP','CASH','OTHER']
  sources.forEach(s => { bySource[s] = 0 })

  let taxiGross = 0, rideshareGross = 0, deliveryGross = 0
  let totalFees = 0, totalTips = 0, totalAdj = 0, totalRefunds = 0, grossRevenue = 0
  let taxiTrips = 0, rideshareTrips = 0, deliveryOrders = 0

  filtered.forEach(t => {
    grossRevenue += t.grossAmount
    totalFees += t.providerFee + t.platformFee
    totalTips += t.tip
    totalAdj += t.positiveAdjustments - t.negativeAdjustments
    totalRefunds += t.refunds
    bySource[t.source] = (bySource[t.source] || 0) + t.grossAmount + t.tip

    if (t.activity === 'TAXI') { taxiGross += t.grossAmount + t.tip; taxiTrips++ }
    if (t.activity === 'RIDESHARE') { rideshareGross += t.grossAmount + t.tip; rideshareTrips++ }
    if (t.activity === 'DELIVERY') { deliveryGross += t.grossAmount + t.tip; deliveryOrders++ }
  })

  const netRevenue = fmt(grossRevenue + totalTips + totalAdj - totalFees - totalRefunds)

  return {
    grossRevenue: fmt(grossRevenue), totalFees: fmt(totalFees),
    totalTips: fmt(totalTips), totalAdjustments: fmt(totalAdj),
    totalRefunds: fmt(totalRefunds), netRevenue,
    taxiGross: fmt(taxiGross), rideshareGross: fmt(rideshareGross), deliveryGross: fmt(deliveryGross),
    bySource, transactionCount: filtered.length,
    taxiTrips, rideshareTrips, deliveryOrders,
    period: 'CUSTOM', from: '', to: '',
  }
}

// ─── MONTHLY DATA ─────────────────────────────────────────────

export const mockMonthlyData: MonthlyRevenueSummary[] = [
  { month:'2026-03', label:'Mars', taxi:1240, rideshare:920, delivery:680, tips:180, fees:320, adjustments:45, refunds:20, net:2725, trips:68 },
  { month:'2026-04', label:'Avr', taxi:1380, rideshare:1050, delivery:690, tips:210, fees:360, adjustments:60, refunds:15, net:3015, trips:74 },
  { month:'2026-05', label:'Mai', taxi:1520, rideshare:1280, delivery:780, tips:240, fees:420, adjustments:80, refunds:30, net:3450, trips:82 },
  { month:'2026-06', label:'Jun', taxi:1850, rideshare:1560, delivery:800, tips:310, fees:510, adjustments:100, refunds:25, net:4085, trips:96 },
  { month:'2026-07', label:'Jul', taxi:1680, rideshare:1420, delivery:790, tips:280, fees:475, adjustments:70, refunds:40, net:3725, trips:88 },
  { month:'2026-08', label:'Aoû', taxi:1240, rideshare:990, delivery:680, tips:220, fees:380, adjustments:55, refunds:20, net:2785, trips:84 },
]

// ─── RECONCILIATION MOCK ──────────────────────────────────────

export const mockReconciliation: RevenueReconciliation[] = [
  { provider:'Uber', providerTotal:87.30, internalTotal:87.30, difference:0, status:'MATCHED', transactionCount:3, missingCount:0 },
  { provider:'DoorDash', providerTotal:128.60, internalTotal:112.40, difference:16.20, status:'MISMATCH', transactionCount:9, missingCount:1 },
  { provider:'Lyft', providerTotal:0, internalTotal:0, difference:0, status:'MATCHED', transactionCount:0, missingCount:0 },
  { provider:'Taxi', providerTotal:135.50, internalTotal:135.50, difference:0, status:'MATCHED', transactionCount:3, missingCount:0 },
]

// ─── FORMAT HELPERS ───────────────────────────────────────────

export function formatCAD(v: number): string {
  return new Intl.NumberFormat('fr-CA', { style:'currency', currency:'CAD', minimumFractionDigits:2 }).format(v)
}

export const ACTIVITY_ICONS: Record<ActivityCategory, string> = {
  TAXI: '🚕', RIDESHARE: '🚗', DELIVERY: '📦'
}
export const SOURCE_ICONS: Record<RevenueSource, string> = {
  TAXIMETER:'🚕', UBER:'⬛', LYFT:'🔵', DOORDASH:'🔴',
  INSTACART:'🛒', UBER_EATS:'🟢', SKIP:'🟠', CASH:'💵', OTHER:'🔌'
}
