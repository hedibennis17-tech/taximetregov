// ============================================================
// TAXIMÈTRE.GOV — LEDGER ENGINE
// Phase 2 — Step 26: Revenue Ledger · Reconciliation · Provider Transactions
// ============================================================
//
// RÈGLES ABSOLUES:
// 1. Idempotency: provider+provider_transaction_id = clé unique — jamais doublon
// 2. Taximeter fare ≠ Provider fare (Uber/Lyft/Delivery: provider montant final)
// 3. Ledger finalisé = IMMUABLE → VOID/REVERSED/AMENDED avec audit
// 4. Webhook non authentifié → REJECTED (aucune transaction créée)
// 5. Jamais utiliser uniquement le montant pour matcher 2 transactions
// 6. DELIVERY: taximeterEnabled = toujours false
// 7. No delete: records financiers jamais supprimés physiquement
// ============================================================

// ─── TYPES ───────────────────────────────────────────────────

export type RevenueSource =
  | 'TAXIMETER' | 'UBER' | 'LYFT' | 'DOORDASH'
  | 'INSTACART' | 'UBER_EATS' | 'SKIP' | 'DIRECT_PAYMENT' | 'CASH' | 'OTHER'

export type EntryType = 'DEBIT' | 'CREDIT'

export type LedgerStatus = 'PENDING' | 'SETTLED' | 'VOIDED' | 'REVERSED' | 'AMENDED'

export type ReconciliationStatus =
  | 'MATCHED' | 'PARTIAL_MATCH' | 'MISSING_PROVIDER' | 'MISSING_INTERNAL'
  | 'AMOUNT_MISMATCH' | 'DUPLICATE' | 'PENDING' | 'MANUAL_REVIEW'

export type WebhookProcessingStatus =
  | 'RECEIVED' | 'PROCESSING' | 'PROCESSED' | 'DUPLICATE' | 'FAILED'
  | 'QUEUED' | 'RETRYING' | 'DEAD_LETTER' | 'REJECTED'

export type SignatureStatus = 'VERIFIED' | 'INVALID' | 'MISSING' | 'BYPASSED_PILOT'

// ─── DRIVER REVENUE ACCOUNT ───────────────────────────────────

export interface DriverRevenueAccount {
  id: string
  driverId: string
  currency: 'CAD'
  status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED'
  createdAt: string
  updatedAt: string
}

// ─── REVENUE ENTRY ────────────────────────────────────────────

export interface RevenueEntry {
  id: string
  driverId: string
  accountId: string
  source: RevenueSource
  provider: string | null
  tripId: string | null
  // Idempotency key: provider + providerTransactionId
  providerTransactionId: string | null
  externalReference: string | null

  // Multi-component amounts — NEVER a single 'amount'
  grossAmount: number
  fees: number
  adjustments: number             // Positive or negative
  taxes: number
  tip: number
  netAmount: number               // gross - fees + adjustments - taxes + tip (driver perspective: gross - fees + adj + tip)

  currency: 'CAD'
  transactionDate: string
  status: 'PENDING' | 'CONFIRMED' | 'VOIDED' | 'REVERSED'
  // taximeterUsed is TRUE only for TAXIMETER source
  taximeterUsed: boolean
  createdAt: string
}

// ─── PROVIDER TRANSACTION ────────────────────────────────────

export interface ProviderTransaction {
  id: string
  provider: RevenueSource
  providerTransactionId: string    // Idempotency key part 1
  providerTripId: string | null    // Idempotency key part 2 (secondary)
  driverId: string
  accountConnectionId: string | null

  // Original amounts — NEVER overwritten
  originalGrossAmount: number
  originalFeesAmount: number

  // Final amounts after adjustments
  grossAmount: number
  fees: number
  adjustments: number
  taxes: number
  tip: number
  netAmount: number

  currency: 'CAD'
  status: 'PENDING' | 'CONFIRMED' | 'ADJUSTED' | 'VOIDED' | 'REFUNDED'
  occurredAt: string
  receivedAt: string
  // taximeterUsed = always false for provider transactions
  taximeterUsed: false
}

// ─── TRANSACTION VERSION ──────────────────────────────────────

