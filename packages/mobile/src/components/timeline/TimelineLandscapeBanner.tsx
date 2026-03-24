import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import type { TimelineSection } from '../../features/timeline/types'
import { getTimelineMonthTheme } from '../../features/timeline/utils'

type Props = {
  section: TimelineSection
}

export function TimelineLandscapeBanner({ section }: Props) {
  const theme = getTimelineMonthTheme(section.id)

  return (
    <LinearGradient
      colors={theme.sky}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.banner}
    >
      <View style={[styles.moon, { backgroundColor: theme.moon }]} />
      <View style={[styles.glowOrb, { backgroundColor: theme.glow }]} />

      <View style={[styles.star, styles.starOne]} />
      <View style={[styles.star, styles.starTwo]} />
      <View style={[styles.star, styles.starThree]} />

      <View style={[styles.arc, { backgroundColor: theme.arc }]} />
      <View style={[styles.hill, styles.hillBack, { backgroundColor: theme.hillBack }]} />
      <View style={[styles.hill, styles.hillMid, { backgroundColor: theme.hillMid }]} />
      <View style={[styles.hill, styles.hillFront, { backgroundColor: theme.hillFront }]} />

      <View style={styles.treeCluster}>
        <View style={[styles.tree, { backgroundColor: theme.tree }]} />
        <View style={[styles.tree, styles.treeTall, { backgroundColor: theme.tree }]} />
        <View style={[styles.tree, styles.treeShort, { backgroundColor: theme.tree }]} />
      </View>

      <View style={styles.bannerPill}>
        <View style={[styles.pillDot, { backgroundColor: theme.dot }]} />
        <Text style={styles.bannerPillText}>{section.monthLabel}</Text>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  banner: {
    height: 112,
    marginHorizontal: 20,
    borderRadius: 28,
    overflow: 'hidden',
    padding: 14,
    justifyContent: 'flex-end',
  },
  moon: {
    position: 'absolute',
    top: 12,
    right: 18,
    width: 18,
    height: 18,
    borderRadius: 9,
    opacity: 0.9,
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

