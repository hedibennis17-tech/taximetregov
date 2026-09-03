'use client'

// ================================================================
// TAXIMÈTRE.GOV — PAGE TAXIMÈTRE
// Phase 4 — Données réelles · API Backend · GPS téléphone
// RÈGLE: Taximètre UNIQUEMENT pour TAXI — jamais DELIVERY
// ================================================================

import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import {
  useState, useEffect, useRef, useCallback
} from 'react'
import {
  Shield, AlertCircle, CheckCircle, MapPin,
  Clock, Gauge, Navigation, ArrowLeft, Pause, Play, Square
} from 'lucide-react'
import { getToken } from '@/lib/api'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ─── TYPES ───────────────────────────────────────────────────

type ServiceMode = 'TAXI' | 'RIDESHARE' | 'DELIVERY' | 'PERSONAL'
type TripStatus = 'IDLE' | 'STARTING' | 'ACTIVE' | 'PAUSED' | 'STOPPING' | 'COMPLETED' | 'ERROR'

const TAXIMETER_BY_SERVICE: Record<ServiceMode, boolean> = {
  TAXI:      true,
  RIDESHARE: false,
  DELIVERY:  false,
  PERSONAL:  false,
}

const SERVICE_CONF: Record<ServiceMode, { icon: string; label: string; color: string; bg: string }> = {
  TAXI:      { icon: '🚕', label: 'Taxi',      color: 'text-blue-400',   bg: 'bg-blue-500/20'  },
  RIDESHARE: { icon: '🚗', label: 'Rideshare', color: 'text-slate-300',  bg: 'bg-slate-700'    },
  DELIVERY:  { icon: '📦', label: 'Livraison', color: 'text-red-400',    bg: 'bg-red-500/10'   },
  PERSONAL:  { icon: '🏠', label: 'Personnel', color: 'text-slate-500',  bg: 'bg-slate-800'    },
}

function fmt(n: number, decimals = 2) {
  return n.toFixed(decimals)
}

