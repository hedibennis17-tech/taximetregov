// ================================================================
// TAXIMÈTRE.GOV — NOTIFICATION & EVENT SERVICE
// Phase DB-10: Routing · Idempotency · Retry · Dead Letter
// ================================================================

import { createHash, randomBytes } from 'crypto'

// ─── PUBLIC IDS ──────────────────────────────────────────────

export function formatPublicNotificationId(seq: number): string {
  return `NTF-${seq.toString().padStart(8, '0')}`
}

// ─── EVENT IDEMPOTENCY ───────────────────────────────────────

export function buildEventId(sourceService: string, internalId: string): string {
  // Deterministic event ID — same source + same internal ID = same event
  return createHash('sha256')
    .update(`${sourceService}:${internalId}`)
    .digest('hex')
    .slice(0, 64)
}

export function generateCorrelationId(): string {
  // Random UUID-like — traces an entire flow end-to-end
  return randomBytes(16).toString('hex').replace(
    /^(.{8})(.{4})(.{4})(.{4})(.{12})$/,
    '$1-$2-$3-$4-$5',
  )
}

// ─── NOTIFICATION ROUTING ────────────────────────────────────

export type NotificationChannel = 'PUSH' | 'EMAIL' | 'SMS' | 'IN_APP'
export type NotificationPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW'
export type NotificationType = string

// Security notification types — NEVER opt-out
export const MANDATORY_NOTIFICATION_TYPES = new Set([
  'SECURITY_ALERT',
  'NEW_DEVICE_LOGIN',
  'ACCOUNT_LOCKED',
  'PASSWORD_CHANGED',
  'SUSPICIOUS_ACTIVITY',
])

export function isMandatoryNotification(notifType: NotificationType): boolean {
  return MANDATORY_NOTIFICATION_TYPES.has(notifType)
}

export interface NotificationPrefs {
  pushEnabled:    boolean
  emailEnabled:   boolean
  smsEnabled:     boolean
  inAppEnabled:   boolean
  disabledTypes?: string[]
}

export interface RoutingResult {
  channels:    NotificationChannel[]
  isMandatory: boolean
  skipReason:  string | null
}

export function routeNotification(
  notifType:    NotificationType,
  priority:     NotificationPriority,
  prefs:        NotificationPrefs,
): RoutingResult {
  const mandatory = isMandatoryNotification(notifType)

  // Security: always send regardless of preferences
  if (mandatory) {
    const channels: NotificationChannel[] = ['IN_APP']
    if (prefs.pushEnabled)  channels.push('PUSH')
    if (prefs.emailEnabled) channels.push('EMAIL')
    return { channels, isMandatory: true, skipReason: null }
  }

  // Check if type is disabled by user
  if (prefs.disabledTypes?.includes(notifType)) {
    return { channels: [], isMandatory: false, skipReason: `Type désactivé par l'utilisateur: ${notifType}` }
  }

  // Route based on priority and enabled channels
  const channels: NotificationChannel[] = []

  if (prefs.inAppEnabled) channels.push('IN_APP')

  if (priority === 'HIGH' || priority === 'CRITICAL') {
    if (prefs.pushEnabled)  channels.push('PUSH')
    if (prefs.emailEnabled) channels.push('EMAIL')
  } else if (priority === 'NORMAL') {
    if (prefs.pushEnabled) channels.push('PUSH')
  }
  // LOW priority: in-app only

  if (channels.length === 0) {
    return { channels: [], isMandatory: false, skipReason: 'Tous les canaux désactivés' }
  }

  return { channels, isMandatory: false, skipReason: null }
}

// ─── RETRY LOGIC ─────────────────────────────────────────────

export interface RetrySchedule {
  shouldRetry:  boolean
  nextRetryAt:  Date | null
  reason:       string | null
}

export function computeNextRetry(
  attemptCount:  number,
  maxAttempts:   number,
  baseDelayMs:   number = 60_000,  // 1 minute base
): RetrySchedule {
  if (attemptCount >= maxAttempts) {
    return {
      shouldRetry: false,
      nextRetryAt: null,
      reason: `Max tentatives atteint (${maxAttempts}) → DEAD_LETTER`,
    }
  }

  // Exponential backoff: delay = baseDelay * 2^attempt (capped at 1 hour)
  const delayMs = Math.min(
    baseDelayMs * Math.pow(2, attemptCount),
    60 * 60 * 1000,  // 1 hour cap — configurable
  )
  const nextRetryAt = new Date(Date.now() + delayMs)

  return {
    shouldRetry: true,
    nextRetryAt,
    reason: null,
  }
}

// ─── DEAD LETTER ─────────────────────────────────────────────

export interface DeadLetterEntry {
  sourceType:    string
  sourceId:      string
  failureCode:   string
  failureDetail: string
  totalAttempts: number
  requiresManualReview: boolean
}

