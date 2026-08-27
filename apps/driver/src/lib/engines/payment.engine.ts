// ============================================================
// TAXIMÈTRE.GOV — PAYMENT ENGINE
// Phase 2 — Step 23: Payments, Wallet, Collections & Reconciliation
// ============================================================
//
// RÈGLES ABSOLUES:
// 1. Ne jamais modifier le montant original Uber/Lyft/DoorDash/etc.
// 2. Ne jamais créditer le wallet avant confirmation du paiement
// 3. Ne jamais traiter deux fois le même webhook (idempotency)
// 4. Ne jamais considérer un paiement FAILED comme encaissé
// 5. Ne jamais considérer une anomalie comme fraude confirmée → REVIEW_REQUIRED
// 6. Secrets de paiement: jamais en clair → coffre sécurisé
// 7. provider + external_reference = UNIQUE constraint
// ============================================================

// ─── TYPES ───────────────────────────────────────────────────

export type PaymentMethod = 'CASH' | 'CARD' | 'INTERAC' | 'STRIPE' | 'WALLET' | 'PROVIDER' | 'OTHER'
export type PaymentStatus =
  | 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'COMPLETED'
  | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED'
  | 'DISPUTED' | 'EXPIRED' | 'UNKNOWN'
export type RefundStatus = 'REQUESTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
export type PayoutStatus = 'REQUESTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'WON' | 'LOST' | 'CLOSED'
export type WalletEntryType = 'TRIP_REVENUE' | 'TIP' | 'REFUND' | 'ADJUSTMENT' | 'FEE' | 'PAYOUT' | 'REVERSAL'
export type ReconciliationStatus = 'MATCHED' | 'PARTIAL_MATCH' | 'MISMATCH' | 'MISSING_PAYMENT' | 'DUPLICATE' | 'PENDING' | 'REVIEW_REQUIRED'
export type AnomalyType = 'DUPLICATE' | 'UNUSUAL_REFUND' | 'MULTIPLE_FAILED' | 'UNEXPECTED_AMOUNT' | 'PROVIDER_MISMATCH' | 'WALLET_MISMATCH' | 'CASH_MISMATCH'
export type PaymentActivity = 'TAXI' | 'RIDESHARE' | 'DELIVERY'
export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'RETRYING'

// ─── PAYMENT MODEL ────────────────────────────────────────────

export interface Payment {
  id: string
  driverId: string
  tripId: string | null
  transactionId: string | null
  providerId: string | null             // External provider (Uber, etc.)
  activity: PaymentActivity
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus

  currency: 'CAD'
  // Multi-component amounts — NEVER a single 'amount' field
  grossAmount: number                   // Customer-facing total
  taxAmount: number                     // TPS+TVQ collected
  feeAmount: number                     // Taximètre.GOV processing fee
  providerFee: number                   // Uber/Lyft/etc. service fee
  tipAmount: number
  adjustmentAmount: number              // Positive or negative
  refundAmount: number                  // Always negative or zero
  driverAmount: number                  // What driver receives
  netAmount: number                     // grossAmount - feeAmount - providerFee + adjustments - refunds

  // References (all preserved for traceability)
  referenceId: string                   // Internal reference
  externalReference: string | null      // Provider reference (immutable once set)
  providerTransactionId: string | null  // Original provider ID — NEVER modified
  stripePaymentIntentId: string | null  // If Stripe used

  // Timing
  createdAt: string
  authorizedAt: string | null
  capturedAt: string | null
  completedAt: string | null
  updatedAt: string

  syncStatus: SyncStatus
  taximeterUsed: boolean                // true only for TAXI activity
  notes: string | null
}

// ─── CASH COLLECTION ──────────────────────────────────────────

export interface CashCollection {
  id: string
  paymentId: string
  driverId: string
  amount: number
  currency: 'CAD'
  collectedAt: string
  tripId: string | null
  confirmedByDriver: boolean
  syncStatus: SyncStatus
  // Offline-capable: stored locally first, then synced
  offlineCollected: boolean
}

