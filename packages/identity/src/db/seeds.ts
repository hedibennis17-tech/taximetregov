// ================================================================
// TAXIMÈTRE.GOV — MASTER SEED DATA
// Database Phase 19/20 — Initial Configuration · Dev Seeds
// ================================================================
//
// OBJECTIF: Consolider TOUS les seeds dispersés dans les services
// et produire un seed script exécutable complet pour DB-20.
//
// ORDRE D'EXÉCUTION OBLIGATOIRE:
// 1. jurisdictions          → requis par tax_accounts, tax_rule_sets
// 2. roles + permissions    → requis par users
// 3. retention_policies     → requis par audit
// 4. document_types         → requis par documents
// 5. activity_types         → requis par driver_activities
// 6. tax_rounding_policies  → requis par tax_components
// 7. tax_rule_sets          → requis par tax_components, tax_calculations
// 8. tax_components         → requis par transaction_tax_calculations
// 9. providers              → requis par provider_accounts, activities
// 10. platform_connectors   → requis par pipeline_runs
// 11. fare_configurations   → requis par taxi_trips
// 12. system_configs        → feature flags, pilot config
// 13. Super Admin user      → via env vars uniquement
//
// RÈGLES ABSOLUES SEEDS:
// 1. isDevelopmentSeed=true sur toutes les entités non-permanentes
// 2. Super Admin: JAMAIS hardcodé → SUPER_ADMIN_EMAIL + SUPER_ADMIN_INITIAL_SECRET env vars
// 3. Taux fiscaux: status='DRAFT' → approbation gouvernementale requise avant ACTIVE
// 4. Providers: MOCK_ONLY → partnerApprovalReference null
// 5. Fare config: isPilot=true · homologation officielle requise
// 6. Aucune donnée personnelle réelle dans les seeds
// 7. Aucun mot de passe, token, clé API hardcodé
// ================================================================

// ─── JURISDICTIONS ───────────────────────────────────────────

export const SEED_JURISDICTIONS = [
  {
    code:     'QC',
    name:     'Québec',
    nameFr:   'Québec',
    nameEn:   'Quebec',
    country:  'CA',
    currency: 'CAD',
    isPilot:  true,
    isActive: true,
  },
  {
    code:     'CA',
    name:     'Canada (Fédéral)',
    nameFr:   'Canada (Fédéral)',
    nameEn:   'Canada (Federal)',
    country:  'CA',
    currency: 'CAD',
    isPilot:  false,
    isActive: true,
  },
  {
    code:     'ON',
    name:     'Ontario',
    nameFr:   'Ontario',
    nameEn:   'Ontario',
    country:  'CA',
    currency: 'CAD',
    isPilot:  false,
    isActive: false,  // Pas encore en pilote
  },
] as const

// ─── RBAC ROLES ──────────────────────────────────────────────

export const SEED_ROLES = [
  { code: 'SUPER_ADMIN',        label: 'Super Administrateur',       isSystem: true  },
  { code: 'GOV_ADMIN',          label: 'Administrateur Gouvernemental', isSystem: true  },
  { code: 'GOV_INSPECTOR',      label: 'Inspecteur Gouvernemental',  isSystem: true  },
  { code: 'GOV_AUDITOR',        label: 'Auditeur Gouvernemental',    isSystem: true  },
  { code: 'GOV_TAX_OFFICER',    label: 'Agent Fiscal',               isSystem: true  },
  { code: 'DRIVER',             label: 'Chauffeur',                  isSystem: true  },
  { code: 'DRIVER_PENDING',     label: 'Chauffeur en attente',       isSystem: true  },
  { code: 'SYSTEM',             label: 'Système (interne)',          isSystem: true  },
] as const

