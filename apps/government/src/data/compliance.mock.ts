// ============================================================
// TAXIMÈTRE.GOV — STEP 5 MOCK DATA (DEMO / SIMULATION)
// Government Compliance & Revenue Control Center
// ============================================================

export type ComplianceSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type CaseStatus = 'OPEN' | 'ASSIGNED' | 'IN_REVIEW' | 'WAITING_INFORMATION' | 'RESOLVED' | 'CLOSED'
export type AnomalyType = 'REVENUE_MISMATCH' | 'DUPLICATE_TRANSACTION' | 'MISSING_TRANSACTION' | 'IMPOSSIBLE_ADJUSTMENT' | 'UNUSUAL_INACTIVITY' | 'TAX_INCONSISTENCY' | 'METER_ERROR'
export type TaxPeriodStatus = 'OPEN' | 'READY' | 'FILED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'ADJUSTED' | 'CLOSED'
export type DeclarationStatus = 'DRAFT' | 'SUBMITTED' | 'RECEIVED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'AMENDED'
export type DocumentStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
export type GovernmentRole = 'SUPER_ADMIN' | 'TAX_ADMIN' | 'COMPLIANCE_OFFICER' | 'AUDITOR' | 'SUPPORT_AGENT' | 'ANALYST' | 'SYSTEM_ADMIN'

// ─── CONTROL CENTER KPIs ──────────────────────────────────────
export const controlCenterKpis = {
  registeredWorkers: 124842,
  activeToday: 38421,
  transactionsToday: 1284392,
  reportedRevenue: 42840392,
  taxableRevenue: 38221903,
  tps: 1911095,
  tvq: 3812774,
  openComplianceCases: 12,
  pendingDocuments: 8,
  webhookErrors: 32,
  reconciliationIssues: 4,
  pendingDeclarations: 147,
  expiredLicenses: 23,
}

// ─── JURISDICTION CONFIG ──────────────────────────────────────
export const jurisdictions = [
  { id: 'QC-CA', name: 'Québec, Canada', country: 'Canada', province: 'Québec', tpsRate: 0.05, tvqRate: 0.09975, registrationThreshold: 30000, active: true },
  { id: 'ON-CA', name: 'Ontario, Canada', country: 'Canada', province: 'Ontario', tpsRate: 0.05, tvqRate: 0, hstRate: 0.13, registrationThreshold: 30000, active: false },
]

// ─── TAX RULE SETS (versioned) ────────────────────────────────
export const taxRuleSets = [
  { id: 'trs-001', jurisdiction: 'QC-CA', taxType: 'TPS', rate: 0.05, effectiveFrom: '2023-01-01', effectiveUntil: null, version: '2023-v1', status: 'ACTIVE' },
  { id: 'trs-002', jurisdiction: 'QC-CA', taxType: 'TVQ', rate: 0.09975, effectiveFrom: '2012-01-01', effectiveUntil: null, version: '2012-v1', status: 'ACTIVE' },
  { id: 'trs-003', jurisdiction: 'QC-CA', taxType: 'TPS', rate: 0.06, effectiveFrom: '2006-01-01', effectiveUntil: '2008-12-31', version: '2006-v1', status: 'HISTORICAL' },
]

// ─── TAX PERIODS ─────────────────────────────────────────────
export interface TaxPeriod {
  id: string; jurisdiction: string; driverId: string; driverName: string
  startDate: string; endDate: string; periodLabel: string
  status: TaxPeriodStatus; filingStatus: string
  revenue: number; taxableRevenue: number
  taxCollected: number; taxRemitted: number; balance: number
  tps: number; tvq: number
  createdAt: string; updatedAt: string
}

