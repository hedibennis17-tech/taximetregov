import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { apiError, requireGovernmentAdministrator } from '@/lib/supabase/authorization'

export const dynamic = 'force-dynamic'

const value = (input: unknown) => {
  const number = Number(input ?? 0)
  return Number.isFinite(number) ? number : 0
}

const text = (input: unknown) => String(input ?? '')

export async function GET(request: NextRequest) {
  try {
    await requireGovernmentAdministrator(request)
    const admin = getSupabaseAdminClient()

    const [driversResult, presencesResult, activitiesResult, ledgerResult, accountsResult, providersResult, snapshotsResult, taxRecordsResult, tipsResult, settlementsResult, casesResult, alertsResult, reportsResult, statementsResult] = await Promise.all([
      admin.from('driver_profiles').select('id, driver_number, first_name, last_name, status, identity_verification_status, onboarding_completed_at').like('driver_number', 'DEMO-%').order('driver_number'),
      admin.from('driver_presences').select('driver_id, status, location_label, last_online_at, last_offline_at'),
      admin.from('driver_activities').select('id, public_id, driver_id, provider_id, provider_account_id, activity_type_code, status, started_at, completed_at, gross_amount, fee_amount, tip_amount, tax_amount, net_amount, currency, reconciliation_status, data_quality_status').like('public_id', 'DEMO-%').order('started_at', { ascending: false }),
      admin.from('revenue_ledger').select('id, driver_id, provider_id, source_type, activity_type, gross_amount, fee_amount, tip_amount, tax_amount, adjustment_amount, net_amount, currency, activity_date, is_settled, settled_at, source_reference').like('source_reference', 'DEMO-%').order('activity_date', { ascending: false }),
      admin.from('driver_provider_accounts').select('id, driver_id, provider_id, public_provider_account_id, display_name, provider_account_status, last_sync_at').like('public_provider_account_id', 'DEMO-%'),
      admin.from('providers').select('id, code, name, provider_type, provider_status'),
      admin.from('provider_transaction_snapshots').select('id, provider_id, driver_id, provider_transaction_id, transaction_type, transaction_status, transaction_at, customer_total, currency, source_received_at').like('provider_transaction_id', 'DEMO-%').order('transaction_at', { ascending: false }),
      admin.from('provider_tax_records').select('id, provider_id, driver_id, provider_reference, taxable_amount, reported_tax_amount, government_calculated_amount, variance_amount, tax_status, reporting_period_start, reporting_period_end').like('provider_reference', 'DEMO-%'),
      admin.from('provider_tip_records').select('id, provider_id, driver_id, provider_tip_reference, tip_amount, tip_status, tip_received_at').like('provider_tip_reference', 'DEMO-%'),
      admin.from('provider_settlements').select('id, provider_id, driver_id, provider_settlement_id, period_start, period_end, gross_customer_amount, driver_transport_earnings, tip_amount, provider_fee_amount, tax_amount, total_payable, amount_paid, currency, settlement_date, status').like('provider_settlement_id', 'DEMO-%'),
      admin.from('reconciliation_cases').select('id, driver_id, provider_id, case_type, expected_amount, actual_amount, difference_amount, recon_case_status, exception_note, period_reference, created_at').eq('period_reference', 'DEMO-2026-01'),
      admin.from('alerts').select('id, service_name, alert_severity, alert_status, title, message, triggered_value, threshold_value, fired_at').like('title', 'DEMO-%').order('fired_at', { ascending: false }),
      admin.from('regulatory_reports').select('id, public_report_id, report_type, status, format, period_start, period_end, record_count, contains_pii, generated_at').like('public_report_id', 'DEMO-%'),
      admin.from('driver_financial_statements').select('id, public_id, driver_id, statement_type, status, period_start, period_end, document_ref, generated_at').like('public_id', 'DEMO-%'),
    ])

    const results = [driversResult, presencesResult, activitiesResult, ledgerResult, accountsResult, providersResult, snapshotsResult, taxRecordsResult, tipsResult, settlementsResult, casesResult, alertsResult, reportsResult, statementsResult]
    for (const result of results) if (result.error) throw result.error

    const drivers = (driversResult.data ?? []) as Array<Record<string, unknown>>
    const presences = (presencesResult.data ?? []) as Array<Record<string, unknown>>
    const activities = (activitiesResult.data ?? []) as Array<Record<string, unknown>>
    const ledger = (ledgerResult.data ?? []) as Array<Record<string, unknown>>
    const providers = (providersResult.data ?? []) as Array<Record<string, unknown>>
    const accounts = (accountsResult.data ?? []) as Array<Record<string, unknown>>
    const snapshots = (snapshotsResult.data ?? []) as Array<Record<string, unknown>>
    const taxRecords = (taxRecordsResult.data ?? []) as Array<Record<string, unknown>>
    const tips = (tipsResult.data ?? []) as Array<Record<string, unknown>>
    const settlements = (settlementsResult.data ?? []) as Array<Record<string, unknown>>
    const cases = (casesResult.data ?? []) as Array<Record<string, unknown>>

    const driverById = new Map(drivers.map((driver) => [text(driver.id), driver]))
    const providerById = new Map(providers.map((provider) => [text(provider.id), provider]))
    const presenceByDriverId = new Map(presences.map((presence) => [text(presence.driver_id), presence]))
    const providerName = (id: unknown) => text(providerById.get(text(id))?.name) || 'Taxi / instrument numérique'
    const driverName = (id: unknown) => {
      const driver = driverById.get(text(id))
      return driver ? `${text(driver.first_name)} ${text(driver.last_name)}`.trim() : 'Dossier pilote'
    }

    const gross = ledger.reduce((sum, line) => sum + value(line.gross_amount), 0)
    const net = ledger.reduce((sum, line) => sum + value(line.net_amount), 0)
    const tax = ledger.reduce((sum, line) => sum + value(line.tax_amount), 0)
    const tipsTotal = ledger.reduce((sum, line) => sum + value(line.tip_amount), 0)

    return NextResponse.json({
      scenario: { code: 'PILOT-2026', label: 'Scénario pilote — données synthétiques', generatedAt: new Date().toISOString() },
      metrics: {
        drivers: drivers.length,
        online: presences.filter((presence) => text(presence.status) === 'ONLINE').length,
        activities: activities.length,
        gross,
        net,
        tax,
        tips: tipsTotal,
        snapshots: snapshots.length,
        alerts: (alertsResult.data ?? []).length,
        openCases: cases.filter((item) => !['RESOLVED', 'CLOSED', 'MATCHED'].includes(text(item.recon_case_status))).length,
      },
      drivers: drivers.map((driver) => ({
        id: text(driver.id), number: text(driver.driver_number), name: `${text(driver.first_name)} ${text(driver.last_name)}`.trim(), status: text(driver.status), verification: text(driver.identity_verification_status), presence: text(presenceByDriverId.get(text(driver.id))?.status) || 'OFFLINE', location: text(presenceByDriverId.get(text(driver.id))?.location_label), onboardingCompletedAt: driver.onboarding_completed_at,
      })),
      accounts: accounts.map((account) => ({ id: text(account.id), idPublic: text(account.public_provider_account_id), name: text(account.display_name), provider: providerName(account.provider_id), status: text(account.provider_account_status), lastSyncAt: account.last_sync_at })),
      activities: activities.map((activity) => ({ id: text(activity.public_id), driver: driverName(activity.driver_id), provider: providerName(activity.provider_id), type: text(activity.activity_type_code), status: text(activity.status), startedAt: activity.started_at, gross: value(activity.gross_amount), fee: value(activity.fee_amount), tip: value(activity.tip_amount), tax: value(activity.tax_amount), net: value(activity.net_amount), currency: text(activity.currency), reconciliation: text(activity.reconciliation_status), quality: text(activity.data_quality_status) })),
      transactions: snapshots.map((snapshot) => ({ id: text(snapshot.provider_transaction_id), driver: driverName(snapshot.driver_id), provider: providerName(snapshot.provider_id), type: text(snapshot.transaction_type), status: text(snapshot.transaction_status), at: snapshot.transaction_at, total: value(snapshot.customer_total), currency: text(snapshot.currency), receivedAt: snapshot.source_received_at })),
      taxRecords: taxRecords.map((record) => ({ id: text(record.provider_reference), driver: driverName(record.driver_id), provider: providerName(record.provider_id), taxable: value(record.taxable_amount), providerTax: value(record.reported_tax_amount), calculatedTax: value(record.government_calculated_amount), variance: value(record.variance_amount), status: text(record.tax_status), start: record.reporting_period_start, end: record.reporting_period_end })),
      tips: tips.map((tip) => ({ id: text(tip.provider_tip_reference), driver: driverName(tip.driver_id), provider: providerName(tip.provider_id), amount: value(tip.tip_amount), status: text(tip.tip_status), receivedAt: tip.tip_received_at })),
      settlements: settlements.map((settlement) => ({ id: text(settlement.provider_settlement_id), driver: driverName(settlement.driver_id), provider: providerName(settlement.provider_id), start: settlement.period_start, end: settlement.period_end, gross: value(settlement.gross_customer_amount), earnings: value(settlement.driver_transport_earnings), fee: value(settlement.provider_fee_amount), tax: value(settlement.tax_amount), tip: value(settlement.tip_amount), paid: value(settlement.amount_paid), status: text(settlement.status), at: settlement.settlement_date })),
      cases: cases.map((item) => ({ id: text(item.id), driver: driverName(item.driver_id), provider: providerName(item.provider_id), type: text(item.case_type), expected: value(item.expected_amount), actual: value(item.actual_amount), difference: value(item.difference_amount), status: text(item.recon_case_status), note: text(item.exception_note), period: text(item.period_reference), createdAt: item.created_at })),
      alerts: (alertsResult.data ?? []).map((alert) => ({ id: text(alert.id), service: text(alert.service_name), severity: text(alert.alert_severity), status: text(alert.alert_status), title: text(alert.title), message: text(alert.message), triggered: value(alert.triggered_value), threshold: value(alert.threshold_value), at: alert.fired_at })),
      reports: (reportsResult.data ?? []).map((report) => ({ id: text(report.public_report_id), type: text(report.report_type), status: text(report.status), format: text(report.format), start: report.period_start, end: report.period_end, records: value(report.record_count), containsPii: Boolean(report.contains_pii), generatedAt: report.generated_at })),
      statements: (statementsResult.data ?? []).map((statement) => ({ id: text(statement.public_id), driver: driverName(statement.driver_id), type: text(statement.statement_type), status: text(statement.status), start: statement.period_start, end: statement.period_end, reference: text(statement.document_ref), generatedAt: statement.generated_at })),
    })
  } catch (error) {
    const response = apiError(error)
    return NextResponse.json(response.body, { status: response.status })
  }
}
