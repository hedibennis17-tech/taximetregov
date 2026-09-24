'use client'
import React, { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useAuth } from '@/lib/auth/AuthProvider'
import { PILOT } from '@/lib/data'

type RevenueData = {
  period:string; dateFrom:string; source:string; pilot:boolean; note:string
  totals: { gross:number; tips:number; fees:number; taxes:number; net:number; count:number; tps:number; tvq:number }
  bySource: Record<string,{gross:number;tips:number;net:number;count:number}>
}

const m2 = (n:number) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(n)

export default function RevenuePage() {
  const { user } = useAuth()
  const [data, setData]     = useState<RevenueData|null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/revenue?period=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period])

  if (!user) return null

  const t = data?.totals

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-4 space-y-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-slate-800 dark:text-white">Revenus</h1>
            <p className="text-xs text-slate-400">
              {data?.source==='SUPABASE'?'✅ Données Supabase':'⚠️ Mode DEMO'} · {PILOT}
            </p>
          </div>
          <div className="flex gap-2">
            {[{v:'month',l:'Mois'},{v:'q3',l:'Q3'},{v:'year',l:'Année'}].map(p=>(
              <button key={p.v} onClick={()=>setPeriod(p.v)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer"
                style={{background:period===p.v?'#003DA5':'white',color:period===p.v?'white':'#64748B',borderColor:period===p.v?'#003DA5':'#E2E8F0'}}>
                {p.l}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-2 text-xs font-bold text-amber-700 dark:text-amber-400">
          ⚠️ {PILOT} · {data?.note ?? 'DONNÉES SYNTHÉTIQUES'}
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Chargement depuis Supabase...</div>
        ) : t ? (
          <>
            {/* KPI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {l:'Revenu brut',  v:m2(t.gross), c:'#003DA5', bg:'bg-blue-50'},
                {l:'Pourboires',   v:m2(t.tips),  c:'#7C3AED', bg:'bg-purple-50'},
                {l:'TPS collectée',v:m2(t.tps),   c:'#059669', bg:'bg-green-50'},
                {l:'TVQ collectée',v:m2(t.tvq),   c:'#059669', bg:'bg-green-50'},
                {l:'Commissions',  v:m2(t.fees),  c:'#B45309', bg:'bg-amber-50'},
                {l:'Taxes brutes', v:m2(t.taxes), c:'#0891B2', bg:'bg-cyan-50'},
                {l:'Net chauffeurs',v:m2(t.net),  c:'#1D4ED8', bg:'bg-blue-50'},
                {l:'Activités',    v:String(t.count), c:'#64748B', bg:'bg-slate-50'},
              ].map(k=>(
                <div key={k.l} className={`${k.bg} dark:bg-opacity-10 rounded-2xl p-4 text-center border border-white shadow-sm`}>
                  <div className="text-lg font-black" style={{color:k.c}}>{k.v}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{k.l}</div>
                </div>
              ))}
            </div>

            {/* Par source */}
            {data?.bySource && Object.keys(data.bySource).length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
                <div className="text-sm font-black text-slate-700 dark:text-white mb-3">Par plateforme / source</div>
                <div className="space-y-2">
                  {Object.entries(data.bySource).map(([src, rev]) => (
                    <div key={src} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <div className="text-sm font-bold text-slate-600 dark:text-slate-400">{src}</div>
                      <div className="flex gap-4 text-xs">
                        <span className="text-slate-500">Gross: <strong className="text-slate-800 dark:text-slate-200">{m2(rev.gross)}</strong></span>
                        <span className="text-slate-500">Tips: <strong className="text-slate-800 dark:text-slate-200">{m2(rev.tips)}</strong></span>
                        <span className="text-slate-500">Net: <strong className="text-slate-800 dark:text-slate-200">{m2(rev.net)}</strong></span>
                        <span className="text-slate-400">{rev.count} activités</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-slate-400">Données indisponibles</div>
        )}
      </div>
    </AppShell>
  )
}
