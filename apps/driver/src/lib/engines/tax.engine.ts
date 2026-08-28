// ============================================================
// TAXIMÈTRE.GOV — TAX ENGINE v2
// Phase 2 — Step 27: Tax Engine · Reporting · Regulatory
// ============================================================
//
// RÈGLES ABSOLUES:
// 1. Taux fiscaux: JAMAIS hardcodés — TaxRuleVersion configurable
// 2. Transaction historique: conserve la règle au moment de l'enregistrement
// 3. Rapport FINALIZED: immuable → TaxReportAmendment avec audit
// 4. Cash ≠ non-déclaré (méthode de paiement, pas absence de revenu)
// 5. Gross ≠ taxable (fees/exemptions/adjustments séparés)
// 6. NAS/SIN: jamais clé primaire
// 7. Anomalie ≠ fraude → REVIEW_REQUIRED uniquement
// 8. Soumission sans API réelle → MANUAL_EXPORT (jamais fausse intégration)
// 9. Driver A ne peut jamais voir les données fiscales de Driver B
// ============================================================

export type Jurisdiction = 'CA-QC' | 'CA-ON' | 'CA-BC' | 'CA-AB' | 'CA-FED' | 'US-NY' | 'US-CA' | 'OTHER'
export type TaxType = 'TPS' | 'TVQ' | 'HST' | 'GST' | 'INCOME_TAX' | 'OTHER_SALES_TAX' | 'OTHER'
export type BusinessStatus = 'SELF_EMPLOYED' | 'CORPORATION' | 'PARTNERSHIP' | 'OTHER'
export type RegistrationStatus = 'NOT_REGISTERED' | 'REGISTERED' | 'PENDING' | 'SUSPENDED' | 'REVOKED'
export type VerificationStatus = 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'FAILED' | 'MANUAL_REVIEW'
export type TaxPeriodType = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'CUSTOM'
export type TaxPeriodStatus = 'OPEN' | 'CALCULATING' | 'REVIEW' | 'FINALIZED' | 'AMENDED'
export type TaxReportStatus = 'DRAFT' | 'CALCULATING' | 'READY' | 'REVIEW' | 'FINALIZED' | 'AMENDED' | 'CANCELLED'
export type TaxSubmissionStatus = 'NOT_SUBMITTED' | 'READY' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'PENDING' | 'ERROR'
export type TaxSubmissionMethod = 'MANUAL_EXPORT' | 'API_SANDBOX' | 'API_PRODUCTION'
export type AnomalyType = 'UNUSUAL_REVENUE' | 'MISSING_TAX' | 'TAX_MISMATCH' | 'DUPLICATE' | 'INVALID_PERIOD' | 'RULE_CONFLICT' | 'MISSING_REGISTRATION' | 'MANUAL_REVIEW'
export type DeductibilityStatus = 'UNKNOWN' | 'POTENTIALLY_DEDUCTIBLE' | 'NOT_DEDUCTIBLE' | 'REVIEW_REQUIRED'

// ─── TAX PROFILE ──────────────────────────────────────────────

export interface TaxProfile {
  id: string
  driverId: string
  jurisdiction: Jurisdiction
  businessStatus: BusinessStatus
  taxRegistrationStatus: RegistrationStatus
  // Reference masked — sensitive value encrypted server-side
  registrationReference: string | null
  effectiveFrom: string
  effectiveTo: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
}

// ─── TAX REGISTRATION ─────────────────────────────────────────

export interface TaxRegistration {
  id: string
  driverId: string
  jurisdiction: Jurisdiction
  taxType: TaxType
  maskedReference: string          // e.g. "••••••••1234QC" — never full number
  verificationStatus: VerificationStatus
  effectiveFrom: string
  effectiveTo: string | null
  status: RegistrationStatus
}

// ─── TAX IDENTIFIER ───────────────────────────────────────────

export interface TaxIdentifier {
  id: string
  driverId: string
  jurisdiction: Jurisdiction
  taxType: TaxType
  maskedReference: string          // Always masked in UI
  verificationStatus: VerificationStatus
}

// ─── TAX RULE ─────────────────────────────────────────────────

export interface TaxRule {
  id: string
  jurisdiction: Jurisdiction
  taxType: TaxType
  rate: number                     // e.g. 0.05 for 5% — NEVER hardcoded in frontend
  effectiveFrom: string
  effectiveTo: string | null
  taxableCategories: string[]      // Which activities this applies to
  exemptCategories: string[]
  calculationMethod: 'PERCENTAGE' | 'FLAT' | 'TIERED'
  roundingMethod: 'HALF_UP' | 'HALF_DOWN' | 'FLOOR' | 'CEILING'
  status: 'DRAFT' | 'ACTIVE' | 'SUPERSEDED' | 'ARCHIVED'
}

// ─── TAX RULE VERSION ─────────────────────────────────────────