export const SEED_PERMISSIONS = [
  // Auth
  { code: 'auth.login',           label: 'Se connecter'             },
  { code: 'auth.logout',          label: 'Se déconnecter'           },
  { code: 'auth.mfa.manage',      label: 'Gérer MFA'                },
  // Drivers
  { code: 'drivers.read',         label: 'Lire profils chauffeurs'  },
  { code: 'drivers.manage',       label: 'Gérer profils chauffeurs' },
  { code: 'profile.read.self',    label: 'Lire son propre profil'   },
  { code: 'profile.update.self',  label: 'Modifier son propre profil' },
  // Documents
  { code: 'documents.read.self',  label: 'Lire ses propres documents' },
  { code: 'documents.upload',     label: 'Téléverser des documents' },
  { code: 'documents.verify',     label: 'Vérifier des documents'   },
  { code: 'documents.read',       label: 'Lire tous les documents'  },
  // Vehicles
  { code: 'vehicles.read.self',   label: 'Lire ses véhicules'       },
  { code: 'vehicles.manage.self', label: 'Gérer ses véhicules'      },
  { code: 'vehicles.approve',     label: 'Approuver des véhicules'  },
  { code: 'vehicles.read',        label: 'Lire tous les véhicules'  },
  // Trips
  { code: 'trips.read.self',      label: 'Lire ses courses'         },
  { code: 'trips.manage.self',    label: 'Gérer ses courses'        },
  { code: 'transactions.read',    label: 'Lire les transactions'    },
  { code: 'transactions.review',  label: 'Réviser les transactions' },
  // Revenue
  { code: 'revenue.read',         label: 'Lire les revenus'         },
  { code: 'activities.read',      label: 'Lire les activités'       },
  { code: 'activities.review',    label: 'Réviser les activités'    },
  { code: 'activities.reconcile', label: 'Réconcilier les activités' },
  // Tax
  { code: 'tax.read',             label: 'Lire les données fiscales' },
  { code: 'tax.read.self',        label: 'Lire ses données fiscales' },
  { code: 'tax.review',           label: 'Réviser les données fiscales' },
  { code: 'tax.finalize',         label: 'Finaliser les déclarations' },
  { code: 'tax.adjust',           label: 'Ajuster les calculs fiscaux' },
  // Payments
  { code: 'payments.read.self',   label: 'Lire ses paiements'       },
  { code: 'payouts.request',      label: 'Demander un virement'     },
  { code: 'payouts.approve',      label: 'Approuver un virement'    },
  { code: 'statements.generate',  label: 'Générer des relevés'      },
  // Providers
  { code: 'providers.connect',    label: 'Connecter un fournisseur' },
  { code: 'provider_events.read', label: 'Lire les événements provider' },
  { code: 'provider_quarantine.resolve', label: 'Résoudre les quarantaines' },
  // Audit
  { code: 'audit.read',           label: 'Lire les journaux d\'audit' },
  { code: 'audit.export',         label: 'Exporter les journaux d\'audit' },
  { code: 'security.view',        label: 'Voir les événements sécurité' },
  // Reports
  { code: 'report.generate',      label: 'Générer des rapports'     },
  // Admin
  { code: 'admin.rbac',           label: 'Gérer RBAC'               },
  { code: 'admin.suspend',        label: 'Suspendre un compte'      },
  { code: 'admin.config',         label: 'Gérer la configuration'   },
  // Connectors
  { code: 'connectors.read',      label: 'Lire les connecteurs'     },
  { code: 'connectors.manage',    label: 'Gérer les connecteurs'    },
  { code: 'connectors.publish',   label: 'Publier une config connecteur' },
  { code: 'pipeline.read',        label: 'Lire les pipelines'       },
  // Investigation
  { code: 'investigation.open',   label: 'Ouvrir une investigation' },
] as const

