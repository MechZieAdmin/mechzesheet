/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        'gpt-dark': '#212121',
        'gpt-panel': '#171717',
        'gpt-accent': '#2f2f2f',
        'gpt-light': '#ececec',
        'gpt-muted': '#b4b4b4',
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'soft-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
        'card': '0 4px 6px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'spin-slow-3d': 'spinSlow3d 20s linear infinite',
        'spin-reverse-3d': 'spinReverse3d 25s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        spinSlow3d: {
          '0%': { transform: 'rotateX(20deg) rotateY(10deg) rotateZ(0deg)' },
          '100%': { transform: 'rotateX(20deg) rotateY(10deg) rotateZ(360deg)' },
        },
        spinReverse3d: {
          '0%': { transform: 'rotateX(-20deg) rotateY(-10deg) rotateZ(360deg)' },
          '100%': { transform: 'rotateX(-20deg) rotateY(-10deg) rotateZ(0deg)' },
        },
      },
    },
  },
  plugins: [],
}