export interface TaxRuleVersion {
  versionId: string
  jurisdiction: Jurisdiction
  taxType: TaxType
  version: string
  effectiveFrom: string
  effectiveTo: string | null
  rules: TaxRule[]
  status: 'DRAFT' | 'ACTIVE' | 'SUPERSEDED'
  publishedBy: string
  publishedAt: string
  sourceRef: string               // Official regulation reference
  // Historical transactions always reference their rule version at time of recording
}

// ─── TAX CONFIGURATION ────────────────────────────────────────

export interface TaxConfiguration {
  jurisdiction: Jurisdiction
  currency: 'CAD' | 'USD' | 'EUR' | 'OTHER'
  activeRuleVersionIds: string[]
  reportingFrequency: TaxPeriodType
  roundingPrecision: number        // decimal places
  effectiveFrom: string
}

// ─── TAXABLE EVENT ────────────────────────────────────────────

export interface TaxableEvent {
  eventId: string
  transactionId: string
  driverId: string
  source: string                   // TAXIMETER / UBER / LYFT / DOORDASH etc.
  jurisdiction: Jurisdiction
  grossAmount: number
  fees: number
  adjustments: number
  tip: number
  taxableAmount: number            // Computed — gross - fees ± adjustments (not net)
  taxExemptAmount: number
  nonTaxableAmount: number
  currency: 'CAD'
  occurredAt: string
  ruleVersionId: string           // Locked at event time — never retroactive
}

// ─── TAX CALCULATION ──────────────────────────────────────────

export interface TaxCalculation {
  calcId: string
  eventId: string
  transactionId: string
  driverId: string
  jurisdiction: Jurisdiction
  ruleVersionId: string
  taxType: TaxType
  taxableAmount: number
  rate: number                     // Loaded from TaxRule — never hardcoded
  taxAmount: number
  roundingApplied: number
  calculatedAt: string
  isEstimate: boolean              // Always true until officially finalized
}

// ─── TAX CALCULATION SNAPSHOT ─────────────────────────────────

export interface TaxCalculationSnapshot {
  snapshotId: string
  transactionId: string
  taxRuleVersion: string
  taxableAmount: number
  tpsAmount: number
  tvqAmount: number
  totalTax: number
  timestamp: string
  // Preserved for audit — snapshot never changes retroactively
}

// ─── TAX PERIOD ───────────────────────────────────────────────

export interface TaxPeriod {
  periodId: string
  driverId: string
  jurisdiction: Jurisdiction
  periodType: TaxPeriodType
  periodStart: string
  periodEnd: string
  status: TaxPeriodStatus
  taxTypes: TaxType[]
}

// ─── TAX REPORT ───────────────────────────────────────────────

export interface TaxReport {
  reportId: string
  driverId: string
  jurisdiction: Jurisdiction
  periodStart: string
  periodEnd: string
  ruleVersionId: string

  // Revenue breakdown
  grossRevenue: number
  taxableRevenue: number
  nonTaxableRevenue: number
  exemptRevenue: number
  fees: number; adjustments: number; refunds: number

  // Tax breakdown — never hardcoded rates
  tpsCollected: number
  tvqCollected: number
  otherTax: number
  totalTax: number

  // By service
  taxiGross: number; rideshareGross: number; deliveryGross: number; cashGross: number

  status: TaxReportStatus
  isEstimate: boolean              // ALWAYS true until officially finalized + submitted
  generatedAt: string
  finalizedAt: string | null
  submissionStatus: TaxSubmissionStatus
  submissionMethod: TaxSubmissionMethod
  submissionReference: string | null  // Never fabricate — null until real submission

  note: string                     // Always: "ESTIMATION — pas une déclaration officielle"
}

// ─── TAX REPORT AMENDMENT ─────────────────────────────────────

export interface TaxReportAmendment {
  amendmentId: string
  originalReportId: string
  driverId: string
  reason: string
  oldValues: Record<string, number | string>
  newValues: Record<string, number | string>
  createdBy: string
  approvedBy: string | null
  createdAt: string
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPLIED' | 'REJECTED'
}

// ─── TAX ANOMALY ──────────────────────────────────────────────

export interface TaxAnomaly {
  anomalyId: string
  driverId: string
  type: AnomalyType
  description: string
  affectedAmount: number | null
  reportId: string | null
  status: 'OPEN' | 'REVIEW_REQUIRED' | 'RESOLVED' | 'FALSE_POSITIVE'
  detectedAt: string
  // ANOMALY ≠ FRAUD — never auto-accuse driver
}

// ─── TAX REVIEW CASE ──────────────────────────────────────────

export interface TaxReviewCase {
  caseId: string
  driverId: string
  anomalyId: string | null
  reportId: string | null
  status: 'OPEN' | 'ASSIGNED' | 'UNDER_REVIEW' | 'RESOLVED' | 'ESCALATED' | 'CLOSED'
  assignedTo: string | null
  resolution: string | null
  openedAt: string
  resolvedAt: string | null
}

