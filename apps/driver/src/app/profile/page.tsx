'use client'

import Link from 'next/link'
import { CheckCircle, ChevronRight, RefreshCw, Shield } from 'lucide-react'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { useDriverDashboard } from '@/lib/supabase/useDriverDashboard'

function iconForType(type: string) {
  if (type === 'TAXI_TRIP') return '🚕'
  if (type === 'RIDESHARE_TRIP') return '🚗'
  return '📦'
}

export default function ProfilePage() {
  const { dashboard, loading, error, refresh } = useDriverDashboard()

  if (loading) return <AppShell><div className="px-4 pt-4 pb-2"><h1 className="text-xl font-bold text-white">Mon profil</h1><p className="text-xs text-slate-400 mt-0.5">Données réelles · Supabase</p></div><div className="py-16 text-center text-sm text-slate-500">Chargement de votre dossier…</div></AppShell>
  if (!dashboard) return <AppShell><div className="px-4 pt-4 pb-2"><h1 className="text-xl font-bold text-white">Mon profil</h1><p className="text-xs text-slate-400 mt-0.5">Données réelles · Supabase</p></div><div className="px-4 py-16 text-center"><p className="text-sm text-red-300 mb-4">{error ?? 'Dossier indisponible.'}</p><button onClick={() => void refresh()} className="px-4 py-2 rounded-xl bg-qc-blue text-white text-xs font-semibold">Réessayer</button></div></AppShell>

  const activityTypes = [...new Set(dashboard.activities.map((activity) => activity.type))]

  return (
    <AppShell>
      <PageHeader title="Mon profil" subtitle="Identité · Activités · Connexions sécurisées" action={<button onClick={() => void refresh()} aria-label="Actualiser"><RefreshCw size={18} className="text-slate-400" /></button>} />
      <div className="px-4">
        <div className="flex items-center gap-4 p-5 driver-card mb-5">
          <div className="w-16 h-16 rounded-full bg-qc-blue/20 border-2 border-qc-blue/40 flex items-center justify-center text-3xl shrink-0">👤</div>
          <div className="flex-1 min-w-0"><div className="font-black text-white text-xl truncate">{dashboard.profile.firstName} {dashboard.profile.lastName}</div><div className="font-mono text-[10px] text-qc-blue-light">{dashboard.profile.driverNumber}</div><div className="text-xs text-slate-400 truncate">{dashboard.profile.email}</div></div>
          <div className="text-right"><div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${dashboard.profile.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>{dashboard.profile.status}</div><div className="text-[9px] text-slate-500 mt-1">{dashboard.profile.province} · {dashboard.profile.language.toUpperCase()}</div></div>
        </div>

        <div className={`flex items-center gap-3 p-4 rounded-2xl border mb-5 ${dashboard.profile.status === 'ACTIVE' ? 'bg-green-500/10 border-green-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}><span className="text-2xl">{dashboard.profile.status === 'ACTIVE' ? '✅' : '⚠️'}</span><div className="flex-1"><div className="font-bold text-white text-sm">{dashboard.profile.status === 'ACTIVE' ? 'Dossier chauffeur actif' : 'Dossier en cours de vérification'}</div><div className="text-[10px] text-slate-400">Statut lu directement depuis Supabase</div></div><CheckCircle size={16} className={dashboard.profile.status === 'ACTIVE' ? 'text-green-400' : 'text-amber-400'} /></div>

        <Card className="mb-4"><div className="font-semibold text-white text-sm mb-3">Activités enregistrées</div>{activityTypes.length === 0 ? <p className="text-xs text-slate-500 py-2">Aucune activité n’est encore liée à votre dossier.</p> : <div className="space-y-2">{activityTypes.map((type) => <div key={type} className="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0"><span className="text-xl">{iconForType(type)}</span><span className="text-xs text-slate-200 flex-1">{type.replaceAll('_', ' ')}</span><span className="text-[9px] font-bold text-green-400">ENREGISTRÉE</span></div>)}</div>}<Link href="/activities" className="block text-center text-xs text-qc-blue-light mt-3 font-bold">Voir mes activités →</Link></Card>

        <Card className="mb-4"><div className="font-semibold text-white text-sm mb-3">Connexions fournisseurs</div><div className="flex items-start gap-2 p-2 rounded-xl bg-slate-800/50 border border-slate-700 mb-3 text-[10px] text-slate-400"><Shield size={12} className="mt-0.5 shrink-0" />Les identifiants des fournisseurs restent protégés. Seuls vos comptes autorisés sont affichés.</div>{dashboard.platforms.length === 0 ? <p className="text-xs text-slate-500 py-2">Aucun compte fournisseur relié.</p> : <div className="grid grid-cols-2 gap-2">{dashboard.platforms.map((platform) => <div key={platform.id} className="bg-slate-800/50 rounded-xl p-2"><div className="text-xs font-semibold text-white truncate">{platform.name}</div><div className={`text-[9px] mt-1 font-bold ${platform.status === 'ACTIVE' ? 'text-green-400' : 'text-amber-400'}`}>{platform.status === 'ACTIVE' ? 'CONNECTÉE' : platform.status}</div></div>)}</div>}<Link href="/platforms" className="block text-center text-xs text-qc-blue-light mt-3 font-bold">Gérer les connexions →</Link></Card>

        <div className="space-y-2 mb-6">{[
          { href: '/activities', icon: '🛣️', label: 'Mes activités' },
          { href: '/revenue', icon: '💰', label: 'Mes revenus' },
          { href: '/platforms', icon: '🔗', label: 'Mes plateformes' },
          { href: '/documents', icon: '📑', label: 'Mes documents' },
          { href: '/profile/privacy', icon: '🔒', label: 'Confidentialité' },
          { href: '/security', icon: '🛡️', label: 'Sécurité du compte' },
        ].map((item) => <Link key={item.href} href={item.href}><div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"><span className="text-xl">{item.icon}</span><span className="text-sm text-slate-200 font-medium flex-1">{item.label}</span><ChevronRight size={14} className="text-slate-600" /></div></Link>)}</div>
      </div>
    </AppShell>
  )
}
