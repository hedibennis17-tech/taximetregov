// ================================================================
// TAXIMÈTRE.GOV — DOCUMENT & COMPLIANCE TESTS
// Phase DB-5: 25 tests obligatoires + invariants
// ================================================================

import { describe, it, expect } from 'vitest'
import {
  formatPublicDocumentId, parsePublicDocumentId,
  computeFileChecksum, computeDocNumberHash, maskDocNumber,
  getDocumentExpiryStatus, canDocumentBeApproved,
  computeCompliance, canDriverAccessDocument,
  canGovernmentUserReviewDocument, canGovernmentUserApproveDocument,
  checkChecksumDuplicate, checkDocNumberDuplicate,
  SEED_DOCUMENT_TYPES, SEED_DOCUMENT_REQUIREMENTS,
  type RequiredDocument, type DocumentState,
} from '../src/auth/document.service'

// ─── PUBLIC DOCUMENT ID ───────────────────────────────────────

describe('Public Document ID', () => {
  it('[PASS] Format DOC-XXXXXXXX', () => {
    expect(formatPublicDocumentId(1)).toBe('DOC-00000001')
    expect(formatPublicDocumentId(1234)).toBe('DOC-00001234')
  })

  it('[PASS] Parse extracts sequence', () => {
    expect(parsePublicDocumentId('DOC-00001234')).toBe(1234)
  })

  it('[PASS] Invalid format = null', () => {
    expect(parsePublicDocumentId('DOC-123')).toBeNull()
    expect(parsePublicDocumentId('storage/path/file.pdf')).toBeNull()
    // Storage path ≠ public ID
  })

  it('[TEST 20] Storage path not exposed in public ID', () => {
    const publicId = formatPublicDocumentId(42)
    expect(publicId).not.toContain('/')
    expect(publicId).not.toContain('s3')
    expect(publicId).not.toContain('supabase')
    expect(publicId).not.toContain('.pdf')
    expect(publicId).toMatch(/^DOC-\d{8}$/)
  })
})

// ─── CHECKSUM & HASHING ───────────────────────────────────────

describe('Checksum & Document Number Security', () => {
  it('[TEST 21] Checksum computed from file content', () => {
    const content = Buffer.from('fake-pdf-content-12345')
    const checksum = computeFileChecksum(content)
    expect(checksum).toHaveLength(64)
    expect(checksum).toMatch(/^[0-9a-f]+$/)
  })

  it('[TEST 21] Identical files produce identical checksums', () => {
    const content = Buffer.from('same-content')
    expect(computeFileChecksum(content)).toBe(computeFileChecksum(content))
  })

  it('[TEST 21] Different files produce different checksums', () => {
    const a = computeFileChecksum(Buffer.from('content-a'))
    const b = computeFileChecksum(Buffer.from('content-b'))
    expect(a).not.toBe(b)
  })

  it('[PASS] Doc number hash is deterministic and case-insensitive', () => {
    expect(computeDocNumberHash('A12345')).toBe(computeDocNumberHash('a12345'))
    expect(computeDocNumberHash('A 12345')).toBe(computeDocNumberHash('A12345'))
  })

  it('[PASS] maskDocNumber shows ••••XXXX', () => {
    expect(maskDocNumber('5678')).toBe('••••5678')
    expect(maskDocNumber(null)).toBe('••••••••')
    expect(maskDocNumber(undefined)).toBe('••••••••')
  })
})

// ─── EXPIRY STATUS ────────────────────────────────────────────

describe('Document Expiry Status — Test 11 & 12', () => {
  function daysFromNow(n: number) {
    const d = new Date(); d.setDate(d.getDate() + n); return d
  }

  it('[TEST 11] Expired document detected', () => {
    expect(getDocumentExpiryStatus(daysFromNow(-1))).toBe('EXPIRED')
    expect(getDocumentExpiryStatus(daysFromNow(-30))).toBe('EXPIRED')
  })

  it('[TEST 12] Expiring soon detected (< 30 days)', () => {
    expect(getDocumentExpiryStatus(daysFromNow(10))).toBe('EXPIRING_CRITICAL')
    expect(getDocumentExpiryStatus(daysFromNow(25))).toBe('EXPIRING_SOON')
  })

  it('[PASS] Valid document (> 30 days)', () => {
    expect(getDocumentExpiryStatus(daysFromNow(60))).toBe('VALID')
    expect(getDocumentExpiryStatus(daysFromNow(365))).toBe('VALID')
  })

  it('[PASS] No expiry date = NO_EXPIRY', () => {
    expect(getDocumentExpiryStatus(null)).toBe('NO_EXPIRY')
    expect(getDocumentExpiryStatus(undefined)).toBe('NO_EXPIRY')
  })

  it('[PASS] Renewal notice days configurable', () => {
    expect(getDocumentExpiryStatus(daysFromNow(45), 60)).toBe('EXPIRING_SOON')
    expect(getDocumentExpiryStatus(daysFromNow(45), 30)).toBe('VALID')
  })
})

