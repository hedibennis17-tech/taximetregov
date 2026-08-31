// ================================================================
// TAXIMÈTRE.GOV — UNIVERSAL JURISDICTION SERVICE
// PRE-DB20 V2: Taximeter Rules · Multi-Juridiction · Service Types
// ================================================================

// ─── SERVICE TYPE TAXIMETER RULES ────────────────────────────

export type ServiceTypeCode =
  | 'TAXI' | 'RIDESHARE' | 'DELIVERY' | 'PERSONAL' | 'COURIER' | 'OTHER'

// RÈGLE ABSOLUE — enforced at backend level
export const SERVICE_TAXIMETER_RULES: Record<ServiceTypeCode, boolean> = {
  TAXI:      true,   // Taximeter ON — government fare engine
  RIDESHARE: true,   // Taximeter ON — provider or government fare
  DELIVERY:  false,  // Taximeter OFF — ALWAYS (DoorDash, UberEats, Skip, Instacart)
  PERSONAL:  false,  // Taximeter OFF
  COURIER:   false,  // Taximeter OFF
  OTHER:     false,  // Taximeter OFF
}

export function isTaximeterApplicable(serviceTypeCode: ServiceTypeCode): boolean {
  return SERVICE_TAXIMETER_RULES[serviceTypeCode] ?? false
}

export function assertTaximeterOff(serviceTypeCode: ServiceTypeCode): void {
  if (SERVICE_TAXIMETER_RULES[serviceTypeCode] === true) {
    throw new Error(
      `isTaximeterApplicable = true pour ${serviceTypeCode} — cette assertion sert à vérifier les types OFF`
    )
  }
}

// ─── JURISDICTION RESOLUTION ──────────────────────────────────

export interface JurisdictionContext {
  countryCode:  string    // 'CA', 'US', 'FR'
  provinceCode: string | null  // 'QC', 'ON', 'BC'
  cityRef:      string | null  // Optional
}

export interface TaxContext {
  jurisdictionCode: string
  taxSystemType:    string
  applicableTaxTypes: string[]  // ['GST', 'QST'] or ['HST'] etc.
  calcMethod:       string
}

// Mapping de référence dev — production uses DB tax_systems + tax_types
const DEV_JURISDICTION_TAX_CONTEXT: Record<string, TaxContext> = {
  QC: {
    jurisdictionCode:   'QC',
    taxSystemType:      'GST_QST',
    applicableTaxTypes: ['GST', 'QST'],
    calcMethod:         'TWO_STEP',
  },
  ON: {
    jurisdictionCode:   'ON',
    taxSystemType:      'HST',
    applicableTaxTypes: ['HST'],
    calcMethod:         'ONE_STEP',
  },
  BC: {
    jurisdictionCode:   'BC',
    taxSystemType:      'GST_PST',
    applicableTaxTypes: ['GST', 'PST'],
    calcMethod:         'COMPONENT',
  },
  AB: {
    jurisdictionCode:   'AB',
    taxSystemType:      'GST_ONLY',
    applicableTaxTypes: ['GST'],
    calcMethod:         'COMPONENT',
  },
  NB: {
    jurisdictionCode:   'NB',
    taxSystemType:      'HST',
    applicableTaxTypes: ['HST'],
    calcMethod:         'ONE_STEP',
  },
  NS: {
    jurisdictionCode:   'NS',
    taxSystemType:      'HST',
    applicableTaxTypes: ['HST'],
    calcMethod:         'ONE_STEP',
  },
  NL: {
    jurisdictionCode:   'NL',
    taxSystemType:      'HST',
    applicableTaxTypes: ['HST'],
    calcMethod:         'ONE_STEP',
  },
  PEI: {
    jurisdictionCode:   'PEI',
    taxSystemType:      'HST',
    applicableTaxTypes: ['HST'],
    calcMethod:         'ONE_STEP',
  },
  MB: {
    jurisdictionCode:   'MB',
    taxSystemType:      'GST_PST',
    applicableTaxTypes: ['GST', 'RST'],
    calcMethod:         'COMPONENT',
  },
  SK: {
    jurisdictionCode:   'SK',
    taxSystemType:      'GST_PST',
    applicableTaxTypes: ['GST', 'PST'],
    calcMethod:         'COMPONENT',
  },
}

