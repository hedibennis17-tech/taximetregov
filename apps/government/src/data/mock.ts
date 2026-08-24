// ============================================================
// TAXIMÈTRE.GOV — MOCK DATA (DEMO ONLY — NOT REAL DATA)
// ============================================================

export type DriverStatus = 'active' | 'inactive' | 'suspended' | 'pending'
export type ActivityType = 'taxi' | 'rideshare' | 'delivery' | 'multi'
export type Platform = 'uber' | 'lyft' | 'doordash' | 'instacart' | 'ubereats' | 'skip' | 'taxi'
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'finalized' | 'refunded' | 'cancelled' | 'disputed'
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical'
export type ConnectionStatus = 'connected' | 'pending' | 'expired' | 'revoked' | 'error' | 'disconnected'

export interface Driver {
  id: string
  govId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  status: DriverStatus
  activityType: ActivityType
  licenseNumber: string
  licenseExpiry: string
  vehicleId: string
  platforms: { provider: Platform; status: ConnectionStatus; accountId: string }[]
  monthlyRevenue: number
  monthlyTax: number
  lastActivity: string
  compliance: 'ok' | 'warning' | 'critical'
  joinedAt: string
  city: string
  lat: number
  lng: number
}

export interface Transaction {
  id: string
  internalId: string
  provider: Platform
  providerAccountId: string
  providerTransactionId: string
  driverGovId: string
  driverName: string
  activityType: string
  tripId?: string
  grossAmount: number
  platformFee: number
  tip: number
  adjustment: number
  refund: number
  tps: number
  tvq: number
  netAmount: number
  currency: 'CAD'
  status: TransactionStatus
  createdAt: string
  finalizedAt?: string
}

export interface Alert {
  id: string
  type: string
  priority: AlertPriority
  driverGovId?: string
  driverName?: string
  message: string
  createdAt: string
  resolved: boolean
}

export interface AuditLog {
  id: string
  actorId: string
  actorRole: string
  action: string
  resource: string
  resourceId: string
  before?: string
  after?: string
  reason?: string
  timestamp: string
  correlationId: string
}