export function buildDeadLetterEntry(params: {
  sourceType:    'WEBHOOK' | 'SYNC_QUEUE' | 'SYSTEM_EVENT' | 'NOTIFICATION'
  sourceId:      string
  failureCode:   string
  failureDetail: string  // NEVER includes token/password/NAS
  totalAttempts: number
}): DeadLetterEntry {
  return {
    ...params,
    requiresManualReview: true,
    // Dead letter ALWAYS requires human review — never auto-resolved
  }
}

// ─── WEBHOOK PAYLOAD HASH ────────────────────────────────────

export function hashWebhookPayload(rawBody: string | Buffer): string {
  // SHA-256 of raw body — stored for integrity verification
  // Raw body itself NEVER stored in database
  return createHash('sha256')
    .update(typeof rawBody === 'string' ? rawBody : rawBody)
    .digest('hex')
}

export function verifyWebhookSignature(
  rawBody:       string,
  signature:     string,
  secretHash:    string,  // SHA-256 of secret — never raw secret stored
  method:        string,
): boolean {
  // Verification logic — actual implementation depends on provider
  // Returns false for unrecognized methods (fail-safe)
  if (method !== 'HMAC_SHA256' && method !== 'RSA_SHA256') return false
  // Real HMAC verification would happen here
  return signature.length > 0 && secretHash.length > 0
}

// ─── SYNC QUEUE HELPERS ───────────────────────────────────────

export interface SyncOperation {
  operationType: string
  resourceType:  string | null
  resourceId:    string | null
  driverId:      string
  priority:      NotificationPriority
  createdOfflineAt: Date | null
}

export function buildSyncPayload(op: SyncOperation): Record<string, unknown> {
  // Payload must be non-sensitive
  return {
    operationType:    op.operationType,
    resourceType:     op.resourceType,
    resourceId:       op.resourceId,
    priority:         op.priority,
    createdOfflineAt: op.createdOfflineAt?.toISOString() ?? null,
    // NEVER: tokens, raw card data, passwords, full account numbers
  }
}

// ─── ACCESS CONTROL ──────────────────────────────────────────

export function canDriverReceiveNotification(
  requestorUserId: string,
  notifUserId:     string,
): boolean {
  // Driver A NEVER receives Driver B's notifications
  return requestorUserId === notifUserId
}

export function canGovernmentViewNotifications(
  permissions:   string[],
  jurisdictions: string[],
  notifJurisdiction: string,
): boolean {
  const hasPerm = permissions.includes('drivers.read') ||
    permissions.includes('security.view')
  const hasJurisdiction = jurisdictions.includes(notifJurisdiction) ||
    jurisdictions.includes('ALL')
  return hasPerm && hasJurisdiction
}

// ─── EVENT BUS ───────────────────────────────────────────────

export interface SystemEventPayload {
  eventId:       string   // Source-provided — idempotency key
  sourceService: string
  eventType:     string
  resourceType:  string | null
  resourceId:    string | null
  driverId:      string | null
  correlationId: string
  metadata:      Record<string, string | number | boolean | null>
  // NEVER: password, token, NAS, raw payload
}

export function buildSystemEvent(params: SystemEventPayload): SystemEventPayload {
  // Validate no sensitive keys in metadata
  const forbidden = ['password', 'token', 'secret', 'nas', 'sin', 'card', 'iban']
  for (const key of Object.keys(params.metadata)) {
    if (forbidden.some(f => key.toLowerCase().includes(f))) {
      throw new Error(`Métadonnée interdite dans événement système: ${key}`)
    }
  }
  return params
}

// ─── SEED DATA (development only) ────────────────────────────

export const SEED_NOTIFICATIONS = [
  {
    publicNotificationId: 'NTF-00000001',
    notifType:  'SECURITY_ALERT',
    priority:   'CRITICAL',
    channel:    'IN_APP',
    titleFr:    'Nouvelle connexion détectée',
    bodyFr:     'Une connexion depuis un nouvel appareil a été détectée sur votre compte.',
    isMandatory: true,
    isDev:      true,
  },
  {
    publicNotificationId: 'NTF-00000002',
    notifType:  'TRIP_COMPLETED',
    priority:   'NORMAL',
    channel:    'PUSH',
    titleFr:    'Course terminée',
    bodyFr:     'Votre course TRP-00000001 est terminée. Montant: 28.45 CAD.',
    isMandatory: false,
    isDev:      true,
  },
  {
    publicNotificationId: 'NTF-00000003',
    notifType:  'DOCUMENT_EXPIRING',
    priority:   'HIGH',
    channel:    'EMAIL',
    titleFr:    'Document expirant bientôt',
    bodyFr:     'Votre permis de conduire expire dans 30 jours. Renouvelez-le avant expiration.',
    isMandatory: false,
    isDev:      true,
  },
  {
    publicNotificationId: 'NTF-00000004',
    notifType:  'PAYMENT_FAILED',
    priority:   'HIGH',
    channel:    'PUSH',
    titleFr:    'Paiement échoué',
    bodyFr:     'Le paiement pour la course TRP-00000002 a échoué. Aucun montant débité.',
    isMandatory: false,
    isDev:      true,
  },
] as const