export function getTaxContextForJurisdiction(
  jurisdictionCode: string,
): TaxContext | null {
  // Production: query DB tax_systems + tax_types
  // Dev reference only
  return DEV_JURISDICTION_TAX_CONTEXT[jurisdictionCode] ?? null
}

export function taxContextChangesWithJurisdiction(
  from: string,
  to:   string,
): boolean {
  const ctxFrom = getTaxContextForJurisdiction(from)
  const ctxTo   = getTaxContextForJurisdiction(to)
  if (!ctxFrom || !ctxTo) return true
  return ctxFrom.taxSystemType !== ctxTo.taxSystemType
}

// ─── SEED DATA ────────────────────────────────────────────────

export const SEED_COUNTRIES = [
  { isoCode: 'CA', iso3Code: 'CAN', name: 'Canada',         nameFr: 'Canada',         nameEn: 'Canada',         currencyCode: 'CAD', isActive: true, isPilot: true  },
  { isoCode: 'US', iso3Code: 'USA', name: 'United States',  nameFr: 'États-Unis',     nameEn: 'United States',  currencyCode: 'USD', isActive: true, isPilot: false },
  { isoCode: 'FR', iso3Code: 'FRA', name: 'France',         nameFr: 'France',         nameEn: 'France',         currencyCode: 'EUR', isActive: true, isPilot: false },
  { isoCode: 'TN', iso3Code: 'TUN', name: 'Tunisie',        nameFr: 'Tunisie',        nameEn: 'Tunisia',        currencyCode: 'TND', isActive: true, isPilot: false },
] as const

export const SEED_PROVINCES_STATES = [
  // Canada — Provinces et Territoires
  { countryCode: 'CA', code: 'QC',  name: 'Québec',                         nameFr: 'Québec',                         nameEn: 'Quebec',                type: 'PROVINCE',  taxSystem: 'GST_QST'  },
  { countryCode: 'CA', code: 'ON',  name: 'Ontario',                        nameFr: 'Ontario',                        nameEn: 'Ontario',               type: 'PROVINCE',  taxSystem: 'HST'      },
  { countryCode: 'CA', code: 'BC',  name: 'Colombie-Britannique',           nameFr: 'Colombie-Britannique',           nameEn: 'British Columbia',      type: 'PROVINCE',  taxSystem: 'GST_PST'  },
  { countryCode: 'CA', code: 'AB',  name: 'Alberta',                        nameFr: 'Alberta',                        nameEn: 'Alberta',               type: 'PROVINCE',  taxSystem: 'GST_ONLY' },
  { countryCode: 'CA', code: 'MB',  name: 'Manitoba',                       nameFr: 'Manitoba',                       nameEn: 'Manitoba',              type: 'PROVINCE',  taxSystem: 'GST_PST'  },
  { countryCode: 'CA', code: 'SK',  name: 'Saskatchewan',                   nameFr: 'Saskatchewan',                   nameEn: 'Saskatchewan',          type: 'PROVINCE',  taxSystem: 'GST_PST'  },
  { countryCode: 'CA', code: 'NS',  name: 'Nouvelle-Écosse',                nameFr: 'Nouvelle-Écosse',                nameEn: 'Nova Scotia',           type: 'PROVINCE',  taxSystem: 'HST'      },
  { countryCode: 'CA', code: 'NB',  name: 'Nouveau-Brunswick',              nameFr: 'Nouveau-Brunswick',              nameEn: 'New Brunswick',         type: 'PROVINCE',  taxSystem: 'HST'      },
  { countryCode: 'CA', code: 'NL',  name: 'Terre-Neuve-et-Labrador',        nameFr: 'Terre-Neuve-et-Labrador',        nameEn: 'Newfoundland and Labrador', type: 'PROVINCE', taxSystem: 'HST' },
  { countryCode: 'CA', code: 'PEI', name: 'Île-du-Prince-Édouard',          nameFr: 'Île-du-Prince-Édouard',          nameEn: 'Prince Edward Island',  type: 'PROVINCE',  taxSystem: 'HST'      },
  { countryCode: 'CA', code: 'YT',  name: 'Yukon',                          nameFr: 'Yukon',                          nameEn: 'Yukon',                 type: 'TERRITORY', taxSystem: 'GST_ONLY' },
  { countryCode: 'CA', code: 'NT',  name: 'Territoires du Nord-Ouest',      nameFr: 'Territoires du Nord-Ouest',      nameEn: 'Northwest Territories', type: 'TERRITORY', taxSystem: 'GST_ONLY' },
  { countryCode: 'CA', code: 'NU',  name: 'Nunavut',                        nameFr: 'Nunavut',                        nameEn: 'Nunavut',               type: 'TERRITORY', taxSystem: 'GST_ONLY' },
] as const

