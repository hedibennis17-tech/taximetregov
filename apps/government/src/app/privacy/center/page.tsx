'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { Shield, Lock, Eye, Users } from 'lucide-react'
import { PILOT, PRIVACY_CATEGORIES } from '@/lib/security-data'

const NAV = [
  {href:'/security/center',    l:'🛡️ Security Center', active:false},
  {href:'/security/monitoring',l:'📡 Monitoring',       active:false},
  {href:'/security/sessions',  l:'🔑 Sessions',         active:false},
  {href:'/governance/center',  l:'⚖️ Gouvernance',      active:false},
  {href:'/privacy/center',     l:'🔒 Confidentialité',  active:true},
]

const ACCESS_MATRIX = [
  { role:'👤 Chauffeur',    access:['Profil personnel','Véhicules propres','Documents propres','Transactions propres','Données fiscales propres'], restricted:['Autres chauffeurs','Données entreprises','Données gouvernementales'] },
  { role:'🏢 Entreprise',   access:['Profil organisation','Travailleurs autorisés','Véhicules de flotte','Transactions propres','Rapports propres'],  restricted:['Données autres entreprises','Données gouvernementales confidentielles'] },
  { role:'👮 Admin Gov',    access:['Dossiers admin autorisés','Transactions (périmètre)','Fiscalité (périmètre)','Rapports pilote','Audit'],           restricted:['Données hors périmètre','Données personnelles non autorisées'] },
  { role:'🔍 Auditeur',     access:['Journal audit','Logs sécurité','Rapports audit','Événements conformité'],                                          restricted:['Transactions non liées à audit','Données opérationnelles'] },
]

const FLOW = [
  {icon:'👤',label:'Chauffeur / Entreprise / Plateforme'},
  {icon:'🔐',label:'Connexion autorisée'},
  {icon:'🏛️',label:'TAXIMETER.GOV'},
  {icon:'✅',label:'Validation'},
  {icon:'🔒',label:'Stockage sécurisé (PILOTE)'},
  {icon:'⚖️',label:'Réconciliation'},
  {icon:'🏛️',label:'Usage gouvernemental autorisé'},
  {icon:'📋',label:'Piste d\'audit'},
]

export default function PrivacyCenterPage() {
  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Confidentialité</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">Protection des données · Accès · Rétention · Transparence · TAXIMETER.GOV PILOTE</p>
        <div className="flex gap-1.5 overflow-x-auto pb-3 flex-nowrap">
          {NAV.map(n=><Link key={n.href} href={n.href} className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap" style={{background:n.active?'#003DA5':'transparent',color:n.active?'white':'#64748B',borderColor:n.active?'#003DA5':'rgba(148,163,184,0.30)'}}>{n.l}</Link>)}
        </div>
      </div>

      <div className="px-4 md:px-6 pb-8 space-y-5">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT} · Toutes les données sont synthétiques — aucun renseignement personnel réel</div>

        {/* Principes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {icon:<Lock size={18}/>,    l:'Confidentialité',    desc:'Données synthétiques DEMO uniquement', c:'#003DA5', bg:'bg-blue-50 dark:bg-blue-500/10'},
            {icon:<Shield size={18}/>,  l:'Protection',         desc:'Architecture d\'accès par rôle',       c:'#059669', bg:'bg-green-50 dark:bg-green-500/10'},
            {icon:<Eye size={18}/>,     l:'Transparence',       desc:'Chaque accès est journalisé',          c:'#7C3AED', bg:'bg-purple-50 dark:bg-purple-500/10'},
            {icon:<Users size={18}/>,   l:'Minimisation',       desc:'Accès limité au périmètre autorisé',   c:'#B45309', bg:'bg-amber-50 dark:bg-amber-500/10'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-2xl p-4 border border-white dark:border-transparent`}>
              <div className="mb-2" style={{color:s.c}}>{s.icon}</div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{s.l}</div>
              <div className="text-[9px] text-slate-400 mt-1 leading-relaxed">{s.desc}</div>
            </div>
          ))}
        </div>

        {/* Flux de données */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Flux de données TAXIMETER.GOV (représentation pilote)</div>
          <div className="flex flex-wrap gap-1 items-center">
            {FLOW.map((f,i)=>(
              <div key={i} className="flex items-center gap-1">
                {i>0&&<span className="text-slate-300 dark:text-slate-700 text-sm font-bold">↓</span>}
                <div className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <div className="text-base">{f.icon}</div>
                  <div className="text-[8px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">{f.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Catégories de données */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">Catégories de données ({PRIVACY_CATEGORIES.length})</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                {['Catégorie','Finalité','Accès','Rétention','Partage','Rôles','Statut'].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {PRIVACY_CATEGORIES.map(c=>(
                  <tr key={c.cat} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-black text-slate-800 dark:text-slate-200 whitespace-nowrap">{c.cat}</td>
                    <td className="px-4 py-3 text-[10px] text-slate-500 max-w-xs">{c.purpose}</td>
                    <td className="px-4 py-3 text-[9px] text-slate-500 whitespace-nowrap">{c.access}</td>
                    <td className="px-4 py-3 text-[9px] text-slate-400 whitespace-nowrap">{c.retention}</td>
                    <td className="px-4 py-3"><span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${c.sharing==='NON PARTAGÉ'?'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-500/10':c.sharing==='SIMULATION'?'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10':'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10'}`}>{c.sharing}</span></td>
                    <td className="px-4 py-3"><div className="flex gap-1 flex-wrap">{c.roles.map(r=><span key={r} className="text-[7px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1 py-0.5 rounded">{r}</span>)}</div></td>
                    <td className="px-4 py-3"><span className="text-[8px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-full">{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Matrice accès */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-4">Qui peut accéder à quoi ? (modèle pilote)</div>
          <div className="space-y-3">
            {ACCESS_MATRIX.map(a=>(
              <div key={a.role} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                <div className="text-xs font-black text-slate-800 dark:text-slate-200 mb-2">{a.role}</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[9px] font-bold text-green-700 dark:text-green-400 mb-1">✓ Autorisé</div>
                    {a.access.map(x=><div key={x} className="text-[9px] text-slate-600 dark:text-slate-300">· {x}</div>)}
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-red-600 dark:text-red-400 mb-1">✗ Restreint</div>
                    {a.restricted.map(x=><div key={x} className="text-[9px] text-slate-400">· {x}</div>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Déclaration */}
        <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4">
          <div className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">🏛️ Déclaration de confidentialité pilote</div>
          <div className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">
            Toutes les données utilisées dans TAXIMETER.GOV sont synthétiques et créées uniquement à des fins de démonstration pilote. Aucune donnée personnelle réelle de citoyen, chauffeur, entreprise ou organisme gouvernemental n'est utilisée ou stockée. Le système propose une architecture de protection et de traçabilité qui devrait être soumise à l'évaluation des facteurs relatifs à la vie privée (ÉFVP) et aux cadres légaux applicables avant tout déploiement officiel.
          </div>
        </div>
      </div>
    </AppShell>
  )
}
