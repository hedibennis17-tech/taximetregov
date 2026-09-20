'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PILOT, TRANSPARENCY_DATA } from '@/lib/data'

const SHARING_CONF: Record<string,{label:string;color:string;bg:string}> = {
  'NON':        {label:'Non partagé',  color:'#059669',bg:'rgba(5,150,105,0.12)'},
  'CONTRÔLÉ':  {label:'Contrôlé',     color:'#003DA5',bg:'rgba(0,61,165,0.10)'},
  'SIMULATION': {label:'Simulation',   color:'#B45309',bg:'rgba(180,83,9,0.10)'},
}

export default function TransparencyPage() {
  return (
    <AppShell>
      <div className="px-4 md:px-6 py-6 space-y-5 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Confidentialité & Transparence</h1>
          <p className="text-sm text-slate-500 mt-1">Données · Droits · Accès · Usage · Isolation · ÉFVP Pilote</p>
        </div>
        <div className="text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">
          {PILOT} · Toutes les données affichées sont synthétiques · Aucun renseignement personnel réel
        </div>

        {/* Principes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {icon:'🔒',l:'Confidentialité',     desc:'Données synthétiques DEMO uniquement',c:'#003DA5',bg:'bg-blue-50 dark:bg-blue-500/10'},
            {icon:'🔗',l:'Isolation',            desc:'enterprise_id strict — aucun accès croisé',c:'#059669',bg:'bg-green-50 dark:bg-green-500/10'},
            {icon:'👁️',l:'Transparence',         desc:'Chaque accès est journalisé',c:'#7C3AED',bg:'bg-purple-50 dark:bg-purple-500/10'},
            {icon:'⚖️',l:'Minimisation',         desc:'Accès limité au rôle autorisé',c:'#B45309',bg:'bg-amber-50 dark:bg-amber-500/10'},
          ].map(p=>(
            <div key={p.l} className={`${p.bg} rounded-2xl p-4 border border-white dark:border-transparent`}>
              <div className="text-2xl mb-2">{p.icon}</div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{p.l}</div>
              <div className="text-sm text-slate-400 mt-1 leading-relaxed">{p.desc}</div>
            </div>
          ))}
        </div>

        {/* Catégories de données */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-white">
            Catégories de données traitées
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                {['Catégorie','Finalité','Rétention','Accès','Partage'].map(h=>(
                  <th key={h} className="px-4 py-2.5 text-left text-sm font-bold text-slate-400 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {TRANSPARENCY_DATA.dataCategories.map(cat=>{
                  const sc = SHARING_CONF[cat.shared]!
                  return (
                    <tr key={cat.cat} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-2.5 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{cat.cat}</td>
                      <td className="px-4 py-2.5 text-sm text-slate-500 max-w-xs">{cat.purpose}</td>
                      <td className="px-4 py-2.5 text-sm text-amber-600 dark:text-amber-400 whitespace-nowrap">{cat.retention}</td>
                      <td className="px-4 py-2.5 text-sm text-slate-500 whitespace-nowrap">{cat.access}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-sm font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vos droits */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Vos droits (pilote)</div>
          {TRANSPARENCY_DATA.rights.map(r=>(
            <div key={r.right} className="py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Droit d'{r.right}</div>
                  <div className="text-sm text-slate-500 mt-0.5">{r.desc}</div>
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400 font-bold shrink-0 text-right max-w-[120px]">{r.how}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Matrice d'accès par rôle */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-3">Qui voit quoi ? — Matrice des rôles</div>
          <div className="space-y-3">
            {TRANSPARENCY_DATA.accessMatrix.map(r=>(
              <div key={r.role} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                <div className="text-sm font-black text-slate-800 dark:text-slate-200 mb-2">👤 {r.role}</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-sm font-bold text-green-600 dark:text-green-400 mb-1">✓ Accès autorisé</div>
                    {r.sees.map(x=><div key={x} className="text-sm text-slate-600 dark:text-slate-300">· {x}</div>)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-red-500 mb-1">✗ Accès refusé</div>
                    {r.cannot.map(x=><div key={x} className="text-sm text-slate-400">· {x}</div>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Isolation */}
        <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-5">
          <div className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">🔒 Isolation stricte multi-entreprises</div>
          <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-1">
            <div>· Chaque entreprise est identifiée par un <span className="font-mono font-bold">enterprise_id</span> unique et immuable.</div>
            <div>· Toutes les requêtes vers la base de données filtrent automatiquement sur cet identifiant.</div>
            <div>· Un utilisateur ne peut jamais voir les données d'une autre entreprise — l'isolation est appliquée côté serveur, pas uniquement dans l'interface.</div>
            <div>· Les administrateurs Gov ont un accès en lecture sur le périmètre qui leur est attribué — jamais l'accès total sans traçabilité.</div>
          </div>
        </div>

        {/* Déclaration ÉFVP */}
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
          <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">🏛️ Déclaration pilote — ÉFVP</div>
          <div className="text-sm text-slate-500 leading-relaxed">
            TAXIMETER.GOV est un pilote démonstration. Toutes les données utilisées sont synthétiques. Un déploiement en production nécessiterait une Évaluation des facteurs relatifs à la vie privée (ÉFVP) complète selon la Loi 25 du Québec, des autorisations réglementaires, et des ententes légales avec les partenaires et fournisseurs de données. Cette interface ne transmet aucune donnée réelle à des organismes gouvernementaux.
          </div>
        </div>
      </div>
    </AppShell>
  )
}
