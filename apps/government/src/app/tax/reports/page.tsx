'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/ui'
import { useState } from 'react'
import { Download, Eye, X, BarChart2, TrendingUp, FileText } from 'lucide-react'

const money = (n: number) => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n)
const PILOT = 'PILOTE · DONNÉES SYNTHÉTIQUES · AUCUNE INTÉGRATION REVENU QUÉBEC ACTIVE'

// ── Données provinciales 3 trimestres ──────────────────────────
const QUARTERLY = [
  { period: 'Q1 2026', brut: 186_000_000, tps: 8_558_000, tvq: 17_075_290, solde: 25_633_290, chauf: 9123, status: 'FINAL',    color: '#059669' },
  { period: 'Q2 2026', brut: 203_500_000, tps: 9_362_500, tvq: 18_655_513, solde: 28_018_013, chauf: 9614, status: 'FINAL',    color: '#059669' },
  { period: 'Q3 2026', brut: 224_850_000, tps: 10_344_500,tvq: 20_641_188, solde: 30_985_688, chauf: 9847, status: 'ESTIMÉ',   color: '#B45309' },
]

const MONTHLY = [
  { month: 'Janv 2026',  brut: 58_200_000, tps: 2_910_000, tvq: 5_806_050, chauf: 8_940, provider: { taxi: 43, rideshare: 34, delivery: 23 } },
  { month: 'Févr 2026',  brut: 61_400_000, tps: 3_070_000, tvq: 6_124_650, chauf: 9_010, provider: { taxi: 42, rideshare: 35, delivery: 23 } },
  { month: 'Mars 2026',  brut: 66_400_000, tps: 3_320_000, tvq: 6_622_200, chauf: 9_150, provider: { taxi: 41, rideshare: 36, delivery: 23 } },
  { month: 'Avr 2026',   brut: 64_800_000, tps: 3_240_000, tvq: 6_461_400, chauf: 9_320, provider: { taxi: 40, rideshare: 37, delivery: 23 } },
  { month: 'Mai 2026',   brut: 68_200_000, tps: 3_410_000, tvq: 6_801_450, chauf: 9_480, provider: { taxi: 40, rideshare: 37, delivery: 23 } },
  { month: 'Juin 2026',  brut: 70_500_000, tps: 3_525_000, tvq: 7_029_488, chauf: 9_614, provider: { taxi: 39, rideshare: 38, delivery: 23 } },
  { month: 'Juil 2026',  brut: 71_400_000, tps: 3_570_000, tvq: 7_122_150, chauf: 9_680, provider: { taxi: 39, rideshare: 38, delivery: 23 } },
  { month: 'Août 2026',  brut: 76_200_000, tps: 3_810_000, tvq: 7_601_450, chauf: 9_760, provider: { taxi: 38, rideshare: 39, delivery: 23 } },
  { month: 'Sept 2026',  brut: 77_250_000, tps: 3_862_500, tvq: 7_705_744, chauf: 9_847, provider: { taxi: 38, rideshare: 39, delivery: 23 } },
]

const PROVIDERS = [
  { name: 'TAXI',       icon: '🚕', q1: 74_180_000, q2: 81_230_000, q3: 89_940_000, color: '#003DA5', pct: 40 },
  { name: 'UBER',       icon: '⬛', q1: 44_640_000, q2: 48_840_000, q3: 53_964_000, color: '#000000', pct: 24 },
  { name: 'LYFT',       icon: '🟣', q1: 20_000_000, q2: 22_000_000, q3: 24_284_000, color: '#FF00BF', pct: 11 },
  { name: 'DOORDASH',   icon: '🔴', q1: 23_600_000, q2: 25_710_000, q3: 28_331_250, color: '#FF3008', pct: 13 },
  { name: 'INSTACART',  icon: '🟢', q1: 12_400_000, q2: 13_530_000, q3: 14_331_250, color: '#43B02A', pct: 6  },
  { name: 'UBER EATS',  icon: '🟡', q1: 11_180_000, q2: 12_190_000, q3: 14_000_000, color: '#06C167', pct: 6  },
]

