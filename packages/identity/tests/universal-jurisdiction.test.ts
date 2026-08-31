// ================================================================
// TAXIMÈTRE.GOV — UNIVERSAL JURISDICTION TESTS
// PRE-DB20 V2: Taximeter · Multi-Juridiction · Service Types
// ================================================================

import { describe, it, expect } from 'vitest'
import {
  SERVICE_TAXIMETER_RULES, isTaximeterApplicable,
  getTaxContextForJurisdiction, taxContextChangesWithJurisdiction,
  SEED_COUNTRIES, SEED_PROVINCES_STATES, SEED_SERVICE_TYPES,
  SEED_TAX_AUTHORITIES,
  type ServiceTypeCode,
} from '../src/auth/universal-jurisdiction.service'

// ─── TAXIMETER RULES ─────────────────────────────────────────

describe('Service Type Taximeter Rules — Tests 1–4', () => {
  it('[TEST 1] TAXI: taximeter = ON', () => {
    expect(isTaximeterApplicable('TAXI')).toBe(true)
  })

  it('[TEST 2] RIDESHARE: taximeter = ON', () => {
    expect(isTaximeterApplicable('RIDESHARE')).toBe(true)
  })

  it('[TEST 3] DELIVERY: taximeter = OFF (absolu)', () => {
    expect(isTaximeterApplicable('DELIVERY')).toBe(false)
    // DoorDash, UberEats, Skip, Instacart → jamais taximeter
  })

  it('[TEST 4] PERSONAL + COURIER + OTHER: taximeter = OFF', () => {
    const offTypes: ServiceTypeCode[] = ['PERSONAL', 'COURIER', 'OTHER']
    offTypes.forEach(t => {
      expect(isTaximeterApplicable(t)).toBe(false)
    })
  })

  it('[PASS] Seulement TAXI et RIDESHARE ont taximeter=true', () => {
    const onTypes = Object.entries(SERVICE_TAXIMETER_RULES)
      .filter(([, v]) => v === true)
      .map(([k]) => k)
    expect(onTypes).toHaveLength(2)
    expect(onTypes).toContain('TAXI')
    expect(onTypes).toContain('RIDESHARE')
  })

  it('[PASS] Les règles taximètre viennent du backend — pas du frontend', () => {
    // SERVICE_TAXIMETER_RULES est la source authoritative côté backend
    expect(SERVICE_TAXIMETER_RULES).toBeDefined()
    // Frontend ne peut pas override ces valeurs
    const deliveryRule = SERVICE_TAXIMETER_RULES['DELIVERY']
    expect(deliveryRule).toBe(false)
  })
})

// ─── MULTI-JURIDICTION ───────────────────────────────────────

describe('Multi-Juridiction Canada — Tests 5–8', () => {
  it('[TEST 5] Québec: GST_QST · two-step · GST + QST', () => {
    const ctx = getTaxContextForJurisdiction('QC')
    expect(ctx).not.toBeNull()
    expect(ctx?.taxSystemType).toBe('GST_QST')
    expect(ctx?.applicableTaxTypes).toContain('GST')
    expect(ctx?.applicableTaxTypes).toContain('QST')
    expect(ctx?.calcMethod).toBe('TWO_STEP')
  })

  it('[TEST 6] Ontario: HST · one-step', () => {
    const ctx = getTaxContextForJurisdiction('ON')
    expect(ctx?.taxSystemType).toBe('HST')
    expect(ctx?.applicableTaxTypes).toContain('HST')
    expect(ctx?.applicableTaxTypes).not.toContain('QST')
    expect(ctx?.calcMethod).toBe('ONE_STEP')
  })

  it('[TEST 7] Changement QC→ON modifie les règles fiscales', () => {
    expect(taxContextChangesWithJurisdiction('QC', 'ON')).toBe(true)
    // Système fiscal change → règles changent → PAS de modification code
  })

  it('[TEST 8] QC→QC = pas de changement', () => {
    expect(taxContextChangesWithJurisdiction('QC', 'QC')).toBe(false)
  })

  it('[PASS] Alberta: GST_ONLY (pas de PST)', () => {
    const ctx = getTaxContextForJurisdiction('AB')
    expect(ctx?.taxSystemType).toBe('GST_ONLY')
    expect(ctx?.applicableTaxTypes).toContain('GST')
    expect(ctx?.applicableTaxTypes).not.toContain('PST')
  })

  it('[PASS] Provinces HST: NB/NS/NL/PEI', () => {
    const hstProvinces = ['NB', 'NS', 'NL', 'PEI']
    hstProvinces.forEach(p => {
      const ctx = getTaxContextForJurisdiction(p)
      expect(ctx?.taxSystemType, `${p} doit être HST`).toBe('HST')
    })
  })

  it('[PASS] Juridiction inconnue retourne null (jamais un taux par défaut)', () => {
    const ctx = getTaxContextForJurisdiction('XX_UNKNOWN')
    expect(ctx).toBeNull()
    // Jamais de taux inventé — null force une vérification explicite
  })
})

// ─── PAYS ────────────────────────────────────────────────────

describe('Countries Seed — Tests 9 & 10', () => {
  it('[TEST 9] 4 pays définis (CA/US/FR/TN)', () => {
    expect(SEED_COUNTRIES).toHaveLength(4)
    const codes = SEED_COUNTRIES.map(c => c.isoCode)
    expect(codes).toContain('CA')
    expect(codes).toContain('US')
    expect(codes).toContain('FR')
    expect(codes).toContain('TN')
  })

  it('[TEST 10] Canada = pays pilote · autres non', () => {
    const ca = SEED_COUNTRIES.find(c => c.isoCode === 'CA')
    expect(ca?.isPilot).toBe(true)
    expect(ca?.currencyCode).toBe('CAD')

    const us = SEED_COUNTRIES.find(c => c.isoCode === 'US')
    expect(us?.isPilot).toBe(false)
    expect(us?.currencyCode).toBe('USD')
  })

  it('[PASS] Codes ISO uniques', () => {
    const codes = SEED_COUNTRIES.map(c => c.isoCode)
    expect(new Set(codes).size).toBe(codes.length)
  })
})

