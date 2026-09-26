'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { PILOT, money, money2, fmtDt, CURRENT_ENT, DEPARTMENTS, ENT_DRIVERS, ENT_VEHICLES, ENT_DOCS_FULL, ENT_ACTIVITIES, ENT_TRANSACTIONS, ENT_CONNECTIONS, CONN_STATUS, ALL_NOTIFICATIONS, ANOMALIES, GOV_MESSAGES, ALL_DECLARATIONS, ALL_PAYMENTS, TAX_PERIODS, AUDIT_EVENTS, SECURITY_SESSIONS, API_ENDPOINTS, WEBHOOK_EVENTS_FULL, ANALYTICS_MONTHLY } from '@/lib/data'

export default function ControlCenterPage() {
  const active     = DEPARTMENTS.filter(d=>d.status==='ACTIVE')
  const totalGross = active.reduce((s,d)=>s+d.gross,0)
  const totalTPS   = active.reduce((s,d)=>s+d.tps,0)
  const totalTVQ   = active.reduce((s,d)=>s+d.tvq,0)
  const totalTips  = active.reduce((s,d)=>s+d.tips,0)
  const totalDrvs  = active.reduce((s,d)=>s+d.drivers,0)
  const totalVehs  = active.reduce((s,d)=>s+d.vehicles,0)
  const totalActs  = active.reduce((s,d)=>s+d.activities,0)

  const unreadN    = ALL_NOTIFICATIONS.filter(n=>!n.read).length
  const critAnom   = ANOMALIES.filter(a=>a.level==='CRITIQUE'&&a.status!=='RÉSOLUE').length
  const openAnom   = ANOMALIES.filter(a=>a.status!=='RÉSOLUE').length
  const newGovMsg  = GOV_MESSAGES.filter(m=>m.status==='NOUVELLE').length
  const expDocs    = ENT_DOCS_FULL.filter(d=>d.status==='EXPIRED'||d.status==='EXPIRING').length
  const exceptions = ENT_TRANSACTIONS.filter(t=>t.status==='EXCEPTION').length
  const activeSess = SECURITY_SESSIONS.filter(s=>s.status==='ACTIVE').length
  const connAPI    = API_ENDPOINTS.filter(a=>a.status==='CONNECTED').length
  const whFailed   = WEBHOOK_EVENTS_FULL.filter(w=>w.status==='FAILED').length

  const maxMonth   = Math.max(...ANALYTICS_MONTHLY.map(m=>m.gross))

  const PIPELINE = ['UBER QC','→','TAXIMETER.GOV','→','CHAUFFEURS','→','ACTIVITÉS','→','TRANSACTIONS','→','REVENUS','→','TPS/TVQ','→','DÉCLARATIONS','→','GOV']

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-4 space-y-4 max-w-6xl mx-auto">

        {/* Header Uber */}
        <div className="rounded-2xl p-5 shadow-sm" style={{background:'linear-gradient(135deg, #002B7A 0%, #003DA5 60%, #0047C0 100%)'}}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="font-black tracking-tighter text-white" style={{fontSize:'2rem',fontFamily:'system-ui',letterSpacing:'-0.04em',lineHeight:1}}>uber</div>
                <div className="flex items-center gap-1 ml-1">
                  <span className="font-black" style={{fontFamily:'system-ui',color:'#06B029',fontSize:'0.85rem'}}>Uber</span>
                  <span className="font-black text-white" style={{fontFamily:'system-ui',fontSize:'0.85rem'}}>Eats</span>
                </div>
              </div>
              <div className="text-white font-black text-sm">Enterprise Control Center</div>
              <div className="text-sm mt-0.5" style={{color:'rgba(255,255,255,0.45)'}}>QUÉBEC · {CURRENT_ENT.id} · {PILOT}</div>
            </div>
            <div className="flex gap-2 shrink-0 flex-wrap justify-end">
              {unreadN>0&&<div className="bg-red-500/20 border border-red-500/30 rounded-xl px-2.5 py-2 text-center">
                <div className="text-lg font-black text-red-400">{unreadN}</div>
                <div className="text-xs text-red-400">alertes</div>
              </div>}
              {newGovMsg>0&&<div className="bg-blue-500/20 border border-blue-500/30 rounded-xl px-2.5 py-2 text-center">
                <div className="text-lg font-black text-blue-400">{newGovMsg}</div>
                <div className="text-xs text-blue-400">msg gov</div>
              </div>}
              {critAnom>0&&<div className="bg-amber-500/20 border border-amber-500/30 rounded-xl px-2.5 py-2 text-center">
                <div className="text-lg font-black text-amber-400">{critAnom}</div>
                <div className="text-xs text-amber-400">critiques</div>
              </div>}
            </div>
          </div>

          {/* Pipeline */}
          <div className="mt-3 pt-3 flex items-center gap-1 flex-wrap" style={{borderTop:'1px solid rgba(255,255,255,0.1)'}}>
            {PIPELINE.map((s,i)=>(
              <span key={i} className={s==='→'?'text-sm font-bold':'text-sm font-bold px-2 py-0.5 rounded-lg'} style={s==='→'?{color:'rgba(255,255,255,0.25)'}:{background:'rgba(255,255,255,0.12)',color:'white'}}>{s}</span>
            ))}
          </div>
        </div>

        <div className="text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">
          ⚠️ {PILOT} · enterprise_id: {CURRENT_ENT.id} · DONNÉES SYNTHÉTIQUES · AUCUNE TRANSMISSION GOUVERNEMENTALE RÉELLE
        </div>

        {/* ── BLOC 1 : IDENTITÉ & WORKFORCE ── */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {[
            {l:'Depts actifs',     v:active.length,                             c:'#000',   bg:'bg-slate-100 dark:bg-slate-800',href:'/departments', icon:'🏬'},
            {l:'Chauffeurs (S.)',  v:totalDrvs.toLocaleString('fr-CA'),          c:'#000',   bg:'bg-slate-100 dark:bg-slate-800',href:'/drivers',     icon:'👤'},
            {l:'Véhicules (S.)',   v:totalVehs.toLocaleString('fr-CA'),          c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/10',href:'/vehicles',    icon:'🚗'},
            {l:'Docs ⚠️',          v:expDocs,                                    c:'#B45309',bg:'bg-amber-50 dark:bg-amber-500/10',href:'/documents', icon:'📄'},
            {l:'Activités (S.)',   v:(totalActs/1000).toFixed(0)+'k',            c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/10',href:'/activities',icon:'📍'},
            {l:'Exceptions',       v:exceptions,                                  c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10',href:'/exceptions',  icon:'⚠️'},
          ].map(s=>(
            <Link key={s.l} href={s.href} className={`${s.bg} rounded-xl p-3 text-center hover:opacity-80 transition-opacity border border-white dark:border-transparent`}>
              <div className="text-xl mb-0.5">{s.icon}</div>
              <div className="text-lg font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-sm text-slate-500 mt-0.5 leading-tight">{s.l}</div>
            </Link>
          ))}
        </div>

        {/* ── BLOC 2 : FINANCE & FISCAL ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {l:'Revenus bruts (DEMO)',   v:money(totalGross),   c:'#059669',bg:'bg-green-50 dark:bg-green-500/8',    href:'/revenue'},
            {l:'TPS collectée (DEMO)',   v:money(totalTPS),     c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/8',  href:'/fiscal'},
            {l:'TVQ collectée (DEMO)',   v:money(totalTVQ),     c:'#4F46E5',bg:'bg-indigo-50 dark:bg-indigo-500/8',  href:'/fiscal'},
            {l:'Pourboires (DEMO)',      v:money(totalTips),    c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/8',      href:'/transactions'},
          ].map(s=>(
            <Link key={s.l} href={s.href} className={`${s.bg} rounded-2xl p-4 hover:opacity-90 transition-opacity`}>
              <div className="text-lg font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-sm text-slate-400 mt-1">{s.l}</div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ── BLOC 3 : Graphique + Depts ── */}
          <div className="space-y-3">
            {/* Mini graphique 12 mois */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
              <div className="text-xs font-bold text-slate-800 dark:text-white mb-1">Revenus 12 mois (DEMO)</div>
              <div className="flex items-end gap-0.5 h-16">
                {ANALYTICS_MONTHLY.map(m=>(
                  <div key={m.m} className="flex-1 rounded-t-sm" style={{height:`${(m.gross/maxMonth)*100}%`,background:'#003DA5'}}/>
                ))}
              </div>
              <Link href="/analytics" className="mt-2 block text-center text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">→ Analytics complet</Link>
            </div>

            {/* Départements snapshot */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
              <div className="text-xs font-bold text-slate-800 dark:text-white mb-2">Départements (DEMO)</div>
              {active.map(d=>{
                const pct = Math.round(d.gross/totalGross*100)
                return (
                  <div key={d.id} className="mb-2">
                    <div className="flex justify-between text-sm mb-0.5">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{d.emoji} {d.name}</span>
                      <span className="font-black" style={{color:d.color}}>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{width:`${pct}%`,background:d.color}}/>
                    </div>
                  </div>
                )
              })}
              <Link href="/departments" className="mt-1 block text-center text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">→ Tous les départements</Link>
            </div>
          </div>

          {/* ── BLOC 4 : FISCAL / DÉCLARATIONS ── */}
          <div className="space-y-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
              <div className="text-xs font-bold text-slate-800 dark:text-white mb-3">Fiscalité — Déclarations</div>
              {ALL_DECLARATIONS.map(d=>(
                <div key={d.id} className="flex items-center gap-2 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${d.status==='ACCEPTED'?'bg-green-500':d.status==='DRAFT'?'bg-amber-400':'bg-blue-400'}`}/>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{d.period}</div>
                    <div className="text-sm text-slate-400">{money2(d.tps+d.tvq)} TPS+TVQ · DEMO</div>
                  </div>
                  <span className={`text-sm font-bold px-1.5 py-0.5 rounded-full shrink-0 ${d.status==='ACCEPTED'?'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10':d.status==='DRAFT'?'text-amber-600 bg-amber-50':'text-blue-600 bg-blue-50'}`}>
                    {d.status==='ACCEPTED'?'Acceptée':d.status==='DRAFT'?'Brouillon':'Soumise'}
                  </span>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <Link href="/declarations" className="flex-1 text-center text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">→ Déclarations</Link>
                <Link href="/fiscal" className="flex-1 text-center text-sm font-bold text-purple-600 dark:text-purple-400 hover:underline">→ TPS/TVQ</Link>
              </div>
            </div>

            {/* Obligations & Paiements */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
              <div className="text-xs font-bold text-slate-800 dark:text-white mb-3">Paiements</div>
              {ALL_PAYMENTS.map(p=>(
                <div key={p.id} className="flex items-center gap-2 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-base shrink-0">{p.status==='PAID'?'✅':'⏳'}</span>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{p.period}</div>
                    <div className="text-sm text-slate-400">{money2((p as any).amount??(p as any).due??0)} · DEMO</div>
                  </div>
                  <span className={`text-sm font-bold px-1.5 py-0.5 rounded-full ${p.status==='PAID'?'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10':'text-amber-600 bg-amber-50'}`}>{p.status==='PAID'?'Payé':'À venir'}</span>
                </div>
              ))}
              <Link href="/payments" className="mt-2 block text-center text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">→ Paiements</Link>
            </div>
          </div>

          {/* ── BLOC 5 : CONNEXIONS / SÉCURITÉ / GOV ── */}
          <div className="space-y-3">
            {/* Connexions API */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
              <div className="text-xs font-bold text-slate-800 dark:text-white mb-2">Connexions API</div>
              {[
                {l:'TAXIMETER.GOV',    status:'CONNECTED',  icon:'🏛️'},
                {l:'Uber Platform',    status:'CONNECTED',  icon:'🚗'},
                {l:'Uber Eats API',    status:'CONNECTED',  icon:'🍔'},
                {l:'Revenu Québec',    status:'PLANNED',    icon:'🍁'},
              ].map(c=>{
                const ok = c.status==='CONNECTED'
                return (
                  <div key={c.l} className="flex items-center gap-2 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="text-base shrink-0">{c.icon}</span>
                    <span className="text-sm flex-1 font-bold text-slate-700 dark:text-slate-300">{c.l}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <div className={`w-1.5 h-1.5 rounded-full ${ok?'bg-green-500':'bg-purple-400'}`}/>
                      <span className="text-sm font-bold" style={{color:ok?'#059669':'#7C3AED'}}>{ok?'OK':c.status==='PLANNED'?'Planifié':'Erreur'}</span>
                    </div>
                  </div>
                )
              })}
              {whFailed>0&&<div className="mt-2 text-sm text-red-500 font-bold">⚠️ {whFailed} webhook(s) échoué(s)</div>}
              <Link href="/integrations" className="mt-2 block text-center text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">→ API & Intégrations</Link>
            </div>

            {/* Gouvernement */}
            <div className="rounded-2xl p-4 shadow-sm" style={{background:'linear-gradient(135deg, #002B7A, #003DA5)'}}>
              <div className="text-sm font-bold mb-2" style={{color:'rgba(255,255,255,0.5)'}}>🏛️ TAXIMETER.GOV · PILOTE</div>
              {[
                {l:'Messages gouvernementaux', v:GOV_MESSAGES.length,   c:'rgba(255,255,255,0.9)'},
                {l:'Nouveaux',                  v:newGovMsg,             c:'#DC2626'},
                {l:'Transmissions DEMO',        v:'3 acceptées',         c:'#06B029'},
                {l:'Statut connexion',          v:'SIMULATION',          c:'#B45309'},
              ].map(r=>(
                <div key={r.l} className="flex justify-between py-1" style={{borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
                  <span className="text-sm" style={{color:'rgba(255,255,255,0.5)'}}>{r.l}</span>
                  <span className="text-sm font-black" style={{color:r.c}}>{r.v}</span>
                </div>
              ))}
              <Link href="/government" className="mt-3 block text-center py-1.5 rounded-xl text-sm font-bold bg-white/10 hover:bg-white/20 text-white transition-colors">→ Centre gouvernemental</Link>
            </div>

            {/* Sécurité & Sessions */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
              <div className="text-xs font-bold text-slate-800 dark:text-white mb-2">Sécurité</div>
              {[
                {l:'Sessions actives',    v:activeSess,                             c:'#059669'},
                {l:'APIs connectées',     v:`${connAPI}/${API_ENDPOINTS.length}`,   c:'#059669'},
                {l:'Alertes sécurité',    v:'5',                                    c:'#B45309'},
                {l:'Audit — aujourd\'hui',v:AUDIT_EVENTS.filter(e=>e.at.startsWith('2026-09-18')).length,c:'#003DA5'},
              ].map(r=>(
                <div key={r.l} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-sm text-slate-500">{r.l}</span>
                  <span className="text-sm font-black" style={{color:r.c}}>{r.v}</span>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <Link href="/security" className="flex-1 text-center text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">→ Sécurité</Link>
                <Link href="/audit" className="flex-1 text-center text-sm font-bold text-slate-600 dark:text-slate-400 hover:underline">→ Audit</Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── BLOC 6 : ANOMALIES + NOTIFICATIONS RÉCENTES ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Anomalies */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold text-slate-800 dark:text-white">Intelligence & Anomalies</div>
              <span className="text-sm font-bold text-red-500">{openAnom} ouvertes</span>
            </div>
            {ANOMALIES.slice(0,4).map(a=>(
              <div key={a.id} className="flex items-start gap-2 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${a.level==='CRITIQUE'?'bg-red-500':a.level==='IMPORTANT'?'bg-amber-400':a.level==='ATTENTION'?'bg-purple-400':'bg-blue-400'}`}/>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{a.id}</div>
                  <div className="text-sm text-slate-400 leading-tight">{a.desc.slice(0,80)}…</div>
                </div>
                <span className={`text-xs font-bold shrink-0 px-1 py-0.5 rounded ${a.status!=='RÉSOLUE'?'text-red-500 bg-red-50':'text-green-600 bg-green-50'}`}>{a.status!=='RÉSOLUE'?'⚠️':'✅'}</span>
              </div>
            ))}
            <Link href="/intelligence" className="mt-2 block text-center text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">→ Intelligence complète</Link>
          </div>

          {/* Notifications récentes */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold text-slate-800 dark:text-white">Notifications récentes</div>
              {unreadN>0&&<span className="text-sm font-bold text-red-500">{unreadN} non lues</span>}
            </div>
            {ALL_NOTIFICATIONS.filter(n=>!n.read).slice(0,5).map(n=>(
              <div key={n.id} className="flex items-start gap-2 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${n.priority==='CRITICAL'||n.priority==='HIGH'?'bg-red-500':n.priority==='MEDIUM'?'bg-amber-400':'bg-blue-400'}`}/>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{n.title}</div>
                  <div className="text-sm text-slate-400 truncate">{n.source} · {n.to}</div>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{n.at.split('T')[0]}</span>
              </div>
            ))}
            <Link href="/notifications" className="mt-2 block text-center text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">→ Toutes les notifications</Link>
          </div>
        </div>

        {/* ── BLOC 7 : ACTIONS RAPIDES FULL GRID ── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-800 dark:text-white mb-3">Navigation rapide — Tous les modules</div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {[
              {l:'Configuration', href:'/onboarding',    icon:'⚙️'},
              {l:'Profil',        href:'/profile',       icon:'🏢'},
              {l:'Depts',         href:'/departments',   icon:'🏬'},
              {l:'Services',      href:'/services',      icon:'🚕'},
              {l:'Chauffeurs',    href:'/drivers',       icon:'👤'},
              {l:'Véhicules',     href:'/vehicles',      icon:'🚗'},
              {l:'Activités',     href:'/activities',    icon:'📍'},
              {l:'Opérations',    href:'/operations',    icon:'🎯'},
              {l:'Transactions',  href:'/transactions',  icon:'💳'},
              {l:'Revenus',       href:'/revenue',       icon:'💰'},
              {l:'TPS/TVQ',       href:'/fiscal',        icon:'🧾'},
              {l:'Déclarations',  href:'/declarations',  icon:'📤'},
              {l:'Paiements',     href:'/payments',      icon:'🏦'},
              {l:'Recon.',        href:'/reconciliation',icon:'🔄'},
              {l:'Exceptions',    href:'/exceptions',    icon:'⚠️'},
              {l:'Conformité',    href:'/compliance',    icon:'⚖️'},
              {l:'Analytics',     href:'/analytics',     icon:'📊'},
              {l:'Intelligence',  href:'/intelligence',  icon:'🧠'},
              {l:'Rapports',      href:'/reports',       icon:'📋'},
              {l:'Docs financiers',href:'/financial-documents',icon:'📂'},
              {l:'Connexions',    href:'/connections',   icon:'🔌'},
              {l:'Intégrations',  href:'/integrations',  icon:'⚙️'},
              {l:'Gouvernement',  href:'/government',    icon:'🏛️'},
              {l:'Sécurité',      href:'/security',      icon:'🛡️'},
              {l:'Audit',         href:'/audit',         icon:'🔍'},
              {l:'Notifications', href:'/notifications', icon:'🔔'},
              {l:'Documents',     href:'/documents',     icon:'📄'},
              {l:'Sync',          href:'/sync',          icon:'🔁'},
            ].map(a=>(
              <Link key={a.l} href={a.href} className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl p-2.5 text-center transition-colors group">
                <div className="text-lg mb-0.5 group-hover:scale-110 transition-transform">{a.icon}</div>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-tight">{a.l}</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="text-sm text-slate-400 text-center">
          ⚠️ Enterprise ID: {CURRENT_ENT.id} · Toutes les données appartiennent exclusivement au compte Uber Québec DEMO · {CURRENT_ENT.revenusNote}
        </div>
      </div>
    </AppShell>
  )
}
