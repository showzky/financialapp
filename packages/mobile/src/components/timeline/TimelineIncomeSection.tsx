import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import type { IncomeEntry } from '../../services/dashboardApi'
import { formatTimelineCurrency } from '../../features/timeline/utils'

type Props = {
  incomeEntries: IncomeEntry[]
  onEntryPress?: (entry: IncomeEntry) => void
}

export function TimelineIncomeSection({ incomeEntries, onEntryPress }: Props) {
  if (incomeEntries.length === 0) return null

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Income This Month</Text>
          <Text style={styles.subtitle}>Recorded income entries for the selected month.</Text>
        </View>
        <Text style={styles.count}>{incomeEntries.length} items</Text>
      </View>

      <View style={styles.stack}>
        {incomeEntries.map((entry) => {
          const iconName = (entry.icon as keyof typeof Ionicons.glyphMap | null) ?? 'ellipse-outline'
          const accent = entry.iconColor || entry.color || '#78d89c'
          const parentLabel = entry.parentName || entry.category
          const isPaidNow = entry.isPaid && new Date(entry.receivedAt) <= new Date()
          return (
            <TouchableOpacity key={entry.id} onPress={() => onEntryPress?.(entry)} activeOpacity={0.88}>
              <LinearGradient
                colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                style={styles.card}
              >
                <View style={[styles.iconWrap, { backgroundColor: `${accent}1f`, borderColor: `${accent}44` }]}>
                  <Ionicons name={iconName} size={16} color={accent} />
                </View>
                <View style={styles.textBlock}>
                  <Text style={styles.label}>{entry.name ?? entry.category}</Text>
                  <Text style={styles.meta}>
                    {parentLabel} - {new Date(entry.receivedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
                <View style={styles.rightBlock}>
                  <Text style={[styles.amount, !isPaidNow && styles.amountUnpaid]}>+{formatTimelineCurrency(entry.amount)}</Text>
                  <MaterialCommunityIcons
                    name={isPaidNow ? 'check-circle' : 'circle-outline'}
                    size={20}
                    color={isPaidNow ? '#78d89c' : 'rgba(255,255,255,0.42)'}
                  />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginTop: 22,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  title: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 22,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  subtitle: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.42)',
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
  },
  count: {
    color: 'rgba(120,216,156,0.92)',
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
  },
  stack: {
    gap: 10,
  },
  card: {
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
  },
  label: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
  },
  meta: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.38)',
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
  },
  amount: {
    color: '#78d89c',
    fontSize: 16,
    fontFamily: 'DMSans_800ExtraBold',
  },
  amountUnpaid: {
    color: 'rgba(255,255,255,0.72)',
  },
  rightBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
})
