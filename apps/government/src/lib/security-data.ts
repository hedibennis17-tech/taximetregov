// TAXIMETER.GOV — Données Sécurité & Gouvernance
// PILOTE · DONNÉES SYNTHÉTIQUES · AUCUNE INFRASTRUCTURE GOUVERNEMENTALE RÉELLE
export const PILOT = 'PILOTE · DONNÉES SYNTHÉTIQUES · AUCUNE INFRASTRUCTURE GOUVERNEMENTALE RÉELLE'
export const fmtDt = (s: string) => new Intl.DateTimeFormat('fr-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(s))

export const SECURITY_EVENTS = [
  { id:'SEC-001', at:'2026-09-18T10:38:00Z', user:'ADMIN-DEMO-001', org:'Admin Gov',       event:'Connexion réussie',                     cat:'AUTH',   sev:'INFO',     status:'COMPLETED' },
  { id:'SEC-002', at:'2026-09-18T10:02:00Z', user:'ADMIN-DEMO-003', org:'Admin Gov',       event:'Permission modifiée — niveau analyste',  cat:'AUTHZ',  sev:'WARNING',  status:'REVIEWED'  },
  { id:'SEC-003', at:'2026-09-18T09:37:00Z', user:'DRV-DEMO-014',   org:'Driver Gov',      event:'Tentative auth échouée',                 cat:'AUTH',   sev:'WARNING',  status:'INVESTIGATING'},
  { id:'SEC-004', at:'2026-09-18T09:15:00Z', user:'ENT-DEMO-002',   org:'Enterprise DEMO', event:'Credentials API renouvelées',            cat:'API',    sev:'INFO',     status:'COMPLETED' },
  { id:'SEC-005', at:'2026-09-18T08:55:00Z', user:'DRV-DEMO-008',   org:'Driver Gov',      event:'Connexion depuis nouveau périphérique',  cat:'SESSION',sev:'INFO',     status:'COMPLETED' },
  { id:'SEC-006', at:'2026-09-18T08:42:00Z', user:'ADMIN-DEMO-001', org:'Admin Gov',       event:'Connexion réussie',                      cat:'AUTH',   sev:'INFO',     status:'COMPLETED' },
  { id:'SEC-007', at:'2026-09-17T22:10:00Z', user:'SYSTEM',         org:'TAXIMETER.GOV',   event:'Rotation certificat SSL (DEMO)',         cat:'INFRA',  sev:'INFO',     status:'COMPLETED' },
  { id:'SEC-008', at:'2026-09-17T18:30:00Z', user:'ENT-DEMO-005',   org:'Enterprise DEMO', event:'Session expirée — token révoqué',        cat:'SESSION',sev:'INFO',     status:'COMPLETED' },
  { id:'SEC-009', at:'2026-09-17T15:20:00Z', user:'DRV-DEMO-003',   org:'Driver Gov',      event:'MDP modifié',                            cat:'AUTH',   sev:'INFO',     status:'COMPLETED' },
  { id:'SEC-010', at:'2026-09-17T14:05:00Z', user:'ADMIN-DEMO-002', org:'Admin Gov',       event:'Rapport exporté — trace audit',          cat:'AUDIT',  sev:'INFO',     status:'COMPLETED' },
  { id:'SEC-011', at:'2026-09-17T12:00:00Z', user:'SYSTEM',         org:'TAXIMETER.GOV',   event:'Vérification intégrité base DEMO',       cat:'INTEGRITY',sev:'INFO',   status:'COMPLETED' },
  { id:'SEC-012', at:'2026-09-17T10:30:00Z', user:'ENT-DEMO-003',   org:'Enterprise DEMO', event:'Connexion API plateforme autorisée',     cat:'API',    sev:'INFO',     status:'COMPLETED' },
  { id:'SEC-013', at:'2026-09-16T16:45:00Z', user:'DRV-DEMO-007',   org:'Driver Gov',      event:'Compte suspendu — conformité',           cat:'COMPLIANCE',sev:'WARNING',status:'REVIEWED' },
  { id:'SEC-014', at:'2026-09-16T09:00:00Z', user:'SUPER-ADMIN',    org:'Admin Gov',       event:'Accès audit global — session sécurisée', cat:'AUDIT',  sev:'INFO',     status:'COMPLETED' },
  { id:'SEC-015', at:'2026-09-15T11:00:00Z', user:'SYSTEM',         org:'TAXIMETER.GOV',   event:'Backup données chiffré (DEMO)',          cat:'INFRA',  sev:'INFO',     status:'COMPLETED' },
]

export const SESSIONS = [
  { id:'SES-DEMO-001', user:'SUPER-ADMIN',    org:'Admin Gov',       role:'SUPER_ADMIN',  loginAt:'2026-09-18T08:02:00Z', lastAt:'2026-09-18T10:38:00Z', device:'Desktop', location:'Québec City', status:'ACTIVE'  },
  { id:'SES-DEMO-002', user:'ADMIN-DEMO-001', org:'Admin Gov',       role:'ADMIN',        loginAt:'2026-09-18T08:15:00Z', lastAt:'2026-09-18T10:35:00Z', device:'Desktop', location:'Montréal',    status:'ACTIVE'  },
  { id:'SES-DEMO-003', user:'ADMIN-DEMO-002', org:'Admin Gov',       role:'ANALYST',      loginAt:'2026-09-18T09:00:00Z', lastAt:'2026-09-18T10:20:00Z', device:'Desktop', location:'Montréal',    status:'ACTIVE'  },
  { id:'SES-DEMO-004', user:'ENT-DEMO-002',   org:'Livraison DEMO',  role:'ENTERPRISE',   loginAt:'2026-09-18T09:14:00Z', lastAt:'2026-09-18T10:29:00Z', device:'Desktop', location:'Montréal',    status:'ACTIVE'  },
  { id:'SES-DEMO-005', user:'DRV-DEMO-001',   org:'Driver Gov',      role:'DRIVER',       loginAt:'2026-09-18T07:30:00Z', lastAt:'2026-09-18T08:41:00Z', device:'Mobile',  location:'Montréal',    status:'ACTIVE'  },
  { id:'SES-DEMO-006', user:'DRV-DEMO-002',   org:'Driver Gov',      role:'DRIVER',       loginAt:'2026-09-18T09:00:00Z', lastAt:'2026-09-18T10:15:00Z', device:'Mobile',  location:'Laval',       status:'ACTIVE'  },
  { id:'SES-DEMO-007', user:'DRV-DEMO-003',   org:'Driver Gov',      role:'DRIVER',       loginAt:'2026-09-18T06:00:00Z', lastAt:'2026-09-18T09:45:00Z', device:'Mobile',  location:'Montréal',    status:'ACTIVE'  },
  { id:'SES-DEMO-008', user:'AUDIT-DEMO-001', org:'Admin Gov',       role:'AUDITOR',      loginAt:'2026-09-18T09:30:00Z', lastAt:'2026-09-18T10:00:00Z', device:'Desktop', location:'Québec City', status:'ACTIVE'  },
  { id:'SES-DEMO-009', user:'ENT-DEMO-005',   org:'Taxi DEMO',       role:'ENTERPRISE',   loginAt:'2026-09-18T07:00:00Z', lastAt:'2026-09-18T09:30:00Z', device:'Desktop', location:'Montréal',    status:'EXPIRED' },
  { id:'SES-DEMO-010', user:'DRV-DEMO-007',   org:'Driver Gov',      role:'DRIVER',       loginAt:'2026-09-17T22:00:00Z', lastAt:'2026-09-17T22:15:00Z', device:'Mobile',  location:'Montréal',    status:'REVOKED' },
]

export const SERVICES_STATUS = [
  { name:'API Gateway',       status:'ONLINE',  resp:42,  events:1284, alerts:0, lastCheck:'2026-09-18T10:38:00Z' },
  { name:'Webhook Engine',    status:'ONLINE',  resp:68,  events:842,  alerts:1, lastCheck:'2026-09-18T10:38:00Z' },
  { name:'Fiscal Engine',     status:'ONLINE',  resp:51,  events:394,  alerts:0, lastCheck:'2026-09-18T10:37:00Z' },
  { name:'Revenue Ledger',    status:'ONLINE',  resp:38,  events:2140, alerts:0, lastCheck:'2026-09-18T10:38:00Z' },
  { name:'Reconciliation',    status:'ONLINE',  resp:73,  events:156,  alerts:0, lastCheck:'2026-09-18T10:36:00Z' },
  { name:'Audit Service',     status:'ONLINE',  resp:39,  events:3820, alerts:0, lastCheck:'2026-09-18T10:38:00Z' },
  { name:'Auth Service',      status:'ONLINE',  resp:28,  events:284,  alerts:2, lastCheck:'2026-09-18T10:38:00Z' },
  { name:'Database (DEMO)',   status:'ONLINE',  resp:18,  events:9840, alerts:0, lastCheck:'2026-09-18T10:38:00Z' },
]

export const GOV_DECISIONS = [
  { id:'GOV-DEMO-001', subject:'Intégration données plateformes',        org:'Pilote QC',   authority:'Admin Gov', status:'UNDER_REVIEW',  createdAt:'2026-09-10', note:'Cadre légal en cours d\'analyse' },
  { id:'GOV-DEMO-002', subject:'Validation documentaire chauffeurs',     org:'Pilote QC',   authority:'Admin Gov', status:'APPROVED',      createdAt:'2026-08-15', note:'Processus validé pour le pilote' },
  { id:'GOV-DEMO-003', subject:'Réconciliation données fiscales',        org:'Pilote QC',   authority:'Admin Gov', status:'PENDING',       createdAt:'2026-09-15', note:'En attente approbation finale' },
  { id:'GOV-DEMO-004', subject:'Connexion Enterprise API — DEMO',        org:'Pilote QC',   authority:'Admin Gov', status:'APPROVED',      createdAt:'2026-08-01', note:'Approuvé pour phase pilote uniquement' },
  { id:'GOV-DEMO-005', subject:'Extension module livraison',             org:'Pilote QC',   authority:'Admin Gov', status:'PROPOSED',      createdAt:'2026-09-17', note:'Proposition soumise — révision requise' },
  { id:'GOV-DEMO-006', subject:'Partage données Revenu QC (DEMO)',       org:'Pilote QC',   authority:'Admin Gov', status:'PENDING',       createdAt:'2026-09-16', note:'Autorisation légale requise — non active' },
  { id:'GOV-DEMO-007', subject:'Audit trimestriel pilote Q3',            org:'Pilote QC',   authority:'Admin Gov', status:'IN_PROGRESS',   createdAt:'2026-09-01', note:'En cours' },
  { id:'GOV-DEMO-008', subject:'Politique rétention données DEMO',       org:'Pilote QC',   authority:'Admin Gov', status:'APPROVED',      createdAt:'2026-07-01', note:'90 jours données pilotes synthétiques' },
]

export const REG_ACTIONS = [
  { id:'REG-DEMO-001', type:'REVIEW',        subject:'Dossier chauffeur incomplet',    driver:'DRV-QC-0004', status:'IN_PROGRESS', note:'Vérification documents en attente' },
  { id:'REG-DEMO-002', type:'CORRECTION',    subject:'Document assurance expiré',      driver:'DRV-QC-0007', status:'RESOLVED',    note:'Compte suspendu — assurance requise' },
  { id:'REG-DEMO-003', type:'VERIFICATION',  subject:'Écart transactionnel DEMO',      driver:'DRV-QC-0001', status:'IN_PROGRESS', note:'Comparaison sources en cours' },
  { id:'REG-DEMO-004', type:'REVIEW',        subject:'Licence expirante — Patel',      driver:'DRV-QC-0006', status:'PENDING',     note:'Renouvellement demandé' },
  { id:'REG-DEMO-005', type:'REVIEW',        subject:'Révision dossier sous révision', driver:'DRV-QC-0008', status:'IN_PROGRESS', note:'Révision administrative en cours' },
  { id:'REG-DEMO-006', type:'COMPLIANCE',    subject:'Suspension confirmée',           driver:'DRV-QC-0007', status:'RESOLVED',    note:'Suspension maintenue — dossier fermé' },
]

export const PRIVACY_CATEGORIES = [
  { cat:'IDENTITÉ',       purpose:'Identification et authentification', access:'Utilisateur + Admin autorisé', retention:'Durée du pilote', sharing:'NON PARTAGÉ',  roles:['DRIVER','ADMIN'], status:'PILOTE' },
  { cat:'CHAUFFEUR',      purpose:'Gestion dossier professionnel',      access:'Admin autorisé + Chauffeur',   retention:'Durée du pilote', sharing:'CONTRÔLÉ',    roles:['DRIVER','ADMIN'], status:'PILOTE' },
  { cat:'VÉHICULE',       purpose:'Vérification conformité véhicule',   access:'Admin autorisé',               retention:'Durée du pilote', sharing:'CONTRÔLÉ',    roles:['ADMIN'],          status:'PILOTE' },
  { cat:'DOCUMENT',       purpose:'Validation documents professionnels',access:'Admin autorisé',               retention:'Durée du pilote', sharing:'NON PARTAGÉ',  roles:['ADMIN'],          status:'PILOTE' },
  { cat:'TRANSACTION',    purpose:'Réconciliation et rapport fiscal',    access:'Admin gov autorisé',           retention:'Durée du pilote', sharing:'CONTRÔLÉ',    roles:['ADMIN','AUDITOR'],status:'PILOTE' },
  { cat:'FISCAL (TPS/TVQ)',purpose:'Calcul et déclaration estimée DEMO',access:'Admin fiscal autorisé',        retention:'Durée du pilote', sharing:'SIMULATION',   roles:['ADMIN'],          status:'PILOTE' },
  { cat:'PLATEFORME',     purpose:'Données API fournisseurs (DEMO)',     access:'Admin technique',              retention:'Durée du pilote', sharing:'SIMULATION',   roles:['ADMIN'],          status:'PILOTE' },
  { cat:'AUDIT',          purpose:'Traçabilité et historique actions',   access:'Auditeur autorisé',           retention:'Durée du pilote', sharing:'CONTRÔLÉ',    roles:['AUDITOR','ADMIN'],status:'PILOTE' },
]

export const SEV_CONF: Record<string,{label:string;color:string;bg:string}> = {
  INFO:        {label:'INFO',     color:'#003DA5', bg:'rgba(0,61,165,0.10)'},
  WARNING:     {label:'AVERTISSEMENT', color:'#B45309', bg:'rgba(180,83,9,0.10)'},
  HIGH:        {label:'ÉLEVÉ',    color:'#DC2626', bg:'rgba(220,38,38,0.10)'},
  CRITICAL:    {label:'CRITIQUE', color:'#7C3AED', bg:'rgba(124,58,237,0.12)'},
}
export const SES_STATUS: Record<string,{label:string;color:string;bg:string}> = {
  ACTIVE:  {label:'Active',  color:'#059669', bg:'rgba(5,150,105,0.12)'},
  EXPIRED: {label:'Expirée', color:'#B45309', bg:'rgba(180,83,9,0.10)'},
  REVOKED: {label:'Révoquée',color:'#DC2626', bg:'rgba(220,38,38,0.10)'},
  FAILED:  {label:'Échouée', color:'#DC2626', bg:'rgba(220,38,38,0.10)'},
}
export const GOV_STATUS: Record<string,{label:string;color:string;bg:string}> = {
  APPROVED:    {label:'Approuvé',      color:'#059669', bg:'rgba(5,150,105,0.12)'},
  UNDER_REVIEW:{label:'En révision',   color:'#B45309', bg:'rgba(180,83,9,0.10)'},
  PENDING:     {label:'En attente',    color:'#003DA5', bg:'rgba(0,61,165,0.10)'},
  PROPOSED:    {label:'Proposé',       color:'#64748B', bg:'rgba(100,116,139,0.10)'},
  IN_PROGRESS: {label:'En cours',      color:'#7C3AED', bg:'rgba(124,58,237,0.12)'},
}
export const ROLE_COLORS: Record<string,string> = {
  SUPER_ADMIN:'#DC2626', ADMIN:'#003DA5', ANALYST:'#7C3AED',
  AUDITOR:'#059669',     ENTERPRISE:'#B45309', DRIVER:'#64748B',
}
