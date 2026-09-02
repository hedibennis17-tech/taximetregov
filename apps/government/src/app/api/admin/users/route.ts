import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { apiError, requireGovernmentAdministrator } from '@/lib/supabase/authorization'

export const dynamic = 'force-dynamic'

const INVITABLE_ROLES = new Set(['GOV_ADMIN', 'GOV_AUDITOR', 'GOV_INSPECTOR', 'GOV_TAX_OFFICER'])

export async function GET(request: NextRequest) {
  try {
    await requireGovernmentAdministrator(request)
    const admin = getSupabaseAdminClient()
    const { data, error } = await admin
      .from('users')
      .select('id, public_id, email, status, mfa_required, mfa_enabled_at, last_login_at, created_at, user_roles(revoked_at, expires_at, roles(name, label, requires_mfa))')
      .eq('user_type', 'GOVERNMENT')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    const users = (data ?? []).map((user: Record<string, unknown>) => ({
      id: String(user.id),
      publicId: String(user.public_id),
      email: String(user.email),
      status: String(user.status),
      mfaRequired: Boolean(user.mfa_required),
      mfaEnabled: Boolean(user.mfa_enabled_at),
      lastLoginAt: user.last_login_at ? String(user.last_login_at) : null,
      createdAt: String(user.created_at),
      roles: ((user.user_roles ?? []) as Array<Record<string, unknown>>)
        .filter((assignment) => !assignment.revoked_at)
        .map((assignment) => assignment.roles as Record<string, unknown> | null)
        .filter((role): role is Record<string, unknown> => Boolean(role?.name))
        .map((role) => String(role.name)),
    }))
    return NextResponse.json({ users })
  } catch (error) {
    const response = apiError(error)
    return NextResponse.json(response.body, { status: response.status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireGovernmentAdministrator(request)
    if (!actor.roles.includes('SUPER_ADMIN') && !actor.roles.includes('GOV_ADMIN')) throw new Error('FORBIDDEN')

    const body = await request.json() as { email?: string; role?: string; firstName?: string; lastName?: string }
    const email = body.email?.trim().toLowerCase()
    const role = body.role?.trim()
    if (!email || !/^\S+@\S+\.\S+$/.test(email) || !role || !INVITABLE_ROLES.has(role)) {
      return NextResponse.json({ error: 'Courriel ou rôle administratif invalide.' }, { status: 400 })
    }
    if (!actor.roles.includes('SUPER_ADMIN') && role === 'GOV_ADMIN') {
      return NextResponse.json({ error: 'Seul un SUPER_ADMIN peut inviter un GOV_ADMIN.' }, { status: 403 })
    }

    const admin = getSupabaseAdminClient()
    const { data: roleRecord, error: roleError } = await admin.from('roles').select('id').eq('name', role).maybeSingle()
    if (roleError || !roleRecord) return NextResponse.json({ error: 'Rôle administratif introuvable.' }, { status: 400 })

    const origin = request.nextUrl.origin
    const { data: invitation, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        account_scope: 'GOVERNMENT',
        first_name: body.firstName?.trim() || 'Administrateur',
        last_name: body.lastName?.trim() || 'Gouvernement',
      },
      redirectTo: `${origin}/auth/login`,
    })
    if (inviteError || !invitation.user) throw inviteError ?? new Error('INVITE_FAILED')

    const userId = invitation.user.id
    const { error: identityError } = await admin.from('users').insert({
      id: userId,
      public_id: `GOV-${userId.replaceAll('-', '').slice(0, 8).toUpperCase()}`,
      user_type: 'GOVERNMENT',
      status: 'PENDING',
      email,
      password_hash: null,
      mfa_required: true,
    })
    if (identityError) {
      await admin.auth.admin.deleteUser(userId)
      throw identityError
    }

    const { error: assignmentError } = await admin.from('user_roles').insert({ user_id: userId, role_id: roleRecord.id, assigned_by: actor.id })
    if (assignmentError) {
      await admin.from('users').delete().eq('id', userId)
      await admin.auth.admin.deleteUser(userId)
      throw assignmentError
    }

    return NextResponse.json({ invited: { publicId: `GOV-${userId.replaceAll('-', '').slice(0, 8).toUpperCase()}`, email, role } }, { status: 201 })
  } catch (error) {
    const response = apiError(error)
    return NextResponse.json(response.body, { status: response.status })
  }
}
