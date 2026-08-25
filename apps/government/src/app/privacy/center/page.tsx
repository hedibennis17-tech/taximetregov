'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, KpiCard } from '@/components/ui'
import { dataClassificationRegistry, mockPrivacyRequests, type DataClassification, type PrivacyRequestStatus } from '@/data/security.mock'
import { useState } from 'react'
import { Shield, Database, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react'

const classColors: Record<DataClassification, string> = {
  PUBLIC:'bg-green-100 text-green-700 border-green-200',
  INTERNAL:'bg-blue-100 text-blue-700 border-blue-200',
  CONFIDENTIAL:'bg-orange-100 text-orange-700 border-orange-200',
  HIGHLY_CONFIDENTIAL:'bg-red-100 text-red-700 border-red-200',
}
const requestStatusColors: Record<PrivacyRequestStatus, string> = {
  PENDING:'bg-slate-100 text-slate-600', IN_REVIEW:'bg-amber-100 text-amber-700',
  COMPLETED:'bg-green-100 text-green-700', REJECTED:'bg-red-100 text-red-700',
}

export default function PrivacyCenterPage() {
  const [tab, setTab] = useState<'classification'|'requests'>('classification')
  const pending = mockPrivacyRequests.filter(r=>r.status==='PENDING'||r.status==='IN_REVIEW').length

  return (
    <AppShell>
      <PageHeader title="Privacy Center" subtitle="Classification des données · PII · NAS · Demandes · Minimisation" />

      <div className="flex items-start gap-3 px-4 py-3 mb-5 rounded-xl bg-blue-50 border border-blue-200">
        <Shield size={14} className="text-qc-blue mt-0.5 shrink-0"/>
        <div className="text-xs text-blue-700">
          <strong>Privacy by Design :</strong> Minimisation des données, limitation de finalité, moindre privilège, sécurité par défaut, auditabilité. Le NAS n'est jamais affiché en clair — toujours tokenisé (<code className="bg-blue-100 px-1 rounded">***-***-XXX</code>), jamais dans les logs, URLs, ou exports non autorisés.
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <KpiCard label="Catégories classifiées" value={dataClassificationRegistry.length} icon={<Database size={16}/>} color="blue"/>
        <KpiCard label="Demandes actives" value={pending} icon={<FileText size={16}/>} color={pending>0?'orange':'green'}/>
        <KpiCard label="Données chiffrées" value={dataClassificationRegistry.filter(d=>d.encrypted).length} icon={<Shield size={16}/>} color="green"/>
      </div>

      <div className="flex gap-1 mb-5">
        {[['classification','Classification & PII'],['requests','Demandes de confidentialité']].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k as any)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${tab===k?'bg-qc-blue text-white':'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab==='classification' && (
        <div className="space-y-3">
          {/* SIN/NAS protection */}
          <Card className="p-4 border-red-200 dark:border-red-900">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">🔒</span>
              <div className="font-bold text-sm text-slate-700 dark:text-slate-200">Numéro d'assurance sociale (NAS) — Protection maximale</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px]">
              {[
                ['Stockage','Tokenisé uniquement — jamais en clair'],
                ['Affichage','***-***-XXX uniquement'],
                ['Logs','Interdit — jamais dans les journaux'],
                ['URLs','Interdit — jamais dans les paramètres'],
                ['Exports','Uniquement avec autorisation SUPER_ADMIN'],
                ['Chiffrement','AES-256 + chiffrement champ'],
                ['Accès','SUPER_ADMIN + TAX_ADMIN (limité)'],
                ['Audit','Chaque accès journalisé'],
              ].map(([k,v])=>(
                <div key={k} className="p-2 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="font-semibold text-red-700 mb-0.5">{k}</div>
                  <div className="text-red-600">{v}</div>
                </div>
              ))}
            </div>
          </Card>

          {dataClassificationRegistry.map(dc=>(
            <Card key={dc.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">{dc.name}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${classColors[dc.classification]}`}>{dc.classification}</span>
                    <span className="text-[10px] text-slate-400">{dc.category}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {dc.examples.map(e=>(
                      <span key={e} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">{e}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                    <div><span className="text-slate-500 font-medium block">Rétention</span>{dc.retention}</div>
                    <div><span className="text-slate-500 font-medium block">Chiffrement</span><span className={dc.encrypted?'text-green-600 font-bold':'text-slate-400'}>{dc.encrypted?'✅ Oui':'Non requis'}</span></div>
                    <div><span className="text-slate-500 font-medium block">Journal accès</span><span className={dc.logged?'text-qc-blue font-bold':'text-slate-400'}>{dc.logged?'✅ Obligatoire':'Non requis'}</span></div>
                    <div><span className="text-slate-500 font-medium block">Accès</span>{dc.access.join(', ')}</div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab==='requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-slate-500">{mockPrivacyRequests.length} demande(s)</div>
            <button className="px-3 py-1.5 rounded-lg bg-qc-blue text-white text-xs font-semibold hover:bg-blue-700 transition-colors">+ Nouvelle demande</button>
          </div>
          {mockPrivacyRequests.map(req=>(
            <Card key={req.id} className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">{req.type} — {req.driverName}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${requestStatusColors[req.status]}`}>{req.status}</span>
                    <span className="font-mono text-[10px] text-qc-blue">{req.driverId}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{req.description}</p>
                  <div className="flex items-center gap-4 text-[10px] text-slate-400 flex-wrap">
                    <span>Soumis : {new Date(req.createdAt).toLocaleDateString('fr-CA')}</span>
                    <span>Échéance : {new Date(req.dueDate).toLocaleDateString('fr-CA')}</span>
                    {req.assignedTo && <span>Assigné : {req.assignedTo}</span>}
                    {req.completedAt && <span className="text-green-600">Complété : {new Date(req.completedAt).toLocaleDateString('fr-CA')}</span>}
                  </div>
                </div>
                {req.status === 'PENDING' && (
                  <button className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-qc-blue text-white hover:bg-blue-700 transition-colors shrink-0">Traiter</button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  )
}
