import React from 'react'
import { StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

import type { LoginScreenTheme } from '../../customthemes/login'

function EasterSkyDecor() {
  const stars = Array.from({ length: 24 }, (_, index) => ({
    left: 24 + ((index * 37) % 300),
    top: 24 + ((index * 19) % 180),
    size: index % 5 === 0 ? 3 : 2,
  }))

  const floatingEggs = [
    { top: 88, left: 42, width: 24, height: 32, colors: ['#f2e8ff', '#cdb7ff'] as const },
    { top: 116, right: 48, width: 20, height: 28, colors: ['#fff1f5', '#eab7c8'] as const },
    { top: 68, left: 252, width: 16, height: 22, colors: ['#efffef', '#a8e6c8'] as const },
    { top: 138, left: 138, width: 18, height: 24, colors: ['#eaf6ff', '#a8d4f5'] as const },
  ]

  const particles = Array.from({ length: 16 }, (_, index) => ({
    left: 30 + ((index * 29) % 290),
    bottom: 190 + ((index * 11) % 72),
  }))

  return (
    <>
      <View style={styles.crossGlow} />
      <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(243,210,122,0.95)', 'rgba(255,255,255,0)']} style={styles.crossVertical} />
      <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(243,210,122,0.95)', 'rgba(255,255,255,0)']} style={styles.crossHorizontal} />

      {[-32, -18, -6, 6, 18, 32].map((deg) => (
        <LinearGradient
          key={deg}
          colors={['rgba(255,255,255,0)', 'rgba(243,210,122,0.2)', 'rgba(255,255,255,0)']}
          style={[
            styles.ray,
            {
              transform: [{ translateX: -1 }, { rotate: `${deg}deg` }],
              opacity: Math.abs(deg) < 10 ? 0.6 : 0.4,
            },
          ]}
        />
      ))}

      {stars.map((star) => (
        <View
          key={`${star.left}-${star.top}`}
          style={[
            styles.star,
            {
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              opacity: 0.55,
            },
          ]}
        />
      ))}

      {floatingEggs.map((egg, index) => (
        <LinearGradient
          key={index}
          colors={egg.colors}
          style={[
            styles.floatingEgg,
            {
              top: egg.top,
              left: egg.left,
              right: egg.right,
              width: egg.width,
              height: egg.height,
              transform: [{ rotate: index % 2 === 0 ? '-8deg' : '8deg' }],
            },
          ]}
        />
      ))}

      {particles.map((particle, index) => (
        <View
          key={index}
          style={[
            styles.particle,
            {
              left: particle.left,
              bottom: particle.bottom,
              opacity: 0.18 + (index % 4) * 0.12,
            },
          ]}
        />
      ))}

      <View style={styles.bottomScene}>
        <View style={styles.hillBack} />
        <View style={styles.hillFront} />
        <GrassRow />
        <EggCluster side="left" />
        <EggCluster side="right" />
        <LilyCluster side="left" />
        <LilyCluster side="right" />
      </View>
    </>
  )
}

function GrassRow() {
  return (
    <View style={styles.grassRow}>
      {Array.from({ length: 34 }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.grassBlade,
            {
              left: `${(index / 34) * 100}%`,
              height: 32 + (index % 7) * 10,
              transform: [{ rotate: `${(index % 2 === 0 ? -1 : 1) * (8 + (index % 5) * 3)}deg` }],
            },
          ]}
        />
      ))}
    </View>
  )
}

function EggCluster({ side }: { side: 'left' | 'right' }) {
  const variants = [
    ['#f2e8ff', '#cdb7ff', '#ab93ea'] as const,
    ['#fff1f5', '#eab7c8', '#d58ba5'] as const,
    ['#efffef', '#a8e6c8', '#78d4a8'] as const,
    ['#eaf6ff', '#a8d4f5', '#78b8e8'] as const,
  ]

  return (
    <View style={[styles.eggCluster, side === 'left' ? styles.eggClusterLeft : styles.eggClusterRight]}>
      {variants.map((colors, index) => (
        <LinearGradient
          key={index}
          colors={colors}
          style={[
            styles.sceneEgg,
            index % 2 === 1 ? styles.sceneEggSmall : null,
            index === 1 ? { marginBottom: 8 } : null,
            index === 3 ? { marginBottom: 4 } : null,
          ]}
        >
          <View style={styles.sceneEggStripeGold} />
          <View style={styles.sceneEggStripeSoft} />
          <View style={styles.sceneEggHighlight} />
        </LinearGradient>
      ))}
    </View>
  )
}

function LilyCluster({ side }: { side: 'left' | 'right' }) {
  return (
    <View style={[styles.lilyCluster, side === 'left' ? styles.lilyClusterLeft : styles.lilyClusterRight]}>
      <Lily rotate={0} offset={0} />
      <Lily rotate={side === 'left' ? 8 : -8} offset={24} />
    </View>
  )
}

