// @ts-nocheck
import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { dashboardApi, type DashboardData, type CategoryWithSpent } from '../services/dashboardApi'
import { usePeriod } from '../context/PeriodContext'
import { MonthPickerModal } from '../components/MonthPickerModal'
import { CategoryCard } from '../components/CategoryCard'
import { CategoryDetailModal } from '../components/CategoryDetailModal'
import { AddExpenseModal } from '../components/AddExpenseModal'
import { SetIncomeModal } from '../components/SetIncomeModal' // ADDED THIS

export function HomeScreen() {
  const { selectedMonth, setSelectedMonth } = usePeriod()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMonthPickerVisible, setMonthPickerVisible] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithSpent | null>(null)
  const [isAddExpenseModalOpen, setAddExpenseModalOpen] = useState(false)
  const [isSetIncomeModalOpen, setSetIncomeModalOpen] = useState(false) // ADDED THIS

  const selectedMonthLabel = selectedMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await dashboardApi.get(selectedMonth)
      setDashboard(data)
    } catch (err) {
      console.error('Dashboard load error:', err)
      setError('Failed to load dashboard')
      setDashboard(null)
    } finally {
      setLoading(false)
    }
  }, [selectedMonth])

  const handleSelectMonth = useCallback(
    async (month: Date) => {
      await setSelectedMonth(month)
      setMonthPickerVisible(false)
    },
    [setSelectedMonth],
  )

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  if (error || !dashboard) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error ?? 'Failed to load dashboard'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadDashboard}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const isOverAllocated = dashboard.freeToAssign < 0
  const allocationBalance = dashboard.totalIncome - dashboard.totalAllocated

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Financial Overview</Text>
        <TouchableOpacity
          style={styles.monthButton}
          onPress={() => setMonthPickerVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.monthButtonText}>{selectedMonthLabel}</Text>
          <Ionicons name="chevron-down" size={16} color="#1d4ed8" />
        </TouchableOpacity>
      </View>

      {/* ── Phase 2: 3-Stat Row ── ADDED THIS */}
      <View style={styles.statRow}>
        <View style={[styles.statRowItem, styles.statRowIncome]}>
          <Ionicons name="arrow-down-circle" size={18} color="#10b981" />
          <Text style={styles.statRowValue}>
            {dashboard.totalIncome.toLocaleString()}
          </Text>
          <Text style={styles.statRowLabel}>Income</Text>
        </View>
        <View style={[styles.statRowItem, styles.statRowAllocated]}>
          <Ionicons name="layers" size={18} color="#8b5cf6" />
          <Text style={styles.statRowValue}>
            {dashboard.totalAllocated.toLocaleString()}
          </Text>
          <Text style={styles.statRowLabel}>Allocated</Text>
        </View>
        <View
          style={[
            styles.statRowItem,
            styles.statRowFree,
            isOverAllocated && styles.statRowFreeWarning,
          ]}
        >
          <Ionicons
            name="wallet-outline"
            size={18}
            color={isOverAllocated ? '#ef4444' : '#3b82f6'}
          />
          <Text style={[styles.statRowValue, isOverAllocated && styles.statRowValueWarning]}>
            {dashboard.freeToAssign.toLocaleString()}
          </Text>
          <Text style={[styles.statRowLabel, isOverAllocated && styles.statRowLabelWarning]}>
            Free to assign
          </Text>
        </View>
      </View>

      {/* ── Phase 2: Cash Flow Progress Bar ── ADDED THIS */}
      <View style={styles.cashFlowSection}>
        <View style={styles.cashFlowBarTrack}>
          <View
            style={[
              styles.cashFlowBarFill,
              {
                width: `${Math.max(0, Math.min(
                  dashboard.totalAllocated > 0
                    ? (dashboard.totalSpent / dashboard.totalAllocated) * 100
                    : 0,
                  100,
                ))}%`,
              },
            ]}
          />
        </View>
        <View style={styles.cashFlowLabels}>
          <Text style={[styles.cashFlowLeft, allocationBalance < 0 && styles.cashFlowLeftWarning]}>
            {allocationBalance < 0
              ? `KR ${Math.abs(allocationBalance).toLocaleString()} over-allocated`
              : `KR ${allocationBalance.toLocaleString()} left to allocate`}
          </Text>
          <Text style={styles.cashFlowRight}>
            {dashboard.totalSpent.toLocaleString()} / {dashboard.totalAllocated.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summarySection}>
        {/* Income Card */}
        <View style={[styles.card, styles.incomeCard]}>
          <View style={styles.cardTop}>
            <View style={styles.cardLabelRow}>
              <View style={[styles.cardIcon, styles.incomeIcon]}>
                <Ionicons name="arrow-down" size={16} color="#10b981" />
              </View>
              <Text style={[styles.cardLabel, styles.incomeLabel]}>Income</Text>
            </View>
            <Text style={[styles.cardTag, styles.incomeTag]}>Free money</Text>
          </View>

          <View style={styles.cardValueRow}>
            <Text style={[styles.cardCurrency, styles.incomeCurrency]}>NOK</Text>
            <Text style={[styles.cardValue, styles.incomeValue]}> {dashboard.totalIncome.toLocaleString()}</Text>
          </View>

          <View style={[styles.cardDivider, styles.incomeDivider]} />
          <Text style={[styles.cardFooter, styles.incomeFooter]}>Income minus all fixed costs</Text>
          <View style={[styles.cardOrb, styles.incomeOrb]} pointerEvents="none" />
        </View>

        {/* Spent Card */}
        <View style={[styles.card, styles.spentCard]}>
          <View style={styles.cardTop}>
            <View style={styles.cardLabelRow}>
              <View style={[styles.cardIcon, styles.spentIcon]}>
                <Ionicons name="arrow-up" size={16} color="#ef4444" />
              </View>
              <Text style={[styles.cardLabel, styles.spentLabel]}>Spent</Text>
            </View>
            <Text style={[styles.cardTag, styles.spentTag]}>Fixed costs</Text>
          </View>

          <View style={styles.cardValueRow}>
            <Text style={[styles.cardCurrency, styles.spentCurrency]}>NOK</Text>
            <Text style={[styles.cardValue, styles.spentValue]}> {dashboard.totalSpent.toLocaleString()}</Text>
          </View>

          <View style={[styles.cardDivider, styles.spentDivider]} />
          <Text style={[styles.cardFooter, styles.spentFooter]}>Transfer to your bills account</Text>
          <View style={[styles.cardOrb, styles.spentOrb]} pointerEvents="none" />
        </View>

        {/* Remaining Card */}
        <View style={[styles.card, styles.remainingCard]}>
          <View style={styles.cardTop}>
            <View style={styles.cardLabelRow}>
              <View style={[styles.cardIcon, styles.remainingIcon]}>
                <Ionicons name="wallet" size={16} color="#3b82f6" />
              </View>
              <Text style={[styles.cardLabel, styles.remainingLabel]}>Remaining</Text>
            </View>
            <Text style={[styles.cardTag, styles.remainingTag]}>Budgeted</Text>
          </View>

          <View style={styles.cardValueRow}>
            <Text style={[styles.cardCurrency, styles.remainingCurrency]}>NOK</Text>
            <Text style={[styles.cardValue, styles.remainingValue]}> {dashboard.remaining.toLocaleString()}</Text>
          </View>

          <View style={[styles.cardDivider, styles.remainingDivider]} />
          <Text style={[styles.cardFooter, styles.remainingFooter]}>Total across all budget categories</Text>
          <View style={[styles.cardOrb, styles.remainingOrb]} pointerEvents="none" />
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Ionicons name="pie-chart" size={24} color="#8b5cf6" />
          <Text style={styles.statLabel}>{dashboard.categoryCount}</Text>
          <Text style={styles.statDesc}>Categories</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="document-text" size={24} color="#f59e0b" />
          <Text style={styles.statLabel}>{dashboard.activeLoans}</Text>
          <Text style={styles.statDesc}>Active Loans</Text>
        </View>
      </View>

      {/* ── Phase 2: Compact Loan Summary ── CHANGED THIS */}
      <View style={styles.loanSection}>
        <TouchableOpacity style={styles.compactLoanCard} activeOpacity={0.7}>
          <View style={styles.compactLoanLeft}>
            <Ionicons name="document-text" size={20} color="#f59e0b" />
            <Text style={styles.compactLoanBalance}>
              NOK {dashboard.loanBalance.toLocaleString()}
            </Text>
          </View>
          <View style={styles.compactLoanRight}>
            <Text style={styles.compactLoanCount}>
              {dashboard.activeLoans} active {dashboard.activeLoans === 1 ? 'loan' : 'loans'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#3b82f6" />
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Phase 3: Categories Grid ── */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Categories</Text>
        {dashboard.categories.length === 0 ? (
          <Text style={styles.emptyCategories}>No categories yet</Text>
        ) : (
          <View style={styles.categoriesGrid}>
            {dashboard.categories.map((item) => (
              <CategoryCard
                key={item.id}
                category={item}
                onPress={() => setSelectedCategory(item)}
              />
            ))}
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setAddExpenseModalOpen(true)}
          >
            <Ionicons name="add-circle" size={28} color="#3b82f6" />
            <Text style={styles.actionLabel}>Add Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setSetIncomeModalOpen(true)}
          >
            <Ionicons name="arrow-up-circle" size={28} color="#10b981" />
            <Text style={styles.actionLabel}>Set income</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="document-text-outline" size={28} color="#f59e0b" />
            <Text style={styles.actionLabel}>Add Loan</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Spacing */}
      <View style={{ height: 32 }} />

      <MonthPickerModal
        visible={isMonthPickerVisible}
        selectedMonth={selectedMonth}
        onClose={() => setMonthPickerVisible(false)}
        onSelectMonth={handleSelectMonth}
      />

      {/* ── Phase 3: Category detail modal ── */}
      <CategoryDetailModal
        visible={selectedCategory !== null}
        category={selectedCategory}
        onClose={() => setSelectedCategory(null)}
        onCategoryUpdated={() => {
          setSelectedCategory(null)
          void loadDashboard()
        }}
        onCategoryDeleted={() => {
          setSelectedCategory(null)
          void loadDashboard()
        }}
      />

      {dashboard && isSetIncomeModalOpen && (
        <SetIncomeModal
          isOpen={isSetIncomeModalOpen}
          currentIncome={dashboard.totalIncome}
          onClose={() => setSetIncomeModalOpen(false)}
          onIncomeUpdated={() => {
            setSetIncomeModalOpen(false)
            void loadDashboard()
          }}
        />
      )}

      {/* ── Add Expense Modal ── */}
      {dashboard && (
        <AddExpenseModal
          isOpen={isAddExpenseModalOpen}
          onClose={() => setAddExpenseModalOpen(false)}
          categories={dashboard.categories}
          selectedMonth={selectedMonth}
          onTransactionCreated={() => {
            setAddExpenseModalOpen(false)
            void loadDashboard()
          }}
        />
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  monthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  monthButtonText: {
    color: '#1d4ed8',
    fontSize: 14,
    fontWeight: '700',
  },
  summarySection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  card: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    backgroundColor: '#fff',
  },
  incomeCard: {
    backgroundColor: '#ecfdf5',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  spentCard: {
    backgroundColor: '#fff5f5',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  remainingCard: {
    backgroundColor: '#f0f6ff',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomeIcon: { backgroundColor: 'rgba(16,185,129,0.12)' },
  spentIcon: { backgroundColor: 'rgba(239,68,68,0.12)' },
  remainingIcon: { backgroundColor: 'rgba(59,130,246,0.12)' },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  incomeLabel: { color: '#15803d' },
  spentLabel: { color: '#dc2626' },
  remainingLabel: { color: '#1d4ed8' },
  cardTag: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    opacity: 0.85,
    overflow: 'hidden',
  },
  incomeTag: { backgroundColor: 'rgba(16,185,129,0.12)', color: '#15803d' },
  spentTag: { backgroundColor: 'rgba(239,68,68,0.12)', color: '#dc2626' },
  remainingTag: { backgroundColor: 'rgba(59,130,246,0.12)', color: '#1d4ed8' },
  cardValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  cardCurrency: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.6,
    fontFamily: 'JetBrains Mono',
  },
  cardValue: {
    fontFamily: 'JetBrains Mono',
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  incomeCurrency: { color: '#15803d' },
  spentCurrency: { color: '#dc2626' },
  remainingCurrency: { color: '#1d4ed8' },
  incomeValue: { color: '#14532d' },
  spentValue: { color: '#7f1d1d' },
  remainingValue: { color: '#1e3a8a' },
  cardDivider: {
    height: 1,
    marginVertical: 12,
    opacity: 0.15,
  },
  incomeDivider: { backgroundColor: '#16a34a' },
  spentDivider: { backgroundColor: '#ef4444' },
  remainingDivider: { backgroundColor: '#2563eb' },
  cardFooter: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.6,
  },
  incomeFooter: { color: '#15803d' },
  spentFooter: { color: '#dc2626' },
  remainingFooter: { color: '#1d4ed8' },
  cardOrb: {
    position: 'absolute',
    top: -28,
    right: -28,
    width: 90,
    height: 90,
    borderRadius: 999,
    opacity: 0.16,
    transform: [{ scale: 1 }],
  },
  incomeOrb: { backgroundColor: '#16a34a' },
  spentOrb: { backgroundColor: '#ef4444' },
  remainingOrb: { backgroundColor: '#2563eb' },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  /* legacy styles for other components (keep minimal to avoid override) */
  cardAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  statDesc: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  loanSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  // ── REMOVED old sectionHeader / loanCard / loanLabel / loanAmount / loanDesc ──
  // ── Phase 2: Compact loan styles ── ADDED THIS
  compactLoanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  compactLoanLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactLoanBalance: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  compactLoanRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactLoanCount: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  // ── Phase 2: Stats row styles ── ADDED THIS
  statRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  statRowItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statRowIncome: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  statRowAllocated: {
    backgroundColor: '#f5f3ff',
    borderColor: '#ddd6fe',
  },
  statRowFree: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  statRowFreeWarning: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  statRowValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  statRowValueWarning: {
    color: '#b91c1c',
  },
  statRowLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 2,
  },
  statRowLabelWarning: {
    color: '#b91c1c',
  },
  // ── Phase 2: Cash flow bar styles ── ADDED THIS
  cashFlowSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  cashFlowBarTrack: {
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  cashFlowBarFill: {
    height: '100%',
    backgroundColor: '#ef4444',
    borderRadius: 6,
  },
  cashFlowLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  cashFlowLeft: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  cashFlowLeftWarning: {
    color: '#b91c1c',
  },
  cashFlowRight: {
    fontSize: 12,
    color: '#6b7280',
  },
  actionsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  // ── Phase 3: Categories grid styles ──
  categoriesSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  emptyCategories: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    width: '30%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginTop: 12,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
})
