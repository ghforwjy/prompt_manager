export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0F1C',
        surface: '#0F172A',
        'surface-hover': '#1E293B',
        primary: '#22D3EE',
        'primary-foreground': '#0A0F1C',
        muted: '#64748B',
        'muted-foreground': '#94A3B8',
        border: '#1E293B',
        destructive: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
