// TAXIMETER.GOV — Données Centre des opérations
// PILOTE · DONNÉES SYNTHÉTIQUES · AUCUNE DÉCISION GOUVERNEMENTALE RÉELLE
export const PILOT = 'PILOTE · DONNÉES SYNTHÉTIQUES · AUCUNE DÉCISION GOUVERNEMENTALE RÉELLE'
export const money = (n:number) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(n)
export const fmtDt = (s:string) => new Intl.DateTimeFormat('fr-CA',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(s))
export const fmtDay = (s:string) => new Intl.DateTimeFormat('fr-CA',{weekday:'short',month:'short',day:'numeric'}).format(new Date(s))

export const TASKS = [
  { id:'TASK-DEMO-001', title:'Vérifier document chauffeur — Nadia Patel',          type:'DOCUMENT',        source:'ALERT-DEMO-002', priority:'HIGH',    status:'IN_PROGRESS', assignee:'Admin GOV-02', driver:'Nadia Patel',    driverId:'drv-demo-006', createdAt:'2026-09-17T09:15:00Z', dueAt:'2026-09-24T17:00:00Z', note:'Permis de conduire expire dans 28 jours. Contacter le chauffeur.', relatedModule:'/drivers/drv-demo-006' },
  { id:'TASK-DEMO-002', title:'Analyser écart transactionnel TX-DEMO-1001',          type:'RECONCILIATION',  source:'CASE-DEMO-001',  priority:'HIGH',    status:'IN_PROGRESS', assignee:'Admin GOV-01', driver:'Jean Tremblay',  driverId:'drv-demo-001', createdAt:'2026-09-17T09:00:00Z', dueAt:'2026-09-18T17:00:00Z', note:'Écart 19$ entre Source A (50$) et Source B (31$). Vérification requise.', relatedModule:'/compliance/cases' },
  { id:'TASK-DEMO-003', title:'Réviser réconciliation SKIP — webhooks manquants',   type:'PLATFORM',        source:'ALERT-DEMO-005', priority:'MEDIUM',  status:'PENDING',     assignee:'Admin GOV-01', driver:null,             driverId:null,            createdAt:'2026-09-16T16:00:00Z', dueAt:'2026-09-20T17:00:00Z', note:'3 événements SKIP manquants — récupérer via import manuel.', relatedModule:'/platforms' },
  { id:'TASK-DEMO-004', title:'Vérifier TPS/TVQ — TX-DEMO-1009',                   type:'FISCAL',          source:'CASE-DEMO-003',  priority:'HIGH',    status:'DONE',        assignee:'Admin GOV-01', driver:'Karim Hassan',   driverId:'drv-demo-003', createdAt:'2026-09-16T14:30:00Z', dueAt:'2026-09-17T17:00:00Z', note:'Écart TPS 0,07$ — arrondi différent. Résolu.', relatedModule:'/tax/center' },
  { id:'TASK-DEMO-005', title:'Contrôler expiration assurance — Marc Leblanc',      type:'COMPLIANCE',      source:'ALERT-DEMO-010', priority:'CRITICAL', status:'DONE',       assignee:'Admin GOV-01', driver:'Marc Leblanc',   driverId:'drv-demo-007', createdAt:'2026-09-13T09:00:00Z', dueAt:'2026-09-13T17:00:00Z', note:'Assurance expirée — suspension confirmée.', relatedModule:'/drivers/drv-demo-007' },
  { id:'TASK-DEMO-006', title:'Examiner transaction dupliquée TX-DEMO-1002',        type:'TRANSACTION',     source:'ALERT-DEMO-003', priority:'MEDIUM',  status:'TODO',        assignee:'Admin GOV-02', driver:'Marie Gagnon',   driverId:'drv-demo-002', createdAt:'2026-09-17T09:22:00Z', dueAt:'2026-09-21T17:00:00Z', note:'Doublon potentiel — comparer avec déduplicateur.', relatedModule:'/transactions' },
  { id:'TASK-DEMO-007', title:'Vérifier connexion API plateforme UBER DEMO',        type:'PLATFORM',        source:'SYSTEM',         priority:'LOW',     status:'TODO',        assignee:'Admin GOV-01', driver:null,             driverId:null,            createdAt:'2026-09-17T08:00:00Z', dueAt:'2026-09-25T17:00:00Z', note:'Test de connectivité API Gateway — validation webhooks.', relatedModule:'/platforms/operations' },
  { id:'TASK-DEMO-008', title:'Valider rapport fiscal Q3 2026',                     type:'REPORT',          source:'RPT-GOV-F001',   priority:'HIGH',    status:'APPROVAL',    assignee:'SUPER_ADMIN',  driver:null,             driverId:null,            createdAt:'2026-09-17T07:00:00Z', dueAt:'2026-09-30T17:00:00Z', note:'Rapport Q3 prêt pour validation finale avant archivage.', relatedModule:'/reports/tax' },
  { id:'TASK-DEMO-009', title:'Examiner qualité données — transactions incomplètes',type:'DATA_QUALITY',    source:'DQ-DEMO-001',    priority:'MEDIUM',  status:'IN_PROGRESS', assignee:'Admin GOV-02', driver:null,             driverId:null,            createdAt:'2026-09-16T10:00:00Z', dueAt:'2026-09-22T17:00:00Z', note:'3 transactions sans activité liée — analyse requise.', relatedModule:'/operations/data-quality' },
  { id:'TASK-DEMO-010', title:'Préparer dossier approbation réconciliation Q3',    type:'APPROVAL',        source:'SYSTEM',         priority:'MEDIUM',  status:'TODO',        assignee:'Admin GOV-01', driver:null,             driverId:null,            createdAt:'2026-09-17T06:00:00Z', dueAt:'2026-09-28T17:00:00Z', note:'Dossier réconciliation Q3 à préparer pour validation.', relatedModule:'/reconciliation' },
]