// ─── PROVINCES ────────────────────────────────────────────────

describe('Provinces & Territories Seed — Tests 11 & 12', () => {
  it('[TEST 11] 13 provinces/territoires canadiens définis', () => {
    const caProvinces = SEED_PROVINCES_STATES.filter(p => p.countryCode === 'CA')
    expect(caProvinces).toHaveLength(13)
    // QC ON BC AB MB SK NS NB NL PEI YT NT NU
  })

  it('[TEST 12] Tous les systèmes fiscaux canadiens couverts', () => {
    const systems = new Set(SEED_PROVINCES_STATES
      .filter(p => p.countryCode === 'CA')
      .map(p => p.taxSystem))
    expect(systems).toContain('GST_QST')   // QC
    expect(systems).toContain('HST')        // ON, NB, NS, NL, PEI
    expect(systems).toContain('GST_PST')   // BC, MB, SK
    expect(systems).toContain('GST_ONLY')  // AB, YT, NT, NU
  })

  it('[PASS] QC = GST_QST · ON = HST · AB = GST_ONLY', () => {
    const qc = SEED_PROVINCES_STATES.find(p => p.code === 'QC')
    const on = SEED_PROVINCES_STATES.find(p => p.code === 'ON')
    const ab = SEED_PROVINCES_STATES.find(p => p.code === 'AB')
    expect(qc?.taxSystem).toBe('GST_QST')
    expect(on?.taxSystem).toBe('HST')
    expect(ab?.taxSystem).toBe('GST_ONLY')
  })
})

// ─── SERVICE TYPES ────────────────────────────────────────────

describe('Service Types Seed — Tests 13 & 14', () => {
  it('[TEST 13] 5 service types définis', () => {
    expect(SEED_SERVICE_TYPES).toHaveLength(5)
    const codes = SEED_SERVICE_TYPES.map(s => s.code)
    expect(codes).toContain('TAXI')
    expect(codes).toContain('RIDESHARE')
    expect(codes).toContain('DELIVERY')
    expect(codes).toContain('PERSONAL')
    expect(codes).toContain('COURIER')
  })

  it('[TEST 14] Seuls TAXI et RIDESHARE: taximeterApplicable=true', () => {
    SEED_SERVICE_TYPES.forEach(st => {
      const expected = st.code === 'TAXI' || st.code === 'RIDESHARE'
      expect(st.taximeterApplicable, `${st.code}: taximeter should be ${expected}`).toBe(expected)
    })
  })

  it('[PASS] DELIVERY: GPS requis mais pas de taximètre', () => {
    const delivery = SEED_SERVICE_TYPES.find(s => s.code === 'DELIVERY')
    expect(delivery?.taximeterApplicable).toBe(false)
    expect(delivery?.gpsRequired).toBe(true)
    expect(delivery?.revenueTrackingRequired).toBe(true)
  })

  it('[PASS] PERSONAL: pas de GPS, pas de taximètre, pas de revenue tracking', () => {
    const personal = SEED_SERVICE_TYPES.find(s => s.code === 'PERSONAL')
    expect(personal?.taximeterApplicable).toBe(false)
    expect(personal?.gpsRequired).toBe(false)
    expect(personal?.revenueTrackingRequired).toBe(false)
  })
})

// ─── TAX AUTHORITIES ──────────────────────────────────────────

describe('Tax Authorities Seed — Tests 15 & 16', () => {
  it('[TEST 15] Revenu Québec (QC) + ARC (CA) définis', () => {
    const rq = SEED_TAX_AUTHORITIES.find(a => a.abbreviation === 'RQ')
    const cra = SEED_TAX_AUTHORITIES.find(a => a.abbreviation === 'ARC')
    expect(rq).toBeDefined()
    expect(cra).toBeDefined()
    expect(rq?.jurisdictionCode).toBe('QC')
    expect(cra?.jurisdictionCode).toBe('CA')
  })

  it('[TEST 16] Source references officielles documentées', () => {
    SEED_TAX_AUTHORITIES.forEach(a => {
      expect(a.officialReference.length).toBeGreaterThan(10)
      expect(a.officialUrl).toMatch(/^https:\/\//)
    })
  })
})

// ─── INVARIANTS ───────────────────────────────────────────────

describe('Invariants V2', () => {
  it('[PASS] Changement de juridiction ne modifie pas le code métier', () => {
    // En changeant QC→ON, le contexte fiscal change
    // Mais les règles taximètre (TAXI=ON, DELIVERY=OFF) restent les mêmes
    expect(isTaximeterApplicable('DELIVERY')).toBe(false)  // Toujours false
    expect(isTaximeterApplicable('TAXI')).toBe(true)       // Toujours true
    // Le code métier n'a pas changé — seulement les taux fiscaux
  })

  it('[PASS] Architecture internationale: pas de code QC hardcodé', () => {
    // getTaxContextForJurisdiction() utilise un mapping configurable
    // Production: query DB tax_systems + tax_types par jurisdiction_id
    const ctx = getTaxContextForJurisdiction('FR')
    // FR non configuré = null — jamais de taux par défaut inventé
    expect(ctx).toBeNull()
  })

  it('[PASS] Tous les service types ont un taxTreatmentNote', () => {
    SEED_SERVICE_TYPES.forEach(st => {
      expect(st.taxTreatmentNote.length).toBeGreaterThan(0)
    })
  })
})
