// ============================================================
// TAXIMÈTRE.GOV — OPERATIONS ENGINE
// Phase 2 — Step 29: Monitoring · Events · Notifications · Alerts · Incidents
// ============================================================
//
// RÈGLES ABSOLUES:
// 1. Cet engine OBSERVE les services existants — pas de deuxième système de données
// 2. Event idempotency: event_id UNIQUE — jamais traité deux fois
// 3. DELIVERY: taximeterEnabled = toujours false (jamais contournable)
// 4. GPS anomaly ≠ preuve automatique de fraude → REVIEW_REQUIRED
// 5. Provider status: jamais CONNECTED sans auth réelle → MOCK_ONLY
// 6. Données financières: jamais supprimées lors d'un incident
// 7. App → Backend: jamais accès direct DB depuis Driver App
// 8. Logs: jamais password/OTP/token/NAS en clair
// ============================================================

// ─── EVENT BUS ───────────────────────────────────────────────

export type SystemEventType =
  // Driver lifecycle
  | 'DRIVER_ONLINE' | 'DRIVER_OFFLINE' | 'DRIVER_SUSPENDED' | 'DRIVER_EMERGENCY'
  // Trip/Delivery
  | 'TRIP_STARTED' | 'TRIP_COMPLETED' | 'TRIP_CANCELLED' | 'TRIP_DISPUTED'
  | 'DELIVERY_STARTED' | 'DELIVERY_COMPLETED' | 'DELIVERY_CANCELLED'
  // Taximeter
  | 'TAXIMETER_STARTED' | 'TAXIMETER_STOPPED' | 'TAXIMETER_LOCKED' | 'TAXIMETER_ERROR'
  // Payment/Revenue/Ledger
  | 'PAYMENT_COMPLETED' | 'PAYMENT_FAILED' | 'REVENUE_CREATED' | 'LEDGER_UPDATED'
  // Webhook/Provider
  | 'WEBHOOK_RECEIVED' | 'WEBHOOK_PROCESSED' | 'WEBHOOK_FAILED' | 'WEBHOOK_DUPLICATE'
  | 'PROVIDER_CONNECTED' | 'PROVIDER_DISCONNECTED' | 'PROVIDER_DEGRADED'
  // Tax/Document
  | 'TAX_REPORT_CREATED' | 'TAX_REPORT_FINALIZED' | 'TAX_ANOMALY_DETECTED'
  | 'DOCUMENT_VERIFIED' | 'DOCUMENT_EXPIRING' | 'DOCUMENT_EXPIRED'
  // Security
  | 'SECURITY_EVENT' | 'LOGIN_FAILURE' | 'DEVICE_REVOKED' | 'TAMPER_DETECTED'
  // GPS
  | 'GPS_LOST' | 'GPS_RESTORED' | 'GPS_ANOMALY'
  // System
  | 'SERVICE_DEGRADED' | 'SERVICE_DOWN' | 'INCIDENT_CREATED' | 'MAINTENANCE_MODE'

export type EventPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW'

export interface SystemEvent {
  id: string
  eventId: string             // UNIQUE — idempotency key
  eventType: SystemEventType
  priority: EventPriority
  sourceService: string
  actorId: string | null
  driverId: string | null
  resourceType: string | null
  resourceId: string | null
  correlationId: string       // Trace end-to-end
  timestamp: string
  status: 'PENDING' | 'PROCESSED' | 'DUPLICATE' | 'FAILED' | 'DEAD_LETTER'
  metadata: Record<string, string | number | boolean | null>
  // Never log: password/OTP/token/NAS
}

// ─── DRIVER LIVE STATUS ───────────────────────────────────────

export type DriverLiveStatus =
  | 'OFFLINE' | 'ONLINE' | 'AVAILABLE' | 'ON_TRIP'
  | 'ON_DELIVERY' | 'PAUSED' | 'SUSPENDED' | 'EMERGENCY'

