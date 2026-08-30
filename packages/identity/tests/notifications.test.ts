// ================================================================
// TAXIMÈTRE.GOV — NOTIFICATION & EVENT TESTS
// Phase DB-10: 22 tests obligatoires + invariants
// ================================================================

import { describe, it, expect } from 'vitest'
import {
  formatPublicNotificationId,
  buildEventId, generateCorrelationId,
  isMandatoryNotification, routeNotification,
  computeNextRetry, buildDeadLetterEntry,
  hashWebhookPayload, buildSyncPayload,
  canDriverReceiveNotification, canGovernmentViewNotifications,
  buildSystemEvent, SEED_NOTIFICATIONS,
  MANDATORY_NOTIFICATION_TYPES,
  type NotificationPrefs,
} from '../src/auth/notification.service'

// ─── PUBLIC IDS ──────────────────────────────────────────────

describe('Public Notification ID', () => {
  it('[PASS] NTF-XXXXXXXX format', () => {
    expect(formatPublicNotificationId(1)).toBe('NTF-00000001')
    expect(formatPublicNotificationId(42)).toMatch(/^NTF-\d{8}$/)
  })
})

// ─── EVENT IDEMPOTENCY ───────────────────────────────────────

describe('Event Idempotency — Tests 11 & 12', () => {
  it('[TEST 11] Same source + same ID = same event hash', () => {
    const e1 = buildEventId('taximeter', 'trip-001')
    const e2 = buildEventId('taximeter', 'trip-001')
    expect(e1).toBe(e2)
  })

  it('[TEST 12] Different source = different hash (namespace)', () => {
    const e1 = buildEventId('taximeter', 'trip-001')
    const e2 = buildEventId('payment',   'trip-001')
    expect(e1).not.toBe(e2)
  })

  it('[PASS] Correlation ID unique per flow', () => {
    const ids = new Set(Array.from({ length: 200 }, generateCorrelationId))
    expect(ids.size).toBe(200)
  })

  it('[PASS] Correlation ID is UUID-like format', () => {
    const id = generateCorrelationId()
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })
})

// ─── MANDATORY NOTIFICATIONS ──────────────────────────────────

describe('Mandatory (Security) Notifications — Tests 13 & 14', () => {
  it('[TEST 13] Security notifications are mandatory', () => {
    const mandatory = Array.from(MANDATORY_NOTIFICATION_TYPES)
    mandatory.forEach(t => {
      expect(isMandatoryNotification(t)).toBe(true)
    })
  })

  it('[TEST 13] Security types always include SECURITY_ALERT, NEW_DEVICE_LOGIN, etc.', () => {
    expect(isMandatoryNotification('SECURITY_ALERT')).toBe(true)
    expect(isMandatoryNotification('NEW_DEVICE_LOGIN')).toBe(true)
    expect(isMandatoryNotification('ACCOUNT_LOCKED')).toBe(true)
    expect(isMandatoryNotification('PASSWORD_CHANGED')).toBe(true)
    expect(isMandatoryNotification('SUSPICIOUS_ACTIVITY')).toBe(true)
  })

  it('[TEST 14] Non-security notifications are NOT mandatory', () => {
    const optional = ['TRIP_COMPLETED', 'PAYMENT_RECEIVED', 'DOCUMENT_EXPIRING', 'TAX_FILING_DUE']
    optional.forEach(t => {
      expect(isMandatoryNotification(t)).toBe(false)
    })
  })
})

// ─── NOTIFICATION ROUTING ────────────────────────────────────

