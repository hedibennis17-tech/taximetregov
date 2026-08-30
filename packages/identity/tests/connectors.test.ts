// ================================================================
// TAXIMÈTRE.GOV — CONNECTOR & PIPELINE TESTS
// Phase DB-18: 20 tests obligatoires + invariants
// ================================================================

import { describe, it, expect } from 'vitest'
import {
  formatConnectorId, formatPipelineRunId,
  buildPipelineRunKey, checkConnectorCapabilities,
  checkRateLimit, assessCheckpoint,
  isStageOrderValid, checkConfigModification,
  isConnectorTaximeterEnabled,
  canAdminManageConnector, canAdminPublishConfig, canViewPipelineRuns,
  SEED_PLATFORM_CONNECTORS, STAGE_EXECUTION_ORDER,
  type PipelineStageType,
} from '../src/auth/connector.service'

// ─── PUBLIC IDS ──────────────────────────────────────────────

describe('Public IDs', () => {
  it('[PASS] CON-XXXXXXXX format', () => {
    expect(formatConnectorId(1)).toBe('CON-00000001')
    expect(formatConnectorId(6)).toMatch(/^CON-\d{8}$/)
  })
  it('[PASS] PLR-XXXXXXXX format', () => {
    expect(formatPipelineRunId(1)).toBe('PLR-00000001')
  })
})

// ─── PIPELINE RUN IDEMPOTENCY ─────────────────────────────────

describe('Pipeline Run Idempotency — Tests 1 & 2', () => {
  it('[TEST 1] Same inputs = same run key (idempotent)', () => {
    const k1 = buildPipelineRunKey('con-001', 'INCREMENTAL', '2026-08', 'SCHEDULER')
    const k2 = buildPipelineRunKey('con-001', 'INCREMENTAL', '2026-08', 'SCHEDULER')
    expect(k1).toBe(k2)
  })

  it('[TEST 2] Different inputs = different keys', () => {
    const k1 = buildPipelineRunKey('con-001', 'INCREMENTAL', '2026-08', 'SCHEDULER')
    const k2 = buildPipelineRunKey('con-001', 'FULL_SYNC',   '2026-08', 'MANUAL')
    expect(k1).not.toBe(k2)
  })

  it('[PASS] Run key length within DB constraint', () => {
    const k = buildPipelineRunKey('con-001', 'INCREMENTAL', '2026-08-15', 'WEBHOOK')
    expect(k.length).toBeLessThanOrEqual(100)
  })
})

// ─── CONNECTOR CAPABILITIES ───────────────────────────────────

describe('Connector Capabilities — Tests 3, 4, 5', () => {
  it('[TEST 3] MOCK_ONLY = no API calls, no webhooks', () => {
    const result = checkConnectorCapabilities('MOCK_ONLY', null, false, false)
    expect(result.canMakeApiCalls).toBe(false)
    expect(result.canReceiveWebhooks).toBe(false)
    expect(result.isMock).toBe(true)
    expect(result.reason).toMatch(/MOCK_ONLY/i)
  })

  it('[TEST 4] PRODUCTION + partnerApproval = can operate', () => {
    const result = checkConnectorCapabilities('PRODUCTION', 'UBER-PARTNER-2026', true, true)
    expect(result.canMakeApiCalls).toBe(true)
    expect(result.canReceiveWebhooks).toBe(true)
    expect(result.isMock).toBe(false)
  })

  it('[TEST 5] Missing partnerApprovalRef = mock imposed (even if status=PRODUCTION)', () => {
    const result = checkConnectorCapabilities('PRODUCTION', null, true, true)
    expect(result.isMock).toBe(true)
    expect(result.canMakeApiCalls).toBe(false)
    expect(result.reason).toMatch(/approbation/i)
  })

  it('[PASS] DISABLED = cannot operate', () => {
    const result = checkConnectorCapabilities('DISABLED', 'ref', false, false)
    expect(result.canMakeApiCalls).toBe(false)
    expect(result.canReceiveWebhooks).toBe(false)
  })

  it('[PASS] SANDBOX with approval = limited operation', () => {
    const result = checkConnectorCapabilities('SANDBOX', 'SANDBOX-REF', true, false)
    expect(result.isMock).toBe(false)
    expect(result.canReceiveWebhooks).toBe(true)
    expect(result.canMakeApiCalls).toBe(false) // supportsApiPull=false
  })
})

// ─── RATE LIMIT GUARD ────────────────────────────────────────

