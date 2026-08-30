// ================================================================
// TAXIMÈTRE.GOV — TAX ENGINE SERVICE
// Phase DB-15: Versioned TPS/TVQ · GST/HST · Rounding · Reproducibility
// ================================================================
//
// PRINCIPE: Les taux fiscaux viennent TOUJOURS des tax_components en DB
// JAMAIS hardcodés dans le code
// Revenu Québec: GST 5% + TVQ 9.975% (méthode deux étapes ou taux combiné 14.975%)

import { createHash } from 'crypto'

// ─── CALCULATION ENGINE VERSION ───────────────────────────────

export const TAX_ENGINE_VERSION = 'TAX-ENGINE-2026.1'

// ─── TAXABILITY STATUS ───────────────────────────────────────

export type TaxabilityStatus =
  | 'TAXABLE'
  | 'ZERO_RATED'      // Rate=0 but still a taxable supply legally
  | 'EXEMPT'          // Not a taxable supply — different from zero-rated
  | 'OUT_OF_SCOPE'    // Outside the tax system
  | 'UNKNOWN'         // Cannot determine
  | 'REQUIRES_REVIEW'

// Activity types that are generally taxable (from tax rule perspective)
// NEVER hard-coded in production — comes from tax_rule_conditions in DB
// This is only for testing/development reference
export const DEV_TAXABLE_ACTIVITY_TYPES = new Set([
  'TAXI_TRIP',
  'RIDESHARE_TRIP',
  'FOOD_DELIVERY',
  'GROCERY_DELIVERY',
  'PARCEL_DELIVERY',
  'COURIER',
])

export function assessTaxabilityForDevMode(
  activityTypeCode:   string,
  driverRegStatus:    string,
): TaxabilityStatus {
  // DEVELOPMENT ONLY — production uses tax_rule_conditions from DB
  if (!DEV_TAXABLE_ACTIVITY_TYPES.has(activityTypeCode)) {
    return 'UNKNOWN'
  }
  if (driverRegStatus === 'NOT_REGISTERED') return 'UNKNOWN'
  if (driverRegStatus === 'REGISTERED') return 'TAXABLE'
  if (driverRegStatus === 'REQUIRES_VERIFICATION') return 'REQUIRES_REVIEW'
  return 'UNKNOWN'
}

// ─── TAX COMPONENT DEFINITION ────────────────────────────────

export interface TaxComponent {
  code:             string     // 'GST' | 'QST' | 'HST'
  name:             string
  rate:             number     // Decimal: 0.05 for 5%
  calculationOrder: number
  roundingMode:     'HALF_UP' | 'HALF_EVEN' | 'DOWN' | 'UP'
  decimalPlaces:    number
}

// ─── ROUNDING ────────────────────────────────────────────────

export function applyRounding(
  value:         number,
  decimalPlaces: number,
  mode:          'HALF_UP' | 'HALF_EVEN' | 'DOWN' | 'UP' = 'HALF_UP',
): {
  rounded:    number
  unrounded:  number
  difference: number
} {
  const factor = Math.pow(10, decimalPlaces)
  let rounded: number

  switch (mode) {
    case 'HALF_UP':
      rounded = Math.round(value * factor) / factor
      break
    case 'HALF_EVEN': {
      // Banker's rounding
      const floored = Math.floor(value * factor)
      const diff = value * factor - floored
      if (Math.abs(diff - 0.5) < 1e-10) {
        rounded = (floored % 2 === 0 ? floored : floored + 1) / factor
      } else {
        rounded = Math.round(value * factor) / factor
      }
      break
    }
    case 'DOWN':
      rounded = Math.floor(value * factor) / factor
      break
    case 'UP':
      rounded = Math.ceil(value * factor) / factor
      break
    default:
      rounded = Math.round(value * factor) / factor
  }

  const difference = parseFloat((rounded - value).toFixed(decimalPlaces + 4))
  return { rounded, unrounded: value, difference }
}

// ─── TAX CALCULATION ──────────────────────────────────────────

export interface TaxCalculationInput {
  taxableBase:       number     // Amount to calculate tax on
  taxInclusive:      boolean    // Is taxableBase inclusive of tax?
  components:        TaxComponent[]
  calcMethod:        'TWO_STEP' | 'ONE_STEP' | 'COMPONENT' | 'INCLUSIVE'
  currency:          string
  engineVersion:     string
}

export interface ComponentResult {
  code:             string
  name:             string
  rate:             number
  taxableBase:      number
  calculatedAmount: number     // Unrounded — always preserved
  roundedAmount:    number     // After rounding
  roundingDifference: number
  calculationOrder: number
}

