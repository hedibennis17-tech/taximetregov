'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Shield } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

type Mode = 'login' | 'signup'

function messageForAuthError(message: string) {
  const normalized = message.toLowerCase()
  if (normalized.includes('invalid login credentials')) return 'Courriel ou mot de passe incorrect.'
  if (normalized.includes('email not confirmed')) return 'Confirmez votre courriel avant de vous connecter.'
  if (normalized.includes('already registered')) return 'Un compte existe déjà avec ce courriel.'
  if (normalized.includes('password')) return 'Le mot de passe ne respecte pas les exigences de sécurité.'
  return message
}

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const nextPath = '/home'

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setNotice(null)

    try {
      const supabase = getSupabaseBrowserClient()
      const normalizedEmail = email.trim().toLowerCase()

      if (mode === 'signup') {
        if (!firstName.trim() || !lastName.trim()) {
          throw new Error('Indiquez votre prénom et votre nom pour créer votre dossier chauffeur.')
        }
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: { first_name: firstName.trim(), last_name: lastName.trim(), province: 'QC', language: 'fr' },
            emailRedirectTo: `${window.location.origin}/auth/login`,
          },
        })
        if (signUpError) throw signUpError
        if (data.session) {
          router.replace(nextPath)
          return
        }
        setNotice('Votre compte a été créé. Consultez votre courriel pour confirmer votre adresse, puis connectez-vous.')
        setMode('login')
        setPassword('')
        return
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })
      if (signInError) throw signInError
      if (!data.session) throw new Error('Aucune session sécurisée n’a été créée. Réessayez.')
      router.replace(nextPath)
    } catch (caught) {
      setError(messageForAuthError(caught instanceof Error ? caught.message : 'Connexion impossible.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col">
      <div className="px-6 pt-16 pb-8 text-center">
        <div className="w-20 h-20 rounded-3xl bg-qc-blue flex items-center justify-center mx-auto mb-4 text-4xl shadow-lg shadow-blue-900/50">⚜</div>
        <h1 className="text-2xl font-bold text-white">TAXIMÈTRE.GOV</h1>
        <p className="text-sm text-slate-400 mt-1">Espace sécurisé des chauffeurs — Québec</p>
      </div>

      <div className="flex-1 px-6 max-w-md w-full mx-auto">
        <div className="grid grid-cols-2 rounded-xl bg-slate-900 border border-slate-800 p-1 mb-6">
          <button type="button" onClick={() => { setMode('login'); setError(null); setNotice(null) }} className={`py-2 rounded-lg text-sm font-semibold ${mode === 'login' ? 'bg-qc-blue text-white' : 'text-slate-400'}`}>Connexion</button>
          <button type="button" onClick={() => { setMode('signup'); setError(null); setNotice(null) }} className={`py-2 rounded-lg text-sm font-semibold ${mode === 'signup' ? 'bg-qc-blue text-white' : 'text-slate-400'}`}>Créer un compte</button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block">Prénom
                <input required value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" className="mt-2 w-full px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-white text-sm outline-none focus:border-qc-blue" />
              </label>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block">Nom
                <input required value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" className="mt-2 w-full px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-white text-sm outline-none focus:border-qc-blue" />
              </label>
            </div>
          )}
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block">Courriel
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="mt-2 w-full px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-white text-sm outline-none focus:border-qc-blue" placeholder="vous@exemple.com" />
          </label>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block">Mot de passe
            <span className="relative block mt-2">
              <input required minLength={12} type={showPass ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="w-full px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-white text-sm outline-none focus:border-qc-blue pr-12" placeholder="12 caractères minimum" />
              <button type="button" onClick={() => setShowPass((visible) => !visible)} aria-label={showPass ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{showPass ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </span>
          </label>
          {error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
          {notice && <p role="status" className="rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-300">{notice}</p>}
          <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl bg-qc-blue text-white font-bold text-base hover:bg-qc-blue-dark active:scale-98 transition-all disabled:opacity-60 shadow-lg shadow-blue-900/40 mt-2">
            {loading ? 'Connexion sécurisée…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte chauffeur'}
          </button>
          <div className="flex items-center gap-2 justify-center mt-2">
            <Shield size={13} className="text-slate-500" />
            <span className="text-xs text-slate-500">Authentification Supabase sécurisée par courriel et mot de passe</span>
          </div>
        </form>
      </div>

      <div className="px-6 pb-8 text-center"><p className="text-[10px] text-slate-600">TAXIMÈTRE.GOV — Pilote Québec 2026</p></div>
    </main>
  )
}
