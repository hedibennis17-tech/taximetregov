// ============================================================
// TAXIMÈTRE.GOV — COMPLIANCE ENGINE
// Phase 2 — Step 25: Driver Identity · License · Vehicle · Compliance
// ============================================================
//
// RÈGLES ABSOLUES:
// 1. VERIFIED = uniquement après vérification réelle (PENDING si aucune API)
// 2. NAS/SIN jamais clé primaire · jamais affiché (***-***-XXX)
// 3. OAuth only pour providers — jamais demander mot de passe
// 4. Service compliance séparé — 1 service expiré ≠ tous bloqués
// 5. Documents: nouvelle version ne supprime pas l'ancienne
// 6. TAXI autorisé ≠ DELIVERY autorisé (règles indépendantes)
// 7. Taximeter DELIVERY = toujours OFF (non contournable)
// ============================================================

// ─── TYPES ───────────────────────────────────────────────────

export type DriverStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'BLOCKED' | 'DEACTIVATED'
export type VerificationStatus = 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'FAILED' | 'EXPIRED' | 'MANUAL_REVIEW'
export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED' | 'EXPIRING_SOON' | 'REVIEW_REQUIRED'
export type VehicleStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REJECTED' | 'DEACTIVATED'
export type ServiceAuthStatus = 'AUTHORIZED' | 'PENDING' | 'BLOCKED' | 'SUSPENDED' | 'NOT_APPLICABLE'
export type ComplianceResult = 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT' | 'REVIEW_REQUIRED'
export type ServiceMode = 'TAXI' | 'RIDESHARE' | 'DELIVERY' | 'PERSONAL'

// ─── DRIVER PROFILE ───────────────────────────────────────────

export interface DriverProfile {
  driverId: string
  firstName: string
  lastName: string
  preferredName: string | null
  phone: string          // masked in display
  email: string
  province: string
  country: string
  language: 'fr' | 'en'
  status: DriverStatus
  profilePhotoUrl: string | null
  createdAt: string
  updatedAt: string
}

// ─── GOVERNMENT IDENTIFIER ────────────────────────────────────

export interface DriverGovernmentIdentifier {
  id: string
  driverId: string
  identifierType: 'DRIVER_LICENSE' | 'TAXI_PERMIT' | 'BUSINESS_NUMBER' | 'TAX_ACCOUNT' | 'OTHER'
  // Reference only — actual value encrypted server-side, NEVER in frontend
  identifierReference: string   // e.g. "M••••••1234" (masked)
  jurisdiction: string
  verificationStatus: VerificationStatus
  verifiedAt: string | null
  source: 'OFFICIAL_API' | 'DOCUMENT_REVIEW' | 'AUTHORIZED_PROVIDER' | 'MANUAL_REVIEW'
  createdAt: string
}

// ─── IDENTITY VERIFICATION ────────────────────────────────────

export interface IdentityVerification {
  id: string
  driverId: string
  status: VerificationStatus
  method: 'OFFICIAL_API' | 'DOCUMENT_REVIEW' | 'AUTHORIZED_PROVIDER' | 'MANUAL_REVIEW'
  verifiedAt: string | null
  expiresAt: string | null
  // VERIFIED only after real verification — PENDING if no official API available
  note: string | null
}

// ─── DRIVER LICENSE ───────────────────────────────────────────

export interface DriverLicense {
  id: string
  driverId: string
  licenseType: 'CLASS_5' | 'CLASS_4' | 'CLASS_3' | 'OTHER'
  jurisdiction: string
  licenseReference: string      // Masked: M••••••1234
  issueDate: string
  expiryDate: string
  status: 'VALID' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED'
  restrictions: string[]
  verificationStatus: VerificationStatus
  // Expiry alerts: 90/60/30/7 days configurable
  daysUntilExpiry: number
}

// ─── TAXI PERMIT ──────────────────────────────────────────────

export interface TaxiPermit {
  id: string
  driverId: string
  permitNumberReference: string  // Masked: TP-••••••78
  jurisdiction: string
  status: 'VALID' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED' | 'PENDING'
  issueDate: string
  expiryDate: string
  vehicleRequirement: string | null
  verificationStatus: VerificationStatus
  daysUntilExpiry: number
}

// ─── SERVICE AUTHORIZATION ────────────────────────────────────

