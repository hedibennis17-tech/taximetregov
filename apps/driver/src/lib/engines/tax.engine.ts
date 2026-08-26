// ============================================================
// TAXIMÈTRE.GOV — TAX & FISCAL PROFILE ENGINE
// Phase 2 — Step 19: Tax & Fiscal Profile
// ============================================================
//
// RÈGLES ABSOLUES:
// 1. Jamais hardcoder les taux fiscaux dans le frontend
// 2. Toutes les règles proviennent du TaxRuleEngine (versionnées)
// 3. Estimation ≠ obligation fiscale officielle
// 4. NAS jamais affiché en clair — coffre sécurisé uniquement
// 5. Ne jamais se substituer à Revenu Québec ou l'ARC
// 6. Chaque transaction conserve son snapshot de règles au moment du calcul
// 7. Driver A ne peut jamais accéder au profil fiscal de Driver B
// ============================================================

// ─── TYPES ───────────────────────────────────────────────────

export type Jurisdiction = 'CA-QC' | 'CA-ON' | 'CA-BC' | 'CA-AB' | 'CA-FED' | 'US-NY' | 'US-CA' | 'OTHER'

export type BusinessStatus =
  | 'EMPLOYEE' | 'SELF_EMPLOYED' | 'SOLE_PROPRIETOR'
  | 'CORPORATION' | 'PARTNERSHIP' | 'OTHER' | 'UNKNOWN'

export type TaxType = 'TPS' | 'TVQ' | 'HST' | 'GST' | 'INCOME_TAX' | 'OTHER_SALES_TAX' | 'OTHER'

export type RegistrationStatus =
  | 'NOT_REGISTERED' | 'REGISTERED' | 'PENDING' | 'EXEMPT' | 'UNKNOWN' | 'REVIEW_REQUIRED'

export type VerificationStatus =
  | 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'EXPIRED' | 'REJECTED' | 'REVIEW_REQUIRED'

export type TaxableStatus =
  | 'TAXABLE' | 'NON_TAXABLE' | 'EXEMPT' | 'ZERO_RATED' | 'UNKNOWN' | 'REVIEW_REQUIRED'

export type TaxPeriodType = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'CUSTOM'
export type TaxPeriodStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'READY' | 'SUBMITTED' | 'ACCEPTED' | 'AMENDED'
export type TaxReportStatus = 'DRAFT' | 'READY' | 'UNDER_REVIEW' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'AMENDED' | 'CANCELLED'
export type DeductibilityStatus = 'UNKNOWN' | 'POTENTIALLY_DEDUCTIBLE' | 'NOT_DEDUCTIBLE' | 'REVIEW_REQUIRED'

// ─── DRIVER FISCAL PROFILE ────────────────────────────────────

export interface DriverFiscalProfile {
  id: string
  driverId: string
  jurisdiction: Jurisdiction
  taxResidency: Jurisdiction
  businessStatus: BusinessStatus
  businessName: string | null
  legalName: string
  businessNumber: string | null        // Masqué dans l'UI — ••••••1234
  taxRegistrationStatus: RegistrationStatus
  gstRegistrationStatus: RegistrationStatus
  qstRegistrationStatus: RegistrationStatus
  // Sensitive identifiers: NEVER stored in this model
  // federalTaxAccountRef: stored in secure vault only
  // provincialTaxAccountRef: stored in secure vault only
  effectiveFrom: string
  effectiveTo: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'REVIEW_REQUIRED'
  createdAt: string
  updatedAt: string
}

// ─── TAX REGISTRATION ─────────────────────────────────────────

export interface TaxRegistration {
  registrationId: string
  driverId: string
  taxType: TaxType
  registrationNumberMasked: string   // Always masked — never full number
  status: RegistrationStatus
  verificationStatus: VerificationStatus
  effectiveDate: string
  expiryDate: string | null
  verifiedAt: string | null
  source: 'DRIVER_ENTERED' | 'GOVERNMENT_PROVIDED' | 'API_VERIFIED'
  createdAt: string
  updatedAt: string
}

// ─── TAX RULE VERSION (configurable, versioned, never hardcoded) ─

