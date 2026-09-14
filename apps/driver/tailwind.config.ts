import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'qc-blue':       '#003DA5',
        'qc-blue-dark':  '#001F5C',
        'qc-blue-mid':   '#1A56C4',
        'qc-blue-light': '#3B82F6',
        'qc-blue-pale':  '#0A1E40',
        'qc-red':        '#C8102E',
        'driver-green':  '#10B981',
        'driver-red':    '#EF4444',
        'driver-amber':  '#F59E0B',
        'bg-app':        '#050E1C',
        'bg-surface':    '#0A1628',
        'bg-card':       '#0F1F38',
        'bg-elevated':   '#1A2E4A',
      },
      fontFamily: { sans: ['Inter','system-ui','sans-serif'] },
      screens: { xs: '390px' },
      boxShadow: {
        'blue':  '0 4px 20px rgba(59,130,246,0.2)',
        'card':  '0 2px 8px rgba(0,0,0,0.3)',
      }
    }
  },
  plugins: []
}
export default config
