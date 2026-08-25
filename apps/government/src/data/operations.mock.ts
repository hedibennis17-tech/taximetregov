// ============================================================
// TAXIMÈTRE.GOV — STEP 6 MOCK DATA (DEMO / SIMULATION)
// Government Operations & Administration
// ============================================================

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING' | 'LOCKED'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'WAITING' | 'COMPLETED' | 'CANCELLED'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type ApprovalStatus = 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
export type LicenseStatus = 'VALID' | 'EXPIRING' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED' | 'PENDING'
export type VehicleStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'UNDER_REVIEW'
export type ServiceStatus = 'HEALTHY' | 'DEGRADED' | 'DOWN'
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'MITIGATED' | 'RESOLVED' | 'CLOSED'
export type PlatformAdminStatus = 'ENABLED' | 'DISABLED' | 'MAINTENANCE' | 'NOT_CONFIGURED'
export type DataQualityGrade = 'GOOD' | 'WARNING' | 'CRITICAL'

// ─── ORGANIZATIONS ────────────────────────────────────────────
export interface GovernmentOrganization {
  id: string; code: string; name: string; type: string
  province: string; userCount: number; departmentCount: number
  status: 'ACTIVE' | 'INACTIVE'; createdAt: string
}
export const mockOrganizations: GovernmentOrganization[] = [
  { id:'org-001', code:'MTQ', name:'Ministère des Transports du Québec', type:'Provincial', province:'Québec', userCount:48, departmentCount:5, status:'ACTIVE', createdAt:'2024-01-01T00:00:00Z' },
  { id:'org-002', code:'ARQ', name:'Agence du revenu du Québec', type:'Tax Authority', province:'Québec', userCount:32, departmentCount:4, status:'ACTIVE', createdAt:'2024-01-01T00:00:00Z' },
  { id:'org-003', code:'SAAQ', name:'Société de l\'assurance automobile du Québec', type:'Regulatory Authority', province:'Québec', userCount:24, departmentCount:3, status:'ACTIVE', createdAt:'2024-01-01T00:00:00Z' },
  { id:'org-004', code:'VDM', name:'Ville de Montréal', type:'Municipal', province:'Québec', userCount:12, departmentCount:2, status:'ACTIVE', createdAt:'2024-02-01T00:00:00Z' },
  { id:'org-005', code:'VDQ', name:'Ville de Québec', type:'Municipal', province:'Québec', userCount:8, departmentCount:2, status:'ACTIVE', createdAt:'2024-02-01T00:00:00Z' },
]

// ─── DEPARTMENTS ──────────────────────────────────────────────
export const mockDepartments = [
  { id:'dep-001', orgId:'org-001', name:'Transport & Licensing', code:'TL', userCount:15, permissions:['drivers.read','vehicles.read','licenses.read','licenses.write'] },
  { id:'dep-002', orgId:'org-001', name:'Compliance & Enforcement', code:'CE', userCount:12, permissions:['compliance.read','compliance.write','cases.manage','audit.read'] },
  { id:'dep-003', orgId:'org-002', name:'Tax Administration', code:'TA', userCount:18, permissions:['tax.read','tax.write','revenue.read','declarations.write'] },
  { id:'dep-004', orgId:'org-002', name:'Revenue Analytics', code:'RA', userCount:8, permissions:['analytics.read','revenue.read','reports.read'] },
  { id:'dep-005', orgId:'org-003', name:'Vehicle Inspection', code:'VI', userCount:10, permissions:['vehicles.read','vehicles.write','inspections.write'] },
  { id:'dep-006', orgId:'org-003', name:'Driver Licensing', code:'DL', userCount:14, permissions:['drivers.read','licenses.read','licenses.write','documents.review'] },
]

