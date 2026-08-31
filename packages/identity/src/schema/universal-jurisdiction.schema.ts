// ================================================================
// TAXIMÈTRE.GOV — UNIVERSAL JURISDICTION ENGINE
// PRE-DB20 Architecture V2 — Canada + International
// ================================================================
//
// AUDIT DB1-19:
//   jurisdictions (pre-db10.schema.ts) → EXISTS · code/country string only
//   tax_rule_sets (pre-db10.schema.ts) → EXISTS · tpsRate/tvqRate at set level
//   tax_components (tax-engine.schema.ts) → EXISTS · GST/QST/HST components
//   activity_types (activities.schema.ts) → EXISTS · taximeterEligible
//
// V2 EXTENDS (JAMAIS supprime):
//   jurisdictions → ADD country_id FK + level + parentId
//   (ALTER via migration — les colonnes existantes sont préservées)
//
// V2 AJOUTE (nouvelles tables uniquement):
//   countries                  → ISO 3166 country catalog
//   provinces_states_regions   → Provinces CA + States US + Régions FR etc.
//   tax_authorities            → Revenu Québec, CRA, IRS, etc.
//   tax_systems                → GST/QST, HST, VAT, Sales Tax
//   tax_types                  → GST, QST, HST, VAT...
//   tax_exemptions             → exemptions par juridiction/type
//   service_types              → TAXI/RIDESHARE/DELIVERY/PERSONAL
//   driver_jurisdiction_profiles → profil fiscal du chauffeur par juridiction
//
// RÈGLES ABSOLUES:
// 1. TAXI + RIDESHARE → taximeter ON · DELIVERY + PERSONAL → taximeter OFF
// 2. Tax rates: JAMAIS hardcodés → toujours depuis tax_components en DB
// 3. Multi-juridiction: QC/ON/CA + international extensible
// 4. Provider entries ≠ API integration (MOCK_ONLY par défaut)
// 5. All amounts: NUMERIC — NEVER FLOAT
// ================================================================

import {
  pgTable, pgEnum, uuid, text, boolean, integer,
  timestamp, jsonb, uniqueIndex, index, varchar,
  numeric, smallint,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users }                from './auth.schema'
import { driverProfiles }       from './profiles.schema'
import { jurisdictions }        from './pre-db10.schema'

// ─── ENUMS ───────────────────────────────────────────────────

export const jurisdictionLevelEnum = pgEnum('jurisdiction_level', [
  'COUNTRY',
  'FEDERAL',
  'PROVINCE',
  'STATE',
  'TERRITORY',
  'REGION',
  'MUNICIPALITY',
  'SPECIAL',
])

export const taxAuthorityTypeEnum = pgEnum('tax_authority_type', [
  'FEDERAL',
  'PROVINCIAL',
  'STATE',
  'MUNICIPAL',
  'SPECIAL',
])

export const taxSystemTypeEnum = pgEnum('tax_system_type', [
  'GST_QST',      // Québec
  'HST',          // ON, NB, NS, NL, PEI
  'GST_PST',      // BC, MB, SK
  'GST_ONLY',     // AB, territories
  'VAT',          // EU, UK, FR
  'SALES_TAX',    // US states
  'OTHER',
])

export const taxTypeCodeEnum = pgEnum('tax_type_code', [
  'GST',    // Goods and Services Tax (Canada federal)
  'QST',    // Québec Sales Tax / TVQ
  'HST',    // Harmonized Sales Tax
  'PST',    // Provincial Sales Tax
  'RST',    // Retail Sales Tax (Manitoba)
  'VAT',    // Value Added Tax (EU/UK/FR)
  'SALES',  // US Sales Tax
  'OTHER',
])

export const serviceTypeCodeEnum = pgEnum('service_type_code', [
  'TAXI',       // Taximeter ON · gouvernement calcule le tarif
  'RIDESHARE',  // Taximeter ON · provider calcule le tarif (ou gouvernement)
  'DELIVERY',   // Taximeter OFF · GPS tracking uniquement
  'PERSONAL',   // Taximeter OFF · usage personnel/autre
  'COURIER',    // Taximeter OFF · courrier général
  'OTHER',
])

export const exemptionTypeEnum = pgEnum('tax_exemption_type', [
  'ZERO_RATED',       // Fourniture taxable à taux zéro (≠ exonérée)
  'EXEMPT',           // Pas une fourniture taxable
  'PERSONAL_USE',     // Usage personnel
  'BASIC_NECESSITY',  // Produit de première nécessité
  'GOVERNMENT',       // Entité gouvernementale
  'EXPORT',           // Exportation
  'OTHER',
])

