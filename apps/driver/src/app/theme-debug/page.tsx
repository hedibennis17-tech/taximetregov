'use client'
import { useTheme } from '@/lib/theme'
import { useEffect, useState } from 'react'

export default function ThemeDebugPage() {
  const { theme, toggle } = useTheme()
  const [info, setInfo] = useState<Record<string,string>>({})

  function refresh() {
    setInfo({
      theme_state:   theme,
      localStorage:  localStorage.getItem('qc-theme') ?? 'null',
      html_dataTheme: document.documentElement.getAttribute('data-theme') ?? '',
      html_classes:  document.documentElement.className,
      body_bg:       document.body.style.background,
      body_color:    document.body.style.color,
    })
  }

  useEffect(() => { refresh() }, [theme])

  return (
    <div style={{ padding:20, fontFamily:'monospace', minHeight:'100vh', background: theme==='dark'?'#050E1C':'#F0F4FF', color: theme==='dark'?'#0f0':'#000' }}>
      <h2>THEME DEBUG</h2>
      <div style={{ display:'flex', gap:12, marginBottom:20 }}>
        <button onClick={toggle} style={{ padding:'12px 24px', background:'#003DA5', color:'white', border:'none', borderRadius:8, fontSize:15, cursor:'pointer', fontWeight:700 }}>
          TOGGLE → {theme === 'dark' ? 'LIGHT' : 'DARK'}
        </button>
        <button onClick={refresh} style={{ padding:'12px 24px', background:'#333', color:'white', border:'none', borderRadius:8, fontSize:15, cursor:'pointer' }}>
          REFRESH INFO
        </button>
      </div>
      <pre style={{ background:'rgba(0,0,0,0.3)', padding:16, borderRadius:8 }}>{JSON.stringify(info, null, 2)}</pre>
      <div style={{ marginTop:20, padding:20, background: theme==='dark'?'#0F1F38':'#FFFFFF', borderRadius:12, border:'2px solid #3B82F6' }}>
        <strong>Thème actif: {theme}</strong><br/>
        Ce bloc change de couleur selon le thème ✓
      </div>
    </div>
  )
}
