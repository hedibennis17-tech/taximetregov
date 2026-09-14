// ================================================================
// TAXIMÈTRE.GOV — Theme helpers
// Fournit les tokens de couleur selon dark/light
// Usage: const t = getThemeTokens(dark)
// ================================================================

export interface ThemeTokens {
  // Fonds
  bg: string
  card: string
  card2: string
  hover: string
  // Textes
  text: string
  text2: string
  text3: string
  // Bordures
  border: string
  borderB: string
  accent: string
  // Header/Nav
  headerBg: string
  navActive: string
  // Input
  inputBg: string
  inputBdr: string
  // Shadows
  shadow: string
  shadowLg: string
  // Couleurs sémantiques
  blue: string
  green: string
  red: string
  amber: string
  purple: string
}

export function getThemeTokens(dark: boolean): ThemeTokens {
  if (dark) return {
    bg:        '#050E1C',
    card:      '#0F1F38',
    card2:     '#0A1628',
    hover:     '#142544',
    text:      '#F0F4FF',
    text2:     '#8BA3CC',
    text3:     '#4A6285',
    border:    'rgba(59,130,246,0.18)',
    borderB:   'rgba(59,130,246,0.35)',
    accent:    '#3B82F6',
    headerBg:  '#001F5C',
    navActive: '#3B82F6',
    inputBg:   'rgba(5,14,28,0.8)',
    inputBdr:  'rgba(59,130,246,0.25)',
    shadow:    '0 2px 12px rgba(0,0,0,0.4)',
    shadowLg:  '0 8px 32px rgba(0,0,0,0.5)',
    blue:      '#60A5FA',
    green:     '#34D399',
    red:       '#F87171',
    amber:     '#FBBF24',
    purple:    '#A78BFA',
  }
  return {
    bg:        '#EEF3FC',
    card:      '#FFFFFF',
    card2:     '#F4F7FE',
    hover:     '#E4ECFA',
    text:      '#001433',
    text2:     '#1A3A6B',
    text3:     '#4A6A9A',
    border:    '#C5D4EE',
    borderB:   '#7B9ED9',
    accent:    '#003DA5',
    headerBg:  '#003DA5',
    navActive: '#003DA5',
    inputBg:   '#FFFFFF',
    inputBdr:  '#C5D4EE',
    shadow:    '0 2px 12px rgba(0,61,165,0.10)',
    shadowLg:  '0 8px 32px rgba(0,61,165,0.16)',
    blue:      '#003DA5',
    green:     '#059669',
    red:       '#DC2626',
    amber:     '#B45309',
    purple:    '#7C3AED',
  }
}

/** Bouton filtre actif / inactif */
export function filterBtnStyle(active: boolean, dark: boolean) {
  return {
    flex: 1,
    padding: '9px 0',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s',
    background: active
      ? '#003DA5'
      : dark ? '#0F1F38' : '#FFFFFF',
    color: active
      ? '#FFFFFF'
      : dark ? '#8BA3CC' : '#4A6A9A',
    boxShadow: active ? '0 4px 12px rgba(0,61,165,0.30)' : 'none',
  } as React.CSSProperties
}

/** Style d'une card standard */
export function cardStyle(t: ThemeTokens): React.CSSProperties {
  return {
    background: t.card,
    border: `1.5px solid ${t.border}`,
    borderRadius: 16,
    boxShadow: t.shadow,
  }
}

/** Style d'une card avec accent gauche */
export function cardAccentStyle(t: ThemeTokens, color = '#003DA5'): React.CSSProperties {
  return {
    background: t.card,
    border: `1.5px solid ${t.border}`,
    borderLeft: `4px solid ${color}`,
    borderRadius: 16,
    boxShadow: t.shadow,
  }
}

/** Titre de section avec barre verticale */
export function SectionTitle({ title, action, actionLabel, t }: {
  title: string
  t: ThemeTokens
  action?: () => void
  actionLabel?: string
}) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
      <div style={{ width:3, height:16, borderRadius:2, background:t.accent, flexShrink:0 }} />
      <span style={{ fontSize:11, fontWeight:800, letterSpacing:'0.10em', textTransform:'uppercase', color:t.text2, flex:1 }}>
        {title}
      </span>
      {action && actionLabel && (
        <button onClick={action} style={{ fontSize:11, fontWeight:700, color:t.accent, background:'none', border:'none', cursor:'pointer' }}>
          {actionLabel} →
        </button>
      )}
    </div>
  )
}

/** Mini stat box */
export function StatBox({ label, val, color, bg, t }: {
  label: string; val: string; color: string; bg: string; t: ThemeTokens
}) {
  return (
    <div style={{ background:bg, borderRadius:14, border:`1px solid ${t.border}`, padding:'12px 8px', textAlign:'center' }}>
      <div style={{ fontSize:15, fontWeight:800, color, letterSpacing:'-0.01em' }}>{val}</div>
      <div style={{ fontSize:9, color:t.text3, fontWeight:600, marginTop:3, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</div>
    </div>
  )
}

/** Loader row */
export function EmptyState({ icon, msg, t }: { icon:string; msg:string; t:ThemeTokens }) {
  return (
    <div style={{ padding:'40px 0', textAlign:'center' }}>
      <div style={{ fontSize:44, marginBottom:10 }}>{icon}</div>
      <div style={{ fontSize:13, color:t.text3, fontWeight:500 }}>{msg}</div>
    </div>
  )
}