export interface ServiceAuthorization {
  id: string
  driverId: string
  serviceType: ServiceMode
  jurisdiction: string
  status: ServiceAuthStatus
  validFrom: string
  validUntil: string | null
  source: 'GOVERNMENT' | 'PROVIDER' | 'SELF_DECLARED' | 'MANUAL'
  restrictionReason: string | null
  // Each service has INDEPENDENT authorization — never share a single boolean
}

// ─── VEHICLE ──────────────────────────────────────────────────

export interface Vehicle {
  vehicleId: string
  driverId: string
  make: string
  model: string
  year: number
  color: string
  licensePlateReference: string   // Masked for display
  vinReference: string | null     // Encrypted server-side, never exposed
  vehicleType: 'SEDAN' | 'SUV' | 'VAN' | 'HYBRID' | 'ELECTRIC' | 'OTHER'
  status: VehicleStatus
  isActive: boolean               // Only 1 active per session
  createdAt: string
}

export interface VehicleServiceAuthorization {
  vehicleId: string
  driverId: string
  taxi: ServiceAuthStatus
  rideshare: ServiceAuthStatus
  delivery: ServiceAuthStatus
  personal: ServiceAuthStatus
}

// ─── INSURANCE ────────────────────────────────────────────────

export interface InsuranceDocument {
  id: string
  vehicleId: string
  provider: string
  policyReference: string         // Masked: POL-••••••89
  effectiveDate: string
  expiryDate: string
  status: 'VALID' | 'EXPIRED' | 'CANCELLED' | 'PENDING'
  verificationStatus: VerificationStatus
  isCommercial: boolean           // Commercial insurance required for taxi
  daysUntilExpiry: number
}

// ─── DRIVER COMPLIANCE DOCUMENT ───────────────────────────────

export interface DriverComplianceDoc {
  id: string
  driverId: string
  vehicleId: string | null
  docType: 'LICENSE' | 'IDENTITY' | 'TAXI_PERMIT' | 'INSURANCE' | 'INSPECTION' | 'REGISTRATION' | 'CERTIFICATE' | 'OTHER'
  label: string
  status: DocumentStatus
  version: number                 // New version never deletes old version
  uploadedAt: string
  verifiedAt: string | null
  expiryDate: string | null
  daysUntilExpiry: number | null
  storageReferenceMasked: string  // Signed temp URL only — never public permanent URL
}

// ─── SERVICE COMPLIANCE CHECK ─────────────────────────────────

export interface ServiceComplianceCheck {
  service: ServiceMode
  result: 'PASS' | 'BLOCK' | 'WARNING'
  taximeterEnabled: boolean       // DELIVERY = always false
  blockers: string[]
  warnings: string[]
  checks: {
    identity: boolean
    license: boolean
    permit: boolean
    vehicle: boolean
    insurance: boolean
    documents: boolean
    providerConnection: boolean
  }
}

// ─── COMPLIANCE SNAPSHOT ──────────────────────────────────────

export interface ComplianceSnapshot {
  snapshotId: string
  driverId: string
  timestamp: string
  overallStatus: 'ALL_CLEAR' | 'PARTIAL' | 'NONE'
  taxi: ServiceComplianceCheck
  rideshare: ServiceComplianceCheck
  delivery: ServiceComplianceCheck
  // Snapshot preserved for audit — never silently modified
}

// ─── PROVIDER DRIVER IDENTITY ─────────────────────────────────

export interface ProviderDriverIdentity {
  driverId: string
  provider: 'uber' | 'lyft' | 'doordash' | 'instacart' | 'uber_eats' | 'skip'
  providerAccountId: string       // Masked
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'PENDING' | 'EXPIRED' | 'REAUTH_REQUIRED' | 'ERROR'
  connectedAt: string | null
  // OAuth only — password NEVER stored
  scopes: string[]
  lastSyncAt: string | null
}

// ─── ACTIVE DRIVING SESSION ───────────────────────────────────

export interface ActiveDrivingSession {
  sessionId: string
  driverId: string
  deviceId: string
  vehicleId: string
  serviceMode: ServiceMode
  complianceSnapshotId: string
  startedAt: string
  status: 'ACTIVE' | 'ENDED' | 'INTERRUPTED'
}

// ─── COMPLIANCE AUDIT EVENT ───────────────────────────────────

