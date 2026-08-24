// ============================================================
// TAXIMÈTRE.GOV — MOCK PLATFORM ADAPTERS
// DEMO ONLY — No real API credentials — Step 4
// ============================================================
import type {
  PlatformAdapter, PlatformCode, OAuthState, PlatformAccount,
  Activity, Transaction, NormalizedTransaction
} from '../types/platform.types'

function mockStateToken() {
  return 'mock-state-' + Math.random().toString(36).slice(2, 18)
}
function mockId() {
  return Math.random().toString(36).slice(2, 14).toUpperCase()
}
function now() { return new Date().toISOString() }
function hoursAgo(h: number) { return new Date(Date.now() - h * 3600000).toISOString() }

// ─── BASE MOCK ADAPTER ────────────────────────────────────────
class BaseMockAdapter implements PlatformAdapter {
  provider: PlatformCode
  private activityType: Activity['activityType']

  constructor(provider: PlatformCode, activityType: Activity['activityType']) {
    this.provider = provider
    this.activityType = activityType
  }

  async connect(governmentUserId: string) {
    const state: OAuthState = {
      stateToken: mockStateToken(),
      provider: this.provider,
      governmentUserId,
      expiresAt: new Date(Date.now() + 600000).toISOString(), // 10 min
      sessionId: mockId(),
      createdAt: now(),
    }
    return {
      authUrl: `https://mock-oauth.taximetregov.dev/${this.provider}/authorize?state=${state.stateToken}&gov_user=${governmentUserId}`,
      state,
    }
  }

  async disconnect(platformAccountId: string) {
    console.log(`[MOCK ${this.provider}] Disconnect account ${platformAccountId}`)
  }

  async getAccount(platformAccountId: string): Promise<Partial<PlatformAccount>> {
    return {
      id: platformAccountId,
      platformCode: this.provider,
      providerUserId: `${this.provider.toUpperCase()}-MOCK-${mockId()}`,
      connectionStatus: 'connected',
      tokenStatus: 'valid',
      lastSyncAt: hoursAgo(0.5),
    }
  }

  async getTrips(platformAccountId: string): Promise<Activity[]> {
    return Array.from({ length: 3 }, (_, i) => ({
      activityId: `ACT-${this.provider}-${mockId()}`,
      provider: this.provider,
      providerActivityId: `${this.provider.toUpperCase()}-TRIP-${10000 + i}`,
      governmentUserId: 'TG-MOCK',
      platformAccountId,
      activityType: this.activityType,
      startedAt: hoursAgo(2 + i),
      completedAt: hoursAgo(1.5 + i),
      status: 'COMPLETED' as const,
      metadata: { mock: true },
    }))
  }

  async getDeliveries(platformAccountId: string): Promise<Activity[]> {
    return this.getTrips(platformAccountId)
  }

  async getTransaction(providerTransactionId: string): Promise<Partial<Transaction>> {
    const gross = Math.round((15 + Math.random() * 50) * 100) / 100
    const fee = Math.round(gross * 0.25 * 100) / 100
    const tip = Math.round(Math.random() * 8 * 100) / 100
    return {
      provider: this.provider,
      providerTransactionId,
      grossAmount: gross,
      platformFee: fee,
      tip,
      adjustment: 0,
      refund: 0,
      netAmount: Math.round((gross - fee + tip) * 100) / 100,
      currency: 'CAD',
      status: 'COMPLETED',
      financialStatus: 'FINALIZED',
    }
  }

  verifyWebhook(headers: Record<string, string>, _body: string, _secret?: string): boolean {
    // Mock: accept if header contains 'mock-sig'
    return headers['x-mock-signature'] === 'mock-valid' || headers['x-webhook-source'] === 'simulator'
  }

  normalizeEvent(rawEvent: Record<string, unknown>, eventType: string): NormalizedTransaction | null {
    if (!rawEvent || !eventType) return null
    const gross = (rawEvent.gross_amount ?? rawEvent.fare ?? rawEvent.total ?? 25) as number
    const fee = (rawEvent.platform_fee ?? rawEvent.service_fee ?? gross * 0.25) as number
    const tip = (rawEvent.tip ?? rawEvent.tip_amount ?? 0) as number
    const adjustment = (rawEvent.adjustment ?? 0) as number
    return {
      grossAmount: Number(gross),
      platformFee: Number(fee),
      tip: Number(tip),
      adjustment: Number(adjustment),
      activityId: String(rawEvent.trip_id ?? rawEvent.order_id ?? rawEvent.delivery_id ?? 'MOCK-ACT'),
      activityType: this.activityType,
      currency: 'CAD',
    }
  }
}

// ─── SPECIFIC ADAPTERS ────────────────────────────────────────
export class MockUberAdapter extends BaseMockAdapter {
  constructor() { super('uber', 'RIDE') }
  verifyWebhook(headers: Record<string, string>, body: string, secret?: string): boolean {
    // Uber uses x-uber-signature (HMAC-SHA256) — mocked here
    return super.verifyWebhook(headers, body, secret) || headers['x-uber-signature'] === 'mock-uber-sig'
  }
}

export class MockLyftAdapter extends BaseMockAdapter {
  constructor() { super('lyft', 'RIDE') }
}

export class MockDoorDashAdapter extends BaseMockAdapter {
  constructor() { super('doordash', 'FOOD_DELIVERY') }
  verifyWebhook(headers: Record<string, string>, body: string, secret?: string): boolean {
    return super.verifyWebhook(headers, body, secret) || headers['x-doordash-signature'] === 'mock-dd-sig'
  }
}

export class MockInstacartAdapter extends BaseMockAdapter {
  constructor() { super('instacart', 'GROCERY_DELIVERY') }
}

export class MockUberEatsAdapter extends BaseMockAdapter {
  constructor() { super('ubereats', 'FOOD_DELIVERY') }
}

export class MockSkipAdapter extends BaseMockAdapter {
  constructor() { super('skip', 'FOOD_DELIVERY') }
}

export class MockTaxiAdapter extends BaseMockAdapter {
  constructor() { super('taxi', 'TAXI_RIDE') }
  async connect() {
    // Taxi uses internal meter — no OAuth
    return {
      authUrl: '',
      state: {
        stateToken: mockStateToken(),
        provider: 'taxi' as PlatformCode,
        governmentUserId: '',
        expiresAt: '',
        sessionId: mockId(),
        createdAt: now(),
      },
    }
  }
  verifyWebhook(): boolean { return true } // Internal meter
}

// ─── ADAPTER REGISTRY ─────────────────────────────────────────
export const MOCK_ADAPTERS: Record<PlatformCode, PlatformAdapter> = {
  uber: new MockUberAdapter(),
  lyft: new MockLyftAdapter(),
  doordash: new MockDoorDashAdapter(),
  instacart: new MockInstacartAdapter(),
  ubereats: new MockUberEatsAdapter(),
  skip: new MockSkipAdapter(),
  taxi: new MockTaxiAdapter(),
  other: new BaseMockAdapter('other', 'OTHER'),
}

export function getAdapter(provider: PlatformCode): PlatformAdapter {
  return MOCK_ADAPTERS[provider]
}
