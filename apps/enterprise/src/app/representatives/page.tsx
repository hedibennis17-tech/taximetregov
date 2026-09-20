'use client'
import { AppShell } from '@/components/layout/AppShell'
import { useState } from 'react'
import { PILOT, fmtDt, fmtDate, ENT_REPRESENTATIVES, ROLE_CONF } from '@/lib/data'

const STATUS_CONF: Record<string,{label:string;color:string;bg:string}> = {
  ACTIVE:  {label:'Actif',      color:'#059669',bg:'rgba(5,150,105,0.12)'},
  PENDING: {label:'En attente', color:'#B45309', bg:'rgba(180,83,9,0.10)'},
  INACTIVE:{label:'Inactif',    color:'#64748B',bg:'rgba(100,116,139,0.10)'},
}

const INVITE_WORKFLOW = ['INVITATION','→','EMAIL','→','ACCEPTATION','→','COMPTE CRÉÉ','→','RÔLE ASSIGNÉ','→','ACCÈS ACCORDÉ']

export default function RepresentativesPage() {
  const [showInvite, setShowInvite] = useState(false)

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-3xl mx-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Représentants autorisés</h1>
            <p className="text-sm text-slate-500 mt-1">Personnes autorisées à agir au nom de l'entreprise</p>
          </div>
          <button onClick={()=>setShowInvite(!showInvite)} className="px-3 py-2 rounded-xl text-sm font-bold bg-qc-blue text-white cursor-pointer hover:bg-blue-700 shrink-0">+ Inviter</button>
        </div>

        <div className="text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        {/* Workflow invitation */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
          <div className="text-sm font-bold text-slate-400 uppercase mb-2">Workflow d'invitation</div>
          <div className="flex items-center gap-1 flex-wrap text-sm font-bold">
            {INVITE_WORKFLOW.map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-300 dark:text-slate-700':'px-2 py-1 rounded-lg'} style={s!=='→'?{background:'#EEF3FB',color:'#003DA5'}:{}}>{s}</span>
            ))}
          </div>
          <div className="text-sm text-slate-400 mt-1">Expiration invitation: 7 jours · PILOTE</div>
        </div>

        {/* Modal invitation DEMO */}
        {showInvite&&(
          <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-5 shadow-sm">
            <div className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-3">Inviter un représentant (DEMO)</div>
            <div className="space-y-3">
              {['Prénom','Nom','Courriel','Téléphone'].map(f=>(
                <input key={f} placeholder={f} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white bg-white dark:bg-slate-900 outline-none"/>
              ))}
              <select className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none">
                {Object.entries(ROLE_CONF).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
              <div className="flex gap-2">
                <button className="flex-1 py-2 rounded-xl text-xs font-bold bg-qc-blue text-white cursor-pointer hover:bg-blue-700">Envoyer invitation · DEMO</button>
                <button onClick={()=>setShowInvite(false)} className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer">Annuler</button>
              </div>
              <div className="text-sm text-amber-600 dark:text-amber-400 text-center">PILOTE — Aucune invitation réelle envoyée</div>
            </div>
          </div>
        )}

        {/* Liste représentants */}
        {ENT_REPRESENTATIVES.map(rep=>{
          const rc = ROLE_CONF[rep.role]!
          const sc = STATUS_CONF[rep.status]!
          return (
            <div key={rep.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-black text-white shrink-0" style={{background:rc.color}}>
                  {rep.firstName[0]}{rep.lastName[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold text-slate-800 dark:text-white">{rep.firstName} {rep.lastName}</span>
                    <span className="text-sm font-black px-1.5 py-0.5 rounded-full text-white" style={{background:rc.color}}>{rc.label}</span>
                    <span className="text-sm px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                  </div>
                  <div className="text-sm text-slate-500">{rep.email}</div>
                  <div className="text-sm text-slate-400 mt-0.5">{rep.phone}</div>
                  <div className="flex gap-3 text-sm text-slate-400 mt-1.5">
                    <span>Ajouté: {fmtDate(rep.addedAt)}</span>
                    <span>Connexion: {rep.lastLogin?fmtDt(rep.lastLogin):'Jamais'}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {rep.role!=='OWNER'&&(
                    <>
                      <button className="px-2.5 py-1.5 rounded-lg text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 cursor-pointer">Modifier</button>
                      {rep.status==='ACTIVE'&&<button className="px-2.5 py-1.5 rounded-lg text-sm font-bold bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 cursor-pointer">Révoquer</button>}
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </AppShell>
  )
}