// ─── CASH SETTLEMENT ──────────────────────────────────────────

export interface CashSettlement {
  id: string
  driverId: string
  period: string
  expectedCash: number
  declaredCash: number
  difference: number
  status: 'MATCHED' | 'REVIEW_REQUIRED' | 'APPROVED' | 'DISPUTED'
  createdAt: string
  confirmedAt: string | null
}

// ─── REFUND ───────────────────────────────────────────────────

export interface Refund {
  id: string
  paymentId: string
  transactionId: string | null
  amount: number                   // Always positive (records negative impact separately)
  reason: string
  status: RefundStatus
  reference: string | null
  providerRefundId: string | null
  createdAt: string
  completedAt: string | null
}

// ─── PAYMENT DISPUTE ──────────────────────────────────────────

export interface PaymentDispute {
  id: string
  paymentId: string
  driverId: string
  amount: number
  reason: string
  status: DisputeStatus
  reference: string | null
  createdAt: string
  resolvedAt: string | null
}

// ─── WALLET ───────────────────────────────────────────────────

export interface Wallet {
  id: string
  driverId: string
  currency: 'CAD'
  availableBalance: number       // Computed from WalletEntry ledger — not standalone field
  pendingBalance: number
  totalBalance: number
  lastUpdatedAt: string
  // Balance is always derivable from WalletEntries — never an opaque number
}

export interface WalletEntry {
  id: string
  walletId: string
  type: WalletEntryType
  amount: number               // Positive = credit, negative = debit
  currency: 'CAD'
  referenceType: 'PAYMENT' | 'REFUND' | 'PAYOUT' | 'ADJUSTMENT' | 'FEE'
  referenceId: string
  description: string
  status: 'PENDING' | 'SETTLED' | 'REVERSED'
  createdAt: string
}

// ─── PAYOUT ───────────────────────────────────────────────────

export interface Payout {
  id: string
  driverId: string
  walletId: string
  amount: number
  currency: 'CAD'
  destination: 'BANK_ACCOUNT' | 'DEBIT_CARD' | 'OTHER'
  // Tokenized reference — never store raw bank account
  destinationTokenReference: string | null
  status: PayoutStatus
  provider: 'STRIPE' | 'INTERNAL' | 'OTHER'
  providerReference: string | null
  requestedAt: string
  completedAt: string | null
  failureReason: string | null
}

// ─── WEBHOOK EVENT ────────────────────────────────────────────

export interface WebhookEvent {
  id: string
  provider: string
  eventId: string                  // UNIQUE per provider — idempotency key
  eventType: string
  receivedAt: string
  processedAt: string | null
  status: 'RECEIVED' | 'PROCESSING' | 'PROCESSED' | 'DUPLICATE' | 'FAILED' | 'DEAD_LETTER'
  payloadHash: string
  retryCount: number
  lastError: string | null
}

export interface WebhookDeadLetter {
  id: string
  webhookEventId: string
  provider: string
  eventType: string
  reason: string
  attemptCount: number
  lastError: string
  createdAt: string
  resolvedAt: string | null
}

// ─── RECONCILIATION ───────────────────────────────────────────

export interface PaymentReconciliation {
  id: string
  paymentId: string
  transactionId: string | null
  provider: string
  providerAmount: number
  ledgerAmount: number
  walletAmount: number
  difference: number
  status: ReconciliationStatus
  reconciledAt: string | null
  notes: string | null
}

// ─── PAYMENT ANOMALY ──────────────────────────────────────────

export interface PaymentAnomaly {
  id: string
  paymentId: string
  driverId: string
  type: AnomalyType
  severity: 'INFO' | 'WARNING' | 'ERROR'
  description: string
  amount: number | null
  status: 'OPEN' | 'REVIEW_REQUIRED' | 'RESOLVED' | 'FALSE_POSITIVE'
  detectedAt: string
  resolvedAt: string | null
  // ANOMALY ≠ FRAUD — always 'REVIEW_REQUIRED', never auto-flagged as fraud
}

// ─── PAYMENT RECEIPT ─────────────────────────────────────────

