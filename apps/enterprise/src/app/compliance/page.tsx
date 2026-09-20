'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { PILOT, money, money2, fmtDt, fmtDate, DEPARTMENTS, ENT_DRIVERS, ENT_VEHICLES, ENT_DOCS_FULL, COMPLIANCE_OBLIGATIONS, COMPLIANCE_STATUS_CONF, COMP_CATEGORY_CONF, COMPLIANCE_DEPT_SUMMARY, READINESS_CHECKLIST, COMPLIANCE_CASES, CASE_TYPE_CONF, CASE_STATUS_CONF, ENT_CONNECTIONS, CONN_STATUS, TAX_PERIODS, ALL_DECLARATIONS, ALL_PAYMENTS, CURRENT_ENT } from '@/lib/data'

const TABS = [
  {id:'overview',  label:'📊 Overview'},
  {id:'drivers',   label:'👤 Chauffeurs'},
  {id:'vehicles',  label:'🚗 Véhicules'},
  {id:'documents', label:'📄 Documents'},
  {id:'tax',       label:'🧾 Fiscal'},
  {id:'platforms', label:'🔌 Plateformes'},
  {id:'cases',     label:'📁 Dossiers'},
  {id:'readiness', label:'🏛️ Prêt Gov.'},
] as const
type Tab = typeof TABS[number]['id']

const PRIORITY_CONF: Record<string,{color:string}> = {
  CRITIQUE:{color:'#DC2626'},IMPORTANT:{color:'#B45309'},ATTENTION:{color:'#7C3AED'},INFO:{color:'#64748B'},
}
const DOC_STATUS: Record<string,{label:string;color:string;bg:string}> = {
  'VALIDE':       {label:'Valide',       color:'#059669',bg:'rgba(5,150,105,0.12)'},
  'EXPIRING':     {label:'Expirant',     color:'#B45309',bg:'rgba(180,83,9,0.10)'},
  'EXPIRED':      {label:'Expiré',       color:'#DC2626',bg:'rgba(220,38,38,0.10)'},
  'PENDING':      {label:'En validation',color:'#003DA5',bg:'rgba(0,61,165,0.10)'},
  'MISSING':      {label:'Manquant',     color:'#DC2626',bg:'rgba(220,38,38,0.10)'},
}

