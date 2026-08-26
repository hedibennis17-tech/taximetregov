// ============================================================
// TAXIMÈTRE.GOV — LOCATION ENGINE
// Phase 2 — Step 12: GPS & Location Engine
// Central GPS service — behavior differs per activity
// ============================================================

import { TAXIMETER_ENABLED_BY_ACTIVITY, type ActivityType } from '@/data/driver.mock'

// ─── TYPES ───────────────────────────────────────────────────

export type GpsStatus =
  | 'DISABLED' | 'REQUESTING_PERMISSION' | 'ACTIVE'
  | 'LOW_ACCURACY' | 'SIGNAL_LOST' | 'RECOVERING' | 'AVAILABLE'

export type LocationPermission =
  | 'GRANTED_FOREGROUND' | 'GRANTED_BACKGROUND'
  | 'DENIED' | 'RESTRICTED' | 'NOT_REQUESTED'

export type AccuracyLevel = 'GOOD' | 'ACCEPTABLE' | 'POOR' | 'INVALID'
export type DataQualityFlag = 'NORMAL' | 'SUSPICIOUS' | 'REVIEW_REQUIRED'
export type LocationSyncStatus = 'LOCAL_ONLY' | 'SYNCING' | 'SERVER_CONFIRMED' | 'FAILED'
export type BatteryMode = 'HIGH_ACCURACY' | 'BALANCED' | 'LOW_POWER'

// ─── LOCATION POINT ──────────────────────────────────────────
export interface LocationPoint {
  latitude: number
  longitude: number
  accuracy: number        // meters
  altitude?: number
  speed?: number          // m/s
  heading?: number        // degrees 0-360
  deviceTimestamp: number // ms epoch
  serverTimestamp?: number
}

// ─── LOCATION EVENT ──────────────────────────────────────────
export interface LocationEvent {
  eventId: string
  driverId: string
  deviceId: string
  activitySessionId: string
  locationSessionId: string
  activityType: ActivityType
  point: LocationPoint
  accuracyLevel: AccuracyLevel
  qualityFlag: DataQualityFlag
  syncStatus: LocationSyncStatus
  isValid: boolean
  invalidReason?: string
}

// ─── LOCATION SESSION ─────────────────────────────────────────
export interface LocationSession {
  sessionId: string
  driverId: string
  deviceId: string
  activityType: ActivityType
  taximeterEnabled: boolean   // Derived from TAXIMETER_ENABLED_BY_ACTIVITY — never override
  batteryMode: BatteryMode
  startedAt: number
  endedAt?: number
  status: 'ACTIVE' | 'ENDED' | 'SUSPENDED'
  totalDistanceKm: number
  validPointCount: number
  invalidPointCount: number
  syncStatus: LocationSyncStatus
  jurisdictionId: string
}

// ─── LOCATION POLICY (configurable per activity) ─────────────
export interface LocationPolicy {
  activityType: ActivityType
  desiredIntervalMs: number
  minimumDistanceM: number
  accuracyRequirementM: number
  batteryMode: BatteryMode
  backgroundRequired: boolean
  taximeterEnabled: boolean
}