export interface PaymentReceipt {
  receiptId: string
  paymentId: string
  tripId: string | null
  driverId: string
  activity: PaymentActivity
  issuedAt: string

  // Full amount breakdown on receipt
  fare: number
  tpsAmount: number
  tvqAmount: number
  tipAmount: number
  adjustments: number
  totalAmount: number
  paymentMethod: PaymentMethod
  referenceId: string
  taximeterEnabled: boolean
  notes: string | null
}

// ─── AUDIT ────────────────────────────────────────────────────

export interface PaymentAuditEvent {
  auditId: string
  paymentId: string
  driverId: string
  action: 'PAYMENT_CREATED' | 'PAYMENT_AUTHORIZED' | 'PAYMENT_CAPTURED'
    | 'PAYMENT_FAILED' | 'PAYMENT_REFUNDED' | 'PAYMENT_ADJUSTED'
    | 'WALLET_CREDITED' | 'WALLET_DEBITED'
    | 'PAYOUT_REQUESTED' | 'PAYOUT_COMPLETED'
    | 'RECONCILIATION_COMPLETED'
  actor: string
  actorRole: 'DRIVER' | 'SYSTEM' | 'ADMIN' | 'PROVIDER'
  amount: number | null
  timestamp: string
  details: string | null
}

// ─── DAILY SETTLEMENT ─────────────────────────────────────────

export interface DailySettlement {
  date: string
  driverId: string
  taxi: number; rideshare: number; delivery: number
  cash: number; card: number; interac: number; provider: number; other: number
  grossTotal: number; totalFees: number; totalTips: number
  netTotal: number
  paymentsCount: number
  pendingAmount: number
  refundedAmount: number
  taximeterAmount: number   // Taxi only
  providerAmount: number    // Uber/Lyft/Delivery only (never recalculated)
}

// ─── MOCK DATA ────────────────────────────────────────────────

const fmtN = (v: number) => Math.round(v * 100) / 100

function mkPayment(id: string, tripId: string, activity: PaymentActivity,
  method: PaymentMethod, status: PaymentStatus,
  gross: number, tax: number, fee: number, provFee: number,
  tip: number, adj: number = 0, refund: number = 0,
  extRef: string | null = null, provTxnId: string | null = null,
  taximeterUsed: boolean = false
): Payment {
  const driver = fmtN(gross - provFee - fee + adj - refund)
  return {
    id, driverId:'DR-00001234', tripId, transactionId:`TXN-${id}`, providerId:null,
    activity, paymentMethod:method, paymentStatus:status, currency:'CAD',
    grossAmount:gross, taxAmount:tax, feeAmount:fee, providerFee:provFee,
    tipAmount:tip, adjustmentAmount:adj, refundAmount:refund,
    driverAmount:driver, netAmount:fmtN(gross + tip + adj - refund - fee - provFee),
    referenceId:`REF-${id}`, externalReference:extRef, providerTransactionId:provTxnId,
    stripePaymentIntentId:method==='STRIPE'?`pi_${id.toLowerCase().replace('-','')}`:null,
    createdAt:'2026-08-24T14:00:00Z', authorizedAt:'2026-08-24T14:00:30Z',
    capturedAt:status==='COMPLETED'?'2026-08-24T14:01:00Z':null,
    completedAt:status==='COMPLETED'?'2026-08-24T14:01:30Z':null,
    updatedAt:'2026-08-24T14:01:30Z', syncStatus:'SYNCED', taximeterUsed,
    notes:null,
  }
}

