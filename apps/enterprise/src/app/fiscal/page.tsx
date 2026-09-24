'use client'
import React, { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useAuth } from '@/lib/auth/AuthProvider'
import { PILOT } from '@/lib/data'

type FiscalData = {
  taxRecords: unknown[]
  summary: { period:string; grossRevenue:number; tpsCollected:number; tvqCollected:number; totalDue:number; status:string; note:string }
  source:string
}

const m2 = (n:number) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(n)

export default function FiscalPage() {
  const { user } = useAuth()
  const [data, setData]       = useState<FiscalData|null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/fiscal')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (!user) return null
  const s = data?.summary

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-4 space-y-4 max-w-5xl mx-auto">
        <div>
          <h1 className="text-lg font-black text-slate-800 dark:text-white">Données fiscales</h1>
          <p className="text-xs text-slate-400">
            {data?.source==='SUPABASE'?'✅ Données Supabase':'⚠️ Mode DEMO'} · {PILOT}
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-2 text-xs font-bold text-red-700 dark:text-red-400">
          ⚠️ NON TRANSMIS À REVENU QUÉBEC · {s?.note ?? 'DONNÉES SYNTHÉTIQUES'} · {PILOT}
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Chargement depuis Supabase...</div>
        ) : s ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {l:'Revenu taxable', v:m2(s.grossRevenue), c:'#003DA5'},
                {l:'TPS (5%)',        v:m2(s.tpsCollected), c:'#059669'},
                {l:'TVQ (9,975%)',    v:m2(s.tvqCollected), c:'#059669'},
                {l:'Total dû',        v:m2(s.totalDue),    c:'#DC2626'},
              ].map(k=>(
                <div key={k.l} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-center border border-slate-100 dark:border-slate-700">
                  <div className="text-xl font-black" style={{color:k.c}}>{k.v}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{k.l}</div>
                  <div className="text-xs font-bold text-amber-500 mt-1">DEMO</div>
                </div>
              ))}
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
              <div className="text-sm font-black text-slate-700 dark:text-white mb-1">Période : {s.period}</div>
              <div className="text-xs text-slate-500">Statut déclaration : {s.status}</div>
              <div className="text-xs text-slate-400 mt-1">{s.note}</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">Données indisponibles</div>
        )}
      </div>
    </AppShell>
  )
}
