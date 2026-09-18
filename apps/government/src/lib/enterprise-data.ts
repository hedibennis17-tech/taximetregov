// TAXIMETER.GOV — Enterprise Center — Données pilotes
// PILOTE · DONNÉES SYNTHÉTIQUES · AUCUNE CONNEXION GOUVERNEMENTALE RÉELLE
export const PILOT = 'PILOTE · DONNÉES SYNTHÉTIQUES · AUCUNE CONNEXION GOUVERNEMENTALE RÉELLE'
export const money = (n:number) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(n)
export const money2 = (n:number) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(n)
export const fmtDt = (s:string) => new Intl.DateTimeFormat('fr-CA',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(s))
export const fmtDate = (s:string) => new Intl.DateTimeFormat('fr-CA',{year:'numeric',month:'short',day:'numeric'}).format(new Date(s))
const r2 = (n:number) => Math.round(n*100)/100
const TPS=0.05; const TVQ=0.09975

// ── 8 ENTREPRISES DEMO ────────────────────────────────────────
export const ENTERPRISES = [
  {
    id:'ENT-DEMO-001', legalName:'Taxi Métro Montréal Inc.',       tradeName:'Taxi Métro',
    neq:'1234567890', taxId:'TPS-123456-7',  sector:'TAXI',      type:'CORPORATION',
    status:'ACTIVE',  verif:'VERIFIED',       connection:'CONNECTED',
    compliance:98,    alerts:0,
    jurisdiction:'QC', country:'CA', address:'1200 boul. Saint-Laurent',
    city:'Montréal', province:'QC', postal:'H2X 2S5', phone:'(514) 555-0201',
    email:'admin@taximétro.demo', website:'www.taximétro.demo',
    registered:'2026-01-15', lastSync:'2026-09-18T10:32:00Z',
    drivers:12, vehicles:12, activities:4820, transactions:4820,
    grossQ3:412_800, tpsQ3:r2(412_800*TPS), tvqQ3:r2(412_800*TVQ),
    repr:'Robert Simard',
  },
  {
    id:'ENT-DEMO-002', legalName:'Coopérative Taxi Laval DEMO',    tradeName:'Coop Taxi Laval',
    neq:'2345678901', taxId:'TPS-234567-8',  sector:'TAXI',      type:'COOPERATIVE',
    status:'ACTIVE',  verif:'VERIFIED',       connection:'CONNECTED',
    compliance:95,    alerts:1,
    jurisdiction:'QC', country:'CA', address:'450 rue des Laurentides',
    city:'Laval', province:'QC', postal:'H7G 2T8', phone:'(450) 555-0202',
    email:'admin@cooptaxilaval.demo', website:'www.cooptaxilaval.demo',
    registered:'2026-02-01', lastSync:'2026-09-18T09:15:00Z',
    drivers:8, vehicles:8, activities:2640, transactions:2640,
    grossQ3:228_400, tpsQ3:r2(228_400*TPS), tvqQ3:r2(228_400*TVQ),
    repr:'Pierre Gagnon',
  },
  {
    id:'ENT-DEMO-003', legalName:'Livraison Express Montréal DEMO', tradeName:'LEM Express',
    neq:'3456789012', taxId:'TPS-345678-9',  sector:'DELIVERY',  type:'CORPORATION',
    status:'ACTIVE',  verif:'VERIFIED',       connection:'CONNECTED',
    compliance:92,    alerts:2,
    jurisdiction:'QC', country:'CA', address:'2800 rue Sherbrooke Est',
    city:'Montréal', province:'QC', postal:'H2K 1H3', phone:'(514) 555-0203',
    email:'ops@lemexpress.demo', website:'www.lemexpress.demo',
    registered:'2026-01-20', lastSync:'2026-09-18T10:29:00Z',
    drivers:24, vehicles:24, activities:8400, transactions:8400,
    grossQ3:378_000, tpsQ3:r2(378_000*TPS), tvqQ3:r2(378_000*TVQ),
    repr:'Caroline Morin',
  },
  {
    id:'ENT-DEMO-004', legalName:'Colis Rapide QC DEMO Inc.',       tradeName:'Colis Rapide',
    neq:'4567890123', taxId:'TPS-456789-0',  sector:'DELIVERY',  type:'CORPORATION',
    status:'ACTIVE',  verif:'VERIFIED',       connection:'SYNCING',
    compliance:88,    alerts:3,
    jurisdiction:'QC', country:'CA', address:'550 boul. Industriel',
    city:'Longueuil', province:'QC', postal:'J4G 1A1', phone:'(450) 555-0204',
    email:'admin@colisrapide.demo', website:'www.colisrapide.demo',
    registered:'2026-03-01', lastSync:'2026-09-18T08:00:00Z',
    drivers:18, vehicles:18, activities:6200, transactions:6200,
    grossQ3:279_000, tpsQ3:r2(279_000*TPS), tvqQ3:r2(279_000*TVQ),
    repr:'François Beaumont',
  },
  {
    id:'ENT-DEMO-005', legalName:'Transport Pro Logistique QC DEMO',tradeName:'TransPro QC',
    neq:'5678901234', taxId:'TPS-567890-1',  sector:'LOGISTICS', type:'CORPORATION',
    status:'ACTIVE',  verif:'VERIFIED',       connection:'CONNECTED',
    compliance:96,    alerts:0,
    jurisdiction:'QC', country:'CA', address:'1100 rue des Transporteurs',
    city:'Québec City', province:'QC', postal:'G1M 2N4', phone:'(418) 555-0205',
    email:'info@transproquc.demo', website:'www.transproquc.demo',
    registered:'2026-02-15', lastSync:'2026-09-18T09:45:00Z',
    drivers:18, vehicles:18, activities:3840, transactions:3840,
    grossQ3:346_200, tpsQ3:r2(346_200*TPS), tvqQ3:r2(346_200*TVQ),
    repr:'Sylvie Hébert',
  },
  {
    id:'ENT-DEMO-006', legalName:'MoBroker Transport DEMO Inc.',     tradeName:'MoBroker',
    neq:'6789012345', taxId:'TPS-678901-2',  sector:'BROKER',    type:'CORPORATION',
    status:'ACTIVE',  verif:'UNDER_REVIEW',   connection:'CONNECTED',
    compliance:80,    alerts:4,
    jurisdiction:'QC', country:'CA', address:'300 rue Peel',
    city:'Montréal', province:'QC', postal:'H3C 2G7', phone:'(514) 555-0206',
    email:'admin@mobroker.demo', website:'www.mobroker.demo',
    registered:'2026-04-01', lastSync:'2026-09-17T18:00:00Z',
    drivers:6, vehicles:6, activities:1480, transactions:1480,
    grossQ3:133_200, tpsQ3:r2(133_200*TPS), tvqQ3:r2(133_200*TVQ),
    repr:'Kevin Ouellet',
  },
  {
    id:'ENT-DEMO-007', legalName:'Pièces Auto Livraison QC DEMO',   tradeName:'AutoPièces QC',
    neq:'7890123456', taxId:'TPS-789012-3',  sector:'AUTO_PARTS', type:'CORPORATION',
    status:'PENDING', verif:'PENDING',        connection:'DISCONNECTED',
    compliance:60,    alerts:5,
    jurisdiction:'QC', country:'CA', address:'4200 boul. Métropolitain',
    city:'Montréal', province:'QC', postal:'H1S 1A8', phone:'(514) 555-0207',
    email:'admin@autopiecesqc.demo', website:'www.autopiecesqc.demo',
    registered:'2026-08-01', lastSync:null,
    drivers:4, vehicles:4, activities:0, transactions:0,
    grossQ3:0, tpsQ3:0, tvqQ3:0,
    repr:'Marc Desrochers',
  },
  {
    id:'ENT-DEMO-008', legalName:'Messagerie Urbaine MTL DEMO',      tradeName:'MessageMTL',
    neq:'8901234567', taxId:'TPS-890123-4',  sector:'COURIER',   type:'PARTNERSHIP',
    status:'ACTIVE',  verif:'VERIFIED',       connection:'ERROR',
    compliance:85,    alerts:3,
    jurisdiction:'QC', country:'CA', address:'800 rue Wellington',
    city:'Montréal', province:'QC', postal:'H3C 1T9', phone:'(514) 555-0208',
    email:'ops@messagemtl.demo', website:'www.messagemtl.demo',
    registered:'2026-03-15', lastSync:'2026-09-17T22:00:00Z',
    drivers:10, vehicles:10, activities:3200, transactions:3200,
    grossQ3:144_000, tpsQ3:r2(144_000*TPS), tvqQ3:r2(144_000*TVQ),
    repr:'Annie Cloutier',
  },
]

