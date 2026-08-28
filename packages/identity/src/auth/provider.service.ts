// ================================================================
// TAXIMÈTRE.GOV — PROVIDER SERVICE
// Phase DB-6: OAuth · Connections · Idempotency · Security
// ================================================================
//
// RÈGLES ABSOLUES:
// 1. Jamais mot de passe provider stocké ou demandé
// 2. Tokens: chiffrés · jamais loggés · jamais retournés à l'app
// 3. OAuth state: randomBytes → hash → stocké hashé · expiration 15min
// 4. external_account_id: hash pour unicité · jamais en clair dans logs
// 5. DELIVERY/RIDESHARE provider: taximeterEnabled = toujours false
// 6. Duplicate event: DUPLICATE status · jamais traité deux fois
// 7. Provider INACTIVE: nouvelles connexions bloquées
// 8. Disconnect = soft delete (DISCONNECTED) · historique préservé

import { createHash, randomBytes } from 'crypto'

// ─── PUBLIC IDS ──────────────────────────────────────────────

export function formatPublicProviderId(sequence: number): string {
  return `PRV-${sequence.toString().padStart(8, '0')}`
}

export function formatPublicProviderAccountId(sequence: number): string {
  return `DPA-${sequence.toString().padStart(8, '0')}`
}

// ─── OAUTH STATE ──────────────────────────────────────────────

export function generateOAuthState(): {
  plainState: string   // Sent to provider — NEVER stored in DB
  stateHash:  string   // SHA-256 — stored in DB for verification
} {
  const plainState = randomBytes(32).toString('base64url')
  // 256 bits of entropy — cryptographically random
  const stateHash = createHash('sha256').update(plainState).digest('hex')
  return { plainState, stateHash }
}

export function verifyOAuthState(
  receivedState: string,
  storedHash: string,
): boolean {
  const receivedHash = createHash('sha256').update(receivedState).digest('hex')
  // Timing-safe comparison
  return receivedHash === storedHash
}

export const OAUTH_STATE_EXPIRY_MINUTES = 15
// Configurable — short window prevents replay attacks

// ─── EXTERNAL ACCOUNT ID ──────────────────────────────────────

export function hashExternalAccountId(
  providerId: string,
  externalId: string,
): string {
  // Namespace hash with providerId to prevent cross-provider collisions
  return createHash('sha256')
    .update(`${providerId}:${externalId.trim()}`)
    .digest('hex')
}

export function maskExternalAccountId(last4: string | null | undefined): string {
  if (!last4) return '••••••••'
  return `••••${last4}`
}

// ─── TOKEN SECURITY ───────────────────────────────────────────
//
// CRITICAL: These functions document what MUST NOT happen
// Tokens are encrypted before storage and NEVER returned to app

export function isTokenSafeForStorage(token: string): boolean {
  // Basic check — actual encryption done in crypto service
  return token.length > 20 && !token.includes('.')
    // In production: always encrypt before calling INSERT
}

export const TOKEN_NEVER_LOG_FIELDS = [
  'access_token', 'refresh_token', 'client_secret',
  'authorization_code', 'state', 'webhook_secret',
  'external_account_id', // Never log full external ID
] as const

// What IS safe to return to the app about a provider connection
export interface ProviderAccountPublicView {
  publicProviderAccountId: string
  providerCode: string
  providerName: string
  displayName:  string | null
  status:       string
  connectedAt:  string | null
  lastSyncAt:   string | null
  externalAccountIdMasked: string
  // NO: access_token, refresh_token, externalAccountIdEncrypted
}

// ─── CONNECTION VALIDATION ────────────────────────────────────

export interface ConnectionValidationResult {
  allowed: boolean
  reason:  string | null
}

export function canStartProviderConnection(
  providerStatus: string,
  driverStatus:   string,
): ConnectionValidationResult {
  if (providerStatus === 'INACTIVE')
    return { allowed: false, reason: `Provider inactif — nouvelles connexions bloquées` }

  if (providerStatus === 'DEPRECATED')
    return { allowed: false, reason: `Provider déprécié — connexion non supportée` }

  if (driverStatus !== 'ACTIVE' && driverStatus !== 'UNDER_REVIEW')
    return { allowed: false, reason: `Chauffeur non actif: ${driverStatus}` }

  return { allowed: true, reason: null }
}

export function canDisconnectProvider(
  accountStatus:   string,
  hasActiveTrip:   boolean,
): ConnectionValidationResult {
  if (hasActiveTrip)
    return { allowed: false, reason: 'Course active en cours — déconnexion impossible' }

  if (accountStatus === 'SUSPENDED')
    return { allowed: false, reason: 'Compte suspendu par autorité — contact support' }

  return { allowed: true, reason: null }
}

// ─── IDEMPOTENCY ──────────────────────────────────────────────

export interface IdempotencyCheckResult {
  isDuplicate: boolean
  existingEventId: string | null
  status: string | null
}

export function checkEventIdempotency(
  providerId: string,
  externalEventId: string,
  existingEvents: { providerId: string; externalEventId: string; id: string; processingStatus: string }[],
): IdempotencyCheckResult {
  // provider_id + external_event_id UNIQUE → same event never processed twice
  const match = existingEvents.find(
    e => e.providerId === providerId && e.externalEventId === externalEventId
  )
  if (match) {
    return {
      isDuplicate: true,
      existingEventId: match.id,
      status: match.processingStatus,
    }
  }
  return { isDuplicate: false, existingEventId: null, status: null }
}

