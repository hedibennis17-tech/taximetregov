'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import {
  PILOT, money, money2, fmtDt,
  CURRENT_ENT, REVENUE, OBLIGATIONS, CONNECTIONS, NOTIFICATIONS,
  ENT_DRIVERS, ENT_VEHICLES, ENT_DOCS, ENT_ACTIVITIES, ENT_TRANSACTIONS,
  RECENT_EVENTS, MONTHLY, CONN_STATUS, OBL_STATUS, DOC_STATUS
} from '@/lib/data'

const r2=(n:number)=>Math.round(n*100)/100
const TPS=0.05; const TVQ=0.09975

const PROVIDERS = [
  {name:'Uber',       status:'SIMULATION',note:'Non connecté — DEMO'},
  {name:'Lyft',       status:'SIMULATION',note:'Non connecté — DEMO'},
  {name:'DoorDash',   status:'SIMULATION',note:'Non connecté — DEMO'},
  {name:'Skip',       status:'SIMULATION',note:'Non connecté — DEMO'},
  {name:'Uber Eats',  status:'SIMULATION',note:'Non connecté — DEMO'},
  {name:'DHL',        status:'SIMULATION',note:'Non connecté — DEMO'},
]

const maxMonth = Math.max(...MONTHLY.map(m=>m.gross))

