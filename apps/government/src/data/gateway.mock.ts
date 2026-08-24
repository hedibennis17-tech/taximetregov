// ============================================================
// TAXIMÈTRE.GOV — GATEWAY MOCK DATA (DEMO ONLY)
// Step 4: Platform Connect + Revenue Gateway
// ============================================================

export type PlatformCode = 'uber' | 'lyft' | 'doordash' | 'instacart' | 'ubereats' | 'skip' | 'taxi' | 'other'
export type ConnectionStatus = 'connected' | 'pending' | 'expired' | 'revoked' | 'error' | 'disconnected' | 'unmatched'
export type WebhookStatus = 'RECEIVED' | 'VERIFIED' | 'PROCESSED' | 'DUPLICATE' | 'FAILED' | 'RETRYING' | 'REJECTED' | 'DEAD_LETTER'
export type SignatureStatus = 'valid' | 'invalid' | 'missing' | 'skipped'
export type FinancialStatus = 'PENDING' | 'PROVISIONAL' | 'FINALIZED' | 'ADJUSTED' | 'REFUNDED' | 'DISPUTED'

export interface MockPlatformHealth {
  provider: PlatformCode; name: string; color: string
  apiStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'NOT_CONFIGURED'
  oauthStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'NOT_CONFIGURED'
  webhookStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'NOT_CONFIGURED'
  lastEvent: string; lastSync: string; errorRate: number; avgLatencyMs: number
  connectedAccounts: number; todayEvents: number; todaySuccessful: number
  todayFailed: number; todayDuplicates: number; integration: 'MOCK' | 'LIVE'
}

export const mockPlatformHealth: MockPlatformHealth[] = [
  { provider: 'uber', name: 'Uber', color: '#000', apiStatus: 'NOT_CONFIGURED', oauthStatus: 'NOT_CONFIGURED', webhookStatus: 'NOT_CONFIGURED', lastEvent: '2026-08-24T14:55:00Z', lastSync: '2026-08-24T15:00:00Z', errorRate: 0.8, avgLatencyMs: 142, connectedAccounts: 18, todayEvents: 487, todaySuccessful: 481, todayFailed: 2, todayDuplicates: 4, integration: 'MOCK' },
  { provider: 'lyft', name: 'Lyft', color: '#FF00BF', apiStatus: 'NOT_CONFIGURED', oauthStatus: 'NOT_CONFIGURED', webhookStatus: 'NOT_CONFIGURED', lastEvent: '2026-08-24T13:10:00Z', lastSync: '2026-08-24T14:00:00Z', errorRate: 1.2, avgLatencyMs: 98, connectedAccounts: 11, todayEvents: 203, todaySuccessful: 199, todayFailed: 3, todayDuplicates: 1, integration: 'MOCK' },
  { provider: 'doordash', name: 'DoorDash', color: '#FF3008', apiStatus: 'NOT_CONFIGURED', oauthStatus: 'NOT_CONFIGURED', webhookStatus: 'DEGRADED', lastEvent: '2026-08-24T14:32:00Z', lastSync: '2026-08-24T14:32:00Z', errorRate: 12, avgLatencyMs: 0, connectedAccounts: 14, todayEvents: 312, todaySuccessful: 301, todayFailed: 5, todayDuplicates: 6, integration: 'MOCK' },
  { provider: 'instacart', name: 'Instacart', color: '#43B02A', apiStatus: 'NOT_CONFIGURED', oauthStatus: 'NOT_CONFIGURED', webhookStatus: 'NOT_CONFIGURED', lastEvent: '2026-08-24T12:00:00Z', lastSync: '2026-08-24T12:00:00Z', errorRate: 0, avgLatencyMs: 201, connectedAccounts: 7, todayEvents: 89, todaySuccessful: 89, todayFailed: 0, todayDuplicates: 0, integration: 'MOCK' },
  { provider: 'ubereats', name: 'Uber Eats', color: '#06C167', apiStatus: 'NOT_CONFIGURED', oauthStatus: 'NOT_CONFIGURED', webhookStatus: 'NOT_CONFIGURED', lastEvent: '2026-08-24T15:01:00Z', lastSync: '2026-08-24T15:01:00Z', errorRate: 0.3, avgLatencyMs: 175, connectedAccounts: 9, todayEvents: 241, todaySuccessful: 240, todayFailed: 1, todayDuplicates: 0, integration: 'MOCK' },
  { provider: 'skip', name: 'Skip', color: '#E31837', apiStatus: 'NOT_CONFIGURED', oauthStatus: 'NOT_CONFIGURED', webhookStatus: 'DEGRADED', lastEvent: '2026-08-24T13:48:00Z', lastSync: '2026-08-24T13:48:00Z', errorRate: 5, avgLatencyMs: 0, connectedAccounts: 6, todayEvents: 158, todaySuccessful: 150, todayFailed: 5, todayDuplicates: 3, integration: 'MOCK' },
  { provider: 'taxi', name: 'Taximètre', color: '#003DA5', apiStatus: 'HEALTHY', oauthStatus: 'NOT_CONFIGURED', webhookStatus: 'NOT_CONFIGURED', lastEvent: '2026-08-24T15:02:00Z', lastSync: '2026-08-24T15:02:00Z', errorRate: 0, avgLatencyMs: 55, connectedAccounts: 12, todayEvents: 560, todaySuccessful: 560, todayFailed: 0, todayDuplicates: 0, integration: 'MOCK' },
]

