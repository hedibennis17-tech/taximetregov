'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { Phone, MessageCircle, AlertCircle, ChevronRight } from 'lucide-react'

const categories = [
  { icon:'🏛️', label:'Support gouvernemental', desc:'MTQ · ARQ · SAAQ' },
  { icon:'🚕', label:'Support taxi', desc:'Permis · Taximètre · Courses' },
  { icon:'💰', label:'Problème de paiement', desc:'Transaction · Revenus · Taxes' },
  { icon:'📄', label:'Documents', desc:'Upload · Validation · Rejet' },
  { icon:'🔗', label:'Plateformes', desc:'Uber · Lyft · DoorDash · Skip' },
  { icon:'🔧', label:'Problème technique', desc:'Application · GPS · Sync' },
]

export default function SupportPage() {
  return (
    <AppShell>
      <PageHeader title="Support" subtitle="Assistance chauffeur — SIMULATION" />
      <div className="px-4">
        <div className="flex gap-3 mb-5">
          <button className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-qc-blue text-white font-semibold text-sm hover:bg-qc-blue-dark transition-all">
            <MessageCircle size={16} /> Chat
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-800 text-slate-300 font-semibold text-sm hover:bg-slate-700 transition-all">
            <Phone size={16} /> Téléphone
          </button>
        </div>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Catégories</div>
        <div className="driver-card divide-y divide-slate-800 mb-5">
          {categories.map(c=>(
            <button key={c.label} className="w-full flex items-center gap-3 p-4 hover:bg-slate-800/50 transition-colors text-left first:rounded-t-2xl last:rounded-b-2xl">
              <span className="text-2xl w-8 shrink-0">{c.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{c.label}</div>
                <div className="text-[10px] text-slate-500">{c.desc}</div>
              </div>
              <ChevronRight size={14} className="text-slate-600" />
            </button>
          ))}
        </div>
        <div className="text-center text-[10px] text-slate-700">
          TAXIMÈTRE.GOV — Support pilote<br/>
          ⚠ SIMULATION — Données de démonstration
        </div>
      </div>
    </AppShell>
  )
}