export interface ComplianceAuditEvent {
  auditId: string
  driverId: string
  action: 'IDENTITY_VERIFIED' | 'LICENSE_VERIFIED' | 'DOCUMENT_UPLOADED'
    | 'DOCUMENT_VERIFIED' | 'DOCUMENT_REJECTED' | 'VEHICLE_VERIFIED'
    | 'SERVICE_AUTHORIZED' | 'SERVICE_BLOCKED' | 'DRIVER_SUSPENDED' | 'DRIVER_REACTIVATED'
  actor: string
  actorRole: 'DRIVER' | 'SYSTEM' | 'REVIEWER' | 'ADMIN'
  details: string | null
  timestamp: string
}

// ─── COMPLIANCE ENGINE ────────────────────────────────────────

export function runComplianceCheck(
  profile: DriverProfile,
  identity: IdentityVerification,
  license: DriverLicense,
  permit: TaxiPermit | null,
  vehicle: Vehicle | null,
  insurance: InsuranceDocument | null,
  docs: DriverComplianceDoc[],
  providers: ProviderDriverIdentity[]
): ComplianceSnapshot {
  const now = new Date().toISOString()

  // TAXI check
  const taxiIdentityOk = identity.status === 'VERIFIED'
  const taxiLicenseOk = license.status === 'VALID' && license.verificationStatus === 'VERIFIED'
  const taxiPermitOk = permit !== null && permit.status === 'VALID'
  const taxiVehicleOk = vehicle !== null && vehicle.status === 'ACTIVE'
  const taxiInsuranceOk = insurance !== null && insurance.status === 'VALID' && insurance.isCommercial
  const taxiDocsOk = docs.filter(d => d.status === 'EXPIRED' || d.status === 'REJECTED').length === 0
  const taxiDocWarning = docs.filter(d => d.status === 'EXPIRING_SOON').length > 0

  const taxiBlockers: string[] = []
  const taxiWarnings: string[] = []
  if (!taxiIdentityOk) taxiBlockers.push('Identité non vérifiée')
  if (!taxiLicenseOk) taxiBlockers.push('Permis de conduire invalide ou expiré')
  if (!taxiPermitOk) taxiBlockers.push('Permis taxi invalide ou absent')
  if (!taxiVehicleOk) taxiBlockers.push('Véhicule non actif')
  if (!taxiInsuranceOk) taxiBlockers.push('Assurance commerciale invalide ou absente')
  if (!taxiDocsOk) taxiBlockers.push('Document(s) expiré(s) ou rejeté(s)')
  if (taxiDocWarning) taxiWarnings.push('Document(s) expirant bientôt — renouvellement requis')

  const taxi: ServiceComplianceCheck = {
    service: 'TAXI', taximeterEnabled: true,
    result: taxiBlockers.length > 0 ? 'BLOCK' : taxiDocWarning ? 'WARNING' : 'PASS',
    blockers: taxiBlockers, warnings: taxiWarnings,
    checks: {
      identity: taxiIdentityOk, license: taxiLicenseOk, permit: taxiPermitOk,
      vehicle: taxiVehicleOk, insurance: taxiInsuranceOk,
      documents: taxiDocsOk, providerConnection: true,
    },
  }

  // RIDESHARE check
  const uberConn = providers.find(p => p.provider === 'uber')
  const lyftConn = providers.find(p => p.provider === 'lyft')
  const rideshareProviderOk = (uberConn?.connectionStatus === 'CONNECTED') || (lyftConn?.connectionStatus === 'CONNECTED')
  const rideshareBlockers: string[] = []
  const rideshareWarnings: string[] = []
  if (!taxiIdentityOk) rideshareBlockers.push('Identité non vérifiée')
  if (!rideshareProviderOk) rideshareBlockers.push('Aucun fournisseur rideshare connecté (Uber/Lyft)')
  if (uberConn?.connectionStatus === 'REAUTH_REQUIRED') rideshareWarnings.push('Uber: réauthentification requise')
  if (lyftConn?.connectionStatus === 'REAUTH_REQUIRED') rideshareWarnings.push('Lyft: réauthentification requise')

  const rideshare: ServiceComplianceCheck = {
    service: 'RIDESHARE', taximeterEnabled: false,
    result: rideshareBlockers.length > 0 ? 'BLOCK' : rideshareWarnings.length > 0 ? 'WARNING' : 'PASS',
    blockers: rideshareBlockers, warnings: rideshareWarnings,
    checks: {
      identity: taxiIdentityOk, license: taxiLicenseOk, permit: true,
      vehicle: taxiVehicleOk, insurance: true,
      documents: true, providerConnection: rideshareProviderOk,
    },
  }

  // DELIVERY check — TAXIMETER ALWAYS OFF
  const ddConn = providers.find(p => p.provider === 'doordash')
  const deliveryProviderOk = ddConn?.connectionStatus === 'CONNECTED' || false
  const deliveryBlockers: string[] = []
  if (!taxiIdentityOk) deliveryBlockers.push('Identité non vérifiée')
  if (!deliveryProviderOk) deliveryBlockers.push('Aucun fournisseur livraison connecté')

  const delivery: ServiceComplianceCheck = {
    service: 'DELIVERY', taximeterEnabled: false,  // ALWAYS false — non contournable
    result: deliveryBlockers.length > 0 ? 'BLOCK' : 'PASS',
    blockers: deliveryBlockers, warnings: [],
    checks: {
      identity: taxiIdentityOk, license: true, permit: true,
      vehicle: taxiVehicleOk, insurance: true,
      documents: true, providerConnection: deliveryProviderOk,
    },
  }

  const passCount = [taxi, rideshare, delivery].filter(s => s.result === 'PASS' || s.result === 'WARNING').length
  const overallStatus = passCount === 3 ? 'ALL_CLEAR' : passCount > 0 ? 'PARTIAL' : 'NONE'

  return {
    snapshotId: `SNAP-${Date.now()}`, driverId: profile.driverId,
    timestamp: now, overallStatus, taxi, rideshare, delivery,
  }
}