// ── REPRÉSENTANTS ─────────────────────────────────────────────
export const REPRESENTATIVES: Record<string, Array<{name:string;role:string;email:string;phone:string;status:string}>> = {
  'ENT-DEMO-001':[ {name:'Robert Simard',   role:'OWNER',        email:'r.simard@taximétro.demo',    phone:'(514) 555-0221', status:'ACTIVE'}, {name:'Louise Côté',    role:'FISCAL_REP',   email:'l.cote@taximétro.demo',      phone:'(514) 555-0222', status:'ACTIVE'} ],
  'ENT-DEMO-002':[ {name:'Pierre Gagnon',   role:'OWNER',        email:'p.gagnon@cooptaxi.demo',     phone:'(450) 555-0231', status:'ACTIVE'}, {name:'Danielle Roy',   role:'COMPLIANCE',   email:'d.roy@cooptaxi.demo',         phone:'(450) 555-0232', status:'ACTIVE'} ],
  'ENT-DEMO-003':[ {name:'Caroline Morin',  role:'OWNER',        email:'c.morin@lemexpress.demo',    phone:'(514) 555-0241', status:'ACTIVE'}, {name:'Jean Pelletier', role:'OPERATIONS',   email:'j.pelletier@lemexpress.demo', phone:'(514) 555-0242', status:'ACTIVE'} ],
  'ENT-DEMO-004':[ {name:'François Beaumont',role:'OWNER',       email:'f.beaumont@colisrapide.demo',phone:'(450) 555-0251', status:'ACTIVE'} ],
  'ENT-DEMO-005':[ {name:'Sylvie Hébert',   role:'OWNER',        email:'s.hebert@transproquc.demo',  phone:'(418) 555-0261', status:'ACTIVE'}, {name:'Alain Blouin',   role:'FISCAL_REP',   email:'a.blouin@transproquc.demo',   phone:'(418) 555-0262', status:'ACTIVE'} ],
  'ENT-DEMO-006':[ {name:'Kevin Ouellet',   role:'OWNER',        email:'k.ouellet@mobroker.demo',    phone:'(514) 555-0271', status:'ACTIVE'} ],
  'ENT-DEMO-007':[ {name:'Marc Desrochers', role:'OWNER',        email:'m.desrochers@autopiecesqc.demo',phone:'(514) 555-0281', status:'ACTIVE'} ],
  'ENT-DEMO-008':[ {name:'Annie Cloutier',  role:'OWNER',        email:'a.cloutier@messagemtl.demo', phone:'(514) 555-0291', status:'ACTIVE'}, {name:'Tom Nguyen',    role:'OPERATIONS',   email:'t.nguyen@messagemtl.demo',    phone:'(514) 555-0292', status:'ACTIVE'} ],
}