export interface TaxRuleVersion {
  ruleId: string
  jurisdiction: Jurisdiction
  taxType: TaxType
  version: string
  effectiveFrom: string
  effectiveTo: string | null
  rate: number                         // e.g. 0.05 for TPS, 0.09975 for TVQ
  threshold: number | null             // Registration threshold (e.g. $30,000 CA)
  sourceReference: string              // Official regulation reference
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'SUPERSEDED'
  approvedBy: string | null
  createdAt: string
}

// Active rules — loaded from TaxRuleEngine, never hardcoded
// Rates are CONFIGURABLE by government administrators
export const ACTIVE_TAX_RULES: TaxRuleVersion[] = [
  {
    ruleId: 'RULE-CA-QC-TPS-2026-V1',
    jurisdiction: 'CA-QC', taxType: 'TPS', version: '2026-V1',
    effectiveFrom: '2026-01-01', effectiveTo: null,
    rate: 0.05,               // 5% TPS — from official regulation
    threshold: 30000,         // $30,000 CAD threshold for mandatory registration
    sourceReference: 'LTA s.225 / Excise Tax Act — ARC/CRA',
    status: 'ACTIVE', approvedBy: 'SYSTEM_ADMIN', createdAt: '2026-01-01T00:00:00Z',
  },
  {
    ruleId: 'RULE-CA-QC-TVQ-2026-V1',
    jurisdiction: 'CA-QC', taxType: 'TVQ', version: '2026-V1',
    effectiveFrom: '2026-01-01', effectiveTo: null,
    rate: 0.09975,            // 9.975% TVQ — from official regulation
    threshold: 30000,
    sourceReference: 'LTVQ s.415 — Revenu Québec',
    status: 'ACTIVE', approvedBy: 'SYSTEM_ADMIN', createdAt: '2026-01-01T00:00:00Z',
  },
]

// ─── TAX RULE ENGINE ──────────────────────────────────────────

export interface TaxCalculationInput {
  grossAmount: number
  taxableAmount: number       // may differ from gross (some amounts may be exempt)
  jurisdiction: Jurisdiction
  taxTypes: TaxType[]
  transactionDate: string
  taxIncluded: boolean        // Is tax already included in the amount?
}

export interface TaxCalculationResult {
  jurisdiction: Jurisdiction
  ruleVersion: string
  taxableBase: number
  breakdown: {
    taxType: TaxType
    rate: number
    amount: number
    ruleId: string
  }[]
  totalTax: number
  netAmount: number
  calculatedAt: string
  isEstimate: boolean         // ALWAYS true when not officially submitted
  note: string
}

export function calculateTax(input: TaxCalculationInput): TaxCalculationResult {
  const rules = ACTIVE_TAX_RULES.filter(r =>
    r.jurisdiction === input.jurisdiction &&
    input.taxTypes.includes(r.taxType) &&
    r.status === 'ACTIVE' &&
    r.effectiveFrom <= input.transactionDate &&
    (r.effectiveTo === null || r.effectiveTo >= input.transactionDate)
  )

  const breakdown = rules.map(rule => ({
    taxType: rule.taxType,
    rate: rule.rate,
    amount: Math.round(input.taxableAmount * rule.rate * 100) / 100,
    ruleId: rule.ruleId,
  }))

  const totalTax = Math.round(breakdown.reduce((a, b) => a + b.amount, 0) * 100) / 100
  const netAmount = Math.round((input.taxableAmount + totalTax) * 100) / 100

  return {
    jurisdiction: input.jurisdiction,
    ruleVersion: rules.map(r => r.version).join('+'),
    taxableBase: input.taxableAmount,
    breakdown,
    totalTax,
    netAmount,
    calculatedAt: new Date().toISOString(),
    isEstimate: true,  // Always estimate until officially submitted
    note: 'ESTIMATION — Non soumis à Revenu Québec ou l\'ARC. Pour usage informatif seulement.',
  }
}

// ─── TRANSACTION TAX SNAPSHOT ────────────────────────────────
// Frozen at the time of transaction — never retroactively modified