// ─── GOVERNMENT USERS ─────────────────────────────────────────
export interface GovernmentUser {
  id: string; userId: string; firstName: string; lastName: string
  email: string; role: string; organization: string; orgCode: string
  department: string; territory: string; status: UserStatus
  mfaEnabled: boolean; lastLogin: string; createdAt: string
  permissions: string[]
}
export const mockGovernmentUsers: GovernmentUser[] = [
  { id:'gu-001', userId:'ADMIN-001', firstName:'Gérard', lastName:'Lepage', email:'gerard.lepage@mtq.gouv.qc.ca', role:'SUPER_ADMIN', organization:'MTQ', orgCode:'org-001', department:'Administration', territory:'Québec (Province)', status:'ACTIVE', mfaEnabled:true, lastLogin:'2026-08-24T14:30:00Z', createdAt:'2024-01-15T00:00:00Z', permissions:['*'] },
  { id:'gu-002', userId:'TAX-003', firstName:'Nathalie', lastName:'Beausoleil', email:'n.beausoleil@arq.gouv.qc.ca', role:'TAX_ADMIN', organization:'ARQ', orgCode:'org-002', department:'Tax Administration', territory:'Québec (Province)', status:'ACTIVE', mfaEnabled:true, lastLogin:'2026-08-24T13:10:00Z', createdAt:'2024-02-01T00:00:00Z', permissions:['tax.read','tax.write','declarations.write','revenue.read'] },
  { id:'gu-003', userId:'COMP-002', firstName:'Marc', lastName:'Tremblay', email:'m.tremblay@mtq.gouv.qc.ca', role:'COMPLIANCE_OFFICER', organization:'MTQ', orgCode:'org-001', department:'Compliance & Enforcement', territory:'Montréal', status:'ACTIVE', mfaEnabled:true, lastLogin:'2026-08-24T10:15:00Z', createdAt:'2024-03-01T00:00:00Z', permissions:['compliance.read','compliance.write','cases.manage','documents.review'] },
  { id:'gu-004', userId:'AUDIT-001', firstName:'Sophie', lastName:'Garneau', email:'s.garneau@arq.gouv.qc.ca', role:'AUDITOR', organization:'ARQ', orgCode:'org-002', department:'Revenue Analytics', territory:'Québec (Province)', status:'ACTIVE', mfaEnabled:true, lastLogin:'2026-08-23T09:00:00Z', createdAt:'2024-04-01T00:00:00Z', permissions:['audit.read','drivers.read','revenue.read','tax.read'] },
  { id:'gu-005', userId:'LIC-001', firstName:'Patrick', lastName:'Boivin', email:'p.boivin@saaq.gouv.qc.ca', role:'LICENSING_OFFICER', organization:'SAAQ', orgCode:'org-003', department:'Driver Licensing', territory:'Québec (Province)', status:'ACTIVE', mfaEnabled:false, lastLogin:'2026-08-24T08:45:00Z', createdAt:'2024-04-15T00:00:00Z', permissions:['licenses.read','licenses.write','documents.review','drivers.read'] },
  { id:'gu-006', userId:'SUPPORT-001', firstName:'Isabelle', lastName:'Caron', email:'i.caron@mtq.gouv.qc.ca', role:'SUPPORT_AGENT', organization:'MTQ', orgCode:'org-001', department:'Transport & Licensing', territory:'Montréal', status:'ACTIVE', mfaEnabled:false, lastLogin:'2026-08-24T11:30:00Z', createdAt:'2024-05-01T00:00:00Z', permissions:['drivers.read.basic','documents.read'] },
  { id:'gu-007', userId:'ANALYST-001', firstName:'Kevin', lastName:'Ouellet', email:'k.ouellet@arq.gouv.qc.ca', role:'ANALYST', organization:'ARQ', orgCode:'org-002', department:'Revenue Analytics', territory:'Québec (Province)', status:'ACTIVE', mfaEnabled:false, lastLogin:'2026-08-23T17:00:00Z', createdAt:'2024-05-15T00:00:00Z', permissions:['analytics.read','revenue.aggregate','reports.read'] },
  { id:'gu-008', userId:'INS-001', firstName:'Daniel', lastName:'Lefebvre', email:'d.lefebvre@saaq.gouv.qc.ca', role:'INSPECTOR', organization:'SAAQ', orgCode:'org-003', department:'Vehicle Inspection', territory:'Québec (Province)', status:'SUSPENDED', mfaEnabled:false, lastLogin:'2026-08-01T09:00:00Z', createdAt:'2024-06-01T00:00:00Z', permissions:['vehicles.read','inspections.write'] },
]