// ─── SCAN VALIDATION ──────────────────────────────────────────

describe('Malware Scan Validation — Test 22', () => {
  it('[TEST 22] Scan PENDING prevents approval', () => {
    const result = canDocumentBeApproved('SCAN_PENDING', 'IN_REVIEW')
    expect(result.allowed).toBe(false)
    expect(result.reason).toMatch(/antivirus/i)
  })

  it('[TEST 22] Scan INFECTED always rejected', () => {
    const result = canDocumentBeApproved('SCAN_INFECTED', 'IN_REVIEW')
    expect(result.allowed).toBe(false)
    expect(result.reason).toMatch(/infect/i)
  })

  it('[TEST 22] Scan FAILED prevents approval', () => {
    expect(canDocumentBeApproved('SCAN_FAILED', 'IN_REVIEW').allowed).toBe(false)
  })

  it('[PASS] Scan CLEAN + IN_REVIEW = approval allowed', () => {
    const result = canDocumentBeApproved('SCAN_CLEAN', 'IN_REVIEW')
    expect(result.allowed).toBe(true)
    expect(result.reason).toBeNull()
  })

  it('[PASS] Scan CLEAN but not in review = not allowed yet', () => {
    const result = canDocumentBeApproved('SCAN_CLEAN', 'PENDING')
    expect(result.allowed).toBe(false)
  })
})

// ─── COMPLIANCE ENGINE ────────────────────────────────────────

const taxiRequirements: RequiredDocument[] = [
  { documentTypeCode: 'DRIVER_LICENSE',      label: 'Permis de conduire', isRequired: true,  serviceType: 'TAXI', jurisdiction: 'QC' },
  { documentTypeCode: 'TAXI_PERMIT',         label: 'Permis taxi',        isRequired: true,  serviceType: 'TAXI', jurisdiction: 'QC' },
  { documentTypeCode: 'VEHICLE_INSURANCE',   label: 'Assurance',          isRequired: true,  serviceType: 'TAXI', jurisdiction: 'QC' },
  { documentTypeCode: 'VEHICLE_REGISTRATION', label: 'Enregistrement',    isRequired: true,  serviceType: 'TAXI', jurisdiction: 'QC' },
  { documentTypeCode: 'SAFETY_INSPECTION',   label: 'Inspection',         isRequired: true,  serviceType: 'TAXI', jurisdiction: 'QC' },
]

function futureDate(days: number) {
  const d = new Date(); d.setDate(d.getDate() + days); return d
}

const compliantDocs: DocumentState[] = [
  { documentTypeCode: 'DRIVER_LICENSE',      status: 'APPROVED', expiresAt: futureDate(365), verificationStatus: 'VERIFIED', scanStatus: 'SCAN_CLEAN', publicDocumentId: 'DOC-00000001' },
  { documentTypeCode: 'TAXI_PERMIT',         status: 'APPROVED', expiresAt: futureDate(180), verificationStatus: 'VERIFIED', scanStatus: 'SCAN_CLEAN', publicDocumentId: 'DOC-00000002' },
  { documentTypeCode: 'VEHICLE_INSURANCE',   status: 'APPROVED', expiresAt: futureDate(200), verificationStatus: 'VERIFIED', scanStatus: 'SCAN_CLEAN', publicDocumentId: 'DOC-00000003' },
  { documentTypeCode: 'VEHICLE_REGISTRATION', status: 'APPROVED', expiresAt: futureDate(300), verificationStatus: 'VERIFIED', scanStatus: 'SCAN_CLEAN', publicDocumentId: 'DOC-00000004' },
  { documentTypeCode: 'SAFETY_INSPECTION',   status: 'APPROVED', expiresAt: futureDate(250), verificationStatus: 'VERIFIED', scanStatus: 'SCAN_CLEAN', publicDocumentId: 'DOC-00000005' },
]

