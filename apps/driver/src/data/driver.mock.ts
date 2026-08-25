// ============================================================
// TAXIMÈTRE.GOV — DRIVER APP MOCK DATA (DEMO / SIMULATION)
// Phase 2 — Driver Platform
// ============================================================

export type ActivityType = 'TAXI' | 'RIDESHARE' | 'FOOD_DELIVERY' | 'GROCERY' | 'COURIER'
export type DriverStatus = 'ONLINE' | 'OFFLINE' | 'ON_TRIP' | 'BREAK'
export type TripStatus = 'AVAILABLE' | 'PASSENGER_ENTERING' | 'ACTIVE' | 'COMPLETING' | 'COMPLETED'
export type PlatformStatus = 'CONNECTED' | 'OFFLINE' | 'NOT_CONFIGURED' | 'MAINTENANCE'
export type DocStatus = 'VALID' | 'EXPIRING' | 'EXPIRED' | 'PENDING' | 'REJECTED'
export type OnboardingStatus = 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED'

// ─── DRIVER PROFILE ─────────────────────────────────────────
export const mockDriver = {
  id: 'DR-00001234',
  firstName: 'Mohamed',
  lastName: 'Benali',
  email: 'mohamed.benali@example.com',
  phone: '+1 (514) 555-0123',
  photo: null,
  dateOfBirth: '1985-03-15',
  province: 'Québec',
  city: 'Montréal',
  address: '1234 Rue Sainte-Catherine O',
  postalCode: 'H3G 1M8',
  governmentId: 'TG-000001',
  driverId: 'DR-00001234',
  accountStatus: 'APPROVED' as OnboardingStatus,
  mfaEnabled: true,
  deviceRegistered: true,
  createdAt: '2024-03-15T00:00:00Z',
  // Authorized activities
  authorizedActivities: ['TAXI', 'RIDESHARE', 'FOOD_DELIVERY'] as ActivityType[],
}

// ─── DRIVER LICENSE ──────────────────────────────────────────
export const mockLicense = {
  number: 'Q-1234567',
  class: 'Class 4C (Taxi/Chauffeur)',
  status: 'VALID' as DocStatus,
  issueDate: '2023-09-01',
  expiryDate: '2027-09-01',
  restrictions: 'None',
  issuedBy: 'SAAQ — Québec',
  taxiPermitNumber: 'TAXI-QC-00001001',
  taxiPermitExpiry: '2026-12-31',
  taxiPermitStatus: 'VALID' as DocStatus,
}

// ─── VEHICLE ─────────────────────────────────────────────────
export const mockVehicle = {
  id: 'V-001',
  plate: 'ABC-1234',
  vin: '2T1BURHE0JC081234',
  make: 'Toyota',
  model: 'Camry',
  year: 2022,
  color: 'Blanc',
  type: 'Sedan',
  insuranceNumber: 'INS-2026-00123',
  insuranceExpiry: '2027-03-15',
  insuranceStatus: 'VALID' as DocStatus,
  inspectionDate: '2026-09-01',
  inspectionExpiry: '2026-12-15',
  inspectionStatus: 'EXPIRING' as DocStatus,
  meterInstanceId: 'METER-QC-00003210',
  meterVersion: 'v3.2.1',
  meterCertified: true,
  meterCertExpiry: '2027-06-30',
}

// ─── CONNECTED PLATFORMS ─────────────────────────────────────
export const mockPlatforms = [
  { provider:'taxi', name:'Taxi (Taximètre)', icon:'🚕', status:'CONNECTED' as PlatformStatus, accountId:'TG-000001', activityType:'TAXI' as ActivityType, taximeter:true, lastSync:'2026-08-24T15:02:00Z', todayTrips:5, todayRevenue:185.50 },
  { provider:'uber', name:'Uber', icon:'⬛', status:'CONNECTED' as PlatformStatus, accountId:'UBER-ABC-456', activityType:'RIDESHARE' as ActivityType, taximeter:false, lastSync:'2026-08-24T14:55:00Z', todayTrips:3, todayRevenue:87.30 },
  { provider:'lyft', name:'Lyft', icon:'🔵', status:'OFFLINE' as PlatformStatus, accountId:'LYFT-XYZ-789', activityType:'RIDESHARE' as ActivityType, taximeter:false, lastSync:'2026-08-23T18:00:00Z', todayTrips:0, todayRevenue:0 },
  { provider:'doordash', name:'DoorDash', icon:'🔴', status:'CONNECTED' as PlatformStatus, accountId:'DD-123-456', activityType:'FOOD_DELIVERY' as ActivityType, taximeter:false, lastSync:'2026-08-24T13:10:00Z', todayTrips:8, todayRevenue:112.40 },
  { provider:'ubereats', name:'Uber Eats', icon:'🟢', status:'NOT_CONFIGURED' as PlatformStatus, accountId:null, activityType:'FOOD_DELIVERY' as ActivityType, taximeter:false, lastSync:null, todayTrips:0, todayRevenue:0 },
  { provider:'instacart', name:'Instacart', icon:'🛒', status:'NOT_CONFIGURED' as PlatformStatus, accountId:null, activityType:'GROCERY' as ActivityType, taximeter:false, lastSync:null, todayTrips:0, todayRevenue:0 },
  { provider:'skip', name:'Skip', icon:'🟠', status:'MAINTENANCE' as PlatformStatus, accountId:'SKIP-789', activityType:'FOOD_DELIVERY' as ActivityType, taximeter:false, lastSync:'2026-08-24T13:48:00Z', todayTrips:0, todayRevenue:0 },
]

