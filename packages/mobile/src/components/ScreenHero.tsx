import React, { type ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

export type ScreenHeroTheme = {
  eyebrow: string
  title: string
  subtitle: string
}

type ScreenHeroProps = {
  eyebrow?: string
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  children?: ReactNode
  theme: ScreenHeroTheme
}

export function ScreenHero({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
  theme,
}: ScreenHeroProps) {
  return (
    <LinearGradient colors={['#0f172a', '#1e3a5f']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
      <View style={styles.topRow}>
        <View style={styles.copy}>
          {eyebrow ? <Text style={[styles.eyebrow, { color: theme.eyebrow }]}>{eyebrow}</Text> : null}
          <Text style={[styles.title, { color: theme.title }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: theme.subtitle }]}>{subtitle}</Text> : null}
        </View>
        {actions ? <View style={styles.actions}>{actions}</View> : null}
      </View>

      {children ? <View style={styles.body}>{children}</View> : null}
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: 28,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 18,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  copy: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 6,
    fontWeight: '700',
  },
  title: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '800',
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    fontFamily: 'DMSans_500Medium',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  body: {
    marginTop: 18,
  },
})