// ─── TAX SUBMISSION ───────────────────────────────────────────

export interface TaxSubmission {
  submissionId: string
  reportId: string
  driverId: string
  jurisdiction: Jurisdiction
  method: TaxSubmissionMethod      // MANUAL_EXPORT until real API authorized
  status: TaxSubmissionStatus
  // MANUAL_EXPORT = driver exports PDF/CSV and submits themselves
  // API_PRODUCTION = only with official government authorization
  submittedAt: string | null
  reference: string | null         // Never fabricate
  note: string                     // "Soumission manuelle — aucune API officielle connectée"
}

// ─── TAX DOCUMENT ─────────────────────────────────────────────

export interface TaxDocument {
  docId: string
  driverId: string
  reportId: string | null
  docType: 'TAX_REPORT' | 'REVENUE_STATEMENT' | 'PROVIDER_STATEMENT' | 'EXPENSE_REPORT' | 'MILEAGE_REPORT' | 'RECEIPT' | 'AMENDMENT'
  format: 'PDF' | 'CSV' | 'JSON'
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED'
  generatedAt: string | null
  expiresAt: string | null         // Signed temporary access
  storageReferenceMasked: string
}

// ─── EXPENSE ──────────────────────────────────────────────────

export interface TaxExpense {
  expenseId: string
  driverId: string
  category: 'FUEL' | 'MAINTENANCE' | 'INSURANCE' | 'PHONE' | 'VEHICLE' | 'PLATFORM_FEES' | 'OTHER'
  amount: number; taxAmount: number
  businessPortion: number; personalPortion: number
  date: string
  receiptId: string | null
  vehicleId: string | null
  deductibilityStatus: DeductibilityStatus  // UNKNOWN until Tax Engine decides
  notes: string | null
}

// ─── ANNUAL TAX SUMMARY ───────────────────────────────────────

export interface AnnualTaxSummary {
  year: number
  driverId: string
  jurisdiction: Jurisdiction

  totalGrossRevenue: number
  totalTaxableRevenue: number
  totalFees: number; totalRefunds: number; totalAdjustments: number

  tpsCollected: number; tvqCollected: number; totalTax: number

  totalExpenses: number; businessExpenses: number

  totalBusinessKm: number; totalPersonalKm: number; totalVehicleKm: number

  byProvider: Record<string, { gross: number; fees: number; net: number }>
  byService: { taxi: number; rideshare: number; delivery: number; cash: number }

  isEstimate: boolean
  note: string
}

// ─── JURISDICTION ENGINE ──────────────────────────────────────

export const JURISDICTION_CONFIG: Record<Jurisdiction, {
  label: string; currency: string; tpsType: string | null; tvqType: string | null
}> = {
  'CA-QC': { label:'Québec', currency:'CAD', tpsType:'TPS', tvqType:'TVQ' },
  'CA-ON': { label:'Ontario', currency:'CAD', tpsType:'HST', tvqType:null },
  'CA-BC': { label:'Colombie-Britannique', currency:'CAD', tpsType:'GST', tvqType:null },
  'CA-AB': { label:'Alberta', currency:'CAD', tpsType:'GST', tvqType:null },
  'CA-FED': { label:'Canada (Fédéral)', currency:'CAD', tpsType:'GST', tvqType:null },
  'US-NY': { label:'New York', currency:'USD', tpsType:'SALES_TAX', tvqType:null },
  'US-CA': { label:'Californie', currency:'USD', tpsType:'SALES_TAX', tvqType:null },
  'OTHER': { label:'Autre', currency:'CAD', tpsType:null, tvqType:null },
}

// ─── ACTIVE TAX RULES (configurable — never hardcoded) ────────

export const ACTIVE_TAX_RULE_VERSIONS: TaxRuleVersion[] = [
  {
    versionId:'TRV-QC-TPS-2026', jurisdiction:'CA-QC', taxType:'TPS', version:'2026-V1',
    effectiveFrom:'2026-01-01', effectiveTo:null,
    rules:[{
      id:'RULE-TPS-001', jurisdiction:'CA-QC', taxType:'TPS',
      rate:0.05, effectiveFrom:'2026-01-01', effectiveTo:null,
      taxableCategories:['TAXI','RIDESHARE','DELIVERY','DIRECT_PAYMENT'],
      exemptCategories:[], calculationMethod:'PERCENTAGE', roundingMethod:'HALF_UP',
      status:'ACTIVE',
    }],
    status:'ACTIVE', publishedBy:'ADMIN-GOV-001', publishedAt:'2025-12-01T00:00:00Z',
    sourceRef:'Loi sur la taxe d\'accise — ARC',
  },
  {
    versionId:'TRV-QC-TVQ-2026', jurisdiction:'CA-QC', taxType:'TVQ', version:'2026-V1',
    effectiveFrom:'2026-01-01', effectiveTo:null,
    rules:[{
      id:'RULE-TVQ-001', jurisdiction:'CA-QC', taxType:'TVQ',
      rate:0.09975, effectiveFrom:'2026-01-01', effectiveTo:null,
      taxableCategories:['TAXI','RIDESHARE','DELIVERY','DIRECT_PAYMENT'],
      exemptCategories:[], calculationMethod:'PERCENTAGE', roundingMethod:'HALF_UP',
      status:'ACTIVE',
    }],
    status:'ACTIVE', publishedBy:'ADMIN-GOV-001', publishedAt:'2025-12-01T00:00:00Z',
    sourceRef:'Loi sur la taxe de vente du Québec — Revenu Québec',
  },
]

