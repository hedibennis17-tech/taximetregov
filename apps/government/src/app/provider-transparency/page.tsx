'use client'

// ================================================================
// TAXIMETER.GOV — MODULE 31
// Provider Revenue Transparency & Transaction Reconciliation
// PRTTR — Transparence transactionnelle gouvernementale
// ================================================================

import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw, AlertTriangle, CheckCircle, Clock,
  TrendingUp, DollarSign, Users, Layers,
  Scale, FileText, ShieldAlert, ArrowRight,
  Activity, BarChart2,
} from 'lucide-react'
import { getToken } from '@/lib/api'

// ─── Types ───────────────────────────────────────────────────

interface DashboardData {
  volume: {
    total_transactions: string
    total_gross:        string
    total_tips:         string
    total_fees:         string
    total_net:          string
    unique_drivers:     string
    unique_providers:   string
    settled_amount:     string
    pending_amount:     string
  }
  byProvider: Array<{
    provider:    string
    transactions: string
    gross:       string
    tips:        string
    fees:        string
    net:         string
    drivers:     string
    last_activity: string
    settled:     string
  }>
  byService: Array<{
    service_type: string
    transactions: string
    gross:        string
    tips:         string
    net:          string
  }>
  reconciliation: {
    total_cases: string
    resolved:    string
    open_cases:  string
    critical:    string
    high:        string
  }
  exceptions: Array<{
    id:               string
    case_type:        string
    severity:         string
    status:           string
    expected_amount:  string
    actual_amount:    string
    difference_amount: string
    currency:         string
    created_at:       string
    public_driver_id: string | null
    first_name:       string | null
    last_name:        string | null
    provider_name:    string | null
  }>
  generatedAt: string
  period:      string
}

// ─── Helpers ─────────────────────────────────────────────────

function money(v: string | number) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })
    .format(typeof v === 'string' ? parseFloat(v) || 0 : v)
}

function moneyFull(v: string | number) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' })
    .format(typeof v === 'string' ? parseFloat(v) || 0 : v)
}

const PROVIDER_ICON: Record<string, string> = {
  TAXI: '🚕', UBER: '⬛', LYFT: '🟣',
  DOORDASH: '🔴', INSTACART: '🟢', UBER_EATS: '🟡', SKIP: '🟠',
}

const SERVICE_LABEL: Record<string, string> = {
  TAXI_TRIP: 'Taxi', RIDESHARE_TRIP: 'Rideshare',
  FOOD_DELIVERY: 'Livraison repas', GROCERY_DELIVERY: 'Livraison épicerie',
  PARCEL_DELIVERY: 'Livraison colis', COURIER: 'Courrier', OTHER: 'Autre',
}

