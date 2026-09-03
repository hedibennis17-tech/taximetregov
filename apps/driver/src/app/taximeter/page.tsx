'use client'

// ================================================================
// TAXIMÈTRE.GOV — TAXIMÈTRE NUMÉRIQUE PREMIUM
// Design: 7 segments · Québec bleu · Dark/Light · Rotation
// Architecture: API Backend · GPS réel · Calcul serveur
// ================================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Wifi, WifiOff, Navigation, NavigationOff,
  RotateCcw, Sun, Moon, ArrowLeft,
  Pause, Play, Square, Zap, AlertTriangle, CheckCircle
} from 'lucide-react'
import { getToken } from '@/lib/api'

// ─── TYPES ───────────────────────────────────────────────────

type Theme    = 'dark' | 'light'
type Orientation = 'portrait' | 'landscape'
type TripStatus = 'IDLE' | 'STARTING' | 'ACTIVE' | 'PAUSED' | 'STOPPING' | 'COMPLETED' | 'ERROR'
type TariffCode = 'VILLE_JOUR' | 'VILLE_NUIT' | 'AEROPORT_FIXE' | 'AEROPORT_PRISE' | 'BANLIEUE_JOUR' | 'AUTOROUTE' | 'ZONE_SPECIALE' | 'ATTENTE'

interface FareSnapshot {
  baseFare: string
  distanceRatePer100m: string
  timeRatePerMinute: string
  waitingRatePerMinute: string
  minimumFare: string
  airportSurcharge: string
  currency: string
  version: string
}

interface CompletedTrip {
  tripReference: string
  receiptReference: string
  finalAmount: number
  distanceMeters: number
  elapsedSeconds: number
  waitingSeconds: number
}

// ─── TARIFFS ─────────────────────────────────────────────────

const TARIFFS: Record<TariffCode, { label: string; icon: string; surcharge: number }> = {
  VILLE_JOUR:     { label: 'Ville — Jour',         icon: '🌆', surcharge: 0 },
  VILLE_NUIT:     { label: 'Ville — Nuit',         icon: '🌙', surcharge: 1.5 },
  AEROPORT_FIXE:  { label: 'Aéroport — Fixe',      icon: '✈️', surcharge: 0 },
  AEROPORT_PRISE: { label: 'Aéroport — Prise en charge', icon: '🛫', surcharge: 1.5 },
  BANLIEUE_JOUR:  { label: 'Banlieue — Jour',      icon: '🏘️', surcharge: 0 },
  AUTOROUTE:      { label: 'Autoroute',             icon: '🛣️', surcharge: 0 },
  ZONE_SPECIALE:  { label: 'Zone spéciale',         icon: '📍', surcharge: 2.0 },
  ATTENTE:        { label: 'Attente',               icon: '⏱️', surcharge: 0 },
}

// ─── HELPERS ─────────────────────────────────────────────────

function formatFare(n: number): string {
  const s = n.toFixed(2)
  const [int, dec] = s.split('.')
  return `${int?.padStart(4, ' ')}.${dec}`
}

