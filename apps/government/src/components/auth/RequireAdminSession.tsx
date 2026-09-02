'use client'

import { type ReactNode, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

type State = 'checking' | 'ready' | 'denied'

export function RequireAdminSession({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [state, setState] = useState<State>('checking')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    let mounted = true

    const validate = async () => {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      if (!data.session) {
        router.replace(`/auth/login?next=${encodeURIComponent(pathname || '/')}`)
        return
      }

      const response = await fetch('/api/admin/me', {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
        cache: 'no-store',
      })
      if (!mounted) return
      if (response.ok) {
        setState('ready')
        return
      }
      const body = await response.json().catch(() => ({})) as { error?: string; code?: string }
      if (body.code === 'MFA_REQUIRED') {
        router.replace('/auth/login?mfa=required')
        return
      }
      setError(body.error ?? 'Votre session ne dispose pas des droits gouvernementaux requis.')
      setState('denied')
    }

    void validate()
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/auth/login')
    })
    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [pathname, router])

  if (state === 'checking') {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-sm text-slate-400">Vérification de la session administrative sécurisée…</div>
  }
  if (state === 'denied') {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6 text-center"><div><h1 className="text-xl font-bold text-white mb-2">Accès refusé</h1><p className="text-sm text-slate-400">{error}</p></div></div>
  }
  return <>{children}</>
}
