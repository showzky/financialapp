import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import type { TimelineSection } from '../../features/timeline/types'
import { getTimelineMonthTheme } from '../../features/timeline/utils'

type Props = {
  section: TimelineSection
}

// Fixed positions for seasonal particles so they don't shift on re-render
const SNOW_POSITIONS = [
  { top: 14, left: 58 },
  { top: 26, left: 108 },
  { top: 10, left: 172 },
  { top: 32, left: 228 },
  { top: 18, left: 284 },
  { top: 28, left: 330 },
  { top: 8, left: 140 },
]

const FLOWER_POSITIONS = [
  { top: 44, left: 38 },
  { top: 56, left: 76 },
  { top: 38, left: 120 },
  { top: 50, left: 200 },
  { top: 42, left: 260 },
  { top: 60, left: 310 },
]

const LEAF_POSITIONS = [
  { top: 16, left: 62 },
  { top: 30, left: 118 },
  { top: 12, left: 192 },
  { top: 24, left: 248 },
  { top: 34, left: 304 },
  { top: 18, left: 156 },
]

export function TimelineLandscapeBanner({ section }: Props) {
  const theme = getTimelineMonthTheme(section.id)
  const isSummer = theme.season === 'summer'

  return (
    <LinearGradient
      colors={theme.sky}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.banner}
    >
      {/* Moon / Sun */}
      <View
        style={[
          styles.moonBase,
          isSummer ? styles.sun : styles.moon,
          { backgroundColor: theme.moon },
        ]}
      />
      <View style={[styles.glowOrb, { backgroundColor: theme.glow }]} />

      {/* Stars — shown for winter and autumn only */}
      {(theme.season === 'winter' || theme.season === 'autumn') && (
        <>
          <View style={[styles.star, styles.starOne]} />
          <View style={[styles.star, styles.starTwo]} />
          <View style={[styles.star, styles.starThree]} />
        </>
      )}

      {/* Arc (horizon glow / rainbow) */}
      <View style={[styles.arc, { backgroundColor: theme.arc }]} />

      {/* Season-specific particles */}
      {theme.season === 'winter' &&
        SNOW_POSITIONS.map((pos, i) => (
          <View
            key={i}
            style={[styles.snowDot, { top: pos.top, left: pos.left }]}
          />
        ))}

      {theme.season === 'spring' &&
        FLOWER_POSITIONS.map((pos, i) => (
          <View
            key={i}
            style={[
              styles.flowerDot,
              { top: pos.top, left: pos.left, backgroundColor: theme.arc },
            ]}
          />
        ))}

      {theme.season === 'summer' && (
        <>
          {/* Sun rays as a larger glow ring */}
          <View style={[styles.sunRing, { borderColor: theme.glow }]} />
        </>
      )}

      {theme.season === 'autumn' &&
        LEAF_POSITIONS.map((pos, i) => (
          <View
            key={i}
            style={[
              styles.leafDot,
              { top: pos.top, left: pos.left, backgroundColor: theme.arc },
            ]}
          />
        ))}

      {/* Hills */}
      <View style={[styles.hill, styles.hillBack, { backgroundColor: theme.hillBack }]} />
      <View style={[styles.hill, styles.hillMid, { backgroundColor: theme.hillMid }]} />
      <View style={[styles.hill, styles.hillFront, { backgroundColor: theme.hillFront }]} />

      {/* Tree cluster */}
      <View style={styles.treeCluster}>
        <View style={[styles.tree, { backgroundColor: theme.tree }]} />
        <View style={[styles.tree, styles.treeTall, { backgroundColor: theme.tree }]} />
        <View style={[styles.tree, styles.treeShort, { backgroundColor: theme.tree }]} />
      </View>

      {/* Month pill */}
      <View style={styles.bannerPill}>
        <View style={[styles.pillDot, { backgroundColor: theme.dot }]} />
        <Text style={styles.bannerPillText}>{section.monthLabel}</Text>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  banner: {
    height: 120,
    marginHorizontal: 20,
    borderRadius: 28,
    overflow: 'hidden',
    padding: 14,
    justifyContent: 'flex-end',
  },
  moonBase: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.9,
  },
  moon: {
    top: 12,
    right: 18,
    width: 18,
    height: 18,
  },
  sun: {
    top: 8,
    right: 16,
    width: 26,
    height: 26,
  },
  sunRing: {
    position: 'absolute',
    top: 2,
    right: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    opacity: 0.4,
  },
  glowOrb: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    top: -36,
    right: 38,
    opacity: 0.18,
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  starOne: {
    top: 18,
    left: 34,
  },
  starTwo: {
    top: 22,
    left: 92,
  },
  starThree: {
    top: 16,
    left: 146,
  },
  arc: {
    position: 'absolute',
    top: 20,
    left: 62,
    width: 160,
    height: 8,
    borderRadius: 999,
    opacity: 0.4,
  },
  hill: {
    position: 'absolute',
    left: -12,
    right: -12,
    borderTopLeftRadius: 160,
    borderTopRightRadius: 160,
  },
  hillBack: {
    bottom: 28,
    height: 34,
  },
  hillMid: {
    bottom: 16,
    height: 40,
  },
  hillFront: {
    bottom: -6,
    height: 48,
  },
  treeCluster: {
    position: 'absolute',
    right: 26,
    bottom: 26,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  tree: {
    width: 6,
    height: 18,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  treeTall: {
    height: 26,
  },
  treeShort: {
    height: 14,
  },
  snowDot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  flowerDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.7,
  },
  leafDot: {
    position: 'absolute',
    width: 4,
    height: 3,
    borderRadius: 2,
    opacity: 0.65,
    transform: [{ rotate: '20deg' }],
  },
  bannerPill: {
    alignSelf: 'flex-start',
    minHeight: 34,
    borderRadius: 17,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(22,20,34,0.84)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pillDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  bannerPillText: {
    color: 'white',
    fontSize: 17,
    fontFamily: 'DMSans_700Bold',
  },
})
