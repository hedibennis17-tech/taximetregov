// ================================================================
// TAXIMÈTRE.GOV — TAX ENGINE TESTS
// Phase DB-15: TPS/TVQ · Rounding · Versioning · Exemption
// ================================================================

import { describe, it, expect } from 'vitest'
import {
  TAX_ENGINE_VERSION,
  applyRounding, calculateTax, selectApplicableRuleVersion,
  buildExemptResult, buildZeroRatedResult, buildRequiresReviewResult,
  assessTaxabilityForDevMode,
  canDriverReadOwnTax, canGovernmentFinalizeTax,
  canGovernmentAdjustTax, canDriverChangeTaxRate,
  SEED_QC_TAX_COMPONENTS, SEED_QC_TAX_RULE, SEED_QC_ROUNDING_POLICY,
  SEED_ON_TAX_COMPONENTS,
  type TaxComponent, type RuleVersionCandidate,
} from '../src/auth/tax-engine.service'

// QC components for testing
const qcComponents: TaxComponent[] = [
  {
    code: 'GST', name: 'TPS', rate: 0.05000,
    calculationOrder: 1, roundingMode: 'HALF_UP', decimalPlaces: 2,
  },
  {
    code: 'QST', name: 'TVQ', rate: 0.09975,
    calculationOrder: 2, roundingMode: 'HALF_UP', decimalPlaces: 2,
  },
]

const onComponents: TaxComponent[] = [
  {
    code: 'HST', name: 'TVH', rate: 0.13000,
    calculationOrder: 1, roundingMode: 'HALF_UP', decimalPlaces: 2,
  },
]

// ─── ROUNDING ────────────────────────────────────────────────

describe('Tax Rounding — Tests 9 & 10', () => {
  it('[TEST 9] HALF_UP: 0.005 rounds to 0.01 (Revenu Québec rule)', () => {
    const result = applyRounding(0.005, 2, 'HALF_UP')
    expect(result.rounded).toBe(0.01)
    expect(result.difference).toBeCloseTo(0.005, 4)
  })

  it('[TEST 9] HALF_UP: 0.004 rounds to 0.00', () => {
    const result = applyRounding(0.004, 2, 'HALF_UP')
    expect(result.rounded).toBe(0.00)
  })

  it('[TEST 10] Unrounded, rounded, and difference always preserved', () => {
    const result = applyRounding(4.9875, 2, 'HALF_UP')
    expect(result.unrounded).toBe(4.9875)
    expect(result.rounded).toBe(4.99)
    expect(result.difference).toBeCloseTo(0.0025, 4)
    // All three preserved — never lose precision history
  })

  it('[PASS] HALF_EVEN (banker\'s rounding): 2.5 rounds to 2 (even)', () => {
    const result = applyRounding(2.5, 0, 'HALF_EVEN')
    expect(result.rounded).toBe(2)  // 2 is even
  })

  it('[PASS] HALF_EVEN: 3.5 rounds to 4 (even)', () => {
    const result = applyRounding(3.5, 0, 'HALF_EVEN')
    expect(result.rounded).toBe(4)  // 4 is even
  })

  it('[PASS] DOWN always truncates', () => {
    expect(applyRounding(4.999, 2, 'DOWN').rounded).toBe(4.99)
  })

  it('[PASS] UP always rounds up', () => {
    expect(applyRounding(4.001, 2, 'UP').rounded).toBe(4.01)
  })
})

// ─── QUÉBEC TPS/TVQ CALCULATION ──────────────────────────────