export default function CompliancePage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [deptF, setDeptF] = useState('ALL')
  const [caseStatus, setCaseStatus] = useState('ALL')

  const active = DEPARTMENTS.filter(d=>d.status==='ACTIVE')
  const selDept = deptF!=='ALL' ? active.find(d=>d.slug===deptF) : null

  const totalAlerts    = COMPLIANCE_OBLIGATIONS.filter(o=>['OPEN','PENDING','IN_PROGRESS'].includes(o.status)).length
  const expDocs        = ENT_DOCS_FULL.filter(d=>d.status==='EXPIRED'||d.status==='EXPIRING').length
  const issueDrvs      = ENT_DRIVERS.filter(d=>d.status!=='ACTIVE'||d.docs!=='OK').length
  const openCases      = COMPLIANCE_CASES.filter(c=>c.status!=='RÉSOLU'&&c.status!=='FERMÉ').length
  const compliantDrvs  = ENT_DRIVERS.filter(d=>d.status==='ACTIVE'&&d.docs==='OK').length
  const totalScore     = 94

  const filteredCases  = COMPLIANCE_CASES.filter(c=>caseStatus==='ALL'||c.status===caseStatus)

  const avgScore = (s:{scores:{admin:number;documents:number;vehicles:number;fiscal:number;data:number}}) =>
    Math.round((s.scores.admin+s.scores.documents+s.scores.vehicles+s.scores.fiscal+s.scores.data)/5)

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="text-black dark:text-white font-black" style={{fontSize:'1.3rem',fontFamily:'system-ui',letterSpacing:'-0.04em'}}>uber</div>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"/>
              <div className="flex items-center gap-1">
                <span className="font-black" style={{fontFamily:'system-ui',color:'#06B029',fontSize:'0.85rem'}}>Uber</span>
                <span className="font-black text-black dark:text-white" style={{fontFamily:'system-ui',fontSize:'0.85rem'}}>Eats</span>
              </div>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Centre de conformité</h1>
            <p className="text-sm text-slate-500 mt-0.5">Entreprise · Chauffeurs · Véhicules · Documents · Fiscal · Plateformes · Dossiers</p>
          </div>
          <button className="px-3 py-2 rounded-xl text-sm font-bold bg-slate-800 text-white cursor-pointer hover:bg-slate-700 shrink-0">↓ Exporter · DEMO</button>
        </div>
        <div className="text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">
          ⚠️ {PILOT} · Scores = indicateurs administratifs DEMO — aucune valeur légale ou gouvernementale
        </div>

        {/* Tabs */}
        <div className="flex gap-1 flex-wrap">
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} className="px-3 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer whitespace-nowrap" style={{background:tab===t.id?'#000':'transparent',color:tab===t.id?'white':'#64748B',borderColor:tab===t.id?'#000':'rgba(148,163,184,0.30)'}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Filtre département */}
        {['overview','drivers','vehicles','documents','tax'].includes(tab)&&(
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={()=>setDeptF('ALL')} className="px-2.5 py-1.5 rounded-xl text-sm font-bold border cursor-pointer transition-all" style={{background:deptF==='ALL'?'#000':'transparent',color:deptF==='ALL'?'white':'#64748B',borderColor:deptF==='ALL'?'#000':'rgba(148,163,184,0.30)'}}>Tous</button>
            {active.map(d=>(
              <button key={d.slug} onClick={()=>setDeptF(d.slug)} className="px-2.5 py-1.5 rounded-xl text-sm font-bold border cursor-pointer transition-all" style={{background:deptF===d.slug?d.color:'transparent',color:deptF===d.slug?'white':'#64748B',borderColor:deptF===d.slug?d.color:'rgba(148,163,184,0.30)'}}>
                {d.emoji} {d.name}
              </button>
            ))}
          </div>
        )}

        {/* ── OVERVIEW ── */}
        {tab==='overview'&&(
          <div className="space-y-4">
            {/* Score + KPI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center">
                <div className="text-4xl font-black" style={{color:totalScore>=90?'#059669':'#B45309'}}>{totalScore}%</div>
                <div className="text-sm font-bold text-slate-500 mt-1 text-center">Score global (DEMO)</div>
                <div className="mt-2 w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-green-500" style={{width:`${totalScore}%`}}/>
                </div>
              </div>
              {[
                {l:'Chauffeurs conformes',  v:`${compliantDrvs}/${ENT_DRIVERS.length}`,c:'#059669',bg:'bg-green-50 dark:bg-green-500/10',icon:'👤'},
                {l:'Obligations ouvertes',  v:totalAlerts,                              c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10',   icon:'📋'},
                {l:'Dossiers ouverts',      v:openCases,                                c:'#B45309',bg:'bg-amber-50 dark:bg-amber-500/10',icon:'📁'},
              ].map(s=>(
                <div key={s.l} className={`${s.bg} rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm`}>
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="text-2xl font-black" style={{color:s.c}}>{s.v}</div>
                  <div className="text-sm text-slate-500 text-center mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>

            {/* Scores par département */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Conformité par département (DEMO)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {COMPLIANCE_DEPT_SUMMARY.filter(d=>selDept?d.deptId===selDept.id:true).map(d=>{
                  const avg = avgScore(d)
                  return (
                    <div key={d.deptId} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{d.emoji}</span>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{d.deptName}</span>
                        </div>
                        <span className="text-sm font-black" style={{color:avg>=90?'#059669':avg>=80?'#B45309':'#DC2626'}}>{avg}%</span>
                      </div>
                      <div className="grid grid-cols-5 gap-0.5">
                        {[['A',d.scores.admin],['D',d.scores.documents],['V',d.scores.vehicles],['F',d.scores.fiscal],['S',d.scores.data]].map(([label,val])=>(
                          <div key={String(label)} className="text-center">
                            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-sm overflow-hidden flex items-end">
                              <div className="w-full rounded-sm" style={{height:`${val}%`,background:Number(val)>=90?'#059669':Number(val)>=80?'#B45309':'#DC2626'}}/>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">{label}</div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        {d.alerts>0&&<span className="text-amber-500">⚠️ {d.alerts} alertes</span>}
                        {d.exceptions>0&&<span className="text-red-500">❌ {d.exceptions} exceptions</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Obligations actives */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-800 dark:text-white">Obligations ({COMPLIANCE_OBLIGATIONS.length})</span>
                <span className="text-sm text-red-500 font-bold">{totalAlerts} actives</span>
              </div>
              {COMPLIANCE_OBLIGATIONS.slice(0,5).map(o=>{
                const sc = COMPLIANCE_STATUS_CONF[o.status]!
                const cc = COMP_CATEGORY_CONF[o.category]!
                const overdue = new Date(o.due)<new Date('2026-09-19')&&o.status!=='COMPLETED'
                return (
                  <div key={o.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="text-base shrink-0">{cc.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{o.label}</div>
                      <div className="text-sm text-slate-400">Échéance: {fmtDate(o.due)}</div>
                    </div>
                    <span className="text-sm font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{color:sc.color,background:sc.bg}}>{sc.icon} {sc.label}</span>
                    {overdue&&<span className="text-xs font-bold text-red-500 shrink-0">EN RETARD</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── CHAUFFEURS ── */}
        {tab==='drivers'&&(
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[
                {l:'Actifs',          v:ENT_DRIVERS.filter(d=>d.status==='ACTIVE').length,    c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
                {l:'Docs OK',         v:ENT_DRIVERS.filter(d=>d.docs==='OK').length,           c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
                {l:'Docs ⚠️',         v:expDocs,                                               c:'#B45309',bg:'bg-amber-50 dark:bg-amber-500/10'},
                {l:'Suspendus',       v:ENT_DRIVERS.filter(d=>d.status==='SUSPENDED').length,  c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10'},
              ].map(s=>(
                <div key={s.l} className={`${s.bg} rounded-xl p-2.5 text-center`}>
                  <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
                  <div className="text-sm text-slate-500 mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>
            {ENT_DRIVERS.map(d=>{
              const isOK = d.status==='ACTIVE'&&d.docs==='OK'
              const issues = []
              if (d.status!=='ACTIVE')   issues.push('Statut inactif')
              if (d.docs==='EXPIRING')   issues.push('Document expirant')
              if (d.docs==='EXPIRED')    issues.push('Document expiré')
              if (d.status==='SUSPENDED') issues.push('Suspendu')
              return (
                <div key={d.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm" style={{borderLeft:`3px solid ${isOK?'#059669':'#DC2626'}`}}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-sm font-black text-white shrink-0">{d.name.split(' ').map((n:string)=>n[0]).join('')}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{d.name}</span>
                        <span className={`text-sm font-bold px-1.5 py-0.5 rounded-full ${d.status==='ACTIVE'?'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10':'text-red-500 bg-red-50 dark:bg-red-500/10'}`}>{d.status}</span>
                        <span className={`text-sm font-bold ${d.docs==='OK'?'text-green-600':'text-red-500'}`}>{d.docs==='OK'?'✅ Docs OK':'⚠️ '+d.docs}</span>
                      </div>
                      <div className="text-sm font-mono text-slate-400">{d.id}{d.vehicle?` · ${d.vehicle}`:''}</div>
                      {issues.length>0&&<div className="text-sm text-red-500 mt-1">⚠️ {issues.join(' · ')}</div>}
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {[
                          {l:'Identité',    v:'✅'},
                          {l:'Permis',      v:d.docs==='OK'?'✅':'⚠️'},
                          {l:'Assurance',   v:d.docs==='EXPIRED'?'❌':'✅'},
                          {l:'Conformité',  v:d.status==='ACTIVE'?'✅':'⚠️'},
                        ].map(r=>(
                          <div key={r.l} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-1.5 text-center">
                            <div className="text-sm">{r.v}</div>
                            <div className="text-xs text-slate-400">{r.l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Link href={`/drivers/${d.id}`} className="px-2 py-1 rounded-lg text-sm font-bold bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0">→ Dossier</Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── VÉHICULES ── */}
        {tab==='vehicles'&&(
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                {l:'Actifs',       v:ENT_VEHICLES.filter(v=>v.status==='ACTIVE').length,   c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
                {l:'Inspecté OK',  v:ENT_VEHICLES.filter(v=>(v as any).inspStatus!=='EXPIRED').length,c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
                {l:'À renouveler', v:ENT_VEHICLES.filter(v=>(v as any).inspStatus==='EXPIRING'||(v as any).inspStatus==='EXPIRED').length,c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10'},
              ].map(s=>(
                <div key={s.l} className={`${s.bg} rounded-xl p-2.5 text-center`}>
                  <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
                  <div className="text-sm text-slate-500 mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>
            {ENT_VEHICLES.map(v=>{
              const inspStatus = (v as any).inspStatus ?? (v.inspection==='EXPIRED'?'EXPIRED':v.inspection==='EXPIRING'?'EXPIRING':'ACTIVE')
              const isOK = v.status==='ACTIVE'&&inspStatus!=='EXPIRED'
              const issues = []
              if (inspStatus==='EXPIRED')  issues.push('Inspection expirée')
              if (inspStatus==='EXPIRING') issues.push('Inspection expirante')
              if (v.status!=='ACTIVE')       issues.push('Véhicule inactif')
              return (
                <div key={v.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm" style={{borderLeft:`3px solid ${isOK?'#059669':issues.length>0?'#B45309':'#059669'}`}}>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl shrink-0">🚗</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{v.id}</span>
                        <span className="text-sm font-mono text-slate-400">{v.plate}</span>
                        <span className={`text-sm font-bold px-1.5 py-0.5 rounded-full ${v.status==='ACTIVE'?'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10':'text-red-500 bg-red-50'}`}>{v.status}</span>
                      </div>
                      <div className="text-sm text-slate-400">{v.make} {v.model} {v.year} · VIN: ••••-DEMO</div>
                      {issues.length>0&&<div className="text-sm text-red-500 mt-1">⚠️ {issues.join(' · ')}</div>}
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {[
                          {l:'Inspection',    v:inspStatus==='ACTIVE'?'✅':inspStatus==='EXPIRING'?'⚠️':'❌'},
                          {l:'Assurance',     v:'✅'},
                          {l:'Immatriculation',v:'✅'},
                          {l:'Taximètre',     v:(v as any).tachymeterSerial?'✅':'—'},
                        ].map(r=>(
                          <div key={r.l} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-1.5 text-center">
                            <div className="text-sm">{r.v}</div>
                            <div className="text-xs text-slate-400">{r.l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── DOCUMENTS ── */}
        {tab==='documents'&&(
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[
                {l:'Valides',      v:ENT_DOCS_FULL.filter(d=>d.status==='VALID').length,    c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
                {l:'Expirants',    v:ENT_DOCS_FULL.filter(d=>d.status==='EXPIRING').length, c:'#B45309',bg:'bg-amber-50 dark:bg-amber-500/10'},
                {l:'Expirés',      v:ENT_DOCS_FULL.filter(d=>d.status==='EXPIRED').length,  c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10'},
                {l:'En attente',   v:ENT_DOCS_FULL.filter(d=>d.status==='PENDING').length,  c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/10'},
              ].map(s=>(
                <div key={s.l} className={`${s.bg} rounded-xl p-2.5 text-center`}>
                  <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
                  <div className="text-sm text-slate-500 mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-black">
                    {['Document','Type','Titulaire','Émission','Expiration','Statut','Validé par'].map(h=>(
                      <th key={h} className="px-3 py-2.5 text-left text-sm font-bold text-white whitespace-nowrap">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {ENT_DOCS_FULL.map(d=>{
                      const st = DOC_STATUS[d.status]??{label:d.status,color:'#64748B',bg:'rgba(100,116,139,0.10)'}
                      return (
                        <tr key={d.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{(d as any).label??d.id}</td>
                          <td className="px-3 py-2.5 text-sm text-slate-500 whitespace-nowrap">{d.type}</td>
                          <td className="px-3 py-2.5 text-sm text-slate-500 whitespace-nowrap">{(d as any).ownerId??'—'}</td>
                          <td className="px-3 py-2.5 text-sm font-mono text-slate-400 whitespace-nowrap">{fmtDate((d as any).issued??d.uploadedAt)}</td>
                          <td className="px-3 py-2.5 text-sm font-mono text-slate-400 whitespace-nowrap">{fmtDate((d as any).expires??(d as any).expiresAt??'—')}</td>
                          <td className="px-3 py-2.5"><span className="text-sm font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{color:st.color,background:st.bg}}>{st.label}</span></td>
                          <td className="px-3 py-2.5 text-sm text-slate-400">{(d as any).verifiedBy??(d as any).validatedBy??'—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── FISCAL ── */}
        {tab==='tax'&&(
          <div className="space-y-4">
            <div className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 px-3 py-2 rounded-xl">
              ESTIMATION FISCALE — MODE PILOTE — AUCUNE TRANSMISSION OFFICIELLE
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                {l:'Périodes',      v:TAX_PERIODS.length,                                     c:'#000',bg:'bg-slate-100 dark:bg-slate-800'},
                {l:'Déclarations',  v:ALL_DECLARATIONS.length,                                c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/10'},
                {l:'Paiements OK',  v:ALL_PAYMENTS.filter(p=>p.status==='PAID').length,       c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
              ].map(s=>(
                <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
                  <div className="text-2xl font-black" style={{color:s.c}}>{s.v}</div>
                  <div className="text-sm text-slate-500 mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>
            {TAX_PERIODS.map(tp=>(
              <div key={tp.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-bold text-slate-800 dark:text-white">{tp.period}</div>
                    <div className="text-sm text-slate-400">{fmtDate(tp.start)} → {fmtDate(tp.end)}</div>
                  </div>
                  <span className={`text-sm font-bold px-2 py-1 rounded-full ${tp.status==='PAID'?'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10':'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10'}`}>{tp.status==='PAID'?'Clôturée':'En cours'}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    {l:'Revenus (DEMO)', v:money(tp.gross),               c:'#059669'},
                    {l:'TPS (DEMO)',     v:money2(tp.tpsCollected),       c:'#7C3AED'},
                    {l:'TVQ (DEMO)',     v:money2(tp.tvqCollected),       c:'#4F46E5'},
                    {l:'À remettre',     v:money2(tp.tpsCollected+tp.tvqCollected),c:'#DC2626'},
                  ].map(r=>(
                    <div key={r.l} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-center">
                      <div className="text-sm font-black" style={{color:r.c}}>{r.v}</div>
                      <div className="text-sm text-slate-400 mt-0.5">{r.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── PLATEFORMES ── */}
        {tab==='platforms'&&(
          <div className="space-y-3">
            <div className="text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">
              Connexions affichées = état de la démo PILOTE · Aucune API Uber réelle connectée
            </div>
            {ENT_CONNECTIONS.map(c=>{
              const cs = CONN_STATUS[c.status]??{label:c.status,color:'#64748B',dot:'bg-slate-400'}
              return (
                <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${cs.dot}`}/>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{c.name}</span>
                        <span className="text-sm font-bold px-1.5 py-0.5 rounded-full" style={{color:cs.color,background:`${cs.color}15`}}>{cs.label}</span>
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">{c.type}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div><span className="text-slate-400">Données reçues: </span><span className="font-bold text-slate-700 dark:text-slate-300">{c.dataRx.toLocaleString('fr-CA')}</span></div>
                        <div><span className="text-slate-400">Dernière sync: </span><span className="font-mono text-slate-500">{c.lastSync?fmtDt(c.lastSync):'—'}</span></div>
                        <div><span className="text-slate-400">Erreurs: </span><span className={`font-bold ${c.errors>0?'text-red-500':'text-green-600 dark:text-green-400'}`}>{c.errors}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── DOSSIERS ── */}
        {tab==='cases'&&(
          <div className="space-y-3">
            <div className="flex gap-1.5 flex-wrap">
              {['ALL','EN ANALYSE','OUVERT','RÉSOLU','FERMÉ'].map(s=>(
                <button key={s} onClick={()=>setCaseStatus(s)} className="px-2.5 py-1.5 rounded-xl text-sm font-bold border cursor-pointer transition-all" style={{background:caseStatus===s?'#000':'transparent',color:caseStatus===s?'white':'#64748B',borderColor:caseStatus===s?'#000':'rgba(148,163,184,0.30)'}}>
                  {s==='ALL'?`Tous (${COMPLIANCE_CASES.length})`:CASE_STATUS_CONF[s]?.label??s}
                </button>
              ))}
            </div>
            {filteredCases.map(c=>{
              const tc = CASE_TYPE_CONF[c.type]!
              const sc = CASE_STATUS_CONF[c.status]!
              const dept = DEPARTMENTS.find(d=>d.slug===c.dept)
              return (
                <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">{tc.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-mono font-bold text-slate-600 dark:text-slate-400">{c.id}</span>
                        <span className="text-sm font-bold px-1.5 py-0.5 rounded-full" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                        <span className="text-xs font-bold" style={{color:PRIORITY_CONF[c.priority]?.color??'#64748B'}}>{c.priority}</span>
                        {dept&&<span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{color:dept.color,background:`${dept.color}15`}}>{dept.emoji} {dept.name}</span>}
                      </div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-0.5">{tc.label} · {c.obj}: {c.objId}</div>
                      <div className="text-sm text-slate-500">{c.desc}</div>
                      {c.notes&&<div className="text-sm text-blue-600 dark:text-blue-400 mt-0.5 italic">Note: {c.notes}</div>}
                      <div className="text-sm text-slate-400 mt-1">Ouvert: {fmtDt(c.openedAt)} · Assigné: {c.assignedTo??'Non assigné'}</div>
                      {c.resolvedAt&&<div className="text-sm text-green-600 dark:text-green-400">Résolu: {fmtDt(c.resolvedAt)}</div>}
                      <div className="flex gap-1.5 flex-wrap mt-2">
                        {c.actions.map(a=>(
                          <button key={a} className="px-2 py-1 rounded-lg text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100">{a}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── PRÊT GOV ── */}
        {tab==='readiness'&&(
          <div className="space-y-4">
            <div className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 px-3 py-2 rounded-xl">
              ⚠️ MODE PILOTE · AUCUNE TRANSMISSION GOUVERNEMENTALE RÉELLE · Indicateurs administratifs uniquement
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Checklist préparation</div>
              {READINESS_CHECKLIST.map(item=>(
                <div key={item.id} className="flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-lg shrink-0">{item.status==='OK'?'✅':'⚠️'}</span>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.label}</div>
                    <div className="text-sm text-slate-400">{item.note}</div>
                  </div>
                  <span className={`text-sm font-bold px-1.5 py-0.5 rounded-full shrink-0 ${item.status==='OK'?'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10':'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10'}`}>{item.status==='OK'?'Prêt':'Attention'}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="py-2.5 rounded-xl text-sm font-bold bg-slate-800 text-white cursor-pointer">📋 Préparer la transmission · DEMO</button>
              <div className="py-2.5 rounded-xl text-sm font-bold text-center bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">⛔ Transmettre au gouvernement — Non disponible</div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
