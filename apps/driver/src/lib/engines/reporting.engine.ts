// ============================================================
// TAXIMÈTRE.GOV — TAX REPORTING ENGINE
// Phase 2 — Step 22: Tax Reporting & Declaration Preparation
// ============================================================
//
// RÈGLES ABSOLUES:
// 1. SUBMITTED uniquement après véritable transmission officielle (API réelle)
// 2. Jamais inventer des taux, seuils ou formulaires
// 3. Jamais fausse connexion à Revenu Québec ou l'ARC
// 4. Conserver toutes les versions — jamais supprimer l'historique
// 5. Estimation ≠ déclaration officielle (disclaimer permanent)
// 6. Report LOCKED → modification uniquement via AMENDMENT
// 7. Chaque montant traceable jusqu'à la transaction source
// ============================================================

// ─── TYPES ───────────────────────────────────────────────────

export type ReportType =
  | 'REVENUE_REPORT' | 'EXPENSE_REPORT' | 'MILEAGE_REPORT'
  | 'TAX_REPORT' | 'PROVIDER_REPORT' | 'RECONCILIATION_REPORT'
  | 'ANNUAL_INCOME_REPORT' | 'FISCAL_PACKAGE'

export type ReportStatus =
  | 'DRAFT' | 'CALCULATING' | 'READY' | 'REVIEW_REQUIRED'
  | 'LOCKED' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'AMENDED' | 'CANCELLED'

export type DataQuality = 'GOOD' | 'WARNING' | 'INCOMPLETE' | 'ERROR'

export type DeductionStatus =
  | 'UNKNOWN' | 'POTENTIAL' | 'REVIEW_REQUIRED' | 'APPROVED_BY_RULE' | 'NOT_ELIGIBLE'

export type ValidationIssue =
  | 'MISSING_TRANSACTIONS' | 'DUPLICATE_TRANSACTION' | 'UNMATCHED_PROVIDER'
  | 'UNVERIFIED_TAX_PROFILE' | 'MISSING_DOCUMENTS' | 'INCOMPLETE_EXPENSES'
  | 'MILEAGE_GAP' | 'RECONCILIATION_MISMATCH' | 'UNKNOWN_TAX_TREATMENT'
  | 'CURRENCY_INCONSISTENCY'

// ─── REPORT VALIDATION ────────────────────────────────────────

export interface ReportValidationResult {
  status: 'READY' | 'READY_WITH_WARNINGS' | 'REVIEW_REQUIRED' | 'BLOCKED'
  issues: { type: ValidationIssue; severity: 'ERROR' | 'WARNING' | 'INFO'; message: string }[]
  completenessScore: number         // 0-100 — data completeness, NOT a tax score
  dataQuality: DataQuality
  transactionsOk: boolean
  reconciliationOk: boolean
  taxProfileOk: boolean
  documentsOk: boolean
  expensesOk: boolean
  mileageOk: boolean
}

export interface CompletenessScore {
  overall: number
  transactions: number
  documents: number
  expenses: number
  mileage: number
  taxProfile: number
  note: string   // Always: "score de complétude des données, pas un score fiscal"
}

// ─── REVENUE REPORT ───────────────────────────────────────────

export interface RevenueReport {
  reportId: string
  driverId: string
  period: string
  generatedAt: string
  status: ReportStatus
  version: number

  // By source — always traceable to original transactions
  taxi: number; rideshare: number; delivery: number
  taxiTips: number; rideshareTips: number; deliveryTips: number
  taxiFees: number; rideshareFees: number; deliveryFees: number
  adjustments: number; refunds: number

  // Aggregated
  grossRevenue: number
  totalTips: number
  totalFees: number
  netRevenue: number

  // Tax classification — from TaxRuleEngine, never hardcoded
  taxableRevenue: number
  nonTaxableRevenue: number
  unknownTreatment: number   // requires manual review

  // Provider breakdown
  byProvider: Record<string, number>

  dataQuality: DataQuality
  warnings: string[]
}

// ─── TAX REPORT ───────────────────────────────────────────────

export interface TaxReport {
  reportId: string
  driverId: string
  jurisdiction: 'CA-QC' | 'CA-FED' | 'OTHER'
  taxType: 'TPS' | 'TVQ' | 'INCOME' | 'OTHER'
  periodStart: string
  periodEnd: string
  ruleVersion: string              // Which TaxRuleVersion was applied
  version: number                  // Report version — never delete old versions

