// ================================================================
// TAXIMÈTRE.GOV — PRE-DB10 ARCHITECTURE
// Master Restructure — Government Identity · Tax · Revenue · Providers
// ================================================================
//
// SOURCE OF TRUTH: Master Architecture Document v1.0
//
// CENTRAL OBJECT: government_driver_id (DRV-QC-000001)
// Everything resolves to ONE government driver identity.
//
// THREE ACTIVITY PATHS — STRICTLY SEPARATED:
// 1. TAXI     → Taximeter.gov fare engine → server-calculated
// 2. RIDESHARE → Provider API/webhook → provider final fare (IMMUTABLE)
// 3. DELIVERY  → Provider API/webhook → taximeter ALWAYS OFF
//
// RÈGLES ABSOLUES:
// 1. NEVER recalculate Uber/Lyft prices using taximeter fare engine
// 2. provider_activities: NEVER creates taxi_trips (different tables)
// 3. Tax rates: versioned rule sets — NEVER hardcoded
// 4. All financial amounts: NUMERIC(12,2) — NEVER FLOAT
// 5. Historical financial records: NEVER silently edited — use adjustments
// 6. Government tax gateway: abstraction — NOT guaranteed Revenu Québec API
// 7. Provider passwords: NEVER stored — OAuth only
// ================================================================

import {
  pgTable, pgEnum, uuid, text, boolean, integer,
  timestamp, jsonb, uniqueIndex, index, varchar,
  numeric, date,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { users }          from './auth.schema'
import { driverProfiles } from './profiles.schema'
import { providers }      from './providers.schema'

// ─── ENUMS ───────────────────────────────────────────────────

export const taxAccountStatusEnum = pgEnum('tax_account_status', [
  'PENDING',           // Registration in progress
  'ACTIVE',            // Active tax account
  'SUSPENDED',         // Temporarily suspended
  'DEREGISTERED',      // Closed
])

export const taxRegistrationStatusEnum = pgEnum('tax_registration_status', [
  'NOT_REGISTERED',
  'PENDING',
  'REGISTERED',
  'EXEMPT',
  'CANCELLED',
])

export const taxPeriodStatusEnum = pgEnum('tax_period_status', [
  'OPEN',
  'CALCULATING',
  'READY_TO_FILE',
  'FILED',
  'ACCEPTED',
  'REJECTED',
  'AMENDED',
  'CLOSED',
])

export const taxFilingStatusEnum = pgEnum('tax_filing_status', [
  'DRAFT',
  'PREPARED',
  'SUBMITTED',
  'ACCEPTED',
  'REJECTED',
  'AMENDED',
])

export const taxFilingTypeEnum = pgEnum('tax_filing_type', [
  'TPS',
  'TVQ',
  'TPS_TVQ_COMBINED',
  'AMENDMENT',
])

export const gatewayModeEnum = pgEnum('gateway_mode', [
  'SIMULATION',               // Dev/test — clearly labelled
  'OFFICIAL_API',             // Real authorized government API
  'AUTHORIZED_ELECTRONIC',    // Via authorized third-party e-service
  'PORTAL_REDIRECT',          // Redirect to gov portal
  'MANUAL_EXPORT',            // Export file, driver files manually
])

export const revenueLedgerEntryTypeEnum = pgEnum('revenue_ledger_entry_type', [
  'CREDIT',
  'DEBIT',
  'ADJUSTMENT',
  'REVERSAL',
])

export const revenueSourceEnum = pgEnum('revenue_source', [
  'TAXI',          // Taximeter.gov trip
  'UBER',
  'LYFT',
  'DOORDASH',
  'INSTACART',
  'UBER_EATS',
  'SKIP',
  'OTHER_PROVIDER',
  'MANUAL',
])

export const reconciliationCaseStatusEnum = pgEnum('recon_case_status', [
  'OPEN',
  'MATCHED',
  'EXCEPTION',     // Mismatch — NEVER auto-accused of fraud
  'UNDER_REVIEW',
  'RESOLVED',
  'CLOSED',
])

export const providerComplianceStatusEnum = pgEnum('provider_compliance_status', [
  'UNKNOWN',
  'COMPLIANT',
  'PENDING',
  'NON_COMPLIANT',
  'EXEMPT',
])

// ─── JURISDICTIONS ────────────────────────────────────────────
// Multi-jurisdiction support — QC is pilot but NOT hardcoded

export const jurisdictions = pgTable('jurisdictions', {
  id:   uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 10 }).notNull().unique(),
  // 'QC' | 'ON' | 'CA' | 'FR' | etc.

  name:     varchar('name',     { length: 100 }).notNull(),
  nameFr:   varchar('name_fr',  { length: 100 }),
  nameEn:   varchar('name_en',  { length: 100 }),
  country:  varchar('country',  { length: 2 }).notNull().default('CA'),
  currency: varchar('currency', { length: 3 }).notNull().default('CAD'),

  isPilot:  boolean('is_pilot').notNull().default(true),
  isActive: boolean('is_active').notNull().default(true),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_jurisdictions_code').on(t.code),
  index('idx_jurisdictions_country').on(t.country),
])

