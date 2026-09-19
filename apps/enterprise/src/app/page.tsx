'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import {
  PILOT, money, money2, fmtDt,
  CURRENT_ENT, REVENUE, OBLIGATIONS, ENT_CONNECTIONS, NOTIFICATIONS,
  ENT_DRIVERS, ENT_VEHICLES, ENT_DOCS, ENT_ACTIVITIES, ENT_TRANSACTIONS,
  RECENT_EVENTS, MONTHLY, CONN_STATUS, OBL_STATUS
} from '@/lib/data'

const PROVIDERS_DEMO = [
  {name:'Uber Taxi', emoji:'🚕', status:'ACTIF'},
  {name:'UberX',     emoji:'🚗', status:'ACTIF'},
  {name:'Uber Green',emoji:'🟢', status:'ACTIF'},
  {name:'UberXL',    emoji:'🚙', status:'ACTIF'},
  {name:'Uber Eats', emoji:'🍔', status:'ACTIF'},
  {name:'Uber Eats Grocery',emoji:'🛒',status:'ACTIF'},
  {name:'Uber Delivery',emoji:'📦',status:'PLANIFIÉ'},
]

const maxMonth = Math.max(...MONTHLY.map(m=>m.gross))

export default function Dashboard() {
  const unread    = NOTIFICATIONS.filter(n=>!n.read).length
  const expDocs   = ENT_DOCS.filter(d=>d.status==='EXPIRED'||d.status==='EXPIRING').length
  const activeDrv = ENT_DRIVERS.filter(d=>d.status==='ACTIVE').length
  const activeVeh = ENT_VEHICLES.filter(v=>v.status==='ACTIVE').length
  const nextObl   = OBLIGATIONS.find(o=>o.status==='UPCOMING')
  const exceptions= ENT_TRANSACTIONS.filter(t=>t.status==='EXCEPTION').length

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-5xl mx-auto">

        {/* Bandeau DEMO */}
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT} · Compte démonstration TAXIMETER.GOV · Données synthétiques</div>

        {/* Header Uber */}
        <div className="rounded-2xl p-5 shadow-sm" style={{background:'#000000',borderTop:'3px solid #000000'}}>
          <div className="flex items-center gap-5 mb-4">
            {/* Logo Uber texte blanc */}
            <div className="shrink-0">
              <div className="text-white font-black tracking-tighter" style={{fontSize:'2.8rem',fontFamily:'system-ui',letterSpacing:'-0.04em',lineHeight:1}}>uber</div>
              <div className="text-[9px] font-bold mt-0.5" style={{color:'rgba(255,255,255,0.5)'}}>COMPTE DÉMO — TAXIMETER.GOV</div>
            </div>
            <div className="flex-1">
              <div className="text-white text-lg font-black">{CURRENT_ENT.legalName}</div>
              <div className="text-[10px]" style={{color:'rgba(255,255,255,0.6)'}}>{CURRENT_ENT.tradeName} · NEQ: {CURRENT_ENT.neq} · {CURRENT_ENT.jurisdiction}</div>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-400"/><span className="text-[9px] font-bold text-green-400">Entreprise active · PILOTE</span></div>
                <span className="text-[9px]" style={{color:'rgba(255,255,255,0.5)'}}>Vérifié · {CURRENT_ENT.jurisdiction}</span>
              </div>
            </div>
            {unread>0&&<div className="shrink-0 bg-red-500/20 border border-red-500/30 rounded-xl px-3 py-2 text-center">
              <div className="text-lg font-black text-red-400">{unread}</div>
              <div className="text-[8px] text-red-400">alertes</div>
            </div>}
          </div>

          {/* Services actifs */}
          <div className="flex gap-1.5 flex-wrap mb-3">
            {PROVIDERS_DEMO.map(p=>(
              <span key={p.name} className={`text-[8px] font-bold px-2 py-1 rounded-lg ${p.status==='ACTIF'?'text-black bg-white':'text-white border border-white/20'}`}>
                {p.emoji} {p.name}
              </span>
            ))}
          </div>

          {/* Chiffres 2024 estimés */}
          <div className="rounded-xl px-3 py-2.5" style={{background:'rgba(255,255,255,0.08)'}}>
            <div className="text-[8px] font-bold mb-1.5" style={{color:'rgba(255,255,255,0.5)'}}>
              ESTIMATION 2024 — DONNÉES PUBLIQUES ADAPTÉES — NE REPRÉSENTE PAS LES ÉTATS FINANCIERS D'UBER
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                {l:'Revenus QC estimés 2024',  v:'~380 M$',      note:'Estimation DEMO'},
                {l:'Chauffeurs actifs QC',      v:'~17 000',      note:'Données publiques Uber'},
                {l:'Courses annuelles QC',      v:'~45 M',        note:'Estimation DEMO'},
              ].map(s=>(
                <div key={s.l}>
                  <div className="text-white font-black text-lg">{s.v}</div>
                  <div className="text-[8px]" style={{color:'rgba(255,255,255,0.5)'}}>{s.l}</div>
                  <div className="text-[7px]" style={{color:'rgba(255,255,255,0.3)'}}>{s.note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chaîne workflow */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-1 flex-wrap text-[8px] font-bold text-blue-700 dark:text-blue-400">
            {['🏢 UBER QC','→','👤 CHAUFFEURS','→','🚗 VÉHICULES','→','🚕 ACTIVITÉS','→','💳 TRANSACTIONS','→','💰 REVENUS','→','🧾 TPS/TVQ','→','📤 DÉCLARATIONS','→','TAXIMETER.GOV'].map((s,i)=>(
              <span key={i} className={s==='→'?'text-blue-200 dark:text-blue-900':''}>{s}</span>
            ))}
          </div>
        </div>

        {/* KPI Q3 DEMO */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {[
            {l:'Chauffeurs actifs',  v:activeDrv,             c:'#000000',bg:'bg-slate-100 dark:bg-slate-800', icon:'👤', href:'/drivers'},
            {l:'Véhicules actifs',   v:activeVeh,             c:'#059669',bg:'bg-green-50 dark:bg-green-500/10',icon:'🚗', href:'/vehicles'},
            {l:'Activités Q3',       v:ENT_ACTIVITIES.length, c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/10',icon:'📍',href:'/activities'},
            {l:'Transactions',       v:ENT_TRANSACTIONS.length,c:'#000000',bg:'bg-slate-100 dark:bg-slate-800', icon:'💳',href:'/transactions'},
            {l:'Exceptions',         v:exceptions,            c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10',   icon:'⚠️',href:'/exceptions'},
            {l:'Docs à renouveler',  v:expDocs,               c:'#B45309',bg:'bg-amber-50 dark:bg-amber-500/10',icon:'📄',href:'/documents'},
          ].map(s=>(
            <Link key={s.l} href={s.href} className={`${s.bg} rounded-xl p-3 text-center hover:opacity-80 transition-opacity border border-white dark:border-transparent`}>
              <div className="text-xl mb-0.5">{s.icon}</div>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[8px] text-slate-500 mt-0.5 leading-tight">{s.l}</div>
            </Link>
          ))}
        </div>

        {/* Revenus + TPS/TVQ Q3 DEMO */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {l:'Revenus bruts Q3 (DEMO)',   v:money(REVENUE.grossQ3),c:'#059669',bg:'bg-green-50 dark:bg-green-500/8'},
            {l:'Revenus nets Q3 (DEMO)',    v:money(REVENUE.netQ3),  c:'#000000',bg:'bg-slate-100 dark:bg-slate-800'},
            {l:'TPS collectée Q3 (DEMO)',   v:money(REVENUE.tpsQ3),  c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/8'},
            {l:'TVQ collectée Q3 (DEMO)',   v:money(REVENUE.tvqQ3),  c:'#7C3AED',bg:'bg-indigo-50 dark:bg-indigo-500/8'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-2xl p-4 border border-white dark:border-transparent`}>
              <div className="text-lg font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Graphique mensuel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="text-sm font-bold text-slate-800 dark:text-white mb-1">Revenus mensuels (DEMO)</div>
            <div className="text-[9px] text-slate-400 mb-4">Avr — Sep 2026 · Données synthétiques</div>
            <div className="flex items-end gap-2 h-28">
              {MONTHLY.map(m=>(
                <div key={m.m} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[8px] font-bold text-green-600 dark:text-green-400">{(m.gross/1000).toFixed(0)}k</div>
                  <div className="w-full rounded-t-lg" style={{height:`${(m.gross/maxMonth)*100}%`,background:'#000000',opacity:0.85}}/>
                  <div className="text-[8px] text-slate-400">{m.m}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Alertes */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Alertes et notifications</div>
            {NOTIFICATIONS.map(n=>(
              <div key={n.id} className={`flex items-start gap-2.5 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 ${!n.read?'opacity-100':'opacity-55'}`}>
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

        {/* Prochaine obligation */}
        {nextObl&&(
          <div className="rounded-2xl p-4 flex items-center justify-between gap-3" style={{background:'#000000'}}>
            <div>
              <div className="text-[9px] font-bold mb-0.5" style={{color:'rgba(255,255,255,0.6)'}}>📅 Prochaine obligation fiscale</div>
              <div className="text-sm font-black text-white">{nextObl.type} — {nextObl.period}</div>
              <div className="text-[9px]" style={{color:'rgba(255,255,255,0.5)'}}>Échéance: {nextObl.due} · Montant estimé: {money2(nextObl.amount)} · DEMO</div>
            </div>
            <Link href="/obligations" className="px-4 py-2 rounded-xl text-[10px] font-bold bg-white text-black hover:bg-slate-100 shrink-0">→ Obligations</Link>
          </div>
        )}

        {/* Connexions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Connexions</div>
          {ENT_CONNECTIONS.map(c=>{
            const cs = CONN_STATUS[c.status] ?? {label:c.status,color:'#64748B',dot:'bg-slate-400'}
            return (
              <div key={c.id} className="flex items-center gap-3 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${cs.dot}`}/>
                <div className="flex-1 text-[10px] font-bold text-slate-800 dark:text-slate-200">{c.name}</div>
                <div className="text-[9px] text-slate-400">{c.dataRx.toLocaleString('fr-CA')} enreg.</div>
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{color:cs.color,background:'rgba(0,0,0,0.05)'}}>{cs.label}</span>
              </div>
            )
          })}
        </div>

        {/* Activité récente */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Activité récente</div>
          {RECENT_EVENTS.slice(0,5).map((e,i)=>(
            <div key={i} className="flex items-start gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <span className="text-base shrink-0">{e.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{e.title}</div>
                <div className="text-[9px] text-slate-400">{e.desc}</div>
              </div>
              <div className="text-[8px] font-mono text-slate-400 shrink-0">{fmtDt(e.at)}</div>
            </div>
          ))}
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {[
            {l:'+ Chauffeur',  href:'/drivers',      icon:'👤'},
            {l:'+ Véhicule',   href:'/vehicles',     icon:'🚗'},
            {l:'Transactions', href:'/transactions', icon:'💳'},
            {l:'Fiscalité',    href:'/fiscal',       icon:'🧾'},
            {l:'Déclarations', href:'/declarations', icon:'📤'},
            {l:'Documents',    href:'/financial-documents',icon:'📄'},
          ].map(a=>(
            <Link key={a.l} href={a.href} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center hover:border-black dark:hover:border-white transition-colors shadow-sm">
              <div className="text-xl mb-1">{a.icon}</div>
              <div className="text-[9px] font-bold text-slate-700 dark:text-slate-300">{a.l}</div>
            </Link>
          ))}
        </div>

        <div className="text-[8px] text-slate-400 text-center leading-relaxed">
          ⚠️ {CURRENT_ENT.revenusNote}
        </div>
      </div>
    </AppShell>
  )
}
