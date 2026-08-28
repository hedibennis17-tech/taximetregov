// ============================================================
// TAXIMÈTRE.GOV — TAX ENGINE EXTENSION
// Phase 2 — Step 27: Jurisdiction · Connectors · Annual Summary
// ============================================================
//
// RÈGLES ABSOLUES:
// 1. Taux fiscaux JAMAIS hardcodés — config versionnée uniquement
// 2. Rapport FINALIZED = immuable → TaxReportAmendment requis
// 3. Anomalie ≠ fraude → REVIEW_REQUIRED uniquement
// 4. NAS/SIN: jamais clé primaire · jamais affiché en clair
// 5. Cash ≠ non déclaré (méthode paiement, pas absence de revenu)
// 6. Gross ≠ Net ≠ Taxable — toujours séparés
// 7. MANUAL_EXPORT si aucune API gouvernementale officielle
// 8. Transaction historique: règle fiscale lockée à la date de création
// 9. DELIVERY: taximeterUsed=false toujours
// ============================================================

import type { Jurisdiction, TaxType } from './tax.engine'

// ─── JURISDICTION ENGINE ──────────────────────────────────────

export interface JurisdictionConfig {
  code: Jurisdiction
  label: string
  currency: 'CAD' | 'USD' | 'EUR' | 'OTHER'
  taxes: { type: TaxType; label: string; federalOrProvincial: 'FEDERAL' | 'PROVINCIAL' | 'STATE' | 'LOCAL' }[]
  reportingFrequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
  roundingMethod: 'HALF_UP' | 'HALF_DOWN' | 'BANKER'
  connectorStatus: 'MOCK' | 'SANDBOX' | 'LIVE' | 'MANUAL_EXPORT'
}

export const JURISDICTION_CONFIGS: Record<string, JurisdictionConfig> = {
  'CA-QC': {
    code: 'CA-QC', label: 'Québec, Canada', currency: 'CAD',
    taxes: [
      { type: 'TPS', label: 'Taxe sur les produits et services', federalOrProvincial: 'FEDERAL' },
      { type: 'TVQ', label: 'Taxe de vente du Québec', federalOrProvincial: 'PROVINCIAL' },
    ],
    reportingFrequency: 'QUARTERLY', roundingMethod: 'HALF_UP',
    connectorStatus: 'MANUAL_EXPORT',  // No live API — always honest
  },
  'CA-ON': {
    code: 'CA-ON', label: 'Ontario, Canada', currency: 'CAD',
    taxes: [{ type: 'HST', label: 'Harmonized Sales Tax', federalOrProvincial: 'PROVINCIAL' }],
    reportingFrequency: 'QUARTERLY', roundingMethod: 'HALF_UP',
    connectorStatus: 'MANUAL_EXPORT',
  },
  'CA-FED': {
    code: 'CA-FED', label: 'Canada (fédéral)', currency: 'CAD',
    taxes: [{ type: 'GST', label: 'Goods and Services Tax', federalOrProvincial: 'FEDERAL' }],
    reportingFrequency: 'QUARTERLY', roundingMethod: 'HALF_UP',
    connectorStatus: 'MANUAL_EXPORT',
  },
}

// ─── GOVERNMENT TAX CONNECTOR ─────────────────────────────────
// Abstract interface — DO NOT claim live integration without official authorization

export interface GovernmentTaxConnector {
  jurisdiction: Jurisdiction
  status: 'MOCK' | 'SANDBOX' | 'LIVE' | 'MANUAL_EXPORT'
  validate(reportId: string): Promise<{ valid: boolean; errors: string[] }>
  prepare(reportId: string): Promise<{ packageId: string; status: string }>
  submit(packageId: string): Promise<{ submissionId: string | null; status: string }>
  getStatus(submissionId: string): Promise<{ status: string; reference: string | null }>
}

// Quebec connector — MOCK/MANUAL_EXPORT until official API authorization
export class QuebecTaxConnectorMock implements GovernmentTaxConnector {
  jurisdiction: Jurisdiction = 'CA-QC'
  status: 'MOCK' = 'MOCK'

  async validate(reportId: string) {
    return { valid: true, errors: [] }
  }
  async prepare(reportId: string) {
    return { packageId: `PKG-MOCK-${reportId}`, status: 'MANUAL_EXPORT' }
  }
  async submit(packageId: string) {
    // NEVER create fake submission — always MANUAL_EXPORT in pilot mode
    return {
      submissionId: null,
      status: 'MANUAL_EXPORT — Aucune API gouvernementale officielle connectée. Exportez et soumettez manuellement via Revenu Québec.',
    }
  }
  async getStatus(submissionId: string) {
    return { status: 'MANUAL_EXPORT', reference: null }
  }
}

