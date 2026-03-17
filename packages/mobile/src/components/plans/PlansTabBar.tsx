import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { PlansTabKey } from './types'

type Props = {
  value: PlansTabKey
  counts: Record<PlansTabKey, number>
  onChange: (value: PlansTabKey) => void
}

const labels: Record<PlansTabKey, string> = {
  wishlist: 'WISHLIST',
  borrowed: 'MY LOANS',
  lent: 'LENT OUT',
}

export function PlansTabBar({ value, counts, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      {(Object.keys(labels) as PlansTabKey[]).map((key) => {
        const active = key === value
        return (
          <TouchableOpacity
            key={key}
            style={[styles.tab, active ? styles.tabActive : undefined]}
            activeOpacity={0.88}
            onPress={() => onChange(key)}
          >
            <Text style={[styles.tabText, active ? styles.tabTextActive : undefined]}>
              {labels[key]} ({counts[key]})
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 22,
    flexDirection: 'row',
    gap: 10,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(123,82,220,0.92)',
    borderColor: 'rgba(185,156,255,0.22)',
  },
  tabText: {
    color: 'rgba(240,244,252,0.54)',
    fontSize: 11,
    letterSpacing: 1.2,
    fontFamily: 'DMSans_700Bold',
  },
  tabTextActive: {
    color: '#F7F9FE',
  },
})