// ─── TAX CALCULATION ENGINE ───────────────────────────────────

export function calculateTaxFromRules(
  taxableAmount: number, ruleVersion: TaxRuleVersion
): { taxAmount: number; rate: number; ruleVersionId: string } {
  const rule = ruleVersion.rules[0]
  if (!rule) return { taxAmount: 0, rate: 0, ruleVersionId: ruleVersion.versionId }
  const raw = taxableAmount * rule.rate
  // Apply rounding rule from config
  const taxAmount = rule.roundingMethod === 'FLOOR'
    ? Math.floor(raw * 100) / 100
    : Math.round(raw * 100) / 100
  return { taxAmount, rate: rule.rate, ruleVersionId: ruleVersion.versionId }
}

// ─── MOCK DATA ────────────────────────────────────────────────

const fmtN = (v: number) => Math.round(v * 100) / 100

export const mockTaxProfile: TaxProfile = {
  id:'TPRO-001', driverId:'DR-00001234', jurisdiction:'CA-QC',
  businessStatus:'SELF_EMPLOYED', taxRegistrationStatus:'REGISTERED',
  registrationReference:null, effectiveFrom:'2025-03-01', effectiveTo:null, status:'ACTIVE',
}

export const mockTaxRegistrations: TaxRegistration[] = [
  { id:'TREG-001', driverId:'DR-00001234', jurisdiction:'CA-QC', taxType:'TPS', maskedReference:'••••••••1234FE0001', verificationStatus:'VERIFIED', effectiveFrom:'2025-03-01', effectiveTo:null, status:'REGISTERED' },
  { id:'TREG-002', driverId:'DR-00001234', jurisdiction:'CA-QC', taxType:'TVQ', maskedReference:'••••••••1234TQ0001', verificationStatus:'VERIFIED', effectiveFrom:'2025-03-01', effectiveTo:null, status:'REGISTERED' },
]

// Tax calculations for current period (derived from ledger)
const taxableBase = fmtN(42.50 + 35.00 + 28.40 + 33.20 + 18.90 + 15.20)  // confirmed entries
const tpsRule = ACTIVE_TAX_RULE_VERSIONS[0]
const tvqRule = ACTIVE_TAX_RULE_VERSIONS[1]
const tpsCalc = calculateTaxFromRules(taxableBase, tpsRule)
const tvqCalc = calculateTaxFromRules(taxableBase, tvqRule)

export const mockTaxCalculations: TaxCalculation[] = [
  { calcId:'TC-001', eventId:'EVT-REV-001', transactionId:'REV-001', driverId:'DR-00001234', jurisdiction:'CA-QC', ruleVersionId:'TRV-QC-TPS-2026', taxType:'TPS', taxableAmount:42.50, rate:0.05, taxAmount:2.13, roundingApplied:0, calculatedAt:'2026-08-24T14:01:30Z', isEstimate:true },
  { calcId:'TC-002', eventId:'EVT-REV-001', transactionId:'REV-001', driverId:'DR-00001234', jurisdiction:'CA-QC', ruleVersionId:'TRV-QC-TVQ-2026', taxType:'TVQ', taxableAmount:42.50, rate:0.09975, taxAmount:4.24, roundingApplied:0, calculatedAt:'2026-08-24T14:01:30Z', isEstimate:true },
  { calcId:'TC-003', eventId:'EVT-REV-002', transactionId:'REV-002', driverId:'DR-00001234', jurisdiction:'CA-QC', ruleVersionId:'TRV-QC-TPS-2026', taxType:'TPS', taxableAmount:35.00, rate:0.05, taxAmount:1.75, roundingApplied:0, calculatedAt:'2026-08-24T11:35:30Z', isEstimate:true },
]

export const mockTaxSnapshots: TaxCalculationSnapshot[] = [
  { snapshotId:'SNAP-TAX-001', transactionId:'REV-001', taxRuleVersion:'TRV-QC-TPS-2026,TRV-QC-TVQ-2026', taxableAmount:42.50, tpsAmount:2.13, tvqAmount:4.24, totalTax:6.37, timestamp:'2026-08-24T14:01:30Z' },
  { snapshotId:'SNAP-TAX-002', transactionId:'REV-002', taxRuleVersion:'TRV-QC-TPS-2026,TRV-QC-TVQ-2026', taxableAmount:35.00, tpsAmount:1.75, tvqAmount:3.49, totalTax:5.24, timestamp:'2026-08-24T11:35:30Z' },
]

