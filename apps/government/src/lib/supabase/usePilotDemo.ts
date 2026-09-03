'use client'

import { useCallback, useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from './client'

export type PilotDemoData = {
  scenario: { code: string; label: string; generatedAt: string }
  metrics: { drivers: number; online: number; activities: number; gross: number; net: number; tax: number; tips: number; snapshots: number; alerts: number; openCases: number }
  drivers: Array<{ id: string; number: string; name: string; status: string; verification: string; presence: string; location: string; onboardingCompletedAt: string | null }>
  accounts: Array<{ id: string; idPublic: string; name: string; provider: string; status: string; lastSyncAt: string | null }>
  activities: Array<{ id: string; driver: string; provider: string; type: string; status: string; startedAt: string; gross: number; fee: number; tip: number; tax: number; net: number; currency: string; reconciliation: string; quality: string }>
  transactions: Array<{ id: string; driver: string; provider: string; type: string; status: string; at: string; total: number; currency: string; receivedAt: string }>
  taxRecords: Array<{ id: string; driver: string; provider: string; taxable: number; providerTax: number; calculatedTax: number; variance: number; status: string; start: string; end: string }>
  tips: Array<{ id: string; driver: string; provider: string; amount: number; status: string; receivedAt: string }>
  settlements: Array<{ id: string; driver: string; provider: string; start: string; end: string; gross: number; earnings: number; fee: number; tax: number; tip: number; paid: number; status: string; at: string }>
  cases: Array<{ id: string; driver: string; provider: string; type: string; expected: number; actual: number; difference: number; status: string; note: string; period: string; createdAt: string }>
  alerts: Array<{ id: string; service: string; severity: string; status: string; title: string; message: string; triggered: number; threshold: number; at: string }>
  reports: Array<{ id: string; type: string; status: string; format: string; start: string; end: string; records: number; containsPii: boolean; generatedAt: string }>
  statements: Array<{ id: string; driver: string; type: string; status: string; start: string; end: string; reference: string; generatedAt: string }>
}

export function usePilotDemo() {
  const [data, setData] = useState<PilotDemoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const { data: sessionData } = await getSupabaseBrowserClient().auth.getSession()
      if (!sessionData.session) throw new Error('Session administrative requise.')
      const response = await fetch('/api/admin/pilot-demo', { headers: { Authorization: `Bearer ${sessionData.session.access_token}` }, cache: 'no-store' })
      const body = await response.json() as PilotDemoData & { error?: string }
      if (!response.ok) throw new Error(body.error ?? 'Chargement du scénario pilote impossible.')
      setData(body)
      setError(null)
    } catch (caught) {
      setData(null)
      setError(caught instanceof Error ? caught.message : 'Chargement du scénario pilote impossible.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])
  return { data, loading, error, refresh }
}