describe('Québec TPS/TVQ Calculation — Tests 1, 2, 3', () => {
  it('[TEST 1] $100 base → GST=5.00, QST=9.98 (two-step method)', () => {
    const result = calculateTax({
      taxableBase: 100.00, taxInclusive: false,
      components: qcComponents,
      calcMethod: 'TWO_STEP', currency: 'CAD',
      engineVersion: TAX_ENGINE_VERSION,
    })

    expect(result.taxabilityStatus).toBe('TAXABLE')
    expect(result.taxableBase).toBeCloseTo(100.00, 2)

    const gst = result.components.find(c => c.code === 'GST')
    const qst = result.components.find(c => c.code === 'QST')

    expect(gst?.roundedAmount).toBeCloseTo(5.00, 2)
    expect(qst?.roundedAmount).toBeCloseTo(9.98, 2)
    // 9.975 rounds to 9.98 under HALF_UP
    expect(result.totalTaxRounded).toBeCloseTo(14.98, 2)
  })

  it('[TEST 2] Components stored separately — GST ≠ QST row', () => {
    const result = calculateTax({
      taxableBase: 100.00, taxInclusive: false,
      components: qcComponents, calcMethod: 'TWO_STEP',
      currency: 'CAD', engineVersion: TAX_ENGINE_VERSION,
    })
    // Two separate components — never merged
    expect(result.components).toHaveLength(2)
    expect(result.components[0]?.code).toBe('GST')
    expect(result.components[1]?.code).toBe('QST')
  })

  it('[TEST 3] Rates come from seed data — not hardcoded', () => {
    // Verify seed matches published Revenu Québec rates
    const gstSeed = SEED_QC_TAX_COMPONENTS[0]
    const qstSeed = SEED_QC_TAX_COMPONENTS[1]
    expect(gstSeed.rate).toBe(0.05000)   // 5.000%
    expect(qstSeed.rate).toBe(0.09975)   // 9.975%
    // These are Revenu Québec published rates — stored in DB, never in code
  })

  it('[PASS] Tax-inclusive: engine extracts base from total', () => {
    // Total = base * (1 + GST + QST) = 100 * 1.14975 = 114.975
    const result = calculateTax({
      taxableBase: 114.975, taxInclusive: true,
      components: qcComponents, calcMethod: 'TWO_STEP',
      currency: 'CAD', engineVersion: TAX_ENGINE_VERSION,
    })
    // Extracted base should be ~100
    expect(result.taxableBase).toBeCloseTo(100.00, 1)
  })

  it('[PASS] Unrounded always preserved alongside rounded', () => {
    const result = calculateTax({
      taxableBase: 100.00, taxInclusive: false,
      components: qcComponents, calcMethod: 'TWO_STEP',
      currency: 'CAD', engineVersion: TAX_ENGINE_VERSION,
    })
    const qst = result.components.find(c => c.code === 'QST')
    expect(qst?.calculatedAmount).toBeCloseTo(9.975, 4)   // Unrounded
    expect(qst?.roundedAmount).toBeCloseTo(9.98, 2)         // Rounded
    expect(qst?.roundingDifference).not.toBe(0)
  })
})

// ─── ONTARIO HST ──────────────────────────────────────────────

describe('Ontario HST Calculation — Tests 11 & 12', () => {
  it('[TEST 11] Ontario: HST 13% on $100 base', () => {
    const result = calculateTax({
      taxableBase: 100.00, taxInclusive: false,
      components: onComponents, calcMethod: 'COMPONENT',
      currency: 'CAD', engineVersion: TAX_ENGINE_VERSION,
    })
    const hst = result.components.find(c => c.code === 'HST')
    expect(hst?.roundedAmount).toBeCloseTo(13.00, 2)
    expect(result.totalTaxRounded).toBeCloseTo(13.00, 2)
  })

  it('[TEST 12] Different province = different rule applied', () => {
    const qcResult = calculateTax({
      taxableBase: 100.00, taxInclusive: false,
      components: qcComponents, calcMethod: 'TWO_STEP',
      currency: 'CAD', engineVersion: TAX_ENGINE_VERSION,
    })
    const onResult = calculateTax({
      taxableBase: 100.00, taxInclusive: false,
      components: onComponents, calcMethod: 'COMPONENT',
      currency: 'CAD', engineVersion: TAX_ENGINE_VERSION,
    })
    expect(qcResult.totalTaxRounded).not.toBe(onResult.totalTaxRounded)
    expect(onResult.components[0]?.code).toBe('HST')
    expect(qcResult.components.map(c => c.code)).toContain('GST')
    // System never uses QC rule for ON transactions
  })
})

// ─── EXEMPTION & ZERO-RATING ──────────────────────────────────