// ─── ADMINISTRATIVE TASKS ─────────────────────────────────────
export interface AdministrativeTask {
  id: string; title: string; description: string
  priority: TaskPriority; assignedTo: string; assignedName: string
  department: string; status: TaskStatus; dueDate: string
  createdAt: string; completedAt?: string
}
export const mockTasks: AdministrativeTask[] = [
  { id:'task-001', title:'Réviser dossier conformité CASE-2026-0001', description:'Sophie Tremblay — écart revenus DoorDash 2 320$', priority:'HIGH', assignedTo:'COMP-002', assignedName:'Marc Tremblay', department:'Compliance & Enforcement', status:'IN_PROGRESS', dueDate:'2026-08-30', createdAt:'2026-08-20T08:00:00Z' },
  { id:'task-002', title:'Renouveler licences taxi expirant en septembre', description:'23 licences expireront avant le 30 septembre 2026', priority:'HIGH', assignedTo:'LIC-001', assignedName:'Patrick Boivin', department:'Driver Licensing', status:'TODO', dueDate:'2026-09-01', createdAt:'2026-08-24T09:00:00Z' },
  { id:'task-003', title:'Réconciliation DoorDash — Écart 2 320$', description:'Enquête sur le manque webhook DoorDash du 24 août', priority:'MEDIUM', assignedTo:'TAX-003', assignedName:'Nathalie Beausoleil', department:'Tax Administration', status:'IN_PROGRESS', dueDate:'2026-09-05', createdAt:'2026-08-24T14:00:00Z' },
  { id:'task-004', title:'Audit trimestriel Q3 — Revenus plateforme', description:'Révision des revenus Q3 2026 toutes plateformes', priority:'MEDIUM', assignedTo:'AUDIT-001', assignedName:'Sophie Garneau', department:'Revenue Analytics', status:'TODO', dueDate:'2026-09-15', createdAt:'2026-08-22T10:00:00Z' },
  { id:'task-005', title:'Vérifier METER-QC-00003210 — Version obsolète', description:'Taximètre v3.1.9 non certifié pour cette saison', priority:'HIGH', assignedTo:'LIC-001', assignedName:'Patrick Boivin', department:'Driver Licensing', status:'TODO', dueDate:'2026-08-28', createdAt:'2026-08-24T07:30:00Z' },
  { id:'task-006', title:'Générer rapport fiscal mensuel août 2026', description:'Rapport TPS/TVQ mensuel pour l\'ARQ', priority:'LOW', assignedTo:'TAX-003', assignedName:'Nathalie Beausoleil', department:'Tax Administration', status:'TODO', dueDate:'2026-09-05', createdAt:'2026-08-24T08:00:00Z' },
  { id:'task-007', title:'Réviser document assurance — TG-000002', description:'Police d\'assurance expirée — délai 2026-09-15', priority:'MEDIUM', assignedTo:'COMP-002', assignedName:'Marc Tremblay', department:'Compliance & Enforcement', status:'WAITING', dueDate:'2026-09-15', createdAt:'2026-08-24T09:30:00Z' },
  { id:'task-008', title:'Configurer webhook Skip — Nouvelle clé HMAC', description:'Clé HMAC expirée — 5 webhooks échoués', priority:'CRITICAL', assignedTo:'ADMIN-001', assignedName:'Gérard Lepage', department:'Administration', status:'IN_PROGRESS', dueDate:'2026-08-25', createdAt:'2026-08-24T13:48:00Z' },
]

