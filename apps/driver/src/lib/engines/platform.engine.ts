// ============================================================
// TAXIMÈTRE.GOV — PLATFORM CONNECTOR ENGINE
// Phase 2 — Step 15 & 16: Platform Connections + Webhook Sync
// Architecture mémoire: Phase 3 étapes 13-21
// ============================================================

// ─── RÈGLES ABSOLUES (Phase 3 architecture) ──────────────────
// 1. JAMAIS demander le mot de passe Uber/Lyft au chauffeur
// 2. Connexion via OAuth officiel UNIQUEMENT
// 3. provider + provider_trip_id = clé d'idempotence
// 4. Accès API Uber/Lyft nécessite approbation officielle
// 5. Taximètre DÉSACTIVÉ pour toutes les plateformes externes

// ─── TYPES ───────────────────────────────────────────────────
export type Provider =
  | 'uber' | 'lyft' | 'doordash' | 'instacart'
  | 'ubereats' | 'skip' | 'taxi'

export type ConnectionMethod = 'OAUTH_DRIVER' | 'GOVERNMENT_API' | 'INTERNAL'
export type SyncMethod = 'WEBHOOK' | 'POLLING' | 'INTERNAL_DIRECT'
export type NormalizedEventType =
  | 'TRIP_COMPLETED' | 'TRIP_CANCELLED' | 'DELIVERY_COMPLETED'
  | 'DELIVERY_CANCELLED' | 'ADJUSTMENT' | 'TIP_ADDED'
  | 'REFUND' | 'PAYMENT_PROCESSED'

export type ConnectorStatus =
  | 'NOT_CONFIGURED'    // Jamais connecté
  | 'PENDING_OAUTH'     // OAuth en cours
  | 'CONNECTED'         // Actif et synchro
  | 'TOKEN_EXPIRED'     // Renouvellement requis
  | 'DISCONNECTED'      // Révoqué par chauffeur
  | 'MAINTENANCE'       // Plateforme en maintenance
  | 'APPROVAL_REQUIRED' // Accès API non encore approuvé

// ─── PLATFORM CONFIG (non hardcodé — chargé depuis config) ───
export interface PlatformConfig {
  provider: Provider
  name: string
  icon: string
  activityType: 'RIDESHARE' | 'FOOD_DELIVERY' | 'GROCERY' | 'TAXI'
  taximeterEnabled: false  // TOUJOURS false pour plateformes externes
  connectionMethod: ConnectionMethod
  syncMethod: SyncMethod
  webhookEnabled: boolean
  oauthScopes: string[]   // Scopes minimaux requis
  apiApprovalRequired: boolean
  approvalStatus: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED'
  // JAMAIS: clientSecret, apiKey, accessToken — stockés dans vault sécurisé
}

export const PLATFORM_CONFIGS: Record<Provider, PlatformConfig> = {
  uber: {
    provider: 'uber', name: 'Uber', icon: '⬛',
    activityType: 'RIDESHARE', taximeterEnabled: false,
    connectionMethod: 'OAUTH_DRIVER',
    syncMethod: 'WEBHOOK',
    webhookEnabled: true,
    oauthScopes: ['partner.accounts', 'partner.trips', 'partner.payments'],
    apiApprovalRequired: true,
    approvalStatus: 'PENDING',
  },
  lyft: {
    provider: 'lyft', name: 'Lyft', icon: '🔵',
    activityType: 'RIDESHARE', taximeterEnabled: false,
    connectionMethod: 'OAUTH_DRIVER',
    syncMethod: 'WEBHOOK',
    webhookEnabled: true,
    oauthScopes: ['rides.read', 'profile'],
    apiApprovalRequired: true,
    approvalStatus: 'PENDING',
  },
  doordash: {
    provider: 'doordash', name: 'DoorDash', icon: '🔴',
    activityType: 'FOOD_DELIVERY', taximeterEnabled: false,
    connectionMethod: 'OAUTH_DRIVER',
    syncMethod: 'WEBHOOK',
    webhookEnabled: true,
    oauthScopes: ['delivery.read', 'earnings.read'],
    apiApprovalRequired: true,
    approvalStatus: 'PENDING',
  },
  instacart: {
    provider: 'instacart', name: 'Instacart', icon: '🛒',
    activityType: 'GROCERY', taximeterEnabled: false,
    connectionMethod: 'OAUTH_DRIVER',
    syncMethod: 'POLLING',
    webhookEnabled: false,
    oauthScopes: ['orders.read', 'earnings.read'],
    apiApprovalRequired: true,
    approvalStatus: 'PENDING',
  },
  ubereats: {
    provider: 'ubereats', name: 'Uber Eats', icon: '🟢',
    activityType: 'FOOD_DELIVERY', taximeterEnabled: false,
    connectionMethod: 'OAUTH_DRIVER',
    syncMethod: 'WEBHOOK',
    webhookEnabled: true,
    oauthScopes: ['delivery.read', 'earnings.read'],
    apiApprovalRequired: true,
    approvalStatus: 'PENDING',
  },
  skip: {
    provider: 'skip', name: 'Skip', icon: '🟠',
    activityType: 'FOOD_DELIVERY', taximeterEnabled: false,
    connectionMethod: 'OAUTH_DRIVER',
    syncMethod: 'WEBHOOK',
    webhookEnabled: true,
    oauthScopes: ['orders.read', 'earnings.read'],
    apiApprovalRequired: true,
    approvalStatus: 'PENDING',
  },
  taxi: {
    provider: 'taxi', name: 'Taximètre.GOV', icon: '🚕',
    activityType: 'TAXI', taximeterEnabled: false, // meter handled separately
    connectionMethod: 'INTERNAL',
    syncMethod: 'INTERNAL_DIRECT',
    webhookEnabled: false,
    oauthScopes: [],
    apiApprovalRequired: false,
    approvalStatus: 'NOT_REQUIRED',
  },
}

