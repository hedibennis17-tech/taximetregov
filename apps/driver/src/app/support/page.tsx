'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import {
  SUPPORT_CATEGORIES, mockSupportTickets, STATUS_CONFIG,
  type SupportCategory
} from '@/lib/engines/notification.engine'
import { useState } from 'react'
import { MessageCircle, Phone, ChevronRight, Send, Plus, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<'new' | 'tickets' | 'faq'>('new')
  const [selectedCategory, setSelectedCategory] = useState<SupportCategory | null>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')

  const openTickets = mockSupportTickets.filter(t => t.status !== 'CLOSED' && t.status !== 'RESOLVED').length
  const ticket = mockSupportTickets.find(t => t.ticketId === selectedTicket)

  const handleSubmit = () => {
    if (!selectedCategory || !subject.trim() || !body.trim()) return
    setSubmitted(true)
  }

  const statusConf: Record<string, { color: string; label: string }> = STATUS_CONFIG

  return (
    <AppShell>
      <PageHeader title="Support" subtitle="Assistance chauffeur · Taximetre.GOV" />
      <div className="px-4">
        {/* Quick contact */}
        <div className="flex gap-3 mb-5">
          <button className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-qc-blue text-white font-bold text-sm hover:bg-qc-blue-dark transition-all shadow-lg shadow-blue-900/30">
            <MessageCircle size={16} /> Chat en direct
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-bold text-sm hover:bg-slate-700 transition-all">
            <Phone size={16} /> Telephone
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {[['new','Nouveau ticket'],['tickets',`Mes tickets${openTickets>0?' ('+openTickets+')':''}`],['faq','FAQ']].map(([k,l]) => (
            <button key={k} onClick={() => { setActiveTab(k as any); setSelectedTicket(null) }}
              className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all ${activeTab===k?'bg-qc-blue text-white':'bg-slate-900 text-slate-400 border border-slate-800'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* ─── NEW TICKET ──────────────────────────────────── */}
        {activeTab === 'new' && !submitted && (
          <div className="space-y-4 mb-6">
            <div className="text-sm font-semibold text-slate-400">Choisir la categorie</div>
            <div className="grid grid-cols-2 gap-2">
              {SUPPORT_CATEGORIES.map(cat => (
                <button key={cat.key} onClick={() => setSelectedCategory(cat.key)}
                  className={`p-3.5 rounded-2xl text-left transition-all border ${selectedCategory===cat.key?'border-qc-blue bg-qc-blue/10':'border-slate-800 bg-slate-900 hover:border-slate-700'}`}>
                  <div className="text-xl mb-1">{cat.icon}</div>
                  <div className="font-semibold text-white text-xs">{cat.label}</div>
                  <div className="text-[9px] text-slate-500">{cat.desc}</div>
                </button>
              ))}
            </div>

            {selectedCategory && (
              <>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wide block mb-1.5">Sujet</label>
                  <input value={subject} onChange={e => setSubject(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white text-sm outline-none focus:border-qc-blue transition-colors"
                    placeholder="Resume de votre probleme" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wide block mb-1.5">Description</label>
                  <textarea value={body} onChange={e => setBody(e.target.value)} rows={4}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white text-sm outline-none focus:border-qc-blue transition-colors resize-none"
                    placeholder="Decrivez votre situation en detail..." />
                </div>
                <button onClick={handleSubmit} disabled={!subject.trim() || !body.trim()}
                  className="w-full py-4 rounded-2xl bg-qc-blue text-white font-bold text-base hover:bg-qc-blue-dark disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                  <Send size={16} /> Envoyer le ticket
                </button>
              </>
            )}
          </div>
        )}

        {/* ─── SUBMITTED ───────────────────────────────────── */}
        {activeTab === 'new' && submitted && (
          <div className="text-center py-8 mb-6">
            <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-green-400" />
            </div>
            <div className="text-xl font-black text-white mb-2">Ticket cree</div>
            <div className="text-sm text-slate-400 mb-6">Delai de reponse estime: 4-24h selon la priorite</div>
            <button onClick={() => { setSubmitted(false); setSelectedCategory(null); setSubject(''); setBody(''); setActiveTab('tickets') }}
              className="w-full py-4 rounded-2xl bg-qc-blue text-white font-bold hover:bg-qc-blue-dark transition-all">
              Voir mes tickets
            </button>
          </div>
        )}

        {/* ─── MY TICKETS ──────────────────────────────────── */}
        {activeTab === 'tickets' && !selectedTicket && (
          <div className="space-y-3 mb-6">
            {mockSupportTickets.map(t => {
              const sConf = statusConf[t.status]
              return (
                <button key={t.ticketId} onClick={() => setSelectedTicket(t.ticketId)}
                  className="w-full driver-card p-4 text-left hover:border-qc-blue/40 transition-all">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">
                      {SUPPORT_CATEGORIES.find(c => c.key === t.category)?.icon || '💬'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-bold text-white text-sm">{t.subject}</span>
                        <span className={`text-[9px] font-bold ${sConf?.color || 'text-slate-400'}`}>{sConf?.label || t.status}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">{t.ticketId} · {t.messages.length} message(s)</div>
                      <div className="text-[10px] text-slate-600">{new Date(t.createdAt).toLocaleDateString('fr-CA')}</div>
                    </div>
                    <ChevronRight size={16} className="text-slate-600 shrink-0 mt-1" />
                  </div>
                </button>
              )
            })}
            {mockSupportTickets.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">Aucun ticket</div>
            )}
          </div>
        )}

        {/* ─── TICKET DETAIL ───────────────────────────────── */}
        {activeTab === 'tickets' && selectedTicket && ticket && (
          <div className="mb-6">
            <button onClick={() => setSelectedTicket(null)} className="text-xs text-slate-400 hover:text-slate-200 mb-4 flex items-center gap-1">
              ← Retour aux tickets
            </button>
            <Card className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-white">{ticket.subject}</span>
                <span className={`text-xs font-bold ${statusConf[ticket.status]?.color || 'text-slate-400'}`}>{statusConf[ticket.status]?.label}</span>
              </div>
              <div className="text-[10px] text-slate-500">{ticket.ticketId} · {ticket.category}</div>
            </Card>
            <div className="space-y-3 mb-4">
              {ticket.messages.map(msg => (
                <div key={msg.messageId}
                  className={`flex ${msg.sender === 'DRIVER' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-xs ${
                    msg.sender === 'DRIVER' ? 'bg-qc-blue text-white rounded-br-sm' :
                    msg.sender === 'SYSTEM' ? 'bg-slate-800 text-slate-400 text-center text-[10px]' :
                    'bg-slate-800 text-slate-200 rounded-bl-sm'}`}>
                    {msg.sender !== 'DRIVER' && msg.sender !== 'SYSTEM' && (
                      <div className="text-[10px] text-slate-500 mb-1 font-semibold">Support</div>
                    )}
                    {msg.content}
                    <div className={`text-[9px] mt-1 ${msg.sender === 'DRIVER' ? 'text-blue-200' : 'text-slate-500'}`}>
                      {new Date(msg.sentAt).toLocaleTimeString('fr-CA',{hour:'2-digit',minute:'2-digit'})}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
              <div className="flex gap-2">
                <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white text-sm outline-none focus:border-qc-blue transition-colors"
                  placeholder="Votre reponse..." />
                <button onClick={() => setNewMessage('')}
                  className="px-4 py-3 rounded-2xl bg-qc-blue text-white hover:bg-qc-blue-dark transition-all">
                  <Send size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── FAQ ─────────────────────────────────────────── */}
        {activeTab === 'faq' && (
          <div className="space-y-3 mb-6">
            {[
              { q:'Comment renouveler mon permis taxi?', a:'Dans Documents > Vehicule > Permis taxi > Remplacer. Telechargez le nouveau certificat. En attente de verification manuelle.' },
              { q:'Pourquoi mes revenus Uber ne sont-ils pas synchronises?', a:'Verifiez la connexion Uber dans Plateformes. Si le token est expire, reconnectez votre compte via OAuth (sans mot de passe dans notre app).' },
              { q:'Qu\'est-ce que le taximetre desactive pour Uber?', a:'Pour Rideshare (Uber/Lyft), le prix vient directement d\'Uber — Taximetre.GOV enregistre le montant fourni. Le taximetre reglementaire est actif uniquement pour les courses taxi.' },
              { q:'Comment corriger une transaction erronee?', a:'Via Revenus > Transactions > [Transaction] > Demander une correction. Une verification manuelle est requise — jamais de modification automatique.' },
              { q:'Mon NAS sera-t-il demande dans l\'application?', a:'Non. Votre NAS, si legalement requis, est stocke dans un coffre securise chiffre et jamais affiche en clair. Il ne vous sera jamais demande par notification.' },
              { q:'Comment contacter Revenu Quebec pour mes taxes?', a:'Taximetre.GOV organise vos donnees fiscales mais ne remplace pas Revenu Quebec (1 800 267-6299) ou l\'ARC (1 800 959-7775) pour les declarations officielles.' },
            ].map((faq, i) => (
              <Card key={i}>
                <div className="font-semibold text-white text-sm mb-2">{faq.q}</div>
                <p className="text-xs text-slate-400 leading-relaxed">{faq.a}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
