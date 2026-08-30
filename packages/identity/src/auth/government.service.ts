// ================================================================
// TAXIMÈTRE.GOV — GOVERNMENT SERVICE
// Phase DB-16: Regulatory Actions · Oversight · Reports · Dashboard
// ================================================================

import { createHash } from 'crypto'

// ─── PUBLIC IDS ──────────────────────────────────────────────

export function formatPublicRegulatoryActionId(seq: number): string {
  return `REG-${seq.toString().padStart(8, '0')}`
}

export function formatPublicReportId(seq: number): string {
  return `RPT-${seq.toString().padStart(8, '0')}`
}

// ─── REGULATORY ACTION VALIDATION ────────────────────────────

export interface RegulatoryActionValidation {
  allowed:  boolean
  reason:   string | null
}

export function validateRegulatoryAction(params: {
  issuerId:         string
  subjectDriverId:  string | null
  actionType:       string
  legalAuthority:   string
  issuerPermissions: string[]
  issuerJurisdictions: string[]
  subjectJurisdiction: string
}): RegulatoryActionValidation {
  // RULE 1: Legal authority always required
  if (!params.legalAuthority.trim()) {
    return { allowed: false, reason: 'Autorité légale obligatoire pour toute action réglementaire' }
  }

  // RULE 2: Issuer cannot be the subject
  // (gov user cannot act on their own account)
  if (params.issuerId === params.subjectDriverId) {
    return { allowed: false, reason: 'Auto-action interdite — émetteur ne peut pas être le sujet' }
  }

  // RULE 3: Jurisdiction check
  const hasJurisdiction = params.issuerJurisdictions.includes(params.subjectJurisdiction) ||
    params.issuerJurisdictions.includes('ALL')
  if (!hasJurisdiction) {
    return { allowed: false, reason: `Accès hors juridiction: ${params.subjectJurisdiction}` }
  }

  // RULE 4: Permission check per action type
  const requiredPermission = getRequiredPermissionForAction(params.actionType)
  if (!params.issuerPermissions.includes(requiredPermission)) {
    return { allowed: false, reason: `Permission manquante: ${requiredPermission}` }
  }

  return { allowed: true, reason: null }
}

function getRequiredPermissionForAction(actionType: string): string {
  const permissionMap: Record<string, string> = {
    DRIVER_APPROVED:        'drivers.approve',
    DRIVER_SUSPENDED:       'drivers.suspend',
    DRIVER_REACTIVATED:     'drivers.approve',
    DRIVER_REVOKED:         'drivers.revoke',
    VEHICLE_APPROVED:       'vehicles.approve',
    VEHICLE_SUSPENDED:      'vehicles.suspend',
    PERMIT_APPROVED:        'permits.approve',
    PERMIT_SUSPENDED:       'permits.suspend',
    PERMIT_REVOKED:         'permits.revoke',
    DOCUMENT_APPROVED:      'documents.verify',
    DOCUMENT_REJECTED:      'documents.verify',
    TAX_ASSESSMENT:         'tax.assess',
    COMPLIANCE_NOTICE:      'compliance.notice',
    INVESTIGATION_OPENED:   'investigation.open',
    INVESTIGATION_CLOSED:   'investigation.close',
    FINE_ISSUED:            'penalty.issue',
    PENALTY_APPLIED:        'penalty.apply',
    WARNING_ISSUED:         'compliance.notice',
  }
  return permissionMap[actionType] ?? 'admin.action'
}

// ─── OVERSIGHT FLAG HELPERS ───────────────────────────────────

export interface OversightFlagEntry {
  driverId:    string | null
  flagType:    string
  priority:    'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW' | 'INFORMATIONAL'
  description: string
  sourceType:  string
  sourceRef:   string | null
}

export function buildOversightFlag(params: OversightFlagEntry): OversightFlagEntry {
  // Validate description never contains fraud accusation
  const forbidden = ['fraude confirmée', 'confirmed fraud', 'is frauding', 'est fraudeur']
  if (forbidden.some(f => params.description.toLowerCase().includes(f))) {
    throw new Error('Description du flag ne peut contenir d\'accusation directe de fraude — utiliser REVIEW_REQUIRED')
  }
  return params
}

// ─── REPORT ACCESS GUARD ─────────────────────────────────────

export interface ReportAccessResult {
  allowed:  boolean
  reason:   string | null
}

