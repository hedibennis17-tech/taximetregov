// ================================================================
// TAXIMÈTRE.GOV — DOCUMENT SERVICE
// Phase DB-5: Compliance · Verification · Expiry · Eligibility
// ================================================================

import { createHash, randomBytes } from 'crypto'

// ─── PUBLIC DOCUMENT ID ───────────────────────────────────────

export function formatPublicDocumentId(sequence: number): string {
  return `DOC-${sequence.toString().padStart(8, '0')}`
}

export function parsePublicDocumentId(id: string): number | null {
  const m = id.match(/^DOC-(\d{8})$/)
  if (!m || !m[1]) return null
  return parseInt(m[1], 10)
}

// ─── CHECKSUM ────────────────────────────────────────────────

export function computeFileChecksum(content: Buffer): string {
  return createHash('sha256').update(content).digest('hex')
}

export function computeDocNumberHash(docNumber: string): string {
  // Normalized hash for duplicate detection — never logged
  return createHash('sha256')
    .update(docNumber.replace(/\s+/g, '').toUpperCase())
    .digest('hex')
}

export function maskDocNumber(last4: string | null | undefined): string {
  if (!last4) return '••••••••'
  return `••••${last4}`
}

// ─── EXPIRY ──────────────────────────────────────────────────

export type DocumentExpiryStatus =
  | 'VALID'
  | 'EXPIRING_SOON'     // < renewalNoticeDays
  | 'EXPIRING_CRITICAL' // < 14 days
  | 'EXPIRED'
  | 'NO_EXPIRY'         // Document has no expiry date

