import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'qc-blue':      '#003DA5',
        'qc-blue-dark': '#001F5C',
        'qc-blue-mid':  '#1A56C4',
        'qc-red':       '#C8102E',
      },
      fontFamily: { sans: ['Inter','system-ui','sans-serif'] },
      screens: { xs: '390px' },
    }
  },
  plugins: []
}
export default config