export const mockTaxPeriods: TaxPeriod[] = [
  { id:'tp-001', jurisdiction:'QC-CA', driverId:'TG-000001', driverName:'Mohammed Benali', startDate:'2026-07-01', endDate:'2026-09-30', periodLabel:'Q3 2026', status:'OPEN', filingStatus:'PENDING', revenue:19260, taxableRevenue:17334, taxCollected:2594, taxRemitted:0, balance:2594, tps:867, tvq:1727, createdAt:'2026-07-01T00:00:00Z', updatedAt:'2026-08-24T15:00:00Z' },
  { id:'tp-002', jurisdiction:'QC-CA', driverId:'TG-000001', driverName:'Mohammed Benali', startDate:'2026-04-01', endDate:'2026-06-30', periodLabel:'Q2 2026', status:'FILED', filingStatus:'SUBMITTED', revenue:18420, taxableRevenue:16578, taxCollected:2483, taxRemitted:2483, balance:0, tps:829, tvq:1654, createdAt:'2026-04-01T00:00:00Z', updatedAt:'2026-07-15T10:00:00Z' },
  { id:'tp-003', jurisdiction:'QC-CA', driverId:'TG-000009', driverName:'Carlos Rodriguez', startDate:'2026-07-01', endDate:'2026-09-30', periodLabel:'Q3 2026', status:'OPEN', filingStatus:'PENDING', revenue:27360, taxableRevenue:24624, taxCollected:3686, taxRemitted:0, balance:3686, tps:1231, tvq:2455, createdAt:'2026-07-01T00:00:00Z', updatedAt:'2026-08-24T15:00:00Z' },
  { id:'tp-004', jurisdiction:'QC-CA', driverId:'TG-000002', driverName:'Sophie Tremblay', startDate:'2026-07-01', endDate:'2026-09-30', periodLabel:'Q3 2026', status:'UNDER_REVIEW', filingStatus:'SUBMITTED', revenue:11520, taxableRevenue:10368, taxCollected:1552, taxRemitted:1300, balance:252, tps:518, tvq:1034, createdAt:'2026-07-01T00:00:00Z', updatedAt:'2026-08-20T09:00:00Z' },
  { id:'tp-005', jurisdiction:'QC-CA', driverId:'TG-000003', driverName:'Jean-Pierre Côté', startDate:'2026-01-01', endDate:'2026-12-31', periodLabel:'Annual 2026', status:'OPEN', filingStatus:'IN_PROGRESS', revenue:62520, taxableRevenue:56268, taxCollected:8424, taxRemitted:4200, balance:4224, tps:2813, tvq:5611, createdAt:'2026-01-01T00:00:00Z', updatedAt:'2026-08-24T15:00:00Z' },
]

// ─── COMPLIANCE CASES ─────────────────────────────────────────
export interface ComplianceCase {
  id: string; caseId: string; driverId: string; driverName: string
  severity: ComplianceSeverity; anomalyType: AnomalyType; reason: string
  source: string; status: CaseStatus; assignedTo?: string
  providerAmount?: number; ledgerAmount?: number; difference?: number
  period: string; createdAt: string; updatedAt: string
  resolution?: string; auditReference: string; riskScore: number
}

