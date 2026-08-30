// ================================================================
// TAXIMÈTRE.GOV — PAYMENTS, WALLET & PAYOUTS SCHEMA
// Database Phase 9/20 — Payments · Wallet · Cash · Payouts
// ================================================================
//
// RÈGLES ABSOLUES:
// 1. Wallet balance = COMPUTED from wallet_entries — never a stored balance
// 2. FAILED payment → wallet NEVER credited (no exception)
// 3. All amounts: NUMERIC(12,2) — NEVER FLOAT
// 4. payment_id + idempotency_key UNIQUE → double-charge safe
// 5. Raw card/bank data NEVER stored — tokenized reference only
// 6. Refund = new entry linked to original — original NEVER modified
// 7. SETTLED entry → immutable — corrections via adjustment entries
// 8. Cash = payment method — not automatically "undeclared income"
// 9. tip_amount separate component — never embedded in fare amount
// 10. Provider payout reference: opaque — never parsed or relied upon
// ================================================================

import {
  pgTable, pgEnum, uuid, text, boolean, integer,
  timestamp, jsonb, uniqueIndex, index, varchar,
  numeric,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { users }                  from './auth.schema'
import { driverProfiles }         from './profiles.schema'
import { providers }              from './providers.schema'
import { taxiTrips }              from './taximeter.schema'
import { providerActivities }     from './provider-activities.schema'

// ─── ENUMS ───────────────────────────────────────────────────

export const paymentMethodEnum = pgEnum('payment_method', [
  'CREDIT_CARD',
  'DEBIT_CARD',
  'INTERAC',
  'DIGITAL_WALLET',   // Apple Pay, Google Pay, etc.
  'CASH',             // Cash = payment method, not "undeclared income"
  'PROVIDER_MANAGED', // Uber, Lyft handle payment directly
  'VOUCHER',
  'OTHER',
])

export const paymentStatusEnum = pgEnum('payment_status', [
  'PENDING',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
  'DISPUTED',
  'CHARGEBACK',
])

export const walletEntryTypeEnum = pgEnum('wallet_entry_type', [
  'TRIP_REVENUE',       // Taxi trip revenue credited
  'PROVIDER_REVENUE',   // Uber/Lyft/DoorDash etc. revenue credited
  'TIP',                // Tip credited separately
  'BONUS',              // Promo/bonus credited
  'ADJUSTMENT',         // Manual adjustment (with reason)
  'REFUND_DEBIT',       // Refund processed — debited from wallet
  'FEE',                // Platform fee debited
  'TAX_REMITTANCE',     // TPS/TVQ remitted — debited
  'PAYOUT',             // Withdrawal/payout — debited
  'CORRECTION',         // Error correction — immutable original preserved
])

export const walletEntryDirectionEnum = pgEnum('wallet_entry_direction', [
  'CREDIT',
  'DEBIT',
])

export const payoutStatusEnum = pgEnum('payout_status', [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'RETURNED',   // Bank returned the payout
  'CANCELLED',
])

export const payoutMethodEnum = pgEnum('payout_method', [
  'DIRECT_DEPOSIT',
  'INTERAC_ETRANSFER',
  'CHECK',
  'OTHER',
])

export const cashStatusEnum = pgEnum('cash_collection_status', [
  'COLLECTED',
  'RECONCILED',
  'DECLARED',
  'DISCREPANCY',
  'UNDER_REVIEW',
])

export const refundReasonEnum = pgEnum('refund_reason', [
  'DRIVER_CANCELLED',
  'PASSENGER_REQUEST',
  'OVERCHARGE',
  'TECHNICAL_ERROR',
  'COMPLAINT_RESOLUTION',
  'GOVERNMENT_ORDER',
  'OTHER',
])

export const paymentDisputeStatusEnum = pgEnum('payment_dispute_status', [
  'OPEN',
  'UNDER_REVIEW',
  'RESOLVED',
  'REJECTED',
  'CANCELLED',
  'CHARGEBACK_WON',
  'CHARGEBACK_LOST',
])

export const paymentAuditActionEnum = pgEnum('payment_audit_action', [
  'PAYMENT_INITIATED',
  'PAYMENT_SUCCEEDED',
  'PAYMENT_FAILED',
  'PAYMENT_CANCELLED',
  'WALLET_CREDITED',
  'WALLET_DEBITED',
  'REFUND_INITIATED',
  'REFUND_COMPLETED',
  'PAYOUT_REQUESTED',
  'PAYOUT_COMPLETED',
  'PAYOUT_FAILED',
  'DISPUTE_OPENED',
  'DISPUTE_RESOLVED',
  'CASH_COLLECTED',
  'CASH_RECONCILED',
  'ADJUSTMENT_APPLIED',
])

// ─── PAYMENTS ────────────────────────────────────────────────

export const payments = pgTable('payments', {
  id:             uuid('id').primaryKey().defaultRandom(),
  publicPaymentId: varchar('public_payment_id', { length: 20 }).notNull().unique(),
  // Format: PAY-XXXXXXXX

  driverId:   uuid('driver_id').notNull()
    .references(() => driverProfiles.id, { onDelete: 'restrict' }),
  providerId: uuid('provider_id')
    .references(() => providers.id, { onDelete: 'set null' }),

  // Source of this payment
  taxiTripId:       uuid('taxi_trip_id')
    .references(() => taxiTrips.id, { onDelete: 'restrict' }),
  providerActivityId: uuid('provider_activity_id')
    .references(() => providerActivities.id, { onDelete: 'restrict' }),
  // Either taxi_trip_id OR provider_activity_id — not both

  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  status:        paymentStatusEnum('payment_status').notNull().default('PENDING'),

  // Amount components — ALL NUMERIC(12,2), NEVER FLOAT
  fareAmount:   numeric('fare_amount',   { precision: 12, scale: 2 }).notNull(),
  tipAmount:    numeric('tip_amount',    { precision: 12, scale: 2 }).notNull().default('0'),
  // tip separated — never embedded in fare
  feeAmount:    numeric('fee_amount',    { precision: 12, scale: 2 }).notNull().default('0'),
  surchargeAmount: numeric('surcharge_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  grossAmount:  numeric('gross_amount',  { precision: 12, scale: 2 }).notNull(),
  // grossAmount = fareAmount + tipAmount + surchargeAmount
  driverNetAmount: numeric('driver_net_amount', { precision: 12, scale: 2 }).notNull(),
  // driverNetAmount = grossAmount - feeAmount

  currency:     varchar('currency',     { length: 3 }).notNull().default('CAD'),
  jurisdiction: varchar('jurisdiction', { length: 10 }).notNull().default('QC'),

  // Payment processor reference — tokenized, never raw card data
  processorReference: varchar('processor_reference', { length: 200 }),
  // Opaque reference from payment processor — never parsed for card data

  // Idempotency — prevents double charging
  idempotencyKey: varchar('idempotency_key', { length: 100 }).notNull().unique(),
  // Generated by client — UNIQUE constraint prevents duplicate charges

  processedAt: timestamp('processed_at', { withTimezone: true }),
  failedAt:    timestamp('failed_at',    { withTimezone: true }),
  failureCode: varchar('failure_code',   { length: 50 }),
  // Technical failure code — never exposed to driver in raw form

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_payment_driver').on(t.driverId),
  index('idx_payment_provider').on(t.providerId),
  index('idx_payment_taxi_trip').on(t.taxiTripId),
  index('idx_payment_activity').on(t.providerActivityId),
  index('idx_payment_status').on(t.status),
  index('idx_payment_method').on(t.paymentMethod),
  index('idx_payment_created').on(t.createdAt),
])

// ─── WALLET ACCOUNTS ─────────────────────────────────────────

export const walletAccounts = pgTable('wallet_accounts', {
  id:       uuid('id').primaryKey().defaultRandom(),
  driverId: uuid('driver_id').notNull().unique()
    .references(() => driverProfiles.id, { onDelete: 'restrict' }),
  // 1:1 with driver — one wallet per driver

  currency: varchar('currency', { length: 3 }).notNull().default('CAD'),
  jurisdiction: varchar('jurisdiction', { length: 10 }).notNull().default('QC'),

  // NO stored balance — ALWAYS computed from wallet_entries
  // balance = SUM(CREDIT entries) - SUM(DEBIT entries)
  // This ensures the ledger is the source of truth

  isActive:  boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_wallet_driver').on(t.driverId),
])

// ─── WALLET ENTRIES ───────────────────────────────────────────
// Append-only ledger — immutable after creation
// Balance = computed from entries — never stored separately

export const walletEntries = pgTable('wallet_entries', {
  id:              uuid('id').primaryKey().defaultRandom(),
  walletAccountId: uuid('wallet_account_id').notNull()
    .references(() => walletAccounts.id, { onDelete: 'restrict' }),
  driverId:        uuid('driver_id').notNull()
    .references(() => driverProfiles.id, { onDelete: 'restrict' }),

  entryType: walletEntryTypeEnum('entry_type').notNull(),
  direction: walletEntryDirectionEnum('direction').notNull(),
  // CREDIT or DEBIT — explicit, never inferred from sign

  // Amount — NUMERIC(12,2), always positive
  amount:   numeric('amount',   { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('CAD'),

  // Running balance snapshot — computed at entry creation for audit
  // NOT the authoritative balance — computed sum is authoritative
  balanceSnapshot: numeric('balance_snapshot', { precision: 12, scale: 2 }),

  // Source reference
  paymentId:           uuid('payment_id')
    .references(() => payments.id, { onDelete: 'set null' }),
  taxiTripId:          uuid('taxi_trip_id')
    .references(() => taxiTrips.id, { onDelete: 'set null' }),
  providerActivityId:  uuid('provider_activity_id')
    .references(() => providerActivities.id, { onDelete: 'set null' }),

  description: text('description').notNull(),
  // Human-readable description of this entry

  // Immutability — settled entries cannot be changed
  isSettled:  boolean('is_settled').notNull().default(false),
  settledAt:  timestamp('settled_at', { withTimezone: true }),

  // If this corrects another entry (CORRECTION type)
  correctedEntryId: uuid('corrected_entry_id'),

  // CRITICAL: wallet credited ONLY after payment SUCCEEDED
  // If payment FAILED → this entry must NOT exist
  paymentStatus: varchar('payment_status_at_credit', { length: 20 }),
  // Snapshot of payment status at credit time — must be 'SUCCEEDED'

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  // No updatedAt — immutable append-only ledger
}, (t) => [
  index('idx_wallet_entry_account').on(t.walletAccountId),
  index('idx_wallet_entry_driver').on(t.driverId),
  index('idx_wallet_entry_type').on(t.entryType),
  index('idx_wallet_entry_direction').on(t.direction),
  index('idx_wallet_entry_payment').on(t.paymentId),
  index('idx_wallet_entry_created').on(t.createdAt),
  // Temporal range queries for balance computation
  index('idx_wallet_entry_driver_created').on(t.driverId, t.createdAt),
])

// ─── CASH COLLECTIONS ────────────────────────────────────────

export const cashCollections = pgTable('cash_collections', {
  id:       uuid('id').primaryKey().defaultRandom(),
  driverId: uuid('driver_id').notNull()
    .references(() => driverProfiles.id, { onDelete: 'restrict' }),
  paymentId: uuid('payment_id')
    .references(() => payments.id, { onDelete: 'set null' }),

  // Amount collected — NUMERIC(12,2)
  collectedAmount: numeric('collected_amount', { precision: 12, scale: 2 }).notNull(),
  expectedAmount:  numeric('expected_amount',  { precision: 12, scale: 2 }).notNull(),
  differenceAmount: numeric('difference_amount', { precision: 12, scale: 2 }),
  // differenceAmount = collectedAmount - expectedAmount
  // May be positive (overpayment) or negative (underpayment)

  currency: varchar('currency', { length: 3 }).notNull().default('CAD'),

  status: cashStatusEnum('cash_collection_status').notNull().default('COLLECTED'),

  // Trip reference
  taxiTripId: uuid('taxi_trip_id')
    .references(() => taxiTrips.id, { onDelete: 'set null' }),

  collectedAt:  timestamp('collected_at',  { withTimezone: true }).notNull(),
  reconciledAt: timestamp('reconciled_at', { withTimezone: true }),

  // CRITICAL: Cash is a payment METHOD — not automatically "undeclared"
  // Tax treatment determined by Tax Engine — not by collection status
  declarationNote: text('declaration_note'),
  // Optional driver note at reconciliation

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_cash_driver').on(t.driverId),
  index('idx_cash_trip').on(t.taxiTripId),
  index('idx_cash_status').on(t.status),
  index('idx_cash_collected').on(t.collectedAt),
])

// ─── REFUNDS ─────────────────────────────────────────────────

export const refunds = pgTable('refunds', {
  id:              uuid('id').primaryKey().defaultRandom(),
  publicRefundId:  varchar('public_refund_id', { length: 20 }).notNull().unique(),
  // Format: REF-XXXXXXXX

  // Original payment — NEVER modified
  originalPaymentId: uuid('original_payment_id').notNull()
    .references(() => payments.id, { onDelete: 'restrict' }),
  driverId:          uuid('driver_id').notNull()
    .references(() => driverProfiles.id, { onDelete: 'restrict' }),

  // Refund amount — NUMERIC(12,2)
  refundAmount: numeric('refund_amount', { precision: 12, scale: 2 }).notNull(),
  currency:     varchar('currency',      { length: 3 }).notNull().default('CAD'),

  reason:     refundReasonEnum('refund_reason').notNull(),
  reasonNote: text('reason_note'),

  status: paymentStatusEnum('status').notNull().default('PENDING'),

  // Authorization chain — refunds require authorization
  requestedBy: uuid('requested_by').references(() => users.id),
  approvedBy:  uuid('approved_by').references(() => users.id),
  approvedAt:  timestamp('approved_at',   { withTimezone: true }),
  processedAt: timestamp('processed_at',  { withTimezone: true }),

  // Processor reference
  processorReference: varchar('processor_reference', { length: 200 }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_refund_payment').on(t.originalPaymentId),
  index('idx_refund_driver').on(t.driverId),
  index('idx_refund_status').on(t.status),
])

// ─── PAYOUTS ─────────────────────────────────────────────────

export const payouts = pgTable('payouts', {
  id:             uuid('id').primaryKey().defaultRandom(),
  publicPayoutId: varchar('public_payout_id', { length: 20 }).notNull().unique(),
  // Format: OUT-XXXXXXXX

  driverId:        uuid('driver_id').notNull()
    .references(() => driverProfiles.id, { onDelete: 'restrict' }),
  walletAccountId: uuid('wallet_account_id').notNull()
    .references(() => walletAccounts.id, { onDelete: 'restrict' }),

  payoutMethod: payoutMethodEnum('payout_method').notNull(),
  status:       payoutStatusEnum('payout_status').notNull().default('PENDING'),

  // Amount — NUMERIC(12,2)
  requestedAmount: numeric('requested_amount', { precision: 12, scale: 2 }).notNull(),
  processedAmount: numeric('processed_amount', { precision: 12, scale: 2 }),
  // May differ due to fees or rounding

  currency: varchar('currency', { length: 3 }).notNull().default('CAD'),

  // Bank/destination — tokenized reference ONLY
  // Raw account numbers NEVER stored here
  destinationTokenRef: varchar('destination_token_ref', { length: 200 }),
  // Opaque token from banking partner — never parsed for account details

  // Idempotency
  idempotencyKey: varchar('idempotency_key', { length: 100 }).notNull().unique(),

  requestedAt:  timestamp('requested_at',  { withTimezone: true }).notNull().defaultNow(),
  processedAt:  timestamp('processed_at',  { withTimezone: true }),
  completedAt:  timestamp('completed_at',  { withTimezone: true }),
  failedAt:     timestamp('failed_at',     { withTimezone: true }),
  returnedAt:   timestamp('returned_at',   { withTimezone: true }),

  failureCode: varchar('failure_code', { length: 50 }),
  returnReason: text('return_reason'),

  // Processor reference — opaque
  processorReference: varchar('processor_reference', { length: 200 }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_payout_driver').on(t.driverId),
  index('idx_payout_wallet').on(t.walletAccountId),
  index('idx_payout_status').on(t.status),
  index('idx_payout_requested').on(t.requestedAt),
])

// ─── PAYMENT DISPUTES ────────────────────────────────────────

export const paymentDisputes = pgTable('payment_disputes', {
  id:        uuid('id').primaryKey().defaultRandom(),
  paymentId: uuid('payment_id').notNull()
    .references(() => payments.id, { onDelete: 'restrict' }),
  driverId:  uuid('driver_id').notNull()
    .references(() => driverProfiles.id, { onDelete: 'restrict' }),

  status:      paymentDisputeStatusEnum('payment_dispute_status').notNull().default('OPEN'),
  disputeType: varchar('dispute_type', { length: 50 }).notNull(),
  // 'AMOUNT_INCORRECT' | 'DUPLICATE_CHARGE' | 'SERVICE_NOT_RENDERED'
  // | 'UNAUTHORIZED' | 'OTHER'

  claimedAmount: numeric('claimed_amount', { precision: 12, scale: 2 }),
  // Amount the driver believes is correct

  reason:     text('reason').notNull(),
  evidenceRef: text('evidence_ref'),
  // Reference to uploaded evidence document (via documents table)

  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  resolution: text('resolution'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_pay_dispute_payment').on(t.paymentId),
  index('idx_pay_dispute_driver').on(t.driverId),
  index('idx_pay_dispute_status').on(t.status),
])

// ─── PAYMENT AUDIT EVENTS ────────────────────────────────────

export const paymentAuditEvents = pgTable('payment_audit_events', {
  id:       uuid('id').primaryKey().defaultRandom(),
  driverId: uuid('driver_id').notNull()
    .references(() => driverProfiles.id, { onDelete: 'restrict' }),

  // Flexible reference to any payment entity
  paymentId:      uuid('payment_id').references(() => payments.id, { onDelete: 'set null' }),
  walletEntryId:  uuid('wallet_entry_id').references(() => walletEntries.id, { onDelete: 'set null' }),
  payoutId:       uuid('payout_id').references(() => payouts.id, { onDelete: 'set null' }),
  refundId:       uuid('refund_id').references(() => refunds.id, { onDelete: 'set null' }),

  actorId:   uuid('actor_id').references(() => users.id),
  actorRole: varchar('actor_role', { length: 50 }),

  action:   paymentAuditActionEnum('action').notNull(),
  result:   varchar('result', { length: 20 }).notNull().default('SUCCESS'),
  // 'SUCCESS' | 'FAILURE' | 'BLOCKED'

  // NEVER includes: raw card data, account numbers, tokens, full processor refs
  metadata: jsonb('metadata').notNull().default({}),

  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_pay_audit_driver').on(t.driverId),
  index('idx_pay_audit_payment').on(t.paymentId),
  index('idx_pay_audit_action').on(t.action),
  index('idx_pay_audit_occurred').on(t.occurredAt),
])

// ─── RELATIONS ────────────────────────────────────────────────

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  driver:           one(driverProfiles,    { fields: [payments.driverId],           references: [driverProfiles.id] }),
  provider:         one(providers,         { fields: [payments.providerId],          references: [providers.id] }),
  taxiTrip:         one(taxiTrips,         { fields: [payments.taxiTripId],          references: [taxiTrips.id] }),
  providerActivity: one(providerActivities, { fields: [payments.providerActivityId], references: [providerActivities.id] }),
  walletEntries:    many(walletEntries),
  refunds:          many(refunds),
  disputes:         many(paymentDisputes),
}))

export const walletAccountsRelations = relations(walletAccounts, ({ one, many }) => ({
  driver:  one(driverProfiles, { fields: [walletAccounts.driverId], references: [driverProfiles.id] }),
  entries: many(walletEntries),
  payouts: many(payouts),
}))

export const walletEntriesRelations = relations(walletEntries, ({ one }) => ({
  walletAccount:    one(walletAccounts,    { fields: [walletEntries.walletAccountId],    references: [walletAccounts.id] }),
  driver:           one(driverProfiles,    { fields: [walletEntries.driverId],           references: [driverProfiles.id] }),
  payment:          one(payments,          { fields: [walletEntries.paymentId],          references: [payments.id] }),
  taxiTrip:         one(taxiTrips,         { fields: [walletEntries.taxiTripId],         references: [taxiTrips.id] }),
  providerActivity: one(providerActivities, { fields: [walletEntries.providerActivityId], references: [providerActivities.id] }),
}))

export const refundsRelations = relations(refunds, ({ one }) => ({
  originalPayment: one(payments,       { fields: [refunds.originalPaymentId], references: [payments.id] }),
  driver:          one(driverProfiles, { fields: [refunds.driverId],          references: [driverProfiles.id] }),
  requestedBy:     one(users,          { fields: [refunds.requestedBy],       references: [users.id] }),
  approvedBy:      one(users,          { fields: [refunds.approvedBy],        references: [users.id] }),
}))

export const payoutsRelations = relations(payouts, ({ one }) => ({
  driver:        one(driverProfiles, { fields: [payouts.driverId],        references: [driverProfiles.id] }),
  walletAccount: one(walletAccounts, { fields: [payouts.walletAccountId], references: [walletAccounts.id] }),
}))

export const cashCollectionsRelations = relations(cashCollections, ({ one }) => ({
  driver:   one(driverProfiles, { fields: [cashCollections.driverId],   references: [driverProfiles.id] }),
  payment:  one(payments,       { fields: [cashCollections.paymentId],  references: [payments.id] }),
  taxiTrip: one(taxiTrips,      { fields: [cashCollections.taxiTripId], references: [taxiTrips.id] }),
}))
