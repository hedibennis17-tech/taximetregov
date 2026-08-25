// ============================================================
// TAXIMÈTRE.GOV — STEP 8 MOCK DATA
// Security, Privacy & Government Governance
// ============================================================

export type SecurityAlertType = 'MULTIPLE_FAILED_LOGIN' | 'UNUSUAL_ACCESS' | 'MASS_EXPORT' | 'PRIVILEGE_CHANGE' | 'WEBHOOK_SIGNATURE_FAILURE' | 'RATE_LIMIT' | 'SUSPICIOUS_ACTIVITY'
export type SecurityAlertStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED'
export type SecurityIncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type SecurityIncidentStatus = 'DETECTED' | 'TRIAGE' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED' | 'CLOSED'
export type DataClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'HIGHLY_CONFIDENTIAL'
export type PrivacyRequestType = 'ACCESS' | 'CORRECTION' | 'OTHER'
export type PrivacyRequestStatus = 'PENDING' | 'IN_REVIEW' | 'COMPLETED' | 'REJECTED'
export type ControlStatus = 'READY' | 'PARTIAL' | 'MISSING' | 'REVIEW_REQUIRED'

export interface SecurityAlert {
  id: string; type: SecurityAlertType; severity: SecurityIncidentSeverity
  status: SecurityAlertStatus; title: string; description: string
  actor?: string; ipAddress?: string; timestamp: string
  affectedResource?: string; resolved?: boolean
}
export const mockSecurityAlerts: SecurityAlert[] = [
  { id:'sa-001', type:'MULTIPLE_FAILED_LOGIN', severity:'MEDIUM', status:'OPEN', title:'5 tentatives de connexion échouées', description:'L\'utilisateur SUPPORT-001 a échoué 5 connexions consécutives depuis 198.51.100.23', actor:'SUPPORT-001', ipAddress:'198.51.100.23', timestamp:'2026-08-24T11:42:00Z', affectedResource:'auth/login', resolved:false },
  { id:'sa-002', type:'WEBHOOK_SIGNATURE_FAILURE', severity:'HIGH', status:'INVESTIGATING', title:'Signature HMAC invalide — Skip', description:'Webhooks Skip rejetés pour signature invalide. Cause confirmée: rotation de clé non synchronisée.', timestamp:'2026-08-24T13:48:00Z', affectedResource:'webhooks/skip', resolved:false },
  { id:'sa-003', type:'UNUSUAL_ACCESS', severity:'MEDIUM', status:'RESOLVED', title:'Accès inhabituel données fiscales', description:'ANALYST-001 a accédé à 142 dossiers fiscaux en 4 minutes — volume anormalement élevé.', actor:'ANALYST-001', ipAddress:'203.0.113.45', timestamp:'2026-08-23T17:12:00Z', affectedResource:'tax/records', resolved:true },
  { id:'sa-004', type:'PRIVILEGE_CHANGE', severity:'HIGH', status:'RESOLVED', title:'Changement de rôle — audit requis', description:'Rôle SUPPORT-001 modifié de SUPPORT_AGENT → COMPLIANCE_OFFICER par ADMIN-001', actor:'ADMIN-001', timestamp:'2026-08-22T09:30:00Z', affectedResource:'admin/users/SUPPORT-001', resolved:true },
  { id:'sa-005', type:'MASS_EXPORT', severity:'MEDIUM', status:'OPEN', title:'Export volumineux détecté', description:'ANALYST-001 a exporté 8 432 lignes de données de revenus en dehors des heures de bureau.', actor:'ANALYST-001', timestamp:'2026-08-24T23:15:00Z', affectedResource:'reports/revenue', resolved:false },
  { id:'sa-006', type:'RATE_LIMIT', severity:'LOW', status:'DISMISSED', title:'Rate limit atteint — API Search', description:'IP 192.0.2.100 a atteint la limite de 100 req/min sur /api/search.', ipAddress:'192.0.2.100', timestamp:'2026-08-24T14:02:00Z', affectedResource:'api/search', resolved:true },
]