export const APPROVALS = [
  { id:'APP-DEMO-001', obj:'Validation réconciliation Q3 — UBER DEMO', type:'RECONCILIATION', requester:'Admin GOV-01', assignee:'SUPER_ADMIN', amount:224_850_000, diff:2.50,  status:'PENDING',  priority:'HIGH',    createdAt:'2026-09-17T08:00:00Z', note:'Réconciliation Q3 UBER finalisée. 1 écart résiduel de 2,50$ expliqué.', relatedModule:'/reconciliation' },
  { id:'APP-DEMO-002', obj:'Approbation rapport fiscal Q3 2026',       type:'REPORT',         requester:'Admin GOV-01', assignee:'SUPER_ADMIN', amount:0,           diff:0,     status:'PENDING',  priority:'HIGH',    createdAt:'2026-09-17T07:00:00Z', note:'Rapport fiscal Q3 prêt — TPS 11,2M$ · TVQ 22,4M$ · Solde 33,7M$.', relatedModule:'/reports/tax' },
  { id:'APP-DEMO-003', obj:'Validation document assurance — Amira Tremblay', type:'DOCUMENT', requester:'Admin GOV-02', assignee:'Admin GOV-01', amount:0,          diff:0,     status:'RETURNED', priority:'MEDIUM',  createdAt:'2026-09-16T14:00:00Z', note:'Document renvoyé — version lisible requise.', relatedModule:'/drivers/drv-demo-008' },
  { id:'APP-DEMO-004', obj:'Fermeture dossier CASE-DEMO-003',          type:'COMPLIANCE',     requester:'Admin GOV-01', assignee:'SUPER_ADMIN', amount:0,           diff:0.07,  status:'APPROVED', priority:'MEDIUM',  createdAt:'2026-09-16T17:00:00Z', note:'Dossier TPS approuvé — écart arrondi confirmé normal.', relatedModule:'/compliance/cases' },
  { id:'APP-DEMO-005', obj:'Activation chauffeur Ali Bouchard',        type:'DRIVER',         requester:'Admin GOV-02', assignee:'Admin GOV-01', amount:0,           diff:0,     status:'PENDING',  priority:'LOW',     createdAt:'2026-09-15T10:00:00Z', note:'Dossier Ali Bouchard complet — attente activation services.', relatedModule:'/drivers/drv-demo-005' },
]

