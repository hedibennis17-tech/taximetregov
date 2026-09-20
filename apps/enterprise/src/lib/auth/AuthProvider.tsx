'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getCurrentUser, onAuthStateChange, type AuthUser } from '../supabase/auth'

type AuthCtx = {
  user:    AuthUser | null
  loading: boolean
}

const Ctx = createContext<AuthCtx>({ user: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Charge le user initial
    getCurrentUser().then(u => {
      setUser(u)
      setLoading(false)
    })

    // Écoute les changements
    const { data: { subscription } } = onAuthStateChange(u => {
      setUser(u)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (loading) return
    const pub = pathname === '/login'
    if (!user && !pub) router.replace('/login')
  }, [user, loading, pathname, router])

  return <Ctx.Provider value={{ user, loading }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
