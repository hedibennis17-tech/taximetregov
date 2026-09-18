'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/ui'
import { useState } from 'react'
import { Download, Eye, FileText } from 'lucide-react'
import { DEMO_REPORTS, PILOT_BANNER } from '@/lib/demo-data'

const TYPE_ICONS:Record<string,string> = {
  REVENUE_SUMMARY:'💰', TAX_QUARTERLY:'🧾', PROVIDER_REPORT:'🔌',
  TRANSACTION_REPORT:'💳', RECONCILIATION:'⚖️', DRIVER_ACTIVITY:'🚗',
  ANOMALY:'⚠️', AUDIT:'📋', COMPLIANCE:'🏛️',
}
const STATUS_CONF:Record<string,{label:string;color:string;bg:string}> = {
  GENERATED: {label:'Généré',  color:'#059669',bg:'rgba(5,150,105,0.12)'},
  VALIDATED: {label:'Validé',  color:'#003DA5',bg:'rgba(0,61,165,0.12)'},
  DRAFT:     {label:'Brouillon',color:'#B45309',bg:'rgba(180,83,9,0.10)'},
  PILOT:     {label:'Pilote',  color:'#7C3AED',bg:'rgba(124,58,237,0.12)'},
}
const fmtDt = (s:string) => new Intl.DateTimeFormat('fr-CA',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(s))

const CATEGORIES = ['Tous','Revenus','Taxes','Fournisseurs','Transactions','Réconciliation','Conformité','Audit']

export default function ReportsPage() {
  const [cat, setCat] = useState('Tous')

  return (
    <AppShell>
      <PageHeader title="Report Center" subtitle="Générateur de rapports · Données synthétiques pilote"/>
      <div className="px-4 md:px-6 pb-8 space-y-4">
        <div className="p-3 rounded-xl text-[10px] font-bold text-amber-400 bg-amber-500/8 border border-amber-500/20">{PILOT_BANNER}</div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {label:'Total',   val:DEMO_REPORTS.length,                                     color:'text-blue-400', bg:'bg-blue-500/10'},
            {label:'Générés', val:DEMO_REPORTS.filter(r=>r.status==='GENERATED').length,   color:'text-green-400',bg:'bg-green-500/10'},
            {label:'Validés', val:DEMO_REPORTS.filter(r=>r.status==='VALIDATED').length,   color:'text-blue-400', bg:'bg-blue-500/10'},
            {label:'Brouillon',val:DEMO_REPORTS.filter(r=>r.status==='DRAFT').length,      color:'text-amber-400',bg:'bg-amber-500/10'},
          ].map(s=>(
            <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center border border-white/5`}>
              <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Catégories */}
        <div className="flex gap-2 overflow-x-auto">
          {CATEGORIES.map(c=>(
            <button key={c} onClick={()=>setCat(c)} className="shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all" style={{
              background:cat===c?'#003DA5':'rgba(255,255,255,0.05)',
              color:cat===c?'white':'#94A3B8',
              borderColor:cat===c?'#003DA5':'rgba(255,255,255,0.10)',
            }}>{c}</button>
          ))}
        </div>

        {/* Phrase clé */}
        <div className="p-4 bg-blue-500/8 border border-blue-500/20 rounded-xl">
          <div className="text-[10px] text-blue-300 italic leading-relaxed">
            « Une même activité peut être représentée par plusieurs sources de données. TAXIMETER.GOV propose de les structurer, les relier et les rapprocher afin de rendre la chaîne transactionnelle vérifiable, sous réserve du cadre légal, des autorisations et des intégrations disponibles. »
          </div>
        </div>

        {/* Liste rapports */}
        <div className="space-y-2">
          {DEMO_REPORTS.map(rpt=>{
            const sc = STATUS_CONF[rpt.status]??STATUS_CONF['DRAFT']!
            return (
              <div key={rpt.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">{TYPE_ICONS[rpt.type]??'📄'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{rpt.title}</span>
                      <span className="text-[8px] px-2 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                      {rpt.isPilot&&<span className="text-[8px] text-amber-400 bg-amber-500/10 px-1.5 rounded-full font-bold">PILOTE</span>}
                    </div>
                    <div className="text-[10px] text-slate-400 flex gap-3 flex-wrap">
                      <span>🗓️ {rpt.period}</span>
                      <span>📦 {rpt.records} enregistrements</span>
                      <span>📄 {rpt.format}</span>
                      <span>🕐 {fmtDt(rpt.generatedAt)}</span>
                    </div>
                    <div className="text-[9px] text-slate-600 mt-1 font-mono">{rpt.id}</div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 font-semibold hover:bg-blue-500/20 cursor-pointer">
                      <Eye size={10}/> Voir
                    </button>
                    <button className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 font-semibold hover:bg-slate-700 cursor-pointer">
                      <Download size={10}/> Export
                    </button>
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