export interface SecurityIncident {
  id: string; title: string; severity: SecurityIncidentSeverity
  status: SecurityIncidentStatus; description: string
  assignedTo: string; startedAt: string; resolvedAt?: string
  timeline: { time: string; event: string; actor: string }[]
}
export const mockSecurityIncidents: SecurityIncident[] = [
  { id:'si-001', title:'Webhook Skip — Clé HMAC compromise/expirée', severity:'HIGH', status:'CONTAINED', description:'La clé HMAC de signature des webhooks Skip a expiré ou a été compromise. 5 webhooks rejetés. Aucune donnée compromise. Clé renouvelée via Maker-Checker.', assignedTo:'ADMIN-001', startedAt:'2026-08-24T13:48:00Z', timeline:[
    { time:'13:48', event:'Rejets détectés automatiquement', actor:'SYSTEM' },
    { time:'13:55', event:'Alerte envoyée à ADMIN-001', actor:'SYSTEM' },
    { time:'14:00', event:'Cause identifiée: expiration HMAC', actor:'ADMIN-001' },
    { time:'14:10', event:'Nouvelle clé soumise (Maker: ADMIN-001)', actor:'ADMIN-001' },
    { time:'14:15', event:'Approuvée (Checker: TAX-003)', actor:'TAX-003' },
    { time:'14:20', event:'Nouvelle clé déployée', actor:'SYSTEM' },
  ]}
]

export interface ActiveSession {
  id: string; userId: string; userRole: string; userName: string
  deviceType: string; browser: string; ipAddress: string
  location: string; loginAt: string; lastActivity: string
  mfaVerified: boolean; current: boolean
}
export const mockActiveSessions: ActiveSession[] = [
  { id:'sess-001', userId:'ADMIN-001', userRole:'SUPER_ADMIN', userName:'Gérard Lepage', deviceType:'Desktop', browser:'Chrome 126', ipAddress:'192.0.2.50', location:'Montréal, QC', loginAt:'2026-08-24T08:30:00Z', lastActivity:'2026-08-24T15:05:00Z', mfaVerified:true, current:true },
  { id:'sess-002', userId:'TAX-003', userRole:'TAX_ADMIN', userName:'Nathalie Beausoleil', deviceType:'Desktop', browser:'Firefox 127', ipAddress:'192.0.2.51', location:'Québec, QC', loginAt:'2026-08-24T09:00:00Z', lastActivity:'2026-08-24T14:55:00Z', mfaVerified:true, current:false },
  { id:'sess-003', userId:'COMP-002', userRole:'COMPLIANCE_OFFICER', userName:'Marc Tremblay', deviceType:'Laptop', browser:'Safari 17', ipAddress:'192.0.2.52', location:'Montréal, QC', loginAt:'2026-08-24T10:15:00Z', lastActivity:'2026-08-24T14:48:00Z', mfaVerified:true, current:false },
  { id:'sess-004', userId:'ANALYST-001', userRole:'ANALYST', userName:'Kevin Ouellet', deviceType:'Desktop', browser:'Chrome 126', ipAddress:'203.0.113.45', location:'Québec, QC', loginAt:'2026-08-24T13:00:00Z', lastActivity:'2026-08-24T15:02:00Z', mfaVerified:false, current:false },
]

export interface DataClass {
  id: string; name: string; category: string
  classification: DataClassification; examples: string[]
  retention: string; access: string[]; encrypted: boolean; logged: boolean
}
export const dataClassificationRegistry: DataClass[] = [
  { id:'dc-001', name:'Statistiques publiques', category:'Analytics', classification:'PUBLIC', examples:['Revenus totaux agrégés','Nombre transactions (anonymisé)'], retention:'Indéfini', access:['Tous'], encrypted:false, logged:false },
  { id:'dc-002', name:'Données opérationnelles', category:'Operations', classification:'INTERNAL', examples:['Statut services','Métriques webhook agrégées'], retention:'7 ans', access:['Agents gouvernementaux'], encrypted:false, logged:true },
  { id:'dc-003', name:'Données financières', category:'Financial', classification:'CONFIDENTIAL', examples:['Transactions individuelles','Revenus par chauffeur','Déclarations fiscales'], retention:'7 ans (fiscal)', access:['TAX_ADMIN','AUDITOR','COMPLIANCE_OFFICER','SUPER_ADMIN'], encrypted:true, logged:true },
  { id:'dc-004', name:'Identité sensible', category:'Identity', classification:'HIGHLY_CONFIDENTIAL', examples:['NAS (tokenisé)','Données bancaires','Identité complète'], retention:'7 ans (légal)', access:['SUPER_ADMIN','TAX_ADMIN (limité)'], encrypted:true, logged:true },
  { id:'dc-005', name:'Credentials système', category:'Security', classification:'HIGHLY_CONFIDENTIAL', examples:['Tokens OAuth','Clés HMAC','Credentials API'], retention:'Rotation obligatoire', access:['SYSTEM_ADMIN'], encrypted:true, logged:true },
  { id:'dc-006', name:'Journal d\'audit', category:'Audit', classification:'CONFIDENTIAL', examples:['Actions admin','Accès données','Config changes'], retention:'10 ans', access:['AUDITOR','SUPER_ADMIN'], encrypted:false, logged:false },
]

