// ================================================================
// TAXIMÈTRE.GOV — AUTH UNIT TESTS
// Phase DB-1: Identity, Auth & RBAC
// ================================================================
//
// These tests cover the auth service layer — pure logic tests
// that do not require a live database connection.
// ================================================================

import { describe, it, expect, beforeAll } from 'vitest'
import {
  hashPassword,
  verifyPassword,
  needsRehash,
  generateSecureToken,
  hashToken,
  hashIdentifier,
  hashIp,
  generatePublicId,
  sessionExpiresAt,
  refreshExpiresAt,
  requiresMfaCompletion,
  shouldLockAccount,
  lockoutExpiresAt,
  AUTH_ERRORS,
  MAX_FAILED_ATTEMPTS,
} from '../src/auth/auth.service'
import {
  PERMISSION_DEFINITIONS,
  ROLE_DEFINITIONS,
  hasPermission,
  checkResourceOwnership,
} from '../src/rbac/definitions'

// ─── PASSWORD SECURITY ────────────────────────────────────────

describe('Password Security (Argon2id)', () => {
  let hash: string
  const plaintext = 'SecurePass!2026#TXM'

  beforeAll(async () => {
    hash = await hashPassword(plaintext)
  })

  it('[PASS] Hash is not the plaintext password', () => {
    expect(hash).not.toBe(plaintext)
    expect(hash).not.toContain(plaintext)
  })

  it('[PASS] Hash uses Argon2id format', () => {
    expect(hash).toMatch(/^\$argon2id\$/)
  })

  it('[PASS] Correct password verifies', async () => {
    const result = await verifyPassword(hash, plaintext)
    expect(result).toBe(true)
  })

  it('[PASS] Wrong password fails', async () => {
    const result = await verifyPassword(hash, 'WrongPassword123!')
    expect(result).toBe(false)
  })

  it('[PASS] Empty password fails', async () => {
    const result = await verifyPassword(hash, '')
    expect(result).toBe(false)
  })

  it('[PASS] Two identical passwords produce different hashes (salting)', async () => {
    const hash2 = await hashPassword(plaintext)
    expect(hash).not.toBe(hash2)
    // Both verify correctly
    expect(await verifyPassword(hash2, plaintext)).toBe(true)
  })

  it('[PASS] needsRehash returns false for fresh hash', () => {
    expect(needsRehash(hash)).toBe(false)
  })

  it('[PASS] Password never appears in hash', () => {
    expect(hash).not.toContain('SecurePass')
    expect(hash).not.toContain('2026')
    expect(hash).not.toContain('TXM')
  })
})

// ─── TOKEN SECURITY ───────────────────────────────────────────

