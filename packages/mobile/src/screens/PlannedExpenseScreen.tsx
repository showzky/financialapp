import React, { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PlannedExpenseActionBar } from '../components/planned-expense/PlannedExpenseActionBar'
import { useScreenPalette } from '../customthemes'
import { dashboardApi, type CategoryWithSpent } from '../services/dashboardApi'
import { transactionApi, type TransactionResponse } from '../services/transactionApi'
import { formatDueLabel, formatTimelineCurrency } from '../features/timeline/utils'

const PLANNED_PAYMENT_NOTE = '[planned-payment]'

type PlannedExpenseParams = {
  PlannedExpense: {
    categoryId: string
    title: string
    amount: number
    dueDate: string
    category: string
    accent: string
    recurring: boolean
  }
}

function isSameMonth(dateValue: string, targetDate: Date) {
  const date = new Date(dateValue)
  return (
    date.getFullYear() === targetDate.getFullYear() &&
    date.getMonth() === targetDate.getMonth()
  )
}

export function PlannedExpenseScreen() {
  useScreenPalette()
  const navigation = useNavigation<any>()
  const route = useRoute<RouteProp<PlannedExpenseParams, 'PlannedExpense'>>()
  const insets = useSafeAreaInsets()
  const plannedExpense = route.params
  const dueDate = useMemo(() => new Date(plannedExpense.dueDate), [plannedExpense.dueDate])

  const [category, setCategory] = useState<CategoryWithSpent | null>(null)
  const [matchingTransaction, setMatchingTransaction] = useState<TransactionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionExpanded, setActionExpanded] = useState(false)

  const loadExpenseContext = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const monthToLoad = new Date(dueDate.getFullYear(), dueDate.getMonth(), 1)
      const [dashboard, transactions] = await Promise.all([
        dashboardApi.get(monthToLoad),
        transactionApi.listTransactions(),
      ])

      setCategory(dashboard.categories.find((item) => item.id === plannedExpense.categoryId) ?? null)
      setMatchingTransaction(
        transactions.find(
          (transaction) =>
            transaction.categoryId === plannedExpense.categoryId &&
            isSameMonth(transaction.transactionDate, dueDate),
        ) ?? null,
      )
    } catch (err) {
      console.error('Planned expense load error:', err)
      setError('Failed to load expense details')
    } finally {
      setLoading(false)
    }
  }, [dueDate, plannedExpense.categoryId])

  useFocusEffect(
    useCallback(() => {
      void loadExpenseContext()
    }, [loadExpenseContext]),
  )

  const paid = matchingTransaction !== null
  const canMarkUnpaid = Boolean(matchingTransaction?.note?.startsWith(PLANNED_PAYMENT_NOTE))
  const primaryLabel = paid ? (canMarkUnpaid ? 'CANCEL PAYMENT' : 'PAID') : 'PAY'
  const actionHelperText = paid
    ? 'This planned expense has been recorded for this month.'
    : 'Create the payment entry for this month using the planned amount and due date.'
  const displayTitle = category?.name ?? plannedExpense.title
  const displayAmount = category?.allocated ?? plannedExpense.amount
  const accent = category?.iconColor || category?.color || plannedExpense.accent
  const categoryLabel = category?.parentName || plannedExpense.category
  const iconName = (category?.icon as keyof typeof Ionicons.glyphMap | null) ?? 'ellipse-outline'

  const navigateToEdit = useCallback(
    (autoFocusField?: 'amount') => {
      if (!category) return

      navigation.navigate('EditPlannedExpense', {
        entryType: 'expense',
        categoryId: category.id,
        categoryLabel: displayTitle,
        titleValue: displayTitle,
        amount: displayAmount,
        dueDate: plannedExpense.dueDate,
        accent,
        recurring: plannedExpense.recurring,
        dueDayOfMonth: category.dueDayOfMonth ?? null,
        autoFocusField,
      })
    },
    [accent, category, displayAmount, displayTitle, navigation, plannedExpense.dueDate, plannedExpense.recurring],
  )

  const handlePrimaryAction = async () => {
    if (busy) return
    if (paid && !canMarkUnpaid) {
      setActionExpanded(true)
      return
    }

    try {
      setBusy(true)
      if (paid && matchingTransaction) {
        await transactionApi.deleteTransaction(matchingTransaction.id)
      } else {
        await transactionApi.createTransaction({
          categoryId: plannedExpense.categoryId,
          amount: displayAmount,
          transactionDate: plannedExpense.dueDate,
          note: PLANNED_PAYMENT_NOTE,
        })
      }

      await loadExpenseContext()
    } catch (err) {
      console.error('Planned expense action failed:', err)
      setError(paid ? 'Failed to mark expense as unpaid' : 'Failed to record payment')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0e" />
        <ActivityIndicator size="large" color={plannedExpense.accent} />
      </View>
    )
  }

  if (error && !category) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0e" />
        <Ionicons name="alert-circle" size={48} color="rgba(201,107,107,0.9)" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => void loadExpenseContext()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0e" />
      <LinearGradient colors={['#141324', '#0a0a0e', '#111728']} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(106,61,176,0.26)', 'transparent']} style={styles.topBloom} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top, 16), paddingBottom: 220 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>

          <View style={styles.headerDateBlock}>
            <Text style={styles.headerDate}>{dueDate.getDate()} {dueDate.toLocaleDateString('en-US', { month: 'short' })}</Text>
            <Text style={styles.headerWeekday}>{dueDate.toLocaleDateString('en-US', { weekday: 'long' })}</Text>
          </View>

          <TouchableOpacity
            style={styles.editPill}
            onPress={() => navigateToEdit()}
            activeOpacity={0.88}
          >
            <Text style={styles.editPillText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={[styles.categoryBadge, { backgroundColor: `${accent}22`, borderColor: `${accent}55` }]}>
            <View style={[styles.categoryBadgeIconWrap, { backgroundColor: `${accent}20` }]}>
              <Ionicons name={iconName} size={14} color={accent} />
            </View>
            <Text style={styles.categoryBadgeText}>{categoryLabel}</Text>
          </View>

          <Text style={styles.title}>{displayTitle}</Text>

          <TouchableOpacity style={styles.totalCard} activeOpacity={0.88} onPress={() => navigateToEdit('amount')}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={[styles.totalValue, paid ? styles.totalValuePaid : styles.totalValueUnpaid]}>
              -{formatTimelineCurrency(displayAmount)}
            </Text>
          </TouchableOpacity>

          <View style={styles.metaSection}>
            <Text style={styles.metaHeading}>Date</Text>
            <View style={styles.datePill}>
              <Text style={styles.datePillText}>{formatDueLabel(dueDate)}</Text>
            </View>
          </View>

          <View style={styles.detailGrid}>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={[styles.detailValue, paid ? styles.paidText : styles.unpaidText]}>
                {paid ? 'Paid' : 'Unpaid'}
              </Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Schedule</Text>
              <Text style={styles.detailValue}>{plannedExpense.recurring ? 'Recurring' : 'One-time'}</Text>
            </View>
          </View>

          {error ? <Text style={styles.inlineError}>{error}</Text> : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <PlannedExpenseActionBar
          expanded={actionExpanded}
          paid={paid}
          amountLabel={formatTimelineCurrency(displayAmount)}
          dateLabel={dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          busy={busy}
          canMarkUnpaid={canMarkUnpaid}
          helperText={actionHelperText}
          onToggleExpanded={() => setActionExpanded((prev) => !prev)}
          onPrimaryAction={() => void handlePrimaryAction()}
          primaryLabel={primaryLabel}
        />
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.82}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
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
    height: 280,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerDateBlock: {
    flex: 1,
    marginLeft: 14,
  },
  headerDate: {
    color: 'rgba(255,255,255,0.94)',
    fontSize: 28,
    fontFamily: 'DMSans_800ExtraBold',
  },
  headerWeekday: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.42)',
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
  },
  editPill: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  editPillText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
  content: {
    paddingTop: 26,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  categoryBadgeIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadgeText: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
  title: {
    marginTop: 20,
    color: 'rgba(255,255,255,0.94)',
    fontSize: 38,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  totalCard: {
    marginTop: 22,
    alignSelf: 'flex-start',
    minWidth: 130,
    borderRadius: 26,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  totalLabel: {
    color: 'rgba(255,255,255,0.38)',
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
  },
  totalValue: {
    marginTop: 6,
    fontSize: 28,
    fontFamily: 'DMSans_800ExtraBold',
  },
  totalValuePaid: {
    color: '#78d89c',
  },
  totalValueUnpaid: {
    color: '#ff9892',
  },
  metaSection: {
    marginTop: 36,
  },
  metaHeading: {
    color: 'rgba(255,255,255,0.38)',
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
  },
  datePill: {
    marginTop: 10,
    alignSelf: 'flex-end',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  datePillText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
  },
  detailGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 26,
  },
  detailCard: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  detailLabel: {
    color: 'rgba(255,255,255,0.34)',
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
  },
  detailValue: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.86)',
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
  },
  paidText: {
    color: '#78d89c',
  },
  unpaidText: {
    color: '#ff9892',
  },
  inlineError: {
    marginTop: 18,
    color: '#ffb1a6',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'DMSans_500Medium',
  },
  footer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    gap: 14,
    paddingTop: 14,
    alignItems: 'stretch',
    backgroundColor: 'transparent',
  },
  cancelText: {
    textAlign: 'center',
    color: 'rgba(92,163,255,0.94)',
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
  },
  errorText: {
    color: 'rgba(255,255,255,0.82)',
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
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
