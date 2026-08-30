// ================================================================
// TAXIMÈTRE.GOV — DRIVER LEDGER & FINANCIAL SUMMARY SCHEMA
// Database Phase 17/20 — Ledger Summaries · Payout Engine · Statements
// ================================================================
//
// REUSE FROM EXISTING:
//   revenue_ledger (PRE-DB10) → immutable transaction entries
//   wallet_accounts/entries (DB-9) → real-time wallet state
//   payments/payouts (DB-9) → payment records
//   driver_activities (DB-14) → canonical activities
//   tax_calculations (PRE-DB10) → period tax aggregates
//
// DB-17 ADDS:
//   driver_ledger_summaries    → periodic aggregation of revenue_ledger
//   payout_calculations        → pre-payout financial reconciliation
//   financial_period_snapshots → immutable point-in-time snapshots
//   driver_financial_statements → formatted statements for driver
//
// RÈGLES ABSOLUES:
// 1. Summaries are COMPUTED from revenue_ledger — never primary source
// 2. All amounts: NUMERIC(19,4) intermediate · NUMERIC(12,2) final
// 3. Payout: walletBalance verified before every payout calculation
// 4. Snapshot: immutable once finalized — corrections create new version
// 5. Statement: masking enforced — no raw NAS/SIN/IBAN in statement data
// 6. Revenue breakdown: TAXI/RIDESHARE/DELIVERY always separate columns
// 7. Tax amounts: government calculated (never provider reported)
// 8. Negative balance → NEVER payout — always blocked
// ================================================================

import {
  pgTable, pgEnum, uuid, text, boolean, integer,
  timestamp, jsonb, uniqueIndex, index, varchar,
  numeric, date,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users }          from './auth.schema'
import { driverProfiles } from './profiles.schema'
import { jurisdictions, taxPeriods } from './pre-db10.schema'
import { walletAccounts } from './payments.schema'

// ─── ENUMS ───────────────────────────────────────────────────

export const ledgerSummaryStatusEnum = pgEnum('ledger_summary_status', [
  'COMPUTING',    // Aggregation in progress
  'COMPUTED',     // Ready to read
  'STALE',        // New transactions exist — needs recompute
  'FINALIZED',    // Period closed — immutable
  'ERROR',
])

export const payoutCalcStatusEnum = pgEnum('payout_calc_status', [
  'DRAFT',
  'VALIDATED',    // All checks passed
  'APPROVED',     // Approved for disbursement
  'DISBURSED',    // Money sent
  'FAILED',
  'CANCELLED',
  'REVERSED',
])

export const snapshotTypeEnum = pgEnum('financial_snapshot_type', [
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'ANNUAL',
  'ON_DEMAND',    // Created on specific request
  'TAX_PERIOD',   // Aligned to tax filing period
])

export const statementStatusEnum = pgEnum('statement_status', [
  'GENERATING',
  'READY',
  'DELIVERED',
  'VIEWED',
  'ARCHIVED',
])

export const statementTypeEnum = pgEnum('statement_type', [
  'EARNINGS_SUMMARY',         // Overall earnings by period
  'TAX_SUMMARY',              // TPS/TVQ collected + remitted
  'ACTIVITY_BREAKDOWN',       // Per activity type breakdown
  'PAYOUT_HISTORY',           // Payout history
  'RECONCILIATION_STATEMENT', // Discrepancy report
  'ANNUAL_STATEMENT',         // Annual tax filing support
])

export const deductionTypeEnum = pgEnum('deduction_type', [
  'PLATFORM_FEE',
  'TAX_REMITTANCE',
  'REFUND_DEBIT',
  'ADJUSTMENT_DEBIT',
  'REGULATORY_FEE',
  'OTHER',
])

// ─── DRIVER LEDGER SUMMARIES ──────────────────────────────────
// Periodic aggregation of revenue_ledger entries
// COMPUTED from canonical tables — never a primary source

