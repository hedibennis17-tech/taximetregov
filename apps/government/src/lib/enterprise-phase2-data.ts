// TAXIMETER.GOV — Enterprise Phase 2 — Données supervision gouvernementale avancée
// PILOTE · DONNÉES SYNTHÉTIQUES · AUCUNE CONNEXION GOUVERNEMENTALE RÉELLE
export const PILOT = 'PILOTE · DONNÉES SYNTHÉTIQUES · AUCUNE CONNEXION GOUVERNEMENTALE RÉELLE'
export const money = (n:number) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(n)
export const money2 = (n:number) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(n)
export const fmtDt = (s:string) => new Intl.DateTimeFormat('fr-CA',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(s))
export const fmtDate = (s:string) => new Intl.DateTimeFormat('fr-CA',{year:'numeric',month:'short',day:'numeric'}).format(new Date(s))
const r2=(n:number)=>Math.round(n*100)/100
const TPS=0.05; const TVQ=0.09975

// ── NAV PHASE 2 ───────────────────────────────────────────────
export const P2_NAV = [
  {href:'/admin/enterprises/overview',   l:'📊 Vue globale',      group:'phase1'},
  {href:'/admin/enterprises',            l:'📋 Registre',         group:'phase1'},
  {href:'/admin/enterprises/command',    l:'🏛️ Command Center',   group:'phase2'},
  {href:'/admin/enterprises/drivers',    l:'🔗 Ent ↔ Driver',     group:'phase2'},
  {href:'/admin/enterprises/taximeter',  l:'🚕 Taximètre',        group:'phase2'},
  {href:'/admin/enterprises/activities', l:'📦 Activités',        group:'phase2'},
  {href:'/admin/enterprises/financial',  l:'💰 Financier',        group:'phase2'},
  {href:'/admin/enterprises/fiscal',     l:'🧾 Fiscal',           group:'phase2'},
  {href:'/admin/enterprises/declarations',l:'📤 Déclarations',    group:'phase2'},
  {href:'/admin/enterprises/payments',   l:'💵 Paiements',        group:'phase2'},
  {href:'/admin/enterprises/connections',l:'🔌 Connexions',       group:'phase2'},
  {href:'/admin/enterprises/reconciliation',l:'🔄 Réconciliation',group:'phase2'},
  {href:'/admin/enterprises/compliance', l:'⚖️ Conformité',       group:'phase2'},
  {href:'/admin/enterprises/alerts',     l:'🚨 Alertes',          group:'phase2'},
  {href:'/admin/enterprises/intelligence',l:'🧠 Intelligence',    group:'phase2'},
  {href:'/admin/enterprises/analytics',  l:'📈 Analytics',        group:'phase2'},
  {href:'/admin/enterprises/audit',      l:'🛡️ Audit',            group:'phase2'},
]

// ── TAXIMÈTRES DEMO ───────────────────────────────────────────
export const TAXIMETERS = [
  {id:'TXM-DEMO-001',entId:'ENT-DEMO-001',driverId:'DRV-QC-0001',plate:'ABC-1234',make:'Nissan',model:'Altima',year:2022,status:'ACTIVE',lastTrip:'2026-09-18T10:30:00Z',totalTrips:4820,firmware:'v2.3.1',cert:'CTQ-2025-001'},
  {id:'TXM-DEMO-002',entId:'ENT-DEMO-001',driverId:'DRV-QC-0002',plate:'DEF-5678',make:'Toyota',model:'Camry', year:2023,status:'ACTIVE',lastTrip:'2026-09-18T09:45:00Z',totalTrips:3640,firmware:'v2.3.1',cert:'CTQ-2025-002'},
  {id:'TXM-DEMO-003',entId:'ENT-DEMO-002',driverId:'DRV-QC-0003',plate:'GHI-9012',make:'Hyundai',model:'Sonata',year:2021,status:'ACTIVE',lastTrip:'2026-09-18T08:40:00Z',totalTrips:2640,firmware:'v2.2.8',cert:'CTQ-2025-003'},
  {id:'TXM-DEMO-004',entId:'ENT-DEMO-002',driverId:'DRV-QC-0004',plate:'JKL-3456',make:'Ford',  model:'Fusion',year:2020,status:'MAINTENANCE',lastTrip:'2026-09-15T14:00:00Z',totalTrips:1820,firmware:'v2.2.5',cert:'CTQ-2024-004'},
]

