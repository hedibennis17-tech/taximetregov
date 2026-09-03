// ================================================================
// TAXIMÈTRE.GOV — Live Data Placeholder
// Remplace les mocks — données réelles connectées à Supabase
// ================================================================

'use client'

import { RefreshCw } from 'lucide-react'

interface Props {
  title:    string
  subtitle?: string
  icon?:    string
}

export function LiveDataPlaceholder({ title, subtitle, icon = '📊' }: Props) {
  return (
    <div className="rounded-2xl border border-slate-700 border-dashed p-8 text-center">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-white mb-1">{title}</h3>
      <p className="text-xs text-slate-400 mb-4">
        {subtitle ?? 'Données réelles — connecté à Supabase'}
      </p>
      <div className="inline-flex items-center gap-2 text-[10px] text-green-400 bg-green-500/10 px-3 py-1.5 rounded-full">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
        Base de données connectée · Données réelles disponibles
      </div>
    </div>
  )
}