  grossRevenue: number
  taxableRevenue: number
  taxAmount: number
  adjustments: number
  refunds: number
  netTaxAmount: number

  status: ReportStatus
  isEstimate: boolean              // ALWAYS true until official submission
  generatedAt: string
  generatedBy: string
  lockedAt: string | null
  submittedAt: string | null       // ONLY after real official transmission
  submissionReference: string | null  // Never fabricate

  dataQuality: DataQuality
  warnings: string[]
  note: string   // Always contains: "ESTIMATION — pas une déclaration officielle"
}

// ─── EXPENSE REPORT ───────────────────────────────────────────

export interface ExpenseReport {
  reportId: string
  driverId: string
  period: string
  version: number
  status: ReportStatus

  byCategory: Record<string, { total: number; businessPortion: number; taxAmount: number }>
  totalExpenses: number
  totalBusinessPortion: number
  totalPersonalPortion: number

  // DeductionCandidates — NEVER auto-approved
  deductionCandidates: { category: string; amount: number; status: DeductionStatus }[]

  dataQuality: DataQuality
  note: string   // Always: "Déductibilité non confirmée — Tax Engine et règles officielles applicables"
}

// ─── MILEAGE REPORT ───────────────────────────────────────────

export interface MileageReport {
  reportId: string
  driverId: string
  vehicleId: string
  period: string
  version: number
  status: ReportStatus

  taxiKm: number; rideshareKm: number; deliveryKm: number
  otherBusinessKm: number; personalKm: number
  totalBusinessKm: number; totalVehicleKm: number
  businessUsePercent: number

  dataQuality: DataQuality
  note: string   // "Répartition km — traitement fiscal déterminé par Tax Engine"
}

// ─── FISCAL PACKAGE ───────────────────────────────────────────

export interface FiscalPackage {
  packageId: string
  driverId: string
  period: string
  generatedAt: string
  status: ReportStatus
  version: number

  revenueReportId: string | null
  expenseReportId: string | null
  mileageReportId: string | null
  taxReportIds: string[]
  documentIds: string[]
  reconciliationStatus: 'MATCHED' | 'MISMATCH' | 'PARTIAL' | 'REVIEW_REQUIRED'

  completenessScore: CompletenessScore
  dataQuality: DataQuality
  reportHash: string               // Integrity: detect post-generation modification
  attestationTimestamp: string | null
  isEstimate: boolean
}

// ─── REPORT AMENDMENT ─────────────────────────────────────────

export interface TaxReportAmendment {
  amendmentId: string
  originalReportId: string
  driverId: string
  reason: string
  changedFields: string[]
  oldValues: Record<string, number | string>
  newValues: Record<string, number | string>
  createdBy: string
  createdAt: string
  status: 'DRAFT' | 'APPLIED' | 'REJECTED'
}

// ─── REPORT AUDIT ─────────────────────────────────────────────

export interface ReportAuditEvent {
  auditId: string
  reportId: string
  driverId: string
  action: 'REPORT_CREATED' | 'REPORT_CALCULATED' | 'REPORT_REVIEWED' | 'REPORT_APPROVED'
    | 'REPORT_REJECTED' | 'REPORT_LOCKED' | 'REPORT_AMENDED' | 'REPORT_EXPORTED'
    | 'REPORT_SUBMITTED'
  actor: string
  actorRole: 'DRIVER' | 'ADMIN' | 'REVIEWER' | 'AUDITOR' | 'SYSTEM'
  timestamp: string
  details: string | null
}

// ─── PROVIDER RECONCILIATION ──────────────────────────────────

export interface ReconciliationRecord {
  provider: string
  providerCount: number
  internalCount: number
  providerTotal: number
  internalTotal: number
  difference: number
  status: 'MATCHED' | 'MISMATCH' | 'MISSING' | 'REVIEW_REQUIRED'
  duplicatesDetected: number
}

// ─── FISCAL CALENDAR ──────────────────────────────────────────

export interface FiscalCalendarEntry {
  period: string
  label: string
  taxType: 'TPS' | 'TVQ' | 'INCOME' | 'ALL'
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'READY' | 'LOCKED' | 'SUBMITTED'
  completenessScore: number
  warnings: number
  note: string   // Never claim official deadline unless sourced from official rule
}

// ─── MOCK DATA ────────────────────────────────────────────────

const fmtN = (v: number) => Math.round(v * 100) / 100

