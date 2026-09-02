import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from './admin'

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'GOV_ADMIN', 'GOV_AUDITOR', 'GOV_INSPECTOR', 'GOV_TAX_OFFICER'])

export type GovernmentAdministrator = {
  id: string
  email: string
  publicId: string
  roles: string[]
  requiresMfa: boolean
}

function tokenAal(token: string): string | null {
  try {
    const encodedPayload = token.split('.')[1]
    if (!encodedPayload) return null
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as { aal?: string }
    return payload.aal ?? null
  } catch {
    return null
  }
}

export async function requireGovernmentAdministrator(request: NextRequest): Promise<GovernmentAdministrator> {
  const authorization = request.headers.get('authorization')
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null
  if (!token) throw new Error('UNAUTHENTICATED')

  const admin = getSupabaseAdminClient()
  const { data: authData, error: authError } = await admin.auth.getUser(token)
  if (authError || !authData.user) throw new Error('UNAUTHENTICATED')

  const { data: identity, error: identityError } = await admin
    .from('users')
    .select('id, public_id, email, user_type, status, mfa_required, deleted_at, user_roles(revoked_at, expires_at, roles(name, requires_mfa))')
    .eq('id', authData.user.id)
    .maybeSingle()

  if (identityError || !identity || identity.user_type !== 'GOVERNMENT' || identity.status !== 'ACTIVE' || identity.deleted_at) {
    throw new Error('FORBIDDEN')
  }

  const now = Date.now()
  const roles = ((identity.user_roles ?? []) as Array<Record<string, unknown>>)
    .filter((assignment) => !assignment.revoked_at && (!assignment.expires_at || new Date(String(assignment.expires_at)).getTime() > now))
    .map((assignment) => assignment.roles as Record<string, unknown> | null)
    .filter((role): role is Record<string, unknown> => Boolean(role?.name && ADMIN_ROLES.has(String(role.name))))

  if (roles.length === 0) throw new Error('FORBIDDEN')

  const requiresMfa = Boolean(identity.mfa_required) || roles.some((role) => Boolean(role.requires_mfa))
  if (requiresMfa && tokenAal(token) !== 'aal2') throw new Error('MFA_REQUIRED')

  return {
    id: String(identity.id),
    email: String(identity.email),
    publicId: String(identity.public_id),
    roles: roles.map((role) => String(role.name)),
    requiresMfa,
  }
}

export function apiError(error: unknown) {
  const code = error instanceof Error ? error.message : 'UNKNOWN'
  if (code === 'UNAUTHENTICATED') return { status: 401, body: { error: 'Session administrative requise.' } }
  if (code === 'MFA_REQUIRED') return { status: 403, body: { error: 'Authentification multifacteur requise.', code } }
  if (code === 'FORBIDDEN') return { status: 403, body: { error: 'Droits administratifs insuffisants.' } }
  return { status: 500, body: { error: 'Erreur interne du service administratif.' } }
}