export default function Dashboard() {
  const unread    = NOTIFICATIONS.filter(n=>!n.read).length
  const expDocs   = ENT_DOCS.filter(d=>d.status==='EXPIRED'||d.status==='EXPIRING').length
  const activeDrv = ENT_DRIVERS.filter(d=>d.status==='ACTIVE').length
  const activeVeh = ENT_VEHICLES.filter(v=>v.status==='ACTIVE').length
  const nextObl   = OBLIGATIONS.find(o=>o.status==='UPCOMING')
  const exceptions= ENT_TRANSACTIONS.filter(t=>t.status==='EXCEPTION').length
  const grossToday= ENT_TRANSACTIONS.reduce((s,t)=>s+t.gross,0)

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-5xl mx-auto">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        {/* Header entreprise */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm" style={{borderTop:'3px solid #003DA5'}}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-qc-blue flex items-center justify-center text-2xl shrink-0">🚕</div>
            <div className="flex-1">
              <div className="text-xl font-black text-slate-900 dark:text-white">{CURRENT_ENT.tradeName}</div>
              <div className="text-[10px] text-slate-400">{CURRENT_ENT.legalName} · NEQ: {CURRENT_ENT.neq} · {CURRENT_ENT.city}, {CURRENT_ENT.province}</div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"/><span className="text-[9px] font-bold text-green-600 dark:text-green-400">Entreprise active · PILOTE</span></div>
                <span className="text-[9px] text-slate-400">Vérifié · {CURRENT_ENT.jurisdiction}</span>
                <span className="text-[9px] text-slate-400">Sync: {fmtDt(CONNECTIONS[0]!.lastSync)}</span>
              </div>
            </div>
            {unread>0&&<div className="shrink-0 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-3 py-2 text-center">
              <div className="text-lg font-black text-red-500">{unread}</div>
              <div className="text-[8px] text-red-500">alertes</div>
            </div>}
          </div>
          {/* Chaîne workflow */}
          <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-100 dark:border-blue-500/15 rounded-xl px-3 py-2">
            <div className="flex items-center gap-1 flex-wrap text-[8px] font-bold text-blue-700 dark:text-blue-400">
              {['🏢 ENTREPRISE','→','👤 CHAUFFEURS','→','🚗 VÉHICULES','→','🚕 ACTIVITÉS','→','💳 TRANSACTIONS','→','💰 REVENUS','→','🧾 TPS/TVQ','→','📤 DÉCLARATIONS','→','TAXIMETER.GOV'].map((s,i)=>(
                <span key={i} className={s==='→'?'text-blue-300 dark:text-blue-800':''}>{s}</span>
              ))}
            </div>
          </div>
        </div>

        {/* KPI grille */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {[
            {l:'Chauffeurs actifs',  v:activeDrv,           c:'#003DA5', bg:'bg-blue-50 dark:bg-blue-500/10',   icon:'👨‍✈️', href:'/drivers'},
            {l:'Véhicules actifs',   v:activeVeh,           c:'#059669', bg:'bg-green-50 dark:bg-green-500/10', icon:'🚗',  href:'/vehicles'},
            {l:'Activités Q3',       v:ENT_ACTIVITIES.length, c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/10',icon:'📍', href:'/activities'},
            {l:'Transactions',       v:ENT_TRANSACTIONS.length,c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/10', icon:'💳',  href:'/transactions'},
            {l:'Exceptions',         v:exceptions,          c:'#DC2626', bg:'bg-red-50 dark:bg-red-500/10',     icon:'⚠️',  href:'/exceptions'},
            {l:'Docs à renouveler',  v:expDocs,             c:'#B45309', bg:'bg-amber-50 dark:bg-amber-500/10', icon:'📄',  href:'/documents'},
          ].map(s=>(
            <Link key={s.l} href={s.href} className={`${s.bg} rounded-xl p-3 text-center hover:opacity-80 transition-opacity border border-white dark:border-transparent`}>
              <div className="text-xl mb-0.5">{s.icon}</div>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[8px] text-slate-500 mt-0.5 leading-tight">{s.l}</div>
            </Link>
          ))}
        </div>

        {/* Revenus + TPS/TVQ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {l:'Revenus bruts Q3',   v:money(REVENUE.grossQ3), c:'#059669',bg:'bg-green-50 dark:bg-green-500/8'},
            {l:'Revenus nets Q3',    v:money(REVENUE.netQ3),   c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/8'},
            {l:'TPS collectée Q3',   v:money(REVENUE.tpsQ3),   c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/8'},
            {l:'TVQ collectée Q3',   v:money(REVENUE.tvqQ3),   c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/8'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-2xl p-4 border border-white dark:border-transparent`}>
              <div className="text-lg font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Graphique activités mensuelles */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="text-sm font-bold text-slate-800 dark:text-white mb-1">Revenus mensuels</div>
            <div className="text-[9px] text-slate-400 mb-4">Avr — Sep 2026 (PILOTE)</div>
            <div className="flex items-end gap-2 h-28">
              {MONTHLY.map(m=>(
                <div key={m.m} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[8px] font-bold text-green-600 dark:text-green-400">{(m.gross/1000).toFixed(0)}k</div>
                  <div className="w-full rounded-t-lg transition-all" style={{height:`${(m.gross/maxMonth)*100}%`,background:'#003DA5',opacity:0.8}}/>
                  <div className="text-[8px] text-slate-400">{m.m}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Alertes + notifications */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Alertes et notifications</div>
            {NOTIFICATIONS.map(n=>(
              <div key={n.id} className={`flex items-start gap-2.5 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 ${!n.read?'opacity-100':'opacity-60'}`}>
                <span className="text-base shrink-0">{n.type==='CRITICAL'?'🚨':n.type==='WARNING'?'⚠️':n.type==='SUCCESS'?'✅':'ℹ️'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{n.title}</div>
                  <div className="text-[9px] text-slate-400">{n.desc}</div>
                </div>
                {!n.read&&<div className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1"/>}
              </div>
            ))}
          </div>
        </div>

        {/* Obligation prochaine */}
        {nextObl&&(
          <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
            <div>
              <div className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-0.5">📅 Prochaine obligation fiscale</div>
              <div className="text-sm font-black text-slate-800 dark:text-white">{nextObl.type} — {nextObl.period}</div>
              <div className="text-[9px] text-slate-500">Échéance: {nextObl.due} · Montant estimé: {money2(nextObl.amount)}</div>
            </div>
            <Link href="/obligations" className="px-4 py-2 rounded-xl text-[10px] font-bold bg-blue-600 text-white hover:bg-blue-700 shrink-0">→ Voir obligations</Link>
          </div>
        )}

        {/* Connexions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Connexions</div>
          <div className="space-y-2">
            {CONNECTIONS.map(c=>{
              const cs = CONN_STATUS[c.status]!
              return (
                <div key={c.id} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${cs.dot}`}/>
                  <div className="flex-1 text-[10px] font-bold text-slate-800 dark:text-slate-200">{c.provider}</div>
                  <div className="text-[9px] text-slate-400">{c.dataRx.toLocaleString('fr-CA')} enreg.</div>
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{color:cs.color,background:'rgba(0,0,0,0.05)'}}>{cs.label}</span>
                </div>
              )
            })}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[8px] font-bold text-slate-400 mb-1">Fournisseurs non connectés (architecture future)</div>
              <div className="flex gap-1.5 flex-wrap">
                {PROVIDERS.map(p=>(
                  <span key={p.name} className="text-[8px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-lg">{p.name} · DEMO</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Activité récente */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Activité récente</div>
          {RECENT_EVENTS.slice(0,6).map((e,i)=>(
            <div key={i} className="flex items-start gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <span className="text-base shrink-0">{e.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{e.title}</div>
                <div className="text-[9px] text-slate-400">{e.desc}</div>
              </div>
              <div className="text-[8px] font-mono text-slate-400 shrink-0 whitespace-nowrap">{fmtDt(e.at)}</div>
            </div>
          ))}
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {[
            {l:'+ Chauffeur',  href:'/drivers',      icon:'👨‍✈️'},
            {l:'+ Véhicule',   href:'/vehicles',     icon:'🚗'},
            {l:'+ Document',   href:'/documents',    icon:'📄'},
            {l:'Transactions', href:'/transactions', icon:'💳'},
            {l:'Fiscalité',    href:'/fiscal',       icon:'🧾'},
            {l:'Connexions',   href:'/connections',  icon:'🔌'},
          ].map(a=>(
            <Link key={a.l} href={a.href} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center hover:border-blue-300 dark:hover:border-blue-500 transition-colors shadow-sm">
              <div className="text-xl mb-1">{a.icon}</div>
              <div className="text-[9px] font-bold text-slate-700 dark:text-slate-300">{a.l}</div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
