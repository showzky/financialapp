// @ts-nocheck
import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

type RootStackParamList = {
  Home: undefined
}

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>

interface DashboardData {
  totalIncome: number
  totalSpent: number
  remaining: number
  categoryCount: number
  loanBalance: number
}

export function HomeScreen({ navigation }: Props) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock dashboard data - in production, fetch from your API
    setTimeout(() => {
      setDashboard({
        totalIncome: 50000,
        totalSpent: 18500,
        remaining: 31500,
        categoryCount: 12,
        loanBalance: 85000,
      })
      setLoading(false)
    }, 500)
  }, [])

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  if (!dashboard) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load dashboard</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Financial Overview</Text>
        <Ionicons name="settings" size={24} color="#333" />
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
          <Text style={styles.statLabel}>1</Text>
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
          <Text style={styles.loanDesc}>1 active loan</Text>
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
  },
})
