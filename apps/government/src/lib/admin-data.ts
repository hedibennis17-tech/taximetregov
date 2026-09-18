// TAXIMETER.GOV — Données Administration
// PILOTE · DONNÉES SYNTHÉTIQUES · AUCUNE CONNEXION GOUVERNEMENTALE RÉELLE
export const PILOT = 'PILOTE · DONNÉES SYNTHÉTIQUES · AUCUNE CONNEXION GOUVERNEMENTALE RÉELLE'
export const fmtDt = (s:string) => new Intl.DateTimeFormat('fr-CA',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(s))

export const USERS = [
  {id:'USR-DEMO-001',name:'Alexandre Dubois',   org:'Admin Gov',          role:'SUPER_ADMIN',    email:'a.dubois.demo@taximetregov.qc',    status:'ACTIVE',  lastLogin:'2026-09-18T08:02:00Z', createdAt:'2026-01-01', perms:['ALL']},
  {id:'USR-DEMO-002',name:'Marie-Claude Fortin',org:'Admin Gov',          role:'ADMIN',          email:'mc.fortin.demo@taximetregov.qc',   status:'ACTIVE',  lastLogin:'2026-09-18T08:15:00Z', createdAt:'2026-01-15', perms:['READ','WRITE','APPROVE']},
  {id:'USR-DEMO-003',name:'Philippe Bergeron',  org:'Admin Gov',          role:'ANALYST',        email:'p.bergeron.demo@taximetregov.qc',  status:'ACTIVE',  lastLogin:'2026-09-18T09:00:00Z', createdAt:'2026-02-01', perms:['READ','ANALYZE']},
  {id:'USR-DEMO-004',name:'Sophie Archambault', org:'Admin Gov',          role:'AUDITOR',        email:'s.archambault.demo@taximetregov.qc',status:'ACTIVE', lastLogin:'2026-09-18T09:30:00Z', createdAt:'2026-02-15', perms:['READ','AUDIT']},
  {id:'USR-DEMO-005',name:'Jean-François Roy',  org:'Admin Gov',          role:'COMPLIANCE',     email:'jf.roy.demo@taximetregov.qc',      status:'ACTIVE',  lastLogin:'2026-09-17T14:00:00Z', createdAt:'2026-03-01', perms:['READ','COMPLIANCE']},
  {id:'USR-DEMO-006',name:'Nathalie Caron',     org:'Admin Gov',          role:'TAX_OFFICER',    email:'n.caron.demo@taximetregov.qc',     status:'ACTIVE',  lastLogin:'2026-09-17T10:00:00Z', createdAt:'2026-03-15', perms:['READ','TAX']},
  {id:'USR-DEMO-007',name:'Marc Tanguay',       org:'Admin Gov',          role:'OPERATIONS',     email:'m.tanguay.demo@taximetregov.qc',   status:'ACTIVE',  lastLogin:'2026-09-18T07:00:00Z', createdAt:'2026-04-01', perms:['READ','OPERATIONS']},
  {id:'USR-DEMO-008',name:'Isabelle Pelletier', org:'Admin Gov',          role:'SECURITY',       email:'i.pelletier.demo@taximetregov.qc', status:'ACTIVE',  lastLogin:'2026-09-18T08:30:00Z', createdAt:'2026-04-15', perms:['READ','SECURITY']},
  {id:'USR-DEMO-009',name:'Robert Simard',      org:'Taxi DEMO Corp',     role:'ENTERPRISE',     email:'r.simard.demo@taxidemo.qc',        status:'ACTIVE',  lastLogin:'2026-09-18T07:30:00Z', createdAt:'2026-05-01', perms:['ORG_READ','ORG_WRITE']},
  {id:'USR-DEMO-010',name:'Caroline Morin',     org:'Livraison DEMO Inc', role:'ENTERPRISE',     email:'c.morin.demo@livraisondemo.qc',    status:'ACTIVE',  lastLogin:'2026-09-17T16:00:00Z', createdAt:'2026-05-15', perms:['ORG_READ','ORG_WRITE']},
  {id:'USR-DEMO-011',name:'David Lefebvre',     org:'Driver Gov',         role:'DRIVER',         email:'jean.tremblay.demo@taximetregov.qc',status:'ACTIVE', lastLogin:'2026-09-18T06:00:00Z', createdAt:'2026-06-01', perms:['DRIVER_READ']},
  {id:'USR-DEMO-012',name:'Fatima El-Mansouri', org:'Admin Gov',          role:'ANALYST',        email:'f.elmansouri.demo@taximetregov.qc', status:'PENDING',lastLogin:null, createdAt:'2026-09-10', perms:['READ']},
  {id:'USR-DEMO-013',name:'Pierre Gagnon',      org:'Coop Taxi DEMO',     role:'ENTERPRISE',     email:'p.gagnon.demo@cooptaxidemo.qc',    status:'INACTIVE',lastLogin:'2026-08-01T10:00:00Z', createdAt:'2026-06-15', perms:['ORG_READ']},
  {id:'USR-DEMO-014',name:'Annie Tremblay',     org:'Admin Gov',          role:'COMPLIANCE',     email:'a.tremblay.demo@taximetregov.qc',  status:'ACTIVE',  lastLogin:'2026-09-16T09:00:00Z', createdAt:'2026-07-01', perms:['READ','COMPLIANCE']},
  {id:'USR-DEMO-015',name:'Kevin Bouchard',     org:'Driver Gov',         role:'DRIVER',         email:'marc.leblanc.demo@taximetregov.qc', status:'SUSPENDED',lastLogin:'2026-07-15T08:00:00Z', createdAt:'2026-07-10', perms:[]},
]