export const mfaPolicy = {
  STANDARD: { required: false, roles: ['SUPPORT_AGENT','ANALYST'], description: 'Recommandé mais non obligatoire' },
  ELEVATED: { required: true, roles: ['COMPLIANCE_OFFICER','LICENSING_OFFICER','GOVERNMENT_ADMIN','AUDITOR'], description: 'Obligatoire — Authenticator App' },
  CRITICAL: { required: true, roles: ['SUPER_ADMIN','SYSTEM_ADMIN','TAX_ADMIN'], description: 'Obligatoire — Authenticator App + Step-up pour actions critiques' },
}

export const thirdPartyRegistry = [
  { provider:'Uber', purpose:'Données courses/revenus', accessScope:'OAuth — données chauffeur', status:'MOCK', lastUsed:null, security:'OAuth 2.0 + Webhook HMAC', retention:'7 ans', approved:false },
  { provider:'Lyft', purpose:'Données courses/revenus', accessScope:'OAuth — données chauffeur', status:'MOCK', lastUsed:null, security:'OAuth 2.0 + Webhook HMAC', retention:'7 ans', approved:false },
  { provider:'DoorDash', purpose:'Données livraisons', accessScope:'API + Webhook', status:'MAINTENANCE', lastUsed:'2026-08-24T14:32:00Z', security:'Webhook HMAC-SHA256', retention:'7 ans', approved:false },
  { provider:'Instacart', purpose:'Données épicerie', accessScope:'OAuth', status:'MOCK', lastUsed:null, security:'OAuth 2.0', retention:'7 ans', approved:false },
  { provider:'Uber Eats', purpose:'Données livraisons alimentaires', accessScope:'OAuth + Webhook', status:'MOCK', lastUsed:null, security:'OAuth 2.0 + Webhook HMAC', retention:'7 ans', approved:false },
  { provider:'Skip', purpose:'Données livraisons alimentaires', accessScope:'Webhook', status:'MAINTENANCE — HMAC renouvellement', lastUsed:'2026-08-24T13:48:00Z', security:'Webhook HMAC-SHA256', retention:'7 ans', approved:false },
  { provider:'Taximètre (interne)', purpose:'Courses taxi', accessScope:'API interne', status:'ACTIF', lastUsed:'2026-08-24T15:02:00Z', security:'API interne auth', retention:'7 ans', approved:true },
  { provider:'Supabase Auth', purpose:'Authentification', accessScope:'Auth uniquement', status:'ACTIF', lastUsed:'2026-08-24T15:00:00Z', security:'Auth platform chiffré', retention:'Durée session', approved:true },
]

