'use client'

import { useCallback, useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from './client'

export type AdminDashboardData = {
  generatedAt: string
  drivers: { total: number; active: number; pending: number; suspended: number; online: number }
  activity: { total: number; taxiTrips: number; deliveries: number }
  revenue: { gross: number; net: number; tax: number; tips: number; fees: number }
  alerts: number
}

export function useAdminDashboard() {
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getSupabaseBrowserClient().auth.getSession()
      if (!data.session) throw new Error('Session administrative requise.')
      const response = await fetch('/api/admin/dashboard', { headers: { Authorization: `Bearer ${data.session.access_token}` }, cache: 'no-store' })
      const body = await response.json() as AdminDashboardData & { error?: string }
      if (!response.ok) throw new Error(body.error ?? 'Chargement des données administratives impossible.')
      setDashboard(body)
      setError(null)
    } catch (caught) {
      setDashboard(null)
      setError(caught instanceof Error ? caught.message : 'Chargement des données administratives impossible.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])
  return { dashboard, loading, error, refresh }
}
