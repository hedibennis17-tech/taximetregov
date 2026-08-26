// ============================================================
// TAXIMÈTRE.GOV — PROVIDER CONNECTION ENGINE
// Phase 2 — Step 17: Provider Connection Center
// ============================================================
//
// RÈGLES ABSOLUES:
// 1. Jamais demander le mot de passe Uber/Lyft/DoorDash au chauffeur
// 2. OAuth uniquement — consentement chez le fournisseur
// 3. Connexion ≠ autorisation de calculer le prix du fournisseur
// 4. Taximeter DISABLED pour tous les providers externes
// 5. MOCK = développement seulement — ne jamais présenter comme réel
// 6. Tokens = coffre sécurisé côté serveur — jamais au frontend
// ============================================================

import { TAXIMETER_ENABLED_BY_ACTIVITY, type ActivityType } from '@/data/driver.mock'

// ─── PROVIDER TYPES ──────────────────────────────────────────

export type Provider =
  | 'taxi' | 'uber' | 'lyft' | 'doordash'
  | 'instacart' | 'uber_eats' | 'skip' | 'other'

export type ConnectionStatus =
  | 'NOT_CONNECTED' | 'CONNECTING' | 'CONNECTED' | 'SYNCING'
  | 'SYNC_ERROR' | 'TOKEN_EXPIRED' | 'REAUTH_REQUIRED'
  | 'DISCONNECTED' | 'SUSPENDED' | 'PENDING_REVIEW'

export type ProviderAvailability =
  | 'AVAILABLE' | 'COMING_SOON' | 'TEMPORARILY_UNAVAILABLE'
  | 'NOT_SUPPORTED' | 'REQUIRES_APPROVAL' | 'MOCK_ONLY'

export type AuthorizationStatus =
  | 'PENDING' | 'AUTHORIZED' | 'REVOKED' | 'EXPIRED' | 'REJECTED'

export type ConsentStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED'

// ─── PROVIDER DEFINITION ─────────────────────────────────────

export interface ProviderDefinition {
  provider: Provider
  name: string
  icon: string
  color: string             // brand color
  activityType: ActivityType
  serviceType: 'RIDESHARE' | 'DELIVERY' | 'GROCERY' | 'TAXI'
  taximeterEnabled: false   // ALWAYS false — taxi uses separate engine
  availability: ProviderAvailability
  supportsOAuth: boolean
  oauthScopes: string[]     // Scopes officially documented by provider
  apiApprovalRequired: boolean
  oauthNote: string         // Honest description of API status
  connectInstructions: string
  disconnectWarning: string
}

