'use client'
import { AppShell } from '@/components/layout/AppShell'
import { useState } from 'react'
import { PILOT, money, money2, fmtDt, PROVIDERS, PROVIDER_SERVICES, SVC_CAT_CONF, ENT_CONNECTIONS } from '@/lib/data'

const PRV_STATUS: Record<string,{label:string;color:string;bg:string;dot:string}> = {
  CONNECTED:{label:'Connecté', color:'#059669',bg:'rgba(5,150,105,0.12)',dot:'bg-green-500'},
  ACTIVE:   {label:'Actif',    color:'#059669',bg:'rgba(5,150,105,0.12)',dot:'bg-green-500'},
  PLANNED:  {label:'Planifié', color:'#7C3AED',bg:'rgba(124,58,237,0.12)',dot:'bg-purple-400'},
  SIMULATION:{label:'Simulation',color:'#B45309',bg:'rgba(180,83,9,0.10)',dot:'bg-amber-400'},
  ERROR:    {label:'Erreur',   color:'#DC2626',bg:'rgba(220,38,38,0.10)',dot:'bg-red-500'},
}

export default function ProvidersPage() {
  const [selected, setSelected] = useState<string|null>('PRV-001')

  const selPrv = PROVIDERS.find(p=>p.id===selected)
  const selSvcs = PROVIDER_SERVICES.filter(s=>s.providerId===selected)
  const conn = selPrv ? ENT_CONNECTIONS.find(c=>c.name.toLowerCase().includes(selPrv.name.toLowerCase())) : null

  const connected = PROVIDERS.filter(p=>p.status==='CONNECTED').length
  const activeServices = PROVIDER_SERVICES.filter(s=>s.status==='ACTIVE').length
  const totalRx = PROVIDER_SERVICES.reduce((s,svc)=>s+svc.dataRx,0)
  const totalGross = PROVIDER_SERVICES.reduce((s,svc)=>s+svc.gross,0)

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Fournisseurs & Services</h1>
          <p className="text-sm text-slate-500 mt-1">Architecture Provider → Services → Comptes → Activités → Transactions → Revenus</p>
        </div>
        <div className="text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">
          {PILOT} · Toutes les connexions sont DEMO — aucune API réelle connectée
        </div>

        {/* Architecture chaîne */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
          <div className="text-sm font-bold text-slate-400 uppercase mb-2">Architecture fournisseur → revenus</div>
          <div className="flex items-center gap-1 flex-wrap text-sm font-bold">
            {['PROVIDER','→','SERVICES','→','COMPTE','→','CONNEXION API','→','ACTIVITÉS','→','TRANSACTIONS','→','REVENUS','→','TPS/TVQ','→','RÉCONCILIATION'].map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-300 dark:text-slate-700':'px-2 py-1 rounded-lg'} style={s!=='→'?{background:'#EEF3FB',color:'#003DA5'}:{}}>{s}</span>
            ))}
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:'Fournisseurs connectés',v:connected,        c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
            {l:'Services actifs',       v:activeServices,   c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/10'},
            {l:'Enreg. reçus',          v:totalRx.toLocaleString('fr-CA'),c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/10'},
            {l:'Revenus (DEMO)',        v:money(totalGross),c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className="text-lg font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-sm text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Liste providers */}
          <div className="space-y-2">
            <div className="text-sm font-bold text-slate-400 uppercase px-1">Répertoire fournisseurs</div>
            {PROVIDERS.map(p=>{
              const sc = PRV_STATUS[p.status] ?? {label:p.status,color:'#64748B',bg:'rgba(100,116,139,0.10)',dot:'bg-slate-400'}
              const psvcs = PROVIDER_SERVICES.filter(s=>s.providerId===p.id)
              const activeCount = psvcs.filter(s=>s.status==='ACTIVE').length
              return (
                <div key={p.id}
                  onClick={()=>setSelected(p.id)}
                  className="bg-white dark:bg-slate-900 border rounded-2xl p-3 shadow-sm cursor-pointer hover:shadow-md transition-all"
                  style={{borderColor:selected===p.id?'#003DA5':'rgba(226,232,240,0.8)',borderWidth:selected===p.id?2:1}}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{p.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{p.name}</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}/>
                      </div>
                      <div className="text-sm text-slate-400">{activeCount}/{psvcs.length} services actifs · {p.country}</div>
                    </div>
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Profil provider sélectionné */}
          <div className="md:col-span-2 space-y-3">
            {selPrv&&(
              <>
                {/* Header provider */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm" style={{borderTop:`3px solid ${PRV_STATUS[selPrv.status]?.color??'#003DA5'}`}}>
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-4xl">{selPrv.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xl font-black text-slate-900 dark:text-white">{selPrv.name}</span>
                        <span className="text-sm font-bold px-1.5 py-0.5 rounded-full" style={{color:PRV_STATUS[selPrv.status]?.color,background:PRV_STATUS[selPrv.status]?.bg}}>{PRV_STATUS[selPrv.status]?.label}</span>
                        <span className="text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-full">DEMO</span>
                      </div>
                      <div className="text-sm text-slate-400">{selPrv.id} · {selPrv.country} · {selSvcs.length} service(s)</div>
                      <div className="text-sm text-slate-500 italic mt-0.5">{selPrv.note}</div>
                    </div>
                    {selPrv.status==='CONNECTED'&&(
                      <button className="px-3 py-2 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer shrink-0">Gérer · DEMO</button>
                    )}
                    {selPrv.status==='PLANNED'&&(
                      <button className="px-3 py-2 rounded-xl text-sm font-bold bg-qc-blue text-white cursor-pointer shrink-0 hover:bg-blue-700">Connecter · DEMO</button>
                    )}
                  </div>
                  {conn&&(
                    <div className="bg-green-50 dark:bg-green-500/8 border border-green-200 dark:border-green-500/15 rounded-xl px-3 py-2 text-sm text-green-700 dark:text-green-400">
                      ✅ Connexion active · {conn.dataRx.toLocaleString('fr-CA')} enreg. · {conn.latency}ms · Sync: {fmtDt(conn.lastSync!)}
                    </div>
                  )}
                </div>

                {/* Services de ce provider */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">
                    Services ({selSvcs.length})
                  </div>
                  {selSvcs.map(svc=>{
                    const cc = SVC_CAT_CONF[svc.cat]!
                    const isActive = svc.status==='ACTIVE'
                    return (
                      <div key={svc.id} className="flex items-start gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        style={{opacity:isActive?1:0.6}}>
                        <span className="text-xl shrink-0 mt-0.5">{svc.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{svc.name}</span>
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{color:cc.color,background:`${cc.color}15`}}>{cc.icon} {cc.label}</span>
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${isActive?'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10':'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10'}`}>
                              {isActive?'ACTIF':'PLANIFIÉ'}
                            </span>
                          </div>
                          <div className="text-sm text-slate-400">{svc.desc}</div>
                          {svc.accountRef&&<div className="text-sm font-mono text-slate-400 mt-0.5">Réf: {svc.accountRef}</div>}
                        </div>
                        {isActive?(
                          <div className="text-right shrink-0">
                            <div className="text-sm font-black text-green-600 dark:text-green-400">{money(svc.gross)}</div>
                            {svc.tips>0&&<div className="text-sm text-slate-400">+{money2(svc.tips)} tips</div>}
                            <div className="text-sm text-slate-400">{svc.txCount} TX</div>
                            {svc.lastSync&&<div className="text-xs font-mono text-slate-400">{fmtDt(svc.lastSync)}</div>}
                          </div>
                        ):(
                          <div className="text-sm text-purple-600 dark:text-purple-400 shrink-0">🔮 Futur</div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Stats financières si connecté */}
                {selPrv.status==='CONNECTED'&&selSvcs.some(s=>s.gross>0)&&(
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Financier DEMO — {selPrv.name}</div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {l:'Revenus bruts',  v:money(selSvcs.reduce((s,sv)=>s+sv.gross,0)), c:'text-green-600 dark:text-green-400'},
                        {l:'Pourboires',      v:money2(selSvcs.reduce((s,sv)=>s+sv.tips,0)), c:'text-blue-600 dark:text-blue-400'},
                        {l:'Transactions',    v:selSvcs.reduce((s,sv)=>s+sv.txCount,0),       c:'text-slate-800 dark:text-slate-200'},
                      ].map(r=>(
                        <div key={r.l} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-center">
                          <div className={`text-sm font-black ${r.c}`}>{r.v}</div>
                          <div className="text-sm text-slate-400 mt-0.5">{r.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Note planifié */}
                {selPrv.status==='PLANNED'&&(
                  <div className="bg-purple-50 dark:bg-purple-500/8 border border-purple-200 dark:border-purple-500/20 rounded-2xl p-4">
                    <div className="text-sm font-bold text-purple-700 dark:text-purple-400 mb-1">🔮 Intégration planifiée</div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      La connexion avec {selPrv.name} nécessite des accords contractuels, des autorisations légales et une intégration API officielle. Cette fiche est préparée pour l'architecture future de TAXIMETER.GOV.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
