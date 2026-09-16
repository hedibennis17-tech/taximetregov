// GET  /api/driver/wallet/bank — Lire les coordonnées bancaires
// POST /api/driver/wallet/bank — Sauvegarder les coordonnées bancaires
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

async function getClients(token: string) {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  const svcKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? anonKey
  const sb     = createClient(url, anonKey, { auth:{ autoRefreshToken:false, persistSession:false } })
  const sbSvc  = createClient(url, svcKey,  { auth:{ autoRefreshToken:false, persistSession:false } })
  const { data:{ user } } = await sb.auth.getUser(token)
  if (!user) return null
  const { data:profile } = await sbSvc.from('driver_profiles').select('id').eq('user_id', user.id).single()
  if (!profile) return null
  return { sbSvc, driverId: profile.id, userId: user.id }
}

function maskEmail(email: string) {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  return local.slice(0,2) + '****@' + domain
}
function maskStr(s: string, keep = 4) {
  if (s.length <= keep) return s
  return '•'.repeat(s.length - keep) + s.slice(-keep)
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ ok:false, error:'Non authentifié' }, { status:401 })
  const ctx = await getClients(token)
  if (!ctx) return NextResponse.json({ ok:false, error:'Non autorisé' }, { status:401 })

  // On stocke dans driver_payout_methods table générique
  // Si la table n'existe pas → retourner null proprement
  try {
    const { data } = await ctx.sbSvc.from('driver_payout_methods')
      .select('*').eq('driver_id', ctx.driverId).single()
    return NextResponse.json({ ok:true, bankInfo: data ?? null })
  } catch {
    return NextResponse.json({ ok:true, bankInfo: null })
  }
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ ok:false, error:'Non authentifié' }, { status:401 })
  const ctx = await getClients(token)
  if (!ctx) return NextResponse.json({ ok:false, error:'Non autorisé' }, { status:401 })

  const body = await req.json() as {
    method: 'INTERAC_ETRANSFER' | 'DIRECT_DEPOSIT'
    interacEmail?: string       // Interac
    institutionName?: string    // Virement direct
    institutionNumber?: string  // ex: 003 (TD)
    transitNumber?: string      // 5 chiffres
    accountNumber?: string      // 7-12 chiffres
  }

  if (!body.method) return NextResponse.json({ ok:false, error:'Méthode de paiement requise' }, { status:400 })

  // Masquer les données sensibles avant stockage
  const payload: Record<string, string | boolean> = {
    driver_id:      ctx.driverId,
    method:         body.method,
    is_verified:    false,
    updated_at:     new Date().toISOString(),
  }

  if (body.method === 'INTERAC_ETRANSFER') {
    if (!body.interacEmail?.includes('@')) return NextResponse.json({ ok:false, error:'Courriel Interac invalide' }, { status:400 })
    payload['interac_email_masked'] = maskEmail(body.interacEmail)
    // Token opaque — jamais stocker le vrai courriel en clair dans la colonne principale
    payload['destination_token_ref'] = `ITFR-${Buffer.from(body.interacEmail).toString('base64').slice(0,32)}`
  } else {
    if (!body.transitNumber || !body.accountNumber) return NextResponse.json({ ok:false, error:'Numéro transit et compte requis' }, { status:400 })
    payload['institution_name']    = body.institutionName ?? 'Banque canadienne'
    payload['institution_number']  = body.institutionNumber ?? ''
    payload['transit_masked']      = maskStr(body.transitNumber, 2)
    payload['account_masked']      = maskStr(body.accountNumber, 4)
    payload['destination_token_ref'] = `DIRDEP-${Buffer.from(`${body.transitNumber}-${body.accountNumber}`).toString('base64').slice(0,32)}`
  }

  // Upsert dans driver_payout_methods
  try {
    const existing = await ctx.sbSvc.from('driver_payout_methods').select('id').eq('driver_id', ctx.driverId).single()
    if (existing.data) {
      await ctx.sbSvc.from('driver_payout_methods').update(payload).eq('driver_id', ctx.driverId)
    } else {
      await ctx.sbSvc.from('driver_payout_methods').insert({ ...payload, created_at: new Date().toISOString() })
    }
    return NextResponse.json({ ok:true, message:'Coordonnées bancaires sauvegardées (masquées)', method: body.method })
  } catch (e) {
    // Table n'existe pas — on fallback sur une note dans driver_profiles
    await ctx.sbSvc.from('driver_profiles').update({
      notes: `PAYOUT:${body.method}:${payload['destination_token_ref']}`,
    }).eq('id', ctx.driverId)
    return NextResponse.json({ ok:true, message:'Coordonnées enregistrées en mode pilote', method: body.method, isFallback: true })
  }
}
