'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { KeyRound, Lock, Search, Shield, UserPlus, X } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, PageHeader, StatusBadge } from '@/components/ui'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

type Administrator = { id: string; publicId: string; email: string; status: string; mfaRequired: boolean; mfaEnabled: boolean; lastLoginAt: string | null; createdAt: string; roles: string[] }
const ROLES = ['GOV_ADMIN', 'GOV_AUDITOR', 'GOV_INSPECTOR', 'GOV_TAX_OFFICER']
const roleColors: Record<string, string> = { SUPER_ADMIN: 'bg-red-100 text-red-700 border-red-200', GOV_ADMIN: 'bg-qc-blue/10 text-qc-blue border-blue-200', GOV_TAX_OFFICER: 'bg-purple-100 text-purple-700 border-purple-200', GOV_AUDITOR: 'bg-green-100 text-green-700 border-green-200', GOV_INSPECTOR: 'bg-orange-100 text-orange-700 border-orange-200' }

export default function GovernmentUsersPage() {
  const [users, setUsers] = useState<Administrator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showInvite, setShowInvite] = useState(false)
  const [invite, setInvite] = useState({ email: '', firstName: '', lastName: '', role: 'GOV_AUDITOR' })
  const [inviteState, setInviteState] = useState<{ loading: boolean; message: string | null; error: string | null }>({ loading: false, message: null, error: null })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getSupabaseBrowserClient().auth.getSession()
      if (!data.session) throw new Error('Session administrative requise.')
      const response = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${data.session.access_token}` }, cache: 'no-store' })
      const body = await response.json() as { users?: Administrator[]; error?: string }
      if (!response.ok || !body.users) throw new Error(body.error ?? 'Chargement des administrateurs impossible.')
      setUsers(body.users)
      setError(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Chargement des administrateurs impossible.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => users.filter((user) => {
    const term = search.trim().toLowerCase()
    return (!term || [user.publicId, user.email, ...user.roles].join(' ').toLowerCase().includes(term)) && (statusFilter === 'all' || user.status === statusFilter)
  }), [users, search, statusFilter])

  const counts = useMemo(() => ({ ACTIVE: users.filter((user) => user.status === 'ACTIVE').length, PENDING: users.filter((user) => user.status === 'PENDING').length, SUSPENDED: users.filter((user) => user.status === 'SUSPENDED').length, LOCKED: users.filter((user) => user.status === 'LOCKED').length }), [users])

  const submitInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setInviteState({ loading: true, message: null, error: null })
    try {
      const { data } = await getSupabaseBrowserClient().auth.getSession()
      if (!data.session) throw new Error('Session administrative requise.')
      const response = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` }, body: JSON.stringify(invite) })
      const body = await response.json() as { invited?: { email: string; role: string }; error?: string }
      if (!response.ok || !body.invited) throw new Error(body.error ?? 'Invitation impossible.')
      setInviteState({ loading: false, message: `Invitation envoyée à ${body.invited.email}. MFA requis à l’activation.`, error: null })
      setInvite({ email: '', firstName: '', lastName: '', role: 'GOV_AUDITOR' })
      await load()
    } catch (caught) {
      setInviteState({ loading: false, message: null, error: caught instanceof Error ? caught.message : 'Invitation impossible.' })
    }
  }

  return <AppShell><PageHeader title="Utilisateurs gouvernementaux" subtitle="Comptes, rôles, MFA et invitations Supabase" actions={<button onClick={() => setShowInvite(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-qc-blue text-white text-xs font-semibold hover:bg-blue-700"><UserPlus size={14} />Nouvel utilisateur</button>} />
    <div className="flex items-start gap-2 px-4 py-2.5 mb-4 rounded-xl bg-blue-50 border border-blue-200"><Shield size={13} className="text-qc-blue mt-0.5 shrink-0" /><p className="text-xs text-blue-700">Les comptes administratifs sont créés par invitation. La confirmation du courriel et l’authentification multifacteur sont obligatoires avant tout accès aux données de supervision.</p></div>
    <div className="grid grid-cols-4 gap-3 mb-5">{Object.entries(counts).map(([status, count]) => <button key={status} onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)} className={`p-3 rounded-xl border text-center transition-all ${statusFilter === status ? 'bg-qc-blue border-qc-blue text-white' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}><div className={`text-2xl font-bold ${statusFilter === status ? 'text-white' : status === 'ACTIVE' ? 'text-green-600' : status === 'PENDING' ? 'text-orange-500' : 'text-red-600'}`}>{count}</div><div className="text-[10px] font-semibold">{status}</div></button>)}</div>
    <Card className="mb-4 p-3"><div className="flex flex-wrap gap-2"><div className="flex-1 min-w-48 flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"><Search size={13} className="text-slate-400 shrink-0" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ID, courriel ou rôle…" className="flex-1 bg-transparent text-sm outline-none text-slate-700 dark:text-slate-200" /></div><button onClick={() => void load()} className="rounded-lg px-3 py-2 text-xs font-semibold text-qc-blue hover:bg-blue-50">Actualiser</button><span className="text-xs text-slate-400 self-center">{filtered.length} utilisateur(s)</span></div></Card>
    {error ? <Card className="p-6 text-center text-sm text-red-600">{error}</Card> : <Card><div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-slate-100 dark:border-slate-800">{['ID','Utilisateur','Rôles','Statut','MFA','Dernière connexion','Créé'].map((head) => <th key={head} className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">{head}</th>)}</tr></thead><tbody>{loading ? <tr><td colSpan={7} className="px-3 py-10 text-center text-sm text-slate-500">Chargement des comptes réels…</td></tr> : filtered.map((user) => <tr key={user.id} className="border-b border-slate-50 dark:border-slate-800"><td className="px-3 py-3"><span className="font-mono text-[10px] text-qc-blue font-bold">{user.publicId}</span></td><td className="px-3 py-3 text-xs text-slate-700 dark:text-slate-200">{user.email}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-1">{user.roles.map((role) => <span key={role} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${roleColors[role] ?? 'bg-slate-100 text-slate-600'}`}>{role}</span>)}</div></td><td className="px-3 py-3"><StatusBadge status={user.status.toLowerCase()} /></td><td className="px-3 py-3 text-[10px] font-bold">{user.mfaEnabled ? <span className="text-green-600">MFA ACTIVÉ</span> : <span className="text-orange-500">MFA REQUIS</span>}</td><td className="px-3 py-3 text-[10px] text-slate-400">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('fr-CA') : 'Jamais'}</td><td className="px-3 py-3 text-[10px] text-slate-400">{new Date(user.createdAt).toLocaleDateString('fr-CA')}</td></tr>)}{!loading && filtered.length === 0 && <tr><td colSpan={7} className="px-3 py-10 text-center text-sm text-slate-500">Aucun compte administratif ne correspond à ce filtre.</td></tr>}</tbody></table></div></Card>}
    {showInvite && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4"><form onSubmit={submitInvite} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900"><div className="mb-5 flex items-start justify-between"><div><h2 className="font-bold text-slate-800 dark:text-white">Inviter un administrateur</h2><p className="mt-1 text-xs text-slate-500">Le destinataire active son accès par courriel et MFA.</p></div><button type="button" onClick={() => setShowInvite(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button></div><div className="grid grid-cols-2 gap-3 mb-3"><label className="text-xs font-semibold text-slate-600">Prénom<input value={invite.firstName} onChange={(event) => setInvite({ ...invite, firstName: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" /></label><label className="text-xs font-semibold text-slate-600">Nom<input value={invite.lastName} onChange={(event) => setInvite({ ...invite, lastName: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" /></label></div><label className="block text-xs font-semibold text-slate-600 mb-3">Courriel<input required type="email" value={invite.email} onChange={(event) => setInvite({ ...invite, email: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700" placeholder="nom@organisation.gouv.qc.ca" /></label><label className="block text-xs font-semibold text-slate-600 mb-4">Rôle<select value={invite.role} onChange={(event) => setInvite({ ...invite, role: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700">{ROLES.map((role) => <option key={role}>{role}</option>)}</select></label>{inviteState.error && <p className="mb-3 text-xs text-red-600">{inviteState.error}</p>}{inviteState.message && <p className="mb-3 text-xs text-green-600">{inviteState.message}</p>}<button disabled={inviteState.loading} type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-qc-blue px-3 py-3 text-sm font-bold text-white disabled:opacity-60"><KeyRound size={15} />{inviteState.loading ? 'Invitation…' : 'Envoyer l’invitation sécurisée'}</button></form></div>}
  </AppShell>
}
