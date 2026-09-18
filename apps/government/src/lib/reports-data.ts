// TAXIMETER.GOV — Données rapports gouvernementaux
export const PILOT = 'PILOTE · DONNÉES SYNTHÉTIQUES · AUCUNE TRANSMISSION OFFICIELLE'
export const money = (n:number) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(n)
export const fmtDate = (s:string) => new Intl.DateTimeFormat('fr-CA',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(s))

export const NAV_REPORTS = [
  {href:'/reports/builder',   l:'🛠️ Générateur',  active:false},
  {href:'/reports/scheduled', l:'⏱️ Programmés',   active:false},
  {href:'/reports/tax',       l:'🧾 Fiscal',        active:false},
  {href:'/reports/platform',  l:'🔌 Plateformes',  active:false},
  {href:'/reports/compliance',l:'⚖️ Conformité',   active:false},
]

export const ALL_REPORTS = [
  // Fiscal
  {id:'RPT-GOV-F001', cat:'FISCAL',      title:'Rapport fiscal consolidé Q3 2026',       period:'2026-Q3', status:'DRAFT',     format:'PDF', size:'4.2 MB', records:9847,    generatedAt:'2026-09-17T09:00:00Z', brut:224_850_000, tps:11_242_500, tvq:22_394_438},
  {id:'RPT-GOV-F002', cat:'FISCAL',      title:'Rapport fiscal consolidé Q2 2026',       period:'2026-Q2', status:'VALIDATED', format:'PDF', size:'3.8 MB', records:9614,    generatedAt:'2026-07-30T14:00:00Z', brut:203_500_000, tps:10_175_000, tvq:20_274_263},
  {id:'RPT-GOV-F003', cat:'FISCAL',      title:'Rapport fiscal consolidé Q1 2026',       period:'2026-Q1', status:'VALIDATED', format:'PDF', size:'3.5 MB', records:9123,    generatedAt:'2026-04-29T11:00:00Z', brut:186_000_000, tps:9_300_000,  tvq:18_553_500},
  {id:'RPT-GOV-F004', cat:'FISCAL',      title:'Rapport pourboires taxables 9M 2026',    period:'2026-9M', status:'VALIDATED', format:'PDF', size:'2.1 MB', records:9847,    generatedAt:'2026-09-10T15:00:00Z', brut:61_435_000,  tps:3_071_750,  tvq:6_128_141},
  // Plateformes
  {id:'RPT-GOV-P001', cat:'PLATFORM',    title:'Rapport fournisseurs Q3 2026',           period:'2026-Q3', status:'DRAFT',     format:'CSV', size:'0.8 MB', records:6,       generatedAt:'2026-09-17T08:00:00Z', brut:224_850_000, tps:0, tvq:0},
  {id:'RPT-GOV-P002', cat:'PLATFORM',    title:'Rapport transactions Uber Q3 2026',      period:'2026-Q3', status:'VALIDATED', format:'PDF', size:'1.9 MB', records:4628,    generatedAt:'2026-09-15T12:00:00Z', brut:53_964_000,  tps:0, tvq:0},
  {id:'RPT-GOV-P003', cat:'PLATFORM',    title:'Rapport réconciliation Q3 2026',         period:'2026-Q3', status:'DRAFT',     format:'CSV', size:'0.5 MB', records:5,       generatedAt:'2026-09-17T07:00:00Z', brut:0, tps:0, tvq:0},
  {id:'RPT-GOV-P004', cat:'PLATFORM',    title:'Rapport webhooks Q3 2026',               period:'2026-Q3', status:'VALIDATED', format:'CSV', size:'0.3 MB', records:20,      generatedAt:'2026-09-16T10:00:00Z', brut:0, tps:0, tvq:0},
  {id:'RPT-GOV-P005', cat:'PLATFORM',    title:'Rapport anomalies fiscales 2026',        period:'2026-9M', status:'VALIDATED', format:'PDF', size:'1.1 MB', records:4,       generatedAt:'2026-09-15T10:00:00Z', brut:4_262_000,   tps:0, tvq:0},
  // Conformité
  {id:'RPT-GOV-C001', cat:'COMPLIANCE',  title:'Rapport conformité chauffeurs Q3 2026',  period:'2026-Q3', status:'DRAFT',     format:'PDF', size:'2.9 MB', records:9847,    generatedAt:'2026-09-17T06:00:00Z', brut:0, tps:0, tvq:0},
  {id:'RPT-GOV-C002', cat:'COMPLIANCE',  title:'Rapport audit pilote Q1-Q3 2026',        period:'2026-9M', status:'VALIDATED', format:'PDF', size:'8.4 MB', records:614350,  generatedAt:'2026-09-14T08:00:00Z', brut:0, tps:0, tvq:0},
  {id:'RPT-GOV-C003', cat:'COMPLIANCE',  title:'Rapport documents expirés Sept 2026',    period:'2026-09', status:'VALIDATED', format:'CSV', size:'0.4 MB', records:23,      generatedAt:'2026-09-12T10:00:00Z', brut:0, tps:0, tvq:0},
  {id:'RPT-GOV-C004', cat:'COMPLIANCE',  title:'Rapport licences à renouveler',          period:'2026-Q4', status:'DRAFT',     format:'PDF', size:'1.2 MB', records:47,      generatedAt:'2026-09-17T05:00:00Z', brut:0, tps:0, tvq:0},
]

export const SCHEDULED = [
  {id:'SCH-001', name:'Rapport fiscal mensuel',      freq:'Mensuel',      next:'2026-10-01T06:00:00Z', last:'2026-09-01T06:00:00Z', format:'PDF', recipients:3, active:true,  cat:'FISCAL'},
  {id:'SCH-002', name:'Rapport conformité hebdo',    freq:'Hebdomadaire', next:'2026-09-22T06:00:00Z', last:'2026-09-15T06:00:00Z', format:'CSV', recipients:2, active:true,  cat:'COMPLIANCE'},
  {id:'SCH-003', name:'Rapport anomalies mensuel',   freq:'Mensuel',      next:'2026-10-01T07:00:00Z', last:'2026-09-01T07:00:00Z', format:'PDF', recipients:5, active:true,  cat:'PLATFORM'},
  {id:'SCH-004', name:'Rapport TPS/TVQ trimestriel', freq:'Trimestriel',  next:'2026-10-31T09:00:00Z', last:'2026-07-31T09:00:00Z', format:'PDF', recipients:4, active:true,  cat:'FISCAL'},
  {id:'SCH-005', name:'Rapport fournisseurs hebdo',  freq:'Hebdomadaire', next:'2026-09-22T08:00:00Z', last:'2026-09-15T08:00:00Z', format:'CSV', recipients:2, active:false, cat:'PLATFORM'},
]

export const STATUS_CONF: Record<string,{label:string;color:string;bg:string}> = {
  VALIDATED:{label:'Validé',    color:'#059669',bg:'rgba(5,150,105,0.12)'},
  DRAFT:    {label:'Brouillon', color:'#B45309', bg:'rgba(180,83,9,0.10)'},
  PENDING:  {label:'En attente',color:'#003DA5', bg:'rgba(0,61,165,0.10)'},
  ERROR:    {label:'Erreur',    color:'#DC2626', bg:'rgba(220,38,38,0.10)'},
}
export const CAT_CONF: Record<string,{label:string;icon:string;color:string}> = {
  FISCAL:    {label:'Fiscal',      icon:'🧾', color:'#7C3AED'},
  PLATFORM:  {label:'Plateformes', icon:'🔌', color:'#003DA5'},
  COMPLIANCE:{label:'Conformité',  icon:'⚖️',  color:'#059669'},
}
