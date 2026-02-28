// @ts-nocheck
import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface Loan {
  id: string
  name: string
  amount: number
  balance: number
  interest: number
  status: 'active' | 'paid'
}

export function LoansScreen() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock loans data - in production, fetch from API using loanApi.list()
    setTimeout(() => {
      setLoans([
        {
          id: '1',
          name: 'Car Loan',
          amount: 150000,
          balance: 85000,
          interest: 4.5,
          status: 'active',
        },
      ])
      setLoading(false)
    }, 500)
  }, [])

  const calculatePayoff = (balance: number, interest: number) => {
    // Simple calculation - months until payoff
    const monthlyPayment = (balance * (interest / 100)) / 12 + 3000
    return Math.ceil(balance / (monthlyPayment || 1))
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  const totalBalance = loans.reduce((sum, loan) => sum + loan.balance, 0)

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Loans</Text>
      </View>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Outstanding</Text>
          <Text style={styles.summaryAmount}>NOK {totalBalance.toLocaleString()}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Active Loans</Text>
          <Text style={styles.summaryValue}>{loans.filter((l) => l.status === 'active').length}</Text>
        </View>
      </View>

      {/* Loans List */}
      <View style={styles.loansSection}>
        <Text style={styles.sectionTitle}>Your Loans</Text>
        {loans.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No loans found</Text>
          </View>
        ) : (
          <FlatList
            scrollEnabled={false}
            data={loans}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.loanCard}>
                <View style={styles.loanHeader}>
                  <View>
                    <Text style={styles.loanName}>{item.name}</Text>
                    <Text style={styles.loanStatus}>
                      {item.status === 'active' ? 'Active' : 'Paid Off'}
                    </Text>
                  </View>
                  <View style={styles.interestBadge}>
                    <Text style={styles.badgeText}>{item.interest}%</Text>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${((item.amount - item.balance) / item.amount) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {Math.round(((item.amount - item.balance) / item.amount) * 100)}% Paid
                  </Text>
                </View>

                <View style={styles.loanDetails}>
                  <View style={styles.detail}>
                    <Text style={styles.detailLabel}>Original</Text>
                    <Text style={styles.detailValue}>NOK {item.amount.toLocaleString()}</Text>
                  </View>
                  <View style={styles.detail}>
                    <Text style={styles.detailLabel}>Balance</Text>
                    <Text style={styles.detailValue}>NOK {item.balance.toLocaleString()}</Text>
                  </View>
                  <View style={styles.detail}>
                    <Text style={styles.detailLabel}>Payoff</Text>
                    <Text style={styles.detailValue}>~{calculatePayoff(item.balance, item.interest)}mo</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.detailButton}>
                  <Text style={styles.detailButtonText}>View Details</Text>
                  <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* Add Loan Button */}
      <TouchableOpacity style={styles.addButton}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.addButtonText}>Add Loan</Text>
      </TouchableOpacity>

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
  summaryCard: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
  },
  loansSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
  },
  loanCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  loanName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  loanStatus: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  interestBadge: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3b82f6',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
  loanDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detail: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  detailButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  detailButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginRight: 4,
  },
  addButton: {
    marginHorizontal: 16,
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 16,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
})
