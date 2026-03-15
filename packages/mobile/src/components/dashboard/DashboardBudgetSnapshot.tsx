import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import type { CategoryWithSpent } from '../../services/dashboardApi'

type Props = {
  totalBudget: number
  budgetAssignments: CategoryWithSpent[]
  onOpenBudget: () => void
}

function fmtKr(value: number) {
  return `KR ${value.toLocaleString('nb-NO')}`
}

export function DashboardBudgetSnapshot({ totalBudget, budgetAssignments, onOpenBudget }: Props) {
  const spent = budgetAssignments.reduce((sum, item) => sum + item.monthSpent, 0)
  const usage = totalBudget > 0 ? Math.round((spent / totalBudget) * 100) : 0
  const hotspots = [...budgetAssignments]
    .sort((left, right) => {
      const leftUsage = left.allocated > 0 ? left.monthSpent / left.allocated : 0
      const rightUsage = right.allocated > 0 ? right.monthSpent / right.allocated : 0
      return rightUsage - leftUsage
    })
    .slice(0, 2)

  return (
    <LinearGradient colors={['rgba(24,22,36,0.98)', 'rgba(13,14,22,0.98)']} style={styles.card}>
      <LinearGradient
        colors={['rgba(108,86,178,0.14)', 'rgba(108,86,178,0.04)', 'transparent']}
        style={styles.cardBloom}
      />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Budget Snapshot</Text>
          <Text style={styles.subtitle}>{budgetAssignments.length} active budget buckets</Text>
        </View>
        <TouchableOpacity onPress={onOpenBudget} style={styles.linkButton} activeOpacity={0.85}>
          <Text style={styles.linkText}>Open Budget</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryBlock}>
          <Text style={styles.summaryLabel}>Budgeted</Text>
          <Text style={styles.summaryValue}>{fmtKr(totalBudget)}</Text>
        </View>
        <View style={styles.summaryBlock}>
          <Text style={styles.summaryLabel}>Used</Text>
          <Text style={styles.summaryValue}>{fmtKr(spent)}</Text>
        </View>
        <View style={styles.summaryBlock}>
          <Text style={styles.summaryLabel}>Usage</Text>
          <Text style={styles.summaryValue}>{usage}%</Text>
        </View>
      </View>

      {hotspots.length > 0 ? (
        <View style={styles.hotspotList}>
          {hotspots.map((item) => {
            const itemUsage = item.allocated > 0 ? Math.round((item.monthSpent / item.allocated) * 100) : 0
            return (
              <View key={item.id} style={styles.hotspotRow}>
                <View style={[styles.hotspotIcon, { backgroundColor: item.color || '#1f2a3d' }]}>
                  <Ionicons name="flash-outline" size={12} color={item.iconColor || '#fff'} />
                </View>
                <View style={styles.hotspotText}>
                  <Text style={styles.hotspotName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.hotspotMeta}>{fmtKr(item.monthSpent)} of {fmtKr(item.allocated)}</Text>
                </View>
                <Text style={styles.hotspotUsage}>{itemUsage}%</Text>
              </View>
            )
          })}
        </View>
      ) : (
        <Text style={styles.emptyText}>Add a category budget to start tracking pressure here.</Text>
      )}
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 18,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  cardBloom: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.34)',
    fontSize: 11,
    marginTop: 4,
  },
  linkButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  linkText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  summaryBlock: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 11,
    paddingVertical: 11,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.34)',
    fontSize: 10,
    marginBottom: 5,
  },
  summaryValue: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 14,
    fontWeight: '800',
  },
  hotspotList: {
    gap: 10,
  },
  hotspotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  hotspotIcon: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  hotspotText: {
    flex: 1,
  },
  hotspotName: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    fontWeight: '700',
  },
  hotspotMeta: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    marginTop: 2,
  },
  hotspotUsage: {
    color: 'rgba(201,168,76,0.88)',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.34)',
    fontSize: 12,
  },
})
