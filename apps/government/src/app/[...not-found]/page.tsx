'use client'
import { AppShell } from '@/components/layout/AppShell'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Construction, ArrowLeft } from 'lucide-react'

export default function ComingSoon() {
  const pathname = usePathname()
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-6">⚜</div>
        <div className="w-12 h-12 rounded-xl bg-qc-blue/10 flex items-center justify-center mb-4">
          <Construction size={24} className="text-qc-blue" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Module en développement</h1>
        <p className="text-sm text-slate-500 mb-1">
          <code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-xs">{pathname}</code>
        </p>
        <p className="text-xs text-slate-400 mb-6">Étape 2 — Government Dashboard · Ce module sera disponible dans une prochaine étape</p>
        <Link href="/" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-qc-blue text-white text-sm font-medium hover:bg-blue-700 transition-colors">
          <ArrowLeft size={16} /> Retour au tableau de bord
        </Link>
      </div>
    </AppShell>
  )
}