// Role-permission mappings
export const SEED_ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['*'],  // All permissions via wildcard — handled in seed script
  GOV_ADMIN: [
    'drivers.read', 'drivers.manage', 'documents.read', 'documents.verify',
    'vehicles.read', 'vehicles.approve', 'transactions.read', 'transactions.review',
    'revenue.read', 'activities.read', 'activities.review', 'activities.reconcile',
    'tax.read', 'tax.review', 'tax.finalize', 'tax.adjust',
    'payouts.approve', 'statements.generate', 'provider_events.read',
    'provider_quarantine.resolve', 'audit.read', 'audit.export', 'security.view',
    'report.generate', 'admin.rbac', 'admin.suspend', 'admin.config',
    'connectors.read', 'connectors.manage', 'connectors.publish',
    'investigation.open',
  ],
  GOV_INSPECTOR: [
    'drivers.read', 'documents.read', 'documents.verify', 'vehicles.read',
    'vehicles.approve', 'activities.read', 'audit.read', 'report.generate',
    'investigation.open',
  ],
  GOV_AUDITOR: [
    'drivers.read', 'transactions.read', 'revenue.read', 'activities.read',
    'tax.read', 'audit.read', 'audit.export', 'security.view', 'report.generate',
  ],
  GOV_TAX_OFFICER: [
    'drivers.read', 'transactions.read', 'revenue.read', 'activities.read',
    'tax.read', 'tax.review', 'tax.finalize', 'tax.adjust',
    'audit.read', 'report.generate',
  ],
  DRIVER: [
    'auth.login', 'auth.logout', 'auth.mfa.manage',
    'profile.read.self', 'profile.update.self',
    'documents.read.self', 'documents.upload',
    'vehicles.read.self', 'vehicles.manage.self',
    'trips.read.self', 'trips.manage.self',
    'payments.read.self', 'payouts.request', 'tax.read.self', 'statements.generate',
    'providers.connect',
  ],
  DRIVER_PENDING: [
    'auth.login', 'auth.logout', 'auth.mfa.manage',
    'profile.read.self', 'profile.update.self',
    'documents.read.self', 'documents.upload',
    'vehicles.read.self',
  ],
  SYSTEM: ['*'],
}

// ─── RETENTION POLICIES ───────────────────────────────────────

export const SEED_RETENTION_POLICIES = [
  {
    jurisdiction:   'QC',
    category:       'FINANCIAL_TRANSACTIONS',
    retentionDays:  null,        // Indéfini — obligation légale
    canDelete:      false,
    archivalAction: 'ARCHIVE',
    legalBasis:     'Loi de l\'impôt sur le revenu (LIR) · Loi sur la taxe de vente du Québec',
    isActive:       true,
  },
  {
    jurisdiction:   'QC',
    category:       'TAX_RECORDS',
    retentionDays:  null,
    canDelete:      false,
    archivalAction: 'ARCHIVE',
    legalBasis:     'Loi sur l\'administration fiscale du Québec · minimum 6 ans',
    isActive:       true,
  },
  {
    jurisdiction:   'QC',
    category:       'AUDIT_LOGS',
    retentionDays:  null,
    canDelete:      false,
    archivalAction: 'ARCHIVE',
    legalBasis:     'Obligations de traçabilité gouvernementale',
    isActive:       true,
  },
  {
    jurisdiction:   'QC',
    category:       'GPS_DATA',
    retentionDays:  30,
    canDelete:      true,
    archivalAction: 'ANONYMIZE',
    legalBasis:     'Politique de confidentialité — minimisation des données · Loi 25 Québec',
    isActive:       true,
  },
  {
    jurisdiction:   'QC',
    category:       'SESSION_LOGS',
    retentionDays:  90,
    canDelete:      true,
    archivalAction: 'DELETE',
    legalBasis:     'Sécurité opérationnelle · audit d\'accès',
    isActive:       true,
  },
  {
    jurisdiction:   'QC',
    category:       'NOTIFICATIONS',
    retentionDays:  90,
    canDelete:      true,
    archivalAction: 'DELETE',
    legalBasis:     'Opérationnel',
    isActive:       true,
  },
  {
    jurisdiction:   'QC',
    category:       'PERSONAL_DATA',
    retentionDays:  null,
    canDelete:      false,
    archivalAction: 'ANONYMIZE',
    legalBasis:     'GDPR Art. 17 · Loi 25 Québec · sous réserve obligations légales',
    isActive:       true,
  },
  {
    jurisdiction:   'QC',
    category:       'DOCUMENTS',
    retentionDays:  null,
    canDelete:      false,
    archivalAction: 'ARCHIVE',
    legalBasis:     'Documents réglementaires — conservation permanente requise',
    isActive:       true,
  },
  {
    jurisdiction:   'QC',
    category:       'COMPLIANCE_RECORDS',
    retentionDays:  null,
    canDelete:      false,
    archivalAction: 'ARCHIVE',
    legalBasis:     'Obligations de conformité gouvernementale',
    isActive:       true,
  },
  {
    jurisdiction:   'QC',
    category:       'WEBHOOK_EVENTS',
    retentionDays:  365,
    canDelete:      true,
    archivalAction: 'DELETE',
    legalBasis:     'Opérationnel — débogage et audit technique',
    isActive:       true,
  },
] as const

