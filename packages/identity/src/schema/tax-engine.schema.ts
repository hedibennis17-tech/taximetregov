// ================================================================
// TAXIMÈTRE.GOV — TAX ENGINE SCHEMA
// Database Phase 15/20 — TPS/TVQ · GST/HST · Versioned Tax Rules
// ================================================================
//
// REUSE FROM PRE-DB10:
//   jurisdictions       → tax_jurisdictions source
//   tax_rule_sets       → rates + approval chain (tpsRate, tvqRate, etc.)
//   tax_calculations    → period-level aggregates
//   tax_periods         → fiscal periods
//   tax_accounts        → driver tax account
//
// DB-15 ADDS:
//   tax_components           → GST/QST/HST as separate rows
//   tax_rule_conditions      → extensible rule logic
//   transaction_tax_calculations → per-transaction tax (not period)
//   tax_calculation_components   → per-component results
//   tax_rounding_policies    → CAD rounding rules
//   tax_driver_registrations → driver TPS/TVQ registration
//   tax_adjustments          → corrections/reversals
//   tax_reconciliations      → govt calc vs provider reported
//
// RÈGLES ABSOLUES:
// 1. Tax rates JAMAIS hardcodés → toujours dans tax_components
// 2. Historical calculations: immutables (liées à rule version applicable)
// 3. Calculated_amount + rounded_amount + rounding_difference toujours conservés
// 4. EXEMPT ≠ ZERO_RATED → statut distinct obligatoire
// 5. UNKNOWN → REQUIRES_REVIEW · jamais zéro silencieux
// 6. provider_reported_tax ≠ government_calculated_tax → conservés séparément
// 7. Amounts: NUMERIC(19,4) pour calculs intermédiaires · NUMERIC(12,2) pour finaux
// 8. Rule versioning: DRAFT→APPROVED→ACTIVE · PUBLISHED=immuable
// 9. Reversal: original immuable · reversal entries séparées
// ================================================================

import {
  pgTable, pgEnum, uuid, text, boolean, integer,
  timestamp, jsonb, uniqueIndex, index, varchar,
  numeric, date, smallint,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { users }           from './auth.schema'
import { driverProfiles }  from './profiles.schema'
import { jurisdictions, taxRuleSets } from './pre-db10.schema'
import { driverActivities }           from './activities.schema'

// ─── ENUMS ───────────────────────────────────────────────────

export const taxSystemEnum = pgEnum('tax_system', [
  'GST_QST',    // Québec
  'HST',        // ON, NB, NS, NL, PEI
  'GST_PST',    // BC, MB, SK
  'GST_ONLY',   // AB, territories
  'OTHER',
])

export const taxComponentTypeEnum = pgEnum('tax_component_type', [
  'GST',   // Federal Goods and Services Tax
  'QST',   // Québec Sales Tax (TVQ)
  'HST',   // Harmonized Sales Tax
  'PST',   // Provincial Sales Tax
  'OTHER',
])

export const taxabilityStatusEnum = pgEnum('taxability_status', [
  'TAXABLE',
  'ZERO_RATED',     // Rate = 0% but still "taxable supply" in law
  'EXEMPT',         // Not a taxable supply — different legal treatment from zero-rated
  'OUT_OF_SCOPE',   // Outside the tax system (e.g. non-supply)
  'UNKNOWN',        // Cannot determine — requires review
  'REQUIRES_REVIEW',
])

export const txTaxCalcStatusEnum = pgEnum('tx_tax_calc_status', [
  'PENDING',
  'CALCULATED',
  'REVIEW_REQUIRED',
  'FINALIZED',
  'VOIDED',
  'REVERSED',
])

export const taxCalcMethodEnum = pgEnum('tax_calc_method', [
  'TWO_STEP',    // Québec: GST first, then QST on taxable price (common method)
  'ONE_STEP',    // Combined rate applied once (14.975% for QC)
  'COMPONENT',   // Each component calculated independently
  'INCLUSIVE',   // Tax-inclusive — engine extracts from total
  'OTHER',
])

export const roundingModeEnum = pgEnum('rounding_mode', [
  'HALF_UP',      // Standard: 0.005 rounds up
  'HALF_EVEN',    // Banker's rounding
  'DOWN',
  'UP',
  'HALF_DOWN',
])

export const driverTaxRegStatusEnum = pgEnum('driver_tax_reg_status', [
  'NOT_REGISTERED',
  'PENDING',
  'REGISTERED',
  'SUSPENDED',
  'CANCELLED',
  'UNKNOWN',
  'REQUIRES_VERIFICATION',
])

export const driverTaxRegTypeEnum = pgEnum('driver_tax_reg_type', [
  'GST',   // Federal
  'QST',   // Québec TVQ
  'HST',   // Ontario/Maritime
  'OTHER',
])

export const taxReconciliationStatusEnum = pgEnum('tax_reconciliation_status', [
  'MATCHED',
  'MINOR_DIFFERENCE',
  'MISMATCH',
  'UNDER_REVIEW',
  'RESOLVED',
])

export const taxAdjustmentTypeEnum = pgEnum('tax_adjustment_type', [
  'PROVIDER_ADJUSTMENT',
  'GOVERNMENT_CORRECTION',
  'ROUNDING_CORRECTION',
  'REFUND',
  'REVERSAL',
  'INPUT_TAX_CREDIT',
  'INPUT_TAX_REFUND',
  'OTHER',
])

// ─── TAX ROUNDING POLICIES ───────────────────────────────────

export const taxRoundingPolicies = pgTable('tax_rounding_policies', {
  id:   uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 30 }).notNull().unique(),
  // e.g. 'CAD_STANDARD', 'QC_RQ_STANDARD'

  name:              varchar('name',       { length: 100 }).notNull(),
  currency:          varchar('currency',   { length: 3   }).notNull().default('CAD'),
  decimalPlaces:     smallint('decimal_places').notNull().default(2),
  roundingMode:      roundingModeEnum('rounding_mode').notNull().default('HALF_UP'),
  // Revenu Québec: fractions ≥ $0.005 arrondies au cent entier
  minimumUnit:       numeric('minimum_unit', { precision: 8, scale: 4 }),
  // 0.01 for CAD cents

  sourceReference: text('source_reference'),
  // Reference to Revenu Québec publication or CRA guide

  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_rounding_policy_code').on(t.code),
])