export const PROVIDER_DEFINITIONS: Record<Provider, ProviderDefinition> = {
  taxi: {
    provider: 'taxi', name: 'Taxi (Taximètre.GOV)', icon: '🚕', color: '#003DA5',
    activityType: 'TAXI', serviceType: 'TAXI', taximeterEnabled: false,
    availability: 'AVAILABLE', supportsOAuth: false, oauthScopes: [],
    apiApprovalRequired: false,
    oauthNote: 'Activité interne Taximètre.GOV — aucune connexion externe requise.',
    connectInstructions: 'Le taxi est géré directement via votre permis et taximètre certifié.',
    disconnectWarning: '',
  },
  uber: {
    provider: 'uber', name: 'Uber', icon: '⬛', color: '#000000',
    activityType: 'RIDESHARE', serviceType: 'RIDESHARE', taximeterEnabled: false,
    availability: 'MOCK_ONLY',
    supportsOAuth: true,
    oauthScopes: ['partner.accounts', 'partner.trips', 'partner.payments'],
    apiApprovalRequired: true,
    oauthNote: 'L\'accès à l\'API Uber Driver (partner.accounts, partner.trips, partner.payments) nécessite l\'approbation officielle d\'Uber. Mode MOCK activé pour le pilote.',
    connectInstructions: 'Vous serez redirigé vers Uber pour autoriser Taximètre.GOV. Aucun mot de passe ne sera demandé par notre application.',
    disconnectWarning: 'Déconnecter Uber arrêtera la synchronisation future. Les transactions déjà enregistrées au Ledger seront conservées.',
  },
  lyft: {
    provider: 'lyft', name: 'Lyft', icon: '🔵', color: '#FF00BF',
    activityType: 'RIDESHARE', serviceType: 'RIDESHARE', taximeterEnabled: false,
    availability: 'MOCK_ONLY',
    supportsOAuth: true,
    oauthScopes: ['rides.read', 'profile'],
    apiApprovalRequired: true,
    oauthNote: 'L\'accès à l\'API Lyft Driver nécessite un contrat partenaire officiel avec Lyft. Mode MOCK activé pour le pilote.',
    connectInstructions: 'Vous serez redirigé vers Lyft pour autoriser Taximètre.GOV. Aucun mot de passe ne sera demandé.',
    disconnectWarning: 'Déconnecter Lyft arrêtera la synchronisation future. Les transactions existantes restent au Ledger.',
  },
  doordash: {
    provider: 'doordash', name: 'DoorDash', icon: '🔴', color: '#FF3008',
    activityType: 'FOOD_DELIVERY', serviceType: 'DELIVERY', taximeterEnabled: false,
    availability: 'MOCK_ONLY',
    supportsOAuth: true,
    oauthScopes: ['dasher.read', 'payments.read'],
    apiApprovalRequired: true,
    oauthNote: 'L\'accès à l\'API DoorDash Dasher nécessite un accord partenaire avec DoorDash. Mode MOCK pour le pilote.',
    connectInstructions: 'Vous serez redirigé vers DoorDash pour autoriser Taximètre.GOV.',
    disconnectWarning: 'Déconnecter DoorDash arrêtera la synchronisation future des livraisons.',
  },
  instacart: {
    provider: 'instacart', name: 'Instacart', icon: '🛒', color: '#43B02A',
    activityType: 'GROCERY', serviceType: 'GROCERY', taximeterEnabled: false,
    availability: 'COMING_SOON',
    supportsOAuth: false,
    oauthScopes: [],
    apiApprovalRequired: true,
    oauthNote: 'L\'intégration Instacart est en cours d\'évaluation. Disponible prochainement.',
    connectInstructions: 'Disponible prochainement.',
    disconnectWarning: '',
  },
  uber_eats: {
    provider: 'uber_eats', name: 'Uber Eats', icon: '🟢', color: '#06C167',
    activityType: 'FOOD_DELIVERY', serviceType: 'DELIVERY', taximeterEnabled: false,
    availability: 'MOCK_ONLY',
    supportsOAuth: true,
    oauthScopes: ['partner.accounts', 'partner.trips', 'partner.payments'],
    apiApprovalRequired: true,
    oauthNote: 'Utilise l\'API Uber. Approbation officielle requise. Mode MOCK pour le pilote.',
    connectInstructions: 'Connexion via l\'autorisation Uber officielle.',
    disconnectWarning: 'Déconnecter Uber Eats arrêtera la synchronisation des livraisons.',
  },
  skip: {
    provider: 'skip', name: 'Skip', icon: '🟠', color: '#FF6600',
    activityType: 'FOOD_DELIVERY', serviceType: 'DELIVERY', taximeterEnabled: false,
    availability: 'MOCK_ONLY',
    supportsOAuth: false,
    oauthScopes: [],
    apiApprovalRequired: true,
    oauthNote: 'L\'intégration Skip est en cours d\'évaluation avec SkipTheDishes Canada. Mode MOCK pour le pilote.',
    connectInstructions: 'Connexion en cours de configuration avec Skip.',
    disconnectWarning: 'Déconnecter Skip arrêtera la synchronisation future.',
  },
  other: {
    provider: 'other', name: 'Autre fournisseur', icon: '🔌', color: '#666',
    activityType: 'FOOD_DELIVERY', serviceType: 'DELIVERY', taximeterEnabled: false,
    availability: 'COMING_SOON', supportsOAuth: false, oauthScopes: [],
    apiApprovalRequired: true,
    oauthNote: 'Autres fournisseurs en cours d\'évaluation.',
    connectInstructions: 'Disponible prochainement.',
    disconnectWarning: '',
  },
}