export interface TransactionVersion {
  versionId: string
  transactionId: string
  version: number
  grossAmount: number
  fees: number
  adjustments: number
  status: string
  source: string        // What caused this version: INITIAL / ADJUSTMENT / REFUND / VOID
  createdAt: string
}

// ─── LEDGER ENTRY ─────────────────────────────────────────────

export interface LedgerEntry {
  id: string
  accountId: string
  transactionId: string
  entryType: EntryType
  debit: number         // Always positive or 0
  credit: number        // Always positive or 0
  currency: 'CAD'
  description: string
  status: LedgerStatus
  reference: string
  timestamp: string
  isImmutable: boolean  // True once SETTLED — VOID/REVERSED only via amendment
}

// ─── WEBHOOK EVENT ────────────────────────────────────────────

export interface WebhookEvent {
  id: string
  provider: string
  eventId: string                      // UNIQUE — idempotency
  eventType: string
  receivedAt: string
  signatureStatus: SignatureStatus
  processingStatus: WebhookProcessingStatus
  payloadReference: string             // Hash only — not raw payload
  attemptCount: number
  lastError: string | null
  // REJECTED if signature invalid — no financial record created
}

// ─── REFUND ───────────────────────────────────────────────────

export interface Refund {
  id: string
  transactionId: string               // Links to original — original NOT deleted
  amount: number
  reason: string
  source: 'PROVIDER' | 'DRIVER' | 'ADMIN'
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  createdAt: string
  reference: string | null
}

// ─── CHARGEBACK ───────────────────────────────────────────────

export interface Chargeback {
  id: string
  transactionId: string
  amount: number
  reason: string
  status: 'OPEN' | 'UNDER_REVIEW' | 'WON' | 'LOST' | 'CLOSED'
  openedAt: string
  resolvedAt: string | null
}

// ─── RECONCILIATION CASE ──────────────────────────────────────

export interface ReconciliationCase {
  id: string
  driverId: string
  provider: string
  transactionId: string | null
  issueType: ReconciliationStatus
  internalAmount: number | null
  providerAmount: number | null
  difference: number | null
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED'
  assignedTo: string | null
  resolution: string | null
  createdAt: string
  resolvedAt: string | null
}

// ─── PROVIDER STATEMENT ───────────────────────────────────────

export interface ProviderStatement {
  id: string
  provider: string
  driverId: string
  period: string
  grossAmount: number
  fees: number
  adjustments: number
  taxes: number
  netAmount: number
  currency: 'CAD'
  transactionCount: number
  importSource: 'API' | 'WEBHOOK' | 'CSV' | 'MANUAL'
  importedAt: string
}

// ─── DAILY FINANCIAL CLOSE ────────────────────────────────────

export interface DailyFinancialClose {
  date: string
  driverId: string
  taxiGross: number; rideshareGross: number; deliveryGross: number
  cashGross: number; totalGross: number
  totalFees: number; totalTips: number; totalRefunds: number
  netRevenue: number
  reconciledCount: number; pendingCount: number; exceptionsCount: number
  status: 'OPEN' | 'REVIEW' | 'CLOSED'
  closedAt: string | null
}

// ─── REVENUE DISPUTE ──────────────────────────────────────────

export interface RevenueDispute {
  id: string
  driverId: string
  transactionId: string
  reason: string
  description: string
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED'
  createdAt: string
  resolvedAt: string | null
}

// ─── MOCK DATA ────────────────────────────────────────────────

const fmtN = (v: number) => Math.round(v * 100) / 100

export const mockAccount: DriverRevenueAccount = {
  id:'ACC-DR-001', driverId:'DR-00001234', currency:'CAD',
  status:'ACTIVE', createdAt:'2025-03-01T00:00:00Z', updatedAt:'2026-08-24T23:00:00Z',
}