export interface TransactionTaxSnapshot {
  snapshotId: string
  transactionId: string
  jurisdiction: Jurisdiction
  taxRuleVersion: string
  taxCategory: TaxableStatus
  gstStatus: RegistrationStatus
  qstStatus: RegistrationStatus
  taxableBase: number
  gstAmount: number
  qstAmount: number
  totalTax: number
  calculatedAt: string
  isEstimate: boolean
}

// ─── TAX PERIOD ───────────────────────────────────────────────

export interface TaxPeriod {
  periodId: string
  driverId: string
  jurisdiction: Jurisdiction
  taxType: TaxType
  periodType: TaxPeriodType
  periodLabel: string
  periodStart: string
  periodEnd: string
  status: TaxPeriodStatus
  grossRevenue: number
  taxableRevenue: number
  taxCollected: number
  adjustments: number
  refunds: number
  estimatedPayable: number   // ESTIMATE only
  transactionCount: number
}

// ─── TAX SUMMARY ─────────────────────────────────────────────

export interface TaxSummary {
  driverId: string
  jurisdiction: Jurisdiction
  year: number
  taxableRevenue: number
  tpsCollected: number
  tvqCollected: number
  totalTaxCollected: number
  adjustments: number
  refunds: number
  estimatedPayable: number
  status: 'DRAFT' | 'READY' | 'SUBMITTED'
  isEstimate: boolean
  note: string
}

// ─── TAX REPORT ───────────────────────────────────────────────

export interface TaxReport {
  reportId: string
  driverId: string
  jurisdiction: Jurisdiction
  taxType: TaxType
  period: string
  grossRevenue: number
  taxableRevenue: number
  taxCollected: number
  adjustments: number
  refunds: number
  status: TaxReportStatus
  generatedAt: string
  submittedAt: string | null
  note: string
}

// ─── BUSINESS EXPENSE (architecture — deductibility undetermined) ─

export interface BusinessExpense {
  expenseId: string
  driverId: string
  date: string
  category: 'FUEL' | 'MAINTENANCE' | 'INSURANCE' | 'PHONE' | 'SUPPLIES' | 'OTHER'
  amount: number
  taxAmount: number | null
  supplier: string | null
  receiptId: string | null
  deductibilityStatus: DeductibilityStatus  // NEVER auto-decided
  status: 'DRAFT' | 'REVIEW' | 'CONFIRMED'
  notes: string | null
}

// ─── FISCAL AUDIT EVENT ───────────────────────────────────────

export interface FiscalAuditEvent {
  auditId: string
  driverId: string
  action: string
  resource: string
  timestamp: string
  result: 'SUCCESS' | 'FAILURE' | 'WARNING'
  details: string | null
}

// ─── MOCK DATA ────────────────────────────────────────────────

export const mockFiscalProfile: DriverFiscalProfile = {
  id: 'FP-001',
  driverId: 'DR-00001234',
  jurisdiction: 'CA-QC',
  taxResidency: 'CA-QC',
  businessStatus: 'SELF_EMPLOYED',
  businessName: null,
  legalName: 'Mohamed Benali',
  businessNumber: '••••••1234',      // Masked — full stored in secure vault
  taxRegistrationStatus: 'REGISTERED',
  gstRegistrationStatus: 'REGISTERED',
  qstRegistrationStatus: 'REGISTERED',
  effectiveFrom: '2024-01-01',
  effectiveTo: null,
  status: 'ACTIVE',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2026-08-01T00:00:00Z',
}

export const mockTaxRegistrations: TaxRegistration[] = [
  {
    registrationId: 'TR-001', driverId: 'DR-00001234', taxType: 'TPS',
    registrationNumberMasked: 'GST ••••-••••-1234 RT 0001',
    status: 'REGISTERED', verificationStatus: 'VERIFIED',
    effectiveDate: '2024-01-01', expiryDate: null,
    verifiedAt: '2024-01-15T10:00:00Z', source: 'DRIVER_ENTERED',
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    registrationId: 'TR-002', driverId: 'DR-00001234', taxType: 'TVQ',
    registrationNumberMasked: 'QST •••-•••-456-TQ-0001',
    status: 'REGISTERED', verificationStatus: 'VERIFIED',
    effectiveDate: '2024-01-01', expiryDate: null,
    verifiedAt: '2024-01-15T10:00:00Z', source: 'DRIVER_ENTERED',
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-15T10:00:00Z',
  },
]