export const mockTaxPeriods: TaxPeriod[] = [
  { periodId:'PER-Q1-2026', driverId:'DR-00001234', jurisdiction:'CA-QC', periodType:'QUARTERLY', periodStart:'2026-01-01', periodEnd:'2026-03-31', status:'FINALIZED', taxTypes:['TPS','TVQ'] },
  { periodId:'PER-Q2-2026', driverId:'DR-00001234', jurisdiction:'CA-QC', periodType:'QUARTERLY', periodStart:'2026-04-01', periodEnd:'2026-06-30', status:'FINALIZED', taxTypes:['TPS','TVQ'] },
  { periodId:'PER-Q3-2026', driverId:'DR-00001234', jurisdiction:'CA-QC', periodType:'QUARTERLY', periodStart:'2026-07-01', periodEnd:'2026-09-30', status:'REVIEW', taxTypes:['TPS','TVQ'] },
  { periodId:'PER-Q4-2026', driverId:'DR-00001234', jurisdiction:'CA-QC', periodType:'QUARTERLY', periodStart:'2026-10-01', periodEnd:'2026-12-31', status:'OPEN', taxTypes:['TPS','TVQ'] },
]

export const mockTaxReports: TaxReport[] = [
  {
    reportId:'RPT-TPS-Q1-2026', driverId:'DR-00001234', jurisdiction:'CA-QC',
    periodStart:'2026-01-01', periodEnd:'2026-03-31', ruleVersionId:'TRV-QC-TPS-2026',
    grossRevenue:8200, taxableRevenue:7380, nonTaxableRevenue:0, exemptRevenue:820,
    fees:1240, adjustments:180, refunds:45,
    tpsCollected:369, tvqCollected:736.13, otherTax:0, totalTax:fmtN(369+736.13),
    taxiGross:3200, rideshareGross:3100, deliveryGross:1900, cashGross:820,
    status:'FINALIZED', isEstimate:true, generatedAt:'2026-04-15T09:00:00Z',
    finalizedAt:'2026-04-20T14:00:00Z', submissionStatus:'NOT_SUBMITTED',
    submissionMethod:'MANUAL_EXPORT', submissionReference:null,
    note:'ESTIMATION · FINALIZED — soumission manuelle via Revenu Québec / ARC. Aucune API officielle connectée.',
  },
  {
    reportId:'RPT-TPS-Q2-2026', driverId:'DR-00001234', jurisdiction:'CA-QC',
    periodStart:'2026-04-01', periodEnd:'2026-06-30', ruleVersionId:'TRV-QC-TPS-2026',
    grossRevenue:10910, taxableRevenue:9820, nonTaxableRevenue:0, exemptRevenue:1090,
    fees:1640, adjustments:240, refunds:60,
    tpsCollected:491, tvqCollected:979.85, otherTax:0, totalTax:fmtN(491+979.85),
    taxiGross:4100, rideshareGross:3800, deliveryGross:3010, cashGross:1090,
    status:'FINALIZED', isEstimate:true, generatedAt:'2026-07-12T09:00:00Z',
    finalizedAt:'2026-07-18T10:00:00Z', submissionStatus:'NOT_SUBMITTED',
    submissionMethod:'MANUAL_EXPORT', submissionReference:null,
    note:'ESTIMATION · FINALIZED · V2 (amendé — ajust. Uber +60$). Soumission manuelle requise.',
  },
  {
    reportId:'RPT-TPS-Q3-2026', driverId:'DR-00001234', jurisdiction:'CA-QC',
    periodStart:'2026-07-01', periodEnd:'2026-09-30', ruleVersionId:'TRV-QC-TPS-2026',
    grossRevenue:fmtN(tpsCalc.taxAmount + 173.20 + taxableBase), taxableRevenue:taxableBase,
    nonTaxableRevenue:0, exemptRevenue:0,
    fees:fmtN(6.20+7.10+2.50+2.00+1.80), adjustments:2.50, refunds:10.00,
    tpsCollected:fmtN(tpsCalc.taxAmount), tvqCollected:fmtN(tvqCalc.taxAmount), otherTax:0,
    totalTax:fmtN(tpsCalc.taxAmount + tvqCalc.taxAmount),
    taxiGross:fmtN(42.50+35.00), rideshareGross:fmtN(28.40+33.20), deliveryGross:fmtN(18.90+15.20+14.50), cashGross:35.00,
    status:'REVIEW', isEstimate:true, generatedAt:'2026-08-25T09:00:00Z',
    finalizedAt:null, submissionStatus:'NOT_SUBMITTED',
    submissionMethod:'MANUAL_EXPORT', submissionReference:null,
    note:'ESTIMATION · EN RÉVISION — T3 incomplet (septembre non terminé). Pas de déclaration officielle.',
  },
]

