import { NextRequest, NextResponse } from 'next/server'
import { apiError, requireGovernmentAdministrator } from '@/lib/supabase/authorization'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const administrator = await requireGovernmentAdministrator(request)
    return NextResponse.json({ administrator })
  } catch (error) {
    const response = apiError(error)
    return NextResponse.json(response.body, { status: response.status })
  }
}