// ─── APPROVAL WORKFLOWS ───────────────────────────────────────
export interface ApprovalWorkflow {
  id: string; type: string; title: string; description: string
  createdBy: string; createdByName: string; reviewedBy?: string
  status: ApprovalStatus; priority: TaskPriority
  createdAt: string; updatedAt: string; reason?: string
  makerCheckerRequired: boolean
}
export const mockApprovals: ApprovalWorkflow[] = [
  { id:'appr-001', type:'LICENSE_RENEWAL', title:'Renouvellement licence taxi — TG-000003', description:'Jean-Pierre Côté — Permis TAXI-QC-2026 · Renouvellement annuel', createdBy:'LIC-001', createdByName:'Patrick Boivin', status:'IN_REVIEW', priority:'HIGH', createdAt:'2026-08-23T09:00:00Z', updatedAt:'2026-08-24T08:00:00Z', makerCheckerRequired:true },
  { id:'appr-002', type:'FINANCIAL_CORRECTION', title:'Correction fiscale — TG-000002 Q2 2026', description:'Ajustement TVQ suite à révision déclaration — +420$', createdBy:'TAX-003', createdByName:'Nathalie Beausoleil', status:'SUBMITTED', priority:'MEDIUM', createdAt:'2026-08-22T14:00:00Z', updatedAt:'2026-08-22T14:00:00Z', makerCheckerRequired:true },
  { id:'appr-003', type:'DRIVER_REACTIVATION', title:'Réactivation chauffeur — TG-000004', description:'Fatima El-Amrani — Demande de réactivation après correction permis', createdBy:'COMP-002', createdByName:'Marc Tremblay', status:'IN_REVIEW', priority:'HIGH', createdAt:'2026-08-20T10:00:00Z', updatedAt:'2026-08-24T09:00:00Z', makerCheckerRequired:true },
  { id:'appr-004', type:'PLATFORM_CONFIG', title:'Mise à jour clé HMAC — Skip', description:'Nouvelle clé de signature pour webhooks Skip', createdBy:'ADMIN-001', createdByName:'Gérard Lepage', status:'APPROVED', priority:'CRITICAL', createdAt:'2026-08-24T13:00:00Z', updatedAt:'2026-08-24T14:00:00Z', reviewedBy:'TAX-003', makerCheckerRequired:true },
  { id:'appr-005', type:'DOCUMENT_REVIEW', title:'Approbation assurance — TG-000007', description:'Reza Ahmadi — Nouvelle police d\'assurance soumise', createdBy:'LIC-001', createdByName:'Patrick Boivin', status:'APPROVED', priority:'MEDIUM', createdAt:'2026-08-21T11:00:00Z', updatedAt:'2026-08-22T09:00:00Z', reviewedBy:'COMP-002', makerCheckerRequired:false },
]

// ─── LICENSES ────────────────────────────────────────────────
export interface License {
  id: string; licenseNumber: string; type: string; driverId: string
  driverName: string; issueDate: string; expiryDate: string
  status: LicenseStatus; restrictions?: string; vehicleId?: string
  meterInstanceId?: string; issuedBy: string; territory: string
}
export const mockLicenses: License[] = [
  { id:'lic-001', licenseNumber:'TAXI-QC-00001001', type:'Taxi', driverId:'TG-000003', driverName:'Jean-Pierre Côté', issueDate:'2025-10-01', expiryDate:'2026-12-31', status:'VALID', vehicleId:'V003', meterInstanceId:'METER-QC-00001001', issuedBy:'SAAQ', territory:'Québec' },
  { id:'lic-002', licenseNumber:'TAXI-QC-00008231', type:'Taxi', driverId:'TG-000008', driverName:'Lucie Gagné', issueDate:'2025-12-01', expiryDate:'2026-12-15', status:'EXPIRING', vehicleId:'V008', meterInstanceId:'METER-QC-00008231', issuedBy:'SAAQ', territory:'Québec' },
  { id:'lic-003', licenseNumber:'RS-MTL-00000001', type:'Rideshare', driverId:'TG-000001', driverName:'Mohammed Benali', issueDate:'2025-03-15', expiryDate:'2027-03-15', status:'VALID', vehicleId:'V001', issuedBy:'MTQ', territory:'Montréal' },
  { id:'lic-004', licenseNumber:'RS-MTL-00000004', type:'Rideshare', driverId:'TG-000004', driverName:'Fatima El-Amrani', issueDate:'2022-08-05', expiryDate:'2025-08-05', status:'EXPIRED', vehicleId:'V004', issuedBy:'MTQ', territory:'Montréal', restrictions:'SUSPENDED — Dossier administratif' },
  { id:'lic-005', licenseNumber:'DL-MTL-00000005', type:'Delivery', driverId:'TG-000005', driverName:'Alex Nguyen', issueDate:'2025-07-22', expiryDate:'2027-07-22', status:'VALID', vehicleId:'V005', issuedBy:'MTQ', territory:'Montréal' },
  { id:'lic-006', licenseNumber:'TAXI-QC-00000001', type:'Taxi', driverId:'TG-000001', driverName:'Mohammed Benali', issueDate:'2026-01-01', expiryDate:'2026-01-01', status:'REVOKED', issuedBy:'SAAQ', territory:'Montréal', restrictions:'Révoquée suite à vérification' },
  { id:'lic-007', licenseNumber:'RS-MTL-00000007', type:'Rideshare', driverId:'TG-000007', driverName:'Reza Ahmadi', issueDate:'2026-08-15', expiryDate:'2027-12-01', status:'PENDING', vehicleId:'V007', issuedBy:'MTQ', territory:'Montréal' },
]