// ─── TODAY STATS ─────────────────────────────────────────────
export const todayStats = {
  date: '2026-08-24',
  totalTrips: 16,
  totalRevenue: 385.20,
  taxableRevenue: 346.68,
  tps: 17.33,
  tvq: 34.58,
  totalTax: 51.91,
  tips: 24.50,
  fees: 28.30,
  netRevenue: 328.99,
  hoursOnline: 7.5,
  kmDriven: 148.2,
  byPlatform: [
    { provider:'taxi', name:'Taxi', trips:5, revenue:185.50, icon:'🚕' },
    { provider:'uber', name:'Uber', trips:3, revenue:87.30, icon:'⬛' },
    { provider:'doordash', name:'DoorDash', trips:8, revenue:112.40, icon:'🔴' },
  ]
}

// ─── RECENT ACTIVITIES ────────────────────────────────────────
export const recentActivities = [
  { id:'act-001', type:'TAXI', provider:'taxi', status:'COMPLETED', startTime:'15:02', duration:'18 min', distance:'7.2 km', fare:42.50, tip:5.00, paymentMethod:'Carte', createdAt:'2026-08-24T15:02:00Z' },
  { id:'act-002', type:'FOOD_DELIVERY', provider:'doordash', status:'COMPLETED', startTime:'14:15', duration:'25 min', distance:'4.8 km', fare:18.90, tip:3.00, paymentMethod:'App', createdAt:'2026-08-24T14:15:00Z' },
  { id:'act-003', type:'RIDESHARE', provider:'uber', status:'COMPLETED', startTime:'13:30', duration:'22 min', distance:'9.1 km', fare:28.40, tip:4.00, paymentMethod:'App', createdAt:'2026-08-24T13:30:00Z' },
  { id:'act-004', type:'FOOD_DELIVERY', provider:'doordash', status:'COMPLETED', startTime:'12:45', duration:'18 min', distance:'3.2 km', fare:15.20, tip:2.50, paymentMethod:'App', createdAt:'2026-08-24T12:45:00Z' },
  { id:'act-005', type:'TAXI', provider:'taxi', status:'COMPLETED', startTime:'11:15', duration:'32 min', distance:'12.4 km', fare:58.00, tip:8.00, paymentMethod:'Interac', createdAt:'2026-08-24T11:15:00Z' },
]

// ─── DOCUMENTS ───────────────────────────────────────────────
export const driverDocuments = [
  { id:'doc-001', name:'Permis de conduire', type:'LICENSE', status:'VALID' as DocStatus, expiryDate:'2027-09-01', fileRef:'license.pdf', uploadedAt:'2024-03-15T00:00:00Z' },
  { id:'doc-002', name:'Assurance automobile', type:'INSURANCE', status:'VALID' as DocStatus, expiryDate:'2027-03-15', fileRef:'insurance.pdf', uploadedAt:'2024-03-20T00:00:00Z' },
  { id:'doc-003', name:'Inspection véhicule', type:'INSPECTION', status:'EXPIRING' as DocStatus, expiryDate:'2026-12-15', fileRef:'inspection.pdf', uploadedAt:'2025-12-15T00:00:00Z' },
  { id:'doc-004', name:'Permis taxi', type:'TAXI_PERMIT', status:'VALID' as DocStatus, expiryDate:'2026-12-31', fileRef:'taxipermit.pdf', uploadedAt:'2025-01-01T00:00:00Z' },
  { id:'doc-005', name:'Photo identité', type:'PHOTO_ID', status:'VALID' as DocStatus, expiryDate:'2029-03-15', fileRef:'photo.jpg', uploadedAt:'2024-03-15T00:00:00Z' },
]