// ─── MOCK DATA ────────────────────────────────────────────────

export const mockDriverProfile: DriverProfile = {
  driverId: 'DR-00001234', firstName: 'Mohamed', lastName: 'Benali',
  preferredName: null, phone: '+1 (514) •••-••34', email: 'm.ben***@email.com',
  province: 'QC', country: 'CA', language: 'fr',
  status: 'ACTIVE', profilePhotoUrl: null,
  createdAt: '2025-03-01T00:00:00Z', updatedAt: '2026-08-01T00:00:00Z',
}

export const mockIdentityVerification: IdentityVerification = {
  id: 'IDV-001', driverId: 'DR-00001234', status: 'VERIFIED',
  method: 'DOCUMENT_REVIEW',  // No official API in pilot — DOCUMENT_REVIEW
  verifiedAt: '2025-03-15T14:00:00Z', expiresAt: '2028-03-15T00:00:00Z',
  note: 'Vérifié par examen documentaire — mode pilote (aucune API gouvernementale officielle connectée)',
}

export const mockDriverLicense: DriverLicense = {
  id: 'LIC-001', driverId: 'DR-00001234', licenseType: 'CLASS_4',
  jurisdiction: 'QC', licenseReference: 'M••••••1234',
  issueDate: '2020-03-15', expiryDate: '2028-03-15',
  status: 'VALID', restrictions: [],
  verificationStatus: 'VERIFIED', daysUntilExpiry: 566,
}

export const mockTaxiPermit: TaxiPermit = {
  id: 'PRM-001', driverId: 'DR-00001234', permitNumberReference: 'TP-••••••78',
  jurisdiction: 'QC', status: 'VALID', issueDate: '2025-01-01', expiryDate: '2027-02-01',
  vehicleRequirement: 'Sedan ou VUS — max 7 ans', verificationStatus: 'VERIFIED', daysUntilExpiry: 524,
}

export const mockServiceAuthorizations: ServiceAuthorization[] = [
  { id:'SA-001', driverId:'DR-00001234', serviceType:'TAXI', jurisdiction:'QC', status:'AUTHORIZED', validFrom:'2025-01-01', validUntil:'2027-02-01', source:'GOVERNMENT', restrictionReason:null },
  { id:'SA-002', driverId:'DR-00001234', serviceType:'RIDESHARE', jurisdiction:'QC', status:'AUTHORIZED', validFrom:'2025-01-01', validUntil:null, source:'PROVIDER', restrictionReason:null },
  { id:'SA-003', driverId:'DR-00001234', serviceType:'DELIVERY', jurisdiction:'QC', status:'AUTHORIZED', validFrom:'2025-01-01', validUntil:null, source:'PROVIDER', restrictionReason:null },
]

export const mockVehicleProfile: Vehicle = {
  vehicleId: 'V-QC-001234', driverId: 'DR-00001234',
  make: 'Toyota', model: 'Prius', year: 2022, color: 'Blanc',
  licensePlateReference: '••••QC22', vinReference: null,  // Encrypted server-side
  vehicleType: 'HYBRID', status: 'ACTIVE', isActive: true,
  createdAt: '2025-01-15T00:00:00Z',
}

