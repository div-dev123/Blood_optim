/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'medical-navy': '#0A2463',
        'vital-crimson': '#DC143C',
        'plasma-gold': '#FFB627',
        'clinical-white': '#F8F9FA',
        'ai-cyan': '#00E5FF',
        'o-plus-red': '#E63946',
        'a-plus-amber': '#F77F00',
        'b-plus-blue': '#06AED5',
        'ab-plus-purple': '#9D4EDD',
        'oxygen-green': '#06FFA5',
        'neural-gray': '#2B2D42',
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        heading: ['Exo 2', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'xs': 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
        'sm': 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',
        'base': 'clamp(1rem, 0.95rem + 0.25vw, 1.125rem)',
        'lg': 'clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)',
        'xl': 'clamp(1.5rem, 1.35rem + 0.75vw, 2rem)',
        '2xl': 'clamp(2rem, 1.75rem + 1.25vw, 3rem)',
        '3xl': 'clamp(2.5rem, 2rem + 2.5vw, 4rem)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(220, 20, 60, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(220, 20, 60, 0.8)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #0A2463 0%, #1E3A8A 50%, #DC143C 100%)',
        'data-glow': 'linear-gradient(90deg, #00E5FF, #00B4D8, #0096C7)',
        'warning-gradient': 'linear-gradient(45deg, #FFB627, #FF9500)',
        'success-gradient': 'linear-gradient(135deg, #06FFA5, #00D9A5)',
      },
    },
  },
  plugins: [],
}
