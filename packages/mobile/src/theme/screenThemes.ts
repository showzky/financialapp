import type { ScreenHeroTheme } from '../components/ScreenHero'

type ScreenTheme = {
  screenBackground: string
  hero: ScreenHeroTheme
  actionSurface: string
  actionBorder: string
  actionText: string
}

export const screenThemes: Record<'home' | 'wishlist' | 'indicators' | 'settings', ScreenTheme> = {
  home: {
    screenBackground: '#f3f6fb',
    hero: {
      eyebrow: '#93c5fd',
      title: '#f8fafc',
      subtitle: '#cbd5e1',
    },
    actionSurface: 'rgba(255,255,255,0.12)',
    actionBorder: 'rgba(255,255,255,0.16)',
    actionText: '#e0f2fe',
  },
  wishlist: {
    screenBackground: '#f8fafc',
    hero: {
      eyebrow: '#93c5fd',
      title: '#f8fafc',
      subtitle: '#cbd5e1',
    },
    actionSurface: 'rgba(255,255,255,0.12)',
    actionBorder: 'rgba(255,255,255,0.16)',
    actionText: '#e0f2fe',
  },
  indicators: {
    screenBackground: '#f3f5fb',
    hero: {
      eyebrow: '#c7d2fe',
      title: '#f8fafc',
      subtitle: '#dbe4f0',
    },
    actionSurface: 'rgba(255,255,255,0.12)',
    actionBorder: 'rgba(255,255,255,0.16)',
    actionText: '#e2e8f0',
  },
  settings: {
    screenBackground: '#f4f7f5',
    hero: {
      eyebrow: '#93c5fd',
      title: '#f8fafc',
      subtitle: '#cbd5e1',
    },
    actionSurface: 'rgba(255,255,255,0.12)',
    actionBorder: 'rgba(255,255,255,0.16)',
    actionText: '#e0f2fe',
  },
}
