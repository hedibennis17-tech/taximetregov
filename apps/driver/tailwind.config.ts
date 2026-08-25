import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'qc-blue': '#003DA5',
        'qc-blue-dark': '#002D7A',
        'qc-blue-light': '#1A56C4',
        'driver-green': '#00C851',
        'driver-red': '#FF4444',
        'driver-amber': '#FFB300',
      },
      fontFamily: { sans: ['Inter','system-ui','sans-serif'] },
      screens: { 'xs': '390px' },
    }
  },
  plugins: []
}
export default config
