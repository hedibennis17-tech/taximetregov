'use client'
import { AppShell } from '@/components/layout/AppShell'
import { useState } from 'react'
import { PILOT, fmtDt, ENT_USERS, ENT_REPRESENTATIVES, ROLE_CONF, PERMISSIONS_MATRIX } from '@/lib/data'

const TABS = ['Utilisateurs','Rôles & Permissions','Sécurité'] as const
type Tab = typeof TABS[number]

const USER_STATUS: Record<string,{label:string;color:string;bg:string}> = {
  ACTIVE:  {label:'Actif',       color:'#059669',bg:'rgba(5,150,105,0.12)'},
  PENDING: {label:'En attente',  color:'#B45309', bg:'rgba(180,83,9,0.10)'},
  INACTIVE:{label:'Inactif',     color:'#64748B',bg:'rgba(100,116,139,0.10)'},
}

export default function UsersPage() {
  const [tab, setTab] = useState<Tab>('Utilisateurs')

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Utilisateurs & Rôles</h1>
          <p className="text-sm text-slate-500 mt-1">Gestion des accès · Permissions · Sécurité</p>
        </div>
        <div className="text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT} · Isolation stricte des données par entreprise</div>

        <div className="flex gap-1.5 flex-wrap">
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} className="px-4 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer" style={{background:tab===t?'#003DA5':'transparent',color:tab===t?'white':'#64748B',borderColor:tab===t?'#003DA5':'rgba(148,163,184,0.30)'}}>
              {t}
            </button>
          ))}
        </div>

        {/* ── UTILISATEURS ── */}
        {tab==='Utilisateurs'&&(
          <div className="space-y-2">
            {/* KPI */}
            <div className="grid grid-cols-3 gap-2">
              {[
                {l:'Total',      v:ENT_USERS.length,                              c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/10'},
                {l:'Actifs',     v:ENT_USERS.filter(u=>u.status==='ACTIVE').length,c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
                {l:'En attente', v:ENT_USERS.filter(u=>u.status==='PENDING').length,c:'#B45309',bg:'bg-amber-50 dark:bg-amber-500/10'},
              ].map(s=>(
                <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
                  <div className="text-xl font-black" style={{color:s.c}}>{s.v}</div>
                  <div className="text-sm text-slate-500 mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>

            {ENT_USERS.map(u=>{
              const rc = ROLE_CONF[u.role]!
              const sc = USER_STATUS[u.status]!
              return (
                <div key={u.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0" style={{background:rc.color}}>{u.name[0]}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{u.name}</span>
                        <span className="text-sm font-black px-1.5 py-0.5 rounded-full text-white" style={{background:rc.color}}>{rc.label}</span>
                        <span className="text-sm px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                      </div>
                      <div className="text-sm text-slate-400">{u.email}</div>
                      <div className="text-sm text-slate-400 mt-0.5">
                        {u.lastLogin?`Dernière connexion: ${fmtDt(u.lastLogin)}`:'Jamais connecté'}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button className="px-2 py-1 rounded-lg text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 cursor-pointer">Modifier</button>
                    </div>
                  </div>
                </div>
              )
            })}

            <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 rounded-xl p-3 text-center">
              <button className="text-sm font-bold text-blue-600 dark:text-blue-400 cursor-pointer">+ Inviter un utilisateur (DEMO)</button>
              <div className="text-sm text-slate-400 mt-1">Invitation → Email → Acceptation → Rôle → Accès · PILOTE</div>
            </div>
          </div>
        )}

        {/* ── RÔLES & PERMISSIONS ── */}
        {tab==='Rôles & Permissions'&&(
          <div className="space-y-3">
            {/* Rôles */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(ROLE_CONF).map(([key,rc])=>(
                <div key={key} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full" style={{background:rc.color}}/>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{rc.label}</span>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {rc.perms.map(p=><span key={p} className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">{p}</span>)}
                  </div>
                </div>
              ))}
            </div>

            {/* Matrice */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-white">Matrice de permissions</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-4 py-2.5 text-left text-sm font-bold text-slate-400 uppercase">Ressource</th>
                    {['OWNER','FINANCE','COMPLIANCE','DISPATCH','VIEWER'].map(r=>(
                      <th key={r} className="px-3 py-2.5 text-center text-sm font-bold whitespace-nowrap" style={{color:ROLE_CONF[r]?.color??'#64748B'}}>{ROLE_CONF[r]?.label??r}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {(PERMISSIONS_MATRIX as any[]).map(row=>(
                      <tr key={row.perm??row.resource} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300">{row.label??row.resource}</td>
                        {(['OWNER','FINANCE','COMPLIANCE','DISPATCH','VIEWER']).map((role,i)=>(
                          <td key={i} className="px-3 py-2 text-center">
                            {row[role]||row[role.toLowerCase()] ? <span className="text-sm">✅</span> : <span className="text-sm text-slate-200 dark:text-slate-700">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── SÉCURITÉ ── */}
        {tab==='Sécurité'&&(
          <div className="space-y-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Configuration sécurité (PILOTE)</div>
              {[
                {l:'MFA',                    v:'Recommandé — DEMO',  ok:true},
                {l:'Timeout session',        v:'30 minutes',         ok:true},
                {l:'Isolation multi-ent.',   v:'Activée',            ok:true},
                {l:'Journalisation audit',   v:'Activée',            ok:true},
                {l:'Révocation sessions',    v:'Disponible',         ok:true},
                {l:'Invitation avec expiry', v:'7 jours — DEMO',     ok:true},
              ].map(r=>(
                <div key={r.l} className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-sm text-slate-500">{r.l}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{r.v}</span>
                    <span className={`text-sm font-bold ${r.ok?'text-green-600 dark:text-green-400':'text-red-500'}`}>{r.ok?'✓':'✗'}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4">
              <div className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">🔒 Isolation des données</div>
              <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Chaque utilisateur est lié à un <span className="font-mono font-bold">enterprise_id</span> unique. Toutes les requêtes sont limitées à cet identifiant. Une entreprise ne peut jamais consulter les données d'une autre. Cette isolation est appliquée côté serveur, pas uniquement dans l'interface.
              </div>
            </div>

            <div className="text-sm text-slate-400 text-center">{PILOT} · Aucun système d'authentification gouvernemental réel connecté</div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
