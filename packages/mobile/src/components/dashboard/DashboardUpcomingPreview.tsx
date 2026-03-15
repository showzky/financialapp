import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

type UpcomingItem = {
  id: string
  name: string
  amount: number
  preview: {
    day: string
    month: string
  }
}

type Props<T extends UpcomingItem> = {
  items: T[]
  onOpenItem: (item: T) => void
  onOpenTimeline: () => void
}

function fmtKr(value: number) {
  return `KR ${value.toLocaleString('nb-NO')}`
}

export function DashboardUpcomingPreview<T extends UpcomingItem>({ items, onOpenItem, onOpenTimeline }: Props<T>) {
  return (
    <LinearGradient colors={['rgba(24,22,36,0.98)', 'rgba(13,14,22,0.98)']} style={styles.card}>
      <LinearGradient
        colors={['rgba(91,163,201,0.14)', 'rgba(91,163,201,0.04)', 'transparent']}
        style={styles.cardBloom}
      />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Up Next</Text>
          <Text style={styles.subtitle}>A quick preview before you open timeline</Text>
        </View>
        <TouchableOpacity onPress={onOpenTimeline} activeOpacity={0.85}>
          <Text style={styles.link}>See Timeline</Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-clear-outline" size={18} color="rgba(255,255,255,0.3)" />
          <Text style={styles.emptyText}>No upcoming expenses yet</Text>
        </View>
      ) : (
        items.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.row, index < items.length - 1 && styles.rowBorder]}
            activeOpacity={0.85}
            onPress={() => onOpenItem(item)}
          >
            <View style={styles.datePill}>
              <Text style={styles.dateDay}>{item.preview.day}</Text>
              <Text style={styles.dateMonth}>{item.preview.month}</Text>
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.rowMeta}>Fixed cost preview</Text>
            </View>
            <Text style={styles.rowAmount}>{fmtKr(item.amount)}</Text>
          </TouchableOpacity>
        ))
      )}
    </LinearGradient>
  )
}

export type { UpcomingItem as DashboardUpcomingItem }

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
    marginBottom: 12,
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
  link: {
    color: 'rgba(201,168,76,0.86)',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  rowBorder: {
    borderBottomWidth: 0,
  },
  datePill: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: 'rgba(91,163,201,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(91,163,201,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dateDay: {
    color: 'rgba(91,163,201,0.9)',
    fontSize: 14,
    fontWeight: '900',
  },
  dateMonth: {
    color: 'rgba(255,255,255,0.24)',
    fontSize: 7,
    fontWeight: '700',
    marginTop: -1,
  },
  rowText: {
    flex: 1,
    marginRight: 10,
  },
  rowTitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 14,
    fontWeight: '700',
  },
  rowMeta: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    marginTop: 3,
  },
  rowAmount: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 13,
    fontWeight: '800',
  },
})