// ─── DRIVER PROVIDER CONNECTION ───────────────────────────────

export interface DriverProviderConnection {
  id: string
  driverId: string
  provider: Provider
  externalAccountId: string | null    // Provider's account ID (masked in UI)
  externalDriverId: string | null     // Provider's driver ID
  connectionStatus: ConnectionStatus
  authorizationStatus: AuthorizationStatus
  scopes: string[]                    // Granted OAuth scopes
  connectedAt: number | null
  lastSyncAt: number | null
  lastSuccessfulSyncAt: number | null
  tokenExpiresAt: number | null
  totalTransactions: number
  totalRevenue: number
  pendingTransactions: number
  syncErrorCount: number
  lastSyncError: string | null
  // Token: NEVER stored here — lives in ProviderCredentialVault (server-side)
}

// ─── PROVIDER CONSENT ─────────────────────────────────────────

export interface ProviderConsent {
  consentId: string
  driverId: string
  provider: Provider
  scopes: string[]
  consentedAt: number
  revokedAt: number | null
  consentVersion: string
  // ipHash: stored server-side only
  status: ConsentStatus
}

// ─── CONNECTION HISTORY ───────────────────────────────────────

export interface ConnectionHistoryEntry {
  entryId: string
  driverId: string
  provider: Provider
  event: 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTED' | 'TOKEN_EXPIRED' | 'REAUTH_REQUIRED' | 'SYNC_ERROR'
  occurredAt: number
  externalAccountMasked: string | null   // e.g. "••••1234"
  notes: string | null
}

// ─── OAUTH FLOW STEPS ─────────────────────────────────────────

export interface OAuthFlowStep {
  step: number
  label: string
  description: string
  completedBy: 'SYSTEM' | 'DRIVER' | 'PROVIDER'
}

export function getOAuthFlow(provider: Provider): OAuthFlowStep[] {
  const def = PROVIDER_DEFINITIONS[provider]
  if (!def.supportsOAuth) return []
  return [
    { step:1, label:'Initiation', description:`Taximètre.GOV génère un état OAuth sécurisé (anti-CSRF)`, completedBy:'SYSTEM' },
    { step:2, label:'Redirection', description:`Vous êtes redirigé vers ${def.name} — aucun mot de passe saisi dans notre app`, completedBy:'DRIVER' },
    { step:3, label:'Authentification', description:`Vous vous connectez à votre compte ${def.name}`, completedBy:'DRIVER' },
    { step:4, label:'Consentement', description:`${def.name} vous demande d'autoriser Taximètre.GOV pour: ${def.oauthScopes.join(', ')}`, completedBy:'DRIVER' },
    { step:5, label:'Callback', description:`${def.name} retourne un code d'autorisation à Taximètre.GOV`, completedBy:'PROVIDER' },
    { step:6, label:'Échange sécurisé', description:`Taximètre.GOV échange le code contre un token — côté serveur uniquement`, completedBy:'SYSTEM' },
    { step:7, label:'Vérification', description:`Taximètre.GOV vérifie l'identité du compte et crée la connexion`, completedBy:'SYSTEM' },
  ]
}

// ─── PROVIDER ADAPTER INTERFACE ──────────────────────────────
// Each provider implements this interface when officially approved

export interface ProviderAdapter {
  provider: Provider
  connect(driverId: string): Promise<{ authorizationUrl: string; state: string }>
  handleCallback(code: string, state: string, expectedState: string): Promise<DriverProviderConnection>
  refreshToken(connection: DriverProviderConnection): Promise<void>
  disconnect(connection: DriverProviderConnection): Promise<void>
  getAccountInfo(connection: DriverProviderConnection): Promise<{ externalAccountId: string; externalDriverId?: string }>
  getStatus(): Promise<{ available: boolean; degraded: boolean }>
}