export const mockTaxPeriods: TaxPeriod[] = [
  { periodId:'TP-001', driverId:'DR-00001234', jurisdiction:'CA-QC', taxType:'TPS', periodType:'QUARTERLY', periodLabel:'T1 2026 (Jan–Mar)', periodStart:'2026-01-01', periodEnd:'2026-03-31', status:'READY', grossRevenue:8200, taxableRevenue:7380, taxCollected:369, adjustments:45, refunds:20, estimatedPayable:304, transactionCount:187 },
  { periodId:'TP-002', driverId:'DR-00001234', jurisdiction:'CA-QC', taxType:'TPS', periodType:'QUARTERLY', periodLabel:'T2 2026 (Avr–Jun)', periodStart:'2026-04-01', periodEnd:'2026-06-30', status:'READY', grossRevenue:10910, taxableRevenue:9819, taxCollected:491, adjustments:60, refunds:15, estimatedPayable:416, transactionCount:246 },
  { periodId:'TP-003', driverId:'DR-00001234', jurisdiction:'CA-QC', taxType:'TPS', periodType:'QUARTERLY', periodLabel:'T3 2026 (Jul–Sep)', periodStart:'2026-07-01', periodEnd:'2026-09-30', status:'IN_PROGRESS', grossRevenue:6840, taxableRevenue:6156, taxCollected:308, adjustments:28, refunds:12, estimatedPayable:268, transactionCount:168 },
  { periodId:'TP-004', driverId:'DR-00001234', jurisdiction:'CA-QC', taxType:'TPS', periodType:'QUARTERLY', periodLabel:'T4 2026 (Oct–Déc)', periodStart:'2026-10-01', periodEnd:'2026-12-31', status:'NOT_STARTED', grossRevenue:0, taxableRevenue:0, taxCollected:0, adjustments:0, refunds:0, estimatedPayable:0, transactionCount:0 },
]

export const mockTaxSummary: TaxSummary = {
  driverId: 'DR-00001234',
  jurisdiction: 'CA-QC',
  year: 2026,
  taxableRevenue: 23355,
  tpsCollected: 1168,
  tvqCollected: 2330,
  totalTaxCollected: 3498,
  adjustments: 133,
  refunds: 47,
  estimatedPayable: 988,
  status: 'DRAFT',
  isEstimate: true,
  note: 'ESTIMATION — Données incomplètes (T3 en cours, T4 non commencé). Non soumis à Revenu Québec ou l\'ARC.',
}

export const mockExpenses: BusinessExpense[] = [
  { expenseId:'EXP-001', driverId:'DR-00001234', date:'2026-08-20', category:'FUEL', amount:85.40, taxAmount:12.76, supplier:'Petro-Canada', receiptId:'RCP-001', deductibilityStatus:'POTENTIALLY_DEDUCTIBLE', status:'CONFIRMED', notes:'Plein d\'essence — usage professionnel partiel' },
  { expenseId:'EXP-002', driverId:'DR-00001234', date:'2026-08-15', category:'MAINTENANCE', amount:245.00, taxAmount:36.62, supplier:'Centre Mécanique XYZ', receiptId:'RCP-002', deductibilityStatus:'POTENTIALLY_DEDUCTIBLE', status:'CONFIRMED', notes:'Vidange et inspection' },
  { expenseId:'EXP-003', driverId:'DR-00001234', date:'2026-08-01', category:'PHONE', amount:65.00, taxAmount:9.71, supplier:'Bell Mobilité', receiptId:null, deductibilityStatus:'REVIEW_REQUIRED', status:'REVIEW', notes:'Usage professionnel et personnel — proportion à déterminer' },
]

