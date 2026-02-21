// ADD THIS: Tailwind configuration tuned for a neumorphic UI theme
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: 'var(--color-surface)',
        'surface-strong': 'var(--color-surface-strong)',
        accent: 'var(--color-accent)',
        'accent-strong': 'var(--color-accent-strong)',
        primary: 'var(--primary-cta-bg)',
        'primary-foreground': 'var(--primary-cta-foreground)',
        'text-primary': 'var(--color-text-primary)',
        'text-muted': 'var(--color-text-muted)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
      },
      boxShadow: {
        'neo-sm': '8px 8px 16px var(--color-shadow-dark), -8px -8px 16px var(--color-shadow-light)',
        'neo-md':
          '12px 12px 24px var(--color-shadow-dark), -12px -12px 24px var(--color-shadow-light)',
        'neo-inset':
          'inset 8px 8px 16px var(--color-shadow-dark), inset -8px -8px 16px var(--color-shadow-light)',
      },
      borderRadius: {
        neo: '18px',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