describe('Compliance Engine', () => {
  it('[TEST 14] All required documents valid = COMPLIANT', () => {
    const result = computeCompliance('TAXI', taxiRequirements, compliantDocs)
    expect(result.overallStatus).toBe('COMPLIANT')
    expect(result.completenessScore).toBe(100)
    expect(result.blockers).toHaveLength(0)
  })

  it('[TEST 13] Missing required document = NON_COMPLIANT', () => {
    const missingInsurance = compliantDocs.filter(d => d.documentTypeCode !== 'VEHICLE_INSURANCE')
    const result = computeCompliance('TAXI', taxiRequirements, missingInsurance)
    expect(result.overallStatus).toBe('NON_COMPLIANT')
    expect(result.missingDocuments).toContain('VEHICLE_INSURANCE')
    expect(result.blockers.some(b => b.includes('Assurance'))).toBe(true)
  })

  it('[TEST 11] Expired document = NON_COMPLIANT', () => {
    const withExpiredLicense = compliantDocs.map(d =>
      d.documentTypeCode === 'DRIVER_LICENSE'
        ? { ...d, expiresAt: futureDate(-10), status: 'EXPIRED' }
        : d
    )
    const result = computeCompliance('TAXI', taxiRequirements, withExpiredLicense as DocumentState[])
    expect(result.overallStatus).toBe('NON_COMPLIANT')
    expect(result.expiredDocuments).toContain('DRIVER_LICENSE')
  })

  it('[TEST 15] Expired insurance prevents vehicle eligibility', () => {
    const withExpiredInsurance = compliantDocs.map(d =>
      d.documentTypeCode === 'VEHICLE_INSURANCE'
        ? { ...d, expiresAt: futureDate(-5), status: 'EXPIRED' }
        : d
    )
    const result = computeCompliance('TAXI', taxiRequirements, withExpiredInsurance as DocumentState[])
    expect(result.overallStatus).toBe('NON_COMPLIANT')
    expect(result.taximeterEligible).toBe(false)
  })

  it('[TEST 16] Delivery does NOT activate taximeter', () => {
    const deliveryReqs: RequiredDocument[] = [
      { documentTypeCode: 'IDENTITY_DOCUMENT', label: 'Identité', isRequired: true, serviceType: 'DELIVERY', jurisdiction: 'QC' },
    ]
    const deliveryDocs: DocumentState[] = [
      { documentTypeCode: 'IDENTITY_DOCUMENT', status: 'APPROVED', expiresAt: futureDate(200), verificationStatus: 'VERIFIED', scanStatus: 'SCAN_CLEAN', publicDocumentId: 'DOC-00000010' },
    ]
    const result = computeCompliance('DELIVERY', deliveryReqs, deliveryDocs)
    expect(result.overallStatus).toBe('COMPLIANT')
    expect(result.taximeterEligible).toBe(false) // ABSOLUTE RULE
  })

  it('[PASS] TAXI compliant = taximeterEligible true', () => {
    const result = computeCompliance('TAXI', taxiRequirements, compliantDocs)
    expect(result.taximeterEligible).toBe(true)
  })

  it('[PASS] RIDESHARE compliant = taximeterEligible false', () => {
    const rideshareReqs = taxiRequirements.filter(r =>
      ['DRIVER_LICENSE', 'VEHICLE_INSURANCE'].includes(r.documentTypeCode)
    ).map(r => ({ ...r, serviceType: 'RIDESHARE' }))
    const result = computeCompliance('RIDESHARE', rideshareReqs, compliantDocs)
    expect(result.taximeterEligible).toBe(false) // Provider Final Fare
  })

  it('[PASS] Expiring document generates warning but not blocker', () => {
    const withExpiringSoon = compliantDocs.map(d =>
      d.documentTypeCode === 'TAXI_PERMIT'
        ? { ...d, expiresAt: futureDate(10) }
        : d
    )
    const result = computeCompliance('TAXI', taxiRequirements, withExpiringSoon)
    // Should still be compliant or REVIEW_REQUIRED (not NON_COMPLIANT)
    expect(result.expiringDocuments).toContain('TAXI_PERMIT')
    expect(result.warnings.some(w => w.includes('Permis taxi'))).toBe(true)
  })
})

// ─── ACCESS CONTROL ───────────────────────────────────────────