export const CALENDAR_EVENTS = [
  { id:'CAL-001', date:'2026-09-18', time:'09:00', title:'Vérification document — Nadia Patel',    type:'DOCUMENT',        source:'TASK-DEMO-001', color:'#003DA5' },
  { id:'CAL-002', date:'2026-09-18', time:'14:00', title:'Analyse écart TX-DEMO-1001',              type:'RECONCILIATION',  source:'TASK-DEMO-002', color:'#B45309' },
  { id:'CAL-003', date:'2026-09-19', time:'10:00', title:'Révision webhooks SKIP',                 type:'PLATFORM',        source:'TASK-DEMO-003', color:'#7C3AED' },
  { id:'CAL-004', date:'2026-09-20', time:'09:00', title:'Rapport fiscal Q3 — révision',           type:'REPORT',          source:'TASK-DEMO-008', color:'#059669' },
  { id:'CAL-005', date:'2026-09-22', time:'10:00', title:'Qualité données — rapport',              type:'DATA_QUALITY',    source:'TASK-DEMO-009', color:'#DC2626' },
  { id:'CAL-006', date:'2026-09-24', time:'17:00', title:'⚠ Échéance permis Nadia Patel',         type:'DEADLINE',        source:'ALERT-DEMO-002', color:'#DC2626' },
  { id:'CAL-007', date:'2026-09-25', time:'09:00', title:'Rapport fiscal programmé mensuel',       type:'REPORT',          source:'SCH-001',       color:'#059669' },
  { id:'CAL-008', date:'2026-09-28', time:'09:00', title:'Dossier réconciliation Q3',              type:'RECONCILIATION',  source:'TASK-DEMO-010', color:'#B45309' },
  { id:'CAL-009', date:'2026-09-30', time:'23:59', title:'⚠ Fin trimestre fiscal Q3',             type:'FISCAL',          source:'SYSTEM',        color:'#DC2626' },
  { id:'CAL-010', date:'2026-10-01', time:'00:00', title:'Ouverture période fiscale Q4',           type:'FISCAL',          source:'SYSTEM',        color:'#003DA5' },
]

export const DATA_QUALITY = [
  { id:'DQ-DEMO-001', check:'Transactions sans activité liée',         source:'Revenue Ledger',    type:'INTEGRITY',   count:3, priority:'MEDIUM',  status:'ANALYZING',  lastCheck:'2026-09-17T08:00:00Z', note:'3 TX sans ACT_ID. Vérifier import Lyft.', link:'/transactions' },
  { id:'DQ-DEMO-002', check:'Documents sans date d\'expiration',       source:'Documents',          type:'COMPLETENESS',count:2, priority:'HIGH',    status:'TODO',       lastCheck:'2026-09-17T08:00:00Z', note:'2 docs sans expires_at. Corriger manuellement.', link:'/documents' },
  { id:'DQ-DEMO-003', check:'Transactions potentiellement dupliquées', source:'Webhook Engine',     type:'DUPLICATE',   count:1, priority:'HIGH',    status:'ANALYZING',  lastCheck:'2026-09-17T09:22:00Z', note:'TX-DEMO-1002 — vérifier déduplicateur.', link:'/transactions' },
  { id:'DQ-DEMO-004', check:'TPS manquante ou zéro',                   source:'Revenue Ledger',    type:'FISCAL',      count:2, priority:'HIGH',    status:'RESOLVED',   lastCheck:'2026-09-16T14:30:00Z', note:'Corrigé — règle TPS appliquée.', link:'/tax/center' },
  { id:'DQ-DEMO-005', check:'TVQ incohérente avec taux configuré',     source:'Moteur fiscal',      type:'FISCAL',      count:1, priority:'HIGH',    status:'RESOLVED',   lastCheck:'2026-09-17T08:00:00Z', note:'Arrondi différent — documenté et accepté.', link:'/tax/center' },
  { id:'DQ-DEMO-006', check:'Chauffeurs sans véhicule associé',        source:'Driver Profiles',    type:'INTEGRITY',   count:2, priority:'MEDIUM',  status:'TODO',       lastCheck:'2026-09-17T07:00:00Z', note:'DRV-QC-0004 et DRV-QC-0005 — en attente dossier.', link:'/drivers' },
  { id:'DQ-DEMO-007', check:'Webhooks en erreur non traités',          source:'Webhook Engine',     type:'SYSTEM',      count:3, priority:'MEDIUM',  status:'TODO',       lastCheck:'2026-09-16T16:00:00Z', note:'3 webhooks SKIP en erreur — import requis.', link:'/webhooks/engine' },
  { id:'DQ-DEMO-008', check:'Activités sans pourboire enregistré',     source:'Activities',         type:'COMPLETENESS',count:8, priority:'LOW',     status:'TODO',       lastCheck:'2026-09-17T08:00:00Z', note:'8 activités taxi sans tip_amount. Normal si $0 — à valider.', link:'/transactions' },
]