// ─── VEHICLES ─────────────────────────────────────────────────
export interface Vehicle {
  id: string; vehicleId: string; vin: string; plate: string
  make: string; model: string; year: number; type: string
  driverId: string; driverName: string; status: VehicleStatus
  insuranceExpiry: string; inspectionExpiry: string
  meterInstanceId?: string; licenseId?: string; territory: string
}
export const mockVehicles: Vehicle[] = [
  { id:'v-001', vehicleId:'V001', vin:'2T1BURHE0JC081234', plate:'ABC-1234', make:'Toyota', model:'Camry', year:2022, type:'Taxi/Rideshare', driverId:'TG-000001', driverName:'Mohammed Benali', status:'ACTIVE', insuranceExpiry:'2027-03-15', inspectionExpiry:'2026-12-15', meterInstanceId:'METER-QC-00003210', licenseId:'lic-001', territory:'Montréal' },
  { id:'v-002', vehicleId:'V002', vin:'1G1JC6SH8E4129875', plate:'DEF-5678', make:'Honda', model:'Civic', year:2021, type:'Delivery', driverId:'TG-000002', driverName:'Sophie Tremblay', status:'ACTIVE', insuranceExpiry:'2026-11-20', inspectionExpiry:'2026-09-15', territory:'Montréal' },
  { id:'v-003', vehicleId:'V003', vin:'WAUZZZ4G9DN123456', plate:'GHI-9012', make:'Volkswagen', model:'Passat', year:2020, type:'Taxi', driverId:'TG-000003', driverName:'Jean-Pierre Côté', status:'ACTIVE', insuranceExpiry:'2028-01-10', inspectionExpiry:'2027-01-10', meterInstanceId:'METER-QC-00001001', licenseId:'lic-001', territory:'Québec' },
  { id:'v-004', vehicleId:'V004', vin:'1FADP3F21EL123456', plate:'JKL-3456', make:'Ford', model:'Focus', year:2019, type:'Rideshare', driverId:'TG-000004', driverName:'Fatima El-Amrani', status:'SUSPENDED', insuranceExpiry:'2025-08-05', inspectionExpiry:'2025-08-05', territory:'Montréal' },
  { id:'v-005', vehicleId:'V005', vin:'3VWFE21C04M000001', plate:'MNO-7890', make:'Volkswagen', model:'Jetta', year:2023, type:'Multi', driverId:'TG-000005', driverName:'Alex Nguyen', status:'ACTIVE', insuranceExpiry:'2027-07-22', inspectionExpiry:'2027-04-22', territory:'Montréal' },
  { id:'v-006', vehicleId:'V008', vin:'1HGBH41JXMN109186', plate:'PQR-1234', make:'Honda', model:'Accord', year:2021, type:'Taxi', driverId:'TG-000008', driverName:'Lucie Gagné', status:'UNDER_REVIEW', insuranceExpiry:'2026-12-15', inspectionExpiry:'2026-10-15', meterInstanceId:'METER-QC-00008231', territory:'Québec' },
]