export const mockAmendments: TaxReportAmendment[] = [
  {
    amendmentId:'AMD-001', originalReportId:'RPT-TPS-Q2-2026', driverId:'DR-00001234',
    reason:'Ajustement revenu Uber Q2 — +60$ reçu après génération initiale',
    oldValues:{ grossRevenue:10850, taxableRevenue:9760, tpsCollected:488, totalTax:1467.85 },
    newValues:{ grossRevenue:10910, taxableRevenue:9820, tpsCollected:491, totalTax:1470.85 },
    createdBy:'DR-00001234', approvedBy:'SYSTEM', createdAt:'2026-07-15T10:00:00Z', status:'APPLIED',
  },
]

export const mockAnomalies: TaxAnomaly[] = [
  { anomalyId:'ANO-TAX-001', driverId:'DR-00001234', type:'TAX_MISMATCH', description:'DoorDash DD-PENDING-001: TPS non calculée — transaction en attente de finalisation', affectedAmount:0.73, reportId:'RPT-TPS-Q3-2026', status:'REVIEW_REQUIRED', detectedAt:'2026-08-25T09:01:00Z' },
  { anomalyId:'ANO-TAX-002', driverId:'DR-00001234', type:'MISSING_TAX', description:'3 transactions Uber sans snapshot fiscal — recalcul requis', affectedAmount:3.21, reportId:'RPT-TPS-Q3-2026', status:'OPEN', detectedAt:'2026-08-25T09:02:00Z' },
]

export const mockAnnualSummary: AnnualTaxSummary = {
  year:2026, driverId:'DR-00001234', jurisdiction:'CA-QC',
  totalGrossRevenue:fmtN(8200+10910+taxableBase),
  totalTaxableRevenue:fmtN(7380+9820+taxableBase),
  totalFees:fmtN(1240+1640+(6.20+7.10+2.50+2.00+1.80)),
  totalRefunds:fmtN(45+60+10), totalAdjustments:fmtN(180+240+2.50),
  tpsCollected:fmtN(369+491+tpsCalc.taxAmount),
  tvqCollected:fmtN(736.13+979.85+tvqCalc.taxAmount),
  totalTax:fmtN(369+491+tpsCalc.taxAmount + 736.13+979.85+tvqCalc.taxAmount),
  totalExpenses:934.53, businessExpenses:890.71,
  totalBusinessKm:4005, totalPersonalKm:680, totalVehicleKm:4685,
  byProvider:{
    Taxi:{ gross:fmtN(3200+4100+42.50+35), fees:0, net:fmtN(3200+4100+42.50+35) },
    Uber:{ gross:fmtN(3100+3800+28.40+33.20), fees:fmtN(620+760+6.20+7.10), net:fmtN(3100+3800+28.40+33.20-620-760-6.20-7.10) },
    DoorDash:{ gross:fmtN(1900+3010+18.90+15.20+14.50), fees:fmtN(285+451.5+2.50+2.00+1.80), net:fmtN(1900+3010+18.90+15.20+14.50-285-451.5-2.50-2.00-1.80) },
  },
  byService:{ taxi:fmtN(3200+4100+42.50+35), rideshare:fmtN(3100+3800+28.40+33.20), delivery:fmtN(1900+3010+18.90+15.20+14.50), cash:fmtN(820+1090+35) },
  isEstimate:true,
  note:'ESTIMATION annuelle — T3/T4 incomplets. Pas une déclaration officielle.',
}

export const mockSubmissions: TaxSubmission[] = [
  {
    submissionId:'SUB-001', reportId:'RPT-TPS-Q1-2026', driverId:'DR-00001234',
    jurisdiction:'CA-QC', method:'MANUAL_EXPORT', status:'NOT_SUBMITTED',
    submittedAt:null, reference:null,
    note:'Soumission manuelle — aucune API gouvernementale officielle connectée. Exporter le rapport et soumettre via Revenu Québec / ARC.',
  },
]

// ─── HELPERS ──────────────────────────────────────────────────

export const fmt = (v: number) => new Intl.NumberFormat('fr-CA', { style:'currency', currency:'CAD' }).format(v)

export const PERIOD_STATUS_CONF: Record<TaxPeriodStatus, { icon: string; color: string; label: string }> = {
  OPEN:        { icon:'○',  color:'text-slate-500',  label:'Ouvert' },
  CALCULATING: { icon:'⚙️', color:'text-blue-400',   label:'Calcul...' },
  REVIEW:      { icon:'⚠️', color:'text-amber-400',  label:'En révision' },
  FINALIZED:   { icon:'🔒', color:'text-purple-400', label:'Finalisé' },
  AMENDED:     { icon:'📋', color:'text-amber-400',  label:'Amendé' },
}