export function checkReportAccess(params: {
  requestorPermissions: string[]
  requestorJurisdictions: string[]
  reportJurisdiction:   string
  reportContainsPii:    boolean
  mfaVerified:          boolean
  accessType:           'VIEW' | 'DOWNLOAD' | 'EXPORT' | 'PRINT'
}): ReportAccessResult {
  // Download always requires MFA
  if ((params.accessType === 'DOWNLOAD' || params.accessType === 'EXPORT') && !params.mfaVerified) {
    return { allowed: false, reason: 'MFA obligatoire pour téléchargement/export de rapport' }
  }

  // PII reports require elevated permission
  if (params.reportContainsPii && !params.requestorPermissions.includes('reports.pii')) {
    return { allowed: false, reason: 'Permission reports.pii requise pour rapport contenant des données personnelles' }
  }

  // Base permission
  if (!params.requestorPermissions.includes('reports.read') &&
      !params.requestorPermissions.includes('reports.generate')) {
    return { allowed: false, reason: 'Permission reports.read requise' }
  }

  // Jurisdiction
  const hasJurisdiction = params.requestorJurisdictions.includes(params.reportJurisdiction) ||
    params.requestorJurisdictions.includes('ALL')
  if (!hasJurisdiction) {
    return { allowed: false, reason: `Accès rapport hors juridiction: ${params.reportJurisdiction}` }
  }

  return { allowed: true, reason: null }
}

// ─── DRIVER REGULATORY STATUS ─────────────────────────────────

export interface DriverRegulatoryStatus {
  driverId:          string
  overallCompliance: string
  hasSuspension:     boolean
  activeActions:     number
  canOperate:        boolean
  reasons:           string[]
}

export function computeDriverRegulatoryStatus(params: {
  driverId:            string
  documentStatus:      string
  hasSuspension:       boolean
  activeActionsCount:  number
  criticalActionsCount: number
  taxCompliant:        boolean
}): DriverRegulatoryStatus {
  const reasons: string[] = []

  if (params.hasSuspension) {
    reasons.push('Suspension active')
  }

  if (params.criticalActionsCount > 0) {
    reasons.push(`${params.criticalActionsCount} action(s) critique(s) active(s)`)
  }

  if (params.documentStatus === 'NON_COMPLIANT' || params.documentStatus === 'PENDING_DOCS') {
    reasons.push('Documents non conformes ou manquants')
  }

  if (!params.taxCompliant) {
    reasons.push('Non-conformité fiscale')
  }

  const canOperate = reasons.length === 0
  const overallCompliance = params.hasSuspension ? 'SUSPENDED' :
    reasons.length > 0 ? 'NON_COMPLIANT' : 'COMPLIANT'

  return {
    driverId: params.driverId,
    overallCompliance,
    hasSuspension:  params.hasSuspension,
    activeActions:  params.activeActionsCount,
    canOperate,
    reasons,
  }
}

// ─── DASHBOARD METRICS ────────────────────────────────────────

export interface MetricSnapshot {
  metricType:  string
  value:       number
  unit:        string
  periodType:  string
  computedAt:  Date
  isRealtime:  boolean
}

export function buildMetricSnapshot(
  metricType: string,
  value:      number,
  unit:       string,
  periodType: 'REALTIME' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY',
): MetricSnapshot {
  return {
    metricType, value, unit, periodType,
    computedAt: new Date(),
    isRealtime: periodType === 'REALTIME',
    // Only REALTIME snapshots are presented as real-time
  }
}

// ─── JURISDICTION ACCESS ──────────────────────────────────────

export function canGovernmentUserAccessDriver(
  userJurisdictions: string[],
  driverJurisdiction: string,
  permissions:       string[],
): boolean {
  const hasPerm = permissions.includes('drivers.read') ||
    permissions.includes('drivers.suspend') ||
    permissions.includes('drivers.approve')
  const hasJurisdiction = userJurisdictions.includes(driverJurisdiction) ||
    userJurisdictions.includes('ALL')
  return hasPerm && hasJurisdiction
}

export function canGovernmentUserGenerateReport(
  permissions:   string[],
  jurisdictions: string[],
  reportJurisdiction: string,
): boolean {
  const hasPerm = permissions.includes('reports.generate')
  const hasJurisdiction = jurisdictions.includes(reportJurisdiction) ||
    jurisdictions.includes('ALL')
  return hasPerm && hasJurisdiction
}

export function canGovernmentUserOpenInvestigation(
  permissions: string[],
): boolean {
  return permissions.includes('investigation.open')
}

// ─── IP HASH (for report access log) ─────────────────────────

export function hashIp(ip: string): string {
  return createHash('sha256').update(ip.trim()).digest('hex').slice(0, 16)
}
