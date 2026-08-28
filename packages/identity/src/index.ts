// ================================================================
// TAXIMÈTRE.GOV — IDENTITY PACKAGE
// Phase DB-1: Identity, Auth & RBAC
// ================================================================

// Schema (Drizzle ORM tables)
export * from './schema'

// Auth service
export * from './auth/auth.service'

// RBAC
export * from './rbac/definitions'

// DB client (not exported as default — import explicitly)
export { db } from './db/client'
export type { Database } from './db/client'
