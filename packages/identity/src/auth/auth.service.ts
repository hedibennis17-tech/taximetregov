// ================================================================
// TAXIMÈTRE.GOV — AUTH SERVICE
// Password hashing, session management, token rotation
// ================================================================
//
// SECURITY INVARIANTS:
// 1. Argon2id for all password hashing — never MD5/SHA/bcrypt alone
// 2. Refresh tokens stored as SHA-256 hash only — never raw
// 3. Generic error messages — never reveal email existence
// 4. Rate limiting enforced at service layer
// 5. Sessions carry mfa_completed flag — gov sessions MUST be true
// 6. Token rotation: each refresh creates new token + revokes old
// ================================================================

import argon2 from 'argon2'
import { createHash, randomBytes } from 'crypto'

// ─── PASSWORD HASHING ─────────────────────────────────────────

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,  // 64 MB
  timeCost: 3,        // 3 iterations
  parallelism: 4,
  // These values meet OWASP recommendations for 2024+
  // Adjust memoryCost upward as hardware improves
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS)
}

export async function verifyPassword(
  hash: string,
  password: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hash, password)
  } catch {
    // Never leak timing information or error details
    return false
  }
}

export function needsRehash(hash: string): boolean {
  return argon2.needsRehash(hash, ARGON2_OPTIONS)
  // If true, rehash after successful login (transparent upgrade)
}

// ─── TOKEN GENERATION ─────────────────────────────────────────

export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url')
  // 32 bytes = 256 bits of entropy
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
  // SHA-256 of refresh token for database storage
  // Never store raw refresh tokens
}

export function hashIdentifier(identifier: string): string {
  // Used for login_attempts — hash the email/phone so we
  // can detect abuse without storing PII in attempt logs
  return createHash('sha256')
    .update(identifier.toLowerCase().trim())
    .digest('hex')
}

export function hashIp(ip: string): string {
  // Hash IP for privacy — stored in sessions and events
  // We can still detect suspicious patterns without logging raw IPs
  return createHash('sha256').update(ip).digest('hex').slice(0, 16)
}

// ─── SESSION EXPIRY ───────────────────────────────────────────

export const SESSION_EXPIRY = {
  DRIVER:     8 * 60 * 60 * 1000,   // 8 hours
  GOVERNMENT: 4 * 60 * 60 * 1000,   // 4 hours (stricter for gov accounts)
  REFRESH:    30 * 24 * 60 * 60 * 1000, // 30 days for refresh tokens
}

export function sessionExpiresAt(userType: 'DRIVER' | 'GOVERNMENT'): Date {
  const ms = userType === 'GOVERNMENT'
    ? SESSION_EXPIRY.GOVERNMENT
    : SESSION_EXPIRY.DRIVER
  return new Date(Date.now() + ms)
}

export function refreshExpiresAt(): Date {
  return new Date(Date.now() + SESSION_EXPIRY.REFRESH)
}

// ─── RATE LIMITING CONCEPTS ───────────────────────────────────
//
// These are configuration values — actual enforcement is done
// by a Redis-backed rate limiter in the API Gateway layer.
// Values are configurable per environment.

export const RATE_LIMITS = {
  LOGIN_ATTEMPTS_PER_15_MIN:      5,   // Per identifier
  LOGIN_ATTEMPTS_PER_IP_PER_HOUR: 20,  // Per IP
  OTP_ATTEMPTS_PER_10_MIN:        3,   // Per user
  PASSWORD_RESET_PER_HOUR:        3,   // Per identifier
  LOCKOUT_DURATION_MINUTES:       15,  // After limit reached
} as const

// ─── ACCOUNT LOCKOUT ──────────────────────────────────────────

export const MAX_FAILED_ATTEMPTS = 6
// After 6 failures, account is temporarily locked

export function shouldLockAccount(failedAttempts: number): boolean {
  return failedAttempts >= MAX_FAILED_ATTEMPTS
}

export function lockoutExpiresAt(): Date {
  return new Date(Date.now() + RATE_LIMITS.LOCKOUT_DURATION_MINUTES * 60 * 1000)
}

// ─── GENERIC ERROR MESSAGES ───────────────────────────────────
//
// CRITICAL: Never reveal whether an email exists or not.
// Always return the same message for all auth failures.

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS:
    'Identifiants incorrects. Veuillez réessayer.',
  ACCOUNT_LOCKED:
    'Compte temporairement bloqué. Veuillez réessayer dans quelques minutes.',
  MFA_REQUIRED:
    'Vérification en deux étapes requise.',
  MFA_INVALID:
    'Code de vérification incorrect.',
  SESSION_EXPIRED:
    'Session expirée. Veuillez vous reconnecter.',
  SESSION_REVOKED:
    'Session révoquée. Veuillez vous reconnecter.',
  RATE_LIMITED:
    'Trop de tentatives. Veuillez réessayer plus tard.',
} as const

// ─── PUBLIC ID GENERATION ─────────────────────────────────────

export function generatePublicId(userType: 'DRIVER' | 'GOVERNMENT' | 'SYSTEM'): string {
  const prefix = userType === 'DRIVER' ? 'DRV'
    : userType === 'GOVERNMENT' ? 'GOV' : 'SYS'
  const part1 = randomBytes(2).toString('hex').toUpperCase()
  const part2 = randomBytes(2).toString('hex').toUpperCase()
  return `${prefix}-${part1}-${part2}`
  // e.g. DRV-A7K2-M9P3 or GOV-F2D8-X1C9
}

// ─── MFA ENFORCEMENT ──────────────────────────────────────────

export function requiresMfaCompletion(
  userType: 'DRIVER' | 'GOVERNMENT' | 'SYSTEM',
  mfaRequired: boolean,
  mfaCompleted: boolean,
): boolean {
  // Government users ALWAYS require MFA before accessing resources
  if (userType === 'GOVERNMENT' && !mfaCompleted) return true
  // Other users: check their mfa_required flag
  if (mfaRequired && !mfaCompleted) return true
  return false
}