// ── TRIPS (COURSES TAXI) DEMO ─────────────────────────────────
export const TRIPS = [
  {id:'TRIP-DEMO-001',txmId:'TXM-DEMO-001',driverId:'DRV-QC-0001',entId:'ENT-DEMO-001',at:'2026-09-18T10:30:00Z',origin:'Montréal-Nord (DEMO)',dest:'Aéroport YUL (DEMO)',dist:22.4,dur:28,wait:3,fare:42.50,tip:5.00,tps:r2(42.50*TPS),tvq:r2(42.50*TVQ),payment:'CARD',txId:'TX-ENT-001',status:'TRANSMITTED'},
  {id:'TRIP-DEMO-002',txmId:'TXM-DEMO-001',driverId:'DRV-QC-0001',entId:'ENT-DEMO-001',at:'2026-09-18T09:10:00Z',origin:'Plateau (DEMO)',    dest:'Centre-ville (DEMO)',dist:4.8, dur:12,wait:1,fare:18.75,tip:2.00,tps:r2(18.75*TPS),tvq:r2(18.75*TVQ),payment:'CASH',txId:'TX-ENT-002',status:'TRANSMITTED'},
  {id:'TRIP-DEMO-003',txmId:'TXM-DEMO-002',driverId:'DRV-QC-0002',entId:'ENT-DEMO-001',at:'2026-09-18T08:15:00Z',origin:'Mile-End (DEMO)',   dest:'Rosemont (DEMO)',    dist:3.2, dur:9, wait:0,fare:14.50,tip:1.50,tps:r2(14.50*TPS),tvq:r2(14.50*TVQ),payment:'CARD',txId:'TX-ENT-003',status:'TRANSMITTED'},
  {id:'TRIP-DEMO-004',txmId:'TXM-DEMO-003',driverId:'DRV-QC-0003',entId:'ENT-DEMO-002',at:'2026-09-18T07:30:00Z',origin:'Laval (DEMO)',      dest:'Montréal (DEMO)',    dist:18.1,dur:24,wait:2,fare:38.00,tip:4.00,tps:r2(38.00*TPS),tvq:r2(38.00*TVQ),payment:'CARD',txId:'TX-ENT-003b',status:'TRANSMITTED'},
  {id:'TRIP-DEMO-005',txmId:'TXM-DEMO-004',driverId:'DRV-QC-0004',entId:'ENT-DEMO-002',at:'2026-09-15T14:00:00Z',origin:'Longueuil (DEMO)',  dest:'Rive-Sud (DEMO)',    dist:8.5, dur:15,wait:1,fare:24.00,tip:0,   tps:r2(24.00*TPS),tvq:r2(24.00*TVQ),payment:'CASH',txId:null,      status:'PENDING'},
]

// ── ACTIVITÉS MULTI-SECTEURS DEMO ─────────────────────────────
export const ACTIVITIES = [
  {id:'ACT-P2-001',entId:'ENT-DEMO-001',driverId:'DRV-QC-0001',vehicleId:'VEH-001',provider:'TAXI MTR DEMO',   type:'TAXI',      at:'2026-09-18T10:30:00Z',origin:'Montréal-Nord', dest:'YUL',         dist:22.4,dur:28,status:'COMPLETED',txId:'TX-ENT-001'},
  {id:'ACT-P2-002',entId:'ENT-DEMO-001',driverId:'DRV-QC-0002',vehicleId:'VEH-002',provider:'UBER DEMO',       type:'RIDESHARE', at:'2026-09-18T09:00:00Z',origin:'Plateau',        dest:'Westmount',   dist:5.2, dur:14,status:'COMPLETED',txId:'TX-ENT-002'},
  {id:'ACT-P2-003',entId:'ENT-DEMO-003',driverId:'DRV-QC-0003',vehicleId:'VEH-010',provider:'DOORDASH DEMO',   type:'DELIVERY',  at:'2026-09-18T10:00:00Z',origin:'Entrepôt LEM',   dest:'Client #428', dist:8.1, dur:22,status:'COMPLETED',txId:'TX-ENT-004'},
  {id:'ACT-P2-004',entId:'ENT-DEMO-003',driverId:'DRV-QC-0003',vehicleId:'VEH-010',provider:'SKIP DEMO',       type:'DELIVERY',  at:'2026-09-18T09:30:00Z',origin:'Rest. DEMO',      dest:'Client #429', dist:3.4, dur:12,status:'COMPLETED',txId:'TX-ENT-005'},
  {id:'ACT-P2-005',entId:'ENT-DEMO-004',driverId:'DRV-QC-0004',vehicleId:'VEH-015',provider:'API TAXIMETER',   type:'PARCEL',    at:'2026-09-18T08:00:00Z',origin:'Entrepôt CR',     dest:'Client #201', dist:12.3,dur:28,status:'PENDING',  txId:null},
  {id:'ACT-P2-006',entId:'ENT-DEMO-005',driverId:'DRV-QC-0005',vehicleId:'VEH-020',provider:'DIRECT DEMO',     type:'LOGISTICS', at:'2026-09-17T14:00:00Z',origin:'Québec City',     dest:'Montréal',    dist:248, dur:180,status:'COMPLETED',txId:'TX-ENT-LOG-001'},
  {id:'ACT-P2-007',entId:'ENT-DEMO-008',driverId:'DRV-QC-0006',vehicleId:'VEH-030',provider:'MESSAGEMTL DEMO', type:'COURIER',   at:'2026-09-17T22:00:00Z',origin:'Vieux-Port',      dest:'NDG',         dist:6.8, dur:18,status:'ERROR',    txId:null},
]