describe('Rate Limit Guard — Tests 6, 7, 8', () => {
  it('[TEST 6] Within limit = allowed', () => {
    const result = checkRateLimit(50, 100, null)
    expect(result.allowed).toBe(true)
    expect(result.remainingRequests).toBe(50)
  })

  it('[TEST 7] Limit reached = blocked', () => {
    const result = checkRateLimit(100, 100, new Date(Date.now() + 60000))
    expect(result.allowed).toBe(false)
    expect(result.remainingRequests).toBe(0)
    expect(result.resetInSeconds).toBeGreaterThan(0)
  })

  it('[TEST 8] Exceeded limit = blocked with reset info', () => {
    const result = checkRateLimit(150, 100, new Date(Date.now() + 30000))
    expect(result.allowed).toBe(false)
    expect(result.reason).toMatch(/Limite/i)
  })

  it('[PASS] Rate limit respected before API call (never after)', () => {
    // Application must call checkRateLimit BEFORE making the API call
    const preCheck = checkRateLimit(99, 100, null)
    expect(preCheck.allowed).toBe(true)
    expect(preCheck.remainingRequests).toBe(1)
  })
})

// ─── CHECKPOINT MANAGEMENT ────────────────────────────────────

describe('Checkpoint Management — Tests 9, 10, 11', () => {
  it('[TEST 9] Expired cursor → full resync needed', () => {
    const expired = new Date('2026-01-01')  // In the past
    const result = assessCheckpoint(expired, 0)
    expect(result.shouldFullResync).toBe(true)
    expect(result.reason).toMatch(/expiré/i)
  })

  it('[TEST 10] Valid cursor = resume from checkpoint', () => {
    const future = new Date(Date.now() + 86400000)
    const result = assessCheckpoint(future, 0)
    expect(result.shouldFullResync).toBe(false)
    expect(result.reason).toBeNull()
  })

  it('[TEST 11] Many consecutive errors = alert (not auto-resync)', () => {
    const future = new Date(Date.now() + 86400000)
    const result = assessCheckpoint(future, 5, 5)
    // Alert but NOT a forced full resync — requires human review
    expect(result.shouldFullResync).toBe(false)
    expect(result.reason).toMatch(/erreurs consécutives/i)
  })

  it('[PASS] No cursor expiry = no forced resync on errors below threshold', () => {
    const result = assessCheckpoint(null, 3, 5)
    expect(result.shouldFullResync).toBe(false)
  })
})

// ─── PIPELINE STAGE ORDER ─────────────────────────────────────

describe('Pipeline Stage Order — Tests 12 & 13', () => {
  it('[TEST 12] Correct stage order passes validation', () => {
    const stages = [
      { stageType: 'FETCH'     as PipelineStageType, stageOrder: 1 },
      { stageType: 'VALIDATE'  as PipelineStageType, stageOrder: 2 },
      { stageType: 'NORMALIZE' as PipelineStageType, stageOrder: 3 },
      { stageType: 'PERSIST'   as PipelineStageType, stageOrder: 4 },
    ]
    expect(isStageOrderValid(stages)).toBe(true)
  })

  it('[TEST 13] PERSIST before FETCH = invalid', () => {
    const stages = [
      { stageType: 'PERSIST' as PipelineStageType, stageOrder: 1 },
      { stageType: 'FETCH'   as PipelineStageType, stageOrder: 2 },
    ]
    expect(isStageOrderValid(stages)).toBe(false)
  })

  it('[PASS] Stage execution order is defined', () => {
    expect(STAGE_EXECUTION_ORDER[0]).toBe('FETCH')
    expect(STAGE_EXECUTION_ORDER).toContain('VALIDATE')
    expect(STAGE_EXECUTION_ORDER).toContain('PERSIST')
    expect(STAGE_EXECUTION_ORDER[STAGE_EXECUTION_ORDER.length - 1]).toBe('FINALIZE')
  })
})

// ─── CONFIG VERSIONING ───────────────────────────────────────

describe('Config Versioning — Tests 14 & 15', () => {
  it('[TEST 14] PUBLISHED config cannot be modified', () => {
    const result = checkConfigModification('PUBLISHED')
    expect(result.canModify).toBe(false)
    expect(result.mustVersion).toBe(true)
    expect(result.reason).toMatch(/immuable/i)
  })

  it('[TEST 15] DRAFT config can be modified', () => {
    const result = checkConfigModification('DRAFT')
    expect(result.canModify).toBe(true)
    expect(result.mustVersion).toBe(false)
  })

  it('[PASS] DEPRECATED config requires new version', () => {
    const result = checkConfigModification('DEPRECATED')
    expect(result.canModify).toBe(false)
    expect(result.mustVersion).toBe(true)
  })
})