export const driverLedgerSummaries = pgTable('driver_ledger_summaries', {
  id:       uuid('id').primaryKey().defaultRandom(),
  driverId: uuid('driver_id').notNull()
    .references(() => driverProfiles.id, { onDelete: 'restrict' }),
  jurisdictionId: uuid('jurisdiction_id').notNull()
    .references(() => jurisdictions.id),

  // Period covered
  periodStart: date('period_start').notNull(),
  periodEnd:   date('period_end').notNull(),

  status: ledgerSummaryStatusEnum('status').notNull().default('COMPUTING'),

  // Revenue by source — ALL NUMERIC(12,2), NEVER FLOAT
  // TAXI_TRIP: taximeter-calculated
  grossRevenueTaxi:      numeric('gross_revenue_taxi',      { precision: 12, scale: 2 }).notNull().default('0'),
  // RIDESHARE: provider final fare (immutable)
  grossRevenueRideshare: numeric('gross_revenue_rideshare', { precision: 12, scale: 2 }).notNull().default('0'),
  // DELIVERY: provider amount (taximeter OFF)
  grossRevenueDelivery:  numeric('gross_revenue_delivery',  { precision: 12, scale: 2 }).notNull().default('0'),
  grossRevenueOther:     numeric('gross_revenue_other',     { precision: 12, scale: 2 }).notNull().default('0'),
  grossRevenueTotal:     numeric('gross_revenue_total',     { precision: 12, scale: 2 }).notNull().default('0'),

  // Tips — always separate from revenue
  totalTips: numeric('total_tips', { precision: 12, scale: 2 }).notNull().default('0'),

  // Deductions
  totalPlatformFees:    numeric('total_platform_fees',    { precision: 12, scale: 2 }).notNull().default('0'),
  totalTaxRemittances:  numeric('total_tax_remittances',  { precision: 12, scale: 2 }).notNull().default('0'),
  totalRefundDebits:    numeric('total_refund_debits',    { precision: 12, scale: 2 }).notNull().default('0'),
  totalAdjustmentDebits: numeric('total_adjustment_debits', { precision: 12, scale: 2 }).notNull().default('0'),
  totalDeductions:      numeric('total_deductions',       { precision: 12, scale: 2 }).notNull().default('0'),

  // Net
  netRevenue:    numeric('net_revenue',    { precision: 12, scale: 2 }).notNull().default('0'),
  // = grossRevenueTotal + totalTips - totalDeductions

  // Tax summary (from government calculation — NOT provider reported)
  totalTpsCollected: numeric('total_tps_collected', { precision: 12, scale: 2 }).notNull().default('0'),
  totalTvqCollected: numeric('total_tvq_collected', { precision: 12, scale: 2 }).notNull().default('0'),
  totalTaxCollected: numeric('total_tax_collected', { precision: 12, scale: 2 }).notNull().default('0'),

  // Activity counts
  activityCount:       integer('activity_count').notNull().default(0),
  taxiTripCount:       integer('taxi_trip_count').notNull().default(0),
  rideshareTripCount:  integer('rideshare_trip_count').notNull().default(0),
  deliveryCount:       integer('delivery_count').notNull().default(0),

  currency: varchar('currency', { length: 3 }).notNull().default('CAD'),

  // Computation metadata
  computedAt:      timestamp('computed_at',      { withTimezone: true }),
  finalizedAt:     timestamp('finalized_at',      { withTimezone: true }),
  // finalized = period closed, no new entries possible

  // Source entry count (for drift detection)
  ledgerEntryCount: integer('ledger_entry_count').notNull().default(0),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_ledger_summary_driver_period').on(t.driverId, t.periodStart, t.periodEnd),
  index('idx_ledger_summary_driver').on(t.driverId),
  index('idx_ledger_summary_jurisdiction').on(t.jurisdictionId),
  index('idx_ledger_summary_status').on(t.status),
  index('idx_ledger_summary_period').on(t.periodStart, t.periodEnd),
])

// ─── PAYOUT CALCULATIONS ──────────────────────────────────────