export class FederalTaxConnectorMock implements GovernmentTaxConnector {
  jurisdiction: Jurisdiction = 'CA-FED'
  status: 'MOCK' = 'MOCK'

  async validate(reportId: string) { return { valid: true, errors: [] } }
  async prepare(reportId: string) { return { packageId: `PKG-FED-MOCK-${reportId}`, status: 'MANUAL_EXPORT' } }
  async submit(packageId: string) {
    return { submissionId: null, status: 'MANUAL_EXPORT — Soumettez manuellement via ARC / CRA.' }
  }
  async getStatus(submissionId: string) { return { status: 'MANUAL_EXPORT', reference: null } }
}

// ─── TAX EXEMPTION ────────────────────────────────────────────

export interface TaxExemption {
  id: string
  jurisdiction: Jurisdiction
  taxType: TaxType
  category: string
  reason: string
  effectiveFrom: string
  effectiveTo: string | null
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED'
}

// ─── EXPENSE TAX ──────────────────────────────────────────────

export interface ExpenseTax {
  expenseId: string
  taxType: TaxType
  taxAmount: number
  isRecoverable: boolean           // Configurable per jurisdiction — never assumed
  deductibilityStatus: 'UNKNOWN' | 'POTENTIALLY_DEDUCTIBLE' | 'NOT_DEDUCTIBLE' | 'REVIEW_REQUIRED'
  note: string                     // Always: disclaimer that official rules apply
}

// ─── MILEAGE RECORD ───────────────────────────────────────────

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
  notes: string | null
}

// ─── TAX DEADLINE ─────────────────────────────────────────────

export interface TaxDeadline {
  id: string
  jurisdiction: Jurisdiction
  taxType: TaxType
  period: string
  dueDate: string
  status: 'UPCOMING' | 'DUE_SOON' | 'OVERDUE' | 'COMPLETED'
  daysUntilDue: number
  note: string                     // Never claim official deadline without sourced rule
}

// ─── EXPORT JOB ───────────────────────────────────────────────

export interface ExportJob {
  id: string
  driverId: string
  reportId: string
  format: 'PDF' | 'CSV' | 'JSON'
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED'
  fileReference: string | null     // Signed temp URL — never public permanent
  createdAt: string
  expiresAt: string | null
}

// ─── PROVIDER TAX SUMMARY ─────────────────────────────────────

export interface ProviderTaxSummary {
  provider: string
  period: string
  grossAmount: number
  fees: number
  adjustments: number
  tips: number
  taxableAmount: number            // NOT automatically = net — determined by Tax Engine
  tpsAmount: number
  tvqAmount: number
  totalTax: number
  netToDriver: number
  transactionCount: number
}

// ─── ANNUAL TAX SUMMARY ───────────────────────────────────────

export interface AnnualTaxSummary {
  driverId: string
  year: number
  jurisdiction: Jurisdiction

  // Revenue
  taxiGross: number; rideshareGross: number; deliveryGross: number
  cashGross: number; totalGross: number

  // Tax breakdown
  totalTaxable: number
  totalNonTaxable: number
  totalTpsCollected: number
  totalTvqCollected: number
  totalTaxCollected: number

  // Deductions (always marked as NOT confirmed without official review)
  totalExpenses: number
  totalMileageKm: number
  businessMileageKm: number

  // Refunds & adjustments
  totalRefunds: number
  totalAdjustments: number

  // Provider breakdown
  byProvider: ProviderTaxSummary[]

  // Metadata
  rulesVersionUsed: string
  isEstimate: boolean              // ALWAYS true until official filing
  note: string                     // Mandatory disclaimer
}

// ─── TAX REVIEW CASE ──────────────────────────────────────────

export interface TaxReviewCase {
  id: string
  driverId: string
  reportId: string | null
  anomalyId: string | null
  status: 'OPEN' | 'ASSIGNED' | 'UNDER_REVIEW' | 'RESOLVED' | 'ESCALATED' | 'CLOSED'
  assignedTo: string | null
  reason: string
  resolution: string | null
  createdAt: string
  resolvedAt: string | null
}

// ─── TAX DOCUMENT ─────────────────────────────────────────────

