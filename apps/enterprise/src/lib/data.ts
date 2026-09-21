// TAXIMETER.GOV — Enterprise Gov — Données pilotes
// PILOTE · DONNÉES SYNTHÉTIQUES · AUCUNE CONNEXION GOUVERNEMENTALE RÉELLE
export const PILOT = 'PILOTE · DONNÉES SYNTHÉTIQUES · AUCUNE CONNEXION GOUVERNEMENTALE RÉELLE'
export const money = (n:number) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(n)
export const money2 = (n:number) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(n)
export const fmtDt = (s:string) => new Intl.DateTimeFormat('fr-CA',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(s))
export const fmtDate = (s:string) => new Intl.DateTimeFormat('fr-CA',{year:'numeric',month:'short',day:'numeric'}).format(new Date(s))
const r2=(n:number)=>Math.round(n*100)/100
const TPS=0.05; const TVQ=0.09975

// ENTREPRISE CONNECTÉE (session DEMO = ENT-DEMO-001)
export const CURRENT_ENT = {
  id:'ENT-DEMO-001',
  // ⚠️ DONNÉES SYNTHÉTIQUES — COMPTE DÉMO POUR DÉMONSTRATION TAXIMETER.GOV
  // Les chiffres affichés sont des estimations inspirées de données publiques
  // disponibles pour illustrer les capacités du système. Ils ne représentent
  // pas les états financiers réels d'Uber Technologies Inc. ou de ses filiales.
  legalName:'Uber Canada Inc. (DEMO)',
  tradeName:'Uber Québec',
  neq:'8765432100',               // FICTIF — DEMO UNIQUEMENT
  taxId:'TPS-UBER-DEMO-001',      // FICTIF — DEMO UNIQUEMENT
  tvqId:'TVQ-UBER-DEMO-001',      // FICTIF — DEMO UNIQUEMENT
  sector:'MULTI-ACTIVITÉS',
  type:'CORPORATION',
  status:'ACTIVE',
  verif:'VERIFIED',
  connection:'CONNECTED',
  compliance:97,
  address:'720 King St W, Suite 1600',
  city:'Toronto',
  province:'ON',
  postal:'M5V 2T3',
  phoneQC:'(514) 555-UBER',       // FICTIF
  email:'quebec.demo@uber-taximetergov.demo',
  website:'www.uber.com',
  registered:'2014-09-01',        // Uber Canada présent depuis ~2014
  repr:'Sophie Marchand',         // FICTIF — représentant DEMO
  reprTitle:'Directrice Québec — Compte DÉMO',
  reprFiscal:'Jean-Philippe Roy', // FICTIF
  jurisdiction:'QC',
  logoEmoji:'⚫',                  // Noir = couleur Uber
  logoBg:'#000000',
  logoText:'uber',
  // ── CHIFFRES ANNUELS 2024 — ESTIMATION PUBLIQUE ──────────────
  // Source: Uber a déclaré un impact économique de ~1,9 G$ au QC en 2024
  // Ces chiffres sont une ESTIMATION SYNTHÉTIQUE à des fins de DÉMONSTRATION
  // Uber ne divulgue pas son CA Québec séparément
  revenusAnnuels2024_estime: 380_000_000,   // Estimation DEMO revenus QC
  revenusAnnuels2026_demo:   412_800,        // Q3 2026 données DEMO de l'app
  revenusNote:"DONNÉES SYNTHÉTIQUES — ESTIMATION INSPIRÉE DE DONNÉES PUBLIQUES — NE REPRÉSENTE PAS LES ÉTATS FINANCIERS RÉELS D'UBER",
  chauffeurs_qc_estime: 17_000,             // ~17 000 chauffeurs actifs QC (public)
  trips_annuels_estime: 45_000_000,         // Estimation courses annuelles QC
  // ── SERVICES ACTIFS ──────────────────────────────────────────
  services:[
    {id:'SVC-001',label:'Uber Taxi',        emoji:'🚕',status:'ACTIVE',  note:'Taxi réglementé avec taximètre numérique · QC'},
    {id:'SVC-002',label:'UberX',            emoji:'🚗',status:'ACTIVE',  note:'Rideshare standard'},
    {id:'SVC-003',label:'Uber Green',       emoji:'🟢',status:'ACTIVE',  note:'Véhicules électriques/hybrides'},
    {id:'SVC-004',label:'UberXL',           emoji:'🚙',status:'ACTIVE',  note:'Véhicules grande capacité'},
    {id:'SVC-005',label:'Uber Eats',        emoji:'🍔',status:'ACTIVE',  note:'Livraison restauration'},
    {id:'SVC-006',label:'Uber Eats Grocery',emoji:'🛒',status:'ACTIVE',  note:'Livraison épicerie Cornershop'},
    {id:'SVC-007',label:'Uber Delivery',    emoji:'📦',status:'PLANNED', note:'Livraison colis — déploiement futur'},
  ],
}

export const ENT_USERS = [
  {id:'EUSR-001',name:'Sophie Marchand',    role:'OWNER',    email:'s.marchand@uber-demo.taximetergov.demo',status:'ACTIVE',  lastLogin:'2026-09-18T08:02:00Z'},
  {id:'EUSR-002',name:'Jean-Philippe Roy',  role:'FINANCE',  email:'jp.roy@uber-demo.taximetergov.demo',   status:'ACTIVE',  lastLogin:'2026-09-17T14:00:00Z'},
  {id:'EUSR-003',name:'Karim Benali',       role:'DISPATCH', email:'k.benali@uber-demo.taximetergov.demo', status:'ACTIVE',  lastLogin:'2026-09-18T07:30:00Z'},
  {id:'EUSR-004',name:'Marie-Ève Lapointe', role:'VIEWER',   email:'me.lapointe@uber-demo.taximetergov.demo',status:'ACTIVE',lastLogin:'2026-09-16T10:00:00Z'},
  {id:'EUSR-005',name:'David Chen',         role:'COMPLIANCE',email:'d.chen@uber-demo.taximetergov.demo',  status:'PENDING', lastLogin:null},
]
// ⚠️ UTILISATEURS FICTIFS — DÉMONSTRATION TAXIMETER.GOV UNIQUEMENT

export const ENT_DRIVERS = [
  {id:'DRV-QC-0001',name:'Jean Tremblay',   status:'ACTIVE',    vehicle:'TXM-001',plate:'ABC-1234',actQ3:1842,revQ3:r2(1842*22.4),docs:'OK',   relation:'EMPLOYEE'},
  {id:'DRV-QC-0002',name:'Marie Gagnon',    status:'ACTIVE',    vehicle:'TXM-002',plate:'DEF-5678',actQ3:1640,revQ3:r2(1640*22.4),docs:'OK',   relation:'EMPLOYEE'},
  {id:'DRV-QC-0003',name:'Karim Hassan',    status:'ACTIVE',    vehicle:'TXM-003',plate:'GHI-9012',actQ3:1540,revQ3:r2(1540*22.4),docs:'OK',   relation:'CONTRACTOR'},
  {id:'DRV-QC-0004',name:'Ali Bouchard',    status:'ACTIVE',    vehicle:'TXM-004',plate:'JKL-3456',actQ3:980, revQ3:r2(980*22.4), docs:'EXPIRING',relation:'CONTRACTOR'},
  {id:'DRV-QC-0005',name:'Nadia Patel',     status:'SUSPENDED', vehicle:null,      plate:null,      actQ3:0,   revQ3:0,            docs:'EXPIRED',relation:'EMPLOYEE'},
  {id:'DRV-QC-0006',name:'Marc Leblanc',    status:'ACTIVE',    vehicle:'TXM-006',plate:'MNO-7890',actQ3:1240,revQ3:r2(1240*22.4),docs:'OK',   relation:'EMPLOYEE'},
]

export const ENT_VEHICLES = [
  {id:'TXM-001',plate:'ABC-1234',make:'Nissan', model:'Altima', year:2022,vin:'1N4BL4EV5NC123456',driver:'DRV-QC-0001',status:'ACTIVE',   insurance:'2027-01-15',inspection:'2027-09-01',reg:'2027-03-15'},
  {id:'TXM-002',plate:'DEF-5678',make:'Toyota', model:'Camry',  year:2023,vin:'4T1BF1FK9HU123456',driver:'DRV-QC-0002',status:'ACTIVE',   insurance:'2027-03-20',inspection:'2027-09-15',reg:'2027-04-01'},
  {id:'TXM-003',plate:'GHI-9012',make:'Hyundai',model:'Sonata', year:2021,vin:'5NPE24AF4MH123456',driver:'DRV-QC-0003',status:'ACTIVE',   insurance:'2026-11-30',inspection:'2027-06-01',reg:'2027-02-15'},
  {id:'TXM-004',plate:'JKL-3456',make:'Ford',   model:'Fusion', year:2020,vin:'3FA6P0H72HR123456', driver:'DRV-QC-0004',status:'MAINTENANCE',insurance:'2027-02-28',inspection:'2026-09-30',reg:'2027-01-20'},
  {id:'TXM-005',plate:'STU-3456',make:'Honda',  model:'Accord', year:2022,vin:'1HGCV1F33MA123456',driver:null,           status:'AVAILABLE',insurance:'2027-04-15',inspection:'2027-10-01',reg:'2027-05-01'},
  {id:'TXM-006',plate:'MNO-7890',make:'Kia',    model:'K5',     year:2023,vin:'5XXG94J24PG123456', driver:'DRV-QC-0006',status:'ACTIVE',   insurance:'2027-06-30',inspection:'2027-12-15',reg:'2027-07-01'},
]

export const ENT_DOCS = [
  {id:'DOC-001',type:'NEQ',          label:'Numéro entreprise QC',    number:'1234567890',       issued:'2024-01-01',expires:null,        status:'APPROVED', entity:'ENTERPRISE'},
  {id:'DOC-002',type:'LICENSE',      label:'Permis taxi CTQ',         number:'LIC-TAXI-CTQ-001', issued:'2025-01-15',expires:'2027-01-15',status:'APPROVED', entity:'ENTERPRISE'},
  {id:'DOC-003',type:'INSURANCE',    label:'Assurance commerciale',   number:'INS-COM-001',      issued:'2026-01-15',expires:'2027-01-15',status:'APPROVED', entity:'ENTERPRISE'},
  {id:'DOC-004',type:'DRIVER_LIC',   label:'Permis chauffeur',        number:'DL-QC-0001',       issued:'2024-06-01',expires:'2028-06-01',status:'APPROVED', entity:'DRV-QC-0001'},
  {id:'DOC-005',type:'DRIVER_LIC',   label:'Permis chauffeur',        number:'DL-QC-0004',       issued:'2022-09-01',expires:'2026-09-30',status:'EXPIRING', entity:'DRV-QC-0004'},
  {id:'DOC-006',type:'DRIVER_LIC',   label:'Permis chauffeur',        number:'DL-QC-0005',       issued:'2021-03-01',expires:'2026-03-01',status:'EXPIRED',  entity:'DRV-QC-0005'},
  {id:'DOC-007',type:'VEH_INSPECTION',label:'Inspection véhicule',   number:'INSP-TXM-004',     issued:'2025-09-30',expires:'2026-09-30',status:'EXPIRING', entity:'TXM-004'},
]

export const ENT_ACTIVITIES = [
  {id:'ACT-001',type:'TAXI',driverId:'DRV-QC-0001',vehicleId:'TXM-001',provider:'DIRECT',at:'2026-09-18T10:30:00Z',origin:'Montréal-Nord',dest:'YUL',dist:22.4,dur:28,fare:42.50,tip:5.00,status:'COMPLETED',txId:'TX-001'},
  {id:'ACT-002',type:'TAXI',driverId:'DRV-QC-0001',vehicleId:'TXM-001',provider:'DIRECT',at:'2026-09-18T09:10:00Z',origin:'Plateau',       dest:'Centre-ville',dist:4.8, dur:12,fare:18.75,tip:2.00,status:'COMPLETED',txId:'TX-002'},
  {id:'ACT-003',type:'RIDESHARE',driverId:'DRV-QC-0002',vehicleId:'TXM-002',provider:'UBER DEMO',at:'2026-09-18T08:30:00Z',origin:'Mile-End',dest:'Westmount',dist:5.2,dur:14,fare:22.50,tip:3.00,status:'COMPLETED',txId:'TX-003'},
  {id:'ACT-004',type:'TAXI',driverId:'DRV-QC-0003',vehicleId:'TXM-003',provider:'DIRECT',at:'2026-09-18T07:45:00Z',origin:'Rosemont',      dest:'Plateau',     dist:3.1, dur:9, fare:14.00,tip:1.50,status:'COMPLETED',txId:'TX-004'},
  {id:'ACT-005',type:'TAXI',driverId:'DRV-QC-0004',vehicleId:'TXM-004',provider:'DIRECT',at:'2026-09-17T22:00:00Z',origin:'Centre-ville',  dest:'Outremont',   dist:4.5, dur:11,fare:16.50,tip:0,   status:'COMPLETED',txId:'TX-005'},
]

export const ENT_TRANSACTIONS = [
  {id:'TX-001',actId:'ACT-001',driverId:'DRV-QC-0001',gross:42.50,fees:r2(42.50*0.08),tip:5.00,tps:r2(42.50*TPS),tvq:r2(42.50*TVQ),adj:0,refund:0,driverAmt:r2(42.50*0.80),entAmt:r2(42.50*0.20),status:'RECONCILED',source:'TAXIMETER',at:'2026-09-18T10:32:00Z'},
  {id:'TX-002',actId:'ACT-002',driverId:'DRV-QC-0001',gross:18.75,fees:r2(18.75*0.08),tip:2.00,tps:r2(18.75*TPS),tvq:r2(18.75*TVQ),adj:0,refund:0,driverAmt:r2(18.75*0.80),entAmt:r2(18.75*0.20),status:'RECONCILED',source:'TAXIMETER',at:'2026-09-18T09:12:00Z'},
  {id:'TX-003',actId:'ACT-003',driverId:'DRV-QC-0002',gross:22.50,fees:r2(22.50*0.08),tip:3.00,tps:r2(22.50*TPS),tvq:r2(22.50*TVQ),adj:0,refund:0,driverAmt:r2(22.50*0.80),entAmt:r2(22.50*0.20),status:'RECONCILED',source:'WEBHOOK',at:'2026-09-18T08:32:00Z'},
  {id:'TX-004',actId:'ACT-004',driverId:'DRV-QC-0003',gross:14.00,fees:r2(14.00*0.08),tip:1.50,tps:r2(14.00*TPS),tvq:r2(14.00*TVQ),adj:0,refund:0,driverAmt:r2(14.00*0.80),entAmt:r2(14.00*0.20),status:'VALIDATED',source:'TAXIMETER',at:'2026-09-18T07:47:00Z'},
  {id:'TX-005',actId:'ACT-005',driverId:'DRV-QC-0004',gross:16.50,fees:r2(16.50*0.08),tip:0,   tps:r2(16.50*TPS),tvq:r2(16.50*TVQ),adj:0,refund:0,driverAmt:r2(16.50*0.80),entAmt:r2(16.50*0.20),status:'EXCEPTION',source:'TAXIMETER',at:'2026-09-17T22:02:00Z'},
]

const GROSS_Q3 = 412_800
export const REVENUE = {
  grossQ3:GROSS_Q3, tips:r2(GROSS_Q3*0.10), fees:r2(GROSS_Q3*0.08),
  adj:-1240, refunds:-820,
  netQ3:r2(GROSS_Q3*0.84), driverQ3:r2(GROSS_Q3*0.78), entQ3:r2(GROSS_Q3*0.22),
  tpsQ3:r2(GROSS_Q3*TPS), tvqQ3:r2(GROSS_Q3*TVQ),
}

export const FISCAL_PERIODS = [
  {period:'Q1 2026',gross:136_800,tps:r2(136_800*TPS),tvq:r2(136_800*TVQ),tpsPaid:r2(136_800*TPS*0.98),tvqPaid:r2(136_800*TVQ*0.98),status:'CLOSED',  declRef:'DAS-2026-Q1-001'},
  {period:'Q2 2026',gross:144_480,tps:r2(144_480*TPS),tvq:r2(144_480*TVQ),tpsPaid:r2(144_480*TPS),      tvqPaid:r2(144_480*TVQ),      status:'CLOSED',  declRef:'DAS-2026-Q2-001'},
  {period:'Q3 2026',gross:GROSS_Q3,tps:r2(GROSS_Q3*TPS),tvq:r2(GROSS_Q3*TVQ),tpsPaid:0,                tvqPaid:0,                    status:'OPEN',    declRef:null},
]

export const OBLIGATIONS = [
  {id:'OBL-Q1',period:'Q1 2026',type:'TPS/TVQ',due:'2026-04-30',amount:r2(136_800*(TPS+TVQ)*0.98),status:'PAID',    paidAt:'2026-04-28'},
  {id:'OBL-Q2',period:'Q2 2026',type:'TPS/TVQ',due:'2026-07-31',amount:r2(144_480*(TPS+TVQ)),     status:'PAID',    paidAt:'2026-07-30'},
  {id:'OBL-Q3',period:'Q3 2026',type:'TPS/TVQ',due:'2026-10-31',amount:r2(GROSS_Q3*(TPS+TVQ)),    status:'UPCOMING',paidAt:null},
]

export const CONNECTIONS = [
  {id:'CONN-001',provider:'API TAXIMETER.GOV',method:'OAuth',  status:'CONNECTED',   lastSync:'2026-09-18T10:38:00Z',dataRx:9840,errors:0, health:100,scopes:['read:trips','write:ledger','read:tax']},
  {id:'CONN-002',provider:'TAXIMÈTRE DIRECT', method:'Device', status:'CONNECTED',   lastSync:'2026-09-18T10:32:00Z',dataRx:4820,errors:0, health:99, scopes:['trips','payments']},
  {id:'CONN-003',provider:'UBER DEMO',         method:'Webhook',status:'SIMULATION',  lastSync:'2026-09-18T10:00:00Z',dataRx:840, errors:0, health:95, scopes:['trips']},
]

export const NOTIFICATIONS = [
  {id:'NOTIF-001',type:'WARNING', title:'Permis DRV-QC-0004 expire bientôt',         desc:'Permis de conduire expire le 2026-09-30.',    at:'2026-09-17T10:00:00Z',read:false},
  {id:'NOTIF-002',type:'CRITICAL',title:'Inspection TXM-004 expirée',                desc:'Inspection du véhicule TXM-004 a expiré.',    at:'2026-09-18T08:00:00Z',read:false},
  {id:'NOTIF-003',type:'INFO',    title:'Déclaration Q3 à préparer',                  desc:'Échéance: 2026-10-31.',                        at:'2026-09-18T07:00:00Z',read:true},
  {id:'NOTIF-004',type:'SUCCESS', title:'Synchronisation TAXIMETER.GOV complétée',   desc:'9 840 enregistrements synchronisés.',          at:'2026-09-18T10:38:00Z',read:true},
]

export const ROLE_CONF: Record<string,{label:string;color:string;perms:string[]}> = {
  OWNER:      {label:'Propriétaire',       color:'#003DA5',perms:['ALL']},
  FINANCE:    {label:'Responsable financier',color:'#7C3AED',perms:['revenue','tax','declarations','payments']},
  DISPATCH:   {label:'Répartiteur',        color:'#059669',perms:['drivers','vehicles','activities']},
  COMPLIANCE: {label:'Conformité',         color:'#B45309',perms:['documents','compliance','exceptions']},
  VIEWER:     {label:'Lecteur',            color:'#64748B',perms:['read']},
}
export const DOC_STATUS: Record<string,{label:string;color:string;bg:string}> = {
  APPROVED: {label:'Approuvé',    color:'#059669',bg:'rgba(5,150,105,0.12)'},
  EXPIRING: {label:'Expirant',    color:'#B45309',bg:'rgba(180,83,9,0.10)'},
  EXPIRED:  {label:'Expiré',      color:'#DC2626',bg:'rgba(220,38,38,0.10)'},
  PENDING:  {label:'En attente',  color:'#003DA5',bg:'rgba(0,61,165,0.10)'},
  REJECTED: {label:'Refusé',      color:'#DC2626',bg:'rgba(220,38,38,0.10)'},
}
export const TX_STATUS: Record<string,{label:string;color:string;bg:string}> = {
  RECONCILED:{label:'Réconciliée',color:'#059669',bg:'rgba(5,150,105,0.12)'},
  VALIDATED: {label:'Validée',    color:'#003DA5',bg:'rgba(0,61,165,0.10)'},
  EXCEPTION: {label:'Exception',  color:'#DC2626',bg:'rgba(220,38,38,0.10)'},
  PENDING:   {label:'En attente', color:'#B45309',bg:'rgba(180,83,9,0.10)'},
}
export const CONN_STATUS: Record<string,{label:string;color:string;dot:string}> = {
  CONNECTED:  {label:'Connecté',   color:'#059669',dot:'bg-green-500'},
  SIMULATION: {label:'Simulation', color:'#B45309',dot:'bg-amber-400'},
  ERROR:      {label:'Erreur',     color:'#DC2626',dot:'bg-red-500'},
  PENDING:    {label:'En attente', color:'#003DA5',dot:'bg-blue-400'},
}
export const OBL_STATUS: Record<string,{label:string;color:string;bg:string}> = {
  PAID:    {label:'Payée',    color:'#059669',bg:'rgba(5,150,105,0.12)'},
  UPCOMING:{label:'À venir',  color:'#003DA5',bg:'rgba(0,61,165,0.10)'},
  OVERDUE: {label:'En retard',color:'#DC2626',bg:'rgba(220,38,38,0.10)'},
}
export const NAV_SECTIONS = [
  {section:'🏠 Tableau de bord', items:[
    {href:'/',                label:'Dashboard'},
    {href:'/control-center',  label:'🎛️ Control Center'},
  ]},
  {section:'🏢 Organisation', items:[
    {href:'/onboarding',       label:'⚙️ Configuration'},
    {href:'/departments',      label:'Départements'},
    {href:'/profile',          label:'Profil entreprise'},
    {href:'/users',            label:'Utilisateurs'},
    {href:'/documents',        label:'Documents'},
  ]},
  {section:'🚕 Opérations', items:[
    {href:'/services',         label:'Services & Depts'},
    {href:'/operations',       label:'Centre opérations'},
    {href:'/drivers',          label:'Chauffeurs'},
    {href:'/vehicles',         label:'Véhicules'},
    {href:'/activities',       label:'Activités'},
    {href:'/taximeter',        label:'Taximètre'},
  ]},
  {section:'💰 Finance & Fiscal', items:[
    {href:'/transactions',     label:'Transactions'},
    {href:'/revenue',          label:'Revenus'},
    {href:'/fiscal',           label:'TPS / TVQ'},
    {href:'/obligations',      label:'Obligations'},
    {href:'/declarations',     label:'Déclarations'},
    {href:'/payments',         label:'Paiements'},
  ]},
  {section:'🔌 Connexions & Gov.', items:[
    {href:'/government',       label:'🏛️ Gouvernement'},
    {href:'/connections',      label:'Connexions'},
    {href:'/integrations',     label:'API & Webhooks'},
    {href:'/sync',             label:'Synchronisation'},
    {href:'/transparency',     label:'Transparence'},
  ]},
  {section:'🔄 Conformité & Recon.', items:[
    {href:'/compliance',       label:'Conformité'},
    {href:'/reconciliation',   label:'Réconciliation'},
    {href:'/exceptions',       label:'Exceptions'},
  ]},
  {section:'📊 Intelligence', items:[
    {href:'/analytics',        label:'Analytics'},
    {href:'/intelligence',     label:'Intelligence'},
    {href:'/reports',          label:'Rapports'},
    {href:'/financial-documents',label:'Docs financiers'},
  ]},
  {section:'🛡️ Sécurité & Audit', items:[
    {href:'/security',         label:'Sécurité & Gov.'},
    {href:'/audit',            label:'Journal d\'audit'},
    {href:'/notifications',    label:'Notifications'},
    {href:'/validation',       label:'✅ Validation E2E'},
    {href:'/simulation',      label:'🏛️ Simulation Gov.'},
    {href:'/integration-tests', label:'🧪 Tests Intégration'},
    {href:'/security-report',   label:'🔐 Sécurité'},
    {href:'/sync-monitor',      label:'🔄 Synchronisation'},
    {href:'/demo',              label:'🎬 Demo Center'},
    {href:'/executive-report',  label:'📊 Rapport Exécutif'},
    {href:'/phase-37-report',   label:'🧪 Rapport E2E Ph.37'},
    {href:'/phase-38-report',   label:'📋 Rapport Ph.38'},
    {href:'/phase-39-report',   label:'📋 Rapport Ph.39'},
  ]},
]

// ── REPRÉSENTANTS ─────────────────────────────────────────────
// ⚠️ REPRÉSENTANTS FICTIFS — DÉMONSTRATION TAXIMETER.GOV — UBER CANADA DEMO
export const ENT_REPRESENTATIVES = [
  {id:'REP-001',firstName:'Sophie',   lastName:'Marchand',  role:'OWNER',      email:'s.marchand@uber-demo.taximetergov.demo',   phone:'(514) 555-0001',status:'ACTIVE', addedAt:'2026-01-15',lastLogin:'2026-09-18T08:02:00Z'},
  {id:'REP-002',firstName:'Jean-Philippe',lastName:'Roy',   role:'FINANCE',    email:'jp.roy@uber-demo.taximetergov.demo',        phone:'(514) 555-0002',status:'ACTIVE', addedAt:'2026-01-15',lastLogin:'2026-09-17T14:00:00Z'},
  {id:'REP-003',firstName:'Karim',    lastName:'Benali',    role:'DISPATCH',   email:'k.benali@uber-demo.taximetergov.demo',      phone:'(514) 555-0003',status:'ACTIVE', addedAt:'2026-02-01',lastLogin:'2026-09-18T07:30:00Z'},
  {id:'REP-004',firstName:'Marie-Ève',lastName:'Lapointe',  role:'VIEWER',     email:'me.lapointe@uber-demo.taximetergov.demo',   phone:'(514) 555-0004',status:'ACTIVE', addedAt:'2026-03-15',lastLogin:'2026-09-16T10:00:00Z'},
  {id:'REP-005',firstName:'David',    lastName:'Chen',      role:'COMPLIANCE', email:'d.chen@uber-demo.taximetergov.demo',        phone:'(514) 555-0005',status:'PENDING',addedAt:'2026-09-10',lastLogin:null},
]

// ── PERMISSIONS MATRICE ───────────────────────────────────────
// ── AUDIT LOG DEMO ────────────────────────────────────────────
export const AUDIT_LOG = [
  {id:'AL-001',at:'2026-09-18T10:38:00Z',user:'Sophie Marchand',    role:'OWNER',    action:'SYNC_COMPLETED',    obj:'Revenue Ledger',   result:'OK',   note:'9840 enregistrements synchronisés'},
  {id:'AL-002',at:'2026-09-18T08:00:00Z',user:'SYSTEM',           role:'SYSTEM',   action:'DOCUMENT_FLAGGED',  obj:'DOC-007',          result:'WARN', note:'Inspection TXM-004 expirée'},
  {id:'AL-003',at:'2026-09-17T14:00:00Z',user:'Louise Côté',      role:'FINANCE',  action:'DECLARATION_VIEWED',obj:'OBL-Q3',           result:'OK',   note:'Consultation obligations Q3'},
  {id:'AL-004',at:'2026-09-16T10:00:00Z',user:'Sophie Tran',      role:'VIEWER',   action:'DASHBOARD_VIEWED',  obj:'Dashboard',        result:'OK',   note:'Connexion et consultation'},
  {id:'AL-005',at:'2026-09-15T09:00:00Z',user:'Sophie Marchand',    role:'OWNER',    action:'DRIVER_UPDATED',    obj:'DRV-QC-0004',      result:'OK',   note:'Statut mis à jour'},
  {id:'AL-006',at:'2026-09-10T11:00:00Z',user:'Sophie Marchand',    role:'OWNER',    action:'USER_INVITED',      obj:'d.chen@uber-demo.taximetergov.demo',result:'OK',note:'Invitation envoyée — rôle COMPLIANCE'},
  {id:'AL-007',at:'2026-09-01T08:00:00Z',user:'SYSTEM',           role:'SYSTEM',   action:'OBLIGATION_CREATED',obj:'OBL-Q3',           result:'OK',   note:'Obligation Q3 générée automatiquement'},
  {id:'AL-008',at:'2026-07-30T16:00:00Z',user:'Louise Côté',      role:'FINANCE',  action:'PAYMENT_SUBMITTED', obj:'OBL-Q2',           result:'OK',   note:'Paiement TPS/TVQ Q2 soumis'},
]