export const mockRevenueEntries: RevenueEntry[] = [
  // TAXI — taximeterUsed=true
  { id:'REV-001', driverId:'DR-00001234', accountId:'ACC-DR-001', source:'TAXIMETER', provider:'taxi', tripId:'TRIP-TAXI-001', providerTransactionId:'TXN-TAXI-001', externalReference:null, grossAmount:42.50, fees:0, adjustments:0, taxes:6.36, tip:5.00, netAmount:42.50, currency:'CAD', transactionDate:'2026-08-24T14:01:00Z', status:'CONFIRMED', taximeterUsed:true, createdAt:'2026-08-24T14:01:30Z' },
  { id:'REV-002', driverId:'DR-00001234', accountId:'ACC-DR-001', source:'CASH', provider:'taxi', tripId:'TRIP-TAXI-002', providerTransactionId:'TXN-TAXI-002', externalReference:null, grossAmount:35.00, fees:0, adjustments:0, taxes:5.24, tip:3.00, netAmount:35.00, currency:'CAD', transactionDate:'2026-08-24T11:35:00Z', status:'CONFIRMED', taximeterUsed:true, createdAt:'2026-08-24T11:35:30Z' },
  // UBER — taximeterUsed=false (provider final fare)
  { id:'REV-003', driverId:'DR-00001234', accountId:'ACC-DR-001', source:'UBER', provider:'uber', tripId:'TRIP-UBER-001', providerTransactionId:'UBER-8F72A91', externalReference:'UBER-REF-001', grossAmount:28.40, fees:6.20, adjustments:0, taxes:0, tip:4.00, netAmount:fmtN(28.40-6.20+4.00), currency:'CAD', transactionDate:'2026-08-24T13:52:00Z', status:'CONFIRMED', taximeterUsed:false, createdAt:'2026-08-24T13:52:30Z' },
  { id:'REV-004', driverId:'DR-00001234', accountId:'ACC-DR-001', source:'UBER', provider:'uber', tripId:'TRIP-UBER-002', providerTransactionId:'UBER-B92KL3', externalReference:'UBER-REF-002', grossAmount:33.20, fees:7.10, adjustments:2.50, taxes:0, tip:0, netAmount:fmtN(33.20-7.10+2.50), currency:'CAD', transactionDate:'2026-08-24T15:30:00Z', status:'CONFIRMED', taximeterUsed:false, createdAt:'2026-08-24T15:31:00Z' },
  // DOORDASH — taximeterUsed=false always
  { id:'REV-005', driverId:'DR-00001234', accountId:'ACC-DR-001', source:'DOORDASH', provider:'doordash', tripId:'TRIP-DD-001', providerTransactionId:'DD-DELIVERY-9X2K', externalReference:'DD-REF-001', grossAmount:18.90, fees:2.50, adjustments:2.00, taxes:0, tip:3.00, netAmount:fmtN(18.90-2.50+2.00+3.00), currency:'CAD', transactionDate:'2026-08-24T14:40:00Z', status:'CONFIRMED', taximeterUsed:false, createdAt:'2026-08-24T14:41:00Z' },
  { id:'REV-006', driverId:'DR-00001234', accountId:'ACC-DR-001', source:'DOORDASH', provider:'doordash', tripId:'TRIP-DD-002', providerTransactionId:'DD-DELIVERY-4Y5Z', externalReference:'DD-REF-002', grossAmount:15.20, fees:2.00, adjustments:0, taxes:0, tip:2.50, netAmount:fmtN(15.20-2.00+2.50), currency:'CAD', transactionDate:'2026-08-24T16:10:00Z', status:'CONFIRMED', taximeterUsed:false, createdAt:'2026-08-24T16:11:00Z' },
  // PENDING (not yet settled)
  { id:'REV-007', driverId:'DR-00001234', accountId:'ACC-DR-001', source:'DOORDASH', provider:'doordash', tripId:'TRIP-DD-003', providerTransactionId:'DD-PENDING-001', externalReference:null, grossAmount:14.50, fees:1.80, adjustments:0, taxes:0, tip:2.00, netAmount:fmtN(14.50-1.80+2.00), currency:'CAD', transactionDate:'2026-08-24T17:00:00Z', status:'PENDING', taximeterUsed:false, createdAt:'2026-08-24T17:01:00Z' },
]

