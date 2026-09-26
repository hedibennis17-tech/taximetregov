// GET /api/gov/drivers — Liste chauffeurs via REST Supabase (bypass RLS)
import { type NextRequest, NextResponse } from 'next/server'

const SB = process.env.NEXT_PUBLIC_SUPABASE_URL!
const KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const status = searchParams.get('status') ?? ''

  try {
    // 1. Profils chauffeurs
    let profilesPath = `driver_profiles?select=id,driver_number,first_name,last_name,status,identity_verification_status,province,phone,language,created_at,user_id&order=created_at.asc&limit=50`
    if (status) profilesPath += `&status=eq.${status}`

    const pRes = await fetch(`${SB}/rest/v1/${profilesPath}`, {
      headers: { apikey: KEY(), Authorization: `Bearer ${KEY()}` }
    })
    const profiles = await pRes.json() as Array<Record<string,string>>

    if (!profiles.length) return NextResponse.json({ drivers: [], total: 0 })

    // 2. Users (emails)
    const userIds = profiles.map(p => p['user_id']).filter(Boolean)
    const uRes = await fetch(
      `${SB}/rest/v1/users?id=in.(${userIds.join(',')})&select=id,email,status`,
      { headers: { apikey: KEY(), Authorization: `Bearer ${KEY()}` } }
    )
    const users = await uRes.json() as Array<Record<string,string>>
    const userMap = Object.fromEntries(users.map(u => [u['id'], u]))

    // 3. Revenue ledger ce mois
    const now = new Date()
    const monthStart = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`
    const driverIds = profiles.map(p => p['id'])

    const rRes = await fetch(
      `${SB}/rest/v1/revenue_ledger?driver_id=in.(${driverIds.join(',')})&activity_date=gte.${monthStart}&select=driver_id,gross_amount`,
      { headers: { apikey: KEY(), Authorization: `Bearer ${KEY()}` } }
    )
    const revenue = await rRes.json() as Array<Record<string,string>>
    const revMap: Record<string,number> = {}
    for (const r of revenue) {
      const id = r['driver_id'] ?? ''
      revMap[id] = (revMap[id] ?? 0) + parseFloat(r['gross_amount'] ?? '0')
    }

    // 4. Platforms
    const plRes = await fetch(
      `${SB}/rest/v1/driver_provider_accounts?driver_id=in.(${driverIds.join(',')})&select=driver_id,provider_account_status`,
      { headers: { apikey: KEY(), Authorization: `Bearer ${KEY()}` } }
    )
    const platforms = await plRes.json() as Array<Record<string,string>>
    const platMap: Record<string,number> = {}
    for (const p of platforms) {
      if (p['provider_account_status'] === 'ACTIVE') {
        platMap[p['driver_id']!] = (platMap[p['driver_id']!] ?? 0) + 1
      }
    }

    // Build result
    let drivers = profiles.map(p => {
      const u = userMap[p['user_id'] ?? '']
      return {
        id:                          p['id'],
        driver_number:               p['driver_number'],
        first_name:                  p['first_name'],
        last_name:                   p['last_name'],
        email:                       u?.['email'] ?? '',
        status:                      p['status'],
        identity_verification_status:p['identity_verification_status'],
        province:                    p['province'],
        language:                    p['language'],
        gross_month:                 Math.round((revMap[p['id']!] ?? 0) * 100) / 100,
        platforms_count:             platMap[p['id']!] ?? 0,
        created_at:                  p['created_at'],
        is_real:                     true,
      }
    })

    // Filtre recherche
    if (search) {
      const q = search.toLowerCase()
      drivers = drivers.filter(d =>
        d.first_name?.toLowerCase().includes(q) ||
        d.last_name?.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q) ||
        d.driver_number?.toLowerCase().includes(q)
      )
    }

    return NextResponse.json({ drivers, total: drivers.length, source: 'SUPABASE' })
  } catch (err) {
    return NextResponse.json({ error: String(err), drivers: [], total: 0 }, { status: 500 })
  }
}