export const payoutCalculations = pgTable('payout_calculations', {
  id:             uuid('id').primaryKey().defaultRandom(),
  publicId:       varchar('public_id', { length: 22 }).notNull().unique(),
  // Format: PYC-XXXXXXXX

  driverId:        uuid('driver_id').notNull()
    .references(() => driverProfiles.id, { onDelete: 'restrict' }),
  walletAccountId: uuid('wallet_account_id').notNull()
    .references(() => walletAccounts.id, { onDelete: 'restrict' }),

  status: payoutCalcStatusEnum('payout_calc_status').notNull().default('DRAFT'),

  // Wallet state at calculation time — snapshot
  walletBalanceAtCalc: numeric('wallet_balance_at_calc', { precision: 12, scale: 2 }).notNull(),
  // Must be verified again before actual disbursement

  // Requested payout amount
  requestedAmount: numeric('requested_amount', { precision: 12, scale: 2 }).notNull(),

  // Deductions before payout
  pendingTaxRemittances:   numeric('pending_tax_remittances',   { precision: 12, scale: 2 }).notNull().default('0'),
  pendingPlatformFees:     numeric('pending_platform_fees',     { precision: 12, scale: 2 }).notNull().default('0'),
  pendingRefundDebits:     numeric('pending_refund_debits',     { precision: 12, scale: 2 }).notNull().default('0'),
  totalPendingDeductions:  numeric('total_pending_deductions',  { precision: 12, scale: 2 }).notNull().default('0'),

  // Net available for payout
  netAvailableAmount: numeric('net_available_amount', { precision: 12, scale: 2 }).notNull(),
  // = walletBalanceAtCalc - totalPendingDeductions

  // Actual disbursement
  approvedAmount:  numeric('approved_amount',  { precision: 12, scale: 2 }),
  disbursedAmount: numeric('disbursed_amount', { precision: 12, scale: 2 }),

  currency: varchar('currency', { length: 3 }).notNull().default('CAD'),

  // GUARD: cannot payout with negative balance
  hasNegativeBalance: boolean('has_negative_balance').notNull().default(false),
  // If true: payout BLOCKED regardless of requestedAmount

  // Validation checks snapshot
  validationSnapshot: jsonb('validation_snapshot').notNull().default({}),
  // Checks performed: active_trip_check, pending_payout_check, balance_check

  calculatedBy: uuid('calculated_by').references(() => users.id),
  approvedBy:   uuid('approved_by').references(() => users.id),
  // approvedBy ≠ calculatedBy (four-eyes principle for large payouts)

  calculatedAt: timestamp('calculated_at', { withTimezone: true }).notNull().defaultNow(),
  approvedAt:   timestamp('approved_at',   { withTimezone: true }),
  disbursedAt:  timestamp('disbursed_at',  { withTimezone: true }),

  failureCode:   varchar('failure_code', { length: 50 }),
  failureDetail: text('failure_detail'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_payout_calc_driver').on(t.driverId),
  index('idx_payout_calc_wallet').on(t.walletAccountId),
  index('idx_payout_calc_status').on(t.status),
  index('idx_payout_calc_created').on(t.calculatedAt),
])

// ─── FINANCIAL PERIOD SNAPSHOTS ───────────────────────────────

export const financialPeriodSnapshots = pgTable('financial_period_snapshots', {
  id:       uuid('id').primaryKey().defaultRandom(),
  driverId: uuid('driver_id').notNull()
    .references(() => driverProfiles.id, { onDelete: 'restrict' }),
  jurisdictionId: uuid('jurisdiction_id').notNull()
    .references(() => jurisdictions.id),
  taxPeriodId: uuid('tax_period_id')
    .references(() => taxPeriods.id, { onDelete: 'set null' }),

  snapshotType: snapshotTypeEnum('snapshot_type').notNull(),
  periodStart:  date('period_start').notNull(),
  periodEnd:    date('period_end').notNull(),

  // Revenue breakdown — ALL NUMERIC(12,2)
  grossRevenueTaxi:      numeric('gross_revenue_taxi',      { precision: 12, scale: 2 }).notNull().default('0'),
  grossRevenueRideshare: numeric('gross_revenue_rideshare', { precision: 12, scale: 2 }).notNull().default('0'),
  grossRevenueDelivery:  numeric('gross_revenue_delivery',  { precision: 12, scale: 2 }).notNull().default('0'),
  grossRevenueTotal:     numeric('gross_revenue_total',     { precision: 12, scale: 2 }).notNull().default('0'),
  netRevenue:            numeric('net_revenue',             { precision: 12, scale: 2 }).notNull().default('0'),

  // Tax (government calculated — NOT provider reported)
  tpsCollected:    numeric('tps_collected',    { precision: 12, scale: 2 }).notNull().default('0'),
  tvqCollected:    numeric('tvq_collected',    { precision: 12, scale: 2 }).notNull().default('0'),
  tpsRemitted:     numeric('tps_remitted',     { precision: 12, scale: 2 }).notNull().default('0'),
  tvqRemitted:     numeric('tvq_remitted',     { precision: 12, scale: 2 }).notNull().default('0'),
  taxBalance:      numeric('tax_balance',      { precision: 12, scale: 2 }).notNull().default('0'),

  // Activity counts
  activityCount: integer('activity_count').notNull().default(0),

  // Wallet position at period end
  walletBalanceAtPeriodEnd: numeric('wallet_balance_at_period_end', { precision: 12, scale: 2 }),

  currency: varchar('currency', { length: 3 }).notNull().default('CAD'),

  // Immutable once finalized
  isFinalized: boolean('is_finalized').notNull().default(false),
  finalizedAt: timestamp('finalized_at', { withTimezone: true }),
  // Corrections create a new snapshot version — original preserved

  snapshotVersion: integer('snapshot_version').notNull().default(1),

  computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt:  timestamp('created_at',  { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_fin_snapshot_driver_period_type').on(
    t.driverId, t.periodStart, t.periodEnd, t.snapshotType, t.snapshotVersion
  ),
  index('idx_fin_snapshot_driver').on(t.driverId),
  index('idx_fin_snapshot_jurisdiction').on(t.jurisdictionId),
  index('idx_fin_snapshot_period').on(t.periodStart, t.periodEnd),
  index('idx_fin_snapshot_type').on(t.snapshotType),
  index('idx_fin_snapshot_finalized').on(t.isFinalized),
])

// ─── DRIVER FINANCIAL STATEMENTS ──────────────────────────────

export const driverFinancialStatements = pgTable('driver_financial_statements', {
  id:       uuid('id').primaryKey().defaultRandom(),
  publicId: varchar('public_id', { length: 22 }).notNull().unique(),
  // Format: STM-XXXXXXXX

  driverId:       uuid('driver_id').notNull()
    .references(() => driverProfiles.id, { onDelete: 'restrict' }),
  jurisdictionId: uuid('jurisdiction_id')
    .references(() => jurisdictions.id),

  statementType:   statementTypeEnum('statement_type').notNull(),
  status:          statementStatusEnum('status').notNull().default('GENERATING'),

  periodStart: date('period_start').notNull(),
  periodEnd:   date('period_end').notNull(),

  // Content reference — never raw financial data in this table
  snapshotId:   uuid('snapshot_id')
    .references(() => financialPeriodSnapshots.id, { onDelete: 'restrict' }),
  ledgerSummaryId: uuid('ledger_summary_id')
    .references(() => driverLedgerSummaries.id, { onDelete: 'restrict' }),

  // Storage reference for the generated document
  documentRef: text('document_ref'),
  // Signed URL — expires after delivery window

  // Masking policy enforced — never raw NAS/IBAN
  maskingPolicy: varchar('masking_policy', { length: 30 }).notNull().default('STANDARD'),
  // 'STANDARD' | 'MINIMAL' | 'FULL_DETAIL' (requires elevated auth)

  generatedAt:  timestamp('generated_at',  { withTimezone: true }),
  deliveredAt:  timestamp('delivered_at',  { withTimezone: true }),
  expiresAt:    timestamp('expires_at',    { withTimezone: true }),
  // Document URL expires — download link not permanent

  generatedBy: uuid('generated_by').references(() => users.id),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_statement_driver').on(t.driverId),
  index('idx_statement_type').on(t.statementType),
  index('idx_statement_status').on(t.status),
  index('idx_statement_period').on(t.periodStart, t.periodEnd),
])

// ─── RELATIONS ────────────────────────────────────────────────

export const driverLedgerSummariesRelations = relations(driverLedgerSummaries, ({ one }) => ({
  driver:       one(driverProfiles, { fields: [driverLedgerSummaries.driverId],       references: [driverProfiles.id] }),
  jurisdiction: one(jurisdictions,  { fields: [driverLedgerSummaries.jurisdictionId], references: [jurisdictions.id] }),
}))

export const payoutCalculationsRelations = relations(payoutCalculations, ({ one }) => ({
  driver:        one(driverProfiles, { fields: [payoutCalculations.driverId],        references: [driverProfiles.id] }),
  walletAccount: one(walletAccounts, { fields: [payoutCalculations.walletAccountId], references: [walletAccounts.id] }),
  calculatedBy:  one(users,          { fields: [payoutCalculations.calculatedBy],    references: [users.id] }),
  approvedBy:    one(users,          { fields: [payoutCalculations.approvedBy],      references: [users.id] }),
}))

export const financialPeriodSnapshotsRelations = relations(financialPeriodSnapshots, ({ one, many }) => ({
  driver:       one(driverProfiles, { fields: [financialPeriodSnapshots.driverId],       references: [driverProfiles.id] }),
  jurisdiction: one(jurisdictions,  { fields: [financialPeriodSnapshots.jurisdictionId], references: [jurisdictions.id] }),
  taxPeriod:    one(taxPeriods,     { fields: [financialPeriodSnapshots.taxPeriodId],    references: [taxPeriods.id] }),
  statements:   many(driverFinancialStatements),
}))

export const driverFinancialStatementsRelations = relations(driverFinancialStatements, ({ one }) => ({
  driver:       one(driverProfiles,         { fields: [driverFinancialStatements.driverId],       references: [driverProfiles.id] }),
  jurisdiction: one(jurisdictions,          { fields: [driverFinancialStatements.jurisdictionId], references: [jurisdictions.id] }),
  snapshot:     one(financialPeriodSnapshots, { fields: [driverFinancialStatements.snapshotId],   references: [financialPeriodSnapshots.id] }),
  ledgerSummary: one(driverLedgerSummaries, { fields: [driverFinancialStatements.ledgerSummaryId], references: [driverLedgerSummaries.id] }),
  generatedBy:  one(users,                  { fields: [driverFinancialStatements.generatedBy],    references: [users.id] }),
}))
