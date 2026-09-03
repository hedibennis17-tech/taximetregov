// ================================================================
// TAXIMÈTRE.GOV — DATABASE CLIENT
// Connexion Supabase PostgreSQL — lazy initialized
// ================================================================

import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

let _db: PostgresJsDatabase | null = null

export function getDb(): PostgresJsDatabase {
  if (_db) return _db
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL manquante — configurer dans Vercel Environment Variables')
  const client = postgres(url, {
    max: 1,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connect_timeout: 10,
    idle_timeout: 20,
  })
  _db = drizzle(client)
  return _db
}

export function apiSuccess(data: unknown, status = 200) {
  return Response.json({ success: true, data }, { status })
}

export function apiError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status })
}