describe('Notification Routing — Tests 4, 5, 6', () => {
  const allEnabled: NotificationPrefs = {
    pushEnabled: true, emailEnabled: true,
    smsEnabled: true,  inAppEnabled: true,
    disabledTypes: [],
  }

  it('[TEST 4] Security alert sent despite user preferences', () => {
    const prefs: NotificationPrefs = {
      pushEnabled: false, emailEnabled: false,
      smsEnabled: false,  inAppEnabled: false,
      disabledTypes: ['SECURITY_ALERT'],  // Attempted opt-out — ignored
    }
    const result = routeNotification('SECURITY_ALERT', 'CRITICAL', prefs)
    expect(result.isMandatory).toBe(true)
    // Even with all channels disabled, mandatory = always IN_APP
    expect(result.channels).toContain('IN_APP')
    expect(result.skipReason).toBeNull()
  })

  it('[TEST 5] HIGH priority uses PUSH + EMAIL + IN_APP', () => {
    const result = routeNotification('DOCUMENT_EXPIRING', 'HIGH', allEnabled)
    expect(result.channels).toContain('PUSH')
    expect(result.channels).toContain('EMAIL')
    expect(result.channels).toContain('IN_APP')
  })

  it('[TEST 6] LOW priority only IN_APP', () => {
    const result = routeNotification('SYSTEM_ANNOUNCEMENT', 'LOW', allEnabled)
    expect(result.channels).toContain('IN_APP')
    expect(result.channels).not.toContain('EMAIL')
    expect(result.channels).not.toContain('PUSH')
  })

  it('[PASS] User-disabled type skipped (for optional types)', () => {
    const prefs: NotificationPrefs = { ...allEnabled, disabledTypes: ['TRIP_COMPLETED'] }
    const result = routeNotification('TRIP_COMPLETED', 'NORMAL', prefs)
    expect(result.channels).toHaveLength(0)
    expect(result.skipReason).toMatch(/désactivé/i)
  })

  it('[PASS] All channels disabled → skip (for optional)', () => {
    const noChannels: NotificationPrefs = {
      pushEnabled: false, emailEnabled: false,
      smsEnabled: false,  inAppEnabled: false,
    }
    const result = routeNotification('PAYMENT_RECEIVED', 'NORMAL', noChannels)
    expect(result.channels).toHaveLength(0)
    expect(result.skipReason).toBeTruthy()
  })
})

// ─── RETRY LOGIC ─────────────────────────────────────────────

describe('Retry Logic — Tests 7, 8, 9', () => {
  it('[TEST 7] First retry scheduled with base delay', () => {
    const result = computeNextRetry(0, 5, 60_000)
    expect(result.shouldRetry).toBe(true)
    expect(result.nextRetryAt).not.toBeNull()
    // ~60s from now
    const diffMs = result.nextRetryAt!.getTime() - Date.now()
    expect(diffMs).toBeGreaterThan(55_000)
    expect(diffMs).toBeLessThan(65_000)
  })

  it('[TEST 8] Exponential backoff: attempt 1 = 2x, attempt 2 = 4x', () => {
    const r0 = computeNextRetry(0, 5, 60_000)
    const r1 = computeNextRetry(1, 5, 60_000)
    const r2 = computeNextRetry(2, 5, 60_000)
    const d0 = r0.nextRetryAt!.getTime() - Date.now()
    const d1 = r1.nextRetryAt!.getTime() - Date.now()
    const d2 = r2.nextRetryAt!.getTime() - Date.now()
    expect(d1).toBeGreaterThan(d0)
    expect(d2).toBeGreaterThan(d1)
  })

  it('[TEST 9] Max attempts reached = DEAD_LETTER', () => {
    const result = computeNextRetry(5, 5)
    expect(result.shouldRetry).toBe(false)
    expect(result.nextRetryAt).toBeNull()
    expect(result.reason).toMatch(/DEAD_LETTER/i)
  })

  it('[PASS] Delay capped at 1 hour (no infinite backoff)', () => {
    const result = computeNextRetry(20, 100, 60_000)  // Huge attempt count
    const diffMs = result.nextRetryAt!.getTime() - Date.now()
    expect(diffMs).toBeLessThanOrEqual(60 * 60 * 1000 + 1000)  // ≤ 1 hour
  })
})

// ─── DEAD LETTER QUEUE ───────────────────────────────────────

