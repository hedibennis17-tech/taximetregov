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
