import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { usePeriod } from '../context/PeriodContext'
import { useScreenPalette } from '../customthemes'
import { categoryApi, type CategoryDto } from '../services/categoryApi'
import { transactionApi, type TransactionResponse } from '../services/transactionApi'

type FilterValue = 'All' | 'Paid' | 'Unpaid'

type RouteParams = {
  categoryId: string
  categoryName: string
  accent?: string
}

function formatRange(selectedMonth: Date) {
  const start = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1)
  const end = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0)
  const formatter = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return `${formatter.format(start)} - ${formatter.format(end)}`
}

function formatExpenseAmount(amount: number) {
  return `-${new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    maximumFractionDigits: 0,
  }).format(amount)}`
}

function toDateKey(dateString: string) {
  const date = new Date(dateString)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function formatDayHeading(dateString: string) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    weekday: 'long',
  }).format(date)
}

function formatEntryLabel(category: CategoryDto | undefined, rootCategory: CategoryDto | undefined) {
  if (!category) {
    return rootCategory?.name ?? 'Expense'
  }

  if (category.parentName && category.parentName !== category.name) {
    return `${category.parentName} > ${category.name}`
  }

  return category.name
}

export function BudgetCategoryAnalyticsScreen() {
  useScreenPalette()
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const insets = useSafeAreaInsets()
  const { selectedMonth } = usePeriod()
  const { categoryId, categoryName, accent } = route.params as RouteParams

  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [transactions, setTransactions] = useState<TransactionResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterValue>('All')

  const loadData = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false

    try {
      if (!silent) {
        setLoading(true)
      }
      setError(null)
      const [categoryRows, transactionRows] = await Promise.all([
        categoryApi.listCategories('expense'),
        transactionApi.listTransactions(),
      ])
      setCategories(categoryRows)
      setTransactions(transactionRows)
    } catch (err) {
      console.error('Budget analytics load error:', err)
      setError('Failed to load analytics')
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useFocusEffect(
    useCallback(() => {
      void loadData({ silent: true })

      const intervalId = setInterval(() => {
        void loadData({ silent: true })
      }, 30000)

      return () => {
        clearInterval(intervalId)
      }
    }, [loadData]),
  )

  const rootCategory = useMemo(
    () => categories.find((category) => category.id === categoryId),
    [categories, categoryId],
  )

  const relevantCategoryIds = useMemo(() => {
    const ids = new Set<string>([categoryId])
    const parentName = rootCategory?.name ?? categoryName

    categories.forEach((category) => {
      if (
        category.id !== categoryId &&
        category.type === 'budget' &&
        category.parentName === parentName
      ) {
        ids.add(category.id)
      }
    })

    return ids
  }, [categories, categoryId, categoryName, rootCategory?.name])

  const filteredTransactions = useMemo(() => {
    const start = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1, 0, 0, 0, 0)
    const end = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59, 999)
    const today = new Date()

    const monthRows = transactions
      .filter((transaction) => {
        const transactionDate = new Date(transaction.transactionDate)
        return (
          relevantCategoryIds.has(transaction.categoryId) &&
          transactionDate >= start &&
          transactionDate <= end
        )
      })
      .map((transaction) => {
        const transactionDate = new Date(transaction.transactionDate)
        const status: Exclude<FilterValue, 'All'> =
          transaction.isPaid && transactionDate <= today ? 'Paid' : 'Unpaid'

        return {
          ...transaction,
          status,
        }
      })

    if (filter === 'All') {
      return monthRows
    }

    return monthRows.filter((transaction) => transaction.status === filter)
  }, [filter, relevantCategoryIds, selectedMonth, transactions])

  const groupedTransactions = useMemo(() => {
    const groups = new Map<
      string,
      {
        title: string
        total: number
        items: (TransactionResponse & { status: Exclude<FilterValue, 'All'> })[]
      }
    >()

    filteredTransactions
      .slice()
      .sort(
        (left, right) =>
          new Date(left.transactionDate).getTime() - new Date(right.transactionDate).getTime(),
      )
      .forEach((transaction) => {
        const key = toDateKey(transaction.transactionDate)
        const existing = groups.get(key)

        if (existing) {
          existing.items.push(transaction)
          existing.total += transaction.amount
          return
        }

        groups.set(key, {
          title: formatDayHeading(transaction.transactionDate),
          total: transaction.amount,
          items: [transaction],
        })
      })

    return [...groups.entries()].map(([id, group]) => ({
      id,
      ...group,
    }))
  }, [filteredTransactions])

  const total = useMemo(
    () => filteredTransactions.reduce((sum, transaction) => sum + transaction.amount, 0),
    [filteredTransactions],
  )

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0e" />
        <ActivityIndicator size="large" color="rgba(92,163,255,0.92)" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0e" />
        <Ionicons name="alert-circle" size={48} color="rgba(201,107,107,0.9)" />
        <Text style={styles.errorTitle}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => void loadData()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0e" />
      <LinearGradient colors={['#110f1f', '#0a0a0e', '#0d1321', '#0a0a0e']} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(95,82,192,0.24)', 'transparent']} style={styles.topBloom} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 40 }]}
      >
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.72)" />
          </TouchableOpacity>

          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Analytics</Text>
            <Text style={styles.headerSubtitle}>{formatRange(selectedMonth)}</Text>
          </View>

          <View style={styles.headerGhost}>
            <Ionicons name="calendar-outline" size={18} color="rgba(255,255,255,0.28)" />
          </View>
        </View>

        <View style={styles.totalRow}>
          <View>
            <View style={styles.totalPill}>
              <Text style={styles.totalPillText}>Total</Text>
            </View>
            <Text style={[styles.totalAmount, { color: accent || '#ffffff' }]}>{formatExpenseAmount(total)}</Text>
          </View>

          <View style={styles.filterBar}>
            {(['All', 'Paid', 'Unpaid'] as const).map((value) => {
              const active = filter === value
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setFilter(value)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{value}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <View style={styles.monthPillWrap}>
          <View style={styles.monthPill}>
            <Text style={styles.monthPillText}>
              {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
          </View>
        </View>

        {groupedTransactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptyText}>
              {filter === 'Unpaid'
                ? 'There are no unpaid expenses in this category for the selected month.'
                : 'This category has no matching expenses for the selected month.'}
            </Text>
          </View>
        ) : (
          groupedTransactions.map((group) => (
            <View key={group.id} style={styles.daySection}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>{group.title}</Text>
                <Text style={styles.dayTotal}>{formatExpenseAmount(group.total)}</Text>
              </View>

              {group.items.map((transaction) => {
                const category = categories.find((item) => item.id === transaction.categoryId)
                const paid = transaction.status === 'Paid'

                return (
                  <View key={transaction.id} style={styles.entryRow}>
                    <View style={styles.entryLeft}>
                      <View
                        style={[
                          styles.entryIcon,
                          { backgroundColor: category?.color || 'rgba(95,168,255,0.16)' },
                        ]}
                      >
                        <Ionicons
                          name={
                            category?.icon && category.icon in Ionicons.glyphMap
                              ? (category.icon as keyof typeof Ionicons.glyphMap)
                              : 'wallet-outline'
                          }
                          size={16}
                          color={category?.iconColor || accent || '#9bc2ff'}
                        />
                      </View>

                      <View>
                        <Text style={styles.entryName}>{formatEntryLabel(category, rootCategory)}</Text>
                        <Text style={styles.entryNote} numberOfLines={1}>
                          {transaction.note?.trim() || category?.parentName || categoryName}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.entryRight}>
                      <Text style={styles.entryAmount}>{formatExpenseAmount(transaction.amount)}</Text>
                      <View
                        style={[
                          styles.statusCircle,
                          paid ? styles.statusCirclePaid : styles.statusCircleUnpaid,
                        ]}
                      >
                        {paid ? <Ionicons name="checkmark" size={11} color="#ffffff" /> : null}
                      </View>
                    </View>
                  </View>
                )
              })}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0e',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0e',
    paddingHorizontal: 24,
  },
  topBloom: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  headerGhost: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  headerCopy: {
    flex: 1,
    marginHorizontal: 14,
  },
  headerTitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 22,
    fontFamily: 'DMSans_700Bold',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.46)',
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'DMSans_500Medium',
  },
  totalRow: {
    marginTop: 22,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  totalPill: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
  },
  totalPillText: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
  },
  totalAmount: {
    fontSize: 36,
    fontFamily: 'DMSans_800ExtraBold',
    letterSpacing: -1,
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  filterChipActive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  filterChipText: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  monthPillWrap: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  monthPill: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  monthPillText: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
  },
  daySection: {
    paddingHorizontal: 20,
    marginTop: 18,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayTitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
  dayTotal: {
    color: 'rgba(255,255,255,0.34)',
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  entryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  entryIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryName: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
  },
  entryNote: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'DMSans_500Medium',
  },
  entryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  entryAmount: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
  },
  statusCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCirclePaid: {
    backgroundColor: '#35c36f',
    borderColor: '#35c36f',
  },
  statusCircleUnpaid: {
    borderColor: 'rgba(255,255,255,0.34)',
    backgroundColor: 'transparent',
  },
  emptyCard: {
    marginTop: 24,
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  emptyTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
  },
  emptyText: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.42)',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'DMSans_500Medium',
  },
  errorTitle: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'DMSans_600SemiBold',
  },
  retryButton: {
    marginTop: 16,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: 'rgba(92,163,255,0.92)',
  },
  retryText: {
    color: '#ffffff',
    fontFamily: 'DMSans_700Bold',
  },
})