export const ORGANIZATIONS = [
  {id:'ORG-GOV-001',      name:'Gouvernement QC — Pilote',   type:'GOVERNMENT',    jurisdiction:'Québec', status:'ACTIVE',  users:8,  vehicles:0,  activities:0,     connections:0,  lastSync:'2026-09-18T10:38:00Z', note:'Organisation administrative pilote'},
  {id:'ORG-TAXI-DEMO-001',name:'Taxi Montréal DEMO Corp',    type:'TAXI',          jurisdiction:'Québec', status:'ACTIVE',  users:2,  vehicles:12, activities:1842,  connections:1,  lastSync:'2026-09-18T10:32:00Z', note:'Entreprise taxi synthétique'},
  {id:'ORG-TAXI-DEMO-002',name:'Coop Taxi Laval DEMO',       type:'COOPERATIVE',   jurisdiction:'Québec', status:'ACTIVE',  users:1,  vehicles:8,  activities:982,   connections:1,  lastSync:'2026-09-18T09:15:00Z', note:'Coopérative taxi synthétique'},
  {id:'ORG-DEL-DEMO-001', name:'Livraison Express DEMO Inc', type:'DELIVERY',      jurisdiction:'Québec', status:'ACTIVE',  users:2,  vehicles:24, activities:3280,  connections:2,  lastSync:'2026-09-18T10:29:00Z', note:'Entreprise livraison synthétique'},
  {id:'ORG-LOG-DEMO-001', name:'Logistique QC DEMO Ltée',    type:'LOGISTICS',     jurisdiction:'Québec', status:'PENDING', users:1,  vehicles:6,  activities:0,     connections:0,  lastSync:null, note:'En cours d\'activation'},
  {id:'ORG-PLT-DEMO-001', name:'Plateforme DEMO — Ride',     type:'PLATFORM',      jurisdiction:'Québec', status:'ACTIVE',  users:0,  vehicles:0,  activities:28400, connections:3,  lastSync:'2026-09-18T10:35:00Z', note:'Connexion webhook SIMULATION'},
  {id:'ORG-ENT-DEMO-001', name:'Transport Pro DEMO SA',      type:'ENTERPRISE',    jurisdiction:'Québec', status:'ACTIVE',  users:1,  vehicles:18, activities:2140,  connections:1,  lastSync:'2026-09-18T09:45:00Z', note:'Entreprise transport synthétique'},
  {id:'ORG-PLT-DEMO-002', name:'Delivery Hub DEMO',          type:'PLATFORM',      jurisdiction:'Québec', status:'INACTIVE',users:0,  vehicles:0,  activities:0,     connections:0,  lastSync:null, note:'Inactive — intégration en cours'},
  {id:'ORG-PROF-DEMO-001',name:'Chauffeurs Indépendants QC', type:'PROFESSIONAL',  jurisdiction:'Québec', status:'ACTIVE',  users:5,  vehicles:5,  activities:840,   connections:0,  lastSync:'2026-09-17T18:00:00Z', note:'Travailleurs autonomes pilote'},
  {id:'ORG-TAXI-DEMO-003',name:'Taxi Rive-Sud DEMO',         type:'TAXI',          jurisdiction:'Québec', status:'ACTIVE',  users:1,  vehicles:6,  activities:640,   connections:1,  lastSync:'2026-09-17T20:00:00Z', note:'Entreprise taxi Rive-Sud'},
]

