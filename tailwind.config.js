/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: { xs: '380px', sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' },

      colors: {
        /* ── New ResiTrack Palette ─────────────────────────────────────── */
        'rt': {
          'bg':        '#FFF0E4',   // warm light — page background
          'accent':    '#FFE0C5',   // warm peach — cards / surfaces
          'border':    '#F5C6A0',   // warm border
          'primary':   '#007979',   // dark teal — buttons, active nav
          'primary-h': '#005f5f',   // hover of primary
          'secondary': '#24B1B1',   // light teal — icons, labels
          'secondary-h':'#1a9090',  // hover of secondary
          'dark':      '#1a2e2e',   // heading text
          'body':      '#2d4040',   // body text
          'muted':     '#6b8080',   // muted / placeholder text
          'surface':   '#FFFAF5',   // white-ish card surface
        },
      },

      boxShadow: {
        'card':       '0 1px 3px 0 rgba(0,121,121,0.08), 0 1px 2px -1px rgba(0,121,121,0.06)',
        'card-hover': '0 4px 16px 0 rgba(0,121,121,0.15), 0 2px 4px -1px rgba(0,121,121,0.1)',
        'modal':      '0 20px 60px -12px rgba(0,121,121,0.25)',
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      borderRadius: { xl: '0.75rem', '2xl': '1rem', '3xl': '1.25rem' },

      keyframes: {
        'fade-in':       { '0%': { opacity: '0' },                          '100%': { opacity: '1' } },
        'slide-up':      { '0%': { transform: 'translateY(12px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        'slide-in-left': { '0%': { transform: 'translateX(-100%)' },        '100%': { transform: 'translateX(0)' } },
        'pulse-soft':    { '0%, 100%': { opacity: '1' },                    '50%': { opacity: '0.6' } },
      },
      animation: {
        'fade-in':       'fade-in 0.25s ease-out',
        'slide-up':      'slide-up 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'pulse-soft':    'pulse-soft 2s ease-in-out infinite',
      },
      spacing: { '18': '4.5rem', '68': '17rem', '72': '18rem', '80': '20rem' },
    },
  },
  plugins: [],
}