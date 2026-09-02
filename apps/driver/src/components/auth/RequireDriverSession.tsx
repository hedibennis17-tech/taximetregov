'use client'

import { type ReactNode, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export function RequireDriverSession({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    let mounted = true

    const validate = async () => {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      if (!data.session) {
        router.replace(`/auth/login?next=${encodeURIComponent(pathname || '/home')}`)
        return
      }
      setReady(true)
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

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6 text-center">
        <p className="text-sm text-slate-400">Vérification de votre session sécurisée…</p>
      </div>
    )
  }

  return <>{children}</>
}