// ─── PROVIDER COMPLIANCE REQUIREMENTS ─────────────────────────
// What each provider must comply with per jurisdiction
// (regulatory framework — not technical assumptions)

export const providerComplianceRequirements = pgTable('provider_compliance_requirements', {
  id:           uuid('id').primaryKey().defaultRandom(),
  providerId:   uuid('provider_id').notNull()
    .references(() => providers.id, { onDelete: 'cascade' }),
  jurisdictionId: uuid('jurisdiction_id').notNull()
    .references(() => jurisdictions.id, { onDelete: 'cascade' }),

  requirementCode: varchar('requirement_code', { length: 60 }).notNull(),
  // 'DRIVER_VERIFICATION_REQUIRED' | 'ACTIVITY_REPORTING_REQUIRED'
  // | 'WEBHOOK_REQUIRED' | 'API_INTEGRATION_REQUIRED'

  requirementType: varchar('requirement_type', { length: 40 }).notNull(),
  // 'TECHNICAL' | 'REGULATORY' | 'COMPLIANCE'

  mandatory: boolean('mandatory').notNull().default(false),
  // Determined by applicable legal framework — not our assumption

  complianceStatus: providerComplianceStatusEnum('compliance_status').notNull().default('UNKNOWN'),

  effectiveFrom:  date('effective_from').notNull(),
  effectiveUntil: date('effective_until'),

  notes: text('notes'),
  // Reference to applicable regulation — never invented

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_prov_compliance_unique').on(t.providerId, t.jurisdictionId, t.requirementCode),
  index('idx_prov_compliance_provider').on(t.providerId),
  index('idx_prov_compliance_jurisdiction').on(t.jurisdictionId),
])

// ─── REVENUE LEDGER ───────────────────────────────────────────
// Immutable financial ledger — source of truth for all revenue
// Corrections use adjustment entries — never silent edits