// ---- DRIVERS ----
export const mockDrivers: Driver[] = [
  { id: 'd1', govId: 'TG-000001', firstName: 'Mohammed', lastName: 'Benali', email: 'mbenali@demo.ca', phone: '514-555-0101', status: 'active', activityType: 'multi', licenseNumber: 'B1234567', licenseExpiry: '2027-03-15', vehicleId: 'V001', platforms: [{provider:'uber',status:'connected',accountId:'UBER-481022'},{provider:'lyft',status:'connected',accountId:'LYFT-302941'},{provider:'taxi',status:'connected',accountId:'TAXI-001'}], monthlyRevenue: 6420, monthlyTax: 961, lastActivity: '2026-08-24T14:32:00Z', compliance: 'ok', joinedAt: '2023-04-12', city: 'Montréal', lat: 45.5017, lng: -73.5673 },
  { id: 'd2', govId: 'TG-000002', firstName: 'Sophie', lastName: 'Tremblay', email: 'stremblay@demo.ca', phone: '514-555-0102', status: 'active', activityType: 'delivery', licenseNumber: 'B2345678', licenseExpiry: '2026-11-20', vehicleId: 'V002', platforms: [{provider:'doordash',status:'connected',accountId:'DD-590234'},{provider:'ubereats',status:'connected',accountId:'UBE-234081'},{provider:'skip',status:'connected',accountId:'SKIP-11029'}], monthlyRevenue: 3840, monthlyTax: 575, lastActivity: '2026-08-24T13:15:00Z', compliance: 'warning', joinedAt: '2022-09-01', city: 'Montréal', lat: 45.5231, lng: -73.5890 },
  { id: 'd3', govId: 'TG-000003', firstName: 'Jean-Pierre', lastName: 'Côté', email: 'jpcote@demo.ca', phone: '418-555-0103', status: 'active', activityType: 'taxi', licenseNumber: 'B3456789', licenseExpiry: '2028-01-10', vehicleId: 'V003', platforms: [{provider:'taxi',status:'connected',accountId:'TAXI-003'}], monthlyRevenue: 5210, monthlyTax: 781, lastActivity: '2026-08-24T14:50:00Z', compliance: 'ok', joinedAt: '2019-06-15', city: 'Québec', lat: 46.8139, lng: -71.2082 },
  { id: 'd4', govId: 'TG-000004', firstName: 'Fatima', lastName: 'El-Amrani', email: 'felamrani@demo.ca', phone: '514-555-0104', status: 'suspended', activityType: 'rideshare', licenseNumber: 'B4567890', licenseExpiry: '2025-08-05', vehicleId: 'V004', platforms: [{provider:'uber',status:'revoked',accountId:'UBER-509183'},{provider:'lyft',status:'revoked',accountId:'LYFT-409872'}], monthlyRevenue: 0, monthlyTax: 0, lastActivity: '2026-07-15T09:00:00Z', compliance: 'critical', joinedAt: '2021-11-22', city: 'Montréal', lat: 45.4884, lng: -73.5901 },
  { id: 'd5', govId: 'TG-000005', firstName: 'Alex', lastName: 'Nguyen', email: 'anguyen@demo.ca', phone: '514-555-0105', status: 'active', activityType: 'multi', licenseNumber: 'B5678901', licenseExpiry: '2027-07-22', vehicleId: 'V005', platforms: [{provider:'uber',status:'connected',accountId:'UBER-612045'},{provider:'doordash',status:'connected',accountId:'DD-712390'},{provider:'instacart',status:'connected',accountId:'IC-201948'}], monthlyRevenue: 7850, monthlyTax: 1176, lastActivity: '2026-08-24T14:10:00Z', compliance: 'ok', joinedAt: '2022-03-08', city: 'Montréal', lat: 45.5088, lng: -73.5541 },
  { id: 'd6', govId: 'TG-000006', firstName: 'Marie-Claire', lastName: 'Bouchard', email: 'mcbouchard@demo.ca', phone: '450-555-0106', status: 'active', activityType: 'delivery', licenseNumber: 'B6789012', licenseExpiry: '2027-09-14', vehicleId: 'V006', platforms: [{provider:'ubereats',status:'connected',accountId:'UBE-819034'},{provider:'skip',status:'connected',accountId:'SKIP-22031'}], monthlyRevenue: 2940, monthlyTax: 440, lastActivity: '2026-08-24T12:45:00Z', compliance: 'ok', joinedAt: '2023-01-18', city: 'Laval', lat: 45.5660, lng: -73.7136 },
  { id: 'd7', govId: 'TG-000007', firstName: 'Reza', lastName: 'Ahmadi', email: 'rahmadi@demo.ca', phone: '514-555-0107', status: 'pending', activityType: 'rideshare', licenseNumber: 'B7890123', licenseExpiry: '2027-12-01', vehicleId: 'V007', platforms: [{provider:'uber',status:'pending',accountId:'UBER-PENDING'}], monthlyRevenue: 0, monthlyTax: 0, lastActivity: '2026-08-20T10:00:00Z', compliance: 'warning', joinedAt: '2026-08-15', city: 'Montréal', lat: 45.4971, lng: -73.5777 },
  { id: 'd8', govId: 'TG-000008', firstName: 'Lucie', lastName: 'Gagné', email: 'lgagne@demo.ca', phone: '418-555-0108', status: 'active', activityType: 'taxi', licenseNumber: 'B8901234', licenseExpiry: '2026-12-15', vehicleId: 'V008', platforms: [{provider:'taxi',status:'connected',accountId:'TAXI-008'}], monthlyRevenue: 4680, monthlyTax: 701, lastActivity: '2026-08-24T15:02:00Z', compliance: 'warning', joinedAt: '2020-02-28', city: 'Québec', lat: 46.8215, lng: -71.2284 },
  { id: 'd9', govId: 'TG-000009', firstName: 'Carlos', lastName: 'Rodriguez', email: 'crodriguez@demo.ca', phone: '514-555-0109', status: 'active', activityType: 'multi', licenseNumber: 'B9012345', licenseExpiry: '2028-04-30', vehicleId: 'V009', platforms: [{provider:'uber',status:'connected',accountId:'UBER-901234'},{provider:'lyft',status:'connected',accountId:'LYFT-801234'},{provider:'doordash',status:'connected',accountId:'DD-901234'},{provider:'ubereats',status:'connected',accountId:'UBE-901234'}], monthlyRevenue: 9120, monthlyTax: 1366, lastActivity: '2026-08-24T14:55:00Z', compliance: 'ok', joinedAt: '2021-07-04', city: 'Montréal', lat: 45.5435, lng: -73.6398 },
  { id: 'd10', govId: 'TG-000010', firstName: 'Nathalie', lastName: 'Laroche', email: 'nlaroche@demo.ca', phone: '514-555-0110', status: 'inactive', activityType: 'delivery', licenseNumber: 'B0123456', licenseExpiry: '2026-06-30', vehicleId: 'V010', platforms: [{provider:'doordash',status:'expired',accountId:'DD-012345'},{provider:'skip',status:'disconnected',accountId:'SKIP-33011'}], monthlyRevenue: 0, monthlyTax: 0, lastActivity: '2026-07-01T11:20:00Z', compliance: 'critical', joinedAt: '2022-05-19', city: 'Montréal', lat: 45.4780, lng: -73.6020 },
]

