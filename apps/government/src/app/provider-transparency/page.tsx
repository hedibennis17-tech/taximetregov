'use client'

// ================================================================
// TAXIMETER.GOV — MODULE 31 — PRTTR v1.0
// Provider Revenue Transparency & Transaction Reconciliation
// ONE TRANSACTION · ONE SOURCE OF TRUTH
// ================================================================

import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw, AlertTriangle, CheckCircle,
  TrendingUp, DollarSign, Users, Layers,
  Scale, FileText, ShieldAlert, ArrowRight,
  Activity, BarChart2, Zap, Eye, ArrowLeftRight,
} from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

// ─── Types ───────────────────────────────────────────────────

interface DashboardData {
  volume: {
    total_transactions: string; total_gross: string; total_tips: string
    total_fees: string; total_net: string; unique_drivers: string
    unique_providers: string; settled_amount: string; pending_amount: string
  }
  byProvider: Array<{ provider: string; transactions: string; gross: string; tips: string; fees: string; net: string; drivers: string; last_activity: string }>
  byService: Array<{ service_type: string; transactions: string; gross: string; tips: string; net: string }>
  reconciliation: { total_cases: string; resolved: string; open_cases: string; critical: string; high: string }
  exceptions: Array<{ id: string; case_type: string; severity: string; status: string; expected_amount: string; actual_amount: string; difference_amount: string; currency: string; created_at: string; public_driver_id: string | null; first_name: string | null; last_name: string | null; provider_name: string | null }>
  generatedAt: string
}

interface ReconcileResult {
  governmentTransactionId: string; provider: string; customerTotal: number
  sumComponents: number; delta: number; status: string
  breakdown: { driverEarnings: number; providerFees: number; tips: number; taxes: number; tolls: number; surcharges: number; discounts: number; refunds: number; adjustments: number }
  allocation: { driverPct: number; providerPct: number; taxPct: number; tipPct: number } | null
  principle: string; reconciledAt: string
}

interface ReconcileData {
  mode: string
  summary: { total: number; matched: number; variance: number; partial: number }
  results: ReconcileResult[]
}

// ─── Helpers ─────────────────────────────────────────────────

const money = (v: string | number) =>
  new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })
    .format(typeof v === 'string' ? parseFloat(v) || 0 : v)

const moneyFull = (v: string | number) =>
  new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' })
    .format(typeof v === 'string' ? parseFloat(v) || 0 : v)

const PROVIDER_ICON: Record<string, string> = {
  TAXI:'🚕', UBER:'⬛', LYFT:'🟣', DOORDASH:'🔴', INSTACART:'🟢', UBER_EATS:'🟡', SKIP:'🟠',
}

