import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'qc-blue':      '#003DA5',
        'qc-blue-dark': '#002D7A',
        'qc-blue-light':'#1A56C4',
        'qc-blue-pale': '#EBF0FA',
        'qc-red':       '#C8102E',
        'driver-green': '#00873A',
        'driver-red':   '#C8102E',
        'driver-amber': '#D97706',
        'bg-primary':   '#F4F6FA',
        'bg-card':      '#FFFFFF',
        'text-primary': '#0A1628',
        'text-secondary':'#4A5568',
        'text-muted':   '#8A96A8',
        'border-color': '#DDE3EE',
      },
      fontFamily: { sans: ['Inter','system-ui','sans-serif'] },
      screens: { 'xs': '390px' },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-md': '0 4px 12px rgba(0,0,0,0.08)',
        'blue': '0 4px 16px rgba(0,61,165,0.25)',
      }
    }
  },
  plugins: []
}
export default config