export type TaximeterLiveStatus =
  | 'DISABLED' | 'READY' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ERROR'

export type GPSHealth = 'GOOD' | 'DEGRADED' | 'LOST' | 'PERMISSION_DENIED' | 'MOCK_SUSPECTED'

export interface DriverLiveEntry {
  driverId: string
  driverNumber: string
  status: DriverLiveStatus
  serviceMode: 'TAXI' | 'RIDESHARE' | 'DELIVERY' | 'PERSONAL' | null
  taximeterStatus: TaximeterLiveStatus
  // taximeterStatus = DISABLED when serviceMode = DELIVERY (always)
  gpsHealth: GPSHealth
  currentTripId: string | null
  lastUpdate: string
  vehicleId: string | null
  correlationId: string
}

// ─── ALERT ───────────────────────────────────────────────────

export type AlertSeverity = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL'
export type AlertStatus = 'CREATED' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED'

export interface Alert {
  id: string
  severity: AlertSeverity
  type: SystemEventType | 'WEBHOOK_SPIKE' | 'API_OUTAGE' | 'PAYMENT_SPIKE' | 'QUEUE_BACKLOG'
  source: string
  resource: string | null
  message: string
  createdAt: string
  acknowledgedAt: string | null
  resolvedAt: string | null
  assignedTo: string | null
  status: AlertStatus
  correlationId: string
}

// ─── INCIDENT ─────────────────────────────────────────────────

export type IncidentType =
  | 'API_OUTAGE' | 'DATABASE' | 'PAYMENT' | 'WEBHOOK'
  | 'SECURITY' | 'GPS' | 'PROVIDER' | 'TAX' | 'DOCUMENT' | 'OTHER'

export type IncidentStatus = 'OPEN' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'MITIGATING' | 'RESOLVED' | 'CLOSED'

export interface Incident {
  id: string
  severity: AlertSeverity
  incidentType: IncidentType
  description: string
  affectedService: string
  startedAt: string
  resolvedAt: string | null
  owner: string | null
  status: IncidentStatus
  timeline: { timestamp: string; actor: string; action: string; comment: string }[]
  // Financial data: NEVER deleted during incident — preserved always
}

// ─── SYSTEM HEALTH ────────────────────────────────────────────

export type ServiceStatus = 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'MAINTENANCE'

export interface ServiceHealth {
  service: string
  status: ServiceStatus
  latencyMs: number | null
  errorRate: number | null       // 0.0 - 1.0
  lastChecked: string
  version: string | null
  note: string | null
}

// ─── WEBHOOK FAILURE QUEUE ────────────────────────────────────

export interface WebhookFailure {
  id: string
  provider: string
  eventId: string
  errorCode: string
  attempts: number
  nextRetryAt: string | null
  status: 'QUEUED' | 'PROCESSING' | 'RETRYING' | 'FAILED' | 'DEAD_LETTER'
  createdAt: string
}

// ─── JOB ──────────────────────────────────────────────────────

export type JobType = 'EXPORT' | 'REPORT_GENERATION' | 'NOTIFICATION_BATCH' | 'RECONCILIATION' | 'SYNC'
export type JobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'RETRYING' | 'CANCELLED'

export interface Job {
  id: string
  jobType: JobType
  status: JobStatus
  priority: EventPriority
  attempts: number
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  error: string | null
  metadata: Record<string, string | number>
}

// ─── SYNC / OFFLINE ───────────────────────────────────────────

export type SyncConflictType = 'DUPLICATE' | 'STALE_DATA' | 'STATE_CONFLICT' | 'AMOUNT_CONFLICT'

export interface SyncConflict {
  id: string
  driverId: string
  conflictType: SyncConflictType
  localData: Record<string, unknown>
  serverData: Record<string, unknown>
  resolution: 'SERVER_WINS' | 'LOCAL_WINS' | 'MANUAL_REVIEW' | 'PENDING'
  detectedAt: string
  resolvedAt: string | null
  // Critical financial ops: not considered final from local state alone
}

