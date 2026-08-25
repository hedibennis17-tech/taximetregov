// ============================================================
// TAXIMÈTRE.GOV — STEP 7 ANALYTICS DATA (DEMO / SIMULATION)
// Advanced Analytics, Reporting & Government Intelligence
// Source: aggregated from Universal Ledger (simulated)
// ============================================================

// ─── DATE ENGINE ─────────────────────────────────────────────
export type DatePeriod = 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'quarter' | 'year' | 'custom'
export const TIMEZONE = 'America/Toronto' // Québec jurisdiction

// ─── CURRENCY ENGINE ─────────────────────────────────────────
export const DEFAULT_CURRENCY = 'CAD'
// All amounts in cents internally to avoid float issues, displayed as decimal
export function formatCAD(amount: number, decimals = 2) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(amount)
}
export function formatNum(n: number) { return n.toLocaleString('fr-CA') }

// ─── PLATFORM COLORS ─────────────────────────────────────────
export const PLATFORM_COLORS_7: Record<string, string> = {
  uber: '#000000', lyft: '#FF00BF', doordash: '#FF3008',
  instacart: '#43B02A', ubereats: '#06C167', skip: '#E31837',
  taxi: '#003DA5', other: '#64748B',
}

// ─── REVENUE ANALYTICS DATA ──────────────────────────────────
export const monthLabels = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû']

// Monthly revenue 2026 (all platforms combined)
export const monthlyRevenue = [
  { month:'Jan', gross:218400, net:152880, taxable:196560, tps:9828, tvq:19615, tips:10920, fees:54600, adjustments:2184, refunds:4368 },
  { month:'Fév', gross:231200, net:161840, taxable:208080, tps:10404, tvq:20756, tips:11560, fees:57800, adjustments:2312, refunds:4624 },
  { month:'Mar', gross:254800, net:178360, taxable:229320, tps:11466, tvq:22869, tips:12740, fees:63700, adjustments:2548, refunds:5096 },
  { month:'Avr', gross:242600, net:169820, taxable:218340, tps:10917, tvq:21783, tips:12130, fees:60650, adjustments:2426, refunds:4852 },
  { month:'Mai', gross:268900, net:188230, taxable:242010, tps:12101, tvq:24141, tips:13445, fees:67225, adjustments:2689, refunds:5378 },
  { month:'Jun', gross:284200, net:198940, taxable:255780, tps:12789, tvq:25514, tips:14210, fees:71050, adjustments:2842, refunds:5684 },
  { month:'Jul', gross:271300, net:189910, taxable:244170, tps:12209, tvq:24357, tips:13565, fees:67825, adjustments:2713, refunds:5426 },
  { month:'Aoû', gross:284620, net:199234, taxable:256158, tps:12808, tvq:25552, tips:14231, fees:71155, adjustments:2846, refunds:5692 },
]

// Daily revenue (August 2026 — 24 days)
export const dailyRevenue = Array.from({ length: 24 }, (_, i) => {
  const base = 8000 + Math.sin(i * 0.4) * 3000 + (i % 7 < 2 ? 4000 : 0)
  const gross = Math.round(base + Math.random() * 2000)
  return {
    day: `${i + 1} Aoû`, gross, net: Math.round(gross * 0.7),
    taxable: Math.round(gross * 0.9), tps: Math.round(gross * 0.9 * 0.05),
    tvq: Math.round(gross * 0.9 * 0.09975), tips: Math.round(gross * 0.05),
    fees: Math.round(gross * 0.25), trips: Math.round(gross / 35),
  }
})

// Hourly distribution (average weekday)
export const hourlyData = Array.from({ length: 24 }, (_, h) => ({
  hour: `${String(h).padStart(2,'0')}h`,
  trips: h < 5 ? Math.round(10 + h * 5) : h < 10 ? Math.round(80 + h * 12) : h < 14 ? Math.round(200 + Math.sin(h) * 30) : h < 20 ? Math.round(220 + h * 8) : Math.round(150 - (h-20) * 25),
  revenue: h < 5 ? Math.round(300 + h * 120) : h < 10 ? Math.round(2400 + h * 300) : h < 14 ? Math.round(6000 + Math.sin(h) * 800) : h < 20 ? Math.round(6500 + h * 200) : Math.round(4500 - (h-20) * 600),
  taxi: h > 22 || h < 4 ? Math.round(30 + h * 3) : h > 17 ? Math.round(60 + h * 5) : Math.round(20 + h * 4),
  delivery: h > 11 && h < 22 ? Math.round(80 + h * 6) : Math.round(20),
}))

