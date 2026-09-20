'use client'
import { AppShell } from '@/components/layout/AppShell'
import { useState } from 'react'
import { PILOT, fmtDt, SECURITY_USERS, SECURITY_ROLES, SECURITY_SESSIONS, SECURITY_ALERTS, SECURITY_LEVEL_CONF, PERMISSIONS_MATRIX, ENT_CONNECTIONS, CONN_STATUS, WEBHOOK_EVENTS_FULL } from '@/lib/data'

const SESSION_CONF: Record<string,{label:string;color:string;dot:string}> = {
  ACTIVE:  {label:'Active',  color:'#059669',dot:'bg-green-500'},
  INACTIVE:{label:'Inactive',color:'#B45309',dot:'bg-amber-400'},
  CLOSED:  {label:'Fermée', color:'#64748B',dot:'bg-slate-400'},
}
const DATA_FLOW = ['PLATEFORME','↓','API / WEBHOOK','↓','ENTERPRISE GOV','↓','VALIDATION','↓','ACTIVITÉ','↓','TRANSACTION','↓','REVENUE LEDGER','↓','FISCALITÉ','↓','CONFORMITÉ','↓','TAXIMETER.GOV']

export default function SecurityPage() {
  const [tab, setTab] = useState<'overview'|'users'|'sessions'|'api'|'alerts'|'governance'>('overview')

  const activeSessions = SECURITY_SESSIONS.filter(s=>s.status==='ACTIVE').length
  const openAlerts     = SECURITY_ALERTS.filter(a=>a.status==='OUVERT').length
  const noMfa          = SECURITY_USERS.filter(u=>!u.mfa&&u.status==='ACTIVE').length

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Sécurité & Gouvernance</h1>
          <p className="text-sm text-slate-500 mt-1">Utilisateurs · Sessions · API · Alertes · RBAC · Gouvernance données</p>
        </div>
        <div className="text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">
          {PILOT} · Données DEMO · Aucun secret réel affiché · Tokens masqués ••••••••
        </div>

        {/* Tabs */}
        <div className="flex gap-1 flex-wrap">
          {([['overview','🛡️ Overview'],['users','👤 Utilisateurs'],['sessions','💻 Sessions'],['api','⚙️ API & Webhooks'],['alerts','🚨 Alertes'],['governance','⚖️ Gouvernance']] as const).map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} className="px-3 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer whitespace-nowrap" style={{background:tab===t?'#000':'transparent',color:tab===t?'white':'#64748B',borderColor:tab===t?'#000':'rgba(148,163,184,0.30)'}}>
              {l}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab==='overview'&&(
          <div className="space-y-4">
            {/* Security status */}
            <div className="rounded-2xl p-5 shadow-sm" style={{background:'#000'}}>
              <div className="text-sm font-bold mb-1" style={{color:'rgba(255,255,255,0.45)'}}>SECURITY STATUS · ENTERPRISE GOV · PILOTE</div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 rounded-full bg-amber-400"/>
                <span className="text-white font-black text-lg">ATTENTION REQUISE</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  {l:'Sessions actives',   v:activeSessions,   c:activeSessions>0?'#06B029':'#64748B'},
                  {l:'Alertes ouvertes',   v:openAlerts,       c:openAlerts>0?'#DC2626':'#059669'},
                  {l:'Sans MFA',           v:noMfa,            c:noMfa>0?'#B45309':'#059669'},
                  {l:'Webhooks échoués',   v:WEBHOOK_EVENTS_FULL.filter(w=>w.status==='FAILED').length,c:'#DC2626'},
                ].map(s=>(
                  <div key={s.l}>
                    <div className="font-black text-xl" style={{color:s.c}}>{s.v}</div>
                    <div className="text-sm" style={{color:'rgba(255,255,255,0.5)'}}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alertes récentes */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Alertes sécurité récentes</div>
              {SECURITY_ALERTS.map(a=>{
                const lc = SECURITY_LEVEL_CONF[a.level]!
                return (
                  <div key={a.id} className="flex items-start gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="text-sm font-black px-1.5 py-0.5 rounded shrink-0" style={{color:lc.color,background:lc.bg}}>{lc.label}</span>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{a.title}</div>
                      <div className="text-sm text-slate-400">{a.desc}</div>
                      <div className="text-sm font-mono text-slate-400 mt-0.5">{fmtDt(a.at)}</div>
                    </div>
                    <span className={`text-sm font-bold shrink-0 ${a.status==='RÉSOLU'?'text-green-600':'text-amber-600'}`}>{a.status}</span>
                  </div>
                )
              })}
            </div>

            {/* Workflow données */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Flux de données (architecture)</div>
              <div className="flex flex-wrap gap-1.5 items-center">
                {DATA_FLOW.map((s,i)=>(
                  <span key={i} className={s==='↓'?'text-slate-300 dark:text-slate-700 font-bold text-lg':'text-sm font-bold px-2 py-1 rounded-lg'} style={s!=='↓'?{background:'#000',color:'white'}:{}}>{s}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── UTILISATEURS ── */}
        {tab==='users'&&(
          <div className="space-y-3">
            {/* Rôles */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Rôles & permissions</div>
              <div className="flex gap-2 flex-wrap">
                {SECURITY_ROLES.map(r=>(
                  <div key={r.id} className="rounded-xl px-3 py-2 text-center" style={{background:`${r.color}15`,borderLeft:`3px solid ${r.color}`}}>
                    <div className="text-sm font-black" style={{color:r.color}}>{r.label}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{r.users} utilisateur(s)</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Utilisateurs */}
            {SECURITY_USERS.map(u=>{
              const role = SECURITY_ROLES.find(r=>r.name===u.role)
              return (
                <div key={u.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-sm font-black text-white shrink-0">{u.name.split(' ').map(n=>n[0]).join('')}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{u.name}</span>
                        <span className="text-sm font-bold px-1.5 py-0.5 rounded-full text-white" style={{background:role?.color??'#64748B'}}>{u.role}</span>
                        <span className={`text-sm font-bold ${u.status==='ACTIVE'?'text-green-600':'text-amber-600'}`}>{u.status}</span>
                        <span className={`text-xs font-bold px-1 py-0.5 rounded ${u.mfa?'text-green-600 bg-green-50':'text-red-500 bg-red-50'}`}>{u.mfa?'MFA ✅':'MFA ⚠️'}</span>
                      </div>
                      <div className="text-sm text-slate-400">{u.email}</div>
                      <div className="text-sm text-slate-400 mt-0.5">
                        Dernière connexion: {u.lastLogin?fmtDt(u.lastLogin):'Jamais'} · Sessions: {u.sessions}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Matrice RBAC */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">Matrice permissions RBAC</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-black">
                    <th className="px-3 py-2 text-left text-sm font-bold text-white">Permission</th>
                    {['OWNER','FINANCE','DISPATCH','COMPLIANCE','VIEWER'].map(r=>(
                      <th key={r} className="px-3 py-2 text-center text-sm font-bold text-white">{r}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {PERMISSIONS_MATRIX.map((p:any)=>(
                      <tr key={p.perm} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300">{p.label??p.resource}</td>
                        {(['OWNER','FINANCE','DISPATCH','COMPLIANCE','VIEWER']).map((r:string)=>(
                          <td key={r} className="px-3 py-2 text-center text-sm">
                            {(p as any)[r] || (p as any)[r.toLowerCase()] ? '✅' : <span className="text-slate-300 dark:text-slate-700">—</span>}
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

        {/* ── SESSIONS ── */}
        {tab==='sessions'&&(
          <div className="space-y-2">
            {SECURITY_SESSIONS.map(s=>{
              const sc = SESSION_CONF[s.status]!
              return (
                <div key={s.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${sc.dot}`}/>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{s.user}</span>
                        <span className="text-sm font-bold px-1.5 py-0.5 rounded-full" style={{color:sc.color,background:`${sc.color}15`}}>{sc.label}</span>
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">{s.role}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-sm text-slate-400">
                        <div>Appareil: {s.device}</div>
                        <div>Navigateur: {s.browser}</div>
                        <div>Localisation: {s.location}</div>
                        <div>Début: {fmtDt(s.startAt)}</div>
                        <div>Dernière act.: {fmtDt(s.lastAt)}</div>
                        <div>ID: <span className="font-mono">{s.id}</span></div>
                      </div>
                    </div>
                    {s.status==='ACTIVE'&&(
                      <button className="px-2 py-1 rounded-lg text-sm font-bold bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 cursor-pointer shrink-0">Révoquer · DEMO</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── API & WEBHOOKS ── */}
        {tab==='api'&&(
          <div className="space-y-3">
            <div className="text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">
              Secrets masqués par sécurité · API Key: ••••••••••••••••• · Webhook Secret: ••••••••
            </div>
            {ENT_CONNECTIONS.map(c=>{
              const cs = CONN_STATUS[c.status]??{label:c.status,color:'#64748B',dot:'bg-slate-400'}
              return (
                <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${cs.dot}`}/>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{c.name}</span>
                    <span className="text-sm font-bold px-1.5 py-0.5 rounded-full" style={{color:cs.color,background:`${cs.color}15`}}>{cs.label}</span>
                    <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{c.type}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div><span className="text-slate-400">API Key:</span><span className="font-mono text-slate-500"> •••••••••••••••••</span></div>
                    <div><span className="text-slate-400">Webhook:</span><span className="font-mono text-slate-500"> ••••••••</span></div>
                    <div><span className="text-slate-400">Erreurs:</span><span className={`font-bold ${c.errors>0?'text-red-500':'text-green-600 dark:text-green-400'}`}> {c.errors}</span></div>
                  </div>
                </div>
              )
            })}

            {/* Webhook log */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">Webhook Delivery Log</div>
              {WEBHOOK_EVENTS_FULL.slice(0,6).map(w=>{
                const sc = {SUCCESS:{color:'#059669',bg:'rgba(5,150,105,0.12)'},FAILED:{color:'#DC2626',bg:'rgba(220,38,38,0.10)'},PENDING:{color:'#B45309',bg:'rgba(180,83,9,0.10)'}}[w.status]??{color:'#64748B',bg:'transparent'}
                return (
                  <div key={w.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="text-sm font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{color:sc.color,background:sc.bg}}>{w.status}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{w.event}</div>
                      <div className="text-sm text-slate-400">{w.src} → {w.dst} · {fmtDt(w.at)}</div>
                    </div>
                    <div className="text-sm text-slate-400 shrink-0">{w.attempts} tent.</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── ALERTES ── */}
        {tab==='alerts'&&(
          <div className="space-y-2">
            {SECURITY_ALERTS.map(a=>{
              const lc = SECURITY_LEVEL_CONF[a.level]!
              return (
                <div key={a.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm" style={{borderLeft:`3px solid ${lc.color}`}}>
                  <div className="flex items-start gap-3">
                    <span className="text-sm font-black px-1.5 py-0.5 rounded shrink-0 mt-0.5" style={{color:lc.color,background:lc.bg}}>{lc.label}</span>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-0.5">{a.title}</div>
                      <div className="text-sm text-slate-500">{a.desc}</div>
                      <div className="text-sm font-mono text-slate-400 mt-0.5">{fmtDt(a.at)}</div>
                    </div>
                    <span className={`text-sm font-bold shrink-0 px-1.5 py-0.5 rounded-full ${a.status==='RÉSOLU'?'text-green-600 bg-green-50':'text-amber-600 bg-amber-50'}`}>{a.status}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── GOUVERNANCE ── */}
        {tab==='governance'&&(
          <div className="space-y-4">
            {/* Action sensible workflow */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Workflow — Action sensible</div>
              <div className="flex flex-wrap gap-1.5 items-center">
                {['ACTION SENSIBLE','→','PERMISSION CHECK','→','VALIDATION','→','ACTION','→','AUDIT LOG','→','NOTIFICATION'].map((s,i)=>(
                  <span key={i} className={s==='→'?'text-slate-300 dark:text-slate-700':'text-sm font-bold px-2 py-1 rounded-lg'} style={s!=='→'?{background:'#000',color:'white'}:{}}>{s}</span>
                ))}
              </div>
              <div className="mt-3 text-sm text-slate-400">Opérations sensibles: paiement · déclaration · connexion gouvernementale · modification fiscale · export sensible</div>
            </div>

            {/* Catégories données */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Classification des données</div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {cat:'PUBLIC',      label:'Données publiques',      color:'#059669',ex:'Impact économique Uber QC · 12 351 véhicules',retention:'Indéfini'},
                  {cat:'INTERNAL',    label:'Données internes',       color:'#003DA5',ex:'Activités DEMO · Revenus synthétiques · KPIs',retention:'7 ans'},
                  {cat:'CONFIDENTIAL',label:'Données confidentielles',color:'#B45309',ex:'Profils chauffeurs · Transactions · Fiscal DEMO',retention:'7 ans'},
                  {cat:'SENSITIVE',   label:'Données sensibles',      color:'#DC2626',ex:'Connexions API · Sessions · Permissions RBAC',retention:'3 ans'},
                ].map(d=>(
                  <div key={d.cat} className="rounded-xl p-3 border" style={{borderColor:`${d.color}30`,background:`${d.color}08`}}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-black px-1.5 py-0.5 rounded text-white" style={{background:d.color}}>{d.cat}</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{d.label}</span>
                    </div>
                    <div className="text-sm text-slate-400 leading-relaxed">{d.ex}</div>
                    <div className="text-xs text-slate-400 mt-1">Rétention: {d.retention}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Politiques */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Politiques actives (DEMO)</div>
              {[
                {icon:'🔐',label:'Authentification multi-facteurs',  status:'PARTIEL',  note:'2/5 utilisateurs sans MFA'},
                {icon:'🔑',label:'Rotation des secrets API',          status:'PRÉVU',    note:'Token expirant dans 7 jours'},
                {icon:'📋',label:'Journal d\'audit complet',           status:'ACTIF',    note:'50 événements archivés'},
                {icon:'🗑️',label:'Soft delete — données financières', status:'ACTIF',    note:'Aucune suppression silencieuse'},
                {icon:'🔒',label:'Masquage secrets en interface',      status:'ACTIF',    note:'API keys et tokens masqués ••••'},
                {icon:'👁️',label:'Séparation des accès (RBAC)',       status:'ACTIF',    note:'5 rôles · 13 permissions'},
                {icon:'📦',label:'Rétention des données',              status:'DÉFINI',   note:'3-7 ans selon catégorie'},
                {icon:'🌐',label:'Connexion gouvernementale',          status:'PLANIFIÉ', note:'Aucune connexion réelle — PILOTE'},
              ].map(p=>(
                <div key={p.label} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-lg shrink-0">{p.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{p.label}</div>
                    <div className="text-sm text-slate-400">{p.note}</div>
                  </div>
                  <span className={`text-sm font-bold px-1.5 py-0.5 rounded-full shrink-0 ${p.status==='ACTIF'?'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10':p.status==='PARTIEL'?'text-amber-600 bg-amber-50':p.status==='PLANIFIÉ'||p.status==='PRÉVU'||p.status==='DÉFINI'?'text-purple-600 bg-purple-50':'text-slate-500 bg-slate-100'}`}>{p.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
