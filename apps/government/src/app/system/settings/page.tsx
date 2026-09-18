'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { useState } from 'react'
import { Settings, Globe, DollarSign, Shield, Bell, Database } from 'lucide-react'
import { PILOT, SETTINGS_FISCAL } from '@/lib/admin-data'

const NAV = [
  {href:'/admin/users',         l:'👥 Utilisateurs', active:false},
  {href:'/admin/organizations', l:'🏢 Organisations', active:false},
  {href:'/system/health',       l:'❤️ Santé système', active:false},
  {href:'/system/settings',     l:'⚙️ Paramètres',    active:true},
]

const TABS = [
  {k:'general',      l:'Général',          icon:Settings},
  {k:'jurisdictions',l:'Juridictions',     icon:Globe},
  {k:'fiscal',       l:'Configuration fiscale', icon:DollarSign},
  {k:'security',     l:'Sécurité',         icon:Shield},
  {k:'notifications',l:'Notifications',    icon:Bell},
  {k:'retention',    l:'Rétention données',icon:Database},
  {k:'pilot',        l:'Environnement pilote', icon:Settings},
] as const
type Tab = typeof TABS[number]['k']

const JURISDICTIONS = [
  {code:'QC', name:'Québec, Canada',          tps:'5%',  tvq:'9,975%', status:'ACTIVE',  note:'Pilote principal'},
  {code:'ON', name:'Ontario, Canada',         gst:'5%',  hst:'13%',    status:'DEMO',    note:'Démonstration uniquement'},
  {code:'CA', name:'Canada (fédéral)',         gst:'5%',  tvq:'N/A',   status:'DEMO',    note:'Référence fiscale'},
  {code:'US', name:'États-Unis',              tax:'Variable', tvq:'N/A',status:'PLANNED', note:'Architecture future'},
  {code:'FR', name:'France',                  tax:'TVA 20%',  tvq:'N/A',status:'PLANNED', note:'Architecture future'},
  {code:'MA', name:'Maroc',                   tax:'TVA 20%',  tvq:'N/A',status:'PLANNED', note:'Architecture future'},
]

const SECURITY_CFG = [
  {param:'MFA',                   val:'ACTIVÉ',       status:'OK'},
  {param:'Journalisation audit',  val:'ACTIVÉ',       status:'OK'},
  {param:'Timeout session',       val:'30 minutes',   status:'OK'},
  {param:'Auth API',              val:'OAuth — DEMO', status:'OK'},
  {param:'Chiffrement données',   val:'AES-256 DEMO', status:'OK'},
  {param:'Rotation credentials',  val:'90 jours DEMO',status:'OK'},
]

const NOTIF_EVENTS = [
  {event:'Alerte sécurité',          channels:['IN-APP','EMAIL'],    active:true},
  {event:'Document expirant',        channels:['IN-APP','EMAIL'],    active:true},
  {event:'Échéance fiscale',         channels:['IN-APP','EMAIL'],    active:true},
  {event:'Approbation requise',      channels:['IN-APP'],            active:true},
  {event:'Anomalie réconciliation',  channels:['IN-APP','EMAIL'],    active:true},
  {event:'Avertissement système',    channels:['IN-APP'],            active:true},
  {event:'Échec API',                channels:['IN-APP'],            active:false},
]

const RETENTION = [
  {cat:'Identité',       purpose:'Auth + vérification', policy:'Durée pilote', access:'Admins autorisés',status:'PILOTE'},
  {cat:'Transactions',   purpose:'Réconciliation fiscale',policy:'Durée pilote',access:'Admin fiscal',   status:'PILOTE'},
  {cat:'Fiscal TPS/TVQ', purpose:'Calcul estimatif DEMO',policy:'Durée pilote', access:'Officier fiscal', status:'PILOTE'},
  {cat:'Documents',      purpose:'Validation dossiers',  policy:'Durée pilote', access:'Admin autorisé',  status:'PILOTE'},
  {cat:'Audit',          purpose:'Traçabilité complète', policy:'Durée pilote', access:'Auditeur',       status:'PILOTE'},
  {cat:'Sécurité/logs',  purpose:'Surveillance système', policy:'Durée pilote', access:'Sécurité',       status:'PILOTE'},
]