// ── DOCUMENTS ENTREPRISE ──────────────────────────────────────
export const ENT_DOCS: Record<string, Array<{id:string;type:string;label:string;number:string;issued:string;expires:string|null;status:string;note:string|null}>> = {
  'ENT-DEMO-001':[ {id:'EDOC-001',type:'NEQ',     label:'Numéro entreprise QC',   number:'1234567890', issued:'2024-01-01',expires:null,       status:'APPROVED', note:null}, {id:'EDOC-002',type:'LICENSE',  label:'Permis taxi - CTQ',      number:'LIC-TAXI-CTQ-001', issued:'2025-01-15',expires:'2027-01-15', status:'APPROVED', note:null}, {id:'EDOC-003',type:'INSURANCE',label:'Assurance commerciale',   number:'INS-COM-001', issued:'2026-01-15',expires:'2027-01-15', status:'APPROVED', note:null} ],
  'ENT-DEMO-002':[ {id:'EDOC-010',type:'NEQ',     label:'Numéro entreprise QC',   number:'2345678901', issued:'2024-02-01',expires:null,       status:'APPROVED', note:null}, {id:'EDOC-011',type:'LICENSE',  label:'Permis coopérative taxi', number:'LIC-COOP-001',     issued:'2025-02-01',expires:'2027-02-01', status:'APPROVED', note:null} ],
  'ENT-DEMO-003':[ {id:'EDOC-020',type:'NEQ',     label:'Numéro entreprise QC',   number:'3456789012', issued:'2024-01-20',expires:null,       status:'APPROVED', note:null}, {id:'EDOC-021',type:'DELIVERY_PERMIT',label:'Permis livraison',  number:'PERM-DEL-003',     issued:'2025-01-20',expires:'2027-01-20', status:'APPROVED', note:null}, {id:'EDOC-022',type:'INSURANCE',label:'Assurance commerciale',   number:'INS-COM-003', issued:'2026-01-20',expires:'2027-01-20', status:'APPROVED', note:null} ],
  'ENT-DEMO-007':[ {id:'EDOC-060',type:'NEQ',     label:'Numéro entreprise QC',   number:'7890123456', issued:'2026-08-01',expires:null,       status:'UNDER_REVIEW',note:'En cours de vérification'}, {id:'EDOC-061',type:'LICENSE',label:'Permis exploitation',      number:'PERM-EXP-007',     issued:'2026-08-01',expires:'2028-08-01', status:'PENDING',  note:'En attente approbation CTQ'} ],
}

