'use client'

import { useCallback, useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from './client'

export type DriverDashboardProfile = {
  firstName: string
  lastName: string
  driverNumber: string
  email: string
  status: string
  province: string
  language: string
}

export type DriverDashboardPlatform = {
  id: string
  name: string
  code: string
  status: string
  connectedAt: string | null
  lastSyncAt: string | null
}

export type DriverDashboardActivity = {
  id: string
  type: string
  provider: string | null
  startedAt: string | null
  completedAt: string | null
  amount: number
  tip: number
  tax: number
  net: number
  currency: string
}

export type DriverDashboard = {
  profile: DriverDashboardProfile
  presence: { status: 'ONLINE' | 'OFFLINE'; locationLabel: string | null }
  stats: { totalRevenue: number; totalTrips: number; totalTax: number; netRevenue: number }
  platforms: DriverDashboardPlatform[]
  activities: DriverDashboardActivity[]
}

function numeric(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function nestedRecord(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return (value[0] as Record<string, unknown> | undefined) ?? null
  return value && typeof value === 'object' ? value as Record<string, unknown> : null
}

function startOfTodayIso(): string {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

export function useDriverDashboard() {
  const [dashboard, setDashboard] = useState<DriverDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseBrowserClient()
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!authData.user) {
        setDashboard(null)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('driver_profiles')
        .select('id, driver_number, first_name, last_name, status, province, language')
        .eq('user_id', authData.user.id)
        .is('deleted_at', null)
        .maybeSingle()
      if (profileError) throw profileError
      if (!profile) {
        setDashboard(null)
        setError('Votre dossier chauffeur est en cours de préparation. Réessayez dans quelques instants.')
        return
      }

      const [presenceResult, activitiesResult, platformsResult] = await Promise.all([
        supabase
          .from('driver_presences')
          .select('status, location_label')
          .eq('driver_id', profile.id)
          .maybeSingle(),
        supabase
          .from('driver_activities')
          .select('id, activity_type_code, started_at, completed_at, gross_amount, final_amount, tip_amount, tax_amount, net_amount, currency, providers(name, code)')
          .eq('driver_id', profile.id)
          .order('started_at', { ascending: false })
          .limit(100),
        supabase
          .from('driver_provider_accounts')
          .select('id, status, connected_at, last_sync_at, providers(name, code)')
          .eq('driver_id', profile.id)
          .is('archived_at', null)
          .order('connected_at', { ascending: false }),
      ])

      if (presenceResult.error) throw presenceResult.error
      if (activitiesResult.error) throw activitiesResult.error
      if (platformsResult.error) throw platformsResult.error

      const activities = (activitiesResult.data ?? []).map((row: Record<string, unknown>) => {
        const provider = nestedRecord(row.providers)
        const finalAmount = numeric(row.final_amount)
        const grossAmount = numeric(row.gross_amount)
        return {
          id: String(row.id),
          type: String(row.activity_type_code),
          provider: provider?.name ? String(provider.name) : null,
          startedAt: row.started_at ? String(row.started_at) : null,
          completedAt: row.completed_at ? String(row.completed_at) : null,
          amount: finalAmount || grossAmount,
          tip: numeric(row.tip_amount),
          tax: numeric(row.tax_amount),
          net: numeric(row.net_amount),
          currency: String(row.currency ?? 'CAD'),
        }
      })

      const todayActivities = activities.filter((activity) =>
        Boolean(activity.startedAt && activity.startedAt >= startOfTodayIso()),
      )
      const stats = todayActivities.reduce(
        (totals, activity) => ({
          totalRevenue: totals.totalRevenue + activity.amount,
          totalTrips: totals.totalTrips + 1,
          totalTax: totals.totalTax + activity.tax,
          netRevenue: totals.netRevenue + (activity.net || activity.amount - activity.tax),
        }),
        { totalRevenue: 0, totalTrips: 0, totalTax: 0, netRevenue: 0 },
      )

      const platforms = (platformsResult.data ?? []).map((row: Record<string, unknown>) => {
        const provider = nestedRecord(row.providers)
        return {
          id: String(row.id),
          name: String(provider?.name ?? 'Plateforme'),
          code: String(provider?.code ?? 'OTHER'),
          status: String(row.status ?? 'PENDING'),
          connectedAt: row.connected_at ? String(row.connected_at) : null,
          lastSyncAt: row.last_sync_at ? String(row.last_sync_at) : null,
        }
      })

      setDashboard({
        profile: {
          firstName: String(profile.first_name),
          lastName: String(profile.last_name),
          driverNumber: String(profile.driver_number),
          email: authData.user.email ?? '',
          status: String(profile.status),
          province: String(profile.province ?? 'QC'),
          language: String(profile.language ?? 'fr'),
        },
        presence: {
          status: presenceResult.data?.status === 'ONLINE' ? 'ONLINE' : 'OFFLINE',
          locationLabel: presenceResult.data?.location_label ?? null,
        },
        stats,
        platforms,
        activities,
      })
    } catch (caught) {
      setDashboard(null)
      setError(caught instanceof Error ? caught.message : 'Impossible de charger vos données sécurisées.')
    } finally {
      setLoading(false)
    }
  }, [])

  const setPresence = useCallback(async (status: 'ONLINE' | 'OFFLINE') => {
    const supabase = getSupabaseBrowserClient()
    const { error: presenceError } = await supabase.rpc('set_my_driver_presence', {
      requested_status: status,
      requested_location_label: null,
    })
    if (presenceError) throw presenceError
    await refresh()
  }, [refresh])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { dashboard, loading, error, refresh, setPresence }
}