// ─── MONTHLY REVENUE (for charts) ────────────────────────────
export const monthlyRevenue = [
  { month:'Mar', gross:2840, trips:68, taxiTrips:28, rideTrips:18, deliveries:22 },
  { month:'Avr', gross:3120, trips:74, taxiTrips:32, rideTrips:20, deliveries:22 },
  { month:'Mai', gross:3580, trips:82, taxiTrips:35, rideTrips:22, deliveries:25 },
  { month:'Jun', gross:4210, trips:96, taxiTrips:40, rideTrips:24, deliveries:32 },
  { month:'Jul', gross:3890, trips:88, taxiTrips:36, rideTrips:22, deliveries:30 },
  { month:'Aoû', gross:3852, trips:84, taxiTrips:33, rideTrips:19, deliveries:32 },
]

// ─── ONBOARDING STEPS ────────────────────────────────────────
export const onboardingSteps = [
  { id:1, key:'identity', label:'Identité', description:'Informations personnelles', icon:'👤', completed:true },
  { id:2, key:'license', label:'Permis', description:'Permis de conduire + Taxi', icon:'📋', completed:true },
  { id:3, key:'vehicle', label:'Véhicule', description:'Plaque, VIN, Assurance, Inspection', icon:'🚗', completed:true },
  { id:4, key:'documents', label:'Documents', description:'Upload assurance, inspection, photo', icon:'📄', completed:true },
  { id:5, key:'activities', label:'Activités', description:'Choisir les services autorisés', icon:'⚙️', completed:true },
  { id:6, key:'review', label:'Validation', description:'Révision et soumission', icon:'✅', completed:false },
]

// ─── NOTIFICATIONS ────────────────────────────────────────────
export const driverNotifications = [
  { id:'n-001', type:'DOCUMENT', title:'Inspection expire bientôt', body:'Votre inspection de véhicule expire le 15 décembre 2026.', priority:'HIGH', read:false, createdAt:'2026-08-24T08:00:00Z', icon:'⚠️' },
  { id:'n-002', type:'PAYMENT', title:'Revenus synchronisés', body:'Uber: 87.30$ enregistrés pour aujourd\'hui.', priority:'LOW', read:false, createdAt:'2026-08-24T14:55:00Z', icon:'💰' },
  { id:'n-003', type:'PLATFORM', title:'Skip — Maintenance', body:'Skip est en maintenance. Vos livraisons reprennent bientôt.', priority:'MEDIUM', read:true, createdAt:'2026-08-24T13:50:00Z', icon:'🔧' },
  { id:'n-004', type:'GOVERNMENT', title:'Message gouvernemental', body:'Nouveau formulaire fiscal disponible pour Q3 2026.', priority:'MEDIUM', read:true, createdAt:'2026-08-20T10:00:00Z', icon:'🏛️' },
]

// ─── FARE CONFIG (configurable, not hardcoded) ────────────────
export const fareConfig = {
  jurisdiction: 'QC-CA',
  currency: 'CAD',
  effectiveDate: '2026-01-01',
  baseFare: 3.45,
  perKmRate: 1.95,
  perMinuteRate: 0.50,
  waitingPerMinuteRate: 0.50,
  minimumFare: 4.05,
  airportSurcharge: 0,
  nightSurcharge: 0.00,  // configurable
  tpsRate: 0.05,
  tvqRate: 0.09975,
}

// ─── TAXIMETER SESSION (simulated) ───────────────────────────
export const taxiMeterSession = {
  sessionId: 'SESSION-QC-2026-001',
  meterId: 'METER-QC-00003210',
  meterVersion: 'v3.2.1',
  certified: true,
  jurisdictionId: 'QC-CA',
  driverId: 'DR-00001234',
  vehiclePlate: 'ABC-1234',
  tripStatus: 'AVAILABLE' as TripStatus,
  startTime: null as string | null,
  distanceKm: 0,
  durationSec: 0,
  waitingTimeSec: 0,
  baseFare: 3.45,
  distanceFare: 0,
  timeFare: 0,
  surcharges: 0,
  totalFare: 3.45,
  paymentMethod: null as string | null,
  gpsAccuracyM: 4,
  lastGpsLat: 45.5017,
  lastGpsLng: -73.5673,
}