export const mockPayments: Payment[] = [
  // TAXI payments — taximeterUsed=true, tax calculated by taximeter engine
  mkPayment('PAY-001','TRIP-TAXI-001','TAXI','CARD','COMPLETED', 42.50,6.10,0,0,5.00,0,0,'STRIPE-PI-001',null,true),
  mkPayment('PAY-002','TRIP-TAXI-002','TAXI','CASH','COMPLETED', 35.00,5.03,0,0,3.00,0,0,null,null,true),
  mkPayment('PAY-003','TRIP-TAXI-003','TAXI','INTERAC','COMPLETED', 58.00,8.34,0,0,8.00,0,0,'INT-2026-001',null,true),

  // RIDESHARE — provider amount is FINAL (never recalculated by taximeter)
  mkPayment('PAY-004','TRIP-UBER-001','RIDESHARE','PROVIDER','COMPLETED', 28.40,0,0,6.20,4.00,0,0,'UBER-REF-001','UBER-8F72A91',false),
  mkPayment('PAY-005','TRIP-UBER-002','RIDESHARE','PROVIDER','COMPLETED', 33.20,0,0,7.10,0,0,0,'UBER-REF-002','UBER-B92KL3',false),
  mkPayment('PAY-006','TRIP-UBER-003','RIDESHARE','PROVIDER','COMPLETED', 25.70,0,0,5.60,3.00,2.50,0,'UBER-REF-003','UBER-C34MN8',false),

  // DELIVERY — taximeterUsed=false always
  mkPayment('PAY-007','TRIP-DD-001','DELIVERY','PROVIDER','COMPLETED', 18.90,0,0,2.50,3.00,2.00,0,'DD-REF-001','DD-DELIVERY-9X2K',false),
  mkPayment('PAY-008','TRIP-DD-002','DELIVERY','PROVIDER','COMPLETED', 15.20,0,0,2.00,2.50,0,0,'DD-REF-002','DD-DELIVERY-4Y5Z',false),
  mkPayment('PAY-009','TRIP-DD-003','DELIVERY','PROVIDER','PENDING', 14.50,0,0,1.80,2.00,0,0,null,'DD-PENDING-001',false),

  // Failed payment example
  mkPayment('PAY-010','TRIP-TAXI-004','TAXI','CARD','FAILED', 28.00,4.03,0,0,0,0,0,'FAILED-001',null,true),
]

export const mockWalletEntries: WalletEntry[] = [
  { id:'WE-001', walletId:'WALLET-DR-001', type:'TRIP_REVENUE', amount:42.50, currency:'CAD', referenceType:'PAYMENT', referenceId:'PAY-001', description:'Taxi — carte — TRIP-TAXI-001', status:'SETTLED', createdAt:'2026-08-24T14:01:30Z' },
  { id:'WE-002', walletId:'WALLET-DR-001', type:'TIP', amount:5.00, currency:'CAD', referenceType:'PAYMENT', referenceId:'PAY-001', description:'Pourboire TRIP-TAXI-001', status:'SETTLED', createdAt:'2026-08-24T14:01:31Z' },
  { id:'WE-003', walletId:'WALLET-DR-001', type:'TRIP_REVENUE', amount:35.00, currency:'CAD', referenceType:'PAYMENT', referenceId:'PAY-002', description:'Taxi — comptant — TRIP-TAXI-002', status:'SETTLED', createdAt:'2026-08-24T11:35:00Z' },
  { id:'WE-004', walletId:'WALLET-DR-001', type:'TIP', amount:3.00, currency:'CAD', referenceType:'PAYMENT', referenceId:'PAY-002', description:'Pourboire TRIP-TAXI-002', status:'SETTLED', createdAt:'2026-08-24T11:35:01Z' },
  { id:'WE-005', walletId:'WALLET-DR-001', type:'TRIP_REVENUE', amount:28.40, currency:'CAD', referenceType:'PAYMENT', referenceId:'PAY-004', description:'Uber RIDESHARE — UBER-8F72A91', status:'SETTLED', createdAt:'2026-08-24T13:52:00Z' },
  { id:'WE-006', walletId:'WALLET-DR-001', type:'FEE', amount:-6.20, currency:'CAD', referenceType:'PAYMENT', referenceId:'PAY-004', description:'Frais Uber — UBER-8F72A91', status:'SETTLED', createdAt:'2026-08-24T13:52:01Z' },
  { id:'WE-007', walletId:'WALLET-DR-001', type:'TIP', amount:4.00, currency:'CAD', referenceType:'PAYMENT', referenceId:'PAY-004', description:'Pourboire Uber', status:'SETTLED', createdAt:'2026-08-24T13:52:02Z' },
  { id:'WE-008', walletId:'WALLET-DR-001', type:'TRIP_REVENUE', amount:18.90, currency:'CAD', referenceType:'PAYMENT', referenceId:'PAY-007', description:'DoorDash DELIVERY — DD-DELIVERY-9X2K', status:'SETTLED', createdAt:'2026-08-24T14:40:00Z' },
  { id:'WE-009', walletId:'WALLET-DR-001', type:'FEE', amount:-2.50, currency:'CAD', referenceType:'PAYMENT', referenceId:'PAY-007', description:'Frais DoorDash', status:'SETTLED', createdAt:'2026-08-24T14:40:01Z' },
  { id:'WE-010', walletId:'WALLET-DR-001', type:'PAYOUT', amount:-300.00, currency:'CAD', referenceType:'PAYOUT', referenceId:'PO-001', description:'Virement bancaire 2026-08-20', status:'SETTLED', createdAt:'2026-08-20T09:00:00Z' },
]

