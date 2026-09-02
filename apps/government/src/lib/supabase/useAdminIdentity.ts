'use client'

import { useCallback, useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from './client'

export type AdminIdentity = {
  id: string
  email: string
  publicId: string
  roles: string[]
  requiresMfa: boolean
}

export function useAdminIdentity() {
  const [administrator, setAdministrator] = useState<AdminIdentity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        setAdministrator(null)
        setError('Session administrative requise.')
        return
      }
      const response = await fetch('/api/admin/me', { headers: { Authorization: `Bearer ${data.session.access_token}` }, cache: 'no-store' })
      const body = await response.json() as { administrator?: AdminIdentity; error?: string }
      if (!response.ok || !body.administrator) throw new Error(body.error ?? 'Accès administratif indisponible.')
      setAdministrator(body.administrator)
      setError(null)
    } catch (caught) {
      setAdministrator(null)
      setError(caught instanceof Error ? caught.message : 'Accès administratif indisponible.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])
  return { administrator, loading, error, refresh }
}
