// ============================================================
// TAXIMÈTRE.GOV — PLATFORM CONNECT — TYPE DEFINITIONS
// Step 4: Universal Revenue Gateway
// ============================================================

export type PlatformCode =
  | 'uber' | 'lyft' | 'doordash' | 'instacart' | 'ubereats' | 'skip'
  | 'taxi' | 'other'

export type PlatformCategory =
  | 'RIDESHARE' | 'TAXI' | 'DELIVERY' | 'FOOD_DELIVERY'
  | 'GROCERY_DELIVERY' | 'COURIER' | 'OTHER'

export type ActivityType =
  | 'RIDE' | 'TAXI_RIDE' | 'FOOD_DELIVERY' | 'GROCERY_DELIVERY'
  | 'COURIER_DELIVERY' | 'OTHER'

export type ConnectionStatus =
  | 'connected' | 'pending' | 'expired' | 'revoked' | 'error' | 'disconnected' | 'unmatched'

export type TransactionStatus =
  | 'RECEIVED' | 'PROCESSING' | 'COMPLETED' | 'FINALIZED'
  | 'REFUNDED' | 'CANCELLED' | 'DISPUTED' | 'FAILED'

export type FinancialStatus =
  | 'PENDING' | 'PROVISIONAL' | 'FINALIZED' | 'ADJUSTED' | 'REFUNDED' | 'DISPUTED'

export type WebhookStatus =
  | 'RECEIVED' | 'VERIFIED' | 'PROCESSED' | 'DUPLICATE'
  | 'FAILED' | 'RETRYING' | 'REJECTED' | 'DEAD_LETTER'

export type SignatureStatus = 'valid' | 'invalid' | 'missing' | 'skipped'

export type PlatformHealthStatus = 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'NOT_CONFIGURED'

export type Environment = 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION'

// ─── PLATFORM REGISTRY ──────────────────────────────────────
export interface Platform {
  id: string
  code: PlatformCode
  name: string
  category: PlatformCategory
  color: string
  apiEnabled: boolean
  oauthSupported: boolean
  webhookSupported: boolean
  status: 'active' | 'inactive' | 'mock'
  documentationUrl?: string
  activityTypes: ActivityType[]
  createdAt: string
  updatedAt: string
}

