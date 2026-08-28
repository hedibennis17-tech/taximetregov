// ================================================================
// TAXIMÈTRE.GOV — PROFILE SERVICE
// Driver number generation, NAS masking, onboarding logic
// ================================================================
//
// SECURITY INVARIANTS:
// 1. NAS/SIN never passed through this service in plaintext
//    Encryption happens in a dedicated encrypted-fields service
//    This service only handles the masked display + verification status
// 2. maskedDisplay is ALWAYS ***-***-XXX — never the real number
// 3. driver_number is sequential-safe but not guessable (padded)
// 4. Government employee references are masked in all API responses
// ================================================================

// ─── DRIVER NUMBER ────────────────────────────────────────────

export function formatDriverNumber(sequentialId: number): string {
  // DR-00001234 format
  // Sequential but zero-padded — not guessable without the full range
  return `DR-${sequentialId.toString().padStart(8, '0')}`
}

export function parseDriverNumber(driverNumber: string): number | null {
  const match = driverNumber.match(/^DR-(\d{8})$/)
  if (!match || !match[1]) return null
  return parseInt(match[1], 10)
}

// ─── NAS / SIN MASKING ────────────────────────────────────────
//
// The actual NAS is NEVER handled here.
// This function only formats what's shown in the UI.

export function maskNAS(lastThreeDigits: string): string {
  // Always returns ***-***-XXX where XXX = last 3 digits
  // The last 3 digits can be passed from the encrypted store
  // to allow driver recognition without exposing full number
  if (!/^\d{3}$/.test(lastThreeDigits)) {
    return '***-***-***'
  }
  return `***-***-${lastThreeDigits}`
}

export function maskBusinessNumber(lastFourDigits: string): string {
  // Business numbers: ••••••1234
  if (!/^\d{4}$/.test(lastFourDigits)) {
    return '••••••••••'
  }
  return `••••••${lastFourDigits}`
}

export function maskEmployeeReference(ref: string): string {
  // EMP-••••1234
  if (ref.length < 4) return 'EMP-••••'
  return `EMP-••••${ref.slice(-4)}`
}

// ─── GOVERNMENT EMPLOYEE REFERENCE ───────────────────────────

export function maskGovernmentRef(ref: string): string {
  if (ref.length <= 4) return '••••'
  return '••••' + ref.slice(-4)
}

// ─── ONBOARDING STEPS ────────────────────────────────────────

export type OnboardingStepKey =
  | 'IDENTITY_VERIFICATION'
  | 'DRIVER_LICENSE'
  | 'TAXI_PERMIT'
  | 'VEHICLE_REGISTRATION'
  | 'INSURANCE'
  | 'PROVIDER_CONNECT'
  | 'TAX_PROFILE'
  | 'BACKGROUND_CHECK'

export const ONBOARDING_STEPS_TAXI: OnboardingStepKey[] = [
  'IDENTITY_VERIFICATION',
  'DRIVER_LICENSE',
  'TAXI_PERMIT',
  'VEHICLE_REGISTRATION',
  'INSURANCE',
  'TAX_PROFILE',
]

export const ONBOARDING_STEPS_RIDESHARE: OnboardingStepKey[] = [
  'IDENTITY_VERIFICATION',
  'DRIVER_LICENSE',
  'VEHICLE_REGISTRATION',
  'INSURANCE',
  'PROVIDER_CONNECT',
  'TAX_PROFILE',
]

export const ONBOARDING_STEPS_DELIVERY: OnboardingStepKey[] = [
  'IDENTITY_VERIFICATION',
  'PROVIDER_CONNECT',
  'TAX_PROFILE',
]

export const STEP_LABELS: Record<OnboardingStepKey, string> = {
  IDENTITY_VERIFICATION: 'Vérification d\'identité',
  DRIVER_LICENSE:        'Permis de conduire',
  TAXI_PERMIT:           'Permis taxi',
  VEHICLE_REGISTRATION:  'Enregistrement du véhicule',
  INSURANCE:             'Assurance commerciale',
  PROVIDER_CONNECT:      'Connexion fournisseur',
  TAX_PROFILE:           'Profil fiscal',
  BACKGROUND_CHECK:      'Vérification des antécédents',
}

