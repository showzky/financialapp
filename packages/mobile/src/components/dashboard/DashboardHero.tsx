import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { DashboardHeroOrb } from './DashboardHeroOrb'

type Props = {
  availableNow: number
  totalAllocated: number
  totalIncome: number
}

function fmtKr(value: number) {
  return `KR ${value.toLocaleString('nb-NO')}`
}

export function DashboardHero({ availableNow, totalAllocated, totalIncome }: Props) {
  const allocatedPct = totalIncome > 0 ? Math.max(0, Math.min(100, Math.round((totalAllocated / totalIncome) * 100))) : 0

  return (
    <LinearGradient colors={['rgba(22,20,36,0.98)', 'rgba(12,13,21,0.98)']} style={styles.wrap}>
      <LinearGradient
        colors={['rgba(104,76,170,0.18)', 'rgba(104,76,170,0.04)', 'transparent']}
        style={styles.bloom}
      />
      <DashboardHeroOrb />
      <View style={styles.orionTag}>
        <Text style={styles.orionTagText}>ORION</Text>
      </View>
      <Text style={styles.eyebrow}>AVAILABLE NOW</Text>
      <Text style={styles.amount}>{fmtKr(availableNow)}</Text>
      <View style={styles.barTrack}>
        <LinearGradient
          colors={['rgba(94,189,151,0.9)', 'rgba(201,168,76,0.88)', 'rgba(212,135,74,0.76)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.barFill, { width: `${allocatedPct}%` }]}
        />
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{fmtKr(totalAllocated)} reserved</Text>
        <Text style={styles.metaText}>{allocatedPct}% of {fmtKr(totalIncome)}</Text>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 18,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 18,
    position: 'relative',
  },
  bloom: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.26)',
    fontSize: 9,
    letterSpacing: 3,
    marginBottom: 10,
    zIndex: 1,
  },
  amount: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 18,
    zIndex: 1,
  },
  barTrack: {
    width: '64%',
    height: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    zIndex: 1,
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  metaRow: {
    width: '64%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    zIndex: 1,
  },
  metaText: {
    color: 'rgba(255,255,255,0.26)',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  orionTag: {
    position: 'absolute',
    top: 16,
    right: 18,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(114,220,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(114,220,255,0.14)',
    zIndex: 2,
  },
  orionTagText: {
    color: 'rgba(114,220,255,0.76)',
    fontSize: 9,
    letterSpacing: 1.6,
    fontFamily: 'DMSans_700Bold',
  },
})