export const REPORT_STATUS_CONF: Record<TaxReportStatus, { icon: string; color: string; bg: string; label: string }> = {
  DRAFT:       { icon:'📝', color:'text-slate-400',  bg:'bg-slate-700/30',   label:'Brouillon' },
  CALCULATING: { icon:'⚙️', color:'text-blue-400',   bg:'bg-blue-500/10',    label:'Calcul...' },
  READY:       { icon:'✅', color:'text-green-400',  bg:'bg-green-500/10',   label:'Prêt' },
  REVIEW:      { icon:'⚠️', color:'text-amber-400',  bg:'bg-amber-500/10',   label:'Révision' },
  FINALIZED:   { icon:'🔒', color:'text-purple-400', bg:'bg-purple-500/10',  label:'Finalisé' },
  AMENDED:     { icon:'📋', color:'text-amber-400',  bg:'bg-amber-500/10',   label:'Amendé' },
  CANCELLED:   { icon:'🚫', color:'text-slate-500',  bg:'bg-slate-700/20',   label:'Annulé' },
}

export const SUBMISSION_STATUS_CONF: Record<TaxSubmissionStatus, { color: string; label: string }> = {
  NOT_SUBMITTED: { color:'text-slate-500', label:'Non soumis' },
  READY:         { color:'text-green-400', label:'Prêt' },
  SUBMITTED:     { color:'text-blue-400',  label:'Soumis' },
  ACCEPTED:      { color:'text-green-400', label:'Accepté' },
  REJECTED:      { color:'text-red-400',   label:'Rejeté' },
  PENDING:       { color:'text-amber-400', label:'En attente' },
  ERROR:         { color:'text-red-400',   label:'Erreur' },
}

// ============================================================
// ÉTAPE 27 EXTENSIONS
// Tax Exemption · Adjustment · Deadline · Provider Summary
// Government Connectors (MOCK_ONLY) · Jurisdiction Engine
// Rounding · MileageRecord · ExpenseTax · ProviderTaxSummary
// ============================================================

// ─── TAX EXEMPTION ───────────────────────────────────────────

export interface TaxExemption {
  id: string
  jurisdiction: Jurisdiction
  taxType: TaxType
  category: string
  reason: string
  effectiveFrom: string
  effectiveTo: string | null
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING'
}

// ─── TAX ADJUSTMENT ───────────────────────────────────────────

export interface TaxAdjustment {
  id: string
  reportId: string
  driverId: string
  adjustmentType: 'CORRECTION' | 'REFUND' | 'CREDIT' | 'DEBIT' | 'RECLASSIFICATION'
  oldValue: number
  newValue: number
  difference: number
  reason: string
  createdBy: string
  approvedBy: string | null
  createdAt: string
  // Never modifies historical calculation silently
}

// ─── TAX DEADLINE ────────────────────────────────────────────

export interface TaxDeadline {
  id: string
  jurisdiction: Jurisdiction
  taxType: TaxType
  period: string
  dueDate: string
  status: 'UPCOMING' | 'DUE_SOON' | 'OVERDUE' | 'FILED' | 'EXTENDED'
  daysRemaining: number
  // Source: official regulation — never invented
  sourceNote: string
}

// ─── PROVIDER TAX SUMMARY ────────────────────────────────────

export interface ProviderTaxSummary {
  provider: string
  driverId: string
  period: string
  grossAmount: number
  fees: number
  adjustments: number
  taxableAmount: number  // gross - fees + adjustments; actual taxability per Tax Engine
  estimatedTax: number   // ESTIMATE — Tax Engine applies configured rules
  currency: 'CAD'
  note: string           // Always: "estimation — taxabilité déterminée par Tax Engine"
}

// ─── ROUNDING ────────────────────────────────────────────────

export type RoundingMethod = 'ROUND_HALF_UP' | 'ROUND_HALF_DOWN' | 'TRUNCATE' | 'BANKER'

export function applyRounding(value: number, method: RoundingMethod = 'ROUND_HALF_UP', decimals = 2): number {
  const factor = Math.pow(10, decimals)
  switch (method) {
    case 'ROUND_HALF_UP': return Math.round(value * factor) / factor
    case 'ROUND_HALF_DOWN': return Math.floor(value * factor + 0.5) / factor
    case 'TRUNCATE': return Math.trunc(value * factor) / factor
    case 'BANKER': {
      const r = value * factor
      const f = Math.floor(r)
      const diff = r - f
      if (diff > 0.5) return (f + 1) / factor
      if (diff < 0.5) return f / factor
      return (f % 2 === 0 ? f : f + 1) / factor
    }
    default: return Math.round(value * factor) / factor
  }
}

// ─── EXPENSE TAX ─────────────────────────────────────────────

export interface ExpenseTax {
  expenseId: string
  taxType: TaxType
  taxAmount: number
  isRecoverable: boolean    // Configurable per jurisdiction — never auto-assumed
  recoveredAmount: number
  note: string
}

// ─── MILEAGE RECORD ──────────────────────────────────────────