// ── FINANCIAL BREAKDOWN DEMO ──────────────────────────────────
export const FINANCIAL_BREAKDOWN = [
  {entId:'ENT-DEMO-001',period:'Q3 2026',gross:412_800,fees:r2(412_800*0.08),tips:r2(412_800*0.10),tps:r2(412_800*TPS),tvq:r2(412_800*TVQ),adjustments:-1240,refunds:-820,driverRev:r2(412_800*0.78),entRev:r2(412_800*0.22)},
  {entId:'ENT-DEMO-002',period:'Q3 2026',gross:228_400,fees:r2(228_400*0.08),tips:r2(228_400*0.10),tps:r2(228_400*TPS),tvq:r2(228_400*TVQ),adjustments:-640,refunds:-320,driverRev:r2(228_400*0.80),entRev:r2(228_400*0.20)},
  {entId:'ENT-DEMO-003',period:'Q3 2026',gross:378_000,fees:r2(378_000*0.12),tips:r2(378_000*0.08),tps:r2(378_000*TPS),tvq:r2(378_000*TVQ),adjustments:-980,refunds:-460,driverRev:r2(378_000*0.75),entRev:r2(378_000*0.25)},
  {entId:'ENT-DEMO-006',period:'Q3 2026',gross:133_200,fees:r2(133_200*0.10),tips:r2(133_200*0.06),tps:r2(133_200*TPS),tvq:r2(133_200*TVQ),adjustments:-280,refunds:-140,driverRev:r2(133_200*0.76),entRev:r2(133_200*0.24)},
]

// ── FISCAL PERIODS DEMO ───────────────────────────────────────
export const FISCAL_PERIODS = [
  {entId:'ENT-DEMO-001',period:'Q1 2026',gross:136_800,tpsCalc:r2(136_800*TPS),tpsCollected:r2(136_800*TPS),tpsDeclared:r2(136_800*TPS*0.98),tpsPaid:r2(136_800*TPS*0.98),tpsRefund:0,tvqCalc:r2(136_800*TVQ),tvqCollected:r2(136_800*TVQ),tvqDeclared:r2(136_800*TVQ*0.98),tvqPaid:r2(136_800*TVQ*0.98),tvqRefund:0,status:'CLOSED'},
  {entId:'ENT-DEMO-001',period:'Q2 2026',gross:144_480,tpsCalc:r2(144_480*TPS),tpsCollected:r2(144_480*TPS),tpsDeclared:r2(144_480*TPS),tpsPaid:r2(144_480*TPS),tpsRefund:0,tvqCalc:r2(144_480*TVQ),tvqCollected:r2(144_480*TVQ),tvqDeclared:r2(144_480*TVQ),tvqPaid:r2(144_480*TVQ),tvqRefund:0,status:'CLOSED'},
  {entId:'ENT-DEMO-001',period:'Q3 2026',gross:412_800,tpsCalc:r2(412_800*TPS),tpsCollected:r2(412_800*TPS),tpsDeclared:0,tpsPaid:0,tpsRefund:0,tvqCalc:r2(412_800*TVQ),tvqCollected:r2(412_800*TVQ),tvqDeclared:0,tvqPaid:0,tvqRefund:0,status:'OPEN'},
  {entId:'ENT-DEMO-006',period:'Q2 2026',gross:133_200*1.12,tpsCalc:r2(133_200*1.12*TPS),tpsCollected:r2(133_200*1.12*TPS),tpsDeclared:0,tpsPaid:0,tpsRefund:0,tvqCalc:r2(133_200*1.12*TVQ),tvqCollected:r2(133_200*1.12*TVQ),tvqDeclared:0,tvqPaid:0,tvqRefund:0,status:'OVERDUE'},
]