// ── ACTIVITY HISTORY RECENT ───────────────────────────────────
export const RECENT_EVENTS = [
  {at:'2026-09-18T10:38:00Z',icon:'🔄',title:'Synchronisation complétée',desc:'9 840 enregistrements · TAXIMETER.GOV',type:'SYNC'},
  {at:'2026-09-18T10:32:00Z',icon:'💳',title:'Transaction reçue',        desc:'TX-001 · Jean Tremblay · 42,50 $',    type:'TRANSACTION'},
  {at:'2026-09-18T09:12:00Z',icon:'💳',title:'Transaction reçue',        desc:'TX-002 · Jean Tremblay · 18,75 $',    type:'TRANSACTION'},
  {at:'2026-09-18T08:32:00Z',icon:'💳',title:'Transaction reçue',        desc:'TX-003 · Marie Gagnon · 22,50 $',     type:'TRANSACTION'},
  {at:'2026-09-18T08:00:00Z',icon:'⚠️','title':'Document expiré détecté',desc:'Inspection TXM-004 — action requise', type:'ALERT'},
  {at:'2026-09-17T10:00:00Z',icon:'🔔','title':'Permis expirant',        desc:'DRV-QC-0004 — expire 2026-09-30',     type:'WARNING'},
  {at:'2026-09-16T10:00:00Z',icon:'👤','title':'Connexion utilisateur',  desc:'Sophie Tran · Lecteur',               type:'AUTH'},
  {at:'2026-09-15T09:00:00Z',icon:'👤','title':'Chauffeur mis à jour',   desc:'DRV-QC-0004 · Statut modifié',        type:'DRIVER'},
]

// ── MONTHLY ANALYTICS ─────────────────────────────────────────
export const MONTHLY = [
  {m:'Avr',acts:1240,gross:27_776},
  {m:'Mai',acts:1380,gross:30_912},
  {m:'Juin',acts:1520,gross:34_048},
  {m:'Juil',acts:1680,gross:37_632},
  {m:'Août',acts:1820,gross:40_768},
  {m:'Sep', acts:1182,gross:26_476},
]

// ── DRIVERS ENRICHIS ──────────────────────────────────────────
export const DRIVER_DETAIL: Record<string, {email:string;phone:string;address:string;joined:string;syncStatus:string;lastSync:string|null;externalRef:string|null;docsStatus:string;complianceScore:number;history:Array<{at:string;action:string;note:string}>}> = {
  'DRV-QC-0001': {email:'jean.tremblay.demo@uber-demo.taximetergov.demo',phone:'(514) 555-1001',address:'123 rue Beaubien, Montréal QC H2S 1Y3',joined:'2026-01-15',syncStatus:'CONNECTED',lastSync:'2026-09-18T10:32:00Z',externalRef:'TAXGOV-DRV-001',docsStatus:'OK',complianceScore:98,history:[{at:'2026-01-15T09:00:00Z',action:'DRIVER_ASSOCIATED',note:'Chauffeur associé à Uber QC (DEMO)'},{at:'2026-03-10T10:00:00Z',action:'VEHICLE_ASSIGNED',note:'TXM-001 assigné'},{at:'2026-09-18T10:32:00Z',action:'SYNC_COMPLETED',note:'Synchronisation TAXIMETER.GOV réussie'}]},
  'DRV-QC-0002': {email:'marie.gagnon.demo@uber-demo.taximetergov.demo',phone:'(514) 555-1002',address:'456 av. du Mont-Royal, Montréal QC H2T 2S5',joined:'2026-01-15',syncStatus:'CONNECTED',lastSync:'2026-09-18T08:32:00Z',externalRef:'TAXGOV-DRV-002',docsStatus:'OK',complianceScore:96,history:[{at:'2026-01-15T09:10:00Z',action:'DRIVER_ASSOCIATED',note:'Chauffeur associé'},{at:'2026-09-18T08:32:00Z',action:'SYNC_COMPLETED',note:'Sync réussie'}]},
  'DRV-QC-0003': {email:'karim.hassan.demo@uber-demo.taximetergov.demo',phone:'(514) 555-1003',address:'789 rue Saint-Denis, Montréal QC H2J 2L9',joined:'2026-02-01',syncStatus:'CONNECTED',lastSync:'2026-09-18T07:47:00Z',externalRef:'TAXGOV-DRV-003',docsStatus:'OK',complianceScore:94,history:[{at:'2026-02-01T10:00:00Z',action:'DRIVER_ASSOCIATED',note:'Sous-traitant associé'}]},
  'DRV-QC-0004': {email:'ali.bouchard.demo@uber-demo.taximetergov.demo',phone:'(514) 555-1004',address:'321 boul. Saint-Laurent, Montréal QC H2X 2T4',joined:'2026-02-15',syncStatus:'PENDING',lastSync:'2026-09-17T22:02:00Z',externalRef:'TAXGOV-DRV-004',docsStatus:'EXPIRING',complianceScore:72,history:[{at:'2026-02-15T10:00:00Z',action:'DRIVER_ASSOCIATED',note:'Sous-traitant associé'},{at:'2026-09-17T08:00:00Z',action:'DOCUMENT_FLAGGED',note:'Permis expire 2026-09-30'}]},
  'DRV-QC-0005': {email:'nadia.patel.demo@uber-demo.taximetergov.demo',phone:'(514) 555-1005',address:'654 rue Sherbrooke O., Montréal QC H3A 1E3',joined:'2026-03-01',syncStatus:'ERROR',lastSync:null,externalRef:null,docsStatus:'EXPIRED',complianceScore:40,history:[{at:'2026-03-01T10:00:00Z',action:'DRIVER_ASSOCIATED',note:'Employée associée'},{at:'2026-06-01T08:00:00Z',action:'DOCUMENT_EXPIRED',note:'Permis expiré'},{at:'2026-06-02T09:00:00Z',action:'DRIVER_SUSPENDED',note:'Suspension suite expiration permis'}]},
  'DRV-QC-0006': {email:'marc.leblanc.demo@uber-demo.taximetergov.demo',phone:'(514) 555-1006',address:'987 rue Papineau, Montréal QC H2K 4K6',joined:'2026-01-20',syncStatus:'CONNECTED',lastSync:'2026-09-18T07:00:00Z',externalRef:'TAXGOV-DRV-006',docsStatus:'OK',complianceScore:95,history:[{at:'2026-01-20T10:00:00Z',action:'DRIVER_ASSOCIATED',note:'Employé associé'},{at:'2026-09-18T07:00:00Z',action:'SYNC_COMPLETED',note:'Sync OK'}]},
}

// ── VEHICLES ENRICHIS ─────────────────────────────────────────
export const VEHICLE_DETAIL: Record<string,{color:string;useType:string;taximeterId:string|null;syncStatus:string;lastSync:string|null;complianceScore:number;history:Array<{at:string;action:string;note:string}>}> = {
  'TXM-001': {color:'Blanc',useType:'TAXI',    taximeterId:'TXM-DEMO-001',syncStatus:'CONNECTED',  lastSync:'2026-09-18T10:32:00Z',complianceScore:100,history:[{at:'2026-01-15T09:00:00Z',action:'VEHICLE_REGISTERED',note:'Enregistré'},{at:'2026-01-15T09:30:00Z',action:'DRIVER_ASSIGNED',note:'DRV-QC-0001 assigné'},{at:'2026-09-18T10:32:00Z',action:'SYNC_COMPLETED',note:'Sync TAXIMETER.GOV'}]},
  'TXM-002': {color:'Argent',useType:'RIDESHARE',taximeterId:'TXM-DEMO-002',syncStatus:'CONNECTED',  lastSync:'2026-09-18T08:32:00Z',complianceScore:96,history:[{at:'2026-01-15T09:10:00Z',action:'VEHICLE_REGISTERED',note:'Enregistré'},{at:'2026-01-16T10:00:00Z',action:'DRIVER_ASSIGNED',note:'DRV-QC-0002 assigné'}]},
  'TXM-003': {color:'Gris',  useType:'TAXI',    taximeterId:'TXM-DEMO-003',syncStatus:'CONNECTED',  lastSync:'2026-09-18T07:47:00Z',complianceScore:94,history:[{at:'2026-02-01T10:00:00Z',action:'VEHICLE_REGISTERED',note:'Enregistré'}]},
  'TXM-004': {color:'Bleu',  useType:'TAXI',    taximeterId:'TXM-DEMO-004',syncStatus:'PENDING',    lastSync:'2026-09-15T14:00:00Z',complianceScore:70,history:[{at:'2026-02-15T10:00:00Z',action:'VEHICLE_REGISTERED',note:'Enregistré'},{at:'2026-09-15T14:00:00Z',action:'MAINTENANCE_START',note:'Mise en maintenance'}]},
  'TXM-005': {color:'Noir',  useType:'TAXI',    taximeterId:null,           syncStatus:'PENDING',    lastSync:null,                  complianceScore:80,history:[{at:'2026-04-01T10:00:00Z',action:'VEHICLE_REGISTERED',note:'Enregistré — sans taximètre installé'}]},
  'TXM-006': {color:'Blanc', useType:'TAXI',    taximeterId:'TXM-DEMO-006',syncStatus:'CONNECTED',  lastSync:'2026-09-18T07:00:00Z',complianceScore:95,history:[{at:'2026-01-20T10:00:00Z',action:'VEHICLE_REGISTERED',note:'Enregistré'},{at:'2026-01-20T10:30:00Z',action:'DRIVER_ASSIGNED',note:'DRV-QC-0006 assigné'}]},
}

// ── DOCUMENTS ENRICHIS ────────────────────────────────────────
export const ENT_DOCS_FULL = [
  {id:'DOC-001',type:'NEQ',          label:'Numéro entreprise QC',        number:'1234567890',       issued:'2024-01-01',expires:null,        status:'APPROVED',ownerType:'ENTERPRISE',ownerId:'ENT-DEMO-001',uploadedAt:'2026-01-15T09:00:00Z',verifiedAt:'2026-01-16T10:00:00Z',verifiedBy:'Admin GOV',rejectionReason:null,version:1,syncStatus:'CONNECTED',note:'Document fondateur'},
  {id:'DOC-002',type:'LICENSE',      label:'Permis taxi CTQ',             number:'LIC-TAXI-CTQ-001', issued:'2025-01-15',expires:'2027-01-15',status:'APPROVED',ownerType:'ENTERPRISE',ownerId:'ENT-DEMO-001',uploadedAt:'2026-01-15T09:05:00Z',verifiedAt:'2026-01-20T14:00:00Z',verifiedBy:'Admin GOV',rejectionReason:null,version:1,syncStatus:'CONNECTED',note:'Permis d\'exploitation taxi'},
  {id:'DOC-003',type:'INSURANCE',    label:'Assurance commerciale',       number:'INS-COM-001',      issued:'2026-01-15',expires:'2027-01-15',status:'APPROVED',ownerType:'ENTERPRISE',ownerId:'ENT-DEMO-001',uploadedAt:'2026-01-15T09:10:00Z',verifiedAt:'2026-01-21T10:00:00Z',verifiedBy:'Admin GOV',rejectionReason:null,version:2,syncStatus:'CONNECTED',note:'Renouvellement annuel'},
  {id:'DOC-004',type:'DRIVER_LIC',   label:'Permis de conduire',         number:'DL-QC-0001',       issued:'2024-06-01',expires:'2028-06-01',status:'APPROVED',ownerType:'DRIVER',    ownerId:'DRV-QC-0001',uploadedAt:'2026-01-15T09:20:00Z',verifiedAt:'2026-01-17T11:00:00Z',verifiedBy:'Admin GOV',rejectionReason:null,version:1,syncStatus:'CONNECTED',note:null},
  {id:'DOC-005',type:'DRIVER_LIC',   label:'Permis de conduire',         number:'DL-QC-0004',       issued:'2022-09-01',expires:'2026-09-30',status:'EXPIRING',ownerType:'DRIVER',    ownerId:'DRV-QC-0004',uploadedAt:'2026-02-15T10:00:00Z',verifiedAt:'2026-02-16T09:00:00Z',verifiedBy:'Admin GOV',rejectionReason:null,version:1,syncStatus:'CONNECTED',note:'Expire dans 12 jours — renouvellement urgent'},
  {id:'DOC-006',type:'DRIVER_LIC',   label:'Permis de conduire',         number:'DL-QC-0005',       issued:'2021-03-01',expires:'2026-03-01',status:'EXPIRED',  ownerType:'DRIVER',    ownerId:'DRV-QC-0005',uploadedAt:'2026-03-01T10:00:00Z',verifiedAt:'2026-03-02T09:00:00Z',verifiedBy:'Admin GOV',rejectionReason:null,version:1,syncStatus:'ERROR',  note:'Expiré depuis 2026-03-01 — chauffeur suspendu'},
  {id:'DOC-007',type:'VEH_INSPECTION',label:'Inspection véhicule',       number:'INSP-TXM-004',     issued:'2025-09-30',expires:'2026-09-30',status:'EXPIRING', ownerType:'VEHICLE',   ownerId:'TXM-004',    uploadedAt:'2025-09-30T10:00:00Z',verifiedAt:'2025-10-01T09:00:00Z',verifiedBy:'Admin GOV',rejectionReason:null,version:1,syncStatus:'CONNECTED',note:'Expire dans 12 jours'},
  {id:'DOC-008',type:'VEH_INSURANCE',label:'Assurance véhicule TXM-003',number:'INS-VEH-003',      issued:'2025-11-30',expires:'2026-11-30',status:'APPROVED', ownerType:'VEHICLE',   ownerId:'TXM-003',    uploadedAt:'2025-11-30T10:00:00Z',verifiedAt:'2025-12-01T09:00:00Z',verifiedBy:'Admin GOV',rejectionReason:null,version:1,syncStatus:'CONNECTED',note:null},
  {id:'DOC-009',type:'DRIVER_PRO',   label:'Permis chauffeur professionnel',number:'PCPRO-QC-0002', issued:'2024-08-01',expires:'2026-08-01',status:'APPROVED',ownerType:'DRIVER',    ownerId:'DRV-QC-0002',uploadedAt:'2026-01-15T09:25:00Z',verifiedAt:'2026-01-18T10:00:00Z',verifiedBy:'Admin GOV',rejectionReason:null,version:1,syncStatus:'CONNECTED',note:null},
]

// ── SYNC STATUS CONF ──────────────────────────────────────────
export const SYNC_STATUS: Record<string,{label:string;color:string;dot:string}> = {
  CONNECTED:    {label:'Synchronisé',  color:'#059669',dot:'bg-green-500'},
  PENDING:      {label:'En attente',   color:'#B45309', dot:'bg-amber-400 animate-pulse'},
  ERROR:        {label:'Erreur sync',  color:'#DC2626', dot:'bg-red-500'},
  DISCONNECTED: {label:'Non connecté', color:'#64748B',dot:'bg-slate-400'},
  DEMO:         {label:'DEMO',         color:'#7C3AED',dot:'bg-purple-400'},
}

// ── ACTIVITÉS ÉTENDUES (10 activités DEMO) ───────────────────

export const ALL_ACTIVITIES = [
  {id:'ACT-ENT-001',extRef:'TAXGOV-ACT-001',type:'TAXI',     provider:'DIRECT',       driverId:'DRV-QC-0001',vehicleId:'TXM-001',at:'2026-09-18T10:30:00Z',origin:'Montréal-Nord',dest:'YUL',      dist:22.4,dur:28,wait:3,  fare:42.50,tip:5.00,tps:r2(42.50*TPS),tvq:r2(42.50*TVQ),fees:r2(42.50*0.08),driverAmt:r2(42.50*0.80),status:'COMPLETED',syncStatus:'SYNCED',  txId:'TX-ENT-001'},
  {id:'ACT-ENT-002',extRef:'TAXGOV-ACT-002',type:'TAXI',     provider:'DIRECT',       driverId:'DRV-QC-0001',vehicleId:'TXM-001',at:'2026-09-18T09:10:00Z',origin:'Plateau',     dest:'Centre-ville',dist:4.8, dur:12,wait:1,  fare:18.75,tip:2.00,tps:r2(18.75*TPS),tvq:r2(18.75*TVQ),fees:r2(18.75*0.08),driverAmt:r2(18.75*0.80),status:'COMPLETED',syncStatus:'SYNCED',  txId:'TX-ENT-002'},
  {id:'ACT-ENT-003',extRef:'UBER-ACT-8421', type:'RIDESHARE',provider:'UBER DEMO',    driverId:'DRV-QC-0002',vehicleId:'TXM-002',at:'2026-09-18T08:30:00Z',origin:'Mile-End',    dest:'Westmount',   dist:5.2, dur:14,wait:0,  fare:22.50,tip:3.00,tps:r2(22.50*TPS),tvq:r2(22.50*TVQ),fees:r2(22.50*0.25),driverAmt:r2(22.50*0.72),status:'COMPLETED',syncStatus:'SYNCED',  txId:'TX-ENT-003'},
  {id:'ACT-ENT-004',extRef:'TAXGOV-ACT-004',type:'TAXI',     provider:'DIRECT',       driverId:'DRV-QC-0003',vehicleId:'TXM-003',at:'2026-09-18T07:45:00Z',origin:'Rosemont',    dest:'Plateau',     dist:3.1, dur:9, wait:0,  fare:14.00,tip:1.50,tps:r2(14.00*TPS),tvq:r2(14.00*TVQ),fees:r2(14.00*0.08),driverAmt:r2(14.00*0.80),status:'COMPLETED',syncStatus:'SYNCED',  txId:'TX-ENT-004'},
  {id:'ACT-ENT-005',extRef:'TAXGOV-ACT-005',type:'TAXI',     provider:'DIRECT',       driverId:'DRV-QC-0004',vehicleId:'TXM-004',at:'2026-09-17T22:00:00Z',origin:'Centre-ville',dest:'Outremont',   dist:4.5, dur:11,wait:2,  fare:16.50,tip:0,   tps:r2(16.50*TPS),tvq:r2(16.50*TVQ),fees:r2(16.50*0.08),driverAmt:r2(16.50*0.80),status:'COMPLETED',syncStatus:'PENDING', txId:'TX-ENT-005'},
  {id:'ACT-ENT-006',extRef:'UBER-ACT-9103', type:'RIDESHARE',provider:'UBER DEMO',    driverId:'DRV-QC-0002',vehicleId:'TXM-002',at:'2026-09-17T18:15:00Z',origin:'NDG',         dest:'Côte-des-Neiges',dist:3.8,dur:10,wait:0,fare:19.00,tip:2.50,tps:r2(19.00*TPS),tvq:r2(19.00*TVQ),fees:r2(19.00*0.25),driverAmt:r2(19.00*0.72),status:'COMPLETED',syncStatus:'SYNCED',  txId:'TX-ENT-006'},
  {id:'ACT-ENT-007',extRef:'LYFT-ACT-5521', type:'RIDESHARE',provider:'LYFT DEMO',    driverId:'DRV-QC-0003',vehicleId:'TXM-003',at:'2026-09-17T16:00:00Z',origin:'Verdun',      dest:'LaSalle',     dist:6.2, dur:16,wait:1,  fare:21.00,tip:0,   tps:r2(21.00*TPS),tvq:r2(21.00*TVQ),fees:r2(21.00*0.22),driverAmt:r2(21.00*0.75),status:'COMPLETED',syncStatus:'SYNCED',  txId:'TX-ENT-007'},
  {id:'ACT-ENT-008',extRef:'TAXGOV-ACT-008',type:'TAXI',     provider:'DIRECT',       driverId:'DRV-QC-0006',vehicleId:'TXM-006',at:'2026-09-17T14:30:00Z',origin:'Ahuntsic',    dest:'Montréal-Nord',dist:7.1,dur:18,wait:0, fare:24.50,tip:3.00,tps:r2(24.50*TPS),tvq:r2(24.50*TVQ),fees:r2(24.50*0.08),driverAmt:r2(24.50*0.80),status:'COMPLETED',syncStatus:'SYNCED',  txId:'TX-ENT-008'},
  {id:'ACT-ENT-009',extRef:'UBER-EATS-7710', type:'DELIVERY', provider:'UBER EATS DEMO',driverId:'DRV-QC-0006',vehicleId:'TXM-006',at:'2026-09-17T12:00:00Z',origin:'Restaurant DEMO',dest:'Client DEMO',dist:3.5,dur:14,wait:5,fare:12.00,tip:2.00,tps:r2(12.00*TPS),tvq:r2(12.00*TVQ),fees:r2(12.00*0.30),driverAmt:r2(12.00*0.65),status:'COMPLETED',syncStatus:'SYNCED',  txId:'TX-ENT-009'},
  {id:'ACT-ENT-010',extRef:'TAXGOV-ACT-010',type:'TAXI',     provider:'DIRECT',       driverId:'DRV-QC-0001',vehicleId:'TXM-001',at:'2026-09-17T08:00:00Z',origin:'Longueuil',   dest:'Montréal',    dist:15.2,dur:22,wait:0, fare:38.00,tip:4.00,tps:r2(38.00*TPS),tvq:r2(38.00*TVQ),fees:r2(38.00*0.08),driverAmt:r2(38.00*0.80),status:'COMPLETED',syncStatus:'SYNCED',  txId:'TX-ENT-010'},
]

// ── TRANSACTIONS ÉTENDUES (15 transactions DEMO) ──────────────
export const ALL_TRANSACTIONS = [
  {id:'TX-ENT-001',actId:'ACT-ENT-001',extId:'TAXGOV-TX-001',provider:'DIRECT',  driverId:'DRV-QC-0001',vehicleId:'TXM-001',gross:42.50,tip:5.00,tps:r2(42.50*TPS),tvq:r2(42.50*TVQ),fees:r2(42.50*0.08),driverAmt:r2(42.50*0.80),entAmt:r2(42.50*0.20),adj:0,   refund:0,   status:'RECONCILED',syncStatus:'SYNCED', at:'2026-09-18T10:32:00Z',recon:'MATCHED'},
  {id:'TX-ENT-002',actId:'ACT-ENT-002',extId:'TAXGOV-TX-002',provider:'DIRECT',  driverId:'DRV-QC-0001',vehicleId:'TXM-001',gross:18.75,tip:2.00,tps:r2(18.75*TPS),tvq:r2(18.75*TVQ),fees:r2(18.75*0.08),driverAmt:r2(18.75*0.80),entAmt:r2(18.75*0.20),adj:0,   refund:0,   status:'RECONCILED',syncStatus:'SYNCED', at:'2026-09-18T09:12:00Z',recon:'MATCHED'},
  {id:'TX-ENT-003',actId:'ACT-ENT-003',extId:'UBER-TX-8421',  provider:'UBER DEMO',driverId:'DRV-QC-0002',vehicleId:'TXM-002',gross:22.50,tip:3.00,tps:r2(22.50*TPS),tvq:r2(22.50*TVQ),fees:r2(22.50*0.25),driverAmt:r2(22.50*0.72),entAmt:r2(22.50*0.03),adj:0,  refund:0,   status:'RECONCILED',syncStatus:'SYNCED', at:'2026-09-18T08:32:00Z',recon:'MATCHED'},
  {id:'TX-ENT-004',actId:'ACT-ENT-004',extId:'TAXGOV-TX-004',provider:'DIRECT',  driverId:'DRV-QC-0003',vehicleId:'TXM-003',gross:14.00,tip:1.50,tps:r2(14.00*TPS),tvq:r2(14.00*TVQ),fees:r2(14.00*0.08),driverAmt:r2(14.00*0.80),entAmt:r2(14.00*0.20),adj:0,   refund:0,   status:'VALIDATED', syncStatus:'SYNCED', at:'2026-09-18T07:47:00Z',recon:'MATCHED'},
  {id:'TX-ENT-005',actId:'ACT-ENT-005',extId:'TAXGOV-TX-005',provider:'DIRECT',  driverId:'DRV-QC-0004',vehicleId:'TXM-004',gross:16.50,tip:0,   tps:r2(16.50*TPS),tvq:r2(16.50*TVQ),fees:r2(16.50*0.08),driverAmt:r2(16.50*0.80),entAmt:r2(16.50*0.20),adj:0,   refund:0,   status:'EXCEPTION', syncStatus:'PENDING',at:'2026-09-17T22:02:00Z',recon:'VARIANCE'},
  {id:'TX-ENT-006',actId:'ACT-ENT-006',extId:'UBER-TX-9103',  provider:'UBER DEMO',driverId:'DRV-QC-0002',vehicleId:'TXM-002',gross:19.00,tip:2.50,tps:r2(19.00*TPS),tvq:r2(19.00*TVQ),fees:r2(19.00*0.25),driverAmt:r2(19.00*0.72),entAmt:r2(19.00*0.03),adj:0,  refund:0,   status:'RECONCILED',syncStatus:'SYNCED', at:'2026-09-17T18:17:00Z',recon:'MATCHED'},
  {id:'TX-ENT-007',actId:'ACT-ENT-007',extId:'LYFT-TX-5521',  provider:'LYFT DEMO',driverId:'DRV-QC-0003',vehicleId:'TXM-003',gross:21.00,tip:0,   tps:r2(21.00*TPS),tvq:r2(21.00*TVQ),fees:r2(21.00*0.22),driverAmt:r2(21.00*0.75),entAmt:r2(21.00*0.03),adj:0,  refund:0,   status:'RECONCILED',syncStatus:'SYNCED', at:'2026-09-17T16:02:00Z',recon:'MATCHED'},
  {id:'TX-ENT-008',actId:'ACT-ENT-008',extId:'TAXGOV-TX-008',provider:'DIRECT',  driverId:'DRV-QC-0006',vehicleId:'TXM-006',gross:24.50,tip:3.00,tps:r2(24.50*TPS),tvq:r2(24.50*TVQ),fees:r2(24.50*0.08),driverAmt:r2(24.50*0.80),entAmt:r2(24.50*0.20),adj:0,   refund:0,   status:'RECONCILED',syncStatus:'SYNCED', at:'2026-09-17T14:32:00Z',recon:'MATCHED'},
  {id:'TX-ENT-009',actId:'ACT-ENT-009',extId:'UBER-EATS-7710', provider:'UBER EATS DEMO',driverId:'DRV-QC-0006',vehicleId:'TXM-006',gross:12.00,tip:2.00,tps:r2(12.00*TPS),tvq:r2(12.00*TVQ),fees:r2(12.00*0.30),driverAmt:r2(12.00*0.65),entAmt:r2(12.00*0.05),adj:0,refund:0,  status:'RECONCILED',syncStatus:'SYNCED', at:'2026-09-17T12:02:00Z',recon:'MATCHED'},
  {id:'TX-ENT-010',actId:'ACT-ENT-010',extId:'TAXGOV-TX-010',provider:'DIRECT',  driverId:'DRV-QC-0001',vehicleId:'TXM-001',gross:38.00,tip:4.00,tps:r2(38.00*TPS),tvq:r2(38.00*TVQ),fees:r2(38.00*0.08),driverAmt:r2(38.00*0.80),entAmt:r2(38.00*0.20),adj:0,   refund:0,   status:'RECONCILED',syncStatus:'SYNCED', at:'2026-09-17T08:02:00Z',recon:'MATCHED'},
  // Extras: ajustement et remboursement
  {id:'TX-ENT-011',actId:'ACT-ENT-001',extId:'ADJ-TX-001',    provider:'DIRECT',  driverId:'DRV-QC-0001',vehicleId:'TXM-001',gross:0,   tip:0,   tps:0,               tvq:0,               fees:0,             driverAmt:0,              entAmt:0,             adj:-5.00,refund:0,   status:'ADJUSTED',  syncStatus:'SYNCED', at:'2026-09-18T11:00:00Z',recon:'MATCHED'},
  {id:'TX-ENT-012',actId:'ACT-ENT-003',extId:'REF-TX-001',    provider:'UBER DEMO',driverId:'DRV-QC-0002',vehicleId:'TXM-002',gross:0,  tip:0,   tps:0,               tvq:0,               fees:0,             driverAmt:0,              entAmt:0,             adj:0,   refund:-3.50,status:'REFUNDED',  syncStatus:'SYNCED', at:'2026-09-18T10:00:00Z',recon:'MATCHED'},
  {id:'TX-ENT-013',actId:'ACT-ENT-005',extId:'EXC-TX-001',    provider:'DIRECT',  driverId:'DRV-QC-0004',vehicleId:'TXM-004',gross:50.00,tip:0,  tps:r2(50.00*TPS),   tvq:r2(50.00*TVQ),   fees:r2(50.00*0.08),driverAmt:r2(16.50*0.80), entAmt:r2(16.50*0.20),adj:0,   refund:0,   status:'DISPUTED',  syncStatus:'PENDING',at:'2026-09-17T22:05:00Z',recon:'VARIANCE'},
  {id:'TX-ENT-014',actId:'ACT-ENT-002',extId:'TAXGOV-TX-014',provider:'DIRECT',  driverId:'DRV-QC-0001',vehicleId:'TXM-001',gross:31.00,tip:3.50,tps:r2(31.00*TPS),   tvq:r2(31.00*TVQ),   fees:r2(31.00*0.08),driverAmt:r2(31.00*0.80), entAmt:r2(31.00*0.20),adj:0,   refund:0,   status:'RECONCILED',syncStatus:'SYNCED', at:'2026-09-16T15:30:00Z',recon:'MATCHED'},
  {id:'TX-ENT-015',actId:'ACT-ENT-004',extId:'TAXGOV-TX-015',provider:'DIRECT',  driverId:'DRV-QC-0003',vehicleId:'TXM-003',gross:28.50,tip:2.00,tps:r2(28.50*TPS),   tvq:r2(28.50*TVQ),   fees:r2(28.50*0.08),driverAmt:r2(28.50*0.80), entAmt:r2(28.50*0.20),adj:0,   refund:0,   status:'RECONCILED',syncStatus:'SYNCED', at:'2026-09-16T10:00:00Z',recon:'MATCHED'},
]

