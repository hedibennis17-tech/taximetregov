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
  {id:'ACT-ENT-009',extRef:'DOORDASH-7710', type:'DELIVERY', provider:'DOORDASH DEMO',driverId:'DRV-QC-0006',vehicleId:'TXM-006',at:'2026-09-17T12:00:00Z',origin:'Restaurant DEMO',dest:'Client DEMO',dist:3.5,dur:14,wait:5,fare:12.00,tip:2.00,tps:r2(12.00*TPS),tvq:r2(12.00*TVQ),fees:r2(12.00*0.30),driverAmt:r2(12.00*0.65),status:'COMPLETED',syncStatus:'SYNCED',  txId:'TX-ENT-009'},
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
  {id:'TX-ENT-009',actId:'ACT-ENT-009',extId:'DOORDASH-7710', provider:'DOORDASH DEMO',driverId:'DRV-QC-0006',vehicleId:'TXM-006',gross:12.00,tip:2.00,tps:r2(12.00*TPS),tvq:r2(12.00*TVQ),fees:r2(12.00*0.30),driverAmt:r2(12.00*0.65),entAmt:r2(12.00*0.05),adj:0,refund:0,  status:'RECONCILED',syncStatus:'SYNCED', at:'2026-09-17T12:02:00Z',recon:'MATCHED'},
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
  {id:'CONN-005',name:'DOORDASH DEMO',        type:'PLATFORM',  method:'Webhook',     status:'CONNECTED',   health:92, latency:110,dataRx:980,  errors:3,  lastSync:'2026-09-18T08:30:00Z',scopes:['deliveries','tips'],note:'Latence légèrement élevée'},
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
  {id:'WH-006',connId:'CONN-005',event:'delivery.completed',extRef:'DOORDASH-7710', at:'2026-09-17T12:02:00Z',status:'PROCESSED',attempts:3,latency:115,payload:'{"deliveryId":"7710","amount":12.00}',error:'2 tentatives échouées avant succès'},
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
  {id:'SYN-007',at:'2026-09-17T12:02:00Z',source:'DOORDASH DEMO', type:'WEBHOOK',    duration:115, records:1,   new:1,  updated:0, skipped:0, errors:0, status:'SUCCESS',note:'Delivery DD-7710 (retry 3)'},
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
