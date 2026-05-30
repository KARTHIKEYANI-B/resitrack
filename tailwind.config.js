/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        // New Palette
        'jet':     '#022b3a',
        'teal':    '#1f7a8c',
        'pale':    '#bfdbf7',
        'lav':     '#e1e5f2',

        // Semantic aliases for use in JSX
        primary: {
          50:  '#f0f8fb',
          100: '#e1f0f4',
          200: '#bfdbf7',
          300: '#7ec8d8',
          400: '#3baabe',
          500: '#1f7a8c',
          600: '#166070',
          700: '#0e4a57',
          800: '#07333e',
          900: '#022b3a',
        },

        surface:      '#ffffff',
        background:   '#f0f4f8',
        sidebar:      '#022b3a',
        accent:       '#1f7a8c',
        accentHover:  '#166070',
        border:       '#bfdbf7',
        muted:        '#e1e5f2',

        textPrimary:   '#022b3a',
        textSecondary: '#1f7a8c',
        textMuted:     'rgba(2,43,58,0.5)',
      },

      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },

      boxShadow: {
        card:        '0 1px 4px rgba(2,43,58,0.06)',
        'card-hover':'0 4px 16px rgba(31,122,140,0.12)',
        navbar:      '0 1px 8px rgba(2,43,58,0.08)',
      },

      animation: {
        'fade-in':  'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },

      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
      },
    },
  },

  plugins: [],
}