// ── DÉCLARATIONS DEMO ─────────────────────────────────────────
export const DECLARATIONS = [
  {id:'DCL-DEMO-001',entId:'ENT-DEMO-001',period:'Q1 2026',type:'TPS/TVQ',status:'ACCEPTED', tps:r2(136_800*TPS*0.98),tvq:r2(136_800*TVQ*0.98),total:r2(136_800*(TPS+TVQ)*0.98),draftAt:'2026-04-20',submittedAt:'2026-04-25',acceptedAt:'2026-04-28',ref:'DAS-2026-Q1-001'},
  {id:'DCL-DEMO-002',entId:'ENT-DEMO-001',period:'Q2 2026',type:'TPS/TVQ',status:'ACCEPTED', tps:r2(144_480*TPS),    tvq:r2(144_480*TVQ),    total:r2(144_480*(TPS+TVQ)),    draftAt:'2026-07-20',submittedAt:'2026-07-28',acceptedAt:'2026-07-30',ref:'DAS-2026-Q2-001'},
  {id:'DCL-DEMO-003',entId:'ENT-DEMO-001',period:'Q3 2026',type:'TPS/TVQ',status:'DRAFT',    tps:r2(412_800*TPS),    tvq:r2(412_800*TVQ),    total:r2(412_800*(TPS+TVQ)),    draftAt:'2026-09-18',submittedAt:null,acceptedAt:null,ref:null},
  {id:'DCL-DEMO-004',entId:'ENT-DEMO-002',period:'Q1 2026',type:'TPS/TVQ',status:'ACCEPTED', tps:r2(76_133*TPS),     tvq:r2(76_133*TVQ),     total:r2(76_133*(TPS+TVQ)),     draftAt:'2026-04-22',submittedAt:'2026-04-26',acceptedAt:'2026-04-29',ref:'DAS-2026-Q1-002'},
  {id:'DCL-DEMO-005',entId:'ENT-DEMO-006',period:'Q2 2026',type:'TPS/TVQ',status:'MISSING',  tps:0,tvq:0,total:0,draftAt:null,submittedAt:null,acceptedAt:null,ref:null},
]

// ── PAIEMENTS DEMO ────────────────────────────────────────────
export const PAYMENTS = [
  {id:'PAY-DEMO-001',entId:'ENT-DEMO-001',declId:'DCL-DEMO-001',period:'Q1 2026',due:r2(136_800*(TPS+TVQ)*0.98),paid:r2(136_800*(TPS+TVQ)*0.98),paidAt:'2026-04-28',method:'VIREMENT DEMO',ref:'VIR-2026-04-28-001',status:'PAID',   balance:0},
  {id:'PAY-DEMO-002',entId:'ENT-DEMO-001',declId:'DCL-DEMO-002',period:'Q2 2026',due:r2(144_480*(TPS+TVQ)),    paid:r2(144_480*(TPS+TVQ)),    paidAt:'2026-07-30',method:'VIREMENT DEMO',ref:'VIR-2026-07-30-001',status:'PAID',   balance:0},
  {id:'PAY-DEMO-003',entId:'ENT-DEMO-001',declId:'DCL-DEMO-003',period:'Q3 2026',due:r2(412_800*(TPS+TVQ)),    paid:0,                         paidAt:null,method:null,ref:null,status:'UPCOMING',balance:r2(412_800*(TPS+TVQ))},
  {id:'PAY-DEMO-004',entId:'ENT-DEMO-006',declId:'DCL-DEMO-005',period:'Q2 2026',due:r2(149_184*(TPS+TVQ)),    paid:0,                         paidAt:null,method:null,ref:null,status:'OVERDUE', balance:r2(149_184*(TPS+TVQ))},
]