export const mockComplianceCases: ComplianceCase[] = [
  { id:'cc-001', caseId:'CASE-2026-0001', driverId:'TG-000002', driverName:'Sophie Tremblay', severity:'HIGH', anomalyType:'REVENUE_MISMATCH', reason:'Revenus plateforme DoorDash supérieurs aux revenus déclarés — Écart significatif détecté', source:'DoorDash', status:'ASSIGNED', assignedTo:'Agent Martin', providerAmount:11520, ledgerAmount:9200, difference:2320, period:'Q3 2026', createdAt:'2026-08-20T08:00:00Z', updatedAt:'2026-08-24T10:00:00Z', auditReference:'CORR-2026-0820-CC001', riskScore:72 },
  { id:'cc-002', caseId:'CASE-2026-0002', driverId:'TG-000004', driverName:'Fatima El-Amrani', severity:'CRITICAL', anomalyType:'MISSING_TRANSACTION', reason:'Chauffeur suspendu : 3 transactions Uber détectées après date de suspension', source:'Uber', status:'IN_REVIEW', assignedTo:'Superviseur Legault', providerAmount:380, ledgerAmount:0, difference:380, period:'Août 2026', createdAt:'2026-08-15T12:00:00Z', updatedAt:'2026-08-24T09:00:00Z', auditReference:'CORR-2026-0815-CC002', riskScore:91 },
  { id:'cc-003', caseId:'CASE-2026-0003', driverId:'TG-000009', driverName:'Carlos Rodriguez', severity:'MEDIUM', anomalyType:'TAX_INCONSISTENCY', reason:'Taxes déclarées inférieures aux taxes calculées par le Tax Engine — Période Q2 2026', source:'Tax Engine', status:'OPEN', providerAmount:0, ledgerAmount:0, difference:420, period:'Q2 2026', createdAt:'2026-08-22T14:00:00Z', updatedAt:'2026-08-22T14:00:00Z', auditReference:'CORR-2026-0822-CC003', riskScore:55 },
  { id:'cc-004', caseId:'CASE-2026-0004', driverId:'TG-000010', driverName:'Nathalie Laroche', severity:'HIGH', anomalyType:'UNUSUAL_INACTIVITY', reason:'Aucune activité depuis 45 jours — Comptes plateformes toujours connectés', source:'System', status:'WAITING_INFORMATION', assignedTo:'Agent Dubois', period:'Juillet-Août 2026', createdAt:'2026-08-19T09:00:00Z', updatedAt:'2026-08-23T11:00:00Z', auditReference:'CORR-2026-0819-CC004', riskScore:48 },
  { id:'cc-005', caseId:'CASE-2026-0005', driverId:'TG-000008', driverName:'Lucie Gagné', severity:'MEDIUM', anomalyType:'MISSING_TRANSACTION', reason:'Session taximètre sans transaction correspondante dans le ledger', source:'Taxi Meter', status:'OPEN', providerAmount:42.5, ledgerAmount:0, difference:42.5, period:'Août 2026', createdAt:'2026-08-24T07:30:00Z', updatedAt:'2026-08-24T07:30:00Z', auditReference:'CORR-2026-0824-CC005', riskScore:38 },
  { id:'cc-006', caseId:'CASE-2026-0006', driverId:'TG-000005', driverName:'Alex Nguyen', severity:'LOW', anomalyType:'IMPOSSIBLE_ADJUSTMENT', reason:'Ajustement Instacart dépasse le montant de la transaction originale', source:'Instacart', status:'RESOLVED', assignedTo:'Agent Martin', providerAmount:28.5, ledgerAmount:28.5, difference:35, period:'Août 2026', createdAt:'2026-08-18T10:00:00Z', updatedAt:'2026-08-23T16:00:00Z', resolution:'Ajustement erroné corrigé par DoorDash. Ledger réconcilié.', auditReference:'CORR-2026-0818-CC006', riskScore:22 },
]

// ─── ANOMALY SIGNALS ──────────────────────────────────────────
export const anomalySignals = [
  { id:'an-001', driverId:'TG-000002', type:'REVENUE_MISMATCH', label:'Écart revenus DoorDash vs Ledger', severity:'HIGH' as ComplianceSeverity, detail:'Plateforme: 11,520$ · Ledger: 9,200$ · Écart: 2,320$', riskScore:72, detectedAt:'2026-08-20T08:00:00Z' },
  { id:'an-002', driverId:'TG-000004', type:'MISSING_TRANSACTION', label:'Transaction post-suspension détectée', severity:'CRITICAL' as ComplianceSeverity, detail:'3 courses Uber enregistrées après suspension du chauffeur', riskScore:91, detectedAt:'2026-08-15T12:00:00Z' },
  { id:'an-003', driverId:'TG-000009', type:'TAX_INCONSISTENCY', label:'Écart fiscal Q2 2026', severity:'MEDIUM' as ComplianceSeverity, detail:'Taxes déclarées: 2,063$ · Taxes calculées: 2,483$ · Écart: 420$', riskScore:55, detectedAt:'2026-08-22T14:00:00Z' },
  { id:'an-004', driverId:'TG-000007', type:'UNUSUAL_INACTIVITY', label:'Inactivité prolongée', severity:'LOW' as ComplianceSeverity, detail:'Aucune transaction depuis 18 jours malgré comptes actifs', riskScore:31, detectedAt:'2026-08-20T09:00:00Z' },
  { id:'an-005', driverId:'TG-000008', type:'METER_ERROR', label:'Session taximètre sans transaction', severity:'MEDIUM' as ComplianceSeverity, detail:'Session METER-QC-00008231 fermée sans transaction dans le ledger', riskScore:45, detectedAt:'2026-08-24T07:30:00Z' },
]

// ─── DECLARATIONS ─────────────────────────────────────────────
export interface Declaration {
  id: string; period: string; driverId: string; driverName: string
  jurisdiction: string; revenue: number; taxableRevenue: number
  tps: number; tvq: number; totalTax: number; status: DeclarationStatus
  submittedAt?: string; reviewedAt?: string; reviewedBy?: string
  notes?: string
}