export const SEED_SERVICE_TYPES = [
  {
    code:                    'TAXI',
    label:                   'Taxi',
    labelFr:                 'Taxi',
    labelEn:                 'Taxi',
    taximeterApplicable:     true,   // Taximeter ON — government fare engine
    gpsRequired:             true,
    revenueTrackingRequired: true,
    displayOrder:            1,
    isActive:                true,
    taxTreatmentNote:        'Fourniture taxable — TPS/TVQ selon juridiction',
  },
  {
    code:                    'RIDESHARE',
    label:                   'Covoiturage',
    labelFr:                 'Covoiturage (Rideshare)',
    labelEn:                 'Rideshare',
    taximeterApplicable:     true,   // Taximeter ON
    gpsRequired:             true,
    revenueTrackingRequired: true,
    displayOrder:            2,
    isActive:                true,
    taxTreatmentNote:        'Fourniture taxable — traitement fiscal selon règles applicables',
  },
  {
    code:                    'DELIVERY',
    label:                   'Livraison',
    labelFr:                 'Livraison',
    labelEn:                 'Delivery',
    taximeterApplicable:     false,  // Taximeter OFF — ALWAYS (DoorDash, UberEats, Skip, Instacart)
    gpsRequired:             true,
    revenueTrackingRequired: true,
    displayOrder:            3,
    isActive:                true,
    taxTreatmentNote:        'Montant fournisseur — pas de calcul taximètre',
  },
  {
    code:                    'PERSONAL',
    label:                   'Personnel',
    labelFr:                 'Usage personnel',
    labelEn:                 'Personal use',
    taximeterApplicable:     false,  // Taximeter OFF
    gpsRequired:             false,
    revenueTrackingRequired: false,
    displayOrder:            4,
    isActive:                true,
    taxTreatmentNote:        'Non taxable — usage personnel',
  },
  {
    code:                    'COURIER',
    label:                   'Courrier',
    labelFr:                 'Service courrier',
    labelEn:                 'Courier service',
    taximeterApplicable:     false,  // Taximeter OFF
    gpsRequired:             true,
    revenueTrackingRequired: true,
    displayOrder:            5,
    isActive:                true,
    taxTreatmentNote:        'Montant fournisseur — pas de calcul taximètre',
  },
] as const

export const SEED_TAX_AUTHORITIES = [
  {
    jurisdictionCode: 'QC',
    name:             'Revenu Québec',
    nameFr:           'Revenu Québec',
    nameEn:           'Revenu Québec',
    abbreviation:     'RQ',
    authorityType:    'PROVINCIAL',
    officialUrl:      'https://www.revenuquebec.ca',
    officialReference: 'Loi sur la taxe de vente du Québec (LTVQ)',
    registrationRequired: true,
    isDev:            true,
  },
  {
    jurisdictionCode: 'CA',
    name:             'Agence du revenu du Canada',
    nameFr:           'Agence du revenu du Canada (ARC)',
    nameEn:           'Canada Revenue Agency (CRA)',
    abbreviation:     'ARC',
    authorityType:    'FEDERAL',
    officialUrl:      'https://www.canada.ca/cra',
    officialReference: "Loi sur la taxe d'accise — Partie IX",
    registrationRequired: true,
    isDev:            true,
  },
] as const
