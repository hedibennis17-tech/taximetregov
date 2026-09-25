'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/ui'
import { useParams, useRouter } from 'next/navigation'
import { ENTERPRISES, CATEGORY_LABELS, WORKER_MODEL_LABELS } from '../data'
import { ArrowLeft, CheckCircle, XCircle, Building, Users, Truck, Activity, DollarSign, Shield, Zap } from 'lucide-react'

export default function EnterpriseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const e = ENTERPRISES.find(x => x.id === id)

  if (!e) return (
    <AppShell>
      <div className="p-8 text-center text-slate-400">Entreprise introuvable</div>
    </AppShell>
  )

  const sections = [
    { icon: Building,   label:'Profil',        items:[
      { k:'ID',            v: e.id },
      { k:'Catégorie',     v: CATEGORY_LABELS[e.category] },
      { k:'Province',      v: e.province },
      { k:'Statut',        v: e.status },
      { k:'Mode travail',  v: WORKER_MODEL_LABELS[e.worker_model] },
    ]},
    { icon: Activity,    label:'Services',      items: e.services.map(s => ({ k: s, v: '✓' })) },
    { icon: Zap,         label:'Intégration',   items:[
      { k:'API',         v: e.api_connected   ? '✅ Connectée' : '❌ Non connectée' },
      { k:'Webhook',     v: e.webhook_active   ? '✅ Actif'     : '❌ Inactif' },
      { k:'Dernière sync',v: 'N/A — DEMO' },
      { k:'Events today', v: '0 — DEMO' },
    ]},
    { icon: Users,       label:'Chauffeurs / Livreurs', items:[
      { k:'Nombre',      v: e.drivers_count != null ? e.drivers_count.toLocaleString() : 'TO_BE_VERIFIED' },
      { k:'Statut',      v: WORKER_MODEL_LABELS[e.worker_model] },
      { k:'Données',     v: 'DEMO' },
    ]},
    { icon: DollarSign,  label:'Revenus (DEMO)', items:[
      { k:'Revenus bruts', v: e.revenue_demo != null ? `${e.revenue_demo.toLocaleString()} $ DEMO` : 'TO_BE_VERIFIED' },
      { k:'TPS',           v: e.revenue_demo != null ? `${Math.round(e.revenue_demo * 0.05).toLocaleString()} $ DEMO` : '—' },
      { k:'TVQ',           v: e.revenue_demo != null ? `${Math.round(e.revenue_demo * 0.09975).toLocaleString()} $ DEMO` : '—' },
    ]},
    { icon: Shield,      label:'Conformité',    items:[
      { k:'Licences',       v: 'TO_BE_VERIFIED' },
      { k:'Assurance',      v: 'TO_BE_VERIFIED' },
      { k:'Enregistrement', v: 'TO_BE_VERIFIED' },
      { k:'Conformité fiscale',v:'TO_BE_VERIFIED' },
      { k:'NEQ',            v: 'NE PAS INVENTER' },
    ]},
  ]

  if (e.departments && e.departments.length > 0) {
    sections.splice(2, 0, {
      icon: Building,
      label: 'Départements',
      items: e.departments.map(d => ({ k: d, v: 'Département' }))
    })
  }

  return (
    <AppShell>
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl bg-slate-900 border border-slate-800">
          <ArrowLeft size={16} className="text-slate-400" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white">{e.name}</h1>
          <p className="text-xs text-slate-400">{CATEGORY_LABELS[e.category]}</p>
        </div>
      </div>

      {/* Badges */}
      <div className="px-4 mb-4 flex flex-wrap gap-2">
        {e.is_demo && <span className="text-xs px-2 py-1 rounded-lg bg-amber-500/15 text-amber-400 font-bold border border-amber-500/20">⚠️ DEMO ENTERPRISE</span>}
        {e.status === 'TO_BE_VERIFIED' && <span className="text-xs px-2 py-1 rounded-lg bg-orange-500/15 text-orange-400 font-bold">❓ À QUALIFIER</span>}
        <span className="text-xs px-2 py-1 rounded-lg bg-slate-800 text-slate-300">{e.id}</span>
      </div>

      <div className="px-4 pb-8 space-y-3">
        {sections.map(sec => (
          <div key={sec.label} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800 bg-slate-800/50">
              <sec.icon size={13} className="text-qc-blue" />
              <span className="text-xs font-bold text-white">{sec.label}</span>
            </div>
            <div className="divide-y divide-slate-800">
              {sec.items.map(item => (
                <div key={item.k} className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-xs text-slate-400">{item.k}</span>
                  <span className="text-xs font-semibold text-white text-right max-w-[55%]">{item.v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-center">
          <p className="text-[9px] text-slate-500">
            TAXIMETER.GOV · Mode pilote · Les données sont synthétiques et clairement identifiées DEMO.<br/>
            NEQ, API, Webhooks, chiffres fiscaux réels non inventés.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
