// ============================================================
// TAXIMÈTRE.GOV — DOCUMENT CENTER ENGINE
// Phase 2 — Step 20: Document Center, Receipts & Justificatifs
// ============================================================
//
// RÈGLES ABSOLUES:
// 1. Documents stockés dans Secure Storage — jamais en base de données
// 2. Accès via URLs temporaires signées — jamais URLs publiques permanentes
// 3. VERIFIED ≠ automatique — validation humaine requise
// 4. Driver A ne peut jamais accéder aux documents de Driver B
// 5. OCR = proposition uniquement — chauffeur doit confirmer
// 6. Legal Hold bloque toute suppression
// 7. Remplacement conserve l'ancienne version (DocumentVersion)
// ============================================================

// ─── TYPES ───────────────────────────────────────────────────

export type DocCategory =
  | 'DRIVER' | 'VEHICLE' | 'TAXI' | 'RIDESHARE'
  | 'DELIVERY' | 'TAX' | 'EXPENSE' | 'RECEIPT'
  | 'INSURANCE' | 'LICENSE' | 'OTHER'

export type DocType =
  | 'DRIVER_LICENSE' | 'TAXI_PERMIT' | 'TAXI_LICENSE'
  | 'VEHICLE_REGISTRATION' | 'VEHICLE_INSURANCE'
  | 'INSPECTION_CERTIFICATE' | 'COMMERCIAL_INSURANCE'
  | 'PROVIDER_STATEMENT' | 'REVENUE_STATEMENT'
  | 'TAX_REGISTRATION' | 'TAX_REPORT' | 'TAX_NOTICE'
  | 'RECEIPT' | 'INVOICE' | 'FUEL_RECEIPT'
  | 'MAINTENANCE_RECEIPT' | 'PARKING_RECEIPT'
  | 'TOLL_RECEIPT' | 'PHOTO_ID' | 'OTHER'

export type DocStatus =
  | 'UPLOADED' | 'PROCESSING' | 'VERIFIED' | 'REJECTED'
  | 'EXPIRED' | 'EXPIRING_SOON' | 'REVIEW_REQUIRED' | 'ARCHIVED'

export type OcrStatus = 'NOT_PROCESSED' | 'PROCESSING' | 'REVIEW_REQUIRED' | 'CONFIRMED' | 'FAILED'
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED'
export type ComplianceStatus = 'COMPLIANT' | 'INCOMPLETE' | 'EXPIRED' | 'PENDING_REVIEW' | 'NOT_APPLICABLE' | 'UNKNOWN'
export type RetentionPolicY = 'STANDARD' | 'FISCAL_7Y' | 'AUDIT_10Y' | 'LEGAL_HOLD' | 'CUSTOM'

// ─── DOCUMENT MODEL ───────────────────────────────────────────

export interface DriverDocument {
  id: string
  driverId: string
  documentType: DocType
  category: DocCategory
  fileName: string
  mimeType: string
  fileSizeKb: number
  // Storage reference — actual file in Secure Storage, never in DB
  // storageReference: encrypted server-side — not exposed to frontend
  storageReferenceMasked: string   // e.g. "sec://vault/drv-xxxx/doc-yyyy"
  fileHash: string                 // SHA-256 for integrity + duplicate detection
  documentDate: string | null
  expirationDate: string | null
  issuer: string | null
  referenceNumber: string | null   // Masked if sensitive
  status: DocStatus
  verificationStatus: VerificationStatus
  ocrStatus: OcrStatus
  uploadedAt: string
  updatedAt: string
  verifiedAt: string | null
  verifiedBy: string | null        // Government user ID — never exposed to driver
  // Links
  linkedVehicleId: string | null
  linkedTransactionId: string | null
  linkedTaxPeriod: string | null
  linkedProvider: string | null
  // Retention
  retentionPolicy: RetentionPolicY
  legalHold: boolean
  version: number
  isCurrentVersion: boolean
  notes: string | null
}

// ─── DOCUMENT VERSION ─────────────────────────────────────────

export interface DocumentVersion {
  versionId: string
  documentId: string             // Original document ID
  version: number
  fileName: string
  uploadedAt: string
  status: DocStatus
  replacedAt: string | null
  replacedReason: string | null
}