// ── PÉRIODES FISCALES ENTERPRISE ──────────────────────────────
export const TAX_PERIODS = [
  {id:'TP-Q1-2026',period:'Q1 2026',start:'2026-01-01',end:'2026-03-31',gross:136_800,tips:r2(136_800*0.10),tpsCollected:r2(136_800*TPS),tvqCollected:r2(136_800*TVQ),tpsPaid:r2(136_800*TPS*0.98),tvqPaid:r2(136_800*TVQ*0.98),tpsRefund:0,tvqRefund:0,status:'PAID',   closedAt:'2026-04-28'},
  {id:'TP-Q2-2026',period:'Q2 2026',start:'2026-04-01',end:'2026-06-30',gross:144_480,tips:r2(144_480*0.10),tpsCollected:r2(144_480*TPS),tvqCollected:r2(144_480*TVQ),tpsPaid:r2(144_480*TPS),     tvqPaid:r2(144_480*TVQ),     tpsRefund:0,tvqRefund:0,status:'PAID',   closedAt:'2026-07-30'},
  {id:'TP-Q3-2026',period:'Q3 2026',start:'2026-07-01',end:'2026-09-30',gross:412_800,tips:r2(412_800*0.10),tpsCollected:r2(412_800*TPS),tvqCollected:r2(412_800*TVQ),tpsPaid:0,                  tvqPaid:0,                  tpsRefund:0,tvqRefund:0,status:'OPEN',   closedAt:null},
]

// ── TX STATUS CONF ────────────────────────────────────────────
export const TX_STATUS_FULL: Record<string,{label:string;color:string;bg:string}> = {
  RECONCILED:{label:'Réconciliée', color:'#059669',bg:'rgba(5,150,105,0.12)'},
  VALIDATED: {label:'Validée',     color:'#003DA5',bg:'rgba(0,61,165,0.10)'},
  PENDING:   {label:'En attente',  color:'#B45309', bg:'rgba(180,83,9,0.10)'},
  EXCEPTION: {label:'Exception',   color:'#DC2626',bg:'rgba(220,38,38,0.10)'},
  DISPUTED:  {label:'Contestée',   color:'#DC2626',bg:'rgba(220,38,38,0.10)'},
  ADJUSTED:  {label:'Ajustée',     color:'#7C3AED',bg:'rgba(124,58,237,0.12)'},
  REFUNDED:  {label:'Remboursée',  color:'#7C3AED',bg:'rgba(124,58,237,0.12)'},
  CANCELLED: {label:'Annulée',     color:'#64748B',bg:'rgba(100,116,139,0.10)'},
}
export const ACT_TYPE_ICONS: Record<string,string> = {
  TAXI:'🚕', RIDESHARE:'🚗', DELIVERY:'📦', PARCEL:'📬', LOGISTICS:'🚚', COURIER:'✉️',
}

// ── DÉCLARATIONS ÉTENDUES ─────────────────────────────────────
export const ALL_DECLARATIONS = [
  {id:'DCL-Q1-2026',period:'Q1 2026',type:'TPS/TVQ',status:'ACCEPTED', tps:6840,tvq:13653.60,total:20493.60,gross:136_800,draftAt:'2026-04-20',preparedAt:'2026-04-22',submittedAt:'2026-04-25',receivedAt:'2026-04-26',acceptedAt:'2026-04-28',paidAt:'2026-04-28',ref:'DAS-2026-Q1-ENT001',govRef:'RQ-2026-Q1-00142',notes:null},
  {id:'DCL-Q2-2026',period:'Q2 2026',type:'TPS/TVQ',status:'ACCEPTED', tps:7224,tvq:14415.78,total:21639.78,gross:144_480,draftAt:'2026-07-18',preparedAt:'2026-07-22',submittedAt:'2026-07-28',receivedAt:'2026-07-29',acceptedAt:'2026-07-30',paidAt:'2026-07-30',ref:'DAS-2026-Q2-ENT001',govRef:'RQ-2026-Q2-00098',notes:null},
  {id:'DCL-Q3-2026',period:'Q3 2026',type:'TPS/TVQ',status:'DRAFT',    tps:20640,tvq:41178.72,total:61818.72,gross:412_800,draftAt:'2026-09-18',preparedAt:null,submittedAt:null,receivedAt:null,acceptedAt:null,paidAt:null,ref:null,govRef:null,notes:'En préparation — échéance 2026-10-31'},
]

// ── PAIEMENTS ÉTENDUES ────────────────────────────────────────
export const ALL_PAYMENTS = [
  {id:'PAY-Q1-2026',declId:'DCL-Q1-2026',period:'Q1 2026',type:'TPS/TVQ',due:20493.60,paid:20493.60,balance:0,   method:'VIREMENT BANCAIRE DEMO',ref:'VIR-2026-04-28-001',dueDate:'2026-04-30',paidAt:'2026-04-28',status:'PAID',   lateDays:0,   penaltyAmt:0,   notes:'Paiement reçu 2 jours avant l\'échéance'},
  {id:'PAY-Q2-2026',declId:'DCL-Q2-2026',period:'Q2 2026',type:'TPS/TVQ',due:21639.78,paid:21639.78,balance:0,   method:'VIREMENT BANCAIRE DEMO',ref:'VIR-2026-07-30-001',dueDate:'2026-07-31',paidAt:'2026-07-30',status:'PAID',   lateDays:0,   penaltyAmt:0,   notes:'Paiement reçu 1 jour avant l\'échéance'},
  {id:'PAY-Q3-2026',declId:'DCL-Q3-2026',period:'Q3 2026',type:'TPS/TVQ',due:61818.72,paid:0,       balance:61818.72,method:null,ref:null,dueDate:'2026-10-31',paidAt:null,status:'UPCOMING',lateDays:0,penaltyAmt:0,notes:'Déclaration en cours de préparation — paiement à venir'},
]

// ── DÉCLARATION STATUS CONF ───────────────────────────────────
export const DECL_STATUS_CONF: Record<string,{label:string;color:string;bg:string;icon:string}> = {
  DRAFT:     {label:'Brouillon',  color:'#64748B',bg:'rgba(100,116,139,0.10)',icon:'📝'},
  PREPARED:  {label:'Préparée',   color:'#003DA5',bg:'rgba(0,61,165,0.10)',   icon:'📋'},
  SUBMITTED: {label:'Soumise',    color:'#7C3AED',bg:'rgba(124,58,237,0.12)', icon:'📤'},
  RECEIVED:  {label:'Reçue',      color:'#B45309', bg:'rgba(180,83,9,0.10)',  icon:'📥'},
  ACCEPTED:  {label:'Acceptée',   color:'#059669',bg:'rgba(5,150,105,0.12)',  icon:'✅'},
  CORRECTED: {label:'Corrigée',   color:'#DC2626',bg:'rgba(220,38,38,0.10)', icon:'✏️'},
  MISSING:   {label:'Manquante',  color:'#DC2626',bg:'rgba(220,38,38,0.10)', icon:'❌'},
}
export const PAY_STATUS_CONF: Record<string,{label:string;color:string;bg:string;icon:string}> = {
  PAID:     {label:'Payé',       color:'#059669',bg:'rgba(5,150,105,0.12)',  icon:'✅'},
  UPCOMING: {label:'À venir',    color:'#003DA5',bg:'rgba(0,61,165,0.10)',   icon:'📅'},
  OVERDUE:  {label:'En retard',  color:'#DC2626',bg:'rgba(220,38,38,0.10)', icon:'⚠️'},
  PARTIAL:  {label:'Partiel',    color:'#B45309', bg:'rgba(180,83,9,0.10)',  icon:'🔸'},
}

// ── CONNEXIONS API ────────────────────────────────────────────
export const ENT_CONNECTIONS = [
  {id:'CONN-001',name:'TAXIMETER.GOV',        type:'PLATFORM',  method:'OAuth 2.0',   status:'CONNECTED',   health:100,latency:42, dataRx:9840, errors:0,  lastSync:'2026-09-18T10:38:00Z',scopes:['read:activities','write:ledger','read:tax','read:drivers'],note:'Connexion principale pilote'},
  {id:'CONN-002',name:'Taximètre numérique', type:'DEVICE',    method:'WebSocket',   status:'CONNECTED',   health:99, latency:18, dataRx:4820, errors:0,  lastSync:'2026-09-18T10:32:00Z',scopes:['trips','telemetry'],note:'Transmission directe courses'},
  {id:'CONN-003',name:'UBER DEMO',            type:'PLATFORM',  method:'Webhook',     status:'CONNECTED',   health:97, latency:85, dataRx:3200, errors:2,  lastSync:'2026-09-18T10:20:00Z',scopes:['trips','payments'],note:'2 webhooks en erreur récupérés'},
  {id:'CONN-004',name:'LYFT DEMO',            type:'PLATFORM',  method:'Webhook',     status:'CONNECTED',   health:95, latency:92, dataRx:1840, errors:0,  lastSync:'2026-09-18T09:45:00Z',scopes:['trips','payments'],note:'Connexion stable'},
  {id:'CONN-005',name:'UBER EATS DEMO',        type:'PLATFORM',  method:'Webhook',     status:'CONNECTED',   health:97, latency:88, dataRx:3240, errors:1,  lastSync:'2026-09-18T10:20:00Z',scopes:['deliveries','tips','orders'],note:'Connexion Uber Eats DEMO'},
  {id:'CONN-006',name:'Revenu Québec',        type:'GOVERNMENT',method:'—',           status:'PLANNED',     health:0,  latency:0,  dataRx:0,    errors:0,  lastSync:null,scopes:[],note:'Intégration future — accord légal requis'},
  {id:'CONN-007',name:'ARC (CRA)',            type:'GOVERNMENT',method:'—',           status:'PLANNED',     health:0,  latency:0,  dataRx:0,    errors:0,  lastSync:null,scopes:[],note:'Intégration future — accord légal requis'},
]

// ── WEBHOOKS LOG ──────────────────────────────────────────────
export const WEBHOOK_LOG = [
  {id:'WH-001',connId:'CONN-001',event:'activity.completed',extRef:'TAXGOV-ACT-001',at:'2026-09-18T10:32:00Z',status:'PROCESSED',attempts:1,latency:38, payload:'{"actId":"ACT-ENT-001","gross":42.50}',error:null},
  {id:'WH-002',connId:'CONN-001',event:'activity.completed',extRef:'TAXGOV-ACT-002',at:'2026-09-18T09:12:00Z',status:'PROCESSED',attempts:1,latency:41, payload:'{"actId":"ACT-ENT-002","gross":18.75}',error:null},
  {id:'WH-003',connId:'CONN-003',event:'trip.completed',    extRef:'UBER-TX-8421',  at:'2026-09-18T08:32:00Z',status:'PROCESSED',attempts:1,latency:88, payload:'{"tripId":"8421","amount":22.50}',    error:null},
  {id:'WH-004',connId:'CONN-003',event:'trip.completed',    extRef:'UBER-TX-9103',  at:'2026-09-17T18:17:00Z',status:'PROCESSED',attempts:2,latency:95, payload:'{"tripId":"9103","amount":19.00}',    error:'Timeout initial — retry réussi'},
  {id:'WH-005',connId:'CONN-004',event:'trip.completed',    extRef:'LYFT-TX-5521',  at:'2026-09-17T16:02:00Z',status:'PROCESSED',attempts:1,latency:90, payload:'{"tripId":"5521","amount":21.00}',    error:null},
  {id:'WH-006',connId:'CONN-005',event:'delivery.completed',extRef:'UBER-EATS-7710', at:'2026-09-17T12:02:00Z',status:'PROCESSED',attempts:1,latency:88, payload:'{"deliveryId":"EATS-7710","amount":12.00}',error:null},
  {id:'WH-007',connId:'CONN-003',event:'trip.cancelled',    extRef:'UBER-TX-FAIL1', at:'2026-09-17T10:00:00Z',status:'FAILED',   attempts:3,latency:0,  payload:'{}',                                 error:'Auth token expiré — non récupéré'},
]

// ── SYNC HISTORY ──────────────────────────────────────────────
export const SYNC_HISTORY = [
  {id:'SYN-001',at:'2026-09-18T10:38:00Z',source:'TAXIMETER.GOV', type:'FULL',       duration:2840,records:9840, new:12, updated:3, skipped:0, errors:0, status:'SUCCESS',note:'Sync complète quotidienne'},
  {id:'SYN-002',at:'2026-09-18T10:32:00Z',source:'Taximètre',     type:'REALTIME',   duration:180, records:1,   new:1,  updated:0, skipped:0, errors:0, status:'SUCCESS',note:'Course ACT-ENT-001 transmise'},
  {id:'SYN-003',at:'2026-09-18T09:12:00Z',source:'Taximètre',     type:'REALTIME',   duration:175, records:1,   new:1,  updated:0, skipped:0, errors:0, status:'SUCCESS',note:'Course ACT-ENT-002 transmise'},
  {id:'SYN-004',at:'2026-09-18T08:32:00Z',source:'UBER DEMO',     type:'WEBHOOK',    duration:88,  records:1,   new:1,  updated:0, skipped:0, errors:0, status:'SUCCESS',note:'Trip UBER-TX-8421'},
  {id:'SYN-005',at:'2026-09-17T22:02:00Z',source:'TAXIMETER.GOV', type:'INCREMENTAL',duration:420, records:48,  new:5,  updated:2, skipped:1, errors:1, status:'WARNING',note:'1 activité non réconciliée'},
  {id:'SYN-006',at:'2026-09-17T18:17:00Z',source:'UBER DEMO',     type:'WEBHOOK',    duration:95,  records:1,   new:1,  updated:0, skipped:0, errors:0, status:'SUCCESS',note:'Trip UBER-TX-9103 (retry 2)'},
  {id:'SYN-007',at:'2026-09-17T12:02:00Z',source:'UBER EATS DEMO', type:'WEBHOOK',   duration:88,  records:1,   new:1,  updated:0, skipped:0, errors:0, status:'SUCCESS',note:'Delivery Uber Eats EATS-7710'},
  {id:'SYN-008',at:'2026-09-17T00:00:00Z',source:'TAXIMETER.GOV', type:'FULL',       duration:3120,records:9828,new:0,  updated:8, skipped:0, errors:0, status:'SUCCESS',note:'Sync journalière — aucune nouvelle activité'},
]

// ── DONNÉES TRANSPARENCE ──────────────────────────────────────
export const TRANSPARENCY_DATA = {
  dataCategories:[
    {cat:'Identité entreprise',   purpose:'Identification et vérification',       retention:'Durée du pilote',access:'Admin Gov autorisé',   shared:'NON'},
    {cat:'Données chauffeurs',    purpose:'Gestion dossier professionnel',         retention:'Durée du pilote',access:'Admin Gov + Chauffeur',shared:'CONTRÔLÉ'},
    {cat:'Activités (courses)',   purpose:'Réconciliation et rapport fiscal',      retention:'Durée du pilote',access:'Admin Gov autorisé',   shared:'CONTRÔLÉ'},
    {cat:'Transactions',          purpose:'Calcul TPS/TVQ et reconciliation',     retention:'Durée du pilote',access:'Admin Gov fiscal',     shared:'CONTRÔLÉ'},
    {cat:'Données fiscales',      purpose:'Estimation déclarations TPS/TVQ',      retention:'Durée du pilote',access:'Admin Gov fiscal',     shared:'SIMULATION'},
    {cat:'Documents',             purpose:'Validation conformité',                retention:'Durée du pilote',access:'Admin Gov autorisé',   shared:'NON'},
    {cat:'Audit & logs',          purpose:'Traçabilité et sécurité',              retention:'Durée du pilote',access:'Auditeur autorisé',    shared:'NON'},
  ],
  rights:[
    {right:'Accès',        desc:'Consulter les données vous concernant',      how:'Via l\'interface Enterprise Gov'},
    {right:'Rectification',desc:'Corriger des informations inexactes',         how:'Via une demande à l\'administrateur Gov'},
    {right:'Portabilité',  desc:'Exporter vos données en format structuré',   how:'Via le module Rapports'},
    {right:'Effacement',   desc:'Demander la suppression de vos données',     how:'Via une demande formelle au pilote'},
    {right:'Opposition',   desc:'S\'opposer à certains traitements',           how:'Via une demande à l\'administrateur Gov'},
  ],
  accessMatrix:[
    {role:'Propriétaire',  sees:['Tout le dossier enterprise','Chauffeurs','Finances','Taxes'],cannot:['Données autres entreprises','Renseignements gouvernementaux internes']},
    {role:'Finance',       sees:['Transactions','Revenus','TPS/TVQ','Déclarations','Paiements'],cannot:['Données chauffeurs personnelles','Sécurité']},
    {role:'Dispatch',      sees:['Chauffeurs (vue limitée)','Véhicules','Activités'],cannot:['Données financières','Taxes','Audit']},
    {role:'Compliance',    sees:['Documents','Obligations','Statuts conformité'],cannot:['Données financières détaillées']},
    {role:'Lecteur',       sees:['Tableau de bord (lecture seule)'],cannot:['Modifications','Finances détaillées','Audit']},
  ],
}

export const CONN_TYPE_ICONS: Record<string,string> = {
  PLATFORM:'🔌', DEVICE:'🚕', GOVERNMENT:'🏛️', INTERNAL:'⚙️',
}
export const CONN_HEALTH_COLOR = (h:number) => h>=95?'#059669':h>=80?'#B45309':h>0?'#DC2626':'#64748B'
export const SYNC_TYPE_CONF: Record<string,{label:string;color:string}> = {
  FULL:        {label:'Complète',    color:'#003DA5'},
  INCREMENTAL: {label:'Incrémentale',color:'#7C3AED'},
  REALTIME:    {label:'Temps réel',  color:'#059669'},
  WEBHOOK:     {label:'Webhook',     color:'#B45309'},
}
export const SYNC_STATUS_CONF: Record<string,{label:string;color:string;bg:string}> = {
  SUCCESS: {label:'Succès',     color:'#059669',bg:'rgba(5,150,105,0.12)'},
  WARNING: {label:'Avertissement',color:'#B45309',bg:'rgba(180,83,9,0.10)'},
  ERROR:   {label:'Erreur',     color:'#DC2626',bg:'rgba(220,38,38,0.10)'},
  RUNNING: {label:'En cours',   color:'#003DA5',bg:'rgba(0,61,165,0.10)'},
}

// ── RÉCONCILIATION ITEMS ──────────────────────────────────────
export const RECON_ITEMS = [
  {id:'REC-001',txId:'TX-ENT-001',actId:'ACT-ENT-001',provider:'DIRECT',     driverId:'DRV-QC-0001',at:'2026-09-18T10:32:00Z',sourceAmt:42.50,ledgerAmt:42.50,tpsSource:r2(42.50*TPS),tpsLedger:r2(42.50*TPS),tvqSource:r2(42.50*TVQ),tvqLedger:r2(42.50*TVQ),diff:0,   status:'MATCHED',  resolvedAt:'2026-09-18T10:32:00Z',note:null},
  {id:'REC-002',txId:'TX-ENT-002',actId:'ACT-ENT-002',provider:'DIRECT',     driverId:'DRV-QC-0001',at:'2026-09-18T09:12:00Z',sourceAmt:18.75,ledgerAmt:18.75,tpsSource:r2(18.75*TPS),tpsLedger:r2(18.75*TPS),tvqSource:r2(18.75*TVQ),tvqLedger:r2(18.75*TVQ),diff:0,   status:'MATCHED',  resolvedAt:'2026-09-18T09:12:00Z',note:null},
  {id:'REC-003',txId:'TX-ENT-003',actId:'ACT-ENT-003',provider:'UBER DEMO',  driverId:'DRV-QC-0002',at:'2026-09-18T08:32:00Z',sourceAmt:22.50,ledgerAmt:22.50,tpsSource:r2(22.50*TPS),tpsLedger:r2(22.50*TPS),tvqSource:r2(22.50*TVQ),tvqLedger:r2(22.50*TVQ),diff:0,   status:'MATCHED',  resolvedAt:'2026-09-18T08:32:00Z',note:null},
  {id:'REC-004',txId:'TX-ENT-005',actId:'ACT-ENT-005',provider:'DIRECT',     driverId:'DRV-QC-0004',at:'2026-09-17T22:02:00Z',sourceAmt:50.00,ledgerAmt:16.50,tpsSource:r2(50.00*TPS),tpsLedger:r2(16.50*TPS),tvqSource:r2(50.00*TVQ),tvqLedger:r2(16.50*TVQ),diff:33.50,status:'VARIANCE', resolvedAt:null,   note:'Source plateforme 50$ vs Revenue Ledger 16.50$ — activité TXM-004 en maintenance?'},
  {id:'REC-005',txId:'TX-ENT-013',actId:'ACT-ENT-005',provider:'DIRECT',     driverId:'DRV-QC-0004',at:'2026-09-17T22:05:00Z',sourceAmt:50.00,ledgerAmt:0,    tpsSource:r2(50.00*TPS),tpsLedger:0,               tvqSource:r2(50.00*TVQ),tvqLedger:0,               diff:50,   status:'MISSING',  resolvedAt:null,   note:'Transaction EXC-TX-001 non enregistrée dans Revenue Ledger — webhook échoué?'},
  {id:'REC-006',txId:'TX-ENT-006',actId:'ACT-ENT-006',provider:'UBER DEMO',  driverId:'DRV-QC-0002',at:'2026-09-17T18:17:00Z',sourceAmt:19.00,ledgerAmt:19.00,tpsSource:r2(19.00*TPS),tpsLedger:r2(19.00*TPS),tvqSource:r2(19.00*TVQ),tvqLedger:r2(19.00*TVQ),diff:0,   status:'MATCHED',  resolvedAt:'2026-09-17T18:20:00Z',note:null},
  {id:'REC-007',txId:'TX-ENT-007',actId:'ACT-ENT-007',provider:'LYFT DEMO',  driverId:'DRV-QC-0003',at:'2026-09-17T16:02:00Z',sourceAmt:21.00,ledgerAmt:21.00,tpsSource:r2(21.00*TPS),tpsLedger:r2(21.00*TPS),tvqSource:r2(21.00*TVQ),tvqLedger:r2(21.00*TVQ),diff:0,   status:'MATCHED',  resolvedAt:'2026-09-17T16:05:00Z',note:null},
  {id:'REC-008',txId:'TX-ENT-011',actId:'ACT-ENT-001',provider:'DIRECT',     driverId:'DRV-QC-0001',at:'2026-09-18T11:00:00Z',sourceAmt:-5.00,ledgerAmt:-5.00,tpsSource:0,               tpsLedger:0,               tvqSource:0,               tvqLedger:0,               diff:0,   status:'MATCHED',  resolvedAt:'2026-09-18T11:00:00Z',note:'Ajustement -5$ appliqué aux deux sources'},
]

// ── EXCEPTIONS ────────────────────────────────────────────────
export const EXCEPTIONS = [
  {id:'EXC-001',type:'VARIANCE',   priority:'HIGH',    txId:'TX-ENT-005',actId:'ACT-ENT-005',at:'2026-09-17T22:02:00Z',sourceAmt:50.00,ledgerAmt:16.50,diff:33.50,status:'INVESTIGATING',assignedTo:'Finance',driverId:'DRV-QC-0004',provider:'DIRECT',    desc:'Montant source (50$) ≠ Revenue Ledger (16.50$) — diff: 33.50$. Véhicule TXM-004 en maintenance lors de la course?',action:'Vérifier le statut de TXM-004 et le log taximètre. Comparer avec données GPS.',resolution:null},
  {id:'EXC-002',type:'MISSING_TX', priority:'HIGH',    txId:'TX-ENT-013',actId:'ACT-ENT-005',at:'2026-09-17T22:05:00Z',sourceAmt:50.00,ledgerAmt:0,    diff:50.00,status:'OPEN',        assignedTo:'Finance',driverId:'DRV-QC-0004',provider:'DIRECT',    desc:'Transaction EXC-TX-001 non trouvée dans Revenue Ledger. Webhook échoué ou non traité?',action:'Vérifier les logs webhook CONN-001. Créer manuellement si confirmé.',resolution:null},
  {id:'EXC-003',type:'DISPUTED',   priority:'MEDIUM',  txId:'TX-ENT-013',actId:'ACT-ENT-005',at:'2026-09-17T22:05:00Z',sourceAmt:50.00,ledgerAmt:16.50,diff:33.50,status:'OPEN',        assignedTo:'Finance',driverId:'DRV-QC-0004',provider:'DIRECT',    desc:'TX contestée par le chauffeur — montant perçu vs montant taximètre différent.',action:'Demander clarification au chauffeur DRV-QC-0004. Comparer taximètre vs app plateforme.',resolution:null},
  {id:'EXC-004',type:'WEBHOOK',    priority:'LOW',     txId:null,        actId:null,          at:'2026-09-17T10:00:00Z',sourceAmt:0,    ledgerAmt:0,    diff:0,    status:'CLOSED',      assignedTo:'Tech',   driverId:null,           provider:'UBER DEMO', desc:'Webhook UBER-TX-FAIL1 échoué — token auth expiré. Non récupérable.',action:'Renouveler token UBER DEMO. Vérifier si l\'activité est dans d\'autres sources.',resolution:'Token renouvelé. Activité non retrouvée — montant annulé. Accepté comme perte.'},
  {id:'EXC-005',type:'DUPLICATE',  priority:'MEDIUM',  txId:'TX-ENT-001',actId:'ACT-ENT-001',at:'2026-09-18T10:32:00Z',sourceAmt:42.50,ledgerAmt:42.50,diff:0,    status:'CLOSED',      assignedTo:'Tech',   driverId:'DRV-QC-0001',provider:'DIRECT',    desc:'Doublon potentiel détecté — même extRef reçu 2 fois. Anti-doublon a bloqué le second.',action:'Confirmer que la déduplication a bien fonctionné.',resolution:'Déduplication confirmée — une seule entrée dans Revenue Ledger. Fermé.'},
]

