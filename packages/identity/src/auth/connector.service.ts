// ================================================================
// TAXIMÈTRE.GOV — CONNECTOR & PIPELINE SERVICE
// Phase DB-18: Connectors · Pipeline · Rate Limits · Checkpoints
// ================================================================

import { createHash } from 'crypto'

// ─── PUBLIC IDS ──────────────────────────────────────────────

export function formatConnectorId(seq: number): string {
  return `CON-${seq.toString().padStart(8, '0')}`
}
export function formatPipelineRunId(seq: number): string {
  return `PLR-${seq.toString().padStart(8, '0')}`
}

// ─── PIPELINE RUN KEY (idempotency) ──────────────────────────

export function buildPipelineRunKey(
  connectorId: string,
  runType:     string,
  periodRef:   string,
  triggeredBy: string,
): string {
  // Même run jamais re-déclenché
  return createHash('sha256')
    .update(`${connectorId}:${runType}:${periodRef}:${triggeredBy}`)
    .digest('hex')
    .slice(0, 64)
}

// ─── CONNECTOR STATUS RULES ───────────────────────────────────

export type ConnectorStatus =
  | 'MOCK_ONLY' | 'SANDBOX' | 'PILOT' | 'PRODUCTION' | 'DEPRECATED' | 'DISABLED'

export interface ConnectorCapabilityCheck {
  canMakeApiCalls:   boolean
  canReceiveWebhooks: boolean
  isMock:            boolean
  reason:            string | null
}

export function checkConnectorCapabilities(
  status:              ConnectorStatus,
  partnerApprovalRef:  string | null,
  supportsWebhook:     boolean,
  supportsApiPull:     boolean,
): ConnectorCapabilityCheck {
  if (status === 'MOCK_ONLY') {
    return {
      canMakeApiCalls:    false,
      canReceiveWebhooks: false,
      isMock:             true,
      reason:             'MOCK_ONLY — approbation partenaire officielle requise',
    }
  }
  if (status === 'DISABLED' || status === 'DEPRECATED') {
    return {
      canMakeApiCalls:    false,
      canReceiveWebhooks: false,
      isMock:             false,
      reason:             `Connecteur ${status}`,
    }
  }
  if (!partnerApprovalRef) {
    return {
      canMakeApiCalls:    false,
      canReceiveWebhooks: false,
      isMock:             true,
      reason:             'Référence approbation partenaire manquante — mock imposé',
    }
  }
  return {
    canMakeApiCalls:    supportsApiPull,
    canReceiveWebhooks: supportsWebhook,
    isMock:             false,
    reason:             null,
  }
}

// ─── RATE LIMIT GUARD ────────────────────────────────────────

export interface RateLimitCheck {
  allowed:           boolean
  remainingRequests: number | null
  resetInSeconds:    number | null
  reason:            string | null
}

export function checkRateLimit(
  currentCount:  number,
  maxRequests:   number,
  windowResetAt: Date | null,
): RateLimitCheck {
  if (currentCount >= maxRequests) {
    const resetIn = windowResetAt
      ? Math.max(0, Math.ceil((windowResetAt.getTime() - Date.now()) / 1000))
      : null
    return {
      allowed:           false,
      remainingRequests: 0,
      resetInSeconds:    resetIn,
      reason:            `Limite atteinte (${currentCount}/${maxRequests}) — attendre ${resetIn ?? '?'}s`,
    }
  }
  return {
    allowed:           true,
    remainingRequests: maxRequests - currentCount,
    resetInSeconds:    null,
    reason:            null,
  }
}

// ─── CHECKPOINT MANAGEMENT ────────────────────────────────────

export interface CheckpointUpdateResult {
  shouldFullResync: boolean
  reason:           string | null
}

export function assessCheckpoint(
  cursorExpiresAt:   Date | null,
  consecutiveErrors: number,
  maxConsecutiveErrors: number = 5,
): CheckpointUpdateResult {
  // Cursor expiré → resync complet
  if (cursorExpiresAt && cursorExpiresAt < new Date()) {
    return {
      shouldFullResync: true,
      reason:           'Cursor expiré — resync complet nécessaire',
    }
  }
  // Trop d'erreurs consécutives → alerte (pas auto-resync)
  if (consecutiveErrors >= maxConsecutiveErrors) {
    return {
      shouldFullResync: false,
      reason:           `${consecutiveErrors} erreurs consécutives — révision manuelle recommandée`,
    }
  }
  return { shouldFullResync: false, reason: null }
}

// ─── PIPELINE STAGE VALIDATION ────────────────────────────────

export type PipelineStageType =
  | 'FETCH' | 'VALIDATE' | 'NORMALIZE' | 'ENRICH'
  | 'PERSIST' | 'NOTIFY' | 'RECONCILE' | 'FINALIZE'

