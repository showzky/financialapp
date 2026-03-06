// @ts-nocheck
import React, { useEffect, useState, useFocusEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native'

// ADDED THIS — LayoutAnimation needs to be explicitly enabled on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}
import { Ionicons } from '@expo/vector-icons'
import { loanApi, type Loan, type LoanSummary } from '../services/loanApi'
import { AddLoanModal } from '../components/AddLoanModal' // ADDED THIS
import { EditLoanModal } from '../components/EditLoanModal' // ADDED THIS
import { ConfirmModal } from '../components/ConfirmModal' // ADDED THIS

export function LoansScreen() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [summary, setSummary] = useState<LoanSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [refetching, setRefetching] = useState(false)

  // ADDED THIS — modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null)
  // confirmModal holds the type + subject loan for the ConfirmModal
  const [confirmModal, setConfirmModal] = useState<{ type: 'repaid'; loan: Loan } | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  // ADDED THIS — repaid section is collapsed by default
  const [repaidExpanded, setRepaidExpanded] = useState(false)

  const toggleRepaid = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setRepaidExpanded((prev) => !prev)
  }

  const fetchLoans = async () => {
    try {
      setError('')
      const [loansData, summaryData] = await Promise.all([loanApi.list(), loanApi.getSummary()])
      setLoans(loansData)
      setSummary(summaryData)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load loans'
      setError(msg)
      console.error('Error loading loans:', msg)
    } finally {
      setLoading(false)
      setRefetching(false)
    }
  }

  useEffect(() => {
    fetchLoans()
  }, [])

  const onRefresh = async () => {
    setRefetching(true)
    await fetchLoans()
  }

  // ADDED THIS — create a new loan, then refresh
  const handleAddLoan = async (payload) => {
    await loanApi.create(payload)
    setIsAddModalOpen(false)
    await fetchLoans()
  }

  // ADDED THIS — update an existing loan, then refresh
  const handleEditLoan = async (id, payload) => {
    await loanApi.update(id, payload)
    setEditingLoan(null)
    await fetchLoans()
  }

  // ADDED THIS — mark loan as repaid after confirmation, then refresh
  const handleConfirmAction = async () => {
    if (!confirmModal) return
    setIsConfirming(true)
    try {
      if (confirmModal.type === 'repaid') {
        await loanApi.markRepaid(confirmModal.loan.id)
      }
      setConfirmModal(null)
      await fetchLoans()
    } catch (e) {
      console.error('Confirm action failed:', e)
    } finally {
      setIsConfirming(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'outstanding':
        return { bg: '#f3f4f6', text: '#374151', badge: '#e5e7eb' }
      case 'due_soon':
        return { bg: '#fef3c7', text: '#92400e', badge: '#fcd34d' }
      case 'overdue':
        return { bg: '#fee2e2', text: '#991b1b', badge: '#fca5a5' }
      case 'repaid':
        return { bg: '#ecfdf5', text: '#065f46', badge: '#a7f3d0' }
      default:
        return { bg: '#f3f4f6', text: '#374151', badge: '#e5e7eb' }
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'outstanding':
        return 'Outstanding'
      case 'due_soon':
        return 'Due Soon'
      case 'overdue':
        return 'Overdue'
      case 'repaid':
        return 'Repaid'
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('nb-NO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  const getDaysRemaining = (loan: Loan) => {
    if (loan.status === 'repaid' || loan.daysRemaining === null) {
      return '--'
    }
    return Math.max(0, loan.daysRemaining)
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  const activeLoans = loans.filter((l) => l.status !== 'repaid')
  const repaidLoans = loans.filter((l) => l.status === 'repaid')

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <TouchableOpacity
          onPress={onRefresh}
          disabled={refetching}
          style={styles.refreshButton}
        >
          {refetching ? (
            <ActivityIndicator color="#3b82f6" />
          ) : (
            <Ionicons name="refresh" size={20} color="#3b82f6" />
          )}
        </TouchableOpacity>
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Loans</Text>
        {/* ADDED THIS — header action buttons */}
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerAddButton} onPress={() => setIsAddModalOpen(true)}>
            <Ionicons name="add-circle" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onRefresh} disabled={refetching}>
            {refetching ? (
              <ActivityIndicator color="#3b82f6" />
            ) : (
              <Ionicons name="refresh" size={24} color="#6b7280" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Error Banner */}
      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color="#dc2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Summary Stats */}
      {summary ? (
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryLabel}>Total Outstanding</Text>
              <Text style={styles.summaryAmount}>
                NOK {summary.totalOutstandingAmount.toLocaleString()}
              </Text>
            </View>
            <TouchableOpacity style={styles.addLoanButton} onPress={() => setIsAddModalOpen(true)}>{/* CHANGED THIS */}
              <Ionicons name="add-circle" size={24} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{summary.activeCount}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#f59e0b' }]}>
                {summary.dueSoonCount}
              </Text>
              <Text style={styles.statLabel}>Due Soon</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#dc2626' }]}>
                {summary.overdueCount}
              </Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#10b981' }]}>
                {summary.repaidCount}
              </Text>
              <Text style={styles.statLabel}>Repaid</Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* Active Loans Section */}
      {activeLoans.length > 0 ? (
        <View style={styles.loansSection}>
          <Text style={styles.sectionTitle}>Active Loans</Text>
          {activeLoans.map((loan) => {
            const colors = getStatusColor(loan.status)
            return (
              <TouchableOpacity key={loan.id} style={[styles.loanCard, { borderLeftColor: colors.badge }]}>
                <View style={styles.loanHeader}>
                  <View style={styles.loanTitleWrapper}>
                    <Text style={styles.loanRecipient}>{loan.recipient}</Text>
                    <Text style={styles.loanDate}>
                      Given {formatDate(loan.dateGiven)}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: colors.badge }]}>
                    <Text style={[styles.statusText, { color: colors.text }]}>
                      {getStatusLabel(loan.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.loanMetrics}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Amount</Text>
                    <Text style={styles.metricValue}>
                      NOK {loan.amount.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Due Date</Text>
                    <Text style={styles.metricValue}>
                      {formatDate(loan.expectedRepaymentDate)}
                    </Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Days Left</Text>
                    <Text style={styles.metricValue}>{getDaysRemaining(loan)}</Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => setEditingLoan(loan)}>{/* CHANGED THIS */}
                    <Ionicons name="pencil" size={16} color="#3b82f6" />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.markRepaidButton]} onPress={() => setConfirmModal({ type: 'repaid', loan })}>{/* CHANGED THIS */}
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={[styles.actionButtonText, { color: '#10b981' }]}>Mark Repaid</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      ) : null}

      {/* CHANGED THIS — Repaid Loans Section: collapsible, collapsed by default */}
      {repaidLoans.length > 0 ? (
        <View style={styles.loansSection}>
          {/* Toggle header */}
          <TouchableOpacity style={styles.collapsibleHeader} onPress={toggleRepaid} activeOpacity={0.7}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
              Repaid Loans ({repaidLoans.length})
            </Text>
            <Ionicons
              name={repaidExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#6b7280"
            />
          </TouchableOpacity>

          {/* Content — rendered only when expanded so LayoutAnimation can animate its appearance */}
          {repaidExpanded ? (
            <View>
              {repaidLoans.map((loan) => {
                const colors = getStatusColor(loan.status)
                return (
                  <TouchableOpacity
                    key={loan.id}
                    style={[styles.loanCard, { opacity: 0.7 }, { borderLeftColor: colors.badge }]}
                  >
                    <View style={styles.loanHeader}>
                      <View style={styles.loanTitleWrapper}>
                        <Text style={[styles.loanRecipient, { color: '#9ca3af' }]}>
                          {loan.recipient}
                        </Text>
                        <Text style={styles.loanDate}>
                          Repaid {loan.repaidAt ? formatDate(loan.repaidAt) : 'N/A'}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: colors.badge }]}>
                        <Text style={[styles.statusText, { color: colors.text }]}>
                          {getStatusLabel(loan.status)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.loanMetrics}>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Amount</Text>
                        <Text style={styles.metricValue}>
                          NOK {loan.amount.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Empty State */}
      {loans.length === 0 && !error ? (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="document-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyStateTitle}>No Loans Yet</Text>
          <Text style={styles.emptyStateText}>
            Start tracking loans by adding your first loan
          </Text>
          <TouchableOpacity style={styles.emptyStateButton} onPress={() => setIsAddModalOpen(true)}>{/* CHANGED THIS */}
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.emptyStateButtonText}>Add Loan</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={{ height: 32 }} />

      {/* ADDED THIS — modals rendered inside ScrollView; Modal is a portal so position doesn't matter */}
      <AddLoanModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddLoan}
      />

      <EditLoanModal
        isOpen={editingLoan !== null}
        loan={editingLoan}
        onClose={() => setEditingLoan(null)}
        onSubmit={handleEditLoan}
      />

      <ConfirmModal
        isOpen={confirmModal !== null}
        title="Mark as Repaid?"
        body={`Are you sure you want to mark the loan to ${confirmModal?.loan.recipient ?? ''} as repaid?`}
        confirmText="Mark Repaid"
        cancelText="Cancel"
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmModal(null)}
        isConfirming={isConfirming}
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
  refreshButton: {
    padding: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  // ADDED THIS
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAddButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  errorText: {
    fontSize: 13,
    color: '#991b1b',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  summaryCard: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  summaryAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  addLoanButton: {
    padding: 8,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e5e7eb',
  },
  loansSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  // ADDED THIS
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 2,
  },
  loanCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 4,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  loanTitleWrapper: {
    flex: 1,
    marginRight: 8,
  },
  loanRecipient: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  loanDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  loanMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#e5e7eb',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0f2fe',
    gap: 4,
  },
  markRepaidButton: {
    backgroundColor: '#ecfdf5',
    borderColor: '#d1fae5',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3b82f6',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
    gap: 6,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
})