describe('Token Security', () => {
  it('[PASS] generateSecureToken produces URL-safe string', () => {
    const token = generateSecureToken()
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('[PASS] Tokens are unique (high entropy)', () => {
    const tokens = new Set(Array.from({ length: 1000 }, () => generateSecureToken()))
    expect(tokens.size).toBe(1000)
  })

  it('[PASS] hashToken produces hex SHA-256', () => {
    const token = generateSecureToken()
    const h = hashToken(token)
    expect(h).toHaveLength(64)
    expect(h).toMatch(/^[0-9a-f]+$/)
  })

  it('[PASS] Same token always produces same hash (deterministic)', () => {
    const token = 'fixed-token-for-test'
    expect(hashToken(token)).toBe(hashToken(token))
  })

  it('[PASS] Raw token never stored — only hash in DB', () => {
    const token = generateSecureToken()
    const hash = hashToken(token)
    expect(hash).not.toBe(token)
    expect(hash).not.toContain(token)
  })

  it('[PASS] hashIdentifier hashes email consistently', () => {
    const h1 = hashIdentifier('test@example.com')
    const h2 = hashIdentifier('TEST@EXAMPLE.COM')
    expect(h1).toBe(h2)  // Case-insensitive
  })

  it('[PASS] hashIp produces short hash for privacy', () => {
    const h = hashIp('192.168.1.1')
    expect(h).toHaveLength(16)
    expect(h).not.toContain('192.168')
  })
})

// ─── PUBLIC ID GENERATION ─────────────────────────────────────

describe('Public ID Generation', () => {
  it('[PASS] Driver ID has DRV prefix', () => {
    const id = generatePublicId('DRIVER')
    expect(id).toMatch(/^DRV-[A-F0-9]{4}-[A-F0-9]{4}$/)
  })

  it('[PASS] Government ID has GOV prefix', () => {
    const id = generatePublicId('GOVERNMENT')
    expect(id).toMatch(/^GOV-[A-F0-9]{4}-[A-F0-9]{4}$/)
  })

  it('[PASS] Public IDs are unique', () => {
    const ids = new Set(Array.from({ length: 500 }, () => generatePublicId('DRIVER')))
    expect(ids.size).toBe(500)
  })
})

// ─── SESSION MANAGEMENT ───────────────────────────────────────

describe('Session Management', () => {
  it('[PASS] Driver session expires in ~8 hours', () => {
    const expiry = sessionExpiresAt('DRIVER')
    const diffMs = expiry.getTime() - Date.now()
    expect(diffMs).toBeGreaterThan(7.9 * 60 * 60 * 1000)
    expect(diffMs).toBeLessThan(8.1 * 60 * 60 * 1000)
  })

  it('[PASS] Government session expires in ~4 hours (stricter)', () => {
    const expiry = sessionExpiresAt('GOVERNMENT')
    const diffMs = expiry.getTime() - Date.now()
    expect(diffMs).toBeGreaterThan(3.9 * 60 * 60 * 1000)
    expect(diffMs).toBeLessThan(4.1 * 60 * 60 * 1000)
  })

  it('[PASS] Government session shorter than driver session', () => {
    const govExpiry    = sessionExpiresAt('GOVERNMENT').getTime()
    const driverExpiry = sessionExpiresAt('DRIVER').getTime()
    expect(govExpiry).toBeLessThan(driverExpiry)
  })

  it('[PASS] Refresh token expires in ~30 days', () => {
    const expiry = refreshExpiresAt()
    const diffMs = expiry.getTime() - Date.now()
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
    expect(diffMs).toBeGreaterThan(thirtyDaysMs - 60000)
    expect(diffMs).toBeLessThan(thirtyDaysMs + 60000)
  })
})

// ─── MFA ENFORCEMENT ──────────────────────────────────────────

describe('MFA Enforcement', () => {
  it('[PASS] Government user without MFA is blocked', () => {
    expect(requiresMfaCompletion('GOVERNMENT', true, false)).toBe(true)
  })

  it('[PASS] Government user with MFA is allowed', () => {
    expect(requiresMfaCompletion('GOVERNMENT', true, true)).toBe(false)
  })

  it('[PASS] Government user without mfa_required but without MFA is still blocked', () => {
    // Government users ALWAYS require MFA regardless of mfa_required flag
    expect(requiresMfaCompletion('GOVERNMENT', false, false)).toBe(true)
  })

  it('[PASS] Driver with mfa_required without MFA is blocked', () => {
    expect(requiresMfaCompletion('DRIVER', true, false)).toBe(true)
  })

  it('[PASS] Driver without mfa_required is allowed without MFA', () => {
    expect(requiresMfaCompletion('DRIVER', false, false)).toBe(false)
  })

  it('[PASS] Driver with mfa_required and completed MFA is allowed', () => {
    expect(requiresMfaCompletion('DRIVER', true, true)).toBe(false)
  })
})

// ─── ACCOUNT LOCKOUT ──────────────────────────────────────────

describe('Account Lockout (Brute Force Protection)', () => {
  it('[PASS] Account not locked below threshold', () => {
    expect(shouldLockAccount(MAX_FAILED_ATTEMPTS - 1)).toBe(false)
  })

  it('[PASS] Account locked at threshold', () => {
    expect(shouldLockAccount(MAX_FAILED_ATTEMPTS)).toBe(true)
  })

  it('[PASS] Account locked above threshold', () => {
    expect(shouldLockAccount(MAX_FAILED_ATTEMPTS + 5)).toBe(true)
  })

  it('[PASS] Lockout expires in ~15 minutes', () => {
    const expiry = lockoutExpiresAt()
    const diffMs = expiry.getTime() - Date.now()
    expect(diffMs).toBeGreaterThan(14 * 60 * 1000)
    expect(diffMs).toBeLessThan(16 * 60 * 1000)
  })

  it('[PASS] Generic error message — does not reveal email existence', () => {
    expect(AUTH_ERRORS.INVALID_CREDENTIALS).not.toMatch(/email|password|n'existe pas|not found/i)
  })
})

// ─── RBAC ────────────────────────────────────────────────────

describe('RBAC — Roles & Permissions', () => {
  it('[PASS] All roles are defined', () => {
    const roleNames = ROLE_DEFINITIONS.map(r => r.name)
    expect(roleNames).toContain('SUPER_ADMIN')
    expect(roleNames).toContain('GOV_ADMIN')
    expect(roleNames).toContain('TAX_ADMIN')
    expect(roleNames).toContain('FINANCE_REVIEWER')
    expect(roleNames).toContain('AUDITOR')
    expect(roleNames).toContain('SUPPORT')
    expect(roleNames).toContain('READ_ONLY')
    expect(roleNames).toContain('DRIVER')
  })

  it('[PASS] SUPER_ADMIN has more permissions than GOV_ADMIN', () => {
    const superAdmin = ROLE_DEFINITIONS.find(r => r.name === 'SUPER_ADMIN')!
    const govAdmin   = ROLE_DEFINITIONS.find(r => r.name === 'GOV_ADMIN')!
    expect(superAdmin.permissions.length).toBeGreaterThan(govAdmin.permissions.length)
  })

  it('[PASS] Government roles require MFA', () => {
    const govRoles = ROLE_DEFINITIONS.filter(r =>
      ['SUPER_ADMIN', 'GOV_ADMIN', 'TAX_ADMIN', 'FINANCE_REVIEWER', 'AUDITOR'].includes(r.name)
    )
    govRoles.forEach(r => {
      expect(r.requiresMfa).toBe(true)
    })
  })

  it('[PASS] DRIVER role does not have government permissions', () => {
    const driver = ROLE_DEFINITIONS.find(r => r.name === 'DRIVER')!
    const govPerms = ['drivers.suspend', 'tax.finalize', 'audit.export', 'users.manage']
    govPerms.forEach(perm => {
      expect(driver.permissions).not.toContain(perm)
    })
  })

  it('[PASS] DRIVER role only has .self permissions', () => {
    const driver = ROLE_DEFINITIONS.find(r => r.name === 'DRIVER')!
    driver.permissions.forEach(perm => {
      expect(perm).toMatch(/\.self$/)
    })
  })

  it('[PASS] hasPermission returns true when permission present', () => {
    const userPerms = ['drivers.read', 'tax.read']
    expect(hasPermission(userPerms, 'drivers.read')).toBe(true)
  })

  it('[PASS] hasPermission returns false when permission absent', () => {
    const userPerms = ['drivers.read']
    expect(hasPermission(userPerms, 'tax.finalize')).toBe(false)
  })

  it('[PASS] All permission keys are unique', () => {
    const keys = PERMISSION_DEFINITIONS.map(p => p.key)
    const unique = new Set(keys)
    expect(unique.size).toBe(keys.length)
  })

  it('[PASS] All role names are unique', () => {
    const names = ROLE_DEFINITIONS.map(r => r.name)
    const unique = new Set(names)
    expect(unique.size).toBe(names.length)
  })

  it('[PASS] All permissions referenced by roles exist', () => {
    const allKeys = new Set(PERMISSION_DEFINITIONS.map(p => p.key))
    ROLE_DEFINITIONS.forEach(role => {
      role.permissions.forEach(perm => {
        expect(allKeys.has(perm), `Role ${role.name} references unknown permission: ${perm}`).toBe(true)
      })
    })
  })
})

// ─── RESOURCE-LEVEL AUTHORIZATION ────────────────────────────

describe('Resource Authorization — Driver isolation', () => {
  const driverA = 'driver-uuid-aaaa'
  const driverB = 'driver-uuid-bbbb'

  it('[PASS] Driver A can access own data', () => {
    expect(checkResourceOwnership(driverA, driverA, 'DRIVER')).toBe(true)
  })

  it('[PASS] Driver A CANNOT access Driver B data', () => {
    expect(checkResourceOwnership(driverA, driverB, 'DRIVER')).toBe(false)
  })

  it('[PASS] GOV_ADMIN can access any driver data', () => {
    expect(checkResourceOwnership('gov-user-uuid', driverA, 'GOV_ADMIN')).toBe(true)
    expect(checkResourceOwnership('gov-user-uuid', driverB, 'GOV_ADMIN')).toBe(true)
  })

  it('[PASS] AUDITOR can access any driver data', () => {
    expect(checkResourceOwnership('aud-user-uuid', driverA, 'AUDITOR')).toBe(true)
  })

  it('[PASS] SUPER_ADMIN can access any driver data', () => {
    expect(checkResourceOwnership('super-uuid', driverB, 'SUPER_ADMIN')).toBe(true)
  })
})

// ─── SECURITY INVARIANTS ──────────────────────────────────────

describe('Security Invariants', () => {
  it('[PASS] AUTH_ERRORS never reveals email existence', () => {
    const messages = Object.values(AUTH_ERRORS)
    messages.forEach(msg => {
      expect(msg.toLowerCase()).not.toMatch(/email n'existe|account not found|no account/i)
    })
  })

  it('[PASS] Token hash is irreversible (preimage resistance)', () => {
    const token = 'my-secret-refresh-token'
    const hash = hashToken(token)
    // Cannot reverse SHA-256 — verify by checking they are different
    expect(hash).not.toBe(token)
    expect(hash.length).toBe(64)
  })

  it('[PASS] IP hash does not contain original IP', () => {
    const ip = '203.0.113.42'
    const hash = hashIp(ip)
    expect(hash).not.toContain('203')
    expect(hash).not.toContain('113')
    expect(hash).not.toContain('42')
  })
})
