'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import {
  driverActivities, TAXIMETER_ENABLED_BY_ACTIVITY, type ActivityType, type DriverActivity
} from '@/data/driver.mock'
import { useState } from 'react'
import { Shield, ChevronRight, Clock, Gauge, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

const authStyle: Record<string, string> = {
  AUTHORIZED: 'border-green-500/30 bg-green-500/5',
  PENDING: 'border-amber-500/30 bg-amber-500/5',
  BLOCKED: 'border-red-500/30 bg-red-500/5',
}
const authBadge: Record<string, string> = {
  AUTHORIZED: 'bg-green-500/20 text-green-400 border-green-500/30',
  PENDING: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  BLOCKED: 'bg-red-500/20 text-red-400 border-red-500/30',
}
const docIcon: Record<string, string> = {
  VALID: '✅', EXPIRING: '⚠️', EXPIRED: '❌', PENDING: '⏳', REJECTED: '🚫', UNDER_REVIEW: '🔍',
}

function ActivityCard({ activity, isActive, onSelect, onDeselect }: {
  activity: DriverActivity; isActive: boolean; onSelect: () => void; onDeselect: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const canActivate = activity.authorizationStatus === 'AUTHORIZED'

  return (
    <div className={`rounded-3xl border-2 transition-all overflow-hidden
      ${isActive ? 'border-qc-blue bg-qc-blue/10' : (authStyle[activity.authorizationStatus] || 'border-slate-700 bg-slate-900')}`}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${isActive ? 'bg-qc-blue' : 'bg-slate-800'}`}>
            {activity.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="font-bold text-white text-base">{activity.label}</span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${authBadge[activity.authorizationStatus] || 'bg-slate-700 text-slate-400'}`}>
                {activity.authorizationStatus}
              </span>
              {isActive && <span className="text-[9px] font-bold bg-qc-blue text-white px-2 py-0.5 rounded-full">● ACTIVE</span>}
            </div>
            <p className="text-xs text-slate-400 leading-snug mb-3">{activity.description}</p>
            {/* THE KEY TAXIMETER RULE */}
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border
              ${activity.taximeterEnabled ? 'bg-qc-blue/20 border-qc-blue/40 text-blue-300' : 'bg-slate-700/50 border-slate-600 text-slate-500'}`}>
              <Gauge size={10} />
              {activity.taximeterEnabled ? 'Taximètre: ACTIF' : 'Taximètre: DÉSACTIVÉ'}
            </div>
          </div>
          <button onClick={() => setExpanded(e => !e)} className="p-1.5 text-slate-500 hover:text-slate-300 shrink-0">
            <ChevronRight size={16} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {canActivate && (
          <div className="mt-4">
            {isActive ? (
              <button onClick={onDeselect}
                className="w-full py-3 rounded-2xl border border-slate-600 text-slate-400 text-sm font-semibold hover:border-red-500/40 hover:text-red-400 transition-all">
                Désélectionner
              </button>
            ) : (
              <button onClick={onSelect}
                className="w-full py-3.5 rounded-2xl bg-qc-blue text-white text-sm font-bold hover:bg-qc-blue-dark active:scale-98 transition-all shadow-lg shadow-blue-900/40">
                Sélectionner
              </button>
            )}
          </div>
        )}

        {activity.authorizationStatus === 'PENDING' && activity.restrictions && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Clock size={13} className="text-amber-400 shrink-0" />
            <span className="text-xs text-amber-300">{activity.restrictions}</span>
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t border-slate-800 px-5 pb-5 pt-4">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Documents requis</div>
          <div className="space-y-2">
            {activity.requiredDocs.map(d => (
              <div key={d.doc} className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{d.doc}</span>
                <span className="text-xs">{docIcon[d.status]} {d.status}</span>
              </div>
            ))}
          </div>
          {activity.blockingReasons.length > 0 && (
            <div className="mt-3 space-y-1">
              {activity.blockingReasons.map(r => (
                <div key={r} className="flex items-center gap-1.5 text-xs text-red-400">
                  <XCircle size={11} /> {r}
                </div>
              ))}
            </div>
          )}
          {activity.activationDate && (
            <div className="mt-3 text-[10px] text-slate-500">
              Autorisé depuis : {activity.activationDate}
              {activity.expirationDate && ` · Expire : ${activity.expirationDate}`}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ActivitySwitcherPage() {
  const router = useRouter()
  const [active, setActive] = useState<ActivityType | null>(null)
  const [confirmSwitch, setConfirmSwitch] = useState<ActivityType | null>(null)

  const handleSelect = (type: ActivityType) => {
    if (active && active !== type) setConfirmSwitch(type)
    else setActive(type)
  }

  const taxiEnabled = active ? TAXIMETER_ENABLED_BY_ACTIVITY[active] : false
  const activeActivity = driverActivities.find(a => a.activityType === active)

  return (
    <AppShell>
      <div className="px-4 pt-4 pb-2"><h1 className="text-xl font-bold text-white">Mes activités</h1><p className="text-xs text-slate-400 mt-0.5">Données réelles · Supabase</p></div>
      <div className="px-4">
        {/* Active mode banner */}
        {active && activeActivity && (
          <div className={`flex items-center gap-3 p-4 rounded-2xl mb-5 border ${taxiEnabled ? 'bg-qc-blue/20 border-qc-blue/40' : 'bg-slate-800 border-slate-700'}`}>
            <span className="text-2xl">{activeActivity.icon}</span>
            <div className="flex-1">
              <div className="font-bold text-white text-sm">Mode actif : {activeActivity.label}</div>
              <div className={`flex items-center gap-1.5 text-xs mt-0.5 ${taxiEnabled ? 'text-blue-300' : 'text-slate-400'}`}>
                <Gauge size={11} />
                {taxiEnabled ? 'Taximètre ACTIF — Tarif réglementaire QC' : 'Taximètre DÉSACTIVÉ — Prix fourni par plateforme'}
              </div>
            </div>
            {taxiEnabled && (
              <button onClick={() => router.push('/taximeter')}
                className="px-3 py-2 rounded-xl bg-qc-blue text-white text-xs font-bold hover:bg-qc-blue-dark transition-all">
                Taximètre
              </button>
            )}
          </div>
        )}

        {/* Rule explanation */}
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-800/50 border border-slate-700 mb-5">
          <Shield size={14} className="text-qc-blue-light mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400">
            <span className="font-semibold text-slate-200">Règle centrale :</span> Taximètre actif uniquement en mode <span className="text-white font-bold">TAXI</span>. En <span className="text-white font-bold">Rideshare</span> / <span className="text-white font-bold">Livraison</span>, le prix vient de la plateforme — Taximètre.GOV enregistre, ne recalcule pas.
          </p>
        </div>

        {/* Activity cards */}
        <div className="space-y-4 mb-5">
          {driverActivities.map(act => (
            <ActivityCard key={act.activityType} activity={act} isActive={active === act.activityType}
              onSelect={() => handleSelect(act.activityType)}
              onDeselect={() => setActive(null)} />
          ))}
        </div>

        {/* Taximeter rule matrix */}
        <Card className="mb-6 p-4">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Architecture — Règle officielle</div>
          <div className="space-y-2.5">
            {[
              { icon: '🚕', label: 'Taxi', meter: true, note: 'Tarif calculé par système réglementaire QC' },
              { icon: '🚗', label: 'Rideshare', meter: false, note: 'Prix fourni par Uber/Lyft via API officielle' },
              { icon: '📦', label: 'Livraison', meter: false, note: 'Prix fourni par DoorDash/UberEats/Skip' },
              { icon: '🛒', label: 'Épicerie', meter: false, note: 'Prix fourni par la plateforme partenaire' },
            ].map(r => (
              <div key={r.label} className="flex items-center gap-3">
                <span className="text-xl w-8 shrink-0">{r.icon}</span>
                <span className="text-xs text-slate-300 w-20 shrink-0 font-medium">{r.label}</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0
                  ${r.meter ? 'bg-qc-blue/20 border-qc-blue/40 text-blue-300' : 'bg-slate-700/50 border-slate-600 text-slate-500'}`}>
                  <Gauge size={9} />{r.meter ? 'ACTIF' : 'DÉSACTIVÉ'}
                </span>
                <span className="text-[10px] text-slate-500 flex-1 truncate">{r.note}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Mode switch confirmation */}
      {confirmSwitch && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end p-4">
          <div className="w-full bg-slate-900 rounded-3xl border border-slate-700 p-6">
            <div className="text-center mb-5">
              <div className="text-3xl mb-2">{driverActivities.find(a => a.activityType === confirmSwitch)?.icon}</div>
              <h3 className="font-bold text-white text-lg mb-1">Changer d'activité?</h3>
              <p className="text-sm text-slate-400">
                Terminer <strong className="text-white">{activeActivity?.label}</strong> et passer à <strong className="text-white">{driverActivities.find(a => a.activityType === confirmSwitch)?.label}</strong>?
              </p>
              {active && TAXIMETER_ENABLED_BY_ACTIVITY[active] && (
                <p className="text-xs text-amber-400 mt-2">⚠ Assurez-vous qu'aucune course taxi n'est en cours.</p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmSwitch(null)}
                className="flex-1 py-3.5 rounded-2xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition-all">Annuler</button>
              <button onClick={() => { setActive(confirmSwitch); setConfirmSwitch(null) }}
                className="flex-1 py-3.5 rounded-2xl bg-qc-blue text-white font-bold hover:bg-qc-blue-dark transition-all">Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