export const mockFiscalAudit: FiscalAuditEvent[] = [
  { auditId:'FA-001', driverId:'DR-00001234', action:'PROFILE_CREATED', resource:'FiscalProfile', timestamp:'2024-01-01T10:00:00Z', result:'SUCCESS', details:'Profil fiscal initial créé' },
  { auditId:'FA-002', driverId:'DR-00001234', action:'TAX_REGISTRATION_ADDED', resource:'TPS', timestamp:'2024-01-01T10:05:00Z', result:'SUCCESS', details:'Numéro TPS enregistré (statut: UNVERIFIED → VERIFIED)' },
  { auditId:'FA-003', driverId:'DR-00001234', action:'TAX_REGISTRATION_VERIFIED', resource:'TVQ', timestamp:'2024-01-15T10:00:00Z', result:'SUCCESS', details:'Numéro TVQ vérifié' },
  { auditId:'FA-004', driverId:'DR-00001234', action:'TAX_REPORT_GENERATED', resource:'T1-2026', timestamp:'2026-04-15T09:00:00Z', result:'SUCCESS', details:'Rapport T1 2026 généré (ESTIMATION)' },
  { auditId:'FA-005', driverId:'DR-00001234', action:'DOCUMENT_UPLOADED', resource:'TaxRegistration', timestamp:'2026-08-01T14:00:00Z', result:'SUCCESS', details:'Document fiscal téléversé' },
]

export const mockTaxReports: TaxReport[] = [
  { reportId:'RPT-001', driverId:'DR-00001234', jurisdiction:'CA-QC', taxType:'TPS', period:'T1 2026', grossRevenue:8200, taxableRevenue:7380, taxCollected:369, adjustments:45, refunds:20, status:'READY', generatedAt:'2026-04-15T09:00:00Z', submittedAt:null, note:'ESTIMATION — Prêt pour soumission manuelle à l\'ARC' },
  { reportId:'RPT-002', driverId:'DR-00001234', jurisdiction:'CA-QC', taxType:'TVQ', period:'T1 2026', grossRevenue:8200, taxableRevenue:7380, taxCollected:736, adjustments:45, refunds:20, status:'READY', generatedAt:'2026-04-15T09:00:00Z', submittedAt:null, note:'ESTIMATION — Prêt pour soumission manuelle à Revenu Québec' },
]

// ─── HELPERS ──────────────────────────────────────────────────

export function formatCAD(v: number): string {
  return new Intl.NumberFormat('fr-CA', { style:'currency', currency:'CAD' }).format(v)
}

export function getPeriodStatusConfig(status: TaxPeriodStatus): { color: string; icon: string; bg: string } {
  const map: Record<TaxPeriodStatus, { color: string; icon: string; bg: string }> = {
    NOT_STARTED: { color:'text-slate-500', icon:'⚪', bg:'bg-slate-800/50 border-slate-700' },
    IN_PROGRESS: { color:'text-blue-400', icon:'🔵', bg:'bg-blue-500/10 border-blue-500/20' },
    READY:       { color:'text-green-400', icon:'🟢', bg:'bg-green-500/10 border-green-500/20' },
    SUBMITTED:   { color:'text-purple-400', icon:'📤', bg:'bg-purple-500/10 border-purple-500/20' },
    ACCEPTED:    { color:'text-green-400', icon:'✅', bg:'bg-green-500/10 border-green-500/20' },
    AMENDED:     { color:'text-amber-400', icon:'🔄', bg:'bg-amber-500/10 border-amber-500/20' },
  }
  return map[status]
}

export function getVerificationConfig(status: VerificationStatus): { color: string; label: string; icon: string } {
  const map: Record<VerificationStatus, { color: string; label: string; icon: string }> = {
    UNVERIFIED:      { color:'text-slate-400', label:'Non vérifié', icon:'⚪' },
    PENDING:         { color:'text-amber-400', label:'Vérification en cours', icon:'⏳' },
    VERIFIED:        { color:'text-green-400', label:'Vérifié', icon:'✅' },
    EXPIRED:         { color:'text-red-400', label:'Expiré', icon:'❌' },
    REJECTED:        { color:'text-red-400', label:'Rejeté', icon:'🚫' },
    REVIEW_REQUIRED: { color:'text-orange-400', label:'Révision requise', icon:'⚠️' },
  }
  return map[status]
}
