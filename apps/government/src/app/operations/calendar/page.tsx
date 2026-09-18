'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { PILOT, fmtDay, CALENDAR_EVENTS, TYPE_ICONS } from '@/lib/operations-data'

const NAV = [
  {href:'/tasks',                  l:'📋 Tâches',          active:false},
  {href:'/approvals',              l:'🔐 Approbations',    active:false},
  {href:'/operations/calendar',    l:'📅 Calendrier',      active:true},
  {href:'/operations/data-quality',l:'🧹 Qualité données', active:false},
]

const TYPE_COLORS: Record<string,string> = {
  DOCUMENT:'#003DA5',RECONCILIATION:'#B45309',PLATFORM:'#7C3AED',REPORT:'#059669',
  DATA_QUALITY:'#DC2626',DEADLINE:'#DC2626',FISCAL:'#003DA5',SYSTEM:'#64748B',
}

// Grouper par date
const grouped = CALENDAR_EVENTS.reduce((acc, e) => {
  if (!acc[e.date]) acc[e.date] = []
  acc[e.date]!.push(e)
  return acc
}, {} as Record<string, typeof CALENDAR_EVENTS>)

const DATES = Object.keys(grouped).sort()

export default function CalendarPage() {
  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Calendrier opérationnel</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">Tâches · Échéances · Rapports · Périodes fiscales · Sept–Oct 2026</p>
        <div className="flex gap-1.5 overflow-x-auto pb-3 flex-nowrap">
          {NAV.map(n=><Link key={n.href} href={n.href} className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap" style={{background:n.active?'#003DA5':'transparent',color:n.active?'white':'#64748B',borderColor:n.active?'#003DA5':'rgba(148,163,184,0.30)'}}>{n.l}</Link>)}
        </div>
      </div>

      <div className="px-4 md:px-6 pb-8 space-y-5">
        <div className="text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>

        {/* Légende types */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="text-[9px] font-bold text-slate-400 uppercase mb-3">Types d'événements</div>
          <div className="flex flex-wrap gap-2">
            {[
              {type:'DOCUMENT',    label:'Document',        icon:'📄'},
              {type:'RECONCILIATION',label:'Réconciliation',icon:'🔄'},
              {type:'REPORT',      label:'Rapport',         icon:'📊'},
              {type:'FISCAL',      label:'Fiscal',          icon:'🧾'},
              {type:'DATA_QUALITY',label:'Qualité données', icon:'🧹'},
              {type:'DEADLINE',    label:'Échéance critique',icon:'⏰'},
              {type:'PLATFORM',    label:'Plateforme',      icon:'🌐'},
            ].map(t=>(
              <div key={t.type} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-bold border border-white dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <div className="w-2 h-2 rounded-full shrink-0" style={{background:TYPE_COLORS[t.type]??'#64748B'}}/>
                <span>{t.icon} {t.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Événements par date */}
        <div className="space-y-4">
          {DATES.map(date=>{
            const events = grouped[date]!
            const dateObj = new Date(date + 'T12:00:00')
            const isToday = date === '2026-09-18'
            const isPast  = dateObj < new Date('2026-09-18')
            return (
              <div key={date} className={`bg-white dark:bg-slate-900 border rounded-2xl shadow-sm overflow-hidden ${isToday?'border-blue-400 dark:border-blue-500':'border-slate-200 dark:border-slate-700'}`}>
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3" style={{background:isToday?'#EEF3FB':''}}>
                  <div className="text-center shrink-0">
                    <div className="text-[8px] font-bold text-slate-400 uppercase">{dateObj.toLocaleDateString('fr-CA',{weekday:'short'}).toUpperCase()}</div>
                    <div className="text-xl font-black text-slate-800 dark:text-slate-200">{dateObj.getDate()}</div>
                    <div className="text-[8px] text-slate-400">{dateObj.toLocaleDateString('fr-CA',{month:'short'})}</div>
                  </div>
                  <div className="flex-1">
                    {isToday && <div className="text-[9px] font-bold text-blue-700 dark:text-blue-400 mb-0.5">📅 AUJOURD'HUI</div>}
                    {isPast  && <div className="text-[9px] text-slate-400">Date passée</div>}
                    <div className="text-[9px] text-slate-400">{events.length} événement(s)</div>
                  </div>
                  <div className="flex gap-1">
                    {events.map(e=>(
                      <div key={e.id} className="w-2 h-2 rounded-full" style={{background:TYPE_COLORS[e.type]??'#64748B'}}/>
                    ))}
                  </div>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {events.map(e=>(
                    <div key={e.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="text-xs font-bold text-slate-400 shrink-0 w-12">{e.time}</div>
                      <div className="w-2 h-2 rounded-full shrink-0" style={{background:TYPE_COLORS[e.type]??'#64748B'}}/>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{e.title}</div>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">{e.source}</div>
                      </div>
                      <span className="text-[8px] font-bold px-2 py-0.5 rounded-full text-white shrink-0" style={{background:TYPE_COLORS[e.type]??'#64748B'}}>
                        {TYPE_ICONS[e.type]??'📋'} {e.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Note */}
        <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4">
          <div className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">
            🏛️ Ce calendrier regroupe les tâches, échéances, rapports programmés et périodes fiscales du pilote TAXIMETER.GOV. En production, il serait synchronisé avec les systèmes gouvernementaux autorisés. Toutes les dates et événements sont synthétiques.
          </div>
        </div>
      </div>
    </AppShell>
  )
}
