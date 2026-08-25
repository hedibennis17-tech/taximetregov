'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card, PlatformStatusBadge, SectionHeader } from '@/components/ui'
import { mockPlatforms } from '@/data/driver.mock'
import { ExternalLink, RefreshCw, AlertCircle, CheckCircle, Lock } from 'lucide-react'

export default function PlatformsPage() {
  const connected = mockPlatforms.filter(p => p.status === 'CONNECTED')
  const available = mockPlatforms.filter(p => p.status !== 'CONNECTED')

  return (
    <AppShell>
      <PageHeader title="Mes plateformes" subtitle={`${connected.length} connectées · ${available.length} disponibles`} />
      <div className="px-4">
        {/* OAuth notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-5">
          <Lock size={14} className="text-blue-400 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-300">La connexion aux plateformes se fait via OAuth officiel. Vous n'avez jamais à donner votre mot de passe Uber/Lyft à Taximètre.GOV. (MOCK — Connexion réelle non configurée en pilote)</p>
        </div>

        <SectionHeader title="Plateformes connectées" />
        <div className="space-y-3 mb-6">
          {connected.map(p => (
            <Card key={p.provider} className="border-green-500/20">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{p.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-white">{p.name}</span>
                    <PlatformStatusBadge status={p.status} />
                    {!p.taximeterEnabled && <span className="text-[9px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full">Taximètre: DÉSACTIVÉ</span>}
                    {p.taximeterEnabled && <span className="text-[9px] bg-qc-blue/20 text-blue-300 px-1.5 py-0.5 rounded-full">🔢 Taximètre actif</span>}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">{p.externalAccountId}</div>
                </div>
                <button className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
                  <RefreshCw size={14} className="text-slate-400" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label:'Courses', val:p.todayTrips },
                  { label:'Revenus', val:new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(p.todayRevenue) },
                  { label:'Sync', val:p.lastSync ? new Date(p.lastSync).toLocaleTimeString('fr-CA',{hour:'2-digit',minute:'2-digit'}) : '—' },
                ].map(s=>(
                  <div key={s.label} className="bg-slate-800/50 rounded-xl p-2 text-center">
                    <div className="text-sm font-bold text-white">{s.val}</div>
                    <div className="text-[9px] text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>
              {p.provider !== 'taxi' && (
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
                  <AlertCircle size={10} />
                  <span>Prix fourni par {p.name} — taximètre.gov enregistre uniquement le montant final</span>
                </div>
              )}
            </Card>
          ))}
        </div>

        <SectionHeader title="Connexions disponibles" />
        <div className="space-y-3 mb-6">
          {available.map(p => (
            <div key={p.provider} className={`driver-card p-4 flex items-center gap-3 ${p.status === 'MAINTENANCE' ? 'border-amber-500/20' : ''}`}>
              <span className="text-3xl opacity-70">{p.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-slate-300">{p.name}</span>
                  <PlatformStatusBadge status={p.status} />
                </div>
                <div className="text-[10px] text-slate-500">{p.activityType.replace('_',' ')}</div>
              </div>
              {p.status === 'NOT_CONNECTED' && (
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-qc-blue/20 border border-qc-blue/30 text-blue-400 text-xs font-semibold hover:bg-qc-blue/30 transition-all">
                  <ExternalLink size={11} /> Connecter
                </button>
              )}
              {p.status === 'MAINTENANCE' && (
                <span className="text-xs text-amber-400">En maintenance</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