export const LOCATION_POLICIES: Record<ActivityType, LocationPolicy> = {
  TAXI: {
    activityType: 'TAXI',
    desiredIntervalMs: 1000,      // 1s — high precision for meter
    minimumDistanceM: 5,
    accuracyRequirementM: 10,
    batteryMode: 'HIGH_ACCURACY',
    backgroundRequired: true,
    taximeterEnabled: TAXIMETER_ENABLED_BY_ACTIVITY['TAXI'],
  },
  RIDESHARE: {
    activityType: 'RIDESHARE',
    desiredIntervalMs: 3000,      // 3s — location tracking only, NO meter
    minimumDistanceM: 20,
    accuracyRequirementM: 30,
    batteryMode: 'BALANCED',
    backgroundRequired: true,
    taximeterEnabled: TAXIMETER_ENABLED_BY_ACTIVITY['RIDESHARE'],
  },
  FOOD_DELIVERY: {
    activityType: 'FOOD_DELIVERY',
    desiredIntervalMs: 5000,      // 5s — delivery tracking, NO meter
    minimumDistanceM: 30,
    accuracyRequirementM: 50,
    batteryMode: 'BALANCED',
    backgroundRequired: true,
    taximeterEnabled: TAXIMETER_ENABLED_BY_ACTIVITY['FOOD_DELIVERY'],
  },
  GROCERY: {
    activityType: 'GROCERY',
    desiredIntervalMs: 5000,
    minimumDistanceM: 30,
    accuracyRequirementM: 50,
    batteryMode: 'BALANCED',
    backgroundRequired: false,
    taximeterEnabled: TAXIMETER_ENABLED_BY_ACTIVITY['GROCERY'],
  },
  INDEPENDENT_DELIVERY: {
    activityType: 'INDEPENDENT_DELIVERY',
    desiredIntervalMs: 5000,
    minimumDistanceM: 30,
    accuracyRequirementM: 50,
    batteryMode: 'BALANCED',
    backgroundRequired: false,
    taximeterEnabled: false,
  },
}

// ─── ACCURACY CLASSIFIER ──────────────────────────────────────
export function classifyAccuracy(accuracyM: number, policy: LocationPolicy): AccuracyLevel {
  if (accuracyM <= policy.accuracyRequirementM) return 'GOOD'
  if (accuracyM <= policy.accuracyRequirementM * 2) return 'ACCEPTABLE'
  if (accuracyM <= policy.accuracyRequirementM * 5) return 'POOR'
  return 'INVALID'
}

// ─── OUTLIER DETECTOR ─────────────────────────────────────────
export interface OutlierResult {
  isValid: boolean
  qualityFlag: DataQualityFlag
  reason?: string
}

const MAX_SPEED_KMH = 200
const MAX_JUMP_KM = 5
const MAX_FUTURE_SEC = 30

export function detectOutlier(
  prev: LocationPoint | null,
  curr: LocationPoint,
  nowMs: number
): OutlierResult {
  if (curr.deviceTimestamp > nowMs + MAX_FUTURE_SEC * 1000)
    return { isValid: false, qualityFlag: 'SUSPICIOUS', reason: 'FUTURE_TIMESTAMP' }
  if (nowMs - curr.deviceTimestamp > 10 * 60 * 1000)
    return { isValid: false, qualityFlag: 'REVIEW_REQUIRED', reason: 'OLD_TIMESTAMP' }
  if (Math.abs(curr.latitude) > 90 || Math.abs(curr.longitude) > 180)
    return { isValid: false, qualityFlag: 'SUSPICIOUS', reason: 'INVALID_COORDINATES' }
  if (!prev) return { isValid: true, qualityFlag: 'NORMAL' }

  const dtSeconds = (curr.deviceTimestamp - prev.deviceTimestamp) / 1000
  if (dtSeconds <= 0)
    return { isValid: false, qualityFlag: 'SUSPICIOUS', reason: 'BACKWARD_TIMESTAMP' }

  const distKm = haversineKm(prev.latitude, prev.longitude, curr.latitude, curr.longitude)
  if (distKm > MAX_JUMP_KM)
    return { isValid: false, qualityFlag: 'SUSPICIOUS', reason: 'GPS_JUMP' }

  const speedKmh = (distKm / dtSeconds) * 3600
  if (speedKmh > MAX_SPEED_KMH)
    return { isValid: false, qualityFlag: 'SUSPICIOUS', reason: 'IMPOSSIBLE_SPEED' }

  return { isValid: true, qualityFlag: 'NORMAL' }
}

// ─── HAVERSINE DISTANCE ───────────────────────────────────────
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── DISTANCE ENGINE ──────────────────────────────────────────
export interface DistanceResult {
  distanceKm: number
  calculationStatus: 'OK' | 'PARTIAL' | 'INVALID'
  dataQuality: AccuracyLevel
  validPoints: number
  skippedPoints: number
}

