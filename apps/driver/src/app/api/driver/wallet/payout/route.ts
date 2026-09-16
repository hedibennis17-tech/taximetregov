// POST /api/driver/wallet/payout — Demande de retrait
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ ok:false, error:'Non authentifié' }, { status:401 })

  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  const svcKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? anonKey
  const sb     = createClient(url, anonKey, { auth:{ autoRefreshToken:false, persistSession:false } })
  const sbSvc  = createClient(url, svcKey,  { auth:{ autoRefreshToken:false, persistSession:false } })

  const { data:{ user } } = await sb.auth.getUser(token)
  if (!user) return NextResponse.json({ ok:false, error:'Token invalide' }, { status:401 })

  const { data:profile } = await sbSvc.from('driver_profiles').select('id,first_name,last_name').eq('user_id', user.id).single()
  if (!profile) return NextResponse.json({ ok:false, error:'Profil introuvable' }, { status:404 })

  const body = await req.json() as { amount: number; method: string; note?: string }

  if (!body.amount || body.amount < 10) return NextResponse.json({ ok:false, error:'Montant minimum: 10,00 $' }, { status:400 })
  if (!body.method) return NextResponse.json({ ok:false, error:'Méthode de paiement requise' }, { status:400 })

  const { data:wallet } = await sbSvc.from('wallet_accounts').select('id').eq('driver_id', profile.id).single()
  if (!wallet) return NextResponse.json({ ok:false, error:'Wallet non trouvé' }, { status:404 })

  // Calculer le solde disponible
  const { data:entries } = await sbSvc.from('wallet_entries').select('direction,amount').eq('driver_id', profile.id)
  const balance = (entries ?? []).reduce((s,e) => e.direction==='CREDIT' ? s+parseFloat(e.amount??'0') : s-parseFloat(e.amount??'0'), 0)

  if (body.amount > balance && balance > 0) {
    return NextResponse.json({ ok:false, error:`Solde insuffisant. Disponible: ${balance.toFixed(2)} $` }, { status:400 })
  }

  // ID public unique
  const publicId = `OUT-${Date.now().toString(36).toUpperCase().slice(-6)}`
  const idempKey  = `PAYOUT-${profile.id}-${Date.now()}`

  const { data:payout, error:pe } = await sbSvc.from('payouts').insert({
    public_payout_id:    publicId,
    driver_id:           profile.id,
    wallet_account_id:   wallet.id,
    payout_method:       body.method,
    status:              'PENDING',
    requested_amount:    body.amount.toFixed(2),
    currency:            'CAD',
    idempotency_key:     idempKey,
    destination_token_ref: `PILOT-${body.method}`,
    requested_at:        new Date().toISOString(),
  }).select('id,public_payout_id,status').single()

  if (pe) return NextResponse.json({ ok:false, error: pe.message }, { status:500 })

  // Entrée DÉBIT dans le wallet (montant reservé)
  await sbSvc.from('wallet_entries').insert({
    wallet_account_id: wallet.id,
    driver_id:         profile.id,
    entry_type:        'PAYOUT',
    direction:         'DEBIT',
    amount:            body.amount.toFixed(2),
    currency:          'CAD',
    description:       `Demande de retrait ${body.method === 'INTERAC_ETRANSFER' ? 'Interac' : 'Virement bancaire'} — ${publicId}`,
    is_settled:        false,
  })

  // Notification
  await sbSvc.from('driver_notifications').insert({
    driver_id:         profile.id,
    notification_type: 'SYSTEM',
    title:             '💸 Demande de retrait soumise',
    body:              `Votre demande de ${body.amount.toFixed(2)} $ par ${body.method === 'INTERAC_ETRANSFER' ? 'Interac e-Transfert' : 'virement bancaire'} (${publicId}) a été reçue. Traitement sous 1-3 jours ouvrables.`,
    status:            'UNREAD',
    priority:          'NORMAL',
  })

  return NextResponse.json({
    ok: true,
    payout,
    publicId,
    message: `Retrait de ${body.amount.toFixed(2)} $ soumis — MODE PILOTE`,
    note: 'Aucun virement réel effectué en mode pilote',
  })
}