// ─── DOCUMENT TYPES ───────────────────────────────────────────

export const SEED_DOCUMENT_TYPES = [
  { code: 'DRIVER_LICENSE',        label: 'Permis de conduire',          ownerType: 'DRIVER',   hasExpiry: true,  renewalNoticeDays: 60,  requiresVerification: true,  requiresManualReview: false },
  { code: 'TAXI_PERMIT',           label: 'Permis taxi',                 ownerType: 'DRIVER',   hasExpiry: true,  renewalNoticeDays: 30,  requiresVerification: true,  requiresManualReview: true  },
  { code: 'VEHICLE_REGISTRATION',  label: 'Enregistrement du véhicule',  ownerType: 'VEHICLE',  hasExpiry: true,  renewalNoticeDays: 30,  requiresVerification: true,  requiresManualReview: false },
  { code: 'VEHICLE_INSURANCE',     label: 'Assurance véhicule',          ownerType: 'VEHICLE',  hasExpiry: true,  renewalNoticeDays: 30,  requiresVerification: true,  requiresManualReview: false },
  { code: 'SAFETY_INSPECTION',     label: 'Inspection de sécurité',      ownerType: 'VEHICLE',  hasExpiry: true,  renewalNoticeDays: 60,  requiresVerification: true,  requiresManualReview: false },
  { code: 'MECHANICAL_INSPECTION', label: 'Inspection mécanique',        ownerType: 'VEHICLE',  hasExpiry: true,  renewalNoticeDays: 60,  requiresVerification: true,  requiresManualReview: false },
  { code: 'IDENTITY_DOCUMENT',     label: "Document d'identité",         ownerType: 'DRIVER',   hasExpiry: true,  renewalNoticeDays: 90,  requiresVerification: true,  requiresManualReview: false },
  { code: 'TAXIMETER_CERTIFICATE', label: 'Certificat taximètre',        ownerType: 'VEHICLE',  hasExpiry: true,  renewalNoticeDays: 30,  requiresVerification: true,  requiresManualReview: true  },
  { code: 'BACKGROUND_CHECK',      label: 'Vérification des antécédents', ownerType: 'DRIVER',  hasExpiry: true,  renewalNoticeDays: 30,  requiresVerification: true,  requiresManualReview: true  },
  { code: 'PROOF_OF_INSURANCE',    label: "Preuve d'assurance",          ownerType: 'VEHICLE',  hasExpiry: true,  renewalNoticeDays: 30,  requiresVerification: true,  requiresManualReview: false },
] as const

// ─── ACTIVITY TYPES ───────────────────────────────────────────

