/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: '#0f1117',
        panel: '#161b22',
        border: '#21262d',
        teal: '#00D2B4',
        'teal-dim': '#00a98f',
        critical: '#ef4444',
        high: '#f97316',
        medium: '#eab308',
        low: '#22c55e',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      animation: {
        'pulse-critical': 'pulse 1.4s cubic-bezier(0.4,0,0.6,1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-up': 'fadeUp 0.4s ease-out',
        'pin-drop': 'pinDrop 0.5s cubic-bezier(0.34,1.56,0.64,1)',
      },
      keyframes: {
        slideIn: { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        fadeUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pinDrop: { from: { opacity: 0, transform: 'scale(0) translateY(-20px)' }, to: { opacity: 1, transform: 'scale(1) translateY(0)' } },
      },
    },
  },
  plugins: [],
};
