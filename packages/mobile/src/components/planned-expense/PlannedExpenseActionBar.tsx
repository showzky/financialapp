import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { FontAwesome5 } from '@expo/vector-icons'

type Props = {
  expanded: boolean
  paid: boolean
  amountLabel: string
  dateLabel: string
  busy: boolean
  canMarkUnpaid: boolean
  helperText: string
  onToggleExpanded: () => void
  onPrimaryAction: () => void
  primaryLabel: string
}

export function PlannedExpenseActionBar({
  expanded,
  paid,
  amountLabel,
  dateLabel,
  busy,
  canMarkUnpaid,
  helperText,
  onToggleExpanded,
  onPrimaryAction,
  primaryLabel,
}: Props) {
  return (
    <View style={styles.wrap}>
      {expanded ? (
        <View style={styles.panel}>
          <View style={styles.grid}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Amount</Text>
              <Text style={styles.fieldValue}>{amountLabel}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Date</Text>
              <Text style={styles.fieldValue}>{dateLabel}</Text>
            </View>
          </View>
          <Text style={styles.helperText}>{helperText}</Text>
          {paid && !canMarkUnpaid ? (
            <Text style={styles.helperNote}>This month was recorded from another transaction, so it can’t be auto-unpaid here.</Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.bar}>
        <TouchableOpacity style={styles.primaryArea} onPress={onPrimaryAction} activeOpacity={0.9} disabled={busy}>
          <LinearGradient
            colors={
              paid
                ? ['rgba(94,189,151,0.12)', 'rgba(94,189,151,0.05)']
                : ['rgba(201,107,107,0.12)', 'rgba(201,107,107,0.05)']
            }
            style={styles.primaryFill}
          >
            <Text style={styles.primaryText}>{busy ? 'Saving...' : primaryLabel}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toggleArea} onPress={onToggleExpanded} activeOpacity={0.9}>
          <FontAwesome5
            name={expanded ? 'chevron-down' : 'chevron-up'}
            size={14}
            color={paid ? 'rgba(94,189,151,0.92)' : 'rgba(255,255,255,0.72)'}
          />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  panel: {
    borderRadius: 26,
    padding: 16,
    backgroundColor: 'rgba(25,26,38,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  fieldLabel: {
    color: 'rgba(255,255,255,0.34)',
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
  },
  fieldValue: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
  },
  helperText: {
    marginTop: 12,
    color: 'rgba(255,255,255,0.42)',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'DMSans_500Medium',
  },
  helperNote: {
    marginTop: 8,
    color: '#f7d98a',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'DMSans_500Medium',
  },
  bar: {
    flexDirection: 'row',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201,107,107,0.6)',
    backgroundColor: 'rgba(52,20,30,0.52)',
  },
  primaryArea: {
    flex: 1,
  },
  primaryFill: {
    minHeight: 54,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 17,
    letterSpacing: 0.4,
    fontFamily: 'DMSans_700Bold',
  },
  toggleArea: {
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(201,107,107,0.52)',
  },
})