function Lily({ rotate, offset }: { rotate: number; offset: number }) {
  return (
    <View style={[styles.lilyWrap, { left: offset, transform: [{ rotate: `${rotate}deg` }] }]}>
      <LinearGradient colors={['#476848', '#8dc38c']} style={styles.lilyStem} />
      <View style={styles.lilyFlower}>
        {[
          { left: 12, top: 0, rotate: '0deg' },
          { left: 2, top: 10, rotate: '-40deg' },
          { right: 2, top: 10, rotate: '40deg' },
          { left: 8, top: 16, rotate: '-12deg' },
          { right: 8, top: 16, rotate: '12deg' },
        ].map((petal, index) => (
          <LinearGradient
            key={index}
            colors={['#ffffff', '#ece7da']}
            style={[
              styles.lilyPetal,
              petal,
              {
                transform: [{ rotate: petal.rotate }],
              },
            ]}
          />
        ))}
        <LinearGradient colors={['#f7e28b', '#d8aa3c']} style={styles.lilyCore} />
      </View>
    </View>
  )
}

export function LoginBackgroundScene({ theme }: { theme: LoginScreenTheme }) {
  return (
    <LinearGradient colors={theme.colors.sceneGradient} style={styles.scene}>
      {theme.id === 'easter-renewal' ? <EasterSkyDecor /> : <DefaultSceneDecor />}
    </LinearGradient>
  )
}

function DefaultSceneDecor() {
  return (
    <>
      <View style={[styles.softGlow, styles.softGlowLarge]} />
      <View style={[styles.softGlow, styles.softGlowSmall]} />
      <View style={styles.defaultHill} />
    </>
  )
}

const styles = StyleSheet.create({
  scene: {
    flex: 1,
    overflow: 'hidden',
  },
  crossGlow: {
    position: 'absolute',
    top: 24,
    alignSelf: 'center',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(243,210,122,0.12)',
  },
  crossVertical: {
    position: 'absolute',
    top: 52,
    alignSelf: 'center',
    width: 18,
    height: 160,
    borderRadius: 999,
  },
  crossHorizontal: {
    position: 'absolute',
    top: 110,
    alignSelf: 'center',
    width: 120,
    height: 14,
    borderRadius: 999,
  },
  ray: {
    position: 'absolute',
    top: 18,
    left: '50%',
    width: 2,
    height: 290,
    transformOrigin: 'top center',
  },
  star: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  floatingEgg: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.78,
  },
  particle: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,244,210,0.9)',
  },
  bottomScene: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 300,
  },
  hillBack: {
    position: 'absolute',
    left: '-6%',
    right: '-6%',
    bottom: 56,
    height: 118,
    borderTopLeftRadius: 220,
    borderTopRightRadius: 220,
    backgroundColor: '#1d2823',
    opacity: 0.78,
  },
  hillFront: {
    position: 'absolute',
    left: '-6%',
    right: '-6%',
    bottom: -8,
    height: 176,
    borderTopLeftRadius: 280,
    borderTopRightRadius: 280,
    backgroundColor: '#273529',
  },
  grassRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 150,
  },
  grassBlade: {
    position: 'absolute',
    bottom: -10,
    width: 14,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    backgroundColor: '#456546',
  },
  eggCluster: {
    position: 'absolute',
    bottom: 38,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
  },
  eggClusterLeft: {
    left: 12,
  },
  eggClusterRight: {
    right: 12,
  },
  sceneEgg: {
    position: 'relative',
    width: 48,
    height: 66,
    borderRadius: 28,
    overflow: 'hidden',
  },
  sceneEggSmall: {
    width: 38,
    height: 54,
  },
  sceneEggStripeGold: {
    position: 'absolute',
    left: '14%',
    right: '14%',
    top: 18,
    height: 7,
    borderRadius: 999,
    backgroundColor: '#f3d27a',
    opacity: 0.75,
  },
  sceneEggStripeSoft: {
    position: 'absolute',
    left: '14%',
    right: '14%',
    top: 34,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  sceneEggHighlight: {
    position: 'absolute',
    top: 10,
    left: '50%',
    width: 8,
    height: 8,
    marginLeft: -4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  lilyCluster: {
    position: 'absolute',
    bottom: 74,
    width: 58,
    height: 120,
  },
  lilyClusterLeft: {
    left: 94,
  },
  lilyClusterRight: {
    right: 94,
  },
  lilyWrap: {
    position: 'absolute',
    bottom: 0,
    width: 28,
    height: 120,
  },
  lilyStem: {
    position: 'absolute',
    left: 12,
    bottom: 0,
    width: 3,
    height: 88,
    borderRadius: 999,
  },
  lilyFlower: {
    position: 'absolute',
    top: 0,
    left: -6,
    width: 40,
    height: 40,
  },
  lilyPetal: {
    position: 'absolute',
    width: 16,
    height: 24,
    borderRadius: 12,
  },
  lilyCore: {
    position: 'absolute',
    left: 17,
    top: 14,
    width: 6,
    height: 12,
    borderRadius: 999,
  },
  softGlow: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  softGlowLarge: {
    top: 40,
    left: 28,
    width: 180,
    height: 180,
  },
  softGlowSmall: {
    top: 140,
    right: 32,
    width: 110,
    height: 110,
  },
  defaultHill: {
    position: 'absolute',
    left: -24,
    right: -24,
    bottom: -12,
    height: 180,
    borderTopLeftRadius: 240,
    borderTopRightRadius: 240,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
})
