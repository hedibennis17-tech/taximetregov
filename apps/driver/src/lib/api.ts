// ================================================================
// TAXIMÈTRE.GOV — API CLIENT
// Hook universel — remplace tous les hooks Supabase mock
// ================================================================

'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Token management ────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  // 1. Notre token custom
  const customToken = localStorage.getItem('taximetregov_token')
  if (customToken) return customToken
  // 2. Token Supabase (stocké par @supabase/supabase-js)
  try {
    const keys = Object.keys(localStorage)
    const sbKey = keys.find(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
    if (sbKey) {
      const sbData = JSON.parse(localStorage.getItem(sbKey) ?? '{}') as { access_token?: string }
      if (sbData.access_token) return sbData.access_token
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

// ─── Fetch helper ─────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const json = await res.json()

  if (!res.ok) {
    throw new Error(json.error ?? `Erreur ${res.status}`)
  }

  return json.data as T
}

// ─── Auth ────────────────────────────────────────────────────

export interface LoginResult {
  token: string
  user:  { id: string; email: string; role: string }
  driver: {
    id: string
    publicDriverId: string
    verificationStatus: string
  } | null
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const data = await apiFetch<LoginResult>('/api/auth/login', {
    method: 'POST',
    body:   JSON.stringify({ email, password }),
  })
  setToken(data.token)
  return data
}

export async function logout(): Promise<void> {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' })
  } finally {
    clearToken()
  }
}

// ─── useMe ───────────────────────────────────────────────────

export interface MeData {
  userId: string
  email:  string
  role:   string
  driver: {
    id:                 string
    publicDriverId:     string
    firstName:          string
    lastName:           string
    verificationStatus: string
    onboardingStatus:   string
    driverLicenseMasked: string
    phoneMasked:        string
  } | null
}

export function useMe() {
  const [data, setData]     = useState<MeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const me = await apiFetch<MeData>('/api/auth/me')
      setData(me)
    } catch (e) {
      setError((e as Error).message)
      clearToken()
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetch_() }, [fetch_])

  return { me: data, loading, error, refresh: fetch_ }
}

// ─── useDriverProfile ─────────────────────────────────────────

export interface DriverProfile {
  id:                  string
  public_driver_id:    string
  first_name:          string
  last_name:           string
  preferred_language:  string
  verification_status: string
  onboarding_status:   string
  phone_number_masked: string
  email:               string
  wallet_balance:      string
  connected_platforms: Array<{ provider: string; status: string }> | null
}

export function useDriverProfile() {
  const [data, setData]       = useState<DriverProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const profile = await apiFetch<DriverProfile>('/api/driver/profile')
      setData(profile)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetch_() }, [fetch_])

  const update = async (updates: { firstName?: string; lastName?: string; preferredLanguage?: string }) => {
    await apiFetch('/api/driver/profile', {
      method: 'PUT',
      body:   JSON.stringify(updates),
    })
    await fetch_()
  }

  return { profile: data, loading, error, refresh: fetch_, update }
}

// ─── useRevenue ───────────────────────────────────────────────

export interface RevenueSummary {
  wallet: { balance: string; currency: string }
  period: string
  summary: {
    total_gross:        string
    total_tips:         string
    total_net:          string
    total_activities:   string
    taxi_gross:         string
    rideshare_gross:    string
    delivery_gross:     string
  }
  breakdown: Array<{
    source_type: string
    gross:       string
    tips:        string
    net:         string
    count:       string
  }>
}

export function useRevenue(period: 'week' | 'month' | 'year' = 'month') {
  const [data, setData]       = useState<RevenueSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const rev = await apiFetch<RevenueSummary>(`/api/revenue?period=${period}`)
      setData(rev)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => { void fetch_() }, [fetch_])

  return { revenue: data, loading, error, refresh: fetch_ }
}

// ─── useTrips ─────────────────────────────────────────────────

export interface Trip {
  id:               string
  public_trip_id:   string
  trip_reference:   string
  trip_status:      string
  distance_meters:  number
  elapsed_seconds:  number
  final_amount:     string | null
  estimated_amount: string | null
  currency:         string
  started_at:       string | null
  completed_at:     string | null
  fare_version:     string | null
}

export function useTrips(status?: string) {
  const [trips, setTrips]     = useState<Trip[]>([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({ limit: '20' })
      if (status) params.set('status', status)
      const result = await apiFetch<{ trips: Trip[]; total: number }>(
        `/api/trips?${params}`
      )
      setTrips(result.trips)
      setTotal(result.total)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => { void fetch_() }, [fetch_])

  return { trips, total, loading, error, refresh: fetch_ }
}

// ─── useTaximeter ─────────────────────────────────────────────

export interface TaxiTrip {
  id:               string
  publicTripId:     string
  tripReference:    string
  status:           string
  distanceMeters:   number
  elapsedSeconds:   number
  estimatedAmount:  string | null
  startedAt:        string | null
}

export interface TaxiMeterStatus {
  taximeter: {
    id:              string
    public_taximeter_id: string
    status:          string
    current_mode:    string
    activated_at:    string | null
    active_trip:     TaxiTrip | null
  } | null
  hasActiveMeter: boolean
}

export function useTaximeter() {
  const [data, setData]       = useState<TaxiMeterStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    try {
      setLoading(true)
      const status = await apiFetch<TaxiMeterStatus>('/api/taximeter/status')
      setData(status)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetch_()
    // Refresh toutes les 10 secondes si cours active
    const interval = setInterval(() => void fetch_(), 10000)
    return () => clearInterval(interval)
  }, [fetch_])

  return { taximeter: data, loading, error, refresh: fetch_ }
}

// ─── Format helpers ───────────────────────────────────────────

export const money = (val: string | number, currency = 'CAD') =>
  new Intl.NumberFormat('fr-CA', { style: 'currency', currency })
    .format(typeof val === 'string' ? parseFloat(val) || 0 : val)

export const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}min`
  return `${m}min`
}

export const formatDistance = (meters: number) => {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`
  return `${meters} m`
}

export const sourceLabel: Record<string, string> = {
  TAXI:      '🚕 Taxi',
  UBER:      '⚫ Uber',
  LYFT:      '🟣 Lyft',
  DOORDASH:  '🔴 DoorDash',
  INSTACART: '🟢 Instacart',
  UBER_EATS: '🟡 Uber Eats',
  SKIP:      '🟠 Skip',
}

export const statusLabel: Record<string, { label: string; color: string }> = {
  VERIFIED:   { label: 'Vérifié',    color: 'text-green-400' },
  PENDING:    { label: 'En attente', color: 'text-amber-400' },
  SUSPENDED:  { label: 'Suspendu',   color: 'text-red-400'   },
  COMPLETED:  { label: 'Terminée',   color: 'text-green-400' },
  CANCELLED:  { label: 'Annulée',    color: 'text-red-400'   },
  STARTED:    { label: 'En cours',   color: 'text-blue-400'  },
}
