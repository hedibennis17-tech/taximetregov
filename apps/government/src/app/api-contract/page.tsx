'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card } from '@/components/ui'
import { useState } from 'react'
import { Code, ChevronDown, ChevronRight, Lock } from 'lucide-react'

const apiGroups = [
  { group:'Authentication', color:'bg-green-100 text-green-700', endpoints:[
    { method:'POST', path:'/api/auth/login', auth:'Public', desc:'Login avec email+password · Retourne JWT', body:'{ email, password }', response:'{ token, user, mfa_required }' },
    { method:'POST', path:'/api/auth/mfa/verify', auth:'JWT', desc:'Vérification code MFA (TOTP)', body:'{ code }', response:'{ token, verified }' },
    { method:'POST', path:'/api/auth/logout', auth:'JWT', desc:'Révocation session courante', body:'{}', response:'{ success }' },
    { method:'POST', path:'/api/auth/logout/all', auth:'JWT + MFA', desc:'Révocation toutes sessions · Audit créé', body:'{}', response:'{ success, sessions_revoked }' },
  ]},
  { group:'Drivers (Government)', color:'bg-blue-100 text-blue-700', endpoints:[
    { method:'GET', path:'/api/drivers', auth:'JWT + RBAC', desc:'Liste chauffeurs · Filtres: status, region, platform · RBAC scope', body:'-', response:'{ drivers[], total, page }' },
    { method:'GET', path:'/api/drivers/:id', auth:'JWT + RBAC', desc:'Profil complet chauffeur · Audit accès créé', body:'-', response:'{ driver, vehicles, licenses, platforms, revenue_summary }' },
    { method:'PATCH', path:'/api/drivers/:id/status', auth:'JWT + COMPLIANCE_OFFICER', desc:'Modifier statut · Audit obligatoire', body:'{ status, reason }', response:'{ driver, audit_id }' },
  ]},
  { group:'Vehicles & Licenses', color:'bg-indigo-100 text-indigo-700', endpoints:[
    { method:'GET', path:'/api/vehicles', auth:'JWT + RBAC', desc:'Liste véhicules · Filtres statut/territoire', body:'-', response:'{ vehicles[], total }' },
    { method:'GET', path:'/api/licenses', auth:'JWT + RBAC', desc:'Licences · Filtres: status, type, expiry', body:'-', response:'{ licenses[], total }' },
    { method:'POST', path:'/api/licenses/:id/renew', auth:'JWT + LICENSING_OFFICER', desc:'Workflow renouvellement · Maker-Checker si requis', body:'{ reason }', response:'{ approval_workflow_id }' },
  ]},
  { group:'Revenue Gateway & Ledger', color:'bg-purple-100 text-purple-700', endpoints:[
    { method:'POST', path:'/api/gateway/webhooks/:provider', auth:'HMAC Signature', desc:'Ingestion webhook · HMAC vérifié · Idempotent', body:'provider_event', response:'{ status, transaction_id }' },
    { method:'GET', path:'/api/ledger/transactions', auth:'JWT + TAX_ADMIN', desc:'Ledger universel · Source de vérité financière', body:'-', response:'{ transactions[], totals }' },
    { method:'GET', path:'/api/ledger/summary', auth:'JWT + RBAC', desc:'Résumé financier par période/plateforme', body:'-', response:'{ gross, net, tips, fees, tps, tvq }' },
  ]},
  { group:'Tax Engine', color:'bg-amber-100 text-amber-700', endpoints:[
    { method:'GET', path:'/api/tax/records', auth:'JWT + TAX_ADMIN', desc:'Dossiers fiscaux · Audit accès · RBAC', body:'-', response:'{ tax_records[], totals }' },
    { method:'GET', path:'/api/tax/periods', auth:'JWT + TAX_ADMIN', desc:'Périodes fiscales TPS/TVQ', body:'-', response:'{ periods[], status }' },
    { method:'GET', path:'/api/tax/rules', auth:'JWT + SYSTEM_ADMIN', desc:'TaxRuleSet actif · Taux configurables', body:'-', response:'{ tps_rate, tvq_rate, jurisdiction, version }' },
  ]},
  { group:'Compliance', color:'bg-orange-100 text-orange-700', endpoints:[
    { method:'GET', path:'/api/compliance/cases', auth:'JWT + COMPLIANCE_OFFICER', desc:'Dossiers conformité · Filtres: priority, status', body:'-', response:'{ cases[], total }' },
    { method:'POST', path:'/api/compliance/cases', auth:'JWT + COMPLIANCE_OFFICER', desc:'Créer dossier · Audit créé', body:'{ driver_id, type, description }', response:'{ case_id, audit_id }' },
    { method:'PATCH', path:'/api/compliance/cases/:id', auth:'JWT + COMPLIANCE_OFFICER', desc:'Mettre à jour dossier · Audit', body:'{ status, notes }', response:'{ case, audit_id }' },
  ]},
  { group:'Analytics & Reports', color:'bg-teal-100 text-teal-700', endpoints:[
    { method:'GET', path:'/api/analytics/revenue', auth:'JWT + ANALYST', desc:'Revenus agrégés · Non modifiable · Source: Ledger', body:'-', response:'{ gross, net, by_platform, by_period }' },
    { method:'POST', path:'/api/reports/generate', auth:'JWT + RBAC', desc:'Génération rapport · Audit créé · Background job', body:'{ dataset, filters, format }', response:'{ job_id, estimated_time }' },
    { method:'GET', path:'/api/reports/:job_id/download', auth:'JWT + RBAC + Scope', desc:'Télécharger rapport généré · Audit accès', body:'-', response:'file (PDF/CSV/XLSX/JSON)' },
  ]},
  { group:'Driver App (Phase 2 — NON IMPLÉMENTÉ)', color:'bg-slate-100 text-slate-500', endpoints:[
    { method:'GET', path:'/api/driver/profile', auth:'Driver JWT', desc:'[Phase 2] Profil chauffeur auth. · MFA', body:'-', response:'{ driver, vehicles, licenses }' },
    { method:'GET', path:'/api/driver/revenue/summary', auth:'Driver JWT', desc:'[Phase 2] Revenus chauffeur · Agrégats seulement', body:'-', response:'{ gross, net, tips, tps, tvq, periods }' },
    { method:'POST', path:'/api/meter/sessions', auth:'Meter Auth', desc:'[Phase 2] Session taximètre · Véhicule autorisé', body:'{ vehicle_id, driver_id }', response:'{ session_id, started_at }' },
    { method:'GET', path:'/api/driver/notifications', auth:'Driver JWT', desc:'[Phase 2] Notifications chauffeur · IN_APP', body:'-', response:'{ notifications[], unread }' },
  ]},
]

