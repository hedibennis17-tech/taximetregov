'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import {
  mockTaxReports, mockFiscalCalendar, mockValidation, mockFiscalPackage,
  mockReconciliation, mockAmendments, REPORT_STATUS_CONF, fmt,
  type ReportStatus
} from '@/lib/engines/reporting.engine'
import { useState } from 'react'
import { AlertCircle, CheckCircle, Lock, Download, ChevronRight, FileText, Shield } from 'lucide-react'
import Link from 'next/link'

export default function ReportsPage() {
  const [tab, setTab] = useState<'calendar' | 'reports' | 'reconciliation' | 'amendments'>('calendar')

  const warningCount = mockValidation.issues.filter(i => i.severity === 'WARNING').length
  const errorCount = mockValidation.issues.filter(i => i.severity === 'ERROR').length

  return (
    <AppShell>
      <div className="px-4 pt-4 pb-2"><h1 className="text-xl font-bold text-white">Rapports fiscaux</h1><p className="text-xs text-slate-400 mt-0.5">Données réelles · Supabase</p></div>
      <div className="px-4">
        {/* Critical disclaimer */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-5">
          <AlertCircle size={14} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-200">
            <strong>Taximètre.GOV prépare vos données fiscales.</strong> La soumission officielle se fait via <strong>Revenu Québec</strong> et <strong>l'ARC</strong>. Les montants affichés sont des estimations — pas des déclarations officielles.
          </p>
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { label:'Rapports', val:mockTaxReports.length, color:'text-white' },
            { label:'Prêts', val:mockTaxReports.filter(r=>r.status==='READY').length, color:'text-green-400' },
            { label:'Alertes', val:warningCount, color:warningCount>0?'text-amber-400':'text-slate-500' },
            { label:'Erreurs', val:errorCount, color:errorCount>0?'text-red-400':'text-slate-500' },
          ].map(s => (
            <div key={s.label} className="driver-card p-3 text-center">
              <div className={`font-black text-xl ${s.color}`}>{s.val}</div>
              <div className="text-[9px] text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Data validation */}
        <Card className={`mb-5 border ${mockValidation.status === 'READY_WITH_WARNINGS' ? 'border-amber-500/20' : mockValidation.status === 'BLOCKED' ? 'border-red-500/20' : 'border-green-500/20'}`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{mockValidation.status === 'READY' ? '✅' : mockValidation.status === 'READY_WITH_WARNINGS' ? '⚠️' : '❌'}</span>
            <span className="font-semibold text-white text-sm">Qualité des données</span>
            <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${mockValidation.status === 'READY_WITH_WARNINGS' ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}`}>
              {mockValidation.status.replace(/_/g,' ')}
            </span>
          </div>
          {/* Completeness score */}
          <div className="mb-3">
            <div className="flex justify-between mb-1.5">
              <span className="text-xs text-slate-400">Score de complétude des données</span>
              <span className="font-bold text-white">{mockValidation.completenessScore}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${mockValidation.completenessScore >= 90 ? 'bg-green-500' : mockValidation.completenessScore >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{width:`${mockValidation.completenessScore}%`}} />
            </div>
            <div className="text-[9px] text-slate-500 mt-1">Score de complétude des données — pas un score fiscal</div>
          </div>
          {/* Checks */}
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {[
              { label:'Transactions', ok:mockValidation.transactionsOk },
              { label:'Réconciliation', ok:mockValidation.reconciliationOk },
              { label:'Profil fiscal', ok:mockValidation.taxProfileOk },
              { label:'Documents', ok:mockValidation.documentsOk },
              { label:'Dépenses', ok:mockValidation.expensesOk },
              { label:'Kilométrage', ok:mockValidation.mileageOk },
            ].map(c => (
              <div key={c.label} className={`flex items-center gap-1 text-[10px] ${c.ok ? 'text-green-400' : 'text-amber-400'}`}>
                {c.ok ? <CheckCircle size={10}/> : <AlertCircle size={10}/>} {c.label}
              </div>
            ))}
          </div>
          {/* Issues */}
          {mockValidation.issues.length > 0 && (
            <div className="space-y-1">
              {mockValidation.issues.map((issue, i) => (
                <div key={i} className={`flex items-start gap-1.5 text-[10px] ${issue.severity==='ERROR'?'text-red-400':issue.severity==='WARNING'?'text-amber-400':'text-blue-300'}`}>
                  <span className="shrink-0 mt-0.5">{issue.severity==='ERROR'?'❌':issue.severity==='WARNING'?'⚠️':'ℹ️'}</span>
                  <span>{issue.message}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {[['calendar','Calendrier'],['reports','Rapports'],['reconciliation','Réconciliation'],['amendments','Amendements']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k as any)}
              className={`px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${tab===k?'bg-qc-blue text-white':'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* ─── CALENDAR ──────────────────────────────────────── */}
        {tab === 'calendar' && (
          <div className="space-y-3 mb-6">
            {mockFiscalCalendar.map(entry => {
              const conf = REPORT_STATUS_CONF[entry.status as ReportStatus] ?? REPORT_STATUS_CONF['DRAFT']
              return (
                <div key={entry.period} className={`driver-card p-4 border ${entry.status === 'IN_PROGRESS' ? 'border-qc-blue/30' : entry.status === 'LOCKED' ? 'border-purple-500/20' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl shrink-0">{conf.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-bold text-white">{entry.label}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${conf.bg} ${conf.color}`}>{conf.label}</span>
                        {entry.warnings > 0 && <span className="text-[9px] text-amber-400">{entry.warnings} alerte(s)</span>}
                      </div>
                      {entry.completenessScore > 0 && (
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${entry.completenessScore >= 90 ? 'bg-green-500' : entry.completenessScore >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{width:`${entry.completenessScore}%`}} />
                          </div>
                          <span className="text-[10px] text-slate-400 tabular-nums">{entry.completenessScore}%</span>
                        </div>
                      )}
                      <div className="text-[10px] text-slate-500">{entry.note}</div>
                    </div>
                    {entry.status === 'READY' && (
                      <button className="px-3 py-1.5 rounded-xl bg-qc-blue/20 border border-qc-blue/40 text-qc-blue-light text-[10px] font-bold shrink-0 hover:bg-qc-blue/30 transition-all">
                        Générer
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ─── REPORTS ───────────────────────────────────────── */}
        {tab === 'reports' && (
          <div className="space-y-3 mb-6">
            {mockTaxReports.map(report => {
              const conf = REPORT_STATUS_CONF[report.status]
              return (
                <Link key={report.reportId} href={`/reports/detail?id=${report.reportId}`}>
                  <div className={`driver-card p-4 border hover:border-qc-blue/40 transition-all ${report.status === 'LOCKED' ? 'border-purple-500/20' : report.status === 'REVIEW_REQUIRED' ? 'border-amber-500/20' : ''}`}>
                    <div className="flex items-start gap-3 mb-2">
                      <div className="text-2xl shrink-0">{conf.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-bold text-white">{report.taxType}</span>
                          <span className="text-xs text-slate-300">{report.periodStart.slice(0,7)} → {report.periodEnd.slice(0,7)}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${conf.bg} ${conf.color}`}>{conf.label}</span>
                          {report.version > 1 && <span className="text-[9px] text-amber-400">v{report.version}</span>}
                          {report.isEstimate && <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1 py-0.5 rounded font-bold">EST.</span>}
                        </div>
                        <div className="text-[10px] text-slate-500">{report.jurisdiction} · {report.ruleVersion}</div>
                      </div>
                      <ChevronRight size={14} className="text-slate-600 shrink-0 mt-1" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      {[
                        { label:'Rev. taxable', val:fmt(report.taxableRevenue) },
                        { label:'Taxe estimée', val:fmt(report.taxAmount), color:'text-orange-400' },
                        { label:'Net estimé', val:fmt(report.netTaxAmount), color:'text-blue-400' },
                      ].map(s => (
                        <div key={s.label} className="bg-slate-800/50 rounded-lg p-1.5">
                          <div className="text-slate-500">{s.label}</div>
                          <div className={`font-bold tabular-nums ${s.color ?? 'text-white'}`}>{s.val}</div>
                        </div>
                      ))}
                    </div>
                    {report.warnings.length > 0 && (
                      <div className="text-[10px] text-amber-400 mt-1.5 flex items-center gap-1">
                        <AlertCircle size={10}/> {report.warnings[0]}
                      </div>
                    )}
                    {report.status === 'LOCKED' && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-purple-400">
                        <Lock size={10}/> Verrouillé — modification via AMENDMENT uniquement
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}

            {/* Fiscal package */}
            <div className="p-4 rounded-2xl border border-qc-blue/20 bg-qc-blue/5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">📦</span>
                <span className="font-bold text-white">Dossier fiscal T1 2026</span>
                <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-bold ml-auto">PRÊT</span>
              </div>
              <div className="text-[10px] text-slate-400 mb-2">Contient: {mockFiscalPackage.taxReportIds.length} rapports fiscaux · {mockFiscalPackage.documentIds.length} documents</div>
              <div className="text-[10px] text-amber-400 mb-3">Complétude: {mockFiscalPackage.completenessScore.overall}% · Réconciliation: {mockFiscalPackage.reconciliationStatus}</div>
              <div className="flex gap-2">
                <button className="flex-1 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-700 transition-all">
                  <Download size={12}/> PDF
                </button>
                <button className="flex-1 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-700 transition-all">
                  <Download size={12}/> CSV
                </button>
                <button className="flex-1 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-700 transition-all">
                  <Download size={12}/> JSON
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── RECONCILIATION ────────────────────────────────── */}
        {tab === 'reconciliation' && (
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
              <Shield size={13} className="mt-0.5 shrink-0"/>
              Données fournisseur vs Ledger interne. Tout écart → REVIEW_REQUIRED. Jamais correction silencieuse.
            </div>
            {mockReconciliation.map(rec => (
              <Card key={rec.provider} className={rec.status !== 'MATCHED' ? 'border-amber-500/20' : 'border-green-500/20'}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">{rec.provider==='Uber'?'⬛':rec.provider==='DoorDash'?'🔴':'🚕'}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{rec.provider}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${rec.status==='MATCHED'?'bg-green-500/20 text-green-400':'bg-amber-500/20 text-amber-400'}`}>
                        {rec.status === 'MATCHED' ? '✅ MATCHED' : `⚠ ${rec.status}`}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">{rec.providerCount} tx fournisseur · {rec.internalCount} tx ledger</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div className="bg-slate-800/50 rounded-xl p-2">
                    <div className="text-slate-500 text-[10px]">Fournisseur</div>
                    <div className="font-bold text-white">{rec.providerCount} tx · {fmt(rec.providerTotal)}</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-2">
                    <div className="text-slate-500 text-[10px]">Ledger interne</div>
                    <div className="font-bold text-white">{rec.internalCount} tx · {fmt(rec.internalTotal)}</div>
                  </div>
                </div>
                {rec.difference !== 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <AlertCircle size={12} className="text-amber-400 shrink-0"/>
                    <span className="text-xs text-amber-300">Écart: {fmt(Math.abs(rec.difference))} · {rec.providerCount - rec.internalCount} tx manquante(s) → Révision manuelle requise</span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* ─── AMENDMENTS ────────────────────────────────────── */}
        {tab === 'amendments' && (
          <div className="space-y-4 mb-6">
            <div className="text-[10px] text-slate-500 mb-2">Les amendements corrigent un rapport verrouillé. L'original est conservé. Les deux versions sont auditées.</div>
            {mockAmendments.map(amend => (
              <Card key={amend.amendmentId} className={amend.status === 'APPLIED' ? 'border-green-500/20' : 'border-amber-500/20'}>
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">📋</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-white text-sm">AMENDEMENT</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${amend.status==='APPLIED'?'bg-green-500/20 text-green-400':'bg-amber-500/20 text-amber-400'}`}>{amend.status}</span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-500">{amend.originalReportId}</div>
                    <div className="text-xs text-slate-300 mt-1">{amend.reason}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-slate-800/50 rounded-xl p-2">
                    <div className="text-slate-500 mb-1">Avant (V1)</div>
                    {Object.entries(amend.oldValues).map(([k,v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-400">{k}</span>
                        <span className="text-red-400 font-mono">{fmt(Number(v))}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-2">
                    <div className="text-slate-500 mb-1">Après (V2)</div>
                    {Object.entries(amend.newValues).map(([k,v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-400">{k}</span>
                        <span className="text-green-400 font-mono">{fmt(Number(v))}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-[9px] text-slate-500 mt-2">{new Date(amend.createdAt).toLocaleDateString('fr-CA')} · {amend.createdBy}</div>
              </Card>
            ))}
            {mockAmendments.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">Aucun amendement</div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
