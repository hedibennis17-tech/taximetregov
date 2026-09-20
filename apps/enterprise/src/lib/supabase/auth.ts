import { getSupabaseBrowserClient } from './client'

export type AuthUser = {
  id:        string
  email:     string
  role:      string
  name:      string
  enterpriseId: string
}

/** Connexion email + password */
export async function signIn(email: string, password: string) {
  const sb = getSupabaseBrowserClient()
  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

/** Déconnexion */
export async function signOut() {
  const sb = getSupabaseBrowserClient()
  await sb.auth.signOut()
}

/** Session courante */
export async function getSession() {
  const sb = getSupabaseBrowserClient()
  const { data } = await sb.auth.getSession()
  return data.session
}

/** User courant + métadonnées */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const sb = getSupabaseBrowserClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return null
  const meta = user.user_metadata ?? {}
  return {
    id:           user.id,
    email:        user.email ?? '',
    role:         meta.role         ?? 'VIEWER',
    name:         meta.name         ?? user.email ?? '',
    enterpriseId: meta.enterprise_id ?? 'ENT-DEMO-001',
  }
}

/** Écoute les changements d'auth */
export function onAuthStateChange(cb: (user: AuthUser | null) => void) {
  const sb = getSupabaseBrowserClient()
  return sb.auth.onAuthStateChange(async (_event: unknown, session: { user?: { id: string; email?: string; user_metadata?: Record<string, string> } } | null) => {
    if (!session?.user) { cb(null); return }
    const u = session.user
    const meta = u.user_metadata ?? {}
    cb({
      id:           u.id,
      email:        u.email ?? '',
      role:         meta.role         ?? 'VIEWER',
      name:         meta.name         ?? u.email ?? '',
      enterpriseId: meta.enterprise_id ?? 'ENT-DEMO-001',
    })
  })
}
