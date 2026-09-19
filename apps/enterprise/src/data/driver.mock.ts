// ============================================================
// TAXIMÈTRE.GOV — DRIVER APP MOCK DATA (DEMO / SIMULATION)
// Phase 2 — Step 11: Driver Profile & Permissions
// ============================================================

// ─── CORE TYPES ──────────────────────────────────────────────
export type ActivityType = 'TAXI' | 'RIDESHARE' | 'FOOD_DELIVERY' | 'GROCERY' | 'INDEPENDENT_DELIVERY'
export type ActivityStatus = 'AVAILABLE' | 'PENDING' | 'AUTHORIZED' | 'ONLINE' | 'OFFLINE' | 'SUSPENDED' | 'EXPIRED' | 'BLOCKED'
export type DriverStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'DEACTIVATED' | 'UNDER_REVIEW'
export type DocStatus = 'VALID' | 'EXPIRING' | 'EXPIRED' | 'PENDING' | 'REJECTED' | 'UNDER_REVIEW'
export type PlatformStatus = 'NOT_CONNECTED' | 'PENDING' | 'CONNECTED' | 'EXPIRED' | 'DISCONNECTED' | 'ERROR' | 'SUSPENDED' | 'MAINTENANCE'
export type OnboardingStatus = 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED'
export type ChangeRequestStatus = 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED'
export type SyncStatus = 'SYNCED' | 'PENDING' | 'FAILED' | 'REVIEW_REQUIRED'

// ─── TAXIMETER RULE (CENTRAL RULE — NEVER BYPASS) ────────────
// Backend must also enforce this — frontend alone is insufficient
export const TAXIMETER_ENABLED_BY_ACTIVITY: Record<ActivityType, boolean> = {
  TAXI: true,           // ← TAXI: Taximètre ACTIF obligatoire
  RIDESHARE: false,     // ← Provider calculates price — NO taximeter
  FOOD_DELIVERY: false, // ← Provider calculates price — NO taximeter
  GROCERY: false,       // ← Provider calculates price — NO taximeter
  INDEPENDENT_DELIVERY: false, // ← Configurable — default OFF
}

// ─── DRIVER PROFILE ─────────────────────────────────────────
export const mockDriver = {
  // Internal identity
  driverId: 'DR-00001234',
  governmentId: 'TG-000001',
  accountStatus: 'ACTIVE' as DriverStatus,

  // Personal
  firstName: 'Mohamed',
  lastName: 'Benali',
  preferredName: 'Mo',
  dateOfBirth: '1985-03-15',
  photo: null as string | null,
  phone: '+1 (514) 555-0123',
  email: 'mohamed.benali@example.com',

  // Address
  address: '1234 Rue Sainte-Catherine O',
  city: 'Montréal',
  province: 'Québec',
  postalCode: 'H3G 1M8',
  country: 'Canada',

  // Account
  verificationStatus: 'VERIFIED' as 'VERIFIED' | 'PENDING' | 'SUSPENDED' | 'DEACTIVATED',
  mfaEnabled: true,
  biometricEnabled: true,
  deviceRegistered: true,
  createdAt: '2024-03-15T00:00:00Z',
  lastLogin: '2026-08-24T08:30:00Z',

  // Authorized activities
  authorizedActivities: ['TAXI', 'RIDESHARE', 'FOOD_DELIVERY'] as ActivityType[],
  activeActivity: null as ActivityType | null,
}

// ─── DRIVER ACTIVITIES ────────────────────────────────────────
export interface DriverActivity {
  activityType: ActivityType
  status: ActivityStatus
  taximeterEnabled: boolean  // Derived from TAXIMETER_ENABLED_BY_ACTIVITY — never override
  authorizationStatus: 'AUTHORIZED' | 'PENDING' | 'BLOCKED' | 'SUSPENDED'
  activationDate: string
  expirationDate: string | null
  restrictions: string | null
  requiredDocs: { doc: string; status: DocStatus }[]
  blockingReasons: string[]
  icon: string
  label: string
  description: string
}

