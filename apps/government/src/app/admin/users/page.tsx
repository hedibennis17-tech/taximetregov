'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, StatusBadge } from '@/components/ui'
import { mockGovernmentUsers, mockOrganizations, type UserStatus } from '@/data/operations.mock'
import { useState } from 'react'
import { Search, UserPlus, Shield, Key, Lock, Unlock, Eye } from 'lucide-react'

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700 border-red-200',
  GOVERNMENT_ADMIN: 'bg-qc-blue/10 text-qc-blue border-blue-200',
  TAX_ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
  COMPLIANCE_OFFICER: 'bg-blue-100 text-blue-700 border-blue-200',
  AUDITOR: 'bg-green-100 text-green-700 border-green-200',
  LICENSING_OFFICER: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  SUPPORT_AGENT: 'bg-amber-100 text-amber-700 border-amber-200',
  ANALYST: 'bg-teal-100 text-teal-700 border-teal-200',
  INSPECTOR: 'bg-orange-100 text-orange-700 border-orange-200',
  SYSTEM_ADMIN: 'bg-slate-100 text-slate-700 border-slate-200',
}
const statusFilters: { value: UserStatus | 'all'; label: string }[] = [
  { value:'all', label:'Tous' }, { value:'ACTIVE', label:'Actifs' }, { value:'INACTIVE', label:'Inactifs' },
  { value:'SUSPENDED', label:'Suspendus' }, { value:'PENDING', label:'En attente' }, { value:'LOCKED', label:'Verrouillés' }
]

export default function GovernmentUsersPage() {
  const [search, setSearch] = useState('')
  const [statusF, setStatusF] = useState<UserStatus | 'all'>('all')

  const filtered = mockGovernmentUsers.filter(u => {
    const q = search.toLowerCase()
    return (!q || u.userId.toLowerCase().includes(q) || u.firstName.toLowerCase().includes(q) || u.lastName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q))
      && (statusF === 'all' || u.status === statusF)
  })

  const counts = { ACTIVE:0, INACTIVE:0, SUSPENDED:0, PENDING:0, LOCKED:0 }
  mockGovernmentUsers.forEach(u => counts[u.status]++)

  return (
    <AppShell>
      <PageHeader
        title="Utilisateurs gouvernementaux"
        subtitle="Gestion des accès · RBAC · MFA · Audit trail"
        actions={
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-qc-blue text-white text-xs font-semibold hover:bg-blue-700 transition-colors">
            <UserPlus size={14} /> Nouvel utilisateur
          </button>
        }
      />

      {/* Security notice */}
      <div className="flex items-start gap-2 px-4 py-2.5 mb-4 rounded-xl bg-blue-50 border border-blue-200">
        <Shield size={13} className="text-qc-blue mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700">
          Les comptes ayant un historique d'audit ne peuvent pas être supprimés silencieusement. La désactivation conserve l'intégrité du journal. Les permissions sont vérifiées côté backend — la protection frontend seule est interdite.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {Object.entries(counts).map(([status, count]) => (
          <div key={status} className={`p-3 rounded-xl border text-center cursor-pointer transition-all
            ${statusF === status ? 'bg-qc-blue border-qc-blue text-white' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-qc-blue/40'}`}
            onClick={() => setStatusF(statusF === status ? 'all' : status as UserStatus)}>
            <div className={`text-2xl font-bold ${statusF === status ? 'text-white' : status === 'ACTIVE' ? 'text-green-600' : status === 'SUSPENDED' ? 'text-red-600' : 'text-slate-700 dark:text-slate-200'}`}>{count}</div>
            <div className={`text-[10px] font-semibold ${statusF === status ? 'text-white/80' : 'text-slate-500'}`}>{status}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-4 p-3">
        <div className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-48 flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800">
            <Search size={13} className="text-slate-400 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ID, nom, email, rôle..."
              className="flex-1 bg-transparent text-sm outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400" />
          </div>
          <div className="flex gap-1 flex-wrap">
            {statusFilters.map(f => (
              <button key={f.value} onClick={() => setStatusF(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusF === f.value ? 'bg-qc-blue text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400 self-center">{filtered.length} utilisateurs</span>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['ID','Utilisateur','Rôle','Organisation','Département','Territoire','Statut','MFA','Dernière connexion','Actions'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-3 py-3">
                    <span className="font-mono text-[10px] text-qc-blue font-bold">{u.userId}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div>
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{u.firstName} {u.lastName}</div>
                      <div className="text-[10px] text-slate-400">{u.email}</div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${roleColors[u.role] || 'bg-slate-100 text-slate-600'}`}>{u.role}</span>
                  </td>
                  <td className="px-3 py-3 text-[10px] text-slate-600 dark:text-slate-400">{u.orgCode}</td>
                  <td className="px-3 py-3 text-[10px] text-slate-500">{u.department}</td>
                  <td className="px-3 py-3 text-[10px] text-slate-500">{u.territory}</td>
                  <td className="px-3 py-3"><StatusBadge status={u.status.toLowerCase()} /></td>
                  <td className="px-3 py-3">
                    <span className={`text-[10px] font-bold ${u.mfaEnabled ? 'text-green-600' : 'text-orange-500'}`}>
                      {u.mfaEnabled ? '✅ MFA' : '⚠ OFF'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[10px] text-slate-400 font-mono whitespace-nowrap">
                    {new Date(u.lastLogin).toLocaleString('fr-CA')}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1.5">
                      <button className="p-1 text-qc-blue hover:bg-blue-50 rounded transition-colors" title="Voir"><Eye size={13} /></button>
                      {u.status === 'ACTIVE' ? (
                        <button className="p-1 text-orange-500 hover:bg-orange-50 rounded transition-colors" title="Suspendre"><Lock size={13} /></button>
                      ) : (
                        <button className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors" title="Réactiver"><Unlock size={13} /></button>
                      )}
                      <button className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors" title="Permissions"><Key size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  )
}