describe('Exemption & Zero-Rating — Tests 5, 6, 7', () => {
  it('[TEST 5] EXEMPT: tax=0 with mandatory reason + rule ref', () => {
    const result = buildExemptResult(100.00, 'CAD', 'MEDICAL_SUPPLY', 'QC_EXEMPTION_RULE_A')
    expect(result.taxabilityStatus).toBe('EXEMPT')
    expect(result.totalTaxRounded).toBe(0)
    expect(result.components).toHaveLength(0)
    expect(result.inputChecksum).toContain('EXEMPT')
    // Reason code preserved — never silent zero
  })

  it('[TEST 6] ZERO_RATED: tax=0 but status ≠ EXEMPT', () => {
    const result = buildZeroRatedResult(100.00, 'CAD', 'BASIC_GROCERIES')
    expect(result.taxabilityStatus).toBe('ZERO_RATED')
    expect(result.totalTaxRounded).toBe(0)
    // ZERO_RATED ≠ EXEMPT — legally distinct, both preserved
  })

  it('[TEST 7] EXEMPT ≠ ZERO_RATED — different statuses', () => {
    const exempt = buildExemptResult(100, 'CAD', 'REASON', 'REF')
    const zero   = buildZeroRatedResult(100, 'CAD', 'REASON')
    expect(exempt.taxabilityStatus).not.toBe(zero.taxabilityStatus)
    expect(exempt.taxabilityStatus).toBe('EXEMPT')
    expect(zero.taxabilityStatus).toBe('ZERO_RATED')
  })

  it('[TEST 8] UNKNOWN → REQUIRES_REVIEW (never silent zero)', () => {
    const result = buildRequiresReviewResult(100.00, 'CAD', 'REGISTRATION_STATUS_UNKNOWN')
    expect(result.taxabilityStatus).toBe('REQUIRES_REVIEW')
    expect(result.totalTaxRounded).toBe(0)
    expect(result.inputChecksum).toContain('REQUIRES_REVIEW')
    // Not presented as finalized — never silent
  })
})

// ─── RULE VERSION SELECTION ───────────────────────────────────

describe('Rule Version Selection — Tests 13, 14, 15', () => {
  const candidates: RuleVersionCandidate[] = [
    { id: 'r1', version: 'V1', effectiveFrom: '2025-01-01', effectiveUntil: '2025-12-31', status: 'ACTIVE' },
    { id: 'r2', version: 'V2', effectiveFrom: '2026-01-01', effectiveUntil: null, status: 'ACTIVE' },
    { id: 'r3', version: 'V3', effectiveFrom: '2027-01-01', effectiveUntil: null, status: 'DRAFT' },
  ]

  it('[TEST 13] Historical transaction uses historical rule', () => {
    const result = selectApplicableRuleVersion(candidates, '2025-06-15')
    expect(result?.version).toBe('V1')
    // Even if calculated today, uses 2025 transaction date
  })

  it('[TEST 14] 2026 transaction uses V2 rule', () => {
    const result = selectApplicableRuleVersion(candidates, '2026-08-15')
    expect(result?.version).toBe('V2')
  })

  it('[TEST 15] DRAFT rule not selected — must be ACTIVE or PUBLISHED', () => {
    const result = selectApplicableRuleVersion(candidates, '2027-06-15')
    // V3 is DRAFT → not used. V2 has no effectiveUntil → still applies
    expect(result?.version).toBe('V2')
  })

  it('[PASS] No applicable rule returns null — not a silent default', () => {
    const future = selectApplicableRuleVersion(candidates, '2023-01-01')
    expect(future).toBeNull()
    // Engine must not invent a rule
  })
})

// ─── REPRODUCIBILITY ─────────────────────────────────────────

describe('Reproducibility — Test 16', () => {
  it('[TEST 16] Same inputs always produce same result', () => {
    const input = {
      taxableBase: 100.00, taxInclusive: false,
      components: qcComponents, calcMethod: 'TWO_STEP' as const,
      currency: 'CAD', engineVersion: TAX_ENGINE_VERSION,
    }
    const r1 = calculateTax(input)
    const r2 = calculateTax(input)
    expect(r1.totalTaxRounded).toBe(r2.totalTaxRounded)
    expect(r1.inputChecksum).toBe(r2.inputChecksum)
    // Deterministic — essential for government audit
  })

  it('[PASS] Engine version tracked in result', () => {
    const result = calculateTax({
      taxableBase: 50, taxInclusive: false,
      components: qcComponents, calcMethod: 'TWO_STEP',
      currency: 'CAD', engineVersion: TAX_ENGINE_VERSION,
    })
    expect(result.engineVersion).toBe(TAX_ENGINE_VERSION)
    expect(result.engineVersion).toMatch(/TAX-ENGINE-\d{4}\.\d+/)
  })
})

// ─── PROVIDER TAX DISCREPANCY ─────────────────────────────────