export interface TaxDocument {
  id: string
  driverId: string
  docType: 'TAX_REPORT' | 'REVENUE_STATEMENT' | 'PROVIDER_STATEMENT' | 'EXPENSE_REPORT' | 'MILEAGE_REPORT' | 'RECEIPT' | 'AMENDMENT'
  label: string
  period: string
  format: 'PDF' | 'CSV' | 'JSON'
  status: 'DRAFT' | 'FINAL' | 'SUPERSEDED'
  storageReferenceMasked: string   // Signed temp URL — never permanent public URL
  createdAt: string
  expiresAt: string | null
}

// ─── TAX REPORT ACCESS EVENT ──────────────────────────────────

export interface TaxReportAccessEvent {
  id: string
  reportId: string
  driverId: string
  action: 'VIEW' | 'EXPORT' | 'DOWNLOAD' | 'GENERATE' | 'AMEND' | 'FINALIZE'
  actor: string
  actorRole: 'DRIVER' | 'REVIEWER' | 'ADMIN' | 'AUDITOR' | 'SYSTEM'
  timestamp: string
}

// ─── MOCK DATA ────────────────────────────────────────────────

const fmtN = (v: number) => Math.round(v * 100) / 100

export const mockJurisdiction = JURISDICTION_CONFIGS['CA-QC']

export const mockTaxDeadlines: TaxDeadline[] = [
  { id:'DL-001', jurisdiction:'CA-QC', taxType:'TPS', period:'2026-Q3', dueDate:'2026-10-31', status:'UPCOMING', daysUntilDue:65, note:'Échéance indicative basée sur les règles TPS QC — vérifier auprès de l\'ARC' },
  { id:'DL-002', jurisdiction:'CA-QC', taxType:'TVQ', period:'2026-Q3', dueDate:'2026-10-31', status:'UPCOMING', daysUntilDue:65, note:'Échéance indicative basée sur les règles TVQ — vérifier auprès de RQ' },
  { id:'DL-003', jurisdiction:'CA-QC', taxType:'TPS', period:'2026-Q2', dueDate:'2026-07-31', status:'COMPLETED', daysUntilDue:-27, note:'T2 2026 — exporté manuellement (mode pilote)' },
]

export const mockProviderTaxSummaries: ProviderTaxSummary[] = [
  { provider:'TAXIMETER', period:'2026-Q3', grossAmount:620.00, fees:0, adjustments:0, tips:80.00, taxableAmount:620.00, tpsAmount:31.00, tvqAmount:61.85, totalTax:92.85, netToDriver:620.00, transactionCount:18 },
  { provider:'Uber', period:'2026-Q3', grossAmount:1450.00, fees:290.00, adjustments:45.00, tips:120.00, taxableAmount:1450.00, tpsAmount:72.50, tvqAmount:144.64, totalTax:217.14, netToDriver:fmtN(1450-290+45+120), transactionCount:42 },
  { provider:'Lyft', period:'2026-Q3', grossAmount:840.00, fees:168.00, adjustments:20.00, tips:60.00, taxableAmount:840.00, tpsAmount:42.00, tvqAmount:83.79, totalTax:125.79, netToDriver:fmtN(840-168+20+60), transactionCount:25 },
  { provider:'DoorDash', period:'2026-Q3', grossAmount:520.00, fees:65.00, adjustments:15.00, tips:48.00, taxableAmount:520.00, tpsAmount:26.00, tvqAmount:51.87, totalTax:77.87, netToDriver:fmtN(520-65+15+48), transactionCount:31 },
  { provider:'Instacart', period:'2026-Q3', grossAmount:310.00, fees:38.75, adjustments:0, tips:25.00, taxableAmount:310.00, tpsAmount:15.50, tvqAmount:30.92, totalTax:46.42, netToDriver:fmtN(310-38.75+25), transactionCount:19 },
]

export const mockAnnualSummary: AnnualTaxSummary = {
  driverId: 'DR-00001234', year: 2026, jurisdiction: 'CA-QC',
  taxiGross: 8200, rideshareGross: 10910, deliveryGross: 5280,
  cashGross: 1640, totalGross: fmtN(8200+10910+5280),
  totalTaxable: fmtN(8200+10910+5280), totalNonTaxable: 0,
  totalTpsCollected: fmtN(24390 * 0.05),
  totalTvqCollected: fmtN(24390 * 0.09975),
  totalTaxCollected: fmtN(24390 * 0.14975),
  totalExpenses: 4210.50, totalMileageKm: 42850, businessMileageKm: 38560,
  totalRefunds: 485.00, totalAdjustments: 320.50,
  byProvider: mockProviderTaxSummaries,
  rulesVersionUsed: 'TPS-v1.0.0/TVQ-v1.0.0',
  isEstimate: true,  // ALWAYS true until official filing
  note: 'ESTIMATION — Ces données sont préparées par Taximètre.GOV. Elles ne constituent pas une déclaration officielle. Consultez un comptable ou soumettez directement via Revenu Québec / ARC.',
}

