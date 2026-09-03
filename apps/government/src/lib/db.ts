// ================================================================
// TAXIMÈTRE.GOV — DATABASE CLIENT (shared entre driver + gov)
// Connexion Supabase PostgreSQL
// ================================================================

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// Validation DATABASE_URL — jamais hardcodé
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL manquante — configurer dans Vercel Environment Variables')
}

// Pool de connexions optimisé pour Next.js (serverless)
const client = postgres(process.env.DATABASE_URL, {
  max: 1,          // Serverless = 1 connexion par instance
  ssl: { rejectUnauthorized: false },
  connect_timeout: 10,
  idle_timeout: 20,
  max_lifetime: 300,
})

export const db = drizzle(client)

// Helper: réponse API standardisée
export function apiSuccess(data: unknown, status = 200) {
  return Response.json({ success: true, data }, { status })
}

export function apiError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status })
}