export default function SystemSettingsPage() {
  const [tab, setTab] = useState<Tab>('general')

  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Paramètres système</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">Configuration · Juridictions · Fiscal · Sécurité · PILOTE</p>
        <div className="flex gap-1.5 overflow-x-auto pb-3 flex-nowrap">
          {NAV.map(n=><Link key={n.href} href={n.href} className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap" style={{background:n.active?'#003DA5':'transparent',color:n.active?'white':'#64748B',borderColor:n.active?'#003DA5':'rgba(148,163,184,0.30)'}}>{n.l}</Link>)}
        </div>
      </div>

      <div className="px-4 md:px-6 pb-8 space-y-5">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT} · Les paramètres affichés sont des configurations de démonstration uniquement</div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 flex-nowrap">
          {TABS.map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k)} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer whitespace-nowrap" style={{background:tab===t.k?'#003DA5':'transparent',color:tab===t.k?'white':'#64748B',borderColor:tab===t.k?'#003DA5':'rgba(148,163,184,0.30)'}}>
              <t.icon size={10}/> {t.l}
            </button>
          ))}
        </div>

        {/* ── GÉNÉRAL ── */}
        {tab==='general'&&(
          <div className="space-y-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-800 dark:text-white mb-4">Configuration générale (PILOTE)</div>
              {[
                {l:'Nom du système',       v:'TAXIMETER.GOV'},
                {l:'Version',              v:'1.0.0-PILOT'},
                {l:'Environnement',        v:'PILOT / DEMO'},
                {l:'Juridiction principale',v:'Québec, Canada'},
                {l:'Langue par défaut',   v:'Français (fr-CA)'},
                {l:'Fuseau horaire',       v:'America/Toronto (EST)'},
                {l:'Devise',              v:'CAD — Dollar canadien'},
                {l:'Format date',         v:'YYYY-MM-DD (fr-CA)'},
              ].map(r=>(
                <div key={r.l} className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-[10px] text-slate-500">{r.l}</span>
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── JURIDICTIONS ── */}
        {tab==='jurisdictions'&&(
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">Juridictions configurées</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  {['Code','Juridiction','TPS/GST','TVQ/HST','Statut','Note'].map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {JURISDICTIONS.map(j=>(
                    <tr key={j.code} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-black text-blue-600 dark:text-blue-400">{j.code}</td>
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{j.name}</td>
                      <td className="px-4 py-3 font-bold text-purple-600 dark:text-purple-400">{(j as {tps?:string;gst?:string;tax?:string}).tps||(j as {gst?:string}).gst||(j as {tax?:string}).tax||'—'}</td>
                      <td className="px-4 py-3 font-bold text-purple-600 dark:text-purple-400">{(j as {tvq?:string;hst?:string}).tvq||(j as {hst?:string}).hst||'—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${j.status==='ACTIVE'?'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-500/10':j.status==='DEMO'?'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10':'text-slate-400 bg-slate-100 dark:bg-slate-800'}`}>{j.status}</span>
                      </td>
                      <td className="px-4 py-3 text-[9px] text-slate-400 italic">{j.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── FISCAL ── */}
        {tab==='fiscal'&&(
          <div className="space-y-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">Taux fiscaux configurés (PILOTE)</div>
              <table className="w-full text-xs">
                <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  {['Juridiction','Type taxe','Taux','En vigueur','Statut'].map(h=><th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{h}</th>)}
                </tr></thead>
                <tbody>
                  {SETTINGS_FISCAL.map(f=>(
                    <tr key={f.jurisdiction+f.taxType} className="border-b border-slate-50 dark:border-slate-800">
                      <td className="px-4 py-2.5 font-bold text-slate-800 dark:text-slate-200">{f.jurisdiction}</td>
                      <td className="px-4 py-2.5 font-bold text-purple-600 dark:text-purple-400">{f.taxType}</td>
                      <td className="px-4 py-2.5 font-black text-green-600 dark:text-green-400">{f.rate}</td>
                      <td className="px-4 py-2.5 text-slate-500">{f.effective}</td>
                      <td className="px-4 py-2.5"><span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${f.status==='ACTIVE'?'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-500/10':'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10'}`}>{f.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-[9px] text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">Tout changement de configuration fiscale nécessite une révision et une approbation selon le cycle de gouvernance. Ces taux sont des configurations PILOTE.</div>
          </div>
        )}

        {/* ── SÉCURITÉ ── */}
        {tab==='security'&&(
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="text-sm font-bold text-slate-800 dark:text-white mb-4">Configuration sécurité (PILOTE)</div>
            {SECURITY_CFG.map(s=>(
              <div key={s.param} className="flex justify-between py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <span className="text-[10px] text-slate-500">{s.param}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{s.val}</span>
                  <span className="text-[8px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-1.5 py-0.5 rounded-full">✓</span>
                </div>
              </div>
            ))}
            <div className="mt-3 text-[9px] text-slate-400 italic">Aucune clé API ou secret réel n'est stocké — configuration DEMO uniquement</div>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {tab==='notifications'&&(
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="text-sm font-bold text-slate-800 dark:text-white mb-4">Configuration notifications (PILOTE)</div>
            {NOTIF_EVENTS.map(n=>(
              <div key={n.event} className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div>
                  <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{n.event}</div>
                  <div className="flex gap-1 mt-0.5">
                    {n.channels.map(c=><span key={c} className="text-[7px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">{c}</span>)}
                  </div>
                </div>
                <div className={`text-[9px] font-bold px-2 py-1 rounded-lg ${n.active?'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-500/10':'text-slate-400 bg-slate-100 dark:bg-slate-800'}`}>
                  {n.active?'ACTIF':'INACTIF'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── RÉTENTION ── */}
        {tab==='retention'&&(
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">Politique de rétention (PILOTE)</div>
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                {['Catégorie','Finalité','Politique','Accès','Statut'].map(h=><th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">{h}</th>)}
              </tr></thead>
              <tbody>
                {RETENTION.map(r=>(
                  <tr key={r.cat} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-2.5 font-bold text-slate-800 dark:text-slate-200">{r.cat}</td>
                    <td className="px-4 py-2.5 text-[10px] text-slate-500">{r.purpose}</td>
                    <td className="px-4 py-2.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">{r.policy}</td>
                    <td className="px-4 py-2.5 text-[9px] text-slate-500">{r.access}</td>
                    <td className="px-4 py-2.5"><span className="text-[8px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-full">{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── PILOTE ENV ── */}
        {tab==='pilot'&&(
          <div className="space-y-3">
            <div className="bg-red-50 dark:bg-red-500/8 border-2 border-red-200 dark:border-red-500/30 rounded-2xl p-5">
              <div className="text-base font-black text-red-700 dark:text-red-400 mb-3">⚠️ Environnement pilote — Lecture obligatoire</div>
              {[
                {l:'Environnement',                v:'PILOTE / DÉMONSTRATION',         c:'text-amber-700 dark:text-amber-400'},
                {l:'Données',                      v:'SYNTHÉTIQUES UNIQUEMENT',        c:'text-amber-700 dark:text-amber-400'},
                {l:'Connexion gouvernementale',     v:'NON CONNECTÉ',                   c:'text-red-600 dark:text-red-400'},
                {l:'Plateformes externes',          v:'SIMULATION / DEMO',              c:'text-amber-600 dark:text-amber-400'},
                {l:'Données gouvernementales réelles',v:'AUCUNE',                      c:'text-red-600 dark:text-red-400'},
                {l:'Transmission Revenu Québec',   v:'NON ACTIVE',                    c:'text-red-600 dark:text-red-400'},
                {l:'API gouvernementales',         v:'NON CONNECTÉES',                 c:'text-red-600 dark:text-red-400'},
                {l:'Données contribuables',        v:'AUCUNE — SYNTHÉTIQUE SEULEMENT', c:'text-red-600 dark:text-red-400'},
              ].map(r=>(
                <div key={r.l} className="flex justify-between py-2 border-b border-red-100 dark:border-red-500/15 last:border-0">
                  <span className="text-[10px] text-slate-600 dark:text-slate-400">{r.l}</span>
                  <span className={`text-[10px] font-black ${r.c}`}>{r.v}</span>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4">
              <div className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">🏛️ Déclaration pilote</div>
              <div className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">
                TAXIMETER.GOV est actuellement en phase de démonstration pilote. Toutes les fonctionnalités, données, connexions et calculs présentés sont synthétiques. Le déploiement en production nécessiterait des ententes légales, des autorisations réglementaires, une évaluation des facteurs relatifs à la vie privée (ÉFVP) et des validations de sécurité appropriées.
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
