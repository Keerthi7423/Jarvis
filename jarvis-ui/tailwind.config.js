/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./renderer/index.html', './renderer/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        jarvis: {
          bg: '#040916',
          panel: 'rgba(6, 16, 34, 0.58)',
          cyan: '#33f0ff',
          cyanSoft: '#8beeff',
          line: 'rgba(72, 232, 255, 0.42)',
          green: '#3df7a2',
          red: '#ff5e7b'
        }
      },
      boxShadow: {
        neon: '0 0 24px rgba(51, 240, 255, 0.38)',
        glow: '0 0 28px rgba(51, 240, 255, 0.28)',
        glowSoft: '0 0 18px rgba(51, 240, 255, 0.16)',
        core: '0 0 30px rgba(51, 240, 255, 0.55), inset 0 0 30px rgba(51, 240, 255, 0.15)',
        panel: '0 0 22px rgba(51, 240, 255, 0.18)'
      },
      keyframes: {
        corePulse: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 26px rgba(51, 240, 255, 0.35), inset 0 0 24px rgba(51, 240, 255, 0.1)' },
          '50%': { transform: 'scale(1.02)', boxShadow: '0 0 34px rgba(51, 240, 255, 0.5), inset 0 0 34px rgba(51, 240, 255, 0.16)' }
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-5px)' }
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0px)' }
        }
      },
      animation: {
        corePulse: 'corePulse 5.4s ease-in-out infinite',
        floatSlow: 'floatSlow 6.4s ease-in-out infinite',
        fadeUp: 'fadeUp 450ms ease-out both'
      }
    }
  },
  plugins: []
};