// ── RAPPORTS DISPONIBLES ──────────────────────────────────────
export const RECON_STATUS_CONF: Record<string,{label:string;color:string;bg:string;icon:string}> = {
  MATCHED:  {label:'Équilibré', color:'#059669',bg:'rgba(5,150,105,0.12)', icon:'✅'},
  VARIANCE: {label:'Variance',  color:'#B45309', bg:'rgba(180,83,9,0.10)', icon:'⚠️'},
  MISSING:  {label:'Manquant',  color:'#DC2626',bg:'rgba(220,38,38,0.10)',icon:'❌'},
  PARTIAL:  {label:'Partiel',   color:'#7C3AED',bg:'rgba(124,58,237,0.12)',icon:'🔸'},
}
export const EXC_TYPE_CONF: Record<string,{label:string;color:string;icon:string}> = {
  VARIANCE:   {label:'Écart montant',   color:'#B45309', icon:'📊'},
  MISSING_TX: {label:'TX manquante',   color:'#DC2626', icon:'❌'},
  DISPUTED:   {label:'Contestée',      color:'#DC2626', icon:'⚔️'},
  WEBHOOK:    {label:'Webhook échoué', color:'#7C3AED', icon:'📡'},
  DUPLICATE:  {label:'Doublon',        color:'#64748B', icon:'🔄'},
}
export const EXC_STATUS_CONF: Record<string,{label:string;color:string;bg:string}> = {
  OPEN:         {label:'Ouvert',        color:'#DC2626',bg:'rgba(220,38,38,0.10)'},
  INVESTIGATING:{label:'En analyse',    color:'#B45309', bg:'rgba(180,83,9,0.10)'},
  CLOSED:       {label:'Fermé',         color:'#059669',bg:'rgba(5,150,105,0.12)'},
}
// ── OBLIGATIONS CONFORMITÉ ────────────────────────────────────
export const COMPLIANCE_OBLIGATIONS = [
  {id:'OBL-C-001',type:'FISCAL',     label:'Déclaration TPS/TVQ Q3',     desc:'Préparer et soumettre la déclaration pour Q3 2026',due:'2026-10-31',status:'UPCOMING',  priority:'HIGH',   relatedId:'DCL-Q3-2026',category:'TAX',       progress:15},
  {id:'OBL-C-002',type:'FISCAL',     label:'Paiement TPS/TVQ Q3',        desc:'Remettre les montants TPS/TVQ dus pour Q3 2026',   due:'2026-10-31',status:'UPCOMING',  priority:'HIGH',   relatedId:'PAY-Q3-2026',category:'TAX',       progress:0},
  {id:'OBL-C-003',type:'DOCUMENT',   label:'Renouveler inspection TXM-004',desc:'Inspection véhicule expire 2026-09-30',           due:'2026-09-30',status:'PENDING',   priority:'HIGH',   relatedId:'TXM-004',    category:'VEHICLE',   progress:0},
  {id:'OBL-C-004',type:'DOCUMENT',   label:'Renouveler permis DRV-QC-0004',desc:'Permis de conduire expire 2026-09-30',           due:'2026-09-30',status:'PENDING',   priority:'HIGH',   relatedId:'DRV-QC-0004',category:'DRIVER',    progress:0},
  {id:'OBL-C-005',type:'RECON',      label:'Résoudre exception EXC-001',  desc:'Écart 33.50$ entre source et Revenue Ledger',     due:'2026-09-25',status:'IN_PROGRESS',priority:'HIGH',   relatedId:'EXC-001',    category:'RECON',     progress:40},
  {id:'OBL-C-006',type:'RECON',      label:'Résoudre exception EXC-002',  desc:'Transaction manquante — 50$ non inscrite',        due:'2026-09-25',status:'OPEN',      priority:'HIGH',   relatedId:'EXC-002',    category:'RECON',     progress:0},
  {id:'OBL-C-007',type:'CONNEXION',  label:'Renouveler token UBER DEMO',  desc:'Token API expiré — reconnexion requise',          due:'2026-09-20',status:'PENDING',   priority:'MEDIUM', relatedId:'CONN-003',   category:'CONNECTION',progress:0},
  {id:'OBL-C-008',type:'REPORTING',  label:'Relevé mensuel septembre',    desc:'Générer et archiver le relevé de septembre 2026', due:'2026-10-05',status:'UPCOMING',  priority:'LOW',    relatedId:null,         category:'REPORTING', progress:0},
  {id:'OBL-C-009',type:'DRIVER',     label:'Valider dossier DRV-QC-0005', desc:'Chauffeur suspendu — vérifier résolution docs',   due:'2026-10-01',status:'PENDING',   priority:'MEDIUM', relatedId:'DRV-QC-0005',category:'DRIVER',    progress:20},
  {id:'OBL-C-010',type:'FISCAL',     label:'Déclaration annuelle 2026',   desc:'Préparer la déclaration fiscale annuelle',        due:'2027-03-31',status:'UPCOMING',  priority:'LOW',    relatedId:null,         category:'TAX',       progress:0},
]

export const COMPLIANCE_STATUS_CONF: Record<string,{label:string;color:string;bg:string;icon:string}> = {
  COMPLETED:   {label:'Complété',      color:'#059669',bg:'rgba(5,150,105,0.12)',   icon:'✅'},
  IN_PROGRESS: {label:'En cours',      color:'#003DA5',bg:'rgba(0,61,165,0.10)',    icon:'🔄'},
  UPCOMING:    {label:'À venir',       color:'#7C3AED',bg:'rgba(124,58,237,0.12)',  icon:'📅'},
  PENDING:     {label:'Action requise',color:'#B45309',bg:'rgba(180,83,9,0.10)',    icon:'⚠️'},
  OPEN:        {label:'Ouvert',        color:'#DC2626',bg:'rgba(220,38,38,0.10)',   icon:'🔴'},
  OVERDUE:     {label:'En retard',     color:'#DC2626',bg:'rgba(220,38,38,0.10)',   icon:'🚨'},
  EXEMPT:      {label:'Exempt',        color:'#64748B',bg:'rgba(100,116,139,0.10)', icon:'➖'},
}
export const COMP_CATEGORY_CONF: Record<string,{label:string;icon:string;color:string}> = {
  TAX:        {label:'Fiscal',       icon:'🧾',color:'#7C3AED'},
  VEHICLE:    {label:'Véhicule',     icon:'🚗',color:'#003DA5'},
  DRIVER:     {label:'Chauffeur',    icon:'👤',color:'#059669'},
  RECON:      {label:'Réconciliation',icon:'🔄',color:'#B45309'},
  CONNECTION: {label:'Connexion',    icon:'🔌',color:'#DC2626'},
  REPORTING:  {label:'Rapports',     icon:'📊',color:'#64748B'},
  DOCUMENT:   {label:'Documents',    icon:'📄',color:'#B45309'},
}

// ── PROVIDERS & SERVICES ──────────────────────────────────────
export const PROVIDERS = [
  {id:'PRV-001',name:'Uber',       country:'USA', emoji:'🚗', status:'CONNECTED',services:['SVC-001','SVC-002','SVC-003','SVC-004','SVC-005','SVC-006'],note:'6 services actifs · DEMO'},
  {id:'PRV-002',name:'Uber Rides DEMO',country:'CA', emoji:'🚗', status:'CONNECTED',services:['SVC-101'],note:'UberX / UberXL / Comfort · DEMO'},
  {id:'PRV-003',name:'Uber Eats DEMO',country:'CA', emoji:'🍔', status:'CONNECTED',services:['SVC-201'],note:'Livraison restauration · DEMO'},
  {id:'PRV-004',name:'Uber Grocery DEMO',country:'CA',emoji:'🛒',status:'CONNECTED',services:['SVC-301'],note:'Livraison épicerie · DEMO'},
  {id:'PRV-005',name:'Uber Courier DEMO',country:'CA',emoji:'📦',status:'CONNECTED',services:['SVC-401'],note:'Livraison colis · DEMO'},
  {id:'PRV-006',name:'Uber Green DEMO', country:'CA', emoji:'🟢', status:'CONNECTED',services:['SVC-501'],note:'Véhicules électriques · DEMO'},
  {id:'PRV-007',name:'Uber Taxi DEMO',  country:'CA',  emoji:'🚕', status:'ACTIVE',  services:['SVC-601'],note:'Taxi réglementé QC · DEMO'},
  {id:'PRV-008',name:'Uber Direct DEMO', country:'CA',  emoji:'🚚', status:'PLANNED', services:['SVC-701'],note:'Livraison entreprises B2B · DEMO'},
  {id:'PRV-009',name:'TAXIMETER.GOV',   country:'QC',  emoji:'🏛️', status:'CONNECTED', services:['SVC-901'],note:'Plateforme gouvernementale QC · PILOTE'},
  {id:'PRV-010',name:'Intelcom',   country:'CA',  emoji:'🚚', status:'PLANNED',  services:['SVC-901'],note:'Dernier kilomètre · DEMO'},
]

export const PROVIDER_SERVICES = [
  // UBER
  {id:'SVC-001',providerId:'PRV-001',name:'Uber Taxi',       cat:'TAXI',     emoji:'🚕',desc:'Service taxi réglementé avec taximètre numérique',status:'ACTIVE',accountRef:'UBTX-ENT-001',lastSync:'2026-09-18T10:32:00Z',dataRx:1240,txCount:4,gross:134.75,tips:11.50},
  {id:'SVC-002',providerId:'PRV-001',name:'UberX',           cat:'RIDESHARE',emoji:'🚗',desc:'Service rideshare standard',                        status:'ACTIVE',accountRef:'UBX-ENT-001', lastSync:'2026-09-18T10:20:00Z',dataRx:880, txCount:2,gross:41.50,tips:5.50},
  {id:'SVC-003',providerId:'PRV-001',name:'Uber Green',      cat:'RIDESHARE',emoji:'🟢',desc:'Véhicules électriques ou hybrides',                 status:'PLANNED',accountRef:null,          lastSync:null,                 dataRx:0,   txCount:0,gross:0,    tips:0},
  {id:'SVC-004',providerId:'PRV-001',name:'Uber Eats',       cat:'FOOD',     emoji:'🍔',desc:'Livraison de repas',                                status:'PLANNED',accountRef:null,          lastSync:null,                 dataRx:0,   txCount:0,gross:0,    tips:0},
  {id:'SVC-005',providerId:'PRV-001',name:'Uber Eats Grocery',cat:'GROCERY', emoji:'🛒',desc:'Livraison d\'épicerie',                            status:'PLANNED',accountRef:null,          lastSync:null,                 dataRx:0,   txCount:0,gross:0,    tips:0},
  {id:'SVC-006',providerId:'PRV-001',name:'Uber Delivery',   cat:'PARCEL',   emoji:'📦',desc:'Livraison de colis et courrier',                    status:'PLANNED',accountRef:null,          lastSync:null,                 dataRx:0,   txCount:0,gross:0,    tips:0},
  // LYFT
  {id:'SVC-101',providerId:'PRV-002',name:'Uber Rides Standard',cat:'RIDESHARE',emoji:'🚗',desc:'UberX / UberXL · Service principal',             status:'ACTIVE',accountRef:'UBR-RIDES-001',lastSync:'2026-09-18T10:32:00Z',dataRx:18441,txCount:119200,gross:18420000,tips:1842000},
  // UBER EATS
  {id:'SVC-201',providerId:'PRV-003',name:'Uber Eats Restauration',cat:'DELIVERY',emoji:'🍔',desc:'Livraison restauration Uber Eats',        status:'ACTIVE',accountRef:'UBR-EATS-001', lastSync:'2026-09-18T10:20:00Z',dataRx:312000,txCount:298400,gross:24960000,tips:3744000},
  // PLANIFIÉS
  {id:'SVC-301',providerId:'PRV-004',name:'Uber Grocery',       cat:'GROCERY',emoji:'🛒',desc:'Épicerie et produits frais Uber',                 status:'ACTIVE', accountRef:'UBR-GRC-001', lastSync:'2026-09-18T09:30:00Z',dataRx:42000,txCount:40200,gross:5880000,tips:588000},
  {id:'SVC-401',providerId:'PRV-005',name:'DHL Express',     cat:'PARCEL',   emoji:'📦',desc:'Colis express international',                       status:'PLANNED',accountRef:null,lastSync:null,dataRx:0,txCount:0,gross:0,tips:0},
  {id:'SVC-501',providerId:'PRV-006',name:'GLS Colis',       cat:'PARCEL',   emoji:'📦',desc:'Réseau colis européen',                             status:'PLANNED',accountRef:null,lastSync:null,dataRx:0,txCount:0,gross:0,tips:0},
  {id:'SVC-601',providerId:'PRV-007',name:'Uber Taxi QC',cat:'PARCEL', emoji:'📬',desc:'Taxi réglementé avec taximètre · QC',                          status:'PLANNED',accountRef:null,lastSync:null,dataRx:0,txCount:0,gross:0,tips:0},
  {id:'SVC-701',providerId:'PRV-008',name:'UPS Ground',      cat:'PARCEL',   emoji:'📦',desc:'Livraison terrestre UPS',                           status:'PLANNED',accountRef:null,lastSync:null,dataRx:0,txCount:0,gross:0,tips:0},
  {id:'SVC-801',providerId:'PRV-009',name:'TAXIMETER.GOV',    cat:'GOV',     emoji:'🏛️',desc:'Connexion plateforme gouvernementale QC · PILOTE', status:'CONNECTED',accountRef:'ENT-DEMO-001',lastSync:'2026-09-18T10:38:00Z',dataRx:9840,txCount:0,gross:0,tips:0},
  {id:'SVC-901',providerId:'PRV-010',name:'Intelcom Express',cat:'PARCEL',   emoji:'🚚',desc:'Dernier kilomètre résidentiel',                     status:'PLANNED',accountRef:null,lastSync:null,dataRx:0,txCount:0,gross:0,tips:0},
]

export const SVC_CAT_CONF: Record<string,{label:string;color:string;icon:string}> = {
  TAXI:     {label:'Taxi',          color:'#003DA5',icon:'🚕'},
  RIDESHARE:{label:'Rideshare',     color:'#7C3AED',icon:'🚗'},
  FOOD:     {label:'Restauration',  color:'#DC2626',icon:'🍔'},
  GROCERY:  {label:'Épicerie',      color:'#059669',icon:'🛒'},
  PARCEL:   {label:'Colis/Courrier',color:'#B45309',icon:'📦'},
  DELIVERY: {label:'Livraison',     color:'#B45309',icon:'📦'},
  MOBILITY: {label:'Mobilité',      color:'#7C3AED',icon:'🚙'},
}

// ── DOCUMENTS FINANCIERS ──────────────────────────────────────
export const FINANCIAL_DOCS = [
  // Relevés mensuels
  {id:'FD-001',type:'RELEVÉ_MENSUEL',    label:'Relevé juillet 2026',         period:'2026-07',source:'TAXIMETER.GOV',gross:142_800,net:118_320,tps:r2(142_800*TPS),tvq:r2(142_800*TVQ),tips:14_280,fees:24_480,status:'VALIDÉ',  version:1,at:'2026-08-05T08:00:00Z',by:'Louise Côté',  note:null},
  {id:'FD-002',type:'RELEVÉ_MENSUEL',    label:'Relevé août 2026',            period:'2026-08',source:'TAXIMETER.GOV',gross:148_400,net:123_080,tps:r2(148_400*TPS),tvq:r2(148_400*TVQ),tips:14_840,fees:25_320,status:'VALIDÉ',  version:1,at:'2026-09-05T08:00:00Z',by:'Louise Côté',  note:null},
  {id:'FD-003',type:'RELEVÉ_MENSUEL',    label:'Relevé septembre 2026',       period:'2026-09',source:'TAXIMETER.GOV',gross:121_600,net:100_930,tps:r2(121_600*TPS),tvq:r2(121_600*TVQ),tips:12_160,fees:20_670,status:'EN_COURS',version:1,at:'2026-09-18T10:38:00Z',by:'SYSTEM',      note:'Période en cours — données partielles'},
  // Relevés trimestriels
  {id:'FD-004',type:'RELEVÉ_TRIM',       label:'Relevé Q1 2026',              period:'Q1 2026',source:'TAXIMETER.GOV',gross:136_800,net:113_520,tps:r2(136_800*TPS),tvq:r2(136_800*TVQ),tips:13_680,fees:23_280,status:'ARCHIVÉ', version:2,at:'2026-04-05T08:00:00Z',by:'Louise Côté',  note:'V2: correction frais plateforme janvier'},
  {id:'FD-005',type:'RELEVÉ_TRIM',       label:'Relevé Q2 2026',              period:'Q2 2026',source:'TAXIMETER.GOV',gross:144_480,net:119_880,tps:r2(144_480*TPS),tvq:r2(144_480*TVQ),tips:14_448,fees:24_600,status:'ARCHIVÉ', version:1,at:'2026-07-05T08:00:00Z',by:'Louise Côté',  note:null},
  {id:'FD-006',type:'RELEVÉ_TRIM',       label:'Relevé Q3 2026 (partiel)',    period:'Q3 2026',source:'TAXIMETER.GOV',gross:412_800,net:342_600,tps:r2(412_800*TPS),tvq:r2(412_800*TVQ),tips:41_280,fees:70_200,status:'EN_COURS',version:1,at:'2026-09-18T10:38:00Z',by:'SYSTEM',      note:'Période en cours — estimé à date'},
  // Déclarations TPS/TVQ
  {id:'FD-007',type:'DÉCL_TPS',          label:'Déclaration TPS Q1 2026',     period:'Q1 2026',source:'ENTERPRISE GOV',gross:136_800,net:6_840,  tps:r2(136_800*TPS),tvq:0,              tips:0,     fees:0,    status:'ARCHIVÉ', version:1,at:'2026-04-25T10:00:00Z',by:'Louise Côté',  note:'Réf: DAS-2026-Q1-ENT001'},
  {id:'FD-008',type:'DÉCL_TVQ',          label:'Déclaration TVQ Q1 2026',     period:'Q1 2026',source:'ENTERPRISE GOV',gross:136_800,net:13_654, tps:0,               tvq:r2(136_800*TVQ),tips:0,    fees:0,    status:'ARCHIVÉ', version:1,at:'2026-04-25T10:05:00Z',by:'Louise Côté',  note:'Réf: DAS-2026-Q1-ENT001'},
  {id:'FD-009',type:'DÉCL_TPS',          label:'Déclaration TPS Q2 2026',     period:'Q2 2026',source:'ENTERPRISE GOV',gross:144_480,net:7_224,  tps:r2(144_480*TPS),tvq:0,              tips:0,     fees:0,    status:'ARCHIVÉ', version:1,at:'2026-07-28T10:00:00Z',by:'Louise Côté',  note:'Réf: DAS-2026-Q2-ENT001'},
  // Rapports financiers
  {id:'FD-010',type:'RAPPORT_REVENUS',   label:'Rapport revenus chauffeurs Q2',period:'Q2 2026',source:'ENTERPRISE GOV',gross:144_480,net:112_694,tps:0,              tvq:0,              tips:14_448,fees:17_338,status:'VALIDÉ',  version:1,at:'2026-07-26T08:00:00Z',by:'Sophie Marchand',note:'Distribué aux chauffeurs'},
  {id:'FD-011',type:'RAPPORT_AUDIT',     label:'Rapport d\'audit Q2 2026',    period:'Q2 2026',source:'SYSTEM',        gross:0,      net:0,      tps:0,               tvq:0,              tips:0,     fees:0,    status:'ARCHIVÉ', version:1,at:'2026-08-01T08:00:00Z',by:'SYSTEM',      note:'Journal complet des actions Q2'},
  {id:'FD-012',type:'RELEVÉ_POURBOIRES', label:'Relevé pourboires Q3 (partiel)',period:'Q3 2026',source:'TAXIMETER.GOV',gross:41_280, net:41_280, tps:0,              tvq:0,              tips:41_280,fees:0,    status:'EN_COURS',version:1,at:'2026-09-18T10:38:00Z',by:'SYSTEM',      note:'Pourboires séparés revenus principaux'},
]

export const FD_TYPE_CONF: Record<string,{label:string;icon:string;color:string}> = {
  RELEVÉ_MENSUEL:  {label:'Relevé mensuel',    icon:'📅',color:'#003DA5'},
  RELEVÉ_TRIM:     {label:'Relevé trimestriel',icon:'📊',color:'#7C3AED'},
  RELEVÉ_ANNUEL:   {label:'Relevé annuel',     icon:'📆',color:'#059669'},
  DÉCL_TPS:        {label:'Déclaration TPS',   icon:'🧾',color:'#7C3AED'},
  DÉCL_TVQ:        {label:'Déclaration TVQ',   icon:'🧾',color:'#7C3AED'},
  RAPPORT_REVENUS: {label:'Rapport revenus',   icon:'💰',color:'#059669'},
  RAPPORT_AUDIT:   {label:'Rapport audit',     icon:'🛡️',color:'#64748B'},
  RELEVÉ_POURBOIRES:{label:'Relevé pourboires',icon:'💳',color:'#B45309'},
}
export const FD_STATUS_CONF: Record<string,{label:string;color:string;bg:string}> = {
  'VALIDÉ':    {label:'Validé',     color:'#059669',bg:'rgba(5,150,105,0.12)'},
  'EN_COURS':  {label:'En cours',   color:'#003DA5',bg:'rgba(0,61,165,0.10)'},
  'ARCHIVÉ':   {label:'Archivé',    color:'#64748B',bg:'rgba(100,116,139,0.10)'},
  'À_VÉRIFIER':{label:'À vérifier',color:'#B45309',bg:'rgba(180,83,9,0.10)'},
  'CORRIGÉ':   {label:'Corrigé',    color:'#7C3AED',bg:'rgba(124,58,237,0.12)'},
}

// ── API ENDPOINTS DÉMO ────────────────────────────────────────
export const API_ENDPOINTS = [
  {id:'API-001',name:'Enterprise API',   version:'v2.1',status:'CONNECTED',requests:24_582,success:99.8,errors:49,lastSync:'2026-09-18T10:38:00Z',scopes:['enterprise:read','enterprise:write']},
  {id:'API-002',name:'Driver API',       version:'v2.0',status:'CONNECTED',requests:18_441,success:99.5,errors:92,lastSync:'2026-09-18T10:32:00Z',scopes:['drivers:read','drivers:write']},
  {id:'API-003',name:'Vehicle API',      version:'v2.0',status:'CONNECTED',requests:8_220, success:100, errors:0, lastSync:'2026-09-18T09:45:00Z',scopes:['vehicles:read','vehicles:write']},
  {id:'API-004',name:'Activity API',     version:'v1.8',status:'CONNECTED',requests:41_820,success:99.9,errors:42,lastSync:'2026-09-18T10:38:00Z',scopes:['activities:read']},
  {id:'API-005',name:'Transaction API',  version:'v2.2',status:'CONNECTED',requests:38_640,success:99.7,errors:116,lastSync:'2026-09-18T10:38:00Z',scopes:['transactions:read','transactions:write']},
  {id:'API-006',name:'Revenue API',      version:'v1.5',status:'CONNECTED',requests:12_100,success:100, errors:0, lastSync:'2026-09-18T10:00:00Z',scopes:['revenue:read']},
  {id:'API-007',name:'Tax API',          version:'v1.2',status:'CONNECTED',requests:6_480, success:99.6,errors:26,lastSync:'2026-09-18T09:00:00Z',scopes:['tax:read']},
  {id:'API-008',name:'Document API',     version:'v1.0',status:'CONNECTED',requests:3_210, success:100, errors:0, lastSync:'2026-09-17T08:00:00Z',scopes:['documents:read']},
  {id:'API-009',name:'Government API',   version:'v0.1',status:'PLANNED',  requests:0,     success:0,   errors:0, lastSync:null,               scopes:['government:read','government:write']},
  {id:'API-010',name:'Compliance API',   version:'v1.1',status:'CONNECTED',requests:2_140, success:100, errors:0, lastSync:'2026-09-18T08:00:00Z',scopes:['compliance:read']},
]

// ── WEBHOOK EVENTS DÉMO ───────────────────────────────────────
export const WEBHOOK_EVENTS_FULL = [
  {id:'WHE-001',event:'activity.completed', src:'TAXIMETER.GOV', dst:'Enterprise Gov',at:'2026-09-18T10:32:00Z',status:'SUCCESS',attempts:1,traceId:'TRC-A001',payload:'{"actId":"ACT-ENT-001","gross":42.50}',error:null},
  {id:'WHE-002',event:'transaction.created',src:'TAXIMETER.GOV', dst:'Revenue Ledger',at:'2026-09-18T10:32:05Z',status:'SUCCESS',attempts:1,traceId:'TRC-T001',payload:'{"txId":"TX-ENT-001","amount":42.50}',error:null},
  {id:'WHE-003',event:'trip.completed',     src:'UBER DEMO',      dst:'TAXIMETER.GOV',at:'2026-09-18T10:20:00Z',status:'SUCCESS',attempts:1,traceId:'TRC-U001',payload:'{"tripId":"UBER-8421","fare":22.50}', error:null},
  {id:'WHE-004',event:'tax.calculated',     src:'Tax Engine',     dst:'Revenue Ledger',at:'2026-09-18T10:33:00Z',status:'SUCCESS',attempts:1,traceId:'TRC-TAX001',payload:'{"tps":2.125,"tvq":4.239}',error:null},
  {id:'WHE-005',event:'driver.updated',     src:'Enterprise Gov', dst:'TAXIMETER.GOV',at:'2026-09-17T09:00:00Z',status:'SUCCESS',attempts:1,traceId:'TRC-D001',payload:'{"driverId":"DRV-QC-0004","status":"PENDING"}',error:null},
  {id:'WHE-006',event:'document.expired',   src:'Compliance Engine',dst:'Notifications',at:'2026-09-17T08:00:00Z',status:'SUCCESS',attempts:1,traceId:'TRC-DOC001',payload:'{"docId":"DOC-007","expiry":"2026-09-30"}',error:null},
  {id:'WHE-007',event:'trip.completed',     src:'UBER DEMO',      dst:'TAXIMETER.GOV',at:'2026-09-17T10:00:00Z',status:'FAILED',  attempts:3,traceId:'TRC-U002',payload:'{}',error:'Auth token expiré'},
  {id:'WHE-008',event:'declaration.created',src:'Enterprise Gov', dst:'Gov Gateway',  at:'2026-09-18T09:00:00Z',status:'PENDING', attempts:0,traceId:'TRC-GOV001',payload:'{"declId":"DCL-Q3-2026"}',error:'Connexion gouvernementale non disponible — MODE PILOTE'},
]

// ── SCOPES API ────────────────────────────────────────────────
export const API_SCOPES = [
  {scope:'enterprise:read',  desc:'Lire le profil entreprise',          roles:['OWNER','ADMIN','FINANCE','COMPLIANCE','VIEWER']},
  {scope:'enterprise:write', desc:'Modifier le profil entreprise',      roles:['OWNER','ADMIN']},
  {scope:'drivers:read',     desc:'Consulter les dossiers chauffeurs',  roles:['OWNER','ADMIN','DISPATCH','COMPLIANCE','VIEWER']},
  {scope:'drivers:write',    desc:'Modifier les chauffeurs',            roles:['OWNER','ADMIN','DISPATCH']},
  {scope:'activities:read',  desc:'Consulter les activités',            roles:['OWNER','ADMIN','FINANCE','DISPATCH','VIEWER']},
  {scope:'transactions:read',desc:'Consulter les transactions',         roles:['OWNER','ADMIN','FINANCE']},
  {scope:'transactions:write',desc:'Créer/modifier transactions',       roles:['OWNER','ADMIN','FINANCE']},
  {scope:'revenue:read',     desc:'Consulter les revenus',              roles:['OWNER','ADMIN','FINANCE']},
  {scope:'tax:read',         desc:'Consulter données fiscales',         roles:['OWNER','ADMIN','FINANCE','COMPLIANCE']},
  {scope:'declarations:read',desc:'Consulter déclarations',             roles:['OWNER','ADMIN','FINANCE']},
  {scope:'declarations:write',desc:'Préparer/soumettre déclarations',  roles:['OWNER','ADMIN','FINANCE']},
  {scope:'documents:read',   desc:'Consulter documents',                roles:['OWNER','ADMIN','FINANCE','COMPLIANCE','VIEWER']},
  {scope:'compliance:read',  desc:'Consulter conformité',               roles:['OWNER','ADMIN','COMPLIANCE']},
  {scope:'government:read',  desc:'Données gov (futur)',                roles:['OWNER','ADMIN']},
  {scope:'government:write', desc:'Transmission gov (futur)',           roles:['OWNER']},
]

