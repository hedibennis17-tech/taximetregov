// ================================================================
// TAXIMÈTRE.GOV — VEHICLE SERVICE
// Validation, masking, eligibility, expiry calculations
// ================================================================

// ─── VEHICLE NUMBER ───────────────────────────────────────────

export function formatVehicleNumber(region: string, sequence: number): string {
  return `V-${region.toUpperCase()}-${sequence.toString().padStart(6, '0')}`
  // e.g. V-QC-001234
}

export function parseVehicleNumber(num: string): { region: string; sequence: number } | null {
  const m = num.match(/^V-([A-Z]{2})-(\d{6})$/)
  if (!m || !m[1] || !m[2]) return null
  return { region: m[1], sequence: parseInt(m[2], 10) }
}

// ─── MASKING ─────────────────────────────────────────────────

export function maskLicensePlate(plate: string, region = 'QC'): string {
  // ••••QC22 — shows last 2 chars + region suffix for recognition
  if (plate.length < 2) return '••••••'
  return `••••${plate.slice(-2)}`
}

export function maskLicenseNumber(lastFour: string): string {
  // M••••••1234 format
  if (!/^\d{4}$/.test(lastFour)) return 'M••••••••'
  return `M••••••${lastFour}`
}

export function maskPermitNumber(lastTwo: string): string {
  // TP-••••••78
  if (!/^\d{2}$/.test(lastTwo)) return 'TP-••••••••'
  return `TP-••••••${lastTwo}`
}

export function maskPolicyNumber(lastTwo: string): string {
  // POL-••••••89
  if (!/^\d{2}$/.test(lastTwo)) return 'POL-••••••••'
  return `POL-••••••${lastTwo}`
}

export function maskVin(): string {
  // VIN is never shown even partially — always fully masked
  return '••••••••••••••••'
}

// ─── EXPIRY CALCULATIONS ──────────────────────────────────────

export const EXPIRY_THRESHOLDS_DAYS = {
  CRITICAL:     7,
  WARNING:      30,
  NOTICE:       60,
  UPCOMING:     90,
} as const

export type ExpiryStatus =
  | 'VALID'
  | 'EXPIRING_UPCOMING'  // 60-90 days
  | 'EXPIRING_NOTICE'    // 30-60 days
  | 'EXPIRING_WARNING'   // 7-30 days
  | 'EXPIRING_CRITICAL'  // 0-7 days
  | 'EXPIRED'

export function calculateExpiryStatus(expiryDateStr: string): {
  status: ExpiryStatus
  daysRemaining: number
} {
  const expiry = new Date(expiryDateStr)
  const today  = new Date()
  today.setHours(0, 0, 0, 0)
  expiry.setHours(0, 0, 0, 0)

  const diffMs   = expiry.getTime() - today.getTime()
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  let status: ExpiryStatus
  if (daysLeft < 0)                                  status = 'EXPIRED'
  else if (daysLeft <= EXPIRY_THRESHOLDS_DAYS.CRITICAL) status = 'EXPIRING_CRITICAL'
  else if (daysLeft <= EXPIRY_THRESHOLDS_DAYS.WARNING)  status = 'EXPIRING_WARNING'
  else if (daysLeft <= EXPIRY_THRESHOLDS_DAYS.NOTICE)   status = 'EXPIRING_NOTICE'
  else if (daysLeft <= EXPIRY_THRESHOLDS_DAYS.UPCOMING) status = 'EXPIRING_UPCOMING'
  else                                               status = 'VALID'

  return { status, daysRemaining: daysLeft }
}

// ─── VEHICLE ELIGIBILITY FOR SERVICE ─────────────────────────

export interface VehicleEligibilityCheck {
  vehicleStatus:      string
  hasValidLicense:    boolean
  hasValidPermit:     boolean   // required for TAXI only
  hasValidInsurance:  boolean
  insuranceIsCommercial: boolean  // required for TAXI
  hasValidInspection: boolean
  taximeterStatus:    string   // required for TAXI
  serviceAuth:        string   // per-service
}

export interface EligibilityResult {
  canOperate: boolean
  blockers:   string[]
  warnings:   string[]
}

export function checkTaxiEligibility(check: VehicleEligibilityCheck): EligibilityResult {
  const blockers: string[] = []
  const warnings: string[] = []

  if (check.vehicleStatus !== 'ACTIVE')
    blockers.push(`Véhicule non actif (${check.vehicleStatus})`)

  if (!check.hasValidLicense)
    blockers.push('Permis de conduire invalide ou expiré')

  if (!check.hasValidPermit)
    blockers.push('Permis taxi invalide ou absent')

  if (!check.hasValidInsurance)
    blockers.push('Assurance invalide ou expirée')

  if (check.hasValidInsurance && !check.insuranceIsCommercial)
    blockers.push('Assurance personnelle non valide pour TAXI — assurance commerciale requise')

  if (!check.hasValidInspection)
    warnings.push('Inspection mécanique expirée ou manquante')

  if (check.taximeterStatus === 'NOT_INSTALLED')
    blockers.push('Taximètre non installé')

  if (check.taximeterStatus === 'INSTALLED_NOT_CERTIFIED')
    warnings.push('Taximètre installé mais non certifié (mode pilote)')

  if (check.serviceAuth !== 'AUTHORIZED')
    blockers.push(`Autorisation TAXI: ${check.serviceAuth}`)

  return {
    canOperate: blockers.length === 0,
    blockers,
    warnings,
  }
}

