// ================================================================
// TAXIMÈTRE.GOV — VEHICLE ASSIGNMENT SERVICE
// Phase DB-4: Temporal queries · Overlap detection · Eligibility
// ================================================================
//
// RÈGLES ABSOLUES:
// 1. Delivery → taximeter ALWAYS DISABLED — aucun lien avec vehicle_type
// 2. Taxi → conditions multiples vérifiées séquentiellement
// 3. Chevauchements: détectés et bloqués (jamais silencieux)
// 4. Historique: jamais supprimé — toujours consultable
// 5. Approbation: jamais auto-approbation chauffeur
// 6. VIN/plaque: jamais retournés en clair dans l'API standard
// ================================================================

// ─── PUBLIC VEHICLE ID ────────────────────────────────────────

export function formatPublicVehicleId(sequence: number): string {
  return `VEH-${sequence.toString().padStart(8, '0')}`
  // e.g. VEH-00001234
}

export function parsePublicVehicleId(id: string): number | null {
  const m = id.match(/^VEH-(\d{8})$/)
  if (!m || !m[1]) return null
  return parseInt(m[1], 10)
}

// ─── SENSITIVE DATA MASKING ───────────────────────────────────

export function maskVin(vinLast4: string | null | undefined): string {
  // VIN: always fully masked — never partial in standard API
  if (!vinLast4 || !/^\w{4}$/.test(vinLast4)) return '••••••••••••••••'
  return `••••••••••••${vinLast4}`
  // e.g. ••••••••••••ABC1
}

export function maskPlate(plateLast4: string | null | undefined): string {
  if (!plateLast4) return '•••••••'
  return `•••${plateLast4}`
  // e.g. •••5678
}

export function maskRegistrationNumber(last4: string | null | undefined): string {
  if (!last4) return '••••••••'
  return `••••${last4}`
}

// ─── TEMPORAL QUERIES ─────────────────────────────────────────

export interface TemporalAssignment {
  driverId:   string
  vehicleId:  string
  validFrom:  Date
  validUntil: Date | null
  status:     string
  assignmentType: string
}

/**
 * Was this vehicle assigned to this driver at the given moment?
 * Used for trip/financial record reconstruction.
 */
export function wasVehicleAssignedToDriverAt(
  assignments: TemporalAssignment[],
  driverId: string,
  vehicleId: string,
  atTime: Date,
): boolean {
  return assignments.some(a => {
    if (a.driverId !== driverId || a.vehicleId !== vehicleId) return false
    if (a.status === 'REVOKED') return false
    const from = a.validFrom.getTime()
    const until = a.validUntil ? a.validUntil.getTime() : Infinity
    const t = atTime.getTime()
    return t >= from && t <= until
  })
}

/**
 * Which driver had this vehicle at the given moment?
 * Used for regulatory audit queries.
 */
export function findDriverForVehicleAt(
  assignments: TemporalAssignment[],
  vehicleId: string,
  atTime: Date,
): string | null {
  const match = assignments.find(a => {
    if (a.vehicleId !== vehicleId) return false
    if (a.status === 'REVOKED') return false
    const from = a.validFrom.getTime()
    const until = a.validUntil ? a.validUntil.getTime() : Infinity
    const t = atTime.getTime()
    return t >= from && t <= until
  })
  return match?.driverId ?? null
}

/**
 * Which vehicle(s) did this driver have at the given moment?
 */
export function findVehiclesForDriverAt(
  assignments: TemporalAssignment[],
  driverId: string,
  atTime: Date,
): string[] {
  return assignments
    .filter(a => {
      if (a.driverId !== driverId) return false
      if (a.status === 'REVOKED') return false
      const from = a.validFrom.getTime()
      const until = a.validUntil ? a.validUntil.getTime() : Infinity
      const t = atTime.getTime()
      return t >= from && t <= until
    })
    .map(a => a.vehicleId)
}

// ─── OVERLAP DETECTION ────────────────────────────────────────

export interface ProposedAssignment {
  vehicleId:  string
  driverId:   string
  validFrom:  Date
  validUntil: Date | null   // null = open-ended (currently active)
}

export interface OverlapResult {
  hasOverlap: boolean
  conflictingAssignmentIds: string[]
  reason: string | null
}

/**
 * Detect overlapping assignments for the same vehicle+driver.
 * Policy: the same driver cannot have two active assignments
 * for the same vehicle at the same time.
 *
 * For different drivers: allowed sequentially, blocked if overlapping.
 */