// ── UBER SERVICES DASHBOARD ───────────────────────────────────
export const UBER_SERVICES_DASHBOARD = [
  {id:'UBR-001',name:'Uber Taxi',      emoji:'🚕',status:'ACTIVE', drivers:2,vehicles:2,activities:5, trips:5, txCount:6, gross:172.25,tips:14.50,tps:8.61, tvq:17.18, cancels:0,refunds:0,exceptions:1,docs:'OK'},
  {id:'UBR-002',name:'UberX',         emoji:'🚗',status:'ACTIVE', drivers:2,vehicles:2,activities:2, trips:2, txCount:2, gross:41.50, tips:5.50, tps:2.08, tvq:4.14,  cancels:0,refunds:1,exceptions:0,docs:'OK'},
  {id:'UBR-003',name:'Uber Green',    emoji:'🟢',status:'ACTIVE', drivers:1,vehicles:1,activities:1, trips:1, txCount:1, gross:21.00, tips:0,    tps:1.05, tvq:2.09,  cancels:0,refunds:0,exceptions:0,docs:'OK'},
  {id:'UBR-004',name:'UberXL',        emoji:'🚙',status:'ACTIVE', drivers:1,vehicles:1,activities:2, trips:2, txCount:2, gross:62.50, tips:7.00, tps:3.13, tvq:6.24,  cancels:0,refunds:0,exceptions:0,docs:'OK'},
  {id:'UBR-005',name:'Uber Eats',     emoji:'🍔',status:'ACTIVE', drivers:1,vehicles:1,activities:1, trips:0, txCount:1, gross:12.00, tips:2.00, tps:0.60, tvq:1.20,  cancels:0,refunds:0,exceptions:0,docs:'OK'},
  {id:'UBR-006',name:'Uber Eats Grocery',emoji:'🛒',status:'ACTIVE',drivers:0,vehicles:0,activities:0,trips:0,txCount:0,gross:0,tips:0,tps:0,tvq:0,cancels:0,refunds:0,exceptions:0,docs:'—'},
  {id:'UBR-007',name:'Uber Delivery', emoji:'📦',status:'PLANNED',drivers:0,vehicles:0,activities:0, trips:0, txCount:0, gross:0,     tips:0,    tps:0,    tvq:0,     cancels:0,refunds:0,exceptions:0,docs:'—'},
]

// ── DONNÉES PUBLIQUES UBER (vérifiées) ────────────────────────
export const UBER_PUBLIC_DATA = {
  impactEco2024_qc:    1_900_000_000,
  impactEats2024_qc:   270_000_000,
  anneeRef:            2024,
  publication:         '4 décembre 2025',
  source:              'Uber Canada / Public First',
  sourceUrl:           'https://www.uber.com/ca/fr-ca/newsroom/stimuler-la-croissance-un-impact-economique-de-19-milliard-pour-uber-au-quebec/',
  noteImpact:          "1,9 G$ = impact économique ESTIMÉ au Québec — ≠ chiffre d'affaires Uber",
  chauffeursQC:        'Non publié officiellement — ne pas extrapoler',
  chauffeursSource:    'Uber ne divulgue pas le nombre exact pour le Québec',
}

// ── DÉPARTEMENTS UBER QUÉBEC ──────────────────────────────────
// ⚠️ DONNÉES SYNTHÉTIQUES — PILOTE — NE REPRÉSENTE PAS LES OPÉRATIONS RÉELLES D'UBER
// Source publique: 12 351 véhicules Uber référencés QC (Travelnet 2024)
// Nb chauffeurs actifs par dpt: NON PUBLIÉ — chiffres ci-dessous = SYNTHÉTIQUES DEMO
export const DEPARTMENTS = [
  {
    id:'DEPT-001', name:'Uber Taxi', slug:'taxi', emoji:'🚕', color:'#003DA5',
    status:'ACTIVE',
    desc:'Transport de personnes avec taximètre numérique · Permis taxi requis',
    // DONNÉES SYNTHÉTIQUES
    drivers:142, vehicles:138, activities:8_420, transactions:8_106,
    gross:2_890_000, tips:289_000, tps:r2(2_890_000*TPS), tvq:r2(2_890_000*TVQ),
    fees:r2(2_890_000*0.15), driverAmt:r2(2_890_000*0.80), entAmt:r2(2_890_000*0.20),
    cancels:314, refunds:82, exceptions:12, alerts:3,
    lastSync:'2026-09-18T10:38:00Z',
    publicNote:'Permis taxi CTQ requis · Taximètre numérique obligatoire QC',
    fiscalNote:'TPS/TVQ remises selon entente Uber-Revenu Québec (transport de personnes)',
  },
  {
    id:'DEPT-002', name:'Rides (UberX / XL)', slug:'rides', emoji:'🚗', color:'#000000',
    status:'ACTIVE',
    desc:'Transport rémunéré de personnes · UberX, UberXL, Comfort',
    drivers:3_840, vehicles:3_680, activities:124_500, transactions:119_200,
    gross:18_420_000, tips:1_842_000, tps:r2(18_420_000*TPS), tvq:r2(18_420_000*TVQ),
    fees:r2(18_420_000*0.25), driverAmt:r2(18_420_000*0.75), entAmt:r2(18_420_000*0.25),
    cancels:5_300, refunds:890, exceptions:48, alerts:6,
    lastSync:'2026-09-18T10:32:00Z',
    publicNote:'Service principal Uber · UberX, UberXL, Uber Comfort',
    fiscalNote:'TPS/TVQ remises selon entente Uber-Revenu Québec (transport de personnes)',
  },
  {
    id:'DEPT-003', name:'Uber Green', slug:'green', emoji:'🟢', color:'#059669',
    status:'ACTIVE',
    desc:'Mobilité électrique et hybride · Véhicules certifiés faibles émissions',
    drivers:420, vehicles:408, activities:14_200, transactions:13_640,
    gross:2_484_000, tips:248_400, tps:r2(2_484_000*TPS), tvq:r2(2_484_000*TVQ),
    fees:r2(2_484_000*0.22), driverAmt:r2(2_484_000*0.78), entAmt:r2(2_484_000*0.22),
    cancels:560, refunds:48, exceptions:4, alerts:1,
    lastSync:'2026-09-18T09:45:00Z',
    publicNote:'Véhicules électriques/hybrides certifiés',
    fiscalNote:'Même traitement fiscal que Rides',
  },
  {
    id:'DEPT-004', name:'Uber Eats', slug:'eats', emoji:'🍔', color:'#06B029',
    status:'ACTIVE',
    desc:'Livraison de repas · Restaurants partenaires · Coursiers',
    drivers:5_200, vehicles:4_900, activities:312_000, transactions:298_400,
    gross:24_960_000, tips:3_744_000, tps:r2(24_960_000*TPS), tvq:r2(24_960_000*TVQ),
    fees:r2(24_960_000*0.30), driverAmt:r2(24_960_000*0.65), entAmt:r2(24_960_000*0.35),
    cancels:13_000, refunds:2_980, exceptions:124, alerts:8,
    lastSync:'2026-09-18T10:20:00Z',
    publicNote:'>270 M$ retombées restaurateurs QC 2024 (Uber Canada/Public First)',
    fiscalNote:'Obligations Uber Eats distinctes — TPS/TVQ livreurs: obligations propres selon RQ',
  },
  {
    id:'DEPT-005', name:'Uber Eats Épicerie', slug:'grocery', emoji:'🛒', color:'#7C3AED',
    status:'ACTIVE',
    desc:'Livraison épicerie et commerce de détail · Cornershop / partenaires',
    drivers:820, vehicles:780, activities:42_000, transactions:40_200,
    gross:5_880_000, tips:588_000, tps:r2(5_880_000*TPS), tvq:r2(5_880_000*TVQ),
    fees:r2(5_880_000*0.28), driverAmt:r2(5_880_000*0.65), entAmt:r2(5_880_000*0.35),
    cancels:1_800, refunds:420, exceptions:18, alerts:2,
    lastSync:'2026-09-18T09:30:00Z',
    publicNote:'Service épicerie et commerce de détail',
    fiscalNote:'Traitement fiscal variable selon type de produit livré',
  },
  {
    id:'DEPT-006', name:'Uber Courier / Colis', slug:'courier', emoji:'📦', color:'#B45309',
    status:'ACTIVE',
    desc:'Livraison de colis et courrier · Clients corporatifs et particuliers',
    drivers:380, vehicles:362, activities:18_400, transactions:17_640,
    gross:2_760_000, tips:138_000, tps:r2(2_760_000*TPS), tvq:r2(2_760_000*TVQ),
    fees:r2(2_760_000*0.28), driverAmt:r2(2_760_000*0.68), entAmt:r2(2_760_000*0.32),
    cancels:760, refunds:88, exceptions:8, alerts:2,
    lastSync:'2026-09-17T22:00:00Z',
    publicNote:'Uber Direct / Courier — livraison B2B et B2C',
    fiscalNote:'Livraison de biens — TPS/TVQ applicable selon catégorie',
  },
  {
    id:'DEPT-007', name:'Uber Direct / Entreprises', slug:'direct', emoji:'🚚', color:'#64748B',
    status:'PLANNED',
    desc:'Livraison API pour entreprises · Intégration B2B · Flottes corporate',
    drivers:0, vehicles:0, activities:0, transactions:0,
    gross:0, tips:0, tps:0, tvq:0, fees:0, driverAmt:0, entAmt:0,
    cancels:0, refunds:0, exceptions:0, alerts:0,
    lastSync:null,
    publicNote:'Uber Direct — intégration API entreprises',
    fiscalNote:'Facturation B2B — traitement fiscal distinct',
  },
]

export const DEPT_CONF: Record<string,{emoji:string;color:string;label:string}> = Object.fromEntries(
  DEPARTMENTS.map(d=>[d.slug, {emoji:d.emoji, color:d.color, label:d.name}])
)

// Véhicules publics QC
export const UBER_QC_PUBLIC = {
  vehicules_ref: 12_351,
  vehicules_source: 'Travelnet / données sectorielles 2024',
  vehicules_note: 'Véhicules Uber référencés/enregistrés au Québec — ne constitue pas le nombre de chauffeurs actifs',
  impact_eco: 1_900_000_000,
  impact_eats: 270_000_000,
  source_impact: 'Uber Canada / Public First — décembre 2025',
  chauffeurs_note: 'Nombre de chauffeurs actifs par département: données non publiées officiellement — chiffres pilote = SYNTHÉTIQUES',
}

// ── ACTIVITÉS OPÉRATIONNELLES DEMO (30 activités multi-depts) ─
const mkAct=(id:string,dept:string,svc:string,drvId:string,vehId:string,at:string,origin:string,dest:string,dist:number,dur:number,fare:number,tip:number)=>({
  id,dept,svc,driverId:drvId,vehicleId:vehId,at,origin,dest,dist,dur,fare,tip,
  tps:r2(fare*TPS),tvq:r2(fare*TVQ),
  commission:r2(fare*(svc.includes('EATS')||svc.includes('COURIER')?0.30:0.25)),
  driverAmt:r2(fare*(svc.includes('EATS')||svc.includes('COURIER')?0.65:0.75)),
  status:Math.random()>0.05?'TERMINÉE':'À VÉRIFIER',
  syncStatus:'SYNCED',
  txId:`TX-OPS-${id.split('-').pop()}`,
})

export const OPS_ACTIVITIES = [
  mkAct('OPS-001','taxi',   'UBER TAXI',  'DRV-QC-0001','TXM-001','2026-09-18T10:30:00Z','Montréal-Nord','YUL',         22.4,28,42.50,5.00),
  mkAct('OPS-002','taxi',   'UBER TAXI',  'DRV-QC-0001','TXM-001','2026-09-18T09:10:00Z','Plateau',      'Centre-ville', 4.8,12,18.75,2.00),
  mkAct('OPS-003','rides',  'UBERX',      'DRV-QC-0002','TXM-002','2026-09-18T08:30:00Z','Mile-End',     'Westmount',    5.2,14,22.50,3.00),
  mkAct('OPS-004','taxi',   'UBER TAXI',  'DRV-QC-0003','TXM-003','2026-09-18T07:45:00Z','Rosemont',     'Plateau',      3.1, 9,14.00,1.50),
  mkAct('OPS-005','rides',  'UBER GREEN', 'DRV-QC-0002','TXM-002','2026-09-17T18:15:00Z','NDG',          'Côte-des-Neiges',3.8,10,19.00,2.50),
  mkAct('OPS-006','green',  'UBER GREEN', 'DRV-QC-0003','TXM-003','2026-09-17T16:00:00Z','Verdun',       'LaSalle',      6.2,16,21.00,0),
  mkAct('OPS-007','taxi',   'UBER TAXI',  'DRV-QC-0006','TXM-006','2026-09-17T14:30:00Z','Ahuntsic',     'Montréal-Nord',7.1,18,24.50,3.00),
  mkAct('OPS-008','eats',   'UBER EATS',  'DRV-QC-0006','TXM-006','2026-09-17T12:00:00Z','Restaurant A', 'Client DEMO',  3.5,14,12.00,2.00),
  mkAct('OPS-009','taxi',   'UBER TAXI',  'DRV-QC-0001','TXM-001','2026-09-17T08:00:00Z','Longueuil',    'Montréal',    15.2,22,38.00,4.00),
  mkAct('OPS-010','courier','UBER COURIER','DRV-QC-0004','TXM-004','2026-09-17T22:00:00Z','Entrepôt DEMO','Client DEMO',  8.2,20,16.50,0),
  mkAct('OPS-011','rides',  'UBERXL',     'DRV-QC-0005','TXM-005','2026-09-16T15:30:00Z','Laval',        'YUL',         28.4,35,52.00,6.00),
  mkAct('OPS-012','eats',   'UBER EATS',  'DRV-QC-0006','TXM-006','2026-09-16T13:00:00Z','Restaurant B', 'Client DEMO',  2.8,10,10.50,1.50),
  mkAct('OPS-013','grocery','UBER GROCERY','DRV-QC-0003','TXM-003','2026-09-16T11:00:00Z','IGA DEMO',     'Client DEMO',  4.2,15,14.00,0),
  mkAct('OPS-014','taxi',   'UBER TAXI',  'DRV-QC-0001','TXM-001','2026-09-16T10:00:00Z','Anjou',        'Centre-ville',14.8,25,35.00,4.00),
  mkAct('OPS-015','rides',  'UBERX',      'DRV-QC-0002','TXM-002','2026-09-16T09:00:00Z','Plateau',      'Rosemont',     2.4, 8,11.00,1.00),
  mkAct('OPS-016','green',  'UBER GREEN', 'DRV-QC-0003','TXM-003','2026-09-15T18:00:00Z','Westmount',    'NDG',          3.9,11,15.50,2.00),
  mkAct('OPS-017','eats',   'UBER EATS',  'DRV-QC-0006','TXM-006','2026-09-15T12:30:00Z','Restaurant C', 'Client DEMO',  1.8, 8, 9.00,1.00),
  mkAct('OPS-018','courier','UBER COURIER','DRV-QC-0004','TXM-004','2026-09-15T10:00:00Z','Bureau DEMO',  'Client DEMO',  6.1,18,14.50,0),
  mkAct('OPS-019','taxi',   'UBER TAXI',  'DRV-QC-0001','TXM-001','2026-09-15T08:00:00Z','Brossard',     'Montréal',    12.4,18,29.00,3.00),
  mkAct('OPS-020','grocery','UBER GROCERY','DRV-QC-0003','TXM-003','2026-09-14T14:00:00Z','Metro DEMO',   'Client DEMO',  5.1,18,16.50,0),
]

// ── COMPLIANCE DATA ENRICHIE ──────────────────────────────────
export const COMPLIANCE_DEPT_SUMMARY = DEPARTMENTS.filter(d=>d.status==='ACTIVE').map(d=>({
  deptId:   d.id,
  deptName: d.name,
  emoji:    d.emoji,
  color:    d.color,
  scores: {
    admin:     d.slug==='taxi'?98:d.slug==='rides'?96:d.slug==='eats'?94:d.slug==='green'?99:d.slug==='grocery'?92:95,
    documents: d.slug==='taxi'?96:d.slug==='rides'?94:d.slug==='eats'?91:d.slug==='green'?98:d.slug==='grocery'?89:93,
    vehicles:  d.slug==='taxi'?99:d.slug==='rides'?97:d.slug==='eats'?88:d.slug==='green'?100:d.slug==='grocery'?90:96,
    fiscal:    d.slug==='taxi'?97:d.slug==='rides'?96:d.slug==='eats'?93:d.slug==='green'?98:d.slug==='grocery'?91:94,
    data:      d.slug==='taxi'?95:d.slug==='rides'?98:d.slug==='eats'?96:d.slug==='green'?99:d.slug==='grocery'?94:97,
  },
  obligations: d.alerts+d.exceptions,
  alerts:      d.alerts,
  exceptions:  d.exceptions,
}))

export const READINESS_CHECKLIST = [
  {id:'RC-001',label:'Identité entreprise',   status:'OK',  note:'NEQ, TPS, TVQ configurés (DEMO)'},
  {id:'RC-002',label:'Chauffeurs vérifiés',   status:'WARN',note:`${ENT_DRIVERS?.length??6} actifs · 1 en attente`},
  {id:'RC-003',label:'Véhicules conformes',   status:'WARN',note:'5/6 conformes · 1 inspection expirante'},
  {id:'RC-004',label:'Documents valides',     status:'WARN',note:'7/9 valides · 2 expirants'},
  {id:'RC-005',label:'Activités synchronisées',status:'OK', note:'Sync TAXIMETER.GOV à jour'},
  {id:'RC-006',label:'Transactions vérifiées',status:'OK',  note:'13/15 réconciliées'},
  {id:'RC-007',label:'Revenus calculés',      status:'OK',  note:'Revenue Ledger à jour'},
  {id:'RC-008',label:'TPS/TVQ calculées',     status:'OK',  note:'Estimation Q3 disponible'},
  {id:'RC-009',label:'Déclarations préparées',status:'WARN',note:'Q3 en cours de préparation'},
  {id:'RC-010',label:'Rapprochement effectué',status:'WARN',note:'2 exceptions ouvertes'},
]

// ── CHAUFFEURS SYNTHÉTIQUES UBER QC (représentatifs, non exhaustifs) ──
// ⚠️ DONNÉES SYNTHÉTIQUES — PILOTE — NE REPRÉSENTE PAS LES CHAUFFEURS RÉELS D'UBER
const mkDrv=(id:string,name:string,dept:string,svc:string[],status:string,plate:string,veh:string,rel:string,score:number,docs:string)=>({
  id,name,dept,services:svc,status,plate,vehicle:veh,relation:rel,complianceScore:score,docs,
  actQ3:Math.floor(Math.random()*800+100),
  revQ3:r2(Math.floor(Math.random()*800+100)*r2(Math.random()*15+12)),
})
export const UBER_DRIVERS_SAMPLE = [
  // Taxi
  ...Array.from({length:8},(_,i)=>mkDrv(`DRV-TAXI-${String(i+1).padStart(4,'0')}`,`Chauffeur Taxi ${i+1}`,'taxi',['UBER TAXI'],'ACTIVE',`TAX-${1000+i}`,`VEH-TAXI-${1000+i}`,'CONTRACTOR',Math.floor(Math.random()*20+78),'OK')),
  // Rides
  ...Array.from({length:10},(_,i)=>mkDrv(`DRV-RIDE-${String(i+1).padStart(4,'0')}`,`Chauffeur Rides ${i+1}`,'rides',['UBERX','UBERXL'],'ACTIVE',`RID-${2000+i}`,`VEH-RIDE-${2000+i}`,'CONTRACTOR',Math.floor(Math.random()*20+75),'OK')),
  // Green
  ...Array.from({length:4},(_,i)=>mkDrv(`DRV-GRN-${String(i+1).padStart(4,'0')}`,`Chauffeur Green ${i+1}`,'green',['UBER GREEN'],'ACTIVE',`GRN-${3000+i}`,`VEH-GREEN-${3000+i}`,'CONTRACTOR',Math.floor(Math.random()*15+82),'OK')),
  // Eats
  ...Array.from({length:10},(_,i)=>mkDrv(`DRV-EAT-${String(i+1).padStart(4,'0')}`,`Livreur Eats ${i+1}`,'eats',['UBER EATS'],'ACTIVE',`EAT-${4000+i}`,`VEH-EATS-${4000+i}`,'CONTRACTOR',Math.floor(Math.random()*20+70),'OK')),
  // Grocery
  ...Array.from({length:4},(_,i)=>mkDrv(`DRV-GRC-${String(i+1).padStart(4,'0')}`,`Livreur Épicerie ${i+1}`,'grocery',['UBER EATS GROCERY'],'ACTIVE',`GRC-${5000+i}`,`VEH-GRC-${5000+i}`,'CONTRACTOR',Math.floor(Math.random()*15+75),'OK')),
  // Courier
  ...Array.from({length:4},(_,i)=>mkDrv(`DRV-COR-${String(i+1).padStart(4,'0')}`,`Livreur Courier ${i+1}`,'courier',['UBER COURIER'],'ACTIVE',`COR-${6000+i}`,`VEH-COR-${6000+i}`,'CONTRACTOR',Math.floor(Math.random()*20+72),'OK')),
  // Multi-services + quelques avec docs ⚠️
  mkDrv('DRV-MULTI-001','Multi-services A','rides',['UBERX','UBER TAXI','UBER GREEN'],'ACTIVE','MLT-7001','VEH-MLT-7001','CONTRACTOR',92,'OK'),
  mkDrv('DRV-MULTI-002','Multi-services B','eats', ['UBER EATS','UBER EATS GROCERY'],'ACTIVE','MLT-7002','VEH-MLT-7002','CONTRACTOR',88,'OK'),
  mkDrv('DRV-DOC-001','Docs expirants 1','taxi', ['UBER TAXI'],'ACTIVE','EXP-8001','VEH-EXP-8001','CONTRACTOR',72,'EXPIRING'),
  mkDrv('DRV-DOC-002','Docs expirants 2','rides',['UBERX'],        'ACTIVE','EXP-8002','VEH-EXP-8002','CONTRACTOR',68,'EXPIRING'),
  mkDrv('DRV-SUS-001','Suspendu 1',      'eats', ['UBER EATS'],    'SUSPENDED','SUS-9001','VEH-SUS-9001','CONTRACTOR',40,'EXPIRED'),
]

// Résumé pour affichage dans la liste chauffeurs
export const DRIVERS_SUMMARY = {
  totalPilot: 6,        // chauffeurs avec profil complet (détaillés)
  totalSample: UBER_DRIVERS_SAMPLE.length, // chauffeurs échantillon demo
  totalSynthetic: 10_724, // total synthétique Uber QC tous depts
  note: 'DONNÉES SYNTHÉTIQUES — Nb exact chauffeurs Uber QC non publié officiellement',
  publicRef: '12 351 véhicules Uber QC (réf. publique 2024, Travelnet)',
}

// ── ANALYTICS DATA ────────────────────────────────────────────
export const ANALYTICS_MONTHLY = [
  {m:'Oct 2025',gross:28_400,tps:r2(28_400*TPS),tvq:r2(28_400*TVQ),acts:1_820,drivers:9_200},
  {m:'Nov 2025',gross:31_200,tps:r2(31_200*TPS),tvq:r2(31_200*TVQ),acts:2_010,drivers:9_400},
  {m:'Déc 2025',gross:38_600,tps:r2(38_600*TPS),tvq:r2(38_600*TVQ),acts:2_480,drivers:9_600},
  {m:'Jan 2026',gross:29_800,tps:r2(29_800*TPS),tvq:r2(29_800*TVQ),acts:1_920,drivers:9_800},
  {m:'Fév 2026',gross:27_400,tps:r2(27_400*TPS),tvq:r2(27_400*TVQ),acts:1_760,drivers:9_900},
  {m:'Mar 2026',gross:32_100,tps:r2(32_100*TPS),tvq:r2(32_100*TVQ),acts:2_060,drivers:10_100},
  {m:'Avr 2026',gross:44_200,tps:r2(44_200*TPS),tvq:r2(44_200*TVQ),acts:2_840,drivers:10_200},
  {m:'Mai 2026',gross:48_600,tps:r2(48_600*TPS),tvq:r2(48_600*TVQ),acts:3_120,drivers:10_400},
  {m:'Jun 2026',gross:51_680,tps:r2(51_680*TPS),tvq:r2(51_680*TVQ),acts:3_320,drivers:10_600},
  {m:'Jul 2026',gross:58_200,tps:r2(58_200*TPS),tvq:r2(58_200*TVQ),acts:3_740,drivers:10_800},
  {m:'Aoû 2026',gross:61_400,tps:r2(61_400*TPS),tvq:r2(61_400*TVQ),acts:3_950,drivers:10_900},
  {m:'Sep 2026',gross:121_600,tps:r2(121_600*TPS),tvq:r2(121_600*TVQ),acts:7_820,drivers:10_724},
]

export const ANALYTICS_REGIONS = [
  {region:'Montréal',          drivers:5_840,vehicles:5_620,acts:198_400,gross:14_280_000,tps:r2(14_280_000*TPS)},
  {region:'Laval',             drivers:1_240,vehicles:1_180,acts:38_200, gross:2_750_400, tps:r2(2_750_400*TPS)},
  {region:'Longueuil',         drivers:980, vehicles:940,  acts:28_600,  gross:2_059_200, tps:r2(2_059_200*TPS)},
  {region:'Québec (ville)',    drivers:840, vehicles:810,  acts:22_400,  gross:1_612_800, tps:r2(1_612_800*TPS)},
  {region:'Gatineau',          drivers:420, vehicles:400,  acts:10_200,  gross:734_400,   tps:r2(734_400*TPS)},
  {region:'Montérégie',        drivers:380, vehicles:362,  acts:8_800,   gross:633_600,   tps:r2(633_600*TPS)},
  {region:'Laurentides',       drivers:280, vehicles:268,  acts:6_200,   gross:446_400,   tps:r2(446_400*TPS)},
  {region:'Lanaudière',        drivers:240, vehicles:228,  acts:5_100,   gross:367_200,   tps:r2(367_200*TPS)},
  {region:'Estrie',            drivers:180, vehicles:172,  acts:3_800,   gross:273_600,   tps:r2(273_600*TPS)},
  {region:'Autres régions',   drivers:320, vehicles:305,  acts:6_300,   gross:453_600,   tps:r2(453_600*TPS)},
]

// ── ANOMALIES INTELLIGENCE ────────────────────────────────────
export const ANOMALIES = [
  {id:'ANOM-001',type:'ÉCART_TX',    dept:'taxi',   level:'IMPORTANT',status:'À VÉRIFIER',at:'2026-09-18T10:05:00Z',actId:'ACT-ENT-005',txId:'TX-ENT-005',   actAmt:16.50,txAmt:50.00,diff:33.50,  desc:'Montant activité (16,50$) ≠ transaction (50,00$) — écart de 33,50$ à analyser',src:'Réconciliation automatique'},
  {id:'ANOM-002',type:'TX_MANQUANTE',dept:'taxi',   level:'IMPORTANT',status:'OUVERTE',   at:'2026-09-17T22:05:00Z',actId:'ACT-ENT-005',txId:null,           actAmt:16.50,txAmt:0,    diff:16.50, desc:'Activité sans transaction correspondante dans le ledger',src:'Validation automatique'},
  {id:'ANOM-003',type:'DOC_EXPIRÉ',  dept:'taxi',   level:'ATTENTION',status:'OUVERTE',   at:'2026-09-17T08:00:00Z',actId:null,         txId:null,           actAmt:0,    txAmt:0,    diff:0,     desc:'Permis DRV-QC-0004 expire 2026-09-30 — 12 jours restants',src:'Moteur conformité'},
  {id:'ANOM-004',type:'DOC_EXPIRÉ',  dept:'taxi',   level:'CRITIQUE', status:'OUVERTE',   at:'2026-09-17T08:00:00Z',actId:null,         txId:null,           actAmt:0,    txAmt:0,    diff:0,     desc:'Permis DRV-QC-0005 expiré depuis 2026-03-01 — chauffeur suspendu',src:'Moteur conformité'},
  {id:'ANOM-005',type:'WEBHOOK_FAIL',dept:'rides',  level:'ATTENTION',status:'RÉSOLUE',   at:'2026-09-17T10:00:00Z',actId:null,         txId:'UBER-TX-FAIL1',actAmt:0,    txAmt:0,    diff:0,     desc:'Webhook UBER-TX-FAIL1 échoué (3 tentatives) — auth token expiré',src:'Webhook engine'},
  {id:'ANOM-006',type:'SYNC_ERR',    dept:'rides',  level:'INFO',     status:'RÉSOLUE',   at:'2026-09-17T22:02:00Z',actId:null,         txId:null,           actAmt:0,    txAmt:0,    diff:0,     desc:'1 activité non réconciliée lors sync incrémentale — auto-résolu sync suivante',src:'TAXIMETER.GOV'},
  {id:'ANOM-007',type:'INSPECTION',  dept:'taxi',   level:'IMPORTANT',status:'OUVERTE',   at:'2026-09-15T08:00:00Z',actId:null,         txId:null,           actAmt:0,    txAmt:0,    diff:0,     desc:'Inspection TXM-004 expire 2026-09-30 — 12 jours',src:'Moteur conformité'},
]