// ── OBLIGATIONS FISCALES ──────────────────────────────────────
export const ENT_OBLIGATIONS: Record<string, Array<{id:string;type:string;period:string;due:string;amount:number;status:string;filed:string|null;paid:string|null}>> = {
  'ENT-DEMO-001':[ {id:'OBL-001-Q1',type:'TPS/TVQ',period:'Q1 2026',due:'2026-04-30',amount:r2(412_800*0.33*(TPS+TVQ)),status:'PAID',      filed:'2026-04-25', paid:'2026-04-28'}, {id:'OBL-001-Q2',type:'TPS/TVQ',period:'Q2 2026',due:'2026-07-31',amount:r2(412_800*0.35*(TPS+TVQ)),status:'PAID',      filed:'2026-07-28', paid:'2026-07-30'}, {id:'OBL-001-Q3',type:'TPS/TVQ',period:'Q3 2026',due:'2026-10-31',amount:r2(412_800*0.32*(TPS+TVQ)),status:'UPCOMING',  filed:null,          paid:null} ],
  'ENT-DEMO-002':[ {id:'OBL-002-Q1',type:'TPS/TVQ',period:'Q1 2026',due:'2026-04-30',amount:r2(228_400*0.33*(TPS+TVQ)),status:'PAID',      filed:'2026-04-26', paid:'2026-04-29'}, {id:'OBL-002-Q3',type:'TPS/TVQ',period:'Q3 2026',due:'2026-10-31',amount:r2(228_400*0.32*(TPS+TVQ)),status:'UPCOMING',  filed:null,          paid:null} ],
  'ENT-DEMO-006':[ {id:'OBL-006-Q2',type:'TPS/TVQ',period:'Q2 2026',due:'2026-07-31',amount:r2(133_200*0.35*(TPS+TVQ)),status:'OVERDUE',   filed:null,          paid:null}, {id:'OBL-006-Q3',type:'TPS/TVQ',period:'Q3 2026',due:'2026-10-31',amount:r2(133_200*0.32*(TPS+TVQ)),status:'UPCOMING',  filed:null,          paid:null} ],
}

// ── CONNEXIONS API ────────────────────────────────────────────
export const ENT_CONNECTIONS: Record<string, Array<{provider:string;method:string;status:string;lastSync:string|null;scopes:string[];errors:number;health:number}>> = {
  'ENT-DEMO-001':[ {provider:'API TAXIMETER.GOV',method:'OAuth',  status:'CONNECTED',   lastSync:'2026-09-18T10:32:00Z', scopes:['read:trips','write:ledger','read:tax'],         errors:0,health:100}, {provider:'TAXI MTR DEMO',      method:'Webhook',status:'CONNECTED',   lastSync:'2026-09-18T09:00:00Z', scopes:['trips','payments'],                           errors:0,health:99} ],
  'ENT-DEMO-003':[ {provider:'API TAXIMETER.GOV',method:'OAuth',  status:'CONNECTED',   lastSync:'2026-09-18T10:29:00Z', scopes:['read:deliveries','write:ledger','read:tax'],    errors:0,health:100}, {provider:'DOORDASH DEMO',       method:'Webhook',status:'CONNECTED',   lastSync:'2026-09-18T10:00:00Z', scopes:['deliveries','tips'],                          errors:0,health:98} ],
  'ENT-DEMO-004':[ {provider:'API TAXIMETER.GOV',method:'OAuth',  status:'SYNCING',     lastSync:'2026-09-18T08:00:00Z', scopes:['read:deliveries'],                             errors:2,health:82} ],
  'ENT-DEMO-008':[ {provider:'API TAXIMETER.GOV',method:'Webhook',status:'ERROR',        lastSync:'2026-09-17T22:00:00Z', scopes:['trips','payments'],                           errors:5,health:40} ],
  'ENT-DEMO-007':[ {provider:'—',                method:'—',       status:'DISCONNECTED',lastSync:null,                   scopes:[],                                              errors:0,health:0} ],
}

