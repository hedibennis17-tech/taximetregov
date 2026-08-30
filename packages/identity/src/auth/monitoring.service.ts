// ================================================================
// TAXIMÈTRE.GOV — MONITORING SERVICE
// Phase DB-12: Health · Incidents · Jobs · Feature Flags · Config
// ================================================================

import { createHash, randomBytes } from 'crypto'

// ─── PUBLIC IDS ──────────────────────────────────────────────

export function formatPublicIncidentId(seq: number): string {
  return `INC-${seq.toString().padStart(8, '0')}`
}

// ─── JOB IDEMPOTENCY ─────────────────────────────────────────

export function buildJobIdempotencyKey(
  jobType:    string,
  resourceId: string,
  periodRef?: string,
): string {
  const base = periodRef
    ? `${jobType}:${resourceId}:${periodRef}`
    : `${jobType}:${resourceId}`
  return createHash('sha256').update(base).digest('hex').slice(0, 64)
}

export interface JobScheduleResult {
  shouldRun:    boolean
  idempotencyKey: string
  skipReason:   string | null
}

export function scheduleJob(params: {
  jobType:     string
  resourceId:  string
  periodRef?:  string
  existingKeys: string[]
}): JobScheduleResult {
  const key = buildJobIdempotencyKey(params.jobType, params.resourceId, params.periodRef)

  if (params.existingKeys.includes(key)) {
    return {
      shouldRun:     false,
      idempotencyKey: key,
      skipReason:    `Job déjà programmé/exécuté (idempotency_key: ${key.slice(0, 8)}...)`,
    }
  }
  return { shouldRun: true, idempotencyKey: key, skipReason: null }
}

// ─── SERVICE HEALTH ──────────────────────────────────────────

export type ServiceStatus = 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'MAINTENANCE' | 'UNKNOWN'

export interface HealthCheckResult {
  serviceName: string
  status:      ServiceStatus
  latencyMs:   number | null
  errorRatePC: number | null
  reason:      string | null
}

export function evaluateServiceHealth(params: {
  lastHeartbeatAt: Date | null
  latencyMs:       number | null
  errorRatePC:     number | null
  heartbeatTimeoutMs: number  // configurable — default 60s
  latencyThresholdMs: number  // configurable — default 2000ms
  errorRateThreshold: number  // configurable — default 5%
}): ServiceStatus {
  // UNKNOWN if no heartbeat received
  if (!params.lastHeartbeatAt) return 'UNKNOWN'

  const msSinceHeartbeat = Date.now() - params.lastHeartbeatAt.getTime()
  if (msSinceHeartbeat > params.heartbeatTimeoutMs) return 'UNKNOWN'

  // DOWN if error rate is 100%
  if (params.errorRatePC !== null && params.errorRatePC >= 100) return 'DOWN'

  // DEGRADED checks
  const isDegraded =
    (params.errorRatePC !== null && params.errorRatePC > params.errorRateThreshold) ||
    (params.latencyMs !== null && params.latencyMs > params.latencyThresholdMs)

  return isDegraded ? 'DEGRADED' : 'HEALTHY'
}

// ─── INCIDENT LIFECYCLE ───────────────────────────────────────

export type IncidentStatus =
  | 'DETECTED' | 'ACKNOWLEDGED' | 'INVESTIGATING'
  | 'IDENTIFIED' | 'MITIGATING' | 'MONITORING'
  | 'RESOLVED' | 'CLOSED' | 'POST_MORTEM'

export const INCIDENT_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  DETECTED:      ['ACKNOWLEDGED'],
  ACKNOWLEDGED:  ['INVESTIGATING'],
  INVESTIGATING: ['IDENTIFIED', 'MITIGATING'],
  IDENTIFIED:    ['MITIGATING'],
  MITIGATING:    ['MONITORING', 'RESOLVED'],
  MONITORING:    ['RESOLVED'],
  RESOLVED:      ['CLOSED'],
  CLOSED:        ['POST_MORTEM'],
  POST_MORTEM:   [],   // Terminal
}

export function isIncidentTransitionAllowed(
  from: IncidentStatus,
  to:   IncidentStatus,
): boolean {
  return INCIDENT_TRANSITIONS[from]?.includes(to) ?? false
}