export const mockVehicleServiceAuth: VehicleServiceAuthorization = {
  vehicleId: 'V-QC-001234', driverId: 'DR-00001234',
  taxi: 'AUTHORIZED', rideshare: 'AUTHORIZED', delivery: 'AUTHORIZED', personal: 'AUTHORIZED',
}

export const mockInsurance: InsuranceDocument = {
  id: 'INS-001', vehicleId: 'V-QC-001234', provider: 'Intact Assurance',
  policyReference: 'POL-••••••89', effectiveDate: '2026-01-15', expiryDate: '2027-01-15',
  status: 'VALID', verificationStatus: 'VERIFIED', isCommercial: true, daysUntilExpiry: 141,
}

export const mockComplianceDocs: DriverComplianceDoc[] = [
  { id:'DOC-001', driverId:'DR-00001234', vehicleId:'V-QC-001234', docType:'INSURANCE', label:'Assurance commerciale v2', status:'VERIFIED', version:2, uploadedAt:'2026-01-10T10:00:00Z', verifiedAt:'2026-01-12T09:00:00Z', expiryDate:'2027-01-15', daysUntilExpiry:141, storageReferenceMasked:'ref://doc/signed/ins-v2-••••' },
  { id:'DOC-002', driverId:'DR-00001234', vehicleId:'V-QC-001234', docType:'INSURANCE', label:'Assurance commerciale v1 (archivé)', status:'VERIFIED', version:1, uploadedAt:'2025-01-10T10:00:00Z', verifiedAt:'2025-01-12T09:00:00Z', expiryDate:'2026-01-15', daysUntilExpiry:-224, storageReferenceMasked:'ref://doc/signed/ins-v1-••••' },
  { id:'DOC-003', driverId:'DR-00001234', vehicleId:'V-QC-001234', docType:'INSPECTION', label:'Inspection mécanique SAAQ', status:'EXPIRING_SOON', version:1, uploadedAt:'2025-10-01T10:00:00Z', verifiedAt:'2025-10-05T09:00:00Z', expiryDate:'2026-10-01', daysUntilExpiry:35, storageReferenceMasked:'ref://doc/signed/insp-v1-••••' },
  { id:'DOC-004', driverId:'DR-00001234', vehicleId:null, docType:'LICENSE', label:'Permis de conduire Classe 4', status:'VERIFIED', version:1, uploadedAt:'2025-03-10T10:00:00Z', verifiedAt:'2025-03-15T14:00:00Z', expiryDate:'2028-03-15', daysUntilExpiry:566, storageReferenceMasked:'ref://doc/signed/lic-v1-••••' },
  { id:'DOC-005', driverId:'DR-00001234', vehicleId:null, docType:'TAXI_PERMIT', label:'Permis taxi QC', status:'VERIFIED', version:1, uploadedAt:'2025-01-05T10:00:00Z', verifiedAt:'2025-01-10T09:00:00Z', expiryDate:'2027-02-01', daysUntilExpiry:524, storageReferenceMasked:'ref://doc/signed/taxi-perm-v1-••••' },
]

export const mockProviderIdentities: ProviderDriverIdentity[] = [
  { driverId:'DR-00001234', provider:'uber', providerAccountId:'UBR-ACC-••••8832', connectionStatus:'CONNECTED', connectedAt:'2025-06-01T10:00:00Z', scopes:['partner.accounts','partner.trips','partner.payments'], lastSyncAt:'2026-08-24T10:00:00Z' },
  { driverId:'DR-00001234', provider:'lyft', providerAccountId:'LFT-ACC-••••4421', connectionStatus:'REAUTH_REQUIRED', connectedAt:'2025-07-15T10:00:00Z', scopes:['rides.read','profile'], lastSyncAt:'2026-07-01T10:00:00Z' },
  { driverId:'DR-00001234', provider:'doordash', providerAccountId:'DD-ACC-••••9912', connectionStatus:'CONNECTED', connectedAt:'2025-08-01T10:00:00Z', scopes:['dasher.read','payments.read'], lastSyncAt:'2026-08-24T10:00:00Z' },
  { driverId:'DR-00001234', provider:'instacart', providerAccountId:'INST-ACC-••••7733', connectionStatus:'CONNECTED', connectedAt:'2025-09-01T10:00:00Z', scopes:['shopper.read'], lastSyncAt:'2026-08-20T10:00:00Z' },
  { driverId:'DR-00001234', provider:'uber_eats', providerAccountId:'UBE-ACC-••••5521', connectionStatus:'CONNECTED', connectedAt:'2025-06-01T10:00:00Z', scopes:['partner.accounts','partner.payments'], lastSyncAt:'2026-08-24T10:00:00Z' },
  { driverId:'DR-00001234', provider:'skip', providerAccountId:'SKIP-ACC-••••2214', connectionStatus:'ERROR', connectedAt:'2025-10-01T10:00:00Z', scopes:['driver.read'], lastSyncAt:'2026-06-01T10:00:00Z' },
]

