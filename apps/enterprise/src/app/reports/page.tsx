'use client'
import { AppShell } from '@/components/layout/AppShell'
import { useState } from 'react'
import { PILOT, fmtDt, REPORT_TEMPLATES, GENERATED_REPORTS, RPT_CAT_CONF } from '@/lib/data'

export default function ReportsPage() {
  const [catF,       setCatF]       = useState('ALL')
  const [generating, setGenerating] = useState<string|null>(null)

  const filtered = REPORT_TEMPLATES.filter(r=>catF==='ALL'||r.cat===catF)
  const cats     = [...new Set(REPORT_TEMPLATES.map(r=>r.cat))]

  const handleGenerate = (id:string) => {
    setGenerating(id)
    setTimeout(()=>setGenerating(null), 2000)
  }

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        {/* Header avec logos */}
        <div className="flex items-center gap-3 mb-2">
          <div className="text-black dark:text-white font-black tracking-tighter" style={{fontSize:'1.4rem',fontFamily:'system-ui',letterSpacing:'-0.04em',lineHeight:1}}>uber</div>
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700"/>
          <div className="flex items-center gap-1">
            <span className="font-black" style={{fontFamily:'system-ui',letterSpacing:'-0.5px',color:'#06B029',fontSize:'0.95rem'}}>Uber</span>
            <span className="font-black text-black dark:text-white" style={{fontFamily:'system-ui',letterSpacing:'-0.5px',fontSize:'0.95rem'}}>Eats</span>
          </div>
          <div className="flex-1">
            <div className="text-xl font-black text-slate-900 dark:text-white">Rapports</div>
            <div className="text-[9px] text-slate-400">Génération · Export · Archivage · Transmission</div>
          </div>
        </div>
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT} · Rapports générés à partir de données synthétiques · DEMO</div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {l:'Templates',    v:REPORT_TEMPLATES.length,                              c:'#000',   bg:'bg-slate-100 dark:bg-slate-800'},
            {l:'Générés',      v:GENERATED_REPORTS.length,                             c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
            {l:'Envoyés',      v:GENERATED_REPORTS.filter(r=>r.status==='SENT').length,c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/10'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className="text-2xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Filtres catégories */}
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={()=>setCatF('ALL')} className="px-2.5 py-1.5 rounded-xl text-[9px] font-bold border transition-all cursor-pointer" style={{background:catF==='ALL'?'#000':'transparent',color:catF==='ALL'?'white':'#64748B',borderColor:catF==='ALL'?'#000':'rgba(148,163,184,0.30)'}}>
            Tous
          </button>
          {cats.map(c=>{
            const cc = RPT_CAT_CONF[c]!
            return (
              <button key={c} onClick={()=>setCatF(c)} className="px-2.5 py-1.5 rounded-xl text-[9px] font-bold border transition-all cursor-pointer" style={{background:catF===c?cc.color:'transparent',color:catF===c?'white':'#64748B',borderColor:catF===c?cc.color:'rgba(148,163,184,0.30)'}}>
                {cc.label}
              </button>
            )
          })}
        </div>

        {/* Templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(r=>{
            const cc = RPT_CAT_CONF[r.cat]!
            const isGen = generating===r.id
            return (
              <div key={r.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{background:`${cc.color}12`}}>{r.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{r.name}</span>
                      <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full" style={{color:cc.color,background:`${cc.color}15`}}>{cc.label}</span>
                    </div>
                    <div className="text-[9px] text-slate-400">{r.desc}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 flex-wrap">
                    {r.formats.map(f=>(
                      <span key={f} className="text-[7px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">{f}</span>
                    ))}
                  </div>
                  <button onClick={()=>handleGenerate(r.id)} disabled={isGen} className="px-3 py-1.5 rounded-xl text-[9px] font-bold text-white cursor-pointer transition-all disabled:opacity-60" style={{background:isGen?'#94a3b8':cc.color}}>
                    {isGen?'Génération…':'Générer · DEMO'}
                  </button>
                </div>
                {r.lastGenAt&&<div className="text-[8px] text-slate-400 mt-2">Dernier: {fmtDt(r.lastGenAt)}</div>}
              </div>
            )
          })}
        </div>

        {/* Rapports générés */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">
            Rapports générés ({GENERATED_REPORTS.length})
          </div>
          {GENERATED_REPORTS.map(g=>{
            const tmpl = REPORT_TEMPLATES.find(t=>t.id===g.templateId)
            const sc = g.status==='SENT'?{label:'Envoyé',color:'#059669',bg:'rgba(5,150,105,0.12)'}:{label:'Archivé',color:'#003DA5',bg:'rgba(0,61,165,0.10)'}
            return (
              <div key={g.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <span className="text-xl shrink-0">{tmpl?.icon??'📊'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{g.name}</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                    <span className="text-[7px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">{g.format}</span>
                  </div>
                  <div className="text-[9px] text-slate-400">{g.period} · {g.size} · {g.generatedBy} · {fmtDt(g.generatedAt)}</div>
                  {g.sentTo&&<div className="text-[9px] text-green-600 dark:text-green-400">✉️ {g.sentTo}</div>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button className="px-2 py-1 rounded-lg text-[8px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 cursor-pointer">Voir</button>
                  <button className="px-2 py-1 rounded-lg text-[8px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer">↓</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