// ── WEBHOOKS ──────────────────────────────────────────────────
export const ENT_WEBHOOKS: Array<{id:string;entId:string;provider:string;event:string;at:string;status:string;attempts:number;response:string|null;error:string|null}> = [
  {id:'WH-ENT-001',entId:'ENT-DEMO-001',provider:'TAXI MTR DEMO',   event:'trip.completed',       at:'2026-09-18T10:32:00Z',status:'PROCESSED',attempts:1,response:'200 OK',  error:null},
  {id:'WH-ENT-002',entId:'ENT-DEMO-001',provider:'TAXI MTR DEMO',   event:'payment.created',      at:'2026-09-18T10:32:05Z',status:'PROCESSED',attempts:1,response:'200 OK',  error:null},
  {id:'WH-ENT-003',entId:'ENT-DEMO-003',provider:'DOORDASH DEMO',   event:'transaction.created',  at:'2026-09-18T10:29:00Z',status:'PROCESSED',attempts:1,response:'200 OK',  error:null},
  {id:'WH-ENT-004',entId:'ENT-DEMO-004',provider:'API TAXIMETER',   event:'transaction.created',  at:'2026-09-18T08:05:00Z',status:'FAILED',   attempts:3,response:null,      error:'Connection timeout'},
  {id:'WH-ENT-005',entId:'ENT-DEMO-008',provider:'MESSAGEMTL DEMO', event:'trip.completed',       at:'2026-09-17T22:00:00Z',status:'FAILED',   attempts:5,response:null,      error:'Auth token expired'},
  {id:'WH-ENT-006',entId:'ENT-DEMO-002',provider:'API TAXIMETER',   event:'driver.updated',       at:'2026-09-17T18:00:00Z',status:'PROCESSED',attempts:1,response:'200 OK',  error:null},
]

// ── ALERTES ENTREPRISE ────────────────────────────────────────
export const ENT_ALERTS: Array<{id:string;entId:string;type:string;priority:string;title:string;desc:string;at:string;status:string}> = [
  {id:'EA-001',entId:'ENT-DEMO-002',type:'DOCUMENT',    priority:'MEDIUM',  title:'Permis expirant bientôt',    desc:'LIC-COOP-001 expire dans 90 jours.',                    at:'2026-09-17T10:00:00Z',status:'NEW'},
  {id:'EA-002',entId:'ENT-DEMO-003',type:'COMPLIANCE',  priority:'MEDIUM',  title:'2 chauffeurs en révision',   desc:'DRV-QC-0008 et un autre — dossiers à compléter.',      at:'2026-09-17T09:00:00Z',status:'NEW'},
  {id:'EA-003',entId:'ENT-DEMO-004',type:'WEBHOOK',     priority:'HIGH',    title:'Webhook en erreur',          desc:'Connection timeout — 3 tentatives échouées.',           at:'2026-09-18T08:05:00Z',status:'IN_PROGRESS'},
  {id:'EA-004',entId:'ENT-DEMO-004',type:'SYNC',        priority:'HIGH',    title:'Synchronisation interrompue',desc:'Données manquantes depuis 2026-09-17.',                at:'2026-09-18T06:00:00Z',status:'IN_PROGRESS'},
  {id:'EA-005',entId:'ENT-DEMO-004',type:'TRANSACTION', priority:'MEDIUM',  title:'Transactions en attente',    desc:'12 transactions non confirmées depuis 24h.',           at:'2026-09-17T22:00:00Z',status:'NEW'},
  {id:'EA-006',entId:'ENT-DEMO-006',type:'FISCAL',      priority:'CRITICAL',title:'Obligation fiscale en retard',desc:'TPS/TVQ Q2 2026 non déclarée — échéance 2026-07-31.',at:'2026-09-01T08:00:00Z',status:'IN_PROGRESS'},
  {id:'EA-007',entId:'ENT-DEMO-006',type:'COMPLIANCE',  priority:'HIGH',    title:'Dossier en révision',        desc:'Vérification identité représentant — en cours.',       at:'2026-09-10T09:00:00Z',status:'IN_PROGRESS'},
  {id:'EA-008',entId:'ENT-DEMO-006',type:'RECONCILIATION',priority:'HIGH',  title:'Écart réconciliation',       desc:'Différence 340$ entre source API et Revenue Ledger.',  at:'2026-09-15T14:00:00Z',status:'NEW'},
  {id:'EA-009',entId:'ENT-DEMO-006',type:'WEBHOOK',     priority:'MEDIUM',  title:'API credentials expirées',   desc:'Renouvellement credentials requis avant 2026-09-30.',  at:'2026-09-16T08:00:00Z',status:'NEW'},
  {id:'EA-010',entId:'ENT-DEMO-007',type:'DOCUMENT',    priority:'HIGH',    title:'Documents incomplets',       desc:'NEQ en révision — permis exploitation en attente.',    at:'2026-09-17T10:00:00Z',status:'NEW'},
  {id:'EA-011',entId:'ENT-DEMO-007',type:'COMPLIANCE',  priority:'CRITICAL',title:'Activation en attente',      desc:'Dossier incomplet — activation suspendue.',             at:'2026-09-17T10:00:00Z',status:'NEW'},
  {id:'EA-012',entId:'ENT-DEMO-007',type:'FISCAL',      priority:'MEDIUM',  title:'Pas de déclaration',         desc:'Aucune activité — aucune obligation pour l\'instant.', at:'2026-09-17T10:00:00Z',status:'INFO'},
  {id:'EA-013',entId:'ENT-DEMO-008',type:'WEBHOOK',     priority:'CRITICAL',title:'Webhook en erreur (5x)',     desc:'Auth token expiré — 5 tentatives échouées.',           at:'2026-09-17T22:00:00Z',status:'IN_PROGRESS'},
  {id:'EA-014',entId:'ENT-DEMO-008',type:'COMPLIANCE',  priority:'HIGH',    title:'Écart transactionnel',       desc:'2 activités sans transaction correspondante.',         at:'2026-09-16T15:00:00Z',status:'NEW'},
  {id:'EA-015',entId:'ENT-DEMO-008',type:'SYNC',        priority:'HIGH',    title:'Sync partielle',             desc:'340$ de transactions non synchronisées.',              at:'2026-09-17T20:00:00Z',status:'NEW'},
]