function formatDuration(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

// ─── API CALLS ────────────────────────────────────────────────

async function apiCall(path: string, body?: unknown) {
  const token = getToken()
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json() as { success: boolean; data: unknown; error?: string }
  if (!res.ok || !json.success) throw new Error(json.error ?? `Erreur ${res.status}`)
  return json.data
}

async function apiGet(path: string) {
  const token = getToken()
  const res = await fetch(path, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  const json = await res.json() as { success: boolean; data: unknown; error?: string }
  if (!res.ok || !json.success) throw new Error(json.error ?? `Erreur ${res.status}`)
  return json.data
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────

export default function TaxiPage() {
  const router = useRouter()

  // Service mode
  const [serviceMode, setServiceMode] = useState<ServiceMode>('TAXI')

  // Trip state
  const [tripStatus, setTripStatus]       = useState<TripStatus>('IDLE')
  const [tripReference, setTripReference] = useState<string | null>(null)
  const [tripId, setTripId]               = useState<string | null>(null)
  const [fareVersion, setFareVersion]     = useState<string | null>(null)
  const [fareSnapshot, setFareSnapshot]   = useState<Record<string, string> | null>(null)
  const [isPilot, setIsPilot]             = useState(true)

  // Compteurs
  const [elapsedSec, setElapsedSec]   = useState(0)
  const [distanceM, setDistanceM]     = useState(0)
  const [waitingSec, setWaitingSec]   = useState(0)
  const [isWaiting, setIsWaiting]     = useState(false)

  // Fare calculé localement depuis fareSnapshot (affichage seulement — final par serveur)
  const [displayFare, setDisplayFare] = useState(0)

  // GPS
  const [gpsStatus, setGpsStatus]       = useState<'unknown' | 'ok' | 'denied' | 'error'>('unknown')
  const [lastPosition, setLastPosition] = useState<GeolocationPosition | null>(null)

  // UI
  const [error, setError]                 = useState<string | null>(null)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [completedTrip, setCompletedTrip] = useState<{
    tripReference: string; finalAmount: number
    distanceMeters: number; elapsedSeconds: number
  } | null>(null)

  // Refs
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const gpsWatchRef = useRef<number | null>(null)
  const prevPosRef  = useRef<{ lat: number; lng: number } | null>(null)

  const taximeterOn = TAXIMETER_BY_SERVICE[serviceMode]

  // ─── Fare display calculation ─────────────────────────────

  useEffect(() => {
    if (!fareSnapshot || !taximeterOn) { setDisplayFare(0); return }
    const base     = parseFloat(fareSnapshot.baseFare      ?? '4.10')
    const distRate = parseFloat(fareSnapshot.distanceRatePer100m ?? '0.185')
    const timeRate = parseFloat(fareSnapshot.timeRatePerMinute   ?? '0.55')
    const waitRate = parseFloat(fareSnapshot.waitingRatePerMinute ?? '0.55')
    const minFare  = parseFloat(fareSnapshot.minimumFare    ?? '4.10')
    const computed = base
      + (distanceM / 100) * distRate
      + (elapsedSec / 60) * timeRate
      + (waitingSec / 60) * waitRate
    setDisplayFare(Math.max(computed, minFare))
  }, [fareSnapshot, distanceM, elapsedSec, waitingSec, taximeterOn])

  // ─── Timer ───────────────────────────────────────────────

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setElapsedSec(s => s + 1)
      if (isWaiting) setWaitingSec(w => w + 1)
    }, 1000)
  }, [isWaiting])

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  // ─── GPS ─────────────────────────────────────────────────

  function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  }

  const startGPS = useCallback((currentTripId: string) => {
    if (!navigator.geolocation) { setGpsStatus('error'); return }
    gpsWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsStatus('ok')
        setLastPosition(pos)
        const { latitude: lat, longitude: lng } = pos.coords
        if (prevPosRef.current && !isWaiting) {
          const delta = haversineDistance(prevPosRef.current.lat, prevPosRef.current.lng, lat, lng)
          if (delta > 5 && delta < 200) {
            setDistanceM(d => d + delta)
            void apiCall('/api/taximeter/gps', {
              tripId: currentTripId, latitude: lat, longitude: lng,
              accuracy: pos.coords.accuracy, speedKmh: (pos.coords.speed ?? 0) * 3.6,
              distanceDelta: Math.round(delta), elapsedDelta: 1,
            }).catch(() => null)
          }
        }
        prevPosRef.current = { lat, lng }
      },
      () => setGpsStatus('denied'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    )
  }, [isWaiting])

  const stopGPS = useCallback(() => {
    if (gpsWatchRef.current !== null) {
      navigator.geolocation.clearWatch(gpsWatchRef.current)
      gpsWatchRef.current = null
    }
  }, [])

  useEffect(() => () => { stopTimer(); stopGPS() }, [stopTimer, stopGPS])

  // ─── Check status on mount ────────────────────────────────

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiGet('/api/taximeter/status') as {
          hasActiveMeter: boolean
          taximeter: { active_trip: { id: string; publicTripId: string; tripReference: string; status: string; distanceMeters: number; elapsedSeconds: number } | null } | null
        }
        if (data.hasActiveMeter && data.taximeter?.active_trip) {
          const t = data.taximeter.active_trip
          setTripReference(t.tripReference)
          setTripId(t.id)
          setDistanceM(t.distanceMeters)
          setElapsedSec(t.elapsedSeconds)
          setTripStatus(t.status === 'PAUSED' ? 'PAUSED' : 'ACTIVE')
          if (t.status !== 'PAUSED') { startTimer(); startGPS(t.id) }
        }
      } catch { /* pas de course active */ }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Start trip ───────────────────────────────────────────

  async function startTrip() {
    if (tripStatus !== 'IDLE') return
    setError(null)
    setTripStatus('STARTING')
    try {
      const data = await apiCall('/api/taximeter/start') as {
        tripReference: string; publicTripId: string; fareVersion: string
        fareSnapshot: Record<string, string>; isPilot: boolean
      }
      setTripReference(data.tripReference)
      setFareVersion(data.fareVersion)
      setFareSnapshot(data.fareSnapshot)
      setIsPilot(data.isPilot)
      setElapsedSec(0); setDistanceM(0); setWaitingSec(0)
      setTripStatus('ACTIVE')
      startTimer()
      startGPS(data.tripReference)
    } catch (e) {
      setError((e as Error).message)
      setTripStatus('IDLE')
    }
  }

  // ─── Pause / Resume ───────────────────────────────────────

  async function togglePause() {
    if (!tripReference) return
    try {
      if (tripStatus === 'ACTIVE') {
        await apiCall('/api/taximeter/pause', { tripReference })
        setIsWaiting(true); setTripStatus('PAUSED'); stopTimer()
        if (gpsWatchRef.current !== null) { navigator.geolocation.clearWatch(gpsWatchRef.current); gpsWatchRef.current = null }
      } else if (tripStatus === 'PAUSED') {
        await apiCall('/api/taximeter/resume', { tripReference })
        setIsWaiting(false); setTripStatus('ACTIVE'); startTimer()
        if (tripId) startGPS(tripId)
      }
    } catch (e) { setError((e as Error).message) }
  }

  // ─── Stop trip ────────────────────────────────────────────

  async function stopTrip() {
    if (!tripReference || tripStatus === 'IDLE' || tripStatus === 'STOPPING') return
    setTripStatus('STOPPING'); stopTimer(); stopGPS()
    try {
      const data = await apiCall('/api/taximeter/stop', {
        tripReference,
        distanceMeters: Math.round(distanceM),
        elapsedSeconds: elapsedSec,
        waitingSeconds: waitingSec,
        isAirportTrip:  false,
      }) as { tripReference: string; finalAmount: number; distanceMeters: number; elapsedSeconds: number }
      setCompletedTrip(data)
      setTripStatus('COMPLETED')
      setTripReference(null); setFareSnapshot(null)
    } catch (e) {
      setError((e as Error).message)
      setTripStatus('ACTIVE'); startTimer()
    }
  }

  // ─── Leave guard ─────────────────────────────────────────

  function handleBack() {
    if (tripStatus === 'ACTIVE' || tripStatus === 'PAUSED') {
      setShowLeaveConfirm(true)
    } else {
      router.push('/home')
    }
  }

  // ─── COMPLETED screen ─────────────────────────────────────

  if (tripStatus === 'COMPLETED' && completedTrip) {
    return (
      <AppShell>
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
            <CheckCircle size={32} className="text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Course terminée</h1>
          <div className="text-5xl font-black text-green-400 mb-2">
            {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(completedTrip.finalAmount)}
          </div>
          <p className="text-xs text-slate-400 mb-1">Calcul officiel côté serveur</p>
          <div className="font-mono text-xs text-slate-500 mb-8">{completedTrip.tripReference}</div>

          <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-8">
            <div className="bg-slate-800 rounded-2xl p-4 text-center">
              <div className="font-bold text-white">{(completedTrip.distanceMeters / 1000).toFixed(2)} km</div>
              <div className="text-[10px] text-slate-400">Distance</div>
            </div>
            <div className="bg-slate-800 rounded-2xl p-4 text-center">
              <div className="font-bold text-white">{formatDuration(completedTrip.elapsedSeconds)}</div>
              <div className="text-[10px] text-slate-400">Durée</div>
            </div>
          </div>

          <button
            onClick={() => { setTripStatus('IDLE'); setCompletedTrip(null); setElapsedSec(0); setDistanceM(0); setWaitingSec(0) }}
            className="w-full max-w-xs py-4 rounded-2xl bg-qc-blue text-white font-bold text-lg mb-3"
          >
            Nouvelle course
          </button>
          <Link href="/home" className="text-sm text-slate-400 hover:text-white">
            ← Retour à l'accueil
          </Link>
        </div>
      </AppShell>
    )
  }

  // ─── MAIN SCREEN ──────────────────────────────────────────

  const isActive   = tripStatus === 'ACTIVE' || tripStatus === 'PAUSED'
  const statusConf = {
    IDLE:     { label: 'Disponible',    dot: 'bg-green-500 animate-pulse' },
    STARTING: { label: 'Démarrage…',   dot: 'bg-amber-500 animate-pulse' },
    ACTIVE:   { label: 'En course',     dot: 'bg-green-500' },
    PAUSED:   { label: 'En attente',    dot: 'bg-amber-500 animate-pulse' },
    STOPPING: { label: 'Terminaison…', dot: 'bg-red-500 animate-pulse' },
    COMPLETED:{ label: 'Terminée',     dot: 'bg-blue-500' },
    ERROR:    { label: 'Erreur',        dot: 'bg-red-500' },
  }[tripStatus]

  return (
    <AppShell>
      {/* Leave confirmation modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6">
          <Card className="p-6 max-w-sm w-full text-center">
            <AlertCircle size={32} className="mx-auto text-amber-400 mb-4" />
            <h2 className="text-lg font-bold text-white mb-2">⚠️ Course en cours</h2>
            <p className="text-sm text-slate-400 mb-6">Voulez-vous quitter le taximètre ? La course reste active et sécurisée côté serveur.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLeaveConfirm(false)} className="flex-1 py-3 rounded-xl bg-slate-700 text-white text-sm font-semibold">Annuler</button>
              <button onClick={() => router.push('/home')} className="flex-1 py-3 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-sm font-semibold">Quitter</button>
            </div>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={handleBack} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
          <ArrowLeft size={18} /> Accueil
        </button>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusConf.dot}`} />
          <span className="text-sm text-slate-300">{statusConf.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {gpsStatus === 'ok'
            ? <Navigation size={16} className="text-green-400" />
            : <MapPin size={16} className="text-slate-500" />}
          {isPilot && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">PILOTE</span>}
        </div>
      </div>

      {/* Service mode selector */}
      {!isActive && (
        <div className="px-4 mb-4">
          <div className="flex gap-2 p-1 bg-slate-900 rounded-2xl border border-slate-800">
            {(Object.keys(SERVICE_CONF) as ServiceMode[]).map(mode => {
              const conf = SERVICE_CONF[mode]
              const isSelected = serviceMode === mode
              return (
                <button
                  key={mode}
                  onClick={() => setServiceMode(mode)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1
                    ${isSelected ? `${conf.bg} ${conf.color} border border-current/30` : 'text-slate-500'}`}
                >
                  <span className="text-base">{conf.icon}</span>
                  <span>{conf.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Main meter display */}
      <div className="px-4 mb-4">
        <div className={`rounded-3xl p-6 border-2 transition-all ${
          isActive
            ? tripStatus === 'PAUSED'
              ? 'bg-amber-500/5 border-amber-500/40'
              : 'bg-green-500/5 border-green-500/40'
            : 'bg-slate-900 border-slate-700'
        }`}>

          {/* Fare display */}
          <div className="text-center mb-6">
            {taximeterOn ? (
              <>
                <div className="text-xs text-slate-400 mb-1">
                  {isActive ? 'Tarif en cours — calcul final côté serveur' : 'Tarif — prêt à démarrer'}
                </div>
                <div className={`font-black tabular-nums transition-all ${isActive ? 'text-6xl text-green-400' : 'text-5xl text-slate-500'}`}>
                  {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(displayFare)}
                </div>
                {fareVersion && (
                  <div className="text-[9px] text-slate-600 mt-1">Tarif: {fareVersion}</div>
                )}
              </>
            ) : (
              <div className="py-4">
                <div className="text-4xl mb-2">{SERVICE_CONF[serviceMode].icon}</div>
                <div className="text-sm font-semibold text-slate-400">Mode {SERVICE_CONF[serviceMode].label}</div>
                <div className="text-xs text-slate-500 mt-1">Taximètre désactivé · Montant fourni par la plateforme</div>
              </div>
            )}
          </div>

          {/* Counters */}
          {taximeterOn && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { icon: <Clock size={14} />,    label: 'Durée',    val: formatDuration(elapsedSec) },
                { icon: <Gauge size={14} />,    label: 'Distance', val: distanceM >= 1000 ? `${fmt(distanceM/1000,1)} km` : `${Math.round(distanceM)} m` },
                { icon: <Navigation size={14} />, label: 'Attente', val: formatDuration(waitingSec) },
              ].map(item => (
                <div key={item.label} className="bg-slate-800/60 rounded-2xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">{item.icon}</div>
                  <div className="font-bold text-white text-sm tabular-nums">{item.val}</div>
                  <div className="text-[10px] text-slate-500">{item.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Breakdown */}
          {isActive && taximeterOn && fareSnapshot && (
            <div className="space-y-1.5 mb-6">
              {[
                { label: 'Prise en charge', val: parseFloat(fareSnapshot.baseFare ?? '4.10') },
                { label: 'Distance',        val: (distanceM / 100) * parseFloat(fareSnapshot.distanceRatePer100m ?? '0.185') },
                { label: 'Temps',           val: (elapsedSec / 60) * parseFloat(fareSnapshot.timeRatePerMinute ?? '0.55') },
                ...(waitingSec > 0 ? [{ label: 'Attente', val: (waitingSec / 60) * parseFloat(fareSnapshot.waitingRatePerMinute ?? '0.55') }] : []),
              ].map(item => (
                <div key={item.label} className="flex justify-between text-xs">
                  <span className="text-slate-400">{item.label}</span>
                  <span className="text-white font-mono">{new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(item.val)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
              <div className="flex items-center gap-2 text-red-400 text-xs">
                <AlertCircle size={14} /> {error}
              </div>
            </div>
          )}

          {/* Controls */}
          {!isActive ? (
            <button
              onClick={() => void startTrip()}
              disabled={tripStatus === 'STARTING' || !taximeterOn}
              className={`w-full py-5 rounded-2xl font-bold text-xl transition-all active:scale-98 disabled:opacity-50
                ${taximeterOn
                  ? 'bg-qc-blue text-white shadow-lg shadow-blue-900/30 hover:bg-qc-blue/90'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
            >
              {tripStatus === 'STARTING' ? '⏳ Démarrage…' : taximeterOn ? '▶ DÉMARRER LA COURSE' : 'Taximètre non applicable'}
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => void togglePause()}
                className={`flex-1 py-4 rounded-2xl font-bold transition-all active:scale-98 flex items-center justify-center gap-2
                  ${tripStatus === 'PAUSED'
                    ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                    : 'bg-amber-500/20 border border-amber-500/50 text-amber-400'}`}
              >
                {tripStatus === 'PAUSED' ? <><Play size={18} /> Reprendre</> : <><Pause size={18} /> Pause</>}
              </button>
              <button
                onClick={() => void stopTrip()}
                disabled={tripStatus === ('STOPPING' as TripStatus)}
                className="flex-1 py-4 rounded-2xl font-bold bg-red-500/20 border border-red-500/50 text-red-400 transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Square size={18} /> {(tripStatus as string) === 'STOPPING' ? 'Envoi…' : 'Terminer'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-qc-blue" />
            <span className="text-[10px] text-slate-400">Calcul certifié côté serveur</span>
          </div>
          <div className="flex items-center gap-2">
            {gpsStatus === 'ok'
              ? <><Navigation size={12} className="text-green-400" /><span className="text-[10px] text-green-400">GPS actif</span></>
              : gpsStatus === 'denied'
              ? <><MapPin size={12} className="text-red-400" /><span className="text-[10px] text-red-400">GPS refusé</span></>
              : <><MapPin size={12} className="text-slate-500" /><span className="text-[10px] text-slate-500">GPS inactif</span></>}
          </div>
        </div>
      </div>

      {/* Trip reference */}
      {tripReference && (
        <div className="px-4 mb-4">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Référence officielle</div>
            <div className="font-mono text-sm text-white font-bold">{tripReference}</div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