// ── CONNEXIONS PLATEFORME DEMO ────────────────────────────────
export const PLATFORM_CONNECTIONS = [
  {id:'PCON-001',entId:'ENT-DEMO-001',provider:'TAXI MTR DEMO',    method:'Webhook',  status:'CONNECTED',   lastSync:'2026-09-18T10:32:00Z',dataRx:4820,errors:0, health:100,scopes:['trips','payments'],note:'Connexion SIMULATION'},
  {id:'PCON-002',entId:'ENT-DEMO-001',provider:'API TAXIMETER.GOV',method:'OAuth',    status:'CONNECTED',   lastSync:'2026-09-18T10:38:00Z',dataRx:9840,errors:0, health:100,scopes:['read','write:ledger','read:tax'],note:'Connexion principale pilote'},
  {id:'PCON-003',entId:'ENT-DEMO-003',provider:'DOORDASH DEMO',    method:'Webhook',  status:'CONNECTED',   lastSync:'2026-09-18T10:00:00Z',dataRx:3200,errors:0, health:98, scopes:['deliveries','tips'],note:'SIMULATION'},
  {id:'PCON-004',entId:'ENT-DEMO-003',provider:'SKIP DEMO',        method:'Webhook',  status:'CONNECTED',   lastSync:'2026-09-17T22:00:00Z',dataRx:2800,errors:3, health:92, scopes:['deliveries'],note:'3 webhooks en erreur'},
  {id:'PCON-005',entId:'ENT-DEMO-004',provider:'API TAXIMETER.GOV',method:'OAuth',    status:'SYNCING',     lastSync:'2026-09-18T08:00:00Z',dataRx:1200,errors:2, health:82, scopes:['read'],note:'Synchronisation en cours'},
  {id:'PCON-006',entId:'ENT-DEMO-008',provider:'MESSAGEMTL DEMO',  method:'Webhook',  status:'ERROR',       lastSync:'2026-09-17T22:00:00Z',dataRx:0,   errors:5, health:40, scopes:['trips'],note:'Auth token expiré'},
  {id:'PCON-007',entId:'ENT-DEMO-007',provider:'—',                method:'—',        status:'DISCONNECTED',lastSync:null,dataRx:0,errors:0,health:0,scopes:[],note:'Aucune connexion configurée'},
  {id:'PCON-008',entId:'ENT-DEMO-002',provider:'COOP DEMO API',    method:'Import',   status:'CONNECTED',   lastSync:'2026-09-17T20:00:00Z',dataRx:2640,errors:0, health:95, scopes:['trips','payments'],note:'Import structuré'},
  // Providers planifiés (architecture future)
  {id:'PCON-F01',entId:null,provider:'UBER',       method:'OAuth', status:'PLANNED',lastSync:null,dataRx:0,errors:0,health:0,scopes:[],note:'Intégration future — accord requis'},
  {id:'PCON-F02',entId:null,provider:'LYFT',       method:'OAuth', status:'PLANNED',lastSync:null,dataRx:0,errors:0,health:0,scopes:[],note:'Intégration future — accord requis'},
  {id:'PCON-F03',entId:null,provider:'DOORDASH',   method:'OAuth', status:'PLANNED',lastSync:null,dataRx:0,errors:0,health:0,scopes:[],note:'Intégration future — accord requis'},
  {id:'PCON-F04',entId:null,provider:'DHL',        method:'API',   status:'PLANNED',lastSync:null,dataRx:0,errors:0,health:0,scopes:[],note:'Architecture logistique future'},
  {id:'PCON-F05',entId:null,provider:'UPS',        method:'API',   status:'PLANNED',lastSync:null,dataRx:0,errors:0,health:0,scopes:[],note:'Architecture logistique future'},
]

// ── RÉCONCILIATION AVANCÉE DEMO ───────────────────────────────
export const RECONCILIATION_ITEMS = [
  {id:'RCV-P2-001',entId:'ENT-DEMO-001',txId:'TX-ENT-001',period:'2026-09-18',providerAmt:42.50,driverAmt:34.00,tips:5.00,tps:r2(42.50*TPS),tvq:r2(42.50*TVQ),fees:4.25,adjustments:0,ledgerAmt:42.50,taxAmt:r2(42.50*(TPS+TVQ)),status:'MATCHED',   diff:0,    note:null},
  {id:'RCV-P2-002',entId:'ENT-DEMO-004',txId:'TX-ENT-006',period:'2026-09-18',providerAmt:38.00,driverAmt:24.50,tips:4.00,tps:r2(38.00*TPS),tvq:r2(38.00*TVQ),fees:5.70,adjustments:0,ledgerAmt:24.50,taxAmt:r2(24.50*(TPS+TVQ)),status:'VARIANCE', diff:13.50,note:'Source plateforme: 38$ — Revenue Ledger: 24.50$ — Différence: 13.50$'},
  {id:'RCV-P2-003',entId:'ENT-DEMO-006',txId:null,         period:'2026-09-15',providerAmt:340.00,driverAmt:0,  tips:0,   tps:0,              tvq:0,              fees:0,   adjustments:0,ledgerAmt:0,   taxAmt:0,                   status:'VARIANCE', diff:340,  note:'Source API: 340$ — Aucune entrée Revenue Ledger — Analyse requise'},
  {id:'RCV-P2-004',entId:'ENT-DEMO-008',txId:'TX-ENT-007',period:'2026-09-17',providerAmt:50.00,driverAmt:40.00,tips:5.00,tps:r2(50.00*TPS),tvq:r2(50.00*TVQ),fees:7.50,adjustments:0,ledgerAmt:0,   taxAmt:0,                   status:'MISSING',  diff:50,   note:'Webhook échoué — Transaction non enregistrée dans le système'},
  {id:'RCV-P2-005',entId:'ENT-DEMO-003',txId:'TX-ENT-004',period:'2026-09-18',providerAmt:24.50,driverAmt:18.38,tips:2.50,tps:r2(24.50*TPS),tvq:r2(24.50*TVQ),fees:3.68,adjustments:0,ledgerAmt:24.50,taxAmt:r2(24.50*(TPS+TVQ)),status:'MATCHED',   diff:0,    note:null},
]