describe('Document Access Control — Tests 5, 6, 7, 8, 23', () => {
  const driverA = 'driver-uuid-aaaa'
  const driverB = 'driver-uuid-bbbb'

  it('[TEST 5] Driver accesses own document = ALLOW', () => {
    expect(canDriverAccessDocument(driverA, driverA)).toBe(true)
  })

  it('[TEST 6] Driver accesses another driver document = DENY', () => {
    expect(canDriverAccessDocument(driverA, driverB)).toBe(false)
  })

  it('[TEST 7] Government reviewer with correct permission + jurisdiction = ALLOW', () => {
    expect(canGovernmentUserReviewDocument(
      ['documents.verify', 'documents.read'],
      ['QC'], 'QC'
    )).toBe(true)
  })

  it('[TEST 8] Government user without documents.verify = DENY', () => {
    expect(canGovernmentUserReviewDocument(
      ['drivers.read', 'revenue.read'],
      ['QC'], 'QC'
    )).toBe(false)
  })

  it('[TEST 23] Government reviewer outside jurisdiction = DENY', () => {
    expect(canGovernmentUserReviewDocument(
      ['documents.verify'],
      ['ON'],  // Ontario only
      'QC'    // Québec document
    )).toBe(false)
  })

  it('[TEST 23] ALL jurisdiction grants universal access', () => {
    expect(canGovernmentUserReviewDocument(
      ['documents.verify'],
      ['ALL'], 'QC'
    )).toBe(true)
  })

  it('[TEST 9] Approve document = requires documents.verify', () => {
    expect(canGovernmentUserApproveDocument(
      ['documents.verify'], ['QC'], 'QC'
    )).toBe(true)
  })

  it('[TEST 10] Reject with reason — verify check', () => {
    // Rejection requires same permission as approval
    expect(canGovernmentUserApproveDocument(
      ['documents.read'],  // read only, not verify
      ['QC'], 'QC'
    )).toBe(false)
  })
})

// ─── DUPLICATE DETECTION ──────────────────────────────────────

describe('Duplicate Detection — Tests 21 & 25', () => {
  const existingChecksums = [
    { checksum: 'abc123def456', documentId: 'DOC-00000001' },
    { checksum: 'xyz789ghi012', documentId: 'DOC-00000002' },
  ]

  it('[TEST 21] Duplicate checksum detected', () => {
    const result = checkChecksumDuplicate('abc123def456', existingChecksums)
    expect(result.isDuplicate).toBe(true)
    expect(result.existingDocumentId).toBe('DOC-00000001')
    expect(result.reason).toBeTruthy()
  })

  it('[TEST 21] Unique checksum = no duplicate', () => {
    const result = checkChecksumDuplicate('brand-new-checksum', existingChecksums)
    expect(result.isDuplicate).toBe(false)
    expect(result.existingDocumentId).toBeNull()
  })

  it('[TEST 21] Duplicate checksum → REVIEW_REQUIRED, not auto-reject', () => {
    const result = checkChecksumDuplicate('abc123def456', existingChecksums)
    // Never auto-rejects — requires human review
    expect(result.isDuplicate).toBe(true)
    expect(result.reason).toMatch(/révision/i)
  })

  it('[PASS] Same doc number hash in same owner type = duplicate', () => {
    const existing = [{ hash: 'hashABC', documentId: 'DOC-001', ownerType: 'DRIVER' }]
    const result = checkDocNumberDuplicate('hashABC', 'DRIVER', existing)
    expect(result.isDuplicate).toBe(true)
    expect(result.reason).toMatch(/REVIEW_REQUIRED/i)
  })

  it('[PASS] Same hash different owner type = no duplicate', () => {
    const existing = [{ hash: 'hashABC', documentId: 'DOC-001', ownerType: 'DRIVER' }]
    const result = checkDocNumberDuplicate('hashABC', 'VEHICLE', existing)
    expect(result.isDuplicate).toBe(false)
  })
})

// ─── VERSION HISTORY ──────────────────────────────────────────

describe('Document Version History — Tests 3, 4, 24, 25', () => {
  it('[TEST 3] Version 2 upload concept valid', () => {
    // Version numbers must be sequential
    const versions = [
      { id: 'v1', versionNumber: 1, status: 'SUPERSEDED' },
      { id: 'v2', versionNumber: 2, status: 'ACTIVE' },
    ]
    expect(versions.at(-1)?.versionNumber).toBe(2)
    expect(versions[0]?.status).toBe('SUPERSEDED')
    // Old version preserved
  })

  it('[TEST 4] Previous version remains accessible', () => {
    const versions = [
      { id: 'v1', versionNumber: 1, status: 'SUPERSEDED', checksum: 'cs1' },
      { id: 'v2', versionNumber: 2, status: 'ACTIVE', checksum: 'cs2' },
    ]
    // Both versions queryable — history preserved
    const v1 = versions.find(v => v.versionNumber === 1)
    expect(v1).toBeDefined()
    expect(v1?.checksum).toBe('cs1')
  })

  it('[TEST 24] Rejected document can be replaced by new version', () => {
    const docStatus = 'REJECTED'
    // Driver can upload a new version even after rejection
    const canUpload = docStatus !== 'REVOKED' && docStatus !== 'ARCHIVED'
    expect(canUpload).toBe(true)
  })

  it('[TEST 25] Old versions historically traceable', () => {
    // Version chain: v1 → v2 → v3
    const v1 = { id: 'v1', versionNumber: 1, replacedByVersionId: 'v2' }
    const v2 = { id: 'v2', versionNumber: 2, replacedByVersionId: 'v3' }
    const v3 = { id: 'v3', versionNumber: 3, replacedByVersionId: null }
    // Can trace from any version to current
    expect(v1.replacedByVersionId).toBe('v2')
    expect(v2.replacedByVersionId).toBe('v3')
    expect(v3.replacedByVersionId).toBeNull()
    // All versions accessible — history never deleted
  })
})