export function computeIncidentDuration(
  detectedAt:  Date,
  resolvedAt:  Date | null,
): number | null {
  if (!resolvedAt) return null
  return Math.round((resolvedAt.getTime() - detectedAt.getTime()) / 1000)
  // Duration in seconds
}

// ─── FEATURE FLAGS ────────────────────────────────────────────

export type FeatureFlagState = 'DISABLED' | 'ENABLED' | 'ROLLOUT' | 'PILOT_ONLY' | 'DEPRECATED'

export interface FeatureFlagEvaluation {
  key:      string
  enabled:  boolean
  state:    FeatureFlagState
  reason:   string
}

export function evaluateFeatureFlag(
  flag: {
    key:               string
    state:             FeatureFlagState
    rolloutPercentage: number
    conditions:        Record<string, unknown>
  },
  context: {
    isPilot:      boolean
    jurisdiction: string
    driverHash?:  string  // Hashed driver ID for rollout
  },
): FeatureFlagEvaluation {
  switch (flag.state) {
    case 'DISABLED':
      return { key: flag.key, enabled: false, state: flag.state, reason: 'Désactivé' }

    case 'ENABLED':
      return { key: flag.key, enabled: true, state: flag.state, reason: 'Activé globalement' }

    case 'PILOT_ONLY':
      if (!context.isPilot) {
        return { key: flag.key, enabled: false, state: flag.state, reason: 'Mode pilote uniquement' }
      }
      return { key: flag.key, enabled: true, state: flag.state, reason: 'Activé — mode pilote' }

    case 'ROLLOUT': {
      if (!context.driverHash) {
        return { key: flag.key, enabled: false, state: flag.state, reason: 'Driver hash requis pour rollout' }
      }
      // Deterministic rollout: hash % 100 < percentage
      const hashNum = parseInt(context.driverHash.slice(0, 8), 16)
      const bucket  = hashNum % 100
      const enabled = bucket < flag.rolloutPercentage
      return {
        key: flag.key, enabled, state: flag.state,
        reason: enabled
          ? `Dans rollout ${flag.rolloutPercentage}%`
          : `Hors rollout ${flag.rolloutPercentage}%`,
      }
    }

    case 'DEPRECATED':
      return { key: flag.key, enabled: false, state: flag.state, reason: 'Déprécié — ne pas utiliser' }

    default:
      return { key: flag.key, enabled: false, state: 'DISABLED', reason: 'État inconnu' }
  }
}

// ─── SYSTEM CONFIG ────────────────────────────────────────────

export type ConfigValueType = 'STRING' | 'INTEGER' | 'DECIMAL' | 'BOOLEAN' | 'JSON' | 'ENCRYPTED'

export interface ConfigValue {
  key:       string
  type:      ConfigValueType
  value:     string | number | boolean | Record<string, unknown> | null
  isSecret:  boolean
}

export function getConfigValue(config: {
  valueType:    ConfigValueType
  valueString:  string | null
  valueInt:     number | null
  valueDecimal: string | null  // NUMERIC returned as string from DB
  valueBool:    boolean | null
  valueJson:    Record<string, unknown> | null
  isSecret:     boolean
}): string | number | boolean | Record<string, unknown> | null {
  if (config.isSecret) {
    // Encrypted config — never return value via this function
    return '[ENCRYPTED]'
  }
  switch (config.valueType) {
    case 'STRING':  return config.valueString
    case 'INTEGER': return config.valueInt
    case 'DECIMAL': return config.valueDecimal ? parseFloat(config.valueDecimal) : null
    case 'BOOLEAN': return config.valueBool
    case 'JSON':    return config.valueJson
    case 'ENCRYPTED': return '[ENCRYPTED]'  // Never plain value
    default:        return null
  }
}

// ─── ALERT EVALUATION ────────────────────────────────────────

export interface AlertEvaluation {
  shouldFire:     boolean
  severity:       string
  message:        string
  triggeredValue: number | null
}

