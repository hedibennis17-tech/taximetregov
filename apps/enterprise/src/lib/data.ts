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
  id:'ENT-DEMO-001', legalName:'Taxi Métro Montréal Inc.', tradeName:'Taxi Métro',
  neq:'1234567890', taxId:'TPS-123456-7', sector:'TAXI', type:'CORPORATION',
  status:'ACTIVE', verif:'VERIFIED', connection:'CONNECTED', compliance:98,
  address:'1200 boul. Saint-Laurent', city:'Montréal', province:'QC', postal:'H2X 2S5',
  phone:'(514) 555-0201', email:'admin@taximetro.demo', website:'www.taximetro.demo',
  registered:'2026-01-15', repr:'Robert Simard', jurisdiction:'QC',
}

export const ENT_USERS = [
  {id:'EUSR-001',name:'Robert Simard',      role:'OWNER',    email:'r.simard@taximetro.demo',     status:'ACTIVE',  lastLogin:'2026-09-18T08:02:00Z'},
  {id:'EUSR-002',name:'Louise Côté',         role:'FINANCE',  email:'l.cote@taximetro.demo',        status:'ACTIVE',  lastLogin:'2026-09-17T14:00:00Z'},
  {id:'EUSR-003',name:'Marc Dupont',         role:'DISPATCH', email:'m.dupont@taximetro.demo',      status:'ACTIVE',  lastLogin:'2026-09-18T07:30:00Z'},
  {id:'EUSR-004',name:'Sophie Tran',         role:'VIEWER',   email:'s.tran@taximetro.demo',        status:'ACTIVE',  lastLogin:'2026-09-16T10:00:00Z'},
  {id:'EUSR-005',name:'Ali Karim',           role:'COMPLIANCE',email:'a.karim@taximetro.demo',      status:'PENDING', lastLogin:null},
]

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
  {section:'🏠 Tableau de bord', items:[{href:'/',label:'Dashboard'}]},
  {section:'🏢 Organisation', items:[
    {href:'/profile',         label:'Profil entreprise'},
    {href:'/representatives',  label:'Représentants'},
    {href:'/users',           label:'Utilisateurs & Rôles'},
    {href:'/documents',       label:'Documents'},
  ]},
  {section:'👨‍✈️ Workforce', items:[
    {href:'/drivers',         label:'Chauffeurs'},
    {href:'/vehicles',        label:'Véhicules'},
    {href:'/taximeter',       label:'Taximètre'},
    {href:'/activities',      label:'Activités'},
  ]},
  {section:'💰 Finance & Fiscal', items:[
    {href:'/transactions',    label:'Transactions'},
    {href:'/revenue',         label:'Revenus'},
    {href:'/fiscal',          label:'TPS / TVQ'},
    {href:'/obligations',     label:'Obligations'},
    {href:'/declarations',    label:'Déclarations'},
    {href:'/payments',        label:'Paiements'},
  ]},
  {section:'🔌 Connexions', items:[
    {href:'/connections',     label:'Centre connexions'},
    {href:'/sync',            label:'Synchronisation'},
  ]},
  {section:'🔄 Transparence & Conformité', items:[
    {href:'/transparency',    label:'Transparence'},
    {href:'/reconciliation',  label:'Réconciliation'},
    {href:'/exceptions',      label:'Exceptions'},
  ]},
  {section:'📊 Rapports & Audit', items:[
    {href:'/reports',         label:'Rapports'},
    {href:'/audit',           label:'Historique audit'},
    {href:'/notifications',   label:'Notifications'},
  ]},
]

