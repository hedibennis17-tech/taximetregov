'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, KpiCard } from '@/components/ui'
import { mockScheduledReports, reportDefinitions, formatCAD } from '@/data/analytics.mock'
import { useState } from 'react'
import { FileBarChart, Download, Plus, Clock, Shield, CheckCircle, Play } from 'lucide-react'

const DATASETS = ['monthly_revenue','tax_summary','platform_activity','compliance','reconciliation','webhook_report','driver_activity','taxi_report','delivery_report','data_quality','executive_summary']
const COLUMNS_BY_DATASET: Record<string, string[]> = {
  monthly_revenue: ['Mois','Revenus bruts','Revenus nets','TPS','TVQ','Pourboires','Frais'],
  tax_summary: ['Période','Juridiction','Revenus taxables','TPS','TVQ','Total','Remis','En attente'],
  platform_activity: ['Plateforme','Chauffeurs','Activités','Brut','Frais','Pourboires','Net'],
  compliance: ['ID dossier','Chauffeur','Type','Priorité','Statut','Assigné','Créé'],
  executive_summary: ['Indicateur','Valeur','Variation','Période'],
}

type BuilderStep = 'dataset' | 'filters' | 'columns' | 'preview' | 'generate'

export default function ReportBuilderPage() {
  const [activeTab, setActiveTab] = useState<'builder' | 'scheduled' | 'catalog'>('builder')
  const [step, setStep] = useState<BuilderStep>('dataset')
  const [selectedDataset, setSelectedDataset] = useState('')
  const [selectedFormat, setSelectedFormat] = useState('PDF')
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [generated, setGenerated] = useState(false)

  const availableColumns = COLUMNS_BY_DATASET[selectedDataset] || []

  const steps: { key: BuilderStep; label: string }[] = [
    { key:'dataset', label:'Dataset' },
    { key:'filters', label:'Filtres' },
    { key:'columns', label:'Colonnes' },
    { key:'preview', label:'Aperçu' },
    { key:'generate', label:'Générer' },
  ]
  const stepIndex = steps.findIndex(s => s.key === step)

  return (
    <AppShell>
      <PageHeader title="Report Center" subtitle="Générateur · Rapports programmés · Catalogue · RBAC appliqué" />

      {/* Tabs */}
      <div className="flex gap-1 mb-5">
        {[['builder','Générateur'],['scheduled','Programmés'],['catalog','Catalogue']] .map(([k,l]) => (
          <button key={k} onClick={() => setActiveTab(k as any)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${activeTab === k ? 'bg-qc-blue text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* BUILDER */}
      {activeTab === 'builder' && (
        <>
          {/* RBAC notice */}
          <div className="flex items-center gap-2 px-4 py-2.5 mb-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700">
            <Shield size={13} className="shrink-0" />
            <span>Les rapports héritent des permissions de leurs données. Chaque génération crée une entrée d'audit. Les exports sont filtrés par RBAC.</span>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-0 mb-5 overflow-x-auto">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center">
                <button onClick={() => s.key !== 'generate' && setStep(s.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all shrink-0
                    ${step === s.key ? 'bg-qc-blue text-white' : i < stepIndex ? 'bg-green-100 text-green-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  {i < stepIndex ? <CheckCircle size={12} /> : <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] border-current">{i+1}</span>}
                  {s.label}
                </button>
                {i < steps.length - 1 && <div className="w-6 h-0.5 bg-slate-200 dark:bg-slate-700 mx-1" />}
              </div>
            ))}
          </div>

          <Card className="p-5">
            {/* Step: Dataset */}
            {step === 'dataset' && (
              <div>
                <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4">1. Sélectionnez le dataset</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {DATASETS.map(ds => (
                    <button key={ds} onClick={() => { setSelectedDataset(ds); setSelectedColumns([]) }}
                      className={`p-3 rounded-xl border text-left text-xs transition-all
                        ${selectedDataset === ds ? 'border-qc-blue bg-blue-50 dark:bg-blue-950 text-qc-blue' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-300'}`}>
                      <div className="font-semibold">{ds.replace(/_/g,' ').replace(/^\w/,c=>c.toUpperCase())}</div>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 mt-5">
                  <button disabled={!selectedDataset} onClick={() => setStep('filters')}
                    className="px-4 py-2 rounded-lg bg-qc-blue text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    Suivant →
                  </button>
                </div>
              </div>
            )}

            {/* Step: Filters */}
            {step === 'filters' && (
              <div>
                <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4">2. Filtres</div>
                <div className="grid grid-cols-2 gap-4 max-w-lg">
                  {[
                    { label:'Période', type:'select', opts:['Août 2026','Q3 2026','2026','Personnalisée'] },
                    { label:'Juridiction', type:'select', opts:['QC-CA','Toutes'] },
                    { label:'Plateforme', type:'select', opts:['Toutes','Uber','Lyft','DoorDash','Instacart','Uber Eats','Skip','Taxi'] },
                    { label:'Statut', type:'select', opts:['Tous','Actif','Inactif','Suspendu'] },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">{f.label}</label>
                      <select className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-qc-blue">
                        {f.opts.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setStep('dataset')} className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">← Retour</button>
                  <button onClick={() => { setSelectedColumns(availableColumns.slice(0,4)); setStep('columns') }} className="px-4 py-2 rounded-lg bg-qc-blue text-white text-xs font-semibold hover:bg-blue-700">Suivant →</button>
                </div>
              </div>
            )}

            {/* Step: Columns */}
            {step === 'columns' && (
              <div>
                <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4">3. Colonnes à inclure</div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {availableColumns.map(col => (
                    <button key={col} onClick={() => setSelectedColumns(prev => prev.includes(col) ? prev.filter(c=>c!==col) : [...prev,col])}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedColumns.includes(col) ? 'bg-qc-blue text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
                      {col}
                    </button>
                  ))}
                  {availableColumns.length === 0 && <span className="text-xs text-slate-400">Colonnes disponibles selon le dataset sélectionné</span>}
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setStep('filters')} className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">← Retour</button>
                  <button onClick={() => setStep('preview')} className="px-4 py-2 rounded-lg bg-qc-blue text-white text-xs font-semibold hover:bg-blue-700">Aperçu →</button>
                </div>
              </div>
            )}

            {/* Step: Preview */}
            {step === 'preview' && (
              <div>
                <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4">4. Aperçu du rapport</div>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden mb-4">
                  <div className="bg-qc-blue px-4 py-3 text-white">
                    <div className="font-bold text-sm">TAXIMÈTRE.GOV — Rapport Officiel</div>
                    <div className="text-[10px] opacity-80">Dataset: {selectedDataset} · Période: Août 2026 · Généré par: ADMIN-001</div>
                  </div>
                  <div className="p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700">
                            {(selectedColumns.length ? selectedColumns : ['Colonne 1','Colonne 2','Colonne 3']).map(c=>(
                              <th key={c} className="px-3 py-2 text-left font-bold text-slate-600 dark:text-slate-400">{c}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[1,2,3].map(i=>(
                            <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                              {(selectedColumns.length ? selectedColumns : ['—','—','—']).map(c=>(
                                <td key={c} className="px-3 py-2 text-slate-500">Données {i}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mb-4">
                  {['PDF','CSV','XLSX','JSON'].map(f=>(
                    <button key={f} onClick={()=>setSelectedFormat(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${selectedFormat===f?'bg-qc-blue text-white':'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
                      {f}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep('columns')} className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">← Retour</button>
                  <button onClick={() => { setStep('generate'); setGenerated(true) }} className="px-4 py-2 rounded-lg bg-qc-blue text-white text-xs font-semibold hover:bg-blue-700 flex items-center gap-2">
                    <Play size={12} /> Générer en {selectedFormat}
                  </button>
                </div>
              </div>
            )}

            {/* Step: Generated */}
            {step === 'generate' && generated && (
              <div className="text-center py-8">
                <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
                <div className="font-bold text-lg text-slate-700 dark:text-slate-200 mb-1">Rapport généré</div>
                <div className="text-sm text-slate-500 mb-4">rapport_{selectedDataset}_aout2026.{selectedFormat.toLowerCase()} · Entrée d'audit créée</div>
                <div className="flex gap-3 justify-center">
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-qc-blue text-white text-xs font-semibold hover:bg-blue-700">
                    <Download size={13} /> Télécharger
                  </button>
                  <button onClick={() => { setStep('dataset'); setSelectedDataset(''); setGenerated(false) }} className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                    Nouveau rapport
                  </button>
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      {/* SCHEDULED */}
      {activeTab === 'scheduled' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">{mockScheduledReports.length} rapports programmés</div>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-qc-blue text-white text-xs font-semibold hover:bg-blue-700">
              <Plus size={13} /> Programmer un rapport
            </button>
          </div>
          {mockScheduledReports.map(r => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-qc-blue/10 flex items-center justify-center shrink-0">
                  <FileBarChart size={18} className="text-qc-blue" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">{r.name}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">{r.frequency}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">{r.format}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700">{r.status}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mb-1">{r.dataset}</div>
                  <div className="flex items-center gap-4 text-[10px] text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1"><Clock size={10} /> Dernier: {new Date(r.lastRun).toLocaleDateString('fr-CA')}</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> Prochain: {new Date(r.nextRun).toLocaleDateString('fr-CA')}</span>
                    <span>Créé par: {r.createdBy}</span>
                    <span>Dest: {r.recipients.join(', ')}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className="px-2 py-1.5 text-[10px] font-medium rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors">Modifier</button>
                  <button className="px-2 py-1.5 text-[10px] font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors flex items-center gap-1">
                    <Play size={10} /> Exécuter
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CATALOG */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportDefinitions.map(rd => (
            <Card key={rd.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-qc-blue/10 flex items-center justify-center shrink-0">
                  <FileBarChart size={15} className="text-qc-blue" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-0.5">{rd.name}</div>
                  <p className="text-xs text-slate-500 mb-2">{rd.description}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {rd.formats.map(f => (
                      <span key={f} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">{f}</span>
                    ))}
                    <span className="text-[9px] font-mono text-slate-400 ml-auto">{rd.rbacRequired}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => { setSelectedDataset(rd.dataset); setStep('filters'); setActiveTab('builder') }}
                  className="flex-1 py-1.5 text-[10px] font-semibold rounded-lg bg-qc-blue text-white hover:bg-blue-700 transition-colors">
                  Générer ce rapport
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  )
}