export interface ComplianceRequirement {
  id: string; requirement: string; category: string
  control: string; evidence: string; owner: string; status: ControlStatus
}
export const complianceRequirements: ComplianceRequirement[] = [
  { id:'cr-001', requirement:'Authentification renforcée', category:'Authentication', control:'Supabase Auth + MFA', evidence:'mfaPolicy config', owner:'SYSTEM_ADMIN', status:'READY' },
  { id:'cr-002', requirement:'Journalisation immuable', category:'Audit', control:'AuditLog append-only', evidence:'audit_logs table', owner:'SYSTEM_ADMIN', status:'READY' },
  { id:'cr-003', requirement:'RBAC granulaire', category:'Authorization', control:'9 rôles, permissions, scope juridiction', evidence:'permission_matrix', owner:'SUPER_ADMIN', status:'READY' },
  { id:'cr-004', requirement:'Chiffrement en transit', category:'Encryption', control:'TLS 1.3 — Vercel + Supabase', evidence:'SSL config', owner:'SYSTEM_ADMIN', status:'READY' },
  { id:'cr-005', requirement:'Chiffrement au repos', category:'Encryption', control:'Supabase + AES-256 tokens', evidence:'platform_accounts chiffré', owner:'SYSTEM_ADMIN', status:'PARTIAL' },
  { id:'cr-006', requirement:'Minimisation données PII', category:'Privacy', control:'DataClassificationRegistry + masking', evidence:'data_classification', owner:'SUPER_ADMIN', status:'PARTIAL' },
  { id:'cr-007', requirement:'Politique de rétention', category:'Retention', control:'RetentionPolicy + Legal Hold', evidence:'retention_policies', owner:'SUPER_ADMIN', status:'READY' },
  { id:'cr-008', requirement:'Protection NAS/SIN', category:'PII', control:'Tokenisé — affiché ***-***-XXX', evidence:'identity_vault config', owner:'SUPER_ADMIN', status:'READY' },
  { id:'cr-009', requirement:'Séparation environnements', category:'Infrastructure', control:'Vercel environments', evidence:'vercel.json', owner:'SYSTEM_ADMIN', status:'PARTIAL' },
  { id:'cr-010', requirement:'Backup et restauration', category:'Business Continuity', control:'Supabase backups', evidence:'Supabase config', owner:'SYSTEM_ADMIN', status:'REVIEW_REQUIRED' },
  { id:'cr-011', requirement:'Signature webhooks HMAC', category:'Integration Security', control:'WebhookVerifier HMAC-SHA256', evidence:'revenue.gateway.ts', owner:'SYSTEM_ADMIN', status:'READY' },
  { id:'cr-012', requirement:'Anti-rejeu webhook', category:'Integration Security', control:'UNIQUE(provider, event_id)', evidence:'revenue.gateway.ts', owner:'SYSTEM_ADMIN', status:'READY' },
  { id:'cr-013', requirement:'Sécurité dépendances', category:'Code Security', control:'Next.js 15.5.23 (CVE patché)', evidence:'package.json', owner:'SYSTEM_ADMIN', status:'PARTIAL' },
  { id:'cr-014', requirement:'Principe quatre yeux', category:'Governance', control:'ApprovalWorkflow Maker-Checker', evidence:'approvals pages', owner:'SUPER_ADMIN', status:'READY' },
  { id:'cr-015', requirement:'Juridiction et résidence données', category:'Data Governance', control:'QC-CA configuré, multi-juridiction', evidence:'jurisdictions config', owner:'SUPER_ADMIN', status:'PARTIAL' },
]

export interface PrivacyRequest {
  id: string; type: PrivacyRequestType; requestedBy: string
  driverId: string; driverName: string; description: string
  status: PrivacyRequestStatus; assignedTo: string
  createdAt: string; dueDate: string; completedAt?: string
}
export const mockPrivacyRequests: PrivacyRequest[] = [
  { id:'pr-001', type:'ACCESS', requestedBy:'TG-000009', driverId:'TG-000009', driverName:'Carlos Rodriguez', description:'Demande d\'accès à toutes les données personnelles détenues par le gouvernement', status:'IN_REVIEW', assignedTo:'COMP-002', createdAt:'2026-08-20T10:00:00Z', dueDate:'2026-09-19T00:00:00Z' },
  { id:'pr-002', type:'CORRECTION', requestedBy:'TG-000001', driverId:'TG-000001', driverName:'Mohammed Benali', description:'Correction du courriel enregistré — ancienne adresse obsolète', status:'COMPLETED', assignedTo:'SUPPORT-001', createdAt:'2026-08-15T09:00:00Z', dueDate:'2026-09-14T00:00:00Z', completedAt:'2026-08-18T14:00:00Z' },
  { id:'pr-003', type:'OTHER', requestedBy:'TG-000002', driverId:'TG-000002', driverName:'Sophie Tremblay', description:'Question sur utilisation données par plateformes partenaires', status:'PENDING', assignedTo:'', createdAt:'2026-08-24T08:00:00Z', dueDate:'2026-09-23T00:00:00Z' },
]

export const featureFlags = [
  { id:'ff-001', name:'AIInsights', description:'Insights IA', enabled:false, environment:'all', rbacScope:['SUPER_ADMIN'], reason:'Pilote — non déployé' },
  { id:'ff-002', name:'NewWebhookProvider', description:'Skip webhook v2', enabled:false, environment:'staging', rbacScope:['SYSTEM_ADMIN'], reason:'Test staging uniquement' },
  { id:'ff-003', name:'RealTimeAnalytics', description:'Analytics WebSocket', enabled:false, environment:'all', rbacScope:['SUPER_ADMIN'], reason:'Performance à valider' },
  { id:'ff-004', name:'BulkExportV2', description:'Export bulk asynchrone', enabled:true, environment:'all', rbacScope:['SUPER_ADMIN','TAX_ADMIN'], reason:'Actif — audit obligatoire' },
  { id:'ff-005', name:'PasskeyAuth', description:'WebAuthn/Passkeys', enabled:false, environment:'staging', rbacScope:['SYSTEM_ADMIN'], reason:'En évaluation' },
  { id:'ff-006', name:'MLComplianceScore', description:'Score ML conformité', enabled:false, environment:'all', rbacScope:['SUPER_ADMIN'], reason:'Architecture prête — modèle non entraîné' },
]