const ANOMALIES = [
  { id: 'ANO-2026-Q3-001', type: 'TVQ_VARIANCE',        provider: 'UBER',      period: 'Q3 2026', amount: 2_847_000, severity: 'HIGH',   status: 'OPEN',     desc: 'Écart TVQ entre payload Uber et calcul TAXIMETER.GOV sur 2 847 activités' },
  { id: 'ANO-2026-Q3-002', type: 'MISSING_WEBHOOK',     provider: 'INSTACART', period: 'Q3 2026', amount: 1_415_000, severity: 'HIGH',   status: 'OPEN',     desc: 'Semaine 36 — Webhooks Instacart non reçus · Transactions non réconciliées' },
  { id: 'ANO-2026-Q2-003', type: 'TIP_DISCREPANCY',     provider: 'LYFT',      period: 'Q2 2026', amount: 428_000,  severity: 'MEDIUM', status: 'RESOLVED', desc: 'Pourboires Lyft Q2 — Écart résolu après rapprochement manuel' },
  { id: 'ANO-2026-Q1-004', type: 'SETTLEMENT_DELAY',    provider: 'DOORDASH',  period: 'Q1 2026', amount: 0,        severity: 'LOW',    status: 'RESOLVED', desc: 'Délai règlement DoorDash >7j · Monitoring activé · Résolu' },
]

const REPORTS_LIST = [
  { id: 'RPT-GOV-001', title: 'Rapport fiscal consolidé — Q3 2026',           type: 'FISCAL_QUARTERLY', period: 'Q3 2026', status: 'DRAFT',    records: 9847,   format: 'PDF', size: '4,2 MB', at: '2026-09-17T09:00:00Z' },
  { id: 'RPT-GOV-002', title: 'Rapport fiscal consolidé — Q2 2026',           type: 'FISCAL_QUARTERLY', period: 'Q2 2026', status: 'VALIDATED',records: 9614,   format: 'PDF', size: '3,8 MB', at: '2026-07-30T14:00:00Z' },
  { id: 'RPT-GOV-003', title: 'Rapport fiscal consolidé — Q1 2026',           type: 'FISCAL_QUARTERLY', period: 'Q1 2026', status: 'VALIDATED',records: 9123,   format: 'PDF', size: '3,5 MB', at: '2026-04-29T11:00:00Z' },
  { id: 'RPT-GOV-004', title: 'Rapport fournisseurs — TPS/TVQ par source',    type: 'PROVIDER_FISCAL',  period: 'Q3 2026', status: 'DRAFT',    records: 6,      format: 'CSV', size: '0,8 MB', at: '2026-09-17T08:00:00Z' },
  { id: 'RPT-GOV-005', title: 'Rapport anomalies fiscales — 2026',            type: 'ANOMALY',          period: '2026',    status: 'VALIDATED',records: 4,      format: 'PDF', size: '1,1 MB', at: '2026-09-15T10:00:00Z' },
  { id: 'RPT-GOV-006', title: 'Rapport conformité chauffeurs — Q3 2026',      type: 'COMPLIANCE',       period: 'Q3 2026', status: 'DRAFT',    records: 9847,   format: 'PDF', size: '2,9 MB', at: '2026-09-17T06:00:00Z' },
  { id: 'RPT-GOV-007', title: 'Rapport audit — Transactions pilote',          type: 'AUDIT',            period: 'Q1-Q3 2026',status:'VALIDATED',records: 614_350,format: 'PDF', size: '8,4 MB', at: '2026-09-14T08:00:00Z' },
  { id: 'RPT-GOV-008', title: 'Rapport réconciliation provinciale — Q3 2026', type: 'RECONCILIATION',   period: 'Q3 2026', status: 'DRAFT',    records: 5,      format: 'CSV', size: '0,5 MB', at: '2026-09-17T07:00:00Z' },
  { id: 'RPT-GOV-009', title: 'Rapport pourboires taxables — Province QC',   type: 'TIPS_FISCAL',      period: 'Q1-Q3 2026',status:'VALIDATED',records: 9847,   format: 'PDF', size: '2,1 MB', at: '2026-09-10T15:00:00Z' },
]

type TabKey = 'overview' | 'quarterly' | 'monthly' | 'providers' | 'anomalies' | 'reports'
const TABS: Array<{ k: TabKey; l: string; e: string }> = [
  { k: 'overview',   l: 'Vue globale',    e: '📊' },
  { k: 'quarterly',  l: 'Trimestriels',  e: '📅' },
  { k: 'monthly',    l: 'Mensuels',      e: '📈' },
  { k: 'providers',  l: 'Fournisseurs',  e: '🔌' },
  { k: 'anomalies',  l: 'Anomalies',     e: '⚠️'  },
  { k: 'reports',    l: 'Rapports',      e: '📋'  },
]

