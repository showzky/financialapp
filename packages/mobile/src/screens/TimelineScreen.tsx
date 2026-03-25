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
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TimelineFilterBar } from '../components/timeline/TimelineFilterBar'
import { TimelineHeroCard } from '../components/timeline/TimelineHeroCard'
import { TimelineIncomeSection } from '../components/timeline/TimelineIncomeSection'
import { TimelineMonthSection } from '../components/timeline/TimelineMonthSection'
import type { TimelineEntry, TimelineFilter } from '../features/timeline/types'
import {
  buildTimelineSections,
  formatMonthTitle,
  formatTimelineCurrency,
} from '../features/timeline/utils'
import { usePeriod } from '../context/PeriodContext'
import { useScreenPalette } from '../customthemes'
import { dashboardApi, type DashboardData } from '../services/dashboardApi'
import { transactionApi, type TransactionResponse } from '../services/transactionApi'
import { useFocusEffect } from '@react-navigation/native'

export function TimelineScreen() {
  useScreenPalette()
  const navigation = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const { selectedMonth } = usePeriod()

  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [transactions, setTransactions] = useState<TransactionResponse[]>([])
  const [paidEntryKeys, setPaidEntryKeys] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<TimelineFilter>('All')

  const loadDashboard = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false

    try {
      if (!silent) {
        setLoading(true)
      }
      setError(null)
      const [data, transactions] = await Promise.all([
        dashboardApi.get(selectedMonth),
        transactionApi.listTransactions(),
      ])
      setDashboard(data)
      setTransactions(transactions)
      setPaidEntryKeys(
        new Set(
          transactions
            .filter((transaction) => transaction.isPaid)
            .map((transaction) => {
            const date = new Date(transaction.transactionDate)
            return `${transaction.categoryId}-${date.getFullYear()}-${date.getMonth()}`
            }),
        ),
      )
    } catch (err) {
      console.error('Timeline dashboard load error:', err)
      setError('Failed to load timeline')
      if (!silent) {
        setDashboard(null)
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [selectedMonth])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  useFocusEffect(
    useCallback(() => {
      void loadDashboard({ silent: true })

      const intervalId = setInterval(() => {
        void loadDashboard({ silent: true })
      }, 30000)

      return () => {
        clearInterval(intervalId)
      }
    }, [loadDashboard]),
  )

  const timelineSections = useMemo(
    () =>
      buildTimelineSections(
        dashboard?.categories ?? [],
        transactions,
        selectedMonth,
        filter,
        new Date(),
        paidEntryKeys,
        3,
        dashboard?.incomeCategories ?? [],
        dashboard?.allIncomeEntries ?? [],
      ),
    [dashboard, filter, paidEntryKeys, selectedMonth, transactions],
  )

  const navigateToIncomeEditor = useCallback(
    (entry: {
      id: string
      incomeCategoryId: string | null
      category: string
      name: string | null
      amount: number
      receivedAt: string
      iconColor?: string | null
      color?: string | null
    }) => {
      navigation.navigate('EditPlannedExpense', {
        entryType: 'income',
        entryId: entry.id,
        incomeCategoryId: entry.incomeCategoryId,
        categoryLabel: entry.category,
        titleValue: entry.name ?? entry.category,
        amount: entry.amount,
        dueDate: entry.receivedAt,
        accent: entry.iconColor || entry.color || '#78d89c',
        recurring: false,
        dueDayOfMonth: null,
      })
    },
    [navigation],
  )

  const handleOpenTimelineEntry = useCallback(
    (entry: TimelineEntry) => {
      if (entry.entryKind === 'income') {
        if (entry.source !== 'income_entry' || !entry.incomeEntryId) return

        navigation.navigate('EditPlannedExpense', {
          entryType: 'income',
          entryId: entry.incomeEntryId,
          incomeCategoryId: entry.categoryId || null,
          categoryLabel: entry.categoryName,
          titleValue: entry.title,
          amount: entry.amount,
          dueDate: entry.dueDate.toISOString(),
          accent: entry.accent,
          recurring: false,
          dueDayOfMonth: null,
        })
        return
      }

      const matchingCategory = dashboard?.categories.find((category) => category.id === entry.categoryId)
      if (!matchingCategory) return

      navigation.navigate('PlannedExpense', {
        categoryId: matchingCategory.id,
        transactionId: entry.transactionId,
        source: entry.source,
        title: entry.title,
        amount: entry.amount,
        dueDate: entry.dueDate.toISOString().split('T')[0],
        category: entry.category,
        accent: entry.accent,
        recurring: entry.recurring,
      })
    },
    [dashboard, navigation],
  )

  const handleOpenIncomeEntry = useCallback(
    (entry: DashboardData['incomeEntries'][number]) => {
      navigateToIncomeEditor(entry)
    },
    [navigateToIncomeEditor],
  )

  const nearestDueLabel = timelineSections.find((s) => s.nearestDueLabel !== '--')?.nearestDueLabel ?? '--'
  const upcomingPlannedTotal = timelineSections.reduce((sum, section) => sum + section.totalAmount, 0)
  const plannedCount = timelineSections.reduce((sum, section) => sum + section.itemCount, 0)
  const filteredIncomeEntries = useMemo(() => {
    if (filter === 'All') return dashboard?.incomeEntries ?? []
    const daysLimit = filter === '7 Days' ? 7 : 30
    return (dashboard?.incomeEntries ?? []).filter((entry) => {
      const daysUntil = Math.ceil((new Date(entry.receivedAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      return daysUntil <= daysLimit
    })
  }, [dashboard?.incomeEntries, filter])

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0e" />
        <ActivityIndicator size="large" color="rgba(92,163,255,0.92)" />
      </View>
    )
  }

  if (error || !dashboard) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0e" />
        <Ionicons name="alert-circle" size={48} color="rgba(201,107,107,0.9)" />
        <Text style={styles.errorTitle}>{error ?? 'Failed to load timeline'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => void loadDashboard()}>
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
      <LinearGradient colors={['transparent', 'rgba(37,114,166,0.16)']} style={styles.bottomBloom} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 12) + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
          <View style={styles.headerButtonGhost} />

          <View style={styles.headerCenter}>
            <Text style={styles.headerEyebrow}>Calendar</Text>
            <Text style={styles.headerTitle}>{formatMonthTitle(selectedMonth)}</Text>
          </View>

          <View style={styles.headerButtonGhost}>
            <Ionicons name="pulse-outline" size={18} color="rgba(255,255,255,0.28)" />
          </View>
        </View>

        <TimelineHeroCard
          monthLabel={formatMonthTitle(selectedMonth)}
          incomeTotal={dashboard.totalIncome}
          expenseTotal={dashboard.totalSpent}
          upcomingTotal={upcomingPlannedTotal}
          nearestDueLabel={nearestDueLabel}
          plannedCount={plannedCount}
        />

        <View style={styles.quickStatsRow}>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatLabel}>Allocated</Text>
            <Text style={styles.quickStatValue}>{formatTimelineCurrency(dashboard.totalAllocated)}</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatLabel}>Free To Assign</Text>
            <Text style={styles.quickStatValue}>{formatTimelineCurrency(dashboard.freeToAssign)}</Text>
          </View>
        </View>

        <TimelineIncomeSection incomeEntries={filteredIncomeEntries} onEntryPress={handleOpenIncomeEntry} />

        <TimelineFilterBar value={filter} onChange={setFilter} />

        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>Upcoming Timeline</Text>
            <Text style={styles.sectionSubtitle}>A month-by-month view of your planned fixed payments.</Text>
          </View>
          <View style={styles.sectionPill}>
            <Text style={styles.sectionPillText}>{plannedCount} items</Text>
          </View>
        </View>

        {timelineSections.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No upcoming expenses</Text>
            <Text style={styles.emptyText}>
              Add due days to fixed costs or switch back to `All` to see more planned payments.
            </Text>
          </View>
        ) : (
          timelineSections.map((section) => (
            <TimelineMonthSection
              key={section.id}
              section={section}
              onEntryPress={handleOpenTimelineEntry}
            />
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
  bottomBloom: {
    position: 'absolute',
    bottom: 0,
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
  headerButtonGhost: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerEyebrow: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontFamily: 'DMSans_600SemiBold',
  },
  headerTitle: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 20,
    fontFamily: 'DMSans_700Bold',
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 20,
  },
  quickStatCard: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  quickStatLabel: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
  },
  quickStatValue: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.86)',
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
  },
  sectionHeader: {
    marginTop: 26,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 24,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  sectionSubtitle: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.42)',
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'DMSans_500Medium',
  },
  sectionPill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  sectionPillText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
  },
  emptyCard: {
    marginTop: 22,
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
    color: 'white',
    fontFamily: 'DMSans_700Bold',
  },
})
