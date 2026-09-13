'use client'
// ================================================================
// TAXIMETER.GOV — FISCALITÉ & DÉCLARATIONS
// Source unique: tax_calculations + tax_filings + tax_periods + revenue_ledger
// Architecture: Activité → Transaction → Revenue Ledger → Fiscal Engine → Déclaration → RQ
// ================================================================

import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { useDriverProfile, money } from '@/lib/api'
import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, AlertTriangle, CheckCircle, Clock, ExternalLink, Shield } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

interface TaxData {
  hasAccount: boolean
  taxAccount: Record<string,string> | null
  currentPeriod: Record<string,string> | null
  allPeriods: Array<Record<string,string>>
  fiscal: {
    gross_revenue_taxable: number; tps_collected: number; tps_credits: number; tps_balance: number
    tvq_collected: number; tvq_credits: number; tvq_balance: number; solde_total: number
    is_estimate: boolean; calculation_status: string; tps_rate: string; tvq_rate: string
  }
  currentFiling: Record<string,string> | null
  allFilings: Array<Record<string,string>>
  ruleSet: Record<string,string>
  avertissement: string
  mode_pilote: boolean
  revenu_quebec_url: string
}

const TABS = [
  { key:'dashboard',   label:'Tableau de bord', emoji:'📊' },
  { key:'calculator',  label:'Calculateur',     emoji:'🧮' },
  { key:'declaration', label:'Déclaration',      emoji:'📋' },
  { key:'pay',         label:'Paiement',         emoji:'💳' },
  { key:'history',     label:'Historique',       emoji:'📜' },
  { key:'obligations', label:'Obligations',      emoji:'⏱️' },
]

const FILING_STATUS: Record<string, { label:string; color:string; bg:string; icon:string }> = {
  DRAFT:    { label:'Brouillon',         color:'text-slate-400', bg:'bg-slate-800',         icon:'✏️' },
  PREPARED: { label:'Préparée',          color:'text-blue-400',  bg:'bg-blue-500/10',        icon:'📋' },
  SUBMITTED:{ label:'Soumise',           color:'text-purple-400',bg:'bg-purple-500/10',      icon:'📤' },
  ACCEPTED: { label:'Acceptée ✓',        color:'text-green-400', bg:'bg-green-500/10',       icon:'✅' },
  REJECTED: { label:'Rejetée',           color:'text-red-400',   bg:'bg-red-500/10',         icon:'❌' },
  AMENDED:  { label:'Modifiée',          color:'text-amber-400', bg:'bg-amber-500/10',       icon:'🔄' },
}

const PERIOD_STATUS: Record<string, { label:string; color:string }> = {
  OPEN:          { label:'Ouverte',       color:'text-blue-400' },
  FILED:         { label:'Déclarée',      color:'text-green-400' },
  ACCEPTED:      { label:'Acceptée',      color:'text-green-400' },
  CLOSED:        { label:'Fermée',        color:'text-slate-400' },
  READY_TO_FILE: { label:'Prête',         color:'text-purple-400' },
}