export const mockAuditEvents: ComplianceAuditEvent[] = [
  { auditId:'AUD-001', driverId:'DR-00001234', action:'IDENTITY_VERIFIED', actor:'REVIEWER-ADMIN-002', actorRole:'REVIEWER', details:'Examen documentaire — mode pilote', timestamp:'2025-03-15T14:00:00Z' },
  { auditId:'AUD-002', driverId:'DR-00001234', action:'LICENSE_VERIFIED', actor:'SYSTEM', actorRole:'SYSTEM', details:'Permis Classe 4 QC — VERIFIED', timestamp:'2025-03-15T14:01:00Z' },
  { auditId:'AUD-003', driverId:'DR-00001234', action:'SERVICE_AUTHORIZED', actor:'ADMIN-GOV-001', actorRole:'ADMIN', details:'TAXI · RIDESHARE · DELIVERY autorisés', timestamp:'2025-03-20T09:00:00Z' },
  { auditId:'AUD-004', driverId:'DR-00001234', action:'DOCUMENT_UPLOADED', actor:'DR-00001234', actorRole:'DRIVER', details:'Assurance commerciale v2 uploadée', timestamp:'2026-01-10T10:00:00Z' },
  { auditId:'AUD-005', driverId:'DR-00001234', action:'DOCUMENT_VERIFIED', actor:'SYSTEM', actorRole:'SYSTEM', details:'Assurance commerciale v2 vérifiée', timestamp:'2026-01-12T09:00:00Z' },
]

// Pre-computed snapshot
export const mockComplianceSnapshot: ComplianceSnapshot = runComplianceCheck(
  mockDriverProfile, mockIdentityVerification, mockDriverLicense,
  mockTaxiPermit, mockVehicleProfile, mockInsurance,
  mockComplianceDocs, mockProviderIdentities
)

// ─── HELPERS ─────────────────────────────────────────────────

export const VERIFICATION_STATUS_CONF: Record<VerificationStatus, { icon: string; color: string; label: string }> = {
  NOT_STARTED:   { icon:'○',  color:'text-slate-500', label:'Non commencé' },
  PENDING:       { icon:'⏳', color:'text-amber-400', label:'En attente' },
  VERIFIED:      { icon:'✅', color:'text-green-400', label:'Vérifié' },
  FAILED:        { icon:'❌', color:'text-red-400',   label:'Échoué' },
  EXPIRED:       { icon:'⏱', color:'text-red-400',   label:'Expiré' },
  MANUAL_REVIEW: { icon:'👁', color:'text-blue-400',  label:'Révision manuelle' },
}

export const PROVIDER_ICONS: Record<string, string> = {
  uber:'⬛', lyft:'🩷', doordash:'🔴', instacart:'🥕', uber_eats:'🟢', skip:'🍁',
}

export const PROVIDER_LABELS: Record<string, string> = {
  uber:'Uber', lyft:'Lyft', doordash:'DoorDash', instacart:'Instacart', uber_eats:'Uber Eats', skip:'Skip',
}

export const CONN_STATUS_CONF: Record<string, { color: string; label: string; icon: string }> = {
  CONNECTED:        { color:'text-green-400',  label:'Connecté',         icon:'✅' },
  DISCONNECTED:     { color:'text-slate-500',  label:'Déconnecté',       icon:'○' },
  PENDING:          { color:'text-amber-400',  label:'En attente',       icon:'⏳' },
  EXPIRED:          { color:'text-red-400',    label:'Expiré',           icon:'⏱' },
  REAUTH_REQUIRED:  { color:'text-amber-400',  label:'Réauth requise',   icon:'🔄' },
  ERROR:            { color:'text-red-400',    label:'Erreur',           icon:'❌' },
}
