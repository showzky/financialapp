import React from 'react'
import { StyleSheet, View } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'

export function DashboardHeroOrb() {
  return (
    <View pointerEvents="none" style={styles.wrap}>
      <View style={styles.glowOuter} />
      <View style={styles.glowInner} />
      <Svg width={160} height={160} viewBox="0 0 160 160" style={styles.svg}>
        <Circle cx="80" cy="80" r="48" stroke="rgba(114,220,255,0.16)" strokeWidth="1.5" fill="none" />
        <Circle cx="80" cy="80" r="64" stroke="rgba(114,220,255,0.08)" strokeWidth="1" fill="none" />
        <Circle cx="80" cy="80" r="80" stroke="rgba(114,220,255,0.05)" strokeWidth="1" fill="none" />
        <Path
          d="M18 95C42 48 116 34 144 66"
          stroke="rgba(114,220,255,0.20)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M30 126C66 114 111 108 140 38"
          stroke="rgba(201,168,76,0.16)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <Circle cx="116" cy="50" r="3.5" fill="rgba(114,220,255,0.9)" />
        <Circle cx="48" cy="118" r="3" fill="rgba(201,168,76,0.86)" />
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: -12,
    top: -12,
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.92,
  },
  svg: {
    position: 'absolute',
  },
  glowOuter: {
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: 'rgba(92,163,255,0.12)',
    shadowColor: '#62d7ff',
    shadowOpacity: 0.22,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 0 },
  },
  glowInner: {
    position: 'absolute',
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(114,220,255,0.16)',
    shadowColor: '#62d7ff',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
})
