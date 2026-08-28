// ================================================================
// TAXIMÈTRE.GOV — MIGRATION RUNNER
// Run: tsx src/db/migrate.ts
// ================================================================

import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

async function runMigrations() {
  if (!process.env['DATABASE_URL']) {
    throw new Error('DATABASE_URL is required for migrations')
  }

  console.log('[migrate] Connecting to database...')

  // Single connection for migrations (not pool)
  const connection = postgres(process.env['DATABASE_URL'], { max: 1 })
  const db = drizzle(connection)

  console.log('[migrate] Running migrations...')

  await migrate(db, { migrationsFolder: './migrations' })

  console.log('[migrate] ✅ Migrations completed successfully')

  await connection.end()
}

runMigrations().catch((err) => {
  console.error('[migrate] ❌ Migration failed:', err.message)
  process.exit(1)
})