export interface OfflineQueueEntry {
  queueId: string
  driverId: string
  eventType: SystemEventType
  payload: Record<string, unknown>
  createdOfflineAt: string
  syncStatus: 'PENDING' | 'SYNCING' | 'SYNCED' | 'CONFLICT' | 'FAILED'
  attempts: number
}

// ─── NOTIFICATION ─────────────────────────────────────────────

export type NotificationChannel = 'PUSH' | 'EMAIL' | 'SMS' | 'IN_APP'
export type NotificationType =
  | 'SECURITY' | 'TRIP' | 'DELIVERY' | 'PAYMENT' | 'REVENUE'
  | 'TAX' | 'DOCUMENT' | 'PROVIDER' | 'SYSTEM' | 'ACCOUNT'

export interface OpsNotification {
  id: string
  userId: string
  notifType: NotificationType
  priority: EventPriority
  title: string
  body: string
  channel: NotificationChannel
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
  createdAt: string
  sentAt: string | null
  readAt: string | null
  correlationId: string
}

// ─── FEATURE FLAGS ────────────────────────────────────────────

export interface FeatureFlag {
  key: string
  label: string
  enabled: boolean
  description: string
  // Allows progressive activation — pilot before production
}

export const FEATURE_FLAGS: FeatureFlag[] = [
  { key:'taximeter_enabled',      label:'Taximètre numérique', enabled:true,  description:'Moteur taximètre GPS actif' },
  { key:'delivery_enabled',       label:'Mode livraison',      enabled:true,  description:'DoorDash/Instacart/UberEats/Skip' },
  { key:'provider_uber_enabled',  label:'Intégration Uber',    enabled:false, description:'MOCK_ONLY — approbation partenaire requise' },
  { key:'provider_lyft_enabled',  label:'Intégration Lyft',    enabled:false, description:'MOCK_ONLY — contrat partenaire requis' },
  { key:'provider_doordash_enabled', label:'Intégration DoorDash', enabled:false, description:'MOCK_ONLY' },
  { key:'live_map_enabled',       label:'Carte temps réel',    enabled:false, description:'Pilote gouvernemental — privacy review requise' },
  { key:'tax_auto_submit',        label:'Soumission fiscale auto', enabled:false, description:'Désactivé — MANUAL_EXPORT uniquement' },
  { key:'new_tax_engine',         label:'Nouveau moteur fiscal', enabled:true, description:'TaxRuleVersion versionnée' },
]

// ─── PILOT CONFIGURATION ──────────────────────────────────────

export interface PilotConfiguration {
  pilotId: string
  name: string
  jurisdiction: 'CA-QC'
  activeCities: string[]
  activeServices: ('TAXI' | 'RIDESHARE' | 'DELIVERY')[]
  maxDrivers: number
  currentDriverCount: number
  startDate: string
  endDate: string | null
  status: 'PLANNING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED'
  notes: string
}

// ─── RETENTION POLICY ─────────────────────────────────────────

export interface RetentionPolicy {
  dataCategory: string
  retentionDays: number | null   // null = configurable per jurisdiction
  legalBasis: string
  canDelete: boolean
  note: string
}

export const RETENTION_POLICIES: RetentionPolicy[] = [
  { dataCategory:'FINANCIAL_TRANSACTIONS', retentionDays:null, legalBasis:'Obligations fiscales QC/Canada', canDelete:false, note:'Configurable selon juridiction — minimum légal à déterminer' },
  { dataCategory:'GPS_SESSIONS', retentionDays:30, legalBasis:'Audit taximètre — politique privacy', canDelete:true, note:'Agrégé après 7j · Raw après 30j' },
  { dataCategory:'AUDIT_LOGS', retentionDays:null, legalBasis:'Obligations gouvernementales', canDelete:false, note:'Conservation selon exigences réglementaires' },
  { dataCategory:'DOCUMENTS', retentionDays:null, legalBasis:'Règles gouvernementales applicables', canDelete:false, note:'Conservation requise pour conformité' },
  { dataCategory:'NOTIFICATIONS', retentionDays:90, legalBasis:'Opérationnel', canDelete:true, note:'90j puis archivage' },
  { dataCategory:'WEBHOOK_EVENTS', retentionDays:90, legalBasis:'Réconciliation · audit', canDelete:false, note:'Events financiers: conservation permanente' },
  { dataCategory:'SESSION_LOGS', retentionDays:90, legalBasis:'Sécurité · audit', canDelete:true, note:'IP hashée · jamais en clair' },
]

