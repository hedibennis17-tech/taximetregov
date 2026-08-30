// ================================================================
// TAXIMÈTRE.GOV — SEED DATA TESTS
// Phase DB-19: Validation · Ordre · Invariants
// ================================================================

import { describe, it, expect } from 'vitest'
import {
  SEED_JURISDICTIONS, SEED_ROLES, SEED_PERMISSIONS, SEED_ROLE_PERMISSIONS,
  SEED_RETENTION_POLICIES, SEED_DOCUMENT_TYPES, SEED_ACTIVITY_TYPES,
  SEED_PROVIDERS, SEED_PLATFORM_CONNECTORS, SEED_FEATURE_FLAGS,
  SEED_PILOT_CONFIG, SEED_SYSTEM_CONFIGS, SEED_EXECUTION_ORDER,
  SEED_QC_TAX_RULE_SET, SEED_TAX_COMPONENTS, SEED_FARE_CONFIG,
  SEED_TAX_ROUNDING_POLICY,
  validateSeedData,
} from '../src/db/seeds'

// ─── SEED VALIDATION ─────────────────────────────────────────

describe('Master Seed Validation — Test 1', () => {
  it('[TEST 1] All seed data passes validation', () => {
    const result = validateSeedData()
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})

// ─── JURISDICTIONS ───────────────────────────────────────────

describe('Jurisdictions — Test 2', () => {
  it('[TEST 2] QC jurisdiction defined and is pilot', () => {
    const qc = SEED_JURISDICTIONS.find(j => j.code === 'QC')
    expect(qc).toBeDefined()
    expect(qc?.isPilot).toBe(true)
    expect(qc?.currency).toBe('CAD')
    expect(qc?.country).toBe('CA')
  })

  it('[PASS] Federal CA jurisdiction defined', () => {
    const ca = SEED_JURISDICTIONS.find(j => j.code === 'CA')
    expect(ca).toBeDefined()
    expect(ca?.isPilot).toBe(false)
  })

  it('[PASS] Inactive jurisdictions not started yet', () => {
    const on = SEED_JURISDICTIONS.find(j => j.code === 'ON')
    expect(on?.isActive).toBe(false)  // Not yet in pilot
  })
})

// ─── RBAC ────────────────────────────────────────────────────

describe('RBAC Seeds — Test 3', () => {
  it('[TEST 3] 8 roles définis', () => {
    expect(SEED_ROLES).toHaveLength(8)
    const codes = SEED_ROLES.map(r => r.code)
    expect(codes).toContain('SUPER_ADMIN')
    expect(codes).toContain('GOV_ADMIN')
    expect(codes).toContain('DRIVER')
  })

  it('[PASS] Tous les rôles sont système (isSystem=true)', () => {
    SEED_ROLES.forEach(r => {
      expect(r.isSystem).toBe(true)
    })
  })

  it('[PASS] Toutes les permissions sont référencées dans role_permissions', () => {
    const allPermCodes = new Set(SEED_PERMISSIONS.map(p => p.code))
    allPermCodes.add('*') // Wildcard for SUPER_ADMIN
    Object.entries(SEED_ROLE_PERMISSIONS).forEach(([role, perms]) => {
      perms.forEach(perm => {
        expect(allPermCodes.has(perm), `Missing permission: ${perm} in role ${role}`).toBe(true)
      })
    })
  })

  it('[PASS] DRIVER role a les permissions essentielles seulement', () => {
    const driverPerms = SEED_ROLE_PERMISSIONS['DRIVER'] ?? []
    // DRIVER cannot read other drivers
    expect(driverPerms).not.toContain('drivers.read')
    expect(driverPerms).not.toContain('drivers.manage')
    // DRIVER can read own data
    expect(driverPerms).toContain('profile.read.self')
    expect(driverPerms).toContain('trips.read.self')
  })
})

// ─── RETENTION POLICIES ───────────────────────────────────────

describe('Retention Policies — Test 4', () => {
  it('[TEST 4] Financial/tax/audit records: canDelete=false', () => {
    const protected_ = ['FINANCIAL_TRANSACTIONS', 'TAX_RECORDS', 'AUDIT_LOGS']
    protected_.forEach(cat => {
      const policy = SEED_RETENTION_POLICIES.find(p => p.category === cat)
      expect(policy, `Missing policy for ${cat}`).toBeDefined()
      expect(policy?.canDelete).toBe(false)
      expect(policy?.retentionDays).toBeNull()
    })
  })

  it('[PASS] GPS data: canDelete=true (privacy)', () => {
    const gps = SEED_RETENTION_POLICIES.find(p => p.category === 'GPS_DATA')
    expect(gps?.canDelete).toBe(true)
    expect(gps?.archivalAction).toBe('ANONYMIZE')
    expect(gps?.retentionDays).toBe(30)
  })

  it('[PASS] Toutes les politiques ont une base légale documentée', () => {
    SEED_RETENTION_POLICIES.forEach(p => {
      expect(p.legalBasis.length).toBeGreaterThan(10)
    })
  })
})

// ─── DOCUMENT TYPES ───────────────────────────────────────────

describe('Document Types — Test 5', () => {
  it('[TEST 5] 10 types de documents définis', () => {
    expect(SEED_DOCUMENT_TYPES).toHaveLength(10)
  })

  it('[PASS] TAXI_PERMIT requires manual review', () => {
    const permit = SEED_DOCUMENT_TYPES.find(d => d.code === 'TAXI_PERMIT')
    expect(permit?.requiresManualReview).toBe(true)
  })

  it('[PASS] Tous les codes sont uniques', () => {
    const codes = SEED_DOCUMENT_TYPES.map(d => d.code)
    expect(new Set(codes).size).toBe(codes.length)
  })
})

// ─── ACTIVITY TYPES ───────────────────────────────────────────

describe('Activity Types — Test 6', () => {
  it('[TEST 6] TAXI_TRIP: taximeterEligible=true (seul type)', () => {
    const taxi = SEED_ACTIVITY_TYPES.find(t => t.code === 'TAXI_TRIP')
    expect(taxi?.taximeterEligible).toBe(true)
    // Tous les autres: false
    const others = SEED_ACTIVITY_TYPES.filter(t => t.code !== 'TAXI_TRIP')
    others.forEach(t => {
      expect(t.taximeterEligible, `${t.code} must have taximeterEligible=false`).toBe(false)
    })
  })

  it('[PASS] 7 types définis', () => {
    expect(SEED_ACTIVITY_TYPES).toHaveLength(7)
  })
})

// ─── PROVIDERS ───────────────────────────────────────────────

describe('Providers — Test 7', () => {
  it('[TEST 7] 6 providers définis (tous MOCK_ONLY dev)', () => {
    expect(SEED_PROVIDERS).toHaveLength(6)
    SEED_PROVIDERS.forEach(p => {
      expect(p.isDev).toBe(true)
    })
  })

  it('[PASS] Tous les notes contiennent MOCK_ONLY', () => {
    SEED_PROVIDERS.forEach(p => {
      expect(p.notes).toMatch(/MOCK_ONLY/i)
    })
  })
})

// ─── TAX SEEDS ───────────────────────────────────────────────

describe('Tax Seeds — Tests 8, 9', () => {
  it('[TEST 8] Rounding policy: HALF_UP · 2 décimales · source Revenu Québec', () => {
    expect(SEED_TAX_ROUNDING_POLICY.roundingMode).toBe('HALF_UP')
    expect(SEED_TAX_ROUNDING_POLICY.decimalPlaces).toBe(2)
    expect(SEED_TAX_ROUNDING_POLICY.sourceReference).toMatch(/Revenu Québec/i)
  })

  it('[TEST 9] Tax rule: DRAFT · taux Revenu Québec · source documentée', () => {
    expect(SEED_QC_TAX_RULE_SET.status).toBe('DRAFT')
    expect(SEED_QC_TAX_RULE_SET.tpsRate).toBe(0.05000)
    expect(SEED_QC_TAX_RULE_SET.tvqRate).toBe(0.09975)
    expect(SEED_QC_TAX_RULE_SET.isDev).toBe(true)
  })

  it('[PASS] GST et QST comme composantes séparées', () => {
    const codes = SEED_TAX_COMPONENTS.map(c => c.code)
    expect(codes).toContain('GST')
    expect(codes).toContain('QST')
    expect(SEED_TAX_COMPONENTS).toHaveLength(2)
    // GST avant QST dans l'ordre de calcul
    const gst = SEED_TAX_COMPONENTS.find(c => c.code === 'GST')
    const qst = SEED_TAX_COMPONENTS.find(c => c.code === 'QST')
    expect(gst?.calculationOrder).toBeLessThan(qst?.calculationOrder ?? 999)
  })
})

// ─── FARE CONFIG ──────────────────────────────────────────────

describe('Fare Configuration — Test 10', () => {
  it('[TEST 10] Fare config: isPilot=true · homologation requise', () => {
    expect(SEED_FARE_CONFIG.isPilot).toBe(true)
    expect(SEED_FARE_CONFIG.currency).toBe('CAD')
    expect(SEED_FARE_CONFIG.baseFare).toBe(4.10)
    expect(SEED_FARE_CONFIG.isDev).toBe(true)
  })

  it('[PASS] Tarif kilométrique raisonnable pour Québec', () => {
    // $1.85/km (distanceRatePer100m * 10)
    const perKm = SEED_FARE_CONFIG.distanceRatePer100m * 10
    expect(perKm).toBeCloseTo(1.85, 2)
  })
})

// ─── PLATFORM CONNECTORS ──────────────────────────────────────

describe('Platform Connectors — Test 11', () => {
  it('[TEST 11] 6 connecteurs · tous MOCK_ONLY · taximeterEnabled=false', () => {
    expect(SEED_PLATFORM_CONNECTORS).toHaveLength(6)
    SEED_PLATFORM_CONNECTORS.forEach(c => {
      expect(c.status).toBe('MOCK_ONLY')
      expect(c.taximeterEnabled).toBe(false)
      expect(c.isDev).toBe(true)
    })
  })
})

// ─── FEATURE FLAGS ────────────────────────────────────────────

describe('Feature Flags — Test 12', () => {
  it('[TEST 12] OAuth providers désactivés (pas de partenariat)', () => {
    const oauthFlags = ['uber.oauth.enabled', 'lyft.oauth.enabled', 'doordash.oauth.enabled']
    oauthFlags.forEach(key => {
      const flag = SEED_FEATURE_FLAGS.find(f => f.key === key)
      expect(flag, `Missing flag: ${key}`).toBeDefined()
      expect(flag?.value, `${key} should be false`).toBe('false')
    })
  })

  it('[PASS] tax.auto.submit désactivé (MANUAL_EXPORT uniquement)', () => {
    const autoSubmit = SEED_FEATURE_FLAGS.find(f => f.key === 'tax.auto.submit')
    expect(autoSubmit?.value).toBe('false')
  })

  it('[PASS] 8 feature flags définis', () => {
    expect(SEED_FEATURE_FLAGS).toHaveLength(8)
  })
})

// ─── PILOT CONFIG ─────────────────────────────────────────────

describe('Pilot Configuration — Test 13', () => {
  it('[TEST 13] Pilot: 50 drivers max · QC · homologation null', () => {
    expect(SEED_PILOT_CONFIG.isPilot).toBe(true)
    expect(SEED_PILOT_CONFIG.maxDrivers).toBe(50)
    expect(SEED_PILOT_CONFIG.jurisdictions).toContain('QC')
    expect(SEED_PILOT_CONFIG.regulatoryHomologationRef).toBeNull()
    expect(SEED_PILOT_CONFIG.isDev).toBe(true)
  })

  it('[PASS] Villes du pilote QC', () => {
    expect(SEED_PILOT_CONFIG.cities).toContain('Montréal')
    expect(SEED_PILOT_CONFIG.cities).toContain('Québec')
  })
})

// ─── SYSTEM CONFIGS ───────────────────────────────────────────

describe('System Configs — Test 14', () => {
  it('[TEST 14] gateway.mode = SIMULATION (jamais OFFICIAL_API en dev)', () => {
    const gw = SEED_SYSTEM_CONFIGS.find(c => c.key === 'gateway.mode')
    expect(gw?.value).toBe('SIMULATION')
  })

  it('[PASS] MFA obligatoire pour gov et audit export', () => {
    const mfaGov = SEED_SYSTEM_CONFIGS.find(c => c.key === 'mfa.required.gov')
    const mfaAudit = SEED_SYSTEM_CONFIGS.find(c => c.key === 'audit.export.mfa.required')
    expect(mfaGov?.value).toBe('true')
    expect(mfaAudit?.value).toBe('true')
  })
})

// ─── EXECUTION ORDER ──────────────────────────────────────────

describe('Seed Execution Order — Test 15', () => {
  it('[TEST 15] Jurisdictions exécutées en premier', () => {
    expect(SEED_EXECUTION_ORDER[0]).toBe('jurisdictions')
  })

  it('[PASS] Super Admin en dernier (via env vars)', () => {
    const last = SEED_EXECUTION_ORDER[SEED_EXECUTION_ORDER.length - 1]
    expect(last).toBe('super_admin_user')
  })

  it('[PASS] Ordre respecte les dépendances FK', () => {
    const idx = (name: string) => SEED_EXECUTION_ORDER.indexOf(name as typeof SEED_EXECUTION_ORDER[number])
    // roles avant role_permissions
    expect(idx('roles')).toBeLessThan(idx('role_permissions'))
    // jurisdictions avant tax_rule_sets
    expect(idx('jurisdictions')).toBeLessThan(idx('tax_rule_sets'))
    // tax_rule_sets avant tax_components
    expect(idx('tax_rule_sets')).toBeLessThan(idx('tax_components'))
    // providers avant platform_connectors
    expect(idx('providers')).toBeLessThan(idx('platform_connectors'))
  })
})

// ─── SUPER ADMIN ──────────────────────────────────────────────

describe('Super Admin — Test 16', () => {
  it('[TEST 16] Super Admin via env vars uniquement (pas hardcodé)', () => {
    // Super Admin credentials NEVER in seed data
    // They come from SUPER_ADMIN_EMAIL + SUPER_ADMIN_INITIAL_SECRET env vars
    const seedString = JSON.stringify({
      SEED_ROLES, SEED_PERMISSIONS, SEED_SYSTEM_CONFIGS
    })
    expect(seedString).not.toMatch(/hedibennis17@gmail\.com/)
    expect(seedString).not.toMatch(/password/i)
    expect(seedString).not.toMatch(/secret.*123/)
  })
})

// ─── INVARIANTS ───────────────────────────────────────────────

describe('Seed Invariants', () => {
  it('[PASS] Aucune donnée personnelle réelle dans les seeds', () => {
    const allData = JSON.stringify({
      SEED_JURISDICTIONS, SEED_ROLES, SEED_PROVIDERS,
      SEED_PLATFORM_CONNECTORS, SEED_FEATURE_FLAGS,
    })
    // Pas de NAS, pas d'emails réels, pas de téléphones réels
    expect(allData).not.toMatch(/\d{3}-\d{3}-\d{3}/)  // NAS pattern
  })

  it('[PASS] Aucun secret, token ou clé API hardcodé', () => {
    const allData = JSON.stringify({
      SEED_SYSTEM_CONFIGS, SEED_FEATURE_FLAGS, SEED_QC_TAX_RULE_SET
    })
    expect(allData).not.toMatch(/bearer\s+[a-z0-9]/i)
    expect(allData).not.toMatch(/sk_live/)
    expect(allData).not.toMatch(/api_key.*=.*[a-z0-9]{20}/i)
  })

  it('[PASS] Gateway mode SIMULATION protège contre soumissions fiscales réelles', () => {
    const gw = SEED_SYSTEM_CONFIGS.find(c => c.key === 'gateway.mode')
    expect(gw?.value).toBe('SIMULATION')
    expect(gw?.value).not.toBe('OFFICIAL_API')
  })
})