export const mockValidation: ReportValidationResult = {
  status: 'READY_WITH_WARNINGS',
  issues: [
    { type:'MISSING_DOCUMENTS', severity:'WARNING', message:'2 reçus manquants pour les dépenses de carburant (EXP-003, EXP-009)' },
    { type:'UNMATCHED_PROVIDER', severity:'WARNING', message:'DoorDash: 1 transaction non réconciliée (DD-PENDING-001)' },
    { type:'UNKNOWN_TAX_TREATMENT', severity:'INFO', message:'8 transactions en attente de classification fiscale finale' },
  ],
  completenessScore: 92,
  dataQuality: 'WARNING',
  transactionsOk: true,
  reconciliationOk: false,
  taxProfileOk: true,
  documentsOk: false,
  expensesOk: true,
  mileageOk: true,
}

export const mockRevenueReport: RevenueReport = {
  reportId:'RPT-REV-001', driverId:'DR-00001234', period:'2026-08',
  generatedAt:'2026-08-24T20:00:00Z', status:'READY', version:1,
  taxi:135.50, rideshare:87.30, delivery:48.60,
  taxiTips:16.00, rideshareTips:7.00, deliveryTips:7.50,
  taxiFees:0, rideshareFees:19.90, deliveryFees:6.30,
  adjustments:4.50, refunds:0,
  grossRevenue:fmtN(135.50+87.30+48.60), totalTips:fmtN(16+7+7.50),
  totalFees:fmtN(0+19.90+6.30), netRevenue:fmtN(271.40+30.50-26.20+4.50),
  taxableRevenue:250.80, nonTaxableRevenue:0, unknownTreatment:20.60,
  byProvider: { 'TAXI':151.50, 'Uber':74.40, 'DoorDash':48.30 },
  dataQuality:'WARNING',
  warnings:['DD-PENDING-001 non finalisée — montant estimé inclus'],
}

export const mockTaxReports: TaxReport[] = [
  {
    reportId:'RPT-TPS-Q1', driverId:'DR-00001234', jurisdiction:'CA-QC', taxType:'TPS',
    periodStart:'2026-01-01', periodEnd:'2026-03-31', ruleVersion:'TPS-v1.0.0', version:1,
    grossRevenue:8200, taxableRevenue:7380, taxAmount:369, adjustments:45, refunds:20,
    netTaxAmount:fmtN(369+45-20),
    status:'READY', isEstimate:true, generatedAt:'2026-04-15T09:00:00Z',
    generatedBy:'SYSTEM', lockedAt:null, submittedAt:null, submissionReference:null,
    dataQuality:'GOOD', warnings:[],
    note:'ESTIMATION — Prêt pour soumission manuelle à l\'ARC. Taximètre.GOV ne transmet pas directement.',
  },
  {
    reportId:'RPT-TVQ-Q1', driverId:'DR-00001234', jurisdiction:'CA-QC', taxType:'TVQ',
    periodStart:'2026-01-01', periodEnd:'2026-03-31', ruleVersion:'TVQ-v1.0.0', version:1,
    grossRevenue:8200, taxableRevenue:7380, taxAmount:736.13, adjustments:45, refunds:20,
    netTaxAmount:fmtN(736.13+45-20),
    status:'READY', isEstimate:true, generatedAt:'2026-04-15T09:00:00Z',
    generatedBy:'SYSTEM', lockedAt:null, submittedAt:null, submissionReference:null,
    dataQuality:'GOOD', warnings:[],
    note:'ESTIMATION — Prêt pour soumission manuelle à Revenu Québec. Taximètre.GOV ne transmet pas directement.',
  },
  {
    reportId:'RPT-TPS-Q2', driverId:'DR-00001234', jurisdiction:'CA-QC', taxType:'TPS',
    periodStart:'2026-04-01', periodEnd:'2026-06-30', ruleVersion:'TPS-v1.0.0', version:2,
    grossRevenue:10910, taxableRevenue:9820, taxAmount:491, adjustments:60, refunds:15,
    netTaxAmount:fmtN(491+60-15),
    status:'LOCKED', isEstimate:true, generatedAt:'2026-07-12T09:00:00Z',
    generatedBy:'SYSTEM', lockedAt:'2026-07-20T14:00:00Z', submittedAt:null, submissionReference:null,
    dataQuality:'GOOD', warnings:['Version 2 — corrigé depuis V1 (ajustement Uber +60$)'],
    note:'ESTIMATION · LOCKED — modification via AMENDMENT uniquement. Non soumis officiellement.',
  },
]

