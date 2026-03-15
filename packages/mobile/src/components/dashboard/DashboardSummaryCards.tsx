import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

type SummaryItem = {
  label: string
  value: number
  hint: string
  icon: keyof typeof Ionicons.glyphMap
  accent: string
}

type Props = {
  items: SummaryItem[]
}

function fmtKr(value: number) {
  return `KR ${value.toLocaleString('nb-NO')}`
}

export function DashboardSummaryCards({ items }: Props) {
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <LinearGradient
          key={item.label}
          colors={['rgba(24,22,36,0.98)', 'rgba(13,14,22,0.98)']}
          style={styles.card}
        >
          <LinearGradient
            colors={[item.accent + '1c', item.accent + '06', 'transparent']}
            style={styles.cardBloom}
          />
          <View style={[styles.iconWrap, { backgroundColor: item.accent + '18', borderColor: item.accent + '33' }]}>
            <Ionicons name={item.icon} size={14} color={item.accent} />
          </View>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.value}>{fmtKr(item.value)}</Text>
          <Text style={styles.hint}>{item.hint}</Text>
        </LinearGradient>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 18,
  },
  card: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 13,
    paddingVertical: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  cardBloom: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 86,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  label: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 8,
  },
  value: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 17,
    fontWeight: '800',
  },
  hint: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: 10,
    marginTop: 4,
  },
})
