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
import { dashboardApi, type DashboardData } from '../services/dashboardApi'
import { usePeriod } from '../context/PeriodContext'
import { MonthPickerModal } from '../components/MonthPickerModal'

export function HomeScreen() {
  const { selectedMonth, setSelectedMonth } = usePeriod()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMonthPickerVisible, setMonthPickerVisible] = useState(false)

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
      void err
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

      {/* Summary Cards */}
      <View style={styles.summarySection}>
        {/* Income Card */}
        <View style={[styles.card, styles.incomeCard]}>
          <View style={styles.cardHeader}>
            <Ionicons name="arrow-down" size={20} color="#10b981" />
            <Text style={styles.cardLabel}>Income</Text>
          </View>
          <Text style={styles.cardAmount}>NOK {dashboard.totalIncome.toLocaleString()}</Text>
        </View>

        {/* Spent Card */}
        <View style={[styles.card, styles.spentCard]}>
          <View style={styles.cardHeader}>
            <Ionicons name="arrow-up" size={20} color="#ef4444" />
            <Text style={styles.cardLabel}>Spent</Text>
          </View>
          <Text style={styles.cardAmount}>NOK {dashboard.totalSpent.toLocaleString()}</Text>
        </View>

        {/* Remaining Card */}
        <View style={[styles.card, styles.remainingCard]}>
          <View style={styles.cardHeader}>
            <Ionicons name="wallet" size={20} color="#3b82f6" />
            <Text style={styles.cardLabel}>Remaining</Text>
          </View>
          <Text style={styles.cardAmount}>NOK {dashboard.remaining.toLocaleString()}</Text>
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

      {/* Loan Balance */}
      <View style={styles.loanSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Loans</Text>
          <TouchableOpacity>
            <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>
        <View style={styles.loanCard}>
          <Text style={styles.loanLabel}>Total Loan Balance</Text>
          <Text style={styles.loanAmount}>NOK {dashboard.loanBalance.toLocaleString()}</Text>
          <Text style={styles.loanDesc}>
            {dashboard.activeLoans} active {dashboard.activeLoans === 1 ? 'loan' : 'loans'}
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="add-circle" size={28} color="#3b82f6" />
            <Text style={styles.actionLabel}>Add Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="arrow-up-circle" size={28} color="#10b981" />
            <Text style={styles.actionLabel}>Add Income</Text>
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
    borderRadius: 12,
    marginBottom: 12,
  },
  incomeCard: {
    backgroundColor: '#ecfdf5',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  spentCard: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  remainingCard: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 8,
    fontWeight: '600',
  },
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  loanCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  loanLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  loanAmount: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginVertical: 8,
  },
  loanDesc: {
    fontSize: 12,
    color: '#9ca3af',
  },
  actionsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
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
