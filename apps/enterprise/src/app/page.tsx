'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { PILOT, money, fmtDt, CURRENT_ENT, REVENUE, OBLIGATIONS, CONNECTIONS, NOTIFICATIONS, ENT_DRIVERS, ENT_DOCS } from '@/lib/data'

const r2=(n:number)=>Math.round(n*100)/100
const TPS=0.05; const TVQ=0.09975

export default function Dashboard() {
  const unread = NOTIFICATIONS.filter(n=>!n.read)
  const expDocs = ENT_DOCS.filter(d=>d.status==='EXPIRED'||d.status==='EXPIRING')
  const activeDrv = ENT_DRIVERS.filter(d=>d.status==='ACTIVE').length
  const nextObl = OBLIGATIONS.find(o=>o.status==='UPCOMING')

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        {/* Banner PILOTE */}
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        {/* Header entreprise */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm" style={{borderTop:'3px solid #003DA5'}}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-qc-blue flex items-center justify-center text-2xl shrink-0">🚕</div>
            <div className="flex-1">
              <div className="text-xl font-black text-slate-900 dark:text-white">{CURRENT_ENT.tradeName}</div>
              <div className="text-[10px] text-slate-400">{CURRENT_ENT.legalName} · NEQ: {CURRENT_ENT.neq} · {CURRENT_ENT.city}</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-green-500"/>
                <span className="text-[10px] font-bold text-green-600 dark:text-green-400">Entreprise active · PILOTE</span>
                <span className="text-[9px] text-slate-400">· Conformité: {CURRENT_ENT.compliance}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Alertes actives */}
        {(unread.length>0||expDocs.length>0)&&(
          <div className="space-y-2">
            {expDocs.slice(0,2).map(d=>(
              <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{background:d.status==='EXPIRED'?'rgba(220,38,38,0.06)':'rgba(180,83,9,0.06)',borderColor:d.status==='EXPIRED'?'rgba(220,38,38,0.20)':'rgba(180,83,9,0.20)'}}>
                <span className="text-lg">{d.status==='EXPIRED'?'❌':'⚠️'}</span>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{d.label} — {d.entity}</div>
                  <div className="text-[9px] text-slate-400">{d.status==='EXPIRED'?'EXPIRÉ':'Expire le'}: {d.expires}</div>
                </div>
                <Link href="/documents" className="text-[9px] font-bold text-qc-blue hover:underline">→ Documents</Link>
              </div>
            ))}
          </div>
        )}

        {/* KPI grille */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {l:'Chauffeurs actifs',  v:activeDrv,                            c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/10',   icon:'👨‍✈️',href:'/drivers'},
            {l:'Véhicules',          v:'6',                                   c:'#059669',bg:'bg-green-50 dark:bg-green-500/10', icon:'🚗',  href:'/vehicles'},
            {l:'Activités Q3',       v:(4820).toLocaleString('fr-CA'),        c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/10',icon:'🚕', href:'/activities'},
            {l:'Revenus Q3',         v:money(REVENUE.grossQ3),                c:'#059669',bg:'bg-green-50 dark:bg-green-500/10', icon:'💰',  href:'/revenue'},
            {l:'TPS Q3',             v:money(REVENUE.tpsQ3),                  c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/10',icon:'🧾', href:'/fiscal'},
            {l:'TVQ Q3',             v:money(REVENUE.tvqQ3),                  c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/10',icon:'🧾', href:'/fiscal'},
            {l:'Prochain paiement',  v:nextObl?nextObl.due:'—',              c:'#B45309',bg:'bg-amber-50 dark:bg-amber-500/10', icon:'📅',  href:'/obligations'},
            {l:'Alertes',            v:unread.length+expDocs.length,          c:unread.length+expDocs.length>0?'#DC2626':'#059669',bg:'bg-red-50 dark:bg-red-500/10',icon:'🔔',href:'/notifications'},
          ].map(s=>(
            <Link key={s.l} href={s.href} className={`${s.bg} rounded-2xl p-3.5 border border-white dark:border-transparent shadow-sm hover:shadow-md transition-shadow`}>
              <div className="text-2xl mb-1.5">{s.icon}</div>
              <div className="text-base font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{s.l}</div>
            </Link>
          ))}
        </div>

        {/* Chaîne workflow */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
          <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Flux opérationnel Enterprise Gov</div>
          <div className="flex items-center gap-1 flex-wrap text-[8px] font-bold">
            {['ENTREPRISE','→','CHAUFFEURS','→','TAXIMÈTRE','→','ACTIVITÉS','→','TRANSACTIONS','→','REVENUS','→','TPS/TVQ','→','DÉCLARATIONS','→','TAXIMETER.GOV'].map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-300 dark:text-slate-700':'px-2 py-1 rounded-lg'} style={s!=='→'?{background:'#EEF3FB',color:'#003DA5'}:{}}>{s}</span>
            ))}
          </div>
        </div>

        {/* Connexions status */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Connexions actives</div>
          {CONNECTIONS.map(c=>{
            const cs = c.status==='CONNECTED'?{color:'#059669',dot:'bg-green-500'}:c.status==='SIMULATION'?{color:'#B45309',dot:'bg-amber-400'}:{color:'#DC2626',dot:'bg-red-500'}
            return (
              <div key={c.id} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div className={`w-2 h-2 rounded-full shrink-0 ${cs.dot}`}/>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{c.provider}</div>
                  <div className="text-[9px] text-slate-400">{c.method} · {c.dataRx.toLocaleString('fr-CA')} enr. · Erreurs: {c.errors}</div>
                </div>
                <span className="text-[9px] font-bold" style={{color:cs.color}}>{c.status}</span>
                <div className="text-[8px] font-mono text-slate-400 hidden md:block">{fmtDt(c.lastSync)}</div>
              </div>
            )
          })}
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            {href:'/declarations', l:'📤 Préparer déclaration Q3', c:'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20'},
            {href:'/drivers',      l:'👨‍✈️ Gérer chauffeurs',         c:'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20'},
            {href:'/documents',    l:'📄 Documents à renouveler',   c:'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'},
            {href:'/reconciliation',l:'🔄 Réconciliation',           c:'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20'},
          ].map(a=>(
            <Link key={a.href} href={a.href} className={`${a.c} border rounded-xl px-3 py-2.5 text-[9px] font-bold text-slate-700 dark:text-slate-200 hover:opacity-80 transition-opacity`}>{a.l}</Link>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