export const dependencyAudit = [
  { package:'next', version:'15.5.23', status:'OK', note:'CVE-2025-66478 patché ✅' },
  { package:'react', version:'18.3.1', status:'OK', note:'Version stable' },
  { package:'recharts', version:'2.15.4', status:'WARNING', note:'Dépréciation 1.x/2.x — migration v3 à planifier' },
  { package:'eslint', version:'8.57.1', status:'WARNING', note:'EOL — migration ESLint 9 à planifier' },
  { package:'tailwindcss', version:'3.4.1', status:'OK', note:'Version stable' },
  { package:'lucide-react', version:'0.383.0', status:'OK', note:'Version stable' },
  { package:'date-fns', version:'3.6.0', status:'OK', note:'Version stable' },
  { package:'rimraf', version:'3.0.2', status:'WARNING', note:'Déprécié (dépendance transitive) — non critique' },
]

export const rateLimits = [
  { endpoint:'auth/login', limit:'10 req/min', window:'1 min', action:'Lock temporaire après 5 échecs' },
  { endpoint:'api/search', limit:'100 req/min', window:'1 min', action:'429 Too Many Requests' },
  { endpoint:'api/reports/export', limit:'5 req/min', window:'1 min', action:'Queue + approbation pour bulk' },
  { endpoint:'api/webhooks/*', limit:'1000 req/min', window:'1 min', action:'Protection DDoS' },
  { endpoint:'api/admin/*', limit:'30 req/min', window:'1 min', action:'Step-up auth pour actions critiques' },
  { endpoint:'api/analytics', limit:'50 req/min', window:'1 min', action:'Cache + throttle' },
]

export const securityPosture = {
  overall: 71,
  categories: [
    { name:'Authentification', score:85, status:'READY' as ControlStatus, notes:'MFA configuré — 2 comptes sans MFA (SUPPORT, ANALYST)' },
    { name:'Autorisation (RBAC)', score:90, status:'READY' as ControlStatus, notes:'9 rôles, permissions granulaires, scope territorial' },
    { name:'Protection des données', score:75, status:'PARTIAL' as ControlStatus, notes:'Chiffrement AES-256 préparé — Field-level non encore déployé' },
    { name:'Sécurité API', score:70, status:'PARTIAL' as ControlStatus, notes:'Rate limiting configuré — Tests IDOR à compléter' },
    { name:'Sécurité webhooks', score:80, status:'READY' as ControlStatus, notes:'HMAC vérifié — Replay protection active — Incident Skip en cours' },
    { name:'Infrastructure', score:65, status:'PARTIAL' as ControlStatus, notes:'Vercel + Supabase — CORS à finaliser en production' },
    { name:'Monitoring', score:72, status:'PARTIAL' as ControlStatus, notes:'Alertes configurées — SIEM à intégrer' },
    { name:'Backup & DR', score:40, status:'REVIEW_REQUIRED' as ControlStatus, notes:'Stratégie documentée — Tests de restore à planifier' },
    { name:'Réponse incidents', score:68, status:'PARTIAL' as ControlStatus, notes:'Workflow défini — Plan de communication à compléter' },
  ]
}

export const backupStrategy = {
  database: { provider:'Supabase', frequency:'Daily automated + PITR 7 days', retention:'30 jours', encrypted:true, tested:false, rto:'< 4h', rpo:'< 1h' },
  documents: { provider:'Supabase Storage', frequency:'Continu', retention:'Selon politique rétention', encrypted:true, tested:false },
  auditLogs: { provider:'Supabase + Archive externe', frequency:'Export quotidien', retention:'10 ans (légal)', encrypted:true, tested:false },
  config: { provider:'Git + Vercel', frequency:'Sur changement', retention:'Historique Git', encrypted:false, tested:true },
  webhookEvents: { provider:'Database + DLQ', frequency:'Temps réel', retention:'2 ans', encrypted:false, tested:true },
}