// ─── TAX COMPONENTS ───────────────────────────────────────────
// Individual tax components within a rule set
// GST and QST are separate components — never merged into one

export const taxComponents = pgTable('tax_components', {
  id:           uuid('id').primaryKey().defaultRandom(),
  taxRuleSetId: uuid('tax_rule_set_id').notNull()
    .references(() => taxRuleSets.id, { onDelete: 'restrict' }),

  code:          varchar('code', { length: 20 }).notNull(),
  // 'GST' | 'QST' | 'HST'
  name:          varchar('name', { length: 100 }).notNull(),
  nameFr:        varchar('name_fr', { length: 100 }),
  nameEn:        varchar('name_en', { length: 100 }),
  componentType: taxComponentTypeEnum('component_type').notNull(),

  // Rate — NUMERIC(8,5) for up to 99.999% with 3 decimal precision
  rate: numeric('rate', { precision: 8, scale: 5 }).notNull(),
  // e.g. 0.05000 for 5% GST · 0.09975 for 9.975% QST

  // Calculation order and compounding
  calculationOrder: integer('calculation_order').notNull().default(1),
  // GST = 1, QST = 2 (QST calculated on taxable price which may include GST effect)

  // Which component does this compound on (if any)
  compoundOnComponentId: uuid('compound_on_component_id'),
  // QST in Québec: calculated on taxable sale price under the two-step method
  // DB stores the rule — implementation follows Revenu Québec guidance

  roundingPolicyId: uuid('rounding_policy_id')
    .references(() => taxRoundingPolicies.id),

  isActive:  boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_tax_component_unique').on(t.taxRuleSetId, t.code),
  index('idx_tax_component_rule_set').on(t.taxRuleSetId),
  index('idx_tax_component_type').on(t.componentType),
  index('idx_tax_component_order').on(t.calculationOrder),
])

// ─── TAX RULE CONDITIONS ──────────────────────────────────────
// Extensible conditions for tax rule applicability

