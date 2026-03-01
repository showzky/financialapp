// @ts-nocheck
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { getBarColor } from '../utils/budgetColors'
import type { CategoryWithSpent } from '../services/dashboardApi'

type Props = {
  category: CategoryWithSpent
  onPress: () => void
}

export function CategoryCard({ category, onPress }: Props) {
  const safeSpent = Math.max(0, category.monthSpent)
  const rawPct = category.allocated > 0 ? (safeSpent / category.allocated) * 100 : 0
  const clampedPct = Math.min(rawPct, 100)
  const barColor = getBarColor(rawPct)
  const isOver = rawPct > 100

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.cardInner}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={[styles.iconWrap, { backgroundColor: isOver ? '#fef2f2' : '#f5f3ff' }]}>
            <Ionicons
              name="pie-chart"
              size={16}
              color={isOver ? '#ef4444' : '#8b5cf6'}
            />
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {category.name}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${clampedPct}%`, backgroundColor: barColor }]} />
        </View>

        {/* Amounts row */}
        <View style={styles.amountRow}>
          <Text style={[styles.spent, { color: barColor }]}>
            {safeSpent.toLocaleString()}
          </Text>
          <Text style={styles.allocated}>/ {category.allocated.toLocaleString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    width: '50%',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  cardInner: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  barTrack: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  spent: {
    fontSize: 13,
    fontWeight: '700',
  },
  allocated: {
    fontSize: 11,
    color: '#9ca3af',
  },
})