// ─── TAMPER EVENT ─────────────────────────────────────────────

export interface TamperEvent {
  id: string
  driverId: string
  deviceId: string
  anomalyType: 'TAXIMETER_WITHOUT_TRIP' | 'GPS_UNAVAILABLE' | 'CLOCK_ANOMALY'
    | 'APP_TERMINATION' | 'INVALID_STATE' | 'MOCK_GPS_SUSPECTED'
  description: string
  detectedAt: string
  status: 'OPEN' | 'REVIEW_REQUIRED' | 'FALSE_POSITIVE' | 'ESCALATED'
  // CRITICAL: Anomaly ≠ fraud. Never auto-accuse. Always REVIEW_REQUIRED first.
  note: 'REVIEW_REQUIRED — pas une preuve automatique de fraude'
}

// ─── SYSTEM ANNOUNCEMENT ──────────────────────────────────────

export interface SystemAnnouncement {
  id: string
  title: string
  message: string
  severity: AlertSeverity
  affectedServices: string[]
  startAt: string
  endAt: string | null
  isPublic: boolean            // No private driver data on public page
  createdBy: string
}

// ─── MOCK DATA ────────────────────────────────────────────────

export const mockLiveDrivers: DriverLiveEntry[] = [
  { driverId:'DR-00001234', driverNumber:'DR-00001234', status:'ON_TRIP', serviceMode:'TAXI', taximeterStatus:'ACTIVE', gpsHealth:'GOOD', currentTripId:'TX-2026-A1B2C3D4', lastUpdate:new Date().toISOString(), vehicleId:'V-QC-001234', correlationId:'COR-001' },
  { driverId:'DR-00002345', driverNumber:'DR-00002345', status:'AVAILABLE', serviceMode:'RIDESHARE', taximeterStatus:'DISABLED', gpsHealth:'GOOD', currentTripId:null, lastUpdate:new Date().toISOString(), vehicleId:'V-QC-002345', correlationId:'COR-002' },
  { driverId:'DR-00003456', driverNumber:'DR-00003456', status:'ON_DELIVERY', serviceMode:'DELIVERY', taximeterStatus:'DISABLED', gpsHealth:'GOOD', currentTripId:'DD-2026-B3C4D5', lastUpdate:new Date().toISOString(), vehicleId:'V-QC-003456', correlationId:'COR-003' },
  { driverId:'DR-00004567', driverNumber:'DR-00004567', status:'OFFLINE', serviceMode:null, taximeterStatus:'DISABLED', gpsHealth:'LOST', currentTripId:null, lastUpdate:new Date(Date.now()-3600000).toISOString(), vehicleId:null, correlationId:'COR-004' },
]

