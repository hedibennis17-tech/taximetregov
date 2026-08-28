// ================================================================
// TAXIMÈTRE.GOV — RBAC DEFINITIONS
// Roles, permissions, and role-permission mappings
// ================================================================
//
// These are the SEED definitions — the source of truth for
// what each role can do.
//
// IMPORTANT: RBAC alone is not sufficient.
// Resource-level authorization is ALWAYS applied on top.
// A DRIVER can only access their OWN data, regardless of RBAC.
// ================================================================

export interface PermissionDef {
  key: string
  label: string
  module: string
  description: string
}

export interface RoleDef {
  name: string
  label: string
  description: string
  requiresMfa: boolean
  permissions: string[]  // permission keys
}

// ─── PERMISSIONS ─────────────────────────────────────────────

export const PERMISSION_DEFINITIONS: PermissionDef[] = [
  // ── DRIVERS
  { key: 'drivers.read',       module: 'DRIVERS', label: 'Lire les chauffeurs',       description: 'Voir les profils chauffeur' },
  { key: 'drivers.update',     module: 'DRIVERS', label: 'Modifier les chauffeurs',    description: 'Modifier les informations chauffeur' },
  { key: 'drivers.suspend',    module: 'DRIVERS', label: 'Suspendre les chauffeurs',   description: 'Suspendre un compte chauffeur (par service)' },
  { key: 'drivers.approve',    module: 'DRIVERS', label: 'Approuver les chauffeurs',   description: 'Approuver l\'inscription d\'un chauffeur' },

  // ── VEHICLES
  { key: 'vehicles.read',      module: 'VEHICLES', label: 'Lire les véhicules',        description: 'Voir les profils véhicule' },
  { key: 'vehicles.approve',   module: 'VEHICLES', label: 'Approuver les véhicules',   description: 'Approuver un véhicule' },

  // ── TRANSACTIONS
  { key: 'transactions.read',  module: 'FINANCIAL', label: 'Lire les transactions',    description: 'Voir les transactions financières' },
  { key: 'transactions.review',module: 'FINANCIAL', label: 'Réviser les transactions', description: 'Réviser et annoter les transactions' },

  // ── REVENUE
  { key: 'revenue.read',       module: 'FINANCIAL', label: 'Lire les revenus',         description: 'Voir les revenus par chauffeur' },
  { key: 'revenue.export',     module: 'FINANCIAL', label: 'Exporter les revenus',     description: 'Exporter les données de revenus (CSV/PDF)' },

  // ── TAX
  { key: 'tax.read',           module: 'TAX', label: 'Lire les données fiscales',      description: 'Voir les données fiscales chauffeur' },
  { key: 'tax.review',         module: 'TAX', label: 'Réviser les rapports fiscaux',   description: 'Réviser les rapports TPS/TVQ' },
  { key: 'tax.finalize',       module: 'TAX', label: 'Finaliser les rapports fiscaux', description: 'Finaliser un rapport fiscal (MFA requis)' },
  { key: 'tax.rules.manage',   module: 'TAX', label: 'Gérer les règles fiscales',      description: 'Créer/modifier les versions de règles fiscales' },

  // ── DOCUMENTS
  { key: 'documents.read',     module: 'DOCUMENTS', label: 'Lire les documents',       description: 'Voir les documents chauffeur' },
  { key: 'documents.verify',   module: 'DOCUMENTS', label: 'Vérifier les documents',   description: 'Approuver ou rejeter un document' },

  // ── AUDIT
  { key: 'audit.read',         module: 'AUDIT', label: 'Lire l\'audit',                description: 'Voir les logs d\'audit' },
  { key: 'audit.export',       module: 'AUDIT', label: 'Exporter l\'audit',            description: 'Exporter les logs d\'audit (MFA requis)' },

  // ── USERS (government account management)
  { key: 'users.manage',       module: 'SYSTEM', label: 'Gérer les utilisateurs',      description: 'Créer/modifier les comptes gouvernementaux' },
  { key: 'users.read',         module: 'SYSTEM', label: 'Lire les utilisateurs',       description: 'Voir les comptes utilisateurs' },

  // ── SETTINGS
  { key: 'settings.manage',    module: 'SYSTEM', label: 'Gérer les paramètres',        description: 'Modifier la configuration système' },

  // ── SECURITY
  { key: 'security.view',      module: 'SECURITY', label: 'Voir la sécurité',          description: 'Voir les événements de sécurité et sessions' },
  { key: 'security.manage',    module: 'SECURITY', label: 'Gérer la sécurité',         description: 'Révoquer sessions/tokens, gérer incidents' },

  // ── WEBHOOKS
  { key: 'webhooks.view',      module: 'SYSTEM', label: 'Voir les webhooks',           description: 'Voir l\'état des webhooks et files d\'attente' },
  { key: 'webhooks.manage',    module: 'SYSTEM', label: 'Gérer les webhooks',          description: 'Relancer des webhooks échoués, gérer DLQ' },

  // ── DRIVER (self-access only — resource auth enforced at API level)
  { key: 'profile.read.self',     module: 'DRIVER', label: 'Lire son profil',          description: 'Lire son propre profil (driver only)' },
  { key: 'profile.update.self',   module: 'DRIVER', label: 'Modifier son profil',      description: 'Modifier ses propres informations' },
  { key: 'trips.read.self',       module: 'DRIVER', label: 'Lire ses courses',         description: 'Voir ses propres courses' },
  { key: 'trips.create.self',     module: 'DRIVER', label: 'Créer une course',         description: 'Démarrer une course (taximètre)' },
  { key: 'deliveries.read.self',  module: 'DRIVER', label: 'Lire ses livraisons',      description: 'Voir ses propres livraisons' },
  { key: 'revenue.read.self',     module: 'DRIVER', label: 'Lire ses revenus',         description: 'Voir ses propres revenus' },
  { key: 'tax.read.self',         module: 'DRIVER', label: 'Lire ses données fiscales', description: 'Voir ses propres données fiscales' },
  { key: 'documents.read.self',   module: 'DRIVER', label: 'Lire ses documents',       description: 'Voir ses propres documents' },
  { key: 'documents.upload.self', module: 'DRIVER', label: 'Uploader ses documents',   description: 'Uploader ses propres documents' },
  { key: 'payments.read.self',    module: 'DRIVER', label: 'Lire ses paiements',       description: 'Voir ses propres paiements et wallet' },
  { key: 'wallet.read.self',      module: 'DRIVER', label: 'Lire son wallet',          description: 'Voir son propre wallet' },
]

