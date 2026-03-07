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
      background: '#15324a',
      eyebrow: '#93c5fd',
      title: '#f8fafc',
      subtitle: '#cbd5e1',
    },
    actionSurface: 'rgba(255,255,255,0.12)',
    actionBorder: 'rgba(255,255,255,0.16)',
    actionText: '#e0f2fe',
  },
  wishlist: {
    screenBackground: '#f8f4ef',
    hero: {
      background: '#4a2d25',
      eyebrow: '#f7c9b5',
      title: '#fff7ed',
      subtitle: '#f3dfd5',
    },
    actionSurface: 'rgba(255,244,230,0.12)',
    actionBorder: 'rgba(255,236,220,0.18)',
    actionText: '#fff7ed',
  },
  indicators: {
    screenBackground: '#f3f5fb',
    hero: {
      background: '#24324d',
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
      background: '#21423b',
      eyebrow: '#bbf7d0',
      title: '#f0fdf4',
      subtitle: '#d1fae5',
    },
    actionSurface: 'rgba(255,255,255,0.12)',
    actionBorder: 'rgba(255,255,255,0.16)',
    actionText: '#f0fdf4',
  },
}