export const STAGE_EXECUTION_ORDER: PipelineStageType[] = [
  'FETCH', 'VALIDATE', 'NORMALIZE', 'ENRICH',
  'PERSIST', 'NOTIFY', 'RECONCILE', 'FINALIZE',
]

export function isStageOrderValid(stages: { stageType: PipelineStageType; stageOrder: number }[]): boolean {
  // Vérifie que les stages suivent l'ordre défini
  const sorted = [...stages].sort((a, b) => a.stageOrder - b.stageOrder)
  return sorted.every((s, i) => {
    const expected = STAGE_EXECUTION_ORDER.indexOf(s.stageType)
    if (i === 0) return true
    const prev = sorted[i - 1]!
    return STAGE_EXECUTION_ORDER.indexOf(prev.stageType) < expected
  })
}

// ─── CONFIG VERSIONING ───────────────────────────────────────

export interface ConfigVersionResult {
  canModify:    boolean
  reason:       string | null
  mustVersion:  boolean
}

export function checkConfigModification(status: string): ConfigVersionResult {
  if (status === 'PUBLISHED') {
    return {
      canModify:   false,
      reason:      'Config PUBLISHED = immuable · créer une nouvelle version',
      mustVersion: true,
    }
  }
  if (status === 'DEPRECATED') {
    return {
      canModify:   false,
      reason:      'Config DEPRECATED · créer une nouvelle version',
      mustVersion: true,
    }
  }
  return { canModify: true, reason: null, mustVersion: false }
}

// ─── TAXIMETER RULE ───────────────────────────────────────────

export function isConnectorTaximeterEnabled(_connectorType: string): false {
  // RÈGLE ABSOLUE: connecteurs externes JAMAIS activent le taximètre
  return false
}

// ─── ACCESS CONTROL ──────────────────────────────────────────

export function canAdminManageConnector(permissions: string[]): boolean {
  return permissions.includes('connectors.manage')
}

export function canAdminPublishConfig(permissions: string[]): boolean {
  return permissions.includes('connectors.publish')
}

export function canViewPipelineRuns(permissions: string[]): boolean {
  return permissions.includes('connectors.read') ||
    permissions.includes('pipeline.read')
}

// ─── SEED DATA (development only) ────────────────────────────

export const SEED_PLATFORM_CONNECTORS = [
  {
    connectorType: 'UBER',
    name:          'UberConnector',
    status:        'MOCK_ONLY',
    authType:      'OAUTH2_AUTHORIZATION_CODE',
    supportsWebhook:     false,
    supportsApiPull:     false,
    supportsOauth:       false,
    supportsBatchExport: false,
    taximeterEnabled:    false,
    partnerApprovalReference: null,
    // Uber Driver API (partner.accounts, partner.trips, partner.payments)
    // requires official Uber partner program approval — not yet obtained
    isDev: true,
  },
  {
    connectorType: 'LYFT',
    name:          'LyftConnector',
    status:        'MOCK_ONLY',
    authType:      'OAUTH2_AUTHORIZATION_CODE',
    supportsWebhook: false, supportsApiPull: false,
    supportsOauth: false, supportsBatchExport: false,
    taximeterEnabled: false,
    partnerApprovalReference: null,
    isDev: true,
  },
  {
    connectorType: 'DOORDASH',
    name:          'DoorDashConnector',
    status:        'MOCK_ONLY',
    authType:      'OAUTH2_CLIENT_CREDENTIALS',
    supportsWebhook: false, supportsApiPull: false,
    supportsOauth: false, supportsBatchExport: false,
    taximeterEnabled: false,
    partnerApprovalReference: null,
    isDev: true,
  },
  {
    connectorType: 'INSTACART',
    name:          'InstacartConnector',
    status:        'MOCK_ONLY',
    authType:      'API_KEY',
    supportsWebhook: false, supportsApiPull: false,
    supportsOauth: false, supportsBatchExport: false,
    taximeterEnabled: false,
    partnerApprovalReference: null,
    isDev: true,
  },
  {
    connectorType: 'UBER_EATS',
    name:          'UberEatsConnector',
    status:        'MOCK_ONLY',
    authType:      'OAUTH2_AUTHORIZATION_CODE',
    supportsWebhook: false, supportsApiPull: false,
    supportsOauth: false, supportsBatchExport: false,
    taximeterEnabled: false,
    partnerApprovalReference: null,
    isDev: true,
  },
  {
    connectorType: 'SKIP',
    name:          'SkipConnector',
    status:        'MOCK_ONLY',
    authType:      'API_KEY',
    supportsWebhook: false, supportsApiPull: false,
    supportsOauth: false, supportsBatchExport: false,
    taximeterEnabled: false,
    partnerApprovalReference: null,
    isDev: true,
  },
] as const
