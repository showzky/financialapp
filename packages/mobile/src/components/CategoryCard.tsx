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
  const isBudget = category.type === 'budget'

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.cardInner}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={[styles.iconWrap, { backgroundColor: isBudget ? (isOver ? '#fef2f2' : '#f5f3ff') : '#fef3c7' }]}>
            <Ionicons
              name={isBudget ? 'pie-chart' : 'repeat'}
              size={16}
              color={isBudget ? (isOver ? '#ef4444' : '#8b5cf6') : '#ca8a04'}
            />
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {category.name}
          </Text>
          {/* Type Badge */}
          <View
            style={[
              styles.typeBadge,
              category.type === 'fixed'
                ? styles.typeBadgeFixed
                : styles.typeBadgeBudget,
            ]}
          >
            <Text style={styles.typeBadgeText}>
              {category.type === 'fixed' ? '🔧' : '💰'}
            </Text>
          </View>
        </View>

        {/* Budget Category: Progress bar + spent/allocated */}
        {isBudget ? (
          <>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${clampedPct}%`, backgroundColor: barColor }]} />
            </View>
            <View style={styles.amountRow}>
              <Text style={[styles.spent, { color: barColor }]}>
                {safeSpent.toLocaleString()}
              </Text>
              <Text style={styles.allocated}>/ {category.allocated.toLocaleString()}</Text>
            </View>
          </>
        ) : (
          /* Fixed Category: Just show monthly amount */
          <View style={styles.fixedAmountRow}>
            <Text style={styles.fixedLabel}>Fixed cost</Text>
            <Text style={styles.fixedAmount}>{category.allocated.toLocaleString()}</Text>
          </View>
        )}
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
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeBudget: {
    backgroundColor: '#ecfdf5',
  },
  typeBadgeFixed: {
    backgroundColor: '#fef3c7',
  },
  typeBadgeText: {
    fontSize: 11,
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
  fixedAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fixedLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  fixedAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ca8a04',
  },
})
