'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { Download, Eye, FileText, CheckCircle } from 'lucide-react'
import { PILOT, money, fmtDate, NAV_REPORTS, ALL_REPORTS, STATUS_CONF, CAT_CONF } from '@/lib/reports-data'

const nav = NAV_REPORTS.map(n=>({...n,active:n.href==='/reports/builder'}))
const REPORT_TYPES = [
  {id:'fiscal_quarterly',  label:'Rapport fiscal trimestriel',   icon:'🧾', desc:'TPS, TVQ, revenus bruts, solde — Province QC', fields:['periode','format','chauffeurs']},
  {id:'revenue_monthly',   label:'Rapport revenus mensuel',      icon:'💰', desc:'Revenus par source, fournisseur, zone géo',     fields:['mois','format','source']},
  {id:'provider_summary',  label:'Rapport fournisseurs',         icon:'🔌', desc:'Transactions, webhooks, réconciliation par plateforme', fields:['fournisseur','periode','format']},
  {id:'compliance_report', label:'Rapport conformité',           icon:'⚖️',  desc:'Dossiers chauffeurs, documents, licences',     fields:['periode','format','statut']},
  {id:'reconciliation',    label:'Rapport réconciliation',       icon:'⚖️',  desc:'Rapprochement sources, écarts, résolutions',   fields:['periode','format']},
  {id:'audit_report',      label:'Rapport audit',                icon:'📋', desc:'Journal complet des opérations et événements', fields:['periode','format','niveau']},
  {id:'tax_tips',          label:'Rapport pourboires taxables',  icon:'💝', desc:'Pourboires TPS/TVQ par chauffeur et source',   fields:['periode','format']},
  {id:'anomaly_report',    label:'Rapport anomalies',            icon:'⚠️',  desc:'Exceptions, écarts, doublons détectés',        fields:['periode','format','severite']},
]

export default function ReportBuilderPage() {
  const [selectedType, setSelectedType] = useState('')
  const [period,   setPeriod]   = useState('2026-Q3')
  const [format,   setFormat]   = useState('PDF')
  const [source,   setSource]   = useState('TOUS')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated]   = useState<string|null>(null)

  function generate() {
    if (!selectedType) return
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setGenerated(`RPT-DEMO-${Date.now().toString().slice(-6)}`)
    }, 1800)
  }

  const sel = REPORT_TYPES.find(r=>r.id===selectedType)

  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Générateur de rapports</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">Rapports gouvernementaux · Province QC · TAXIMETER.GOV</p>
        <div className="flex gap-1.5 overflow-x-auto pb-3 flex-nowrap">
          {nav.map(n=><Link key={n.href} href={n.href} className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap" style={{background:n.active?'#003DA5':'transparent',color:n.active?'white':'#64748B',borderColor:n.active?'#003DA5':'rgba(148,163,184,0.30)'}}>{n.l}</Link>)}
        </div>
      </div>

      <div className="px-4 md:px-6 pb-8 space-y-5">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Configurateur */}
          <div className="md:col-span-2 space-y-4">
            {/* Sélection type */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">1. Type de rapport</div>
              <div className="grid grid-cols-2 gap-2">
                {REPORT_TYPES.map(r=>(
                  <button key={r.id} onClick={()=>setSelectedType(r.id)}
                    className="flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer"
                    style={{
                      background:selectedType===r.id?'#EEF3FB':'transparent',
                      borderColor:selectedType===r.id?'#003DA5':'rgba(148,163,184,0.25)',
                    }}>
                    <span className="text-xl shrink-0">{r.icon}</span>
                    <div>
                      <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{r.label}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5 leading-relaxed">{r.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Paramètres */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">2. Paramètres</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Période</label>
                  <select value={period} onChange={e=>setPeriod(e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:border-qc-blue">
                    {['2026-Q3','2026-Q2','2026-Q1','2026-9M','2026-09','2026-08'].map(p=><option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Format</label>
                  <select value={format} onChange={e=>setFormat(e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:border-qc-blue">
                    {['PDF','CSV','XLSX','JSON'].map(f=><option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Source de données</label>
                  <select value={source} onChange={e=>setSource(e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:border-qc-blue">
                    {['TOUS','TAXI','UBER','LYFT','DOORDASH','INSTACART','UBER_EATS'].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Périmètre</label>
                  <select className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none">
                    <option>Province QC (~9 847 chauffeurs)</option>
                    <option>Montréal seulement</option>
                    <option>Laval seulement</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bouton génération */}
            <button onClick={generate} disabled={!selectedType||generating}
              className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              style={{
                background:!selectedType||generating?'#E2E8F0':'#003DA5',
                color:!selectedType||generating?'#94A3B8':'white',
                cursor:!selectedType||generating?'not-allowed':'pointer',
              }}>
              {generating
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Génération en cours…</>
                : <><FileText size={16}/> Générer le rapport {sel?`— ${sel.label}`:''}</>}
            </button>

            {/* Rapport généré */}
            {generated && (
              <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/25 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle size={18} className="text-green-600 dark:text-green-400 shrink-0"/>
                  <div>
                    <div className="text-sm font-bold text-green-800 dark:text-green-400">Rapport généré avec succès</div>
                    <div className="text-[9px] text-green-600 dark:text-green-400 font-mono mt-0.5">{generated}</div>
                  </div>
                </div>
                <div className="text-[9px] text-green-700 dark:text-green-400 mb-3 bg-green-100 dark:bg-green-500/10 rounded-lg px-3 py-2">{PILOT} · Ce rapport est synthétique — aucune donnée officielle</div>
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-green-200 dark:border-green-500/30 text-xs font-bold text-green-700 dark:text-green-400 cursor-pointer hover:bg-green-50">
                    <Eye size={12}/> Aperçu
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-600 text-white text-xs font-bold cursor-pointer hover:bg-green-700">
                    <Download size={12}/> Télécharger {format}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar — rapports récents */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm h-fit">
            <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Rapports récents</div>
            {ALL_REPORTS.slice(0,8).map(r=>{
              const sc = STATUS_CONF[r.status]??STATUS_CONF['DRAFT']!
              const cc = CAT_CONF[r.cat]??CAT_CONF['FISCAL']!
              return (
                <div key={r.id} className="py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div className="flex items-start gap-2 mb-1">
                    <span className="text-sm shrink-0">{cc.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-tight">{r.title}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                        <span className="text-[8px] text-slate-400">{r.format} · {r.size}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[8px] text-slate-400 pl-6">{fmtDate(r.generatedAt)}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
