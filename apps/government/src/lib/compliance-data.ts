// TAXIMETER.GOV — Données Centre de conformité
// PILOTE · DONNÉES SYNTHÉTIQUES · AUCUNE DÉCISION GOUVERNEMENTALE RÉELLE

export const PILOT = 'PILOTE · DONNÉES SYNTHÉTIQUES · AUCUNE DÉCISION GOUVERNEMENTALE RÉELLE'
export const money = (n: number) => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n)
export const fmtDt = (s: string) => new Intl.DateTimeFormat('fr-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(s))

export const ALERTS = [
  {
    id: 'ALERT-DEMO-001', date: '2026-09-17T08:41:00Z', type: 'RECONCILIATION',
    icon: '🔄', priority: 'HIGH', status: 'NEW',
    title: 'Écart transactionnel — source DEMO',
    desc: 'Différence détectée entre Source A (50,00$) et Source B (31,00$). Écart de 19,00$.',
    driver: 'Jean Tremblay', driverNum: 'DRV-QC-0001', driverId: 'drv-demo-001',
    txId: 'TX-DEMO-1001', amount: 19.00, source: 'UBER (DEMO)', caseId: 'CASE-DEMO-001',
  },
  {
    id: 'ALERT-DEMO-002', date: '2026-09-17T09:15:00Z', type: 'DOCUMENT',
    icon: '📄', priority: 'MEDIUM', status: 'IN_ANALYSIS',
    title: 'Document arrivant à expiration',
    desc: 'Permis de conduire de Nadia Patel expire dans 28 jours. Renouvellement requis.',
    driver: 'Nadia Patel', driverNum: 'DRV-QC-0006', driverId: 'drv-demo-006',
    txId: null, amount: 0, source: 'TAXIMETER.GOV', caseId: 'CASE-DEMO-002',
  },
  {
    id: 'ALERT-DEMO-003', date: '2026-09-17T09:22:00Z', type: 'TRANSACTION',
    icon: '💳', priority: 'MEDIUM', status: 'NEW',
    title: 'Transaction potentiellement dupliquée',
    desc: 'Deux événements identiques détectés pour TX-DEMO-1002. Vérification du déduplicateur requise.',
    driver: 'Marie Gagnon', driverNum: 'DRV-QC-0002', driverId: 'drv-demo-002',
    txId: 'TX-DEMO-1002', amount: 32.00, source: 'LYFT (DEMO)', caseId: null,
  },
  {
    id: 'ALERT-DEMO-004', date: '2026-09-16T14:30:00Z', type: 'FISCAL',
    icon: '🧾', priority: 'HIGH', status: 'IN_ANALYSIS',
    title: 'Écart TPS/TVQ entre sources',
    desc: 'TPS calculée: 1,62$ vs TPS source: 1,55$. Écart: 0,07$. Règle fiscale à vérifier.',
    driver: 'Karim Hassan', driverNum: 'DRV-QC-0003', driverId: 'drv-demo-003',
    txId: 'TX-DEMO-1009', amount: 0.07, source: 'DOORDASH (DEMO)', caseId: 'CASE-DEMO-003',
  },
  {
    id: 'ALERT-DEMO-005', date: '2026-09-16T16:00:00Z', type: 'PLATFORM',
    icon: '🌐', priority: 'LOW', status: 'RESOLVED',
    title: 'Transmission plateforme interrompue',
    desc: 'Interruption webhook SKIP de 22 min. 3 événements manquants récupérés via import.',
    driver: null, driverNum: null, driverId: null,
    txId: null, amount: 0, source: 'SKIP (DEMO)', caseId: null,
  },
  {
    id: 'ALERT-DEMO-006', date: '2026-09-15T11:20:00Z', type: 'CHAUFFEUR',
    icon: '👤', priority: 'CRITICAL', status: 'IN_ANALYSIS',
    title: 'Chauffeur suspendu — activité détectée',
    desc: 'Activité enregistrée pour DRV-QC-0007 alors que le dossier est SUSPENDU.',
    driver: 'Marc Leblanc', driverNum: 'DRV-QC-0007', driverId: 'drv-demo-007',
    txId: 'TX-DEMO-1015', amount: 28.50, source: 'TAXI (DEMO)', caseId: null,
  },
  {
    id: 'ALERT-DEMO-007', date: '2026-09-15T14:45:00Z', type: 'REVENUS',
    icon: '💰', priority: 'MEDIUM', status: 'FALSE_POSITIVE',
    title: 'Écart revenus — expliqué',
    desc: 'Différence de 12,00$ due à un code promo plateforme. Explication fournie et vérifiée.',
    driver: 'Marie Gagnon', driverNum: 'DRV-QC-0002', driverId: 'drv-demo-002',
    txId: 'TX-DEMO-1006', amount: 12.00, source: 'UBER (DEMO)', caseId: null,
  },
  {
    id: 'ALERT-DEMO-008', date: '2026-09-14T10:00:00Z', type: 'LICENCE',
    icon: '🧾', priority: 'MEDIUM', status: 'RESOLVED',
    title: 'Licence livraison expirée — Marie Gagnon',
    desc: 'Permis livraison LIC-DEL-QC-0002 expiré depuis 2025-04-01. Renouvellement confirmé.',
    driver: 'Marie Gagnon', driverNum: 'DRV-QC-0002', driverId: 'drv-demo-002',
    txId: null, amount: 0, source: 'TAXIMETER.GOV', caseId: null,
  },
  {
    id: 'ALERT-DEMO-009', date: '2026-09-14T15:30:00Z', type: 'POURBOIRES',
    icon: '🎁', priority: 'LOW', status: 'NEW',
    title: 'Pourboire élevé — vérification recommandée',
    desc: 'Pourboire 45% détecté sur TX-DEMO-1011. Valeur inhabituelle pour ce service.',
    driver: 'Jean Tremblay', driverNum: 'DRV-QC-0001', driverId: 'drv-demo-001',
    txId: 'TX-DEMO-1011', amount: 17.25, source: 'TAXI (DEMO)', caseId: null,
  },
  {
    id: 'ALERT-DEMO-010', date: '2026-09-13T09:00:00Z', type: 'VEHICULE',
    icon: '🚗', priority: 'HIGH', status: 'RESOLVED',
    title: 'Assurance expirée — Marc Leblanc',
    desc: 'Assurance DEMO-INS-007 expirée le 2026-03-01. Véhicule suspendu. Dossier traité.',
    driver: 'Marc Leblanc', driverNum: 'DRV-QC-0007', driverId: 'drv-demo-007',
    txId: null, amount: 0, source: 'TAXIMETER.GOV', caseId: null,
  },
]

export const CASES = [
  {
    id: 'CASE-DEMO-001', alertId: 'ALERT-DEMO-001',
    title: 'Écart transactionnel — TX-DEMO-1001', type: 'RECONCILIATION',
    priority: 'HIGH', status: 'IN_ANALYSIS', level: 1,
    driver: 'Jean Tremblay', driverNum: 'DRV-QC-0001', driverId: 'drv-demo-001',
    vehicle: 'Toyota Camry 2022 · DEMO-ABC-001', txId: 'TX-DEMO-1001',
    source: 'UBER (DEMO)', amountA: 50.00, amountB: 31.00, diff: 19.00,
    createdAt: '2026-09-17T09:00:00Z', updatedAt: '2026-09-17T11:30:00Z',
    assignedTo: 'Admin GOV-01', notes: 'Écart détecté entre source webhook et Revenue Ledger.',
    timeline: [
      { at: '2026-09-17T08:41:00Z', action: 'ACTIVITÉ CRÉÉE',      icon: '📍', note: 'Course terminée TX-DEMO-1001 — Jean Tremblay' },
      { at: '2026-09-17T08:41:15Z', action: 'TRANSACTION REÇUE',   icon: '💳', note: 'Webhook UBER — montant 50,00$' },
      { at: '2026-09-17T08:42:00Z', action: 'COMPARAISON',         icon: '🔄', note: 'Revenue Ledger: 31,00$ — écart 19,00$' },
      { at: '2026-09-17T08:42:05Z', action: 'ALERTE CRÉÉE',        icon: '🚨', note: 'ALERT-DEMO-001 — priorité HIGH' },
      { at: '2026-09-17T09:00:00Z', action: 'DOSSIER OUVERT',      icon: '📁', note: 'Admin GOV-01 — CASE-DEMO-001' },
      { at: '2026-09-17T11:30:00Z', action: 'ANALYSE EN COURS',    icon: '🔍', note: 'Comparaison sources A et B en cours' },
    ],
    sources: [
      { label: 'Source A — Webhook UBER (DEMO)', amount: 50.00, tps: 2.50, tvq: 4.99, status: 'REÇU' },
      { label: 'Source B — Revenue Ledger',      amount: 31.00, tps: 1.55, tvq: 3.09, status: 'ENREGISTRÉ' },
    ],
    reconciliation: { status: 'ÉCART', diff: 19.00, explanation: null },
  },
  {
    id: 'CASE-DEMO-002', alertId: 'ALERT-DEMO-002',
    title: 'Document expirant — Nadia Patel', type: 'DOCUMENT',
    priority: 'MEDIUM', status: 'INFO_REQUESTED', level: 1,
    driver: 'Nadia Patel', driverNum: 'DRV-QC-0006', driverId: 'drv-demo-006',
    vehicle: 'Mazda CX-5 2022 · DEMO-ABC-006', txId: null,
    source: 'TAXIMETER.GOV', amountA: 0, amountB: 0, diff: 0,
    createdAt: '2026-09-17T09:15:00Z', updatedAt: '2026-09-17T10:00:00Z',
    assignedTo: 'Admin GOV-02', notes: 'Permis de conduire expire 2026-10-15. Renouvellement demandé.',
    timeline: [
      { at: '2026-09-17T09:15:00Z', action: 'ALERTE CRÉÉE',          icon: '🚨', note: 'Document expirant détecté automatiquement' },
      { at: '2026-09-17T09:20:00Z', action: 'DOSSIER OUVERT',        icon: '📁', note: 'Admin GOV-02 — CASE-DEMO-002' },
      { at: '2026-09-17T10:00:00Z', action: 'INFO DEMANDÉE',         icon: '📝', note: 'Renouvellement permis de conduire requis avant 2026-10-15' },
    ],
    sources: [],
    reconciliation: null,
  },
  {
    id: 'CASE-DEMO-003', alertId: 'ALERT-DEMO-004',
    title: 'Écart TPS — TX-DEMO-1009', type: 'FISCAL',
    priority: 'HIGH', status: 'RESOLVED', level: 1,
    driver: 'Karim Hassan', driverNum: 'DRV-QC-0003', driverId: 'drv-demo-003',
    vehicle: 'Hyundai Elantra 2023 · DEMO-ABC-003', txId: 'TX-DEMO-1009',
    source: 'DOORDASH (DEMO)', amountA: 1.62, amountB: 1.55, diff: 0.07,
    createdAt: '2026-09-16T15:00:00Z', updatedAt: '2026-09-17T08:00:00Z',
    assignedTo: 'Admin GOV-01', notes: 'Différence TPS due à un arrondi différent entre systèmes. Expliqué.',
    timeline: [
      { at: '2026-09-16T14:30:00Z', action: 'ALERTE CRÉÉE',        icon: '🚨', note: 'Écart TPS 0,07$ — TX-DEMO-1009' },
      { at: '2026-09-16T15:00:00Z', action: 'DOSSIER OUVERT',      icon: '📁', note: 'Admin GOV-01 — CASE-DEMO-003' },
      { at: '2026-09-16T16:30:00Z', action: 'INFO DEMANDÉE',       icon: '📝', note: 'Règle d\'arrondi TPS demandée au fournisseur' },
      { at: '2026-09-17T08:00:00Z', action: 'DOSSIER RÉSOLU',      icon: '✅', note: 'Arrondi différent confirmé — écart normal. Cas fermé.' },
    ],
    sources: [
      { label: 'TPS calculée TAXIMETER.GOV (5%)', amount: 1.62, tps: 1.62, tvq: 0, status: 'CALCULÉ' },
      { label: 'TPS source DoorDash (DEMO)',       amount: 1.55, tps: 1.55, tvq: 0, status: 'REÇU' },
    ],
    reconciliation: { status: 'RÉSOLU', diff: 0.07, explanation: 'Différence d\'arrondi entre systèmes — normal' },
  },
]

export const AUDIT_LOGS = [
  { id: 'AUD-001', at: '2026-09-17T11:30:00Z', user: 'Admin GOV-01', role: 'ADMIN', module: 'COMPLIANCE', action: 'CASE_VIEWED',       obj: 'CASE-DEMO-001', note: 'Consultation dossier écart transactionnel' },
  { id: 'AUD-002', at: '2026-09-17T10:00:00Z', user: 'Admin GOV-02', role: 'ADMIN', module: 'COMPLIANCE', action: 'INFO_REQUESTED',    obj: 'CASE-DEMO-002', note: 'Demande renouvellement permis Nadia Patel' },
  { id: 'AUD-003', at: '2026-09-17T09:00:00Z', user: 'SYSTEM',       role: 'SYSTEM', module: 'ALERTS',    action: 'ALERT_CREATED',     obj: 'ALERT-DEMO-001', note: 'Écart TX-DEMO-1001 détecté automatiquement' },
  { id: 'AUD-004', at: '2026-09-17T08:42:05Z', user: 'SYSTEM',       role: 'SYSTEM', module: 'ALERTS',    action: 'ALERT_CREATED',     obj: 'ALERT-DEMO-003', note: 'Doublon potentiel TX-DEMO-1002' },
  { id: 'AUD-005', at: '2026-09-17T08:00:00Z', user: 'Admin GOV-01', role: 'ADMIN', module: 'COMPLIANCE', action: 'CASE_RESOLVED',     obj: 'CASE-DEMO-003', note: 'Écart TPS expliqué — arrondi différent' },
  { id: 'AUD-006', at: '2026-09-16T16:30:00Z', user: 'Admin GOV-01', role: 'ADMIN', module: 'COMPLIANCE', action: 'INFO_REQUESTED',    obj: 'CASE-DEMO-003', note: 'Règle arrondi TPS demandée DoorDash DEMO' },
  { id: 'AUD-007', at: '2026-09-16T15:00:00Z', user: 'SYSTEM',       role: 'SYSTEM', module: 'COMPLIANCE', action: 'CASE_CREATED',    obj: 'CASE-DEMO-003', note: 'Dossier créé depuis ALERT-DEMO-004' },
  { id: 'AUD-008', at: '2026-09-16T16:00:00Z', user: 'SYSTEM',       role: 'SYSTEM', module: 'PLATFORM',   action: 'WEBHOOK_FAILURE',  obj: 'SKIP-DEMO',      note: 'Interruption 22 min — 3 événements récupérés' },
  { id: 'AUD-009', at: '2026-09-15T11:20:00Z', user: 'SYSTEM',       role: 'SYSTEM', module: 'ALERTS',    action: 'ALERT_CREATED',     obj: 'ALERT-DEMO-006', note: 'Activité détectée — chauffeur suspendu DRV-QC-0007' },
  { id: 'AUD-010', at: '2026-09-14T10:00:00Z', user: 'Admin GOV-01', role: 'ADMIN', module: 'COMPLIANCE', action: 'CASE_RESOLVED',     obj: 'ALERT-DEMO-008', note: 'Licence livraison — renouvellement confirmé' },
  { id: 'AUD-011', at: '2026-09-14T09:00:00Z', user: 'Admin GOV-02', role: 'ADMIN', module: 'DOCUMENTS',  action: 'DOCUMENT_VERIFIED', obj: 'DOC-demo-003',   note: 'Assurance Jean Tremblay — version 2 approuvée' },
  { id: 'AUD-012', at: '2026-09-13T14:00:00Z', user: 'SUPER_ADMIN',  role: 'SUPER_ADMIN', module: 'REPORTS', action: 'REPORT_GENERATED', obj: 'RPT-GOV-C001', note: 'Rapport conformité Q3 2026 généré' },
  { id: 'AUD-013', at: '2026-09-12T10:00:00Z', user: 'Admin GOV-01', role: 'ADMIN', module: 'COMPLIANCE', action: 'DOCUMENT_UPDATED',  obj: 'DOC-demo-014',   note: 'Alerte expiration permis Nadia Patel notée' },
  { id: 'AUD-014', at: '2026-09-10T08:00:00Z', user: 'SUPER_ADMIN',  role: 'SUPER_ADMIN', module: 'ANALYTICS', action: 'REPORT_EXPORTED', obj: 'RPT-GOV-F001', note: 'Export PDF rapport fiscal Q3' },
  { id: 'AUD-015', at: '2026-09-05T09:00:00Z', user: 'Admin GOV-01', role: 'ADMIN', module: 'DRIVERS',    action: 'DOCUMENT_VERIFIED', obj: 'DOC-demo-001',   note: 'Permis de conduire Jean Tremblay vérifié' },
]

export const PRIORITY_CONF: Record<string,{label:string;color:string;bg:string}> = {
  CRITICAL:{label:'Critique',  color:'#DC2626',bg:'rgba(220,38,38,0.12)'},
  HIGH:    {label:'Élevée',   color:'#B45309', bg:'rgba(180,83,9,0.10)'},
  MEDIUM:  {label:'Normale',  color:'#003DA5', bg:'rgba(0,61,165,0.10)'},
  LOW:     {label:'Faible',   color:'#64748B', bg:'rgba(100,116,139,0.10)'},
}
export const STATUS_CONF: Record<string,{label:string;color:string;bg:string}> = {
  NEW:            {label:'Nouvelle',       color:'#003DA5', bg:'rgba(0,61,165,0.12)'},
  IN_ANALYSIS:    {label:'En analyse',     color:'#B45309', bg:'rgba(180,83,9,0.10)'},
  INFO_REQUESTED: {label:'Info demandée',  color:'#7C3AED', bg:'rgba(124,58,237,0.12)'},
  RESOLVED:       {label:'Résolue',        color:'#059669', bg:'rgba(5,150,105,0.12)'},
  FALSE_POSITIVE: {label:'Faux positif',   color:'#64748B', bg:'rgba(100,116,139,0.10)'},
  CLOSED:         {label:'Fermée',         color:'#64748B', bg:'rgba(100,116,139,0.10)'},
}
export const TYPE_CONF: Record<string,{label:string;icon:string}> = {
  RECONCILIATION:{label:'Réconciliation', icon:'🔄'},
  FISCAL:        {label:'Fiscal',         icon:'🧾'},
  DOCUMENT:      {label:'Document',       icon:'📄'},
  TRANSACTION:   {label:'Transaction',    icon:'💳'},
  CHAUFFEUR:     {label:'Chauffeur',      icon:'👤'},
  VEHICULE:      {label:'Véhicule',       icon:'🚗'},
  PLATFORM:      {label:'Plateforme',     icon:'🌐'},
  REVENUS:       {label:'Revenus',        icon:'💰'},
  LICENCE:       {label:'Licence',        icon:'📜'},
  POURBOIRES:    {label:'Pourboires',     icon:'🎁'},
}