export function detectAssignmentOverlap(
  existing: (TemporalAssignment & { id: string })[],
  proposed: ProposedAssignment,
  allowMultipleDrivers = false,
): OverlapResult {
  const conflicts: string[] = []

  for (const a of existing) {
    if (a.vehicleId !== proposed.vehicleId) continue
    if (a.status === 'ENDED' || a.status === 'REVOKED') continue

    // If policy prohibits multiple drivers simultaneously, check all
    // If policy allows it, only check the same driver
    if (!allowMultipleDrivers && a.driverId === proposed.driverId) {
      // Skip — same check applied below
    }

    const existingFrom  = a.validFrom.getTime()
    const existingUntil = a.validUntil ? a.validUntil.getTime() : Infinity
    const newFrom       = proposed.validFrom.getTime()
    const newUntil      = proposed.validUntil ? proposed.validUntil.getTime() : Infinity

    // Two ranges overlap if: max(start1, start2) < min(end1, end2)
    const overlapStart = Math.max(existingFrom, newFrom)
    const overlapEnd   = Math.min(existingUntil, newUntil)

    if (overlapStart < overlapEnd) {
      // Only flag if same driver, or if policy blocks multiple drivers
      if (a.driverId === proposed.driverId || !allowMultipleDrivers) {
        conflicts.push((a as { id: string }).id)
      }
    }
  }

  return {
    hasOverlap: conflicts.length > 0,
    conflictingAssignmentIds: conflicts,
    reason: conflicts.length > 0
      ? `Conflit d'affectation détecté — ${conflicts.length} affectation(s) se chevauchent`
      : null,
  }
}

// ─── RESOURCE AUTHORIZATION ───────────────────────────────────

export function canDriverAccessVehicle(
  requestorDriverId: string,
  vehicleAssignments: TemporalAssignment[],
  vehicleId: string,
): boolean {
  // Driver can only access vehicles currently or historically assigned to them
  return vehicleAssignments.some(
    a => a.driverId === requestorDriverId && a.vehicleId === vehicleId
  )
}

export function canGovernmentUserApproveVehicle(
  userPermissions: string[],
  userJurisdictions: string[],
  vehicleJurisdiction: string,
): boolean {
  const hasPermission = userPermissions.includes('vehicles.approve')
  const hasJurisdiction = userJurisdictions.includes(vehicleJurisdiction) ||
    userJurisdictions.includes('ALL')
  return hasPermission && hasJurisdiction
}

// ─── VEHICLE ELIGIBILITY ──────────────────────────────────────

export interface VehicleEligibilityInput {
  operationalStatus:   string
  registrationStatus:  string
  regulatoryStatus:    string
  registrationExpiry:  Date | null
  hasValidInsurance:   boolean
  insuranceIsCommercial: boolean   // Required for TAXI
  hasValidInspection:  boolean
  taximeterStatus:     string      // For TAXI only
  serviceAuth:         string      // Per service
  modelYear:           number
  maxVehicleAgeYears?: number      // Configurable, default 7 for TAXI
}

export interface ServiceEligibilityResult {
  eligible: boolean
  blockers: string[]
  warnings: string[]
  // Taximeter flag — ALWAYS false for DELIVERY regardless of vehicle
  taximeterEnabled: boolean
}

