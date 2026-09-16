// GET /api/driver/wallet/balance — Solde wallet + entrées + historique payouts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ ok:false, error:'Non authentifié' }, { status:401 })

  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  const svcKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? anonKey

  const sb    = createClient(url, anonKey, { auth:{ autoRefreshToken:false, persistSession:false } })
  const sbSvc = createClient(url, svcKey,  { auth:{ autoRefreshToken:false, persistSession:false } })

  const { data:{ user } } = await sb.auth.getUser(token)
  if (!user) return NextResponse.json({ ok:false, error:'Token invalide' }, { status:401 })

  const { data:profile } = await sbSvc.from('driver_profiles').select('id').eq('user_id', user.id).single()
  if (!profile) return NextResponse.json({ ok:false, error:'Profil introuvable' }, { status:404 })

  const driverId = profile.id

  // Wallet account
  const { data:wallet } = await sbSvc.from('wallet_accounts').select('id,currency,jurisdiction,is_active,created_at').eq('driver_id', driverId).single()

  if (!wallet) return NextResponse.json({ ok:true, hasWallet:false, balance:0, entries:[], payouts:[], bankInfo:null })

  // Balance = SUM(CREDIT) - SUM(DEBIT) depuis les wallet_entries
  const { data:entries } = await sbSvc.from('wallet_entries')
    .select('id,entry_type,direction,amount,description,created_at,is_settled')
    .eq('driver_id', driverId)
    .order('created_at', { ascending:false })
    .limit(30)

  const { data:allEntries } = await sbSvc.from('wallet_entries')
    .select('direction,amount')
    .eq('driver_id', driverId)

  const balance = (allEntries ?? []).reduce((sum, e) => {
    const amt = parseFloat(e.amount ?? '0')
    return e.direction === 'CREDIT' ? sum + amt : sum - amt
  }, 0)

  // Revenus en attente (derniers 30 jours revenue_ledger non encore dans wallet)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  const { data:ledger } = await sbSvc.from('revenue_ledger')
    .select('gross_amount,tip_amount,fee_amount,source_type,activity_date')
    .eq('driver_id', driverId)
    .gte('activity_date', thirtyDaysAgo!)
    .order('activity_date', { ascending:false })
    .limit(50)

  const pendingAmount = (ledger ?? []).reduce((s,e) => s + parseFloat(e.gross_amount??'0'), 0)

  // Historique payouts
  const { data:payouts } = await sbSvc.from('payouts')
    .select('id,public_payout_id,payout_method,status,requested_amount,processed_amount,requested_at,completed_at,failure_code')
    .eq('driver_id', driverId)
    .order('requested_at', { ascending:false })
    .limit(10)

  // Coordonnées bancaires (driver_bank_preferences si table existe, sinon on retourne null)
  let bankInfo = null
  try {
    const { data:bank } = await sbSvc.from('driver_bank_preferences')
      .select('id,method,interac_email_masked,institution_name,transit_masked,account_masked,is_verified,created_at')
      .eq('driver_id', driverId)
      .single()
    bankInfo = bank
  } catch { /* table n'existe pas encore */ }

  return NextResponse.json({
    ok: true,
    hasWallet: true,
    walletId: wallet.id,
    balance: Math.max(0, Math.round(balance * 100) / 100),
    pendingAmount: Math.round(pendingAmount * 100) / 100,
    currency: wallet.currency,
    jurisdiction: wallet.jurisdiction,
    entries: entries ?? [],
    payouts: payouts ?? [],
    bankInfo,
    recentActivity: (ledger ?? []).slice(0, 8),
  })
}