// ── CONFORMITÉ AVANCÉE DEMO ───────────────────────────────────
export const COMPLIANCE_CHECKS = [
  // ENT-DEMO-001 — Conforme
  {entId:'ENT-DEMO-001',category:'IDENTITY',    check:'Identité vérifiée',              status:'COMPLIANT',       weight:15, note:null},
  {entId:'ENT-DEMO-001',category:'DOCUMENTS',   check:'Documents valides',              status:'COMPLIANT',       weight:20, note:null},
  {entId:'ENT-DEMO-001',category:'VEHICLES',    check:'Véhicules conformes',            status:'COMPLIANT',       weight:10, note:null},
  {entId:'ENT-DEMO-001',category:'DRIVERS',     check:'Chauffeurs actifs',              status:'COMPLIANT',       weight:15, note:null},
  {entId:'ENT-DEMO-001',category:'OBLIGATIONS', check:'Obligations fiscales à jour',    status:'COMPLIANT',       weight:20, note:null},
  {entId:'ENT-DEMO-001',category:'DECLARATIONS',check:'Déclarations à jour',            status:'ATTENTION',       weight:10, note:'Q3 en cours — échéance 2026-10-31'},
  {entId:'ENT-DEMO-001',category:'CONNECTIONS', check:'Connexion API active',           status:'COMPLIANT',       weight:10, note:null},
  // ENT-DEMO-006 — Action requise
  {entId:'ENT-DEMO-006',category:'IDENTITY',    check:'Identité en révision',           status:'ATTENTION',       weight:15, note:'Vérification représentant en cours'},
  {entId:'ENT-DEMO-006',category:'OBLIGATIONS', check:'TPS/TVQ Q2 non déclarée',        status:'ACTION_REQUIRED', weight:20, note:'Échéance 2026-07-31 dépassée'},
  {entId:'ENT-DEMO-006',category:'DECLARATIONS',check:'Déclaration Q2 manquante',       status:'ACTION_REQUIRED', weight:10, note:'Aucune déclaration soumise'},
  {entId:'ENT-DEMO-006',category:'RECONCILIATION',check:'Écart 340$ non résolu',        status:'ACTION_REQUIRED', weight:15, note:'Variance Revenue Ledger vs API'},
  // ENT-DEMO-007 — Non démarré
  {entId:'ENT-DEMO-007',category:'IDENTITY',    check:'Documents en attente',           status:'ATTENTION',       weight:15, note:'NEQ en révision'},
  {entId:'ENT-DEMO-007',category:'CONNECTIONS', check:'Aucune connexion',               status:'ACTION_REQUIRED', weight:10, note:'Activation en attente'},
]

// ── INTELLIGENCE / ANOMALIES DEMO ────────────────────────────
export const INTELLIGENCE_FINDINGS = [
  {id:'INT-001',entId:'ENT-DEMO-004',type:'VARIANCE',  severity:'HIGH',   title:'Écart montant +13.50$',          desc:'Le montant transmis par la plateforme (38$) est supérieur à l\'entrée Revenue Ledger (24.50$). Différence: 13.50$. Cause possible: frais déduits différemment selon la source.',  action:'Analyser les règles de calcul des frais plateforme vs système interne.',at:'2026-09-18T08:05:00Z'},
  {id:'INT-002',entId:'ENT-DEMO-006',type:'MISSING',   severity:'CRITICAL',title:'340$ sans entrée ledger',         desc:'Source API signale 340$ de transactions. Aucune entrée dans Revenue Ledger. Plusieurs causes possibles: webhook échoué, délai synchronisation, ou non-transmission.',               action:'Vérifier le statut de synchronisation. Ouvrir un dossier de conformité.',at:'2026-09-15T14:00:00Z'},
  {id:'INT-003',entId:'ENT-DEMO-008',type:'WEBHOOK',   severity:'HIGH',   title:'5 webhooks échoués — MessageMTL', desc:'5 tentatives de webhook consécutives ont échoué depuis 2026-09-17T22:00. Le token d\'authentification est expiré. Les données de courses ne sont pas transmises.',              action:'Renouveler le token API. Récupérer les données manquantes via import.',   at:'2026-09-17T22:00:00Z'},
  {id:'INT-004',entId:'ENT-DEMO-006',type:'FISCAL',    severity:'CRITICAL',title:'Obligation Q2 en retard — 49j', desc:'La déclaration TPS/TVQ Q2 2026 de MoBroker n\'a pas été soumise. Échéance: 2026-07-31 (49 jours de retard). Montant estimé dû: ~' + money(r2(149_184*(TPS+TVQ))) + '.', action:'Contacter le représentant fiscal de MoBroker. Déclencher un rappel officiel.',at:'2026-09-18T08:00:00Z'},
  {id:'INT-005',entId:'ENT-DEMO-004',type:'SYNC',      severity:'MEDIUM', title:'Synchronisation partielle CR',    desc:'Colis Rapide est en mode SYNCING depuis 2026-09-18T08:00. 2 erreurs détectées. 12 transactions non confirmées. Données possiblement incomplètes.',                             action:'Surveiller la synchronisation. Vérifier les logs d\'erreur API.',         at:'2026-09-18T08:05:00Z'},
  {id:'INT-006',entId:'ENT-DEMO-001',type:'POSITIVE',  severity:'INFO',   title:'ENT-001 — Conformité 98%',       desc:'Taxi Métro Montréal maintient un niveau de conformité de 98%. Toutes les obligations Q1 et Q2 payées. Connexion API stable. Seule la déclaration Q3 est en cours (normale).',   action:'Aucune action requise. Surveiller Q3 avant le 2026-10-31.',              at:'2026-09-18T08:00:00Z'},
]