// ─── PLATFORM ANALYTICS ───────────────────────────────────────
export const platformAnalytics = [
  { provider:'uber', name:'Uber', category:'RIDESHARE', drivers:18, activities:12480, gross:89420, fees:22355, tips:4471, adjustments:894, refunds:1788, net:69752, taxableRev:80478, tps:4024, tvq:8028 },
  { provider:'lyft', name:'Lyft', category:'RIDESHARE', drivers:11, activities:5840, gross:41230, fees:10308, tips:2062, adjustments:412, refunds:825, net:32559, taxableRev:37107, tps:1855, tvq:3701 },
  { provider:'doordash', name:'DoorDash', category:'FOOD_DELIVERY', drivers:14, activities:9320, gross:38940, fees:9735, tips:3894, adjustments:389, refunds:779, net:32709, taxableRev:35046, tps:1752, tvq:3496 },
  { provider:'instacart', name:'Instacart', category:'GROCERY', drivers:7, activities:3240, gross:22180, fees:5545, tips:1109, adjustments:222, refunds:444, net:17522, taxableRev:19962, tps:998, tvq:1991 },
  { provider:'ubereats', name:'Uber Eats', category:'FOOD_DELIVERY', drivers:9, activities:7120, gross:35820, fees:8955, tips:3582, adjustments:358, refunds:716, net:30089, taxableRev:32238, tps:1612, tvq:3216 },
  { provider:'skip', name:'Skip', category:'FOOD_DELIVERY', drivers:6, activities:4980, gross:18930, fees:4733, tips:1893, adjustments:189, refunds:379, net:15900, taxableRev:17037, tps:852, tvq:1699 },
  { provider:'taxi', name:'Taximètre', category:'TAXI', drivers:12, activities:8640, gross:38100, fees:0, tips:1905, adjustments:381, refunds:762, net:39624, taxableRev:34290, tps:1715, tvq:3420 },
]

// ─── DRIVER ANALYTICS ─────────────────────────────────────────
export const driverAnalytics = {
  registered: 50, active: 38, inactive: 5, suspended: 3, pending: 2, verification: 2,
  byActivity: [
    { type:'Taxi', count:12, revenue:38100 },
    { type:'Rideshare', count:14, revenue:68430 },
    { type:'Livraison', count:16, revenue:58070 },
    { type:'Multi-plateforme', count:8, revenue:120020 },
  ],
  avgRevenue: 5692, medianRevenue: 4840, topDecile: 12480,
  mfaEnabled: 6, mfaDisabled: 2,
  byRegion: [
    { region:'Montréal', count:31, revenue:184220 },
    { region:'Québec', count:10, revenue:62100 },
    { region:'Laval', count:5, revenue:18400 },
    { region:'Autres', count:4, revenue:19900 },
  ]
}

// ─── TAXI ANALYTICS ───────────────────────────────────────────
export const taxiAnalytics = {
  trips: 8640, revenue: 38100, avgFare: 44.10, avgDurationMin: 18.4,
  avgDistanceKm: 8.2, meterSessions: 8652, meterErrors: 12,
  paymentBreakdown: [
    { method:'Carte', count:5184, amount:22860, pct:60 },
    { method:'Interac', count:1728, amount:7620, pct:20 },
    { method:'Comptant', count:1296, amount:5715, pct:15 },
    { method:'Portefeuille', count:432, amount:1905, pct:5 },
  ],
  byHour: hourlyData.map(h => ({ hour: h.hour, trips: h.taxi })),
  meterInstances: 12, certifiedInstances: 11, outdatedVersions: 1,
}

// ─── DELIVERY ANALYTICS ───────────────────────────────────────
export const deliveryAnalytics = {
  total: 24660, revenue: 115870, avgDeliveryValue: 47.0,
  tips: 10478, fees: 28968, refunds: 2318, net: 95062,
  byPlatform: [
    { platform:'DoorDash', deliveries:9320, revenue:38940, tips:3894 },
    { platform:'Instacart', deliveries:3240, revenue:22180, tips:1109 },
    { platform:'Uber Eats', deliveries:7120, revenue:35820, tips:3582 },
    { platform:'Skip', deliveries:4980, revenue:18930, tips:1893 },
  ],
  peakHours: [12, 13, 18, 19, 20],
}