export const mockWallet: Wallet = {
  id:'WALLET-DR-001', driverId:'DR-00001234', currency:'CAD',
  availableBalance: fmtN(mockWalletEntries.filter(e=>e.status==='SETTLED').reduce((a,e)=>a+e.amount,0)),
  pendingBalance: fmtN(14.50 + 2.00 - 1.80),  // DD-PENDING-001
  totalBalance: 0,  // computed below
  lastUpdatedAt:'2026-08-24T15:45:00Z',
}
mockWallet.totalBalance = fmtN(mockWallet.availableBalance + mockWallet.pendingBalance)

export const mockPayout: Payout = {
  id:'PO-001', driverId:'DR-00001234', walletId:'WALLET-DR-001',
  amount:300.00, currency:'CAD', destination:'BANK_ACCOUNT',
  destinationTokenReference:'tok_bank_••••4242',  // tokenized — never raw account
  status:'COMPLETED', provider:'STRIPE', providerReference:'po_stripe_001',
  requestedAt:'2026-08-20T08:00:00Z', completedAt:'2026-08-20T09:00:00Z', failureReason:null,
}

export const mockReconciliation: PaymentReconciliation[] = [
  { id:'REC-001', paymentId:'PAY-001', transactionId:'TXN-PAY-001', provider:'TAXI', providerAmount:42.50, ledgerAmount:42.50, walletAmount:42.50, difference:0, status:'MATCHED', reconciledAt:'2026-08-24T14:05:00Z', notes:null },
  { id:'REC-002', paymentId:'PAY-004', transactionId:'TXN-PAY-004', provider:'Uber', providerAmount:28.40, ledgerAmount:28.40, walletAmount:22.20, difference:0, status:'MATCHED', reconciledAt:'2026-08-24T14:00:00Z', notes:'Wallet = provider - fee + tip' },
  { id:'REC-003', paymentId:'PAY-007', transactionId:'TXN-PAY-007', provider:'DoorDash', providerAmount:18.90, ledgerAmount:18.90, walletAmount:16.40, difference:0, status:'MATCHED', reconciledAt:'2026-08-24T14:45:00Z', notes:null },
  { id:'REC-004', paymentId:'PAY-009', transactionId:'TXN-PAY-009', provider:'DoorDash', providerAmount:14.50, ledgerAmount:14.50, walletAmount:0, difference:14.50, status:'PENDING', reconciledAt:null, notes:'DD-PENDING-001 — en attente finalisation DoorDash' },
]

export const mockAnomalies: PaymentAnomaly[] = [
  { id:'ANO-001', paymentId:'PAY-010', driverId:'DR-00001234', type:'MULTIPLE_FAILED', severity:'WARNING', description:'2 tentatives échouées pour TRIP-TAXI-004 — terminal carte possible', amount:28.00, status:'OPEN', detectedAt:'2026-08-24T16:00:00Z', resolvedAt:null },
]