export const taxRuleConditions = pgTable('tax_rule_conditions', {
  id:           uuid('id').primaryKey().defaultRandom(),
  taxRuleSetId: uuid('tax_rule_set_id').notNull()
    .references(() => taxRuleSets.id, { onDelete: 'cascade' }),

  conditionType: varchar('condition_type', { length: 50 }).notNull(),
  // 'ACTIVITY_TYPE' | 'PROVIDER_TYPE' | 'JURISDICTION' | 'SUPPLY_LOCATION'
  // | 'DRIVER_REGISTRATION_STATUS' | 'TAX_REGISTRATION_STATUS'
  // | 'DATE_RANGE' | 'PAYMENT_TYPE' | 'OTHER'

  conditionCode: varchar('condition_code', { length: 100 }).notNull(),
  // The specific value to match or check

  operator: varchar('operator', { length: 20 }).notNull().default('EQUALS'),
  // 'EQUALS' | 'NOT_EQUALS' | 'IN' | 'NOT_IN' | 'BEFORE' | 'AFTER'

  value: text('value'),
  // The comparison value — stored as text, interpreted by engine

  priority:  integer('priority').notNull().default(100),
  // Lower = higher priority in evaluation

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_tax_condition_rule_set').on(t.taxRuleSetId),
  index('idx_tax_condition_type').on(t.conditionType),
])

// ─── DRIVER TAX REGISTRATIONS ─────────────────────────────────

export const taxDriverRegistrations = pgTable('tax_driver_registrations', {
  id:       uuid('id').primaryKey().defaultRandom(),
  driverId: uuid('driver_id').notNull()
    .references(() => driverProfiles.id, { onDelete: 'restrict' }),

  registrationType: driverTaxRegTypeEnum('registration_type').notNull(),
  // 'GST' | 'QST' | 'HST'

  // Registration number — masked display only
  // Full number stored in sensitive_identifiers table (DB-2)
  registrationNumberMasked: varchar('registration_number_masked', { length: 30 }),
  // Format: ••••••1234 — never full number

  jurisdictionId: uuid('jurisdiction_id')
    .references(() => jurisdictions.id),

  status: driverTaxRegStatusEnum('status').notNull().default('UNKNOWN'),

  effectiveFrom:  date('effective_from').notNull(),
  effectiveUntil: date('effective_until'),

  verifiedAt:  timestamp('verified_at',  { withTimezone: true }),
  verifiedBy:  uuid('verified_by').references(() => users.id),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_tax_reg_driver_type').on(t.driverId, t.registrationType, t.effectiveFrom),
  index('idx_tax_reg_driver').on(t.driverId),
  index('idx_tax_reg_status').on(t.status),
  index('idx_tax_reg_jurisdiction').on(t.jurisdictionId),
])

// ─── TRANSACTION TAX CALCULATIONS ────────────────────────────
// Per-transaction tax (not period aggregate — that's in tax_calculations/pre-db10)
// This links individual activities to their tax determination

export const transactionTaxCalculations = pgTable('transaction_tax_calculations', {
  id:         uuid('id').primaryKey().defaultRandom(),
  activityId: uuid('activity_id').notNull()
    .references(() => driverActivities.id, { onDelete: 'restrict' }),
  driverId:   uuid('driver_id').notNull()
    .references(() => driverProfiles.id, { onDelete: 'restrict' }),

  jurisdictionId: uuid('jurisdiction_id').notNull()
    .references(() => jurisdictions.id),
  taxRuleSetId:   uuid('tax_rule_set_id').notNull()
    .references(() => taxRuleSets.id, { onDelete: 'restrict' }),

  // Effective date for rule selection (not calculation date)
  transactionEffectiveAt: timestamp('transaction_effective_at', { withTimezone: true }).notNull(),
  // CRITICAL: uses the transaction's effective date, not today's date

  taxabilityStatus: taxabilityStatusEnum('taxability_status').notNull(),
  calcStatus:       txTaxCalcStatusEnum('tx_tax_calc_status').notNull().default('PENDING'),
  calcMethod:       taxCalcMethodEnum('calc_method').notNull(),

  // Taxable base — may differ from gross amount
  taxableBase: numeric('taxable_base', { precision: 19, scale: 4 }).notNull(),
  // NUMERIC(19,4) for intermediate precision

  taxInclusive: boolean('tax_inclusive').notNull().default(false),

  // Summary totals — components detailed in tax_calculation_components
  totalTax: numeric('total_tax', { precision: 12, scale: 2 }),
  // Rounded final — components may sum to slightly different due to rounding

  roundingDifference: numeric('rounding_difference', { precision: 12, scale: 4 }),

  currency: varchar('currency', { length: 3 }).notNull().default('CAD'),

  // Engine version for reproducibility
  calculationVersion: varchar('calculation_version', { length: 30 }).notNull(),
  // e.g. 'TAX-ENGINE-2026.1'

  // Taxability reason when not TAXABLE
  taxabilityReasonCode: varchar('taxability_reason_code', { length: 60 }),
  taxabilityRuleRef:    varchar('taxability_rule_ref',    { length: 100 }),
  // Reference to applicable rule — mandatory when EXEMPT or ZERO_RATED

  // Provider-reported tax (never overwritten by government calculation)
  providerReportedTax: numeric('provider_reported_tax', { precision: 12, scale: 2 }),
  // Null = provider did not report. Kept separate from government calculation.

  calculatedAt: timestamp('calculated_at', { withTimezone: true }).notNull().defaultNow(),
  finalizedAt:  timestamp('finalized_at',  { withTimezone: true }),

  // Input snapshot for reproducibility
  inputSnapshot:  jsonb('input_snapshot').notNull().default({}),
  // taxable base, rates, method, registration status — never raw secrets

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_tx_tax_calc_activity').on(t.activityId),
  // One tax calculation per activity
  index('idx_tx_tax_calc_driver').on(t.driverId),
  index('idx_tx_tax_calc_jurisdiction').on(t.jurisdictionId),
  index('idx_tx_tax_calc_rule_set').on(t.taxRuleSetId),
  index('idx_tx_tax_calc_status').on(t.calcStatus),
  index('idx_tx_tax_calc_taxability').on(t.taxabilityStatus),
  index('idx_tx_tax_calc_effective').on(t.transactionEffectiveAt),
  index('idx_tx_tax_calc_driver_calc').on(t.driverId, t.calculatedAt),
])