// ─── RECEIPT MODEL ────────────────────────────────────────────

export interface Receipt {
  id: string
  driverId: string
  documentId: string            // Links to DriverDocument
  supplier: string | null
  receiptNumber: string | null
  receiptDate: string | null
  subtotal: number | null
  gstAmount: number | null
  qstAmount: number | null
  totalAmount: number | null
  currency: 'CAD' | 'USD' | 'OTHER'
  category: DocCategory
  paymentMethod: 'CARD' | 'CASH' | 'INTERAC' | 'APP' | 'UNKNOWN'
  ocrStatus: OcrStatus
  ocrConfidence: 'HIGH' | 'MEDIUM' | 'LOW' | null  // OCR = proposal only
  verificationStatus: VerificationStatus
  linkedExpenseId: string | null
  linkedTransactionId: string | null
  createdAt: string
}

// ─── OCR RESULT (always a proposal — driver must confirm) ─────

export interface OcrResult {
  documentId: string
  status: OcrStatus
  isProposal: true             // ALWAYS true — OCR never final authority
  proposedData: {
    supplier?: string
    date?: string
    amount?: number
    gst?: number
    qst?: number
    referenceNumber?: string
    issuer?: string
  }
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  needsReview: boolean
  extractedAt: string
  note: string                 // Always includes disclaimer
}

// ─── DOCUMENT AUDIT EVENT ─────────────────────────────────────

export interface DocumentAuditEvent {
  auditId: string
  documentId: string
  driverId: string
  action: 'UPLOADED' | 'VIEWED' | 'DOWNLOADED' | 'UPDATED' | 'REPLACED'
    | 'VERIFIED' | 'REJECTED' | 'ARCHIVED' | 'EXPIRED' | 'OCR_STARTED'
    | 'OCR_CONFIRMED' | 'EXPORT_REQUESTED' | 'LEGAL_HOLD_APPLIED'
  actor: string            // driver_id or government_user_id
  actorRole: 'DRIVER' | 'ADMIN' | 'REVIEWER' | 'SYSTEM'
  timestamp: string
  details: string | null
  ipHashMasked: string | null
}

// ─── REQUIRED DOCUMENT RULE ───────────────────────────────────

export interface RequiredDocumentRule {
  ruleId: string
  jurisdiction: string
  activityType: string
  documentType: DocType
  mandatory: boolean
  description: string
  sourceReference: string       // Official regulation source
}

// Configured rules — not invented — from official regulations
export const REQUIRED_DOCUMENT_RULES: RequiredDocumentRule[] = [
  { ruleId:'RDR-001', jurisdiction:'CA-QC', activityType:'TAXI', documentType:'DRIVER_LICENSE', mandatory:true, description:'Permis de conduire valide (classe 4C)', sourceReference:'Code de la sécurité routière (QC)' },
  { ruleId:'RDR-002', jurisdiction:'CA-QC', activityType:'TAXI', documentType:'TAXI_PERMIT', mandatory:true, description:'Permis de taxi valide', sourceReference:'Loi concernant les services de transport par taxi (QC)' },
  { ruleId:'RDR-003', jurisdiction:'CA-QC', activityType:'TAXI', documentType:'VEHICLE_INSURANCE', mandatory:true, description:'Assurance automobile valide', sourceReference:'Code de la sécurité routière (QC)' },
  { ruleId:'RDR-004', jurisdiction:'CA-QC', activityType:'TAXI', documentType:'INSPECTION_CERTIFICATE', mandatory:true, description:'Certificat d\'inspection véhicule', sourceReference:'SAAQ — Règlement sur les véhicules automobiles' },
  { ruleId:'RDR-005', jurisdiction:'CA-QC', activityType:'RIDESHARE', documentType:'DRIVER_LICENSE', mandatory:true, description:'Permis de conduire valide', sourceReference:'Code de la sécurité routière (QC)' },
  { ruleId:'RDR-006', jurisdiction:'CA-QC', activityType:'RIDESHARE', documentType:'VEHICLE_INSURANCE', mandatory:true, description:'Assurance commerciale ou rideshare', sourceReference:'Code de la sécurité routière (QC)' },
]