export const mockExpenseReport: ExpenseReport = {
  reportId:'RPT-EXP-001', driverId:'DR-00001234', period:'2026-08', version:1,
  status:'READY',
  byCategory: {
    FUEL: { total:218.18, businessPortion:196.36, taxAmount:32.73 },
    VEHICLE_MAINTENANCE: { total:212.69, businessPortion:212.69, taxAmount:27.69 },
    VEHICLE_INSURANCE: { total:320.00, businessPortion:320.00, taxAmount:0 },
    PARKING: { total:20.70, businessPortion:20.70, taxAmount:2.70 },
    TOLLS: { total:14.375, businessPortion:13.66, taxAmount:1.875 },
    PHONE: { total:103.46, businessPortion:82.77, taxAmount:13.47 },
    SOFTWARE: { total:28.73, businessPortion:28.73, taxAmount:3.73 },
    SUPPLIES: { total:16.38, businessPortion:16.38, taxAmount:2.13 },
  },
  totalExpenses: fmtN(218.18+212.69+320+20.70+14.375+103.46+28.73+16.38),
  totalBusinessPortion: fmtN(196.36+212.69+320+20.70+13.66+82.77+28.73+16.38),
  totalPersonalPortion: fmtN(218.18-196.36 + 103.46-82.77 + 14.375-13.66),
  deductionCandidates: [
    { category:'FUEL', amount:196.36, status:'REVIEW_REQUIRED' },
    { category:'VEHICLE_MAINTENANCE', amount:212.69, status:'REVIEW_REQUIRED' },
    { category:'VEHICLE_INSURANCE', amount:320.00, status:'REVIEW_REQUIRED' },
    { category:'PHONE', amount:82.77, status:'REVIEW_REQUIRED' },
  ],
  dataQuality:'WARNING',
  note:'Déductibilité non confirmée — le Tax Engine et les règles officielles applicables déterminent le traitement. Consultez un comptable ou les directives de Revenu Québec / ARC.',
}

export const mockMileageReport: MileageReport = {
  reportId:'RPT-ML-001', driverId:'DR-00001234', vehicleId:'V-QC-001234',
  period:'2026-08', version:1, status:'READY',
  taxiKm:1245, rideshareKm:1840, deliveryKm:920, otherBusinessKm:0,
  personalKm:680, totalBusinessKm:4005, totalVehicleKm:4685,
  businessUsePercent:fmtN(4005/4685*100),
  dataQuality:'WARNING',
  note:'Répartition kilométrique informative. Le traitement fiscal est déterminé par le Tax Engine selon les règles applicables.',
}

export const mockReconciliation: ReconciliationRecord[] = [
  { provider:'TAXI', providerCount:3, internalCount:3, providerTotal:135.50, internalTotal:135.50, difference:0, status:'MATCHED', duplicatesDetected:0 },
  { provider:'Uber', providerCount:3, internalCount:3, providerTotal:87.30, internalTotal:87.30, difference:0, status:'MATCHED', duplicatesDetected:0 },
  { provider:'DoorDash', providerCount:3, internalCount:2, providerTotal:48.60, internalTotal:34.10, difference:14.50, status:'MISMATCH', duplicatesDetected:0 },
]

export const mockFiscalCalendar: FiscalCalendarEntry[] = [
  { period:'2026-Q1', label:'T1 — Jan/Fév/Mar 2026', taxType:'ALL', status:'READY', completenessScore:98, warnings:0, note:'Données complètes — préparation manuelle vers ARC/RQ recommandée' },
  { period:'2026-Q2', label:'T2 — Avr/Mai/Jun 2026', taxType:'ALL', status:'LOCKED', completenessScore:100, warnings:1, note:'LOCKED — V2 (amendé). Non soumis officiellement.' },
  { period:'2026-Q3', label:'T3 — Jul/Aoû/Sep 2026', taxType:'ALL', status:'IN_PROGRESS', completenessScore:72, warnings:3, note:'En cours — T3 incomplet (Sep 2026 non terminé)' },
  { period:'2026-Q4', label:'T4 — Oct/Nov/Déc 2026', taxType:'ALL', status:'NOT_STARTED', completenessScore:0, warnings:0, note:'Pas encore commencé' },
  { period:'2026-ANNUAL', label:'Annuel 2026', taxType:'INCOME', status:'NOT_STARTED', completenessScore:55, warnings:4, note:'Rapport annuel — données partielles disponibles' },
]