export const mockSystemEvents: SystemEvent[] = [
  { id:'EVT-001', eventId:'SYS-EVT-TRIP-001', eventType:'TRIP_STARTED', priority:'NORMAL', sourceService:'taximeter', actorId:'DR-00001234', driverId:'DR-00001234', resourceType:'TRIP', resourceId:'TX-2026-A1B2C3D4', correlationId:'COR-001', timestamp:new Date(Date.now()-1800000).toISOString(), status:'PROCESSED', metadata:{serviceMode:'TAXI',taximeterEnabled:true,tariffVersion:'TAR-QC-2026-V1'} },
  { id:'EVT-002', eventId:'SYS-EVT-WH-001', eventType:'WEBHOOK_RECEIVED', priority:'NORMAL', sourceService:'webhook', actorId:null, driverId:'DR-00001234', resourceType:'WEBHOOK', resourceId:'evt_uber_8F72A91_pay', correlationId:'COR-001', timestamp:new Date(Date.now()-1200000).toISOString(), status:'PROCESSED', metadata:{provider:'Uber',eventType:'payment.succeeded',signatureVerified:true} },
  { id:'EVT-003', eventId:'SYS-EVT-WH-002', eventType:'WEBHOOK_DUPLICATE', priority:'LOW', sourceService:'webhook', actorId:null, driverId:null, resourceType:'WEBHOOK', resourceId:'evt_uber_8F72A91_pay', correlationId:'COR-001', timestamp:new Date(Date.now()-1199000).toISOString(), status:'DUPLICATE', metadata:{provider:'Uber',duplicate:true,eventIdAlreadySeen:true} },
  { id:'EVT-004', eventId:'SYS-EVT-PAY-FAIL', eventType:'PAYMENT_FAILED', priority:'HIGH', sourceService:'payment', actorId:'DR-00001234', driverId:'DR-00001234', resourceType:'PAYMENT', resourceId:'PAY-010', correlationId:'COR-005', timestamp:new Date(Date.now()-600000).toISOString(), status:'PROCESSED', metadata:{reason:'card_declined',walletCredited:false} },
  { id:'EVT-005', eventId:'SYS-EVT-GPS-ANOM', eventType:'GPS_ANOMALY', priority:'HIGH', sourceService:'gps', actorId:'DR-00001234', driverId:'DR-00001234', resourceType:'GPS', resourceId:'GPS-GAP-001', correlationId:'COR-001', timestamp:new Date(Date.now()-900000).toISOString(), status:'PROCESSED', metadata:{reason:'accuracy_280m',filtered:true,kmAdded:false} },
  { id:'EVT-006', eventId:'SYS-EVT-SEC-001', eventType:'SECURITY_EVENT', priority:'CRITICAL', sourceService:'auth', actorId:'uid-external-attacker', driverId:null, resourceType:'AUTH', resourceId:null, correlationId:'COR-006', timestamp:new Date(Date.now()-300000).toISOString(), status:'PROCESSED', metadata:{type:'LOGIN_FAILURE',attempts:6,rateLimited:true} },
]

export const mockAlerts: Alert[] = [
  { id:'ALT-001', severity:'WARNING', type:'PROVIDER_DEGRADED', source:'provider-monitor', resource:'Lyft', message:'Lyft OAuth REAUTH_REQUIRED — 14 webhooks échoués', createdAt:new Date(Date.now()-3600000).toISOString(), acknowledgedAt:new Date(Date.now()-3000000).toISOString(), resolvedAt:null, assignedTo:'ADMIN-GOV-001', status:'INVESTIGATING', correlationId:'COR-007' },
  { id:'ALT-002', severity:'HIGH', type:'PAYMENT_FAILED', source:'payment-monitor', resource:'PAY-010', message:'Paiement échoué — carte refusée (TRIP-TAXI-004) · Wallet non crédité', createdAt:new Date(Date.now()-600000).toISOString(), acknowledgedAt:null, resolvedAt:null, assignedTo:null, status:'CREATED', correlationId:'COR-005' },
  { id:'ALT-003', severity:'CRITICAL', type:'SECURITY_EVENT', source:'security', resource:'AUTH', message:'6 tentatives de connexion échouées — rate limit activé · uid-external-attacker', createdAt:new Date(Date.now()-300000).toISOString(), acknowledgedAt:new Date(Date.now()-250000).toISOString(), resolvedAt:new Date(Date.now()-200000).toISOString(), assignedTo:'ADMIN-GOV-001', status:'RESOLVED', correlationId:'COR-006' },
  { id:'ALT-004', severity:'INFO', type:'WEBHOOK_DUPLICATE', source:'webhook', resource:'evt_uber_8F72A91_pay', message:'Webhook Uber dupliqué reçu — idempotency protégée · aucun doublon', createdAt:new Date(Date.now()-1199000).toISOString(), acknowledgedAt:null, resolvedAt:new Date(Date.now()-1190000).toISOString(), assignedTo:null, status:'CLOSED', correlationId:'COR-001' },
]