export const mockCashSettlement: CashSettlement = {
  id:'CS-001', driverId:'DR-00001234', period:'2026-08-24',
  expectedCash:35.00, declaredCash:35.00, difference:0,
  status:'MATCHED', createdAt:'2026-08-24T22:00:00Z', confirmedAt:'2026-08-24T22:05:00Z',
}

export const mockWebhookEvents: WebhookEvent[] = [
  { id:'WH-001', provider:'Uber', eventId:'evt_uber_001_8F72A91', eventType:'payment.succeeded', receivedAt:'2026-08-24T13:52:00Z', processedAt:'2026-08-24T13:52:01Z', status:'PROCESSED', payloadHash:'sha256-abc...', retryCount:0, lastError:null },
  { id:'WH-002', provider:'Uber', eventId:'evt_uber_001_8F72A91', eventType:'payment.succeeded', receivedAt:'2026-08-24T13:52:30Z', processedAt:'2026-08-24T13:52:31Z', status:'DUPLICATE', payloadHash:'sha256-abc...', retryCount:0, lastError:null },
  { id:'WH-003', provider:'DoorDash', eventId:'evt_dd_PENDING_001', eventType:'payment.pending', receivedAt:'2026-08-24T15:46:00Z', processedAt:null, status:'PROCESSING', payloadHash:'sha256-def...', retryCount:1, lastError:null },
  { id:'WH-004', provider:'Stripe', eventId:'evt_stripe_pi_pay010', eventType:'payment_intent.payment_failed', receivedAt:'2026-08-24T16:00:00Z', processedAt:'2026-08-24T16:00:01Z', status:'PROCESSED', payloadHash:'sha256-ghi...', retryCount:0, lastError:null },
]

export const mockDailySettlement: DailySettlement = {
  date:'2026-08-24', driverId:'DR-00001234',
  taxi:fmtN(42.50+5+35+3+58+8), rideshare:fmtN(28.40+4+33.20+25.70+3+2.50), delivery:fmtN(18.90+3+2+15.20+2.50+14.50+2),
  cash:38, card:fmtN(42.50+5), interac:fmtN(58+8), provider:fmtN(28.40+4+33.20+25.70+3+2.50+18.90+3+2+15.20+2.50+14.50+2), other:0,
  grossTotal:0, totalFees:fmtN(6.20+7.10+5.60+2.50+2+1.80), totalTips:fmtN(5+3+8+4+3+2.50+3+2.50+2),
  netTotal:0, paymentsCount:9, pendingAmount:14.50, refundedAmount:0,
  taximeterAmount:fmtN(42.50+35+58), providerAmount:fmtN(28.40+33.20+25.70+18.90+15.20+14.50),
}
mockDailySettlement.grossTotal = fmtN(mockDailySettlement.taxi + mockDailySettlement.rideshare + mockDailySettlement.delivery)
mockDailySettlement.netTotal = fmtN(mockDailySettlement.grossTotal - mockDailySettlement.totalFees)

export const mockReceipts: PaymentReceipt[] = [
  { receiptId:'RCT-001', paymentId:'PAY-001', tripId:'TRIP-TAXI-001', driverId:'DR-00001234', activity:'TAXI', issuedAt:'2026-08-24T14:01:30Z', fare:42.50, tpsAmount:2.13, tvqAmount:4.23, tipAmount:5.00, adjustments:0, totalAmount:fmtN(42.50+2.13+4.23+5), paymentMethod:'CARD', referenceId:'REF-PAY-001', taximeterEnabled:true, notes:null },
  { receiptId:'RCT-002', paymentId:'PAY-002', tripId:'TRIP-TAXI-002', driverId:'DR-00001234', activity:'TAXI', issuedAt:'2026-08-24T11:35:00Z', fare:35.00, tpsAmount:1.75, tvqAmount:3.49, tipAmount:3.00, adjustments:0, totalAmount:fmtN(35+1.75+3.49+3), paymentMethod:'CASH', referenceId:'REF-PAY-002', taximeterEnabled:true, notes:'Paiement comptant confirmé chauffeur' },
]