export interface TaxCalculationResult {
  taxabilityStatus: TaxabilityStatus
  taxableBase:      number
  taxInclusive:     boolean
  components:       ComponentResult[]
  totalTaxUnrounded: number
  totalTaxRounded:   number
  roundingDifference: number
  currency:          string
  engineVersion:     string
  calcMethod:        string
  inputChecksum:     string   // For reproducibility verification
}

export function calculateTax(input: TaxCalculationInput): TaxCalculationResult {
  const { taxableBase: rawBase, taxInclusive, components, calcMethod, currency } = input

  // Sort components by calculation order
  const sorted = [...components].sort((a, b) => a.calculationOrder - b.calculationOrder)

  let effectiveBase = rawBase

  // For tax-inclusive: extract base first
  if (taxInclusive && calcMethod !== 'INCLUSIVE') {
    // Sum of rates applied to base = total tax ratio
    const totalRateRatio = sorted.reduce((sum, c) => sum + c.rate, 0)
    effectiveBase = rawBase / (1 + totalRateRatio)
  }

  const componentResults: ComponentResult[] = []
  let totalTaxUnrounded = 0

  for (const component of sorted) {
    // TWO_STEP: each component applies to the base (Québec method)
    // ONE_STEP: combined rate applied once
    // COMPONENT: each independent
    const componentBase = effectiveBase
    const calculated = componentBase * component.rate

    const { rounded, unrounded, difference } = applyRounding(
      calculated, component.decimalPlaces, component.roundingMode
    )

    componentResults.push({
      code:              component.code,
      name:              component.name,
      rate:              component.rate,
      taxableBase:       componentBase,
      calculatedAmount:  unrounded,
      roundedAmount:     rounded,
      roundingDifference: difference,
      calculationOrder:  component.calculationOrder,
    })

    totalTaxUnrounded += calculated
  }

  const { rounded: totalRounded, difference: totalDiff } = applyRounding(
    totalTaxUnrounded, 2, 'HALF_UP'
  )

  // Input checksum for reproducibility audit
  const inputChecksum = createHash('sha256')
    .update(JSON.stringify({
      base: rawBase, inclusive: taxInclusive,
      components: sorted.map(c => ({ code: c.code, rate: c.rate })),
      method: calcMethod, engine: input.engineVersion,
    }))
    .digest('hex')
    .slice(0, 16)

  return {
    taxabilityStatus: 'TAXABLE',
    taxableBase:       effectiveBase,
    taxInclusive,
    components:        componentResults,
    totalTaxUnrounded,
    totalTaxRounded:   totalRounded,
    roundingDifference: totalDiff,
    currency,
    engineVersion:     input.engineVersion,
    calcMethod,
    inputChecksum,
  }
}

// ─── QC SEED RULE DATA (development reference) ───────────────
// Real rates published by Revenu Québec
// MUST be stored in DB tax_components — NEVER hardcoded in app logic

export const SEED_QC_ROUNDING_POLICY = {
  code:          'CAD_RQ_STANDARD',
  name:          'Revenu Québec standard — CAD arrondi au cent',
  currency:      'CAD',
  decimalPlaces: 2,
  roundingMode:  'HALF_UP',
  minimumUnit:   0.01,
  sourceReference: 'Revenu Québec — Guide de perception de la TVQ et de la TPS/TVH',
} as const

export const SEED_QC_TAX_RULE = {
  code:           'QC_TPS_TVQ',
  version:        'QC-TPS-TVQ-2026-V1',
  label:          'Règle TPS/TVQ Québec — 2026',
  taxSystem:      'GST_QST',
  effectiveFrom:  '2026-01-01',
  effectiveUntil: null,         // Still in effect
  status:         'DRAFT',      // Must go through DRAFT→APPROVED→ACTIVE
  sourceAuthority: 'Revenu Québec',
  sourceReference: 'Guide de perception de la TVQ et de la TPS/TVH, Revenu Québec',
  // Rates from Revenu Québec:
  tpsRate:  0.05000,   // 5.000% GST
  tvqRate:  0.09975,   // 9.975% QST (TVQ)
  // Combined: 14.975% (one-step method reference)
  isDevelopmentSeed: true,
  note: 'SEED ONLY — requires government approval before ACTIVE status in production',
} as const

export const SEED_QC_TAX_COMPONENTS = [
  {
    code:             'GST',
    name:             'Goods and Services Tax (TPS)',
    nameFr:           'Taxe sur les produits et services (TPS)',
    nameEn:           'Goods and Services Tax (GST)',
    componentType:    'GST',
    rate:             0.05000,
    calculationOrder: 1,
    compoundOnComponentId: null,
    sourceReference:  'Loi sur la taxe d\'accise — Partie IX',
    isDev:            true,
  },
  {
    code:             'QST',
    name:             'Québec Sales Tax (TVQ)',
    nameFr:           'Taxe de vente du Québec (TVQ)',
    nameEn:           'Québec Sales Tax (QST)',
    componentType:    'QST',
    rate:             0.09975,
    calculationOrder: 2,
    compoundOnComponentId: null,
    // Note: Under two-step method, QST applies to taxable price (= base)
    // Under one-step: 14.975% applied once
    // DB stores the rule; engine follows Revenu Québec guidance
    sourceReference:  'Loi sur la taxe de vente du Québec — Revenu Québec',
    isDev:            true,
  },
] as const

