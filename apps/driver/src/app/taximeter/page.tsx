'use client'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import {
  TAXIMETER_BY_SERVICE, ACTIVE_TARIFF, calculateTariffFare,
  runPreRideValidation, mockDevice, mockPreRideCheck,
  mockCompletedSession, mockEvents, mockGPSSamples,
  classifyGPSQuality, generateTripId, fmt,
  type ServiceMode, type TaximeterState, type TaximeterEvent
} from '@/lib/engines/smart-taximeter.engine'
import { useState, useEffect, useRef } from 'react'
import { Shield, AlertCircle, CheckCircle, Lock, Zap, MapPin, Clock, Gauge, Navigation } from 'lucide-react'

// ─── SERVICE CONFIG ───────────────────────────────────────────
const SERVICE_CONF: Record<ServiceMode, { icon: string; label: string; color: string; bg: string }> = {
  TAXI:      { icon:'🚕', label:'Taxi',      color:'text-qc-blue-light', bg:'bg-qc-blue/20' },
  RIDESHARE: { icon:'🚗', label:'Rideshare', color:'text-slate-300',     bg:'bg-slate-700' },
  DELIVERY:  { icon:'📦', label:'Livraison', color:'text-red-400',       bg:'bg-red-500/10' },
  PERSONAL:  { icon:'🏠', label:'Personnel', color:'text-slate-500',     bg:'bg-slate-800' },
}

const STATE_CONF: Record<TaximeterState, { label: string; color: string; dot: string }> = {
  OFF:       { label:'Éteint',         color:'text-slate-500',  dot:'bg-slate-600' },
  READY:     { label:'Prêt',           color:'text-blue-400',   dot:'bg-blue-500 animate-pulse' },
  AVAILABLE: { label:'Disponible',     color:'text-green-400',  dot:'bg-green-500 animate-pulse' },
  HIRED:     { label:'Pris en charge', color:'text-amber-400',  dot:'bg-amber-500' },
  RUNNING:   { label:'En course',      color:'text-green-400',  dot:'bg-green-500' },
  PAUSED:    { label:'En pause',       color:'text-amber-400',  dot:'bg-amber-500 animate-pulse' },
  COMPLETED: { label:'Terminé',        color:'text-blue-400',   dot:'bg-blue-500' },
  CANCELLED: { label:'Annulé',         color:'text-red-400',    dot:'bg-red-500' },
  ERROR:     { label:'Erreur',         color:'text-red-400',    dot:'bg-red-500 animate-pulse' },
  LOCKED:    { label:'Verrouillé',     color:'text-red-400',    dot:'bg-red-600' },
}