// ── REPRÉSENTANTS ─────────────────────────────────────────────
export const ENT_REPRESENTATIVES = [
  {id:'REP-001',firstName:'Robert',lastName:'Simard',   role:'OWNER',       email:'r.simard@taximetro.demo',   phone:'(514) 555-0221',status:'ACTIVE', addedAt:'2026-01-15',lastLogin:'2026-09-18T08:02:00Z'},
  {id:'REP-002',firstName:'Louise',lastName:'Côté',     role:'FINANCE',     email:'l.cote@taximetro.demo',     phone:'(514) 555-0222',status:'ACTIVE', addedAt:'2026-01-15',lastLogin:'2026-09-17T14:00:00Z'},
  {id:'REP-003',firstName:'Marc',  lastName:'Dupont',   role:'DISPATCH',    email:'m.dupont@taximetro.demo',   phone:'(514) 555-0223',status:'ACTIVE', addedAt:'2026-02-01',lastLogin:'2026-09-18T07:30:00Z'},
  {id:'REP-004',firstName:'Sophie',lastName:'Tran',     role:'VIEWER',      email:'s.tran@taximetro.demo',     phone:'(514) 555-0224',status:'ACTIVE', addedAt:'2026-03-15',lastLogin:'2026-09-16T10:00:00Z'},
  {id:'REP-005',firstName:'Ali',   lastName:'Karim',    role:'COMPLIANCE',  email:'a.karim@taximetro.demo',    phone:'(514) 555-0225',status:'PENDING',addedAt:'2026-09-10',lastLogin:null},
]

// ── PERMISSIONS MATRICE ───────────────────────────────────────
export const PERMISSIONS_MATRIX = [
  {resource:'Chauffeurs',    owner:['view','manage'], admin:['view','manage'], finance:['view'], compliance:['view'], dispatch:['view','manage'], viewer:['view']},
  {resource:'Véhicules',     owner:['view','manage'], admin:['view','manage'], finance:['view'], compliance:['view'], dispatch:['view','manage'], viewer:['view']},
  {resource:'Documents',     owner:['view','upload','approve'], admin:['view','upload','approve'], finance:['view'], compliance:['view','upload','approve'], dispatch:['view'], viewer:['view']},
  {resource:'Activités',     owner:['view'],          admin:['view'],          finance:['view'], compliance:['view'], dispatch:['view'],          viewer:['view']},
  {resource:'Transactions',  owner:['view'],          admin:['view'],          finance:['view'], compliance:['view'], dispatch:[],               viewer:['view']},
  {resource:'Revenus',       owner:['view'],          admin:['view'],          finance:['view'], compliance:[],       dispatch:[],               viewer:[]},
  {resource:'Taxes',         owner:['view','manage'], admin:['view'],          finance:['view','manage'], compliance:['view'], dispatch:[], viewer:[]},
  {resource:'Déclarations',  owner:['prepare','submit'], admin:['view'],       finance:['prepare','submit'], compliance:['view'], dispatch:[], viewer:[]},
  {resource:'Paiements',     owner:['view','manage'], admin:['view'],          finance:['view','manage'], compliance:[], dispatch:[], viewer:[]},
  {resource:'Connexions',    owner:['view','manage'], admin:['view','manage'], finance:[], compliance:[], dispatch:[], viewer:[]},
  {resource:'Rapports',      owner:['view','export'], admin:['view','export'], finance:['view','export'], compliance:['view','export'], dispatch:['view'], viewer:['view']},
  {resource:'Audit',         owner:['view'],          admin:['view'],          finance:['view'], compliance:['view'], dispatch:[], viewer:[]},
]

