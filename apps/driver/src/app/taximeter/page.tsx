'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { PilotBanner } from '@/components/ui'
import { mockVehicle, mockDriver } from '@/data/driver.mock'
import {
  ACTIVE_FARE_RULES, calculateFare, createMeterSession, createMeterEvent,
  buildTaxiTransaction, formatCAD, formatDuration,
  type MeterState, type MeterSession, type PaymentMethod, type FareBreakdown
} from '@/lib/engines/taximeter.engine'
import { haversineKm } from '@/lib/gps/location.engine'
import { MapPin, Gauge, Wifi, CheckCircle, AlertCircle, Clock, Navigation, Receipt } from 'lucide-react'

// ─── GPS SIMULATION ──────────────────────────────────────────
function useGpsSimulation(active: boolean) {
  const [pos, setPos] = useState({ lat: 45.5017, lng: -73.5673, accuracy: 4, speed: 0, heading: 270 })
  const posRef = useRef(pos)
  posRef.current = pos

  useEffect(() => {
    if (!active) return
    const t = setInterval(() => {
      setPos(prev => {
        const speed = Math.max(0, Math.min(80, prev.speed + (Math.random() - 0.45) * 15))
        const heading = (prev.heading + (Math.random() - 0.5) * 20 + 360) % 360
        const distDeg = (speed / 3600) * (1 / 111.32)
        const lat = prev.lat + distDeg * Math.cos(heading * Math.PI / 180)
        const lng = prev.lng + distDeg * Math.sin(heading * Math.PI / 180) / Math.cos(prev.lat * Math.PI / 180)
        return { lat, lng, accuracy: Math.round(3 + Math.random() * 6), speed: Math.round(speed), heading: Math.round(heading) }
      })
    }, 1000)
    return () => clearInterval(t)
  }, [active])
  return pos
}