export const mockProviderTransactions: ProviderTransaction[] = [
  { id:'PT-001', provider:'UBER', providerTransactionId:'UBER-8F72A91', providerTripId:'TRIP-UBER-001', driverId:'DR-00001234', accountConnectionId:'CONN-UBER-001', originalGrossAmount:28.40, originalFeesAmount:6.20, grossAmount:28.40, fees:6.20, adjustments:0, taxes:0, tip:4.00, netAmount:fmtN(28.40-6.20+4.00), currency:'CAD', status:'CONFIRMED', occurredAt:'2026-08-24T13:50:00Z', receivedAt:'2026-08-24T13:52:00Z', taximeterUsed:false },
  // Adjustment example: original $33.20 → final $35.70 (+$2.50)
  { id:'PT-002', provider:'UBER', providerTransactionId:'UBER-B92KL3', providerTripId:'TRIP-UBER-002', driverId:'DR-00001234', accountConnectionId:'CONN-UBER-001', originalGrossAmount:33.20, originalFeesAmount:7.10, grossAmount:33.20, fees:7.10, adjustments:2.50, taxes:0, tip:0, netAmount:fmtN(33.20-7.10+2.50), currency:'CAD', status:'ADJUSTED', occurredAt:'2026-08-24T15:28:00Z', receivedAt:'2026-08-24T15:30:00Z', taximeterUsed:false },
]

export const mockTransactionVersions: TransactionVersion[] = [
  { versionId:'TV-001', transactionId:'PT-002', version:1, grossAmount:33.20, fees:7.10, adjustments:0, status:'CONFIRMED', source:'INITIAL', createdAt:'2026-08-24T15:30:00Z' },
  { versionId:'TV-002', transactionId:'PT-002', version:2, grossAmount:33.20, fees:7.10, adjustments:2.50, status:'ADJUSTED', source:'ADJUSTMENT', createdAt:'2026-08-24T16:45:00Z' },
]

export const mockLedgerEntries: LedgerEntry[] = [
  { id:'LED-001', accountId:'ACC-DR-001', transactionId:'REV-001', entryType:'CREDIT', debit:0, credit:42.50, currency:'CAD', description:'Taxi course — Taximètre — TRIP-TAXI-001', status:'SETTLED', reference:'REF-REV-001', timestamp:'2026-08-24T14:01:30Z', isImmutable:true },
  { id:'LED-002', accountId:'ACC-DR-001', transactionId:'REV-001', entryType:'CREDIT', debit:0, credit:5.00, currency:'CAD', description:'Pourboire — TRIP-TAXI-001', status:'SETTLED', reference:'REF-REV-001-TIP', timestamp:'2026-08-24T14:01:31Z', isImmutable:true },
  { id:'LED-003', accountId:'ACC-DR-001', transactionId:'REV-002', entryType:'CREDIT', debit:0, credit:38.00, currency:'CAD', description:'Taxi comptant — TRIP-TAXI-002', status:'SETTLED', reference:'REF-REV-002', timestamp:'2026-08-24T11:35:30Z', isImmutable:true },
  { id:'LED-004', accountId:'ACC-DR-001', transactionId:'REV-003', entryType:'CREDIT', debit:0, credit:28.40, currency:'CAD', description:'Uber RIDESHARE — UBER-8F72A91', status:'SETTLED', reference:'REF-REV-003', timestamp:'2026-08-24T13:52:30Z', isImmutable:true },
  { id:'LED-005', accountId:'ACC-DR-001', transactionId:'REV-003', entryType:'DEBIT', debit:6.20, credit:0, currency:'CAD', description:'Frais Uber — UBER-8F72A91', status:'SETTLED', reference:'REF-REV-003-FEE', timestamp:'2026-08-24T13:52:31Z', isImmutable:true },
  { id:'LED-006', accountId:'ACC-DR-001', transactionId:'REV-003', entryType:'CREDIT', debit:0, credit:4.00, currency:'CAD', description:'Pourboire Uber', status:'SETTLED', reference:'REF-REV-003-TIP', timestamp:'2026-08-24T13:52:32Z', isImmutable:true },
  { id:'LED-007', accountId:'ACC-DR-001', transactionId:'REV-005', entryType:'CREDIT', debit:0, credit:18.90, currency:'CAD', description:'DoorDash DELIVERY — DD-DELIVERY-9X2K', status:'SETTLED', reference:'REF-REV-005', timestamp:'2026-08-24T14:41:00Z', isImmutable:true },
  { id:'LED-008', accountId:'ACC-DR-001', transactionId:'REV-005', entryType:'DEBIT', debit:2.50, credit:0, currency:'CAD', description:'Frais DoorDash', status:'SETTLED', reference:'REF-REV-005-FEE', timestamp:'2026-08-24T14:41:01Z', isImmutable:true },
  { id:'LED-009', accountId:'ACC-DR-001', transactionId:'REV-007', entryType:'CREDIT', debit:0, credit:14.50, currency:'CAD', description:'DoorDash DELIVERY — DD-PENDING-001', status:'PENDING', reference:'REF-REV-007', timestamp:'2026-08-24T17:01:00Z', isImmutable:false },
]

