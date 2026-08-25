'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card } from '@/components/ui'
import { mockOrganizations, mockDepartments, mockGovernmentUsers } from '@/data/operations.mock'
import { Building2, Users, ChevronRight } from 'lucide-react'
import { useState } from 'react'

export default function OrganizationsPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const selectedOrg = mockOrganizations.find(o => o.id === selected)
  const orgDepts = mockDepartments.filter(d => d.orgId === selected)
  const orgUsers = mockGovernmentUsers.filter(u => u.orgCode === selected)

  return (
    <AppShell>
      <PageHeader title="Organisations gouvernementales" subtitle="Hiérarchie · Départements · Utilisateurs · Permissions" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Org list */}
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Organisations</div>
          {mockOrganizations.map(org => (
            <button key={org.id} onClick={() => setSelected(org.id === selected ? null : org.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all
                ${selected === org.id ? 'border-qc-blue bg-blue-50 dark:bg-blue-950' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-200'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${selected === org.id ? 'bg-qc-blue text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>
                  <Building2 size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{org.code}</div>
                  <div className="text-[10px] text-slate-500 leading-snug">{org.name}</div>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                    <span>{org.userCount} utilisateurs</span>
                    <span>{org.departmentCount} dép.</span>
                    <span className={`font-semibold ${org.status === 'ACTIVE' ? 'text-green-600' : 'text-slate-400'}`}>{org.status}</span>
                  </div>
                </div>
                <ChevronRight size={14} className={`shrink-0 transition-transform ${selected === org.id ? 'rotate-90 text-qc-blue' : 'text-slate-300'}`} />
              </div>
            </button>
          ))}
        </div>

        {/* Org detail */}
        <div className="lg:col-span-2 space-y-4">
          {selected && selectedOrg ? (
            <>
              <Card className="p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-qc-blue flex items-center justify-center">
                    <Building2 size={22} className="text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-700 dark:text-slate-200">{selectedOrg.name}</div>
                    <div className="text-xs text-slate-500">{selectedOrg.code} · {selectedOrg.type} · {selectedOrg.province}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Utilisateurs', val: selectedOrg.userCount },
                    { label: 'Départements', val: selectedOrg.departmentCount },
                    { label: 'Statut', val: selectedOrg.status },
                  ].map(r => (
                    <div key={r.label} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                      <div className="text-xl font-bold text-slate-700 dark:text-slate-200">{r.val}</div>
                      <div className="text-[10px] text-slate-400">{r.label}</div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Departments */}
              {orgDepts.length > 0 && (
                <Card>
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Départements</div>
                  </div>
                  <div className="divide-y divide-slate-50 dark:divide-slate-800">
                    {orgDepts.map(d => (
                      <div key={d.id} className="px-4 py-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-mono text-[10px] text-qc-blue mr-2">{d.code}</span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{d.name}</span>
                          </div>
                          <span className="text-xs text-slate-400">{d.userCount} utilisateurs</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {d.permissions.map(p => (
                            <span key={p} className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded">{p}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Users */}
              <Card>
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Utilisateurs de cette organisation</div>
                </div>
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                  {mockGovernmentUsers.filter(u => u.orgCode === selected || u.orgCode === selectedOrg.code).slice(0, 5).map(u => (
                    <div key={u.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-qc-blue/10 flex items-center justify-center text-qc-blue font-bold text-xs">
                        {u.firstName[0]}{u.lastName[0]}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{u.firstName} {u.lastName}</div>
                        <div className="text-[10px] text-slate-400">{u.department}</div>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">{u.role}</span>
                    </div>
                  ))}
                  {mockGovernmentUsers.filter(u => u.orgCode === selected || u.orgCode === selectedOrg.code).length === 0 && (
                    <div className="px-4 py-6 text-center text-xs text-slate-400">Aucun utilisateur assigné à cette organisation dans la démo</div>
                  )}
                </div>
              </Card>
            </>
          ) : (
            <Card className="p-12 text-center">
              <Building2 size={32} className="text-slate-300 mx-auto mb-3" />
              <div className="text-sm text-slate-500">Sélectionnez une organisation pour voir les détails</div>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  )
}
