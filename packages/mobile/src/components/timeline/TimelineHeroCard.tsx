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
      colors={['rgba(72,44,121,0.95)', 'rgba(19,54,87,0.94)', 'rgba(11,18,32,0.98)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <View style={styles.heroGlowA} />
      <View style={styles.heroGlowB} />

      <Text style={styles.eyebrow}>Cashflow Timeline</Text>
      <Text style={styles.title}>{monthLabel}</Text>
      <Text style={styles.balance}>{formatTimelineCurrency(incomeTotal - expenseTotal)}</Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={[styles.summaryValue, styles.incomeValue]}>{formatTimelineCurrency(incomeTotal)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Expenses</Text>
          <Text style={[styles.summaryValue, styles.expenseValue]}>{formatTimelineCurrency(expenseTotal)}</Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View>
          <Text style={styles.footerLabel}>Upcoming planned</Text>
          <Text style={styles.footerValue}>{formatTimelineCurrency(upcomingTotal)}</Text>
        </View>
        <View style={styles.heroPill}>
          <Text style={styles.heroPillLabel}>Nearest due</Text>
          <Text style={styles.heroPillValue}>{nearestDueLabel}</Text>
          <Text style={styles.heroPillMeta}>{plannedCount} payments</Text>
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
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(201,168,76,0.16)',
    top: -80,
    right: -50,
  },
  heroGlowB: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(94,189,151,0.14)',
    bottom: -70,
    left: -30,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontFamily: 'DMSans_600SemiBold',
  },
  title: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.92)',
    fontSize: 30,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  balance: {
    marginTop: 8,
    color: 'white',
    fontSize: 36,
    fontFamily: 'DMSans_800ExtraBold',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: 'rgba(8,10,18,0.26)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
  },
  summaryValue: {
    marginTop: 8,
    fontSize: 22,
    fontFamily: 'DMSans_700Bold',
  },
  incomeValue: {
    color: '#78d89c',
  },
  expenseValue: {
    color: '#ff9d91',
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
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
  },
  heroPill: {
    minWidth: 118,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(9,12,20,0.44)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroPillLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
  },
  heroPillValue: {
    marginTop: 4,
    color: 'white',
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
  },
  heroPillMeta: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
  },
})