export const mockIncidents: Incident[] = [
  {
    id:'INC-001', severity:'WARNING', incidentType:'PROVIDER', description:'Lyft OAuth token expiré — REAUTH_REQUIRED · Webhooks échoués',
    affectedService:'Lyft · Revenue · Webhook', startedAt:new Date(Date.now()-3600000).toISOString(), resolvedAt:null,
    owner:'ADMIN-GOV-001', status:'INVESTIGATING',
    timeline:[
      { timestamp:new Date(Date.now()-3600000).toISOString(), actor:'SYSTEM', action:'DETECTED', comment:'OAuth token Lyft REAUTH_REQUIRED détecté' },
      { timestamp:new Date(Date.now()-3300000).toISOString(), actor:'ADMIN-GOV-001', action:'ACKNOWLEDGED', comment:'Investigation en cours' },
    ],
  },
]

export const mockServiceHealth: ServiceHealth[] = [
  { service:'API Gateway',    status:'HEALTHY',    latencyMs:42,   errorRate:0.001, lastChecked:new Date().toISOString(), version:'1.2.0', note:null },
  { service:'Auth Service',   status:'HEALTHY',    latencyMs:28,   errorRate:0,     lastChecked:new Date().toISOString(), version:'1.1.5', note:null },
  { service:'Tax Engine',     status:'HEALTHY',    latencyMs:85,   errorRate:0,     lastChecked:new Date().toISOString(), version:'1.0.3', note:null },
  { service:'Payment',        status:'HEALTHY',    latencyMs:110,  errorRate:0.002, lastChecked:new Date().toISOString(), version:'1.1.0', note:null },
  { service:'Ledger',         status:'HEALTHY',    latencyMs:35,   errorRate:0,     lastChecked:new Date().toISOString(), version:'1.0.1', note:null },
  { service:'GPS Engine',     status:'HEALTHY',    latencyMs:20,   errorRate:0.001, lastChecked:new Date().toISOString(), version:'1.2.1', note:null },
  { service:'Webhooks',       status:'DEGRADED',   latencyMs:340,  errorRate:0.085, lastChecked:new Date().toISOString(), version:'1.0.5', note:'Lyft REAUTH_REQUIRED — queue retry active' },
  { service:'Provider: Uber', status:'HEALTHY',    latencyMs:null, errorRate:0.014, lastChecked:new Date().toISOString(), version:null, note:'MOCK_ONLY' },
  { service:'Provider: Lyft', status:'DEGRADED',   latencyMs:null, errorRate:0.161, lastChecked:new Date().toISOString(), version:null, note:'MOCK_ONLY · REAUTH_REQUIRED' },
  { service:'Provider: Skip', status:'DOWN',       latencyMs:null, errorRate:1.0,   lastChecked:new Date().toISOString(), version:null, note:'MOCK_ONLY · Timeout — évaluation API en cours' },
  { service:'Storage',        status:'HEALTHY',    latencyMs:55,   errorRate:0,     lastChecked:new Date().toISOString(), version:null, note:'Accès via signed URLs uniquement' },
  { service:'Notifications',  status:'HEALTHY',    latencyMs:65,   errorRate:0.003, lastChecked:new Date().toISOString(), version:'1.0.2', note:null },
]