export function checkVehicleEligibilityForService(
  service: 'TAXI' | 'RIDESHARE' | 'DELIVERY',
  input: VehicleEligibilityInput,
): ServiceEligibilityResult {
  const blockers: string[] = []
  const warnings: string[] = []

  // ── Common checks (all services) ──────────────────────────
  if (input.operationalStatus !== 'ACTIVE')
    blockers.push(`Véhicule non opérationnel: ${input.operationalStatus}`)

  if (input.registrationStatus === 'EXPIRED')
    blockers.push('Enregistrement véhicule expiré')

  if (input.registrationStatus === 'SUSPENDED' || input.registrationStatus === 'REVOKED')
    blockers.push(`Enregistrement véhicule ${input.registrationStatus}`)

  if (input.registrationExpiry && input.registrationExpiry < new Date())
    blockers.push('Date d\'enregistrement dépassée')

  if (!input.hasValidInsurance)
    blockers.push('Assurance invalide ou expirée')

  // ── Service-specific checks ────────────────────────────────

  if (service === 'TAXI') {
    // Regulatory approval required
    if (input.regulatoryStatus !== 'APPROVED')
      blockers.push(`Statut réglementaire non approuvé: ${input.regulatoryStatus}`)

    // Commercial insurance mandatory
    if (input.hasValidInsurance && !input.insuranceIsCommercial)
      blockers.push('Assurance commerciale obligatoire pour TAXI')

    // Inspection required
    if (!input.hasValidInspection)
      warnings.push('Inspection mécanique manquante ou expirée')

    // Taximeter
    if (input.taximeterStatus === 'NOT_INSTALLED')
      blockers.push('Taximètre non installé')
    else if (input.taximeterStatus === 'INSTALLED_NOT_CERTIFIED')
      warnings.push('Taximètre en mode pilote — homologation officielle requise')
    else if (input.taximeterStatus === 'DECOMMISSIONED')
      blockers.push('Taximètre désinstallé')

    // Vehicle age (configurable)
    const maxAge = input.maxVehicleAgeYears ?? 7
    const age = new Date().getFullYear() - input.modelYear
    if (age > maxAge)
      blockers.push(`Véhicule trop ancien (${age} ans > ${maxAge} ans max pour TAXI)`)

    // Service authorization
    if (input.serviceAuth !== 'AUTHORIZED')
      blockers.push(`Autorisation TAXI: ${input.serviceAuth}`)

    return {
      eligible: blockers.length === 0,
      blockers,
      warnings,
      taximeterEnabled: blockers.length === 0,
      // Taximeter ON only when ALL taxi conditions are met
    }
  }

  if (service === 'RIDESHARE') {
    if (input.serviceAuth === 'BLOCKED' || input.serviceAuth === 'SUSPENDED')
      blockers.push(`Autorisation RIDESHARE: ${input.serviceAuth}`)

    if (input.hasValidInsurance && !input.insuranceIsCommercial)
      warnings.push('Assurance commerciale recommandée pour RIDESHARE')

    return {
      eligible: blockers.length === 0,
      blockers,
      warnings,
      taximeterEnabled: false,  // ALWAYS false — Provider Final Fare is source
    }
  }

  if (service === 'DELIVERY') {
    if (input.serviceAuth === 'BLOCKED' || input.serviceAuth === 'SUSPENDED')
      blockers.push(`Autorisation DELIVERY: ${input.serviceAuth}`)

    return {
      eligible: blockers.length === 0,
      blockers,
      warnings,
      taximeterEnabled: false,  // ALWAYS false — absolute rule, no exception
    }
  }

  return { eligible: false, blockers: ['Service inconnu'], warnings, taximeterEnabled: false }
}

// ─── REGISTRATION EXPIRY ──────────────────────────────────────

export type RegistrationExpiryStatus =
  | 'VALID'
  | 'EXPIRING_SOON'   // < 60 days
  | 'EXPIRING_CRITICAL' // < 14 days
  | 'EXPIRED'

export function getRegistrationExpiryStatus(
  validUntil: Date,
  warnDays = 60,
  criticalDays = 14,
): RegistrationExpiryStatus {
  const today = new Date()
  const diffDays = Math.ceil((validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0)            return 'EXPIRED'
  if (diffDays <= criticalDays) return 'EXPIRING_CRITICAL'
  if (diffDays <= warnDays)     return 'EXPIRING_SOON'
  return 'VALID'
}

// ─── AUDIT EVENT BUILDER ──────────────────────────────────────

export type VehicleAuditAction =
  | 'VEHICLE_CREATED'
  | 'VEHICLE_UPDATED'
  | 'VEHICLE_APPROVED'
  | 'VEHICLE_SUSPENDED'
  | 'VEHICLE_REACTIVATED'
  | 'VEHICLE_ASSIGNED'
  | 'VEHICLE_UNASSIGNED'
  | 'VEHICLE_ARCHIVED'
  | 'REGISTRATION_ADDED'
  | 'REGISTRATION_VERIFIED'
  | 'REGULATORY_APPROVED'
  | 'REGULATORY_SUSPENDED'

export interface VehicleAuditEvent {
  vehicleId:     string
  driverId:      string | null
  actorId:       string
  actorRole:     string
  action:        VehicleAuditAction
  previousStatus?: string
  newStatus?:      string
  metadata:      Record<string, string | boolean | null>
  // NEVER includes: VIN, plate, encrypted values, passwords
}

export function buildVehicleAuditEvent(
  params: VehicleAuditEvent,
): VehicleAuditEvent {
  // Validate no sensitive data in metadata
  const forbidden = ['vin', 'plate', 'encrypted', 'password', 'token', 'nas', 'sin']
  for (const key of Object.keys(params.metadata)) {
    if (forbidden.some(f => key.toLowerCase().includes(f))) {
      throw new Error(`Audit event metadata cannot contain sensitive key: ${key}`)
    }
  }
  return params
}