// ─── TAX ANALYTICS ────────────────────────────────────────────
export const taxAnalytics = {
  totalTaxable: 256158, tpsCollected: 12808, tvqCollected: 25552,
  totalCollected: 38360, totalRemitted: 32606, outstanding: 5754,
  refunds: 1620, adjustments: 890,
  byPlatform: platformAnalytics.map(p => ({ provider: p.provider, name: p.name, tps: p.tps, tvq: p.tvq, total: p.tps + p.tvq })),
  byMonth: monthlyRevenue.map(m => ({ month: m.month, tps: m.tps, tvq: m.tvq, total: m.tps + m.tvq })),
  rate: (12808 + 25552) / 256158 * 100, // Should be ~14.975%
}

// ─── COMPLIANCE ANALYTICS ─────────────────────────────────────
export const complianceAnalytics = {
  openCases: 5, resolved: 8, closed: 2, total: 15,
  byPriority: [{ priority:'CRITICAL', count:1 },{ priority:'HIGH', count:2 },{ priority:'MEDIUM', count:2 },{ priority:'LOW', count:0 }],
  byType: [
    { type:'REVENUE_MISMATCH', count:3 },{ type:'MISSING_TRANSACTION', count:4 },
    { type:'TAX_INCONSISTENCY', count:3 },{ type:'UNUSUAL_INACTIVITY', count:2 },
    { type:'METER_ERROR', count:2 },{ type:'IMPOSSIBLE_ADJUSTMENT', count:1 },
  ],
  resolutionRatePercent: 66.7, avgResolutionDays: 4.2,
  riskDistribution: [
    { level:'LOW (0-40)', count:4, color:'#22C55E' },
    { level:'MEDIUM (41-70)', count:8, color:'#F59E0B' },
    { level:'HIGHER REVIEW (71-100)', count:3, color:'#EF4444' },
  ],
  trend: monthLabels.map((m, i) => ({ month:m, opened: 1+Math.round(Math.random()*2), resolved: Math.round(Math.random()*3) })),
}

// ─── RECONCILIATION ANALYTICS ─────────────────────────────────
export const reconciliationAnalytics = {
  total: 100, matched: 92, missing: 3, amountMismatch: 2, statusMismatch: 1, unresolved: 2,
  rate: 92, // %
  totalProviderAmount: 284620, totalLedgerAmount: 280780, totalDiff: 3840,
  byPlatform: platformAnalytics.map(p => ({
    provider: p.provider, name: p.name,
    providerAmount: p.gross, ledgerAmount: Math.round(p.gross * (p.provider === 'doordash' ? 0.94 : p.provider === 'skip' ? 0.92 : 1)),
    diff: p.provider === 'doordash' ? Math.round(p.gross * 0.06) : p.provider === 'skip' ? Math.round(p.gross * 0.08) : 0,
    status: p.provider === 'doordash' || p.provider === 'skip' ? 'AMOUNT_MISMATCH' : 'MATCH',
  }))
}

// ─── WEBHOOK ANALYTICS ────────────────────────────────────────
export const webhookAnalytics = {
  received: 2050, processed: 2020, duplicates: 14, failed: 16, retries: 8, deadLetter: 2,
  avgProcessingMs: 142, successRatePercent: 98.5,
  byPlatform: [
    { provider:'uber', received:487, processed:481, failed:2, duplicates:4, avgMs:142 },
    { provider:'lyft', received:203, processed:199, failed:3, duplicates:1, avgMs:98 },
    { provider:'doordash', received:312, processed:301, failed:5, duplicates:6, avgMs:0 },
    { provider:'instacart', received:89, processed:89, failed:0, duplicates:0, avgMs:201 },
    { provider:'ubereats', received:241, processed:240, failed:1, duplicates:0, avgMs:175 },
    { provider:'skip', received:158, processed:150, failed:5, duplicates:3, avgMs:0 },
    { provider:'taxi', received:560, processed:560, failed:0, duplicates:0, avgMs:55 },
  ],
  byHour: Array.from({length:24},(_,h)=>({ hour:`${String(h).padStart(2,'0')}h`, events: Math.round(30 + Math.sin(h*0.3)*20 + (h>8&&h<22?60:0)) })),
}

// ─── PAYMENT ANALYTICS ────────────────────────────────────────
export const paymentAnalytics = [
  { method:'Carte', count:24600, gross:198234, refunds:3964, net:194270, pct:69.7 },
  { method:'Interac', count:7200, gross:56840, refunds:1137, net:55703, pct:20.0 },
  { method:'Comptant', count:3600, gross:24818, refunds:496, net:24322, pct:8.7 },
  { method:'Portefeuille', count:450, gross:4728, refunds:95, net:4633, pct:1.6 },
]