export const driverActivities: DriverActivity[] = [
  {
    activityType: 'TAXI',
    status: 'AUTHORIZED',
    taximeterEnabled: TAXIMETER_ENABLED_BY_ACTIVITY['TAXI'],
    authorizationStatus: 'AUTHORIZED',
    activationDate: '2024-09-01',
    expirationDate: '2026-12-31',
    restrictions: null,
    requiredDocs: [
      { doc: 'Permis conduire (Classe 4C)', status: 'VALID' },
      { doc: 'Permis taxi', status: 'VALID' },
      { doc: 'Assurance', status: 'VALID' },
      { doc: 'Inspection', status: 'EXPIRING' },
      { doc: 'Taximètre certifié', status: 'VALID' },
    ],
    blockingReasons: [],
    icon: '🚕',
    label: 'Taxi',
    description: 'Taximètre actif · Tarif réglementaire QC · GPS requis',
  },
  {
    activityType: 'RIDESHARE',
    status: 'AUTHORIZED',
    taximeterEnabled: TAXIMETER_ENABLED_BY_ACTIVITY['RIDESHARE'],
    authorizationStatus: 'AUTHORIZED',
    activationDate: '2024-09-01',
    expirationDate: null,
    restrictions: null,
    requiredDocs: [
      { doc: 'Permis conduire', status: 'VALID' },
      { doc: 'Assurance rideshare', status: 'VALID' },
    ],
    blockingReasons: [],
    icon: '🚗',
    label: 'Rideshare',
    description: 'Prix fourni par Uber/Lyft · Taximètre désactivé',
  },
  {
    activityType: 'FOOD_DELIVERY',
    status: 'AUTHORIZED',
    taximeterEnabled: TAXIMETER_ENABLED_BY_ACTIVITY['FOOD_DELIVERY'],
    authorizationStatus: 'AUTHORIZED',
    activationDate: '2024-10-01',
    expirationDate: null,
    restrictions: null,
    requiredDocs: [
      { doc: 'Permis conduire', status: 'VALID' },
    ],
    blockingReasons: [],
    icon: '📦',
    label: 'Livraison',
    description: 'Prix fourni par DoorDash/Instacart/UberEats/Skip · Taximètre désactivé',
  },
  {
    activityType: 'GROCERY',
    status: 'PENDING',
    taximeterEnabled: TAXIMETER_ENABLED_BY_ACTIVITY['GROCERY'],
    authorizationStatus: 'PENDING',
    activationDate: '',
    expirationDate: null,
    restrictions: 'En attente d\'autorisation gouvernementale',
    requiredDocs: [
      { doc: 'Permis conduire', status: 'VALID' },
    ],
    blockingReasons: ['Autorisation gouvernementale en attente'],
    icon: '🛒',
    label: 'Épicerie',
    description: 'Instacart · Autorisation en attente',
  },
]

// ─── DRIVER LICENSE ──────────────────────────────────────────
export const mockLicense = {
  licenseId: 'LIC-QC-001234',
  number: 'Q-1234567',
  class: 'Classe 4C (Taxi/Chauffeur)',
  issuingJurisdiction: 'SAAQ — Québec',
  issueDate: '2023-09-01',
  expirationDate: '2027-09-01',
  status: 'VALID' as DocStatus,
  restrictions: 'Aucune',
  taxiPermit: {
    number: 'TAXI-QC-00001001',
    status: 'VALID' as DocStatus,
    issuedBy: 'MTQ — Québec',
    expiry: '2026-12-31',
  }
}

// ─── VEHICLE ─────────────────────────────────────────────────
export const mockVehicle = {
  vehicleId: 'V-QC-001234',
  vin: '2T1BURHE0JC081234',
  plate: 'ABC-1234',
  make: 'Toyota',
  model: 'Camry',
  year: 2022,
  color: 'Blanc',
  vehicleType: 'Berline',
  registrationStatus: 'VALID' as DocStatus,
  insuranceNumber: 'INS-2026-00123',
  insuranceExpiry: '2027-03-15',
  insuranceStatus: 'VALID' as DocStatus,
  inspectionDate: '2025-12-15',
  inspectionExpiry: '2026-12-15',
  inspectionStatus: 'EXPIRING' as DocStatus,
  taxiAuthorizationStatus: 'VALID' as DocStatus,
  meter: {
    instanceId: 'METER-QC-00003210',
    version: 'v3.2.1',
    certified: true,
    certExpiry: '2027-06-30',
    certStatus: 'VALID' as DocStatus,
  }
}