export const mockAudit: PaymentAuditEvent[] = [
  { auditId:'PAUD-001', paymentId:'PAY-001', driverId:'DR-00001234', action:'PAYMENT_CREATED', actor:'SYSTEM', actorRole:'SYSTEM', amount:42.50, timestamp:'2026-08-24T14:00:00Z', details:'Taxi course terminée — taximètre' },
  { auditId:'PAUD-002', paymentId:'PAY-001', driverId:'DR-00001234', action:'PAYMENT_CAPTURED', actor:'STRIPE', actorRole:'PROVIDER', amount:42.50, timestamp:'2026-08-24T14:01:00Z', details:'Stripe pi_pay001 capturé' },
  { auditId:'PAUD-003', paymentId:'PAY-001', driverId:'DR-00001234', action:'WALLET_CREDITED', actor:'SYSTEM', actorRole:'SYSTEM', amount:47.50, timestamp:'2026-08-24T14:01:30Z', details:'Wallet +42.50 + pourboire +5.00' },
  { auditId:'PAUD-004', paymentId:'PAY-010', driverId:'DR-00001234', action:'PAYMENT_FAILED', actor:'STRIPE', actorRole:'PROVIDER', amount:28.00, timestamp:'2026-08-24T16:00:00Z', details:'Stripe — card declined — NO wallet credit' },
  { auditId:'PAUD-005', paymentId:'PO-001', driverId:'DR-00001234', action:'PAYOUT_COMPLETED', actor:'STRIPE', actorRole:'PROVIDER', amount:-300.00, timestamp:'2026-08-20T09:00:00Z', details:'Virement bancaire tok_bank_••••4242' },
]

// ─── HELPERS ─────────────────────────────────────────────────

export const fmt = (v: number) => new Intl.NumberFormat('fr-CA', { style:'currency', currency:'CAD' }).format(v)

export const PAYMENT_METHOD_CONF: Record<PaymentMethod, { icon: string; label: string; color: string }> = {
  CASH:     { icon:'💵', label:'Comptant',    color:'text-green-400' },
  CARD:     { icon:'💳', label:'Carte',       color:'text-blue-400' },
  INTERAC:  { icon:'🟥', label:'Interac',     color:'text-red-400' },
  STRIPE:   { icon:'⚡', label:'Stripe',      color:'text-purple-400' },
  WALLET:   { icon:'👛', label:'Wallet',      color:'text-amber-400' },
  PROVIDER: { icon:'🔌', label:'Fournisseur', color:'text-slate-300' },
  OTHER:    { icon:'🔄', label:'Autre',       color:'text-slate-500' },
}

export const PAYMENT_STATUS_CONF: Record<PaymentStatus, { icon: string; color: string; label: string }> = {
  PENDING:            { icon:'⏳', color:'text-amber-400',  label:'En attente' },
  AUTHORIZED:         { icon:'✓',  color:'text-blue-400',   label:'Autorisé' },
  CAPTURED:           { icon:'✓✓', color:'text-blue-400',   label:'Capturé' },
  COMPLETED:          { icon:'✅', color:'text-green-400',  label:'Complété' },
  FAILED:             { icon:'❌', color:'text-red-400',    label:'Échoué' },
  CANCELLED:          { icon:'🚫', color:'text-slate-500',  label:'Annulé' },
  REFUNDED:           { icon:'↩',  color:'text-orange-400', label:'Remboursé' },
  PARTIALLY_REFUNDED: { icon:'↩½', color:'text-orange-400', label:'Remboursé partiel' },
  DISPUTED:           { icon:'⚠',  color:'text-red-400',   label:'Contesté' },
  EXPIRED:            { icon:'⏱',  color:'text-slate-500',  label:'Expiré' },
  UNKNOWN:            { icon:'❓',  color:'text-slate-500',  label:'Inconnu' },
}

export const ACTIVITY_ICONS_PAY: Record<PaymentActivity, string> = {
  TAXI:'🚕', RIDESHARE:'🚗', DELIVERY:'📦',
}