// ── TRANSACTIONS ENTREPRISE ───────────────────────────────────
export const ENT_TRANSACTIONS: Array<{id:string;entId:string;actId:string;driverId:string;provider:string;gross:number;fees:number;tip:number;tps:number;tvq:number;driverAmt:number;entAmt:number;status:string;source:string;at:string}> = [
  {id:'TX-ENT-001',entId:'ENT-DEMO-001',actId:'ACT-ENT-001',driverId:'DRV-QC-0001',provider:'TAXI MTR DEMO', gross:42.50,fees:4.25, tip:5.00,tps:r2(42.50*TPS),tvq:r2(42.50*TVQ),driverAmt:r2(42.50*0.80),entAmt:r2(42.50*0.20),status:'COMPLETED',source:'TAXIMETER',   at:'2026-09-18T10:32:00Z'},
  {id:'TX-ENT-002',entId:'ENT-DEMO-001',actId:'ACT-ENT-002',driverId:'DRV-QC-0001',provider:'TAXI MTR DEMO', gross:28.75,fees:2.88, tip:3.00,tps:r2(28.75*TPS),tvq:r2(28.75*TVQ),driverAmt:r2(28.75*0.80),entAmt:r2(28.75*0.20),status:'COMPLETED',source:'TAXIMETER',   at:'2026-09-18T09:15:00Z'},
  {id:'TX-ENT-003',entId:'ENT-DEMO-002',actId:'ACT-ENT-003',driverId:'DRV-QC-0002',provider:'COOP DEMO',     gross:55.00,fees:5.50, tip:7.00,tps:r2(55.00*TPS),tvq:r2(55.00*TVQ),driverAmt:r2(55.00*0.85),entAmt:r2(55.00*0.15),status:'COMPLETED',source:'WEBHOOK',     at:'2026-09-18T08:45:00Z'},
  {id:'TX-ENT-004',entId:'ENT-DEMO-003',actId:'ACT-ENT-004',driverId:'DRV-QC-0003',provider:'DOORDASH DEMO', gross:24.50,fees:3.68, tip:2.50,tps:r2(24.50*TPS),tvq:r2(24.50*TVQ),driverAmt:r2(24.50*0.75),entAmt:r2(24.50*0.25),status:'COMPLETED',source:'WEBHOOK',     at:'2026-09-18T10:00:00Z'},
  {id:'TX-ENT-005',entId:'ENT-DEMO-003',actId:'ACT-ENT-005',driverId:'DRV-QC-0003',provider:'DOORDASH DEMO', gross:31.00,fees:4.65, tip:0,   tps:r2(31.00*TPS),tvq:r2(31.00*TVQ),driverAmt:r2(31.00*0.75),entAmt:r2(31.00*0.25),status:'COMPLETED',source:'WEBHOOK',     at:'2026-09-18T09:30:00Z'},
  {id:'TX-ENT-006',entId:'ENT-DEMO-004',actId:'ACT-ENT-006',driverId:'DRV-QC-0003',provider:'API TAXIMETER', gross:38.00,fees:5.70, tip:4.00,tps:r2(38.00*TPS),tvq:r2(38.00*TVQ),driverAmt:r2(38.00*0.75),entAmt:r2(38.00*0.25),status:'PENDING',  source:'IMPORT',      at:'2026-09-18T08:00:00Z'},
  {id:'TX-ENT-007',entId:'ENT-DEMO-008',actId:'ACT-ENT-007',driverId:'DRV-QC-0006',provider:'MTL DEMO',      gross:50.00,fees:7.50, tip:5.00,tps:r2(50.00*TPS),tvq:r2(50.00*TVQ),driverAmt:r2(50.00*0.80),entAmt:r2(50.00*0.20),status:'ERROR',    source:'WEBHOOK',     at:'2026-09-17T22:00:00Z'},
]