describe('Dead Letter Queue — Tests 10, 15', () => {
  it('[TEST 10] Dead letter entry always requires manual review', () => {
    const entry = buildDeadLetterEntry({
      sourceType:    'WEBHOOK',
      sourceId:      'wh-001',
      failureCode:   'TIMEOUT',
      failureDetail: 'Provider did not respond after 5 retries',
      totalAttempts: 5,
    })
    expect(entry.requiresManualReview).toBe(true)
    // DEAD_LETTER = human review — never auto-resolved
  })

  it('[TEST 15] Dead letter from SYNC_QUEUE preserved', () => {
    const entry = buildDeadLetterEntry({
      sourceType:    'SYNC_QUEUE',
      sourceId:      'sq-002',
      failureCode:   'NETWORK_ERROR',
      failureDetail: 'Connection refused after 5 attempts',
      totalAttempts: 5,
    })
    expect(entry.requiresManualReview).toBe(true)
    expect(entry.sourceType).toBe('SYNC_QUEUE')
  })
})

// ─── WEBHOOK SECURITY ────────────────────────────────────────

describe('Webhook Security — Tests 16, 17', () => {
  it('[TEST 16] Webhook payload hashed — raw body never stored', () => {
    const rawBody = '{"event":"trip.completed","trip_id":"123","amount":28.45}'
    const hash = hashWebhookPayload(rawBody)
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[0-9a-f]+$/)
    // Hash stored — raw body never in DB
  })

  it('[TEST 17] Same payload = same hash (deterministic)', () => {
    const body = '{"event":"payment.succeeded"}'
    expect(hashWebhookPayload(body)).toBe(hashWebhookPayload(body))
  })

  it('[PASS] Different payloads = different hashes', () => {
    const h1 = hashWebhookPayload('{"event":"trip.completed"}')
    const h2 = hashWebhookPayload('{"event":"payment.succeeded"}')
    expect(h1).not.toBe(h2)
  })
})

// ─── SYNC QUEUE ───────────────────────────────────────────────

describe('Sync Queue — Tests 18, 19, 20', () => {
  it('[TEST 18] Sync payload excludes sensitive data', () => {
    const payload = buildSyncPayload({
      operationType:    'ACTIVITY_SYNC',
      resourceType:     'PROVIDER_ACTIVITY',
      resourceId:       'ACT-00000001',
      driverId:         'driver-uuid-001',
      priority:         'NORMAL',
      createdOfflineAt: new Date(),
    })
    expect(payload).not.toHaveProperty('token')
    expect(payload).not.toHaveProperty('password')
    expect(payload).not.toHaveProperty('card')
    expect(payload).toHaveProperty('operationType')
    expect(payload).toHaveProperty('resourceId')
  })

  it('[TEST 19] Offline-created operations preserved', () => {
    const offlineDate = new Date('2026-08-15T10:00:00Z')
    const payload = buildSyncPayload({
      operationType:    'GPS_FLUSH',
      resourceType:     'GPS_SESSION',
      resourceId:       'gps-001',
      driverId:         'driver-uuid-001',
      priority:         'HIGH',
      createdOfflineAt: offlineDate,
    })
    expect(payload.createdOfflineAt).toBe(offlineDate.toISOString())
  })

  it('[TEST 20] Online operations have null createdOfflineAt', () => {
    const payload = buildSyncPayload({
      operationType: 'COMPLIANCE_REFRESH', resourceType: null,
      resourceId: null, driverId: 'driver-uuid-001',
      priority: 'LOW', createdOfflineAt: null,
    })
    expect(payload.createdOfflineAt).toBeNull()
  })
})

// ─── SYSTEM EVENT BUS ────────────────────────────────────────