// ─── BUSINESS PROFILE ─────────────────────────────────────────
export const mockBusiness = {
  hasBusinessProfile: false,
  businessName: null as string | null,
  businessNumber: null as string | null,
  businessType: null as string | null,
  businessStatus: null as string | null,
}

// ─── TAX PROFILE (SENSITIVE — masked display) ────────────────
export const mockTaxProfile = {
  taxStatus: 'REGISTERED',
  gstHstStatus: 'REGISTERED',
  qstStatus: 'REGISTERED',
  // GST/QST numbers shown masked — full only via secure backend
  gstNumberMasked: 'GST ****-****-1234',
  qstNumberMasked: 'QST ***-***-456-TQ-0001',
  taxRegistrationStatus: 'ACTIVE',
  taxJurisdiction: 'QC-CA',
  // NAS/SIN: NEVER stored here — only in secure vault
  // nasDisplay: '***-***-XXX' — accessed via identity vault only
  annualRevenueThreshold: 30000,
  currentYearRevenue: 18450,
  mandatoryCollectionRequired: false, // < $30k threshold
}

// ─── PLATFORM ACCOUNTS ─────────────────────────────────────────
export interface PlatformAccount {
  platformAccountId: string
  driverId: string
  provider: string
  name: string
  icon: string
  externalAccountId: string | null
  status: PlatformStatus
  connectedAt: string | null
  lastSync: string | null
  authorizationStatus: 'AUTHORIZED' | 'PENDING' | 'REVOKED' | 'EXPIRED' | null
  syncStatus: SyncStatus | null
  activityType: ActivityType
  taximeterEnabled: false  // Platform accounts NEVER use taximeter
  todayTrips: number
  todayRevenue: number
}

export const mockPlatformAccounts: PlatformAccount[] = [
  { platformAccountId: 'PA-001', driverId: 'DR-00001234', provider: 'uber', name: 'Uber', icon: '⬛', externalAccountId: 'UBER-ABC-456', status: 'CONNECTED', connectedAt: '2024-09-15T00:00:00Z', lastSync: '2026-08-24T14:55:00Z', authorizationStatus: 'AUTHORIZED', syncStatus: 'SYNCED', activityType: 'RIDESHARE', taximeterEnabled: false, todayTrips: 3, todayRevenue: 87.30 },
  { platformAccountId: 'PA-002', driverId: 'DR-00001234', provider: 'lyft', name: 'Lyft', icon: '🔵', externalAccountId: 'LYFT-XYZ-789', status: 'DISCONNECTED', connectedAt: '2024-10-01T00:00:00Z', lastSync: '2026-08-23T18:00:00Z', authorizationStatus: 'REVOKED', syncStatus: 'FAILED', activityType: 'RIDESHARE', taximeterEnabled: false, todayTrips: 0, todayRevenue: 0 },
  { platformAccountId: 'PA-003', driverId: 'DR-00001234', provider: 'doordash', name: 'DoorDash', icon: '🔴', externalAccountId: 'DD-123-456', status: 'CONNECTED', connectedAt: '2024-10-15T00:00:00Z', lastSync: '2026-08-24T13:10:00Z', authorizationStatus: 'AUTHORIZED', syncStatus: 'SYNCED', activityType: 'FOOD_DELIVERY', taximeterEnabled: false, todayTrips: 8, todayRevenue: 112.40 },
  { platformAccountId: 'PA-004', driverId: 'DR-00001234', provider: 'ubereats', name: 'Uber Eats', icon: '🟢', externalAccountId: null, status: 'NOT_CONNECTED', connectedAt: null, lastSync: null, authorizationStatus: null, syncStatus: null, activityType: 'FOOD_DELIVERY', taximeterEnabled: false, todayTrips: 0, todayRevenue: 0 },
  { platformAccountId: 'PA-005', driverId: 'DR-00001234', provider: 'instacart', name: 'Instacart', icon: '🛒', externalAccountId: null, status: 'NOT_CONNECTED', connectedAt: null, lastSync: null, authorizationStatus: null, syncStatus: null, activityType: 'GROCERY', taximeterEnabled: false, todayTrips: 0, todayRevenue: 0 },
  { platformAccountId: 'PA-006', driverId: 'DR-00001234', provider: 'skip', name: 'Skip', icon: '🟠', externalAccountId: 'SKIP-789', status: 'MAINTENANCE', connectedAt: '2025-01-01T00:00:00Z', lastSync: '2026-08-24T13:48:00Z', authorizationStatus: 'AUTHORIZED', syncStatus: 'PENDING', activityType: 'FOOD_DELIVERY', taximeterEnabled: false, todayTrips: 0, todayRevenue: 0 },
]