export interface MileageRecord {
  id: string
  driverId: string
  vehicleId: string
  date: string
  totalKm: number
  businessKm: number
  personalKm: number
  taxiKm: number; rideshareKm: number; deliveryKm: number
  source: 'GPS' | 'MANUAL' | 'ODOMETER'
  businessPct: number
  note: string | null
}

// ─── GOVERNMENT TAX CONNECTORS (MOCK) ────────────────────────

export type ConnectorMode = 'MOCK' | 'SANDBOX' | 'MANUAL_EXPORT' | 'API_PRODUCTION'

export interface GovernmentTaxConnector {
  jurisdiction: Jurisdiction
  taxType: TaxType
  mode: ConnectorMode       // MOCK until official API/authorization
  validate(data: unknown): Promise<{ valid: boolean; errors: string[] }>
  prepare(reportId: string): Promise<{ ready: boolean; method: ConnectorMode }>
  submit(reportId: string): Promise<{ status: TaxSubmissionStatus; reference: string | null }>
  getStatus(submissionId: string): Promise<TaxSubmissionStatus>
}

// Quebec connector — MOCK ONLY (no official API available)
export const QuebecTaxConnector: GovernmentTaxConnector = {
  jurisdiction: 'CA-QC', taxType: 'TVQ', mode: 'MANUAL_EXPORT',
  async validate() { return { valid: false, errors: ['Aucune API Revenu Québec officielle disponible — MANUAL_EXPORT uniquement'] } },
  async prepare() { return { ready: true, method: 'MANUAL_EXPORT' } },
  async submit() { return { status: 'NOT_SUBMITTED', reference: null } },
  async getStatus() { return 'NOT_SUBMITTED' },
}

// Federal connector — MOCK ONLY
export const FederalTaxConnector: GovernmentTaxConnector = {
  jurisdiction: 'CA-FED', taxType: 'TPS', mode: 'MANUAL_EXPORT',
  async validate() { return { valid: false, errors: ['Aucune API ARC officielle disponible — MANUAL_EXPORT uniquement'] } },
  async prepare() { return { ready: true, method: 'MANUAL_EXPORT' } },
  async submit() { return { status: 'NOT_SUBMITTED', reference: null } },
  async getStatus() { return 'NOT_SUBMITTED' },
}

// ─── MOCK DEADLINES ──────────────────────────────────────────

export const mockTaxDeadlines: TaxDeadline[] = [
  { id:'DL-001', jurisdiction:'CA-QC', taxType:'TVQ', period:'2026-Q3', dueDate:'2026-10-31', status:'UPCOMING', daysRemaining:65, sourceNote:'Revenu Québec — déclaration TVQ trimestrielle' },
  { id:'DL-002', jurisdiction:'CA-FED', taxType:'TPS', period:'2026-Q3', dueDate:'2026-10-31', status:'UPCOMING', daysRemaining:65, sourceNote:'ARC — déclaration TPS trimestrielle' },
  { id:'DL-003', jurisdiction:'CA-QC', taxType:'TVQ', period:'2026-Q2', dueDate:'2026-07-31', status:'FILED', daysRemaining:-27, sourceNote:'Revenu Québec' },
]

export const mockProviderTaxSummaries: ProviderTaxSummary[] = [
  { provider:'Uber', driverId:'DR-00001234', period:'2026-08', grossAmount:61.60, fees:13.30, adjustments:2.50, taxableAmount:50.80, estimatedTax:7.55, currency:'CAD', note:'Estimation — taxabilité déterminée par Tax Engine selon règles CA-QC' },
  { provider:'DoorDash', driverId:'DR-00001234', period:'2026-08', grossAmount:48.60, fees:6.30, adjustments:2.00, taxableAmount:44.30, estimatedTax:6.58, currency:'CAD', note:'Estimation — taxabilité déterminée par Tax Engine selon règles CA-QC' },
  { provider:'Taxi', driverId:'DR-00001234', period:'2026-08', grossAmount:77.50, fees:0, adjustments:0, taxableAmount:77.50, estimatedTax:11.53, currency:'CAD', note:'Estimation — taxabilité déterminée par Tax Engine selon règles CA-QC' },
]

export const mockMileageRecord: MileageRecord = {
  id:'ML-2026-08', driverId:'DR-00001234', vehicleId:'V-QC-001234', date:'2026-08-24',
  totalKm:4685, businessKm:4005, personalKm:680,
  taxiKm:1245, rideshareKm:1840, deliveryKm:920,
  source:'GPS', businessPct:85.5, note:'Données GPS agrégées — privacy-first',
}

export const mockTaxAdjustment: TaxAdjustment = {
  id:'ADJ-001', reportId:'RPT-TPS-Q2', driverId:'DR-00001234',
  adjustmentType:'CORRECTION', oldValue:488, newValue:491, difference:3,
  reason:'Ajustement revenu Uber Q2 +60$ — correction manuelle via amendement',
  createdBy:'DR-00001234', approvedBy:'ADMIN-GOV-001', createdAt:'2026-07-18T10:00:00Z',
}
