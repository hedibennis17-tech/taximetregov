// GET /api/provider-transparency — Module 31 Dashboard
// Provider Revenue Transparency & Transaction Reconciliation
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { apiError, requireGovernmentAdministrator } from '@/lib/supabase/authorization'

export async function GET(req: NextRequest) {
  try {
    await requireGovernmentAdministrator(req)
    const admin = getSupabaseAdminClient()
    const [ledgerResult, casesResult, profilesResult, providersResult] = await Promise.all([
      admin.from('revenue_ledger').select('driver_id, provider_id, source_type, activity_type, gross_amount, tip_amount, fee_amount, net_amount, activity_date, is_settled').like('source_reference', 'DEMO-%'),
      admin.from('reconciliation_cases').select('id, driver_id, provider_id, case_type, expected_amount, actual_amount, difference_amount, recon_case_status, created_at').eq('period_reference', 'DEMO-2026-01'),
      admin.from('driver_profiles').select('id, driver_number, first_name, last_name').like('driver_number', 'DEMO-%'),
      admin.from('providers').select('id, name'),
    ])
    for (const result of [ledgerResult, casesResult, profilesResult, providersResult]) if (result.error) throw result.error
    const asNumber = (input: unknown) => Number(input ?? 0) || 0
    const ledger = ledgerResult.data ?? []
    const drivers = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]))
    const providers = new Map((providersResult.data ?? []).map((provider) => [provider.id, provider.name]))
    const groups = new Map<string, { provider: string; transactions: number; gross: number; tips: number; fees: number; net: number; drivers: Set<string>; last: string; settled: number }>()
    const services = new Map<string, { service_type: string; transactions: number; gross: number; tips: number; net: number }>()
    for (const row of ledger) {
      const key = row.source_type
      const group = groups.get(key) ?? { provider: key, transactions: 0, gross: 0, tips: 0, fees: 0, net: 0, drivers: new Set<string>(), last: '', settled: 0 }
      group.transactions += 1; group.gross += asNumber(row.gross_amount); group.tips += asNumber(row.tip_amount); group.fees += asNumber(row.fee_amount); group.net += asNumber(row.net_amount); group.drivers.add(row.driver_id); group.last = row.activity_date ?? group.last; group.settled += row.is_settled ? 1 : 0; groups.set(key, group)
      const service = services.get(row.activity_type) ?? { service_type: row.activity_type, transactions: 0, gross: 0, tips: 0, net: 0 }
      service.transactions += 1; service.gross += asNumber(row.gross_amount); service.tips += asNumber(row.tip_amount); service.net += asNumber(row.net_amount); services.set(row.activity_type, service)
    }
    const total = ledger.reduce((summary, row) => ({ gross: summary.gross + asNumber(row.gross_amount), tips: summary.tips + asNumber(row.tip_amount), fees: summary.fees + asNumber(row.fee_amount), net: summary.net + asNumber(row.net_amount) }), { gross: 0, tips: 0, fees: 0, net: 0 })
    const cases = casesResult.data ?? []
    return NextResponse.json({ success: true, data: {
      volume: { total_transactions: String(ledger.length), total_gross: String(total.gross), total_tips: String(total.tips), total_fees: String(total.fees), total_net: String(total.net), unique_drivers: String(new Set(ledger.map((row) => row.driver_id)).size), unique_providers: String(groups.size), settled_amount: String(ledger.filter((row) => row.is_settled).reduce((sum, row) => sum + asNumber(row.gross_amount), 0)), pending_amount: '0' },
      byProvider: [...groups.values()].map((group) => ({ provider: group.provider, transactions: String(group.transactions), gross: String(group.gross), tips: String(group.tips), fees: String(group.fees), net: String(group.net), drivers: String(group.drivers.size), last_activity: group.last, settled: String(group.settled) })),
      byService: [...services.values()].map((service) => ({ ...service, transactions: String(service.transactions), gross: String(service.gross), tips: String(service.tips), net: String(service.net) })),
      reconciliation: { total_cases: String(cases.length), resolved: String(cases.filter((item) => item.recon_case_status === 'RESOLVED').length), open_cases: String(cases.filter((item) => !['RESOLVED', 'CLOSED', 'MATCHED'].includes(item.recon_case_status)).length), critical: '0', high: String(cases.length) },
      exceptions: cases.map((item) => { const driver = drivers.get(item.driver_id); return { id: item.id, case_type: item.case_type, severity: 'HIGH', status: item.recon_case_status, expected_amount: String(item.expected_amount ?? 0), actual_amount: String(item.actual_amount ?? 0), difference_amount: String(item.difference_amount ?? 0), currency: 'CAD', created_at: item.created_at, public_driver_id: driver?.driver_number ?? null, first_name: driver?.first_name ?? null, last_name: driver?.last_name ?? null, provider_name: providers.get(item.provider_id) ?? null } }),
      generatedAt: new Date().toISOString(), period: 'pilot',
    } })
  } catch (err) {
    const response = apiError(err)
    return NextResponse.json({ success: false, error: response.body.error }, { status: response.status })
  }
}
