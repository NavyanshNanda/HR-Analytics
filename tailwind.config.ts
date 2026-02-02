import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Status colors
        selected: '#10B981',
        rejected: '#EF4444',
        'in-progress': '#F59E0B',
        'on-hold': '#6B7280',
        // Alert colors
        alert: '#DC2626',
        'alert-bg': '#FEE2E2',
      },
    },
  },
  plugins: [],
}
export default config
