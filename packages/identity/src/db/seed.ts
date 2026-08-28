// ================================================================
// TAXIMÈTRE.GOV — DATABASE SEED
// Roles, permissions, role-permissions, and Super Admin bootstrap
// ================================================================
//
// SECURITY: The Super Admin password comes ONLY from environment.
// Run: SUPER_ADMIN_EMAIL=... SUPER_ADMIN_INITIAL_SECRET=... tsx src/db/seed.ts
//
// The initial secret should be rotated immediately after first login.
// Never commit this secret to Git or logs.
// ================================================================

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
import {
  users, roles, permissions, rolePermissions, userRoles,
} from '../schema'
import { PERMISSION_DEFINITIONS, ROLE_DEFINITIONS } from '../rbac/definitions'
import { hashPassword, generatePublicId } from '../auth/auth.service'

async function seed() {
  if (!process.env['DATABASE_URL']) {
    throw new Error('DATABASE_URL is required')
  }

  const superAdminEmail = process.env['SUPER_ADMIN_EMAIL']
  const superAdminSecret = process.env['SUPER_ADMIN_INITIAL_SECRET']

  if (!superAdminEmail || !superAdminSecret) {
    throw new Error(
      'SUPER_ADMIN_EMAIL and SUPER_ADMIN_INITIAL_SECRET must be set. ' +
      'Never hardcode these values.'
    )
  }

  if (superAdminSecret.length < 20) {
    throw new Error('SUPER_ADMIN_INITIAL_SECRET must be at least 20 characters')
  }

  const connection = postgres(process.env['DATABASE_URL'], { max: 1 })
  const db = drizzle(connection)

  console.log('[seed] 🌱 Starting database seed...')

  // ── 1. Seed permissions ───────────────────────────────────

  console.log(`[seed] Seeding ${PERMISSION_DEFINITIONS.length} permissions...`)

  for (const perm of PERMISSION_DEFINITIONS) {
    await db.insert(permissions)
      .values({
        key:         perm.key,
        label:       perm.label,
        module:      perm.module,
        description: perm.description,
      })
      .onConflictDoUpdate({
        target: permissions.key,
        set: { label: perm.label, description: perm.description },
      })
  }

  console.log('[seed] ✅ Permissions seeded')

  // ── 2. Seed roles ─────────────────────────────────────────

  console.log(`[seed] Seeding ${ROLE_DEFINITIONS.length} roles...`)

  for (const roleDef of ROLE_DEFINITIONS) {
    await db.insert(roles)
      .values({
        name:        roleDef.name,
        label:       roleDef.label,
        description: roleDef.description,
        requiresMfa: roleDef.requiresMfa,
        isSystem:    true,
      })
      .onConflictDoUpdate({
        target: roles.name,
        set: { label: roleDef.label, description: roleDef.description, requiresMfa: roleDef.requiresMfa },
      })
  }

  console.log('[seed] ✅ Roles seeded')

  // ── 3. Seed role-permission mappings ──────────────────────

  console.log('[seed] Seeding role-permission mappings...')

  for (const roleDef of ROLE_DEFINITIONS) {
    const [roleRow] = await db.select().from(roles).where(eq(roles.name, roleDef.name)).limit(1)
    if (!roleRow) continue

    for (const permKey of roleDef.permissions) {
      const [permRow] = await db.select().from(permissions).where(eq(permissions.key, permKey)).limit(1)
      if (!permRow) {
        console.warn(`[seed] ⚠️  Permission '${permKey}' not found for role '${roleDef.name}'`)
        continue
      }

      await db.insert(rolePermissions)
        .values({ roleId: roleRow.id, permissionId: permRow.id })
        .onConflictDoNothing()
    }
  }

  console.log('[seed] ✅ Role-permission mappings seeded')

  // ── 4. Bootstrap Super Admin ──────────────────────────────

  console.log(`[seed] Bootstrapping Super Admin: ${superAdminEmail}`)

  // Check if super admin already exists
  const [existingAdmin] = await db.select().from(users)
    .where(eq(users.email, superAdminEmail.toLowerCase()))
    .limit(1)

  if (existingAdmin) {
    console.log('[seed] ℹ️  Super Admin already exists — skipping creation')
  } else {
    // Hash password with Argon2id — never store plaintext
    console.log('[seed] Hashing password with Argon2id...')
    const passwordHash = await hashPassword(superAdminSecret)

    const [superAdminUser] = await db.insert(users)
      .values({
        publicId:          generatePublicId('GOVERNMENT'),
        userType:          'GOVERNMENT',
        status:            'ACTIVE',
        email:             superAdminEmail.toLowerCase(),
        passwordHash:      passwordHash,
        emailVerifiedAt:   new Date(),
        mfaRequired:       true,
        // MFA must be set up on first login
        failedLoginAttempts: 0,
      })
      .returning()

    if (!superAdminUser) throw new Error('Failed to create Super Admin user')

    // Assign SUPER_ADMIN role
    const [superAdminRole] = await db.select().from(roles)
      .where(eq(roles.name, 'SUPER_ADMIN'))
      .limit(1)

    if (!superAdminRole) throw new Error('SUPER_ADMIN role not found')

    await db.insert(userRoles).values({
      userId:     superAdminUser.id,
      roleId:     superAdminRole.id,
      assignedBy: superAdminUser.id,
      // Self-assigned during bootstrap
    })

    console.log(`[seed] ✅ Super Admin created: ${superAdminEmail}`)
    console.log('[seed] ⚠️  MFA is required — set it up on first login')
    console.log('[seed] ⚠️  Rotate the initial secret after first login')
  }

  // ── 5. Summary ────────────────────────────────────────────

  const [permCount]  = await db.select().from(permissions)
  const [roleCount]  = await db.select().from(roles)
  const [rpCount]    = await db.select().from(rolePermissions)
  const [userCount]  = await db.select().from(users)

  console.log('\n[seed] 📊 Summary:')
  console.log(`  Permissions:         ${PERMISSION_DEFINITIONS.length}`)
  console.log(`  Roles:               ${ROLE_DEFINITIONS.length}`)
  console.log(`  Role-permissions:    (see role_permissions table)`)
  console.log(`  Users:               (see users table)`)
  console.log('\n[seed] 🏁 Seed complete')

  await connection.end()
}

seed().catch((err) => {
  console.error('[seed] ❌ Seed failed:', err.message)
  // Never log the full error — could expose env variables
  process.exit(1)
})
