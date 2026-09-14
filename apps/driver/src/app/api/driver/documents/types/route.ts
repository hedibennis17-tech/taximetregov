import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/db'

export async function GET(_req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) return apiError('Config manquante', 503)
  const res = await fetch(`${url}/rest/v1/document_types?is_active=eq.true&select=id,code,label,label_fr,owner_type,has_expiry_date,renewal_notice_days&order=label.asc`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  })
  const types = await res.json() as unknown[]
  return apiSuccess({ types })
}