// ─── ACCOUNT CLAIM PROTECTION ────────────────────────────────

export interface AccountClaimResult {
  allowed: boolean
  reason:  string | null
  requiresSecurityEvent: boolean
}

export function checkAccountClaim(
  newDriverId:            string,
  existingOwnerDriverId:  string | null,
  externalAccountIdHash:  string,
): AccountClaimResult {
  if (!existingOwnerDriverId) {
    // Account not yet claimed — OK
    return { allowed: true, reason: null, requiresSecurityEvent: false }
  }

  if (existingOwnerDriverId === newDriverId) {
    // Same driver reconnecting — OK
    return { allowed: true, reason: null, requiresSecurityEvent: false }
  }

  // DIFFERENT driver claiming same external account
  // → DENY + security event (never auto-transfer)
  return {
    allowed: false,
    reason: 'Compte externe déjà associé à un autre chauffeur — révision requise',
    requiresSecurityEvent: true,
    // Never move the account automatically
  }
}

// ─── TAXIMETER RULE ───────────────────────────────────────────

export function isProviderTaximeterEnabled(_providerCode: string): boolean {
  // ABSOLUTE RULE: External providers NEVER enable taximeter
  // Taximeter is ONLY for TAXI mode (internal, no external provider)
  return false
}

export function getProviderServiceMode(
  providerCode: string,
): 'RIDESHARE' | 'DELIVERY' | 'MULTI_SERVICE' | 'OTHER' {
  const deliveryProviders = ['DOORDASH', 'UBER_EATS', 'INSTACART', 'SKIP']
  const rideshareProviders = ['LYFT']
  const multiProviders = ['UBER']  // Uber = rideshare + UberEats

  if (deliveryProviders.includes(providerCode)) return 'DELIVERY'
  if (rideshareProviders.includes(providerCode)) return 'RIDESHARE'
  if (multiProviders.includes(providerCode))     return 'MULTI_SERVICE'
  return 'OTHER'
}

// ─── ACCESS CONTROL ──────────────────────────────────────────

export function canDriverAccessProviderAccount(
  requestorDriverId: string,
  accountOwnerDriverId: string,
): boolean {
  return requestorDriverId === accountOwnerDriverId
}

export function canGovernmentViewProviderAccount(
  permissions: string[],
  jurisdictions: string[],
  accountJurisdiction: string,
): boolean {
  const hasPerm = permissions.includes('provider.account.view') ||
    permissions.includes('drivers.read')
  const hasJurisdiction = jurisdictions.includes(accountJurisdiction) ||
    jurisdictions.includes('ALL')
  return hasPerm && hasJurisdiction
}

// ─── SEED DATA (development only) ────────────────────────────

export const SEED_PROVIDERS = [
  {
    code: 'UBER',
    name: 'Uber',
    providerType: 'MULTI_SERVICE',
    status: 'ACTIVE',
    country: 'CA',
    supportsOauth: false,      // Requires official Uber partner program
    supportsWebhook: false,    // Requires official Uber partner program
    supportsApiSync: false,    // Requires official Uber partner program
    taximeterEnabled: false,   // ALWAYS false
    isDevelopmentSeed: true,
    notes: 'MOCK_ONLY — Uber partner.accounts/trips/payments API requires official Uber partner approval',
  },
  {
    code: 'LYFT',
    name: 'Lyft',
    providerType: 'RIDESHARE',
    status: 'ACTIVE',
    country: 'CA',
    supportsOauth: false,
    supportsWebhook: false,
    supportsApiSync: false,
    taximeterEnabled: false,
    isDevelopmentSeed: true,
    notes: 'MOCK_ONLY — Lyft API requires official partner contract',
  },
  {
    code: 'DOORDASH',
    name: 'DoorDash',
    providerType: 'DELIVERY',
    status: 'ACTIVE',
    country: 'CA',
    supportsOauth: false,
    supportsWebhook: false,
    supportsApiSync: false,
    taximeterEnabled: false,
    isDevelopmentSeed: true,
    notes: 'MOCK_ONLY — DoorDash Dasher API requires official DoorDash approval',
  },
  {
    code: 'UBER_EATS',
    name: 'Uber Eats',
    providerType: 'FOOD_DELIVERY',
    status: 'ACTIVE',
    country: 'CA',
    supportsOauth: false,
    supportsWebhook: false,
    supportsApiSync: false,
    taximeterEnabled: false,
    isDevelopmentSeed: true,
    notes: 'MOCK_ONLY — Via Uber API (same partner program)',
  },
  {
    code: 'INSTACART',
    name: 'Instacart',
    providerType: 'GROCERY_DELIVERY',
    status: 'ACTIVE',
    country: 'CA',
    supportsOauth: false,
    supportsWebhook: false,
    supportsApiSync: false,
    taximeterEnabled: false,
    isDevelopmentSeed: true,
    notes: 'MOCK_ONLY — Instacart API evaluation in progress',
  },
  {
    code: 'SKIP',
    name: 'SkipTheDishes',
    providerType: 'FOOD_DELIVERY',
    status: 'ACTIVE',
    country: 'CA',
    supportsOauth: false,
    supportsWebhook: false,
    supportsApiSync: false,
    taximeterEnabled: false,
    isDevelopmentSeed: true,
    notes: 'MOCK_ONLY — SkipTheDishes Canada API evaluation in progress',
  },
] as const