export function calculateDistance(events: LocationEvent[], policy: LocationPolicy): DistanceResult {
  const valid = events.filter(e => e.isValid)
  let totalKm = 0, skipped = events.length - valid.length
  let worstAccuracy: AccuracyLevel = 'GOOD'

  for (let i = 1; i < valid.length; i++) {
    const dist = haversineKm(
      valid[i-1].point.latitude, valid[i-1].point.longitude,
      valid[i].point.latitude, valid[i].point.longitude
    )
    if (dist * 1000 >= policy.minimumDistanceM) totalKm += dist
    if (valid[i].accuracyLevel === 'POOR') worstAccuracy = 'POOR'
    if (valid[i].accuracyLevel === 'INVALID') { worstAccuracy = 'INVALID'; skipped++ }
  }
  return {
    distanceKm: Math.round(totalKm * 1000) / 1000,
    calculationStatus: skipped === 0 ? 'OK' : skipped < events.length / 2 ? 'PARTIAL' : 'INVALID',
    dataQuality: worstAccuracy,
    validPoints: valid.length,
    skippedPoints: skipped,
  }
}

// ─── MAP MATCHING INTERFACE (pluggable, not hardcoded) ────────
export interface MapMatchingProvider {
  name: string
  matchToRoad(points: LocationPoint[]): Promise<LocationPoint[]>
}
export const mapMatchingProvider: MapMatchingProvider | null = null // NOT_CONFIGURED

// ─── GEOFENCE (architecture only — zones from official config) ─
export interface Geofence {
  id: string; name: string
  type: 'TAXI_ZONE' | 'AIRPORT' | 'RESTRICTED' | 'SERVICE_ZONE' | 'JURISDICTION'
  jurisdictionId: string
}
export const geofenceRegistry: Geofence[] = [] // Populated from official government config

// ─── SYNC BATCH ───────────────────────────────────────────────
export interface SyncBatch {
  batchId: string; driverId: string; events: LocationEvent[]
  sentAt: number; status: 'PENDING' | 'SENT' | 'ACKNOWLEDGED' | 'FAILED'; retryCount: number
}
export function createSyncBatch(driverId: string, events: LocationEvent[]): SyncBatch {
  return {
    batchId: `BATCH-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    driverId, events, sentAt: Date.now(), status: 'PENDING', retryCount: 0,
  }
}

// ─── FACTORIES ────────────────────────────────────────────────
export function createLocationSession(
  driverId: string, deviceId: string, activityType: ActivityType, jurisdictionId = 'QC-CA'
): LocationSession {
  const policy = LOCATION_POLICIES[activityType]
  return {
    sessionId: `LSESS-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    driverId, deviceId, activityType,
    taximeterEnabled: policy.taximeterEnabled,
    batteryMode: policy.batteryMode,
    startedAt: Date.now(), status: 'ACTIVE',
    totalDistanceKm: 0, validPointCount: 0, invalidPointCount: 0,
    syncStatus: 'LOCAL_ONLY', jurisdictionId,
  }
}

export function createLocationEvent(
  driverId: string, deviceId: string, activitySessionId: string,
  locationSessionId: string, activityType: ActivityType,
  point: LocationPoint, prevPoint: LocationPoint | null
): LocationEvent {
  const policy = LOCATION_POLICIES[activityType]
  const accuracy = classifyAccuracy(point.accuracy, policy)
  const outlier = detectOutlier(prevPoint, point, Date.now())
  return {
    eventId: `LEVT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    driverId, deviceId, activitySessionId, locationSessionId, activityType, point,
    accuracyLevel: accuracy, qualityFlag: outlier.qualityFlag,
    syncStatus: 'LOCAL_ONLY',
    isValid: outlier.isValid && accuracy !== 'INVALID',
    invalidReason: outlier.reason,
  }
}