export const SEED_ACTIVITY_TYPES = [
  { code: 'TAXI_TRIP',         label: 'Course taxi',           taximeterEligible: true,  isActive: true },
  { code: 'RIDESHARE_TRIP',    label: 'Course covoiturage',    taximeterEligible: false, isActive: true },
  { code: 'FOOD_DELIVERY',     label: 'Livraison repas',       taximeterEligible: false, isActive: true },
  { code: 'GROCERY_DELIVERY',  label: 'Livraison épicerie',    taximeterEligible: false, isActive: true },
  { code: 'PARCEL_DELIVERY',   label: 'Livraison colis',       taximeterEligible: false, isActive: true },
  { code: 'COURIER',           label: 'Service coursier',      taximeterEligible: false, isActive: true },
  { code: 'OTHER',             label: 'Autre activité',        taximeterEligible: false, isActive: true },
] as const

// ─── PROVIDERS (from DB-6) ────────────────────────────────────

export const SEED_PROVIDERS = [
  { code: 'UBER',      name: 'Uber',          providerType: 'MULTI_SERVICE',    country: 'CA', isDev: true, notes: 'MOCK_ONLY — Uber partner.accounts/trips/payments API requires official Uber partner program approval' },
  { code: 'LYFT',      name: 'Lyft',          providerType: 'RIDESHARE',        country: 'CA', isDev: true, notes: 'MOCK_ONLY — Lyft API requires official partner contract' },
  { code: 'DOORDASH',  name: 'DoorDash',      providerType: 'DELIVERY',         country: 'CA', isDev: true, notes: 'MOCK_ONLY — DoorDash Dasher API requires official DoorDash approval' },
  { code: 'UBER_EATS', name: 'Uber Eats',     providerType: 'FOOD_DELIVERY',    country: 'CA', isDev: true, notes: 'MOCK_ONLY — Via Uber API (same partner program)' },
  { code: 'INSTACART', name: 'Instacart',     providerType: 'GROCERY_DELIVERY', country: 'CA', isDev: true, notes: 'MOCK_ONLY — Instacart API evaluation in progress' },
  { code: 'SKIP',      name: 'SkipTheDishes', providerType: 'FOOD_DELIVERY',    country: 'CA', isDev: true, notes: 'MOCK_ONLY — SkipTheDishes Canada API evaluation in progress' },
] as const

// ─── TAX SEEDS (from DB-15) ───────────────────────────────────

export const SEED_TAX_ROUNDING_POLICY = {
  code:            'CAD_RQ_STANDARD',
  name:            'Revenu Québec standard — CAD arrondi au cent',
  currency:        'CAD',
  decimalPlaces:   2,
  roundingMode:    'HALF_UP',
  minimumUnit:     0.01,
  sourceReference: 'Revenu Québec — Guide de perception de la TVQ et de la TPS/TVH',
} as const

export const SEED_QC_TAX_RULE_SET = {
  code:            'QC_TPS_TVQ',
  version:         'QC-2026-V1',
  label:           'Règle TPS/TVQ Québec 2026',
  tpsRate:         0.05000,
  tvqRate:         0.09975,
  effectiveFrom:   '2026-01-01',
  effectiveUntil:  null,
  status:          'DRAFT',  // DRAFT — doit être APPROVED par autorité fiscale avant ACTIVE
  sourceReference: 'Revenu Québec — Loi sur la taxe de vente du Québec',
  isDev:           true,
  note:            'SEED ONLY — approbation gouvernementale requise avant statut ACTIVE',
} as const

export const SEED_TAX_COMPONENTS = [
  {
    code:             'GST',
    name:             'Goods and Services Tax (TPS)',
    nameFr:           'Taxe sur les produits et services (TPS)',
    componentType:    'GST',
    rate:             0.05000,
    calculationOrder: 1,
    sourceReference:  "Loi sur la taxe d'accise — Partie IX",
    isDev:            true,
  },
  {
    code:             'QST',
    name:             'Québec Sales Tax (TVQ)',
    nameFr:           'Taxe de vente du Québec (TVQ)',
    componentType:    'QST',
    rate:             0.09975,
    calculationOrder: 2,
    sourceReference:  'Loi sur la taxe de vente du Québec — Revenu Québec',
    isDev:            true,
  },
] as const

