'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/ui'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Building, CheckCircle, XCircle, HelpCircle, Filter } from 'lucide-react'
import { ENTERPRISES, CATEGORY_LABELS, WORKER_MODEL_LABELS, type BusinessCategory } from './data'

const CATEGORIES: BusinessCategory[] = [
  'PLATFORM','TAXI_TRANSPORT','DELIVERY_COURIER','AUTO_PARTS',
  'MEDICAL_PHARMA','TRUCKING','LOGISTICS_3PL','DISTRIBUTION_B2B','TO_QUALIFY'
]

const WORKER_COLORS: Record<string,string> = {
  INDEPENDENT_CONTRACTORS: 'bg-blue-500/10 text-blue-400',
  EMPLOYEES:               'bg-green-500/10 text-green-400',
  MIXED:                   'bg-purple-500/10 text-purple-400',
  SUBCONTRACTORS:          'bg-amber-500/10 text-amber-400',
  TO_BE_VERIFIED:          'bg-orange-500/10 text-orange-400',
  UNKNOWN:                 'bg-slate-500/10 text-slate-400',
}

function money(n: number) {
  if (n >= 1000000) return `${(n/1000000).toFixed(1)}M$`
  if (n >= 1000) return `${(n/1000).toFixed(0)}k$`
  return `${n}$`
}

export default function EnterprisesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<BusinessCategory | 'ALL'>('ALL')

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: ENTERPRISES.length }
    for (const cat of CATEGORIES) {
      c[cat] = ENTERPRISES.filter(e => e.category === cat).length
    }
    return c
  }, [])

  const filtered = useMemo(() => {
    return ENTERPRISES.filter(e => {
      const matchCat  = activeTab === 'ALL' || e.category === activeTab
      const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.services.some(s => s.toLowerCase().includes(search.toLowerCase()))
      return matchCat && matchSearch
    })
  }, [search, activeTab])

  // KPIs
  const kpis = [
    { label:'Total', value: ENTERPRISES.length, color:'text-white', icon:'🏢' },
    { label:'Plateformes', value: counts['PLATFORM'] ?? 0, color:'text-blue-400', icon:'📱' },
    { label:'Taxi/Transport', value: (counts['TAXI_TRANSPORT'] ?? 0), color:'text-amber-400', icon:'🚕' },
    { label:'Livraison', value: counts['DELIVERY_COURIER'] ?? 0, color:'text-green-400', icon:'📦' },
    { label:'Camionnage', value: counts['TRUCKING'] ?? 0, color:'text-purple-400', icon:'🚛' },
    { label:'Logistique', value: counts['LOGISTICS_3PL'] ?? 0, color:'text-cyan-400', icon:'🏭' },
    { label:'Distribution', value: counts['DISTRIBUTION_B2B'] ?? 0, color:'text-orange-400', icon:'🏢' },
    { label:'À qualifier', value: counts['TO_QUALIFY'] ?? 0, color:'text-red-400', icon:'❓' },
    { label:'API actives', value: ENTERPRISES.filter(e => e.api_connected).length, color:'text-emerald-400', icon:'⚡' },
  ]

  return (
    <AppShell>
      <PageHeader title="Listing — Entreprises" subtitle={`Registre gouvernemental DEMO · ${ENTERPRISES.length} entreprises`} />

      {/* Banner DEMO */}
      <div className="mx-4 mb-4 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
        <span className="text-amber-400 text-xs font-bold">⚠️ DEMO / PILOT</span>
        <span className="text-amber-400/70 text-xs">Données synthétiques — non gouvernementales réelles</span>
      </div>

      {/* KPIs */}
      <div className="px-4 mb-4 grid grid-cols-3 gap-2">
        {kpis.map(k => (
          <div key={k.label} className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
            <div className="text-lg mb-0.5">{k.icon}</div>
            <div className={`text-xl font-black ${k.color}`}>{k.value}</div>
            <div className="text-[9px] text-slate-500 leading-tight">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800">
          <Search size={14} className="text-slate-500 shrink-0" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, service, catégorie…"
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none"
          />
          {search && <button onClick={() => setSearch('')} className="text-slate-500 text-xs">✕</button>}
        </div>
      </div>

      {/* Tabs filtres */}
      <div className="px-4 mb-4 flex gap-1.5 overflow-x-auto pb-1">
        <button onClick={() => setActiveTab('ALL')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'ALL' ? 'bg-qc-blue text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
          Toutes ({ENTERPRISES.length})
        </button>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveTab(cat)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === cat ? 'bg-qc-blue text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
            {CATEGORY_LABELS[cat]} ({counts[cat] ?? 0})
          </button>
        ))}
      </div>

      {/* Résultats */}
      <div className="px-4 mb-2 text-xs text-slate-500">{filtered.length} entreprise(s)</div>

      {/* Table */}
      <div className="px-4 pb-8 space-y-2">
        {filtered.map(e => (
          <div key={e.id}
            onClick={() => router.push(`/listing/enterprises/${e.id}`)}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-pointer hover:border-qc-blue/40 transition-all">
            <div className="flex items-start justify-between gap-3">
              {/* Gauche */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg shrink-0">
                  {CATEGORY_LABELS[e.category]?.split(' ')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm">{e.name}</span>
                    {e.is_demo && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold border border-amber-500/20">DEMO</span>}
                    {e.status === 'TO_BE_VERIFIED' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 font-bold">À VÉRIFIER</span>}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{CATEGORY_LABELS[e.category]}</div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {e.services.slice(0,3).map(s => (
                      <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">{s}</span>
                    ))}
                    {e.services.length > 3 && <span className="text-[9px] text-slate-500">+{e.services.length-3}</span>}
                  </div>
                </div>
              </div>

              {/* Droite */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`text-[9px] px-2 py-1 rounded-md font-semibold ${WORKER_COLORS[e.worker_model] ?? 'bg-slate-700 text-slate-400'}`}>
                  {WORKER_MODEL_LABELS[e.worker_model]}
                </span>
                <div className="flex items-center gap-2 text-[9px]">
                  {e.api_connected
                    ? <span className="flex items-center gap-0.5 text-green-400"><CheckCircle size={10} />API</span>
                    : <span className="flex items-center gap-0.5 text-slate-600"><XCircle size={10} />API</span>}
                  {e.webhook_active
                    ? <span className="flex items-center gap-0.5 text-green-400"><CheckCircle size={10} />WH</span>
                    : <span className="flex items-center gap-0.5 text-slate-600"><XCircle size={10} />WH</span>}
                </div>
                {e.drivers_count != null && (
                  <span className="text-[9px] text-slate-400">{e.drivers_count.toLocaleString()} chauffeurs</span>
                )}
                {e.revenue_demo != null && (
                  <span className="text-[9px] text-amber-400">{money(e.revenue_demo)} DEMO</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  )
}