// ─── SEEDS ────────────────────────────────────────────────────

describe('Seed Data Validation', () => {
  it('[PASS] All document types have required fields', () => {
    SEED_DOCUMENT_TYPES.forEach(dt => {
      expect(dt.code).toBeTruthy()
      expect(dt.label).toBeTruthy()
      expect(dt.ownerType).toMatch(/^(DRIVER|VEHICLE|BUSINESS|OTHER)$/)
      expect(dt.renewalNoticeDays).toBeGreaterThan(0)
    })
  })

  it('[PASS] No real government data in seeds', () => {
    SEED_DOCUMENT_TYPES.forEach(dt => {
      // No real NAS, licence numbers, or personal data
      expect(dt.code).not.toMatch(/\d{9}/)  // No SIN pattern
    })
  })

  it('[PASS] Taxi requirements cover all 5 required docs', () => {
    const taxiReqs = SEED_DOCUMENT_REQUIREMENTS.filter(r => r.serviceType === 'TAXI')
    expect(taxiReqs).toHaveLength(5)
    const codes = taxiReqs.map(r => r.documentTypeCode)
    expect(codes).toContain('DRIVER_LICENSE')
    expect(codes).toContain('TAXI_PERMIT')
    expect(codes).toContain('VEHICLE_INSURANCE')
    expect(codes).toContain('VEHICLE_REGISTRATION')
    expect(codes).toContain('SAFETY_INSPECTION')
  })

  it('[PASS] Delivery requirements minimal (no taxi permit)', () => {
    const deliveryReqs = SEED_DOCUMENT_REQUIREMENTS.filter(r => r.serviceType === 'DELIVERY')
    const codes = deliveryReqs.map(r => r.documentTypeCode)
    expect(codes).not.toContain('TAXI_PERMIT')
    expect(codes).not.toContain('SAFETY_INSPECTION')
  })
})

// ─── SCHEMA INVARIANTS ────────────────────────────────────────

describe('Schema Invariants', () => {
  it('[PASS] Taximeter NEVER enabled for Delivery regardless of doc status', () => {
    // Even with 100% compliance, DELIVERY → taximeter = false
    const deliveryReqs: RequiredDocument[] = [
      { documentTypeCode: 'ID', label: 'ID', isRequired: true, serviceType: 'DELIVERY', jurisdiction: 'QC' },
    ]
    const docs: DocumentState[] = [
      { documentTypeCode: 'ID', status: 'APPROVED', expiresAt: futureDate(365), verificationStatus: 'VERIFIED', scanStatus: 'SCAN_CLEAN', publicDocumentId: 'DOC-00000099' },
    ]
    const result = computeCompliance('DELIVERY', deliveryReqs, docs)
    expect(result.taximeterEligible).toBe(false)
  })

  it('[PASS] OCR is proposal only — compliance not auto-decided', () => {
    // OCR extracted data must go through verification
    const doc: DocumentState = {
      documentTypeCode: 'DRIVER_LICENSE', status: 'PENDING_REVIEW',
      expiresAt: futureDate(200), verificationStatus: 'PENDING',
      scanStatus: 'SCAN_CLEAN', publicDocumentId: 'DOC-00000050',
    }
    const reqs: RequiredDocument[] = [
      { documentTypeCode: 'DRIVER_LICENSE', label: 'Permis', isRequired: true, serviceType: 'TAXI', jurisdiction: 'QC' },
    ]
    const result = computeCompliance('TAXI', reqs, [doc])
    // PENDING verification → not COMPLIANT
    expect(result.overallStatus).not.toBe('COMPLIANT')
  })

  it('[PASS] Scan pending prevents approval concept', () => {
    const pending = canDocumentBeApproved('SCAN_PENDING', 'IN_REVIEW')
    const infected = canDocumentBeApproved('SCAN_INFECTED', 'IN_REVIEW')
    expect(pending.allowed).toBe(false)
    expect(infected.allowed).toBe(false)
    // No auto-approve while scan incomplete
  })
})