// Alias for backwards compat
export const mockPlatforms = mockPlatformAccounts

// ─── DRIVER PERMISSIONS ───────────────────────────────────────
export const driverPermissions = {
  // What driver CAN do
  allowed: [
    'VIEW_PROFILE', 'EDIT_PROFILE_BASIC', 'VIEW_LICENSE', 'VIEW_VEHICLE',
    'VIEW_DOCUMENTS', 'UPLOAD_DOCUMENT', 'VIEW_REVENUE', 'VIEW_TRANSACTIONS',
    'VIEW_TAX', 'MANAGE_PLATFORM_CONNECTIONS', 'START_TAXI_ACTIVITY',
    'START_RIDESHARE_ACTIVITY', 'START_DELIVERY_ACTIVITY',
    'GO_ONLINE', 'GO_OFFLINE', 'VIEW_NOTIFICATIONS', 'CONTACT_SUPPORT',
  ],
  // What driver CANNOT do (protected)
  restricted: [
    'MODIFY_LEDGER', 'MODIFY_TRANSACTION', 'MODIFY_TAX_RECORD',
    'APPROVE_DOCUMENT', 'APPROVE_LICENSE', 'CHANGE_GOVERNMENT_STATUS',
    'CHANGE_PROVIDER_TRANSACTION', 'DELETE_AUDIT_LOG',
  ],
}

// ─── DEVICE PERMISSIONS ───────────────────────────────────────
export const devicePermissions = {
  LOCATION: { granted: true, required: true, reason: 'GPS requis pour les courses taxi et livraisons' },
  BACKGROUND_LOCATION: { granted: true, required: true, reason: 'Suivi continu pendant les courses actives' },
  CAMERA: { granted: true, required: false, reason: 'Upload de documents (permis, assurance)' },
  MICROPHONE: { granted: false, required: false, reason: 'Assistance vocale (optionnel)' },
  NOTIFICATIONS: { granted: true, required: true, reason: 'Alertes courses, paiements, expirations' },
  BLUETOOTH: { granted: false, required: false, reason: 'Connexion taximètre externe (taxi uniquement)' },
  STORAGE: { granted: true, required: false, reason: 'Cache documents et logs locaux' },
}