export const driverJurisdictionStatusEnum = pgEnum('driver_jurisdiction_status', [
  'ACTIVE',
  'PENDING_REGISTRATION',
  'SUSPENDED',
  'INACTIVE',
  'DEREGISTERED',
])

// ─── COUNTRIES ────────────────────────────────────────────────

export const countries = pgTable('countries', {
  id:          uuid('id').primaryKey().defaultRandom(),
  isoCode:     varchar('iso_code',      { length: 2  }).notNull().unique(),
  // ISO 3166-1 alpha-2: 'CA', 'US', 'FR', 'GB', 'TN', etc.
  iso3Code:    varchar('iso3_code',     { length: 3  }),
  // ISO 3166-1 alpha-3: 'CAN', 'USA', 'FRA'
  name:        varchar('name',          { length: 100 }).notNull(),
  nameFr:      varchar('name_fr',       { length: 100 }),
  nameEn:      varchar('name_en',       { length: 100 }),
  currencyCode: varchar('currency_code', { length: 3  }).notNull(),
  // ISO 4217: 'CAD', 'USD', 'EUR'
  callingCode: varchar('calling_code',  { length: 10 }),
  // '+1', '+33', etc.
  isActive:    boolean('is_active').notNull().default(true),
  isPilot:     boolean('is_pilot').notNull().default(false),
  // isPilot=true = supported in pilot program
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_country_iso').on(t.isoCode),
  index('idx_country_active').on(t.isActive),
])

// ─── PROVINCES / STATES / REGIONS ─────────────────────────────

export const provincesStatesRegions = pgTable('provinces_states_regions', {
  id:        uuid('id').primaryKey().defaultRandom(),
  countryId: uuid('country_id').notNull()
    .references(() => countries.id, { onDelete: 'restrict' }),

  code:    varchar('code',    { length: 10 }).notNull(),
  // 'QC', 'ON', 'BC', 'AB' (CA) | 'CA', 'NY' (US) | 'IDF' (FR)
  name:    varchar('name',    { length: 100 }).notNull(),
  nameFr:  varchar('name_fr', { length: 100 }),
  nameEn:  varchar('name_en', { length: 100 }),

  type: jurisdictionLevelEnum('type').notNull(),
  // PROVINCE | STATE | TERRITORY | REGION

  // Tax system for this province/state
  taxSystem: taxSystemTypeEnum('tax_system'),

  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_psr_country_code').on(t.countryId, t.code),
  index('idx_psr_country').on(t.countryId),
  index('idx_psr_type').on(t.type),
])

// ─── TAX AUTHORITIES ──────────────────────────────────────────

export const taxAuthorities = pgTable('tax_authorities', {
  id:             uuid('id').primaryKey().defaultRandom(),
  jurisdictionId: uuid('jurisdiction_id').notNull()
    .references(() => jurisdictions.id, { onDelete: 'restrict' }),

  name:          varchar('name',           { length: 200 }).notNull(),
  nameFr:        varchar('name_fr',        { length: 200 }),
  nameEn:        varchar('name_en',        { length: 200 }),
  abbreviation:  varchar('abbreviation',   { length: 20  }),
  // 'RQ', 'CRA', 'IRS', 'DGFiP'

  authorityType: taxAuthorityTypeEnum('authority_type').notNull(),

  // Official reference — never an invented API endpoint
  officialUrl:        varchar('official_url',         { length: 500 }),
  officialReference:  varchar('official_reference',   { length: 200 }),
  // Regulation/law reference (e.g. 'Loi sur la taxe de vente du Québec')

  // Registration required to collect this authority's taxes
  registrationRequired: boolean('registration_required').notNull().default(false),
  registrationThreshold: numeric('registration_threshold', { precision: 12, scale: 2 }),
  // Annual revenue threshold triggering mandatory registration

  isActive:   boolean('is_active').notNull().default(true),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:  timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_tax_authority_jurisdiction').on(t.jurisdictionId),
  index('idx_tax_authority_type').on(t.authorityType),
])

// ─── TAX SYSTEMS ──────────────────────────────────────────────

export const taxSystems = pgTable('tax_systems', {
  id:             uuid('id').primaryKey().defaultRandom(),
  jurisdictionId: uuid('jurisdiction_id').notNull()
    .references(() => jurisdictions.id, { onDelete: 'restrict' }),
  authorityId:    uuid('authority_id')
    .references(() => taxAuthorities.id, { onDelete: 'set null' }),

  code:       varchar('code',       { length: 30 }).notNull(),
  // 'QC_GST_QST', 'ON_HST', 'US_SALES_TAX', 'EU_VAT'
  name:       varchar('name',       { length: 100 }).notNull(),
  systemType: taxSystemTypeEnum('system_type').notNull(),

  // Calculation method
  calcMethod: varchar('calc_method', { length: 20 }).notNull().default('TWO_STEP'),
  // 'TWO_STEP' (QC) | 'ONE_STEP' | 'COMPONENT' | 'INCLUSIVE'

  isActive:   boolean('is_active').notNull().default(true),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:  timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_tax_system_jurisdiction_code').on(t.jurisdictionId, t.code),
  index('idx_tax_system_jurisdiction').on(t.jurisdictionId),
])

