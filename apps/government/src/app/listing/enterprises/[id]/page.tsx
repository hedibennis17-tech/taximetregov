'use client'
// ================================================================
// TAXIMETER.GOV — ENTERPRISE 360° CONTROL CENTER
// Source unique: /api/enterprises/[id] → Supabase
// Règles: PUBLIC_VERIFIED / SYNTHETIC_DEMO / PRIVATE_NOT_AVAILABLE
// ================================================================

import { AppShell } from '@/components/layout/AppShell'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, Building, Users, Truck, Activity, DollarSign, Shield, Zap, Bell, FileText, BarChart2, Globe, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { ENTERPRISES, CATEGORY_LABELS } from '../data'
import { govFetch, money } from '@/lib/api-client'

// ─── Types ─────────────────────────────────────────────────────

interface Dept { id:string; name:string; service:string; drivers_demo:number; active:boolean }

interface EnterpriseData {
  enterprise_id: string
  name: string
  commercial_name: string
  neq: string
  province: string
  city: string
  address: string
  postal_code: string
  website: string
  org_type: string
  status: string
  data_status: string
  economic_impact_qc_2024: string
  internal_revenue: string
  departments: Dept[]
  kpis: {
    drivers_db: number; drivers_demo: number; vehicles_db: number
    departments: number; activities_db: number; trips_db: number
    gross_revenue: number; net_revenue: number; fees: number; tips: number
    tps_demo: number; tvq_demo: number; declarations_db: number
    payments_demo: number; audits_db: number; documents_db: number
    alerts_db: number; compliance_score: number
    api_connected: boolean; webhook_active: boolean
  }
  supabase: Record<string, unknown>
  data_sources: Record<string, string>
}

// ─── Config tabs ───────────────────────────────────────────────

const TABS = [
  { key:'overview',     label:'Overview',        icon: BarChart2 },
  { key:'profile',      label:'Profil',           icon: Building },
  { key:'departments',  label:'Départements',     icon: Building },
  { key:'drivers',      label:'Chauffeurs',        icon: Users },
  { key:'vehicles',     label:'Véhicules',         icon: Truck },
  { key:'taximeter',    label:'Taximètre',         icon: Activity },
  { key:'activities',   label:'Activités',         icon: Activity },
  { key:'transactions', label:'Transactions',      icon: DollarSign },
  { key:'revenue',      label:'Revenus',           icon: DollarSign },
  { key:'taxes',        label:'TPS/TVQ',           icon: FileText },
  { key:'declarations', label:'Déclarations',      icon: FileText },
  { key:'payments',     label:'Paiements',         icon: DollarSign },
  { key:'documents',    label:'Documents',         icon: FileText },
  { key:'gov_connect',  label:'Connexions Gov',    icon: Globe },
  { key:'api',          label:'API',               icon: Zap },
  { key:'webhooks',     label:'Webhooks',          icon: Zap },
  { key:'reconcile',    label:'Réconciliation',    icon: RefreshCw },
  { key:'analytics',    label:'Analytics',         icon: BarChart2 },
  { key:'reports',      label:'Rapports',          icon: FileText },
  { key:'compliance',   label:'Conformité',        icon: Shield },
  { key:'audit',        label:'Audit',             icon: Shield },
  { key:'security',     label:'Sécurité',          icon: Shield },
  { key:'notifications',label:'Notifications',     icon: Bell },
  { key:'intelligence', label:'Intelligence',      icon: BarChart2 },
  { key:'gov_comm',     label:'Communication Gov', icon: Globe },
]

const DEPT_COLORS: Record<string,string> = {
  TAXI:     '#F59E0B',
  RIDESHARE:'#3B82F6',
  GREEN:    '#10B981',
  FOOD:     '#EF4444',
  GROCERY:  '#8B5CF6',
  DELIVERY: '#F97316',
}