// ── RÉCONCILIATION ────────────────────────────────────────────
export const ENT_RECON: Array<{id:string;entId:string;txId:string;sourceAmt:number;ledgerAmt:number;diff:number;status:string;note:string|null}> = [
  {id:'REC-ENT-001',entId:'ENT-DEMO-001',txId:'TX-ENT-001',sourceAmt:42.50,ledgerAmt:42.50,diff:0,    status:'MATCHED',  note:null},
  {id:'REC-ENT-002',entId:'ENT-DEMO-004',txId:'TX-ENT-006',sourceAmt:38.00,ledgerAmt:24.50,diff:13.50,status:'DISCREPANCY',note:'Montant source vs ledger: différence 13,50$'},
  {id:'REC-ENT-003',entId:'ENT-DEMO-006',txId:'—',          sourceAmt:340.00,ledgerAmt:0,   diff:340, status:'DISCREPANCY',note:'Source API: 340$ — Revenue Ledger: 0$'},
  {id:'REC-ENT-004',entId:'ENT-DEMO-008',txId:'TX-ENT-007',sourceAmt:50.00,ledgerAmt:0,    diff:50,   status:'DISCREPANCY',note:'Webhook échoué — transaction non enregistrée'},
]

// ── AUDIT ENTREPRISE ──────────────────────────────────────────
export const ENT_AUDIT: Array<{id:string;entId:string;at:string;who:string;what:string;resource:string;old:string|null;newVal:string|null;why:string}> = [
  {id:'EAUD-001',entId:'ENT-DEMO-001',at:'2026-09-18T10:32:00Z',who:'SYSTEM',       what:'SYNC_COMPLETED',       resource:'Revenue Ledger',         old:null,        newVal:'4820 activités',   why:'Synchronisation automatique'},
  {id:'EAUD-002',entId:'ENT-DEMO-002',at:'2026-09-17T18:00:00Z',who:'Admin GOV-01', what:'DOCUMENT_APPROVED',    resource:'LIC-COOP-001',           old:'PENDING',   newVal:'APPROVED',         why:'Vérification licences complète'},
  {id:'EAUD-003',entId:'ENT-DEMO-006',at:'2026-09-15T14:00:00Z',who:'SYSTEM',       what:'RECONCILIATION_ALERT', resource:'Revenue Ledger',         old:'0$',        newVal:'340$ écart',       why:'Différence source API vs ledger'},
  {id:'EAUD-004',entId:'ENT-DEMO-007',at:'2026-09-17T10:00:00Z',who:'Admin GOV-02', what:'ENTERPRISE_REVIEW',    resource:'ENT-DEMO-007',           old:'PENDING',   newVal:'UNDER_REVIEW',     why:'Documents soumis — vérification déclenchée'},
  {id:'EAUD-005',entId:'ENT-DEMO-008',at:'2026-09-17T22:00:00Z',who:'SYSTEM',       what:'WEBHOOK_FAILURE',      resource:'WH-ENT-005',             old:'PENDING',   newVal:'FAILED (5x)',      why:'Auth token expiré — retry épuisé'},
]