export function getDocumentExpiryStatus(
  expiresAt: Date | null | undefined,
  renewalNoticeDays = 30,
  criticalDays = 14,
): DocumentExpiryStatus {
  if (!expiresAt) return 'NO_EXPIRY'
  const today = new Date()
  const diffDays = Math.ceil(
    (expiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (diffDays < 0)              return 'EXPIRED'
  if (diffDays <= criticalDays)  return 'EXPIRING_CRITICAL'
  if (diffDays <= renewalNoticeDays) return 'EXPIRING_SOON'
  return 'VALID'
}

// ─── SCAN VALIDATION ─────────────────────────────────────────

export function canDocumentBeApproved(
  scanStatus: string,
  verificationStatus: string,
): { allowed: boolean; reason: string | null } {
  // CRITICAL: malware scan pending → NEVER approve
  if (scanStatus === 'SCAN_PENDING') {
    return { allowed: false, reason: 'Analyse antivirus en attente — approbation impossible' }
  }
  if (scanStatus === 'SCAN_INFECTED') {
    return { allowed: false, reason: 'Fichier infecté — rejeté automatiquement' }
  }
  if (scanStatus === 'SCAN_FAILED') {
    return { allowed: false, reason: 'Analyse antivirus échouée — révision manuelle requise' }
  }
  if (verificationStatus !== 'IN_REVIEW' && verificationStatus !== 'VERIFIED') {
    return { allowed: false, reason: 'Document doit être en révision avant approbation' }
  }
  return { allowed: true, reason: null }
}

// ─── COMPLIANCE ENGINE ────────────────────────────────────────

export interface RequiredDocument {
  documentTypeCode: string
  label: string
  isRequired: boolean
  serviceType: string
  jurisdiction: string
}

export interface DocumentState {
  documentTypeCode: string
  status: string            // document_status enum
  expiresAt: Date | null
  verificationStatus: string
  scanStatus: string
  publicDocumentId: string
}

export interface ComplianceCheckResult {
  overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'REVIEW_REQUIRED' | 'PENDING'
  completenessScore: number  // 0-100
  missingDocuments: string[] // document type codes
  expiredDocuments: string[]
  expiringDocuments: string[]
  blockers: string[]
  warnings: string[]
  // taximeter rule: always false for DELIVERY regardless of docs
  taximeterEligible: boolean
}

export function computeCompliance(
  serviceType: 'TAXI' | 'RIDESHARE' | 'DELIVERY',
  required: RequiredDocument[],
  existing: DocumentState[],
): ComplianceCheckResult {
  const missingDocuments: string[] = []
  const expiredDocuments: string[] = []
  const expiringDocuments: string[] = []
  const blockers: string[] = []
  const warnings: string[] = []

  const relevantRequired = required.filter(
    r => r.serviceType === serviceType || r.serviceType === 'ALL'
  )

  let fulfilledCount = 0

  for (const req of relevantRequired) {
    const doc = existing.find(d => d.documentTypeCode === req.documentTypeCode)

    if (!doc) {
      if (req.isRequired) {
        missingDocuments.push(req.documentTypeCode)
        blockers.push(`Document manquant: ${req.label}`)
      }
      continue
    }

    // Check expiry
    const expiryStatus = getDocumentExpiryStatus(doc.expiresAt)
    if (expiryStatus === 'EXPIRED') {
      expiredDocuments.push(req.documentTypeCode)
      if (req.isRequired) blockers.push(`Document expiré: ${req.label}`)
      continue
    }
    if (expiryStatus === 'EXPIRING_CRITICAL' || expiryStatus === 'EXPIRING_SOON') {
      expiringDocuments.push(req.documentTypeCode)
      warnings.push(`Document expirant bientôt: ${req.label}`)
    }

    // Check status
    if (doc.status === 'REJECTED' || doc.status === 'REVOKED') {
      if (req.isRequired) blockers.push(`Document rejeté/révoqué: ${req.label}`)
      continue
    }

    // Check scan
    if (doc.scanStatus === 'SCAN_INFECTED') {
      blockers.push(`Document infecté: ${req.label}`)
      continue
    }

    // Check verification
    if (doc.verificationStatus === 'REJECTED') {
      if (req.isRequired) blockers.push(`Vérification refusée: ${req.label}`)
      continue
    }
    if (doc.verificationStatus === 'NOT_STARTED' || doc.verificationStatus === 'PENDING') {
      warnings.push(`Vérification en attente: ${req.label}`)
    }

    if (doc.status === 'APPROVED' && doc.verificationStatus === 'VERIFIED') {
      fulfilledCount++
    } else if (req.isRequired) {
      warnings.push(`Document en attente d'approbation: ${req.label}`)
    }
  }

  const score = relevantRequired.length > 0
    ? Math.round((fulfilledCount / relevantRequired.length) * 100)
    : 100

  let overallStatus: ComplianceCheckResult['overallStatus']
  if (blockers.length > 0)       overallStatus = 'NON_COMPLIANT'
  else if (warnings.length > 0)  overallStatus = 'REVIEW_REQUIRED'
  else if (score === 100)        overallStatus = 'COMPLIANT'
  else                           overallStatus = 'PENDING'

  // ABSOLUTE RULE: Delivery never enables taximeter
  const taximeterEligible = serviceType === 'TAXI' && overallStatus === 'COMPLIANT'

  return {
    overallStatus,
    completenessScore: score,
    missingDocuments,
    expiredDocuments,
    expiringDocuments,
    blockers,
    warnings,
    taximeterEligible,
  }
}

// ─── ACCESS CONTROL ──────────────────────────────────────────

export function canDriverAccessDocument(
  requestorDriverId: string,
  documentOwnerDriverId: string | null,
): boolean {
  if (!documentOwnerDriverId) return false
  // Driver can ONLY access their own documents
  return requestorDriverId === documentOwnerDriverId
}

export function canGovernmentUserReviewDocument(
  userPermissions: string[],
  userJurisdictions: string[],
  documentJurisdiction: string,
): boolean {
  const hasPerm = userPermissions.includes('documents.verify') ||
    userPermissions.includes('documents.read')
  const hasJurisdiction = userJurisdictions.includes(documentJurisdiction) ||
    userJurisdictions.includes('ALL')
  return hasPerm && hasJurisdiction
}

export function canGovernmentUserApproveDocument(
  userPermissions: string[],
  userJurisdictions: string[],
  documentJurisdiction: string,
): boolean {
  return userPermissions.includes('documents.verify') &&
    (userJurisdictions.includes(documentJurisdiction) ||
     userJurisdictions.includes('ALL'))
}

// ─── DUPLICATE DETECTION ─────────────────────────────────────

export interface DuplicateCheckResult {
  isDuplicate: boolean
  existingDocumentId: string | null
  reason: string | null
}

export function checkChecksumDuplicate(
  newChecksum: string,
  existingChecksums: { checksum: string; documentId: string }[],
): DuplicateCheckResult {
  // Same file content = same checksum
  const match = existingChecksums.find(e => e.checksum === newChecksum)
  if (match) {
    return {
      isDuplicate: true,
      existingDocumentId: match.documentId,
      // Not auto-rejected — requires human review
      reason: 'Fichier identique déjà téléversé — révision recommandée',
    }
  }
  return { isDuplicate: false, existingDocumentId: null, reason: null }
}

export function checkDocNumberDuplicate(
  newHash: string,
  ownerType: string,
  existing: { hash: string; documentId: string; ownerType: string }[],
): DuplicateCheckResult {
  const match = existing.find(e =>
    e.hash === newHash && e.ownerType === ownerType
  )
  if (match) {
    return {
      isDuplicate: true,
      existingDocumentId: match.documentId,
      reason: 'Numéro de document déjà utilisé — REVIEW_REQUIRED',
      // Never auto-accuse of fraud → REVIEW_REQUIRED
    }
  }
  return { isDuplicate: false, existingDocumentId: null, reason: null }
}

// ─── SEED DATA ────────────────────────────────────────────────

// Development fixtures only — no real data
export const SEED_DOCUMENT_TYPES = [
  {
    code: 'DRIVER_LICENSE',
    label: 'Permis de conduire',
    labelFr: 'Permis de conduire',
    labelEn: 'Driver\'s Licence',
    ownerType: 'DRIVER',
    hasExpiryDate: true,
    requiresVerification: true,
    defaultValidityDays: 1825,   // 5 years
    renewalNoticeDays: 60,
  },
  {
    code: 'TAXI_PERMIT',
    label: 'Permis taxi',
    labelFr: 'Permis taxi',
    labelEn: 'Taxi Permit',
    ownerType: 'DRIVER',
    hasExpiryDate: true,
    requiresVerification: true,
    requiresManualReview: true,
    defaultValidityDays: 365,
    renewalNoticeDays: 30,
  },
  {
    code: 'VEHICLE_REGISTRATION',
    label: 'Enregistrement du véhicule',
    labelFr: 'Enregistrement du véhicule',
    labelEn: 'Vehicle Registration',
    ownerType: 'VEHICLE',
    hasExpiryDate: true,
    requiresVerification: true,
    defaultValidityDays: 365,
    renewalNoticeDays: 30,
  },
  {
    code: 'VEHICLE_INSURANCE',
    label: 'Assurance véhicule',
    labelFr: 'Assurance véhicule',
    labelEn: 'Vehicle Insurance',
    ownerType: 'VEHICLE',
    hasExpiryDate: true,
    requiresVerification: true,
    defaultValidityDays: 365,
    renewalNoticeDays: 30,
  },
  {
    code: 'SAFETY_INSPECTION',
    label: 'Inspection de sécurité',
    labelFr: 'Inspection de sécurité',
    labelEn: 'Safety Inspection',
    ownerType: 'VEHICLE',
    hasExpiryDate: true,
    requiresVerification: true,
    defaultValidityDays: 365,
    renewalNoticeDays: 60,
  },
  {
    code: 'MECHANICAL_INSPECTION',
    label: 'Inspection mécanique',
    labelFr: 'Inspection mécanique',
    labelEn: 'Mechanical Inspection',
    ownerType: 'VEHICLE',
    hasExpiryDate: true,
    requiresVerification: true,
    defaultValidityDays: 365,
    renewalNoticeDays: 60,
  },
  {
    code: 'IDENTITY_DOCUMENT',
    label: 'Document d\'identité',
    labelFr: 'Document d\'identité',
    labelEn: 'Identity Document',
    ownerType: 'DRIVER',
    hasExpiryDate: true,
    requiresVerification: true,
    requiresManualReview: false,
    defaultValidityDays: 1825,
    renewalNoticeDays: 90,
  },
]

// Development-only required documents fixture
export const SEED_DOCUMENT_REQUIREMENTS = [
  { documentTypeCode: 'DRIVER_LICENSE',      serviceType: 'TAXI',      jurisdiction: 'QC', isRequired: true },
  { documentTypeCode: 'TAXI_PERMIT',         serviceType: 'TAXI',      jurisdiction: 'QC', isRequired: true },
  { documentTypeCode: 'VEHICLE_REGISTRATION', serviceType: 'TAXI',     jurisdiction: 'QC', isRequired: true },
  { documentTypeCode: 'VEHICLE_INSURANCE',   serviceType: 'TAXI',      jurisdiction: 'QC', isRequired: true },
  { documentTypeCode: 'SAFETY_INSPECTION',   serviceType: 'TAXI',      jurisdiction: 'QC', isRequired: true },
  { documentTypeCode: 'DRIVER_LICENSE',      serviceType: 'RIDESHARE', jurisdiction: 'QC', isRequired: true },
  { documentTypeCode: 'VEHICLE_INSURANCE',   serviceType: 'RIDESHARE', jurisdiction: 'QC', isRequired: true },
  { documentTypeCode: 'IDENTITY_DOCUMENT',   serviceType: 'DELIVERY',  jurisdiction: 'QC', isRequired: true },
]
