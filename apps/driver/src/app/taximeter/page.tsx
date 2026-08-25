'use client'
import { AppShell } from '@/components/layout/AppShell'
import { useState, useEffect, useRef } from 'react'
import { fareConfig, taxiMeterSession, mockVehicle, mockDriver } from '@/data/driver.mock'
import { MapPin, Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react'

type TripStatus = 'AVAILABLE' | 'PASSENGER_ENTERING' | 'ACTIVE' | 'COMPLETING' | 'COMPLETED'

function formatCurrency(v: number) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(v)
}
function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

export default function TaximeterPage() {
  const [status, setStatus] = useState<TripStatus>('AVAILABLE')
  const [elapsed, setElapsed] = useState(0)
  const [distanceKm, setDistanceKm] = useState(0)
  const [fare, setFare] = useState(fareConfig.baseFare)
  const [gpsAccuracy, setGpsAccuracy] = useState(4)
  const [paymentMethod, setPaymentMethod] = useState<string|null>(null)
  const timerRef = useRef<NodeJS.Timeout|null>(null)

  // Simulate GPS + fare accumulation
  useEffect(() => {
    if (status === 'ACTIVE') {
      timerRef.current = setInterval(() => {
        setElapsed(e => e + 1)
        setDistanceKm(d => {
          const newD = d + 0.012 + Math.random() * 0.008 // ~50km/h avg
          return Math.round(newD * 1000) / 1000
        })
        setGpsAccuracy(3 + Math.round(Math.random() * 4))
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [status])

  // Recalculate fare
  useEffect(() => {
    const distF = distanceKm * fareConfig.perKmRate
    const timeF = (elapsed / 60) * fareConfig.perMinuteRate
    const total = Math.max(fareConfig.baseFare + distF + timeF, fareConfig.minimumFare)
    setFare(Math.round(total * 100) / 100)
  }, [distanceKm, elapsed])

  const tps = Math.round(fare * fareConfig.tpsRate * 100) / 100
  const tvq = Math.round(fare * fareConfig.tvqRate * 100) / 100
  const total = fare + tps + tvq

  const reset = () => {
    setStatus('AVAILABLE')
    setElapsed(0)
    setDistanceKm(0)
    setFare(fareConfig.baseFare)
    setPaymentMethod(null)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col qc-watermark">
      {/* Status bar */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-500 font-mono">{mockVehicle.meterInstanceId}</div>
          <div className="text-xs font-bold text-qc-blue-light">TAXIMÈTRE CERTIFIÉ</div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold ${gpsAccuracy <= 5 ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
            <MapPin size={10} />
            GPS {gpsAccuracy}m
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold">
            <Wifi size={10} /> En ligne
          </div>
        </div>
      </div>

      {/* MAIN DISPLAY */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">

        {/* AVAILABLE state */}
        {status === 'AVAILABLE' && (
          <div className="w-full max-w-sm text-center">
            <div className="mb-8">
              <div className="text-6xl mb-4">🚕</div>
              <div className="text-2xl font-bold text-white mb-1">DISPONIBLE</div>
              <div className="text-sm text-slate-400">En attente d'un passager</div>
            </div>
            <div className="bg-slate-900 rounded-3xl p-6 mb-6 border border-slate-800">
              <div className="text-xs text-slate-500 mb-1">Prise en charge</div>
              <div className="text-4xl font-bold text-white taxi-display mb-1">{formatCurrency(fareConfig.baseFare)}</div>
              <div className="text-xs text-slate-500">Tarif de base — {fareConfig.jurisdiction}</div>
            </div>
            <button onClick={() => setStatus('PASSENGER_ENTERING')}
              className="w-full py-5 rounded-3xl bg-green-600 text-white font-bold text-xl hover:bg-green-500 active:scale-98 transition-all shadow-2xl shadow-green-900/50">
              PASSAGER MONTE
            </button>
            <div className="mt-3 text-[10px] text-slate-600 text-center">
              Taximètre v{mockVehicle.meterVersion} · Certifié {mockVehicle.meterCertExpiry}
            </div>
          </div>
        )}

        {/* PASSENGER ENTERING state */}
        {status === 'PASSENGER_ENTERING' && (
          <div className="w-full max-w-sm text-center">
            <div className="text-5xl mb-4 animate-bounce">🚶</div>
            <div className="text-xl font-bold text-white mb-2">PASSAGER EN MONTÉE</div>
            <div className="text-sm text-slate-400 mb-8">Prêt à démarrer la course</div>
            <div className="bg-slate-900 rounded-3xl p-6 mb-6 border border-green-500/30">
              <div className="text-xs text-slate-500 mb-1">Prise en charge</div>
              <div className="text-5xl font-bold text-white taxi-display">{formatCurrency(fareConfig.baseFare)}</div>
            </div>
            <div className="flex gap-3">
              <button onClick={reset} className="flex-1 py-4 rounded-2xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-all">
                Annuler
              </button>
              <button onClick={() => setStatus('ACTIVE')}
                className="flex-1 py-4 rounded-2xl bg-qc-blue text-white font-bold text-lg hover:bg-qc-blue-dark active:scale-98 transition-all shadow-lg">
                DÉMARRER
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE TRIP - Main taximeter display */}
        {status === 'ACTIVE' && (
          <div className="w-full max-w-sm">
            {/* Big fare display */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-driver-green pulse-green" />
                <span className="text-xs font-bold text-green-400 tracking-widest">TAXIMÈTRE ACTIF</span>
              </div>
              <div className="text-7xl font-black text-white taxi-display leading-none mb-2">
                {formatCurrency(fare).replace('CA', '').replace('\u00a0', ' ')}
              </div>
              <div className="text-lg text-slate-400 taxi-display">{formatCurrency(fare)}</div>
            </div>

            {/* Trip metrics */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 text-center">
                <div className="text-2xl font-bold text-white taxi-display">{distanceKm.toFixed(2)}</div>
                <div className="text-xs text-slate-500">km</div>
              </div>
              <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 text-center">
                <div className="text-2xl font-bold text-white taxi-display">{formatTime(elapsed)}</div>
                <div className="text-xs text-slate-500">durée</div>
              </div>
            </div>

            {/* Tax preview */}
            <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800 mb-6">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Tarif</span><span className="text-white font-mono">{formatCurrency(fare)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>TPS (5%)</span><span className="text-white font-mono">{formatCurrency(tps)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>TVQ (9.975%)</span><span className="text-white font-mono">{formatCurrency(tvq)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-slate-700 pt-2">
                <span className="text-white">Total</span><span className="text-green-400 font-mono taxi-display">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* GPS */}
            <div className="flex items-center gap-2 mb-6 px-1">
              <MapPin size={13} className={gpsAccuracy <= 5 ? 'text-green-400' : 'text-amber-400'} />
              <span className="text-xs text-slate-400">GPS · Précision {gpsAccuracy}m · Montréal</span>
            </div>

            <button onClick={() => setStatus('COMPLETING')}
              className="w-full py-5 rounded-3xl bg-driver-red text-white font-bold text-xl hover:bg-red-600 active:scale-98 transition-all shadow-2xl shadow-red-900/50">
              ARRÊTER LA COURSE
            </button>
          </div>
        )}

        {/* COMPLETING - Payment selection */}
        {status === 'COMPLETING' && (
          <div className="w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="text-xl font-bold text-white mb-1">COURSE TERMINÉE</div>
              <div className="text-4xl font-black text-green-400 taxi-display mb-1">{formatCurrency(total)}</div>
              <div className="text-sm text-slate-400">{distanceKm.toFixed(2)} km · {formatTime(elapsed)}</div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-4 mb-5 border border-slate-800 space-y-2">
              {[['Tarif',formatCurrency(fare)],['TPS',formatCurrency(tps)],['TVQ',formatCurrency(tvq)]].map(([l,v])=>(
                <div key={l} className="flex justify-between text-sm"><span className="text-slate-400">{l}</span><span className="text-white font-mono">{v}</span></div>
              ))}
              <div className="flex justify-between text-base font-bold border-t border-slate-700 pt-2">
                <span className="text-white">Total TTC</span><span className="text-green-400 font-mono">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Mode de paiement</div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[['Carte','💳'],['Interac','🏦'],['Comptant','💵'],['Portefeuille','📱']].map(([m,i])=>(
                <button key={m} onClick={() => setPaymentMethod(m)}
                  className={`py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all border
                    ${paymentMethod===m ? 'bg-qc-blue border-qc-blue text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'}`}>
                  {i} {m}
                </button>
              ))}
            </div>

            <button disabled={!paymentMethod} onClick={() => setStatus('COMPLETED')}
              className="w-full py-4 rounded-2xl bg-green-600 text-white font-bold text-lg disabled:opacity-40 hover:bg-green-500 transition-all">
              CONFIRMER LE PAIEMENT
            </button>
          </div>
        )}

        {/* COMPLETED */}
        {status === 'COMPLETED' && (
          <div className="w-full max-w-sm text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={36} className="text-green-400" />
            </div>
            <div className="text-xl font-bold text-white mb-1">Course enregistrée</div>
            <div className="text-4xl font-black text-green-400 taxi-display mb-2">{formatCurrency(total)}</div>
            <div className="text-sm text-slate-400 mb-2">{paymentMethod} · {distanceKm.toFixed(2)} km</div>
            <div className="text-[10px] text-slate-500 mb-8">Transaction envoyée au Ledger · TPS/TVQ calculées · Audit enregistré</div>
            <div className="bg-slate-900 rounded-2xl p-4 mb-6 border border-slate-800 text-left space-y-2">
              <div className="flex justify-between text-xs"><span className="text-slate-500">ID Transaction</span><span className="font-mono text-qc-blue-light">TXN-TAXI-{Date.now().toString().slice(-6)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">Plateforme</span><span className="text-white">Taximètre.GOV</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">Paiement</span><span className="text-white">{paymentMethod}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">Statut Ledger</span><span className="text-green-400 font-bold">CONFIRMÉ</span></div>
            </div>
            <button onClick={reset} className="w-full py-4 rounded-2xl bg-qc-blue text-white font-bold text-lg hover:bg-qc-blue-dark transition-all">
              NOUVELLE COURSE
            </button>
          </div>
        )}
      </div>

      {/* Bottom safe area */}
      <div className="pb-24" />
    </div>
  )
}