// ─── STORAGE STRUCTURE (logical organization) ─────────────────
// Not exposed to driver — internal only

export const STORAGE_STRUCTURE = {
  DRIVER: ['IDENTITY', 'LICENSE'],
  VEHICLE: ['REGISTRATION', 'INSURANCE', 'INSPECTION'],
  TAXI: ['TAXI_PERMIT', 'TAXI_LICENSE', 'METER'],
  UBER: ['STATEMENTS', 'AGREEMENTS'],
  LYFT: ['STATEMENTS'],
  DELIVERY: ['STATEMENTS'],
  TAX: ['REGISTRATIONS', 'REPORTS', 'NOTICES'],
  EXPENSES: ['RECEIPTS', 'INVOICES', 'FUEL', 'MAINTENANCE'],
}

// ─── MOCK DATA ────────────────────────────────────────────────

export const mockDocuments: DriverDocument[] = [
  {
    id: 'DOC-001', driverId: 'DR-00001234', documentType: 'DRIVER_LICENSE', category: 'LICENSE',
    fileName: 'permis-conduire-2027.pdf', mimeType: 'application/pdf', fileSizeKb: 245,
    storageReferenceMasked: 'sec://vault/drv-1234/doc-001', fileHash: 'sha256:a1b2c3d4e5...',
    documentDate: '2023-09-01', expirationDate: '2027-09-01', issuer: 'SAAQ — Québec',
    referenceNumber: 'Q-••••567', status: 'VERIFIED', verificationStatus: 'VERIFIED',
    ocrStatus: 'CONFIRMED', uploadedAt: '2024-03-15T10:00:00Z', updatedAt: '2024-03-15T10:30:00Z',
    verifiedAt: '2024-03-16T09:00:00Z', verifiedBy: 'GOV-REVIEWER-001',
    linkedVehicleId: null, linkedTransactionId: null, linkedTaxPeriod: null, linkedProvider: null,
    retentionPolicy: 'AUDIT_10Y', legalHold: false, version: 1, isCurrentVersion: true, notes: null,
  },
  {
    id: 'DOC-002', driverId: 'DR-00001234', documentType: 'VEHICLE_INSURANCE', category: 'INSURANCE',
    fileName: 'assurance-2027.pdf', mimeType: 'application/pdf', fileSizeKb: 312,
    storageReferenceMasked: 'sec://vault/drv-1234/doc-002', fileHash: 'sha256:b2c3d4e5f6...',
    documentDate: '2026-03-15', expirationDate: '2027-03-15', issuer: 'Intact Assurance',
    referenceNumber: 'INS-••••123', status: 'VERIFIED', verificationStatus: 'VERIFIED',
    ocrStatus: 'CONFIRMED', uploadedAt: '2026-03-20T09:00:00Z', updatedAt: '2026-03-20T09:30:00Z',
    verifiedAt: '2026-03-21T10:00:00Z', verifiedBy: 'GOV-REVIEWER-001',
    linkedVehicleId: 'V-QC-001234', linkedTransactionId: null, linkedTaxPeriod: null, linkedProvider: null,
    retentionPolicy: 'STANDARD', legalHold: false, version: 2, isCurrentVersion: true, notes: null,
  },
  {
    id: 'DOC-003', driverId: 'DR-00001234', documentType: 'INSPECTION_CERTIFICATE', category: 'VEHICLE',
    fileName: 'inspection-2026.pdf', mimeType: 'application/pdf', fileSizeKb: 180,
    storageReferenceMasked: 'sec://vault/drv-1234/doc-003', fileHash: 'sha256:c3d4e5f6g7...',
    documentDate: '2025-12-15', expirationDate: '2026-12-15', issuer: 'SAAQ',
    referenceNumber: 'INSP-••••789', status: 'EXPIRING_SOON', verificationStatus: 'VERIFIED',
    ocrStatus: 'CONFIRMED', uploadedAt: '2025-12-15T14:00:00Z', updatedAt: '2025-12-15T14:30:00Z',
    verifiedAt: '2025-12-16T10:00:00Z', verifiedBy: 'GOV-REVIEWER-001',
    linkedVehicleId: 'V-QC-001234', linkedTransactionId: null, linkedTaxPeriod: null, linkedProvider: null,
    retentionPolicy: 'STANDARD', legalHold: false, version: 1, isCurrentVersion: true,
    notes: 'Expire le 15 décembre 2026 — renouvellement requis',
  },
  {
    id: 'DOC-004', driverId: 'DR-00001234', documentType: 'TAXI_PERMIT', category: 'TAXI',
    fileName: 'permis-taxi-2026.pdf', mimeType: 'application/pdf', fileSizeKb: 95,
    storageReferenceMasked: 'sec://vault/drv-1234/doc-004', fileHash: 'sha256:d4e5f6g7h8...',
    documentDate: '2026-01-01', expirationDate: '2026-12-31', issuer: 'MTQ — Québec',
    referenceNumber: 'TAXI-QC-••••001', status: 'VERIFIED', verificationStatus: 'VERIFIED',
    ocrStatus: 'CONFIRMED', uploadedAt: '2025-12-20T10:00:00Z', updatedAt: '2025-12-20T10:30:00Z',
    verifiedAt: '2025-12-22T09:00:00Z', verifiedBy: 'GOV-REVIEWER-001',
    linkedVehicleId: 'V-QC-001234', linkedTransactionId: null, linkedTaxPeriod: null, linkedProvider: 'taxi',
    retentionPolicy: 'AUDIT_10Y', legalHold: false, version: 1, isCurrentVersion: true, notes: null,
  },
  {
    id: 'DOC-005', driverId: 'DR-00001234', documentType: 'FUEL_RECEIPT', category: 'RECEIPT',
    fileName: 'receipt-shell-2026-08-24.jpg', mimeType: 'image/jpeg', fileSizeKb: 420,
    storageReferenceMasked: 'sec://vault/drv-1234/doc-005', fileHash: 'sha256:e5f6g7h8i9...',
    documentDate: '2026-08-24', expirationDate: null, issuer: 'Shell Canada',
    referenceNumber: 'RCP-••••2024', status: 'UPLOADED', verificationStatus: 'UNVERIFIED',
    ocrStatus: 'REVIEW_REQUIRED', uploadedAt: '2026-08-24T16:00:00Z', updatedAt: '2026-08-24T16:05:00Z',
    verifiedAt: null, verifiedBy: null,
    linkedVehicleId: 'V-QC-001234', linkedTransactionId: null, linkedTaxPeriod: 'T3-2026', linkedProvider: null,
    retentionPolicy: 'FISCAL_7Y', legalHold: false, version: 1, isCurrentVersion: true, notes: 'OCR en attente de confirmation',
  },
  {
    id: 'DOC-006', driverId: 'DR-00001234', documentType: 'PROVIDER_STATEMENT', category: 'RIDESHARE',
    fileName: 'uber-statement-aout-2026.pdf', mimeType: 'application/pdf', fileSizeKb: 380,
    storageReferenceMasked: 'sec://vault/drv-1234/doc-006', fileHash: 'sha256:f6g7h8i9j0...',
    documentDate: '2026-08-01', expirationDate: null, issuer: 'Uber Canada',
    referenceNumber: 'UBER-STMT-••••001', status: 'VERIFIED', verificationStatus: 'VERIFIED',
    ocrStatus: 'CONFIRMED', uploadedAt: '2026-08-01T12:00:00Z', updatedAt: '2026-08-01T12:30:00Z',
    verifiedAt: '2026-08-02T09:00:00Z', verifiedBy: 'SYSTEM',
    linkedVehicleId: null, linkedTransactionId: null, linkedTaxPeriod: 'T3-2026', linkedProvider: 'uber',
    retentionPolicy: 'FISCAL_7Y', legalHold: false, version: 1, isCurrentVersion: true, notes: null,
  },
  {
    id: 'DOC-007', driverId: 'DR-00001234', documentType: 'PHOTO_ID', category: 'DRIVER',
    fileName: 'photo-identite.jpg', mimeType: 'image/jpeg', fileSizeKb: 580,
    storageReferenceMasked: 'sec://vault/drv-1234/doc-007', fileHash: 'sha256:g7h8i9j0k1...',
    documentDate: '2024-03-15', expirationDate: '2029-03-15', issuer: 'Gouvernement du Canada',
    referenceNumber: null, status: 'VERIFIED', verificationStatus: 'VERIFIED',
    ocrStatus: 'NOT_PROCESSED', uploadedAt: '2024-03-15T10:00:00Z', updatedAt: '2024-03-15T10:30:00Z',
    verifiedAt: '2024-03-16T09:00:00Z', verifiedBy: 'GOV-REVIEWER-001',
    linkedVehicleId: null, linkedTransactionId: null, linkedTaxPeriod: null, linkedProvider: null,
    retentionPolicy: 'AUDIT_10Y', legalHold: false, version: 1, isCurrentVersion: true, notes: null,
  },
]