export default function TaxiPage() {
  const [serviceMode, setServiceMode] = useState<ServiceMode>('TAXI')
  const [state, setState] = useState<TaximeterState>('AVAILABLE')
  const [tab, setTab] = useState<'meter' | 'preride' | 'tariff' | 'session' | 'events'>('meter')
  const [distanceKm, setDistanceKm] = useState(0)
  const [durationSec, setDurationSec] = useState(0)
  const [waitingSec, setWaitingSec] = useState(0)
  const [isWaiting, setIsWaiting] = useState(false)
  const [tipPct, setTipPct] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'CARD'|'CASH'|'INTERAC'>('CARD')
  const [showConfirmStart, setShowConfirmStart] = useState(false)
  const [showConfirmStop, setShowConfirmStop] = useState(false)
  const [tripId] = useState(generateTripId)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const taximeterOn = TAXIMETER_BY_SERVICE[serviceMode]
  const validation = runPreRideValidation(mockPreRideCheck)

  // Live timer when RUNNING
  useEffect(() => {
    if (state === 'RUNNING') {
      timerRef.current = setInterval(() => {
        setDurationSec(d => d + 1)
        if (!isWaiting) setDistanceKm(d => Math.round((d + 0.003) * 1000) / 1000)
        else setWaitingSec(w => w + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [state, isWaiting])

  const fare = calculateTariffFare(ACTIVE_TARIFF, distanceKm, durationSec, waitingSec)
  const tpsAmt = Math.round(fare.finalFare * 0.05 * 100) / 100
  const tvqAmt = Math.round(fare.finalFare * 0.09975 * 100) / 100
  const tipAmt = Math.round(fare.finalFare * tipPct / 100 * 100) / 100
  const totalAmt = Math.round((fare.finalFare + tpsAmt + tvqAmt + tipAmt) * 100) / 100

  const handleStart = () => {
    setState('RUNNING')
    setShowConfirmStart(false)
    setDistanceKm(0); setDurationSec(0); setWaitingSec(0)
  }
  const handleStop = () => {
    setState('COMPLETED')
    setShowConfirmStop(false)
  }
  const handleReset = () => {
    setState('AVAILABLE')
    setDistanceKm(0); setDurationSec(0); setWaitingSec(0)
    setTipPct(0); setIsWaiting(false)
  }

  const formatTime = (sec: number) => `${Math.floor(sec/60).toString().padStart(2,'0')}:${(sec%60).toString().padStart(2,'0')}`

  // GPS quality simulation
  const gpsAccuracy = 8
  const gpsQuality = classifyGPSQuality(gpsAccuracy)
  const gpsColor = gpsQuality === 'EXCELLENT' ? 'text-green-400' : gpsQuality === 'GOOD' ? 'text-blue-400' : gpsQuality === 'FAIR' ? 'text-amber-400' : 'text-red-400'

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Tabs bar */}
      <div className="flex gap-1 px-3 pt-3 pb-2 overflow-x-auto border-b border-slate-800 bg-slate-950 sticky top-0 z-10">
        {[['meter','⚙️ Compteur'],['preride','✅ Pré-course'],['tariff','📋 Tarif'],['session','📊 Session'],['events','📝 Événements']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k as any)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${tab===k?'bg-qc-blue text-white':'bg-slate-800 text-slate-400'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4 pb-32">

        {/* ─── METER TAB ─────────────────────────────────── */}
        {tab === 'meter' && (
          <div>
            {/* Pilot notice */}
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-5 text-xs text-amber-200">
              <AlertCircle size={13} className="mt-0.5 shrink-0"/>
              SIMULATION PILOTE — Taximètre.GOV n'est pas officiellement homologué. Certification réglementaire requise avant déploiement commercial.
            </div>

            {/* Service selector */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {(Object.keys(SERVICE_CONF) as ServiceMode[]).map(mode => {
                const conf = SERVICE_CONF[mode]
                const active = serviceMode === mode
                const txEnabled = TAXIMETER_BY_SERVICE[mode]
                return (
                  <button key={mode} onClick={() => { if (state !== 'RUNNING') setServiceMode(mode) }}
                    disabled={state === 'RUNNING'}
                    className={`p-3 rounded-2xl text-center transition-all border ${active ? 'border-qc-blue/50 bg-qc-blue/10' : 'border-slate-800 bg-slate-900 hover:border-slate-700'} ${state === 'RUNNING' ? 'opacity-50' : ''}`}>
                    <div className="text-xl">{conf.icon}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">{conf.label}</div>
                    <div className={`text-[8px] font-bold mt-0.5 ${txEnabled ? 'text-qc-blue-light' : 'text-slate-600'}`}>
                      {txEnabled ? 'Txm ✓' : 'Txm ✗'}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Delivery blocked UI */}
            {serviceMode === 'DELIVERY' && (
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center mb-5">
                <div className="text-5xl mb-3">📦</div>
                <div className="font-bold text-white text-lg mb-1">Mode Livraison</div>
                <div className="flex items-center justify-center gap-2 text-red-400 font-bold mb-2">
                  <Lock size={16}/> Taximètre: DÉSACTIVÉ
                </div>
                <p className="text-xs text-slate-400">Le revenu provient du fournisseur (DoorDash / Instacart / Uber Eats / Skip). Le taximètre ne peut jamais être activé en mode livraison.</p>
              </div>
            )}

            {/* Rideshare provider note */}
            {serviceMode === 'RIDESHARE' && (
              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 text-center mb-5">
                <div className="text-3xl mb-2">🚗</div>
                <div className="font-bold text-white mb-1">Mode Rideshare</div>
                <p className="text-xs text-slate-400 mb-2">Le prix final est fourni par Uber/Lyft. Taximètre.GOV enregistre l'activité GPS, le kilométrage et le contexte — mais ne remplace jamais le tarif fournisseur.</p>
                <div className="text-[10px] text-slate-600">Prix fournisseur → Webhook → Ledger (jamais recalculé)</div>
              </div>
            )}

            {/* Main taximeter display */}
            {(serviceMode === 'TAXI' || serviceMode === 'PERSONAL') && (
              <div>
                {/* State indicator */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${STATE_CONF[state].dot}`} />
                    <span className={`font-bold text-sm ${STATE_CONF[state].color}`}>{STATE_CONF[state].label}</span>
                  </div>
                  <div className={`text-xs ${gpsColor} flex items-center gap-1`}>
                    <Navigation size={12}/> GPS {gpsQuality} ({gpsAccuracy}m)
                  </div>
                </div>

                {/* Big fare display */}
                <div className={`relative rounded-3xl border p-8 text-center mb-5 transition-all ${state === 'RUNNING' ? 'bg-qc-blue/10 border-qc-blue/40' : 'bg-slate-900 border-slate-800'}`}>
                  <div className="text-xs text-slate-500 mb-2 uppercase tracking-widest">
                    {state === 'RUNNING' ? '● COURSE EN COURS' : state === 'COMPLETED' ? '✓ COURSE TERMINÉE' : 'TAXIMÈTRE'}
                  </div>
                  <div className={`text-7xl font-black tabular-nums mb-4 transition-all ${state === 'RUNNING' ? 'text-white' : 'text-slate-500'}`}>
                    {state === 'RUNNING' || state === 'COMPLETED' ? fmt(fare.finalFare) : '$0.00'}
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-slate-900/60 rounded-2xl p-2">
                      <MapPin size={14} className="text-qc-blue-light mx-auto mb-1"/>
                      <div className="font-bold text-white tabular-nums">{distanceKm.toFixed(2)} km</div>
                      <div className="text-[9px] text-slate-500">Distance</div>
                    </div>
                    <div className="bg-slate-900/60 rounded-2xl p-2">
                      <Clock size={14} className="text-qc-blue-light mx-auto mb-1"/>
                      <div className="font-bold text-white tabular-nums">{formatTime(durationSec)}</div>
                      <div className="text-[9px] text-slate-500">Durée</div>
                    </div>
                    <div className="bg-slate-900/60 rounded-2xl p-2">
                      <Gauge size={14} className={`mx-auto mb-1 ${isWaiting ? 'text-amber-400' : 'text-slate-600'}`}/>
                      <div className={`font-bold tabular-nums ${isWaiting ? 'text-amber-400' : 'text-slate-600'}`}>{formatTime(waitingSec)}</div>
                      <div className="text-[9px] text-slate-500">Attente</div>
                    </div>
                  </div>
                  <div className="text-[9px] text-slate-600 mt-2">Tarif: {ACTIVE_TARIFF.version} · {ACTIVE_TARIFF.isPilot ? 'PILOTE' : 'Officiel'}</div>
                </div>

                {/* Fare breakdown (during/after) */}
                {(state === 'RUNNING' || state === 'COMPLETED') && (
                  <div className="grid grid-cols-4 gap-1.5 mb-4 text-[10px]">
                    {[
                      { label:'Base', val:fare.baseFare, color:'text-white' },
                      { label:'Distance', val:fare.distanceFare, color:'text-blue-400' },
                      { label:'Temps', val:fare.timeFare, color:'text-purple-400' },
                      { label:'Attente', val:fare.waitingFare, color:'text-amber-400' },
                    ].map(s => (
                      <div key={s.label} className="bg-slate-900 rounded-xl p-2 text-center border border-slate-800">
                        <div className={`font-bold tabular-nums ${s.color}`}>{fmt(s.val)}</div>
                        <div className="text-slate-600">{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Waiting toggle */}
                {state === 'RUNNING' && (
                  <button onClick={() => setIsWaiting(w => !w)}
                    className={`w-full py-3.5 rounded-2xl font-bold text-sm mb-3 transition-all border ${isWaiting ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'}`}>
                    {isWaiting ? '▶ Reprendre la course' : '⏸ Arrêt (Compteur attente)'}
                  </button>
                )}

                {/* Final fare summary */}
                {state === 'COMPLETED' && (
                  <div className="driver-card p-4 mb-4 space-y-2 border-green-500/20">
                    <div className="font-semibold text-white text-sm mb-2">Course terminée — {tripId}</div>
                    {[
                      { label:'Tarif', val:fmt(fare.finalFare), color:'text-white' },
                      { label:'TPS (5%)', val:fmt(tpsAmt), color:'text-blue-400' },
                      { label:'TVQ (9.975%)', val:fmt(tvqAmt), color:'text-purple-400' },
                    ].map(s => (
                      <div key={s.label} className="flex justify-between text-xs">
                        <span className="text-slate-400">{s.label}</span>
                        <span className={`font-bold ${s.color}`}>{s.val}</span>
                      </div>
                    ))}
                    {/* Tip selector */}
                    <div className="border-t border-slate-800 pt-2 mt-1">
                      <div className="text-[10px] text-slate-500 mb-2">Pourboire</div>
                      <div className="flex gap-2">
                        {[0,10,15,20].map(pct => (
                          <button key={pct} onClick={() => setTipPct(pct)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${tipPct===pct?'bg-green-600 text-white':'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                            {pct === 0 ? 'Non' : `${pct}%`}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="border-t border-slate-800 pt-2">
                      <div className="flex justify-between font-black text-lg">
                        <span className="text-white">TOTAL</span>
                        <span className="text-green-400 tabular-nums">{fmt(totalAmt)}</span>
                      </div>
                    </div>
                    {/* Payment method */}
                    <div className="flex gap-2 pt-1">
                      {(['CARD','CASH','INTERAC'] as const).map(m => (
                        <button key={m} onClick={() => setPaymentMethod(m)}
                          className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${paymentMethod===m?'bg-qc-blue text-white':'bg-slate-800 text-slate-400'}`}>
                          {m}
                        </button>
                      ))}
                    </div>
                    <button onClick={handleReset}
                      className="w-full py-3.5 rounded-2xl bg-green-600 text-white font-bold hover:bg-green-500 transition-all shadow-lg shadow-green-900/30">
                      ✓ Confirmer paiement {fmt(totalAmt)} · {paymentMethod}
                    </button>
                  </div>
                )}

                {/* Control buttons */}
                {state === 'AVAILABLE' && (
                  <button onClick={() => setShowConfirmStart(true)}
                    className="w-full py-5 rounded-3xl bg-qc-blue text-white font-black text-xl hover:bg-qc-blue-dark active:scale-98 transition-all shadow-2xl shadow-blue-900/50">
                    🚕 Commencer la course
                  </button>
                )}
                {state === 'RUNNING' && (
                  <button onClick={() => setShowConfirmStop(true)}
                    className="w-full py-5 rounded-3xl bg-red-600 text-white font-black text-xl hover:bg-red-500 transition-all shadow-2xl shadow-red-900/50">
                    ⬛ Terminer la course
                  </button>
                )}

                {/* Emergency button */}
                <button className="w-full py-3 rounded-2xl bg-red-900/30 border border-red-800/50 text-red-400 font-bold text-sm mt-3 flex items-center justify-center gap-2 hover:bg-red-900/40 transition-all">
                  🆘 SOS — Urgence
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── PRE-RIDE TAB ──────────────────────────────── */}
        {tab === 'preride' && (
          <div className="space-y-4 mb-6">
            <div className={`p-4 rounded-2xl border ${validation.canStart ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <div className="flex items-center gap-2 mb-1">
                {validation.canStart ? <CheckCircle size={18} className="text-green-400"/> : <AlertCircle size={18} className="text-red-400"/>}
                <span className={`font-bold ${validation.canStart ? 'text-green-400' : 'text-red-400'}`}>
                  {validation.canStart ? 'Prêt à démarrer' : `${validation.blockers.length} blocage(s) détecté(s)`}
                </span>
              </div>
            </div>

            <Card>
              <div className="font-semibold text-white text-sm mb-3">Validation pré-course</div>
              <div className="space-y-2">
                {[
                  { label:'Identité chauffeur', ok:mockPreRideCheck.driverVerified },
                  { label:'Véhicule vérifié', ok:mockPreRideCheck.vehicleVerified },
                  { label:'Permis taxi valide', ok:mockPreRideCheck.permitValid },
                  { label:'GPS disponible', ok:mockPreRideCheck.gpsAvailable },
                  { label:'Précision GPS acceptable', ok:mockPreRideCheck.gpsAcceptable },
                  { label:'Tarif disponible', ok:mockPreRideCheck.tariffAvailable },
                  { label:'Horloge valide', ok:mockPreRideCheck.deviceTimeValid },
                  { label:'Appareil fiable', ok:mockPreRideCheck.deviceTrusted },
                  { label:'Service autorisé', ok:mockPreRideCheck.serviceAuthorized },
                ].map(c => (
                  <div key={c.label} className="flex items-center gap-2 py-1.5 border-b border-slate-800 last:border-0">
                    {c.ok ? <CheckCircle size={14} className="text-green-400 shrink-0"/> : <AlertCircle size={14} className="text-red-400 shrink-0"/>}
                    <span className="text-xs text-slate-300 flex-1">{c.label}</span>
                    <span className={`text-xs font-bold ${c.ok ? 'text-green-400' : 'text-red-400'}`}>{c.ok ? 'OK' : 'FAIL'}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="font-semibold text-white text-sm mb-3">🔒 Appareil</div>
              {[
                { label:'Device ID', val:mockDevice.deviceId, mono:true },
                { label:'Plateforme', val:mockDevice.platform },
                { label:'Version app', val:mockDevice.appVersion },
                { label:'Statut sécurité', val:mockDevice.securityStatus, color:mockDevice.securityStatus==='TRUSTED'?'text-green-400':'text-red-400' },
                { label:'Root détecté', val:mockDevice.rootDetected ? '⚠ OUI' : '✅ Non' },
                { label:'Tampering', val:mockDevice.tamperingDetected ? '⚠ OUI' : '✅ Non' },
              ].map(s => (
                <div key={s.label} className="flex justify-between py-1.5 border-b border-slate-800 last:border-0 text-xs">
                  <span className="text-slate-400">{s.label}</span>
                  <span className={`font-medium ${'color' in s ? s.color : ''} ${'mono' in s ? 'font-mono text-qc-blue-light text-[10px]' : 'text-white'}`}>{s.val}</span>
                </div>
              ))}
              <div className="text-[9px] text-slate-500 mt-2">Détection best-effort — pas une garantie parfaite</div>
            </Card>
          </div>
        )}

        {/* ─── TARIFF TAB ────────────────────────────────── */}
        {tab === 'tariff' && (
          <div className="space-y-4 mb-6">
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <span className="font-semibold text-white text-sm">Tarif actif — {ACTIVE_TARIFF.version}</span>
                {ACTIVE_TARIFF.isPilot && <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-bold">PILOTE</span>}
              </div>
              <div className="space-y-2">
                {[
                  { label:'Juridiction', val:ACTIVE_TARIFF.jurisdiction },
                  { label:'En vigueur depuis', val:ACTIVE_TARIFF.effectiveFrom },
                  { label:'Source', val:ACTIVE_TARIFF.sourceRef },
                  { label:'Publié par', val:ACTIVE_TARIFF.publishedBy, mono:true },
                  { label:'Statut', val:ACTIVE_TARIFF.status, color:'text-green-400' },
                ].map(s => (
                  <div key={s.label} className="flex justify-between py-1.5 border-b border-slate-800 last:border-0 text-xs">
                    <span className="text-slate-400">{s.label}</span>
                    <span className={`${'color' in s ? s.color : 'text-white'} ${'mono' in s ? 'font-mono text-[10px] text-qc-blue-light' : ''}`}>{s.val}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="font-semibold text-white text-sm mb-3">Règles tarifaires (chargées depuis config gouvernementale)</div>
              <div className="space-y-2">
                {ACTIVE_TARIFF.rules.map(r => (
                  <div key={r.component} className="flex items-center justify-between py-1.5 border-b border-slate-800 last:border-0">
                    <div>
                      <div className="text-xs font-semibold text-white">{r.component}</div>
                      <div className="text-[10px] text-slate-500">{r.unit.replace(/_/g,' ')}</div>
                    </div>
                    <div className="font-mono font-black text-qc-blue-light">{fmt(r.value)}</div>
                  </div>
                ))}
                <div className="flex justify-between pt-1 text-xs">
                  <span className="text-slate-400">Tarif minimum</span>
                  <span className="font-mono font-bold text-white">{fmt(ACTIVE_TARIFF.minimumFare)}</span>
                </div>
              </div>
              <div className="text-[9px] text-amber-400 mt-3">Tarifs configurés par l'administration gouvernementale — JAMAIS hardcodés dans le frontend</div>
            </Card>
          </div>
        )}

        {/* ─── SESSION TAB ───────────────────────────────── */}
        {tab === 'session' && (
          <div className="space-y-4 mb-6">
            <Card className="border-green-500/20">
              <div className="font-semibold text-white text-sm mb-3">Session complétée — {mockCompletedSession.tripId}</div>
              <div className="space-y-2">
                {[
                  { label:'Trip ID', val:mockCompletedSession.tripId, mono:true },
                  { label:'Service', val:mockCompletedSession.serviceMode + (mockCompletedSession.taximeterEnabled ? ' (Txm ✓)' : '') },
                  { label:'Tarif version', val:mockCompletedSession.tariffVersionId, mono:true },
                  { label:'Distance', val:`${mockCompletedSession.distanceKm} km` },
                  { label:'Durée', val:`${Math.floor(mockCompletedSession.durationSec/60)} min` },
                  { label:'Attente', val:`${Math.floor(mockCompletedSession.waitingSec/60)} min` },
                  { label:'Tarif final', val:fmt(mockCompletedSession.finalFare), color:'text-white' },
                  { label:'TPS', val:fmt(mockCompletedSession.tpsAmount) },
                  { label:'TVQ', val:fmt(mockCompletedSession.tvqAmount) },
                  { label:'Pourboire', val:fmt(mockCompletedSession.tipAmount) },
                  { label:'TOTAL', val:fmt(mockCompletedSession.totalAmount), color:'text-green-400', bold:true },
                  { label:'Paiement', val:`${mockCompletedSession.paymentMethod} · ${mockCompletedSession.paymentStatus}` },
                  { label:'Statut session', val:mockCompletedSession.state },
                  { label:'Immuable', val:mockCompletedSession.isLocked ? `🔒 OUI — ${mockCompletedSession.lockReason}` : 'Non', color:mockCompletedSession.isLocked ? 'text-purple-400' : 'text-slate-400' },
                  { label:'Échantillons GPS', val:`${mockCompletedSession.gpsSamples} (${mockCompletedSession.anomalyCount} filtrés)` },
                  { label:'Sync', val:mockCompletedSession.syncStatus, color:'text-green-400' },
                  { label:'Source horloge', val:mockCompletedSession.timeSource },
                ].map(s => (
                  <div key={s.label} className={`flex justify-between py-1.5 border-b border-slate-800 last:border-0 ${s.bold ? 'font-bold' : ''}`}>
                    <span className="text-xs text-slate-400">{s.label}</span>
                    <span className={`text-xs ${'color' in s ? s.color : 'text-white'} ${'mono' in s ? 'font-mono text-[10px] text-qc-blue-light' : ''} text-right max-w-[55%]`}>{s.val}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* GPS samples */}
            <Card>
              <div className="font-semibold text-white text-sm mb-3">Échantillons GPS</div>
              <div className="space-y-1.5">
                {mockGPSSamples.map(s => (
                  <div key={s.id} className={`flex items-start gap-2 text-[10px] py-1.5 border-b border-slate-800 last:border-0 ${s.filtered ? 'opacity-50' : ''}`}>
                    <span className={s.filtered ? 'text-red-400' : s.quality === 'EXCELLENT' ? 'text-green-400' : 'text-amber-400'}>
                      {s.filtered ? '✗' : '✓'}
                    </span>
                    <div className="flex-1">
                      <div className="font-mono text-slate-400">{s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}</div>
                      <div className="text-slate-500">±{s.accuracy}m · {(s.speed*3.6).toFixed(0)} km/h · {s.quality}</div>
                      {s.filterReason && <div className="text-red-400 mt-0.5">{s.filterReason}</div>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-[9px] text-slate-500 mt-2">Coordonnées conservées selon politique de rétention GPS · Agrégation après N jours</div>
            </Card>
          </div>
        )}

        {/* ─── EVENTS TAB ────────────────────────────────── */}
        {tab === 'events' && (
          <div className="mb-6">
            <div className="text-[10px] text-slate-500 mb-3">Journal d'événements — idempotent (event_id unique · duplicates ignorés)</div>
            <div className="driver-card divide-y divide-slate-800">
              {mockEvents.map((evt, i) => (
                <div key={i} className={`p-3.5 flex items-start gap-3 ${evt.duplicate ? 'opacity-40' : ''}`}>
                  <span className={`text-lg shrink-0 ${evt.duplicate ? 'text-amber-400' : evt.processed ? 'text-green-400' : 'text-slate-500'}`}>
                    {evt.duplicate ? '⚠' : evt.processed ? '✅' : '⏳'}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-bold text-white text-sm">{evt.eventType}</span>
                      {evt.duplicate && <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-bold">DUPLICATE IGNORED</span>}
                      {!evt.duplicate && <span className={`text-[9px] font-bold ${evt.processed ? 'text-green-400' : 'text-slate-500'}`}>{evt.processed ? 'TRAITÉ' : 'EN ATTENTE'}</span>}
                    </div>
                    <div className="font-mono text-[9px] text-slate-500">{evt.eventId}</div>
                    {Object.keys(evt.metadata).length > 0 && (
                      <div className="text-[9px] text-slate-600 mt-0.5">{JSON.stringify(evt.metadata)}</div>
                    )}
                  </div>
                  <div className="text-[9px] text-slate-600 shrink-0">{new Date(evt.timestamp).toLocaleTimeString('fr-CA')}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirm start modal */}
      {showConfirmStart && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end p-4">
          <div className="w-full bg-slate-900 rounded-3xl border border-slate-700 p-6">
            <h3 className="font-bold text-white text-xl text-center mb-4">Démarrer le taximètre ?</h3>
            <div className="space-y-2 mb-5">
              {[
                { label:'Service', val:`${SERVICE_CONF[serviceMode].icon} ${serviceMode}` },
                { label:'Tarif', val:ACTIVE_TARIFF.version },
                { label:'GPS', val:`● ${gpsQuality} (${gpsAccuracy}m)` },
                { label:'Trip ID', val:tripId },
                { label:'Taximètre', val:taximeterOn ? '🟢 ACTIF' : '🔴 DÉSACTIVÉ' },
              ].map(s => (
                <div key={s.label} className="flex justify-between text-xs">
                  <span className="text-slate-400">{s.label}</span>
                  <span className="text-white font-semibold">{s.val}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmStart(false)} className="flex-1 py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-semibold">Annuler</button>
              <button onClick={handleStart} className="flex-1 py-3.5 rounded-2xl bg-qc-blue text-white font-bold hover:bg-qc-blue-dark transition-all">🚕 Commencer</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm stop modal */}
      {showConfirmStop && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end p-4">
          <div className="w-full bg-slate-900 rounded-3xl border border-slate-700 p-6">
            <h3 className="font-bold text-white text-xl text-center mb-2">Terminer la course ?</h3>
            <div className="text-3xl font-black text-green-400 tabular-nums text-center mb-4">{fmt(fare.finalFare)}</div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmStop(false)} className="flex-1 py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-semibold">Continuer</button>
              <button onClick={handleStop} className="flex-1 py-3.5 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-500 transition-all">⬛ Terminer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