export const SEED_ON_TAX_COMPONENTS = [
  {
    code:             'HST',
    name:             'Harmonized Sales Tax (HST)',
    nameFr:           'Taxe de vente harmonisée (TVH)',
    nameEn:           'Harmonized Sales Tax (HST)',
    componentType:    'HST',
    rate:             0.13000,   // Ontario 13%
    calculationOrder: 1,
    sourceReference:  'Excise Tax Act — Part IX (harmonized provincial arrangements)',
    isDev:            true,
  },
] as const

// ─── EFFECTIVE RULE SELECTION ─────────────────────────────────

export interface RuleVersionCandidate {
  id:             string
  version:        string
  effectiveFrom:  string   // ISO date
  effectiveUntil: string | null
  status:         string
}

export function selectApplicableRuleVersion(
  candidates:         RuleVersionCandidate[],
  transactionDateStr: string,  // ISO date of the transaction
): RuleVersionCandidate | null {
  // CRITICAL: uses transaction effective date, NOT today
  const txDate = new Date(transactionDateStr)

  const applicable = candidates.filter(r => {
    if (r.status !== 'ACTIVE' && r.status !== 'PUBLISHED') return false
    const from = new Date(r.effectiveFrom)
    const until = r.effectiveUntil ? new Date(r.effectiveUntil) : null
    const fromOk = txDate >= from
    const untilOk = until === null || txDate <= until
    return fromOk && untilOk
  })

  if (applicable.length === 0) return null

  // If multiple match (shouldn't happen with proper constraints), take most recent
  return applicable.sort(
    (a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()
  )[0] ?? null
}

// ─── EXEMPT/ZERO-RATED HELPERS ────────────────────────────────

export function buildExemptResult(
  taxableBase: number,
  currency:    string,
  reasonCode:  string,
  ruleRef:     string,
): TaxCalculationResult {
  return {
    taxabilityStatus:  'EXEMPT',
    taxableBase,
    taxInclusive:      false,
    components:        [],
    totalTaxUnrounded: 0,
    totalTaxRounded:   0,
    roundingDifference: 0,
    currency,
    engineVersion:     TAX_ENGINE_VERSION,
    calcMethod:        'COMPONENT',
    inputChecksum:     `EXEMPT:${reasonCode}`,
  }
}

export function buildZeroRatedResult(
  taxableBase: number,
  currency:    string,
  reasonCode:  string,
): TaxCalculationResult {
  // Zero-rated ≠ Exempt — both recorded but legally distinct
  return {
    taxabilityStatus:  'ZERO_RATED',
    taxableBase,
    taxInclusive:      false,
    components:        [],
    totalTaxUnrounded: 0,
    totalTaxRounded:   0,
    roundingDifference: 0,
    currency,
    engineVersion:     TAX_ENGINE_VERSION,
    calcMethod:        'COMPONENT',
    inputChecksum:     `ZERO_RATED:${reasonCode}`,
  }
}

export function buildRequiresReviewResult(
  taxableBase: number,
  currency:    string,
  reason:      string,
): TaxCalculationResult {
  // UNKNOWN → REQUIRES_REVIEW — never silent zero
  return {
    taxabilityStatus:  'REQUIRES_REVIEW',
    taxableBase,
    taxInclusive:      false,
    components:        [],
    totalTaxUnrounded: 0,
    totalTaxRounded:   0,
    roundingDifference: 0,
    currency,
    engineVersion:     TAX_ENGINE_VERSION,
    calcMethod:        'COMPONENT',
    inputChecksum:     `REQUIRES_REVIEW:${reason}`,
  }
}

// ─── ACCESS CONTROL ──────────────────────────────────────────

export function canDriverReadOwnTax(
  requestorDriverId: string,
  calcDriverId:      string,
): boolean {
  return requestorDriverId === calcDriverId
}

export function canGovernmentFinalizeTax(permissions: string[]): boolean {
  return permissions.includes('tax.finalize') || permissions.includes('tax.review')
}

export function canGovernmentAdjustTax(permissions: string[]): boolean {
  return permissions.includes('tax.adjust')
}

export function canDriverChangeTaxRate(): false {
  // Drivers NEVER change tax rates — absolute rule
  return false
}
