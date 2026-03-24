import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { formatTimelineCurrency } from '../../features/timeline/utils'

type Props = {
  monthLabel: string
  incomeTotal: number
  expenseTotal: number
  upcomingTotal: number
  nearestDueLabel: string
  plannedCount: number
}

export function TimelineHeroCard({
  monthLabel,
  incomeTotal,
  expenseTotal,
  upcomingTotal,
  nearestDueLabel,
  plannedCount,
}: Props) {
  return (
    <LinearGradient
      colors={['rgba(33,42,88,0.98)', 'rgba(24,48,86,0.96)', 'rgba(11,18,32,0.98)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <View style={styles.heroGlowA} />
      <View style={styles.heroGlowB} />

      <Text style={styles.eyebrow}>Cashflow Timeline</Text>
      <Text style={styles.title}>{monthLabel}</Text>

      <View style={styles.balanceRow}>
        <Text style={styles.balanceLabel}>Net cashflow</Text>
        <Text style={styles.balance}>{formatTimelineCurrency(incomeTotal - expenseTotal)}</Text>
        <View style={styles.nextDuePill}>
          <View style={styles.nextDueDot} />
          <Text style={styles.nextDueText}>Next due: {nearestDueLabel}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.footerColumns}>
        <View style={styles.footerMetric}>
          <Text style={styles.footerLabel}>Income</Text>
          <Text style={[styles.footerValue, styles.incomeValue]} numberOfLines={1}>{formatTimelineCurrency(incomeTotal)}</Text>
        </View>
        <View style={styles.footerDivider} />
        <View style={styles.footerMetric}>
          <Text style={styles.footerLabel}>Expenses</Text>
          <Text style={[styles.footerValue, styles.expenseValue]} numberOfLines={1}>{formatTimelineCurrency(expenseTotal)}</Text>
        </View>
        <View style={styles.footerDivider} />
        <View style={styles.footerMetric}>
          <Text style={styles.footerLabel}>Upcoming</Text>
          <Text style={styles.footerValue} numberOfLines={1}>{formatTimelineCurrency(upcomingTotal)}</Text>
        </View>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  hero: {
    marginHorizontal: 20,
    marginTop: 18,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  heroGlowA: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(82,126,214,0.22)',
    top: -60,
    right: -32,
  },
  heroGlowB: {
    position: 'absolute',
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: 'rgba(82,143,214,0.16)',
    bottom: -58,
    left: -20,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontFamily: 'DMSans_600SemiBold',
  },
  title: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.92)',
    fontSize: 22,
    fontFamily: 'DMSans_700Bold',
  },
  balanceRow: {
    marginTop: 18,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.46)',
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontFamily: 'DMSans_700Bold',
  },
  balance: {
    marginTop: 4,
    color: 'white',
    fontSize: 42,
    fontFamily: 'DMSans_800ExtraBold',
  },
  nextDuePill: {
    marginTop: 12,
    alignSelf: 'flex-start',
    minHeight: 34,
    borderRadius: 17,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(8,12,24,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  nextDueDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#f0c56d',
  },
  nextDueText: {
    color: 'rgba(237,242,252,0.84)',
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
  },
  divider: {
    marginTop: 16,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  incomeValue: {
    color: '#78d89c',
  },
  expenseValue: {
    color: '#ff9d91',
  },
  footerColumns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginTop: 16,
  },
  footerMetric: {
    flex: 1,
    alignItems: 'center',
  },
  footerDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 18,
  },
  footerLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
  },
  footerValue: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.86)',
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
  },
})
