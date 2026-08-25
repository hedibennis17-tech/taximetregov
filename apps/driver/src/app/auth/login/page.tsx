'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, Shield } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('mohamed.benali@example.com')
  const [password, setPassword] = useState('••••••••••••')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'login'|'mfa'>('login')
  const [mfaCode, setMfaCode] = useState('')

  const handleLogin = () => {
    setLoading(true)
    setTimeout(() => { setLoading(false); setStep('mfa') }, 1000)
  }
  const handleMfa = () => {
    setLoading(true)
    setTimeout(() => { setLoading(false); router.push('/home') }, 1000)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="px-6 pt-16 pb-8 text-center">
        <div className="w-20 h-20 rounded-3xl bg-qc-blue flex items-center justify-center mx-auto mb-4 text-4xl shadow-lg shadow-blue-900/50">
          ⚜
        </div>
        <h1 className="text-2xl font-bold text-white">TAXIMÈTRE.GOV</h1>
        <p className="text-sm text-slate-400 mt-1">Plateforme chauffeur — Québec</p>
      </div>

      <div className="flex-1 px-6">
        {step === 'login' ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-2">Courriel gouvernemental</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-white text-sm outline-none focus:border-qc-blue transition-colors"
                placeholder="votre@email.com"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-2">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-white text-sm outline-none focus:border-qc-blue transition-colors pr-12"
                  placeholder="••••••••••"
                />
                <button onClick={() => setShowPass(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              onClick={handleLogin} disabled={loading}
              className="w-full py-4 rounded-2xl bg-qc-blue text-white font-bold text-base hover:bg-qc-blue-dark active:scale-98 transition-all disabled:opacity-60 shadow-lg shadow-blue-900/40 mt-2">
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
            <div className="flex items-center gap-2 justify-center mt-2">
              <Shield size={13} className="text-slate-500" />
              <span className="text-xs text-slate-500">Connexion sécurisée — MFA requis</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-3">
                <Lock size={28} className="text-green-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Vérification MFA</h2>
              <p className="text-sm text-slate-400 mt-1">Entrez le code de votre application d'authentification</p>
            </div>
            <div>
              <input
                type="tel" value={mfaCode} onChange={e => setMfaCode(e.target.value.slice(0,6))}
                className="w-full px-4 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-white text-2xl font-mono text-center outline-none focus:border-qc-blue transition-colors tracking-[0.5em]"
                placeholder="000000" maxLength={6}
              />
            </div>
            <button
              onClick={handleMfa} disabled={loading || mfaCode.length < 6}
              className="w-full py-4 rounded-2xl bg-green-600 text-white font-bold text-base hover:bg-green-700 transition-all disabled:opacity-60">
              {loading ? 'Vérification...' : 'Vérifier'}
            </button>
            <button onClick={() => setStep('login')} className="w-full py-3 text-slate-400 text-sm">← Retour</button>
          </div>
        )}
      </div>

      <div className="px-6 pb-8 text-center">
        <p className="text-[10px] text-slate-600">TAXIMÈTRE.GOV — Pilote Québec 2026</p>
        <p className="text-[10px] text-slate-700">⚠ SIMULATION — Données de démonstration</p>
      </div>
    </div>
  )
}