const STATUS_CONF: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  MATCHED:       { label: 'RÉCONCILIÉ',    color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30',  icon: '✅' },
  PARTIAL_MATCH: { label: 'PARTIEL',       color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/30',  icon: '⚠️' },
  VARIANCE:      { label: 'ÉCART',         color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30',      icon: '🔴' },
  MISSING_DATA:  { label: 'DONNÉES MANQUANTES', color: 'text-slate-400', bg: 'bg-slate-800 border-slate-700',   icon: '❓' },
}

const SEVERITY_CONF: Record<string, { color: string; bg: string }> = {
  CRITICAL: { color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30' },
  HIGH:     { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
  MEDIUM:   { color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/30' },
  LOW:      { color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30' },
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const { data } = await getSupabaseBrowserClient().auth.getSession()
  const token = data.session?.access_token
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts?.headers },
  })
  const json = await res.json() as { success: boolean; data: T; error?: string }
  if (!res.ok || !json.success) throw new Error(json.error ?? `Erreur ${res.status}`)
  return json.data
}

// ─── SUB-NAV ──────────────────────────────────────────────────

const SubNav = ({ active }: { active: string }) => (
  <div className="flex gap-2 mt-4 flex-wrap">
    {[
      { href: '/provider-transparency',                label: 'Vue globale',    icon: BarChart2   },
      { href: '/provider-transparency/transactions',   label: 'Transactions',   icon: Layers      },
      { href: '/provider-transparency/reconciliation', label: 'Réconciliation', icon: Scale       },
      { href: '/provider-transparency/exceptions',     label: 'Exceptions',     icon: ShieldAlert },
    ].map(item => (
      <Link key={item.href} href={item.href}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
          ${active === item.href ? 'bg-qc-blue text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
        <item.icon size={12} />{item.label}
      </Link>
    ))}
  </div>
)

// ─── RECONCILIATION ENGINE UI ─────────────────────────────────

const ReconciliationEngine = () => {
  const [data, setData]     = useState<ReconcileData | null>(null)
  const [loading, setLoading] = useState(false)

  async function runDemo() {
    setLoading(true)
    try {
      const d = await apiFetch<ReconcileData>('/api/provider-transparency/reconcile', {
        method: 'POST',
        body: JSON.stringify({ mode: 'DEMO' }),
      })
      setData(d)
    } catch { /* silencieux */ }
    finally { setLoading(false) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ArrowLeftRight size={14} className="text-qc-blue" />
          <span className="text-sm font-bold text-white">Moteur de réconciliation mathématique</span>
          <span className="text-[9px] px-2 py-0.5 rounded bg-qc-blue/20 text-qc-blue font-bold">LIVE ENGINE</span>
        </div>
        <button onClick={runDemo} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-qc-blue text-white text-xs font-semibold disabled:opacity-50">
          {loading ? <RefreshCw size={11} className="animate-spin" /> : <Zap size={11} />}
          {loading ? 'Calcul…' : 'Lancer démo'}
        </button>
      </div>

      {!data && (
        <Card className="p-6 text-center border-dashed border-slate-700">
          <ArrowLeftRight size={24} className="mx-auto text-slate-600 mb-3" />
          <p className="text-xs text-slate-400 mb-2">
            Vérification mathématique de chaque transaction :
          </p>
          <p className="text-[10px] text-slate-500 font-mono">
            CLIENT = CHAUFFEUR + FOURNISSEUR + TAXES + POURBOIRES + PÉAGES ± AJUSTEMENTS
          </p>
          <p className="text-[9px] text-slate-600 mt-3 italic">
            Cliquer "Lancer démo" pour voir 3 exemples de réconciliation
          </p>
        </Card>
      )}

      {data && (
        <div className="space-y-3">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Réconciliées', val: data.summary.matched,  color: 'text-green-400', icon: '✅' },
              { label: 'Partielles',   val: data.summary.partial,  color: 'text-amber-400', icon: '⚠️' },
              { label: 'Écarts',       val: data.summary.variance, color: 'text-red-400',   icon: '🔴' },
            ].map(s => (
              <Card key={s.label} className="p-3 text-center">
                <div className="text-lg">{s.icon}</div>
                <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
                <div className="text-[10px] text-slate-400">{s.label}</div>
              </Card>
            ))}
          </div>

          {/* Results */}
          {data.results.map(r => {
            const sc = STATUS_CONF[r.status] ?? STATUS_CONF['MISSING_DATA']!
            const hasVariance = r.status === 'VARIANCE' || r.status === 'PARTIAL_MATCH'
            return (
              <Card key={r.governmentTransactionId} className={`p-4 border ${sc.bg}`}>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{PROVIDER_ICON[r.provider] ?? '📦'}</span>
                      <span className="font-mono text-xs text-white font-bold">{r.governmentTransactionId}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${sc.bg} ${sc.color}`}>
                        {sc.icon} {sc.label}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{r.provider}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-white">{moneyFull(r.customerTotal)}</div>
                    <div className="text-[9px] text-slate-400">montant client</div>
                  </div>
                </div>

                {/* Math check */}
                <div className="bg-black/30 rounded-xl p-3 mb-3 font-mono text-[10px]">
                  <div className="text-slate-400 mb-2">VÉRIFICATION MATHÉMATIQUE:</div>
                  <div className="space-y-1">
                    {[
                      { label: 'Chauffeur',    val: r.breakdown.driverEarnings,  color: 'text-blue-400' },
                      { label: 'Fournisseur',  val: r.breakdown.providerFees,    color: 'text-orange-400' },
                      { label: 'Taxes',        val: r.breakdown.taxes,           color: 'text-purple-400' },
                      { label: 'Pourboire',    val: r.breakdown.tips,            color: 'text-green-400' },
                      ...(r.breakdown.tolls > 0 ? [{ label: 'Péages', val: r.breakdown.tolls, color: 'text-slate-300' }] : []),
                      ...(r.breakdown.refunds > 0 ? [{ label: 'Remboursements (-)', val: -r.breakdown.refunds, color: 'text-red-400' }] : []),
                    ].map(item => (
                      <div key={item.label} className="flex justify-between">
                        <span className="text-slate-500">{item.label}</span>
                        <span className={item.color}>{moneyFull(item.val)}</span>
                      </div>
                    ))}
                    <div className="border-t border-slate-700 pt-1 mt-1 flex justify-between font-bold">
                      <span className="text-slate-300">SOMME COMPOSANTES</span>
                      <span className="text-white">{moneyFull(r.sumComponents)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-300">MONTANT CLIENT</span>
                      <span className="text-white">{moneyFull(r.customerTotal)}</span>
                    </div>
                    <div className={`flex justify-between font-bold pt-1 border-t border-slate-700 ${hasVariance ? 'text-red-400' : 'text-green-400'}`}>
                      <span>ÉCART Δ</span>
                      <span>{moneyFull(r.delta)}</span>
                    </div>
                  </div>
                </div>

                {/* Allocation bar */}
                {r.allocation && (
                  <div>
                    <div className="text-[9px] text-slate-500 mb-1">Répartition du montant client (%)</div>
                    <div className="flex rounded-full overflow-hidden h-3">
                      <div className="bg-blue-500 flex items-center justify-center text-[7px] text-white font-bold" style={{ width: `${r.allocation.driverPct}%` }}>
                        {r.allocation.driverPct > 8 ? `${r.allocation.driverPct}%` : ''}
                      </div>
                      <div className="bg-orange-500 flex items-center justify-center text-[7px] text-white font-bold" style={{ width: `${r.allocation.providerPct}%` }}>
                        {r.allocation.providerPct > 8 ? `${r.allocation.providerPct}%` : ''}
                      </div>
                      <div className="bg-purple-500" style={{ width: `${r.allocation.taxPct}%` }} />
                      <div className="bg-green-500" style={{ width: `${r.allocation.tipPct}%` }} />
                      <div className="bg-slate-700 flex-1" />
                    </div>
                    <div className="flex gap-3 mt-1 text-[8px] text-slate-500">
                      <span className="text-blue-400">■ Chauffeur {r.allocation.driverPct}%</span>
                      <span className="text-orange-400">■ Plateforme {r.allocation.providerPct}%</span>
                      <span className="text-purple-400">■ Taxes {r.allocation.taxPct}%</span>
                      <span className="text-green-400">■ Pourboire {r.allocation.tipPct}%</span>
                    </div>
                  </div>
                )}

                {hasVariance && (
                  <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[9px] text-red-400">
                    ⚠️ {r.principle}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────

export default function ProviderTransparencyPage() {
  const [data, setData]       = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const d = await apiFetch<DashboardData>('/api/provider-transparency')
      setData(d)
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  return (
    <AppShell>
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-800">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <span className="text-[10px] font-black tracking-[0.3em] text-[#0047AB] bg-[#0047AB]/10 px-2 py-1 rounded">MODULE 31</span>
              <h1 className="text-xl font-bold text-white">Transparence transactionnelle</h1>
            </div>
            <p className="text-xs text-slate-400">
              Provider Revenue Transparency & Reconciliation · PRTTR v1.0
            </p>
          </div>
          <button onClick={() => void load()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:border-qc-blue shrink-0">
            <RefreshCw size={13} className={loading ? 'animate-spin text-qc-blue' : ''} />
            Actualiser
          </button>
        </div>
        <SubNav active="/provider-transparency" />
      </div>

      <div className="px-6 py-5 space-y-6">

        {loading && (
          <div className="py-20 text-center">
            <RefreshCw className="mx-auto animate-spin text-qc-blue mb-3" size={24} />
            <p className="text-sm text-slate-400">Chargement…</p>
          </div>
        )}

        {!loading && error && (
          <Card className="p-6 text-center">
            <AlertTriangle className="mx-auto text-amber-400 mb-3" size={28} />
            <p className="text-sm text-slate-300 mb-4">{error}</p>
            <button onClick={() => void load()} className="px-4 py-2 rounded-xl bg-qc-blue text-white text-xs font-semibold">Réessayer</button>
          </Card>
        )}

        {!loading && !error && (
          <>
            {/* Principe */}
            <div className="p-4 rounded-xl bg-[#0047AB]/10 border border-[#0047AB]/30">
              <div className="text-[10px] font-black tracking-[0.25em] text-[#4A8FCC] mb-1">
                ONE TRANSACTION · ONE SOURCE OF TRUTH · NO BLIND SPOT
              </div>
              <div className="text-[10px] text-[#4A8FCC]/70 leading-relaxed">
                TAXIMETER.GOV ne cherche pas uniquement ce que le chauffeur reçoit — il réconcilie la transaction complète :<br />
                <span className="font-mono">CLIENT → MONTANT TOTAL = CHAUFFEUR + PLATEFORME + TAXES + POURBOIRES ± AJUSTEMENTS</span>
              </div>
            </div>

            {/* 3 vérités */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { level:'1', label:'Vérité de la transaction', sub:'Montant payé par le client', color:'border-green-500/30 bg-green-500/5', tc:'text-green-400', val: data ? money(data.volume.total_gross) : '—' },
                { level:'2', label:'Vérité de la répartition', sub:'Chauffeur · Plateforme · Taxes · Pourboires', color:'border-blue-500/30 bg-blue-500/5', tc:'text-blue-400', val: data ? money(data.volume.total_net) : '—' },
                { level:'3', label:'Vérité fiscale', sub:'Moteur fiscal TAXIMETER.GOV', color:'border-purple-500/30 bg-purple-500/5', tc:'text-purple-400', val: data ? `${data.volume.unique_drivers} chauffeurs` : '—' },
              ].map(t => (
                <Card key={t.level} className={`p-4 border ${t.color}`}>
                  <div className={`text-[9px] font-black tracking-widest mb-1 ${t.tc}`}>NIVEAU {t.level}</div>
                  <div className={`font-bold text-xs ${t.tc} mb-0.5 leading-tight`}>{t.label}</div>
                  <div className="text-[9px] text-slate-500 mb-2">{t.sub}</div>
                  <div className={`font-mono text-sm font-bold ${t.tc}`}>{t.val}</div>
                </Card>
              ))}
            </div>

            {/* KPIs */}
            {data && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label:'Vol. brut client',    val: money(data.volume.total_gross), icon: DollarSign, color:'text-green-400',  bg:'bg-green-500/10' },
                  { label:'Rémunération chauffeurs', val: money(data.volume.total_net), icon: Users, color:'text-blue-400', bg:'bg-blue-500/10' },
                  { label:'Pourboires',           val: money(data.volume.total_tips),  icon: TrendingUp, color:'text-purple-400', bg:'bg-purple-500/10' },
                  { label:'Transactions',         val: data.volume.total_transactions, icon: Activity, color:'text-amber-400', bg:'bg-amber-500/10' },
                ].map(k => (
                  <Card key={k.label} className={`p-4 border border-current/10 ${k.bg}`}>
                    <k.icon size={14} className={`${k.color} mb-2`} />
                    <div className={`text-xl font-bold ${k.color}`}>{k.val}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{k.label}</div>
                  </Card>
                ))}
              </div>
            )}

            {/* Par fournisseur */}
            {data && data.byProvider.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Par plateforme — Double vision chauffeur/fournisseur</div>
                  <Link href="/provider-transparency/transactions" className="text-[10px] text-qc-blue hover:underline flex items-center gap-1">Détail <ArrowRight size={10} /></Link>
                </div>
                <div className="space-y-2">
                  {data.byProvider.map(p => (
                    <Card key={p.provider} className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{PROVIDER_ICON[p.provider] ?? '📦'}</span>
                        <div className="flex-1">
                          <div className="font-bold text-white">{p.provider}</div>
                          <div className="text-[9px] text-slate-400">{p.transactions} transactions · {p.drivers} chauffeurs</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-400">{money(p.gross)}</div>
                          <div className="text-[9px] text-slate-400">brut client</div>
                        </div>
                      </div>
                      {/* Triple ligne */}
                      <div className="grid grid-cols-3 gap-2 text-[10px]">
                        <div className="bg-blue-500/10 rounded-lg p-2">
                          <div className="text-slate-400">Chauffeurs</div>
                          <div className="font-bold text-blue-400">{money(p.net)}</div>
                        </div>
                        <div className="bg-purple-500/10 rounded-lg p-2">
                          <div className="text-slate-400">Pourboires</div>
                          <div className="font-bold text-purple-400">{money(p.tips)}</div>
                        </div>
                        <div className="bg-amber-500/10 rounded-lg p-2">
                          <div className="text-slate-400">Frais</div>
                          <div className="font-bold text-amber-400">{money(p.fees)}</div>
                        </div>
                      </div>
                      {/* Barre répartition */}
                      {parseFloat(p.gross) > 0 && (
                        <div className="mt-3">
                          <div className="flex rounded-full overflow-hidden h-2 bg-slate-800">
                            <div className="bg-blue-500" style={{ width: `${Math.min((parseFloat(p.net)/parseFloat(p.gross))*100,100)}%` }} />
                            <div className="bg-purple-500" style={{ width: `${Math.min((parseFloat(p.tips)/parseFloat(p.gross))*100,100)}%` }} />
                            <div className="bg-amber-500" style={{ width: `${Math.min((parseFloat(p.fees)/parseFloat(p.gross))*100,100)}%` }} />
                            <div className="bg-slate-700 flex-1" />
                          </div>
                          <div className="flex gap-2 mt-1 text-[8px] text-slate-600">
                            <span className="text-blue-400/70">■ Chauffeurs {Math.round((parseFloat(p.net)/parseFloat(p.gross))*100)}%</span>
                            <span className="text-purple-400/70">■ Tips {Math.round((parseFloat(p.tips)/parseFloat(p.gross))*100)}%</span>
                            <span className="text-amber-400/70">■ Frais {Math.round((parseFloat(p.fees)/parseFloat(p.gross))*100)}%</span>
                            <span className="text-slate-500">■ Autres</span>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* No data yet */}
            {data && data.byProvider.length === 0 && (
              <Card className="p-8 text-center">
                <Layers size={28} className="mx-auto text-slate-600 mb-3" />
                <h3 className="font-bold text-white mb-2">Aucune transaction provider ce mois</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Les données apparaissent ici dès que des transactions sont reçues des plateformes.<br />
                  Les courses taxi (taximètre) apparaissent immédiatement.
                </p>
                <div className="text-[10px] text-slate-500 font-mono">
                  revenue_ledger → groupé par source_type → Module 31
                </div>
              </Card>
            )}

            {/* MOTEUR DE RÉCONCILIATION */}
            <div className="border-t border-slate-800 pt-6">
              <ReconciliationEngine />
            </div>

            {/* Exceptions + Réconciliation */}
            {data && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Scale size={14} className="text-qc-blue" />
                      <span className="text-sm font-bold text-white">Réconciliation</span>
                    </div>
                    <Link href="/provider-transparency/reconciliation" className="text-[10px] text-qc-blue hover:underline flex items-center gap-1">Voir <ArrowRight size={10} /></Link>
                  </div>
                  {[
                    { label:'Dossiers', val: data.reconciliation.total_cases, color:'text-white' },
                    { label:'Résolus',  val: data.reconciliation.resolved,    color:'text-green-400' },
                    { label:'Ouverts',  val: data.reconciliation.open_cases,  color:'text-amber-400' },
                    { label:'Critiques',val: data.reconciliation.critical,    color:'text-red-400' },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between py-1.5 border-b border-slate-800 last:border-0">
                      <span className="text-xs text-slate-400">{r.label}</span>
                      <span className={`font-bold text-sm ${r.color}`}>{r.val || '0'}</span>
                    </div>
                  ))}
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert size={14} className="text-amber-400" />
                      <span className="text-sm font-bold text-white">Exceptions actives</span>
                    </div>
                    <Link href="/provider-transparency/exceptions" className="text-[10px] text-qc-blue hover:underline flex items-center gap-1">Voir <ArrowRight size={10} /></Link>
                  </div>
                  {data.exceptions.length === 0 ? (
                    <div className="flex items-center gap-2 text-green-400 text-xs py-4">
                      <CheckCircle size={14} /> Aucune exception active
                    </div>
                  ) : data.exceptions.slice(0, 4).map(ex => {
                    const sc = SEVERITY_CONF[ex.severity] ?? SEVERITY_CONF['LOW']!
                    return (
                      <div key={ex.id} className={`p-2 rounded-lg border mb-2 ${sc.bg}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className={`text-[10px] font-bold ${sc.color}`}>{ex.severity} · {ex.case_type.replace(/_/g,' ')}</div>
                            {ex.first_name && <div className="text-[9px] text-slate-400">{ex.first_name} {ex.last_name} · {ex.provider_name}</div>}
                          </div>
                          {ex.difference_amount && (
                            <div className={`text-[10px] font-mono font-bold ${sc.color}`}>Δ {moneyFull(ex.difference_amount)}</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </Card>
              </div>
            )}

            {/* Architecture */}
            <Card className="p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Architecture du flux transactionnel</div>
              <div className="flex items-center gap-1 flex-wrap text-[9px]">
                {[
                  { label:'CLIENT',       color:'text-green-400 bg-green-500/10' },
                  { label:'PROVIDER',     color:'text-amber-400 bg-amber-500/10' },
                  { label:'GATEWAY',      color:'text-qc-blue bg-[#0047AB]/10' },
                  { label:'NORMALISATION',color:'text-blue-400 bg-blue-500/10' },
                  { label:'REVENUE LEDGER', color:'text-white bg-slate-700' },
                  { label:'TAX ENGINE',   color:'text-purple-400 bg-purple-500/10' },
                  { label:'RÉCONCILIATION', color:'text-orange-400 bg-orange-500/10' },
                  { label:'ADMIN GOV',    color:'text-red-400 bg-red-500/10' },
                ].map((step, i, arr) => (
                  <span key={step.label} className="flex items-center gap-1">
                    <span className={`px-2 py-1 rounded-md font-semibold ${step.color} whitespace-nowrap`}>{step.label}</span>
                    {i < arr.length - 1 && <span className="text-slate-600">→</span>}
                  </span>
                ))}
              </div>
            </Card>

            {/* Liens modules */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { href:'/provider-transparency/transactions',   icon:Layers,      label:'Explorer les transactions' },
                { href:'/provider-transparency/reconciliation', icon:Scale,       label:'Moteur de réconciliation' },
                { href:'/provider-transparency/exceptions',     icon:ShieldAlert, label:'Centre des exceptions' },
                { href:'/audit',                                icon:Eye,         label:'Journal d\'audit' },
              ].map(item => (
                <Link key={item.href} href={item.href}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-900 hover:border-qc-blue/50 transition-colors group">
                  <item.icon size={18} className="text-qc-blue mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-white">{item.label}</div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
