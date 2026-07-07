/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0B1615',
          light: '#122220',
          lighter: '#1A2E2B',
        },
        parchment: {
          DEFAULT: '#EDE7DC',
          dim: '#C9C2B4',
        },
        signal: {
          DEFAULT: '#3FBFA6',
          bright: '#5FE3C9',
          dim: '#2C8B78',
        },
        clay: {
          DEFAULT: '#C87D5E',
          bright: '#E0996F',
          dim: '#8F5740',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.28)',
        'glass-lg': '0 20px 60px rgba(0, 0, 0, 0.35)',
      },
    },
  },
  plugins: [],
};
