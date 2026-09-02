'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

type Stage = 'login' | 'activate' | 'mfa'

function authMessage(message: string) {
  const value = message.toLowerCase()
  if (value.includes('invalid login credentials')) return 'Courriel ou mot de passe invalide.'
  if (value.includes('email not confirmed')) return 'Confirmez votre invitation par courriel avant de vous connecter.'
  if (value.includes('mfa')) return 'Le code de sécurité est invalide ou expiré.'
  return message
}

export default function GovernmentLoginPage() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [factorId, setFactorId] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStage('activate')
    })
  }, [])

  const prepareMfa = async () => {
    const supabase = getSupabaseBrowserClient()
    const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (assuranceError) throw assuranceError
    if (assurance.currentLevel === 'aal2') {
      router.replace('/')
      return
    }

    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
    if (factorsError) throw factorsError
    const verifiedFactor = factors.totp.find((factor) => factor.status === 'verified')
    if (verifiedFactor) {
      setFactorId(verifiedFactor.id)
      setQrCode(null)
      setStage('mfa')
      setNotice('Entrez le code de votre application d’authentification.')
      return
    }

    const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Taximètre.GOV Administration' })
    if (enrollError) throw enrollError
    setFactorId(enrolled.id)
    setQrCode(enrolled.totp.qr_code)
    setStage('mfa')
    setNotice('Ajoutez ce code QR à votre application d’authentification, puis confirmez le code à six chiffres.')
  }

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data, error: signInError } = await getSupabaseBrowserClient().auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
      if (signInError || !data.session) throw signInError ?? new Error('Session administrative non créée.')
      await prepareMfa()
    } catch (caught) {
      setError(authMessage(caught instanceof Error ? caught.message : 'Connexion administrative impossible.'))
    } finally {
      setLoading(false)
    }
  }

  const activateInvitation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error: updateError } = await getSupabaseBrowserClient().auth.updateUser({ password })
      if (updateError) throw updateError
      await prepareMfa()
    } catch (caught) {
      setError(authMessage(caught instanceof Error ? caught.message : 'Activation du compte impossible.'))
    } finally {
      setLoading(false)
    }
  }

  const verifyMfa = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!factorId) return
    setLoading(true)
    setError(null)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code })
      if (verifyError) throw verifyError
      const { data } = await supabase.auth.getSession()
      if (!data.session) throw new Error('Session administrative absente après MFA.')
      const activation = await fetch('/api/admin/activate', { method: 'POST', headers: { Authorization: `Bearer ${data.session.access_token}` } })
      const activationBody = await activation.json().catch(() => ({})) as { error?: string }
      if (!activation.ok) throw new Error(activationBody.error ?? 'Activation administrative impossible.')
      router.replace('/')
    } catch (caught) {
      setError(authMessage(caught instanceof Error ? caught.message : 'Vérification multifacteur impossible.'))
    } finally {
      setLoading(false)
    }
  }

  const form = stage === 'login' ? (
    <form onSubmit={submitLogin} className="space-y-4">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Courriel administratif<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-qc-blue" placeholder="nom@organisation.gouv.qc.ca" /></label>
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Mot de passe<input required type="password" minLength={12} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-qc-blue" placeholder="Mot de passe sécurisé" /></label>
      <button disabled={loading} type="submit" className="w-full rounded-xl bg-qc-blue py-3.5 text-sm font-bold text-white disabled:opacity-60">{loading ? 'Vérification…' : 'Se connecter et vérifier le MFA'}</button>
    </form>
  ) : stage === 'activate' ? (
    <form onSubmit={activateInvitation} className="space-y-4">
      <p className="text-sm text-slate-300">Définissez le mot de passe de votre compte invité, puis configurez l’authentification multifacteur obligatoire.</p>
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Nouveau mot de passe<input required type="password" minLength={12} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-qc-blue" placeholder="12 caractères minimum" /></label>
      <button disabled={loading} type="submit" className="w-full rounded-xl bg-qc-blue py-3.5 text-sm font-bold text-white disabled:opacity-60">{loading ? 'Activation…' : 'Activer et configurer le MFA'}</button>
    </form>
  ) : (
    <form onSubmit={verifyMfa} className="space-y-4">
      {qrCode && <div className="rounded-xl bg-white p-3"><img src={qrCode} alt="Code QR pour application d’authentification" className="mx-auto h-44 w-44" /></div>}
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Code de sécurité à six chiffres<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-center font-mono text-lg tracking-[0.4em] text-white outline-none focus:border-qc-blue" placeholder="000000" /></label>
      <button disabled={loading} type="submit" className="w-full rounded-xl bg-qc-blue py-3.5 text-sm font-bold text-white disabled:opacity-60">{loading ? 'Vérification…' : 'Valider le code MFA'}</button>
    </form>
  )

  return <main className="min-h-screen bg-slate-950 px-6 py-16 text-white"><div className="mx-auto max-w-md"><div className="mb-8 text-center"><div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-qc-blue text-3xl">⚜</div><h1 className="text-2xl font-bold">TAXIMÈTRE.GOV</h1><p className="mt-1 text-sm text-slate-400">Portail administratif sécurisé</p></div><div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"><div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-qc-blue/20 p-2 text-qc-blue-light">{stage === 'mfa' ? <KeyRound size={20} /> : stage === 'activate' ? <ShieldCheck size={20} /> : <LockKeyhole size={20} />}</div><div><h2 className="font-semibold">{stage === 'mfa' ? 'Authentification multifacteur' : stage === 'activate' ? 'Activation du compte' : 'Accès réservé'}</h2><p className="text-xs text-slate-400">Administrateurs autorisés uniquement</p></div></div>{notice && <p className="mb-4 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs text-blue-200">{notice}</p>}{error && <p role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</p>}{form}</div><p className="mt-5 text-center text-xs text-slate-500">Les comptes sont créés par invitation d’un administrateur habilité.</p></div></main>
}
