'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import {
  mockFiscalProfile, mockTaxRegistrations, mockTaxPeriods, mockTaxSummary,
  mockExpenses, mockTaxReports, mockFiscalAudit,
  calculateTax, ACTIVE_TAX_RULES, getPeriodStatusConfig, getVerificationConfig,
  formatCAD,
  type TaxType
} from '@/lib/engines/tax.engine'
import { useState } from 'react'
import { Shield, AlertCircle, CheckCircle, Download, ChevronRight, Lock, Eye, FileText, Clock } from 'lucide-react'

export default function TaxPage() {
  const [tab, setTab] = useState<'profile' | 'periods' | 'estimate' | 'expenses' | 'audit'>('profile')

  // Live tax estimate
  const estimate = calculateTax({
    grossAmount: mockTaxSummary.taxableRevenue,
    taxableAmount: mockTaxSummary.taxableRevenue,
    jurisdiction: 'CA-QC',
    taxTypes: ['TPS', 'TVQ'],
    transactionDate: '2026-08-24',
    taxIncluded: false,
  })

  return (
    <AppShell>
      <PageHeader title="Centre fiscal" subtitle="Profil · Périodes · Estimation · Documents" />
      <div className="px-4">

        {/* Critical disclaimer */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-5">
          <AlertCircle size={14} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-200">
            <strong>ESTIMATION SEULEMENT.</strong> Taximètre.GOV ne remplace pas Revenu Québec ni l'ARC. Les données présentées ici sont indicatives. Consultez un comptable agréé pour vos obligations fiscales réelles.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
          {[['profile','Profil fiscal'],['periods','Périodes'],['estimate','Estimation'],['expenses','Dépenses'],['audit','Audit']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k as any)}
              className={`px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${tab===k?'bg-qc-blue text-white':'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* ─── FISCAL PROFILE ──────────────────────────── */}
        {tab === 'profile' && (
          <div className="space-y-4 mb-6">
            <Card className="bg-gradient-to-br from-qc-blue/20 to-slate-900 border-qc-blue/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-qc-blue flex items-center justify-center text-2xl">🏛️</div>
                <div>
                  <div className="font-bold text-white">{mockFiscalProfile.legalName}</div>
                  <div className="text-xs text-slate-400">{mockFiscalProfile.businessStatus.replace('_',' ')} · {mockFiscalProfile.jurisdiction}</div>
                </div>
                <span className={`ml-auto text-[9px] font-bold px-2 py-1 rounded-full ${mockFiscalProfile.status==='ACTIVE'?'bg-green-500/20 text-green-400':'bg-amber-500/20 text-amber-400'}`}>
                  {mockFiscalProfile.status}
                </span>
              </div>
              <div className="space-y-2">
                {[
                  { label:'Juridiction', val:mockFiscalProfile.jurisdiction },
                  { label:'Numéro d\'entreprise', val:mockFiscalProfile.businessNumber || '—', sensitive:true },
                  { label:'En vigueur depuis', val:mockFiscalProfile.effectiveFrom },
                ].map(s => (
                  <div key={s.label} className="flex justify-between py-1.5 border-b border-slate-800 last:border-0">
                    <span className="text-xs text-slate-400">{s.label}</span>
                    <span className={`text-xs font-medium ${s.sensitive ? 'font-mono text-qc-blue-light' : 'text-white'}`}>
                      {s.sensitive && <Lock size={10} className="inline mr-1 text-slate-500" />}
                      {s.val}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Tax registrations */}
            <Card>
              <div className="font-semibold text-white text-sm mb-3">📋 Inscriptions fiscales</div>
              <div className="space-y-4">
                {mockTaxRegistrations.map(reg => {
                  const verif = getVerificationConfig(reg.verificationStatus)
                  return (
                    <div key={reg.registrationId}>
                      <div className="flex items-center gap-3 mb-1.5">
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border
                          ${reg.status==='REGISTERED' ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-slate-700 border-slate-600 text-slate-400'}`}>
                          ● {reg.taxType} — {reg.status}
                        </div>
                        <span className={`text-[10px] font-semibold ${verif.color}`}>{verif.icon} {verif.label}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5">
                        <Lock size={9} className="text-slate-600" />
                        {reg.registrationNumberMasked}
                      </div>
                      <div className="text-[10px] text-slate-600">Source: {reg.source} · Vérifié: {reg.verifiedAt ? new Date(reg.verifiedAt).toLocaleDateString('fr-CA') : '—'}</div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Active tax rules (from engine) */}
            <Card>
              <div className="font-semibold text-white text-sm mb-3">⚙️ Règles fiscales actives — {mockFiscalProfile.jurisdiction}</div>
              <div className="space-y-3">
                {ACTIVE_TAX_RULES.map(rule => (
                  <div key={rule.ruleId} className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-white text-sm">{rule.taxType}</span>
                        <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-bold">{rule.status}</span>
                      </div>
                      <div className="text-xs text-slate-400">Taux: <span className="font-bold text-white">{(rule.rate * 100).toFixed(3)}%</span></div>
                      <div className="text-[10px] text-slate-500">Version: {rule.version} · En vigueur: {rule.effectiveFrom}</div>
                      <div className="text-[10px] text-slate-600">Source: {rule.sourceReference}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-start gap-2 p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Shield size={11} className="text-blue-400 mt-0.5 shrink-0" />
                <span className="text-[10px] text-blue-300">Les taux sont configurables par les administrateurs gouvernementaux autorisés. Aucun taux n'est hardcodé dans le code source.</span>
              </div>
            </Card>

            {/* Reports */}
            <Card>
              <div className="font-semibold text-white text-sm mb-3">📄 Rapports disponibles</div>
              <div className="space-y-3">
                {mockTaxReports.map(r => (
                  <div key={r.reportId} className="flex items-center gap-3">
                    <FileText size={18} className="text-qc-blue-light shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white">{r.taxType} — {r.period}</div>
                      <div className="text-[10px] text-slate-500">Taxable: {formatCAD(r.taxableRevenue)} · Collecté: {formatCAD(r.taxCollected)}</div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.status==='READY'?'bg-green-500/20 text-green-400':'bg-amber-500/20 text-amber-400'}`}>
                        {r.status} — {r.note.split('—')[0].trim()}
                      </span>
                    </div>
                    <button className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
                      <Download size={14} className="text-slate-400" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            {/* NAS protection */}
            <Card className="border-red-500/20">
              <div className="flex items-start gap-2.5">
                <Lock size={16} className="text-red-400 mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-white text-sm mb-1">🔒 NAS — Protection maximale</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Votre numéro d'assurance sociale (NAS) n'est jamais affiché dans cette interface. S'il est légalement requis, il est stocké dans un coffre chiffré côté serveur avec accès minimal audité. Il ne figure jamais dans les logs, URLs, exports non autorisés ou analytics.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ─── TAX PERIODS ──────────────────────────────── */}
        {tab === 'periods' && (
          <div className="space-y-4 mb-6">
            <div className="text-[10px] text-slate-500 mb-1">Périodes trimestrielles TPS/TVQ — Québec 2026</div>

            {/* Annual summary */}
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900">
              <div className="font-semibold text-white text-sm mb-3">📊 Bilan annuel 2026 — ESTIMATION</div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { label:'Revenus taxables', val:formatCAD(mockTaxSummary.taxableRevenue), color:'text-white' },
                  { label:'TPS collectée', val:formatCAD(mockTaxSummary.tpsCollected), color:'text-blue-400' },
                  { label:'TVQ collectée', val:formatCAD(mockTaxSummary.tvqCollected), color:'text-purple-400' },
                  { label:'Payable estimé', val:formatCAD(mockTaxSummary.estimatedPayable), color:'text-amber-400' },
                ].map(s => (
                  <div key={s.label} className="bg-slate-900/60 rounded-xl p-3">
                    <div className="text-[10px] text-slate-500">{s.label}</div>
                    <div className={`font-black tabular-nums text-sm ${s.color}`}>{s.val}</div>
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-amber-400 flex items-center gap-1.5">
                <AlertCircle size={10} /> {mockTaxSummary.note}
              </div>
            </Card>

            {/* Periods list */}
            <div className="space-y-3">
              {mockTaxPeriods.map(period => {
                const cfg = getPeriodStatusConfig(period.status)
                return (
                  <div key={period.periodId} className={`driver-card p-4 border ${cfg.bg}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-xl shrink-0">{cfg.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-white text-sm">{period.periodLabel}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>{period.status}</span>
                        </div>
                        {period.grossRevenue > 0 ? (
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {[
                              { label:'Revenus bruts', val:formatCAD(period.grossRevenue) },
                              { label:'Taxables', val:formatCAD(period.taxableRevenue) },
                              { label:'TPS collectée', val:formatCAD(period.taxCollected) },
                            ].map(s => (
                              <div key={s.label} className="bg-slate-800/50 rounded-lg p-2 text-center">
                                <div className="font-bold text-white text-xs tabular-nums">{s.val}</div>
                                <div className="text-[9px] text-slate-500">{s.label}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500">Aucune donnée — période non commencée</div>
                        )}
                        {period.status === 'READY' && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-qc-blue/20 border border-qc-blue/30 text-blue-400 text-xs font-semibold hover:bg-qc-blue/30 transition-all">
                              <Download size={11} /> Télécharger
                            </button>
                            <span className="text-[10px] text-slate-500">Soumission manuelle à l'ARC / Revenu Québec</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ─── TAX ESTIMATE ────────────────────────────── */}
        {tab === 'estimate' && (
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
              <AlertCircle size={14} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-200">
                <strong>ESTIMATION — Usage informatif seulement.</strong> Ces valeurs sont calculées par Taximètre.GOV à titre indicatif. Elles ne constituent pas une déclaration fiscale officielle ni une obligation confirmée.
              </p>
            </div>

            <Card className="border-qc-blue/30">
              <div className="font-semibold text-white text-sm mb-1">🔢 Moteur de calcul fiscal</div>
              <div className="text-[10px] text-slate-500 mb-4">Jurisdiction: {estimate.jurisdiction} · Version règles: {estimate.ruleVersion}</div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Revenus taxables (base)</span>
                  <span className="font-bold text-white tabular-nums">{formatCAD(estimate.taxableBase)}</span>
                </div>
                {estimate.breakdown.map(b => (
                  <div key={b.taxType} className="flex justify-between text-sm">
                    <div>
                      <span className="text-slate-400">{b.taxType}</span>
                      <span className="text-[10px] text-slate-600 ml-2">({(b.rate * 100).toFixed(3)}%)</span>
                    </div>
                    <span className={`font-bold tabular-nums ${b.taxType==='TPS'?'text-blue-400':'text-purple-400'}`}>{formatCAD(b.amount)}</span>
                  </div>
                ))}
                <div className="border-t border-slate-700 pt-2 flex justify-between text-sm font-bold">
                  <span className="text-white">Total taxes estimées</span>
                  <span className="text-amber-400 tabular-nums">{formatCAD(estimate.totalTax)}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-[10px] text-slate-500">
                <div className="font-bold text-slate-400 mb-1">Sources des règles appliquées:</div>
                {estimate.breakdown.map(b => {
                  const rule = ACTIVE_TAX_RULES.find(r => r.taxType === b.taxType)
                  return rule ? <div key={b.taxType}>{b.taxType}: {rule.sourceReference}</div> : null
                })}
              </div>
            </Card>

            {/* Registration threshold */}
            <Card>
              <div className="font-semibold text-white text-sm mb-3">📏 Seuil d'inscription obligatoire</div>
              <div className="space-y-2">
                {ACTIVE_TAX_RULES.map(rule => (
                  <div key={rule.ruleId} className="flex justify-between text-xs">
                    <span className="text-slate-400">{rule.taxType}</span>
                    <div className="text-right">
                      <span className="text-white">{formatCAD(rule.threshold || 0)} CAD</span>
                      <div className="text-[9px] text-slate-500">{rule.sourceReference.split('—')[1]?.trim()}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-[10px] text-slate-500">
                Vos revenus annuels estimés: <span className="text-white font-bold">{formatCAD(mockTaxSummary.taxableRevenue)}</span>
                {mockTaxSummary.taxableRevenue > 30000 && <span className="text-amber-400 ml-2">→ Au-dessus du seuil</span>}
              </div>
            </Card>
          </div>
        )}

        {/* ─── EXPENSES ─────────────────────────────────── */}
        {tab === 'expenses' && (
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              Taximètre.GOV ne détermine pas automatiquement si une dépense est déductible. Le statut POTENTIALLY_DEDUCTIBLE est indicatif — consultez un comptable agréé.
            </div>

            {mockExpenses.map(exp => {
              const deductStyle = {
                POTENTIALLY_DEDUCTIBLE: 'bg-green-500/20 text-green-400 border-green-500/30',
                REVIEW_REQUIRED: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                NOT_DEDUCTIBLE: 'bg-red-500/20 text-red-400 border-red-500/30',
                UNKNOWN: 'bg-slate-700 text-slate-400 border-slate-600',
              }[exp.deductibilityStatus]

              return (
                <Card key={exp.expenseId}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl shrink-0">
                      {exp.category==='FUEL'?'⛽':exp.category==='MAINTENANCE'?'🔧':exp.category==='PHONE'?'📱':'📦'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-bold text-white text-sm">{exp.category}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${deductStyle}`}>
                          {exp.deductibilityStatus.replace(/_/g,' ')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">{exp.supplier || '—'} · {exp.date}</div>
                      {exp.notes && <div className="text-[10px] text-slate-500 mt-0.5 italic">{exp.notes}</div>}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-white tabular-nums">{formatCAD(exp.amount)}</div>
                      {exp.taxAmount && <div className="text-[10px] text-slate-500">TPS/TVQ: {formatCAD(exp.taxAmount)}</div>}
                    </div>
                  </div>
                </Card>
              )
            })}

            <button className="w-full py-4 rounded-2xl border border-dashed border-slate-700 text-slate-400 flex items-center justify-center gap-2 hover:border-slate-600 transition-colors">
              + Ajouter une dépense professionnelle
            </button>
          </div>
        )}

        {/* ─── AUDIT ────────────────────────────────────── */}
        {tab === 'audit' && (
          <Card className="mb-6">
            <div className="font-semibold text-white text-sm mb-3">📋 Journal d'audit fiscal</div>
            <div className="space-y-1">
              {mockFiscalAudit.map(evt => (
                <div key={evt.auditId} className="flex items-start gap-3 py-2.5 border-b border-slate-800 last:border-0">
                  <span className={['text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5', evt.result==='SUCCESS'?'bg-green-500/20 text-green-400':evt.result==='FAILURE'?'bg-red-500/20 text-red-400':'bg-amber-500/20 text-amber-400'].join(' ')}>
                    {evt.result}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white">{evt.action}</div>
                    <div className="text-[10px] text-slate-400">{evt.details}</div>
                  </div>
                  <div className="text-[10px] text-slate-600 shrink-0 font-mono">
                    {new Date(evt.timestamp).toLocaleDateString('fr-CA')}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