// Fill to 50 drivers with generated data
const firstNames = ['Karim','Yasmine','Patrick','Isabelle','David','Amina','Robert','Linda','Ahmed','Céline','François','Leila','Marc','Sandra','Hassan','Julie','Pierre','Nadia','Eric','Samira']
const lastNames = ['Dupont','Martin','Bernard','Thomas','Richard','Petit','Durand','Morin','Laurent','Simon','Roy','Gagnon','Ouellet','Leblanc','Boivin','Pelletier','Girard','Lavoie','Bélanger','Lévesque']
const cities = ['Montréal','Québec','Laval','Longueuil','Sherbrooke','Saguenay','Lévis']
const providers: Platform[] = ['uber','lyft','doordash','instacart','ubereats','skip','taxi']
for (let i = 11; i <= 50; i++) {
  const fn = firstNames[(i-11) % firstNames.length]
  const ln = lastNames[(i-11) % lastNames.length]
  const city = cities[i % cities.length]
  const status: DriverStatus = i % 7 === 0 ? 'suspended' : i % 9 === 0 ? 'pending' : i % 5 === 0 ? 'inactive' : 'active'
  const pCount = (i % 3) + 1
  const driverPlatforms = providers.slice(0, pCount).map(p => ({provider: p, status: 'connected' as ConnectionStatus, accountId: `${p.toUpperCase()}-${100000+i}`}))
  const revenue = status === 'active' ? Math.round(2000 + Math.random() * 8000) : 0
  mockDrivers.push({
    id: `d${i}`, govId: `TG-${String(i).padStart(6,'0')}`, firstName: fn, lastName: ln,
    email: `${fn.toLowerCase()}${i}@demo.ca`, phone: `514-555-${String(i).padStart(4,'0')}`,
    status, activityType: ['taxi','rideshare','delivery','multi'][i%4] as ActivityType,
    licenseNumber: `B${1000000+i}`, licenseExpiry: `202${7+(i%3)}-${String((i%12)+1).padStart(2,'0')}-15`,
    vehicleId: `V${String(i).padStart(3,'0')}`, platforms: driverPlatforms,
    monthlyRevenue: revenue, monthlyTax: Math.round(revenue * 0.14975),
    lastActivity: `2026-08-${String(20+(i%5)).padStart(2,'0')}T${10+(i%8)}:00:00Z`,
    compliance: i%8===0 ? 'critical' : i%4===0 ? 'warning' : 'ok',
    joinedAt: `20${20+(i%4)}-${String((i%12)+1).padStart(2,'0')}-01`,
    city, lat: 45.5 + (Math.random()-0.5)*0.5, lng: -73.6 + (Math.random()-0.5)*0.8
  })
}

// ---- TRANSACTIONS ----
export const mockTransactions: Transaction[] = []
const txProviders: Platform[] = ['uber','lyft','doordash','instacart','ubereats','skip','taxi']
const txStatuses: TransactionStatus[] = ['completed','completed','completed','finalized','finalized','refunded','pending','disputed']

