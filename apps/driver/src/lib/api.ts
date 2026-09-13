// ================================================================
// TAXIMÈTRE.GOV — API CLIENT (DRIVER)
// ================================================================

'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseBrowserClient } from './supabase/client'

// ─── Token — récupère depuis Supabase directement ─────────────

export function getToken(): string | null {
  if (typeof window === 'undefined') return null

  // 1. Notre token custom (login via notre API)
  const customToken = localStorage.getItem('taximetregov_token')
  if (customToken) return customToken

  // 2. Cherche dans localStorage tous les tokens Supabase possibles
  try {
    const keys = Object.keys(localStorage)
    for (const key of keys) {
      if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth-token')) {
        try {
          const raw = localStorage.getItem(key) ?? '{}'
          const parsed = JSON.parse(raw) as {
            access_token?: string
            currentSession?: { access_token?: string }
            session?: { access_token?: string }
          }
          const token = parsed.access_token
            || parsed.currentSession?.access_token
            || parsed.session?.access_token
          if (token && token.length > 20) return token
        } catch { /* next */ }
      }
    }
  } catch { /* ignore */ }

  return null
}

export function setToken(token: string): void {
  localStorage.setItem('taximetregov_token', token)
}

export function clearToken(): void {
  localStorage.removeItem('taximetregov_token')
}

// ─── Fetch helper — toujours envoie le token ─────────────────

async function getSupabaseToken(): Promise<string | null> {
  try {
    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  } catch { return null }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  // Obtenir le token — Supabase en priorité
  let token = await getSupabaseToken()
  if (!token) token = getToken()

  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const json = await res.json() as { success: boolean; data: T; error?: string }
  if (!res.ok || !json.success) throw new Error(json.error ?? `Erreur ${res.status}`)
  return json.data
}

// ─── Auth helper ──────────────────────────────────────────────

export async function setupDriverProfile(): Promise<void> {
  try {
    const token = await getSupabaseToken() ?? getToken()
    if (!token) return
    await fetch('/api/auth/setup', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch { /* silencieux */ }
}

export function money(v: string | number, currency = 'CAD'): string {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency', currency, maximumFractionDigits: 2,
  }).format(typeof v === 'string' ? parseFloat(v) || 0 : v)
}

export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}h${String(m).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

export function formatDistance(meters: number): string {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1)} km`
    : `${Math.round(meters)} m`
}

// ─── Types ───────────────────────────────────────────────────

export interface DriverProfile {
  id: string; public_driver_id: string; government_driver_id: string
  first_name: string; last_name: string; email: string
  verification_status: string; onboarding_status: string
  preferred_language: string; phone_number_masked: string | null
  created_at: string; connected_platforms?: string[]
}

export interface RevenueData {
  wallet:  { balance: string; currency: string; status: string }
  summary: { total_gross: string; total_net: string; total_tips: string; total_activities: string; taxi_gross?: string; rideshare_gross?: string; delivery_gross?: string; total_fees?: string }
  breakdown: Array<{ source_type: string; gross: string; tips: string; net: string; count: string }>
}

export interface Trip {
  id: string; public_trip_id: string; trip_reference: string
  trip_status: string; distance_meters: number; elapsed_seconds: number
  final_amount: string | null; estimated_amount: string; currency: string
  started_at: string | null; completed_at: string | null
  fare_version?: string; source_type?: string; activity_type?: string
}

// ─── Hooks ───────────────────────────────────────────────────

export function useDriverProfile() {
  const [profile, setProfile] = useState<DriverProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const data = await apiFetch<{ profile: DriverProfile }>('/api/driver/profile')
      setProfile(data.profile)
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void fetch_() }, [fetch_])
  return { profile, loading, error, refresh: fetch_ }
}

export function useRevenue(period: 'week' | 'month' | 'year' = 'month') {
  const [revenue, setRevenue] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const data = await apiFetch<RevenueData>(`/api/revenue?period=${period}`)
      setRevenue(data)
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [period])

  useEffect(() => { void fetch_() }, [fetch_])
  return { revenue, loading, error, refresh: fetch_ }
}

export function useTrips(status?: string) {
  const [trips, setTrips]     = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const params = status ? `?status=${status}` : ''
      const data = await apiFetch<{ trips: Trip[] }>(`/api/trips${params}`)
      setTrips(data.trips)
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [status])

  useEffect(() => { void fetch_() }, [fetch_])
  return { trips, total: trips.length, loading, error, refresh: fetch_ }
}