// ─── TIPS ANALYTICS ───────────────────────────────────────────
export const tipsAnalytics = {
  total: 38155, average: 4.82, tipRate: 72.4,
  byPlatform: platformAnalytics.map(p => ({ name: p.name, tips: p.tips, avgTip: Math.round(p.tips/p.activities*100)/100 })),
  byMonth: monthlyRevenue.map(m => ({ month: m.month, tips: m.tips })),
}

// ─── GEOGRAPHIC ANALYTICS ─────────────────────────────────────
export const geoAnalytics = [
  { region:'Montréal', drivers:31, activities:28420, revenue:184220, taxableRev:165798, tps:8290, tvq:16549, cases:8 },
  { region:'Québec', drivers:10, activities:9840, revenue:62100, taxableRev:55890, tps:2795, tvq:5575, cases:3 },
  { region:'Laval', drivers:5, activities:4920, revenue:18400, taxableRev:16560, tps:828, tvq:1652, cases:1 },
  { region:'Longueuil', drivers:2, activities:2140, revenue:10240, taxableRev:9216, tps:461, tvq:919, cases:0 },
  { region:'Sherbrooke', drivers:1, activities:1020, revenue:5840, taxableRev:5256, tps:263, tvq:524, cases:0 },
  { region:'Autres', drivers:1, activities:880, revenue:3820, taxableRev:3438, tps:172, tvq:343, cases:1 },
]

// ─── SCHEDULED REPORTS ────────────────────────────────────────
export interface ScheduledReport {
  id: string; name: string; dataset: string; frequency: string
  format: string; lastRun: string; nextRun: string; status: string
  createdBy: string; recipients: string[]; filters: Record<string, string>
}
export const mockScheduledReports: ScheduledReport[] = [
  { id:'sr-001', name:'Rapport fiscal mensuel', dataset:'tax_summary', frequency:'MONTHLY', format:'PDF', lastRun:'2026-08-01T06:00:00Z', nextRun:'2026-09-01T06:00:00Z', status:'ACTIVE', createdBy:'TAX-003', recipients:['n.beausoleil@arq.gouv.qc.ca'], filters:{ jurisdiction:'QC-CA' } },
  { id:'sr-002', name:'Rapport opérationnel quotidien', dataset:'operations_daily', frequency:'DAILY', format:'CSV', lastRun:'2026-08-24T06:00:00Z', nextRun:'2026-08-25T06:00:00Z', status:'ACTIVE', createdBy:'ADMIN-001', recipients:['gerard.lepage@mtq.gouv.qc.ca'], filters:{} },
  { id:'sr-003', name:'Rapport conformité hebdomadaire', dataset:'compliance', frequency:'WEEKLY', format:'XLSX', lastRun:'2026-08-18T07:00:00Z', nextRun:'2026-08-25T07:00:00Z', status:'ACTIVE', createdBy:'COMP-002', recipients:['m.tremblay@mtq.gouv.qc.ca'], filters:{ status:'OPEN' } },
  { id:'sr-004', name:'Rapport revenus plateformes', dataset:'platform_revenue', frequency:'MONTHLY', format:'XLSX', lastRun:'2026-08-01T06:00:00Z', nextRun:'2026-09-01T06:00:00Z', status:'ACTIVE', createdBy:'ANALYST-001', recipients:['k.ouellet@arq.gouv.qc.ca'], filters:{} },
  { id:'sr-005', name:'Sommaire exécutif trimestriel', dataset:'executive_summary', frequency:'QUARTERLY', format:'PDF', lastRun:'2026-07-01T06:00:00Z', nextRun:'2026-10-01T06:00:00Z', status:'ACTIVE', createdBy:'ADMIN-001', recipients:['gerard.lepage@mtq.gouv.qc.ca'], filters:{} },
]

// ─── EXECUTIVE REPORT DATA ────────────────────────────────────
export const executiveReport = {
  period: 'Août 2026', generatedAt: '2026-08-24T15:00:00Z', generatedBy: 'SYSTEM',
  headline: {
    totalRevenue: 284620, revenueGrowth: 4.9, activePlatforms: 7,
    activeDrivers: 38, taxesCollected: 38360, openCases: 5,
  },
  revenueBySource: platformAnalytics,
  taxSummary: taxAnalytics,
  complianceSummary: complianceAnalytics,
  systemHealth: { healthy: 9, degraded: 1, down: 0, incidents: 2 },
}

