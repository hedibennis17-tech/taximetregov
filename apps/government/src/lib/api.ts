// ================================================================
// TAXIMÈTRE.GOV — GOVERNMENT API CLIENT
// Remplace tous les hooks Supabase mock du dashboard gouvernemental
// ================================================================

'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Token management ────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('taximetregov_gov_token')
}

export function setToken(token: string): void {
  localStorage.setItem('taximetregov_gov_token', token)
}

export function clearToken(): void {
  localStorage.removeItem('taximetregov_gov_token')
}

// ─── Fetch helper ─────────────────────────────────────────────

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
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
  if (!res.ok) throw new Error(json.error ?? `Erreur ${res.status}`)
  return json.data as T
}

// ─── Auth ────────────────────────────────────────────────────

export async function govLogin(email: string, password: string) {
  const data = await apiFetch<{
    token: string
    user: { id: string; email: string; role: string }
    driver: null
  }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
  setToken(data.token)
  return data
}

export async function govLogout() {
  try { await apiFetch('/api/auth/logout', { method: 'POST' }) }
  finally { clearToken() }
}

// ─── Dashboard ────────────────────────────────────────────────

export interface GovDashboardData {
  drivers: {
    total:     string
    verified:  string
    pending:   string
    suspended: string
  }
  revenue: {
    total_gross:      string
    taxi:             string
    rideshare:        string
    delivery:         string
    active_drivers:   string
  }
  trips: {
    total:     string
    completed: string
    cancelled: string
    avg_fare:  string
  }
  tax: {
    tps: string
    tvq: string
  }
  generatedAt: string
  jurisdiction: string
}

export function useGovDashboard() {
  const [data, setData]       = useState<GovDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const d = await apiFetch<GovDashboardData>('/api/reports/dashboard')
      setData(d)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetch_() }, [fetch_])

  return { dashboard: data, loading, error, refresh: fetch_ }
}

// ─── Drivers list ────────────────────────────────────────────

export interface GovDriver {
  id:                  string
  public_driver_id:    string
  first_name:          string
  last_name:           string
  email:               string
  verification_status: string
  onboarding_status:   string
  phone_number_masked: string
  created_at:          string
  revenue_this_month:  string
  trips_this_month:    string
  connected_platforms: string
}

export function useGovDrivers(opts: { status?: string; search?: string } = {}) {
  const [drivers, setDrivers] = useState<GovDriver[]>([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({ limit: '50' })
      if (opts.status) params.set('status', opts.status)
      if (opts.search) params.set('search', opts.search)
      const result = await apiFetch<{ drivers: GovDriver[]; total: number }>(
        `/api/drivers?${params}`
      )
      setDrivers(result.drivers)
      setTotal(result.total)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [opts.status, opts.search])

  useEffect(() => { void fetch_() }, [fetch_])

  return { drivers, total, loading, error, refresh: fetch_ }
}

// ─── Format helpers ───────────────────────────────────────────

export const money = (val: string | number, currency = 'CAD') =>
  new Intl.NumberFormat('fr-CA', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(typeof val === 'string' ? parseFloat(val) || 0 : val)

export const statusConfig: Record<string, { label: string; color: string }> = {
  VERIFIED:            { label: 'Vérifié',       color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  PENDING:             { label: 'En attente',    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  SUSPENDED:           { label: 'Suspendu',      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  REJECTED:            { label: 'Rejeté',        color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  UNDER_REVIEW:        { label: 'En révision',   color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  DOCUMENTS_REQUIRED:  { label: 'Docs requis',   color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
}

// ─── Tax Center ───────────────────────────────────────────────

export interface TaxSummary {
  total_tps:          string
  total_tvq:          string
  total_tax:          string
  total_gross:        string
  taxi_gross:         string
  rideshare_gross:    string
  delivery_gross:     string
  drivers_with_revenue: string
}

export interface TaxPeriod {
  id:                     string
  period_start:           string
  period_end:             string
  status:                 string
  tps_status:             string
  tvq_status:             string
  filing_due_date:        string
  gross_revenue_taxi:     string
  gross_revenue_rideshare: string
  gross_revenue_delivery: string
  public_driver_id:       string
  first_name:             string
  last_name:              string
}

export function useTaxCenter() {
  const [data, setData]       = useState<{ summary: TaxSummary; periods: TaxPeriod[]; registrations: unknown[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const d = await apiFetch<typeof data>('/api/tax')
      setData(d)
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void fetch_() }, [fetch_])
  return { taxData: data, loading, error, refresh: fetch_ }
}

// ─── Audit Logs ───────────────────────────────────────────────

export interface AuditLog {
  id:                         string
  action:                     string
  module:                     string
  severity:                   string
  result:                     string
  resource_type:              string | null
  resource_id:                string | null
  occurred_at:                string
  actor_type:                 string
  actor_role:                 string | null
  actor_email:                string | null
  subject_driver_public_id:   string | null
}

export function useAuditLogs(opts: { module?: string; severity?: string; search?: string } = {}) {
  const [logs, setLogs]       = useState<AuditLog[]>([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const params = new URLSearchParams({ limit: '50' })
      if (opts.module)   params.set('module', opts.module)
      if (opts.severity) params.set('severity', opts.severity)
      if (opts.search)   params.set('search', opts.search)
      const result = await apiFetch<{ logs: AuditLog[]; total: number }>(`/api/audit?${params}`)
      setLogs(result.logs)
      setTotal(result.total)
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [opts.module, opts.severity, opts.search])

  useEffect(() => { void fetch_() }, [fetch_])
  return { logs, total, loading, error, refresh: fetch_ }
}

// ─── Transactions ────────────────────────────────────────────

export interface Transaction {
  id:               string
  source_type:      string
  activity_type:    string
  entry_type:       string
  gross_amount:     string
  fee_amount:       string
  tip_amount:       string
  net_amount:       string
  currency:         string
  activity_date:    string
  is_settled:       boolean
  source_reference: string | null
  public_driver_id: string
  first_name:       string
  last_name:        string
}

export function useTransactions(opts: { source?: string; driverId?: string } = {}) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [totals, setTotals]             = useState<unknown[]>([])
  const [total, setTotal]               = useState(0)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const params = new URLSearchParams({ limit: '50' })
      if (opts.source)   params.set('source', opts.source)
      if (opts.driverId) params.set('driver_id', opts.driverId)
      const result = await apiFetch<{ transactions: Transaction[]; totals: unknown[]; total: number }>(
        `/api/transactions?${params}`
      )
      setTransactions(result.transactions)
      setTotals(result.totals)
      setTotal(result.total)
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [opts.source, opts.driverId])

  useEffect(() => { void fetch_() }, [fetch_])
  return { transactions, totals, total, loading, error, refresh: fetch_ }
}

// ─── Driver Detail ────────────────────────────────────────────

export function useDriverDetail(id: string) {
  const [data, setData]       = useState<unknown | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true); setError(null)
      const d = await apiFetch<unknown>(`/api/drivers/${id}`)
      setData(d)
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { void fetch_() }, [fetch_])
  return { driverDetail: data, loading, error, refresh: fetch_ }
}