export const SERVICES = [
  {name:'Authentication',  status:'ONLINE',  resp:28,  errors:0, warnings:2, lastCheck:'2026-09-18T10:38:00Z'},
  {name:'Database (DEMO)', status:'ONLINE',  resp:18,  errors:0, warnings:0, lastCheck:'2026-09-18T10:38:00Z'},
  {name:'API Gateway',     status:'ONLINE',  resp:42,  errors:0, warnings:0, lastCheck:'2026-09-18T10:38:00Z'},
  {name:'Webhook Service', status:'ONLINE',  resp:68,  errors:0, warnings:1, lastCheck:'2026-09-18T10:37:00Z'},
  {name:'Tax Engine',      status:'ONLINE',  resp:51,  errors:0, warnings:0, lastCheck:'2026-09-18T10:37:00Z'},
  {name:'Revenue Ledger',  status:'ONLINE',  resp:38,  errors:0, warnings:0, lastCheck:'2026-09-18T10:38:00Z'},
  {name:'Reconciliation',  status:'ONLINE',  resp:73,  errors:0, warnings:0, lastCheck:'2026-09-18T10:36:00Z'},
  {name:'Audit Service',   status:'ONLINE',  resp:39,  errors:0, warnings:0, lastCheck:'2026-09-18T10:38:00Z'},
  {name:'Reports Engine',  status:'ONLINE',  resp:84,  errors:0, warnings:0, lastCheck:'2026-09-18T10:35:00Z'},
  {name:'Notifications',   status:'ONLINE',  resp:32,  errors:0, warnings:0, lastCheck:'2026-09-18T10:38:00Z'},
  {name:'Compliance Svc',  status:'ONLINE',  resp:56,  errors:0, warnings:0, lastCheck:'2026-09-18T10:37:00Z'},
  {name:'Storage (DEMO)',  status:'DEGRADED',resp:142, errors:0, warnings:1, lastCheck:'2026-09-18T10:38:00Z'},
]

export const SETTINGS_FISCAL = [
  {jurisdiction:'Québec', taxType:'TPS',   rate:'5,000%',    effective:'2024-01-01', status:'ACTIVE'},
  {jurisdiction:'Québec', taxType:'TVQ',   rate:'9,975%',    effective:'2024-01-01', status:'ACTIVE'},
  {jurisdiction:'Ontario',taxType:'HST',   rate:'13,000%',   effective:'2024-01-01', status:'DEMO'},
  {jurisdiction:'Canada', taxType:'GST',   rate:'5,000%',    effective:'2024-01-01', status:'DEMO'},
]

export const DATA_STATS = {
  drivers:9847, vehicles:9847, organizations:10, activities:614350,
  transactions:228420, taxRecords:18, auditEvents:3820, documents:47, ledgerEntries:84200,
}

export const USER_STATUS: Record<string,{label:string;color:string;bg:string}> = {
  ACTIVE:   {label:'Actif',      color:'#059669',bg:'rgba(5,150,105,0.12)'},
  INACTIVE: {label:'Inactif',    color:'#64748B',bg:'rgba(100,116,139,0.10)'},
  PENDING:  {label:'En attente', color:'#B45309', bg:'rgba(180,83,9,0.10)'},
  SUSPENDED:{label:'Suspendu',   color:'#DC2626', bg:'rgba(220,38,38,0.10)'},
  REVOKED:  {label:'Révoqué',    color:'#DC2626', bg:'rgba(220,38,38,0.10)'},
}
export const ROLE_CONF: Record<string,{label:string;color:string}> = {
  SUPER_ADMIN:{label:'Super Admin',      color:'#DC2626'},
  ADMIN:      {label:'Admin Gov',         color:'#003DA5'},
  ANALYST:    {label:'Analyste',          color:'#7C3AED'},
  AUDITOR:    {label:'Auditeur',          color:'#059669'},
  COMPLIANCE: {label:'Conformité',        color:'#B45309'},
  TAX_OFFICER:{label:'Officier fiscal',   color:'#7C3AED'},
  OPERATIONS: {label:'Opérations',        color:'#003DA5'},
  SECURITY:   {label:'Sécurité',          color:'#DC2626'},
  ENTERPRISE: {label:'Entreprise',        color:'#B45309'},
  DRIVER:     {label:'Chauffeur',         color:'#64748B'},
}
export const ORG_TYPE_CONF: Record<string,{label:string;icon:string;color:string}> = {
  GOVERNMENT:   {label:'Gouvernement',  icon:'🏛️', color:'#003DA5'},
  TAXI:         {label:'Taxi',          icon:'🚕', color:'#003DA5'},
  COOPERATIVE:  {label:'Coopérative',   icon:'🤝', color:'#059669'},
  DELIVERY:     {label:'Livraison',     icon:'📦', color:'#059669'},
  LOGISTICS:    {label:'Logistique',    icon:'🚚', color:'#B45309'},
  PLATFORM:     {label:'Plateforme',    icon:'🔌', color:'#7C3AED'},
  ENTERPRISE:   {label:'Entreprise',    icon:'🏢', color:'#003DA5'},
  PROFESSIONAL: {label:'Professionnel', icon:'👤', color:'#64748B'},
}
export const ORG_STATUS: Record<string,{label:string;color:string;bg:string}> = {
  ACTIVE:  {label:'Actif',      color:'#059669',bg:'rgba(5,150,105,0.12)'},
  PENDING: {label:'En attente', color:'#B45309', bg:'rgba(180,83,9,0.10)'},
  INACTIVE:{label:'Inactif',    color:'#64748B',bg:'rgba(100,116,139,0.10)'},
  REVOKED: {label:'Révoqué',    color:'#DC2626', bg:'rgba(220,38,38,0.10)'},
}