// ─── ROLES ───────────────────────────────────────────────────

export const ROLE_DEFINITIONS: RoleDef[] = [
  {
    name: 'SUPER_ADMIN',
    label: 'Super Administrateur',
    description: 'Accès total — toutes les permissions système et gouvernementales',
    requiresMfa: true,
    permissions: PERMISSION_DEFINITIONS
      .filter(p => !p.module.startsWith('DRIVER') || p.module === 'DRIVER')
      .map(p => p.key),
  },
  {
    name: 'GOV_ADMIN',
    label: 'Administrateur Gouvernemental',
    description: 'Administration gouvernementale — gestion chauffeurs, véhicules, conformité',
    requiresMfa: true,
    permissions: [
      'drivers.read', 'drivers.update', 'drivers.suspend', 'drivers.approve',
      'vehicles.read', 'vehicles.approve',
      'transactions.read',
      'revenue.read',
      'tax.read', 'tax.review',
      'documents.read', 'documents.verify',
      'audit.read',
      'users.read',
      'security.view',
      'webhooks.view',
    ],
  },
  {
    name: 'TAX_ADMIN',
    label: 'Administrateur Fiscal',
    description: 'Gestion fiscale — calculs, rapports, règles, finalisation',
    requiresMfa: true,
    permissions: [
      'drivers.read',
      'transactions.read',
      'revenue.read', 'revenue.export',
      'tax.read', 'tax.review', 'tax.finalize', 'tax.rules.manage',
      'documents.read',
      'audit.read',
      'security.view',
    ],
  },
  {
    name: 'FINANCE_REVIEWER',
    label: 'Réviseur Financier',
    description: 'Révision financière — transactions et revenus',
    requiresMfa: true,
    permissions: [
      'transactions.read', 'transactions.review',
      'revenue.read', 'revenue.export',
      'tax.read',
      'audit.read',
    ],
  },
  {
    name: 'AUDITOR',
    label: 'Auditeur',
    description: 'Lecture seule + audit — aucune modification',
    requiresMfa: true,
    permissions: [
      'drivers.read',
      'transactions.read',
      'revenue.read',
      'tax.read',
      'documents.read',
      'audit.read', 'audit.export',
      'security.view',
    ],
  },
  {
    name: 'SUPPORT',
    label: 'Support',
    description: 'Support client — lecture limitée, pas de données fiscales complètes',
    requiresMfa: false,
    permissions: [
      'drivers.read',
      'vehicles.read',
      'documents.read',
    ],
  },
  {
    name: 'READ_ONLY',
    label: 'Lecture seule',
    description: 'Accès en lecture uniquement — données de base',
    requiresMfa: false,
    permissions: [
      'drivers.read',
      'revenue.read',
      'audit.read',
    ],
  },
  {
    name: 'DRIVER',
    label: 'Chauffeur',
    description: 'Accès chauffeur — données propres uniquement (resource auth enforced)',
    requiresMfa: false,
    permissions: [
      'profile.read.self',
      'profile.update.self',
      'trips.read.self',
      'trips.create.self',
      'deliveries.read.self',
      'revenue.read.self',
      'tax.read.self',
      'documents.read.self',
      'documents.upload.self',
      'payments.read.self',
      'wallet.read.self',
    ],
  },
]

// ─── RESOURCE AUTHORIZATION ───────────────────────────────────
//
// RBAC gives permission keys. Resource auth checks ownership.
// Applied at the API/service layer — NOT in the database.
//
// Rule: A DRIVER can only access resources where owner_driver_id = their user_id
// Rule: A government user with 'drivers.read' can access any driver
//       but only through their authorized role
//
// This is enforced by the backend service, not by PostgreSQL RLS,
// so that we have consistent authorization logic across all services.

export function checkResourceOwnership(
  requestorDriverId: string,
  resourceOwnerDriverId: string,
  roleName: string,
): boolean {
  if (roleName === 'DRIVER') {
    // Drivers can ONLY access their own resources
    return requestorDriverId === resourceOwnerDriverId
  }
  // Government roles: resource-level access determined by permission
  return true
}

export function hasPermission(
  userPermissions: string[],
  requiredPermission: string,
): boolean {
  return userPermissions.includes(requiredPermission)
}