// ─── OAUTH FLOW (driver-authorized) ──────────────────────────
export interface OAuthFlowStep {
  step: number
  action: string
  description: string
  userAction: boolean
}

export const OAUTH_FLOW: OAuthFlowStep[] = [
  { step:1, action:'INITIATE', description:'Chauffeur clique "Connecter [Plateforme]"', userAction:true },
  { step:2, action:'REDIRECT', description:'Taximètre.GOV redirige vers la page OAuth de la plateforme', userAction:false },
  { step:3, action:'CONSENT', description:'Chauffeur voit les permissions demandées et donne son accord', userAction:true },
  { step:4, action:'CALLBACK', description:'Plateforme retourne un code d\'autorisation à Taximètre.GOV', userAction:false },
  { step:5, action:'TOKEN_EXCHANGE', description:'Taximètre.GOV échange le code contre un access token (backend)', userAction:false },
  { step:6, action:'TOKEN_STORE', description:'Access token chiffré stocké dans vault sécurisé — jamais exposé', userAction:false },
  { step:7, action:'VERIFY', description:'Vérification de connexion réussie — compte lié', userAction:false },
]

// ─── NORMALIZED EVENT ─────────────────────────────────────────
// Toutes les plateformes → format unifié avant Ledger
export interface NormalizedEvent {
  normalizedId: string
  provider: Provider
  providerTripId: string      // Clé idempotence partie 1
  providerEventId: string     // Clé idempotence partie 2
  driverId: string
  activityType: string
  eventType: NormalizedEventType
  currency: 'CAD'
  grossAmount: number
  netAmount: number
  fees: number
  tip: number
  tax: number
  adjustments: number
  refunds: number
  taximeterUsed: false        // TOUJOURS false pour plateformes externes
  providerTimestamp: number
  normalizedAt: number
  rawPayload: null            // Payload brut non stocké côté driver
  ledgerReady: boolean
}

// ─── NORMALIZATION ENGINE ─────────────────────────────────────
// Chaque provider → format unifié
// Données brutes jamais exposées au frontend
export function normalizeUberEvent(raw: {
  trip_id: string; event_id: string; driver_id: string;
  fare_amount: number; tip_amount: number; service_fee: number; status: string
}): NormalizedEvent {
  const gross = raw.fare_amount + raw.tip_amount
  const fees = raw.service_fee
  return {
    normalizedId: `NORM-UBER-${raw.trip_id}`,
    provider: 'uber',
    providerTripId: raw.trip_id,
    providerEventId: raw.event_id,
    driverId: raw.driver_id,
    activityType: 'RIDESHARE',
    eventType: raw.status === 'completed' ? 'TRIP_COMPLETED' : 'TRIP_CANCELLED',
    currency: 'CAD',
    grossAmount: gross,
    netAmount: gross - fees,
    fees,
    tip: raw.tip_amount,
    tax: 0, // Tax calculated by Tax Engine — never from provider
    adjustments: 0,
    refunds: 0,
    taximeterUsed: false,
    providerTimestamp: Date.now(),
    normalizedAt: Date.now(),
    rawPayload: null,
    ledgerReady: true,
  }
}

// Same pattern for other providers
export function normalizeDoorDashEvent(raw: {
  delivery_id: string; event_id: string; driver_id: string;
  pay_amount: number; tip: number; dasher_fee: number; status: string
}): NormalizedEvent {
  const gross = raw.pay_amount + raw.tip
  return {
    normalizedId: `NORM-DD-${raw.delivery_id}`,
    provider: 'doordash',
    providerTripId: raw.delivery_id,
    providerEventId: raw.event_id,
    driverId: raw.driver_id,
    activityType: 'FOOD_DELIVERY',
    eventType: raw.status === 'delivered' ? 'DELIVERY_COMPLETED' : 'DELIVERY_CANCELLED',
    currency: 'CAD',
    grossAmount: gross,
    netAmount: gross - raw.dasher_fee,
    fees: raw.dasher_fee,
    tip: raw.tip,
    tax: 0,
    adjustments: 0,
    refunds: 0,
    taximeterUsed: false,
    providerTimestamp: Date.now(),
    normalizedAt: Date.now(),
    rawPayload: null,
    ledgerReady: true,
  }
}