// ─── SERVICE HEALTH ───────────────────────────────────────────
export interface ServiceHealth {
  name: string; status: ServiceStatus; latencyMs: number
  errorRate: number; lastCheck: string; uptime: number
  description: string
}
export const mockServiceHealth: ServiceHealth[] = [
  { name:'API Gateway', status:'HEALTHY', latencyMs:42, errorRate:0.1, lastCheck:'2026-08-24T15:00:00Z', uptime:99.98, description:'Toutes les routes API opérationnelles' },
  { name:'Database (PostgreSQL)', status:'HEALTHY', latencyMs:8, errorRate:0, lastCheck:'2026-08-24T15:00:00Z', uptime:99.99, description:'Connexion primaire + replica en santé' },
  { name:'Revenue Gateway', status:'HEALTHY', latencyMs:95, errorRate:0.3, lastCheck:'2026-08-24T15:00:00Z', uptime:99.95, description:'Pipeline webhook opérationnel' },
  { name:'Tax Engine', status:'HEALTHY', latencyMs:28, errorRate:0, lastCheck:'2026-08-24T15:00:00Z', uptime:100, description:'Calculs TPS/TVQ normaux' },
  { name:'Compliance Engine', status:'HEALTHY', latencyMs:120, errorRate:0.5, lastCheck:'2026-08-24T15:00:00Z', uptime:99.9, description:'Détection anomalies opérationnelle' },
  { name:'Webhook Gateway', status:'DEGRADED', latencyMs:850, errorRate:12, lastCheck:'2026-08-24T15:00:00Z', uptime:94.2, description:'DoorDash + Skip: timeouts — Retry actif' },
  { name:'Notification Service', status:'HEALTHY', latencyMs:55, errorRate:0.1, lastCheck:'2026-08-24T15:00:00Z', uptime:99.8, description:'Email + In-App opérationnels' },
  { name:'Document Service', status:'HEALTHY', latencyMs:180, errorRate:0.2, lastCheck:'2026-08-24T15:00:00Z', uptime:99.7, description:'Upload + review pipeline normal' },
  { name:'Audit Service', status:'HEALTHY', latencyMs:15, errorRate:0, lastCheck:'2026-08-24T15:00:00Z', uptime:100, description:'Journal immuable opérationnel' },
  { name:'Authentication (Supabase)', status:'HEALTHY', latencyMs:62, errorRate:0, lastCheck:'2026-08-24T15:00:00Z', uptime:99.99, description:'Auth + MFA opérationnels' },
]

// ─── INCIDENTS ───────────────────────────────────────────────
export interface Incident {
  id: string; title: string; service: string; severity: string
  status: IncidentStatus; description: string; startedAt: string
  resolvedAt?: string; assignedTo: string; updates: string[]
}
export const mockIncidents: Incident[] = [
  { id:'inc-001', title:'Dégradation Webhook Gateway — DoorDash + Skip', service:'Webhook Gateway', severity:'HIGH', status:'INVESTIGATING', description:'Timeouts répétés sur les webhooks DoorDash et Skip depuis 14h32. File de retry active. 5 webhooks DoorDash + 5 webhooks Skip en dead letter queue.', startedAt:'2026-08-24T14:32:00Z', assignedTo:'ADMIN-001', updates:['14:32 — Dégradation détectée automatiquement','14:38 — Alerte envoyée à l\'équipe infrastructure','14:45 — Investigation en cours — cause probable: expiration clé HMAC Skip','15:00 — Retry manuel lancé — DoorDash OK, Skip toujours KO'] },
  { id:'inc-002', title:'Signature HMAC Skip — Rejet webhooks', service:'Webhook Gateway', severity:'MEDIUM', status:'MITIGATED', description:'5 webhooks Skip rejetés suite à signature invalide. Cause: rotation clé non synchronisée.', startedAt:'2026-08-24T13:48:00Z', resolvedAt:undefined, assignedTo:'ADMIN-001', updates:['13:48 — Rejets détectés','13:55 — Cause identifiée: clé HMAC expirée','14:10 — Nouveau credential soumis pour approbation (Maker-Checker)','14:00 — Approbation reçue — déploiement en cours'] },
]

