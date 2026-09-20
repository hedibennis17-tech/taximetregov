// ── TAXIMETER.GOV — Journal de sécurité ──
// Enregistre les événements d'authentification et d'accès

export type SecurityEvent =
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'SESSION_CREATED'
  | 'SESSION_EXPIRED'
  | 'PASSWORD_RESET'
  | 'ROLE_CHANGED'
  | 'PERMISSION_CHANGED'
  | 'ACCESS_DENIED'
  | 'SENSITIVE_DATA_ACCESS'

export type SecurityLogEntry = {
  id:           string
  event:        SecurityEvent
  userId:       string | null
  email:        string | null
  role:         string | null
  enterpriseId: string | null
  route:        string | null
  ip:           string | null
  userAgent:    string | null
  at:           string
  detail:       string | null
  success:      boolean
}

const LOG_KEY = 'taximetregov_security_log'
const MAX_ENTRIES = 200

function generateId(): string {
  return 'SL-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2,6).toUpperCase()
}

export function logSecurityEvent(
  event: SecurityEvent,
  opts: Partial<Omit<SecurityLogEntry, 'id'|'at'|'event'>> & { success?: boolean }
): void {
  if (typeof window === 'undefined') return
  try {
    const entries: SecurityLogEntry[] = JSON.parse(localStorage.getItem(LOG_KEY) ?? '[]')
    const entry: SecurityLogEntry = {
      id:           generateId(),
      event,
      userId:       opts.userId       ?? null,
      email:        opts.email        ?? null,
      role:         opts.role         ?? null,
      enterpriseId: opts.enterpriseId ?? null,
      route:        opts.route        ?? (typeof window !== 'undefined' ? window.location.pathname : null),
      ip:           null, // client-side: pas d'IP
      userAgent:    typeof navigator !== 'undefined' ? navigator.userAgent.slice(0,100) : null,
      at:           new Date().toISOString(),
      detail:       opts.detail ?? null,
      success:      opts.success ?? true,
    }
    entries.unshift(entry)
    localStorage.setItem(LOG_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)))
  } catch {}
}

export function getSecurityLog(): SecurityLogEntry[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) ?? '[]')
  } catch { return [] }
}

export function clearSecurityLog(): void {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(LOG_KEY) } catch {}
}
