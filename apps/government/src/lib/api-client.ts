'use client'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export async function govFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const sb = getSupabaseBrowserClient()
  const { data: { session } } = await sb.auth.getSession()
  const token = session?.access_token

  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    credentials: 'include',
  })

  const json = await res.json() as { success?: boolean; data?: T; error?: string } & T
  // Support both { success, data } and direct object response
  if ('success' in json && json.success === false) throw new Error(json.error ?? `Erreur ${res.status}`)
  if (!res.ok) throw new Error(`Erreur ${res.status}`)
  return ('data' in json && json.data !== undefined) ? json.data as T : json as T
}

export function money(v: string | number, currency = 'CAD'): string {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency', currency, maximumFractionDigits: 2,
  }).format(typeof v === 'string' ? parseFloat(v) || 0 : v)
}