// ─── TAX TYPES ────────────────────────────────────────────────

export const taxTypes = pgTable('tax_types', {
  id:          uuid('id').primaryKey().defaultRandom(),
  taxSystemId: uuid('tax_system_id').notNull()
    .references(() => taxSystems.id, { onDelete: 'restrict' }),
  authorityId: uuid('authority_id')
    .references(() => taxAuthorities.id, { onDelete: 'set null' }),

  code:     taxTypeCodeEnum('code').notNull(),
  name:     varchar('name',    { length: 100 }).notNull(),
  nameFr:   varchar('name_fr', { length: 100 }),
  nameEn:   varchar('name_en', { length: 100 }),

  // Rate — NUMERIC, NEVER FLOAT
  defaultRate:      numeric('default_rate',      { precision: 8, scale: 5 }),
  // Reference/default only — actual rate from tax_components (versioned)

  calculationOrder: smallint('calculation_order').notNull().default(1),
  isCompound:       boolean('is_compound').notNull().default(false),
  isInclusive:      boolean('is_inclusive').notNull().default(false),

  legalReference:   varchar('legal_reference',   { length: 500 }),
  // Official statute/regulation reference

  isActive:   boolean('is_active').notNull().default(true),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:  timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_tax_type_system_code').on(t.taxSystemId, t.code),
  index('idx_tax_type_system').on(t.taxSystemId),
  index('idx_tax_type_code').on(t.code),
])

// ─── TAX EXEMPTIONS ───────────────────────────────────────────

export const taxExemptions = pgTable('tax_exemptions', {
  id:             uuid('id').primaryKey().defaultRandom(),
  taxTypeId:      uuid('tax_type_id').notNull()
    .references(() => taxTypes.id, { onDelete: 'restrict' }),
  jurisdictionId: uuid('jurisdiction_id').notNull()
    .references(() => jurisdictions.id, { onDelete: 'restrict' }),

  code:           varchar('code',           { length: 60 }).notNull(),
  name:           varchar('name',           { length: 200 }).notNull(),
  exemptionType:  exemptionTypeEnum('exemption_type').notNull(),

  // Conditions
  applicableToServiceTypes: text('applicable_to_service_types').array(),
  // e.g. ['TAXI', 'RIDESHARE'] or null = all

  eligibilityConditions: jsonb('eligibility_conditions').notNull().default({}),
  // Structured conditions — never arbitrary code

  // Dates
  effectiveFrom:  varchar('effective_from',  { length: 10 }).notNull(),
  effectiveUntil: varchar('effective_until', { length: 10 }),

  legalReference: varchar('legal_reference', { length: 500 }),
  // Official statute/regulation reference — never invented

  documentationRequired: boolean('documentation_required').notNull().default(false),
  // Whether driver must provide documentation to claim exemption

  isActive:   boolean('is_active').notNull().default(true),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:  timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_tax_exemption_type_jurisdiction').on(t.taxTypeId, t.jurisdictionId, t.code),
  index('idx_tax_exemption_type').on(t.taxTypeId),
  index('idx_tax_exemption_jurisdiction').on(t.jurisdictionId),
])

// ─── SERVICE TYPES ────────────────────────────────────────────
// Extensible service type catalog with taximeter rules

export const serviceTypes = pgTable('service_types', {
  id:   uuid('id').primaryKey().defaultRandom(),
  code: serviceTypeCodeEnum('code').notNull().unique(),

  label:   varchar('label',    { length: 100 }).notNull(),
  labelFr: varchar('label_fr', { length: 100 }),
  labelEn: varchar('label_en', { length: 100 }),

  // TAXIMETER RULE — enforced at backend level
  taximeterApplicable: boolean('taximeter_applicable').notNull(),
  // TAXI=true · RIDESHARE=true · DELIVERY=false · PERSONAL=false · COURIER=false

  // GPS always required for tracked activities
  gpsRequired:         boolean('gps_required').notNull().default(true),

  // Revenue tracking
  revenueTrackingRequired: boolean('revenue_tracking_required').notNull().default(true),

  // Tax treatment note (not the actual tax logic — that's in tax_types)
  taxTreatmentNote: text('tax_treatment_note'),
  // e.g. 'Taxable supply under GST/QST — verify eligibility with tax authority'

  displayOrder: smallint('display_order').notNull().default(99),
  isActive:     boolean('is_active').notNull().default(true),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_service_type_code').on(t.code),
  index('idx_service_type_taximeter').on(t.taximeterApplicable),
])