export const mockDeclarations: Declaration[] = [
  { id:'dec-001', period:'Q2 2026', driverId:'TG-000001', driverName:'Mohammed Benali', jurisdiction:'QC-CA', revenue:18420, taxableRevenue:16578, tps:829, tvq:1654, totalTax:2483, status:'ACCEPTED', submittedAt:'2026-07-15T10:00:00Z', reviewedAt:'2026-07-20T14:00:00Z', reviewedBy:'Tax Admin' },
  { id:'dec-002', period:'Q2 2026', driverId:'TG-000002', driverName:'Sophie Tremblay', jurisdiction:'QC-CA', revenue:11520, taxableRevenue:10368, tps:518, tvq:1034, totalTax:1552, status:'UNDER_REVIEW', submittedAt:'2026-07-14T09:00:00Z', notes:'Écart détecté — En cours de vérification' },
  { id:'dec-003', period:'Q2 2026', driverId:'TG-000009', driverName:'Carlos Rodriguez', jurisdiction:'QC-CA', revenue:27360, taxableRevenue:24624, tps:1231, tvq:2455, totalTax:3686, status:'ACCEPTED', submittedAt:'2026-07-12T11:00:00Z', reviewedAt:'2026-07-18T10:00:00Z', reviewedBy:'Tax Admin' },
  { id:'dec-004', period:'Q1 2026', driverId:'TG-000003', driverName:'Jean-Pierre Côté', jurisdiction:'QC-CA', revenue:15630, taxableRevenue:14067, tps:703, tvq:1402, totalTax:2105, status:'ACCEPTED', submittedAt:'2026-04-14T08:00:00Z', reviewedAt:'2026-04-22T09:00:00Z', reviewedBy:'Tax Admin' },
  { id:'dec-005', period:'Q3 2026', driverId:'TG-000005', driverName:'Alex Nguyen', jurisdiction:'QC-CA', revenue:23550, taxableRevenue:21195, tps:1060, tvq:2114, totalTax:3174, status:'DRAFT' },
]

// ─── GOVERNMENT NOTICES ───────────────────────────────────────
export const mockNotices = [
  { id:'not-001', driverId:'TG-000002', type:'DOCUMENT_REQUEST', title:'Document manquant — Assurance véhicule', message:'Votre police d\'assurance véhicule est expirée depuis le 2026-08-01. Veuillez téléverser le document à jour avant le 2026-09-15.', deadline:'2026-09-15', createdAt:'2026-08-24T09:00:00Z', read:false, severity:'HIGH' as ComplianceSeverity },
  { id:'not-002', driverId:'TG-000004', type:'SUSPENSION_NOTICE', title:'Suspension de compte — Raison administrative', message:'Votre compte a été suspendu. Toute activité sur les plateformes partenaires a été notifiée. Contactez le bureau de conformité.', deadline:null, createdAt:'2026-08-15T10:00:00Z', read:true, severity:'CRITICAL' as ComplianceSeverity },
  { id:'not-003', driverId:'TG-000009', type:'TAX_REVIEW', title:'Révision fiscale — Q2 2026', message:'Un écart a été identifié dans votre déclaration de revenus du Q2 2026. Une information supplémentaire est requise.', deadline:'2026-09-01', createdAt:'2026-08-22T14:00:00Z', read:false, severity:'MEDIUM' as ComplianceSeverity },
]

// ─── DOCUMENT REQUESTS ────────────────────────────────────────
export const mockDocumentRequests = [
  { id:'dr-001', driverId:'TG-000002', driverName:'Sophie Tremblay', type:'Insurance', title:'Police d\'assurance véhicule', status:'PENDING' as DocumentStatus, deadline:'2026-09-15', requestedAt:'2026-08-24T09:00:00Z', reviewedAt:null, reason:null },
  { id:'dr-002', driverId:'TG-000007', driverName:'Reza Ahmadi', type:'License', title:'Permis de conduire — Copie certifiée', status:'PENDING' as DocumentStatus, deadline:'2026-09-01', requestedAt:'2026-08-20T10:00:00Z', reviewedAt:null, reason:null },
  { id:'dr-003', driverId:'TG-000004', driverName:'Fatima El-Amrani', type:'Tax Document', title:'Déclaration fiscale 2025', status:'UNDER_REVIEW' as DocumentStatus, deadline:'2026-08-30', requestedAt:'2026-08-15T10:00:00Z', reviewedAt:null, reason:null },
  { id:'dr-004', driverId:'TG-000010', driverName:'Nathalie Laroche', type:'Insurance', title:'Assurance responsabilité civile', status:'EXPIRED' as DocumentStatus, deadline:'2026-08-01', requestedAt:'2026-07-15T09:00:00Z', reviewedAt:null, reason:'Délai dépassé' },
]