export const mockReceipts: Receipt[] = [
  {
    id: 'RCP-001', driverId: 'DR-00001234', documentId: 'DOC-005',
    supplier: 'Shell Canada', receiptNumber: 'RCP-2024-8241', receiptDate: '2026-08-24',
    subtotal: 68.14, gstAmount: 3.41, qstAmount: 6.79, totalAmount: 78.34, currency: 'CAD',
    category: 'EXPENSE', paymentMethod: 'CARD',
    ocrStatus: 'REVIEW_REQUIRED', ocrConfidence: 'HIGH',
    verificationStatus: 'UNVERIFIED', linkedExpenseId: null, linkedTransactionId: null,
    createdAt: '2026-08-24T16:05:00Z',
  },
]

export const mockOcrResult: OcrResult = {
  documentId: 'DOC-005',
  status: 'REVIEW_REQUIRED',
  isProposal: true,
  proposedData: {
    supplier: 'Shell Canada',
    date: '2026-08-24',
    amount: 78.34,
    gst: 3.41,
    qst: 6.79,
    referenceNumber: 'RCP-2024-8241',
  },
  confidence: 'HIGH',
  needsReview: true,
  extractedAt: '2026-08-24T16:05:30Z',
  note: 'PROPOSITION OCR uniquement — le chauffeur doit confirmer les données avant validation.',
}