// ── AUDIT PHASE 2 DEMO ────────────────────────────────────────
export const AUDIT_P2: Array<{id:string;entId:string;at:string;who:string;what:string;resource:string;source:string;old:string|null;newVal:string|null;why:string}> = [
  {id:'AUD-P2-001',entId:'ENT-DEMO-001',at:'2026-09-18T10:32:00Z',who:'SYSTEM',        what:'SYNC_COMPLETED',      resource:'Revenue Ledger',   source:'WEBHOOK',   old:null,         newVal:'4820 activités',        why:'Synchronisation automatique webhook'},
  {id:'AUD-P2-002',entId:'ENT-DEMO-001',at:'2026-09-18T10:00:00Z',who:'SYSTEM',        what:'TRIP_TRANSMITTED',    resource:'TRIP-DEMO-001',    source:'TAXIMETER', old:null,         newVal:'TX-ENT-001 créé',       why:'Course complétée — transmission taximètre'},
  {id:'AUD-P2-003',entId:'ENT-DEMO-006',at:'2026-09-15T14:00:00Z',who:'SYSTEM',        what:'RECONCILIATION_FLAG', resource:'Revenue Ledger',   source:'SYSTEM',    old:'0$',         newVal:'340$ écart détecté',    why:'Source API vs Ledger — variance'},
  {id:'AUD-P2-004',entId:'ENT-DEMO-006',at:'2026-09-10T09:00:00Z',who:'Admin GOV-02',  what:'COMPLIANCE_REVIEW',   resource:'ENT-DEMO-006',     source:'ADMIN',     old:'VERIFIED',   newVal:'UNDER_REVIEW',          why:'Vérification identité représentant déclenchée'},
  {id:'AUD-P2-005',entId:'ENT-DEMO-008',at:'2026-09-17T22:05:00Z',who:'SYSTEM',        what:'WEBHOOK_FAILURE_5X',  resource:'WH-ENT-005',       source:'WEBHOOK',   old:'PENDING',    newVal:'FAILED (5x)',           why:'Auth token expiré — retry épuisé'},
  {id:'AUD-P2-006',entId:'ENT-DEMO-007',at:'2026-09-17T10:00:00Z',who:'Admin GOV-02',  what:'ENTERPRISE_REVIEW',   resource:'ENT-DEMO-007',     source:'ADMIN',     old:'PENDING',    newVal:'UNDER_REVIEW',          why:'Documents soumis — vérification NEQ déclenchée'},
  {id:'AUD-P2-007',entId:'ENT-DEMO-004',at:'2026-09-18T08:05:00Z',who:'SYSTEM',        what:'SYNC_ERROR',          resource:'API TAXIMETER',    source:'API',       old:'CONNECTED',  newVal:'SYNCING (erreurs:2)',    why:'Timeout API — synchronisation partielle'},
  {id:'AUD-P2-008',entId:'ENT-DEMO-001',at:'2026-04-28T10:00:00Z',who:'ENT-DEMO-001',  what:'PAYMENT_CONFIRMED',   resource:'PAY-DEMO-001',     source:'ENTERPRISE',old:null,         newVal:'PAID — VIR-2026-04-28', why:'Paiement TPS/TVQ Q1 confirmé'},
]

// ── ANALYTICS DATA ────────────────────────────────────────────
export const ANALYTICS_MONTHLY = [
  {month:'Jan 2026',gross:128_400,tps:r2(128_400*TPS),tvq:r2(128_400*TVQ),activities:1840,drivers:42},
  {month:'Fév 2026',gross:134_200,tps:r2(134_200*TPS),tvq:r2(134_200*TVQ),activities:1920,drivers:44},
  {month:'Mar 2026',gross:142_600,tps:r2(142_600*TPS),tvq:r2(142_600*TVQ),activities:2040,drivers:47},
  {month:'Avr 2026',gross:156_800,tps:r2(156_800*TPS),tvq:r2(156_800*TVQ),activities:2240,drivers:52},
  {month:'Mai 2026',gross:168_400,tps:r2(168_400*TPS),tvq:r2(168_400*TVQ),activities:2410,drivers:56},
  {month:'Juin 2026',gross:181_200,tps:r2(181_200*TPS),tvq:r2(181_200*TVQ),activities:2590,drivers:61},
  {month:'Juil 2026',gross:194_600,tps:r2(194_600*TPS),tvq:r2(194_600*TVQ),activities:2780,drivers:66},
  {month:'Août 2026',gross:208_400,tps:r2(208_400*TPS),tvq:r2(208_400*TVQ),activities:2980,drivers:71},
  {month:'Sep 2026',gross:214_800,tps:r2(214_800*TPS),tvq:r2(214_800*TVQ),activities:3082,drivers:74},
]

