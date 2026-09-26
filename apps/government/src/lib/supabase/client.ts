import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Singleton — une seule instance dans tout le browser
const STORAGE_KEY = 'sb-gov-auth'
let _client: SupabaseClient | undefined

export function getSupabaseBrowserClient(): SupabaseClient {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
           ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  _client = createClient(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: STORAGE_KEY,
    },
  })
  return _client
}