const STATUS_C: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:    { label: 'Brouillon', color: '#94A3B8', bg: 'rgba(148,163,184,0.10)' },
  VALIDATED:{ label: 'Validé',   color: '#059669', bg: 'rgba(5,150,105,0.12)' },
  FINAL:    { label: 'Final',    color: '#059669', bg: 'rgba(5,150,105,0.12)' },
  ESTIMÉ:   { label: 'Estimé',   color: '#B45309', bg: 'rgba(180,83,9,0.10)' },
}
const SEV_C: Record<string, { color: string; bg: string }> = {
  HIGH:   { color: '#DC2626', bg: 'rgba(220,38,38,0.10)' },
  MEDIUM: { color: '#B45309', bg: 'rgba(180,83,9,0.10)' },
  LOW:    { color: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
}

const TYPE_ICONS: Record<string, string> = {
  FISCAL_QUARTERLY:'🧾', PROVIDER_FISCAL:'🔌', ANOMALY:'⚠️',
  COMPLIANCE:'🏛️', AUDIT:'📋', RECONCILIATION:'⚖️', TIPS_FISCAL:'💝',
}

const maxBrut = Math.max(...MONTHLY.map(m => m.brut))

export default function TaxReportsPage() {
  const [tab, setTab] = useState<TabKey>('overview')
  const totals = {
    brut: QUARTERLY.reduce((s, q) => s + q.brut, 0),
    tps:  QUARTERLY.reduce((s, q) => s + q.tps, 0),
    tvq:  QUARTERLY.reduce((s, q) => s + q.tvq, 0),
    solde:QUARTERLY.reduce((s, q) => s + q.solde, 0),
  }

  return (
    <AppShell>
      <PageHeader title="Rapports fiscaux" subtitle="Centre de données TPS/TVQ · Province Québec · TAXIMETER.GOV" />
      <div className="px-4 md:px-6 pb-8 space-y-4">
        <div className="p-2.5 rounded-xl text-[10px] font-bold text-amber-400 bg-amber-500/8 border border-amber-500/20">{PILOT}</div>

        {/* KPI globaux */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { l: 'Revenus bruts (9 mois)', v: money(totals.brut), c: 'text-white', bg: 'bg-slate-800' },
            { l: 'TPS nette (9 mois)',     v: money(totals.tps),  c: 'text-purple-400', bg: 'bg-purple-500/10' },
            { l: 'TVQ nette (9 mois)',     v: money(totals.tvq),  c: 'text-purple-400', bg: 'bg-purple-500/10' },
            { l: 'Solde total (9 mois)',   v: money(totals.solde),c: 'text-green-400', bg: 'bg-green-500/10' },
          ].map(s => (
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center border border-white/5`}>
              <div className={`text-sm font-black ${s.c}`}>{s.v}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} className="shrink-0 px-3 py-2 rounded-xl text-[10px] font-bold border transition-all" style={{
              background: tab === t.k ? '#003DA5' : 'rgba(255,255,255,0.04)',
              color: tab === t.k ? 'white' : '#94A3B8',
              borderColor: tab === t.k ? '#003DA5' : 'rgba(255,255,255,0.08)',
            }}>{t.e} {t.l}</button>
          ))}
        </div>

        {/* ── VUE GLOBALE ── */}
        {tab === 'overview' && (
          <div className="space-y-3">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-3">Évolution trimestrielle — Province QC (en cours de pilote)</div>
              <div className="space-y-3">
                {QUARTERLY.map(q => {
                  const maxQ = Math.max(...QUARTERLY.map(x => x.brut))
                  const pct = (q.brut / maxQ) * 100
                  const sc = STATUS_C[q.status] ?? STATUS_C['DRAFT']!
                  return (
                    <div key={q.period}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{q.period}</span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{ color: sc.color, background: sc.bg }}>{sc.label}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-green-400">{money(q.brut)}</span>
                          <span className="text-[9px] text-purple-400 ml-2">TPS+TVQ: {money(q.tps + q.tvq)}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-green-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                        <span>🚕 {money(q.brut * 0.40)} taxi</span>
                        <span>🚗 {money(q.brut * 0.35)} rideshare</span>
                        <span>📦 {money(q.brut * 0.25)} livraison</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-3">
                <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Chauffeurs actifs</div>
                {QUARTERLY.map(q => (
                  <div key={q.period} className="flex justify-between py-1.5 border-b border-slate-800 last:border-0">
                    <span className="text-[10px] text-slate-400">{q.period}</span>
                    <span className="text-[10px] font-bold text-blue-400">{q.chauf.toLocaleString('fr-CA')}</span>
                  </div>
                ))}
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-3">
                <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Solde fiscal à remettre</div>
                {QUARTERLY.map(q => (
                  <div key={q.period} className="flex justify-between py-1.5 border-b border-slate-800 last:border-0">
                    <span className="text-[10px] text-slate-400">{q.period}</span>
                    <span className="text-[10px] font-bold text-green-400">{money(q.solde)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
              <div className="text-[9px] font-bold text-slate-400 uppercase mb-3">Note gouvernementale</div>
              <div className="text-[10px] text-slate-300 leading-relaxed italic">
                « Les données présentées dans ce rapport sont synthétiques et générées à des fins de démonstration du projet pilote TAXIMETER.GOV. Elles reflètent un scénario provincial réaliste basé sur les volumes estimés de l'industrie du transport et de la livraison au Québec. Aucune donnée réelle de contribuable n'est impliquée. »
              </div>
            </div>
          </div>
        )}

        {/* ── TRIMESTRIELS ── */}
        {tab === 'quarterly' && (
          <div className="space-y-3">
            {QUARTERLY.map(q => {
              const sc = STATUS_C[q.status] ?? STATUS_C['DRAFT']!
              return (
                <div key={q.period} className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">{q.period}</span>
                      <span className="text-[8px] px-2 py-0.5 rounded-full font-bold" style={{ color: sc.color, background: sc.bg }}>{sc.label}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-white">{money(q.brut)}</div>
                      <div className="text-[9px] text-slate-400">{q.chauf.toLocaleString('fr-CA')} chauffeurs</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { l: 'TPS nette', v: money(q.tps), c: 'text-purple-400' },
                      { l: 'TVQ nette', v: money(q.tvq), c: 'text-purple-400' },
                      { l: 'TPS+TVQ', v: money(q.tps + q.tvq), c: 'text-purple-300' },
                      { l: 'Solde à remettre', v: money(q.solde), c: 'text-green-400' },
                    ].map(r => (
                      <div key={r.l} className="bg-slate-800 rounded-lg p-2 border border-slate-700 text-center">
                        <div className="text-[8px] text-slate-400 uppercase">{r.l}</div>
                        <div className={`text-xs font-bold mt-0.5 ${r.c}`}>{r.v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[
                      { icon: '🚕', l: 'Taxi',      v: q.brut * 0.40 },
                      { icon: '🚗', l: 'Rideshare', v: q.brut * 0.35 },
                      { icon: '📦', l: 'Livraison', v: q.brut * 0.25 },
                    ].map(r => (
                      <div key={r.l} className="bg-slate-800/50 rounded-lg p-2 text-center border border-slate-700/50">
                        <div className="text-base">{r.icon}</div>
                        <div className="text-[9px] text-slate-400">{r.l}</div>
                        <div className="text-[10px] font-bold text-white">{money(r.v)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── MENSUELS ── */}
        {tab === 'monthly' && (
          <div className="space-y-2">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-3">Revenus bruts mensuels — Province QC (barres)</div>
              <div className="space-y-2">
                {MONTHLY.map(m => (
                  <div key={m.month}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-white w-24 shrink-0">{m.month}</span>
                      <div className="flex-1 mx-2 h-3 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-green-500" style={{ width: `${(m.brut / maxBrut) * 100}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-green-400 w-28 text-right shrink-0">{money(m.brut)}</span>
                    </div>
                    <div className="flex justify-between pl-24 text-[9px] text-slate-500">
                      <span>TPS: {money(m.tps)}</span>
                      <span>TVQ: {money(m.tvq)}</span>
                      <span>{m.chauf.toLocaleString('fr-CA')} chauf.</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── FOURNISSEURS ── */}
        {tab === 'providers' && (
          <div className="space-y-3">
            <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700">
                <div className="text-xs font-bold text-white">Revenus bruts par fournisseur — Province QC</div>
              </div>
              {PROVIDERS.map(p => (
                <div key={p.name} className="px-4 py-3 border-b border-slate-800 last:border-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl shrink-0">{p.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-white">{p.name}</span>
                        <span className="text-[9px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-bold">{p.pct}% du marché</span>
                      </div>
                      <div className="flex gap-3 text-[9px] text-slate-400">
                        <span>Q1: <strong className="text-white">{money(p.q1)}</strong></span>
                        <span>Q2: <strong className="text-white">{money(p.q2)}</strong></span>
                        <span>Q3: <strong className="text-green-400">{money(p.q3)}</strong></span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-white">{money(p.q1 + p.q2 + p.q3)}</div>
                      <div className="text-[9px] text-slate-400">total 3T</div>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${p.pct}%`, background: p.color || '#003DA5' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ANOMALIES ── */}
        {tab === 'anomalies' && (
          <div className="space-y-3">
            <div className="p-3 bg-red-500/8 border border-red-500/20 rounded-xl">
              <div className="text-xs font-bold text-red-400 mb-1">⚠️ Anomalies fiscales détectées</div>
              <div className="text-[10px] text-slate-300">Situations nécessitant une analyse — une anomalie n'est pas automatiquement une fraude.</div>
            </div>
            {[
              { l: 'Ouvertes', v: ANOMALIES.filter(a => a.status === 'OPEN').length, c: 'text-red-400', bg: 'bg-red-500/10' },
              { l: 'Résolues', v: ANOMALIES.filter(a => a.status === 'RESOLVED').length, c: 'text-green-400', bg: 'bg-green-500/10' },
              { l: 'Impact total', v: money(ANOMALIES.reduce((s, a) => s + a.amount, 0)), c: 'text-amber-400', bg: 'bg-amber-500/10' },
            ].reduce((rows: JSX.Element[], s, i, arr) => {
              if (i % 3 === 0) rows.push(
                <div key={i} className="grid grid-cols-3 gap-2">
                  {arr.slice(i, i + 3).map(ss => (
                    <div key={ss.l} className={`${ss.bg} rounded-xl p-3 text-center border border-white/5`}>
                      <div className={`text-lg font-black ${ss.c}`}>{ss.v}</div>
                      <div className="text-[9px] text-slate-400 mt-1">{ss.l}</div>
                    </div>
                  ))}
                </div>
              )
              return rows
            }, [])}
            {ANOMALIES.map(ano => {
              const sc = SEV_C[ano.severity] ?? SEV_C['LOW']!
              const resolved = ano.status === 'RESOLVED'
              return (
                <div key={ano.id} className="bg-slate-900 border border-slate-700 rounded-xl p-4" style={{ borderLeft: `3px solid ${sc.color}` }}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl">⚠️</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-bold text-white font-mono">{ano.id}</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{ color: sc.color, background: sc.bg }}>{ano.severity}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${resolved ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>{resolved ? '✓ RÉSOLU' : '⚠ OUVERT'}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mb-1">{ano.provider} · {ano.period} · {ano.type.replace(/_/g, ' ')}</div>
                      <div className="text-[10px] text-slate-300">{ano.desc}</div>
                      {ano.amount > 0 && <div className="text-xs font-bold text-amber-400 mt-1">Impact: {money(ano.amount)}</div>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── RAPPORTS ── */}
        {tab === 'reports' && (
          <div className="space-y-2">
            {REPORTS_LIST.map(rpt => {
              const sc = STATUS_C[rpt.status] ?? STATUS_C['DRAFT']!
              return (
                <div key={rpt.id} className="bg-slate-900 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">{TYPE_ICONS[rpt.type] ?? '📄'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-bold text-white">{rpt.title}</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{ color: sc.color, background: sc.bg }}>{sc.label}</span>
                      </div>
                      <div className="flex gap-3 text-[10px] text-slate-400 flex-wrap">
                        <span>📅 {rpt.period}</span>
                        <span>📦 {rpt.records.toLocaleString('fr-CA')} enreg.</span>
                        <span>📄 {rpt.format} · {rpt.size}</span>
                        <span>🕐 {new Intl.DateTimeFormat('fr-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(rpt.at))}</span>
                      </div>
                      <div className="text-[9px] text-slate-600 font-mono mt-1">{rpt.id}</div>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[9px] text-blue-400 font-bold hover:bg-blue-500/20 cursor-pointer">
                        <Eye size={9} /> Voir
                      </button>
                      <button className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[9px] text-slate-400 font-bold hover:bg-slate-700 cursor-pointer">
                        <Download size={9} /> Export
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