// ─── METER STATE MACHINE ─────────────────────────────────────
function useMeterEngine() {
  const [session, setSession] = useState<MeterSession | null>(null)
  const [fare, setFare] = useState<FareBreakdown | null>(null)
  const [elapsedSec, setElapsedSec] = useState(0)
  const [waitingSec, setWaitingSec] = useState(0)
  const [distanceKm, setDistanceKm] = useState(0)
  const [lastPos, setLastPos] = useState<{ lat: number; lng: number } | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const gps = useGpsSimulation(session?.state === 'ACTIVE' || session?.state === 'WAITING')

  // Distance + fare update during active trip
  useEffect(() => {
    if (session?.state !== 'ACTIVE' && session?.state !== 'WAITING') return
    timerRef.current = setInterval(() => {
      setElapsedSec(e => e + 1)
      if (session?.state === 'WAITING') {
        setWaitingSec(w => w + 1)
      }
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [session?.state])

  // GPS distance accumulation
  useEffect(() => {
    if (session?.state !== 'ACTIVE') return
    if (lastPos) {
      const d = haversineKm(lastPos.lat, lastPos.lng, gps.lat, gps.lng)
      if (d * 1000 >= 5) {
        setDistanceKm(prev => Math.round((prev + d) * 1000) / 1000)
      }
    }
    setLastPos({ lat: gps.lat, lng: gps.lng })
  }, [gps.lat, gps.lng])

  // Recalculate fare whenever distance/time changes
  useEffect(() => {
    if (session?.state !== 'ACTIVE' && session?.state !== 'WAITING' && session?.state !== 'COMPLETING') return
    const breakdown = calculateFare(distanceKm, elapsedSec, waitingSec, ACTIVE_FARE_RULES)
    setFare(breakdown)
  }, [distanceKm, elapsedSec, waitingSec, session?.state])

  const startSession = useCallback(() => {
    const s = createMeterSession(
      mockDriver.driverId, mockVehicle.vehicleId, mockVehicle.plate,
      mockVehicle.meter.instanceId, mockVehicle.meter.version
    )
    setSession(s); setElapsedSec(0); setWaitingSec(0); setDistanceKm(0); setLastPos(null); setFare(null)
  }, [])

  const passengerEntering = useCallback(() => {
    setSession(s => s ? { ...s, state: 'PASSENGER_ENTERING', events: [...s.events, createMeterEvent('PASSENGER_ENTER','PASSENGER_ENTERING',s)] } : s)
  }, [])

  const startTrip = useCallback(() => {
    setSession(s => s ? { ...s, state: 'ACTIVE', tripStartAt: Date.now(), events: [...s.events, createMeterEvent('TRIP_START','ACTIVE',s)] } : s)
  }, [])

  const toggleWaiting = useCallback(() => {
    setSession(s => {
      if (!s) return s
      if (s.state === 'ACTIVE') return { ...s, state: 'WAITING', waitingStartAt: Date.now(), events: [...s.events, createMeterEvent('WAITING_START','WAITING',s)] }
      if (s.state === 'WAITING') return { ...s, state: 'ACTIVE', waitingStartAt: null, events: [...s.events, createMeterEvent('WAITING_END','ACTIVE',s)] }
      return s
    })
  }, [])

  const endTrip = useCallback(() => {
    setSession(s => s ? { ...s, state: 'COMPLETING', tripEndAt: Date.now(), distanceKm, durationSec: elapsedSec, totalWaitingSec: waitingSec, events: [...s.events, createMeterEvent('TRIP_END','COMPLETING',s)] } : s)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [distanceKm, elapsedSec, waitingSec])

  const confirmPayment = useCallback((method: PaymentMethod) => {
    setSession(s => {
      if (!s || !fare) return s
      const finalFare = calculateFare(distanceKm, elapsedSec, waitingSec, ACTIVE_FARE_RULES)
      const tx = buildTaxiTransaction({ ...s, paymentMethod: method, fareBreakdown: finalFare }, finalFare)
      return { ...s, state: 'COMPLETED', paymentMethod: method, fareBreakdown: finalFare, transactionId: tx.transactionId, ledgerSynced: true, events: [...s.events, createMeterEvent('PAYMENT_CONFIRMED','COMPLETED',s)] }
    })
  }, [distanceKm, elapsedSec, waitingSec, fare])

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setSession(null); setFare(null); setElapsedSec(0); setWaitingSec(0); setDistanceKm(0); setLastPos(null)
  }, [])

  return { session, fare, gps, elapsedSec, waitingSec, distanceKm, startSession, passengerEntering, startTrip, toggleWaiting, endTrip, confirmPayment, reset }
}

// ─── COMPASS DIRECTION ───────────────────────────────────────
function compassDir(deg: number) {
  return ['N','NE','E','SE','S','SO','O','NO'][Math.round(deg / 45) % 8]
}

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function TaximeterPage() {
  const { session, fare, gps, elapsedSec, waitingSec, distanceKm, startSession, passengerEntering, startTrip, toggleWaiting, endTrip, confirmPayment, reset } = useMeterEngine()
  const [showHistory, setShowHistory] = useState(false)

  const state: MeterState = session?.state ?? 'OFF'
  const rules = ACTIVE_FARE_RULES

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <PilotBanner />

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <div className="text-[10px] font-mono text-slate-500">{mockVehicle.meter.instanceId}</div>
          <div className="text-[10px] font-bold text-qc-blue-light">TAXIMÈTRE CERTIFIÉ · {rules.ruleSetId}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold border
            ${gps.accuracy <= 10 ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
            <MapPin size={9} /> {gps.accuracy}m
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border
            ${state === 'ACTIVE' ? 'bg-qc-blue/20 border-qc-blue/40 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
            <Gauge size={9} /> {state}
          </div>
        </div>
      </div>

      {/* ─── OFF / AVAILABLE ─────────────────────────────────── */}
      {(state === 'OFF' || state === 'AVAILABLE') && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
          {state === 'OFF' ? (
            <>
              <div className="text-7xl mb-6">🚕</div>
              <h1 className="text-3xl font-black text-white mb-2 text-center">TAXIMÈTRE</h1>
              <p className="text-slate-400 text-sm text-center mb-2">Tarifs réglementaires — {rules.jurisdiction}</p>
              <div className="text-[10px] text-slate-600 mb-10 font-mono">Règlement MTQ · Taux {rules.ruleSetId}</div>

              {/* Fare rates preview */}
              <div className="w-full bg-slate-900 rounded-3xl p-5 border border-slate-800 mb-8">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Grille tarifaire active</div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label:'Prise en charge', val:`${formatCAD(rules.baseFare)}` },
                    { label:'Par kilomètre', val:`${formatCAD(rules.perKmRate)}/km` },
                    { label:'Par minute', val:`${formatCAD(rules.perMinuteRate)}/min` },
                    { label:'Attente', val:`${formatCAD(rules.waitingPerMinuteRate)}/min` },
                    { label:'Minimum', val:formatCAD(rules.minimumFare) },
                    { label:'TPS+TVQ', val:'14.975%' },
                  ].map(r => (
                    <div key={r.label} className="bg-slate-800/50 rounded-xl p-3">
                      <div className="text-[10px] text-slate-500">{r.label}</div>
                      <div className="font-bold text-white text-sm tabular-nums">{r.val}</div>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={startSession}
                className="w-full py-5 rounded-3xl bg-qc-blue text-white font-black text-xl hover:bg-qc-blue-dark active:scale-95 transition-all shadow-2xl shadow-blue-900/50">
                DÉMARRER LE TAXIMÈTRE
              </button>
            </>
          ) : (
            <>
              <div className="text-6xl mb-5 animate-pulse">🟢</div>
              <h2 className="text-2xl font-black text-white mb-1">DISPONIBLE</h2>
              <p className="text-slate-400 text-sm mb-3">En attente d'un passager</p>

              {/* GPS status */}
              <div className="flex items-center gap-2 mb-8">
                <div className={`w-2 h-2 rounded-full ${gps.accuracy <= 10 ? 'bg-green-500 pulse-green' : 'bg-amber-500'}`} />
                <span className="text-xs text-slate-400">GPS · {gps.lat.toFixed(4)}°N {Math.abs(gps.lng).toFixed(4)}°O · {gps.accuracy}m</span>
              </div>

              <div className="w-full bg-slate-900 rounded-3xl p-5 border border-slate-800 mb-6 text-center">
                <div className="text-xs text-slate-500 mb-1">Prise en charge</div>
                <div className="text-6xl font-black text-white tabular-nums taxi-display">{formatCAD(rules.baseFare)}</div>
              </div>

              <button onClick={passengerEntering}
                className="w-full py-5 rounded-3xl bg-green-600 text-white font-black text-xl hover:bg-green-500 active:scale-95 transition-all shadow-2xl shadow-green-900/50">
                🧍 PASSAGER MONTE
              </button>
              <button onClick={reset} className="mt-3 w-full py-3 rounded-2xl border border-slate-700 text-slate-400 text-sm font-semibold hover:border-slate-600 transition-all">
                Éteindre le taximètre
              </button>
            </>
          )}
        </div>
      )}

      {/* ─── PASSENGER ENTERING ──────────────────────────────── */}
      {state === 'PASSENGER_ENTERING' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
          <div className="text-6xl mb-5">🚶‍♂️</div>
          <h2 className="text-2xl font-black text-white mb-2">PASSAGER EN MONTÉE</h2>
          <p className="text-slate-400 text-sm mb-8">Prêt à démarrer la course</p>
          <div className="w-full bg-slate-900 rounded-3xl p-5 border border-green-500/30 mb-8 text-center">
            <div className="text-xs text-slate-500 mb-1">Prise en charge</div>
            <div className="text-6xl font-black text-white tabular-nums taxi-display">{formatCAD(rules.baseFare)}</div>
          </div>
          <button onClick={startTrip}
            className="w-full py-5 rounded-3xl bg-qc-blue text-white font-black text-xl hover:bg-qc-blue-dark active:scale-95 transition-all shadow-2xl shadow-blue-900/50 mb-3">
            ▶ DÉMARRER LA COURSE
          </button>
          <button onClick={reset}
            className="w-full py-3 rounded-2xl border border-slate-700 text-slate-400 text-sm font-semibold hover:border-slate-600 transition-all">
            Annuler
          </button>
        </div>
      )}

      {/* ─── ACTIVE / WAITING ────────────────────────────────── */}
      {(state === 'ACTIVE' || state === 'WAITING') && (
        <div className="flex-1 flex flex-col px-4 pb-24 pt-2">
          {/* Big fare display */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className={`w-3 h-3 rounded-full ${state === 'ACTIVE' ? 'bg-green-500 pulse-green' : 'bg-amber-500 pulse-red'}`} />
              <span className={`text-sm font-black tracking-widest ${state === 'ACTIVE' ? 'text-green-400' : 'text-amber-400'}`}>
                {state === 'ACTIVE' ? 'COURSE ACTIVE' : '⏸ EN ATTENTE'}
              </span>
            </div>
            <div className="text-7xl font-black text-white taxi-display leading-none mb-1">
              {formatCAD(fare?.subtotal ?? rules.baseFare).replace('CA\u00a0', '').replace('\u00a0', ' ')}
            </div>
            <div className="text-base text-slate-400 tabular-nums">TTC: {formatCAD(fare?.total ?? rules.baseFare)}</div>
          </div>

          {/* Trip metrics */}
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            <div className="bg-slate-900 rounded-2xl p-3.5 border border-slate-800 text-center">
              <div className="text-2xl font-black text-white tabular-nums">{distanceKm.toFixed(2)}</div>
              <div className="text-[10px] text-slate-500">km</div>
            </div>
            <div className="bg-slate-900 rounded-2xl p-3.5 border border-slate-800 text-center">
              <div className="text-2xl font-black text-white tabular-nums">{formatDuration(elapsedSec)}</div>
              <div className="text-[10px] text-slate-500">durée</div>
            </div>
            <div className="bg-slate-900 rounded-2xl p-3.5 border border-slate-800 text-center">
              <div className="text-2xl font-black text-white tabular-nums">{gps.speed}</div>
              <div className="text-[10px] text-slate-500">km/h</div>
            </div>
          </div>

          {/* Fare breakdown live */}
          <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 mb-4">
            <div className="space-y-1.5">
              {[
                { label:'Prise en charge', val:fare?.baseFare ?? rules.baseFare, color:'text-slate-300' },
                { label:`Distance (${distanceKm.toFixed(2)} km)`, val:fare?.distanceFare ?? 0, color:'text-slate-300' },
                { label:`Temps (${formatDuration(elapsedSec)})`, val:fare?.timeFare ?? 0, color:'text-slate-300' },
                ...(waitingSec > 0 ? [{ label:`Attente (${formatDuration(waitingSec)})`, val:fare?.waitingFare ?? 0, color:'text-amber-400' }] : []),
              ].map(r => (
                <div key={r.label} className="flex justify-between text-xs">
                  <span className="text-slate-400">{r.label}</span>
                  <span className={`font-mono font-semibold ${r.color}`}>{formatCAD(r.val)}</span>
                </div>
              ))}
              <div className="border-t border-slate-700 pt-1.5 mt-1.5 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">TPS (5%)</span>
                  <span className="font-mono text-blue-400">{formatCAD(fare?.tps ?? 0)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">TVQ (9.975%)</span>
                  <span className="font-mono text-purple-400">{formatCAD(fare?.tvq ?? 0)}</span>
                </div>
              </div>
              <div className="border-t border-slate-600 pt-1.5 flex justify-between text-sm font-bold">
                <span className="text-white">Total TTC</span>
                <span className="font-mono text-green-400 tabular-nums">{formatCAD(fare?.total ?? rules.baseFare)}</span>
              </div>
            </div>
          </div>

          {/* GPS */}
          <div className="flex items-center gap-2 mb-4 px-1">
            <MapPin size={12} className="text-qc-blue-light shrink-0" />
            <span className="text-[10px] text-slate-400 font-mono">{gps.lat.toFixed(4)}°N {Math.abs(gps.lng).toFixed(4)}°O · {compassDir(gps.heading)} · {gps.accuracy}m</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button onClick={toggleWaiting}
              className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all border
                ${state === 'WAITING'
                  ? 'bg-green-600 border-green-500 text-white hover:bg-green-500'
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30'}`}>
              {state === 'WAITING' ? '▶ Reprendre' : '⏸ Attente'}
            </button>
            <button onClick={endTrip}
              className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-black text-base hover:bg-red-500 active:scale-95 transition-all shadow-lg shadow-red-900/40">
              ⏹ ARRÊTER
            </button>
          </div>
        </div>
      )}

      {/* ─── COMPLETING ──────────────────────────────────────── */}
      {state === 'COMPLETING' && fare && (
        <div className="flex-1 flex flex-col px-4 pb-24 pt-4">
          <div className="text-center mb-5">
            <div className="text-xl font-black text-white mb-1">COURSE TERMINÉE</div>
            <div className="text-6xl font-black text-green-400 taxi-display mb-1">{formatCAD(fare.total)}</div>
            <div className="text-sm text-slate-400">{distanceKm.toFixed(2)} km · {formatDuration(elapsedSec)}</div>
          </div>

          {/* Full receipt */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden mb-5">
            <div className="bg-qc-blue/20 border-b border-qc-blue/30 px-4 py-3 flex items-center gap-2">
              <Receipt size={14} className="text-qc-blue-light" />
              <span className="font-bold text-white text-sm">Reçu de course — SIMULATION</span>
            </div>
            <div className="p-4 space-y-2">
              {[
                { label:'Prise en charge', val:fare.baseFare },
                { label:`Distance (${fare.distanceKm.toFixed(2)} km × ${formatCAD(rules.perKmRate)})`, val:fare.distanceFare },
                { label:`Temps (${formatDuration(fare.durationSec)} × ${formatCAD(rules.perMinuteRate)})`, val:fare.timeFare },
                ...(fare.waitingFare > 0 ? [{ label:`Attente (${formatDuration(fare.waitingSec)})`, val:fare.waitingFare }] : []),
                ...(fare.surcharges > 0 ? [{ label:'Suppléments', val:fare.surcharges }] : []),
              ].map(r => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-slate-400">{r.label}</span>
                  <span className="font-mono text-white">{formatCAD(r.val)}</span>
                </div>
              ))}
              <div className="border-t border-slate-700 pt-2 space-y-1">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-slate-300">Sous-total</span>
                  <span className="font-mono text-white">{formatCAD(fare.subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs"><span className="text-slate-400">TPS (5%)</span><span className="font-mono text-blue-400">{formatCAD(fare.tps)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-400">TVQ (9.975%)</span><span className="font-mono text-purple-400">{formatCAD(fare.tvq)}</span></div>
              </div>
              <div className="border-t-2 border-slate-600 pt-2 flex justify-between text-lg font-black">
                <span className="text-white">TOTAL TTC</span>
                <span className="font-mono text-green-400 tabular-nums">{formatCAD(fare.total)}</span>
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Mode de paiement</div>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[['CARD','💳','Carte'],['INTERAC','🏦','Interac'],['CASH','💵','Comptant'],['WALLET','📱','Portefeuille']] .map(([m,i,l]) => (
              <button key={m} onClick={() => confirmPayment(m as PaymentMethod)}
                className="py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 bg-slate-900 border border-slate-700 text-slate-300 hover:border-qc-blue hover:text-white active:scale-95 transition-all">
                {i} {l}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── COMPLETED ───────────────────────────────────────── */}
      {state === 'COMPLETED' && session && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
          <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center mb-5">
            <CheckCircle size={40} className="text-green-400" />
          </div>
          <div className="text-xl font-black text-white mb-1">Transaction confirmée</div>
          <div className="text-5xl font-black text-green-400 taxi-display mb-2">{formatCAD(session.fareBreakdown?.total ?? 0)}</div>
          <div className="text-sm text-slate-400 mb-1">{session.paymentMethod} · {session.fareBreakdown?.distanceKm.toFixed(2)} km</div>

          <div className="w-full bg-slate-900 rounded-2xl p-4 border border-slate-800 mb-6 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Transaction ID</span>
              <span className="font-mono text-qc-blue-light text-[10px]">{session.transactionId}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Taximètre</span>
              <span className="text-white text-[10px]">{session.meterId}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Règles appliquées</span>
              <span className="text-white text-[10px]">{session.rulesVersion}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Ledger</span>
              <span className="text-green-400 font-bold text-[10px]">✅ CONFIRMÉ</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Audit</span>
              <span className="text-green-400 font-bold text-[10px]">✅ ENREGISTRÉ</span>
            </div>
          </div>

          <button onClick={reset}
            className="w-full py-4 rounded-2xl bg-qc-blue text-white font-black text-lg hover:bg-qc-blue-dark transition-all shadow-lg mb-3">
            🚕 NOUVELLE COURSE
          </button>

          {/* Audit events */}
          {session.events.length > 0 && (
            <button onClick={() => setShowHistory(h => !h)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              {showHistory ? '▲' : '▼'} Journal de session ({session.events.length} événements)
            </button>
          )}
          {showHistory && (
            <div className="w-full mt-3 bg-slate-900 rounded-2xl border border-slate-800 p-3 space-y-1.5">
              {session.events.map(evt => (
                <div key={evt.eventId} className="flex items-start gap-2 text-[10px]">
                  <span className="text-slate-600 font-mono w-20 shrink-0">
                    {new Date(evt.timestamp).toLocaleTimeString('fr-CA')}
                  </span>
                  <span className="text-slate-400">{evt.type}</span>
                  <span className="text-slate-600 ml-auto">{formatCAD(evt.fareAtEvent)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom padding for nav */}
      <div className="pb-24" />
    </div>
  )
}