export const mockMileageRecord: MileageRecord = {
  id: 'MLG-2026-Q3', driverId: 'DR-00001234', vehicleId: 'V-QC-001234',
  date: '2026-08-24', totalKm: 4685, businessKm: 4005, personalKm: 680,
  taxiKm: 1245, rideshareKm: 1840, deliveryKm: 920, source: 'GPS',
  notes: '680km personnels confirmés par chauffeur · GPS agrégé (privacy-first)',
}

export const mockTaxDocuments: TaxDocument[] = [
  { id:'TDOC-001', driverId:'DR-00001234', docType:'TAX_REPORT', label:'Rapport TPS Q1 2026', period:'2026-Q1', format:'PDF', status:'FINAL', storageReferenceMasked:'ref://tax/signed/tps-q1-••••', createdAt:'2026-04-15T09:00:00Z', expiresAt:'2026-05-15T09:00:00Z' },
  { id:'TDOC-002', driverId:'DR-00001234', docType:'TAX_REPORT', label:'Rapport TVQ Q1 2026', period:'2026-Q1', format:'PDF', status:'FINAL', storageReferenceMasked:'ref://tax/signed/tvq-q1-••••', createdAt:'2026-04-15T09:00:00Z', expiresAt:'2026-05-15T09:00:00Z' },
  { id:'TDOC-003', driverId:'DR-00001234', docType:'EXPENSE_REPORT', label:'Rapport dépenses T1 2026', period:'2026-Q1', format:'CSV', status:'DRAFT', storageReferenceMasked:'ref://tax/signed/exp-q1-••••', createdAt:'2026-04-20T09:00:00Z', expiresAt:null },
  { id:'TDOC-004', driverId:'DR-00001234', docType:'MILEAGE_REPORT', label:'Kilométrage 2026', period:'2026-ANNUAL', format:'CSV', status:'DRAFT', storageReferenceMasked:'ref://tax/signed/mlg-2026-••••', createdAt:'2026-08-01T09:00:00Z', expiresAt:null },
]

export const mockTaxReviewCases: TaxReviewCase[] = [
  { id:'TRC-001', driverId:'DR-00001234', reportId:'RPT-TPS-Q1', anomalyId:null, status:'RESOLVED', assignedTo:'REVIEWER-001', reason:'Vérification données Uber — décalage 3.00$', resolution:'Ajustement confirmé — différence de timing webhook', createdAt:'2026-04-16T09:00:00Z', resolvedAt:'2026-04-18T14:00:00Z' },
]

export const mockAccessEvents: TaxReportAccessEvent[] = [
  { id:'TAE-001', reportId:'RPT-TPS-Q1', driverId:'DR-00001234', action:'GENERATE', actor:'SYSTEM', actorRole:'SYSTEM', timestamp:'2026-04-15T09:00:00Z' },
  { id:'TAE-002', reportId:'RPT-TPS-Q1', driverId:'DR-00001234', action:'VIEW', actor:'DR-00001234', actorRole:'DRIVER', timestamp:'2026-04-15T10:00:00Z' },
  { id:'TAE-003', reportId:'RPT-TPS-Q1', driverId:'DR-00001234', action:'FINALIZE', actor:'DR-00001234', actorRole:'DRIVER', timestamp:'2026-04-20T14:00:00Z' },
  { id:'TAE-004', reportId:'RPT-TPS-Q1', driverId:'DR-00001234', action:'EXPORT', actor:'DR-00001234', actorRole:'DRIVER', timestamp:'2026-04-20T14:01:00Z' },
]

// ─── HELPERS ─────────────────────────────────────────────────

export const fmt = (v: number) => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(v)

export const CONNECTOR_STATUS_CONF = {
  MOCK:          { color: 'text-slate-500', label: 'Mode test', icon: '🧪' },
  SANDBOX:       { color: 'text-blue-400',  label: 'Sandbox',   icon: '🔵' },
  LIVE:          { color: 'text-green-400', label: 'Officiel',  icon: '🟢' },
  MANUAL_EXPORT: { color: 'text-amber-400', label: 'Export manuel', icon: '📤' },
}

export const PROVIDER_ICONS_TAX: Record<string, string> = {
  TAXIMETER: '🚕', Uber: '⬛', Lyft: '🩷', DoorDash: '🔴', Instacart: '🥕',
}
