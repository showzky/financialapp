import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { borrowedLoanApi, type BorrowedLoan } from '../services/borrowedLoanApi'
import { wishlistApi, type WishlistItem } from '../services/wishlistApi'

export type GoalDebtTarget =
  | { type: 'wishlist'; id: string; title: string; savedAmount: number }
  | { type: 'borrowed_loan'; id: string; lender: string; currentBalance: number }

type Props = {
  visible: boolean
  selectedTarget: GoalDebtTarget | null
  onSelect: (target: GoalDebtTarget | null) => void
  onClose: () => void
}

export function GoalDebtPickerSheet({ visible, selectedTarget, onSelect, onClose }: Props) {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [borrowedLoans, setBorrowedLoans] = useState<BorrowedLoan[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!visible) return
    setLoading(true)
    Promise.all([wishlistApi.list(), borrowedLoanApi.list()])
      .then(([items, loans]) => {
        setWishlistItems(items.filter((i) => !i.purchased))
        setBorrowedLoans(loans.filter((l) => l.status !== 'paid_off'))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [visible])

  const isSelected = (target: GoalDebtTarget) =>
    selectedTarget !== null &&
    selectedTarget.type === target.type &&
    selectedTarget.id === target.id

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <LinearGradient colors={['#1a1928', '#0d0d18']} style={StyleSheet.absoluteFillObject} />
          <View style={styles.handleArea}>
            <View style={styles.handle} />
          </View>
          <View style={styles.header}>
            <Text style={styles.title}>Goal or Debt</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.content}>
            {loading ? (
              <ActivityIndicator color="rgba(255,255,255,0.4)" style={styles.loader} />
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.row, styles.rowBorder]}
                  onPress={() => { onSelect(null); onClose() }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.rowLabel}>None</Text>
                  {selectedTarget === null ? (
                    <Ionicons name="checkmark" size={18} color="rgba(94,189,151,0.9)" />
                  ) : null}
                </TouchableOpacity>

                {wishlistItems.length > 0 ? (
                  <>
                    <Text style={styles.sectionLabel}>GOALS — WISHLIST</Text>
                    {wishlistItems.map((item, i) => {
                      const target: GoalDebtTarget = {
                        type: 'wishlist',
                        id: item.id,
                        title: item.title,
                        savedAmount: item.savedAmount,
                      }
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[styles.row, i < wishlistItems.length - 1 && styles.rowBorder]}
                          onPress={() => { onSelect(target); onClose() }}
                          activeOpacity={0.8}
                        >
                          <View style={styles.rowText}>
                            <Text style={styles.rowLabel}>{item.title}</Text>
                            {item.price !== null ? (
                              <Text style={styles.rowHint}>
                                Saved {item.savedAmount.toLocaleString('no-NO')} / {item.price.toLocaleString('no-NO')} NOK
                              </Text>
                            ) : null}
                          </View>
                          {isSelected(target) ? (
                            <Ionicons name="checkmark" size={18} color="rgba(94,189,151,0.9)" />
                          ) : null}
                        </TouchableOpacity>
                      )
                    })}
                  </>
                ) : null}

                {borrowedLoans.length > 0 ? (
                  <>
                    <Text style={styles.sectionLabel}>DEBTS — BORROWED</Text>
                    {borrowedLoans.map((loan, i) => {
                      const target: GoalDebtTarget = {
                        type: 'borrowed_loan',
                        id: loan.id,
                        lender: loan.lender,
                        currentBalance: loan.currentBalance,
                      }
                      return (
                        <TouchableOpacity
                          key={loan.id}
                          style={[styles.row, i < borrowedLoans.length - 1 && styles.rowBorder]}
                          onPress={() => { onSelect(target); onClose() }}
                          activeOpacity={0.8}
                        >
                          <View style={styles.rowText}>
                            <Text style={styles.rowLabel}>{loan.lender}</Text>
                            <Text style={styles.rowHint}>
                              Balance: {loan.currentBalance.toLocaleString('no-NO')} NOK
                            </Text>
                          </View>
                          {isSelected(target) ? (
                            <Ionicons name="checkmark" size={18} color="rgba(94,189,151,0.9)" />
                          ) : null}
                        </TouchableOpacity>
                      )
                    })}
                  </>
                ) : null}

                {wishlistItems.length === 0 && borrowedLoans.length === 0 ? (
                  <Text style={styles.emptyText}>No active goals or debts found.</Text>
                ) : null}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: '70%',
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  title: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  loader: {
    marginVertical: 24,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 9,
    letterSpacing: 2,
    marginTop: 20,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 15,
    fontWeight: '500',
  },
  rowHint: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 24,
  },
})
