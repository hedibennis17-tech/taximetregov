'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, KpiCard } from '@/components/ui'
import { complianceRequirements, thirdPartyRegistry, featureFlags, backupStrategy, dataClassificationRegistry, mfaPolicy, type ControlStatus } from '@/data/security.mock'
import { useState } from 'react'
import { CheckCircle, AlertCircle, Clock, Archive } from 'lucide-react'

const controlColors: Record<ControlStatus, string> = {
  READY:'bg-green-100 text-green-700', PARTIAL:'bg-amber-100 text-amber-700',
  MISSING:'bg-red-100 text-red-700', REVIEW_REQUIRED:'bg-orange-100 text-orange-700',
}

export default function GovernanceCenterPage() {
  const [tab, setTab] = useState<'compliance'|'thirdparty'|'features'|'backup'|'mfa'>('compliance')
  const ready = complianceRequirements.filter(r=>r.status==='READY').length
  const partial = complianceRequirements.filter(r=>r.status==='PARTIAL').length
  const review = complianceRequirements.filter(r=>r.status==='REVIEW_REQUIRED').length
  const score = Math.round(ready/complianceRequirements.length*100)

  return (
    <AppShell>
      <PageHeader title="Governance Center" subtitle="Conformité · Fournisseurs · Feature Flags · Backup · MFA Policy" />

      <div className="grid grid-cols-4 gap-3 mb-5">
        <KpiCard label="Score conformité" value={`${score}%`} large icon={<CheckCircle size={16}/>} color={score>=80?'green':score>=60?'orange':'red'} />
        <KpiCard label="READY" value={ready} icon={<CheckCircle size={16}/>} color="green" />
        <KpiCard label="PARTIAL" value={partial} icon={<AlertCircle size={16}/>} color="orange" />
        <KpiCard label="REVIEW REQUIRED" value={review} icon={<Clock size={16}/>} color="red" />
      </div>

      <div className="flex gap-1 mb-5 flex-wrap">
        {[['compliance','Conformité'],['thirdparty','Fournisseurs tiers'],['features','Feature Flags'],['backup','Backup & DR'],['mfa','MFA Policy']].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k as any)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${tab===k?'bg-qc-blue text-white':'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab==='compliance' && (
        <Card>
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Contrôles de conformité — {complianceRequirements.length} contrôles</div>
            <div className="text-[10px] text-slate-400">Pilote Québec — Indicateurs internes — Pas une certification officielle</div>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {complianceRequirements.map(req=>(
              <div key={req.id} className="px-4 py-3 flex items-start gap-4">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${controlColors[req.status]}`}>{req.status}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-semibold text-xs text-slate-700 dark:text-slate-200">{req.requirement}</span>
                    <span className="text-[9px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{req.category}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">{req.control}</div>
                  <div className="text-[10px] text-slate-400">Evidence: <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded text-[9px]">{req.evidence}</code> · {req.owner}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab==='thirdparty' && (
        <Card>
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Registre des fournisseurs tiers</div>
            <div className="text-[10px] text-slate-400">MOCK — Aucun accès réel configuré pour les plateformes externes</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-100 dark:border-slate-800">
                {['Fournisseur','Finalité','Portée','Statut','Sécurité','Rétention','Approuvé'].map(h=>(
                  <th key={h} className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {thirdPartyRegistry.map(tp=>(
                  <tr key={tp.provider} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-3 py-2.5 font-semibold text-xs text-slate-700 dark:text-slate-200">{tp.provider}</td>
                    <td className="px-3 py-2.5 text-[10px] text-slate-500 max-w-36 truncate">{tp.purpose}</td>
                    <td className="px-3 py-2.5 text-[10px] text-slate-500 max-w-36 truncate">{tp.accessScope}</td>
                    <td className="px-3 py-2.5"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${tp.status==='ACTIF'?'bg-green-100 text-green-700':tp.status.startsWith('MOCK')?'bg-slate-100 text-slate-500':'bg-amber-100 text-amber-700'}`}>{tp.status.substring(0,12)}</span></td>
                    <td className="px-3 py-2.5 text-[10px] text-slate-500 max-w-40 truncate">{tp.security}</td>
                    <td className="px-3 py-2.5 text-[10px] text-slate-500">{tp.retention}</td>
                    <td className="px-3 py-2.5 text-[10px] font-bold">{tp.approved?<span className="text-green-600">✅</span>:<span className="text-amber-600">⏳</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab==='features' && (
        <Card>
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Feature Flags</div>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {featureFlags.map(ff=>(
              <div key={ff.id} className="px-4 py-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <code className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">{ff.name}</code>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${ff.enabled?'bg-green-100 text-green-700':'bg-slate-100 text-slate-500'}`}>{ff.enabled?'ACTIVÉ':'DÉSACTIVÉ'}</span>
                    <span className="text-[10px] text-slate-400">env: {ff.environment}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">{ff.description} — {ff.reason}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab==='backup' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-orange-50 border border-orange-200 text-xs text-orange-700">
            <AlertCircle size={13} className="shrink-0"/>
            Tests de restauration non effectués pour DB et documents — À planifier avant production.
          </div>
          {Object.entries(backupStrategy).map(([key,strat])=>(
            <Card key={key} className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Archive size={18} className="text-qc-blue shrink-0"/>
                <div>
                  <span className="font-semibold text-sm text-slate-700 dark:text-slate-200 capitalize">{key.replace(/([A-Z])/g,' $1').trim()}</span>
                  <span className="ml-2 text-[10px] text-slate-400">{strat.provider}</span>
                  <span className={`ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded ${strat.tested?'bg-green-100 text-green-700':'bg-orange-100 text-orange-700'}`}>{strat.tested?'✅ Testé':'⚠ Non testé'}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px]">
                <div><span className="text-slate-500 font-medium block">Fréquence</span>{strat.frequency}</div>
                <div><span className="text-slate-500 font-medium block">Rétention</span>{strat.retention}</div>
                <div><span className="text-slate-500 font-medium block">Chiffrement</span><span className={strat.encrypted?'text-green-600 font-bold':'text-slate-400'}>{strat.encrypted?'✅ Oui':'Non'}</span></div>
                {'rto' in strat && <div><span className="text-slate-500 font-medium block">RTO / RPO</span>{(strat as any).rto} / {(strat as any).rpo}</div>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab==='mfa' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(mfaPolicy).map(([level,policy])=>(
            <Card key={level} className={`p-5 ${policy.required?'border-qc-blue/30':''}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{level}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${policy.required?'bg-qc-blue text-white':'bg-slate-200 text-slate-600'}`}>{policy.required?'OBLIGATOIRE':'RECOMMANDÉ'}</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">{policy.description}</p>
              <div className="flex flex-wrap gap-1">
                {policy.roles.map(r=>(
                  <span key={r} className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-600 dark:text-slate-400">{r}</span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  )
}
