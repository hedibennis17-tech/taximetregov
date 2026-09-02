import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

function tokenAal(token: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')) as { aal?: string }
    return payload.aal ?? null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get('authorization')
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null
  if (!token) return NextResponse.json({ error: 'Session administrative requise.' }, { status: 401 })
  if (tokenAal(token) !== 'aal2') return NextResponse.json({ error: 'Authentification multifacteur requise.', code: 'MFA_REQUIRED' }, { status: 403 })

  try {
    const admin = getSupabaseAdminClient()
    const { data: authData, error: authError } = await admin.auth.getUser(token)
    if (authError || !authData.user) return NextResponse.json({ error: 'Session administrative invalide.' }, { status: 401 })

    const { data: identity, error: identityError } = await admin
      .from('users')
      .select('id, user_type, status, user_roles(revoked_at, roles(name, requires_mfa))')
      .eq('id', authData.user.id)
      .maybeSingle()
    if (identityError || !identity || identity.user_type !== 'GOVERNMENT') return NextResponse.json({ error: 'Compte gouvernemental introuvable.' }, { status: 403 })

    const activeRole = ((identity.user_roles ?? []) as Array<Record<string, unknown>>).some((assignment) => {
      const role = assignment.roles as Record<string, unknown> | null
      return !assignment.revoked_at && ['SUPER_ADMIN', 'GOV_ADMIN', 'GOV_AUDITOR', 'GOV_INSPECTOR', 'GOV_TAX_OFFICER'].includes(String(role?.name)) && Boolean(role?.requires_mfa)
    })
    if (!activeRole) return NextResponse.json({ error: 'Rôle administratif autorisé introuvable.' }, { status: 403 })

    const { error: updateError } = await admin
      .from('users')
      .update({ status: 'ACTIVE', mfa_required: true, mfa_enabled_at: new Date().toISOString(), email_verified_at: authData.user.email_confirmed_at ?? new Date().toISOString(), last_login_at: new Date().toISOString() })
      .eq('id', authData.user.id)
    if (updateError) throw updateError

    return NextResponse.json({ activated: true })
  } catch {
    return NextResponse.json({ error: 'Activation administrative impossible.' }, { status: 500 })
  }
}