// ─── TAXIMETER RULE ───────────────────────────────────────────

describe('Taximeter Rule — Test 16', () => {
  it('[TEST 16] All connectors: taximeterEnabled = false (absolute)', () => {
    const types = ['UBER', 'LYFT', 'DOORDASH', 'INSTACART', 'UBER_EATS', 'SKIP', 'OTHER']
    types.forEach(t => {
      expect(isConnectorTaximeterEnabled(t)).toBe(false)
    })
  })

  it('[PASS] Return type is literal false', () => {
    const result: false = isConnectorTaximeterEnabled('UBER')
    expect(result).toBe(false)
  })
})

// ─── ACCESS CONTROL ───────────────────────────────────────────

describe('Access Control — Tests 17, 18, 19', () => {
  it('[TEST 17] connectors.manage required to manage connector', () => {
    expect(canAdminManageConnector(['connectors.manage'])).toBe(true)
    expect(canAdminManageConnector(['connectors.read'])).toBe(false)
  })

  it('[TEST 18] connectors.publish required to publish config', () => {
    expect(canAdminPublishConfig(['connectors.publish'])).toBe(true)
    expect(canAdminPublishConfig(['connectors.manage'])).toBe(false)
  })

  it('[TEST 19] connectors.read or pipeline.read for viewing runs', () => {
    expect(canViewPipelineRuns(['connectors.read'])).toBe(true)
    expect(canViewPipelineRuns(['pipeline.read'])).toBe(true)
    expect(canViewPipelineRuns(['revenue.read'])).toBe(false)
  })
})

// ─── SEED DATA — Test 20 ──────────────────────────────────────

describe('Seed Connectors — Test 20', () => {
  it('[TEST 20] 6 connectors définis (Uber/Lyft/DoorDash/Instacart/UberEats/Skip)', () => {
    const types = SEED_PLATFORM_CONNECTORS.map(c => c.connectorType)
    expect(types).toContain('UBER')
    expect(types).toContain('LYFT')
    expect(types).toContain('DOORDASH')
    expect(types).toContain('INSTACART')
    expect(types).toContain('UBER_EATS')
    expect(types).toContain('SKIP')
    expect(SEED_PLATFORM_CONNECTORS).toHaveLength(6)
  })

  it('[PASS] Tous les seeds: MOCK_ONLY + taximeterEnabled=false', () => {
    SEED_PLATFORM_CONNECTORS.forEach(c => {
      expect(c.status).toBe('MOCK_ONLY')
      expect(c.taximeterEnabled).toBe(false)
      expect(c.partnerApprovalReference).toBeNull()
    })
  })

  it('[PASS] Aucune capacité activée sans approbation', () => {
    SEED_PLATFORM_CONNECTORS.forEach(c => {
      expect(c.supportsWebhook).toBe(false)
      expect(c.supportsApiPull).toBe(false)
      expect(c.supportsOauth).toBe(false)
      expect(c.supportsBatchExport).toBe(false)
    })
  })

  it('[PASS] Tous marqués comme seeds de développement', () => {
    SEED_PLATFORM_CONNECTORS.forEach(c => {
      expect(c.isDev).toBe(true)
    })
  })
})

// ─── INVARIANTS ───────────────────────────────────────────────

describe('Schema Invariants', () => {
  it('[PASS] MOCK_ONLY toujours bloqué même avec partnerRef rempli manuellement', () => {
    // Si status = MOCK_ONLY, peu importe partnerApprovalRef
    const result = checkConnectorCapabilities('MOCK_ONLY', 'SOME-REF', true, true)
    expect(result.isMock).toBe(true)
    expect(result.canMakeApiCalls).toBe(false)
  })

  it('[PASS] Taximeter absolute: return type est false pour tous les types', () => {
    (['UBER', 'LYFT', 'DOORDASH', 'INSTACART', 'UBER_EATS', 'SKIP', 'OTHER'] as const)
      .forEach(t => expect(isConnectorTaximeterEnabled(t)).toBe(false))
  })

  it('[PASS] Pipeline run key est déterministe (retry safe)', () => {
    const k = buildPipelineRunKey('con-1', 'RETRY', '2026-Q3', 'SCHEDULER')
    expect(k).toBe(buildPipelineRunKey('con-1', 'RETRY', '2026-Q3', 'SCHEDULER'))
  })
})