// NOT_IMPLEMENTED — activated when official API approval received
export const PROVIDER_ADAPTERS: Partial<Record<Provider, ProviderAdapter>> = {}

// ─── MOCK CONNECTIONS (simulation) ───────────────────────────

export const mockConnections: DriverProviderConnection[] = [
  {
    id: 'CONN-001', driverId: 'DR-00001234', provider: 'uber',
    externalAccountId: 'UBER-ACC-••••456', externalDriverId: 'UBER-DRV-••••789',
    connectionStatus: 'CONNECTED', authorizationStatus: 'AUTHORIZED',
    scopes: ['partner.accounts', 'partner.trips', 'partner.payments'],
    connectedAt: new Date('2024-09-15').getTime(),
    lastSyncAt: new Date('2026-08-24T14:55:00Z').getTime(),
    lastSuccessfulSyncAt: new Date('2026-08-24T14:55:00Z').getTime(),
    tokenExpiresAt: new Date('2026-12-31').getTime(),
    totalTransactions: 247, totalRevenue: 4820.50,
    pendingTransactions: 0, syncErrorCount: 0, lastSyncError: null,
  },
  {
    id: 'CONN-002', driverId: 'DR-00001234', provider: 'lyft',
    externalAccountId: 'LYFT-ACC-••••789', externalDriverId: null,
    connectionStatus: 'TOKEN_EXPIRED', authorizationStatus: 'EXPIRED',
    scopes: ['rides.read', 'profile'],
    connectedAt: new Date('2024-10-01').getTime(),
    lastSyncAt: new Date('2026-08-23T18:00:00Z').getTime(),
    lastSuccessfulSyncAt: new Date('2026-08-20T10:00:00Z').getTime(),
    tokenExpiresAt: new Date('2026-08-23').getTime(),
    totalTransactions: 89, totalRevenue: 1640.20,
    pendingTransactions: 3, syncErrorCount: 2, lastSyncError: 'TOKEN_EXPIRED — re-authorization required',
  },
  {
    id: 'CONN-003', driverId: 'DR-00001234', provider: 'doordash',
    externalAccountId: 'DD-ACC-••••123', externalDriverId: 'DD-DRV-••••456',
    connectionStatus: 'CONNECTED', authorizationStatus: 'AUTHORIZED',
    scopes: ['dasher.read', 'payments.read'],
    connectedAt: new Date('2024-10-15').getTime(),
    lastSyncAt: new Date('2026-08-24T15:10:00Z').getTime(),
    lastSuccessfulSyncAt: new Date('2026-08-24T15:10:00Z').getTime(),
    tokenExpiresAt: new Date('2027-01-15').getTime(),
    totalTransactions: 412, totalRevenue: 6240.80,
    pendingTransactions: 0, syncErrorCount: 0, lastSyncError: null,
  },
  {
    id: 'CONN-004', driverId: 'DR-00001234', provider: 'skip',
    externalAccountId: 'SKIP-ACC-••••321', externalDriverId: null,
    connectionStatus: 'SYNC_ERROR', authorizationStatus: 'AUTHORIZED',
    scopes: [],
    connectedAt: new Date('2025-01-01').getTime(),
    lastSyncAt: new Date('2026-08-24T13:48:00Z').getTime(),
    lastSuccessfulSyncAt: new Date('2026-08-22T09:00:00Z').getTime(),
    tokenExpiresAt: null,
    totalTransactions: 156, totalRevenue: 2180.40,
    pendingTransactions: 5, syncErrorCount: 3, lastSyncError: 'Provider API timeout — retry scheduled',
  },
]