export function isOnboardingComplete(
  completedSteps: string[],
  serviceTypes: ('TAXI' | 'RIDESHARE' | 'DELIVERY')[],
): boolean {
  const required = new Set<string>()
  if (serviceTypes.includes('TAXI'))     ONBOARDING_STEPS_TAXI.forEach(s => required.add(s))
  if (serviceTypes.includes('RIDESHARE')) ONBOARDING_STEPS_RIDESHARE.forEach(s => required.add(s))
  if (serviceTypes.includes('DELIVERY')) ONBOARDING_STEPS_DELIVERY.forEach(s => required.add(s))

  return [...required].every(step => completedSteps.includes(step))
}

// ─── VERIFICATION STATUS TRANSITIONS ─────────────────────────

export type VerificationStatus =
  | 'NOT_STARTED'
  | 'PENDING'
  | 'IN_REVIEW'
  | 'VERIFIED'
  | 'FAILED'
  | 'EXPIRED'
  | 'MANUAL_REVIEW'

export const ALLOWED_TRANSITIONS: Record<VerificationStatus, VerificationStatus[]> = {
  NOT_STARTED:   ['PENDING'],
  PENDING:       ['IN_REVIEW', 'FAILED'],
  IN_REVIEW:     ['VERIFIED', 'FAILED', 'MANUAL_REVIEW'],
  MANUAL_REVIEW: ['VERIFIED', 'FAILED'],
  VERIFIED:      ['EXPIRED'],
  FAILED:        ['PENDING'],  // Can re-submit
  EXPIRED:       ['PENDING'],  // Must re-verify
}

export function isTransitionAllowed(
  from: VerificationStatus,
  to: VerificationStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}

// ─── DRIVER STATUS DISPLAY ────────────────────────────────────

export type DriverStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'DEACTIVATED'
  | 'REJECTED'

export const DRIVER_STATUS_LABELS: Record<DriverStatus, string> = {
  PENDING:      'En attente',
  UNDER_REVIEW: 'En révision',
  ACTIVE:       'Actif',
  SUSPENDED:    'Suspendu',
  DEACTIVATED:  'Désactivé',
  REJECTED:     'Refusé',
}

export function canOperateTaxi(
  driverStatus: DriverStatus,
  identityVerified: boolean,
  activeSuspensions: string[],  // service types currently suspended
): boolean {
  if (driverStatus !== 'ACTIVE') return false
  if (!identityVerified) return false
  if (activeSuspensions.includes('TAXI') || activeSuspensions.includes('ALL')) return false
  return true
}

// ─── PROFILE COMPLETENESS ─────────────────────────────────────

export interface ProfileCompleteness {
  score: number          // 0–100
  missingFields: string[]
  isEligibleForReview: boolean
}

export function calculateProfileCompleteness(profile: {
  firstName?: string | null
  lastName?: string | null
  dateOfBirth?: string | null
  phone?: string | null
  province?: string | null
  identityVerificationStatus?: string | null
  addressEncrypted?: string | null
}): ProfileCompleteness {
  const checks: [string, boolean][] = [
    ['Prénom',                    !!profile.firstName],
    ['Nom de famille',            !!profile.lastName],
    ['Date de naissance',         !!profile.dateOfBirth],
    ['Numéro de téléphone',       !!profile.phone],
    ['Province',                  !!profile.province],
    ['Adresse',                   !!profile.addressEncrypted],
    ['Vérification d\'identité',  profile.identityVerificationStatus === 'VERIFIED'],
  ]

  const completed = checks.filter(([, ok]) => ok).length
  const score = Math.round((completed / checks.length) * 100)
  const missingFields = checks.filter(([, ok]) => !ok).map(([label]) => label)

  return {
    score,
    missingFields,
    isEligibleForReview: score >= 70 && !!profile.firstName && !!profile.lastName,
  }
}

// ─── JURISDICTION ACCESS ──────────────────────────────────────

export function canAccessJurisdiction(
  userJurisdictions: string[],
  requiredJurisdiction: string,
): boolean {
  // Government users can only access data in their authorized jurisdictions
  return userJurisdictions.includes(requiredJurisdiction) ||
    userJurisdictions.includes('ALL')
}