export const TASK_STATUS: Record<string,{label:string;color:string;bg:string}> = {
  TODO:       {label:'À faire',      color:'#64748B',bg:'rgba(100,116,139,0.10)'},
  IN_PROGRESS:{label:'En cours',     color:'#003DA5', bg:'rgba(0,61,165,0.12)'},
  PENDING:    {label:'En attente',   color:'#B45309', bg:'rgba(180,83,9,0.10)'},
  APPROVAL:   {label:'À approuver',  color:'#7C3AED', bg:'rgba(124,58,237,0.12)'},
  DONE:       {label:'Terminée',     color:'#059669', bg:'rgba(5,150,105,0.12)'},
  CANCELLED:  {label:'Annulée',      color:'#DC2626', bg:'rgba(220,38,38,0.10)'},
}
export const APP_STATUS: Record<string,{label:string;color:string;bg:string}> = {
  PENDING:  {label:'En attente',         color:'#B45309', bg:'rgba(180,83,9,0.10)'},
  APPROVED: {label:'Approuvée',          color:'#059669', bg:'rgba(5,150,105,0.12)'},
  REJECTED: {label:'Rejetée',           color:'#DC2626', bg:'rgba(220,38,38,0.10)'},
  RETURNED: {label:'Retournée',         color:'#7C3AED', bg:'rgba(124,58,237,0.12)'},
}
export const DQ_STATUS: Record<string,{label:string;color:string;bg:string}> = {
  TODO:      {label:'À traiter', color:'#B45309', bg:'rgba(180,83,9,0.10)'},
  ANALYZING: {label:'En analyse',color:'#003DA5', bg:'rgba(0,61,165,0.10)'},
  RESOLVED:  {label:'Résolu',   color:'#059669', bg:'rgba(5,150,105,0.12)'},
}
export const PRIORITY_CONF: Record<string,{label:string;color:string}> = {
  CRITICAL:{label:'Critique', color:'#DC2626'},
  HIGH:    {label:'Élevée',  color:'#B45309'},
  MEDIUM:  {label:'Normale', color:'#003DA5'},
  LOW:     {label:'Faible',  color:'#64748B'},
}
export const TYPE_ICONS: Record<string,string> = {
  DOCUMENT:'📄',RECONCILIATION:'🔄',PLATFORM:'🌐',FISCAL:'🧾',COMPLIANCE:'⚖️',
  TRANSACTION:'💳',REPORT:'📊',DATA_QUALITY:'🧹',APPROVAL:'🔐',DRIVER:'👤',
  DEADLINE:'⏰',FISCAL_EVENT:'🏛️',SYSTEM:'⚙️',INTEGRITY:'🔗',COMPLETENESS:'📋',
  DUPLICATE:'🔄',
}
