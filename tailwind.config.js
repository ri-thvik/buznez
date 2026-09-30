/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Background layers
        'bg-base':       '#0D0916',
        'bg-secondary':  '#120D1D',
        'bg-panel':      '#211633',
        'bg-elevated':   '#291D3D',
        // Borders
        'border-subtle': '#3A2A52',
        // Brand
        'brand':         '#7C3AED',
        'brand-bright':  '#8B5CF6',
        // Semantic
        'gold':          '#F5B942',
        'text-primary':  '#F8F7FB',
        'text-secondary':'#B8AEC9',
        'text-muted':    '#7F7590',
        'success':       '#39D98A',
        'danger':        '#F05252',
        'info':          '#4EA5FF',
        // Player tokens
        'player-1':      '#39D98A',
        'player-2':      '#4EA5FF',
        'player-3':      '#F05252',
        'player-4':      '#F5B942',
        // Property groups
        'group-brown':       '#8B5E3C',
        'group-lightblue':   '#38BDF8',
        'group-purple':      '#8B5CF6',
        'group-orange':      '#F97316',
        'group-red':         '#EF4444',
        'group-yellow':      '#FACC15',
        'group-green':       '#22C55E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Rajdhani', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'panel': '0 4px 24px rgba(0,0,0,0.4)',
        'card':  '0 2px 12px rgba(0,0,0,0.3)',
        'glow-brand':  '0 0 20px rgba(124,58,237,0.4)',
        'glow-gold':   '0 0 20px rgba(245,185,66,0.35)',
        'glow-green':  '0 0 20px rgba(57,217,138,0.35)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}
