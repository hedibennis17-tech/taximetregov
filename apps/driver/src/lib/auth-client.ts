// ================================================================
// TAXIMÈTRE.GOV — AUTH CLIENT
// Système simple: Supabase Auth → token → API routes
// ================================================================

import { getSupabaseBrowserClient } from './supabase/client'

// Récupère le token de session actif
export async function getAuthToken(): Promise<string | null> {
  try {
    const supabase = getSupabaseBrowserClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  } catch {
    return null
  }
}

// Déconnexion complète
export async function signOut(): Promise<void> {
  try {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
  } catch { /* ignore */ }
  window.location.href = '/auth/login'
}

// Vérifie si l'utilisateur est connecté
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken()
  return !!token
}