for (let i = 1; i <= 100; i++) {
  const provider = txProviders[i % txProviders.length]
  const driver = mockDrivers[i % mockDrivers.length]
  const gross = Math.round((8 + Math.random() * 60) * 100) / 100
  const fee = Math.round(gross * 0.25 * 100) / 100
  const tip = Math.round(Math.random() * 5 * 100) / 100
  const adj = i % 15 === 0 ? -2.5 : 0
  const refund = i % 20 === 0 ? gross : 0
  const taxable = gross - fee
  const tps = Math.round(taxable * 0.05 * 100) / 100
  const tvq = Math.round(taxable * 0.09975 * 100) / 100
  const net = Math.round((gross - fee + tip + adj - refund) * 100) / 100
  const d = new Date('2026-08-01')
  d.setDate(d.getDate() + Math.floor(Math.random() * 24))
  mockTransactions.push({
    id: `txn-${i}`,
    internalId: `TXN-2026-${String(i).padStart(5,'0')}`,
    provider,
    providerAccountId: `${provider.toUpperCase()}-${400000+i}`,
    providerTransactionId: `${provider.toUpperCase().slice(0,3)}-TRIP-${10000+i}`,
    driverGovId: driver.govId,
    driverName: `${driver.firstName} ${driver.lastName}`,
    activityType: ['uber','lyft','taxi'].includes(provider) ? 'ride' : ['doordash','ubereats','skip'].includes(provider) ? 'delivery' : 'grocery',
    tripId: `TRIP-${10000+i}`,
    grossAmount: gross,
    platformFee: fee,
    tip,
    adjustment: adj,
    refund,
    tps,
    tvq,
    netAmount: net,
    currency: 'CAD',
    status: i % 20 === 0 ? 'refunded' : i % 15 === 0 ? 'disputed' : i % 8 === 0 ? 'pending' : 'completed',
    createdAt: d.toISOString(),
    finalizedAt: i % 8 !== 0 ? new Date(d.getTime() + 3600000).toISOString() : undefined,
  })
}

// ---- ALERTS ----
export const mockAlerts: Alert[] = [
  { id:'a1', type:'document_expired', priority:'critical', driverGovId:'TG-000004', driverName:'Fatima El-Amrani', message:'Permis de conduire expiré depuis 2025-08-05', createdAt:'2026-08-24T06:00:00Z', resolved:false },
  { id:'a2', type:'api_disconnected', priority:'high', message:'Connexion webhook DoorDash interrompue depuis 14h32', createdAt:'2026-08-24T14:32:00Z', resolved:false },
  { id:'a3', type:'revenue_anomaly', priority:'high', driverGovId:'TG-000009', driverName:'Carlos Rodriguez', message:'Revenus anormalement élevés détectés : 3 420 $ en 24h', createdAt:'2026-08-24T08:15:00Z', resolved:false },
  { id:'a4', type:'tax_mismatch', priority:'medium', driverGovId:'TG-000002', driverName:'Sophie Tremblay', message:'Écart entre revenus enregistrés et revenus déclarés : 420 $', createdAt:'2026-08-23T16:00:00Z', resolved:false },
  { id:'a5', type:'duplicate_attempt', priority:'medium', message:'Tentative de doublon détectée : UBER-TRIP-10034 (ignorée)', createdAt:'2026-08-24T11:20:00Z', resolved:true },
  { id:'a6', type:'document_expiring', priority:'low', driverGovId:'TG-000008', driverName:'Lucie Gagné', message:'Permis de taxi expire dans 30 jours (2026-12-15)', createdAt:'2026-08-24T07:00:00Z', resolved:false },
  { id:'a7', type:'webhook_failure', priority:'high', message:'Skip webhook : 5 tentatives échouées sur event DELIVERY_COMPLETE', createdAt:'2026-08-24T13:48:00Z', resolved:false },
  { id:'a8', type:'suspended_driver', priority:'critical', driverGovId:'TG-000004', driverName:'Fatima El-Amrani', message:'Chauffeur suspendu tente d\'utiliser Uber', createdAt:'2026-08-24T09:30:00Z', resolved:false },
]