export function evaluateAlertRule(rule: {
  code:             string
  severity:         string
  thresholdValue:   number | null
  thresholdUnit:    string | null
}, currentValue: number | null): AlertEvaluation {
  if (rule.thresholdValue === null || currentValue === null) {
    return { shouldFire: false, severity: rule.severity, message: '', triggeredValue: null }
  }

  const shouldFire = currentValue >= rule.thresholdValue
  return {
    shouldFire,
    severity:       rule.severity,
    triggeredValue: currentValue,
    message:        shouldFire
      ? `${rule.code}: ${currentValue}${rule.thresholdUnit ?? ''} ≥ seuil ${rule.thresholdValue}${rule.thresholdUnit ?? ''}`
      : '',
  }
}

// ─── PILOT CONFIG VALIDATION ─────────────────────────────────

export interface PilotCapacityCheck {
  canAddDriver: boolean
  reason:       string | null
}

export function checkPilotCapacity(
  currentCount: number,
  maxDrivers:   number,
  status:       string,
): PilotCapacityCheck {
  if (status !== 'ACTIVE') {
    return { canAddDriver: false, reason: `Pilote non actif: ${status}` }
  }
  if (currentCount >= maxDrivers) {
    return { canAddDriver: false, reason: `Capacité pilote atteinte (${currentCount}/${maxDrivers})` }
  }
  return { canAddDriver: true, reason: null }
}

export function isPilotHomologated(
  isPilot: boolean,
  regulatoryRef: string | null,
): { homologated: boolean; note: string } {
  if (!isPilot) {
    return { homologated: true, note: 'Production — homologation officielle obtenue' }
  }
  if (!regulatoryRef) {
    return {
      homologated: false,
      note: 'isPilot=true — homologation réglementaire officielle requise avant déploiement commercial',
    }
  }
  return {
    homologated: false,
    note: `isPilot=true — Référence: ${regulatoryRef} — en attente d'homologation officielle`,
  }
}

// ─── ACCESS CONTROL ──────────────────────────────────────────

export function canViewMonitoring(permissions: string[]): boolean {
  return permissions.includes('security.view') ||
    permissions.includes('audit.read')
}

export function canManageIncident(permissions: string[]): boolean {
  return permissions.includes('security.manage') ||
    permissions.includes('settings.manage')
}

export function canManageFeatureFlags(permissions: string[]): boolean {
  return permissions.includes('settings.manage')
}

export function canReadSystemConfig(permissions: string[]): boolean {
  return permissions.includes('settings.manage') ||
    permissions.includes('security.view')
}

// ─── SEED DATA (development only) ────────────────────────────

export const SEED_FEATURE_FLAGS = [
  { key: 'taximeter.enabled',       label: 'Taximètre numérique',   module: 'TAXIMETER', state: 'ENABLED',     isSystem: true  },
  { key: 'delivery.enabled',        label: 'Mode livraison',         module: 'DELIVERY',  state: 'ENABLED',     isSystem: true  },
  { key: 'uber.oauth.enabled',      label: 'OAuth Uber',             module: 'PROVIDERS', state: 'DISABLED',    isSystem: false },
  { key: 'lyft.oauth.enabled',      label: 'OAuth Lyft',             module: 'PROVIDERS', state: 'DISABLED',    isSystem: false },
  { key: 'doordash.oauth.enabled',  label: 'OAuth DoorDash',         module: 'PROVIDERS', state: 'DISABLED',    isSystem: false },
  { key: 'tax.auto.submit',         label: 'Soumission fiscale auto', module: 'TAX',       state: 'DISABLED',    isSystem: true  },
  { key: 'live.map.enabled',        label: 'Carte temps réel',       module: 'TAXIMETER', state: 'PILOT_ONLY',  isSystem: false },
  { key: 'new.tax.engine',          label: 'Nouveau moteur fiscal',   module: 'TAX',       state: 'ENABLED',     isSystem: true  },
] as const

export const SEED_PILOT_CONFIG = {
  pilotId:      'PILOT-QC-2026',
  name:         'Pilote Taximètre.GOV Québec 2026',
  jurisdiction: 'QC',
  activeCities: ['Montréal', 'Québec', 'Laval'],
  maxDrivers:   50,
  isPilot:      true,
  regulatoryHomologationRef: null,  // Not yet obtained
  status:       'ACTIVE',
  notes:        'isPilot=true · Homologation réglementaire officielle requise avant production commerciale',
} as const
