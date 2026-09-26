'use client'
// ================================================================
// TAXIMETER.GOV — PROFIL CHAUFFEUR
// Complet: identité, véhicule, fiscal, plateformes, stats
// ================================================================
import { AppShell } from '@/components/layout/AppShell'
import { useDriverProfile, useRevenue, money } from '@/lib/api'
import { useState, useEffect } from 'react'
import { RefreshCw, CheckCircle, AlertTriangle, LogOut, ChevronRight, Shield, Car, Wallet, FileText, Bell, Settings } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function StatusDot({ ok }: { ok: boolean }) {
  return <div className={`w-2 h-2 rounded-full ${ok ? 'bg-green-400' : 'bg-amber-400'}`} />
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-800 last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`text-xs font-semibold text-white text-right max-w-[60%] ${mono ? 'font-mono text-[10px]' : ''}`}>{value || '—'}</span>
    </div>
  )
}

function MenuLink({ href, icon: Icon, label, sub, badge }: { href: string; icon: React.ElementType; label: string; sub?: string; badge?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 p-3.5 bg-slate-900 border border-slate-800 rounded-xl hover:border-qc-blue/40 transition-all">
      <div className="w-9 h-9 rounded-xl bg-qc-blue/10 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-qc-blue" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white">{label}</div>
        {sub && <div className="text-[10px] text-slate-400">{sub}</div>}
      </div>
      {badge && <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">{badge}</span>}
      <ChevronRight size={14} className="text-slate-600 shrink-0" />
    </Link>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const { profile, loading: pLoading, refresh } = useDriverProfile()
  const { revenue } = useRevenue('month')
  const [vehicle, setVehicle]   = useState<Record<string,string>|null>(null)
  const [taxAcc,  setTaxAcc]    = useState<Record<string,string>|null>(null)
  const [platforms,setPlatforms]= useState<Array<Record<string,string>>>([])
  const [email,   setEmail]     = useState<string>('')
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    if (!profile?.id) return
    void (async () => {
      const sb = getSupabaseBrowserClient()
      const { data: { session } } = await sb.auth.getSession()
      setEmail(session?.user?.email ?? '')

      const token = session?.access_token
      if (!token) return
      const h = { Authorization: `Bearer ${token}` }

      // Véhicule
      const [vRes, tRes, pRes] = await Promise.all([
        fetch('/api/driver/profile', { headers: h }).then(r => r.json()) as Promise<{ profile: Record<string,unknown>; vehicles: Array<Record<string,string>>; taxAccounts: Array<Record<string,string>>; platforms: Array<Record<string,string>> }>,
        Promise.resolve(null),
        Promise.resolve(null),
      ])
      if (vRes?.vehicles?.[0]) setVehicle(vRes.vehicles[0])
      if (vRes?.taxAccounts?.[0]) setTaxAcc(vRes.taxAccounts[0])
      if (vRes?.platforms) setPlatforms(vRes.platforms)
    })()
  }, [profile?.id])

  async function logout() {
    setLoggingOut(true)
    const sb = getSupabaseBrowserClient()
    await sb.auth.signOut()
    router.replace('/auth/login')
  }

  const initials = profile ? `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}` : '?'
  const fullName = profile ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() : '—'
  const grossMonth = parseFloat(revenue?.summary.total_gross ?? '0')

  if (pLoading) return (
    <AppShell>
      <div className="py-16 text-center">
        <RefreshCw className="mx-auto animate-spin text-qc-blue" size={20} />
        <p className="text-xs text-slate-400 mt-2">Chargement du profil…</p>
      </div>
    </AppShell>
  )

  return (
    <AppShell>
      {/* Hero profil */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-qc-blue flex items-center justify-center text-white font-black text-2xl shadow-blue">
              {initials}
            </div>
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 ${profile?.status === 'ACTIVE' ? 'bg-green-400' : 'bg-amber-400'}`} />
          </div>

          {/* Infos */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-white">{fullName}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-[9px] font-bold px-2 py-1 rounded-lg bg-qc-blue/20 text-qc-blue border border-qc-blue/30">
                {profile?.driver_number ?? '—'}
              </span>
              <span className={`text-[9px] font-bold px-2 py-1 rounded-lg ${profile?.status === 'ACTIVE' ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400'}`}>
                {profile?.status ?? '—'}
              </span>
              <span className="text-[9px] font-bold px-2 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/20">
                PILOTE
              </span>
            </div>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { l:'Revenus ce mois', v: money(grossMonth),       c:'text-emerald-400' },
            { l:'Conformité',      v: profile?.identity_verification_status === 'VERIFIED' ? '✅ OK' : '⚠️ En cours', c: profile?.identity_verification_status === 'VERIFIED' ? 'text-green-400' : 'text-amber-400' },
            { l:'Plateformes',     v: `${platforms.length} actives`, c:'text-blue-400' },
          ].map(k => (
            <div key={k.l} className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
              <div className={`text-sm font-black ${k.c}`}>{k.v}</div>
              <div className="text-[8px] text-slate-500 mt-0.5 leading-tight">{k.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-2 pb-8">

        {/* Identité */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-800/60">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Identité officielle</span>
          </div>
          <div className="px-4 py-1">
            <InfoRow label="Nom complet"         value={fullName} />
            <InfoRow label="No. chauffeur"        value={profile?.driver_number ?? '—'} mono />
            <InfoRow label="Province"             value={profile?.province ?? '—'} />
            <InfoRow label="Langue"               value={profile?.language ?? '—'} />
            <InfoRow label="Vérification identité" value={profile?.identity_verification_status ?? '—'} />
            <InfoRow label="Statut profil"        value={profile?.status ?? '—'} />
            <InfoRow label="Membre depuis"        value={profile?.onboarding_completed_at ? new Date(profile.onboarding_completed_at).toLocaleDateString('fr-CA') : '—'} />
          </div>
        </div>

        {/* Véhicule */}
        {vehicle && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-800/60 flex items-center gap-2">
              <Car size={12} className="text-qc-blue" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Mon véhicule</span>
            </div>
            <div className="px-4 py-1">
              <InfoRow label="Véhicule"   value={`${vehicle['year']} ${vehicle['make']} ${vehicle['model']}`} />
              <InfoRow label="Plaque"     value={vehicle['license_plate_masked'] ?? '—'} mono />
              <InfoRow label="Type"       value={vehicle['vehicle_type'] ?? '—'} />
              <InfoRow label="Taximètre"  value={vehicle['taximeter_status'] ?? '—'} />
              <InfoRow label="Statut"     value={vehicle['vehicle_status'] ?? '—'} />
            </div>
          </div>
        )}

        {/* Compte fiscal */}
        {taxAcc && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-800/60 flex items-center gap-2">
              <Wallet size={12} className="text-qc-blue" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Compte fiscal</span>
            </div>
            <div className="px-4 py-1">
              <InfoRow label="TPS" value={`${taxAcc['tps_registration_masked'] ?? '—'} · ${taxAcc['tps_status'] ?? '—'}`} />
              <InfoRow label="TVQ" value={`${taxAcc['tvq_registration_masked'] ?? '—'} · ${taxAcc['tvq_status'] ?? '—'}`} />
              <InfoRow label="Fréquence" value={taxAcc['filing_frequency'] ?? '—'} />
            </div>
          </div>
        )}

        {/* Navigation rapide */}
        <div className="pt-2">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Mon espace</p>
          <div className="space-y-2">
            <MenuLink href="/documents"     icon={FileText}  label="Mes documents"           sub="Permis, assurance, inspection" />
            <MenuLink href="/vehicle"       icon={Car}       label="Mon véhicule"             sub="Immatriculation, taximètre" />
            <MenuLink href="/tax"           icon={Shield}    label="Fiscalité & Déclarations" sub="TPS · TVQ · Québec" />
            <MenuLink href="/platforms"     icon={Settings}  label="Mes plateformes"          sub={`${platforms.length} connectée(s)`} />
            <MenuLink href="/notifications" icon={Bell}      label="Notifications"             />
          </div>
        </div>

        {/* Déconnexion */}
        <button onClick={() => void logout()} disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm mt-2 hover:bg-red-500/15 transition-all">
          {loggingOut ? <RefreshCw size={14} className="animate-spin" /> : <LogOut size={14} />}
          {loggingOut ? 'Déconnexion…' : 'Se déconnecter'}
        </button>

        <p className="text-[9px] text-slate-600 text-center">
          TAXIMETER.GOV · Mode pilote · {profile?.driver_number ?? ''}
        </p>
      </div>
    </AppShell>
  )
}