// ─── RECONCILIATION ───────────────────────────────────────────
export const mockReconciliationRecords = [
  { id:'rec-001', provider:'uber', period:'Août 2026', providerReported:89420, ledgerAmount:89420, difference:0, result:'MATCH', lastChecked:'2026-08-24T15:00:00Z' },
  { id:'rec-002', provider:'lyft', period:'Août 2026', providerReported:41230, ledgerAmount:41230, difference:0, result:'MATCH', lastChecked:'2026-08-24T15:00:00Z' },
  { id:'rec-003', provider:'doordash', period:'Août 2026', providerReported:38940, ledgerAmount:36620, difference:2320, result:'AMOUNT_MISMATCH', lastChecked:'2026-08-24T15:00:00Z' },
  { id:'rec-004', provider:'instacart', period:'Août 2026', providerReported:22180, ledgerAmount:22180, difference:0, result:'MATCH', lastChecked:'2026-08-24T15:00:00Z' },
  { id:'rec-005', provider:'ubereats', period:'Août 2026', providerReported:35820, ledgerAmount:35820, difference:0, result:'MATCH', lastChecked:'2026-08-24T15:00:00Z' },
  { id:'rec-006', provider:'skip', period:'Août 2026', providerReported:18930, ledgerAmount:17430, difference:1500, result:'AMOUNT_MISMATCH', lastChecked:'2026-08-24T15:00:00Z' },
  { id:'rec-007', provider:'taxi', period:'Août 2026', providerReported:38100, ledgerAmount:38100, difference:0, result:'MATCH', lastChecked:'2026-08-24T15:00:00Z' },
]

// ─── ACCESS LOGS (Privacy) ────────────────────────────────────
export const mockAccessLogs = [
  { id:'al-001', agentId:'ADMIN-001', agentRole:'GOVERNMENT_ADMIN' as GovernmentRole, action:'VIEW', resource:'Revenue Profile', resourceId:'TG-000009', reason:'Compliance Review', timestamp:'2026-08-24T14:22:00Z' },
  { id:'al-002', agentId:'TAX-003', agentRole:'TAX_ADMIN' as GovernmentRole, action:'VIEW', resource:'Tax Period', resourceId:'tp-002', reason:'Annual audit', timestamp:'2026-08-24T13:10:00Z' },
  { id:'al-003', agentId:'COMP-002', agentRole:'COMPLIANCE_OFFICER' as GovernmentRole, action:'ASSIGN', resource:'ComplianceCase', resourceId:'CASE-2026-0001', reason:'Case management', timestamp:'2026-08-24T10:15:00Z' },
  { id:'al-004', agentId:'AUDIT-001', agentRole:'AUDITOR' as GovernmentRole, action:'VIEW', resource:'AuditLog', resourceId:'all', reason:'Weekly audit review', timestamp:'2026-08-23T09:00:00Z' },
  { id:'al-005', agentId:'ANALYST-001', agentRole:'ANALYST' as GovernmentRole, action:'EXPORT', resource:'RevenueReport', resourceId:'monthly-2026-08', reason:'Monthly report generation', timestamp:'2026-08-23T17:00:00Z' },
  { id:'al-006', agentId:'SUPPORT-001', agentRole:'SUPPORT_AGENT' as GovernmentRole, action:'VIEW', resource:'DriverProfile', resourceId:'TG-000002', reason:'Driver inquiry', timestamp:'2026-08-24T11:30:00Z' },
]