export const ANOMALY_TYPE_CONF: Record<string,{label:string;icon:string;color:string}> = {
  ÉCART_TX:     {label:'Écart transactionnel',   icon:'💸',color:'#DC2626'},
  TX_MANQUANTE: {label:'Transaction manquante',  icon:'❌',color:'#DC2626'},
  DOC_EXPIRÉ:   {label:'Document expiré/expirant',icon:'📄',color:'#B45309'},
  WEBHOOK_FAIL: {label:'Webhook échoué',          icon:'📡',color:'#7C3AED'},
  SYNC_ERR:     {label:'Erreur synchronisation',  icon:'🔄',color:'#003DA5'},
  INSPECTION:   {label:'Inspection véhicule',     icon:'🔧',color:'#B45309'},
}
export const ANOMALY_LEVEL_CONF: Record<string,{label:string;color:string;bg:string}> = {
  CRITIQUE:  {label:'CRITIQUE',  color:'#DC2626',bg:'rgba(220,38,38,0.12)'},
  IMPORTANT: {label:'IMPORTANT', color:'#B45309',bg:'rgba(180,83,9,0.10)'},
  ATTENTION: {label:'ATTENTION', color:'#7C3AED',bg:'rgba(124,58,237,0.12)'},
  INFO:      {label:'INFO',      color:'#003DA5',bg:'rgba(0,61,165,0.10)'},
}

// ── REPORT TEMPLATES ENRICHIS ─────────────────────────────────
export const REPORT_TEMPLATES = [
  {id:'RPT-001',name:'Rapport revenus entreprise',      cat:'FINANCIAL',  icon:'💰',formats:['PDF','CSV','Excel'],desc:'Revenus bruts/nets, commissions, pourboires par département et période',lastGenAt:'2026-09-17T10:00:00Z'},
  {id:'RPT-002',name:'Déclaration TPS/TVQ estimée',     cat:'FISCAL',     icon:'🧾',formats:['PDF','CSV'],       desc:'Estimation TPS/TVQ par période — MODE PILOTE · À valider avant transmission',lastGenAt:'2026-09-10T08:00:00Z'},
  {id:'RPT-003',name:'Rapport réconciliation',          cat:'RECON',      icon:'🔄',formats:['PDF','CSV','Excel'],desc:'Correspondances, écarts et exceptions par source de données',lastGenAt:'2026-09-15T14:00:00Z'},
  {id:'RPT-004',name:'Rapport chauffeurs & livreurs',   cat:'DRIVERS',    icon:'👤',formats:['PDF','CSV'],       desc:'Liste chauffeurs, conformité, revenus, activités par département',lastGenAt:'2026-09-16T09:00:00Z'},
  {id:'RPT-005',name:'Rapport conformité',              cat:'COMPLIANCE', icon:'⚖️',formats:['PDF','CSV'],       desc:'Statut conformité, documents expirés, obligations en attente',lastGenAt:'2026-09-14T08:00:00Z'},
  {id:'RPT-006',name:'Rapport activités opérationnelles',cat:'OPERATIONS',icon:'📍',formats:['PDF','CSV','Excel'],desc:'Courses, livraisons, km, heures par département et chauffeur',lastGenAt:'2026-09-18T07:00:00Z'},
  {id:'RPT-007',name:'Rapport audit complet',           cat:'AUDIT',      icon:'🛡️',formats:['PDF'],            desc:'Journal complet des actions, modifications et accès',lastGenAt:'2026-09-01T08:00:00Z'},
  {id:'RPT-008',name:'Dossier gouvernemental',          cat:'GOVERNMENT', icon:'🏛️',formats:['PDF'],            desc:'Préparation transmission TAXIMETER.GOV — MODE PILOTE',lastGenAt:null},
]

export const GENERATED_REPORTS = [
  {id:'GR-001',templateId:'RPT-001',name:'Revenus Q3 2026 — Uber QC',     period:'Q3 2026',format:'PDF',  size:'2.4 MB',status:'SAVED',generatedAt:'2026-09-17T10:02:00Z',generatedBy:'Jean-Philippe Roy',sentTo:null,sentAt:null},
  {id:'GR-002',templateId:'RPT-006',name:'Activités septembre 2026',       period:'Sep 2026',format:'CSV',  size:'1.8 MB',status:'SAVED',generatedAt:'2026-09-18T07:05:00Z',generatedBy:'SYSTEM',sentTo:null,sentAt:null},
  {id:'GR-003',templateId:'RPT-002',name:'Estimation TPS/TVQ Q3 — PILOTE',period:'Q3 2026',format:'PDF',  size:'820 KB',status:'SENT', generatedAt:'2026-09-10T08:12:00Z',generatedBy:'Jean-Philippe Roy',sentTo:'s.marchand@uber-demo.taximetergov.demo',sentAt:'2026-09-10T08:15:00Z'},
]

export const RPT_CAT_CONF: Record<string,{label:string;color:string}> = {
  FINANCIAL:  {label:'Financier',   color:'#059669'},
  FISCAL:     {label:'Fiscal',      color:'#7C3AED'},
  RECON:      {label:'Réconciliation',color:'#B45309'},
  DRIVERS:    {label:'Chauffeurs',  color:'#003DA5'},
  COMPLIANCE: {label:'Conformité',  color:'#DC2626'},
  OPERATIONS: {label:'Opérations',  color:'#000000'},
  AUDIT:      {label:'Audit',       color:'#64748B'},
  GOVERNMENT: {label:'Gouvernemental',color:'#003DA5'},
}

// ══════════════════════════════════════════════════════════════
// PHASES 25-26-27 DATA — CONFORMITÉ · AUDIT · SÉCURITÉ
// ⚠️ DONNÉES SYNTHÉTIQUES — PILOTE — AUCUNE VALEUR LÉGALE
// ══════════════════════════════════════════════════════════════

// ── COMPLIANCE CASES ─────────────────────────────────────────
export const COMPLIANCE_CASES = [
  {id:'CASE-2026-0001',type:'DOC_EXPIRÉ',  obj:'Véhicule',    objId:'TXM-004',dept:'taxi',   priority:'IMPORTANT',status:'EN ANALYSE', openedAt:'2026-09-15T08:00:00Z',assignedTo:'Jean-Philippe Roy',desc:'Inspection TXM-004 expire 2026-09-30 — action urgente requise',actions:['Ouvrir','Attribuer','Demander document','Résoudre'],resolvedAt:null,notes:'Document de renouvellement en préparation'},
  {id:'CASE-2026-0002',type:'DOC_EXPIRÉ',  obj:'Chauffeur',   objId:'DRV-QC-0005',dept:'taxi',priority:'CRITIQUE', status:'RÉSOLU',    openedAt:'2026-09-01T08:00:00Z',assignedTo:'Sophie Marchand',  desc:'Permis DRV-QC-0005 expiré — chauffeur suspendu en attente renouvellement',actions:['Voir','Fermer'],resolvedAt:'2026-09-12T14:00:00Z',notes:'Chauffeur suspendu jusqu\'au renouvellement du permis'},
  {id:'CASE-2026-0003',type:'ÉCART_TX',    obj:'Transaction', objId:'TX-ENT-005',dept:'taxi',  priority:'IMPORTANT',status:'EN ANALYSE', openedAt:'2026-09-18T10:05:00Z',assignedTo:'Jean-Philippe Roy',desc:'Écart de 33,50$ entre activité (16,50$) et transaction (50,00$)',actions:['Ouvrir','Attribuer','Ajouter note','Résoudre'],resolvedAt:null,notes:'Analyse en cours — vérifier le calcul de commission'},
  {id:'CASE-2026-0004',type:'WEBHOOK_FAIL',obj:'API',         objId:'WHE-007',dept:'rides',  priority:'ATTENTION',status:'RÉSOLU',    openedAt:'2026-09-17T10:00:00Z',assignedTo:'Karim Benali',     desc:'Webhook UBER-TX-FAIL1 échoué 3 tentatives — token auth expiré',actions:['Voir','Fermer'],resolvedAt:'2026-09-17T14:00:00Z',notes:'Token renouvelé — webhook re-déclenché avec succès'},
  {id:'CASE-2026-0005',type:'DOC_EXPIRANT',obj:'Chauffeur',   objId:'DRV-QC-0004',dept:'taxi',priority:'IMPORTANT',status:'OUVERT',   openedAt:'2026-09-17T08:00:00Z',assignedTo:null,              desc:'Permis DRV-QC-0004 expire 2026-09-30 — 12 jours restants',actions:['Ouvrir','Attribuer','Demander document'],resolvedAt:null,notes:null},
]

export const CASE_TYPE_CONF: Record<string,{label:string;icon:string;color:string}> = {
  DOC_EXPIRÉ:   {label:'Document expiré',    icon:'📄',color:'#DC2626'},
  DOC_EXPIRANT: {label:'Document expirant',  icon:'⚠️',color:'#B45309'},
  ÉCART_TX:     {label:'Écart transactionnel',icon:'💸',color:'#DC2626'},
  WEBHOOK_FAIL: {label:'Webhook échoué',      icon:'📡',color:'#7C3AED'},
  SYNC_ERR:     {label:'Erreur sync',         icon:'🔄',color:'#003DA5'},
}
export const CASE_STATUS_CONF: Record<string,{label:string;color:string;bg:string}> = {
  'EN ANALYSE':{label:'En analyse',color:'#B45309',bg:'rgba(180,83,9,0.10)'},
  'OUVERT':    {label:'Ouvert',    color:'#DC2626',bg:'rgba(220,38,38,0.10)'},
  'RÉSOLU':    {label:'Résolu',   color:'#059669',bg:'rgba(5,150,105,0.12)'},
  'FERMÉ':     {label:'Fermé',    color:'#64748B',bg:'rgba(100,116,139,0.10)'},
}

// ── AUDIT EVENTS (50 événements DEMO) ────────────────────────
const mkEvt=(id:string,at:string,user:string,role:string,action:string,module:string,obj:string,objId:string,result:string,dept:string,prev:string|null=null,next:string|null=null)=>({
  id,at,user,role,action,module,obj,objId,result,dept,prev,next,
  ip:`192.168.${Math.floor(Math.random()*4+1)}.${Math.floor(Math.random()*200+10)}`,
  session:`SES-${Math.random().toString(36).slice(2,8).toUpperCase()}`,
})
export const AUDIT_EVENTS = [
  mkEvt('AUD-001','2026-09-18T10:38:00Z','Sophie Marchand',   'OWNER',   'SYNC',           'sync',      'Revenue Ledger','LED-001','SUCCESS','taxi',  null,'SYNCED'),
  mkEvt('AUD-002','2026-09-18T10:32:00Z','Jean-Philippe Roy', 'FINANCE', 'EXPORT',         'reports',   'Revenus Q3',   'GR-001', 'SUCCESS','taxi',  null,null),
  mkEvt('AUD-003','2026-09-18T10:20:00Z','SYSTÈME',           'SYSTEM',  'WEBHOOK_RECV',   'webhooks',  'Trip',         'WHE-003','SUCCESS','rides', null,'PROCESSED'),
  mkEvt('AUD-004','2026-09-18T10:05:00Z','SYSTÈME',           'SYSTEM',  'ANOMALY_DETECT', 'intelligence','TX Écart',   'ANOM-001','OPEN',  'taxi',  null,null),
  mkEvt('AUD-005','2026-09-18T09:45:00Z','Karim Benali',      'DISPATCH','UPDATE',         'drivers',   'DRV-QC-0004',  'DRV-QC-0004','SUCCESS','taxi','ACTIVE','PENDING'),
  mkEvt('AUD-006','2026-09-18T09:30:00Z','Sophie Marchand',   'OWNER',   'LOGIN',          'security',  'Session',      'SES-A001','SUCCESS','—',   null,'ACTIVE'),
  mkEvt('AUD-007','2026-09-18T09:00:00Z','Jean-Philippe Roy', 'FINANCE', 'TAX_CALCULATION','fiscal',    'TPS Q3',       'TAX-Q3', 'SUCCESS','ALL',  null,'CALCULATED'),
  mkEvt('AUD-008','2026-09-18T08:30:00Z','SYSTÈME',           'SYSTEM',  'SYNC',           'sync',      'Chauffeurs',   'SYNC-006','SUCCESS','ALL', null,'SYNCED'),
  mkEvt('AUD-009','2026-09-17T22:05:00Z','SYSTÈME',           'SYSTEM',  'ANOMALY_DETECT', 'intelligence','TX Manquante','ANOM-002','OPEN', 'taxi', null,null),
  mkEvt('AUD-010','2026-09-17T22:02:00Z','SYSTÈME',           'SYSTEM',  'SYNC',           'sync',      'Activités',    'SYNC-007','WARNING','ALL', null,'PARTIAL'),
  mkEvt('AUD-011','2026-09-17T14:00:00Z','Jean-Philippe Roy', 'FINANCE', 'EXPORT',         'reports',   'TPS/TVQ Q3',   'GR-003', 'SUCCESS','ALL', null,null),
  mkEvt('AUD-012','2026-09-17T13:00:00Z','Marie-Ève Lapointe','VIEWER',  'LOGIN',          'security',  'Session',      'SES-B002','SUCCESS','—',  null,'ACTIVE'),
  mkEvt('AUD-013','2026-09-17T12:00:00Z','SYSTÈME',           'SYSTEM',  'WEBHOOK_RECV',   'webhooks',  'Eats Delivery','WHE-008','PENDING','eats',null,'QUEUED'),
  mkEvt('AUD-014','2026-09-17T10:00:00Z','SYSTÈME',           'SYSTEM',  'WEBHOOK_FAIL',   'webhooks',  'Trip',         'WHE-007','FAILED','rides',null,'RETRY_3'),
  mkEvt('AUD-015','2026-09-17T09:00:00Z','Karim Benali',      'DISPATCH','DOCUMENT_UPLOAD','documents', 'Permis',       'DOC-NEW1','SUCCESS','taxi',null,'PENDING_VALID'),
  mkEvt('AUD-016','2026-09-17T08:30:00Z','Sophie Marchand',   'OWNER',   'APPROVE',        'compliance','CASE-2026-0004','CASE-2026-0004','SUCCESS','rides','EN ANALYSE','RÉSOLU'),
  mkEvt('AUD-017','2026-09-17T08:00:00Z','SYSTÈME',           'SYSTEM',  'COMPLIANCE_ALERT','compliance','Doc Expirant','DRV-QC-0004','ALERT','taxi',null,null),
  mkEvt('AUD-018','2026-09-16T18:00:00Z','David Chen',        'COMPLIANCE','COMPLIANCE_REVIEW','compliance','Score Depts','COMP-001','SUCCESS','ALL',null,'97%'),
  mkEvt('AUD-019','2026-09-16T15:30:00Z','SYSTÈME',           'SYSTEM',  'TRANSACTION',    'transactions','TX UberXL', 'TX-ENT-012','SUCCESS','rides',null,'RECONCILED'),
  mkEvt('AUD-020','2026-09-16T14:00:00Z','Jean-Philippe Roy', 'FINANCE', 'UPDATE',         'declarations','DCL-Q3-2026','DCL-Q3-2026','SUCCESS','ALL','DRAFT','IN_PROGRESS'),
  mkEvt('AUD-021','2026-09-16T10:00:00Z','Sophie Marchand',   'OWNER',   'VIEW',           'government','Dossier Gov','GOV-001','SUCCESS','ALL',null,null),
  mkEvt('AUD-022','2026-09-16T09:00:00Z','SYSTÈME',           'SYSTEM',  'SYNC',           'integrations','API Tx',   'API-005','SUCCESS','ALL',null,'38640 req.'),
  mkEvt('AUD-023','2026-09-15T16:00:00Z','Karim Benali',      'DISPATCH','CREATE',         'drivers',   'DRV-TAXI-0009','DRV-T009','SUCCESS','taxi',null,'PENDING'),
  mkEvt('AUD-024','2026-09-15T14:00:00Z','David Chen',        'COMPLIANCE','DOCUMENT_VALIDATE','documents','Assurance','DOC-ASS-001','SUCCESS','rides','PENDING','VALIDE'),
  mkEvt('AUD-025','2026-09-15T10:00:00Z','SYSTÈME',           'SYSTEM',  'COMPLIANCE_ALERT','compliance','Inspection','TXM-004','ALERT','taxi',null,null),
  mkEvt('AUD-026','2026-09-14T16:00:00Z','Jean-Philippe Roy', 'FINANCE', 'TAX_CALCULATION','fiscal',    'TVQ Q2',       'TAX-Q2','SUCCESS','ALL',null,'ACCEPTED'),
  mkEvt('AUD-027','2026-09-14T14:00:00Z','Sophie Marchand',   'OWNER',   'APPROVE',        'declarations','DCL-Q2-2026','DCL-Q2-2026','SUCCESS','ALL','SUBMITTED','ACCEPTED'),
  mkEvt('AUD-028','2026-09-14T10:00:00Z','SYSTÈME',           'SYSTEM',  'PAYMENT',        'payments',  'Paiement Q2',  'PAY-002','SUCCESS','ALL',null,'PAID'),
  mkEvt('AUD-029','2026-09-13T11:00:00Z','Karim Benali',      'DISPATCH','UPDATE',         'vehicles',  'TXM-001',      'TXM-001','SUCCESS','taxi','ACTIF','ACTIF'),
  mkEvt('AUD-030','2026-09-12T14:00:00Z','Sophie Marchand',   'OWNER',   'APPROVE',        'compliance','CASE-2026-0002','CASE-2026-0002','SUCCESS','taxi','EN ANALYSE','RÉSOLU'),
  mkEvt('AUD-031','2026-09-12T10:00:00Z','David Chen',        'COMPLIANCE','REJECT',       'documents', 'Doc non conforme','DOC-REJ1','SUCCESS','rides','PENDING','REJETÉ'),
  mkEvt('AUD-032','2026-09-11T09:00:00Z','Marie-Ève Lapointe','VIEWER',  'VIEW',           'analytics', 'Dashboard QC', 'DASH-001','SUCCESS','ALL',null,null),
  mkEvt('AUD-033','2026-09-10T16:00:00Z','Jean-Philippe Roy', 'FINANCE', 'EXPORT',         'reports',   'TPS Q3 estim','GR-003','SUCCESS','ALL',null,null),
  mkEvt('AUD-034','2026-09-10T08:00:00Z','SYSTÈME',           'SYSTEM',  'TAX_CALCULATION','fiscal',    'Q3 2026',      'TAX-Q3','SUCCESS','ALL',null,'412800$'),
  mkEvt('AUD-035','2026-09-08T10:00:00Z','Sophie Marchand',   'OWNER',   'UPDATE',         'profile',   'Profil Uber',  'ENT-DEMO-001','SUCCESS','ALL',null,null),
  mkEvt('AUD-036','2026-09-07T15:00:00Z','SYSTÈME',           'SYSTEM',  'SYNC',           'sync',      'Eats Livreurs','SYNC-EATS','SUCCESS','eats',null,'5200 actifs'),
  mkEvt('AUD-037','2026-09-06T10:00:00Z','Karim Benali',      'DISPATCH','DOCUMENT_UPLOAD','documents', 'Assurance Veh','DOC-ASS-NEW','SUCCESS','green',null,'PENDING'),
  mkEvt('AUD-038','2026-09-05T14:00:00Z','David Chen',        'COMPLIANCE','COMPLIANCE_REVIEW','compliance','Green Dept','COMP-GREEN','SUCCESS','green',null,'99%'),
  mkEvt('AUD-039','2026-09-04T11:00:00Z','Jean-Philippe Roy', 'FINANCE', 'VIEW',           'reconciliation','Recon Q3','RECON-Q3','SUCCESS','ALL',null,null),
  mkEvt('AUD-040','2026-09-03T09:00:00Z','Sophie Marchand',   'OWNER',   'LOGOUT',         'security',  'Session',      'SES-A001','SUCCESS','—','ACTIVE','CLOSED'),
  mkEvt('AUD-041','2026-09-02T16:00:00Z','SYSTÈME',           'SYSTEM',  'SYNC',           'sync',      'Grocery Sync', 'SYNC-GRC','SUCCESS','grocery',null,'820 actifs'),
  mkEvt('AUD-042','2026-09-02T10:00:00Z','David Chen',        'COMPLIANCE','CREATE',       'compliance','CASE-2026-0005','CASE-2026-0005','SUCCESS','taxi',null,'OUVERT'),
  mkEvt('AUD-043','2026-09-01T14:00:00Z','SYSTÈME',           'SYSTEM',  'REPORT_EXPORT',  'reports',   'Audit Août',   'RPT-AUD-1','SUCCESS','ALL',null,null),
  mkEvt('AUD-044','2026-09-01T10:00:00Z','Sophie Marchand',   'OWNER',   'LOGIN',          'security',  'Session',      'SES-A002','SUCCESS','—',null,'ACTIVE'),
  mkEvt('AUD-045','2026-08-31T18:00:00Z','SYSTÈME',           'SYSTEM',  'SYNC',           'sync',      'Courier Sync', 'SYNC-COR','SUCCESS','courier',null,'380 actifs'),
  mkEvt('AUD-046','2026-08-30T10:00:00Z','Marie-Ève Lapointe','VIEWER',  'VIEW',           'drivers',   'Liste Eats',   'DRV-EATS','SUCCESS','eats',null,null),
  mkEvt('AUD-047','2026-08-28T14:00:00Z','Jean-Philippe Roy', 'FINANCE', 'PAYMENT',        'payments',  'Paiement Q1',  'PAY-001','SUCCESS','ALL',null,'PAID'),
  mkEvt('AUD-048','2026-08-27T11:00:00Z','Karim Benali',      'DISPATCH','UPDATE',         'vehicles',  'TXM-006',      'TXM-006','SUCCESS','eats',null,null),
  mkEvt('AUD-049','2026-08-26T09:00:00Z','David Chen',        'COMPLIANCE','DOCUMENT_VALIDATE','documents','Permis taxi','DOC-007','SUCCESS','taxi','PENDING','VALIDE'),
  mkEvt('AUD-050','2026-08-25T16:00:00Z','SYSTÈME',           'SYSTEM',  'ANOMALY_DETECT', 'intelligence','Scan complet','SCAN-001','INFO','ALL',null,'7 anomalies'),
]

export const AUDIT_ACTION_CONF: Record<string,{label:string;icon:string;color:string}> = {
  LOGIN:              {label:'Connexion',          icon:'🔐',color:'#003DA5'},
  LOGOUT:             {label:'Déconnexion',        icon:'🚪',color:'#64748B'},
  CREATE:             {label:'Création',           icon:'➕',color:'#059669'},
  UPDATE:             {label:'Modification',       icon:'✏️', color:'#B45309'},
  APPROVE:            {label:'Approbation',        icon:'✅',color:'#059669'},
  REJECT:             {label:'Rejet',              icon:'❌',color:'#DC2626'},
  EXPORT:             {label:'Export',             icon:'↓',  color:'#7C3AED'},
  SYNC:               {label:'Sync',               icon:'🔄',color:'#003DA5'},
  PAYMENT:            {label:'Paiement',           icon:'💳',color:'#059669'},
  DOCUMENT_UPLOAD:    {label:'Upload document',    icon:'📤',color:'#B45309'},
  DOCUMENT_VALIDATE:  {label:'Validation document',icon:'📋',color:'#059669'},
  TAX_CALCULATION:    {label:'Calcul fiscal',      icon:'🧾',color:'#7C3AED'},
  WEBHOOK_RECV:       {label:'Webhook reçu',       icon:'📡',color:'#003DA5'},
  WEBHOOK_FAIL:       {label:'Webhook échoué',     icon:'📡',color:'#DC2626'},
  TRANSACTION:        {label:'Transaction',        icon:'💸',color:'#059669'},
  ANOMALY_DETECT:     {label:'Anomalie détectée',  icon:'🔍',color:'#DC2626'},
  COMPLIANCE_ALERT:   {label:'Alerte conformité',  icon:'⚠️',color:'#B45309'},
  COMPLIANCE_REVIEW:  {label:'Révision conformité',icon:'⚖️',color:'#003DA5'},
  REPORT_EXPORT:      {label:'Export rapport',     icon:'📊',color:'#7C3AED'},
  VIEW:               {label:'Consultation',       icon:'👁',  color:'#64748B'},
}

// ── SECURITY DATA ─────────────────────────────────────────────
export const SECURITY_USERS = [
  {id:'SEC-USR-001',name:'Sophie Marchand',   email:'s.marchand@uber-demo.taximetergov.demo',role:'OWNER',     mfa:true, status:'ACTIVE',  lastLogin:'2026-09-18T09:30:00Z',sessions:1,ipDemo:'192.168.1.10'},
  {id:'SEC-USR-002',name:'Jean-Philippe Roy', email:'jp.roy@uber-demo.taximetergov.demo',    role:'FINANCE',   mfa:true, status:'ACTIVE',  lastLogin:'2026-09-18T08:00:00Z',sessions:1,ipDemo:'192.168.1.22'},
  {id:'SEC-USR-003',name:'Karim Benali',      email:'k.benali@uber-demo.taximetergov.demo',  role:'DISPATCH',  mfa:false,status:'ACTIVE',  lastLogin:'2026-09-18T07:30:00Z',sessions:2,ipDemo:'192.168.2.11'},
  {id:'SEC-USR-004',name:'Marie-Ève Lapointe',email:'me.lapointe@uber-demo.taximetergov.demo',role:'VIEWER',  mfa:false,status:'ACTIVE',  lastLogin:'2026-09-16T10:00:00Z',sessions:0,ipDemo:'192.168.2.45'},
  {id:'SEC-USR-005',name:'David Chen',        email:'d.chen@uber-demo.taximetergov.demo',    role:'COMPLIANCE',mfa:true, status:'PENDING', lastLogin:null,                  sessions:0,ipDemo:null},
]

export const SECURITY_ROLES = [
  {id:'ROLE-001',name:'OWNER',        label:'Propriétaire',      perms:['ALL'],                                                                     users:1,color:'#000000'},
  {id:'ROLE-002',name:'FINANCE',      label:'Finance',           perms:['VIEW_FINANCE','VIEW_TX','VIEW_REVENUE','EXPORT','CALC_TAX','PREPARE_DECL'],users:1,color:'#059669'},
  {id:'ROLE-003',name:'DISPATCH',     label:'Opérations',        perms:['VIEW_DRIVERS','MANAGE_DRIVERS','VIEW_VEHICLES','VIEW_ACTIVITIES'],          users:1,color:'#003DA5'},
  {id:'ROLE-004',name:'COMPLIANCE',   label:'Conformité',        perms:['VIEW_COMPLIANCE','MANAGE_CASES','VALIDATE_DOCS','VIEW_AUDIT'],              users:1,color:'#7C3AED'},
  {id:'ROLE-005',name:'VIEWER',       label:'Lecture seule',     perms:['VIEW_DASHBOARD','VIEW_DRIVERS','VIEW_ACTIVITIES'],                          users:1,color:'#64748B'},
]

export const SECURITY_SESSIONS = [
  {id:'SES-A002',user:'Sophie Marchand',  role:'OWNER',    device:'MacBook Pro',  browser:'Chrome 128',  location:'Montréal, QC (DEMO)',startAt:'2026-09-18T09:30:00Z',lastAt:'2026-09-18T10:38:00Z',status:'ACTIVE'},
  {id:'SES-B003',user:'Jean-Philippe Roy',role:'FINANCE',  device:'Dell XPS',     browser:'Firefox 129', location:'Montréal, QC (DEMO)',startAt:'2026-09-18T08:00:00Z',lastAt:'2026-09-18T10:30:00Z',status:'ACTIVE'},
  {id:'SES-C003',user:'Karim Benali',     role:'DISPATCH', device:'iPhone 15',    browser:'Safari iOS',  location:'Montréal, QC (DEMO)',startAt:'2026-09-18T07:30:00Z',lastAt:'2026-09-18T09:45:00Z',status:'ACTIVE'},
  {id:'SES-C004',user:'Karim Benali',     role:'DISPATCH', device:'Windows PC',   browser:'Chrome 128',  location:'Laval, QC (DEMO)',   startAt:'2026-09-18T06:00:00Z',lastAt:'2026-09-18T06:30:00Z',status:'INACTIVE'},
  {id:'SES-D002',user:'Marie-Ève Lapointe',role:'VIEWER', device:'iPad Pro',     browser:'Safari iOS',  location:'Québec, QC (DEMO)',  startAt:'2026-09-16T10:00:00Z',lastAt:'2026-09-16T11:30:00Z',status:'CLOSED'},
]