export const gatewayKpis = {
  totalConnectedAccounts: 77, activePlatforms: 7, webhookEventsToday: 2050,
  successfulEventsToday: 2020, failedEventsToday: 16, unmatchedAccounts: 5,
  transactionsReceived: 1980, duplicatesBlocked: 14, reconciliationErrors: 3,
  retryQueue: 8, deadLetterQueue: 2,
}

export type WebhookEventMock = {
  id: string; provider: PlatformCode; eventId: string; eventType: string
  providerTxId: string; signatureStatus: SignatureStatus; receivedAt: string
  processedAt?: string; status: WebhookStatus; retryCount: number
  durationMs?: number; error?: string; governmentUserId: string
}

const providers: PlatformCode[] = ['uber','lyft','doordash','instacart','ubereats','skip','taxi']
const eventTypes: Record<string, string[]> = {
  uber:['TRIP_COMPLETED','FARE_RECEIVED','TIP_ADDED','ADJUSTMENT'],
  lyft:['RIDE_COMPLETED','PAYMENT_RECEIVED','TIP_RECEIVED'],
  doordash:['DELIVERY_COMPLETE','ORDER_READY','PAYMENT_CONFIRMED'],
  instacart:['BATCH_PAYMENT','ORDER_DELIVERED','TIP_RECEIVED'],
  ubereats:['ORDER_DELIVERED','PAYMENT_RECEIVED','ADJUSTMENT'],
  skip:['ORDER_DELIVERED','PAYMENT_RECEIVED'],
  taxi:['TRIP_CLOSED','FARE_CALCULATED','TIP_ADDED'],
  other:['PAYMENT_RECEIVED'],
}
const govUsers = ['TG-000001','TG-000002','TG-000003','TG-000005','TG-000009','TG-000003','TG-000006','TG-000008']

export const mockWebhookEvents: WebhookEventMock[] = []

for (let i = 1; i <= 70; i++) {
  const p = providers[i % providers.length]
  const types = eventTypes[p] || ['PAYMENT_RECEIVED']
  const txId = `${p.slice(0,3).toUpperCase()}-TX-${String(10000+i).padStart(6,'0')}`
  const d = new Date('2026-08-24T06:00:00Z'); d.setMinutes(d.getMinutes() + i * 12)
  mockWebhookEvents.push({
    id:`wh-${String(i).padStart(4,'0')}`, provider: p,
    eventId:`EVT-${p.toUpperCase()}-${String(i).padStart(6,'0')}`,
    eventType:types[i % types.length], providerTxId:txId,
    signatureStatus:'valid', receivedAt:d.toISOString(),
    processedAt:new Date(d.getTime()+(80+Math.random()*200)).toISOString(),
    status:'PROCESSED', retryCount:0, durationMs:80+Math.round(Math.random()*200),
    governmentUserId:govUsers[i % govUsers.length],
  })
}
for (let i = 0; i < 20; i++) {
  const original = mockWebhookEvents[i * 3]
  const d = new Date(original.receivedAt); d.setSeconds(d.getSeconds()+30)
  mockWebhookEvents.push({
    ...original, id:`wh-dup-${String(i+1).padStart(3,'0')}`,
    eventId:`EVT-DUP-${String(i).padStart(6,'0')}`, receivedAt:d.toISOString(),
    processedAt:new Date(d.getTime()+12).toISOString(), status:'DUPLICATE', durationMs:12,
    error:`UNIQUE constraint: ${original.providerTxId} already exists`,
  })
}
for (let i = 0; i < 10; i++) {
  const p = providers[(i+2) % providers.length]
  const d = new Date('2026-08-24T10:00:00Z'); d.setMinutes(d.getMinutes()+i*45)
  const isSig = i % 3 === 0
  mockWebhookEvents.push({
    id:`wh-fail-${String(i+1).padStart(3,'0')}`, provider:p,
    eventId:`EVT-FAIL-${String(i).padStart(6,'0')}`, eventType:'PAYMENT_RECEIVED',
    providerTxId:`${p.toUpperCase()}-FAIL-${i}`, signatureStatus:isSig?'invalid':'valid',
    receivedAt:d.toISOString(), status:isSig?'REJECTED':'FAILED',
    retryCount:isSig?0:Math.floor(Math.random()*4+1),
    error:isSig?'Signature HMAC-SHA256 invalide':'Connection timeout après 3 tentatives',
    governmentUserId:'UNMATCHED',
  })
}

