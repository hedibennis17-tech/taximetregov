// ================================================================
// TAXIMÈTRE.GOV — DATABASE CLIENT
// ================================================================
//
// DATABASE_URL must be injected via environment variable.
// Never hardcoded — never committed to Git.
//
// Connection string format:
// postgresql://user:password@host:5432/taximetregov
// ================================================================

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../schema'

// Validate that DATABASE_URL is configured
if (!process.env['DATABASE_URL']) {
  throw new Error(
    '[identity] DATABASE_URL is not set. ' +
    'Set it in your environment variables. ' +
    'Never hardcode database credentials.'
  )
}

// Create connection pool
const connection = postgres(process.env['DATABASE_URL'], {
  max: 10,          // Max pool size
  idle_timeout: 30, // Seconds before idle connection closed
  connect_timeout: 10,
  ssl: process.env['NODE_ENV'] === 'production'
    ? { rejectUnauthorized: true }
    : false,
})

export const db = drizzle(connection, {
  schema,
  logger: process.env['NODE_ENV'] === 'development',
  // Never log in production — could expose query data
})

export type Database = typeof db