// ─── INTELLIGENCE INSIGHTS ────────────────────────────────────
export const intelligenceInsights = [
  { id:'ins-001', category:'REVENUE', icon:'📈', title:'Revenus en hausse de 4.9%', description:'Les revenus d\'août 2026 (284 620$) sont supérieurs de 4.9% à juillet 2026 (271 300$).', source:'Universal Ledger', confidence:'HIGH', period:'Août vs Juillet 2026', action:'Aucune action requise', sentiment:'positive' },
  { id:'ins-002', category:'WEBHOOK', icon:'⚠️', title:'Taux d\'erreur webhook DoorDash élevé', description:'DoorDash présente un taux d\'erreur webhook de 12% (5 échecs sur 312 événements reçus). La norme acceptable est < 2%.', source:'Webhook Engine', confidence:'HIGH', period:'24 août 2026', action:'Investigation en cours — Incident INC-001', sentiment:'negative' },
  { id:'ins-003', category:'TAXI', icon:'🚕', title:'Taximètre v3.1.9 — Version non certifiée', description:'1 instance taximètre (METER-QC-00003210) utilise une version logicielle v3.1.9 non certifiée pour la saison 2026-2027.', source:'Meter Registry', confidence:'HIGH', period:'Continu', action:'Mise à jour requise — Tâche assignée à LIC-001', sentiment:'negative' },
  { id:'ins-004', category:'COMPLIANCE', icon:'⚖️', title:'Taux de résolution conformité: 66.7%', description:'8 dossiers sur 12 résolus au cours des 30 derniers jours. Le taux de résolution moyen cible est ≥ 80%.', source:'Compliance Engine', confidence:'MEDIUM', period:'30 derniers jours', action:'Révision de la capacité de traitement recommandée', sentiment:'neutral' },
  { id:'ins-005', category:'RECONCILIATION', icon:'🔄', title:'Écart DoorDash + Skip: 3 820$', description:'Les montants DoorDash et Skip présentent des écarts de réconciliation cumulés de 3 820$ pour août 2026. Cause probable: webhooks manquants.', source:'Reconciliation Engine', confidence:'HIGH', period:'Août 2026', action:'Dossier CASE-2026-0001 en cours d\'investigation', sentiment:'negative' },
  { id:'ins-006', category:'PLATFORM', icon:'🟢', title:'Taximètre: 100% de précision webhook', description:'Le Taximètre (intégration interne) présente un taux de traitement webhook de 100% (560/560 événements) avec 0 erreur.', source:'Webhook Engine', confidence:'HIGH', period:'24 août 2026', action:'Aucune action requise', sentiment:'positive' },
]

// ─── REPORT DEFINITIONS ───────────────────────────────────────
export const reportDefinitions = [
  { id:'rd-001', name:'Revenus mensuels', dataset:'monthly_revenue', description:'Revenus bruts/nets par plateforme et activité', formats:['PDF','CSV','XLSX'], rbacRequired:'revenue.read' },
  { id:'rd-002', name:'Sommaire fiscal TPS/TVQ', dataset:'tax_summary', description:'TPS 5% + TVQ 9.975% par période et juridiction', formats:['PDF','CSV','XLSX','JSON'], rbacRequired:'tax.read' },
  { id:'rd-003', name:'Activité plateformes', dataset:'platform_activity', description:'Transactions, revenus, erreurs par plateforme', formats:['PDF','CSV','XLSX'], rbacRequired:'platforms.read' },
  { id:'rd-004', name:'Rapport taxi', dataset:'taxi_report', description:'Courses, tarifs, taximètres, paiements', formats:['PDF','CSV'], rbacRequired:'drivers.read' },
  { id:'rd-005', name:'Rapport livraisons', dataset:'delivery_report', description:'Livraisons, revenus, pourboires par plateforme', formats:['PDF','CSV','XLSX'], rbacRequired:'drivers.read' },
  { id:'rd-006', name:'Rapport conformité', dataset:'compliance_report', description:'Dossiers ouverts, anomalies, résolutions', formats:['PDF','CSV'], rbacRequired:'compliance.read' },
  { id:'rd-007', name:'Réconciliation', dataset:'reconciliation_report', description:'Provider vs Ledger par plateforme', formats:['PDF','CSV','XLSX'], rbacRequired:'tax.read' },
  { id:'rd-008', name:'Rapport webhook', dataset:'webhook_report', description:'Événements, doublons, erreurs, latences', formats:['CSV','JSON'], rbacRequired:'platforms.read' },
  { id:'rd-009', name:'Rapport data quality', dataset:'data_quality', description:'Qualité des données par domaine', formats:['PDF','CSV'], rbacRequired:'audit.read' },
  { id:'rd-010', name:'Sommaire exécutif', dataset:'executive_summary', description:'Vue globale pour la direction', formats:['PDF'], rbacRequired:'revenue.read' },
]
