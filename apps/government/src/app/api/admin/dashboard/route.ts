import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { apiError, requireGovernmentAdministrator } from '@/lib/supabase/authorization'

export const dynamic = 'force-dynamic'

function amount(value: unknown) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

export async function GET(request: NextRequest) {
  try {
    await requireGovernmentAdministrator(request)
    const admin = getSupabaseAdminClient()
    const start = new Date()
    start.setHours(0, 0, 0, 0)

    const [driversResult, presencesResult, activitiesResult, alertsResult] = await Promise.all([
      admin.from('driver_profiles').select('id, status').is('deleted_at', null),
      admin.from('driver_presences').select('driver_id, status'),
      admin.from('driver_activities').select('activity_type_code, gross_amount, final_amount, tax_amount, net_amount, tip_amount, fee_amount, started_at').gte('started_at', start.toISOString()),
      admin.from('alerts').select('id', { count: 'exact', head: true }),
    ])

    for (const result of [driversResult, presencesResult, activitiesResult, alertsResult]) {
      if (result.error) throw result.error
    }

    const drivers = driversResult.data ?? []
    const activities = activitiesResult.data ?? []
    const activeDrivers = drivers.filter((driver) => driver.status === 'ACTIVE').length
    const pendingDrivers = drivers.filter((driver) => driver.status === 'PENDING').length
    const suspendedDrivers = drivers.filter((driver) => ['SUSPENDED', 'DEACTIVATED'].includes(driver.status)).length
    const onlineDrivers = (presencesResult.data ?? []).filter((presence) => presence.status === 'ONLINE').length

    const revenue = activities.reduce((totals, activity) => ({
      gross: totals.gross + amount(activity.final_amount) + (amount(activity.final_amount) === 0 ? amount(activity.gross_amount) : 0),
      net: totals.net + (amount(activity.net_amount) || amount(activity.final_amount) || amount(activity.gross_amount)),
      tax: totals.tax + amount(activity.tax_amount),
      tips: totals.tips + amount(activity.tip_amount),
      fees: totals.fees + amount(activity.fee_amount),
    }), { gross: 0, net: 0, tax: 0, tips: 0, fees: 0 })

    const taxiTrips = activities.filter((activity) => activity.activity_type_code === 'TAXI_TRIP').length
    const deliveries = activities.filter((activity) => ['FOOD_DELIVERY', 'GROCERY_DELIVERY', 'PARCEL_DELIVERY', 'COURIER'].includes(activity.activity_type_code)).length

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      drivers: { total: drivers.length, active: activeDrivers, pending: pendingDrivers, suspended: suspendedDrivers, online: onlineDrivers },
      activity: { total: activities.length, taxiTrips, deliveries },
      revenue,
      alerts: alertsResult.count ?? 0,
    })
  } catch (error) {
    const response = apiError(error)
    return NextResponse.json(response.body, { status: response.status })
  }
}