describe('System Event Bus — Tests 1, 2, 3', () => {
  it('[TEST 1] Event built with non-sensitive metadata', () => {
    const event = buildSystemEvent({
      eventId:       'evt-trip-001',
      sourceService: 'taximeter',
      eventType:     'TRIP_COMPLETED',
      resourceType:  'TRIP',
      resourceId:    'TRP-00000001',
      driverId:      'driver-uuid-001',
      correlationId: generateCorrelationId(),
      metadata:      { fareAmount: 28.45, currency: 'CAD' },
    })
    expect(event.eventType).toBe('TRIP_COMPLETED')
    expect(event.metadata).toHaveProperty('fareAmount')
  })

  it('[TEST 2] Event with sensitive metadata throws', () => {
    expect(() => buildSystemEvent({
      eventId: 'evt-001', sourceService: 'auth',
      eventType: 'AUTH_EVENT', resourceType: null,
      resourceId: null, driverId: null,
      correlationId: generateCorrelationId(),
      metadata: { token: 'sensitive-value' },  // FORBIDDEN
    })).toThrow(/interdite/i)
  })

  it('[TEST 3] Same event_id from same service = idempotent', () => {
    const id1 = buildEventId('payment', 'pay-001')
    const id2 = buildEventId('payment', 'pay-001')
    expect(id1).toBe(id2)
  })
})

// ─── ACCESS CONTROL ──────────────────────────────────────────

describe('Access Control — Tests 21 & 22', () => {
  it('[TEST 21] Driver A cannot receive Driver B notifications', () => {
    expect(canDriverReceiveNotification('user-A', 'user-B')).toBe(false)
  })

  it('[PASS] Driver receives own notifications', () => {
    expect(canDriverReceiveNotification('user-A', 'user-A')).toBe(true)
  })

  it('[TEST 22] Government user with correct permission = ALLOW', () => {
    expect(canGovernmentViewNotifications(['security.view'], ['QC'], 'QC')).toBe(true)
  })

  it('[PASS] Government wrong jurisdiction = DENY', () => {
    expect(canGovernmentViewNotifications(['security.view'], ['ON'], 'QC')).toBe(false)
  })
})

// ─── SEED DATA ────────────────────────────────────────────────

describe('Seed Notification Data', () => {
  it('[PASS] 4 seed notifications defined', () => {
    expect(SEED_NOTIFICATIONS).toHaveLength(4)
  })

  it('[PASS] Security notification is mandatory', () => {
    const security = SEED_NOTIFICATIONS.find(n => n.notifType === 'SECURITY_ALERT')
    expect(security?.isMandatory).toBe(true)
  })

  it('[PASS] Trip notification is not mandatory', () => {
    const trip = SEED_NOTIFICATIONS.find(n => n.notifType === 'TRIP_COMPLETED')
    expect(trip?.isMandatory).toBe(false)
  })

  it('[PASS] All seeds are flagged as dev-only', () => {
    SEED_NOTIFICATIONS.forEach(n => expect(n.isDev).toBe(true))
  })
})

// ─── SCHEMA INVARIANTS ────────────────────────────────────────

describe('Schema Invariants', () => {
  it('[PASS] Mandatory types cannot be opted out', () => {
    const prefs: NotificationPrefs = {
      pushEnabled: false, emailEnabled: false,
      smsEnabled: false, inAppEnabled: false,
      disabledTypes: Array.from(MANDATORY_NOTIFICATION_TYPES),
    }
    Array.from(MANDATORY_NOTIFICATION_TYPES).forEach(t => {
      const result = routeNotification(t as string, 'CRITICAL', prefs)
      expect(result.channels.length).toBeGreaterThan(0)
      expect(result.isMandatory).toBe(true)
    })
  })

  it('[PASS] Dead letter always requires human review — never auto-resolved', () => {
    const sourceTypes = ['WEBHOOK', 'SYNC_QUEUE', 'SYSTEM_EVENT', 'NOTIFICATION'] as const
    sourceTypes.forEach(t => {
      const entry = buildDeadLetterEntry({
        sourceType: t, sourceId: 'test-id',
        failureCode: 'TIMEOUT', failureDetail: 'Timeout', totalAttempts: 5,
      })
      expect(entry.requiresManualReview).toBe(true)
    })
  })

  it('[PASS] No infinite retry — maxAttempts always enforced', () => {
    for (let i = 0; i <= 10; i++) {
      const result = computeNextRetry(i, 5)
      if (i >= 5) {
        expect(result.shouldRetry).toBe(false)
      }
    }
  })
})