export const mockWebhookFailures: WebhookFailure[] = [
  { id:'WHF-001', provider:'Lyft', eventId:'evt_lyft_trip_001', errorCode:'OAUTH_TOKEN_EXPIRED', attempts:3, nextRetryAt:new Date(Date.now()+300000).toISOString(), status:'RETRYING', createdAt:new Date(Date.now()-1800000).toISOString() },
  { id:'WHF-002', provider:'Skip', eventId:'evt_skip_delivery_002', errorCode:'CONNECTION_TIMEOUT', attempts:5, nextRetryAt:null, status:'DEAD_LETTER', createdAt:new Date(Date.now()-7200000).toISOString() },
]

export const mockJobs: Job[] = [
  { id:'JOB-001', jobType:'REPORT_GENERATION', status:'COMPLETED', priority:'NORMAL', attempts:1, createdAt:new Date(Date.now()-3600000).toISOString(), startedAt:new Date(Date.now()-3590000).toISOString(), completedAt:new Date(Date.now()-3540000).toISOString(), error:null, metadata:{reportType:'TPS-Q2',driverId:'DR-00001234'} },
  { id:'JOB-002', jobType:'RECONCILIATION', status:'RUNNING', priority:'HIGH', attempts:1, createdAt:new Date(Date.now()-600000).toISOString(), startedAt:new Date(Date.now()-595000).toISOString(), completedAt:null, error:null, metadata:{provider:'DoorDash',period:'2026-08'} },
  { id:'JOB-003', jobType:'EXPORT', status:'QUEUED', priority:'NORMAL', attempts:0, createdAt:new Date(Date.now()-60000).toISOString(), startedAt:null, completedAt:null, error:null, metadata:{type:'revenue_csv',requestedBy:'DR-00001234'} },
]

export const mockOpsNotifications: OpsNotification[] = [
  { id:'NOPS-001', userId:'DR-00001234', notifType:'DOCUMENT', priority:'HIGH', title:'📄 Document expirant bientôt', body:'Votre inspection mécanique expire dans 35 jours. Planifiez votre renouvellement.', channel:'IN_APP', status:'READ', createdAt:new Date(Date.now()-86400000).toISOString(), sentAt:new Date(Date.now()-86400000).toISOString(), readAt:new Date(Date.now()-82000000).toISOString(), correlationId:'COR-DOC-001' },
  { id:'NOPS-002', userId:'DR-00001234', notifType:'PAYMENT', priority:'NORMAL', title:'💳 Paiement confirmé', body:'Paiement taxi carte: 47.50$ · TRIP-TAXI-001 · Wallet crédité.', channel:'PUSH', status:'DELIVERED', createdAt:new Date(Date.now()-1800000).toISOString(), sentAt:new Date(Date.now()-1799000).toISOString(), readAt:null, correlationId:'COR-001' },
  { id:'NOPS-003', userId:'DR-00001234', notifType:'PROVIDER', priority:'HIGH', title:'🔄 Lyft — Réautorisation requise', body:'Votre connexion Lyft nécessite une nouvelle authentification OAuth.', channel:'IN_APP', status:'SENT', createdAt:new Date(Date.now()-3600000).toISOString(), sentAt:new Date(Date.now()-3599000).toISOString(), readAt:null, correlationId:'COR-007' },
  { id:'NOPS-004', userId:'DR-00001234', notifType:'SECURITY', priority:'CRITICAL', title:'🚨 Tentative de connexion bloquée', body:'6 tentatives échouées détectées. Votre compte est protégé. Vérifiez si c\'est vous.', channel:'EMAIL', status:'SENT', createdAt:new Date(Date.now()-300000).toISOString(), sentAt:new Date(Date.now()-299000).toISOString(), readAt:null, correlationId:'COR-006' },
]

export const mockPilot: PilotConfiguration = {
  pilotId:'PILOT-QC-2026', name:'Pilote Taximètre.GOV Québec 2026', jurisdiction:'CA-QC',
  activeCities:['Montréal','Québec','Laval'], activeServices:['TAXI','RIDESHARE','DELIVERY'],
  maxDrivers:50, currentDriverCount:4, startDate:'2026-01-01', endDate:'2026-12-31',
  status:'ACTIVE',
  notes:'isPilot=true · Homologation réglementaire officielle requise avant déploiement commercial',
}