export interface GatewayTransaction {
  id:string; internalTxId:string; provider:PlatformCode; providerTxId:string
  governmentUserId:string; activityType:string; gross:number; fee:number
  tip:number; adjustment:number; refund:number; tax:number; net:number
  financialStatus:FinancialStatus; status:string; createdAt:string
  finalizedAt?:string; hasAdjustment:boolean; hasTip:boolean; hasRefund:boolean
}
export const mockGatewayTransactions: GatewayTransaction[] = []
for (let i = 1; i <= 100; i++) {
  const p = providers[i % providers.length]
  const gross = Math.round((10+Math.random()*65)*100)/100
  const fee = Math.round(gross*0.25*100)/100
  const hasAdj=i%5===0, hasTip=i%4===0, hasRef=i%20===0
  const tip=hasTip?Math.round(Math.random()*8*100)/100:0
  const adj=hasAdj?Math.round((Math.random()*5-1)*100)/100:0
  const refund=hasRef?Math.round(gross*0.3*100)/100:0
  const tax=Math.round((gross-fee)*0.14975*100)/100
  const net=Math.round((gross-fee+tip+adj-refund)*100)/100
  const d=new Date('2026-08-01T00:00:00Z'); d.setHours(d.getHours()+i*5)
  mockGatewayTransactions.push({
    id:`gtx-${i}`, internalTxId:`TG-TXN-2026-${String(1000+i).padStart(10,'0')}`,
    provider:p, providerTxId:`${p.slice(0,3).toUpperCase()}-TX-${String(10000+i).padStart(6,'0')}`,
    governmentUserId:govUsers[i%govUsers.length],
    activityType:['uber','lyft','taxi'].includes(p)?'RIDE':p==='instacart'?'GROCERY_DELIVERY':'FOOD_DELIVERY',
    gross, fee, tip, adjustment:adj, refund, tax, net,
    financialStatus:hasRef?'REFUNDED':hasAdj?'ADJUSTED':'FINALIZED',
    status:hasRef?'REFUNDED':'FINALIZED',
    createdAt:d.toISOString(), finalizedAt:new Date(d.getTime()+3600000).toISOString(),
    hasAdjustment:hasAdj, hasTip, hasRefund:hasRef,
  })
}

export const unmatchedAccounts = [
  {id:'uma-1',provider:'uber' as PlatformCode,providerUserId:'UBER-NOMATCH-001',receivedAt:'2026-08-24T09:12:00Z',eventCount:3},
  {id:'uma-2',provider:'doordash' as PlatformCode,providerUserId:'DD-NOMATCH-002',receivedAt:'2026-08-24T11:33:00Z',eventCount:7},
  {id:'uma-3',provider:'lyft' as PlatformCode,providerUserId:'LYFT-NOMATCH-003',receivedAt:'2026-08-23T16:44:00Z',eventCount:1},
  {id:'uma-4',provider:'skip' as PlatformCode,providerUserId:'SKIP-NOMATCH-004',receivedAt:'2026-08-22T14:20:00Z',eventCount:2},
  {id:'uma-5',provider:'instacart' as PlatformCode,providerUserId:'IC-NOMATCH-005',receivedAt:'2026-08-21T08:00:00Z',eventCount:5},
]
export const reconciliationData = {
  total:100, matched:92, missing:3, amountMismatch:2, statusMismatch:1, unresolved:2,
  lastRun:'2026-08-24T15:00:00Z',
}
export const retryQueue = mockWebhookEvents.filter(e=>e.status==='FAILED'&&e.retryCount<5).slice(0,8)
export const deadLetterQueue = mockWebhookEvents.filter(e=>e.retryCount>=3).slice(0,2)

export interface SimulatorConfig {
  provider:PlatformCode; eventType:string; governmentUserId:string; tripId:string
  grossAmount:number; tip:number; adjustment:number; refund:number
  forceDuplicate:boolean; forceSignatureError:boolean
}
export const defaultSimulatorConfig: SimulatorConfig = {
  provider:'uber', eventType:'TRIP_COMPLETED', governmentUserId:'TG-000001',
  tripId:'UBER-TRIP-99999', grossAmount:42.50, tip:5.00, adjustment:0, refund:0,
  forceDuplicate:false, forceSignatureError:false,
}
