'use client'
import { AppShell } from '@/components/layout/AppShell'
import { useTheme } from '@/lib/theme'
import { getThemeTokens, cardStyle, SectionTitle } from '@/lib/theme-helpers'
import { MessageCircle, Phone, FileText, HelpCircle, ChevronRight, Mail } from 'lucide-react'

const FAQ = [
  { q:'Comment déclarer mes revenus?',       a:'Rendez-vous dans la section Fiscal pour accéder aux outils de déclaration Revenu Québec.' },
  { q:'Comment connecter une plateforme?',   a:'Allez dans Mes plateformes, choisissez votre service (Uber, Taxi Diamond, etc.) et suivez les étapes.' },
  { q:'Mon document est refusé, que faire?', a:'Vérifiez que le document est lisible, non expiré, puis soumettez-le à nouveau depuis Mes documents.' },
  { q:'Comment calculer mes déductions?',    a:'Le Centre fiscal calcule automatiquement vos dépenses déductibles selon les règles RQ en vigueur.' },
]

export default function SupportPage() {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const t = getThemeTokens(dark)

  const contacts = [
    { icon:Phone,         label:'Téléphone',  sub:'1-800-TAXI-GOV',             color:'#059669' },
    { icon:Mail,          label:'Courriel',   sub:'support@taximetregov.qc.ca',  color:'#003DA5' },
    { icon:MessageCircle, label:'Clavardage', sub:'Lun-Ven 8h–18h (HAE)',        color:'#7C3AED' },
  ]

  return (
    <AppShell>
      <div style={{ padding:'18px 16px 12px' }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:t.text, margin:0, letterSpacing:'-0.01em' }}>Support</h1>
        <p style={{ fontSize:11, color:t.text3, margin:'3px 0 0' }}>Aide · TAXIMÈTRE.GOV</p>
      </div>

      <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:16, paddingBottom:32 }}>
        {/* Hero */}
        <div style={{ background:'linear-gradient(135deg,#003DA5 0%,#0B4F71 100%)', borderRadius:20, padding:'20px 18px', boxShadow:'0 8px 28px rgba(0,61,165,0.30)', textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:8 }}>🆘</div>
          <div style={{ fontSize:16, fontWeight:800, color:'white', marginBottom:6 }}>Comment pouvons-nous vous aider?</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.60)', lineHeight:1.5 }}>
            Notre équipe de support est disponible pour vous aider avec toute question concernant TAXIMÈTRE.GOV
          </div>
        </div>

        {/* Contacts */}
        <div>
          <SectionTitle title="Nous contacter" t={t} />
          <div style={{ ...cardStyle(t), overflow:'hidden' }}>
            {contacts.map((c, idx) => {
              const Icon = c.icon
              return (
                <div key={c.label} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 15px', borderTop: idx > 0 ? `1px solid ${t.border}` : 'none' }}>
                  <div style={{ width:38, height:38, borderRadius:11, background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border:`1px solid ${t.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Icon size={17} color={c.color} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:t.text }}>{c.label}</div>
                    <div style={{ fontSize:11, color:t.text3, marginTop:2 }}>{c.sub}</div>
                  </div>
                  <ChevronRight size={16} color={t.text3} />
                </div>
              )
            })}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <SectionTitle title="Questions fréquentes" t={t} />
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {FAQ.map((item, idx) => (
              <div key={idx} style={{ ...cardStyle(t), padding:'13px 15px' }}>
                <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                  <HelpCircle size={15} color={t.accent} style={{ flexShrink:0, marginTop:1 }} />
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:t.text, marginBottom:5 }}>{item.q}</div>
                    <div style={{ fontSize:11, color:t.text2, lineHeight:1.5 }}>{item.a}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Docs */}
        <div style={{ ...cardStyle(t), padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
          <FileText size={20} color={t.accent} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:t.text }}>Documentation complète</div>
            <div style={{ fontSize:11, color:t.text3, marginTop:2 }}>Guide du chauffeur · TAXIMÈTRE.GOV</div>
          </div>
          <ChevronRight size={16} color={t.text3} />
        </div>
      </div>
    </AppShell>
  )
}