// ─── FARE CONFIGURATION (from DB-8) ──────────────────────────

export const SEED_FARE_CONFIG = {
  version:             'QC-TAXI-PILOT-2026',
  jurisdiction:        'QC',
  currency:            'CAD',
  label:               'Tarif taxi Québec — Mode pilote 2026',
  baseFare:            4.10,
  distanceRatePer100m: 0.185,  // $1.85/km
  timeRatePerMinute:   0.55,
  waitingRatePerMinute: 0.55,
  minimumFare:         4.10,
  airportSurcharge:    1.50,
  nightSurcharge:      0.00,
  effectiveFrom:       '2026-01-01',
  effectiveUntil:      null,
  isActive:            true,
  isPilot:             true,   // Mode pilote — homologation officielle requise
  sourceReference:     'Bureau du taxi de Montréal — Tarification pilote 2026',
  isDev:               true,
} as const

// ─── PLATFORM CONNECTORS (from DB-18) ────────────────────────

export const SEED_PLATFORM_CONNECTORS = [
  { connectorType: 'UBER',      name: 'UberConnector',      status: 'MOCK_ONLY', authType: 'OAUTH2_AUTHORIZATION_CODE',  taximeterEnabled: false, isDev: true },
  { connectorType: 'LYFT',      name: 'LyftConnector',      status: 'MOCK_ONLY', authType: 'OAUTH2_AUTHORIZATION_CODE',  taximeterEnabled: false, isDev: true },
  { connectorType: 'DOORDASH',  name: 'DoorDashConnector',  status: 'MOCK_ONLY', authType: 'OAUTH2_CLIENT_CREDENTIALS',  taximeterEnabled: false, isDev: true },
  { connectorType: 'INSTACART', name: 'InstacartConnector', status: 'MOCK_ONLY', authType: 'API_KEY',                    taximeterEnabled: false, isDev: true },
  { connectorType: 'UBER_EATS', name: 'UberEatsConnector',  status: 'MOCK_ONLY', authType: 'OAUTH2_AUTHORIZATION_CODE',  taximeterEnabled: false, isDev: true },
  { connectorType: 'SKIP',      name: 'SkipConnector',      status: 'MOCK_ONLY', authType: 'API_KEY',                    taximeterEnabled: false, isDev: true },
] as const

// ─── FEATURE FLAGS (from DB-12) ──────────────────────────────

export const SEED_FEATURE_FLAGS = [
  { key: 'taximeter.enabled',         value: 'true',  description: 'Taximètre TAXI activé',                    environment: 'pilot' },
  { key: 'delivery.enabled',          value: 'true',  description: 'Mode livraison activé',                    environment: 'pilot' },
  { key: 'uber.oauth.enabled',        value: 'false', description: 'OAuth Uber — approbation partenaire requise', environment: 'all'   },
  { key: 'lyft.oauth.enabled',        value: 'false', description: 'OAuth Lyft — approbation partenaire requise', environment: 'all'   },
  { key: 'doordash.oauth.enabled',    value: 'false', description: 'OAuth DoorDash — approbation requise',     environment: 'all'   },
  { key: 'tax.auto.submit',           value: 'false', description: 'Soumission fiscale auto désactivée (MANUAL_EXPORT only)', environment: 'all' },
  { key: 'live.map.enabled',          value: 'false', description: 'Carte live désactivée (pilote uniquement)', environment: 'pilot' },
  { key: 'new.tax.engine.enabled',    value: 'true',  description: 'Nouveau moteur fiscal activé',              environment: 'pilot' },
] as const

// ─── PILOT CONFIGURATION ─────────────────────────────────────

