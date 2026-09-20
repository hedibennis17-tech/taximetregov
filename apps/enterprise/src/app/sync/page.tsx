'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PILOT, fmtDt, SYNC_HISTORY, SYNC_TYPE_CONF, SYNC_STATUS_CONF, ENT_CONNECTIONS, CONN_HEALTH_COLOR } from '@/lib/data'

export default function SyncPage() {
  const lastSync   = SYNC_HISTORY[0]!
  const warnings   = SYNC_HISTORY.filter(s=>s.status==='WARNING').length
  const totalNew   = SYNC_HISTORY.reduce((s,h)=>s+h.new,0)
  const totalUpd   = SYNC_HISTORY.reduce((s,h)=>s+h.updated,0)
  const totalErr   = SYNC_HISTORY.reduce((s,h)=>s+h.errors,0)

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Synchronisation</h1>
          <p className="text-sm text-slate-500 mt-1">Historique · Sources · Anti-doublon · État · Monitoring</p>
        </div>
        <div className="text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        {/* Status global */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm" style={{borderTop:'3px solid #059669'}}>
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-2xl shrink-0">🔄</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-lg font-black text-green-700 dark:text-green-400">SYNCHRONISÉ</span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-full">PILOTE</span>
              </div>
              <div className="text-sm text-slate-400">Dernière sync: {fmtDt(lastSync.at)} · Source: {lastSync.source} · {lastSync.records.toLocaleString('fr-CA')} enregistrements</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-black text-green-600 dark:text-green-400">{lastSync.records.toLocaleString('fr-CA')}</div>
              <div className="text-sm text-slate-400">enreg. vérifiés</div>
            </div>
          </div>
          {/* Anti-doublon */}
          <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-100 dark:border-blue-500/15 rounded-xl px-3 py-2">
            <div className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-0.5">🔒 Anti-duplication actif</div>
            <div className="text-sm text-slate-500">Chaque activité identifiée par: <span className="font-mono font-bold">source + external_reference + timestamp</span> · Doublon détecté → ignoré + log audit</div>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:'Nouveaux enreg.',  v:totalNew,  c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/10'},
            {l:'Mis à jour',       v:totalUpd,  c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
            {l:'Avertissements',   v:warnings,  c:'#B45309',bg:'bg-amber-50 dark:bg-amber-500/10'},
            {l:'Erreurs totales',  v:totalErr,  c:'#DC2626',bg:'bg-red-50 dark:bg-red-500/10'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
              <div className="text-sm text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* État connexions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">État des sources</div>
          {ENT_CONNECTIONS.filter(c=>c.status==='CONNECTED').map(c=>(
            <div key={c.id} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <div className="w-2 h-2 rounded-full bg-green-500 shrink-0"/>
              <div className="flex-1">
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{c.name}</div>
                <div className="text-sm text-slate-400">{c.dataRx.toLocaleString('fr-CA')} reçus · {c.latency}ms</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{width:`${c.health}%`,background:CONN_HEALTH_COLOR(c.health)}}/>
                </div>
                <span className="text-sm font-bold" style={{color:CONN_HEALTH_COLOR(c.health)}}>{c.health}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Historique sync */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">
            Historique des synchronisations ({SYNC_HISTORY.length})
          </div>
          {SYNC_HISTORY.map(h=>{
            const tc = SYNC_TYPE_CONF[h.type]!
            const sc = SYNC_STATUS_CONF[h.status]!
            return (
              <div key={h.id} className="flex items-start gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50" style={{borderLeft:`3px solid ${sc.color}`}}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{h.source}</span>
                    <span className="text-sm px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                    <span className="text-sm px-1.5 py-0.5 rounded font-bold" style={{color:tc.color,background:`${tc.color}15`}}>{tc.label}</span>
                  </div>
                  <div className="text-sm text-slate-400">{fmtDt(h.at)} · {h.duration}ms · {h.records.toLocaleString('fr-CA')} enreg.</div>
                  <div className="flex gap-3 text-sm mt-0.5 flex-wrap">
                    {h.new>0&&<span className="text-blue-600 dark:text-blue-400">+{h.new} nouveaux</span>}
                    {h.updated>0&&<span className="text-green-600 dark:text-green-400">~{h.updated} mis à jour</span>}
                    {h.skipped>0&&<span className="text-slate-400">{h.skipped} ignorés</span>}
                    {h.errors>0&&<span className="text-red-500">{h.errors} erreur(s)</span>}
                  </div>
                  {h.note&&<div className="text-sm text-slate-500 italic mt-0.5">{h.note}</div>}
                </div>
              </div>
            )
          })}
        </div>

        {/* Politique */}
        <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4">
          <div className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-2">📋 Politique de synchronisation</div>
          <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
            <div>· Sync complète: 1× par jour à minuit</div>
            <div>· Sync incrémentale: toutes les heures</div>
            <div>· Webhooks: temps réel (push depuis plateforme)</div>
            <div>· Retry automatique: 3 tentatives avec backoff exponentiel</div>
            <div>· Anti-doublon: source + extRef + timestamp → ignoré si déjà présent</div>
            <div>· Rétention logs: durée du pilote</div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