// ─── RBAC PERMISSIONS ─────────────────────────────────────────
export const rbacPermissions: Record<GovernmentRole, string[]> = {
  SUPER_ADMIN: ['*'],
  TAX_ADMIN: ['tax.read','tax.write','tax.report','tax.adjust','declarations.read','declarations.write','revenue.read'],
  COMPLIANCE_OFFICER: ['compliance.read','compliance.write','cases.manage','anomalies.read','drivers.read','revenue.read','documents.review','notices.send'],
  AUDITOR: ['audit.read','drivers.read','revenue.read','tax.read','compliance.read','transactions.read'],
  SUPPORT_AGENT: ['drivers.read.basic','documents.read','notices.send.limited'],
  ANALYST: ['analytics.read','revenue.aggregate','platforms.stats'],
  SYSTEM_ADMIN: ['system.manage','webhooks.manage','integrations.manage','users.manage'],
}

// ─── REVENUE BY REGION ────────────────────────────────────────
export const revenueByRegion = [
  { region:'Montréal', revenue:18420000, drivers:52140, transactions:620000, active:true },
  { region:'Laval', revenue:3820000, drivers:8920, transactions:98000, active:true },
  { region:'Longueuil', revenue:2940000, drivers:6840, transactions:72000, active:true },
  { region:'Québec', revenue:4820000, drivers:11200, transactions:148000, active:true },
  { region:'Gatineau', revenue:2180000, drivers:4820, transactions:58000, active:true },
  { region:'Sherbrooke', revenue:1840000, drivers:3840, transactions:42000, active:true },
  { region:'Saguenay', revenue:1240000, drivers:2640, transactions:28000, active:true },
  { region:'Trois-Rivières', revenue:980000, drivers:2120, transactions:22000, active:true },
]

// ─── METER INSTANCES ──────────────────────────────────────────
export const meterInstances = [
  { id:'METER-QC-00008231', driverId:'TG-000008', vehicleId:'V008', appVersion:'3.2.1', certificationVersion:'QC-TAXI-2026-V4', status:'ACTIVE', lastUpdate:'2026-08-24T10:00:00Z', lastSync:'2026-08-24T15:00:00Z' },
  { id:'METER-QC-00001001', driverId:'TG-000003', vehicleId:'V003', appVersion:'3.2.1', certificationVersion:'QC-TAXI-2026-V4', status:'ACTIVE', lastUpdate:'2026-08-22T09:00:00Z', lastSync:'2026-08-24T14:50:00Z' },
  { id:'METER-QC-00003210', driverId:'TG-000001', vehicleId:'V001', appVersion:'3.1.9', certificationVersion:'QC-TAXI-2026-V3', status:'UPDATE_REQUIRED', lastUpdate:'2026-07-15T09:00:00Z', lastSync:'2026-08-24T14:32:00Z' },
]

// ─── ML FEATURE STORE (future) ────────────────────────────────
export const complianceFeatures = [
  { driverId:'TG-000002', transactionFrequency:4.2, adjustmentFrequency:0.18, revenueVariance:0.31, platformMismatchScore:0.72, unusualTimingScore:0.12, missingDataScore:0.08, overallRiskScore:72 },
  { driverId:'TG-000004', transactionFrequency:0, adjustmentFrequency:0, revenueVariance:0, platformMismatchScore:0, unusualTimingScore:1.0, missingDataScore:0.9, overallRiskScore:91 },
  { driverId:'TG-000009', transactionFrequency:8.1, adjustmentFrequency:0.05, revenueVariance:0.15, platformMismatchScore:0.22, unusualTimingScore:0.08, missingDataScore:0.02, overallRiskScore:55 },
]

// ─── RETENTION POLICIES ───────────────────────────────────────
export const retentionPolicies = [
  { category:'Transactions', retentionYears:7, legalBasis:'Loi sur les archives', status:'ACTIVE' },
  { category:'Webhook Events', retentionYears:2, legalBasis:'Politique interne', status:'ACTIVE' },
  { category:'Audit Logs', retentionYears:10, legalBasis:'Loi sur la gouvernance', status:'ACTIVE' },
  { category:'Tax Records', retentionYears:7, legalBasis:'Loi sur l\'administration fiscale', status:'ACTIVE' },
  { category:'Identity Records', retentionYears:7, legalBasis:'Loi sur la protection des renseignements personnels', status:'ACTIVE' },
  { category:'Compliance Cases', retentionYears:10, legalBasis:'Obligations légales', status:'ACTIVE' },
]