// ── AUDIT LOG DEMO ────────────────────────────────────────────
export const AUDIT_LOG = [
  {id:'AL-001',at:'2026-09-18T10:38:00Z',user:'Robert Simard',    role:'OWNER',    action:'SYNC_COMPLETED',    obj:'Revenue Ledger',   result:'OK',   note:'9840 enregistrements synchronisés'},
  {id:'AL-002',at:'2026-09-18T08:00:00Z',user:'SYSTEM',           role:'SYSTEM',   action:'DOCUMENT_FLAGGED',  obj:'DOC-007',          result:'WARN', note:'Inspection TXM-004 expirée'},
  {id:'AL-003',at:'2026-09-17T14:00:00Z',user:'Louise Côté',      role:'FINANCE',  action:'DECLARATION_VIEWED',obj:'OBL-Q3',           result:'OK',   note:'Consultation obligations Q3'},
  {id:'AL-004',at:'2026-09-16T10:00:00Z',user:'Sophie Tran',      role:'VIEWER',   action:'DASHBOARD_VIEWED',  obj:'Dashboard',        result:'OK',   note:'Connexion et consultation'},
  {id:'AL-005',at:'2026-09-15T09:00:00Z',user:'Robert Simard',    role:'OWNER',    action:'DRIVER_UPDATED',    obj:'DRV-QC-0004',      result:'OK',   note:'Statut mis à jour'},
  {id:'AL-006',at:'2026-09-10T11:00:00Z',user:'Robert Simard',    role:'OWNER',    action:'USER_INVITED',      obj:'a.karim@taximetro.demo',result:'OK',note:'Invitation envoyée — rôle COMPLIANCE'},
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
  'DRV-QC-0001': {email:'jean.tremblay.demo@taximetro.demo',phone:'(514) 555-1001',address:'123 rue Beaubien, Montréal QC H2S 1Y3',joined:'2026-01-15',syncStatus:'CONNECTED',lastSync:'2026-09-18T10:32:00Z',externalRef:'TAXGOV-DRV-001',docsStatus:'OK',complianceScore:98,history:[{at:'2026-01-15T09:00:00Z',action:'DRIVER_ASSOCIATED',note:'Chauffeur associé à Taxi Métro'},{at:'2026-03-10T10:00:00Z',action:'VEHICLE_ASSIGNED',note:'TXM-001 assigné'},{at:'2026-09-18T10:32:00Z',action:'SYNC_COMPLETED',note:'Synchronisation TAXIMETER.GOV réussie'}]},
  'DRV-QC-0002': {email:'marie.gagnon.demo@taximetro.demo',phone:'(514) 555-1002',address:'456 av. du Mont-Royal, Montréal QC H2T 2S5',joined:'2026-01-15',syncStatus:'CONNECTED',lastSync:'2026-09-18T08:32:00Z',externalRef:'TAXGOV-DRV-002',docsStatus:'OK',complianceScore:96,history:[{at:'2026-01-15T09:10:00Z',action:'DRIVER_ASSOCIATED',note:'Chauffeur associé'},{at:'2026-09-18T08:32:00Z',action:'SYNC_COMPLETED',note:'Sync réussie'}]},
  'DRV-QC-0003': {email:'karim.hassan.demo@taximetro.demo',phone:'(514) 555-1003',address:'789 rue Saint-Denis, Montréal QC H2J 2L9',joined:'2026-02-01',syncStatus:'CONNECTED',lastSync:'2026-09-18T07:47:00Z',externalRef:'TAXGOV-DRV-003',docsStatus:'OK',complianceScore:94,history:[{at:'2026-02-01T10:00:00Z',action:'DRIVER_ASSOCIATED',note:'Sous-traitant associé'}]},
  'DRV-QC-0004': {email:'ali.bouchard.demo@taximetro.demo',phone:'(514) 555-1004',address:'321 boul. Saint-Laurent, Montréal QC H2X 2T4',joined:'2026-02-15',syncStatus:'PENDING',lastSync:'2026-09-17T22:02:00Z',externalRef:'TAXGOV-DRV-004',docsStatus:'EXPIRING',complianceScore:72,history:[{at:'2026-02-15T10:00:00Z',action:'DRIVER_ASSOCIATED',note:'Sous-traitant associé'},{at:'2026-09-17T08:00:00Z',action:'DOCUMENT_FLAGGED',note:'Permis expire 2026-09-30'}]},
  'DRV-QC-0005': {email:'nadia.patel.demo@taximetro.demo',phone:'(514) 555-1005',address:'654 rue Sherbrooke O., Montréal QC H3A 1E3',joined:'2026-03-01',syncStatus:'ERROR',lastSync:null,externalRef:null,docsStatus:'EXPIRED',complianceScore:40,history:[{at:'2026-03-01T10:00:00Z',action:'DRIVER_ASSOCIATED',note:'Employée associée'},{at:'2026-06-01T08:00:00Z',action:'DOCUMENT_EXPIRED',note:'Permis expiré'},{at:'2026-06-02T09:00:00Z',action:'DRIVER_SUSPENDED',note:'Suspension suite expiration permis'}]},
  'DRV-QC-0006': {email:'marc.leblanc.demo@taximetro.demo',phone:'(514) 555-1006',address:'987 rue Papineau, Montréal QC H2K 4K6',joined:'2026-01-20',syncStatus:'CONNECTED',lastSync:'2026-09-18T07:00:00Z',externalRef:'TAXGOV-DRV-006',docsStatus:'OK',complianceScore:95,history:[{at:'2026-01-20T10:00:00Z',action:'DRIVER_ASSOCIATED',note:'Employé associé'},{at:'2026-09-18T07:00:00Z',action:'SYNC_COMPLETED',note:'Sync OK'}]},
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
