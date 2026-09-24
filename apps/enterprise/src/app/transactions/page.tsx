'use client'
import React, { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useAuth } from '@/lib/auth/AuthProvider'
import { PILOT } from '@/lib/data'

type TX = {
  id:string; source_type:string; activity_type:string; entry_type:string
  gross_amount:string; fee_amount:string; tip_amount:string; tax_amount:string
  net_amount:string; currency:string; activity_date:string; is_settled:boolean
  driver_profiles?: { driver_number:string; first_name:string; last_name:string }
}

const m2 = (n:string|number) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(Number(n))
const SRC_COLOR: Record<string,string> = {
  TAXI:'bg-blue-100 text-blue-700', UBER:'bg-black text-white',
  DOORDASH:'bg-red-100 text-red-700', LYFT:'bg-pink-100 text-pink-700',
  INSTACART:'bg-green-100 text-green-700',
}

export default function TransactionsPage() {
  const { user } = useAuth()
  const [txs, setTxs]         = useState<TX[]>([])
  const [loading, setLoading] = useState(true)
  const [source, setSource]   = useState('')

  useEffect(() => {
    fetch('/api/transactions?limit=50')
      .then(r => r.json())
      .then(d => { setTxs(d.transactions ?? []); setSource(d.source ?? ''); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (!user) return null

  const gross = txs.reduce((s,t) => s + Number(t.gross_amount), 0)
  const tps   = Math.round(gross * 0.05 * 100) / 100
  const tvq   = Math.round(gross * 0.09975 * 100) / 100

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-4 space-y-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-slate-800 dark:text-white">Transactions</h1>
            <p className="text-xs text-slate-400">
              {source==='SUPABASE'?'✅ Données Supabase':'⚠️ Mode DEMO'} · {PILOT}
            </p>
          </div>
          <div className="text-sm text-slate-500 font-bold">{txs.length} transactions</div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-2 text-xs font-bold text-amber-700 dark:text-amber-400">
          ⚠️ {PILOT} · DONNÉES SYNTHÉTIQUES
        </div>

        {/* Totaux */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[{l:'Gross total',v:m2(gross),c:'#003DA5'},{l:'TPS estimée',v:m2(tps),c:'#059669'},{l:'TVQ estimée',v:m2(tvq),c:'#059669'},{l:'Total dû',v:m2(tps+tvq),c:'#DC2626'}].map(k=>(
            <div key={k.l} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-center border border-slate-100 dark:border-slate-700">
              <div className="text-lg font-black" style={{color:k.c}}>{k.v}</div>
              <div className="text-xs text-slate-400 mt-0.5">{k.l}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Chargement depuis Supabase...</div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 grid grid-cols-6 text-xs font-black text-slate-400 uppercase tracking-widest">
              <div className="col-span-2">Chauffeur · Source</div>
              <div>Gross</div><div>Pourboire</div><div>TPS+TVQ</div><div>Net</div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {txs.map((t, i) => {
                const drv = t.driver_profiles
                const taxes = Number(t.tax_amount)
                return (
                  <div key={t.id ?? i} className="px-4 py-3 grid grid-cols-6 items-center text-sm">
                    <div className="col-span-2">
                      <div className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                        {drv ? `${drv.first_name} ${drv.last_name}` : '—'}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-xs font-black px-1.5 py-0.5 rounded ${SRC_COLOR[t.source_type] ?? 'bg-slate-100 text-slate-500'}`}>{t.source_type}</span>
                        {t.is_settled && <span className="text-xs text-green-500 font-bold">✓</span>}
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{m2(t.gross_amount)}</div>
                    <div className="text-xs text-purple-600">{m2(t.tip_amount)}</div>
                    <div className="text-xs text-green-600">{m2(taxes)}</div>
                    <div className="text-xs font-bold text-blue-600">{m2(t.net_amount)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