export const SECURITY_ALERTS = [
  {id:'SEC-ALT-001',level:'MEDIUM', title:'Token API expirant',           desc:'Token connexion UBER DEMO expire dans 7 jours — renouveler avant le 2026-09-25',at:'2026-09-18T08:00:00Z',status:'OUVERT'},
  {id:'SEC-ALT-002',level:'LOW',    title:'Session inactive détectée',    desc:'Session SES-C004 (Karim Benali) inactive depuis 4h — revue recommandée',at:'2026-09-18T10:30:00Z',status:'OUVERT'},
  {id:'SEC-ALT-003',level:'HIGH',   title:'Webhook échoué répété',        desc:'WHE-007 — 3 tentatives sans succès · Source: UBER DEMO · Auth token',at:'2026-09-17T10:05:00Z',status:'RÉSOLU'},
  {id:'SEC-ALT-004',level:'LOW',    title:'MFA non configuré',            desc:'2 utilisateurs sans MFA activé: Karim Benali, Marie-Ève Lapointe',at:'2026-09-17T08:00:00Z',status:'OUVERT'},
  {id:'SEC-ALT-005',level:'INFO',   title:'Export rapport effectué',      desc:'Jean-Philippe Roy a exporté le rapport TPS/TVQ Q3 DEMO',at:'2026-09-17T14:05:00Z',status:'INFO'},
]

export const SECURITY_LEVEL_CONF: Record<string,{label:string;color:string;bg:string}> = {
  CRITICAL:{label:'CRITIQUE',color:'#DC2626',bg:'rgba(220,38,38,0.12)'},
  HIGH:    {label:'ÉLEVÉ',   color:'#DC2626',bg:'rgba(220,38,38,0.10)'},
  MEDIUM:  {label:'MOYEN',   color:'#B45309',bg:'rgba(180,83,9,0.10)'},
  LOW:     {label:'FAIBLE',  color:'#7C3AED',bg:'rgba(124,58,237,0.10)'},
  INFO:    {label:'INFO',    color:'#003DA5',bg:'rgba(0,61,165,0.08)'},
}

// ── PERMISSIONS RBAC ──────────────────────────────────────────
export const PERMISSIONS_MATRIX = [
  {perm:'VIEW_DASHBOARD',    label:'Voir tableau de bord',    OWNER:true, FINANCE:true,  DISPATCH:true,  COMPLIANCE:true,  VIEWER:true},
  {perm:'VIEW_DRIVERS',      label:'Voir chauffeurs',         OWNER:true, FINANCE:false, DISPATCH:true,  COMPLIANCE:true,  VIEWER:true},
  {perm:'MANAGE_DRIVERS',    label:'Gérer chauffeurs',        OWNER:true, FINANCE:false, DISPATCH:true,  COMPLIANCE:false, VIEWER:false},
  {perm:'VIEW_FINANCE',      label:'Voir finances',           OWNER:true, FINANCE:true,  DISPATCH:false, COMPLIANCE:false, VIEWER:false},
  {perm:'CALC_TAX',          label:'Calculer TPS/TVQ',        OWNER:true, FINANCE:true,  DISPATCH:false, COMPLIANCE:false, VIEWER:false},
  {perm:'PREPARE_DECL',      label:'Préparer déclarations',   OWNER:true, FINANCE:true,  DISPATCH:false, COMPLIANCE:false, VIEWER:false},
  {perm:'VIEW_COMPLIANCE',   label:'Voir conformité',         OWNER:true, FINANCE:false, DISPATCH:false, COMPLIANCE:true,  VIEWER:false},
  {perm:'MANAGE_CASES',      label:'Gérer dossiers',          OWNER:true, FINANCE:false, DISPATCH:false, COMPLIANCE:true,  VIEWER:false},
  {perm:'VALIDATE_DOCS',     label:'Valider documents',       OWNER:true, FINANCE:false, DISPATCH:false, COMPLIANCE:true,  VIEWER:false},
  {perm:'VIEW_AUDIT',        label:'Voir audit',              OWNER:true, FINANCE:false, DISPATCH:false, COMPLIANCE:true,  VIEWER:false},
  {perm:'MANAGE_API',        label:'Gérer API/Webhooks',      OWNER:true, FINANCE:false, DISPATCH:false, COMPLIANCE:false, VIEWER:false},
  {perm:'EXPORT',            label:'Exporter rapports',       OWNER:true, FINANCE:true,  DISPATCH:false, COMPLIANCE:true,  VIEWER:false},
  {perm:'MANAGE_USERS',      label:'Gérer utilisateurs',      OWNER:true, FINANCE:false, DISPATCH:false, COMPLIANCE:false, VIEWER:false},
]

// ══════════════════════════════════════════════════════════════
// PHASES 28-29-30 DATA — NOTIFICATIONS · INTELLIGENCE · GOV COM
// ⚠️ DONNÉES SYNTHÉTIQUES — PILOTE
// ══════════════════════════════════════════════════════════════

// ── NOTIFICATIONS ENRICHIES (30) ─────────────────────────────
export const ALL_NOTIFICATIONS = [
  // FISCALITÉ
  {id:'NTF-001',type:'TAX_DEADLINE',     priority:'HIGH',    title:'Déclaration TPS/TVQ Q3 à préparer',           desc:'Échéance: 2026-10-31 · Montant estimé: 47 650$ (TPS+TVQ) · MODE PILOTE',        dept:'ALL',  at:'2026-09-18T07:00:00Z',read:false,status:'NOUVELLE',to:'FINANCE',  source:'Moteur fiscal',   action:'→ Fiscal'},
  {id:'NTF-002',type:'TAX_CALCULATION',  priority:'MEDIUM',  title:'Calcul TPS/TVQ Q3 2026 complété',              desc:'TPS: 20 640$ · TVQ: 41 179$ · Total: 61 819$ (DEMO) · À valider avant soumission',dept:'ALL',  at:'2026-09-18T09:00:00Z',read:true, status:'LUE',     to:'FINANCE',  source:'Moteur fiscal',   action:'→ Fiscal'},
  {id:'NTF-003',type:'PAYMENT_DUE',      priority:'HIGH',    title:'Paiement TPS Q2 2026 — DEMO',                  desc:'Montant estimé: 18 125$ · Simulé — aucune transmission officielle',               dept:'ALL',  at:'2026-09-10T08:00:00Z',read:true, status:'LUE',     to:'FINANCE',  source:'Obligations',     action:'→ Paiements'},
  {id:'NTF-004',type:'DECLARATION_READY',priority:'MEDIUM',  title:'Déclaration Q2 2026 acceptée',                 desc:'Acceptée par TAXIMETER.GOV DEMO · Référence: DCL-Q2-2026 · Simulation pilote',    dept:'ALL',  at:'2026-09-01T14:00:00Z',read:true, status:'FERMÉE',  to:'FINANCE',  source:'TAXIMETER.GOV',   action:'→ Déclarations'},
  // DOCUMENTS
  {id:'NTF-005',type:'DOCUMENT_EXPIRING',priority:'HIGH',    title:'Permis DRV-QC-0004 expire dans 12 jours',      desc:'Expiration: 2026-09-30 · Uber Taxi · Renouvellement urgent recommandé',            dept:'taxi', at:'2026-09-17T10:00:00Z',read:false,status:'NOUVELLE',to:'COMPLIANCE',source:'Conformité',      action:'→ Documents'},
  {id:'NTF-006',type:'DOCUMENT_EXPIRED', priority:'CRITICAL',title:'Permis DRV-QC-0005 expiré — chauffeur suspendu',desc:'Expiré depuis 2026-03-01 · Chauffeur suspendu · Action immédiate requise',        dept:'taxi', at:'2026-09-01T08:00:00Z',read:true, status:'EN TRAITEMENT',to:'COMPLIANCE',source:'Conformité', action:'→ Conformité'},
  {id:'NTF-007',type:'DOCUMENT_EXPIRING',priority:'HIGH',    title:'Inspection TXM-004 expire dans 12 jours',       desc:'Expiration: 2026-09-30 · Uber Taxi · Inspection à planifier immédiatement',       dept:'taxi', at:'2026-09-15T08:00:00Z',read:false,status:'NOUVELLE',to:'DISPATCH', source:'Conformité',      action:'→ Véhicules'},
  {id:'NTF-008',type:'DOCUMENT_EXPIRED', priority:'CRITICAL',title:'Inspection TXM-006 expirée',                   desc:'Inspection expirée · Véhicule à suspendre jusqu\'au renouvellement',               dept:'eats', at:'2026-09-18T08:00:00Z',read:false,status:'NOUVELLE',to:'DISPATCH', source:'Conformité',      action:'→ Véhicules'},
  // CONFORMITÉ
  {id:'NTF-009',type:'COMPLIANCE_ALERT', priority:'HIGH',    title:'Dossier CASE-2026-0003 ouvert',                desc:'Écart de 33,50$ détecté · TX-ENT-005 vs ACT-ENT-005 · Analyse en cours',           dept:'taxi', at:'2026-09-18T10:05:00Z',read:false,status:'NOUVELLE',to:'COMPLIANCE',source:'Réconciliation',  action:'→ Conformité'},
  {id:'NTF-010',type:'COMPLIANCE_ALERT', priority:'MEDIUM',  title:'2 utilisateurs sans MFA activé',               desc:'Karim Benali · Marie-Ève Lapointe · Activation recommandée pour sécurité',         dept:'ALL',  at:'2026-09-17T08:00:00Z',read:false,status:'NOUVELLE',to:'OWNER',    source:'Sécurité',        action:'→ Sécurité'},
  // API & WEBHOOKS
  {id:'NTF-011',type:'API_ERROR',        priority:'HIGH',    title:'Token API UBER DEMO expirant',                 desc:'Token expire dans 7 jours (2026-09-25) · Renouvellement préventif recommandé',     dept:'ALL',  at:'2026-09-18T08:00:00Z',read:false,status:'NOUVELLE',to:'OWNER',    source:'API Engine',      action:'→ Intégrations'},
  {id:'NTF-012',type:'WEBHOOK_ERROR',    priority:'HIGH',    title:'Webhook WHE-007 échoué (3 tentatives)',         desc:'Auth token expiré · Source: UBER DEMO · Traitement en attente de relance',         dept:'rides',at:'2026-09-17T10:05:00Z',read:true, status:'RÉSOLUE', to:'OWNER',    source:'Webhook Engine',  action:'→ Intégrations'},
  {id:'NTF-013',type:'SYNC_COMPLETED',   priority:'LOW',     title:'Sync TAXIMETER.GOV complétée',                 desc:'9 840 enregistrements · Durée: 23s · Statut: SUCCESS · PILOTE',                   dept:'ALL',  at:'2026-09-18T10:38:00Z',read:true, status:'LUE',     to:'OWNER',    source:'TAXIMETER.GOV',   action:null},
  {id:'NTF-014',type:'SYNC_FAILED',      priority:'MEDIUM',  title:'Sync incrémentale partielle',                  desc:'1 activité non réconciliée · Reprise automatique à la prochaine sync',             dept:'ALL',  at:'2026-09-17T22:02:00Z',read:true, status:'RÉSOLUE', to:'OWNER',    source:'TAXIMETER.GOV',   action:null},
  // TRANSACTIONS
  {id:'NTF-015',type:'TRANSACTION_ALERT',priority:'HIGH',    title:'Transaction TX-ENT-005 — écart détecté',       desc:'Montant activité: 16,50$ · Transaction: 50,00$ · Écart: 33,50$ · À vérifier',     dept:'taxi', at:'2026-09-18T10:05:00Z',read:false,status:'NOUVELLE',to:'FINANCE',  source:'Réconciliation',  action:'→ Réconciliation'},
  {id:'NTF-016',type:'RECONCILIATION_ALERT',priority:'HIGH', title:'1 transaction sans activité correspondante',   desc:'TX-ENT-005 · Montant: 16,50$ · Ledger: non réconcilié · Analyse requise',         dept:'taxi', at:'2026-09-17T22:05:00Z',read:false,status:'NOUVELLE',to:'FINANCE',  source:'Réconciliation',  action:'→ Réconciliation'},
  // GOUVERNANCE
  {id:'NTF-017',type:'GOVERNMENT_MESSAGE',priority:'MEDIUM', title:'Message TAXIMETER.GOV — PILOTE',               desc:'Nouveau message DEMO dans votre espace gouvernemental · Simulation pilote',         dept:'ALL',  at:'2026-09-16T10:00:00Z',read:true, status:'LUE',     to:'OWNER',    source:'TAXIMETER.GOV',   action:'→ Gouvernement'},
  {id:'NTF-018',type:'GOVERNMENT_MESSAGE',priority:'HIGH',   title:'Demande de document — SIMULATION',             desc:'TAXIMETER.GOV DEMO demande le rapport Q3 · Délai: 2026-10-15 · Simulation pilote',dept:'ALL',  at:'2026-09-18T09:00:00Z',read:false,status:'NOUVELLE',to:'OWNER',    source:'TAXIMETER.GOV',   action:'→ Gouvernement'},
  // SYSTÈME
  {id:'NTF-019',type:'SYSTEM_ALERT',     priority:'LOW',     title:'Rapport mensuel généré — Août 2026',           desc:'Rapport activités complet disponible · Format PDF · 1,8 MB',                      dept:'ALL',  at:'2026-09-01T06:00:00Z',read:true, status:'LUE',     to:'FINANCE',  source:'Report Center',   action:'→ Rapports'},
  {id:'NTF-020',type:'SYSTEM_ALERT',     priority:'LOW',     title:'Maintenance TAXIMETER.GOV planifiée',           desc:'Maintenance le 2026-10-05 de 02h00 à 04h00 · PILOTE — Aucun impact officiel',    dept:'ALL',  at:'2026-09-15T10:00:00Z',read:true, status:'LUE',     to:'ALL',      source:'TAXIMETER.GOV',   action:null},
  // DEPTS
  {id:'NTF-021',type:'COMPLIANCE_ALERT', priority:'MEDIUM',  title:'Uber Eats — obligations fiscales distinctes',  desc:'Rappel: livreurs Uber Eats QC ont des obligations propres (RQ) différentes des rides',dept:'eats', at:'2026-09-14T08:00:00Z',read:true, status:'LUE',     to:'FINANCE',  source:'Moteur fiscal',   action:'→ Fiscal'},
  {id:'NTF-022',type:'SYNC_COMPLETED',   priority:'LOW',     title:'Sync Uber Eats Grocery — 820 actifs (SYNTH.)',  desc:'Synchronisation département épicerie · Données synthétiques pilote',               dept:'grocery',at:'2026-09-02T10:00:00Z',read:true,status:'LUE',     to:'DISPATCH', source:'TAXIMETER.GOV',   action:null},
  {id:'NTF-023',type:'DOCUMENT_EXPIRING',priority:'MEDIUM',  title:'3 assurances véhicules à renouveler (Green)',  desc:'VEH-GREEN-3001/3002/3003 · Expiration: 2026-11-01 · 43 jours restants',          dept:'green',at:'2026-09-18T06:00:00Z',read:false,status:'NOUVELLE',to:'DISPATCH', source:'Conformité',      action:'→ Véhicules'},
  {id:'NTF-024',type:'COMPLIANCE_ALERT', priority:'LOW',     title:'Score conformité Uber Courier: 94%',            desc:'Score indicatif DEMO légèrement en baisse · 8 exceptions actives · Révision recommandée',dept:'courier',at:'2026-09-16T14:00:00Z',read:true,status:'LUE',to:'COMPLIANCE',source:'Conformité', action:'→ Conformité'},
  {id:'NTF-025',type:'API_ERROR',        priority:'MEDIUM',  title:'Erreur sync Courier — token partiel',           desc:'1 activité courier non réconciliée · Sync partielle · Reprise auto planifiée',    dept:'courier',at:'2026-09-15T22:00:00Z',read:true,status:'RÉSOLUE', to:'OWNER',    source:'API Engine',      action:null},
  {id:'NTF-026',type:'AUDIT_EVENT',      priority:'LOW',     title:'Export rapport TPS/TVQ Q3 effectué',            desc:'Jean-Philippe Roy a exporté le rapport fiscal Q3 · PDF · 820 KB',                 dept:'ALL',  at:'2026-09-10T08:12:00Z',read:true, status:'LUE',     to:'FINANCE',  source:'Audit Center',    action:'→ Audit'},
  {id:'NTF-027',type:'DECLARATION_READY',priority:'HIGH',    title:'Déclaration Q1 2026 — statut ACCEPTÉE',        desc:'Déclaration Q1 2026 acceptée par TAXIMETER.GOV DEMO · Archivée',                  dept:'ALL',  at:'2026-07-15T10:00:00Z',read:true, status:'FERMÉE',  to:'FINANCE',  source:'TAXIMETER.GOV',   action:'→ Déclarations'},
  {id:'NTF-028',type:'TRANSACTION_ALERT',priority:'LOW',     title:'15 transactions réconciliées — Q3',            desc:'13/15 transactions réconciliées · 2 exceptions en attente de révision',           dept:'ALL',  at:'2026-09-12T14:00:00Z',read:true, status:'LUE',     to:'FINANCE',  source:'Réconciliation',  action:'→ Réconciliation'},
  {id:'NTF-029',type:'SYSTEM_ALERT',     priority:'CRITICAL',title:'Alerte sécurité — session inhabituelle',        desc:'Session SES-C004 (Karim Benali) depuis Laval · Revue recommandée · DEMO',         dept:'ALL',  at:'2026-09-18T10:30:00Z',read:false,status:'NOUVELLE',to:'OWNER',    source:'Sécurité',        action:'→ Sécurité'},
  {id:'NTF-030',type:'GOVERNMENT_MESSAGE',priority:'MEDIUM', title:'Accusé de réception — Transmission Q2 DEMO',   desc:'DEMO-GOV-2026-000126 · 15 enreg. · REÇU — SIMULATION · Aucune valeur officielle', dept:'ALL',  at:'2026-09-10T08:30:00Z',read:true, status:'FERMÉE',  to:'OWNER',    source:'TAXIMETER.GOV',   action:'→ Gouvernement'},
]

export const NOTIF_TYPE_CONF: Record<string,{label:string;icon:string;color:string;bg:string}> = {
  TAX_DEADLINE:        {label:'Échéance fiscale',     icon:'🧾',color:'#7C3AED',bg:'rgba(124,58,237,0.10)'},
  TAX_CALCULATION:     {label:'Calcul fiscal',        icon:'🧮',color:'#7C3AED',bg:'rgba(124,58,237,0.08)'},
  PAYMENT_DUE:         {label:'Paiement à effectuer', icon:'💳',color:'#059669',bg:'rgba(5,150,105,0.10)'},
  DECLARATION_READY:   {label:'Déclaration',          icon:'📤',color:'#003DA5',bg:'rgba(0,61,165,0.10)'},
  DOCUMENT_EXPIRING:   {label:'Document expirant',    icon:'⚠️',color:'#B45309',bg:'rgba(180,83,9,0.10)'},
  DOCUMENT_EXPIRED:    {label:'Document expiré',      icon:'❌',color:'#DC2626',bg:'rgba(220,38,38,0.10)'},
  COMPLIANCE_ALERT:    {label:'Alerte conformité',    icon:'⚖️',color:'#B45309',bg:'rgba(180,83,9,0.08)'},
  AUDIT_EVENT:         {label:'Audit',                icon:'🛡️',color:'#64748B',bg:'rgba(100,116,139,0.10)'},
  API_ERROR:           {label:'Erreur API',           icon:'⚙️',color:'#DC2626',bg:'rgba(220,38,38,0.08)'},
  WEBHOOK_ERROR:       {label:'Webhook échoué',       icon:'📡',color:'#DC2626',bg:'rgba(220,38,38,0.08)'},
  SYNC_COMPLETED:      {label:'Sync complétée',       icon:'✅',color:'#059669',bg:'rgba(5,150,105,0.08)'},
  SYNC_FAILED:         {label:'Sync échouée',         icon:'🔄',color:'#B45309',bg:'rgba(180,83,9,0.08)'},
  TRANSACTION_ALERT:   {label:'Alerte transaction',   icon:'💸',color:'#DC2626',bg:'rgba(220,38,38,0.10)'},
  RECONCILIATION_ALERT:{label:'Alerte réconciliation',icon:'🔄',color:'#DC2626',bg:'rgba(220,38,38,0.08)'},
  GOVERNMENT_MESSAGE:  {label:'Message gouvernemental',icon:'🏛️',color:'#003DA5',bg:'rgba(0,61,165,0.10)'},
  SYSTEM_ALERT:        {label:'Système',              icon:'🖥️',color:'#64748B',bg:'rgba(100,116,139,0.08)'},
}
export const NOTIF_PRIORITY_CONF: Record<string,{label:string;color:string;bg:string}> = {
  CRITICAL:{label:'CRITIQUE',color:'#DC2626',bg:'rgba(220,38,38,0.12)'},
  HIGH:    {label:'ÉLEVÉE',  color:'#DC2626',bg:'rgba(220,38,38,0.10)'},
  MEDIUM:  {label:'MOYENNE', color:'#B45309',bg:'rgba(180,83,9,0.10)'},
  LOW:     {label:'FAIBLE',  color:'#64748B',bg:'rgba(100,116,139,0.10)'},
  INFO:    {label:'INFO',    color:'#003DA5',bg:'rgba(0,61,165,0.08)'},
}

// ── GOVERNMENT COMMUNICATIONS DATA ───────────────────────────
export const GOV_MESSAGES = [
  {id:'GOVMSG-001',from:'TAXIMETER.GOV DEMO',to:'Uber Québec (DEMO)',at:'2026-09-18T09:00:00Z',subject:'Demande rapport Q3 2026',body:'Dans le cadre du programme pilote TAXIMETER.GOV, nous vous demandons de préparer votre rapport Q3 2026 incluant les données de revenus, TPS/TVQ et activités de tous vos départements. Délai: 2026-10-15. SIMULATION.',priority:'HIGH',status:'NOUVELLE',type:'DEMANDE',responseRequired:true,dueAt:'2026-10-15'},
  {id:'GOVMSG-002',from:'TAXIMETER.GOV DEMO',to:'Uber Québec (DEMO)',at:'2026-09-10T08:30:00Z',subject:'Accusé de réception — Transmission Q2',body:'Nous confirmons la réception de la transmission Q2 2026. Référence: DEMO-GOV-2026-000126. 15 enregistrements reçus. SIMULATION — aucune valeur officielle.',priority:'MEDIUM',status:'LUE',type:'ACCUSÉ',responseRequired:false,dueAt:null},
  {id:'GOVMSG-003',from:'TAXIMETER.GOV DEMO',to:'Uber Québec (DEMO)',at:'2026-09-01T14:00:00Z',subject:'Déclaration Q2 — Statut ACCEPTÉE',body:'Votre déclaration Q2 2026 (réf. DCL-Q2-2026) a été traitée et acceptée dans le cadre du pilote TAXIMETER.GOV. SIMULATION.',priority:'LOW',status:'FERMÉE',type:'AVIS',responseRequired:false,dueAt:null},
  {id:'GOVMSG-004',from:'TAXIMETER.GOV DEMO',to:'Uber Québec (DEMO)',at:'2026-08-15T10:00:00Z',subject:'Rappel obligations fiscales Q3',body:'Rappel: Les obligations TPS/TVQ Q3 2026 sont à préparer avant le 2026-10-31. Veuillez vous assurer que toutes vos données de revenus sont réconciliées. SIMULATION.',priority:'MEDIUM',status:'LUE',type:'RAPPEL',responseRequired:false,dueAt:'2026-10-31'},
  {id:'GOVMSG-005',from:'TAXIMETER.GOV DEMO',to:'Uber Québec (DEMO)',at:'2026-07-15T09:00:00Z',subject:'Accusé de réception — Transmission Q1',body:'Réception confirmée. DEMO-GOV-2026-000118. 12 enregistrements. SIMULATION.',priority:'LOW',status:'FERMÉE',type:'ACCUSÉ',responseRequired:false,dueAt:null},
  {id:'GOVMSG-006',from:'Uber Québec (DEMO)',to:'TAXIMETER.GOV DEMO',at:'2026-09-16T11:00:00Z',subject:'Réponse — Vérification identité NEQ',body:'Nous confirmons notre NEQ fictif: 8765432100 (DEMO UNIQUEMENT). Représentant: Sophie Marchand. SIMULATION.',priority:'LOW',status:'RÉPONDUE',type:'RÉPONSE',responseRequired:false,dueAt:null},
  {id:'GOVMSG-007',from:'TAXIMETER.GOV DEMO',to:'Uber Québec (DEMO)',at:'2026-09-14T08:00:00Z',subject:'Information — Architecture API future',body:'TAXIMETER.GOV est en cours de développement d\'une API de transmission. Des informations supplémentaires seront communiquées. SIMULATION PILOTE.',priority:'LOW',status:'LUE',type:'INFORMATION',responseRequired:false,dueAt:null},
  {id:'GOVMSG-008',from:'TAXIMETER.GOV DEMO',to:'Uber Québec (DEMO)',at:'2026-09-05T10:00:00Z',subject:'Maintenance planifiée — 2026-10-05',body:'Maintenance système 2026-10-05 02h00-04h00. Services TAXIMETER.GOV temporairement indisponibles. SIMULATION.',priority:'LOW',status:'LUE',type:'AVIS',responseRequired:false,dueAt:null},
  {id:'GOVMSG-009',from:'Uber Québec (DEMO)',to:'TAXIMETER.GOV DEMO',at:'2026-09-12T14:00:00Z',subject:'Rapport réconciliation Q3 partiel',body:'Nous transmettons le rapport de réconciliation Q3 partiel. 13/15 transactions réconciliées. 2 exceptions en cours d\'analyse. SIMULATION.',priority:'MEDIUM',status:'RÉPONDUE',type:'SOUMISSION',responseRequired:false,dueAt:null},
  {id:'GOVMSG-010',from:'TAXIMETER.GOV DEMO',to:'Uber Québec (DEMO)',at:'2026-09-01T08:00:00Z',subject:'Bienvenue programme pilote',body:'Bienvenue dans le programme pilote TAXIMETER.GOV. Votre compte Enterprise Gov est activé. AUCUNE transmission officielle n\'est active. MODE PILOTE UNIQUEMENT.',priority:'LOW',status:'FERMÉE',type:'INFORMATION',responseRequired:false,dueAt:null},
]

export const GOV_SUBMISSIONS = [
  {id:'SUB-001',type:'DÉCLARATION',period:'Q2 2026',at:'2026-09-10T08:00:00Z',records:15,status:'ACCEPTÉE DEMO',txId:'DEMO-GOV-2026-000126',by:'Jean-Philippe Roy',source:'Enterprise Gov',note:'Simulation pilote — aucune valeur officielle'},
  {id:'SUB-002',type:'RÉCONCILIATION',period:'Q3 partiel',at:'2026-09-12T14:00:00Z',records:13,status:'REÇUE DEMO',txId:'DEMO-GOV-2026-000127',by:'Jean-Philippe Roy',source:'Enterprise Gov',note:'Rapport partiel — 2 exceptions non résolues'},
  {id:'SUB-003',type:'DÉCLARATION',period:'Q1 2026',at:'2026-07-10T10:00:00Z',records:12,status:'ACCEPTÉE DEMO',txId:'DEMO-GOV-2026-000118',by:'Sophie Marchand',source:'Enterprise Gov',note:'Simulation pilote'},
  {id:'SUB-004',type:'RAPPORT',period:'Annuel 2025',at:'2026-03-31T08:00:00Z',records:8,status:'SOUMISE DEMO',txId:'DEMO-GOV-2026-000108',by:'Sophie Marchand',source:'Enterprise Gov',note:'Rapport annuel synthétique DEMO'},
  {id:'SUB-005',type:'DÉCLARATION',period:'Q3 2026',at:null,records:0,status:'BROUILLON',txId:null,by:null,source:'Enterprise Gov',note:'En préparation — non soumise'},
]

export const GOV_SUBMISSION_STATUS_CONF: Record<string,{label:string;color:string;bg:string}> = {
  'ACCEPTÉE DEMO':{label:'Acceptée (DEMO)',color:'#059669',bg:'rgba(5,150,105,0.12)'},
  'REÇUE DEMO':   {label:'Reçue (DEMO)',   color:'#003DA5',bg:'rgba(0,61,165,0.10)'},
  'SOUMISE DEMO': {label:'Soumise (DEMO)', color:'#7C3AED',bg:'rgba(124,58,237,0.10)'},
  'BROUILLON':    {label:'Brouillon',       color:'#64748B',bg:'rgba(100,116,139,0.10)'},
  'CORRECTION':   {label:'Correction req.', color:'#DC2626',bg:'rgba(220,38,38,0.10)'},
}