// ─── DRIVER JURISDICTION PROFILES ────────────────────────────

export const driverJurisdictionProfiles = pgTable('driver_jurisdiction_profiles', {
  id:       uuid('id').primaryKey().defaultRandom(),
  driverId: uuid('driver_id').notNull()
    .references(() => driverProfiles.id, { onDelete: 'restrict' }),
  jurisdictionId: uuid('jurisdiction_id').notNull()
    .references(() => jurisdictions.id, { onDelete: 'restrict' }),

  status: driverJurisdictionStatusEnum('status').notNull().default('PENDING_REGISTRATION'),

  // Tax registration — masked · full numbers in sensitive_identifiers (DB-2)
  taxRegistrationMasked: varchar('tax_registration_masked', { length: 30 }),
  // e.g. '••••1234'

  // Registration status per tax type
  gstRegistrationStatus: varchar('gst_registration_status', { length: 30 }).notNull().default('UNKNOWN'),
  qstRegistrationStatus: varchar('qst_registration_status', { length: 30 }).notNull().default('UNKNOWN'),
  hstRegistrationStatus: varchar('hst_registration_status', { length: 30 }).notNull().default('UNKNOWN'),
  // 'NOT_REGISTERED' | 'PENDING' | 'REGISTERED' | 'SUSPENDED' | 'UNKNOWN'

  // Filing configuration
  filingFrequency: varchar('filing_frequency', { length: 20 }).notNull().default('QUARTERLY'),
  // 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'

  // Allowed service types in this jurisdiction
  allowedServiceTypes: text('allowed_service_types').array(),
  // e.g. ['TAXI', 'RIDESHARE'] — null = platform defaults

  effectiveFrom:  varchar('effective_from', { length: 10 }).notNull(),
  effectiveUntil: varchar('effective_until', { length: 10 }),

  verifiedBy: uuid('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),

  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:  timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('idx_driver_jurisdiction_unique').on(t.driverId, t.jurisdictionId),
  index('idx_driver_jurisdiction_driver').on(t.driverId),
  index('idx_driver_jurisdiction_jurisdiction').on(t.jurisdictionId),
  index('idx_driver_jurisdiction_status').on(t.status),
])

// ─── RELATIONS ────────────────────────────────────────────────

export const countriesRelations = relations(countries, ({ many }) => ({
  provincesStates: many(provincesStatesRegions),
}))

export const provincesStatesRegionsRelations = relations(provincesStatesRegions, ({ one }) => ({
  country: one(countries, { fields: [provincesStatesRegions.countryId], references: [countries.id] }),
}))

export const taxAuthoritiesRelations = relations(taxAuthorities, ({ one, many }) => ({
  jurisdiction: one(jurisdictions, { fields: [taxAuthorities.jurisdictionId], references: [jurisdictions.id] }),
  taxSystems:   many(taxSystems),
  taxTypes:     many(taxTypes),
}))

export const taxSystemsRelations = relations(taxSystems, ({ one, many }) => ({
  jurisdiction: one(jurisdictions,   { fields: [taxSystems.jurisdictionId], references: [jurisdictions.id] }),
  authority:    one(taxAuthorities,  { fields: [taxSystems.authorityId],    references: [taxAuthorities.id] }),
  taxTypes:     many(taxTypes),
}))

export const taxTypesRelations = relations(taxTypes, ({ one, many }) => ({
  taxSystem:  one(taxSystems,     { fields: [taxTypes.taxSystemId],  references: [taxSystems.id] }),
  authority:  one(taxAuthorities, { fields: [taxTypes.authorityId],  references: [taxAuthorities.id] }),
  exemptions: many(taxExemptions),
}))

export const taxExemptionsRelations = relations(taxExemptions, ({ one }) => ({
  taxType:      one(taxTypes,      { fields: [taxExemptions.taxTypeId],      references: [taxTypes.id] }),
  jurisdiction: one(jurisdictions, { fields: [taxExemptions.jurisdictionId], references: [jurisdictions.id] }),
}))

export const driverJurisdictionProfilesRelations = relations(driverJurisdictionProfiles, ({ one }) => ({
  driver:       one(driverProfiles, { fields: [driverJurisdictionProfiles.driverId],       references: [driverProfiles.id] }),
  jurisdiction: one(jurisdictions,  { fields: [driverJurisdictionProfiles.jurisdictionId], references: [jurisdictions.id] }),
  verifiedBy:   one(users,          { fields: [driverJurisdictionProfiles.verifiedBy],     references: [users.id] }),
}))