// ─── PLATFORM ADMIN ───────────────────────────────────────────
export const mockPlatformAdmin = [
  { provider:'uber', name:'Uber', status:'ENABLED' as PlatformAdminStatus, connectedAccounts:18, oauthConfigured:false, webhookConfigured:false, lastEvent:'2026-08-24T14:55:00Z', errorRate:0.8, notes:'MOCK — Credentials officiels requis' },
  { provider:'lyft', name:'Lyft', status:'ENABLED' as PlatformAdminStatus, connectedAccounts:11, oauthConfigured:false, webhookConfigured:false, lastEvent:'2026-08-24T13:10:00Z', errorRate:1.2, notes:'MOCK — Credentials officiels requis' },
  { provider:'doordash', name:'DoorDash', status:'MAINTENANCE' as PlatformAdminStatus, connectedAccounts:14, oauthConfigured:false, webhookConfigured:false, lastEvent:'2026-08-24T14:32:00Z', errorRate:12, notes:'Webhook HMAC en investigation — Incident INC-001' },
  { provider:'instacart', name:'Instacart', status:'ENABLED' as PlatformAdminStatus, connectedAccounts:7, oauthConfigured:false, webhookConfigured:false, lastEvent:'2026-08-24T12:00:00Z', errorRate:0, notes:'MOCK — Credentials officiels requis' },
  { provider:'ubereats', name:'Uber Eats', status:'ENABLED' as PlatformAdminStatus, connectedAccounts:9, oauthConfigured:false, webhookConfigured:false, lastEvent:'2026-08-24T15:01:00Z', errorRate:0.3, notes:'MOCK — Credentials officiels requis' },
  { provider:'skip', name:'Skip', status:'MAINTENANCE' as PlatformAdminStatus, connectedAccounts:6, oauthConfigured:false, webhookConfigured:false, lastEvent:'2026-08-24T13:48:00Z', errorRate:5, notes:'Clé HMAC en cours de renouvellement — Incident INC-002' },
  { provider:'taxi', name:'Taximètre', status:'ENABLED' as PlatformAdminStatus, connectedAccounts:12, oauthConfigured:false, webhookConfigured:false, lastEvent:'2026-08-24T15:02:00Z', errorRate:0, notes:'Intégration interne — Active' },
]

// ─── DATA QUALITY ─────────────────────────────────────────────
export const dataQualityScores = [
  { domain:'Chauffeurs', score:94, grade:'GOOD' as DataQualityGrade, issues:3, total:50, details:'3 profils incomplets — véhicule manquant' },
  { domain:'Véhicules', score:87, grade:'GOOD' as DataQualityGrade, issues:4, total:30, details:'4 inspections expirées ou manquantes' },
  { domain:'Transactions', score:98, grade:'GOOD' as DataQualityGrade, issues:2, total:100, details:'2 transactions sans activity_id résolu' },
  { domain:'Plateformes', score:71, grade:'WARNING' as DataQualityGrade, issues:2, total:7, details:'DoorDash + Skip: webhook health dégradé' },
  { domain:'Taxes', score:96, grade:'GOOD' as DataQualityGrade, issues:1, total:24, details:'1 période fiscale avec écart non résolu' },
  { domain:'Documents', score:62, grade:'WARNING' as DataQualityGrade, issues:8, total:50, details:'5 docs expirés · 3 en attente de révision' },
  { domain:'Licences', score:78, grade:'WARNING' as DataQualityGrade, issues:4, total:20, details:'1 expirée · 1 révoquée · 1 en attente · 1 qui expire bientôt' },
]