const methodColors: Record<string, string> = { GET:'bg-green-100 text-green-700', POST:'bg-blue-100 text-blue-700', PATCH:'bg-amber-100 text-amber-700', DELETE:'bg-red-100 text-red-700', PUT:'bg-purple-100 text-purple-700' }

export default function ApiContractPage() {
  const [open, setOpen] = useState<Record<string,boolean>>({})
  const toggle = (g:string) => setOpen(p=>({...p,[g]:!p[g]}))
  return (
    <AppShell>
      <PageHeader title="API Contract — Documentation" subtitle="Routes Government Dashboard · Driver App Phase 2 (non implémenté)"/>
      <div className="flex items-start gap-3 px-4 py-3 mb-5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700">
        <Lock size={13} className="mt-0.5 shrink-0"/>
        <span>Toutes les routes sensibles requièrent JWT + RBAC côté backend. La protection frontend seule est insuffisante. Les routes Driver App (Phase 2) sont documentées mais non encore implémentées.</span>
      </div>
      <div className="space-y-3">
        {apiGroups.map(g=>(
          <Card key={g.group}>
            <button onClick={()=>toggle(g.group)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Code size={14} className="text-qc-blue shrink-0"/>
              <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 flex-1">{g.group}</div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${g.color}`}>{g.endpoints.length} routes</span>
              {open[g.group] ? <ChevronDown size={13} className="text-slate-400"/> : <ChevronRight size={13} className="text-slate-400"/>}
            </button>
            {open[g.group] && (
              <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800">
                {g.endpoints.map(ep=>(
                  <div key={ep.path} className="px-4 py-3">
                    <div className="flex items-start gap-3 mb-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${methodColors[ep.method]||'bg-slate-100 text-slate-600'}`}>{ep.method}</span>
                      <code className="text-xs font-mono text-qc-blue">{ep.path}</code>
                      <span className="text-[10px] text-slate-500 ml-auto shrink-0">🔐 {ep.auth}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1.5">{ep.desc}</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      {ep.body !== '-' && <div><span className="text-slate-500 font-medium block mb-0.5">Body</span><code className="text-slate-600 dark:text-slate-400">{ep.body}</code></div>}
                      <div><span className="text-slate-500 font-medium block mb-0.5">Response</span><code className="text-slate-600 dark:text-slate-400">{ep.response}</code></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </AppShell>
  )
}