// ─── TAX CALCULATION COMPONENTS ──────────────────────────────
// Per-component results: GST separate from QST

export const taxCalculationComponents = pgTable('tax_calculation_components', {
  id:              uuid('id').primaryKey().defaultRandom(),
  taxCalculationId: uuid('tax_calculation_id').notNull()
    .references(() => transactionTaxCalculations.id, { onDelete: 'cascade' }),
  taxComponentId:  uuid('tax_component_id').notNull()
    .references(() => taxComponents.id, { onDelete: 'restrict' }),

  taxableBase:    numeric('taxable_base',     { precision: 19, scale: 4 }).notNull(),
  rate:           numeric('rate',             { precision: 8,  scale: 5 }).notNull(),
  // Snapshot of rate at calculation time — immutable

  calculatedAmount: numeric('calculated_amount', { precision: 19, scale: 4 }).notNull(),
  // Unrounded — always preserved

  roundedAmount: numeric('rounded_amount',  { precision: 12, scale: 2 }).notNull(),
  // After rounding policy applied

  roundingDifference: numeric('rounding_difference', { precision: 12, scale: 4 }).notNull().default('0'),
  // roundedAmount - calculatedAmount — always kept for audit

  calculationOrder: integer('calculation_order').notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_calc_component_unique').on(t.taxCalculationId, t.taxComponentId),
  index('idx_calc_component_calc').on(t.taxCalculationId),
  index('idx_calc_component_component').on(t.taxComponentId),
])

// ─── TAX ADJUSTMENTS ─────────────────────────────────────────