// ─── ACTIVITY TIMELINE ────────────────────────────────────────
export const activityTimeline = [
  { time:'15:02', icon:'🚕', event:'Session taximètre fermée', detail:'TG-000008 · METER-QC-00008231 · 45.00$', type:'meter' },
  { time:'15:01', icon:'🍕', event:'Webhook Uber Eats traité', detail:'ORDER_DELIVERED · TG-000005 · 28.50$', type:'webhook' },
  { time:'15:00', icon:'📊', event:'Réconciliation automatique lancée', detail:'7 plateformes · 5 MATCH · 2 REVIEW', type:'system' },
  { time:'14:55', icon:'🚗', event:'Webhook Uber traité', detail:'TRIP_COMPLETED · TG-000001 · 42.50$', type:'webhook' },
  { time:'14:48', icon:'💰', event:'Transaction finalisée', detail:'TXN-2026-00001234 · TG-000009 · 38.20$', type:'transaction' },
  { time:'14:35', icon:'⚖️', event:'Dossier conformité créé', detail:'CASE-2026-0005 · TG-000008 · Meter sans TX', type:'compliance' },
  { time:'14:33', icon:'📋', event:'Taxes calculées', detail:'TG-000001 · TPS 2.12$ · TVQ 4.23$', type:'tax' },
  { time:'14:32', icon:'⚠️', event:'Dégradation webhook détectée', detail:'DoorDash + Skip · Incident INC-001 ouvert', type:'incident' },
  { time:'14:22', icon:'👁️', event:'Accès profil financier', detail:'COMP-002 consulte TG-000009 · Révision conformité', type:'audit' },
  { time:'14:10', icon:'✅', event:'Approbation workflow', detail:'APPR-004 · Clé HMAC Skip · Gérard Lepage', type:'approval' },
]

// ─── SYSTEM SETTINGS ─────────────────────────────────────────
export const systemSettings = {
  general: { platformName:'TAXIMÈTRE.GOV', environment:'PILOT', defaultLanguage:'fr', defaultTimezone:'America/Toronto', maintenanceMode:false },
  security: { mfaRequired:true, sessionTimeoutMinutes:30, maxLoginAttempts:5, passwordMinLength:12, auditAllAccess:true },
  tax: { defaultJurisdiction:'QC-CA', tpsRate:0.05, tvqRate:0.09975, registrationThreshold:30000 },
  notifications: { emailEnabled:true, smsEnabled:false, pushEnabled:true, inAppEnabled:true },
  retention: { transactionYears:7, auditYears:10, documentYears:7 },
}

// ─── CALENDAR EVENTS ──────────────────────────────────────────
export const calendarEvents = [
  { id:'cal-001', date:'2026-08-25', title:'Deadline HMAC Skip', type:'DEADLINE', priority:'CRITICAL', assignedTo:'ADMIN-001' },
  { id:'cal-002', date:'2026-08-28', title:'Vérification METER-QC-00003210', type:'TASK', priority:'HIGH', assignedTo:'LIC-001' },
  { id:'cal-003', date:'2026-08-30', title:'Révision CASE-2026-0001', type:'COMPLIANCE', priority:'HIGH', assignedTo:'COMP-002' },
  { id:'cal-004', date:'2026-09-01', title:'Renouvellement 23 licences taxi', type:'LICENSE', priority:'HIGH', assignedTo:'LIC-001' },
  { id:'cal-005', date:'2026-09-01', title:'Fin période fiscale Q2 — Rappel', type:'TAX', priority:'MEDIUM', assignedTo:'TAX-003' },
  { id:'cal-006', date:'2026-09-05', title:'Rapport fiscal mensuel août', type:'REPORT', priority:'LOW', assignedTo:'TAX-003' },
  { id:'cal-007', date:'2026-09-15', title:'Deadline document assurance TG-000002', type:'DOCUMENT', priority:'MEDIUM', assignedTo:'COMP-002' },
  { id:'cal-008', date:'2026-09-15', title:'Période Q3 — Remise TPS/TVQ', type:'TAX', priority:'HIGH', assignedTo:'TAX-003' },
  { id:'cal-009', date:'2026-12-15', title:'Expiration licence — TG-000008', type:'LICENSE', priority:'MEDIUM', assignedTo:'LIC-001' },
  { id:'cal-010', date:'2026-12-31', title:'Clôture exercice fiscal 2026', type:'TAX', priority:'CRITICAL', assignedTo:'TAX-003' },
]