function Badge({ label, type }: { label: string; type: 'verified'|'demo'|'private' }) {
  const styles = {
    verified: 'bg-green-500/15 text-green-400 border-green-500/30',
    demo:     'bg-amber-500/15 text-amber-400 border-amber-500/30',
    private:  'bg-red-500/15 text-red-400 border-red-500/30',
  }
  const icons = { verified:'✓', demo:'⚠', private:'🔒' }
  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${styles[type]}`}>
      {icons[type]} {label}
    </span>
  )
}

function KpiCard({ label, value, sub, color = 'text-white' }: { label:string; value:string|number; sub?:string; color?:string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
      <div className={`text-lg font-black ${color}`}>{value}</div>
      <div className="text-[9px] text-slate-400 leading-tight mt-0.5">{label}</div>
      {sub && <div className="text-[8px] text-slate-600 mt-0.5">{sub}</div>}
    </div>
  )
}

function InfoRow({ label, value, badge }: { label:string; value:string; badge?: 'verified'|'demo'|'private' }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-800 last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <div className="flex items-center gap-2 text-right max-w-[60%]">
        <span className="text-xs text-white font-medium">{value}</span>
        {badge && <Badge label={badge === 'verified' ? 'VERIFIED' : badge === 'demo' ? 'DEMO' : 'PRIVATE'} type={badge} />}
      </div>
    </div>
  )
}

function Section({ title, children }: { title:string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-3">
      <div className="px-4 py-2.5 bg-slate-800/60 border-b border-slate-800">
        <span className="text-xs font-bold text-white">{title}</span>
      </div>
      <div className="px-4 py-1">{children}</div>
    </div>
  )
}

// ─── COMPOSANT PRINCIPAL ───────────────────────────────────────

export default function Enterprise360Page() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [tab, setTab] = useState('overview')
  const [dept, setDept] = useState('ALL')
  const [data, setData] = useState<EnterpriseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)

  // Données statiques du listing
  const staticEnt = ENTERPRISES.find(e => e.id === id)

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const result = await govFetch<EnterpriseData>(`/api/enterprises/${id}`)
      setData(result)
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { void load() }, [load])

  const k = data?.kpis
  const depts = data?.departments ?? []
  const activeDepts = dept === 'ALL' ? depts : depts.filter(d => d.id === dept)

  return (
    <AppShell>
      {/* Back + titre */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3 border-b border-slate-800">
        <button onClick={() => router.back()} className="p-2 rounded-xl bg-slate-900 border border-slate-800">
          <ArrowLeft size={15} className="text-slate-400" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-white text-base">
              {data?.commercial_name ?? staticEnt?.name ?? id}
            </span>
            <Badge label="DEMO" type="demo" />
            <Badge label="SYNTHETIC" type="demo" />
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">{id} · Enterprise 360° Control Center</div>
        </div>
        <button onClick={() => void load()} className="p-2 rounded-xl bg-slate-900 border border-slate-800">
          <RefreshCw size={13} className={loading ? 'animate-spin text-qc-blue' : 'text-slate-400'} />
        </button>
      </div>

      {/* Status bar */}
      {data && (
        <div className="px-4 py-2 flex items-center gap-2 flex-wrap border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-1.5 text-[9px]">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-400 font-bold">MODE PILOTE</span>
          </div>
          <span className="text-slate-600">·</span>
          <span className="text-[9px] text-slate-500">API: {k?.api_connected ? '✅ Configurée' : '❌ Demo'}</span>
          <span className="text-slate-600">·</span>
          <span className="text-[9px] text-slate-500">Webhook: {k?.webhook_active ? '✅ Actif' : '❌ Demo'}</span>
          <span className="text-slate-600">·</span>
          <span className="text-[9px] text-slate-500">Conformité: {k?.compliance_score ?? '—'}% DEMO</span>
        </div>
      )}

      {loading && (
        <div className="py-16 text-center">
          <RefreshCw className="mx-auto animate-spin text-qc-blue mb-2" size={20} />
          <p className="text-xs text-slate-400">Chargement Enterprise 360°…</p>
        </div>
      )}

      {error && (
        <div className="m-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
          <p className="text-sm text-red-400 mb-2">{error}</p>
          <button onClick={() => void load()} className="px-4 py-1.5 rounded-lg bg-qc-blue text-white text-xs">Réessayer</button>
        </div>
      )}

      {data && !loading && (
        <>
          {/* ── KPI BAR ─────────────────────────────────────── */}
          <div className="px-4 py-3 border-b border-slate-800 overflow-x-auto">
            <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
              {[
                { label:'Chauffeurs', value: k?.drivers_db || k?.drivers_demo || 0, sub:'DB+DEMO', color:'text-blue-400' },
                { label:'Véhicules',  value: k?.vehicles_db || 0,                   sub:'DB',      color:'text-purple-400' },
                { label:'Depts',      value: k?.departments ?? 0,                   sub:'DEMO',    color:'text-amber-400' },
                { label:'Activités',  value: k?.activities_db ?? 0,                 sub:'DB',      color:'text-green-400' },
                { label:'Courses',    value: k?.trips_db ?? 0,                      sub:'DB',      color:'text-cyan-400' },
                { label:'Revenus',    value: money(k?.gross_revenue ?? 0),          sub:'DB+DEMO', color:'text-green-400' },
                { label:'TPS est.',   value: money(k?.tps_demo ?? 0),              sub:'DEMO',    color:'text-purple-400' },
                { label:'TVQ est.',   value: money(k?.tvq_demo ?? 0),              sub:'DEMO',    color:'text-purple-400' },
                { label:'Décl.',      value: k?.declarations_db ?? 0,              sub:'DB',      color:'text-amber-400' },
                { label:'Documents',  value: k?.documents_db ?? 0,                 sub:'DB',      color:'text-slate-300' },
                { label:'Alertes',    value: k?.alerts_db ?? 0,                    sub:'DB',      color:'text-red-400' },
                { label:'Audits',     value: k?.audits_db ?? 0,                    sub:'DB',      color:'text-orange-400' },
                { label:'Conformité', value: `${k?.compliance_score ?? 0}%`,       sub:'DEMO',    color:'text-teal-400' },
              ].map(kpi => (
                <div key={kpi.label} className="text-center px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl flex-shrink-0 min-w-[72px]">
                  <div className={`text-sm font-black ${kpi.color}`}>{kpi.value}</div>
                  <div className="text-[8px] text-slate-400">{kpi.label}</div>
                  <div className="text-[7px] text-slate-600">{kpi.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── DEPARTMENT SWITCHER ─────────────────────────── */}
          <div className="px-4 py-2 border-b border-slate-800 overflow-x-auto">
            <div className="flex gap-1.5" style={{ minWidth:'max-content' }}>
              <button onClick={() => setDept('ALL')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex-shrink-0 ${dept==='ALL' ? 'bg-slate-700 text-white border border-slate-600' : 'text-slate-500 border border-slate-800'}`}>
                ALL
              </button>
              {depts.map(d => (
                <button key={d.id} onClick={() => setDept(d.id)}
                  style={{ borderColor: dept===d.id ? (DEPT_COLORS[d.service] ?? '#3B82F6') : undefined }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex-shrink-0 border ${dept===d.id ? 'text-white' : 'text-slate-500 border-slate-800'}`}>
                  <span style={{ color: DEPT_COLORS[d.service] }}>●</span> {d.name}
                </button>
              ))}
            </div>
          </div>

          {/* ── TABS ────────────────────────────────────────── */}
          <div className="px-4 py-2 border-b border-slate-800 overflow-x-auto">
            <div className="flex gap-1" style={{ minWidth:'max-content' }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex-shrink-0 ${tab===t.key ? 'bg-qc-blue text-white' : 'text-slate-400 border border-slate-800 hover:text-white'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── CONTENU TABS ───────────────────────────────── */}
          <div className="px-4 py-4 pb-8 space-y-3">

            {/* OVERVIEW */}
            {tab === 'overview' && (
              <>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-[9px] text-amber-400">
                    ⚠️ Données synthétiques DEMO. Impact économique 1,9G$ QC 2024 = PUBLIC_VERIFIED (Uber/Public First, déc. 2025).
                    Revenus internes Uber = PRIVATE_NOT_AVAILABLE.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <KpiCard label="Revenus bruts (DB+DEMO)" value={money(k?.gross_revenue ?? 0)} color="text-green-400" sub="revenue_ledger" />
                  <KpiCard label="Revenus nets" value={money(k?.net_revenue ?? 0)} color="text-green-300" sub="revenue_ledger" />
                  <KpiCard label="TPS estimée 5%" value={money(k?.tps_demo ?? 0)} color="text-purple-400" sub="SYNTHETIC_DEMO" />
                  <KpiCard label="TVQ estimée 9,975%" value={money(k?.tvq_demo ?? 0)} color="text-purple-400" sub="SYNTHETIC_DEMO" />
                  <KpiCard label="Frais plateforme" value={money(k?.fees ?? 0)} color="text-amber-400" sub="revenue_ledger" />
                  <KpiCard label="Pourboires" value={money(k?.tips ?? 0)} color="text-amber-300" sub="revenue_ledger" />
                </div>
                <Section title="Impact économique PUBLIC_VERIFIED">
                  <InfoRow label="Impact QC 2024" value="1,9 milliard $" badge="verified" />
                  <InfoRow label="Source" value="Uber/Public First, déc. 2025" badge="verified" />
                  <InfoRow label="Revenus internes Uber" value="PRIVATE_NOT_AVAILABLE" badge="private" />
                  <InfoRow label="Statut fiscal chauffeurs" value="Travailleurs autonomes — Revenu Québec" badge="verified" />
                </Section>
                <Section title="Départements actifs">
                  {(dept === 'ALL' ? depts : activeDepts).map(d => (
                    <div key={d.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                      <div className="flex items-center gap-2">
                        <div style={{ width:8, height:8, borderRadius:'50%', background: DEPT_COLORS[d.service] }} />
                        <span className="text-xs text-white">{d.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-blue-400">{d.drivers_demo.toLocaleString()}</div>
                        <div className="text-[8px] text-slate-500">chauffeurs DEMO</div>
                      </div>
                    </div>
                  ))}
                </Section>
                <Section title="Sources de données">
                  {Object.entries(data.data_sources).map(([k2, v]) => (
                    <InfoRow key={k2} label={k2} value={v}
                      badge={v.startsWith('PUBLIC_VERIFIED') ? 'verified' : v.startsWith('PRIVATE') ? 'private' : 'demo'} />
                  ))}
                </Section>
              </>
            )}

            {/* PROFIL */}
            {tab === 'profile' && (
              <Section title="Profil légal — Uber Canada Inc.">
                <InfoRow label="Nom légal"        value={data.name}             badge="demo" />
                <InfoRow label="Nom commercial"   value={data.commercial_name}  badge="demo" />
                <InfoRow label="Enterprise ID"    value={data.enterprise_id}    />
                <InfoRow label="NEQ"              value={data.neq}              badge="private" />
                <InfoRow label="Province"         value={data.province}         />
                <InfoRow label="Ville"            value={data.city}             badge="demo" />
                <InfoRow label="Adresse"          value={data.address}          badge="demo" />
                <InfoRow label="Code postal"      value={data.postal_code}      badge="demo" />
                <InfoRow label="Site web"         value={data.website}          badge="verified" />
                <InfoRow label="Type"             value={data.org_type}         />
                <InfoRow label="Statut"           value={data.status}           badge="demo" />
                <InfoRow label="Data status"      value={data.data_status}      />
              </Section>
            )}

            {/* DÉPARTEMENTS */}
            {tab === 'departments' && (
              <>
                <div className="text-[9px] text-slate-500 mb-2">1 organisation · {depts.length} départements — SYNTHETIC_DEMO</div>
                {depts.map(d => (
                  <div key={d.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-2">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div style={{ width:10, height:10, borderRadius:'50%', background: DEPT_COLORS[d.service] }} />
                        <span className="font-bold text-white text-sm">{d.name}</span>
                      </div>
                      <Badge label="DEMO" type="demo" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-800 rounded-lg p-2">
                        <div className="text-sm font-bold text-blue-400">{d.drivers_demo.toLocaleString()}</div>
                        <div className="text-[8px] text-slate-500">Chauffeurs</div>
                      </div>
                      <div className="bg-slate-800 rounded-lg p-2">
                        <div className="text-sm font-bold text-amber-400">{d.service}</div>
                        <div className="text-[8px] text-slate-500">Service</div>
                      </div>
                      <div className="bg-slate-800 rounded-lg p-2">
                        <div className="text-sm font-bold text-green-400">{d.active ? '✅' : '❌'}</div>
                        <div className="text-[8px] text-slate-500">Actif</div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* CHAUFFEURS */}
            {tab === 'drivers' && (
              <>
                <Section title="Chauffeurs enregistrés (DB)">
                  <InfoRow label="Total (driver_provider_accounts DB)" value={String(k?.drivers_db ?? 0)} />
                  <InfoRow label="Total SYNTHETIC_DEMO" value={String(k?.drivers_demo ?? 0)} badge="demo" />
                  <InfoRow label="Hedi Bennis" value="driver_id: 4c4a0130 — DEMO" badge="demo" />
                </Section>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-700">
                  <p className="text-[9px] text-slate-500">
                    Les données nominatives sont SYNTHETIC_DEMO.
                    Jamais présentées comme liste réelle fournie par Uber.
                    driver_id: 4c4a0130 (Hedi Bennis) apparaît dans ENT-UBER-DEMO.
                  </p>
                </div>
              </>
            )}

            {/* VÉHICULES */}
            {tab === 'vehicles' && (
              <Section title="Véhicules (DB)">
                <InfoRow label="Total véhicules (DB)" value={String(k?.vehicles_db ?? 0)} />
                <InfoRow label="Source" value="Table vehicles — Supabase" />
                <InfoRow label="Données nominatives" value="SYNTHETIC_DEMO" badge="demo" />
              </Section>
            )}

            {/* TAXIMÈTRE */}
            {tab === 'taximeter' && (
              <Section title="Activité taximètre (Uber Taxi/Rides)">
                <InfoRow label="Courses (taxi_trips DB)" value={String(k?.trips_db ?? 0)} />
                <InfoRow label="TPS perçue / course" value="Uber = répondant fiscal — Revenu QC" badge="verified" />
                <InfoRow label="Tarifs" value="CTQ 2024 — Prise en charge 3,50$ / 1,85$/km" badge="verified" />
                <InfoRow label="SEV 2e génération" value="Requis depuis jan. 2026" badge="verified" />
              </Section>
            )}

            {/* ACTIVITÉS */}
            {tab === 'activities' && (
              <Section title="Activités (revenue_ledger DB)">
                <InfoRow label="Entrées revenue_ledger" value={String(k?.activities_db ?? 0)} />
                <InfoRow label="Source: UBER" value="source_type = UBER" />
                <InfoRow label="Rides + Eats + Grocery + Courier" value="Toutes activités" badge="demo" />
              </Section>
            )}

            {/* TRANSACTIONS */}
            {tab === 'transactions' && (
              <Section title="Transactions">
                <InfoRow label="Revenus bruts totaux" value={money(k?.gross_revenue ?? 0)} />
                <InfoRow label="Revenus nets" value={money(k?.net_revenue ?? 0)} />
                <InfoRow label="Frais plateforme" value={money(k?.fees ?? 0)} badge="demo" />
                <InfoRow label="Pourboires" value={money(k?.tips ?? 0)} badge="demo" />
                <InfoRow label="Cohérence" value="Single source: revenue_ledger" />
              </Section>
            )}

            {/* REVENUS */}
            {tab === 'revenue' && (
              <>
                <Section title="Revenus (revenue_ledger — SYNTHETIC_DEMO)">
                  <InfoRow label="Revenus bruts" value={money(k?.gross_revenue ?? 0)} badge="demo" />
                  <InfoRow label="Revenus nets" value={money(k?.net_revenue ?? 0)} badge="demo" />
                  <InfoRow label="Frais" value={money(k?.fees ?? 0)} badge="demo" />
                  <InfoRow label="Pourboires" value={money(k?.tips ?? 0)} badge="demo" />
                </Section>
                <Section title="Revenus internes Uber (non disponibles)">
                  <InfoRow label="Chiffre d'affaires Uber QC 2024" value="PRIVATE_NOT_AVAILABLE" badge="private" />
                  <InfoRow label="Impact économique QC 2024" value="1,9G$ (Uber/Public First)" badge="verified" />
                </Section>
              </>
            )}

            {/* TPS/TVQ */}
            {tab === 'taxes' && (
              <Section title="TPS/TVQ — Estimation SYNTHETIC_DEMO">
                <InfoRow label="TPS estimée (5%)" value={money(k?.tps_demo ?? 0)} badge="demo" />
                <InfoRow label="TVQ estimée (9,975%)" value={money(k?.tvq_demo ?? 0)} badge="demo" />
                <InfoRow label="Mécanisme" value="Uber = répondant fiscal Revenu QC" badge="verified" />
                <InfoRow label="Source" value="Revenu Québec — ententes numériques" badge="verified" />
                <InfoRow label="Données réelles" value="PRIVATE_NOT_AVAILABLE" badge="private" />
              </Section>
            )}

            {/* DÉCLARATIONS */}
            {tab === 'declarations' && (
              <Section title="Déclarations fiscales (tax_filings DB)">
                <InfoRow label="Total (DB)" value={String(k?.declarations_db ?? 0)} />
                <InfoRow label="Statut" value="SYNTHETIC_DEMO" badge="demo" />
                <InfoRow label="Gateway mode" value="SIMULATION" />
                <InfoRow label="Transmission réelle" value="DEMO — Aucune transmission officielle" badge="demo" />
              </Section>
            )}

            {/* PAIEMENTS */}
            {tab === 'payments' && (
              <Section title="Paiements">
                <InfoRow label="Paiements enregistrés" value={String(k?.payments_demo ?? 0)} badge="demo" />
                <InfoRow label="Statut" value="SYNTHETIC_DEMO — Aucun virement réel" badge="demo" />
              </Section>
            )}

            {/* DOCUMENTS */}
            {tab === 'documents' && (
              <Section title="Documents (DB)">
                <InfoRow label="Total documents (DB)" value={String(k?.documents_db ?? 0)} />
                <InfoRow label="Licences" value="TO_BE_VERIFIED" badge="demo" />
                <InfoRow label="Assurance" value="TO_BE_VERIFIED" badge="demo" />
              </Section>
            )}

            {/* CONNEXIONS GOV */}
            {tab === 'gov_connect' && (
              <>
                <Section title="Connexions gouvernementales">
                  <InfoRow label="Revenu Québec" value="DEMO — Aucune connexion réelle active" badge="demo" />
                  <InfoRow label="SAAQ" value="DEMO" badge="demo" />
                  <InfoRow label="CTQ" value="DEMO" badge="demo" />
                  <InfoRow label="Registraire des entreprises" value="DEMO" badge="demo" />
                </Section>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-700">
                  <p className="text-[9px] text-slate-500">
                    Government Integration Layer — Architecture prévue.
                    Aucune intégration réelle sans autorisation officielle des autorités québécoises.
                  </p>
                </div>
              </>
            )}

            {/* API */}
            {tab === 'api' && (
              <Section title="API — Integration Center">
                <InfoRow label="API Status" value={k?.api_connected ? 'CONFIGURED' : 'DEMO'} badge="demo" />
                <InfoRow label="Provider" value={String(data.supabase['providers'] ? 'providers table' : 'DEMO')} />
                <InfoRow label="Last Event" value="N/A — DEMO" badge="demo" />
                <InfoRow label="Events Today" value="0 — DEMO" badge="demo" />
                <InfoRow label="Failed Events" value="0" />
                <InfoRow label="Retry Queue" value="0" />
                <InfoRow label="Idempotency" value="Activé" />
                <InfoRow label="Data Quality" value="85% DEMO" badge="demo" />
              </Section>
            )}

            {/* WEBHOOKS */}
            {tab === 'webhooks' && (
              <Section title="Webhooks">
                <InfoRow label="Webhook Status" value={k?.webhook_active ? 'ACTIF' : 'INACTIF — DEMO'} badge="demo" />
                <InfoRow label="Events" value="0 — DEMO" badge="demo" />
                <InfoRow label="Last Sync" value="N/A" badge="demo" />
              </Section>
            )}

            {/* RÉCONCILIATION */}
            {tab === 'reconcile' && (
              <Section title="Réconciliation">
                <InfoRow label="Revenus TAXIMETER.GOV" value={money(k?.gross_revenue ?? 0)} badge="demo" />
                <InfoRow label="TPS calculée" value={money(k?.tps_demo ?? 0)} badge="demo" />
                <InfoRow label="TVQ calculée" value={money(k?.tvq_demo ?? 0)} badge="demo" />
                <InfoRow label="Mismatch" value="0 — Cohérence single source" />
                <InfoRow label="Note" value="Une différence n'est jamais automatiquement une fraude" />
              </Section>
            )}

            {/* ANALYTICS */}
            {tab === 'analytics' && (
              <Section title="Analytics — SYNTHETIC_DEMO">
                <InfoRow label="Revenus / département" value="Voir onglet Départements" />
                <InfoRow label="Activités / mois" value="Voir revenue_ledger" />
                <InfoRow label="Chauffeurs actifs" value={String(k?.drivers_demo ?? 0)} badge="demo" />
                <InfoRow label="Courses" value={String(k?.trips_db ?? 0)} />
                <InfoRow label="Source" value="Single source — Supabase" />
              </Section>
            )}

            {/* RAPPORTS */}
            {tab === 'reports' && (
              <Section title="Rapports">
                <InfoRow label="Rapport fiscal Q3 2026" value="SYNTHETIC_DEMO" badge="demo" />
                <InfoRow label="Rapport activités" value="Disponible via analytics" badge="demo" />
                <InfoRow label="Rapport chauffeurs" value="SYNTHETIC_DEMO" badge="demo" />
              </Section>
            )}

            {/* CONFORMITÉ */}
            {tab === 'compliance' && (
              <Section title="Conformité">
                <InfoRow label="Score global" value={`${k?.compliance_score ?? 0}% — DEMO`} badge="demo" />
                <InfoRow label="Licences" value="TO_BE_VERIFIED" badge="demo" />
                <InfoRow label="Assurance" value="TO_BE_VERIFIED" badge="demo" />
                <InfoRow label="Enregistrement" value="TO_BE_VERIFIED" badge="demo" />
                <InfoRow label="Conformité fiscale" value="Uber = répondant Revenu QC" badge="verified" />
                <InfoRow label="Workers compliance" value="INDEPENDENT_CONTRACTORS — Revenu QC" badge="verified" />
                <InfoRow label="Alertes ouvertes" value={String(k?.alerts_db ?? 0)} />
              </Section>
            )}

            {/* AUDIT */}
            {tab === 'audit' && (
              <Section title="Audit (audit_logs DB)">
                <InfoRow label="Entrées audit (DB)" value={String(k?.audits_db ?? 0)} />
                <InfoRow label="Conservation" value="Tous événements archivés" />
                <InfoRow label="Source" value="audit_logs table — Supabase" />
              </Section>
            )}

            {/* SÉCURITÉ */}
            {tab === 'security' && (
              <Section title="Sécurité">
                <InfoRow label="Accès gouvernemental" value="Rôle GOV requis" />
                <InfoRow label="Données sensibles" value="PRIVATE_NOT_AVAILABLE protégé" badge="private" />
                <InfoRow label="Logs d'accès" value="audit_logs activé" />
                <InfoRow label="Chiffrement" value="Supabase RLS + SERVICE_ROLE" />
              </Section>
            )}

            {/* NOTIFICATIONS */}
            {tab === 'notifications' && (
              <Section title="Notifications (DB)">
                <InfoRow label="Total notifications (DB)" value={String(k?.alerts_db ?? 0)} />
                <InfoRow label="Non lues" value="— DEMO" badge="demo" />
              </Section>
            )}

            {/* INTELLIGENCE */}
            {tab === 'intelligence' && (
              <Section title="Intelligence — Architecture future">
                <InfoRow label="Anomaly detection" value="Prévu — Phase future" badge="demo" />
                <InfoRow label="Pattern analysis" value="Prévu" badge="demo" />
                <InfoRow label="Fraud signals" value="Prévu" badge="demo" />
                <InfoRow label="Note" value="Une anomalie n'est pas une preuve de fraude" />
              </Section>
            )}

            {/* COMMUNICATION GOV */}
            {tab === 'gov_comm' && (
              <>
                <Section title="Communication gouvernementale">
                  <InfoRow label="Revenu Québec" value="DEMO — MODE 1: Redirection" badge="demo" />
                  <InfoRow label="SAAQ" value="DEMO" badge="demo" />
                  <InfoRow label="Registraire QC" value="DEMO" badge="demo" />
                  <InfoRow label="Mode actuel" value="SIMULATION — Aucune transmission réelle" badge="demo" />
                </Section>
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <p className="text-[9px] text-blue-400">
                    TAXIMETER.GOV ne transmet aucune donnée réelle à des tiers gouvernementaux
                    sans autorisation officielle. Mode pilote uniquement.
                  </p>
                </div>
              </>
            )}

            {/* Footer source */}
            <div className="mt-4 p-3 rounded-xl bg-slate-900 border border-slate-700">
              <div className="text-[8px] text-slate-500 space-y-1">
                <div>✓ PUBLIC_VERIFIED: Impact éco 1,9G$ QC 2024 (Uber/Public First déc. 2025)</div>
                <div>✓ PUBLIC_VERIFIED: Statut fiscal — Revenu Québec (chauffeurs = travailleurs autonomes)</div>
                <div>⚠ SYNTHETIC_DEMO: Revenus, chauffeurs, transactions, TPS/TVQ estimées</div>
                <div>🔒 PRIVATE_NOT_AVAILABLE: Revenus internes Uber, NEQ, liste nominative chauffeurs</div>
                <div>Enterprise ID: {data.enterprise_id} · TAXIMETER.GOV MODE PILOTE</div>
              </div>
            </div>
          </div>
        </>
      )}
    </AppShell>
  )
}