const SEVERITY_CONF: Record<string, { color: string; bg: string }> = {
  CRITICAL: { color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30' },
  HIGH:     { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
  MEDIUM:   { color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/30' },
  LOW:      { color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30' },
  INFO:     { color: 'text-slate-400',  bg: 'bg-slate-800 border-slate-700' },
}

async function apiFetch<T>(path: string): Promise<T> {
  const token = getToken()
  const res = await fetch(path, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  const json = await res.json() as { success: boolean; data: T; error?: string }
  if (!res.ok || !json.success) throw new Error(json.error ?? `Erreur ${res.status}`)
  return json.data
}

// ─── COMPOSANT PRINCIPAL ─────────────────────────────────────

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
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-[0.3em] text-[#0047AB] bg-[#0047AB]/10 px-2 py-1 rounded">MODULE 31</span>
                <h1 className="text-xl font-bold text-white">Transparence transactionnelle</h1>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Provider Revenue Transparency & Transaction Reconciliation · PRTTR v1.0
              {data && <span className="ml-2 text-slate-500">· {new Date(data.generatedAt).toLocaleString('fr-CA')}</span>}
            </p>
          </div>
          <button onClick={() => void load()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:border-qc-blue transition-colors shrink-0">
            <RefreshCw size={13} className={loading ? 'animate-spin text-qc-blue' : ''} />
            Actualiser
          </button>
        </div>

        {/* Sub-navigation */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {[
            { href: '/provider-transparency',                label: 'Vue globale',       icon: BarChart2,   active: true },
            { href: '/provider-transparency/transactions',   label: 'Transactions',      icon: Layers,       active: false },
            { href: '/provider-transparency/reconciliation', label: 'Réconciliation',    icon: Scale,        active: false },
            { href: '/provider-transparency/exceptions',     label: 'Exceptions',        icon: ShieldAlert,  active: false },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${item.active
                  ? 'bg-qc-blue text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <item.icon size={12} />
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="px-6 py-5 space-y-6">

        {/* Loading */}
        {loading && (
          <div className="py-20 text-center">
            <RefreshCw className="mx-auto animate-spin text-qc-blue mb-3" size={24} />
            <p className="text-sm text-slate-400">Chargement des données transactionnelles…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <Card className="p-6 text-center">
            <AlertTriangle className="mx-auto text-amber-400 mb-3" size={28} />
            <p className="text-sm text-slate-300 mb-4">{error}</p>
            <button onClick={() => void load()} className="px-4 py-2 rounded-xl bg-qc-blue text-white text-xs font-semibold">
              Réessayer
            </button>
          </Card>
        )}

        {data && !loading && (
          <>
            {/* Principe ONE TRANSACTION - ONE SOURCE OF TRUTH */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#0047AB]/10 border border-[#0047AB]/30">
              <Layers size={16} className="text-[#4A8FCC] mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-[#4A8FCC] mb-0.5">ONE TRANSACTION · ONE SOURCE OF TRUTH</div>
                <div className="text-[10px] text-[#4A8FCC]/70">
                  Chaque transaction est identifiée de manière unique · Chauffeur · Fournisseur · Taxes · Pourboires · Réconciliation
                </div>
              </div>
            </div>

            {/* KPIs principaux */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Volume transactionnel — Ce mois</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Vol. brut client',    val: money(data.volume.total_gross),    icon: DollarSign, color: 'text-green-400',  bg: 'bg-green-500/10' },
                  { label: 'Rémunération chauffeurs', val: money(data.volume.total_net),  icon: Users,      color: 'text-blue-400',   bg: 'bg-blue-500/10' },
                  { label: 'Pourboires',           val: money(data.volume.total_tips),    icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                  { label: 'Transactions',         val: data.volume.total_transactions,   icon: Activity,   color: 'text-amber-400',  bg: 'bg-amber-500/10' },
                ].map(kpi => (
                  <Card key={kpi.label} className={`p-4 border ${kpi.bg} border-current/10`}>
                    <div className={`inline-flex p-2 rounded-lg ${kpi.bg} mb-2`}>
                      <kpi.icon size={14} className={kpi.color} />
                    </div>
                    <div className={`text-xl font-bold ${kpi.color}`}>{kpi.val}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{kpi.label}</div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Triple vérité */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  level: '1', label: 'Vérité de la transaction',
                  desc: 'Montant payé par le client',
                  val: money(data.volume.total_gross),
                  color: 'border-green-500/30 bg-green-500/5',
                  textColor: 'text-green-400',
                },
                {
                  level: '2', label: 'Vérité de la répartition',
                  desc: 'Chauffeur + plateforme + taxes + pourboires',
                  val: `${money(data.volume.total_net)} chauf.`,
                  color: 'border-blue-500/30 bg-blue-500/5',
                  textColor: 'text-blue-400',
                },
                {
                  level: '3', label: 'Vérité fiscale',
                  desc: 'Moteur fiscal TAXIMETER.GOV',
                  val: `${data.volume.unique_drivers} chauffeurs`,
                  color: 'border-purple-500/30 bg-purple-500/5',
                  textColor: 'text-purple-400',
                },
              ].map(t => (
                <Card key={t.level} className={`p-4 border ${t.color}`}>
                  <div className={`text-[9px] font-black tracking-widest mb-2 ${t.textColor}`}>NIVEAU {t.level}</div>
                  <div className={`font-bold text-sm ${t.textColor} mb-1`}>{t.label}</div>
                  <div className="text-[10px] text-slate-400 mb-2">{t.desc}</div>
                  <div className={`font-mono text-sm font-bold ${t.textColor}`}>{t.val}</div>
                </Card>
              ))}
            </div>

            {/* Par fournisseur */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Par plateforme fournisseur</div>
                <Link href="/provider-transparency/transactions" className="text-[10px] text-qc-blue hover:underline flex items-center gap-1">
                  Détail transactions <ArrowRight size={10} />
                </Link>
              </div>

              {data.byProvider.length === 0 ? (
                <Card className="p-6 text-center">
                  <p className="text-sm text-slate-400">Aucune transaction ce mois-ci.</p>
                  <p className="text-xs text-slate-500 mt-2">Les données apparaissent après synchronisation des providers.</p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {/* Header desktop */}
                  <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                    <span>Fournisseur</span>
                    <span>Transactions</span>
                    <span>Vol. brut</span>
                    <span>Chauffeurs</span>
                    <span>Pourboires</span>
                    <span>Net chauffeurs</span>
                  </div>
                  {data.byProvider.map(p => (
                    <Card key={p.provider} className="p-0 overflow-hidden hover:border-qc-blue/40 transition-colors">
                      <div className="p-4">
                        {/* Mobile */}
                        <div className="md:hidden">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{PROVIDER_ICON[p.provider] ?? '📦'}</span>
                            <span className="font-bold text-white text-sm">{p.provider}</span>
                            <span className="ml-auto font-bold text-green-400">{money(p.gross)}</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>{p.transactions} transactions · {p.drivers} chauffeurs</span>
                            <span>tips {money(p.tips)}</span>
                          </div>
                        </div>
                        {/* Desktop */}
                        <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{PROVIDER_ICON[p.provider] ?? '📦'}</span>
                            <div>
                              <div className="font-bold text-white text-sm">{p.provider}</div>
                              <div className="text-[9px] text-slate-500">
                                {p.last_activity ? new Date(p.last_activity).toLocaleDateString('fr-CA') : '—'}
                              </div>
                            </div>
                          </div>
                          <div className="font-mono text-sm text-white">{p.transactions}</div>
                          <div className="font-bold text-green-400">{money(p.gross)}</div>
                          <div className="text-sm text-white">{p.drivers}</div>
                          <div className="font-mono text-purple-400">{money(p.tips)}</div>
                          <div className="font-bold text-blue-400">{money(p.net)}</div>
                        </div>

                        {/* Reconciliation bar */}
                        {parseFloat(p.gross) > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-800">
                            <div className="flex justify-between text-[9px] text-slate-500 mb-1">
                              <span>Répartition</span>
                              <span>Chauffeur {Math.round((parseFloat(p.net) / parseFloat(p.gross)) * 100)}% · Tips {Math.round((parseFloat(p.tips) / parseFloat(p.gross)) * 100)}%</span>
                            </div>
                            <div className="flex rounded-full overflow-hidden h-1.5 bg-slate-800">
                              <div className="bg-blue-500" style={{ width: `${Math.min((parseFloat(p.net) / parseFloat(p.gross)) * 100, 100)}%` }} />
                              <div className="bg-purple-500" style={{ width: `${Math.min((parseFloat(p.tips) / parseFloat(p.gross)) * 100, 100)}%` }} />
                              <div className="bg-amber-500 flex-1" />
                            </div>
                            <div className="flex gap-3 mt-1 text-[8px] text-slate-600">
                              <span className="text-blue-400/70">■ Chauffeur</span>
                              <span className="text-purple-400/70">■ Pourboires</span>
                              <span className="text-amber-400/70">■ Autres</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Par type de service */}
            {data.byService.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Par type d'activité</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {data.byService.map(s => (
                    <Card key={s.service_type} className="p-4">
                      <div className="text-xs font-bold text-white mb-1">{SERVICE_LABEL[s.service_type] ?? s.service_type}</div>
                      <div className="font-bold text-green-400 text-lg">{money(s.gross)}</div>
                      <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                        <span>{s.transactions} txn</span>
                        <span>tips {money(s.tips)}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Réconciliation + Exceptions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Réconciliation */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Scale size={14} className="text-qc-blue" />
                    <span className="text-sm font-bold text-white">Réconciliation</span>
                  </div>
                  <Link href="/provider-transparency/reconciliation"
                    className="text-[10px] text-qc-blue hover:underline flex items-center gap-1">
                    Voir tout <ArrowRight size={10} />
                  </Link>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Dossiers totaux',  val: data.reconciliation.total_cases, color: 'text-white' },
                    { label: 'Résolus',          val: data.reconciliation.resolved,    color: 'text-green-400' },
                    { label: 'Ouverts',          val: data.reconciliation.open_cases,  color: 'text-amber-400' },
                    { label: 'Critiques',        val: data.reconciliation.critical,    color: 'text-red-400' },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between items-center py-1.5 border-b border-slate-800 last:border-0">
                      <span className="text-xs text-slate-400">{r.label}</span>
                      <span className={`font-bold text-sm ${r.color}`}>{r.val || '0'}</span>
                    </div>
                  ))}
                </div>
                {parseInt(data.reconciliation.open_cases || '0') === 0 && (
                  <div className="flex items-center gap-2 mt-3 text-green-400 text-xs">
                    <CheckCircle size={12} /> Aucun dossier ouvert
                  </div>
                )}
              </Card>

              {/* Exceptions actives */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={14} className="text-amber-400" />
                    <span className="text-sm font-bold text-white">Exceptions actives</span>
                  </div>
                  <Link href="/provider-transparency/exceptions"
                    className="text-[10px] text-qc-blue hover:underline flex items-center gap-1">
                    Voir tout <ArrowRight size={10} />
                  </Link>
                </div>
                {data.exceptions.length === 0 ? (
                  <div className="flex items-center gap-2 text-green-400 text-xs py-4">
                    <CheckCircle size={14} /> Aucune exception active
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.exceptions.slice(0, 4).map(ex => {
                      const sc = SEVERITY_CONF[ex.severity] ?? SEVERITY_CONF['INFO']!
                      return (
                        <div key={ex.id} className={`p-2.5 rounded-xl border ${sc.bg}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className={`text-[10px] font-bold ${sc.color}`}>{ex.severity} · {ex.case_type.replace(/_/g, ' ')}</div>
                              {ex.first_name && (
                                <div className="text-[9px] text-slate-400 truncate">
                                  {ex.first_name} {ex.last_name} · {ex.provider_name}
                                </div>
                              )}
                            </div>
                            {ex.difference_amount && (
                              <div className={`text-[10px] font-mono font-bold shrink-0 ${sc.color}`}>
                                Δ {moneyFull(ex.difference_amount)}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {data.exceptions.length > 4 && (
                      <div className="text-center text-[10px] text-slate-500">
                        +{data.exceptions.length - 4} autres exceptions
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>

            {/* Liens sous-modules */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Modules du système</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { href: '/provider-transparency/transactions',   icon: Layers,      label: 'Explorer les transactions',    desc: 'Recherche · Filtres · Détail' },
                  { href: '/provider-transparency/reconciliation', icon: Scale,       label: 'Moteur de réconciliation',     desc: 'Dossiers · Statuts · Résolution' },
                  { href: '/provider-transparency/exceptions',     icon: ShieldAlert, label: 'Centre des exceptions',       desc: 'Anomalies · Priorisation · Suivi' },
                  { href: '/transactions',                         icon: FileText,    label: 'Revenue Ledger',              desc: 'Toutes les transactions' },
                ].map(item => (
                  <Link key={item.href} href={item.href}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-900 hover:border-qc-blue/50 transition-colors group">
                    <item.icon size={18} className="text-qc-blue mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-white mb-0.5">{item.label}</div>
                    <div className="text-[9px] text-slate-500">{item.desc}</div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Architecture flow */}
            <Card className="p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                Flux transactionnel — Architecture TAXIMETER.GOV
              </div>
              <div className="flex items-center gap-1 flex-wrap text-[9px] text-slate-400">
                {['CLIENT', 'PROVIDER', 'GATEWAY', 'NORMALISATION', 'REVENUE LEDGER', 'TAX ENGINE', 'RÉCONCILIATION', 'ADMIN GOV'].map((step, i, arr) => (
                  <span key={step} className="flex items-center gap-1">
                    <span className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 font-semibold whitespace-nowrap">{step}</span>
                    {i < arr.length - 1 && <span className="text-slate-600">→</span>}
                  </span>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  )
}
