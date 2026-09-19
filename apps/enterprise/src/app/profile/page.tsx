'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { PILOT, fmtDt, fmtDate, CURRENT_ENT, ENT_REPRESENTATIVES, AUDIT_LOG, ROLE_CONF } from '@/lib/data'

const TABS = ['Identité','Coordonnées','Représentants','Historique'] as const
type Tab = typeof TABS[number]

export default function ProfilePage() {
  const [tab, setTab] = useState<Tab>('Identité')

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-3xl mx-auto">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm" style={{borderTop:'3px solid #003DA5'}}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-qc-blue flex items-center justify-center text-2xl shrink-0">🚕</div>
            <div>
              <div className="text-xl font-black text-slate-900 dark:text-white">{CURRENT_ENT.tradeName}</div>
              <div className="text-[10px] text-slate-400">{CURRENT_ENT.legalName} · {CURRENT_ENT.id}</div>
              <div className="flex gap-2 mt-1">
                <span className="text-[8px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full">ACTIVE</span>
                <span className="text-[8px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full">VÉRIFIÉ</span>
                <span className="text-[8px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">PILOTE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto flex-nowrap">
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} className="shrink-0 px-4 py-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer" style={{background:tab===t?'#003DA5':'transparent',color:tab===t?'white':'#64748B',borderColor:tab===t?'#003DA5':'rgba(148,163,184,0.30)'}}>
              {t}
            </button>
          ))}
        </div>

        {/* ── IDENTITÉ ── */}
        {tab==='Identité'&&(
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            {[
              {l:'Enterprise ID',     v:CURRENT_ENT.id},
              {l:'Raison sociale',    v:CURRENT_ENT.legalName},
              {l:'Nom commercial',    v:CURRENT_ENT.tradeName},
              {l:'NEQ',               v:CURRENT_ENT.neq},
              {l:'Identifiant fiscal',v:CURRENT_ENT.taxId},
              {l:'Secteur',           v:'🚕 Taxi'},
              {l:'Type',              v:CURRENT_ENT.type},
              {l:'Juridiction',       v:CURRENT_ENT.jurisdiction},
              {l:'Inscrit le',        v:fmtDate(CURRENT_ENT.registered)},
              {l:'Statut',            v:'ACTIVE'},
              {l:'Vérification',      v:'VÉRIFIÉ'},
              {l:'Représentant',      v:CURRENT_ENT.repr},
            ].map(r=>(
              <div key={r.l} className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <span className="text-[10px] text-slate-500">{r.l}</span>
                <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 text-right">{r.v}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── COORDONNÉES ── */}
        {tab==='Coordonnées'&&(
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            {[
              {l:'Adresse',    v:CURRENT_ENT.address},
              {l:'Ville',      v:CURRENT_ENT.city},
              {l:'Province',   v:CURRENT_ENT.province},
              {l:'Code postal',v:CURRENT_ENT.postal},
              {l:'Téléphone',  v:CURRENT_ENT.phone},
              {l:'Courriel',   v:CURRENT_ENT.email},
              {l:'Site web',   v:CURRENT_ENT.website},
            ].map(r=>(
              <div key={r.l} className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <span className="text-[10px] text-slate-500">{r.l}</span>
                <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{r.v}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── REPRÉSENTANTS ── */}
        {tab==='Représentants'&&(
          <div className="space-y-2">
            {ENT_REPRESENTATIVES.map(rep=>{
              const rc = ROLE_CONF[rep.role]??{label:rep.role,color:'#64748B'}
              return (
                <div key={rep.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-qc-blue flex items-center justify-center text-sm font-black text-white shrink-0">{rep.firstName[0]}{rep.lastName[0]}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{rep.firstName} {rep.lastName}</span>
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full text-white" style={{background:rc.color}}>{rc.label}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${rep.status==='ACTIVE'?'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10':'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10'}`}>{rep.status}</span>
                      </div>
                      <div className="text-[9px] text-slate-400">{rep.email} · {rep.phone}</div>
                      <div className="text-[8px] text-slate-400 mt-0.5">Ajouté: {fmtDate(rep.addedAt)} · Dernière connexion: {rep.lastLogin?fmtDt(rep.lastLogin):'Jamais'}</div>
                    </div>
                    {rep.role==='OWNER'?
                      <span className="text-[8px] text-slate-400 shrink-0">Propriétaire</span>:
                      <div className="flex gap-1 shrink-0">
                        <button className="px-2 py-1 rounded-lg text-[8px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 cursor-pointer">Modifier</button>
                        {rep.status==='ACTIVE'&&<button className="px-2 py-1 rounded-lg text-[8px] font-bold bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 cursor-pointer">Révoquer</button>}
                      </div>
                    }
                  </div>
                </div>
              )
            })}
            <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 rounded-xl p-3 text-center">
              <button className="text-[10px] font-bold text-blue-600 dark:text-blue-400 cursor-pointer">+ Inviter un représentant (DEMO)</button>
              <div className="text-[8px] text-slate-400 mt-1">Invitation → Email → Acceptation → Rôle assigné · PILOTE</div>
            </div>
          </div>
        )}

        {/* ── HISTORIQUE ── */}
        {tab==='Historique'&&(
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-white">Historique des changements</div>
            {AUDIT_LOG.filter(a=>['DRIVER_UPDATED','USER_INVITED','PAYMENT_SUBMITTED','DECLARATION_VIEWED'].includes(a.action)).map(a=>(
              <div key={a.id} className="flex items-start gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="text-base shrink-0">{a.result==='OK'?'✅':'⚠️'}</div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{a.action}</div>
                  <div className="text-[9px] text-slate-400">{a.user} · {a.role} · {a.obj}</div>
                  <div className="text-[9px] text-slate-500 italic">{a.note}</div>
                </div>
                <div className="text-[8px] font-mono text-slate-400 shrink-0">{fmtDt(a.at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
