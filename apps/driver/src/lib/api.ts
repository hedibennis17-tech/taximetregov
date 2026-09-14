// ================================================================
// TAXIMÈTRE.GOV — API CLIENT
// Simple: getSession() → Authorization header → API route
// ================================================================

'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseBrowserClient } from './supabase/client'

// ─── Token ───────────────────────────────────────────────────

export async function getToken(): Promise<string | null> {
  try {
    const supabase = getSupabaseBrowserClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  } catch {
    return null
  }
}

// Pour les cas synchrones (taximètre)
export function getTokenSync(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const keys = Object.keys(localStorage)
    for (const key of keys) {
      if (key.startsWith('sb-') && key.includes('auth-token')) {
        const raw = localStorage.getItem(key) ?? '{}'
        const parsed = JSON.parse(raw) as { access_token?: string }
        if (parsed.access_token) return parsed.access_token
      }
    }
  } catch { /* ignore */ }
  return null
}

// ─── Token cache (évite N appels Supabase en parallèle) ──────

let _tokenPromise: Promise<string | null> | null = null
let _tokenExpiry = 0

export function getCachedToken(): Promise<string | null> {
  const now = Date.now()
  if (_tokenPromise && now < _tokenExpiry) return _tokenPromise
  _tokenExpiry = now + 55_000 // cache 55s (token JWT valide 60s min)
  _tokenPromise = getToken()
  return _tokenPromise
}

// ─── Fetch central ───────────────────────────────────────────

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getCachedToken()

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

// ─── Setup profil auto ────────────────────────────────────────

export async function setupDriverProfile(): Promise<void> {
  try {
    const token = await getToken()
    if (!token) return
    await fetch('/api/auth/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
  } catch { /* silencieux */ }
}

// ─── Helpers ─────────────────────────────────────────────────

export function money(v: string | number, currency = 'CAD'): string {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency', currency, maximumFractionDigits: 2,
  }).format(typeof v === 'string' ? parseFloat(v) || 0 : v)
}

export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatDistance(meters: number): string {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1)} km`
    : `${Math.round(meters)} m`
}

// ─── Types ───────────────────────────────────────────────────

export interface DriverProfile {
  id: string
  public_driver_id: string
  government_driver_id: string
  first_name: string
  last_name: string
  email: string
  verification_status: string
  identity_verification_status?: string
  driver_number?: string
  language?: string
  business_status?: string
  status?: string
  phone?: string
  province?: string
  preferred_name?: string
  onboarding_completed_at?: string
  onboarding_status: string
  preferred_language: string
  phone_number_masked: string | null
  created_at: string
  connected_platforms?: { provider: string; name: string; status: string; code: string }[]
  wallet?: { balance: string; currency: string }
}

export interface RevenueData {
  wallet:  { balance: string; currency: string; status: string }
  summary: {
    total_gross: string
    total_net: string
    total_tips: string
    total_activities: string
    taxi_gross?: string
    rideshare_gross?: string
    delivery_gross?: string
    total_fees?: string
  }
  breakdown: Array<{
    source_type: string
    gross: string
    tips: string
    net: string
    count: string
  }>
}

export interface Trip {
  id: string
  public_trip_id: string
  trip_reference: string
  trip_status: string
  distance_meters: number
  elapsed_seconds: number
  final_amount: string | null
  estimated_amount: string
  currency: string
  started_at: string | null
  completed_at: string | null
  fare_version?: string
  source_type?: string
  activity_type?: string
}

// ─── Hooks ───────────────────────────────────────────────────

export function useDriverProfile() {
  const [profile, setProfile] = useState<DriverProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiFetch<{ profile: DriverProfile }>('/api/driver/profile')
      setProfile(data.profile)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
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
      setLoading(true)
      setError(null)
      const data = await apiFetch<RevenueData>(`/api/revenue?period=${period}`)
      setRevenue(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => { void fetch_() }, [fetch_])
  return { revenue, loading, error, refresh: fetch_ }
}

// ─── Hook parallèle pour la page Home (1 seul état de loading) ─

export function useHomeData(period: 'week' | 'month' | 'year' = 'month') {
  const [profile, setProfile] = useState<DriverProfile | null>(null)
  const [revenue, setRevenue] = useState<RevenueData | null>(null)
  const [trips,   setTrips]   = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    setError(null)
    // Warm up le token une seule fois avant les 3 fetches parallèles
    await getCachedToken()
    const [profileRes, revenueRes, tripsRes] = await Promise.allSettled([
      apiFetch<{ profile: DriverProfile }>('/api/driver/profile'),
      apiFetch<RevenueData>(`/api/revenue?period=${period}`),
      apiFetch<{ trips: Trip[] }>('/api/trips?status=COMPLETED'),
    ])
    if (profileRes.status === 'fulfilled') setProfile(profileRes.value.profile)
    else setError((profileRes.reason as Error).message)
    if (revenueRes.status === 'fulfilled') setRevenue(revenueRes.value)
    if (tripsRes.status === 'fulfilled')   setTrips(tripsRes.value.trips)
    setLoading(false)
  }, [period])

  useEffect(() => { void fetch_() }, [fetch_])

  const refresh = useCallback(() => {
    // Invalider le cache token au refresh manuel
    _tokenPromise = null
    void fetch_()
  }, [fetch_])

  return { profile, revenue, trips, loading, error, refresh }
}

export function useTrips(status?: string) {
  const [trips, setTrips]     = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = status ? `?status=${status}` : ''
      const data = await apiFetch<{ trips: Trip[] }>(`/api/trips${params}`)
      setTrips(data.trips)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => { void fetch_() }, [fetch_])
  return { trips, total: trips.length, loading, error, refresh: fetch_ }
}