export const SEED_PILOT_CONFIG = {
  pilotId:              'PILOT-QC-2026',
  name:                 'Pilote Taximètre.gov Québec 2026',
  jurisdictions:        ['QC'],
  cities:               ['Montréal', 'Québec', 'Laval'],
  maxDrivers:           50,
  isPilot:              true,
  regulatoryHomologationRef: null,  // null = homologation officielle non encore obtenue
  startDate:            '2026-01-01',
  endDate:              null,       // null = en cours
  isDev:                true,
} as const

// ─── SYSTEM CONFIGS ───────────────────────────────────────────

export const SEED_SYSTEM_CONFIGS = [
  { key: 'gateway.mode',              value: 'SIMULATION',  description: 'Mode passerelle fiscale — SIMULATION par défaut' },
  { key: 'tax.deadline.days',         value: '30',          description: 'Délai de traitement des demandes GDPR (jours)' },
  { key: 'payout.min.amount.cad',     value: '10.00',       description: 'Montant minimum de virement (CAD)' },
  { key: 'gps.gap.threshold.seconds', value: '60',          description: 'Seuil détection GPS_GAP (secondes)' },
  { key: 'webhook.max.retries',       value: '5',           description: 'Nombre maximum de tentatives webhook' },
  { key: 'session.timeout.minutes',   value: '60',          description: 'Délai expiration session (minutes)' },
  { key: 'mfa.required.gov',          value: 'true',        description: 'MFA obligatoire pour utilisateurs gouvernementaux' },
  { key: 'audit.export.mfa.required', value: 'true',        description: 'MFA obligatoire pour export audit' },
] as const

// ─── SEED EXECUTION ORDER ─────────────────────────────────────

export const SEED_EXECUTION_ORDER = [
  'jurisdictions',
  'roles',
  'permissions',
  'role_permissions',
  'retention_policies',
  'document_types',
  'activity_types',
  'tax_rounding_policies',
  'tax_rule_sets',
  'tax_components',
  'providers',
  'platform_connectors',
  'fare_configurations',
  'feature_flags',
  'system_configs',
  'super_admin_user',  // Via env vars — SUPER_ADMIN_EMAIL + SUPER_ADMIN_INITIAL_SECRET
] as const

export type SeedTableName = typeof SEED_EXECUTION_ORDER[number]

// ─── VALIDATION ───────────────────────────────────────────────

export function validateSeedData(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // All providers must be MOCK_ONLY in dev seeds
  SEED_PROVIDERS.forEach(p => {
    if (!p.isDev) errors.push(`Provider ${p.code} missing isDev=true`)
  })

  // All connectors must have taximeterEnabled=false
  SEED_PLATFORM_CONNECTORS.forEach(c => {
    if (c.taximeterEnabled !== false)
      errors.push(`Connector ${c.name}: taximeterEnabled must be false`)
  })

  // Tax rule sets must be DRAFT
  if (SEED_QC_TAX_RULE_SET.status !== 'DRAFT')
    errors.push('Tax rule set must start as DRAFT — not ACTIVE')

  // Fare config must be pilot
  if (!SEED_FARE_CONFIG.isPilot)
    errors.push('Fare config must be isPilot=true in seed')

  // TAXI_TRIP must be the only taximeterEligible=true
  const taximeterTypes = SEED_ACTIVITY_TYPES.filter(t => t.taximeterEligible)
  if (taximeterTypes.length !== 1 || taximeterTypes[0]?.code !== 'TAXI_TRIP')
    errors.push('Only TAXI_TRIP should have taximeterEligible=true')

  // No feature flag should enable real API calls
  const dangerousFlags = ['uber.oauth.enabled', 'lyft.oauth.enabled', 'doordash.oauth.enabled']
  dangerousFlags.forEach(flag => {
    const f = SEED_FEATURE_FLAGS.find(ff => ff.key === flag)
    if (f && f.value === 'true')
      errors.push(`${flag} must be false in dev seeds — requires partner approval`)
  })

  return { valid: errors.length === 0, errors }
}
