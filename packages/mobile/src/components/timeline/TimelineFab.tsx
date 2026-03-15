import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { FontAwesome5 } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

type Props = {
  open: boolean
  onToggle: () => void
  onIncomePress: () => void
  onExpensePress: () => void
  bottomOffset: number
}

export function TimelineFab({ open, onToggle, onIncomePress, onExpensePress, bottomOffset }: Props) {
  return (
    <>
      {open ? <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onToggle} /> : null}

      {open ? (
        <View style={[styles.menu, { bottom: bottomOffset + 78 }]}>
          <TouchableOpacity style={styles.menuItem} onPress={onIncomePress} activeOpacity={0.92}>
            <LinearGradient colors={['rgba(94,189,151,0.2)', 'rgba(94,189,151,0.08)']} style={styles.menuCard}>
              <View style={[styles.menuIcon, styles.incomeIcon]}>
                <FontAwesome5 name="arrow-up" size={12} color="rgba(94,189,151,0.92)" />
              </View>
              <Text style={[styles.menuText, styles.incomeText]}>Add Income</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onExpensePress} activeOpacity={0.92}>
            <LinearGradient colors={['rgba(91,163,201,0.2)', 'rgba(91,163,201,0.08)']} style={styles.menuCard}>
              <View style={[styles.menuIcon, styles.expenseIcon]}>
                <FontAwesome5 name="arrow-down" size={12} color="rgba(91,163,201,0.94)" />
              </View>
              <Text style={[styles.menuText, styles.expenseText]}>Add Expense</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={[styles.fabWrap, { bottom: bottomOffset }]}>
        <TouchableOpacity style={styles.fab} onPress={onToggle} activeOpacity={0.92}>
          <LinearGradient
            colors={
              open
                ? ['rgba(201,107,107,0.92)', 'rgba(156,71,71,0.92)']
                : ['rgba(92,163,255,0.98)', 'rgba(55,121,217,0.98)']
            }
            style={styles.fabGradient}
          >
            <FontAwesome5 name={open ? 'times' : 'plus'} size={16} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.34)',
  },
  menu: {
    position: 'absolute',
    right: 18,
    gap: 10,
    zIndex: 20,
  },
  menuItem: {
    width: 164,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  incomeIcon: {
    backgroundColor: 'rgba(94,189,151,0.18)',
    borderColor: 'rgba(94,189,151,0.28)',
  },
  expenseIcon: {
    backgroundColor: 'rgba(91,163,201,0.18)',
    borderColor: 'rgba(91,163,201,0.28)',
  },
  menuText: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
  incomeText: {
    color: 'rgba(94,189,151,0.94)',
  },
  expenseText: {
    color: 'rgba(91,163,201,0.96)',
  },
  fabWrap: {
    position: 'absolute',
    right: 18,
    zIndex: 30,
  },
  fab: {
    width: 62,
    height: 62,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.26,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
  },
  fabGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
})