function formatTime(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatDist(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(2)}` : `${Math.round(m)}`
}

function distUnit(m: number): string { return m >= 1000 ? 'km' : 'm' }

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function apiFetch(path: string, body?: unknown) {
  const token = getToken()
  const res = await fetch(path, {
    method: body !== undefined ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json() as { success: boolean; data: unknown; error?: string }
  if (!res.ok || !json.success) throw new Error(json.error ?? `Erreur ${res.status}`)
  return json.data
}

// ─── THEME TOKENS ─────────────────────────────────────────────

const T = {
  dark: {
    bg:         'bg-[#000E1A]',
    panel:      'bg-[#001428]',
    panelBorder:'border-[#1A3A5C]',
    fareBox:    'bg-black border-[#0047AB]',
    fareText:   'text-[#00FF88]',
    fareGlow:   'drop-shadow-[0_0_18px_rgba(0,255,136,0.7)]',
    label:      'text-[#4A8FCC]',
    value:      'text-white',
    dimText:    'text-[#2A5F8A]',
    tariffBtn:  'bg-[#001428] border-[#1A3A5C] text-white hover:border-[#0047AB]',
    tariffSel:  'bg-[#0047AB] border-[#0066DD] text-white',
    ctrlStart:  'bg-[#003DA5] hover:bg-[#0047AB] text-white',
    ctrlPause:  'bg-[#1A3A5C] hover:bg-[#243F62] text-[#4A8FCC]',
    ctrlStop:   'bg-[#3A0A0A] hover:bg-[#4A0A0A] text-[#FF4444] border border-[#FF4444]/30',
    statusBar:  'bg-[#000E1A] border-[#0A2440]',
    badge:      'bg-[#0047AB]/20 text-[#4A8FCC] border-[#0047AB]/40',
    infoSep:    'border-[#0A2440]',
    text:       'text-white',
  },
  light: {
    bg:         'bg-[#EEF4FF]',
    panel:      'bg-white',
    panelBorder:'border-[#B8D0F0]',
    fareBox:    'bg-[#001428] border-[#0047AB]',
    fareText:   'text-[#00FF88]',
    fareGlow:   'drop-shadow-[0_0_12px_rgba(0,255,136,0.5)]',
    label:      'text-[#5588BB]',
    value:      'text-[#001428]',
    dimText:    'text-[#8AAABB]',
    tariffBtn:  'bg-white border-[#B8D0F0] text-[#001428] hover:border-[#0047AB]',
    tariffSel:  'bg-[#0047AB] border-[#0066DD] text-white',
    ctrlStart:  'bg-[#003DA5] hover:bg-[#0047AB] text-white',
    ctrlPause:  'bg-[#DDEEFF] hover:bg-[#C8E0FF] text-[#0047AB]',
    ctrlStop:   'bg-[#FFEEEE] hover:bg-[#FFD8D8] text-[#CC2200] border border-[#CC2200]/30',
    statusBar:  'bg-white border-[#B8D0F0]',
    badge:      'bg-[#EEF4FF] text-[#0047AB] border-[#B8D0F0]',
    infoSep:    'border-[#D8E8FF]',
    text:       'text-[#001428]',
  }
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────

export default function TaxiMeterPage() {
  const router = useRouter()

  // Theme + orientation
  const [theme, setTheme] = useState<Theme>('dark')
  const [orientation, setOrientation] = useState<Orientation>('portrait')

  // Trip state
  const [tripStatus, setTripStatus]       = useState<TripStatus>('IDLE')
  const [tripReference, setTripReference] = useState<string | null>(null)
  const [tripId, setTripId]               = useState<string | null>(null)
  const [fareSnapshot, setFareSnapshot]   = useState<FareSnapshot | null>(null)
  const [fareVersion, setFareVersion]     = useState<string>('—')
  const [isPilot, setIsPilot]             = useState(true)
  const [selectedTariff, setSelectedTariff] = useState<TariffCode>('VILLE_JOUR')

  // Counters
  const [elapsedSec, setElapsedSec]   = useState(0)
  const [waitingSec, setWaitingSec]   = useState(0)
  const [distanceM, setDistanceM]     = useState(0)
  const [displayFare, setDisplayFare] = useState(0)
  const [speedKmh, setSpeedKmh]       = useState(0)

  // GPS
  const [gpsStatus, setGpsStatus] = useState<'unknown'|'ok'|'denied'|'weak'>('unknown')
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null)

  // UI
  const [error, setError]                     = useState<string | null>(null)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [completedTrip, setCompletedTrip]     = useState<CompletedTrip | null>(null)
  const [currentTime, setCurrentTime]         = useState('')
  const [currentDate, setCurrentDate]         = useState('')

  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const gpsRef     = useRef<number | null>(null)
  const prevPosRef = useRef<{ lat: number; lng: number } | null>(null)

  const tk = T[theme]
  const isActive = tripStatus === 'ACTIVE' || tripStatus === 'PAUSED'

  // ─── Clock ─────────────────────────────────────────────────

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      setCurrentDate(now.toLocaleDateString('fr-CA', { weekday: 'short', day: 'numeric', month: 'short' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // ─── Fare display ───────────────────────────────────────────

  useEffect(() => {
    if (!fareSnapshot) { setDisplayFare(0); return }
    const surcharge = TARIFFS[selectedTariff]?.surcharge ?? 0
    const base    = parseFloat(fareSnapshot.baseFare) + surcharge
    const dist    = (distanceM / 100) * parseFloat(fareSnapshot.distanceRatePer100m)
    const time    = (elapsedSec / 60)  * parseFloat(fareSnapshot.timeRatePerMinute)
    const wait    = (waitingSec / 60)  * parseFloat(fareSnapshot.waitingRatePerMinute)
    const sub     = base + dist + time + wait
    setDisplayFare(Math.max(sub, parseFloat(fareSnapshot.minimumFare)))
  }, [fareSnapshot, distanceM, elapsedSec, waitingSec, selectedTariff])

  // ─── Timer ─────────────────────────────────────────────────

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setElapsedSec(s => s + 1)
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  // ─── GPS ───────────────────────────────────────────────────

  const startGPS = useCallback((currentTripId: string) => {
    if (!navigator.geolocation) { setGpsStatus('denied'); return }
    gpsRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const acc = pos.coords.accuracy
        setGpsAccuracy(acc)
        setGpsStatus(acc < 30 ? 'ok' : 'weak')
        setSpeedKmh(Math.round((pos.coords.speed ?? 0) * 3.6))
        const { latitude: lat, longitude: lng } = pos.coords
        if (prevPosRef.current && tripStatus !== 'PAUSED') {
          const delta = haversine(prevPosRef.current.lat, prevPosRef.current.lng, lat, lng)
          if (delta > 3 && delta < 300) {
            setDistanceM(d => d + delta)
            void apiFetch('/api/taximeter/gps', {
              tripId: currentTripId, latitude: lat, longitude: lng,
              accuracy: acc, speedKmh: (pos.coords.speed ?? 0) * 3.6, distanceDelta: Math.round(delta),
            }).catch(() => null)
          }
        }
        prevPosRef.current = { lat, lng }
      },
      () => setGpsStatus('denied'),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    )
  }, [tripStatus])

  const stopGPS = useCallback(() => {
    if (gpsRef.current !== null) { navigator.geolocation.clearWatch(gpsRef.current); gpsRef.current = null }
  }, [])

  useEffect(() => () => { stopTimer(); stopGPS() }, [stopTimer, stopGPS])

  // ─── Detect real orientation ────────────────────────────────

  useEffect(() => {
    const check = () => {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait')
    }
    check()
    window.addEventListener('resize', check)
    screen.orientation?.addEventListener('change', check)
    return () => {
      window.removeEventListener('resize', check)
      screen.orientation?.removeEventListener('change', check)
    }
  }, [])

  // ─── Check active trip on mount ─────────────────────────────

  useEffect(() => {
    void (async () => {
      try {
        const token = getToken()
        if (!token) return  // Pas de session — ne pas appeler l'API
        // Si erreur 401/404, rester en IDLE silencieusement
        const data = await apiFetch('/api/taximeter/status') as {
          hasActiveMeter: boolean
          taximeter: { active_trip: { id: string; tripReference: string; status: string; distanceMeters: number; elapsedSeconds: number } | null; fare_version: string } | null
        }
        if (data.hasActiveMeter && data.taximeter?.active_trip) {
          const t = data.taximeter.active_trip
          setTripReference(t.tripReference)
          setTripId(t.id)
          setDistanceM(t.distanceMeters)
          setElapsedSec(t.elapsedSeconds)
          setFareVersion(data.taximeter.fare_version ?? '—')
          setTripStatus(t.status === 'PAUSED' ? 'PAUSED' : 'ACTIVE')
          if (t.status !== 'PAUSED') { startTimer(); startGPS(t.id) }
        }
      } catch { /* no active trip */ }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Actions ────────────────────────────────────────────────

  async function startTrip() {
    setError(null); setTripStatus('STARTING')
    try {
      const data = await apiFetch('/api/taximeter/start', {}) as {
        tripReference: string; fareVersion: string
        fareSnapshot: FareSnapshot; isPilot: boolean
        taximeter: { id: string } | null
      }
      const resolvedId = (data as unknown as { taximeterId?: string }).taximeterId ?? data.tripReference ?? 'unknown'
      setTripReference(data.tripReference)
      setFareVersion(data.fareVersion)
      setFareSnapshot(data.fareSnapshot)
      setIsPilot(data.isPilot)
      setTripId(resolvedId)
      setElapsedSec(0); setDistanceM(0); setWaitingSec(0)
      setTripStatus('ACTIVE')
      startTimer(); startGPS(resolvedId)
    } catch (e) { setError((e as Error).message); setTripStatus('IDLE') }
  }

  async function pauseTrip() {
    if (!tripReference) return
    try {
      if (tripStatus === 'ACTIVE') {
        await apiFetch('/api/taximeter/pause', { tripReference })
        setTripStatus('PAUSED'); stopTimer(); stopGPS()
      } else {
        await apiFetch('/api/taximeter/resume', { tripReference })
        setTripStatus('ACTIVE'); startTimer()
        if (tripId) startGPS(tripId)
      }
    } catch (e) { setError((e as Error).message) }
  }

  async function stopTrip() {
    if (!tripReference) return
    setTripStatus('STOPPING'); stopTimer(); stopGPS()
    try {
      const data = await apiFetch('/api/taximeter/stop', {
        tripReference,
        distanceMeters: Math.round(distanceM),
        elapsedSeconds: elapsedSec,
        waitingSeconds: waitingSec,
        isAirportTrip: selectedTariff === 'AEROPORT_FIXE' || selectedTariff === 'AEROPORT_PRISE',
      }) as CompletedTrip
      setCompletedTrip(data); setTripStatus('COMPLETED')
      setTripReference(null); setFareSnapshot(null)
    } catch (e) { setError((e as Error).message); setTripStatus('ACTIVE'); startTimer() }
  }

  function resetForNewTrip() {
    setCompletedTrip(null); setTripStatus('IDLE')
    setElapsedSec(0); setDistanceM(0); setWaitingSec(0); setDisplayFare(0)
  }

  function handleBack() {
    if (isActive) setShowLeaveConfirm(true)
    else router.push('/home')
  }

  // ─── TPS/TVQ ────────────────────────────────────────────────

  const tps = displayFare * 0.05
  const tvq = displayFare * 0.09975
  const total = displayFare + tps + tvq

  // ─── COMPLETED SCREEN ─────────────────────────────────────

  if (tripStatus === 'COMPLETED' && completedTrip) {
    const tpsC = completedTrip.finalAmount * 0.05
    const tvqC = completedTrip.finalAmount * 0.09975
    const totalC = completedTrip.finalAmount + tpsC + tvqC

    return (
      <div className={`min-h-screen ${tk.bg} ${tk.text} flex flex-col items-center justify-center p-6 space-grotesk`}>
        <div className="w-full max-w-sm">

          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-xs font-bold tracking-[0.3em] text-[#4A8FCC] mb-1">TAXIMETER.GOV</div>
            <div className="text-xs text-[#4A8FCC]/60">REÇU DE COURSE</div>
          </div>

          {/* Final amount */}
          <div className={`rounded-2xl border-2 ${tk.fareBox} p-6 text-center mb-4`}>
            <div className="text-xs text-[#4A8FCC] mb-2 tracking-widest">TOTAL PAYÉ</div>
            <div className={`dseg text-6xl font-bold ${tk.fareText} ${tk.fareGlow}`}>
              {formatFare(completedTrip.finalAmount)}
            </div>
            <div className="text-xs text-[#4A8FCC] mt-1">CAD $</div>
          </div>

          {/* Tax breakdown */}
          <div className={`rounded-xl border ${tk.panelBorder} ${tk.panel} p-4 mb-4`}>
            {[
              { label: 'Sous-total', val: `${completedTrip.finalAmount.toFixed(2)} $` },
              { label: 'TPS (5 %)',  val: `${tpsC.toFixed(2)} $` },
              { label: 'TVQ (9,975 %)', val: `${tvqC.toFixed(2)} $` },
            ].map(r => (
              <div key={r.label} className={`flex justify-between py-2 border-b ${tk.infoSep} last:border-0 text-xs`}>
                <span className={tk.label}>{r.label}</span>
                <span className={`font-bold space-mono ${tk.value}`}>{r.val}</span>
              </div>
            ))}
            <div className="flex justify-between pt-3 text-sm font-bold">
              <span className="text-[#0047AB]">TOTAL TTC</span>
              <span className={`space-mono ${tk.fareText}`}>{totalC.toFixed(2)} $</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[
              { label: 'Distance', val: `${(completedTrip.distanceMeters / 1000).toFixed(2)} km` },
              { label: 'Durée',    val: formatTime(completedTrip.elapsedSeconds) },
              { label: 'Attente',  val: formatTime(completedTrip.waitingSeconds) },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border ${tk.panelBorder} ${tk.panel} p-3 text-center`}>
                <div className={`font-bold text-sm space-mono ${tk.value}`}>{s.val}</div>
                <div className={`text-[10px] mt-0.5 ${tk.label}`}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Ref */}
          <div className={`text-center text-[10px] ${tk.label} mb-6`}>
            <div>Réf. officielle</div>
            <div className={`font-mono font-bold ${tk.value}`}>{completedTrip.tripReference}</div>
          </div>

          {/* Actions */}
          <button onClick={resetForNewTrip}
            className="w-full py-4 rounded-2xl bg-[#003DA5] hover:bg-[#0047AB] text-white font-bold tracking-wide transition-all mb-3">
            ▶ NOUVELLE COURSE
          </button>
          <button onClick={() => router.push('/home')}
            className={`w-full py-3 rounded-2xl text-sm ${tk.label} transition-all`}>
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  // ─── LEAVE CONFIRM MODAL ────────────────────────────────────

  const LeaveModal = () => (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6">
      <div className={`w-full max-w-sm rounded-2xl border-2 border-[#0047AB] ${tk.panel} p-6`}>
        <div className="text-center mb-6">
          <AlertTriangle size={32} className="mx-auto text-amber-400 mb-3" />
          <h2 className="text-lg font-bold text-white">⚠️ Course active</h2>
          <p className={`text-sm mt-2 ${tk.label}`}>
            Voulez-vous quitter le taximètre ?<br />
            La course reste active et sécurisée côté serveur.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setShowLeaveConfirm(false)}
            className={`py-3 rounded-xl border ${tk.panelBorder} ${tk.panel} text-sm font-semibold ${tk.value}`}>
            Annuler
          </button>
          <button onClick={() => router.push('/home')}
            className="py-3 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-400 text-sm font-semibold">
            Quitter
          </button>
        </div>
      </div>
    </div>
  )

  // ─── GPS SIGNAL BARS ────────────────────────────────────────

  const GpsSignal = () => {
    const strength = gpsStatus === 'ok' ? 3 : gpsStatus === 'weak' ? 1 : 0
    return (
      <div className="flex items-end gap-[2px]">
        {[1, 2, 3].map(i => (
          <div key={i} className={`w-[3px] rounded-sm transition-colors ${i <= strength ? 'bg-[#00FF88]' : 'bg-[#1A3A5C]'}`}
            style={{ height: `${4 + i * 3}px` }} />
        ))}
      </div>
    )
  }

  // ─── STATUS BADGE ───────────────────────────────────────────

  const statusMap: Record<TripStatus, { label: string; color: string; dot: string }> = {
    IDLE:     { label: 'DISPONIBLE',  color: 'text-[#4A8FCC]',  dot: 'bg-[#4A8FCC]' },
    STARTING: { label: 'DÉMARRAGE…', color: 'text-amber-400',  dot: 'bg-amber-400 animate-pulse' },
    ACTIVE:   { label: 'EN COURSE',   color: 'text-[#00FF88]',  dot: 'bg-[#00FF88]' },
    PAUSED:   { label: 'EN ATTENTE',  color: 'text-amber-400',  dot: 'bg-amber-400 animate-pulse' },
    STOPPING: { label: 'FERMETURE…', color: 'text-red-400',    dot: 'bg-red-400 animate-pulse' },
    COMPLETED:{ label: 'TERMINÉE',   color: 'text-[#00FF88]',  dot: 'bg-[#00FF88]' },
    ERROR:    { label: 'ERREUR',      color: 'text-red-400',    dot: 'bg-red-500' },
  }
  const st = statusMap[tripStatus]

  // ─── TARIFF PANEL ───────────────────────────────────────────

  const TariffPanel = ({ vertical = false }) => (
    <div className={`${vertical ? 'flex flex-col gap-2' : 'grid grid-cols-2 gap-2'}`}>
      {(Object.entries(TARIFFS) as [TariffCode, typeof TARIFFS[TariffCode]][]).map(([code, t]) => (
        <button
          key={code}
          disabled={isActive && code !== selectedTariff}
          onClick={() => setSelectedTariff(code)}
          className={`px-3 py-2.5 rounded-xl border text-left transition-all text-xs font-semibold
            ${selectedTariff === code ? tk.tariffSel : tk.tariffBtn}
            ${isActive && code !== selectedTariff ? 'opacity-40 cursor-not-allowed' : ''}
          `}
        >
          <span className="mr-1.5">{t.icon}</span>
          {t.label}
          {t.surcharge > 0 && <span className="ml-1 text-[9px] opacity-70">+{t.surcharge}$</span>}
        </button>
      ))}
    </div>
  )

  // ─── INFO PANEL ─────────────────────────────────────────────

  const InfoPanel = ({ horizontal = false }) => {
    const items = [
      { label: 'VITESSE',   val: `${speedKmh}`, unit: 'km/h', big: true },
      { label: 'DISTANCE',  val: formatDist(distanceM), unit: distUnit(distanceM) },
      { label: 'DURÉE',     val: formatTime(elapsedSec), unit: '' },
      { label: 'ATTENTE',   val: formatTime(waitingSec), unit: '' },
      { label: 'DATE',      val: currentDate, unit: '' },
    ]
    return (
      <div className={`${horizontal ? 'flex gap-3' : 'space-y-3'}`}>
        {items.map(item => (
          <div key={item.label} className={`${horizontal ? 'flex-1' : ''}`}>
            <div className={`text-[9px] tracking-[0.2em] ${tk.dimText}`}>{item.label}</div>
            <div className={`space-mono font-bold ${item.big ? 'text-2xl text-[#00FF88]' : 'text-sm'} ${tk.value} leading-tight`}>
              {item.val}
              {item.unit && <span className={`text-[9px] ml-1 ${tk.label}`}>{item.unit}</span>}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ─── CONTROLS ───────────────────────────────────────────────

  const Controls = () => (
    <div className="space-y-2">
      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          <AlertTriangle size={12} /> {error}
        </div>
      )}

      {!isActive ? (
        <button onClick={() => void startTrip()} disabled={tripStatus === 'STARTING'}
          className={`w-full py-5 rounded-2xl font-bold text-lg tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 ${tk.ctrlStart} space-grotesk`}>
          {tripStatus === 'STARTING' ? '⏳ DÉMARRAGE…' : '▶ DÉMARRER LA COURSE'}
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => void pauseTrip()}
            className={`py-4 rounded-2xl font-bold text-sm tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${tk.ctrlPause}`}>
            {tripStatus === 'PAUSED'
              ? <><Play size={16} /> REPRENDRE</>
              : <><Pause size={16} /> PAUSE</>}
          </button>
          <button onClick={() => void stopTrip()} disabled={(tripStatus as string) === 'STOPPING'}
            className={`py-4 rounded-2xl font-bold text-sm tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 ${tk.ctrlStop}`}>
            <Square size={16} />
            {String(tripStatus) === 'STOPPING' ? 'ENVOI…' : 'FIN DE COURSE'}
          </button>
        </div>
      )}
    </div>
  )

  // ─── TOP BAR ────────────────────────────────────────────────

  const TopBar = () => (
    <div className={`flex items-center justify-between px-3 py-2 border-b ${tk.statusBar} ${tk.panelBorder} gap-2 min-h-[48px]`}>
      {/* Left: back + logo */}
      <div className="flex items-center gap-3">
        <button onClick={handleBack} className={`flex items-center gap-1.5 text-xs ${tk.label} hover:${tk.value} transition-colors`}>
          <ArrowLeft size={15} /> Accueil
        </button>
        <div className="h-4 w-px bg-current opacity-20" />
        <div>
          <span className={`text-[9px] font-black tracking-[0.25em] text-[#0047AB]`}>TAXIMETER</span>
          <span className={`text-[9px] font-black tracking-[0.25em] text-[#4A8FCC]`}>.GOV</span>
        </div>
      </div>

      {/* Center: status */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className={`w-2 h-2 rounded-full ${st.dot}`} />
        <span className={`text-[10px] font-bold tracking-widest ${st.color}`}>{st.label}</span>
      </div>

      {/* Right: time + controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <span className={`space-mono text-[11px] font-bold tabular-nums ${tk.value} whitespace-nowrap`}>{currentTime}</span>
          <GpsSignal />
        </div>
        {/* Orientation toggle */}
        <button onClick={() => setOrientation(o => o === 'portrait' ? 'landscape' : 'portrait')}
          className={`p-1.5 rounded-lg border ${tk.panelBorder} ${tk.label} transition-colors`} title="Rotation">
          <RotateCcw size={13} />
        </button>
        {/* Theme toggle */}
        <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          className={`p-1.5 rounded-lg border ${tk.panelBorder} ${tk.label} transition-colors`}>
          {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
        </button>
      </div>
    </div>
  )

  // ─── FARE BOX ───────────────────────────────────────────────

  const FareBox = () => (
    <div className={`rounded-2xl border-2 ${tk.fareBox} p-4 relative overflow-hidden`}>
      {/* Scan line animation */}
      {isActive && tripStatus === 'ACTIVE' && (
        <div className="absolute inset-x-0 top-0 h-px bg-[#00FF88]/30 animate-[scan_2s_linear_infinite]" />
      )}
      <div className={`text-[10px] tracking-[0.3em] text-center mb-2 ${gpsStatus === 'ok' ? 'text-[#4A8FCC]' : 'text-amber-400'}`}>
        TOTAL À PAYER — CAD $
      </div>
      <div className={`dseg text-center font-bold ${tk.fareText} ${tk.fareGlow} leading-none`}
        style={{ fontSize: 'clamp(48px, 12vw, 80px)', letterSpacing: '0.05em' }}>
        {formatFare(isActive || displayFare > 0 ? displayFare : 0)}
      </div>
      {/* TPS/TVQ */}
      {(isActive || displayFare > 0) && (
        <div className="flex justify-center gap-4 mt-2">
          <span className={`text-[9px] space-mono ${tk.dimText}`}>TPS {tps.toFixed(2)}</span>
          <span className={`text-[9px] space-mono ${tk.dimText}`}>TVQ {tvq.toFixed(2)}</span>
          <span className={`text-[9px] space-mono text-[#00CC66]`}>TTC {total.toFixed(2)}$</span>
        </div>
      )}
      {/* Fare version */}
      {fareVersion !== '—' && (
        <div className={`text-[8px] text-center mt-1 ${tk.dimText}`}>{fareVersion}{isPilot && ' · PILOTE'}</div>
      )}
    </div>
  )

  // ─── PILOT BANNER ───────────────────────────────────────────

  const PilotBanner = () => isPilot ? (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
      <Zap size={10} className="text-amber-400 shrink-0" />
      <span className="text-[9px] text-amber-400 font-medium">Mode pilote · Calcul officiel côté serveur</span>
    </div>
  ) : null

  // ─── TRIP REF ───────────────────────────────────────────────

  const TripRef = () => tripReference ? (
    <div className={`text-center text-[9px] ${tk.dimText}`}>
      <span className="tracking-widest">RÉF. OFFICIELLE </span>
      <span className={`space-mono font-bold ${tk.value}`}>{tripReference}</span>
    </div>
  ) : null

  // ─── PORTRAIT LAYOUT ────────────────────────────────────────

  if (orientation === 'portrait') {
    return (
      <div className={`min-h-screen ${tk.bg} flex flex-col space-grotesk`}>
        {showLeaveConfirm && <LeaveModal />}
        <TopBar />

        <div className="flex-1 px-4 py-3 space-y-3 overflow-y-auto">
          <FareBox />
          <PilotBanner />

          {/* Info row */}
          <div className={`grid grid-cols-4 gap-2 px-1`}>
            {[
              { label: 'km/h',  val: String(speedKmh) },
              { label: 'km',    val: formatDist(distanceM) },
              { label: 'durée', val: formatTime(elapsedSec) },
              { label: 'attente', val: formatTime(waitingSec) },
            ].map(item => (
              <div key={item.label} className={`rounded-xl border ${tk.panelBorder} ${tk.panel} p-2 text-center`}>
                <div className={`space-mono font-bold text-sm ${tk.value}`}>{item.val}</div>
                <div className={`text-[9px] ${tk.label}`}>{item.label}</div>
              </div>
            ))}
          </div>

          <Controls />
          <TripRef />

          {/* Tariffs */}
          <div>
            <div className={`text-[9px] tracking-[0.25em] ${tk.dimText} mb-2`}>TARIFS & SERVICES</div>
            <TariffPanel />
          </div>
        </div>

        {/* Bottom GPS bar */}
        <div className={`px-4 py-2 border-t ${tk.statusBar} ${tk.panelBorder} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            {gpsStatus === 'ok'
              ? <Navigation size={12} className="text-[#00FF88]" />
              : <NavigationOff size={12} className="text-red-400" />}
            <span className={`text-[10px] space-mono ${gpsStatus === 'ok' ? 'text-[#00FF88]' : 'text-red-400'}`}>
              GPS {gpsStatus === 'ok' ? 'ACTIF' : gpsStatus === 'denied' ? 'REFUSÉ' : gpsStatus === 'weak' ? 'FAIBLE' : 'INACTIF'}
            </span>
            {gpsAccuracy && <span className={`text-[9px] ${tk.dimText}`}>±{Math.round(gpsAccuracy)}m</span>}
          </div>
          <div className="flex items-center gap-1">
            <Wifi size={11} className="text-[#0047AB]" />
            <span className={`text-[9px] ${tk.label}`}>Connecté · Supabase</span>
          </div>
        </div>
      </div>
    )
  }

  // ─── LANDSCAPE LAYOUT ────────────────────────────────────────

  return (
    <div className={`min-h-screen ${tk.bg} flex flex-col space-grotesk`}>
      {showLeaveConfirm && <LeaveModal />}
      <TopBar />

      <div className="flex-1 flex gap-3 px-3 py-3 overflow-hidden">
        {/* Left panel — infos */}
        <div className={`w-36 shrink-0 rounded-2xl border ${tk.panelBorder} ${tk.panel} p-3 flex flex-col gap-3`}>
          {/* Speed */}
          <div className="text-center">
            <div className={`dseg text-4xl font-bold text-[#00FF88] ${tk.fareGlow}`}>{speedKmh}</div>
            <div className={`text-[9px] tracking-widest ${tk.dimText}`}>km/h</div>
          </div>
          <div className={`border-t ${tk.infoSep}`} />
          <InfoPanel />
          <div className={`border-t ${tk.infoSep}`} />
          {/* GPS */}
          <div className="flex flex-col items-center gap-1">
            <GpsSignal />
            <span className={`text-[9px] ${gpsStatus === 'ok' ? 'text-[#00FF88]' : 'text-amber-400'}`}>
              {gpsStatus === 'ok' ? 'GPS FORT' : gpsStatus === 'weak' ? 'GPS FAIBLE' : 'GPS —'}
            </span>
          </div>
        </div>

        {/* Centre — fare + controls */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <FareBox />
          <PilotBanner />
          <Controls />
          <TripRef />
        </div>

        {/* Right panel — tariffs */}
        <div className={`w-44 shrink-0 rounded-2xl border ${tk.panelBorder} ${tk.panel} p-3`}>
          <div className={`text-[9px] tracking-[0.25em] ${tk.dimText} mb-2`}>TARIFS</div>
          <TariffPanel vertical />
        </div>
      </div>

      {/* GPS bar */}
      <div className={`px-4 py-1.5 border-t ${tk.statusBar} ${tk.panelBorder} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Navigation size={11} className={gpsStatus === 'ok' ? 'text-[#00FF88]' : 'text-amber-400'} />
          <span className={`text-[9px] space-mono ${gpsStatus === 'ok' ? 'text-[#00FF88]' : 'text-amber-400'}`}>
            GPS {gpsStatus === 'ok' ? 'ACTIF' : 'FAIBLE'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wifi size={10} className="text-[#0047AB]" />
          <span className={`text-[9px] ${tk.label}`}>Connecté · Supabase</span>
        </div>
      </div>
    </div>
  )
}