export default function TaxPage() {
  const { profile } = useDriverProfile()
  const [tab, setTab] = useState('dashboard')
  const [data, setData] = useState<TaxData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const sb = getSupabaseBrowserClient()
      const { data: { session } } = await sb.auth.getSession()
      if (!session?.access_token) throw new Error('Non authentifié')
      const res = await fetch('/api/tax', { headers: { Authorization: `Bearer ${session.access_token}` } })
      const json = await res.json() as { success: boolean; data: TaxData; error?: string }
      if (!json.success) throw new Error(json.error)
      setData(json.data)
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const f = data?.fiscal
  const period = data?.currentPeriod
  const filing = data?.currentFiling
  const daysUntil = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
  const urgent = period ? daysUntil(period['filing_due_date'] ?? '') < 30 : false

  const filingStatus = FILING_STATUS[filing?.['filing_status'] ?? 'DRAFT'] ?? FILING_STATUS['DRAFT']!

  return (
    <AppShell>
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Fiscalité & Déclarations</h1>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {period ? `${period['period_start']} → ${period['period_end']}` : 'Aucune période active'} · TPS/TVQ · Québec
            </p>
          </div>
          <button onClick={() => void load()} className="p-2 rounded-xl bg-slate-800 border border-slate-700">
            <RefreshCw size={14} className={loading ? 'animate-spin text-qc-blue' : 'text-slate-400'} />
          </button>
        </div>
        {/* Pipeline */}
        <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-1">
          {['Activité','Transaction','Revenue Ledger','Fiscal Engine','Déclaration','Revenu QC'].map((s, i, arr) => (
            <span key={s} className="flex items-center gap-1 flex-shrink-0">
              <span className={`text-[8px] px-1.5 py-0.5 rounded font-semibold ${i === arr.length-1 ? 'bg-qc-blue/20 text-qc-blue' : 'bg-slate-800 text-slate-400'}`}>{s}</span>
              {i < arr.length-1 && <span className="text-slate-700 text-[8px]">→</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 py-2 overflow-x-auto border-b border-slate-800">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${tab === t.key ? 'bg-qc-blue text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <span>{t.emoji}</span>{t.label}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 space-y-4 pb-8">
        {loading && <div className="py-16 text-center"><RefreshCw className="mx-auto animate-spin text-qc-blue" size={24} /><p className="text-xs text-slate-400 mt-2">Moteur fiscal en cours…</p></div>}
        {error && <Card className="p-4 text-center border-red-500/30"><p className="text-sm text-red-400 mb-3">{error}</p><button onClick={() => void load()} className="px-4 py-2 rounded-xl bg-qc-blue text-white text-xs">Réessayer</button></Card>}

        {data && !loading && (
          <>
            {/* Avertissement permanent */}
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle size={12} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="text-[9px] text-amber-400">{data.avertissement}</p>
              {data.mode_pilote && <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold shrink-0">PILOTE</span>}
            </div>

            {!data.hasAccount && (
              <Card className="p-6 text-center">
                <Shield size={28} className="mx-auto text-slate-600 mb-3" />
                <p className="text-sm text-white font-bold mb-1">Aucun compte fiscal configuré</p>
                <p className="text-xs text-slate-400">Lancez le seed fiscal pour initialiser les données.</p>
              </Card>
            )}

            {data.hasAccount && (
              <>
                {/* ══ TABLEAU DE BORD ══════════════════════════════ */}
                {tab === 'dashboard' && (
                  <>
                    {/* Solde principal */}
                    <Card className={`p-5 text-center ${f && f.solde_total > 0 ? 'border-amber-500/30 bg-amber-500/5' : 'border-green-500/30 bg-green-500/5'}`}>
                      <div className="text-[9px] text-slate-400 tracking-widest uppercase mb-1">
                        Solde {f?.is_estimate ? 'estimé' : 'calculé'} · {period ? `Q${Math.ceil(new Date(period['period_start']!).getMonth()/3)} ${new Date(period['period_start']!).getFullYear()}` : '—'}
                      </div>
                      <div className={`text-5xl font-black mb-1 ${f && f.solde_total > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                        {money(f?.solde_total ?? 0)}
                      </div>
                      <div className="text-[10px] text-slate-400">TPS {money(f?.tps_balance ?? 0)} · TVQ {money(f?.tvq_balance ?? 0)}</div>
                      {period && <div className={`mt-2 text-[10px] font-bold ${urgent ? 'text-red-400' : 'text-slate-400'}`}>
                        {urgent ? '🔴' : '📅'} Échéance: {period['filing_due_date']} ({daysUntil(period['filing_due_date']!)}j)
                      </div>}
                      <div className="mt-2 text-[9px] text-slate-500">Source: {f?.is_estimate ? 'Revenue Ledger → estimation' : 'tax_calculations (v' + data.currentPeriod?.['period_start'] + ')'}</div>
                    </Card>

                    {/* Compte fiscal */}
                    <Card className="p-4">
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Mon dossier fiscal</div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-2xl bg-qc-blue/20 flex items-center justify-center text-xl">🏛️</div>
                        <div>
                          <div className="font-bold text-white">{profile?.first_name} {profile?.last_name}</div>
                          <div className="text-[10px] text-green-400">TPS: {data.taxAccount?.['tps_status']} · TVQ: {data.taxAccount?.['tvq_status']}</div>
                          <div className="text-[9px] text-slate-500">Déclaration {data.taxAccount?.['filing_frequency']?.toLowerCase()}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label:'No. TPS', val: data.taxAccount?.['tps_registration_masked'] ?? '—' },
                          { label:'No. TVQ', val: data.taxAccount?.['tvq_registration_masked'] ?? '—' },
                          { label:'Statut',  val: data.taxAccount?.['tax_account_status'] ?? '—' },
                          { label:'Règle',   val: `${data.ruleSet?.['version'] ?? '—'} (${data.ruleSet?.['tps_rate'] ? (parseFloat(data.ruleSet['tps_rate'])*100).toFixed(0)+'%' : '—'} / ${data.ruleSet?.['tvq_rate'] ? (parseFloat(data.ruleSet['tvq_rate'])*100).toFixed(3)+'%' : '—'})` },
                        ].map(r => (
                          <div key={r.label} className="bg-slate-800/50 rounded-xl p-2.5">
                            <div className="text-[9px] text-slate-400">{r.label}</div>
                            <div className="text-xs font-bold text-white mt-0.5">{r.val}</div>
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* Statut déclaration courante */}
                    <Card className={`p-4 border ${filingStatus.bg}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[9px] text-slate-500 uppercase tracking-wider">Déclaration courante</div>
                          <div className={`text-sm font-bold mt-0.5 ${filingStatus.color}`}>{filingStatus.icon} {filingStatus.label}</div>
                          {filing?.['government_reference'] && <div className="text-[9px] text-slate-400 mt-1 font-mono">{filing['government_reference']}</div>}
                        </div>
                        <button onClick={() => setTab('declaration')} className="text-[10px] text-qc-blue hover:underline">Voir →</button>
                      </div>
                    </Card>

                    {/* Revenus par source */}
                    <Card className="p-4">
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Revenus imposables</div>
                      {[
                        { label:'Taxi',       val: parseFloat(period?.['gross_revenue_taxi'] ?? '0'),      icon:'🚕' },
                        { label:'Rideshare',  val: parseFloat(period?.['gross_revenue_rideshare'] ?? '0'), icon:'🚗' },
                        { label:'Livraison',  val: parseFloat(period?.['gross_revenue_delivery'] ?? '0'),  icon:'📦' },
                        { label:'Autres',     val: parseFloat(period?.['gross_revenue_other'] ?? '0'),     icon:'💼' },
                      ].filter(r => r.val > 0).map(r => (
                        <div key={r.label} className="flex items-center gap-2 py-1.5 border-b border-slate-800 last:border-0">
                          <span>{r.icon}</span>
                          <span className="flex-1 text-sm text-white">{r.label}</span>
                          <span className="font-bold text-green-400">{money(r.val)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 font-bold">
                        <span className="text-sm text-white">Total brut</span>
                        <span className="text-lg text-white">{money(f?.gross_revenue_taxable ?? 0)}</span>
                      </div>
                    </Card>
                  </>
                )}

                {/* ══ CALCULATEUR ══════════════════════════════════ */}
                {tab === 'calculator' && (
                  <Card className="p-4">
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                      Calculateur fiscal · Source: {f?.is_estimate ? 'Revenue Ledger' : 'tax_calculations'}
                    </div>
                    <div className="bg-slate-800/50 rounded-2xl p-4 font-mono text-xs space-y-2">
                      <div className="text-[10px] text-qc-blue font-bold mb-2">MOTEUR FISCAL TAXIMETER.GOV · {f?.is_estimate ? 'ESTIMATION' : f?.calculation_status}</div>
                      {[
                        { label:'Revenus bruts imposables',   val: money(f?.gross_revenue_taxable ?? 0),                            color:'text-white' },
                        { label:`TPS perçue (${f?.tps_rate})`, val: money(f?.tps_collected ?? 0),                                   color:'text-purple-400' },
                        { label:`TVQ perçue (${f?.tvq_rate})`, val: money(f?.tvq_collected ?? 0),                                   color:'text-purple-400' },
                        { label:'Crédits TPS (CTI)',           val: `− ${money(f?.tps_credits ?? 0)}`,                             color:'text-green-400', sep:true },
                        { label:'Crédits TVQ',                 val: `− ${money(f?.tvq_credits ?? 0)}`,                             color:'text-green-400' },
                        { label:'TPS nette à remettre',        val: money(f?.tps_balance ?? 0),                                     color:'text-amber-400', sep:true },
                        { label:'TVQ nette à remettre',        val: money(f?.tvq_balance ?? 0),                                     color:'text-amber-400' },
                      ].map(r => (
                        <div key={r.label} className={`flex justify-between py-1 ${r['sep'] ? 'border-t border-slate-700 mt-1 pt-2' : ''}`}>
                          <span className="text-slate-400">{r.label}</span>
                          <span className={`font-bold ${r.color}`}>{r.val}</span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-3 border-t border-slate-600 text-sm font-bold">
                        <span className="text-white">TOTAL ESTIMÉ À REMETTRE</span>
                        <span className="text-amber-400">{money(f?.solde_total ?? 0)}</span>
                      </div>
                    </div>
                    <div className="mt-3 p-2 rounded-lg bg-slate-900 border border-slate-700">
                      <p className="text-[9px] text-slate-500">
                        Règle fiscale: {data.ruleSet?.['label'] ?? '—'} · Version: {data.ruleSet?.['version'] ?? '—'}<br/>
                        CTI = Crédits de taxe sur intrants estimés. Consultez un comptable pour le calcul exact.
                      </p>
                    </div>
                  </Card>
                )}

                {/* ══ DÉCLARATION ══════════════════════════════════ */}
                {tab === 'declaration' && (
                  <>
                    <Card className="p-4">
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Déclaration préremplie</div>

                      {/* Période */}
                      {period && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 mb-4">
                          <div className="text-2xl">📅</div>
                          <div>
                            <div className="text-xs font-bold text-white">Période: {period['period_start']} → {period['period_end']}</div>
                            <div className={`text-[10px] ${PERIOD_STATUS[period['period_status'] as string]?.color ?? 'text-slate-400'}`}>
                              {PERIOD_STATUS[period['period_status'] as string]?.label ?? period['period_status']}
                            </div>
                          </div>
                          <div className="ml-auto text-right">
                            <div className="text-[9px] text-slate-500">Échéance</div>
                            <div className={`text-xs font-bold ${urgent ? 'text-red-400' : 'text-white'}`}>{period['filing_due_date']}</div>
                          </div>
                        </div>
                      )}

                      {/* Déclaration */}
                      <div className="bg-slate-800/50 rounded-2xl p-4 font-mono text-xs mb-4">
                        <div className="text-[10px] text-qc-blue font-bold mb-3">DÉCLARATION TPS/TVQ · SIMULATION · MODE PILOTE</div>
                        {[
                          { label:'Revenus bruts (case 101)', val: money(f?.gross_revenue_taxable ?? 0) },
                          { label:'TPS perçue (ligne 103)',    val: money(f?.tps_collected ?? 0) },
                          { label:'TVQ perçue (ligne 205)',    val: money(f?.tvq_collected ?? 0) },
                          { label:'CTI TPS (ligne 106)',       val: money(f?.tps_credits ?? 0) },
                          { label:'CTI TVQ (ligne 206)',       val: money(f?.tvq_credits ?? 0) },
                          { label:'TPS nette (ligne 109)',     val: money(f?.tps_balance ?? 0) },
                          { label:'TVQ nette (ligne 210)',     val: money(f?.tvq_balance ?? 0) },
                        ].map(r => (
                          <div key={r.label} className="flex justify-between py-1 border-b border-slate-700 last:border-0">
                            <span className="text-slate-400">{r.label}</span>
                            <span className="text-white font-bold">{r.val}</span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-3 text-sm font-bold">
                          <span className="text-amber-400">MONTANT ESTIMÉ À REMETTRE</span>
                          <span className="text-amber-400">{money(f?.solde_total ?? 0)}</span>
                        </div>
                      </div>

                      {/* Workflow */}
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Workflow déclaration</div>
                      <div className="space-y-1.5 mb-4">
                        {[
                          { label:'BROUILLON',          done: true  },
                          { label:'PRÉPARATION',         done: true  },
                          { label:'VÉRIFICATION',        done: filing?.['filing_status'] === 'PREPARED' || filing?.['filing_status'] === 'SUBMITTED' || filing?.['filing_status'] === 'ACCEPTED' },
                          { label:'PRÊTE À SOUMETTRE',   done: filing?.['filing_status'] === 'SUBMITTED' || filing?.['filing_status'] === 'ACCEPTED' },
                          { label:'TRANSMISSION (RQ)',   done: filing?.['filing_status'] === 'ACCEPTED' },
                          { label:'CONFIRMATION',        done: filing?.['filing_status'] === 'ACCEPTED' },
                        ].map((s, i) => (
                          <div key={s.label} className="flex items-center gap-2.5">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${s.done ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-500'}`}>
                              {s.done ? '✓' : i+1}
                            </div>
                            <span className={`text-xs ${s.done ? 'text-green-400' : 'text-slate-400'}`}>{s.label}</span>
                          </div>
                        ))}
                      </div>

                      <a href={data.revenu_quebec_url} target="_blank" rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-qc-blue text-white font-bold text-sm">
                        <ExternalLink size={16} />
                        Accéder à mon dossier Revenu Québec
                      </a>
                      <p className="text-[9px] text-slate-500 text-center mt-2">TAXIMETER.GOV ne demande jamais vos identifiants Revenu Québec · MODE 1: Redirection officielle</p>
                    </Card>
                  </>
                )}

                {/* ══ PAIEMENT ════════════════════════════════════ */}
                {tab === 'pay' && (
                  <>
                    <Card className={`p-5 text-center ${urgent ? 'border-red-500/30 bg-red-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
                      <div className="text-[9px] text-slate-400 tracking-widest uppercase mb-1">Montant {f?.is_estimate ? 'estimé' : 'calculé'} à payer</div>
                      <div className={`text-5xl font-black mb-2 ${urgent ? 'text-red-400' : 'text-amber-400'}`}>{money(f?.solde_total ?? 0)}</div>
                      <div className="text-xs text-slate-400">TPS {money(f?.tps_balance ?? 0)} · TVQ {money(f?.tvq_balance ?? 0)}</div>
                      {period && <div className={`mt-2 text-[10px] font-bold ${urgent ? 'text-red-400' : 'text-slate-400'}`}>
                        Échéance: {period['filing_due_date']} · {daysUntil(period['filing_due_date']!)} jours
                      </div>}
                    </Card>

                    {/* Workflow paiement */}
                    <Card className="p-4">
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Workflow paiement</div>
                      {['Paiement initié','Paiement confirmé','Rapprochement','Ledger fiscal','Historique'].map((s, i) => (
                        <div key={s} className="flex items-center gap-2.5 py-1.5 border-b border-slate-800 last:border-0">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${i === 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>{i+1}</div>
                          <span className={`text-xs ${i === 0 ? 'text-amber-400' : 'text-slate-400'}`}>{s}</span>
                        </div>
                      ))}
                    </Card>

                    <a href={data.revenu_quebec_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 rounded-2xl bg-qc-blue text-white font-bold">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🏛️</span>
                        <div className="text-left"><div>Payer sur Revenu Québec</div><div className="text-[10px] text-blue-200">Mon dossier · Paiement officiel</div></div>
                      </div>
                      <ExternalLink size={18} />
                    </a>
                    <p className="text-[9px] text-slate-500 text-center">Aucune confirmation de paiement ne sera fabriquée · Mode pilote</p>
                  </>
                )}

                {/* ══ HISTORIQUE ══════════════════════════════════ */}
                {tab === 'history' && (
                  <>
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Toutes mes déclarations</div>
                    {data.allFilings.length === 0 ? (
                      <Card className="p-6 text-center"><p className="text-sm text-slate-400">Aucune déclaration encore.</p></Card>
                    ) : data.allFilings.map(f2 => {
                      const st = FILING_STATUS[f2['filing_status'] ?? 'DRAFT'] ?? FILING_STATUS['DRAFT']!
                      const p2 = data.allPeriods.find(p3 => p3['id'] === f2['tax_period_id'])
                      return (
                        <Card key={f2['id']} className={`p-4 border ${st.bg}`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <div className={`text-sm font-bold ${st.color}`}>{st.icon} {st.label}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{p2 ? `${p2['period_start']} → ${p2['period_end']}` : '—'}</div>
                              {f2['government_reference'] && <div className="text-[9px] text-slate-500 font-mono mt-1">{f2['government_reference']}</div>}
                              {f2['accepted_at'] && <div className="text-[9px] text-green-400 mt-1">Acceptée: {new Date(f2['accepted_at']).toLocaleDateString('fr-CA')}</div>}
                            </div>
                            <div className="text-[9px] text-slate-500">{f2['filing_type']}</div>
                          </div>
                        </Card>
                      )
                    })}

                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2">Toutes les périodes</div>
                    {data.allPeriods.map(p3 => {
                      const ps = PERIOD_STATUS[p3['period_status'] as string] ?? { label: p3['period_status'], color:'text-slate-400' }
                      return (
                        <Card key={p3['id']} className="p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-xs font-semibold text-white">{p3['period_start']} → {p3['period_end']}</div>
                              <div className={`text-[10px] ${ps.color}`}>{ps.label}</div>
                            </div>
                            <div className="text-right text-[10px] text-slate-400">
                              <div>Taxi: {money(parseFloat(p3['gross_revenue_taxi'] ?? '0'))}</div>
                              <div>Échéance: {p3['filing_due_date']}</div>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </>
                )}

                {/* ══ OBLIGATIONS ═════════════════════════════════ */}
                {tab === 'obligations' && (
                  <>
                    <Card className="p-4">
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Centre des obligations fiscales</div>
                      <div className="space-y-3">
                        {[
                          { label:'✅ Dossier fiscal configuré',           status:'DONE',    dot:'bg-green-400',   desc:'TPS/TVQ enregistrés' },
                          { label:'✅ Revenus calculés',                   status:'DONE',    dot:'bg-green-400',   desc:`${money(f?.gross_revenue_taxable ?? 0)} bruts imposables` },
                          { label:`${filing?.['filing_status'] === 'ACCEPTED' ? '✅' : '🟡'} Déclaration ${FILING_STATUS[filing?.['filing_status'] ?? 'DRAFT']?.label ?? 'en brouillon'}`, status:'CURRENT', dot:'bg-amber-400', desc:'Q3 2026' },
                          { label:`${urgent ? '🔴' : '🟡'} Déclaration à produire`,         status:'UPCOMING', dot: urgent ? 'bg-red-400 animate-pulse' : 'bg-amber-400', desc: period ? `Échéance ${period['filing_due_date']}` : '—' },
                          { label:'🔴 Paiement à effectuer',              status:'UPCOMING', dot:'bg-red-400',    desc:`${money(f?.solde_total ?? 0)} estimé` },
                          { label:'⚪ Confirmation reçue',                status:'FUTURE',   dot:'bg-slate-600',  desc:'Après transmission' },
                          { label:'⚪ Rapprochement',                     status:'FUTURE',   dot:'bg-slate-600',  desc:'Automatique' },
                        ].map((item, i, arr) => (
                          <div key={i} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full ${item.dot} shrink-0 mt-0.5`} />
                              {i < arr.length-1 && <div className="w-px flex-1 bg-slate-800 mt-1" />}
                            </div>
                            <div className="pb-3">
                              <div className="text-sm text-white">{item.label}</div>
                              <div className="text-[10px] text-slate-500">{item.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* Alertes */}
                    <Card className="p-4">
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Alertes fiscales actives</div>
                      <div className="space-y-2">
                        {urgent && (
                          <div className="flex gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                            <span className="text-xl">🔴</span>
                            <div><div className="text-xs font-bold text-red-400">Déclaration bientôt due</div><div className="text-[9px] text-red-300/70">{period?.['filing_due_date']} · {daysUntil(period?.['filing_due_date'] ?? '')}j restants</div></div>
                          </div>
                        )}
                        {(f?.solde_total ?? 0) > 0 && (
                          <div className="flex gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <span className="text-xl">🟡</span>
                            <div><div className="text-xs font-bold text-amber-400">Paiement à prévoir</div><div className="text-[9px] text-amber-300/70">{money(f?.solde_total ?? 0)} estimé · TPS + TVQ</div></div>
                          </div>
                        )}
                        <div className="flex gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                          <span className="text-xl">ℹ️</span>
                          <div><div className="text-xs font-bold text-blue-400">SEV 2e génération</div><div className="text-[9px] text-blue-300/70">Requis depuis le 1er janvier 2026 pour transport rémunéré</div></div>
                        </div>
                      </div>
                    </Card>

                    {/* Government Integration Layer — Futur */}
                    <Card className="p-4 border-slate-700">
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Government Integration Layer (futur)</div>
                      <div className="text-[9px] text-slate-500 space-y-1">
                        {['API sécurisée · OAuth gouvernemental', 'Webhooks · Synchronisation', 'Accusé de réception · Erreurs · Reprise', 'Journalisation · Audit complet'].map(s => (
                          <div key={s} className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-600" />{s}</div>
                        ))}
                        <div className="mt-2 text-amber-400 font-semibold">Aucune intégration réelle sans autorisation officielle Revenu Québec</div>
                      </div>
                    </Card>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