export function checkRideshareEligibility(check: VehicleEligibilityCheck): EligibilityResult {
  const blockers: string[] = []
  const warnings: string[] = []

  if (check.vehicleStatus !== 'ACTIVE')
    blockers.push(`Véhicule non actif (${check.vehicleStatus})`)

  if (!check.hasValidLicense)
    blockers.push('Permis de conduire invalide ou expiré')

  if (!check.hasValidInsurance)
    blockers.push('Assurance invalide ou expirée')

  if (check.serviceAuth !== 'AUTHORIZED')
    blockers.push(`Autorisation RIDESHARE: ${check.serviceAuth}`)

  // Permit not required for rideshare
  // Commercial insurance not required (but recommended)
  if (check.hasValidInsurance && !check.insuranceIsCommercial)
    warnings.push('Assurance commerciale recommandée pour RIDESHARE')

  return { canOperate: blockers.length === 0, blockers, warnings }
}

export function checkDeliveryEligibility(check: VehicleEligibilityCheck): EligibilityResult {
  // Delivery has minimal vehicle requirements
  const blockers: string[] = []
  const warnings: string[] = []

  if (check.vehicleStatus !== 'ACTIVE')
    blockers.push(`Véhicule non actif (${check.vehicleStatus})`)

  if (check.serviceAuth === 'BLOCKED' || check.serviceAuth === 'SUSPENDED')
    blockers.push(`Autorisation DELIVERY: ${check.serviceAuth}`)

  return { canOperate: blockers.length === 0, blockers, warnings }
}

// ─── TAXIMETER VALIDATION ─────────────────────────────────────
//
// RÈGLE ABSOLUE: Taximeter enabled ONLY for TAXI service
// All other service modes = taximeter ALWAYS disabled

export function isTaximeterEnabledForService(serviceType: string): boolean {
  return serviceType === 'TAXI'
  // RIDESHARE: false — Provider Final Fare is the source
  // DELIVERY:  false — Always disabled, no exception
  // PERSONAL:  false
}

export type TaximeterStatus =
  | 'NOT_INSTALLED'
  | 'INSTALLED_NOT_CERTIFIED'
  | 'CERTIFIED'
  | 'DECOMMISSIONED'
  | 'NEEDS_RECERTIFICATION'

export function isTaximeterOperational(status: TaximeterStatus): boolean {
  // CERTIFIED = fully operational
  // INSTALLED_NOT_CERTIFIED = operational in pilot mode (with warning)
  return status === 'CERTIFIED' || status === 'INSTALLED_NOT_CERTIFIED'
}

export function getTaximeterWarning(status: TaximeterStatus): string | null {
  if (status === 'INSTALLED_NOT_CERTIFIED') {
    return 'Mode pilote — Taximètre installé mais homologation officielle non obtenue'
  }
  if (status === 'NEEDS_RECERTIFICATION') {
    return 'Recertification requise — vérifier avec l\'autorité compétente'
  }
  return null
}

// ─── VEHICLE AGE VALIDATION ───────────────────────────────────

export function getVehicleAgeYears(modelYear: number): number {
  return new Date().getFullYear() - modelYear
}

export function isVehicleAgeValid(
  modelYear: number,
  serviceType: string,
  maxAgeYears = 7,
): boolean {
  // Age limits are configurable (from government tariff config)
  // Default: 7 years for taxi
  const age = getVehicleAgeYears(modelYear)
  if (serviceType === 'TAXI') return age <= maxAgeYears
  return true // Other services: no age limit by default
}

// ─── INSURANCE VALIDATION ────────────────────────────────────

export function validateInsuranceForService(
  isCommercial: boolean,
  serviceType: string,
): { valid: boolean; reason: string | null } {
  if (serviceType === 'TAXI' && !isCommercial) {
    return {
      valid: false,
      reason: 'Assurance commerciale obligatoire pour le service TAXI',
    }
  }
  return { valid: true, reason: null }
}

// ─── VEHICLE COMPLETENESS ─────────────────────────────────────

export interface VehicleCompleteness {
  score: number
  missingItems: string[]
  readyForTaxi: boolean
  readyForRideshare: boolean
  readyForDelivery: boolean
}

export function calculateVehicleCompleteness(data: {
  hasLicense: boolean
  hasPermit: boolean
  hasInsurance: boolean
  insuranceCommercial: boolean
  hasInspection: boolean
  taximeterInstalled: boolean
  vehicleVerified: boolean
}): VehicleCompleteness {
  const items: [string, boolean][] = [
    ['Permis de conduire',         data.hasLicense],
    ['Enregistrement véhicule',    data.vehicleVerified],
    ['Assurance',                  data.hasInsurance],
    ['Assurance commerciale',      data.insuranceCommercial],
    ['Inspection mécanique',       data.hasInspection],
    ['Permis taxi',                data.hasPermit],
    ['Taximètre installé',         data.taximeterInstalled],
  ]

  const done = items.filter(([, ok]) => ok).length
  const score = Math.round((done / items.length) * 100)
  const missingItems = items.filter(([, ok]) => !ok).map(([label]) => label)

  const readyForTaxi = data.hasLicense && data.hasPermit &&
    data.hasInsurance && data.insuranceCommercial &&
    data.hasInspection && data.taximeterInstalled && data.vehicleVerified

  const readyForRideshare = data.hasLicense && data.hasInsurance && data.vehicleVerified

  const readyForDelivery = data.vehicleVerified

  return { score, missingItems, readyForTaxi, readyForRideshare, readyForDelivery }
}
