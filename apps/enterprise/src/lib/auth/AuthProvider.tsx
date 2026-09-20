'use client'
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getCurrentUser, onAuthStateChange, signOut as supaSignOut, type AuthUser } from '../supabase/auth'
import { hasPermission, ROUTE_PERMISSIONS, type Role, type Permission } from './rbac'
import { logSecurityEvent } from './securityLog'

type AuthCtx = {
  user:    AuthUser | null
  loading: boolean
  can:     (p: Permission) => boolean
  logout:  () => Promise<void>
}

const Ctx = createContext<AuthCtx>({
  user: null, loading: true,
  can: () => false,
  logout: async () => {},
})

const PUBLIC_ROUTES = ['/login']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router   = useRouter()
  const pathname = usePathname()

  // Vérification permission
  const can = useCallback((permission: Permission): boolean => {
    if (!user) return false
    return hasPermission(user.role as Role, permission)
  }, [user])

  // Déconnexion avec log
  const logout = useCallback(async () => {
    if (user) {
      logSecurityEvent('LOGOUT', {
        userId: user.id, email: user.email,
        role: user.role, enterpriseId: user.enterpriseId,
      })
    }
    try { await supaSignOut() } catch {}
    setUser(null)
    router.replace('/login')
  }, [user, router])

  useEffect(() => {
    // Charge le user initial
    getCurrentUser().then(u => {
      setUser(u)
      setLoading(false)
      if (u) {
        logSecurityEvent('SESSION_CREATED', {
          userId: u.id, email: u.email,
          role: u.role, enterpriseId: u.enterpriseId,
        })
      }
    }).catch(() => setLoading(false))

    // Écoute les changements Supabase
    const { data: { subscription } } = onAuthStateChange(u => {
      setUser(u)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Protection des routes
  useEffect(() => {
    if (loading) return
    const isPublic = PUBLIC_ROUTES.includes(pathname)

    // Non authentifié → login
    if (!user && !isPublic) {
      logSecurityEvent('ACCESS_DENIED', {
        route: pathname, success: false,
        detail: 'Non authentifié',
      })
      router.replace('/login')
      return
    }

    // Authentifié sur route protégée → vérifier permission
    if (user && !isPublic) {
      const requiredPerm = ROUTE_PERMISSIONS[pathname]
      if (requiredPerm && !hasPermission(user.role as Role, requiredPerm)) {
        logSecurityEvent('ACCESS_DENIED', {
          userId: user.id, email: user.email,
          role: user.role, enterpriseId: user.enterpriseId,
          route: pathname, success: false,
          detail: `Permission manquante: ${requiredPerm}`,
        })
        router.replace('/')
        return
      }
    }
  }, [user, loading, pathname, router])

  // Loading spinner global
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
          <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Vérification de la session…</div>
          <div className="text-sm text-slate-300 mt-1">TAXIMETER.GOV · PILOTE</div>
        </div>
      </div>
    )
  }

  return (
    <Ctx.Provider value={{ user, loading, can, logout }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)