export const mockFiscalPackage: FiscalPackage = {
  packageId:'PKG-2026-Q1', driverId:'DR-00001234', period:'2026-Q1',
  generatedAt:'2026-04-15T09:00:00Z', status:'READY', version:1,
  revenueReportId:'RPT-REV-001', expenseReportId:'RPT-EXP-001',
  mileageReportId:'RPT-ML-001', taxReportIds:['RPT-TPS-Q1','RPT-TVQ-Q1'],
  documentIds:['doc-001','doc-002','doc-003'],
  reconciliationStatus:'REVIEW_REQUIRED',
  completenessScore: { overall:92, transactions:100, documents:85, expenses:90, mileage:95, taxProfile:100, note:'Score de complétude des données — pas un score fiscal' },
  dataQuality:'WARNING',
  reportHash:'sha256-abc123def456...',
  attestationTimestamp:null,
  isEstimate:true,
}

export const mockAmendments: TaxReportAmendment[] = [
  {
    amendmentId:'AMEND-001', originalReportId:'RPT-TPS-Q2', driverId:'DR-00001234',
    reason:'Correction revenu Uber — ajustement +60$ reçu après génération initiale',
    changedFields:['grossRevenue','taxableRevenue','taxAmount','netTaxAmount'],
    oldValues:{ grossRevenue:10850, taxableRevenue:9760, taxAmount:488, netTaxAmount:533 },
    newValues:{ grossRevenue:10910, taxableRevenue:9820, taxAmount:491, netTaxAmount:536 },
    createdBy:'DR-00001234', createdAt:'2026-07-18T10:00:00Z', status:'APPLIED',
  },
]

export const mockReportAudit: ReportAuditEvent[] = [
  { auditId:'RAUD-001', reportId:'RPT-TPS-Q1', driverId:'DR-00001234', action:'REPORT_CREATED', actor:'SYSTEM', actorRole:'SYSTEM', timestamp:'2026-04-15T09:00:00Z', details:'Génération automatique fin Q1' },
  { auditId:'RAUD-002', reportId:'RPT-TPS-Q1', driverId:'DR-00001234', action:'REPORT_CALCULATED', actor:'SYSTEM', actorRole:'SYSTEM', timestamp:'2026-04-15T09:01:00Z', details:'TaxRuleEngine: TPS-v1.0.0 · Taux 5%' },
  { auditId:'RAUD-003', reportId:'RPT-TPS-Q2', driverId:'DR-00001234', action:'REPORT_AMENDED', actor:'DR-00001234', actorRole:'DRIVER', timestamp:'2026-07-18T10:00:00Z', details:'AMEND-001: +60$ revenu Uber' },
  { auditId:'RAUD-004', reportId:'RPT-TPS-Q2', driverId:'DR-00001234', action:'REPORT_LOCKED', actor:'DR-00001234', actorRole:'DRIVER', timestamp:'2026-07-20T14:00:00Z', details:'Chauffeur confirme — V2 verrouillé' },
]

// ─── HELPERS ──────────────────────────────────────────────────

export const fmt = (v: number) => new Intl.NumberFormat('fr-CA', { style:'currency', currency:'CAD' }).format(v)

export const REPORT_STATUS_CONF: Record<ReportStatus, { color: string; bg: string; icon: string; label: string }> = {
  DRAFT:            { color:'text-slate-400',  bg:'bg-slate-700/30',     icon:'📝', label:'Brouillon' },
  CALCULATING:      { color:'text-blue-400',   bg:'bg-blue-500/10',      icon:'⚙️', label:'Calcul...' },
  READY:            { color:'text-green-400',  bg:'bg-green-500/10',     icon:'✅', label:'Prêt' },
  REVIEW_REQUIRED:  { color:'text-amber-400',  bg:'bg-amber-500/10',     icon:'⚠️', label:'À réviser' },
  LOCKED:           { color:'text-purple-400', bg:'bg-purple-500/10',    icon:'🔒', label:'Verrouillé' },
  SUBMITTED:        { color:'text-blue-400',   bg:'bg-blue-500/10',      icon:'📤', label:'Soumis' },
  ACCEPTED:         { color:'text-green-400',  bg:'bg-green-500/15',     icon:'✓',  label:'Accepté' },
  REJECTED:         { color:'text-red-400',    bg:'bg-red-500/10',       icon:'❌', label:'Rejeté' },
  AMENDED:          { color:'text-amber-400',  bg:'bg-amber-500/10',     icon:'📋', label:'Amendé' },
  CANCELLED:        { color:'text-slate-500',  bg:'bg-slate-700/20',     icon:'🚫', label:'Annulé' },
}
