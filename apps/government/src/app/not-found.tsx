/** STYLE: écran de secours administratif sobre, cohérent avec le portail Super Admin. */
import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-slate-100">
      <section className="max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
        <p className="text-[10px] font-black tracking-[.18em] text-qc-blue">TAXIMÈTRE.GOV · ADMINISTRATION</p>
        <h1 className="mt-3 text-2xl font-bold">Page introuvable</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">Cette page n’est pas disponible dans le portail Super Admin.</p>
        <Link href="/" className="mt-6 inline-flex rounded-lg bg-qc-blue px-4 py-2 text-xs font-bold text-white">Retour au tableau de bord</Link>
      </section>
    </main>
  )
}
