'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/ui'
import { useState } from 'react'
import { CheckCircle, Clock, X, ChevronDown, ChevronUp, Download, ExternalLink } from 'lucide-react'

const TPS = 0.05; const TVQ = 0.09975
const r2 = (n: number) => Math.round(n * 100) / 100
const money = (n: number) => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n)
const moneyEx = (n: number) => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n)
const fmtDate = (s: string) => new Intl.DateTimeFormat('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(s))
const PILOT = 'PILOTE · DONNÉES SYNTHÉTIQUES · AUCUNE TRANSMISSION OFFICIELLE À REVENU QUÉBEC'

// ── Données provinciales QC ────────────────────────────────────
const PROVINCES_STATS = {
  chauffeurs: 9847, periodes: 3,
  totalBrut: 614_350_000, // 3 trimestres
  totalTPS:   30_717_500,
  totalTVQ:   61_281_113,
  solde:       85_661_010,
}

const DECLARATIONS = [
  {
    id: 'DECL-QC-2026-Q3', ref: 'DEMO-RQ-Q3-2026-QC-PILOTE',
    period: 'Q3 2026', start: '2026-07-01', end: '2026-09-30', due: '2026-10-31',
    status: 'DRAFT', type: 'COMBINED_TPS_TVQ',
    chauffeurs: 9847, brut: 224_850_000,
    tpsCollected: 11_242_500, tpsCredits: 898_000, tpsBalance: 10_344_500,
    tvqCollected: 22_428_938, tvqCredits: 1_787_750, tvqBalance: 20_641_188,
    solde: 30_985_688, isEstimate: true,
    taxi: 89_940_000, rideshare: 78_247_500, delivery: 56_662_500,
    tips: 4_497_000, fees: 15_739_500,
    preparedAt: null, submittedAt: null, acceptedAt: null,
    note: 'Déclaration Q3 2026 en préparation. Données provisoires basées sur le Revenue Ledger pilote.',
  },
  {
    id: 'DECL-QC-2026-Q2', ref: 'DEMO-RQ-Q2-2026-QC-PILOTE',
    period: 'Q2 2026', start: '2026-04-01', end: '2026-06-30', due: '2026-07-31',
    status: 'ACCEPTED', type: 'COMBINED_TPS_TVQ',
    chauffeurs: 9614, brut: 203_500_000,
    tpsCollected: 10_175_000, tpsCredits: 812_500, tpsBalance: 9_362_500,
    tvqCollected: 20_274_263, tvqCredits: 1_618_750, tvqBalance: 18_655_513,
    solde: 28_018_013, isEstimate: false,
    taxi: 81_230_000, rideshare: 70_850_000, delivery: 51_420_000,
    tips: 4_070_000, fees: 14_245_000,
    preparedAt: '2026-07-25T09:00:00Z', submittedAt: '2026-07-29T10:30:00Z', acceptedAt: '2026-07-29T14:22:00Z',
    note: 'Déclaration Q2 2026 acceptée par Revenu Québec (simulation). Toutes les composantes réconciliées.',
  },
  {
    id: 'DECL-QC-2026-Q1', ref: 'DEMO-RQ-Q1-2026-QC-PILOTE',
    period: 'Q1 2026', start: '2026-01-01', end: '2026-03-31', due: '2026-04-30',
    status: 'ACCEPTED', type: 'COMBINED_TPS_TVQ',
    chauffeurs: 9123, brut: 186_000_000,
    tpsCollected: 9_300_000, tpsCredits: 742_000, tpsBalance: 8_558_000,
    tvqCollected: 18_553_500, tvqCredits: 1_478_210, tvqBalance: 17_075_290,
    solde: 25_633_290, isEstimate: false,
    taxi: 74_180_000, rideshare: 64_620_000, delivery: 47_200_000,
    tips: 3_720_000, fees: 13_020_000,
    preparedAt: '2026-04-24T09:00:00Z', submittedAt: '2026-04-28T11:00:00Z', acceptedAt: '2026-04-28T15:10:00Z',
    note: 'Déclaration Q1 2026 acceptée (simulation). Premier trimestre complet sous TAXIMETER.GOV pilote.',
  },
]

const STATUS_CONF: Record<string, { label: string; color: string; bg: string; bdr: string; icon: typeof CheckCircle }> = {
  DRAFT:    { label: 'Brouillon',  color: '#94A3B8', bg: 'rgba(148,163,184,0.10)', bdr: 'rgba(148,163,184,0.25)', icon: Clock },
  PREPARED: { label: 'Préparée',   color: '#003DA5', bg: 'rgba(0,61,165,0.10)',    bdr: 'rgba(0,61,165,0.25)',    icon: Clock },
  SUBMITTED:{ label: 'Soumise',    color: '#7C3AED', bg: 'rgba(124,58,237,0.12)',  bdr: 'rgba(124,58,237,0.30)', icon: Clock },
  ACCEPTED: { label: 'Acceptée',   color: '#059669', bg: 'rgba(5,150,105,0.12)',   bdr: 'rgba(5,150,105,0.30)',  icon: CheckCircle },
  REJECTED: { label: 'Rejetée',    color: '#DC2626', bg: 'rgba(220,38,38,0.10)',   bdr: 'rgba(220,38,38,0.25)', icon: X },
}

const PIPELINE = [
  { icon: '📊', step: 'Collecte Revenue Ledger',  desc: 'Agrégation de toutes les transactions du trimestre' },
  { icon: '🔍', step: 'Validation & rapprochement', desc: 'Vérification cohérence entre sources fournisseurs et chauffeurs' },
  { icon: '🧮', step: 'Calcul TPS/TVQ',            desc: 'Application des taux (5% + 9,975%) sur base + pourboires' },
  { icon: '💳', step: 'Crédits de taxe (CTI)',     desc: 'Déduction des crédits sur intrants (frais plateforme ~20%)' },
  { icon: '📋', step: 'Préparation déclaration',   desc: 'Génération du formulaire FPZ-500 ou FP-500 (SIMULATION)' },
  { icon: '✅', step: 'Révision gouvernementale',   desc: 'Contrôle administratif TAXIMETER.GOV avant transmission' },
  { icon: '📤', step: 'Transmission Revenu QC',    desc: 'Envoi sécurisé via API Revenu Québec (SIMULATION)' },
  { icon: '🏛️', step: 'Confirmation officielle',   desc: 'Numéro de référence gouvernemental attribué' },
]

export default function DeclarationsPage() {
  const [selected, setSelected] = useState<typeof DECLARATIONS[0] | null>(null)
  const [filter, setFilter] = useState('')

  const filtered = filter ? DECLARATIONS.filter(d => d.status === filter) : DECLARATIONS

  return (
    <AppShell>
      {/* Modal déclaration */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70" onClick={() => setSelected(null)}>
          <div className="w-full max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-t-2xl p-5" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded bg-slate-600 mx-auto mb-4" />
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-base font-bold text-white font-mono">{selected.id}</div>
                <div className="text-[10px] text-slate-400 mt-1">{selected.type} · Province QC · {selected.period}</div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-xl bg-slate-800 border border-slate-600 cursor-pointer">
                <X size={14} className="text-slate-400" />
              </button>
            </div>

            <div className="mb-3 p-2 rounded-lg text-[10px] text-amber-400 bg-amber-500/8 border border-amber-500/20">{PILOT}</div>

            {/* Statut */}
            {(() => {
              const sc = STATUS_CONF[selected.status] ?? STATUS_CONF['DRAFT']!
              return (
                <div className="flex items-center gap-3 p-3 rounded-xl mb-4" style={{ background: sc.bg, border: `1.5px solid ${sc.bdr}` }}>
                  <sc.icon size={16} style={{ color: sc.color }} />
                  <div>
                    <div className="text-xs font-bold" style={{ color: sc.color }}>{sc.label}</div>
                    {selected.ref && <div className="text-[9px] text-slate-400 font-mono mt-0.5">{selected.ref}</div>}
                  </div>
                  {selected.isEstimate && <span className="ml-auto text-[8px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-bold">ESTIMÉ</span>}
                </div>
              )
            })()}

            {/* Résumé financier */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-3">
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-3">Résumé fiscal — Province QC</div>
              <div className="space-y-2">
                {[
                  { l: 'Chauffeurs déclarants', v: selected.chauffeurs.toLocaleString('fr-CA'), c: 'text-blue-400' },
                  { l: 'Revenus bruts (base)', v: money(selected.brut), c: 'text-white' },
                  { l: '+ Pourboires taxables', v: money(selected.tips), c: '#F5C842' },
                  { l: '= Base taxable totale', v: money(selected.brut + selected.tips), c: 'text-green-400' },
                  { l: `TPS collectée (5%)`, v: money(selected.tpsCollected), c: 'text-purple-400' },
                  { l: `TVQ collectée (9,975%)`, v: money(selected.tvqCollected), c: 'text-purple-400' },
                  { l: `Crédits TPS (CTI)`, v: `− ${money(selected.tpsCredits)}`, c: 'text-slate-400' },
                  { l: `Crédits TVQ (CTI)`, v: `− ${money(selected.tvqCredits)}`, c: 'text-slate-400' },
                  { l: 'TPS nette à remettre', v: money(selected.tpsBalance), c: 'text-purple-400' },
                  { l: 'TVQ nette à remettre', v: money(selected.tvqBalance), c: 'text-purple-400' },
                  { l: 'SOLDE TOTAL À REMETTRE', v: money(selected.solde), c: 'text-green-300' },
                ].map((r, i) => (
                  <div key={r.l} className={`flex justify-between py-1.5 ${i > 0 ? 'border-t border-slate-700' : ''}`}>
                    <span className="text-[10px] text-slate-400">{r.l}</span>
                    <span className="text-[10px] font-bold" style={typeof r.c === 'string' && r.c.startsWith('#') ? { color: r.c } : {}}
                      className={`text-[10px] font-bold ${!r.c.startsWith('#') ? r.c : ''}`}>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Répartition par source */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { icon: '🚕', l: 'Taxi', v: selected.taxi },
                { icon: '🚗', l: 'Rideshare', v: selected.rideshare },
                { icon: '📦', l: 'Livraison', v: selected.delivery },
              ].map(r => (
                <div key={r.l} className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-center">
                  <div className="text-xl mb-1">{r.icon}</div>
                  <div className="text-[9px] text-slate-400">{r.l}</div>
                  <div className="text-xs font-bold text-white mt-1">{money(r.v)}</div>
                </div>
              ))}
            </div>

            {/* Timeline */}
            {(selected.preparedAt || selected.submittedAt || selected.acceptedAt) && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 mb-3">
                <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Chronologie</div>
                {[
                  { l: 'Préparée', v: selected.preparedAt },
                  { l: 'Soumise', v: selected.submittedAt },
                  { l: 'Acceptée', v: selected.acceptedAt },
                ].filter(r => r.v).map(r => (
                  <div key={r.l} className="flex justify-between py-1.5 border-b border-slate-700 last:border-0">
                    <span className="text-[10px] text-slate-400">{r.l}</span>
                    <span className="text-[10px] text-white font-mono">{fmtDate(r.v!)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Pipeline */}
            <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Pipeline de traitement</div>
            <div className="space-y-1.5 mb-4">
              {PIPELINE.map((p, i) => {
                const stepsOk = selected.status === 'ACCEPTED' ? 8 : selected.status === 'SUBMITTED' ? 6 : selected.status === 'PREPARED' ? 4 : 2
                const done = i < stepsOk
                return (
                  <div key={p.step} className={`flex items-start gap-2.5 p-2 rounded-lg ${done ? 'bg-green-500/8 border border-green-500/15' : 'bg-slate-800/50 border border-slate-700/50'}`}>
                    <span className="text-sm shrink-0">{p.icon}</span>
                    <div className="flex-1">
                      <div className={`text-[10px] font-bold ${done ? 'text-green-400' : 'text-slate-500'}`}>{p.step}</div>
                      <div className="text-[9px] text-slate-500">{p.desc}</div>
                    </div>
                    {done && <CheckCircle size={11} className="text-green-400 shrink-0 mt-0.5" />}
                  </div>
                )
              })}
            </div>

            <div className="p-2.5 bg-amber-500/8 border border-amber-500/20 rounded-lg">
              <div className="text-[9px] text-amber-400 leading-relaxed">{selected.note}</div>
            </div>
          </div>
        </div>
      )}

      <PageHeader title="Déclarations TPS/TVQ" subtitle="Province Québec · Centre fiscal gouvernemental · TAXIMETER.GOV" />

      <div className="px-4 md:px-6 pb-8 space-y-4">
        <div className="p-2.5 rounded-xl text-[10px] font-bold text-amber-400 bg-amber-500/8 border border-amber-500/20">{PILOT}</div>

        {/* Note légale */}
        <div className="p-4 bg-blue-500/8 border border-blue-500/20 rounded-xl">
          <div className="text-xs font-bold text-blue-400 mb-1">🏛️ Centre de déclarations — Province Québec</div>
          <div className="text-[10px] text-slate-300 leading-relaxed">
            Ce module consolide les données TPS/TVQ de l'ensemble des chauffeurs et travailleurs de plateformes actifs au Québec.
            Les déclarations sont générées à partir du Revenue Ledger universel et soumises à Revenu Québec via le portail gouvernemental
            <span className="text-amber-400 font-bold"> (SIMULATION — aucune transmission réelle)</span>.
          </div>
        </div>

        {/* KPI provinciaux */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { l: 'Chauffeurs inscrits', v: PROVINCES_STATS.chauffeurs.toLocaleString('fr-CA'), c: 'text-blue-400', bg: 'bg-blue-500/10' },
            { l: 'Revenus bruts (3T)', v: money(PROVINCES_STATS.totalBrut), c: 'text-green-400', bg: 'bg-green-500/10' },
            { l: 'TPS (3T)', v: money(PROVINCES_STATS.totalTPS), c: 'text-purple-400', bg: 'bg-purple-500/10' },
            { l: 'TVQ (3T)', v: money(PROVINCES_STATS.totalTVQ), c: 'text-purple-400', bg: 'bg-purple-500/10' },
            { l: 'Solde à remettre (3T)', v: money(PROVINCES_STATS.solde), c: 'text-green-300', bg: 'bg-green-500/8' },
            { l: 'Déclarations acceptées', v: '2 / 3', c: 'text-green-400', bg: 'bg-green-500/10' },
            { l: 'En préparation', v: '1', c: 'text-amber-400', bg: 'bg-amber-500/10' },
            { l: 'Taux de conformité', v: '98,7 %', c: 'text-blue-400', bg: 'bg-blue-500/10' },
          ].map(s => (
            <div key={s.l} className={`${s.bg} rounded-xl p-3 border border-white/5 text-center`}>
              <div className={`text-sm font-black ${s.c}`}>{s.v}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Pipeline résumé */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase mb-3">Workflow de déclaration</div>
          <div className="flex flex-wrap gap-1 text-[9px]">
            {PIPELINE.map((p, i) => (
              <span key={p.step} className="flex items-center gap-1">
                <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-300 whitespace-nowrap">{p.icon} {p.step}</span>
                {i < PIPELINE.length - 1 && <span className="text-slate-600">→</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-2">
          {[{ k: '', l: `Toutes (${DECLARATIONS.length})` }, { k: 'DRAFT', l: 'Brouillon' }, { k: 'ACCEPTED', l: 'Acceptées' }].map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)} className="px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all" style={{
              background: filter === f.k ? '#003DA5' : 'rgba(255,255,255,0.04)',
              color: filter === f.k ? 'white' : '#94A3B8',
              borderColor: filter === f.k ? '#003DA5' : 'rgba(255,255,255,0.08)',
            }}>{f.l}</button>
          ))}
        </div>

        {/* Liste déclarations */}
        <div className="space-y-3">
          {filtered.map(decl => {
            const sc = STATUS_CONF[decl.status] ?? STATUS_CONF['DRAFT']!
            return (
              <div key={decl.id} onClick={() => setSelected(decl)}
                className="bg-slate-900 border border-slate-700 rounded-xl p-4 cursor-pointer hover:border-qc-blue transition-colors"
                style={{ borderLeft: `4px solid ${sc.bdr}` }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center text-xl shrink-0">🧾</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-bold text-white font-mono">{decl.id}</span>
                      <span className="text-[8px] px-2 py-0.5 rounded-full font-bold" style={{ color: sc.color, background: sc.bg }}>{sc.label}</span>
                      {decl.isEstimate && <span className="text-[8px] text-amber-400 bg-amber-500/10 px-1.5 rounded-full font-bold">ESTIMÉ</span>}
                    </div>
                    <div className="text-[10px] text-slate-400 mb-2">
                      {decl.period} · {fmtDate(decl.start)} → {fmtDate(decl.end)} · Échéance: {fmtDate(decl.due)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        { l: 'Revenus bruts', v: money(decl.brut), c: 'text-white' },
                        { l: 'TPS', v: money(decl.tpsBalance), c: 'text-purple-400' },
                        { l: 'TVQ', v: money(decl.tvqBalance), c: 'text-purple-400' },
                        { l: 'Solde à remettre', v: money(decl.solde), c: 'text-green-400' },
                      ].map(r => (
                        <div key={r.l} className="bg-slate-800 rounded-lg p-2 border border-slate-700">
                          <div className="text-[8px] text-slate-400 uppercase">{r.l}</div>
                          <div className={`text-xs font-bold mt-0.5 ${r.c}`}>{r.v}</div>
                        </div>
                      ))}
                    </div>
                    {decl.ref && <div className="text-[9px] text-slate-500 font-mono mt-2">Réf: {decl.ref}</div>}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <sc.icon size={18} style={{ color: sc.color }} />
                    <span className="text-[9px] text-slate-500">{decl.chauffeurs.toLocaleString('fr-CA')} chauf.</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