// ─── COMPLIANCE STATUS ────────────────────────────────────────
export const complianceStatus = {
  overall: 'WARNING' as 'OK' | 'WARNING' | 'BLOCKED',
  items: [
    { key: 'license', label: 'Permis conduire', status: 'VALID' as DocStatus, icon: '🪪', expiry: '2027-09-01', blocksActivity: ['TAXI', 'RIDESHARE', 'FOOD_DELIVERY'] },
    { key: 'taxi_permit', label: 'Permis taxi', status: 'VALID' as DocStatus, icon: '📋', expiry: '2026-12-31', blocksActivity: ['TAXI'] },
    { key: 'insurance', label: 'Assurance', status: 'VALID' as DocStatus, icon: '🛡️', expiry: '2027-03-15', blocksActivity: ['TAXI', 'RIDESHARE'] },
    { key: 'inspection', label: 'Inspection véhicule', status: 'EXPIRING' as DocStatus, icon: '🔧', expiry: '2026-12-15', blocksActivity: ['TAXI'] },
    { key: 'meter', label: 'Taximètre certifié', status: 'VALID' as DocStatus, icon: '📟', expiry: '2027-06-30', blocksActivity: ['TAXI'] },
    { key: 'tax', label: 'Dossier fiscal', status: 'VALID' as DocStatus, icon: '📊', expiry: null, blocksActivity: [] },
  ]
}

// ─── DEVICES ─────────────────────────────────────────────────
export const driverDevices = [
  { deviceId: 'DEV-001', name: 'iPhone 15 Pro', os: 'iOS 17.5', model: 'iPhone15,2', lastActive: '2026-08-24T15:00:00Z', location: 'Montréal, QC', isCurrent: true, securityStatus: 'SECURE', registered: '2024-03-15T00:00:00Z' },
  { deviceId: 'DEV-002', name: 'iPhone 13', os: 'iOS 16.7', model: 'iPhone14,5', lastActive: '2026-07-10T09:00:00Z', location: 'Montréal, QC', isCurrent: false, securityStatus: 'INACTIVE', registered: '2023-01-10T00:00:00Z' },
]

// ─── CHANGE REQUESTS ──────────────────────────────────────────
export const changeRequests = [
  { id: 'CR-001', field: 'phone', oldValue: '+1 (514) 555-0100', newValue: '+1 (514) 555-0123', status: 'APPROVED' as ChangeRequestStatus, requestedAt: '2026-08-01T10:00:00Z', reviewedAt: '2026-08-02T09:00:00Z', reviewedBy: 'SUPPORT-001' },
]

// ─── TODAY STATS ─────────────────────────────────────────────
export const todayStats = {
  date: '2026-08-24',
  totalTrips: 16,
  totalRevenue: 385.20,
  taxableRevenue: 346.68,
  tps: 17.33,
  tvq: 34.58,
  totalTax: 51.91,
  tips: 24.50,
  fees: 28.30,
  netRevenue: 328.99,
  hoursOnline: 7.5,
  kmDriven: 148.2,
  byPlatform: [
    { provider: 'taxi', name: 'Taxi', icon: '🚕', trips: 5, revenue: 185.50 },
    { provider: 'uber', name: 'Uber', icon: '⬛', trips: 3, revenue: 87.30 },
    { provider: 'doordash', name: 'DoorDash', icon: '🔴', trips: 8, revenue: 112.40 },
  ],
}

// ─── RECENT ACTIVITIES ────────────────────────────────────────
export const recentActivities = [
  { id: 'act-001', type: 'TAXI' as ActivityType, provider: 'taxi', taximeterUsed: true, status: 'COMPLETED', startTime: '15:02', duration: '18 min', distance: '7.2 km', fare: 42.50, tip: 5.00, paymentMethod: 'Carte', syncStatus: 'SYNCED' as SyncStatus },
  { id: 'act-002', type: 'FOOD_DELIVERY' as ActivityType, provider: 'doordash', taximeterUsed: false, status: 'COMPLETED', startTime: '14:15', duration: '25 min', distance: '4.8 km', fare: 18.90, tip: 3.00, paymentMethod: 'App', syncStatus: 'SYNCED' as SyncStatus },
  { id: 'act-003', type: 'RIDESHARE' as ActivityType, provider: 'uber', taximeterUsed: false, status: 'COMPLETED', startTime: '13:30', duration: '22 min', distance: '9.1 km', fare: 28.40, tip: 4.00, paymentMethod: 'App', syncStatus: 'SYNCED' as SyncStatus },
  { id: 'act-004', type: 'FOOD_DELIVERY' as ActivityType, provider: 'doordash', taximeterUsed: false, status: 'COMPLETED', startTime: '12:45', duration: '18 min', distance: '3.2 km', fare: 15.20, tip: 2.50, paymentMethod: 'App', syncStatus: 'SYNCED' as SyncStatus },
  { id: 'act-005', type: 'TAXI' as ActivityType, provider: 'taxi', taximeterUsed: true, status: 'COMPLETED', startTime: '11:15', duration: '32 min', distance: '12.4 km', fare: 58.00, tip: 8.00, paymentMethod: 'Interac', syncStatus: 'SYNCED' as SyncStatus },
]

