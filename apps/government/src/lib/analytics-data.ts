// TAXIMETER.GOV — Données analytiques provinciales QC
// PILOTE · DONNÉES SYNTHÉTIQUES · ~9 847 chauffeurs actifs

export const PILOT = 'PILOTE · DONNÉES SYNTHÉTIQUES · AUCUNE TRANSMISSION OFFICIELLE'

const r2 = (n: number) => Math.round(n * 100) / 100
export const money = (n: number) => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n)
export const moneyK = (n: number) => n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M$` : n >= 1_000 ? `${(n/1_000).toFixed(0)}k$` : `${n}$`
export const pct = (n: number) => `${n.toFixed(1)}%`

// ── Revenus mensuels Q1–Q3 2026 ─────────────────────────────
export const MONTHLY_REVENUE = [
  { month: 'Jan', brut: 58_200_000, taxi: 25_287_000, rideshare: 20_370_000, delivery: 12_543_000 },
  { month: 'Fév', brut: 61_400_000, taxi: 26_402_000, rideshare: 21_490_000, delivery: 13_508_000 },
  { month: 'Mar', brut: 66_400_000, taxi: 27_888_000, rideshare: 23_240_000, delivery: 15_272_000 },
  { month: 'Avr', brut: 64_800_000, taxi: 26_568_000, rideshare: 22_680_000, delivery: 15_552_000 },
  { month: 'Mai', brut: 68_200_000, taxi: 27_398_000, rideshare: 23_870_000, delivery: 16_932_000 },
  { month: 'Jun', brut: 70_500_000, taxi: 28_200_000, rideshare: 24_675_000, delivery: 17_625_000 },
  { month: 'Jul', brut: 71_400_000, taxi: 28_560_000, rideshare: 24_990_000, delivery: 17_850_000 },
  { month: 'Aoû', brut: 76_200_000, taxi: 30_480_000, rideshare: 26_670_000, delivery: 19_050_000 },
  { month: 'Sep', brut: 77_250_000, taxi: 30_900_000, rideshare: 27_038_000, delivery: 19_312_000 },
]

export const TOTAL_BRUT = MONTHLY_REVENUE.reduce((s, m) => s + m.brut, 0)
export const TOTAL_TAXI = MONTHLY_REVENUE.reduce((s, m) => s + m.taxi, 0)
export const TOTAL_RIDESHARE = MONTHLY_REVENUE.reduce((s, m) => s + m.rideshare, 0)
export const TOTAL_DELIVERY = MONTHLY_REVENUE.reduce((s, m) => s + m.delivery, 0)

// ── Taxes ───────────────────────────────────────────────────
export const TPS_RATE = 0.05
export const TVQ_RATE = 0.09975
export const MONTHLY_TAX = MONTHLY_REVENUE.map(m => ({
  month: m.month,
  tps: r2(m.brut * TPS_RATE),
  tvq: r2(m.brut * TVQ_RATE),
  total: r2(m.brut * (TPS_RATE + TVQ_RATE)),
}))
export const TOTAL_TPS = r2(TOTAL_BRUT * TPS_RATE)
export const TOTAL_TVQ = r2(TOTAL_BRUT * TVQ_RATE)
export const TOTAL_TAX = r2(TOTAL_TPS + TOTAL_TVQ)

// ── Chauffeurs ──────────────────────────────────────────────
export const DRIVERS_MONTHLY = [
  { month: 'Jan', total: 8940,  active: 7820, new: 142, churned: 38 },
  { month: 'Fév', total: 9010,  active: 7890, new: 118, churned: 48 },
  { month: 'Mar', total: 9150,  active: 8020, new: 196, churned: 56 },
  { month: 'Avr', total: 9320,  active: 8110, new: 224, churned: 54 },
  { month: 'Mai', total: 9480,  active: 8240, new: 218, churned: 58 },
  { month: 'Jun', total: 9614,  active: 8380, new: 188, churned: 54 },
  { month: 'Jul', total: 9680,  active: 8490, new: 126, churned: 60 },
  { month: 'Aoû', total: 9760,  active: 8610, new: 148, churned: 68 },
  { month: 'Sep', total: 9847,  active: 8720, new: 162, churned: 75 },
]

// ── Taxi ────────────────────────────────────────────────────
export const TAXI_MONTHLY = [
  { month: 'Jan', courses: 148_200, brut: 25_287_000, moy: 170.6, km: 1_850_400 },
  { month: 'Fév', courses: 154_800, brut: 26_402_000, moy: 170.6, km: 1_935_000 },
  { month: 'Mar', courses: 163_500, brut: 27_888_000, moy: 170.6, km: 2_043_750 },
  { month: 'Avr', courses: 158_400, brut: 26_568_000, moy: 167.7, km: 1_980_000 },
  { month: 'Mai', courses: 164_200, brut: 27_398_000, moy: 166.9, km: 2_052_500 },
  { month: 'Jun', courses: 169_800, brut: 28_200_000, moy: 166.1, km: 2_122_500 },
  { month: 'Jul', courses: 172_600, brut: 28_560_000, moy: 165.5, km: 2_157_500 },
  { month: 'Aoû', courses: 184_200, brut: 30_480_000, moy: 165.5, km: 2_302_500 },
  { month: 'Sep', courses: 186_800, brut: 30_900_000, moy: 165.4, km: 2_335_000 },
]

// ── Livraison ────────────────────────────────────────────────
export const DELIVERY_MONTHLY = [
  { month: 'Jan', orders: 312_400, brut: 12_543_000, moy: 40.1, providers: { doordash: 38, instacart: 28, ubereats: 34 } },
  { month: 'Fév', orders: 328_600, brut: 13_508_000, moy: 41.1, providers: { doordash: 37, instacart: 28, ubereats: 35 } },
  { month: 'Mar', orders: 358_400, brut: 15_272_000, moy: 42.6, providers: { doordash: 37, instacart: 27, ubereats: 36 } },
  { month: 'Avr', orders: 348_200, brut: 15_552_000, moy: 44.7, providers: { doordash: 36, instacart: 28, ubereats: 36 } },
  { month: 'Mai', orders: 368_800, brut: 16_932_000, moy: 45.9, providers: { doordash: 36, instacart: 27, ubereats: 37 } },
  { month: 'Jun', orders: 384_200, brut: 17_625_000, moy: 45.9, providers: { doordash: 35, instacart: 27, ubereats: 38 } },
  { month: 'Jul', orders: 388_600, brut: 17_850_000, moy: 45.9, providers: { doordash: 35, instacart: 27, ubereats: 38 } },
  { month: 'Aoû', orders: 418_400, brut: 19_050_000, moy: 45.5, providers: { doordash: 35, instacart: 26, ubereats: 39 } },
  { month: 'Sep', orders: 424_800, brut: 19_312_000, moy: 45.5, providers: { doordash: 34, instacart: 26, ubereats: 40 } },
]

// ── Conformité ───────────────────────────────────────────────
export const COMPLIANCE_STATS = {
  totalDrivers: 9847,
  fullyCompliant: 8942,
  minorIssues: 648,
  suspended: 189,
  pending: 68,
  complianceRate: 90.8,
  docCompliance: 96.4,
  licenseCompliance: 98.1,
  insuranceCompliance: 97.8,
  inspectionCompliance: 95.2,
}
export const COMPLIANCE_MONTHLY = [
  { month: 'Jan', rate: 88.4, suspended: 224, issues: 782 },
  { month: 'Fév', rate: 88.9, suspended: 218, issues: 764 },
  { month: 'Mar', rate: 89.4, suspended: 210, issues: 740 },
  { month: 'Avr', rate: 89.8, suspended: 204, issues: 716 },
  { month: 'Mai', rate: 90.1, suspended: 198, issues: 698 },
  { month: 'Jun', rate: 90.4, suspended: 194, issues: 674 },
  { month: 'Jul', rate: 90.5, suspended: 192, issues: 662 },
  { month: 'Aoû', rate: 90.7, suspended: 190, issues: 652 },
  { month: 'Sep', rate: 90.8, suspended: 189, issues: 648 },
]

// ── Intelligence ─────────────────────────────────────────────
export const INTELLIGENCE = {
  avgRevenuePerDriver: r2(TOTAL_BRUT / 9847),
  avgRevenuePerDay: r2(TOTAL_BRUT / (9847 * 270)),
  tipsRate: 9.98, // % des revenus bruts
  feeRate: 18.4,  // % frais plateformes
  peakHour: '17h–19h',
  peakDay: 'Vendredi',
  topZone: 'Montréal Centre-Ville',
  growthRate: 32.8, // % YoY estimé
  revenuePerKm: 14.2,
  taxComplianceRate: 98.7,
  anomalyRate: 0.8,
  duplicateRate: 0.3,
}

export const TOP_ZONES = [
  { zone: 'Montréal Centre-Ville', brut: 68_420_000, drivers: 2840, pct: 11.1 },
  { zone: 'Plateau-Mont-Royal',    brut: 42_180_000, drivers: 1420, pct: 6.9  },
  { zone: 'Laval',                 brut: 38_640_000, drivers: 1280, pct: 6.3  },
  { zone: 'Longueuil / Rive-Sud',  brut: 34_200_000, drivers: 1140, pct: 5.6  },
  { zone: 'Aéroport YUL',          brut: 28_800_000, drivers: 890,  pct: 4.7  },
  { zone: 'Quartier des affaires',  brut: 24_600_000, drivers: 760,  pct: 4.0  },
]

export const TOP_PROVIDERS = [
  { name: 'TAXI',      icon: '🚕', brut: TOTAL_TAXI,     pct: 40, color: '#003DA5' },
  { name: 'UBER',      icon: '⬛', brut: 146_484_000,    pct: 24, color: '#000000' },
  { name: 'LYFT',      icon: '🟣', brut: 66_582_000,     pct: 11, color: '#FF00BF' },
  { name: 'DOORDASH',  icon: '🔴', brut: 79_261_000,     pct: 13, color: '#FF3008' },
  { name: 'INSTACART', icon: '🟢', brut: 48_054_000,     pct:  8, color: '#43B02A' },
  { name: 'UBER EATS', icon: '🟡', brut: 24_269_000,     pct:  4, color: '#06C167' },
]