// ── CONF UI ───────────────────────────────────────────────────
export const SECTOR_CONF: Record<string,{label:string;icon:string;color:string}> = {
  TAXI:      {label:'Taxi',           icon:'🚕', color:'#003DA5'},
  DELIVERY:  {label:'Livraison',      icon:'📦', color:'#059669'},
  LOGISTICS: {label:'Logistique',     icon:'🚚', color:'#B45309'},
  BROKER:    {label:'Courtier',       icon:'🤝', color:'#7C3AED'},
  AUTO_PARTS:{label:'Pièces auto',    icon:'🔧', color:'#DC2626'},
  COURIER:   {label:'Messagerie',     icon:'✉️',  color:'#64748B'},
  TRANSPORT: {label:'Transport',      icon:'🚌', color:'#003DA5'},
  PLATFORM:  {label:'Plateforme',     icon:'🔌', color:'#7C3AED'},
}
export const STATUS_CONF: Record<string,{label:string;color:string;bg:string}> = {
  ACTIVE:      {label:'Actif',         color:'#059669', bg:'rgba(5,150,105,0.12)'},
  PENDING:     {label:'En attente',    color:'#B45309', bg:'rgba(180,83,9,0.10)'},
  SUSPENDED:   {label:'Suspendu',      color:'#DC2626', bg:'rgba(220,38,38,0.10)'},
  INACTIVE:    {label:'Inactif',       color:'#64748B', bg:'rgba(100,116,139,0.10)'},
}
export const VERIF_CONF: Record<string,{label:string;color:string}> = {
  VERIFIED:     {label:'Vérifié',      color:'text-green-600 dark:text-green-400'},
  PENDING:      {label:'En attente',   color:'text-amber-600 dark:text-amber-400'},
  UNDER_REVIEW: {label:'En révision',  color:'text-blue-600 dark:text-blue-400'},
  REJECTED:     {label:'Rejeté',       color:'text-red-600 dark:text-red-400'},
}
export const CONN_CONF: Record<string,{label:string;color:string;dot:string}> = {
  CONNECTED:    {label:'Connecté',     color:'#059669', dot:'bg-green-500'},
  SYNCING:      {label:'En sync',      color:'#B45309', dot:'bg-amber-400 animate-pulse'},
  ERROR:        {label:'Erreur',       color:'#DC2626', dot:'bg-red-500'},
  DISCONNECTED: {label:'Non connecté', color:'#64748B', dot:'bg-slate-400'},
  PENDING:      {label:'En attente',   color:'#003DA5', dot:'bg-blue-400'},
}
export const OBL_STATUS: Record<string,{label:string;color:string;bg:string}> = {
  PAID:     {label:'Payée',       color:'#059669', bg:'rgba(5,150,105,0.12)'},
  UPCOMING: {label:'À venir',     color:'#003DA5', bg:'rgba(0,61,165,0.10)'},
  OVERDUE:  {label:'En retard',   color:'#DC2626', bg:'rgba(220,38,38,0.10)'},
  SUBMITTED:{label:'Soumise',     color:'#7C3AED', bg:'rgba(124,58,237,0.12)'},
  DUE:      {label:'Due',         color:'#B45309', bg:'rgba(180,83,9,0.10)'},
}
export const ALERT_PRIORITY: Record<string,{color:string;bg:string}> = {
  CRITICAL:{color:'#DC2626',bg:'rgba(220,38,38,0.12)'},
  HIGH:    {color:'#B45309', bg:'rgba(180,83,9,0.10)'},
  MEDIUM:  {color:'#003DA5', bg:'rgba(0,61,165,0.10)'},
  INFO:    {color:'#64748B', bg:'rgba(100,116,139,0.08)'},
}
export const REPR_ROLES: Record<string,{label:string;color:string}> = {
  OWNER:        {label:'Propriétaire',        color:'#003DA5'},
  ADMIN:        {label:'Administrateur',       color:'#003DA5'},
  FISCAL_REP:   {label:'Représentant fiscal', color:'#7C3AED'},
  COMPLIANCE:   {label:'Conformité',          color:'#059669'},
  OPERATIONS:   {label:'Opérations',          color:'#B45309'},
  VIEWER:       {label:'Lecteur',             color:'#64748B'},
}