// ─── DOCUMENTS ───────────────────────────────────────────────
export const driverDocuments = [
  { id: 'doc-001', name: 'Permis de conduire', type: 'LICENSE', status: 'VALID' as DocStatus, expiryDate: '2027-09-01', uploadedAt: '2024-03-15T00:00:00Z', fileRef: 'license.pdf' },
  { id: 'doc-002', name: 'Assurance automobile', type: 'INSURANCE', status: 'VALID' as DocStatus, expiryDate: '2027-03-15', uploadedAt: '2024-03-20T00:00:00Z', fileRef: 'insurance.pdf' },
  { id: 'doc-003', name: 'Inspection véhicule', type: 'INSPECTION', status: 'EXPIRING' as DocStatus, expiryDate: '2026-12-15', uploadedAt: '2025-12-15T00:00:00Z', fileRef: 'inspection.pdf' },
  { id: 'doc-004', name: 'Permis taxi', type: 'TAXI_PERMIT', status: 'VALID' as DocStatus, expiryDate: '2026-12-31', uploadedAt: '2025-01-01T00:00:00Z', fileRef: 'taxipermit.pdf' },
  { id: 'doc-005', name: 'Photo identité', type: 'PHOTO_ID', status: 'VALID' as DocStatus, expiryDate: '2029-03-15', uploadedAt: '2024-03-15T00:00:00Z', fileRef: 'photo.jpg' },
]

// ─── NOTIFICATIONS ────────────────────────────────────────────
export const driverNotifications = [
  { id: 'n-001', type: 'DOCUMENT', title: 'Inspection expire bientôt', body: "Votre inspection expire le 15 décembre 2026. Renouvelez avant l'expiration.", priority: 'HIGH', read: false, createdAt: '2026-08-24T08:00:00Z', icon: '⚠️' },
  { id: 'n-002', type: 'PAYMENT', title: 'Revenus synchronisés', body: "Uber: 87.30$ enregistrés. DoorDash: 112.40$ enregistrés.", priority: 'LOW', read: false, createdAt: '2026-08-24T14:55:00Z', icon: '💰' },
  { id: 'n-003', type: 'PLATFORM', title: 'Skip — Maintenance', body: 'Skip est en maintenance. Vos activités reprennent bientôt.', priority: 'MEDIUM', read: true, createdAt: '2026-08-24T13:50:00Z', icon: '🔧' },
  { id: 'n-004', type: 'GOVERNMENT', title: 'Message gouvernemental', body: 'Nouveau formulaire fiscal disponible pour Q3 2026.', priority: 'MEDIUM', read: true, createdAt: '2026-08-20T10:00:00Z', icon: '🏛️' },
]

// ─── FARE CONFIG ──────────────────────────────────────────────
export const fareConfig = {
  jurisdiction: 'QC-CA',
  currency: 'CAD',
  effectiveDate: '2026-01-01',
  baseFare: 3.45,
  perKmRate: 1.95,
  perMinuteRate: 0.50,
  waitingPerMinuteRate: 0.50,
  minimumFare: 4.05,
  tpsRate: 0.05,
  tvqRate: 0.09975,
}

// ─── MONTHLY REVENUE ──────────────────────────────────────────
export const monthlyRevenue = [
  { month: 'Mar', gross: 2840, trips: 68 },
  { month: 'Avr', gross: 3120, trips: 74 },
  { month: 'Mai', gross: 3580, trips: 82 },
  { month: 'Jun', gross: 4210, trips: 96 },
  { month: 'Jul', gross: 3890, trips: 88 },
  { month: 'Aoû', gross: 3852, trips: 84 },
]