// ---- AUDIT LOGS ----
export const mockAuditLogs: AuditLog[] = [
  { id:'au1', actorId:'ADMIN-001', actorRole:'GOVERNMENT_ADMIN', action:'UPDATE_DRIVER_STATUS', resource:'Driver', resourceId:'TG-000004', before:'active', after:'suspended', reason:'Permis expiré — arrêté administratif', timestamp:'2026-08-15T10:30:00Z', correlationId:'CORR-2026-0815-001' },
  { id:'au2', actorId:'AUDIT-002', actorRole:'AUDITOR', action:'VIEW_DRIVER_FINANCIALS', resource:'Driver', resourceId:'TG-000009', before:undefined, after:undefined, reason:'Vérification anomalie revenus', timestamp:'2026-08-24T08:20:00Z', correlationId:'CORR-2026-0824-002' },
  { id:'au3', actorId:'TAX-003', actorRole:'TAX_ADMIN', action:'CREATE_TAX_ADJUSTMENT', resource:'TaxRecord', resourceId:'TG-000002-Q3-2026', before:'38420.00', after:'38840.00', reason:'Correction revenus déclarés — période Q2 2026', timestamp:'2026-08-23T14:00:00Z', correlationId:'CORR-2026-0823-003' },
  { id:'au4', actorId:'ADMIN-001', actorRole:'GOVERNMENT_ADMIN', action:'REVOKE_PLATFORM_ACCESS', resource:'PlatformAccount', resourceId:'UBER-509183', before:'connected', after:'revoked', reason:'Chauffeur suspendu', timestamp:'2026-08-15T10:31:00Z', correlationId:'CORR-2026-0815-001' },
  { id:'au5', actorId:'SYS', actorRole:'SYSTEM', action:'REJECT_DUPLICATE_WEBHOOK', resource:'Transaction', resourceId:'UBER-TRIP-10034', before:undefined, after:undefined, reason:'provider_transaction_id déjà existant', timestamp:'2026-08-24T11:20:00Z', correlationId:'CORR-2026-0824-005' },
  { id:'au6', actorId:'INSP-001', actorRole:'INSPECTOR', action:'UPDATE_INSPECTION', resource:'Vehicle', resourceId:'V001', before:'valid', after:'valid', reason:'Inspection annuelle complétée', timestamp:'2026-08-22T09:00:00Z', correlationId:'CORR-2026-0822-006' },
]

// ---- KPI SUMMARY ----
export const kpiData = {
  drivers: { total: 50, active: 38, online: 12, suspended: 3, pending: 2 },
  activity: { tripsToday: 847, deliveriesToday: 1203, transactionsToday: 2050 },
  revenue: {
    grossMonthly: 284620,
    netMonthly: 198234,
    tipsMonthly: 14820,
    platformFeesMonthly: 71155,
  },
  taxes: {
    tpsCollected: 9231,
    tvqCollected: 18410,
    estimated: 29850,
    declared: 27641,
    gap: 2209,
  },
  alerts: {
    anomalies: 3,
    expiredDocs: 5,
    apiIssues: 2,
    pendingTransactions: 14,
  },
}

// ---- REVENUE CHART DATA ----
export const revenueByDay = Array.from({length: 24}, (_, i) => ({
  day: `Août ${i+1}`,
  gross: Math.round(8000 + Math.random() * 6000),
  net: Math.round(5500 + Math.random() * 4000),
  tips: Math.round(400 + Math.random() * 600),
  tax: Math.round(1200 + Math.random() * 800),
}))

export const revenueByPlatform = [
  { platform: 'Uber', gross: 89420, color: '#000000' },
  { platform: 'Lyft', gross: 41230, color: '#FF00BF' },
  { platform: 'DoorDash', gross: 38940, color: '#FF3008' },
  { platform: 'Instacart', gross: 22180, color: '#43B02A' },
  { platform: 'Uber Eats', gross: 35820, color: '#06C167' },
  { platform: 'Skip', gross: 18930, color: '#E31837' },
  { platform: 'Taxi', gross: 38100, color: '#003DA5' },
]

export const PLATFORM_COLORS: Record<Platform, string> = {
  uber: '#000000',
  lyft: '#FF00BF',
  doordash: '#FF3008',
  instacart: '#43B02A',
  ubereats: '#06C167',
  skip: '#E31837',
  taxi: '#003DA5',
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  uber: 'Uber',
  lyft: 'Lyft',
  doordash: 'DoorDash',
  instacart: 'Instacart',
  ubereats: 'Uber Eats',
  skip: 'Skip',
  taxi: 'Taxi',
}