export const revenueLedger = pgTable('revenue_ledger', {
  id:       uuid('id').primaryKey().defaultRandom(),
  driverId: uuid('driver_id').notNull()
    .references(() => driverProfiles.id, { onDelete: 'restrict' }),

  // Source of this entry
  sourceType:   revenueSourceEnum('source_type').notNull(),
  providerId:   uuid('provider_id').references(() => providers.id, { onDelete: 'set null' }),
  activityId:   uuid('activity_id'),  // References provider_activities or taxi_trips
  activityType: varchar('activity_type', { length: 30 }),
  // 'TAXI_TRIP' | 'RIDESHARE' | 'DELIVERY' | 'FOOD_DELIVERY' etc.

  entryType: revenueLedgerEntryTypeEnum('entry_type').notNull(),

  // All amounts: NUMERIC(12,2) — NEVER FLOAT
  grossAmount:        numeric('gross_amount',         { precision: 12, scale: 2 }).notNull(),
  feeAmount:          numeric('fee_amount',           { precision: 12, scale: 2 }).notNull().default('0'),
  tipAmount:          numeric('tip_amount',           { precision: 12, scale: 2 }).notNull().default('0'),
  adjustmentAmount:   numeric('adjustment_amount',    { precision: 12, scale: 2 }).notNull().default('0'),
  netAmount:          numeric('net_amount',           { precision: 12, scale: 2 }).notNull(),
  // netAmount = grossAmount - feeAmount + tipAmount + adjustmentAmount

  currency:     varchar('currency',     { length: 3 }).notNull().default('CAD'),
  jurisdiction: varchar('jurisdiction', { length: 10 }).notNull().default('QC'),

  // Period association for tax calculation
  activityDate: date('activity_date').notNull(),
  // Date the activity occurred — used for tax period assignment

  // Immutability — never edit this row after SETTLED
  isSettled:  boolean('is_settled').notNull().default(false),
  settledAt:  timestamp('settled_at', { withTimezone: true }),

  // Links back to source for data lineage
  sourceReference: varchar('source_reference', { length: 100 }),
  // e.g. trip_reference or provider_activity_id

  // Correction chain — if this entry corrects a previous one
  correcedEntryId: uuid('corrected_entry_id'),

  notes: text('notes'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  // No updatedAt — immutable after creation
}, (t) => [
  index('idx_rev_ledger_driver').on(t.driverId),
  index('idx_rev_ledger_source').on(t.sourceType),
  index('idx_rev_ledger_provider').on(t.providerId),
  index('idx_rev_ledger_date').on(t.activityDate),
  index('idx_rev_ledger_driver_date').on(t.driverId, t.activityDate),
  index('idx_rev_ledger_settled').on(t.isSettled),
])

// ─── TAX ACCOUNTS ─────────────────────────────────────────────

export const taxAccounts = pgTable('tax_accounts', {
  id:       uuid('id').primaryKey().defaultRandom(),
  driverId: uuid('driver_id').notNull().unique()
    .references(() => driverProfiles.id, { onDelete: 'restrict' }),

  jurisdictionId: uuid('jurisdiction_id').notNull()
    .references(() => jurisdictions.id),

  // Masked tax registration references — NEVER full numbers
  tpsRegistrationMasked: varchar('tps_registration_masked', { length: 20 }),
  tvqRegistrationMasked: varchar('tvq_registration_masked', { length: 20 }),
  // Full numbers stored in sensitive_identifiers table (DB-2)

  tpsStatus: taxRegistrationStatusEnum('tps_status').notNull().default('NOT_REGISTERED'),
  tvqStatus: taxRegistrationStatusEnum('tvq_status').notNull().default('NOT_REGISTERED'),

  filingFrequency: varchar('filing_frequency', { length: 20 }).notNull().default('QUARTERLY'),
  // 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'

  status: taxAccountStatusEnum('tax_account_status').notNull().default('PENDING'),

  effectiveFrom:  date('effective_from').notNull(),
  effectiveUntil: date('effective_until'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_tax_account_driver').on(t.driverId),
  index('idx_tax_account_jurisdiction').on(t.jurisdictionId),
  index('idx_tax_account_status').on(t.status),
])

// ─── TAX RULE SETS ────────────────────────────────────────────
// Versioned, jurisdiction-specific tax rules — NEVER hardcoded

export const taxRuleSets = pgTable('tax_rule_sets', {
  id:            uuid('id').primaryKey().defaultRandom(),
  jurisdictionId: uuid('jurisdiction_id').notNull()
    .references(() => jurisdictions.id),

  code:    varchar('code',    { length: 30  }).notNull(),
  // 'QC_TPS_TVQ' | 'ON_HST' | etc.
  version: varchar('version', { length: 20 }).notNull(),
  // '2026-Q1' | '2026-Q3' | '2027-Q1'
  label:   varchar('label',   { length: 100 }).notNull(),

  // Rate components — NUMERIC, never float
  tpsRate:  numeric('tps_rate',  { precision: 8, scale: 5 }),
  // 0.05000 for 5%
  tvqRate:  numeric('tvq_rate',  { precision: 8, scale: 5 }),
  // 0.09975 for 9.975%

  effectiveFrom:  date('effective_from').notNull(),
  effectiveUntil: date('effective_until'),
  // null = still in effect

  // Approval chain — immutable once published
  status: varchar('status', { length: 20 }).notNull().default('DRAFT'),
  // 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PUBLISHED' | 'RETIRED'

  approvedBy:  uuid('approved_by').references(() => users.id),
  approvedAt:  timestamp('approved_at',  { withTimezone: true }),
  publishedBy: uuid('published_by').references(() => users.id),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  // Once PUBLISHED → immutable. New changes create a new version.

  sourceReference: text('source_reference'),
  // Official regulation reference — never invented

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_tax_rule_set_unique').on(t.jurisdictionId, t.code, t.version),
  index('idx_tax_rule_set_jurisdiction').on(t.jurisdictionId),
  index('idx_tax_rule_set_status').on(t.status),
  index('idx_tax_rule_set_effective').on(t.effectiveFrom, t.effectiveUntil),
])

// ─── TAX PERIODS ─────────────────────────────────────────────

export const taxPeriods = pgTable('tax_periods', {
  id:           uuid('id').primaryKey().defaultRandom(),
  taxAccountId: uuid('tax_account_id').notNull()
    .references(() => taxAccounts.id, { onDelete: 'restrict' }),

  periodStart:   date('period_start').notNull(),
  periodEnd:     date('period_end').notNull(),
  filingDueDate: date('filing_due_date').notNull(),

  status:    taxPeriodStatusEnum('period_status').notNull().default('OPEN'),
  tpsStatus: varchar('tps_status', { length: 30 }).notNull().default('PENDING'),
  tvqStatus: varchar('tvq_status', { length: 30 }).notNull().default('PENDING'),

  // Revenue summary for this period — amounts NUMERIC
  grossRevenueTaxi:     numeric('gross_revenue_taxi',     { precision: 12, scale: 2 }).notNull().default('0'),
  grossRevenueRideshare: numeric('gross_revenue_rideshare', { precision: 12, scale: 2 }).notNull().default('0'),
  grossRevenueDelivery:  numeric('gross_revenue_delivery',  { precision: 12, scale: 2 }).notNull().default('0'),
  grossRevenueOther:     numeric('gross_revenue_other',     { precision: 12, scale: 2 }).notNull().default('0'),

  closedAt:  timestamp('closed_at',  { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_tax_period_unique').on(t.taxAccountId, t.periodStart, t.periodEnd),
  index('idx_tax_period_account').on(t.taxAccountId),
  index('idx_tax_period_status').on(t.status),
  index('idx_tax_period_due').on(t.filingDueDate),
])

// ─── TAX CALCULATIONS ────────────────────────────────────────

export const taxCalculations = pgTable('tax_calculations', {
  id:           uuid('id').primaryKey().defaultRandom(),
  taxPeriodId:  uuid('tax_period_id').notNull()
    .references(() => taxPeriods.id, { onDelete: 'restrict' }),
  taxRuleSetId: uuid('tax_rule_set_id').notNull()
    .references(() => taxRuleSets.id, { onDelete: 'restrict' }),

  calculationVersion: integer('calculation_version').notNull().default(1),
  // Increments on recalculation — history preserved

  // TPS components — all NUMERIC(12,2)
  tpsCollected:   numeric('tps_collected',   { precision: 12, scale: 2 }).notNull().default('0'),
  tpsRemitted:    numeric('tps_remitted',    { precision: 12, scale: 2 }).notNull().default('0'),
  tpsCredits:     numeric('tps_credits',     { precision: 12, scale: 2 }).notNull().default('0'),
  tpsAdjustments: numeric('tps_adjustments', { precision: 12, scale: 2 }).notNull().default('0'),
  tpsBalance:     numeric('tps_balance',     { precision: 12, scale: 2 }).notNull().default('0'),
  // balance = collected - remitted - credits + adjustments

  // TVQ components
  tvqCollected:   numeric('tvq_collected',   { precision: 12, scale: 2 }).notNull().default('0'),
  tvqRemitted:    numeric('tvq_remitted',    { precision: 12, scale: 2 }).notNull().default('0'),
  tvqCredits:     numeric('tvq_credits',     { precision: 12, scale: 2 }).notNull().default('0'),
  tvqAdjustments: numeric('tvq_adjustments', { precision: 12, scale: 2 }).notNull().default('0'),
  tvqBalance:     numeric('tvq_balance',     { precision: 12, scale: 2 }).notNull().default('0'),

  // Calculation provenance — reproducible
  isEstimate:    boolean('is_estimate').notNull().default(true),
  // Never present estimates as final government balances
  calculatedAt:  timestamp('calculated_at', { withTimezone: true }).notNull().defaultNow(),
  calculatedBy:  uuid('calculated_by').references(() => users.id),

  // Snapshot for filing evidence
  inputSnapshot:  jsonb('input_snapshot').notNull().default({}),
  // Revenue sources, rule version, remittances applied — complete audit trail
  outputSnapshot: jsonb('output_snapshot').notNull().default({}),
}, (t) => [
  index('idx_tax_calc_period').on(t.taxPeriodId),
  index('idx_tax_calc_rules').on(t.taxRuleSetId),
  index('idx_tax_calc_calculated').on(t.calculatedAt),
])

// ─── TAX FILINGS ─────────────────────────────────────────────

export const taxFilings = pgTable('tax_filings', {
  id:            uuid('id').primaryKey().defaultRandom(),
  taxAccountId:  uuid('tax_account_id').notNull()
    .references(() => taxAccounts.id, { onDelete: 'restrict' }),
  taxPeriodId:   uuid('tax_period_id').notNull()
    .references(() => taxPeriods.id, { onDelete: 'restrict' }),
  calculationId: uuid('calculation_id')
    .references(() => taxCalculations.id, { onDelete: 'restrict' }),

  filingType:   taxFilingTypeEnum('filing_type').notNull(),
  status:       taxFilingStatusEnum('filing_status').notNull().default('DRAFT'),
  gatewayMode:  gatewayModeEnum('gateway_mode').notNull().default('SIMULATION'),
  // ALWAYS simulation until official gateway authorized

  preparedAt:  timestamp('prepared_at',  { withTimezone: true }),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  acceptedAt:  timestamp('accepted_at',  { withTimezone: true }),
  rejectedAt:  timestamp('rejected_at',  { withTimezone: true }),

  // Government reference — only set after real acceptance
  governmentReference: varchar('government_reference', { length: 100 }),
  // null = not yet submitted to real government

  rejectionReason: text('rejection_reason'),

  // Simulation clearly labelled — never presented as real
  isSimulation: boolean('is_simulation').notNull().default(true),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_tax_filing_account').on(t.taxAccountId),
  index('idx_tax_filing_period').on(t.taxPeriodId),
  index('idx_tax_filing_status').on(t.status),
])

// ─── RECONCILIATION CASES ─────────────────────────────────────

export const reconciliationCases = pgTable('reconciliation_cases', {
  id:       uuid('id').primaryKey().defaultRandom(),
  driverId: uuid('driver_id').notNull()
    .references(() => driverProfiles.id, { onDelete: 'restrict' }),
  providerId: uuid('provider_id').references(() => providers.id, { onDelete: 'set null' }),

  caseType: varchar('case_type', { length: 40 }).notNull(),
  // 'PROVIDER_VS_INTERNAL' | 'TAX_VS_REMITTANCE' | 'PAYMENT_VS_LEDGER'

  // Amounts being compared — NUMERIC
  expectedAmount: numeric('expected_amount', { precision: 12, scale: 2 }),
  actualAmount:   numeric('actual_amount',   { precision: 12, scale: 2 }),
  differenceAmount: numeric('difference_amount', { precision: 12, scale: 2 }),
  // differenceAmount = actualAmount - expectedAmount

  status: reconciliationCaseStatusEnum('recon_case_status').notNull().default('OPEN'),

  // CRITICAL: Exception ≠ fraud accusation
  exceptionNote: text('exception_note'),
  // e.g. 'Écart de 200$ — révision requise' — never 'fraude détectée'

  periodReference: varchar('period_reference', { length: 30 }),
  // e.g. '2026-Q3'

  resolvedBy: uuid('resolved_by').references(() => users.id),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolution: text('resolution'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_recon_driver').on(t.driverId),
  index('idx_recon_provider').on(t.providerId),
  index('idx_recon_status').on(t.status),
])

// ─── RELATIONS ────────────────────────────────────────────────

export const jurisdictionsRelations = relations(jurisdictions, ({ many }) => ({
  complianceRequirements: many(providerComplianceRequirements),
  taxAccounts:            many(taxAccounts),
  taxRuleSets:            many(taxRuleSets),
}))

export const taxAccountsRelations = relations(taxAccounts, ({ one, many }) => ({
  driver:       one(driverProfiles, { fields: [taxAccounts.driverId],        references: [driverProfiles.id] }),
  jurisdiction: one(jurisdictions,  { fields: [taxAccounts.jurisdictionId],   references: [jurisdictions.id] }),
  periods:      many(taxPeriods),
  filings:      many(taxFilings),
}))

export const taxPeriodsRelations = relations(taxPeriods, ({ one, many }) => ({
  taxAccount:    one(taxAccounts,    { fields: [taxPeriods.taxAccountId],  references: [taxAccounts.id] }),
  calculations:  many(taxCalculations),
  filings:       many(taxFilings),
}))

export const taxCalculationsRelations = relations(taxCalculations, ({ one }) => ({
  taxPeriod:   one(taxPeriods,   { fields: [taxCalculations.taxPeriodId],  references: [taxPeriods.id] }),
  taxRuleSet:  one(taxRuleSets,  { fields: [taxCalculations.taxRuleSetId], references: [taxRuleSets.id] }),
  calculatedBy: one(users,       { fields: [taxCalculations.calculatedBy], references: [users.id] }),
}))

export const revenueLedgerRelations = relations(revenueLedger, ({ one }) => ({
  driver:   one(driverProfiles, { fields: [revenueLedger.driverId],   references: [driverProfiles.id] }),
  provider: one(providers,      { fields: [revenueLedger.providerId], references: [providers.id] }),
}))