// ─── AUDIT EVENTS (what driver-side logs look like) ───────────
export const auditLog = [
  { eventId: 'AUD-001', action: 'PROFILE_UPDATED', resource: 'phone', timestamp: '2026-08-01T10:00:00Z', result: 'SUCCESS' },
  { eventId: 'AUD-002', action: 'DOCUMENT_UPLOADED', resource: 'INSPECTION', timestamp: '2025-12-15T09:00:00Z', result: 'SUCCESS' },
  { eventId: 'AUD-003', action: 'PLATFORM_CONNECTED', resource: 'doordash', timestamp: '2024-10-15T14:00:00Z', result: 'SUCCESS' },
  { eventId: 'AUD-004', action: 'ACTIVITY_ENABLED', resource: 'FOOD_DELIVERY', timestamp: '2024-10-01T00:00:00Z', result: 'SUCCESS' },
  { eventId: 'AUD-005', action: 'ACCOUNT_LOGIN', resource: 'session', timestamp: '2026-08-24T08:30:00Z', result: 'SUCCESS' },
]

// ─── GPS SESSION MOCK DATA ─────────────────────────────────────
export const mockGpsSession = {
  sessionId: 'LSESS-2026-08-24-001',
  status: 'ACTIVE' as const,
  startedAt: '2026-08-24T07:30:00Z',
  gpsStatus: 'ACTIVE' as const,
  accuracyM: 4,
  speedKmh: 32,
  heading: 270, // West
  latitude: 45.5017,
  longitude: -73.5673,
  totalDistanceKm: 148.2,
  validPoints: 5328,
  invalidPoints: 12,
  syncStatus: 'SERVER_CONFIRMED' as const,
  jurisdictionId: 'QC-CA',
  batteryMode: 'HIGH_ACCURACY' as const,
  permission: 'GRANTED_BACKGROUND' as const,
}

export const gpsEventLog = [
  { time:'07:30', event:'GPS démarré', status:'ACTIVE', accuracy:4, activity:'TAXI', quality:'NORMAL' },
  { time:'08:15', event:'Précision dégradée', status:'LOW_ACCURACY', accuracy:28, activity:'TAXI', quality:'ACCEPTABLE' },
  { time:'08:17', event:'Précision restaurée', status:'ACTIVE', accuracy:5, activity:'TAXI', quality:'NORMAL' },
  { time:'10:02', event:'Signal perdu (tunnel)', status:'SIGNAL_LOST', accuracy:999, activity:'TAXI', quality:'REVIEW_REQUIRED' },
  { time:'10:03', event:'Signal récupéré', status:'RECOVERING', accuracy:8, activity:'TAXI', quality:'NORMAL' },
  { time:'12:45', event:'Changement activité: TAXI → FOOD_DELIVERY', status:'ACTIVE', accuracy:5, activity:'FOOD_DELIVERY', quality:'NORMAL' },
  { time:'13:10', event:'Point GPS rejeté: vitesse impossible (312 km/h)', status:'ACTIVE', accuracy:4, activity:'FOOD_DELIVERY', quality:'SUSPICIOUS' },
  { time:'15:02', event:'Session synchronisée', status:'ACTIVE', accuracy:4, activity:'FOOD_DELIVERY', quality:'NORMAL' },
]

export const locationPolicySummary = [
  { activity:'TAXI', icon:'🚕', interval:'1s', accuracy:'≤10m', battery:'HIGH_ACCURACY', taximeter:true, background:true },
  { activity:'RIDESHARE', icon:'🚗', interval:'3s', accuracy:'≤30m', battery:'BALANCED', taximeter:false, background:true },
  { activity:'FOOD_DELIVERY', icon:'📦', interval:'5s', accuracy:'≤50m', battery:'BALANCED', taximeter:false, background:true },
  { activity:'GROCERY', icon:'🛒', interval:'5s', accuracy:'≤50m', battery:'BALANCED', taximeter:false, background:false },
]