export const mockSyncConflicts: SyncConflict[] = [
  { id:'SC-001', driverId:'DR-00001234', conflictType:'STALE_DATA', localData:{tripId:'TX-2026-A1B2C3D4',fareLocal:27.80}, serverData:{tripId:'TX-2026-A1B2C3D4',fareServer:28.01}, resolution:'SERVER_WINS', detectedAt:new Date(Date.now()-3600000).toISOString(), resolvedAt:new Date(Date.now()-3590000).toISOString() },
]

export const mockAnnouncements: SystemAnnouncement[] = [
  { id:'ANN-001', title:'Maintenance Lyft — OAuth', message:'La connexion Lyft nécessite une réauthorisation. Rendez-vous dans Paramètres > Providers.', severity:'WARNING', affectedServices:['Lyft','Revenue'], startAt:new Date(Date.now()-3600000).toISOString(), endAt:null, isPublic:false, createdBy:'ADMIN-GOV-001' },
]

// ─── HELPERS ─────────────────────────────────────────────────

export const fmt = (v: number) => new Intl.NumberFormat('fr-CA', { style:'currency', currency:'CAD' }).format(v)

export const DRIVER_STATUS_CONF: Record<DriverLiveStatus, { icon: string; color: string; dot: string }> = {
  OFFLINE:     { icon:'⚫', color:'text-slate-500',  dot:'bg-slate-600' },
  ONLINE:      { icon:'🟢', color:'text-green-400',  dot:'bg-green-500' },
  AVAILABLE:   { icon:'🟢', color:'text-green-400',  dot:'bg-green-400 animate-pulse' },
  ON_TRIP:     { icon:'🚕', color:'text-qc-blue-light', dot:'bg-blue-500' },
  ON_DELIVERY: { icon:'📦', color:'text-orange-400', dot:'bg-orange-500' },
  PAUSED:      { icon:'⏸',  color:'text-amber-400',  dot:'bg-amber-500 animate-pulse' },
  SUSPENDED:   { icon:'🚫', color:'text-red-400',    dot:'bg-red-500' },
  EMERGENCY:   { icon:'🆘', color:'text-red-400',    dot:'bg-red-500 animate-pulse' },
}

export const SERVICE_STATUS_CONF: Record<ServiceStatus, { icon: string; color: string; bg: string }> = {
  HEALTHY:     { icon:'🟢', color:'text-green-400',  bg:'bg-green-500/10' },
  DEGRADED:    { icon:'🟡', color:'text-amber-400',  bg:'bg-amber-500/10' },
  DOWN:        { icon:'🔴', color:'text-red-400',    bg:'bg-red-500/10' },
  MAINTENANCE: { icon:'🔧', color:'text-blue-400',   bg:'bg-blue-500/10' },
}

export const ALERT_SEVERITY_CONF: Record<AlertSeverity, { icon: string; color: string; bg: string }> = {
  INFO:     { icon:'ℹ️', color:'text-blue-400',  bg:'bg-blue-500/10' },
  WARNING:  { icon:'⚠️', color:'text-amber-400', bg:'bg-amber-500/10' },
  HIGH:     { icon:'🔴', color:'text-red-400',   bg:'bg-red-500/10' },
  CRITICAL: { icon:'🚨', color:'text-red-400',   bg:'bg-red-500/15' },
}

export const PRIORITY_CONF: Record<EventPriority, { color: string; label: string }> = {
  CRITICAL: { color:'text-red-400',    label:'CRITIQUE' },
  HIGH:     { color:'text-orange-400', label:'HAUTE' },
  NORMAL:   { color:'text-blue-400',   label:'NORMALE' },
  LOW:      { color:'text-slate-500',  label:'BASSE' },
}
