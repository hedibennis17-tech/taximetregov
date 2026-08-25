'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, KpiCard } from '@/components/ui'
import { intelligenceInsights, executiveReport, formatCAD, monthlyRevenue } from '@/data/analytics.mock'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { TrendingUp, TrendingDown, Minus, Brain, AlertCircle } from 'lucide-react'

// Forecasting data (simulated — not real predictions)
const forecastData = [
  ...monthlyRevenue.slice(-3).map(m => ({ month: m.month, historical: m.gross, forecast: null, lower: null, upper: null })),
  { month: 'Sep', historical: null, forecast: 295000, lower: 278000, upper: 312000 },
  { month: 'Oct', historical: null, forecast: 310000, lower: 290000, upper: 330000 },
  { month: 'Nov', historical: null, forecast: 301000, lower: 278000, upper: 324000 },
]

export default function IntelligencePage() {
  const sentiment = (s: string) => s === 'positive' ? { color:'text-green-600', bg:'bg-green-50', icon:<TrendingUp size={14}/> } : s === 'negative' ? { color:'text-red-600', bg:'bg-red-50', icon:<TrendingDown size={14}/> } : { color:'text-slate-600', bg:'bg-slate-50', icon:<Minus size={14}/> }

  return (
    <AppShell>
      <PageHeader title="Government Intelligence Center" subtitle="Tendances · Comparaisons · Anomalies · Prévisions · SIMULATION" />

      {/* Important disclaimer */}
      <div className="flex items-start gap-3 px-4 py-3 mb-5 rounded-xl bg-blue-50 border border-blue-200">
        <Brain size={16} className="text-qc-blue mt-0.5 shrink-0" />
        <div className="text-xs text-blue-700">
          <strong>Principe fondamental :</strong> Le Government Intelligence Engine détecte, calcule, résume et priorise. Il ne prend aucune décision administrative automatique. Il ne suspend pas de chauffeur, ne déclare pas de fraude, n'impose pas de pénalité. Les insights sont des informations analytiques explicables basées sur des sources internes identifiées.
        </div>
      </div>

      {/* Executive summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Croissance revenus" value="+4.9%" large icon={<TrendingUp size={16} />} color="green" sub="vs Juillet 2026" />
        <KpiCard label="Taux réconciliation" value="92%" icon={<TrendingDown size={16} />} color="orange" sub="Cible : 98%" />
        <KpiCard label="Taux résolution conformité" value="66.7%" color="orange" sub="Cible : ≥80%" />
        <KpiCard label="Taux succès webhook" value="98.5%" color="green" sub={`+${executiveReport.headline.activePlatforms} plateformes`} />
      </div>

      {/* Intelligence insights */}
      <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Insights analytiques explicables</div>
      <div className="space-y-3 mb-5">
        {intelligenceInsights.map(ins => {
          const s = sentiment(ins.sentiment)
          return (
            <Card key={ins.id} className={`p-5 border ${ins.sentiment === 'negative' ? 'border-red-200 dark:border-red-900' : ins.sentiment === 'positive' ? 'border-green-200 dark:border-green-900' : 'border-slate-100 dark:border-slate-800'}`}>
              <div className="flex items-start gap-4">
                <span className="text-2xl shrink-0">{ins.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{ins.title}</span>
                    <span className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${s.bg} ${s.color} border border-current border-opacity-20`}>
                      {s.icon} {ins.category}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${ins.confidence === 'HIGH' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      Confiance: {ins.confidence}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-2">{ins.description}</p>
                  <div className="flex items-center gap-4 text-[10px] text-slate-400 flex-wrap">
                    <span>Source : <span className="font-semibold text-slate-500">{ins.source}</span></span>
                    <span>Période : {ins.period}</span>
                  </div>
                  {ins.action !== 'Aucune action requise' && (
                    <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700">
                      <AlertCircle size={12} className="shrink-0" />
                      <span><strong>Action suggérée :</strong> {ins.action}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Revenue forecast */}
      <Card className="p-4 mb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Prévisions de revenus</div>
            <div className="text-[10px] text-slate-400">Historique + projection · SIMULATION — Pas un modèle ML réel</div>
          </div>
          <div className="px-2 py-1 rounded bg-amber-100 text-amber-700 text-[9px] font-bold">NON GARANTI</div>
        </div>
        <div className="flex items-center gap-3 mb-3 text-[10px]">
          <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-qc-blue" /><span className="text-slate-500">Historique</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-amber-500 border-dashed" style={{borderTop:'2px dashed #F59E0B'}} /><span className="text-slate-500">Prévision (simulation)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-amber-100 border border-amber-300 rounded" /><span className="text-slate-500">Intervalle de confiance</span></div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize:10, fill:'#94a3b8' }} />
            <YAxis tick={{ fontSize:10, fill:'#94a3b8' }} tickFormatter={(v:number)=>`${(v/1000).toFixed(0)}k$`} />
            <Tooltip formatter={(v: any)=>v!=null?formatCAD(Number(v),0):'N/A'} />
            <ReferenceLine x="Sep" stroke="#F59E0B" strokeDasharray="4 4" label={{ value:'Prévision', position:'top', fontSize:10, fill:'#F59E0B' }} />
            <Line type="monotone" dataKey="historical" name="Historique" stroke="#003DA5" strokeWidth={2.5} dot={{ fill:'#003DA5', r:4 }} connectNulls={false} />
            <Line type="monotone" dataKey="forecast" name="Prévision (sim.)" stroke="#F59E0B" strokeWidth={2} strokeDasharray="6 3" dot={false} connectNulls={false} />
            <Line type="monotone" dataKey="upper" name="Limite supérieure" stroke="#F59E0B" strokeWidth={1} strokeDasharray="2 4" dot={false} opacity={0.5} connectNulls={false} />
            <Line type="monotone" dataKey="lower" name="Limite inférieure" stroke="#F59E0B" strokeWidth={1} strokeDasharray="2 4" dot={false} opacity={0.5} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* AI-ready note */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <Brain size={18} className="text-qc-blue mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-2">Architecture IA-Ready</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-500">
              <div>
                <div className="font-semibold text-slate-600 dark:text-slate-400 mb-1">ComplianceFeatureStore — Prêt</div>
                <div className="space-y-1">
                  {['Transaction frequency','Adjustment frequency','Revenue variance','Platform mismatch score','Unusual timing score','Missing data score'].map(f=>(
                    <div key={f} className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-qc-blue" />{f}</div>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-semibold text-slate-600 dark:text-slate-400 mb-1">Règles absolues</div>
                <div className="space-y-1">
                  {['Aucune suspension automatique','Aucune déclaration de fraude algorithmique','Aucune pénalité automatique','Aucune modification de transaction par IA','Décision finale = humain'].map(r=>(
                    <div key={r} className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-red-500" />{r}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </AppShell>
  )
}