export const mockConnectionHistory: ConnectionHistoryEntry[] = [
  { entryId:'CH-001', driverId:'DR-00001234', provider:'uber', event:'CONNECTED', occurredAt:new Date('2024-09-15').getTime(), externalAccountMasked:'••••456', notes:'Connexion OAuth initiale' },
  { entryId:'CH-002', driverId:'DR-00001234', provider:'lyft', event:'CONNECTED', occurredAt:new Date('2024-10-01').getTime(), externalAccountMasked:'••••789', notes:'Connexion OAuth initiale' },
  { entryId:'CH-003', driverId:'DR-00001234', provider:'lyft', event:'TOKEN_EXPIRED', occurredAt:new Date('2026-08-23').getTime(), externalAccountMasked:'••••789', notes:'Token expiré — re-autorisation requise' },
  { entryId:'CH-004', driverId:'DR-00001234', provider:'doordash', event:'CONNECTED', occurredAt:new Date('2024-10-15').getTime(), externalAccountMasked:'••••123', notes:'Connexion OAuth initiale' },
  { entryId:'CH-005', driverId:'DR-00001234', provider:'skip', event:'SYNC_ERROR', occurredAt:new Date('2026-08-22').getTime(), externalAccountMasked:'••••321', notes:'API Skip — timeout intermittent' },
]

// ─── AUDIT EVENTS ─────────────────────────────────────────────

export const connectionAuditLog = [
  { action:'PROVIDER_CONNECTED', provider:'uber', timestamp:'2024-09-15T14:00:00Z', result:'SUCCESS' },
  { action:'PROVIDER_CONNECTED', provider:'doordash', timestamp:'2024-10-15T10:00:00Z', result:'SUCCESS' },
  { action:'TOKEN_EXPIRED', provider:'lyft', timestamp:'2026-08-23T18:00:00Z', result:'WARNING' },
  { action:'SYNC_COMPLETED', provider:'uber', timestamp:'2026-08-24T14:55:00Z', result:'SUCCESS' },
  { action:'SYNC_FAILED', provider:'skip', timestamp:'2026-08-24T13:48:00Z', result:'FAILURE' },
]

// ─── STATUS HELPERS ───────────────────────────────────────────

export function getConnectionForProvider(provider: Provider): DriverProviderConnection | null {
  return mockConnections.find(c => c.provider === provider) ?? null
}

export function getOverallStatus(conn: DriverProviderConnection | null): {
  label: string; color: string; icon: string; canSync: boolean
} {
  if (!conn) return { label:'Non connecté', color:'text-slate-500', icon:'⚫', canSync:false }
  const map: Record<ConnectionStatus, { label:string; color:string; icon:string; canSync:boolean }> = {
    CONNECTED: { label:'Connecté', color:'text-green-400', icon:'🟢', canSync:true },
    SYNCING: { label:'Synchronisation...', color:'text-blue-400', icon:'🔄', canSync:false },
    SYNC_ERROR: { label:'Erreur de sync', color:'text-red-400', icon:'🔴', canSync:true },
    TOKEN_EXPIRED: { label:'Token expiré', color:'text-amber-400', icon:'⚠️', canSync:false },
    REAUTH_REQUIRED: { label:'Ré-autorisation requise', color:'text-amber-400', icon:'🔑', canSync:false },
    NOT_CONNECTED: { label:'Non connecté', color:'text-slate-500', icon:'⚫', canSync:false },
    CONNECTING: { label:'Connexion...', color:'text-blue-400', icon:'🔄', canSync:false },
    DISCONNECTED: { label:'Déconnecté', color:'text-slate-500', icon:'⚫', canSync:false },
    SUSPENDED: { label:'Suspendu', color:'text-red-400', icon:'🚫', canSync:false },
    PENDING_REVIEW: { label:'En révision', color:'text-amber-400', icon:'🔍', canSync:false },
  }
  return map[conn.connectionStatus]
}

export function maskAccountId(id: string | null): string {
  if (!id) return '—'
  if (id.includes('••••')) return id
  return id.length > 4 ? '••••' + id.slice(-4) : '••••'
}