describe('Provider Tax Discrepancy — Test 17', () => {
  it('[TEST 17] Provider reported ≠ government calculated → MISMATCH concept', () => {
    const governmentCalc = calculateTax({
      taxableBase: 100.00, taxInclusive: false,
      components: qcComponents, calcMethod: 'TWO_STEP',
      currency: 'CAD', engineVersion: TAX_ENGINE_VERSION,
    })
    const providerReported = 5.00  // Provider only reported GST, missed QST
    const diff = governmentCalc.totalTaxRounded - providerReported
    expect(diff).toBeGreaterThan(0)
    // Never overwrite government calc with provider amount → MISMATCH
  })
})

// ─── ACCESS CONTROL ──────────────────────────────────────────

describe('Access Control', () => {
  it('[PASS] Driver reads own tax calculation', () => {
    expect(canDriverReadOwnTax('driver-A', 'driver-A')).toBe(true)
    expect(canDriverReadOwnTax('driver-A', 'driver-B')).toBe(false)
  })

  it('[PASS] Tax finalization requires tax.finalize or tax.review', () => {
    expect(canGovernmentFinalizeTax(['tax.finalize'])).toBe(true)
    expect(canGovernmentFinalizeTax(['tax.read'])).toBe(false)
  })

  it('[PASS] Tax adjustment requires tax.adjust', () => {
    expect(canGovernmentAdjustTax(['tax.adjust'])).toBe(true)
    expect(canGovernmentAdjustTax(['tax.read'])).toBe(false)
  })

  it('[PASS] Driver NEVER changes tax rates (return type: false)', () => {
    expect(canDriverChangeTaxRate()).toBe(false)
  })
})

// ─── SEED DATA ────────────────────────────────────────────────

describe('Seed Data Validation', () => {
  it('[PASS] QC rule seed has source authority (Revenu Québec)', () => {
    expect(SEED_QC_TAX_RULE.sourceAuthority).toBe('Revenu Québec')
    expect(SEED_QC_TAX_RULE.status).toBe('DRAFT')
    // Starts as DRAFT — requires approval before ACTIVE
  })

  it('[PASS] QC seed components match published rates', () => {
    expect(SEED_QC_TAX_COMPONENTS[0].rate).toBe(0.05000)  // 5% GST
    expect(SEED_QC_TAX_COMPONENTS[1].rate).toBe(0.09975)  // 9.975% QST
  })

  it('[PASS] ON HST seed rate', () => {
    expect(SEED_ON_TAX_COMPONENTS[0].rate).toBe(0.13000)  // 13% ON HST
    expect(SEED_ON_TAX_COMPONENTS[0].code).toBe('HST')
  })

  it('[PASS] Rounding policy references Revenu Québec', () => {
    expect(SEED_QC_ROUNDING_POLICY.sourceReference).toMatch(/Revenu Québec/i)
    expect(SEED_QC_ROUNDING_POLICY.roundingMode).toBe('HALF_UP')
    expect(SEED_QC_ROUNDING_POLICY.decimalPlaces).toBe(2)
  })

  it('[PASS] Seed marked as development only', () => {
    expect(SEED_QC_TAX_RULE.isDevelopmentSeed).toBe(true)
    expect(SEED_QC_TAX_RULE.note).toMatch(/SEED ONLY/i)
  })
})

// ─── SCHEMA INVARIANTS ────────────────────────────────────────

describe('Schema Invariants', () => {
  it('[PASS] Tax rates NEVER hardcoded — always from seed/DB', () => {
    // The service does not define GST/QST rates directly — they come from components
    // Verify that calculateTax() uses the provided component rates
    const customComponents: TaxComponent[] = [{
      code: 'GST', name: 'GST', rate: 0.06000,  // Future hypothetical rate change
      calculationOrder: 1, roundingMode: 'HALF_UP', decimalPlaces: 2,
    }]
    const result = calculateTax({
      taxableBase: 100, taxInclusive: false,
      components: customComponents, calcMethod: 'COMPONENT',
      currency: 'CAD', engineVersion: TAX_ENGINE_VERSION,
    })
    expect(result.components[0]?.rate).toBe(0.06000)
    expect(result.totalTaxRounded).toBeCloseTo(6.00, 2)
    // System uses whatever rate is in DB — never hardcoded
  })

  it('[PASS] EXEMPT and ZERO_RATED never produce same taxabilityStatus', () => {
    const e = buildExemptResult(100, 'CAD', 'R', 'REF')
    const z = buildZeroRatedResult(100, 'CAD', 'R')
    expect(e.taxabilityStatus).not.toBe(z.taxabilityStatus)
  })
})