// ─── IDEMPOTENCE GUARD ────────────────────────────────────────
// provider + providerTripId = unique key
export function buildIdempotenceKey(provider: Provider, providerTripId: string): string {
  return `${provider.toUpperCase()}-${providerTripId}`
}

// ─── WEBHOOK HANDLER (architecture) ──────────────────────────
export interface WebhookEvent {
  provider: Provider
  eventId: string
  signature: string     // HMAC-SHA256 from provider
  receivedAt: number
  payload: unknown      // Validated before use
}

export interface WebhookResult {
  status: 'PROCESSED' | 'DUPLICATE' | 'INVALID_SIGNATURE' | 'FAILED'
  idempotenceKey: string
  normalizedEvent?: NormalizedEvent
  error?: string
}

// ─── MOCK PLATFORM ACCOUNTS (for UI) ─────────────────────────
export const mockConnections = [
  {
    provider: 'uber' as Provider, name: 'Uber', icon: '⬛',
    status: 'CONNECTED' as ConnectorStatus,
    connectedAt: '2024-09-15', lastSync: '2026-08-24T14:55:00Z',
    scopesGranted: ['partner.trips', 'partner.payments'],
    approvalStatus: 'PENDING',
    todayTrips: 3, todayRevenue: 87.30, todayTips: 9.00,
    note: 'MOCK — Approbation API Uber requise pour accès réel',
  },
  {
    provider: 'lyft' as Provider, name: 'Lyft', icon: '🔵',
    status: 'DISCONNECTED' as ConnectorStatus,
    connectedAt: '2024-10-01', lastSync: '2026-08-23T18:00:00Z',
    scopesGranted: [],
    approvalStatus: 'PENDING',
    todayTrips: 0, todayRevenue: 0, todayTips: 0,
    note: 'MOCK — Token expiré — Reconnecter via OAuth',
  },
  {
    provider: 'doordash' as Provider, name: 'DoorDash', icon: '🔴',
    status: 'CONNECTED' as ConnectorStatus,
    connectedAt: '2024-10-15', lastSync: '2026-08-24T13:10:00Z',
    scopesGranted: ['delivery.read', 'earnings.read'],
    approvalStatus: 'PENDING',
    todayTrips: 8, todayRevenue: 112.40, todayTips: 14.50,
    note: 'MOCK — Approbation API DoorDash requise pour accès réel',
  },
  {
    provider: 'ubereats' as Provider, name: 'Uber Eats', icon: '🟢',
    status: 'NOT_CONFIGURED' as ConnectorStatus,
    connectedAt: null, lastSync: null,
    scopesGranted: [],
    approvalStatus: 'PENDING',
    todayTrips: 0, todayRevenue: 0, todayTips: 0,
    note: 'MOCK — À connecter via OAuth officiel',
  },
  {
    provider: 'instacart' as Provider, name: 'Instacart', icon: '🛒',
    status: 'NOT_CONFIGURED' as ConnectorStatus,
    connectedAt: null, lastSync: null,
    scopesGranted: [],
    approvalStatus: 'PENDING',
    todayTrips: 0, todayRevenue: 0, todayTips: 0,
    note: 'MOCK — Activité Épicerie non encore autorisée',
  },
  {
    provider: 'skip' as Provider, name: 'Skip', icon: '🟠',
    status: 'MAINTENANCE' as ConnectorStatus,
    connectedAt: '2025-01-01', lastSync: '2026-08-24T13:48:00Z',
    scopesGranted: ['orders.read'],
    approvalStatus: 'PENDING',
    todayTrips: 0, todayRevenue: 0, todayTips: 0,
    note: 'MOCK — Clé HMAC en renouvellement',
  },
]

// ─── SYNC STATUS ──────────────────────────────────────────────
export interface SyncRecord {
  provider: Provider
  lastSyncAt: string | null
  pendingEvents: number
  failedEvents: number
  syncStatus: 'OK' | 'PARTIAL' | 'FAILED' | 'NEVER'
}

export const mockSyncStatus: SyncRecord[] = [
  { provider:'uber', lastSyncAt:'2026-08-24T14:55:00Z', pendingEvents:0, failedEvents:0, syncStatus:'OK' },
  { provider:'lyft', lastSyncAt:'2026-08-23T18:00:00Z', pendingEvents:2, failedEvents:2, syncStatus:'FAILED' },
  { provider:'doordash', lastSyncAt:'2026-08-24T13:10:00Z', pendingEvents:0, failedEvents:0, syncStatus:'OK' },
  { provider:'ubereats', lastSyncAt:null, pendingEvents:0, failedEvents:0, syncStatus:'NEVER' },
  { provider:'instacart', lastSyncAt:null, pendingEvents:0, failedEvents:0, syncStatus:'NEVER' },
  { provider:'skip', lastSyncAt:'2026-08-24T13:48:00Z', pendingEvents:5, failedEvents:5, syncStatus:'FAILED' },
]