export const mockWebhooks: WebhookEvent[] = [
  { id:'WH-001', provider:'Uber', eventId:'evt_uber_8F72A91_pay', eventType:'payment.succeeded', receivedAt:'2026-08-24T13:52:00Z', signatureStatus:'VERIFIED', processingStatus:'PROCESSED', payloadReference:'sha256-abc...', attemptCount:1, lastError:null },
  // Duplicate — same eventId — safely ignored
  { id:'WH-002', provider:'Uber', eventId:'evt_uber_8F72A91_pay', eventType:'payment.succeeded', receivedAt:'2026-08-24T13:52:30Z', signatureStatus:'VERIFIED', processingStatus:'DUPLICATE', payloadReference:'sha256-abc...', attemptCount:1, lastError:null },
  // Adjustment webhook
  { id:'WH-003', provider:'Uber', eventId:'evt_uber_B92KL3_adj', eventType:'payment.adjusted', receivedAt:'2026-08-24T16:45:00Z', signatureStatus:'VERIFIED', processingStatus:'PROCESSED', payloadReference:'sha256-def...', attemptCount:1, lastError:null },
  // Rejected — invalid signature
  { id:'WH-004', provider:'Unknown', eventId:'evt_fake_001', eventType:'payment.succeeded', receivedAt:'2026-08-24T18:00:00Z', signatureStatus:'INVALID', processingStatus:'REJECTED', payloadReference:'sha256-xxx...', attemptCount:1, lastError:'Signature verification failed — no financial record created' },
  { id:'WH-005', provider:'DoorDash', eventId:'evt_dd_PENDING_001', eventType:'payment.pending', receivedAt:'2026-08-24T17:00:00Z', signatureStatus:'VERIFIED', processingStatus:'PROCESSING', payloadReference:'sha256-ghi...', attemptCount:2, lastError:null },
]

export const mockReconciliationCases: ReconciliationCase[] = [
  { id:'REC-001', driverId:'DR-00001234', provider:'Uber', transactionId:'PT-001', issueType:'MATCHED', internalAmount:26.20, providerAmount:26.20, difference:0, status:'RESOLVED', assignedTo:null, resolution:'Auto-matched', createdAt:'2026-08-24T14:00:00Z', resolvedAt:'2026-08-24T14:00:01Z' },
  { id:'REC-002', driverId:'DR-00001234', provider:'DoorDash', transactionId:'REV-007', issueType:'PENDING', internalAmount:14.50, providerAmount:null, difference:null, status:'OPEN', assignedTo:null, resolution:null, createdAt:'2026-08-24T17:01:00Z', resolvedAt:null },
  // Amount mismatch example
  { id:'REC-003', driverId:'DR-00001234', provider:'Uber', transactionId:null, issueType:'AMOUNT_MISMATCH', internalAmount:40.00, providerAmount:43.00, difference:3.00, status:'UNDER_REVIEW', assignedTo:'REVIEWER-001', resolution:null, createdAt:'2026-08-23T10:00:00Z', resolvedAt:null },
]

export const mockRefund: Refund = {
  id:'REF-001', transactionId:'REV-001', amount:10.00, reason:'Réclamation client — course annulée partiellement', source:'PROVIDER', status:'COMPLETED', createdAt:'2026-08-24T20:00:00Z', reference:'UBER-REFUND-001',
}

