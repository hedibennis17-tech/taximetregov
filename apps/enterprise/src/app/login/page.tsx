'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, getSession } from '@/lib/supabase/auth'

export default function LoginPage() {
  const router  = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [mounted, setMounted] = useState(false)

  // Rediriger si déjà connecté
  useEffect(() => {
    setMounted(true)
    getSession().then(s => {
      if (s) router.replace('/')
    }).catch(() => {})
  }, [router])

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signIn(email, password)
      router.replace('/')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de connexion'
      // Traduction des messages Supabase
      if (msg.includes('Invalid login') || msg.includes('invalid_credentials')) {
        setError('Identifiants incorrects · Vérifiez votre courriel et mot de passe')
      } else if (msg.includes('Email not confirmed')) {
        setError('Courriel non confirmé · Vérifiez votre boîte mail')
      } else {
        setError(msg)
      }
      setLoading(false)
    }
  }

  const QUICK = [
    {email:'hedibenns21@gmail.com',                         name:'Hedi Bennis',       role:'SUPER_ADMIN'},
    {email:'s.marchand@uber-demo.taximetergov.demo',         name:'Sophie Marchand',   role:'OWNER'},
    {email:'jp.roy@uber-demo.taximetergov.demo',             name:'Jean-Philippe Roy', role:'FINANCE'},
  ]

  if (!mounted) return null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{background:'#f1f5f9'}}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-xl" style={{fontFamily:'system-ui',letterSpacing:'-0.02em'}}>T</span>
            </div>
            <div className="text-left">
              <div className="text-lg font-black text-slate-900" style={{letterSpacing:'-0.02em'}}>TAXIMETER.GOV</div>
              <div className="text-[10px] font-bold text-slate-500">Enterprise Gov</div>
            </div>
          </div>
          <div className="inline-block text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
            ⚠️ MODE DÉMO · DONNÉES SYNTHÉTIQUES · PILOTE
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 pt-6 pb-5">
            <div className="text-sm font-black text-slate-800 mb-4">Connexion</div>

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Courriel</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  autoComplete="email"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none text-slate-800 bg-slate-50 focus:border-black transition-colors"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none text-slate-800 bg-slate-50 focus:border-black transition-colors"
                />
              </div>

              {error && (
                <div className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  ❌ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-black text-white cursor-pointer disabled:opacity-60 transition-opacity"
                style={{background:'#000'}}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                    Connexion…
                  </span>
                ) : 'Se connecter'}
              </button>
            </form>
          </div>

          {/* Accès rapide DEMO */}
          <div className="px-6 pb-6 pt-3 border-t border-slate-100">
            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-2">Accès rapide · DÉMO</div>
            <div className="space-y-1.5">
              {QUICK.map(u => (
                <button
                  key={u.email}
                  onClick={() => { setEmail(u.email); setError('') }}
                  className="w-full text-left px-3 py-2.5 rounded-xl border transition-all cursor-pointer hover:border-slate-400"
                  style={{
                    background: email === u.email ? '#f8fafc' : 'white',
                    borderColor: email === u.email ? '#000' : '#e2e8f0',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-black shrink-0"
                      style={{background: u.role==='SUPER_ADMIN'?'#DC2626': u.role==='OWNER'?'#000':'#059669'}}>
                      {u.name.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-slate-800">{u.name}</div>
                      <div className="text-[8px] text-slate-400 truncate">{u.email}</div>
                    </div>
                    <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full text-white shrink-0"
                      style={{background: u.role==='SUPER_ADMIN'?'#DC2626': u.role==='OWNER'?'#000':'#059669'}}>
                      {u.role.replace('_',' ')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-3 text-[8px] text-slate-400 italic">
              Le mot de passe doit être configuré dans Supabase Authentication pour chaque compte.
            </div>
          </div>
        </div>

        <div className="text-center mt-5 text-[8px] text-slate-400 leading-relaxed">
          TAXIMETER.GOV · Version pilote · Environnement de démonstration<br/>
          Aucune donnée réelle · Aucune connexion gouvernementale officielle
        </div>
      </div>
    </div>
  )
}
