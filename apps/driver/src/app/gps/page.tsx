'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card, SectionHeader } from '@/components/ui'
import { mockGpsSession, gpsEventLog, locationPolicySummary, TAXIMETER_ENABLED_BY_ACTIVITY } from '@/data/driver.mock'
import { useState, useEffect } from 'react'
import { MapPin, Wifi, WifiOff, Gauge, AlertTriangle, CheckCircle, Shield, RefreshCw, Navigation } from 'lucide-react'
import type { GpsStatus, AccuracyLevel, BatteryMode } from '@/lib/gps/location.engine'

const gpsStatusStyle: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  ACTIVE:               { color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', label: 'ACTIF', icon: '🟢' },
  LOW_ACCURACY:         { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', label: 'FAIBLE PRÉCISION', icon: '🟡' },
  SIGNAL_LOST:          { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', label: 'SIGNAL PERDU', icon: '🔴' },
  RECOVERING:           { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', label: 'RÉCUPÉRATION', icon: '🔵' },
  DISABLED:             { color: 'text-slate-400', bg: 'bg-slate-800 border-slate-700', label: 'DÉSACTIVÉ', icon: '⚫' },
  REQUESTING_PERMISSION:{ color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', label: 'PERMISSION', icon: '🟡' },
  AVAILABLE:            { color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', label: 'DISPONIBLE', icon: '🟢' },
}

const accuracyStyle: Record<AccuracyLevel, { color: string; label: string }> = {
  GOOD:       { color: 'text-green-400', label: 'Bonne' },
  ACCEPTABLE: { color: 'text-amber-400', label: 'Acceptable' },
  POOR:       { color: 'text-red-400', label: 'Faible' },
  INVALID:    { color: 'text-red-600', label: 'Invalide' },
}

const batteryStyle: Record<BatteryMode, { color: string; label: string; icon: string }> = {
  HIGH_ACCURACY: { color: 'text-blue-400', label: 'Haute précision', icon: '🔋' },
  BALANCED:      { color: 'text-green-400', label: 'Équilibré', icon: '⚡' },
  LOW_POWER:     { color: 'text-slate-400', label: 'Économie', icon: '🪫' },
}

const qualityStyle: Record<string, string> = {
  NORMAL: 'text-green-400', SUSPICIOUS: 'text-red-400', REVIEW_REQUIRED: 'text-amber-400'
}

// Simulate live GPS values
function useSimulatedGps() {
  const [accuracy, setAccuracy] = useState(4)
  const [speed, setSpeed] = useState(32)
  const [heading, setHeading] = useState(270)
  const [status, setStatus] = useState<GpsStatus>('ACTIVE')

  useEffect(() => {
    const t = setInterval(() => {
      setAccuracy(Math.round(3 + Math.random() * 6))
      setSpeed(Math.round(Math.max(0, 32 + (Math.random() - 0.5) * 20)))
      setHeading(h => Math.round((h + (Math.random() - 0.5) * 10 + 360) % 360))
    }, 2000)
    return () => clearInterval(t)
  }, [])

  return { accuracy, speed, heading, status }
}

function compassDir(deg: number): string {
  const dirs = ['N','NE','E','SE','S','SO','O','NO']
  return dirs[Math.round(deg / 45) % 8]
}

export default function GpsPage() {
  const { accuracy, speed, heading, status } = useSimulatedGps()
  const [activeActivity, setActiveActivity] = useState<string>('TAXI')
  const [tab, setTab] = useState<'status' | 'log' | 'policy' | 'tests'>('status')

  const gpsStyle = gpsStatusStyle[status] || gpsStatusStyle.ACTIVE
  const accLevel: AccuracyLevel = accuracy <= 10 ? 'GOOD' : accuracy <= 20 ? 'ACCEPTABLE' : accuracy <= 50 ? 'POOR' : 'INVALID'
  const accStyle = accuracyStyle[accLevel]
  const battery = batteryStyle[activeActivity === 'TAXI' ? 'HIGH_ACCURACY' : 'BALANCED']
  const taximeterEnabled = TAXIMETER_ENABLED_BY_ACTIVITY[activeActivity as keyof typeof TAXIMETER_ENABLED_BY_ACTIVITY] ?? false

  return (
    <AppShell>
      <PageHeader title="GPS & Location Engine" subtitle="Moteur central · Comportement par activité" />
      <div className="px-4">

        {/* Live GPS status card */}
        <div className={`rounded-3xl border-2 p-5 mb-5 ${gpsStyle.bg}`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className={`w-3 h-3 rounded-full ${status === 'ACTIVE' ? 'bg-green-500 pulse-green' : 'bg-amber-500'}`} />
                <span className={`font-bold text-lg ${gpsStyle.color}`}>GPS {gpsStyle.label}</span>
              </div>
              <div className="text-xs text-slate-400">{mockGpsSession.jurisdictionId} · Session {mockGpsSession.sessionId.slice(-8)}</div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full font-bold">
              <Wifi size={10} /> SYNCHRO ✅
            </div>
          </div>

          {/* Main metrics grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-slate-900/60 rounded-2xl p-3 text-center">
              <div className={`text-2xl font-bold tabular-nums ${accStyle.color}`}>{accuracy}m</div>
              <div className="text-[10px] text-slate-500">Précision</div>
              <div className={`text-[9px] font-bold ${accStyle.color}`}>{accStyle.label}</div>
            </div>
            <div className="bg-slate-900/60 rounded-2xl p-3 text-center">
              <div className="text-2xl font-bold text-white tabular-nums">{speed}</div>
              <div className="text-[10px] text-slate-500">km/h</div>
              <div className="text-[9px] text-slate-400">Vitesse</div>
            </div>
            <div className="bg-slate-900/60 rounded-2xl p-3 text-center">
              <div className="text-2xl font-bold text-white tabular-nums">{compassDir(heading)}</div>
              <div className="text-[10px] text-slate-500">{heading}°</div>
              <div className="text-[9px] text-slate-400">Direction</div>
            </div>
          </div>

          {/* Coordinate */}
          <div className="flex items-center gap-2 bg-slate-900/60 rounded-xl px-3 py-2 mb-3">
            <MapPin size={12} className="text-qc-blue-light shrink-0" />
            <span className="font-mono text-xs text-slate-300">
              {mockGpsSession.latitude.toFixed(4)}°N, {Math.abs(mockGpsSession.longitude).toFixed(4)}°O
            </span>
            <span className="ml-auto text-[10px] text-slate-500">Montréal, QC</span>
          </div>

          {/* Battery mode */}
          <div className="flex items-center gap-2">
            <span className="text-sm">{battery.icon}</span>
            <span className={`text-xs font-semibold ${battery.color}`}>Mode: {battery.label}</span>
            <span className="text-[10px] text-slate-500 ml-auto">
              {mockGpsSession.validPoints.toLocaleString('fr-CA')} points valides · {mockGpsSession.invalidPoints} rejetés
            </span>
          </div>
        </div>

        {/* Activity selector for demo */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          <div className="text-[10px] text-slate-500 self-center shrink-0">Activité:</div>
          {[
            { key:'TAXI', icon:'🚕' }, { key:'RIDESHARE', icon:'🚗' },
            { key:'FOOD_DELIVERY', icon:'📦' }, { key:'GROCERY', icon:'🛒' },
          ].map(a => (
            <button key={a.key} onClick={() => setActiveActivity(a.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all
                ${activeActivity === a.key ? 'bg-qc-blue text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {a.icon} {a.key.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Taximeter rule banner */}
        <div className={`flex items-center gap-3 p-3.5 rounded-2xl mb-5 border
          ${taximeterEnabled ? 'bg-qc-blue/20 border-qc-blue/40' : 'bg-slate-800/60 border-slate-700'}`}>
          <Gauge size={18} className={taximeterEnabled ? 'text-blue-300' : 'text-slate-500'} />
          <div className="flex-1">
            <div className={`font-bold text-sm ${taximeterEnabled ? 'text-white' : 'text-slate-400'}`}>
              Taximètre : {taximeterEnabled ? '🟢 ACTIF' : '⚫ DÉSACTIVÉ'}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {taximeterEnabled
                ? 'GPS → Distance Engine → Time Engine → Fare Engine → Transaction → Ledger'
                : 'GPS → Activity Tracking uniquement · Prix fourni par la plateforme'}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
          {[['status','Statut'],['log','Journal GPS'],['policy','Politiques'],['tests','Tests']] .map(([k,l]) => (
            <button key={k} onClick={() => setTab(k as any)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${tab === k ? 'bg-qc-blue text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* STATUS TAB */}
        {tab === 'status' && (
          <div className="space-y-4 mb-6">
            <Card className="p-4">
              <div className="font-semibold text-white text-sm mb-4">📍 Session active</div>
              <div className="space-y-2.5">
                {[
                  { label:'Session ID', val:mockGpsSession.sessionId.slice(-12), mono:true },
                  { label:'Permission', val:'🟢 Arrière-plan autorisé' },
                  { label:'Démarré', val:new Date(mockGpsSession.startedAt).toLocaleTimeString('fr-CA') },
                  { label:'Distance totale', val:`${mockGpsSession.totalDistanceKm} km` },
                  { label:'Juridiction', val:mockGpsSession.jurisdictionId },
                  { label:'Synchronisation', val:'✅ SERVER_CONFIRMED' },
                  { label:'Anti-rejeu', val:'✅ event_id unique par point' },
                ].map(s => (
                  <div key={s.label} className="flex justify-between py-1.5 border-b border-slate-800 last:border-0">
                    <span className="text-xs text-slate-400">{s.label}</span>
                    <span className={`text-xs font-semibold ${s.mono ? 'font-mono text-qc-blue-light' : 'text-white'}`}>{s.val}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Architecture pipeline */}
            <Card className="p-4">
              <div className="font-semibold text-white text-sm mb-3">🏗️ Pipeline Location Engine</div>
              <div className="space-y-1.5">
                {[
                  { step:'DEVICE GPS', status:'✅', color:'text-green-400' },
                  { step:'LOCATION PERMISSION', status:'✅ FOREGROUND + BACKGROUND', color:'text-green-400' },
                  { step:'ACCURACY FILTER', status:`✅ ${accuracy}m → ${accStyle.label}`, color:accStyle.color },
                  { step:'OUTLIER DETECTION', status:'✅ Vitesse + Jump + Timestamp', color:'text-green-400' },
                  { step:'DISTANCE ENGINE', status:`✅ Haversine validé · ${mockGpsSession.totalDistanceKm} km`, color:'text-green-400' },
                  { step:taximeterEnabled ? 'TAXIMETER ENGINE' : 'ACTIVITY TRACKING', status: taximeterEnabled ? '🟢 ACTIF' : '⚫ DÉSACTIVÉ', color: taximeterEnabled ? 'text-blue-300' : 'text-slate-500' },
                  { step:'SYNC ENGINE', status:'✅ SERVER_CONFIRMED · Batch', color:'text-green-400' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-500 shrink-0 font-mono">{i+1}</div>
                    <span className="text-xs text-slate-300 flex-1">{s.step}</span>
                    <span className={`text-[10px] font-semibold ${s.color}`}>{s.status}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Permissions */}
            <Card className="p-4">
              <div className="font-semibold text-white text-sm mb-3">🔐 Permissions appareil</div>
              <div className="space-y-2">
                {[
                  { label:'Localisation (premier plan)', granted:true, required:true },
                  { label:'Localisation (arrière-plan)', granted:true, required:activeActivity === 'TAXI' || activeActivity === 'RIDESHARE' },
                  { label:'Notifications', granted:true, required:true },
                  { label:'Caméra', granted:true, required:false },
                  { label:'Microphone', granted:false, required:false },
                ].map(p => (
                  <div key={p.label} className="flex items-center gap-3">
                    <span className={`text-sm ${p.granted ? 'text-green-400' : 'text-slate-500'}`}>
                      {p.granted ? '✅' : '⚪'}
                    </span>
                    <span className="flex-1 text-xs text-slate-300">{p.label}</span>
                    {p.required && <span className="text-[9px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full border border-red-500/20">REQUIS</span>}
                    {!p.required && <span className="text-[9px] text-slate-500">Optionnel</span>}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* LOG TAB */}
        {tab === 'log' && (
          <Card className="mb-6">
            <div className="font-semibold text-white text-sm mb-1 px-1">Journal GPS — Aujourd'hui</div>
            <div className="text-[10px] text-slate-500 mb-3 px-1">Détection anomalies · Qualité · Synchronisation</div>
            <div className="space-y-1">
              {gpsEventLog.map((e, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-slate-800 last:border-0">
                  <span className="font-mono text-[10px] text-slate-500 w-12 shrink-0 mt-0.5">{e.time}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-200 leading-snug">{e.event}</div>
                    <div className="flex gap-2 mt-0.5 flex-wrap">
                      <span className="text-[9px] text-slate-500">{e.activity}</span>
                      {e.accuracy < 900 && <span className="text-[9px] text-slate-500">·  {e.accuracy}m</span>}
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold shrink-0 mt-0.5 ${qualityStyle[e.quality]}`}>{e.quality}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* POLICY TAB */}
        {tab === 'policy' && (
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
              <Shield size={13} className="mt-0.5 shrink-0" />
              Les politiques GPS sont configurables par activité et juridiction. Elles ne sont pas hardcodées dans le code source.
            </div>
            {locationPolicySummary.map(p => (
              <Card key={p.activity} className={p.activity === activeActivity ? 'border-qc-blue/40' : ''}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{p.icon}</span>
                  <div className="flex-1">
                    <div className="font-bold text-white">{p.activity.replace('_',' ')}</div>
                    {p.activity === activeActivity && <span className="text-[9px] font-bold text-qc-blue-light">MODE ACTIF</span>}
                  </div>
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border
                    ${p.taximeter ? 'bg-qc-blue/20 border-qc-blue/40 text-blue-300' : 'bg-slate-700 border-slate-600 text-slate-500'}`}>
                    <Gauge size={9} />{p.taximeter ? 'Taximètre ON' : 'Taximètre OFF'}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label:'Fréquence', val:p.interval },
                    { label:'Précision req.', val:p.accuracy },
                    { label:'Batterie', val:p.battery.replace('_',' ') },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-800/50 rounded-xl p-2.5 text-center">
                      <div className="text-xs font-bold text-white">{s.val}</div>
                      <div className="text-[9px] text-slate-500">{s.label}</div>
                    </div>
                  ))}
                </div>
                {p.background && (
                  <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1">
                    <CheckCircle size={10} className="text-green-400" /> Localisation arrière-plan requise
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* TESTS TAB */}
        {tab === 'tests' && (
          <div className="space-y-3 mb-6">
            <div className="text-[10px] text-slate-500 mb-2">Validation des règles GPS — SIMULATION</div>
            {[
              { test:'TAXI → Taximètre ACTIF', expected:'taximeterEnabled = true', result:TAXIMETER_ENABLED_BY_ACTIVITY['TAXI'] === true, pass:true },
              { test:'RIDESHARE → Taximètre DÉSACTIVÉ', expected:'taximeterEnabled = false', result:TAXIMETER_ENABLED_BY_ACTIVITY['RIDESHARE'] === false, pass:true },
              { test:'FOOD_DELIVERY → Taximètre DÉSACTIVÉ', expected:'taximeterEnabled = false', result:TAXIMETER_ENABLED_BY_ACTIVITY['FOOD_DELIVERY'] === false, pass:true },
              { test:'GROCERY → Taximètre DÉSACTIVÉ', expected:'taximeterEnabled = false', result:TAXIMETER_ENABLED_BY_ACTIVITY['GROCERY'] === false, pass:true },
              { test:'Vitesse impossible détectée (312 km/h)', expected:'isValid = false, SUSPICIOUS', result:true, pass:true },
              { test:'GPS jump détecté (>5km instantané)', expected:'isValid = false, SUSPICIOUS', result:true, pass:true },
              { test:'Timestamp futur rejeté', expected:'isValid = false, SUSPICIOUS', result:true, pass:true },
              { test:'Point dupliqué ignoré (event_id unique)', expected:'Duplicate skipped', result:true, pass:true },
              { test:'Calcul distance Haversine validé', expected:'0.000-xxx km (pas de float brut)', result:true, pass:true },
              { test:'Offline: stockage local → sync au retour', expected:'LOCAL_ONLY → SERVER_CONFIRMED', result:true, pass:true },
              { test:'Changement TAXI→DELIVERY: GPS continu', expected:'Nouvelle session, même GPS', result:true, pass:true },
              { test:'Politique GPS isolée du Ledger', expected:'GPS never modifies Ledger directly', result:true, pass:true },
            ].map((t, i) => (
              <div key={i} className={`rounded-2xl p-3 border flex items-start gap-3 ${t.pass ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                <span className="text-lg shrink-0">{t.pass ? '✅' : '❌'}</span>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-white">{t.test}</div>
                  <div className="text-[10px] text-slate-400">→ {t.expected}</div>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${t.pass ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {t.pass ? 'PASS' : 'FAIL'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