export const GOV_MSG_TYPE_CONF: Record<string,{icon:string;color:string}> = {
  DEMANDE:     {icon:'📋',color:'#DC2626'},
  ACCUSÉ:      {icon:'✅',color:'#059669'},
  AVIS:        {icon:'ℹ️',color:'#003DA5'},
  RAPPEL:      {icon:'⏰',color:'#B45309'},
  RÉPONSE:     {icon:'↩️',color:'#7C3AED'},
  INFORMATION: {icon:'📢',color:'#64748B'},
  SOUMISSION:  {icon:'📤',color:'#003DA5'},
}

// ── REVENUE LEDGER — Flux financier complet DEMO ──
export type LedgerEntry = {
  id:           string
  txId:         string
  actId:        string
  driverId:     string
  vehicleId:    string
  deptId:       string
  enterpriseId: string
  at:           string
  type:         'TRIP'|'DELIVERY'|'TIP'|'ADJUSTMENT'|'REFUND'|'FEE'
  gross:        number
  tip:          number
  fees:         number
  taxableAmt:   number
  tps:          number
  tvq:          number
  net:          number
  source:       string
  status:       'POSTED'|'PENDING'|'REVERSED'
  reconStatus:  'MATCHED'|'UNMATCHED'|'EXCEPTION'
}

export const REVENUE_LEDGER: LedgerEntry[] = [
  // Uber Rides — D1
  {id:'RL-001',txId:'TX-ENT-001',actId:'ACT-ENT-001',driverId:'DRV-001',vehicleId:'VEH-001',deptId:'D1',enterpriseId:'ENT-DEMO-001',at:'2026-09-18T08:45:00Z',type:'TRIP',      gross:28.50,tip:3.00,fees:7.13,taxableAmt:28.50,tps:1.43,tvq:2.84,net:17.10,source:'UBER_RIDES', status:'POSTED', reconStatus:'MATCHED'},
  {id:'RL-002',txId:'TX-ENT-002',actId:'ACT-ENT-002',driverId:'DRV-002',vehicleId:'VEH-002',deptId:'D1',enterpriseId:'ENT-DEMO-001',at:'2026-09-18T09:12:00Z',type:'TIP',       gross:0,   tip:4.00,fees:0,    taxableAmt:4.00,  tps:0.20,tvq:0.40,net:3.40, source:'UBER_RIDES', status:'POSTED', reconStatus:'MATCHED'},
  {id:'RL-003',txId:'TX-ENT-003',actId:'ACT-ENT-003',driverId:'DRV-003',vehicleId:'VEH-003',deptId:'D2',enterpriseId:'ENT-DEMO-001',at:'2026-09-18T09:30:00Z',type:'TRIP',      gross:35.00,tip:5.00,fees:8.75,taxableAmt:35.00,tps:1.75,tvq:3.49,net:21.01,source:'UBER_TAXI',  status:'POSTED', reconStatus:'MATCHED'},
  {id:'RL-004',txId:'TX-ENT-004',actId:'ACT-ENT-004',driverId:'DRV-004',vehicleId:'VEH-004',deptId:'D4',enterpriseId:'ENT-DEMO-001',at:'2026-09-18T10:05:00Z',type:'DELIVERY',  gross:15.00,tip:2.00,fees:4.50,taxableAmt:15.00,tps:0.75,tvq:1.50,net:8.25, source:'UBER_EATS',  status:'POSTED', reconStatus:'MATCHED'},
  {id:'RL-005',txId:'TX-ENT-005',actId:'ACT-ENT-005',driverId:'DRV-005',vehicleId:'VEH-005',deptId:'D3',enterpriseId:'ENT-DEMO-001',at:'2026-09-18T10:20:00Z',type:'TRIP',      gross:42.00,tip:0,   fees:10.50,taxableAmt:42.00,tps:2.10,tvq:4.19,net:25.21,source:'UBER_GREEN',  status:'POSTED', reconStatus:'MATCHED'},
  {id:'RL-006',txId:'TX-ENT-006',actId:'ACT-ENT-006',driverId:'DRV-006',vehicleId:'VEH-006',deptId:'D5',enterpriseId:'ENT-DEMO-001',at:'2026-09-18T11:00:00Z',type:'DELIVERY',  gross:22.00,tip:3.50,fees:6.60,taxableAmt:22.00,tps:1.10,tvq:2.19,net:11.61,source:'UBER_GROCERY',status:'POSTED', reconStatus:'MATCHED'},
  {id:'RL-007',txId:'TX-ENT-007',actId:'ACT-ENT-007',driverId:'DRV-001',vehicleId:'VEH-001',deptId:'D6',enterpriseId:'ENT-DEMO-001',at:'2026-09-18T11:30:00Z',type:'DELIVERY',  gross:18.00,tip:1.00,fees:5.40,taxableAmt:18.00,tps:0.90,tvq:1.80,net:9.90, source:'UBER_COURIER',status:'POSTED', reconStatus:'MATCHED'},
  {id:'RL-008',txId:'TX-ENT-008',actId:'ACT-ENT-008',driverId:'DRV-002',vehicleId:'VEH-002',deptId:'D1',enterpriseId:'ENT-DEMO-001',at:'2026-09-17T14:20:00Z',type:'ADJUSTMENT', gross:0,  tip:0,   fees:0,    taxableAmt:-5.00, tps:-0.25,tvq:-0.50,net:-4.25,source:'ADJUSTMENT', status:'POSTED', reconStatus:'MATCHED'},
  {id:'RL-009',txId:'TX-ENT-009',actId:'ACT-ENT-009',driverId:'DRV-003',vehicleId:'VEH-003',deptId:'D4',enterpriseId:'ENT-DEMO-001',at:'2026-09-17T12:02:00Z',type:'DELIVERY',  gross:12.00,tip:2.00,fees:3.60,taxableAmt:12.00,tps:0.60,tvq:1.20,net:6.60, source:'UBER_EATS',  status:'POSTED', reconStatus:'MATCHED'},
  {id:'RL-010',txId:'TX-ENT-010',actId:'ACT-ENT-010',driverId:'DRV-004',vehicleId:'VEH-004',deptId:'D2',enterpriseId:'ENT-DEMO-001',at:'2026-09-17T16:05:00Z',type:'TRIP',      gross:21.00,tip:0,   fees:5.25,taxableAmt:21.00,tps:1.05,tvq:2.09,net:12.61,source:'UBER_TAXI',  status:'POSTED', reconStatus:'EXCEPTION'},
  // Entrée PENDING — test réconciliation
  {id:'RL-011',txId:'TX-ENT-011',actId:'ACT-DEMO-011',driverId:'DRV-005',vehicleId:'VEH-005',deptId:'D1',enterpriseId:'ENT-DEMO-001',at:'2026-09-20T06:00:00Z',type:'TRIP',      gross:33.00,tip:4.00,fees:8.25,taxableAmt:33.00,tps:1.65,tvq:3.29,net:19.81,source:'UBER_RIDES', status:'PENDING',reconStatus:'UNMATCHED'},
]

export const LEDGER_SUMMARY = {
  enterpriseId:   'ENT-DEMO-001',
  period:         'Septembre 2026',
  totalGross:     REVENUE_LEDGER.filter(e=>e.status==='POSTED').reduce((s,e)=>s+e.gross+e.tip,0),
  totalTPS:       REVENUE_LEDGER.filter(e=>e.status==='POSTED').reduce((s,e)=>s+e.tps,0),
  totalTVQ:       REVENUE_LEDGER.filter(e=>e.status==='POSTED').reduce((s,e)=>s+e.tvq,0),
  totalNet:       REVENUE_LEDGER.filter(e=>e.status==='POSTED').reduce((s,e)=>s+e.net,0),
  matched:        REVENUE_LEDGER.filter(e=>e.reconStatus==='MATCHED').length,
  unmatched:      REVENUE_LEDGER.filter(e=>e.reconStatus==='UNMATCHED').length,
  exceptions:     REVENUE_LEDGER.filter(e=>e.reconStatus==='EXCEPTION').length,
  note:           'DONNÉES SYNTHÉTIQUES · PILOTE DEMO · AUCUNE VALEUR FISCALE OFFICIELLE',
}


// ══════════════════════════════════════════════════════════════════
// PHASE 32 — SIMULATION GOUVERNEMENTALE COMPLÈTE
// DONNÉES SYNTHÉTIQUES · PILOTE · AUCUNE VALEUR OFFICIELLE
// enterprise_id: ENT-DEMO-001 · Uber Québec UNIQUEMENT
// ══════════════════════════════════════════════════════════════════

const SIM_TPS_R = 0.05
const SIM_TVQ_R = 0.09975
const simR2 = (n:number) => Math.round(n*100)/100

// ── SCÉNARIO COMPLET: 5 départements × 3 activités chacun ──
export const SIM_ACTIVITIES = [
  // D1 — Uber Rides/Taxi
  {id:'SIM-ACT-001',deptId:'D1',deptName:'Uber Rides',      type:'TRIP',     driverId:'DRV-QC-0001',driverName:'Jean Tremblay',  vehicleId:'TXM-001',plate:'ABC-1234',enterpriseId:'ENT-DEMO-001',at:'2026-09-20T08:15:00Z',origin:'Montréal-Nord',dest:'Aéroport YUL',     dist:22.4,dur:28,fare:42.50,tip:5.00,status:'COMPLETED',source:'TAXIMETER'},
  {id:'SIM-ACT-002',deptId:'D1',deptName:'Uber Rides',      type:'TRIP',     driverId:'DRV-QC-0002',driverName:'Marie Gagnon',   vehicleId:'TXM-002',plate:'DEF-5678',enterpriseId:'ENT-DEMO-001',at:'2026-09-20T09:30:00Z',origin:'Plateau-Mont-Royal',dest:'Westmount',  dist:5.2, dur:14,fare:22.50,tip:3.00,status:'COMPLETED',source:'UBER_API'},
  {id:'SIM-ACT-003',deptId:'D2',deptName:'Uber Taxi',       type:'TAXI',     driverId:'DRV-QC-0003',driverName:'Karim Hassan',   vehicleId:'TXM-003',plate:'GHI-9012',enterpriseId:'ENT-DEMO-001',at:'2026-09-20T10:05:00Z',origin:'Vieux-Montréal',   dest:'Laval',        dist:18.6,dur:32,fare:38.00,tip:4.00,status:'COMPLETED',source:'TAXIMETER'},
  // D2 — Uber Taxi
  {id:'SIM-ACT-004',deptId:'D2',deptName:'Uber Taxi',       type:'TAXI',     driverId:'DRV-QC-0001',driverName:'Jean Tremblay',  vehicleId:'TXM-001',plate:'ABC-1234',enterpriseId:'ENT-DEMO-001',at:'2026-09-20T11:20:00Z',origin:'Longueuil',        dest:'Centre-ville', dist:12.1,dur:22,fare:28.75,tip:3.50,status:'COMPLETED',source:'TAXIMETER'},
  // D3 — Uber Green
  {id:'SIM-ACT-005',deptId:'D3',deptName:'Uber Green',      type:'TRIP',     driverId:'DRV-QC-0004',driverName:'Ali Bouchard',   vehicleId:'TXM-004',plate:'JKL-3456',enterpriseId:'ENT-DEMO-001',at:'2026-09-20T07:45:00Z',origin:'Mile-Ex',           dest:'Rosemont',     dist:6.8, dur:16,fare:24.00,tip:2.00,status:'COMPLETED',source:'UBER_API'},
  {id:'SIM-ACT-006',deptId:'D3',deptName:'Uber Green',      type:'TRIP',     driverId:'DRV-QC-0005',driverName:'Sophie Martin',  vehicleId:'TXM-005',plate:'MNO-7890',enterpriseId:'ENT-DEMO-001',at:'2026-09-20T12:10:00Z',origin:'Verdun',            dest:'Notre-Dame-de-Grâce',dist:7.3,dur:18,fare:26.50,tip:0,  status:'COMPLETED',source:'UBER_API'},
  // D4 — Uber Eats
  {id:'SIM-ACT-007',deptId:'D4',deptName:'Uber Eats',       type:'DELIVERY', driverId:'DRV-QC-0002',driverName:'Marie Gagnon',   vehicleId:'TXM-002',plate:'DEF-5678',enterpriseId:'ENT-DEMO-001',at:'2026-09-20T12:35:00Z',origin:'Restaurant Da Emma', dest:'Plateau',      dist:3.2, dur:18,fare:15.00,tip:2.50,status:'COMPLETED',source:'UBER_EATS'},
  {id:'SIM-ACT-008',deptId:'D4',deptName:'Uber Eats',       type:'DELIVERY', driverId:'DRV-QC-0006',driverName:'Nadia Patel',    vehicleId:'TXM-006',plate:'PQR-1234',enterpriseId:'ENT-DEMO-001',at:'2026-09-20T13:05:00Z',origin:'Sushi Club MTL',    dest:'Outremont',    dist:4.1, dur:22,fare:18.00,tip:3.00,status:'COMPLETED',source:'UBER_EATS'},
  {id:'SIM-ACT-009',deptId:'D4',deptName:'Uber Eats',       type:'DELIVERY', driverId:'DRV-QC-0002',driverName:'Marie Gagnon',   vehicleId:'TXM-002',plate:'DEF-5678',enterpriseId:'ENT-DEMO-001',at:'2026-09-20T13:45:00Z',origin:'Pizzeria Napoletana',dest:'Ahuntsic',     dist:5.8, dur:25,fare:14.50,tip:1.50,status:'COMPLETED',source:'UBER_EATS'},
  // D5 — Uber Grocery
  {id:'SIM-ACT-010',deptId:'D5',deptName:'Uber Grocery',    type:'DELIVERY', driverId:'DRV-QC-0003',driverName:'Karim Hassan',   vehicleId:'TXM-003',plate:'GHI-9012',enterpriseId:'ENT-DEMO-001',at:'2026-09-20T10:50:00Z',origin:'IGA Plateau',       dest:'Rosemont',     dist:2.4, dur:12,fare:9.99, tip:1.00,status:'COMPLETED',source:'UBER_GROCERY'},
  {id:'SIM-ACT-011',deptId:'D5',deptName:'Uber Grocery',    type:'DELIVERY', driverId:'DRV-QC-0004',driverName:'Ali Bouchard',   vehicleId:'TXM-004',plate:'JKL-3456',enterpriseId:'ENT-DEMO-001',at:'2026-09-20T14:20:00Z',origin:'Metro St-Denis',    dest:'Mile-End',     dist:3.1, dur:14,fare:12.50,tip:2.00,status:'COMPLETED',source:'UBER_GROCERY'},
  // D6 — Uber Courier
  {id:'SIM-ACT-012',deptId:'D6',deptName:'Uber Courier',    type:'DELIVERY', driverId:'DRV-QC-0005',driverName:'Sophie Martin',  vehicleId:'TXM-005',plate:'MNO-7890',enterpriseId:'ENT-DEMO-001',at:'2026-09-20T11:00:00Z',origin:'St-Laurent Ind.',   dest:'Anjou',        dist:14.2,dur:35,fare:28.00,tip:0,  status:'COMPLETED',source:'UBER_DIRECT'},
  // Exception volontaire — pour démo réconciliation
  {id:'SIM-ACT-013',deptId:'D1',deptName:'Uber Rides',      type:'TRIP',     driverId:'DRV-QC-0001',driverName:'Jean Tremblay',  vehicleId:'TXM-001',plate:'ABC-1234',enterpriseId:'ENT-DEMO-001',at:'2026-09-20T15:00:00Z',origin:'Côte-des-Neiges',   dest:'Brossard',     dist:19.8,dur:38,fare:35.00,tip:0,  status:'EXCEPTION',source:'TAXIMETER'},
]

// ── TRANSACTIONS — une par activité complétée ──
export const SIM_TRANSACTIONS = SIM_ACTIVITIES
  .filter(a=>a.status==='COMPLETED')
  .map((a,i)=>({
    id:          `SIM-TX-${String(i+1).padStart(3,'0')}`,
    actId:       a.id,
    driverId:    a.driverId,
    driverName:  a.driverName,
    vehicleId:   a.vehicleId,
    deptId:      a.deptId,
    deptName:    a.deptName,
    enterpriseId:a.enterpriseId,
    at:          a.at,
    type:        a.type,
    source:      a.source,
    gross:       a.fare,
    tip:         a.tip,
    fees:        simR2(a.fare * 0.275),           // 27.5% commission Uber (DEMO)
    taxableAmt:  a.fare,
    tps:         simR2(a.fare * SIM_TPS_R),
    tvq:         simR2(a.fare * SIM_TVQ_R),
    netDriver:   simR2(a.fare * 0.725 - simR2(a.fare*SIM_TPS_R) - simR2(a.fare*SIM_TVQ_R)),
    netUber:     simR2(a.fare * 0.275),
    status:      'RECONCILED' as const,
    payMethod:   'CARD' as const,
  }))

// ── REVENUE LEDGER SIMULATION — entrée par transaction ──
export const SIM_LEDGER = SIM_TRANSACTIONS.map((tx,i)=>({
  id:          `SIM-RL-${String(i+1).padStart(3,'0')}`,
  txId:        tx.id,
  actId:       tx.actId,
  driverId:    tx.driverId,
  vehicleId:   tx.vehicleId,
  deptId:      tx.deptId,
  enterpriseId:tx.enterpriseId,
  at:          tx.at,
  type:        tx.type==='DELIVERY'?'DELIVERY':'TRIP' as const,
  gross:       tx.gross,
  tip:         tx.tip,
  fees:        tx.fees,
  taxableAmt:  tx.taxableAmt,
  tps:         tx.tps,
  tvq:         tx.tvq,
  net:         tx.netDriver,
  source:      tx.source,
  status:      'POSTED' as const,
  reconStatus: i===11?'EXCEPTION':'MATCHED' as 'MATCHED'|'EXCEPTION',
}))

// ── RÉCONCILIATION — cas de démonstration ──
export const SIM_RECON = [
  ...SIM_LEDGER.filter(l=>l.reconStatus==='MATCHED').slice(0,5).map((l,i)=>({
    id:       `SIM-REC-${String(i+1).padStart(3,'0')}`,
    ledgerId: l.id,
    txId:     l.txId,
    actId:    l.actId,
    deptId:   l.deptId,
    expected: l.gross,
    observed: l.gross,
    variance: 0,
    status:   'MATCH' as const,
    reason:   null,
  })),
  {id:'SIM-REC-006',ledgerId:'SIM-RL-006',txId:'SIM-TX-006',actId:'SIM-ACT-006',deptId:'D3',expected:26.50,observed:24.50,variance:-2.00,status:'MINOR_VARIANCE' as const,reason:'Ajustement tarifaire zone Verdun — à valider'},
  {id:'SIM-REC-007',ledgerId:'SIM-RL-007',txId:'SIM-TX-007',actId:'SIM-ACT-007',deptId:'D4',expected:15.00,observed:15.00,variance:0,   status:'MATCH' as const,reason:null},
  {id:'SIM-REC-008',ledgerId:'SIM-RL-010',txId:'SIM-TX-010',actId:'SIM-ACT-010',deptId:'D5',expected:9.99, observed:9.99, variance:0,   status:'MATCH' as const,reason:null},
  {id:'SIM-REC-009',ledgerId:'SIM-RL-012',txId:'SIM-TX-012',actId:'SIM-ACT-012',deptId:'D6',expected:28.00,observed:31.50,variance:3.50,status:'REVIEW_REQUIRED' as const,reason:'Frais de livraison supplémentaires non déclarés — révision requise'},
]

// ── AUDIT SIMULATION — parcours complet ──
export const SIM_AUDIT = [
  {id:'SIM-AUD-001',at:'2026-09-20T08:15:00Z',actor:'SYSTÈME',action:'ACTIVITÉ CRÉÉE',     object:'SIM-ACT-001',objectType:'ACTIVITY',   detail:'Course Taxi — Jean Tremblay — YUL — 42.50$',before:null,after:'CREATED'},
  {id:'SIM-AUD-002',at:'2026-09-20T08:43:00Z',actor:'SYSTÈME',action:'TRANSACTION CRÉÉE',  object:'SIM-TX-001', objectType:'TRANSACTION', detail:'TX-001 — Brut: 42.50$ · TPS: 2.13$ · TVQ: 4.24$',before:null,after:'CREATED'},
  {id:'SIM-AUD-003',at:'2026-09-20T08:43:01Z',actor:'SYSTÈME',action:'LEDGER ENREGISTRÉ',  object:'SIM-RL-001', objectType:'LEDGER',      detail:'Revenue Ledger — Net chauffeur: 26.78$',before:null,after:'POSTED'},
  {id:'SIM-AUD-004',at:'2026-09-20T08:44:00Z',actor:'SYSTÈME',action:'RÉCONCILIATION',     object:'SIM-REC-001',objectType:'RECON',       detail:'MATCH — Écart: 0.00$',before:'PENDING',after:'MATCHED'},
  {id:'SIM-AUD-005',at:'2026-09-20T13:50:00Z',actor:'SYSTÈME',action:'ACTIVITÉ CRÉÉE',     object:'SIM-ACT-009',objectType:'ACTIVITY',   detail:'Livraison Eats — Marie Gagnon — Pizzeria — 14.50$',before:null,after:'CREATED'},
  {id:'SIM-AUD-006',at:'2026-09-20T13:51:00Z',actor:'SYSTÈME',action:'TRANSACTION CRÉÉE',  object:'SIM-TX-009', objectType:'TRANSACTION', detail:'TX-009 — Brut: 14.50$ · TPS: 0.73$ · TVQ: 1.45$',before:null,after:'CREATED'},
  {id:'SIM-AUD-007',at:'2026-09-20T14:00:00Z',actor:'SYSTÈME',action:'EXCEPTION DÉTECTÉE', object:'SIM-REC-009',objectType:'RECON',       detail:'REVIEW_REQUIRED — Écart +3.50$ — Uber Courier',before:'PENDING',after:'REVIEW_REQUIRED'},
  {id:'SIM-AUD-008',at:'2026-09-20T16:00:00Z',actor:'jp.roy@uber-demo.taximetergov.demo',action:'DÉCLARATION CRÉÉE',object:'DECL-Q3-2026',objectType:'DECLARATION',detail:'Q3 2026 — TPS: 3,412$ · TVQ: 6,794$ — DRAFT',before:null,after:'DRAFT'},
  {id:'SIM-AUD-009',at:'2026-09-20T16:30:00Z',actor:'s.marchand@uber-demo.taximetergov.demo',action:'DÉCLARATION VALIDÉE',object:'DECL-Q3-2026',objectType:'DECLARATION',detail:'Validée par Sophie Marchand — READY',before:'DRAFT',after:'READY'},
  {id:'SIM-AUD-010',at:'2026-09-20T17:00:00Z',actor:'hedibenns21@gmail.com',action:'PAIEMENT SIMULÉ',object:'PAY-Q3-2026',objectType:'PAYMENT',detail:'Paiement simulé — 10,206$ — PAID-DEMO',before:'PENDING',after:'PAID-DEMO'},
]

// ── DÉCLARATION Q3 SIMULATION ──
const simGross = SIM_TRANSACTIONS.reduce((s,t)=>s+t.gross+t.tip,0)
const simTPS   = SIM_TRANSACTIONS.reduce((s,t)=>s+t.tps,0)
const simTVQ   = SIM_TRANSACTIONS.reduce((s,t)=>s+t.tvq,0)

export const SIM_DECLARATION = {
  id:           'DECL-Q3-2026',
  enterpriseId: 'ENT-DEMO-001',
  period:       'Q3 2026 (01/07/2026 – 30/09/2026)',
  periodStart:  '2026-07-01',
  periodEnd:    '2026-09-30',
  grossRevenue: simR2(simGross * 280),   // extrapolé Q3 complet (DEMO)
  tipsTotal:    simR2(SIM_TRANSACTIONS.reduce((s,t)=>s+t.tip,0) * 280),
  tpsCollected: simR2(simTPS * 280),
  tvqCollected: simR2(simTVQ * 280),
  tpsCTI:       simR2(simTPS * 280 * 0.12), // CTI estimé (DEMO)
  tvqRTI:       simR2(simTVQ * 280 * 0.12), // RTI estimé (DEMO)
  tpsNet:       simR2(simTPS * 280 * 0.88),
  tvqNet:       simR2(simTVQ * 280 * 0.88),
  totalDue:     simR2((simTPS + simTVQ) * 280 * 0.88),
  status:       'READY',
  createdAt:    '2026-09-20T16:00:00Z',
  validatedAt:  '2026-09-20T16:30:00Z',
  validatedBy:  'Sophie Marchand',
  note:         'SIMULATION PILOTE — NON TRANSMIS À REVENU QUÉBEC — DONNÉES SYNTHÉTIQUES',
}

export const SIM_PAYMENT = {
  id:           'PAY-Q3-2026',
  declId:       'DECL-Q3-2026',
  enterpriseId: 'ENT-DEMO-001',
  period:       'Q3 2026',
  amount:       SIM_DECLARATION.totalDue,
  due:          '2026-10-31',
  status:       'PAID-DEMO',
  method:       'VIREMENT-DEMO',
  ref:          'SIM-PAY-' + Math.floor(SIM_DECLARATION.totalDue),
  paidAt:       '2026-09-20T17:00:00Z',
  note:         'PAIEMENT SIMULÉ — DÉMO PILOTE — AUCUN VRAI PAIEMENT EFFECTUÉ',
}

// ── RÉSUMÉ PAR DÉPARTEMENT ──
export const SIM_DEPT_SUMMARY = ['D1','D2','D3','D4','D5','D6'].map(dId=>{
  const acts = SIM_ACTIVITIES.filter(a=>a.deptId===dId&&a.status==='COMPLETED')
  const txs  = SIM_TRANSACTIONS.filter(t=>t.deptId===dId)
  return {
    deptId:    dId,
    acts:      acts.length,
    drivers:   [...new Set(acts.map(a=>a.driverId))].length,
    gross:     simR2(txs.reduce((s,t)=>s+t.gross,0)),
    tips:      simR2(txs.reduce((s,t)=>s+t.tip,0)),
    tps:       simR2(txs.reduce((s,t)=>s+t.tps,0)),
    tvq:       simR2(txs.reduce((s,t)=>s+t.tvq,0)),
    net:       r2(txs.reduce((s,t)=>s+t.netDriver,0)),
  }
})

// ── RAPPORT GLOBAL SIMULATION ──
export const SIM_RAPPORT = {
  label:          'Simulation · Journée du 2026-09-20',
  enterpriseId:   'ENT-DEMO-001',
  entreprise:     'UBER QUÉBEC / UBER CANADA INC.',
  departments:    6,
  drivers:        [...new Set(SIM_ACTIVITIES.map(a=>a.driverId))].length,
  vehicles:       [...new Set(SIM_ACTIVITIES.map(a=>a.vehicleId))].length,
  activitiesTotal:SIM_ACTIVITIES.length,
  completed:      SIM_ACTIVITIES.filter(a=>a.status==='COMPLETED').length,
  exceptions:     SIM_ACTIVITIES.filter(a=>a.status==='EXCEPTION').length,
  transactions:   SIM_TRANSACTIONS.length,
  grossTotal:     r2(SIM_TRANSACTIONS.reduce((s,t)=>s+t.gross,0)),
  tipsTotal:      r2(SIM_TRANSACTIONS.reduce((s,t)=>s+t.tip,0)),
  tpsTotal:       r2(SIM_TRANSACTIONS.reduce((s,t)=>s+t.tps,0)),
  tvqTotal:       r2(SIM_TRANSACTIONS.reduce((s,t)=>s+t.tvq,0)),
  ledgerEntries:  SIM_LEDGER.length,
  matched:        SIM_RECON.filter(r=>r.status==='MATCH').length,
  variances:      SIM_RECON.filter(r=>r.status==='MINOR_VARIANCE').length,
  reviews:        SIM_RECON.filter(r=>r.status==='REVIEW_REQUIRED').length,
  declarations:   1,
  payments:       1,
  auditEvents:    SIM_AUDIT.length,
  note:           'PILOTE · DONNÉES SYNTHÉTIQUES · AUCUNE TRANSMISSION GOUVERNEMENTALE RÉELLE',
}