export const mockDocumentVersions: DocumentVersion[] = [
  { versionId:'DV-001', documentId:'DOC-002', version:1, fileName:'assurance-2026.pdf', uploadedAt:'2025-03-20T09:00:00Z', status:'ARCHIVED', replacedAt:'2026-03-20T09:00:00Z', replacedReason:'Renouvellement annuel' },
  { versionId:'DV-002', documentId:'DOC-002', version:2, fileName:'assurance-2027.pdf', uploadedAt:'2026-03-20T09:00:00Z', status:'VERIFIED', replacedAt:null, replacedReason:null },
]

export const mockDocumentAudit: DocumentAuditEvent[] = [
  { auditId:'DA-001', documentId:'DOC-001', driverId:'DR-00001234', action:'UPLOADED', actor:'DR-00001234', actorRole:'DRIVER', timestamp:'2024-03-15T10:00:00Z', details:'Upload initial', ipHashMasked:'sha256:ip***' },
  { auditId:'DA-002', documentId:'DOC-001', driverId:'DR-00001234', action:'VERIFIED', actor:'GOV-REVIEWER-001', actorRole:'REVIEWER', timestamp:'2024-03-16T09:00:00Z', details:'Document validé par réviseur autorisé', ipHashMasked:'sha256:ip***' },
  { auditId:'DA-003', documentId:'DOC-002', driverId:'DR-00001234', action:'REPLACED', actor:'DR-00001234', actorRole:'DRIVER', timestamp:'2026-03-20T09:00:00Z', details:'Remplacement renouvellement assurance — version 1 archivée', ipHashMasked:'sha256:ip***' },
  { auditId:'DA-004', documentId:'DOC-005', driverId:'DR-00001234', action:'UPLOADED', actor:'DR-00001234', actorRole:'DRIVER', timestamp:'2026-08-24T16:00:00Z', details:'Reçu carburant Shell — OCR lancé', ipHashMasked:'sha256:ip***' },
  { auditId:'DA-005', documentId:'DOC-005', driverId:'DR-00001234', action:'OCR_STARTED', actor:'SYSTEM', actorRole:'SYSTEM', timestamp:'2026-08-24T16:00:30Z', details:'OCR en cours — résultat = PROPOSITION uniquement', ipHashMasked:null },
]