// ─── PLATFORM ACCOUNT ────────────────────────────────────────
export interface PlatformAccount {
  id: string
  governmentUserId: string    // TG-XXXXXX
  platformId: string
  platformCode: PlatformCode
  providerUserId: string      // UBER-XXXXXX (masked in UI)
  providerAccountReference: string
  connectionStatus: ConnectionStatus
  authorizationStatus: 'authorized' | 'unauthorized' | 'revoked' | 'pending'
  scopes: string[]
  connectedAt?: string
  disconnectedAt?: string
  lastSyncAt?: string
  lastSuccessfulEvent?: string
  tokenStatus: 'valid' | 'expired' | 'missing' | 'revoked'
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

// ─── OAUTH FLOW ───────────────────────────────────────────────
export interface OAuthState {
  stateToken: string          // Cryptographic random
  provider: PlatformCode
  governmentUserId: string
  expiresAt: string
  sessionId: string
  createdAt: string
}

export interface OAuthCallbackResult {
  success: boolean
  platformAccountId?: string
  providerUserId?: string
  error?: string
  reason?: 'invalid_state' | 'expired_state' | 'csrf_mismatch' | 'provider_error' | 'account_mismatch'
}

// ─── WEBHOOK EVENT ────────────────────────────────────────────
export interface WebhookEvent {
  id: string
  provider: PlatformCode
  eventId: string             // Provider event ID (for dedup)
  eventType: string
  providerTransactionId?: string
  payloadHash: string         // SHA-256 of raw payload
  signatureStatus: SignatureStatus
  receivedAt: string
  processedAt?: string
  processingStatus: WebhookStatus
  retryCount: number
  errorMessage?: string
  correlationId: string
  durationMs?: number
  rawPayload?: string         // Encrypted storage
}

// ─── UNIVERSAL ACTIVITY ───────────────────────────────────────
export interface Activity {
  activityId: string
  provider: PlatformCode
  providerActivityId: string
  governmentUserId: string
  platformAccountId: string
  vehicleId?: string
  activityType: ActivityType
  startedAt: string
  completedAt?: string
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  metadata: Record<string, unknown>
}

// ─── UNIVERSAL TRANSACTION ────────────────────────────────────
export interface Transaction {
  id: string
  internalTransactionId: string    // TG-TXN-2026-XXXXXXXXXX
  provider: PlatformCode
  providerTransactionId: string    // UNIQUE with provider
  platformAccountId: string
  governmentUserId: string
  activityId: string
  activityType: ActivityType
  grossAmount: number
  platformFee: number
  tip: number
  adjustment: number
  refund: number
  taxAmount: number
  netAmount: number
  currency: 'CAD'
  status: TransactionStatus
  financialStatus: FinancialStatus
  createdAt: string
  finalizedAt?: string
  // Raw + normalized data
  rawProviderData?: Record<string, unknown>
  normalizedData?: NormalizedTransaction
}

export interface NormalizedTransaction {
  grossAmount: number
  platformFee: number
  tip: number
  adjustment: number
  activityId: string
  activityType: ActivityType
  currency: 'CAD'
  originalCurrency?: string
}

// ─── FINANCIAL EVENTS ────────────────────────────────────────
export interface AdjustmentEvent {
  id: string
  originalTransactionId: string
  amount: number              // positive = add, negative = subtract
  reason: string
  providerReference?: string
  createdAt: string
}

export interface TipEvent {
  id: string
  originalTransactionId: string
  amount: number
  createdAt: string
}

export interface RefundEvent {
  id: string
  originalTransactionId: string
  amount: number
  reason: string
  providerReference?: string
  createdAt: string
}

// ─── RECONCILIATION ───────────────────────────────────────────
export type ReconciliationResult =
  | 'MATCH' | 'MISSING' | 'DUPLICATE' | 'AMOUNT_MISMATCH'
  | 'STATUS_MISMATCH' | 'UNRESOLVED'

export interface ReconciliationRecord {
  transactionId: string
  provider: PlatformCode
  providerAmount: number
  ledgerAmount: number
  result: ReconciliationResult
  checkedAt: string
}

// ─── PLATFORM HEALTH ─────────────────────────────────────────
export interface PlatformHealth {
  provider: PlatformCode
  apiStatus: PlatformHealthStatus
  oauthStatus: PlatformHealthStatus
  webhookStatus: PlatformHealthStatus
  lastEvent?: string
  lastSuccessfulSync?: string
  errorRatePercent: number
  avgLatencyMs: number
  connectedAccounts: number
  todayEvents: number
  todaySuccessful: number
  todayFailed: number
  todayDuplicates: number
}

// ─── PLATFORM ADAPTER INTERFACE ──────────────────────────────
export interface PlatformAdapter {
  provider: PlatformCode
  connect(governmentUserId: string): Promise<{ authUrl: string; state: OAuthState }>
  disconnect(platformAccountId: string): Promise<void>
  getAccount(platformAccountId: string): Promise<Partial<PlatformAccount>>
  getTrips(platformAccountId: string, since?: string): Promise<Activity[]>
  getDeliveries(platformAccountId: string, since?: string): Promise<Activity[]>
  getTransaction(providerTransactionId: string): Promise<Partial<Transaction>>
  verifyWebhook(headers: Record<string, string>, body: string, secret?: string): boolean
  normalizeEvent(rawEvent: Record<string, unknown>, eventType: string): NormalizedTransaction | null
}

// ─── AUDIT EVENT TYPES ────────────────────────────────────────
export type AuditEventType =
  | 'PLATFORM_CONNECTED' | 'PLATFORM_DISCONNECTED'
  | 'OAUTH_STARTED' | 'OAUTH_COMPLETED' | 'OAUTH_FAILED'
  | 'WEBHOOK_RECEIVED' | 'WEBHOOK_VERIFIED' | 'WEBHOOK_REJECTED'
  | 'WEBHOOK_DUPLICATE' | 'TRANSACTION_CREATED' | 'TRANSACTION_FINALIZED'
  | 'TRANSACTION_ADJUSTED' | 'REFUND_CREATED'
  | 'ACCOUNT_MATCHED' | 'ACCOUNT_UNMATCHED'
