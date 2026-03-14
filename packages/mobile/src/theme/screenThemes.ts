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
    screenBackground: '#0a0a0e',
    hero: {
      gradient: ['#0f0e1a', '#0c0f14'],
      eyebrow: 'rgba(255,255,255,0.22)',
      title: 'rgba(255,255,255,0.92)',
      subtitle: 'rgba(255,255,255,0.70)',
    },
    actionSurface: 'rgba(255,255,255,0.04)',
    actionBorder: 'rgba(255,255,255,0.06)',
    actionText: 'rgba(255,255,255,0.92)',
  },
  wishlist: {
    screenBackground: '#0a0a0e',
    hero: {
      gradient: ['#0f0e1a', '#0c0f14'],
      eyebrow: 'rgba(255,255,255,0.22)',
      title: 'rgba(255,255,255,0.92)',
      subtitle: 'rgba(255,255,255,0.70)',
    },
    actionSurface: 'rgba(255,255,255,0.04)',
    actionBorder: 'rgba(255,255,255,0.06)',
    actionText: 'rgba(255,255,255,0.92)',
  },
  indicators: {
    screenBackground: '#0a0a0e',
    hero: {
      gradient: ['#0f0e1a', '#0c0f14'],
      eyebrow: 'rgba(255,255,255,0.22)',
      title: 'rgba(255,255,255,0.92)',
      subtitle: 'rgba(255,255,255,0.70)',
    },
    actionSurface: 'rgba(255,255,255,0.04)',
    actionBorder: 'rgba(255,255,255,0.06)',
    actionText: 'rgba(255,255,255,0.92)',
  },
  settings: {
    screenBackground: '#0a0a0e',
    hero: {
      gradient: ['#0f0e1a', '#0c0f14'],
      eyebrow: 'rgba(255,255,255,0.22)',
      title: 'rgba(255,255,255,0.92)',
      subtitle: 'rgba(255,255,255,0.70)',
    },
    actionSurface: 'rgba(255,255,255,0.04)',
    actionBorder: 'rgba(255,255,255,0.06)',
    actionText: 'rgba(255,255,255,0.92)',
  },
}
