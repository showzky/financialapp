import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { BalanceCategorySort } from './types'

type Props = {
  value: BalanceCategorySort
  onChange: (value: BalanceCategorySort) => void
}

const options: Array<{ id: BalanceCategorySort; label: string }> = [
  { id: 'balance', label: 'By balance' },
  { id: 'name', label: 'By name' },
  { id: 'custom', label: 'Custom order' },
]

export function BalanceCategorySortPanel({ value, onChange }: Props) {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Sort accounts</Text>
      {options.map((option) => {
        const selected = option.id === value
        return (
          <TouchableOpacity
            key={option.id}
            style={styles.row}
            activeOpacity={0.85}
            onPress={() => onChange(option.id)}
          >
            <Text style={styles.label}>{option.label}</Text>
            <View style={[styles.radio, selected && styles.radioSelected]}>
              {selected ? <View style={styles.radioInner} /> : null}
            </View>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  panel: {
    marginTop: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(24,28,39,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  title: {
    color: 'rgba(234,240,250,0.48)',
    fontSize: 12,
    marginBottom: 10,
    fontFamily: 'DMSans_600SemiBold',
  },
  row: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: '#F2F6FD',
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#B56FFF',
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#B56FFF',
  },
})
