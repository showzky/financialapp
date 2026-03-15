import React from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native'
import type { TimelineFilter } from '../../features/timeline/types'

type Props = {
  value: TimelineFilter
  onChange: (filter: TimelineFilter) => void
}

const FILTERS: TimelineFilter[] = ['All', '7 Days', '30 Days']

export function TimelineFilterBar({ value, onChange }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {FILTERS.map((filter) => {
        const active = filter === value

        return (
          <TouchableOpacity
            key={filter}
            onPress={() => onChange(filter)}
            style={[styles.chip, active && styles.chipActive]}
            activeOpacity={0.88}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{filter}</Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipActive: {
    backgroundColor: 'rgba(201,168,76,0.2)',
    borderColor: 'rgba(201,168,76,0.36)',
  },
  chipText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
  },
  chipTextActive: {
    color: 'rgba(255,255,255,0.92)',
  },
})
