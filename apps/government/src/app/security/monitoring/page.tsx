'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { PILOT, fmtDt, SERVICES_STATUS, SECURITY_EVENTS, SEV_CONF } from '@/lib/security-data'

const NAV = [
  {href:'/security/center',    l:'🛡️ Security Center', active:false},
  {href:'/security/monitoring',l:'📡 Monitoring',       active:true},
  {href:'/security/sessions',  l:'🔑 Sessions',         active:false},
  {href:'/governance/center',  l:'⚖️ Gouvernance',      active:false},
  {href:'/privacy/center',     l:'🔒 Confidentialité',  active:false},
]

const MONITORING_EVENTS = [
  { at:'2026-09-18T10:38:00Z', event:'Webhook reçu — UBER DEMO',              type:'WEBHOOK',   status:'OK'  },
  { at:'2026-09-18T10:35:00Z', event:'Authentification API complétée',         type:'AUTH',      status:'OK'  },
  { at:'2026-09-18T10:32:00Z', event:'Transaction synchronisée TX-DEMO-1001',  type:'SYNC',      status:'OK'  },
  { at:'2026-09-18T10:29:00Z', event:'Transaction dupliquée détectée (bloquée)',type:'DEDUP',     status:'WARNING'},
  { at:'2026-09-18T10:20:00Z', event:'Validation données complétée',           type:'VALIDATION',status:'OK'  },
  { at:'2026-09-18T10:15:00Z', event:'Pipeline réconciliation complété',        type:'PIPELINE',  status:'OK'  },
  { at:'2026-09-18T10:05:00Z', event:'Session expirée — token révoqué',         type:'SESSION',   status:'OK'  },
  { at:'2026-09-18T09:45:00Z', event:'Calcul TPS/TVQ Q3 — batch 847 enreg.',  type:'FISCAL',    status:'OK'  },
  { at:'2026-09-18T09:37:00Z', event:'Tentative auth échouée — DRV-DEMO-014', type:'AUTH',      status:'WARNING'},
  { at:'2026-09-18T09:15:00Z', event:'Credentials API renouvelées — ENT-002',  type:'API',       status:'OK'  },
  { at:'2026-09-18T09:00:00Z', event:'Backup données chiffré (DEMO)',           type:'INFRA',     status:'OK'  },
  { at:'2026-09-18T08:42:00Z', event:'Connexion admin réussie ADMIN-DEMO-001', type:'AUTH',      status:'OK'  },
  { at:'2026-09-18T08:30:00Z', event:'Rapport audit généré RPT-GOV-C001',      type:'REPORT',    status:'OK'  },
  { at:'2026-09-18T08:00:00Z', event:'Vérification intégrité base DEMO',       type:'INTEGRITY', status:'OK'  },
  { at:'2026-09-18T07:00:00Z', event:'Démarrage services pilote DEMO',         type:'SYSTEM',    status:'OK'  },
]

const TYPE_COLORS: Record<string,string> = {
  WEBHOOK:'#7C3AED',AUTH:'#003DA5',SYNC:'#059669',DEDUP:'#B45309',
  VALIDATION:'#059669',PIPELINE:'#003DA5',SESSION:'#64748B',
  FISCAL:'#7C3AED',API:'#003DA5',INFRA:'#64748B',REPORT:'#059669',INTEGRITY:'#003DA5',SYSTEM:'#64748B',
}

export default function MonitoringPage() {
  const warnings = MONITORING_EVENTS.filter(e=>e.status==='WARNING').length
  const totalEvents = SERVICES_STATUS.reduce((s,sv)=>s+sv.events,0)

  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Monitoring</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">Surveillance temps réel · Services · Événements · TAXIMETER.GOV DEMO</p>
        <div className="flex gap-1.5 overflow-x-auto pb-3 flex-nowrap">
          {NAV.map(n=><Link key={n.href} href={n.href} className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap" style={{background:n.active?'#003DA5':'transparent',color:n.active?'white':'#64748B',borderColor:n.active?'#003DA5':'rgba(148,163,184,0.30)'}}>{n.l}</Link>)}
        </div>
      </div>

      <div className="px-4 md:px-6 pb-8 space-y-5">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:'Services en ligne',  v:`${SERVICES_STATUS.filter(s=>s.status==='ONLINE').length}/${SERVICES_STATUS.length}`, c:'#059669', bg:'bg-green-50 dark:bg-green-500/10', icon:'✅'},
            {l:'Événements (24h)',   v:MONITORING_EVENTS.length, c:'#003DA5', bg:'bg-blue-50 dark:bg-blue-500/10', icon:'📊'},
            {l:'Avertissements',     v:warnings, c:'#B45309', bg:'bg-amber-50 dark:bg-amber-500/10', icon:'⚠️'},
            {l:'Total logs (DEMO)',  v:totalEvents.toLocaleString('fr-CA'), c:'#7C3AED', bg:'bg-purple-50 dark:bg-purple-500/10', icon:'📋'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center border border-white dark:border-transparent`}>
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Services */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800 dark:text-white">État des services</span>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-green-600 dark:text-green-400"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>Tous ONLINE</div>
          </div>
          {SERVICES_STATUS.map(s=>(
            <div key={s.name} className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <div className="w-2 h-2 rounded-full bg-green-500 shrink-0"/>
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{s.name}</div>
                <div className="text-[9px] text-slate-400">{s.events.toLocaleString('fr-CA')} événements · Vérifié {fmtDt(s.lastCheck)}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-black text-green-600 dark:text-green-400">{s.resp}ms</div>
                <div className="text-[9px] text-slate-400">Latence</div>
              </div>
              {s.alerts>0&&<span className="text-[8px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-full">⚠ {s.alerts}</span>}
            </div>
          ))}
        </div>

        {/* Alertes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Alertes actives</div>
          {SECURITY_EVENTS.filter(e=>e.sev==='WARNING').map(e=>{
            const sc = SEV_CONF[e.sev]!
            return (
              <div key={e.id} className="flex items-start gap-3 p-3 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 mb-2 last:mb-0">
                <span className="text-lg shrink-0">⚠️</span>
                <div>
                  <div className="text-xs font-bold text-amber-800 dark:text-amber-400">{e.event}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{e.user} · {fmtDt(e.at)} · Statut: {e.status}</div>
                </div>
              </div>
            )
          })}
          {SECURITY_EVENTS.filter(e=>e.sev==='WARNING').length===0 && (
            <div className="text-[10px] text-slate-400 text-center py-4">Aucune alerte active</div>
          )}
        </div>

        {/* Feed événements */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">
            Journal d'événements ({MONITORING_EVENTS.length})
          </div>
          {MONITORING_EVENTS.map((e,i)=>(
            <div key={i} className="flex items-center gap-3 px-5 py-2.5 border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <div className="w-2 h-2 rounded-full shrink-0" style={{background:e.status==='WARNING'?'#B45309':'#059669'}}/>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold text-slate-800 dark:text-slate-200 truncate">{e.event}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded text-white" style={{background:TYPE_COLORS[e.type]??'#64748B'}}>{e.type}</span>
                <span className="text-[9px] font-mono text-slate-400 whitespace-nowrap">{fmtDt(e.at)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