export const mockDailyClose: DailyFinancialClose = {
  date:'2026-08-24', driverId:'DR-00001234',
  taxiGross:fmtN(42.50+35.00), rideshareGross:fmtN(28.40+33.20), deliveryGross:fmtN(18.90+15.20+14.50),
  cashGross:35.00, totalGross:fmtN(42.50+35+28.40+33.20+18.90+15.20+14.50),
  totalFees:fmtN(6.20+7.10+2.50+2.00+1.80), totalTips:fmtN(5+3+4+3+2.50+2),
  totalRefunds:10.00, netRevenue:0, // computed below
  reconciledCount:1, pendingCount:2, exceptionsCount:1,
  status:'REVIEW', closedAt:null,
}
mockDailyClose.netRevenue = fmtN(mockDailyClose.totalGross - mockDailyClose.totalFees - mockDailyClose.totalRefunds)

// Compute ledger balance
export const ledgerBalance = mockLedgerEntries
  .filter(e => e.status === 'SETTLED')
  .reduce((acc, e) => acc + e.credit - e.debit, 0)

// ─── HELPERS ─────────────────────────────────────────────────

export const fmt = (v: number) => new Intl.NumberFormat('fr-CA', { style:'currency', currency:'CAD' }).format(v)

export const SOURCE_CONF: Record<RevenueSource, { icon: string; label: string; color: string; taximeter: boolean }> = {
  TAXIMETER:      { icon:'🚕', label:'Taxi',        color:'text-qc-blue-light', taximeter:true },
  UBER:           { icon:'⬛', label:'Uber',         color:'text-white',          taximeter:false },
  LYFT:           { icon:'🩷', label:'Lyft',         color:'text-pink-400',       taximeter:false },
  DOORDASH:       { icon:'🔴', label:'DoorDash',     color:'text-red-400',        taximeter:false },
  INSTACART:      { icon:'🥕', label:'Instacart',    color:'text-orange-400',     taximeter:false },
  UBER_EATS:      { icon:'🟢', label:'Uber Eats',    color:'text-green-400',      taximeter:false },
  SKIP:           { icon:'🍁', label:'Skip',         color:'text-orange-300',     taximeter:false },
  DIRECT_PAYMENT: { icon:'💳', label:'Direct',       color:'text-purple-400',     taximeter:false },
  CASH:           { icon:'💵', label:'Comptant',     color:'text-green-400',      taximeter:false },
  OTHER:          { icon:'🔄', label:'Autre',        color:'text-slate-400',      taximeter:false },
}

export const RECON_STATUS_CONF: Record<ReconciliationStatus, { icon: string; color: string; label: string }> = {
  MATCHED:          { icon:'✅', color:'text-green-400',  label:'Correspondance' },
  PARTIAL_MATCH:    { icon:'⚠️', color:'text-amber-400',  label:'Partielle' },
  MISSING_PROVIDER: { icon:'❓', color:'text-amber-400',  label:'Manquante (fournisseur)' },
  MISSING_INTERNAL: { icon:'❓', color:'text-amber-400',  label:'Manquante (interne)' },
  AMOUNT_MISMATCH:  { icon:'⚡', color:'text-red-400',    label:'Écart de montant' },
  DUPLICATE:        { icon:'♻️', color:'text-orange-400', label:'Doublon' },
  PENDING:          { icon:'⏳', color:'text-amber-400',  label:'En attente' },
  MANUAL_REVIEW:    { icon:'👁', color:'text-blue-400',   label:'Révision manuelle' },
}

export const WEBHOOK_STATUS_CONF: Record<WebhookProcessingStatus, { icon: string; color: string }> = {
  RECEIVED:    { icon:'📥', color:'text-blue-400' },
  PROCESSING:  { icon:'🔄', color:'text-blue-400' },
  PROCESSED:   { icon:'✅', color:'text-green-400' },
  DUPLICATE:   { icon:'⚠️', color:'text-amber-400' },
  FAILED:      { icon:'❌', color:'text-red-400' },
  QUEUED:      { icon:'⏳', color:'text-amber-400' },
  RETRYING:    { icon:'🔁', color:'text-amber-400' },
  DEAD_LETTER: { icon:'💀', color:'text-red-400' },
  REJECTED:    { icon:'🚫', color:'text-red-400' },
}