// ─── EXPIRATION ENGINE ────────────────────────────────────────

export function computeDocStatus(doc: DriverDocument, today = new Date()): DocStatus {
  if (!doc.expirationDate) return doc.status
  const exp = new Date(doc.expirationDate)
  const daysLeft = Math.floor((exp.getTime() - today.getTime()) / 86400000)
  if (daysLeft < 0) return 'EXPIRED'
  if (daysLeft <= 30) return 'EXPIRING_SOON'
  return doc.status === 'EXPIRED' || doc.status === 'EXPIRING_SOON' ? 'VERIFIED' : doc.status
}

export function daysUntilExpiry(expirationDate: string | null): number | null {
  if (!expirationDate) return null
  return Math.floor((new Date(expirationDate).getTime() - Date.now()) / 86400000)
}

// ─── STATUS CONFIG ─────────────────────────────────────────────

export const DOC_STATUS_CONFIG: Record<DocStatus, { color: string; bg: string; icon: string; label: string }> = {
  VERIFIED:      { color:'text-green-400', bg:'border-green-500/20 bg-green-500/5', icon:'✅', label:'Vérifié' },
  UPLOADED:      { color:'text-blue-400', bg:'border-blue-500/20 bg-blue-500/5', icon:'📤', label:'Téléchargé' },
  PROCESSING:    { color:'text-blue-400', bg:'border-blue-500/20 bg-blue-500/5', icon:'⏳', label:'Traitement' },
  EXPIRING_SOON: { color:'text-amber-400', bg:'border-amber-500/20 bg-amber-500/5', icon:'⚠️', label:'Expire bientôt' },
  EXPIRED:       { color:'text-red-400', bg:'border-red-500/20 bg-red-500/5', icon:'❌', label:'Expiré' },
  REJECTED:      { color:'text-red-400', bg:'border-red-500/20 bg-red-500/5', icon:'🚫', label:'Rejeté' },
  REVIEW_REQUIRED:{ color:'text-orange-400', bg:'border-orange-500/20 bg-orange-500/5', icon:'🔍', label:'Révision' },
  ARCHIVED:      { color:'text-slate-400', bg:'border-slate-700 bg-slate-800', icon:'📦', label:'Archivé' },
}

export const DOC_CATEGORY_ICONS: Record<DocCategory, string> = {
  DRIVER:'🪪', VEHICLE:'🚗', TAXI:'🚕', RIDESHARE:'🚗', DELIVERY:'📦',
  TAX:'📊', EXPENSE:'💳', RECEIPT:'🧾', INSURANCE:'🛡️', LICENSE:'📋', OTHER:'📄',
}

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  DRIVER_LICENSE:'Permis de conduire', TAXI_PERMIT:'Permis taxi', TAXI_LICENSE:'Licence taxi',
  VEHICLE_REGISTRATION:'Immatriculation', VEHICLE_INSURANCE:'Assurance automobile',
  INSPECTION_CERTIFICATE:'Inspection véhicule', COMMERCIAL_INSURANCE:'Assurance commerciale',
  PROVIDER_STATEMENT:'Relevé fournisseur', REVENUE_STATEMENT:'Relevé de revenus',
  TAX_REGISTRATION:'Attestation fiscale', TAX_REPORT:'Rapport fiscal', TAX_NOTICE:'Avis fiscal',
  RECEIPT:'Reçu', INVOICE:'Facture', FUEL_RECEIPT:'Reçu carburant',
  MAINTENANCE_RECEIPT:'Reçu entretien', PARKING_RECEIPT:'Reçu stationnement',
  TOLL_RECEIPT:'Reçu péage', PHOTO_ID:'Photo identité', OTHER:'Autre',
}