// ── CONF STATUS ───────────────────────────────────────────────
export const DECL_STATUS: Record<string,{label:string;color:string;bg:string}> = {
  DRAFT:    {label:'Brouillon',  color:'#64748B', bg:'rgba(100,116,139,0.10)'},
  PREPARED: {label:'Préparée',   color:'#003DA5', bg:'rgba(0,61,165,0.10)'},
  SUBMITTED:{label:'Soumise',    color:'#7C3AED', bg:'rgba(124,58,237,0.12)'},
  RECEIVED: {label:'Reçue',      color:'#B45309', bg:'rgba(180,83,9,0.10)'},
  ACCEPTED: {label:'Acceptée',   color:'#059669', bg:'rgba(5,150,105,0.12)'},
  CORRECTED:{label:'Corrigée',   color:'#DC2626', bg:'rgba(220,38,38,0.10)'},
  MISSING:  {label:'Manquante',  color:'#DC2626', bg:'rgba(220,38,38,0.10)'},
}
export const PAY_STATUS: Record<string,{label:string;color:string;bg:string}> = {
  PAID:     {label:'Payé',       color:'#059669', bg:'rgba(5,150,105,0.12)'},
  UPCOMING: {label:'À venir',    color:'#003DA5', bg:'rgba(0,61,165,0.10)'},
  OVERDUE:  {label:'En retard',  color:'#DC2626', bg:'rgba(220,38,38,0.10)'},
  PARTIAL:  {label:'Partiel',    color:'#B45309', bg:'rgba(180,83,9,0.10)'},
}
export const RECON_STATUS: Record<string,{label:string;color:string;bg:string;icon:string}> = {
  MATCHED:  {label:'Équilibré',  color:'#059669', bg:'rgba(5,150,105,0.12)', icon:'✅'},
  VARIANCE: {label:'Variance',   color:'#B45309', bg:'rgba(180,83,9,0.10)', icon:'⚠️'},
  MISSING:  {label:'Manquant',   color:'#DC2626', bg:'rgba(220,38,38,0.10)',icon:'❌'},
  PARTIAL:  {label:'Partiel',    color:'#7C3AED', bg:'rgba(124,58,237,0.12)',icon:'🔸'},
}
export const COMP_STATUS: Record<string,{label:string;color:string;bg:string;icon:string}> = {
  COMPLIANT:       {label:'Conforme',           color:'#059669', bg:'rgba(5,150,105,0.12)', icon:'🟢'},
  ATTENTION:       {label:'Attention',           color:'#B45309', bg:'rgba(180,83,9,0.10)', icon:'🟡'},
  ACTION_REQUIRED: {label:'Intervention requise',color:'#DC2626', bg:'rgba(220,38,38,0.10)',icon:'🔴'},
}
export const CONN_STATUS: Record<string,{label:string;color:string;dot:string}> = {
  CONNECTED:    {label:'Connecté',      color:'#059669',dot:'bg-green-500'},
  SYNCING:      {label:'En sync',       color:'#B45309',dot:'bg-amber-400 animate-pulse'},
  ERROR:        {label:'Erreur',        color:'#DC2626',dot:'bg-red-500'},
  DISCONNECTED: {label:'Non connecté',  color:'#64748B',dot:'bg-slate-400'},
  PLANNED:      {label:'Planifié',      color:'#7C3AED',dot:'bg-purple-400'},
}
export const INT_SEV: Record<string,{color:string;bg:string}> = {
  CRITICAL:{color:'#DC2626',bg:'rgba(220,38,38,0.10)'},
  HIGH:    {color:'#B45309',bg:'rgba(180,83,9,0.10)'},
  MEDIUM:  {color:'#003DA5',bg:'rgba(0,61,165,0.10)'},
  INFO:    {color:'#059669',bg:'rgba(5,150,105,0.08)'},
}
export const ACT_TYPE_ICONS: Record<string,string> = {
  TAXI:'🚕',RIDESHARE:'🚗',DELIVERY:'📦',PARCEL:'📬',LOGISTICS:'🚚',COURIER:'✉️',TRANSPORT:'🚌',
}
