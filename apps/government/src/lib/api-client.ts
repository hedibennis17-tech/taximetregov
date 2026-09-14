// ================================================================
// TAXIMETER.GOV — API CLIENT GOUVERNEMENTAL
// Gère le token Supabase automatiquement pour toutes les requêtes
// ================================================================

'use client'

import { createClient } from '@supabase/supabase-js'

let _sb: ReturnType<typeof createClient> | null = null

function getSB() {
  if (_sb) return _sb
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
           ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  _sb = createClient(url, key, { auth: { autoRefreshToken: true, persistSession: true } })
  return _sb
}

export async function govFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const sb = getSB()
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

  const json = await res.json() as { success: boolean; data: T; error?: string }
  if (!res.ok || !json.success) throw new Error(json.error ?? `Erreur ${res.status}`)
  return json.data
}

export function money(v: string | number, currency = 'CAD'): string {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency', currency, maximumFractionDigits: 2,
  }).format(typeof v === 'string' ? parseFloat(v) || 0 : v)
}