export const taxAdjustments = pgTable('tax_adjustments', {
  id:              uuid('id').primaryKey().defaultRandom(),
  taxCalculationId: uuid('tax_calculation_id').notNull()
    .references(() => transactionTaxCalculations.id, { onDelete: 'restrict' }),

  adjustmentType: taxAdjustmentTypeEnum('adjustment_type').notNull(),

  amount:    numeric('amount',   { precision: 12, scale: 2 }).notNull(),
  currency:  varchar('currency', { length: 3 }).notNull().default('CAD'),
  direction: varchar('direction', { length: 10 }).notNull(),
  // 'CREDIT' | 'DEBIT'

  reasonCode:      varchar('reason_code',      { length: 60 }),
  sourceReference: varchar('source_reference', { length: 100 }),
  // Government authorization reference, if applicable

  authorizedBy: uuid('authorized_by').references(() => users.id),
  // Government user — driver cannot self-adjust tax

  // Snapshot before/after
  previousTotalTax: numeric('previous_total_tax', { precision: 12, scale: 2 }),
  newTotalTax:      numeric('new_total_tax',       { precision: 12, scale: 2 }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  // Immutable — no updatedAt
}, (t) => [
  index('idx_tax_adj_calculation').on(t.taxCalculationId),
  index('idx_tax_adj_type').on(t.adjustmentType),
  index('idx_tax_adj_authorized').on(t.authorizedBy),
])

// ─── TAX RECONCILIATIONS ──────────────────────────────────────

export const taxReconciliations = pgTable('tax_reconciliations', {
  id:              uuid('id').primaryKey().defaultRandom(),
  taxCalculationId: uuid('tax_calculation_id').notNull()
    .references(() => transactionTaxCalculations.id, { onDelete: 'restrict' }),

  // Provider reported vs government calculated
  providerTaxAmount:    numeric('provider_tax_amount',    { precision: 12, scale: 2 }),
  governmentTaxAmount:  numeric('government_tax_amount',  { precision: 12, scale: 2 }),
  difference:           numeric('difference',             { precision: 12, scale: 4 }),
  // difference = governmentTaxAmount - providerTaxAmount
  // Positive = government calculated more · Negative = provider reported more

  status: taxReconciliationStatusEnum('status').notNull().default('UNDER_REVIEW'),
  reason: text('reason'),
  // e.g. 'Provider did not include QST in reported tax' — never auto-overwrite

  resolvedBy: uuid('resolved_by').references(() => users.id),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolution: text('resolution'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_tax_recon_calc').on(t.taxCalculationId),
  index('idx_tax_recon_status').on(t.status),
])

// ─── RELATIONS ────────────────────────────────────────────────

export const taxComponentsRelations = relations(taxComponents, ({ one, many }) => ({
  taxRuleSet:     one(taxRuleSets, { fields: [taxComponents.taxRuleSetId], references: [taxRuleSets.id] }),
  roundingPolicy: one(taxRoundingPolicies, { fields: [taxComponents.roundingPolicyId], references: [taxRoundingPolicies.id] }),
  results:        many(taxCalculationComponents),
}))

export const taxDriverRegistrationsRelations = relations(taxDriverRegistrations, ({ one }) => ({
  driver:       one(driverProfiles, { fields: [taxDriverRegistrations.driverId],       references: [driverProfiles.id] }),
  jurisdiction: one(jurisdictions,  { fields: [taxDriverRegistrations.jurisdictionId], references: [jurisdictions.id] }),
  verifiedBy:   one(users,          { fields: [taxDriverRegistrations.verifiedBy],     references: [users.id] }),
}))

export const transactionTaxCalculationsRelations = relations(transactionTaxCalculations, ({ one, many }) => ({
  activity:     one(driverActivities, { fields: [transactionTaxCalculations.activityId],     references: [driverActivities.id] }),
  driver:       one(driverProfiles,   { fields: [transactionTaxCalculations.driverId],       references: [driverProfiles.id] }),
  jurisdiction: one(jurisdictions,    { fields: [transactionTaxCalculations.jurisdictionId], references: [jurisdictions.id] }),
  taxRuleSet:   one(taxRuleSets,      { fields: [transactionTaxCalculations.taxRuleSetId],   references: [taxRuleSets.id] }),
  components:   many(taxCalculationComponents),
  adjustments:  many(taxAdjustments),
  reconciliation: one(taxReconciliations, { fields: [transactionTaxCalculations.id], references: [taxReconciliations.taxCalculationId] }),
}))

export const taxCalculationComponentsRelations = relations(taxCalculationComponents, ({ one }) => ({
  taxCalculation: one(transactionTaxCalculations, { fields: [taxCalculationComponents.taxCalculationId], references: [transactionTaxCalculations.id] }),
  taxComponent:   one(taxComponents,              { fields: [taxCalculationComponents.taxComponentId],   references: [taxComponents.id] }),
}))

export const taxAdjustmentsRelations = relations(taxAdjustments, ({ one }) => ({
  taxCalculation: one(transactionTaxCalculations, { fields: [taxAdjustments.taxCalculationId], references: [transactionTaxCalculations.id] }),
  authorizedBy:   one(users,                      { fields: [taxAdjustments.authorizedBy],      references: [users.id] }),
}))

export const taxReconciliationsRelations = relations(taxReconciliations, ({ one }) => ({
  taxCalculation: one(transactionTaxCalculations, { fields: [taxReconciliations.taxCalculationId], references: [transactionTaxCalculations.id] }),
  resolvedBy:     one(users,                      { fields: [taxReconciliations.resolvedBy],       references: [users.id] }),
}))
