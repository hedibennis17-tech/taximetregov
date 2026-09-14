'use client'
import { useTheme } from '@/lib/theme'
import { useEffect, useState } from 'react'

export default function ThemeDebugPage() {
  const { theme, toggle } = useTheme()
  const [info, setInfo] = useState<Record<string,string>>({})

  useEffect(() => {
    setInfo({
      'theme_state':       theme,
      'localStorage':      localStorage.getItem('qc-theme') ?? 'null',
      'html_classes':      document.documentElement.className,
      'body_bg':           document.body.style.background,
      'body_color':        document.body.style.color,
    })
  }, [theme])

  return (
    <div style={{ padding:20, fontFamily:'monospace', background:'#000', color:'#0f0', minHeight:'100vh' }}>
      <h2>THEME DEBUG</h2>
      <button onClick={toggle} style={{ padding:'10px 20px', background:'#003DA5', color:'white', border:'none', borderRadius:8, fontSize:16, cursor:'pointer', marginBottom:20 }}>
        TOGGLE ({theme})
      </button>
      <pre>{JSON.stringify(info, null, 2)}</pre>
      <div style={{ marginTop:20, padding:20, background: theme==='dark'?'#050E1C':'#F0F4FF', color: theme==='dark'?'white':'black', borderRadius:12 }}>
        Ce bloc devrait changer de couleur: {theme}
      </div>
    </div>
  )
}
