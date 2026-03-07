// @ts-nocheck
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { loanApi, type Loan, type LoanSummary } from '../services/loanApi'
import {
  borrowedLoanApi,
  type BorrowedLoan,
  type BorrowedLoanSummary,
} from '../services/borrowedLoanApi'
import { AddLoanModal } from '../components/AddLoanModal'
import { AddBorrowedLoanModal } from '../components/AddBorrowedLoanModal'
import { EditLoanModal } from '../components/EditLoanModal'
import { EditBorrowedLoanModal } from '../components/EditBorrowedLoanModal'
import { ConfirmModal } from '../components/ConfirmModal'
import {
  resolveConfirmAction,
  resolveLoansScreenFetchState,
  type LoansScreenConfirmModal,
} from './loanScreenLogic'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

type TabKey = 'mine' | 'lent'

const STATUS_CONFIG = {
  due_soon: {
    label: 'Due soon',
    color: '#b45309',
    bg: '#fef3c7',
    dot: '#f59e0b',
  },
  outstanding: {
    label: 'Outstanding',
    color: '#475569',
    bg: '#e2e8f0',
    dot: '#94a3b8',
  },
  overdue: {
    label: 'Overdue',
    color: '#b91c1c',
    bg: '#fee2e2',
    dot: '#ef4444',
  },
  repaid: {
    label: 'Repaid',
    color: '#047857',
    bg: '#d1fae5',
    dot: '#10b981',
  },
} as const

const BORROWED_STATUS_CONFIG = {
  due_soon: {
    label: 'Due soon',
    color: '#b45309',
    bg: '#fef3c7',
    dot: '#f59e0b',
  },
  active: {
    label: 'Active',
    color: '#047857',
    bg: '#d1fae5',
    dot: '#10b981',
  },
  overdue: {
    label: 'Overdue',
    color: '#b91c1c',
    bg: '#fee2e2',
    dot: '#ef4444',
  },
  paid_off: {
    label: 'Paid off',
    color: '#047857',
    bg: '#d1fae5',
    dot: '#10b981',
  },
} as const

function formatNOK(n: number) {
  return `NOK ${n.toLocaleString('en-US')}`
}

function formatRate(rate: number) {
  return `${rate.toLocaleString('en-US', {
    minimumFractionDigits: rate % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 2,
  })}%`
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return 'Not set'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function avatarColor(name: string) {
  const colors = ['#6366f1', '#ec4899', '#f97316', '#14b8a6', '#8b5cf6', '#0ea5e9']
  let hash = 0
  for (const char of name) hash = (hash + char.charCodeAt(0)) % colors.length
  return colors[hash]
}

function getDaysRemaining(loan: Loan) {
  if (loan.status === 'repaid' || loan.daysRemaining === null) return '--'
  return Math.max(0, loan.daysRemaining)
}

function getLoanNotes(loan: Loan) {
  return loan.notes?.trim() || ''
}

function getBorrowedLoanNotes(loan: BorrowedLoan) {
  return loan.notes?.trim() || ''
}

function getBorrowedPaidAmount(loan: BorrowedLoan) {
  return Math.max(0, loan.originalAmount - loan.currentBalance)
}

function getBorrowedPaidPercent(loan: BorrowedLoan) {
  if (!loan.originalAmount || loan.originalAmount <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((getBorrowedPaidAmount(loan) / loan.originalAmount) * 100)))
}

function getEstimatedInterestAmount(loan: BorrowedLoan) {
  if (!loan.interestRate || loan.interestRate <= 0) return 0
  return Math.round((loan.currentBalance * (loan.interestRate / 100 / 12)) * 100) / 100
}

function LentLoanCard({
  loan,
  onEdit,
  onMarkRepaid,
}: {
  loan: Loan
  onEdit: (loan: Loan) => void
  onMarkRepaid: (loan: Loan) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const status = STATUS_CONFIG[loan.status] ?? STATUS_CONFIG.outstanding
  const avatar = avatarColor(loan.recipient)

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpanded((prev) => !prev)
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={toggleExpanded}
      style={[
        styles.loanCard,
        expanded ? styles.loanCardExpanded : null,
        loan.status === 'repaid' ? styles.loanCardRepaid : null,
      ]}
    >
      <View style={styles.loanTopRow}>
        <View style={styles.loanIdentity}>
          <View style={[styles.avatar, { backgroundColor: avatar }]}>
            <Text style={styles.avatarText}>{getInitials(loan.recipient)}</Text>
          </View>
          <View style={styles.loanIdentityText}>
            <Text style={styles.loanName}>{loan.recipient}</Text>
            <Text style={styles.loanSubtext}>Given {formatDate(loan.dateGiven)}</Text>
          </View>
        </View>

        <View style={styles.loanRightBlock}>
          <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: status.dot }]} />
            <Text style={[styles.statusPillText, { color: status.color }]}>{status.label}</Text>
          </View>
          <Text style={styles.remainingAmount}>{formatNOK(loan.amount)}</Text>
        </View>
      </View>

      <View style={styles.metricRow}>
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>Amount</Text>
          <Text style={styles.metricValue}>{formatNOK(loan.amount)}</Text>
        </View>
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>Due date</Text>
          <Text style={styles.metricValue}>{formatDate(loan.expectedRepaymentDate)}</Text>
        </View>
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>Days left</Text>
          <Text
            style={[
              styles.metricValue,
              loan.status !== 'repaid' && typeof loan.daysRemaining === 'number' && loan.daysRemaining <= 7
                ? styles.metricValueWarning
                : null,
            ]}
          >
            {getDaysRemaining(loan)}
          </Text>
        </View>
      </View>

      {getLoanNotes(loan) ? (
        <View style={styles.notesBanner}>
          <Ionicons name="chatbubble-ellipses-outline" size={14} color="#a78bfa" />
          <Text style={styles.notesText} numberOfLines={2}>
            {getLoanNotes(loan)}
          </Text>
        </View>
      ) : null}

      {expanded ? (
        <View style={styles.loanExpandedSection}>
          <View style={styles.loanExpandedGrid}>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Created</Text>
              <Text style={styles.detailValue}>{formatDate(loan.createdAt)}</Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Updated</Text>
              <Text style={styles.detailValue}>{formatDate(loan.updatedAt)}</Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Repaid</Text>
              <Text style={styles.detailValue}>{formatDate(loan.repaidAt)}</Text>
            </View>
          </View>

          {loan.status !== 'repaid' ? (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={() => onEdit(loan)}
                activeOpacity={0.8}
              >
                <Ionicons name="pencil" size={15} color="#475569" />
                <Text style={styles.secondaryActionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryAction}
                onPress={() => onMarkRepaid(loan)}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text style={styles.primaryActionText}>Mark as repaid</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      ) : null}
    </TouchableOpacity>
  )
}

function getBorrowedDaysRemaining(loan: BorrowedLoan) {
  if (loan.status === 'paid_off' || loan.daysRemaining === null) return '--'
  return Math.max(0, loan.daysRemaining)
}

function BorrowedLoanCard({
  loan,
  onEdit,
  onDelete,
  onRecordPayment,
}: {
  loan: BorrowedLoan
  onEdit: (loan: BorrowedLoan) => void
  onDelete: (loan: BorrowedLoan) => void
  onRecordPayment: (loan: BorrowedLoan, paymentAmount: number, interestAmount: number) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [paymentPanelOpen, setPaymentPanelOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [interestAmount, setInterestAmount] = useState('0')
  const [paymentDate, setPaymentDate] = useState(getTodayIsoDate())
  const [isSavingPayment, setIsSavingPayment] = useState(false)
  const status = BORROWED_STATUS_CONFIG[loan.status] ?? BORROWED_STATUS_CONFIG.active
  const avatar = avatarColor(loan.lender)
  const paidAmount = getBorrowedPaidAmount(loan)
  const paidPercent = getBorrowedPaidPercent(loan)
  const presetAmounts = [500, 1000, 1500, 2000].filter((amount) => amount <= loan.currentBalance)
  const estimatedInterestAmount = getEstimatedInterestAmount(loan)
  const parsedPaymentAmount = Number(paymentAmount)
  const parsedInterestAmount = Number(interestAmount)
  const principalApplied =
    Number.isFinite(parsedPaymentAmount) && Number.isFinite(parsedInterestAmount)
      ? Math.max(0, parsedPaymentAmount - parsedInterestAmount)
      : 0

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpanded((prev) => !prev)
  }

  const togglePaymentPanel = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpanded(true)
    const nextOpenState = !paymentPanelOpen
    setPaymentPanelOpen(nextOpenState)
    if (nextOpenState) {
      if (!paymentAmount) {
        setPaymentAmount(String(Math.min(loan.currentBalance, 1500)))
      }
      setInterestAmount(String(estimatedInterestAmount))
      if (!paymentDate) {
        setPaymentDate(getTodayIsoDate())
      }
    }
  }

  const closePaymentPanel = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setPaymentPanelOpen(false)
    setPaymentAmount('')
    setInterestAmount('0')
    setPaymentDate(getTodayIsoDate())
  }

  const handleSavePayment = async () => {
    if (
      !Number.isFinite(parsedPaymentAmount) ||
      parsedPaymentAmount <= 0 ||
      !Number.isFinite(parsedInterestAmount) ||
      parsedInterestAmount < 0 ||
      parsedInterestAmount > parsedPaymentAmount ||
      principalApplied <= 0 ||
      principalApplied > loan.currentBalance ||
      !paymentDate
    ) {
      return
    }

    setIsSavingPayment(true)
    try {
      await onRecordPayment(loan, parsedPaymentAmount, parsedInterestAmount)
      closePaymentPanel()
    } finally {
      setIsSavingPayment(false)
    }
  }

  return (
    <View
      style={[
        styles.loanCard,
        styles.borrowedLoanCard,
        expanded ? styles.loanCardExpanded : null,
        loan.status === 'paid_off' ? styles.loanCardRepaid : null,
      ]}
    >
      <View style={styles.loanTopRow}>
        <View style={styles.loanIdentity}>
          <View style={[styles.avatar, styles.borrowedAvatar, { backgroundColor: avatar }]}>
            <Text style={styles.avatarText}>{getInitials(loan.lender)}</Text>
          </View>
          <View style={styles.loanIdentityText}>
            <Text style={[styles.loanName, styles.borrowedLoanName]}>{loan.lender}</Text>
            <Text style={styles.loanSubtext}>
              Original {formatNOK(loan.originalAmount)} · {formatRate(loan.interestRate)} APR
            </Text>
          </View>
        </View>

        <View style={styles.loanRightBlock}>
          <View style={[styles.statusPill, styles.borrowedStatusPill, { backgroundColor: status.bg, borderColor: status.dot }]}>
            <View style={[styles.statusDot, { backgroundColor: status.dot }]} />
            <Text style={[styles.statusPillText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.9} onPress={toggleExpanded}>
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Remaining balance</Text>
          <Text style={styles.balanceValue}>{formatNOK(loan.currentBalance)}</Text>
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>Principal paid</Text>
            <Text style={styles.progressLabel}>{formatNOK(paidAmount)}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${paidPercent}%` }]} />
          </View>
          <Text style={styles.progressPct}>{paidPercent}% of principal paid off</Text>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metricBlock}>
            <Text style={styles.metricLabel}>Balance</Text>
            <Text style={styles.metricValue}>{formatNOK(loan.currentBalance)}</Text>
          </View>
          <View style={styles.metricBlock}>
            <Text style={styles.metricLabel}>Payoff date</Text>
            <Text style={styles.metricValue}>{formatDate(loan.payoffDate)}</Text>
          </View>
          <View style={styles.metricBlock}>
            <Text style={styles.metricLabel}>Days left</Text>
            <Text
              style={[
                styles.metricValue,
                loan.status !== 'paid_off' &&
                typeof loan.daysRemaining === 'number' &&
                loan.daysRemaining <= 7
                  ? styles.metricValueWarning
                  : null,
              ]}
            >
              {getBorrowedDaysRemaining(loan)}
            </Text>
          </View>
        </View>

        {getBorrowedLoanNotes(loan) ? (
          <View style={[styles.notesBanner, styles.borrowedNotesBanner]}>
            <Ionicons name="document-text-outline" size={14} color="#64748b" />
            <Text style={styles.notesText} numberOfLines={2}>
              {getBorrowedLoanNotes(loan)}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>

      {expanded ? (
        <View style={styles.loanExpandedSection}>
          <View style={[styles.loanExpandedGrid, styles.borrowedFootGrid]}>
            <View style={[styles.detailCard, styles.borrowedFootCard]}>
              <Text style={styles.detailLabel}>Created</Text>
              <Text style={styles.detailValue}>{formatDate(loan.createdAt)}</Text>
            </View>
            <View style={[styles.detailCard, styles.borrowedFootCard]}>
              <Text style={styles.detailLabel}>Updated</Text>
              <Text style={styles.detailValue}>{formatDate(loan.updatedAt)}</Text>
            </View>
            <View style={[styles.detailCard, styles.borrowedFootCard]}>
              <Text style={styles.detailLabel}>
                {loan.status === 'paid_off' ? 'Paid off' : 'Last updated'}
              </Text>
              <Text style={styles.detailValue}>
                {formatDate(loan.status === 'paid_off' ? loan.paidOffAt : loan.updatedAt)}
              </Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            {loan.status !== 'paid_off' ? (
              <TouchableOpacity
                style={[styles.primaryAction, paymentPanelOpen ? styles.primaryActionOpen : null]}
                onPress={togglePaymentPanel}
                activeOpacity={0.8}
                disabled={isSavingPayment}
              >
                <Ionicons
                  name={paymentPanelOpen ? 'close' : 'checkmark-circle'}
                  size={16}
                  color={paymentPanelOpen ? '#854d0e' : '#15803d'}
                />
                <Text style={[styles.primaryActionText, paymentPanelOpen ? styles.primaryActionTextOpen : null]}>
                  {paymentPanelOpen ? 'Cancel payment' : 'Record payment'}
                </Text>
              </TouchableOpacity>
            ) : null}

            {loan.status !== 'paid_off' ? (
              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={() => onEdit(loan)}
                activeOpacity={0.8}
              >
                <Ionicons name="pencil" size={15} color="#475569" />
                <Text style={styles.secondaryActionText}>Edit</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.dangerAction}
                onPress={() => onDelete(loan)}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={16} color="#b91c1c" />
                <Text style={styles.dangerActionText}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>

          {loan.status !== 'paid_off' && paymentPanelOpen ? (
            <View style={styles.paymentPanel}>
              <Text style={styles.paymentPanelTitle}>Record payment</Text>
              <Text style={styles.paymentPanelHint}>
                Split the payment between interest and principal.
              </Text>

              <View style={styles.paymentPresets}>
                {presetAmounts.map((amount) => {
                  const isActive = paymentAmount === String(amount)

                  return (
                    <TouchableOpacity
                      key={amount}
                      style={[
                        styles.presetButton,
                        isActive ? styles.presetButtonActive : null,
                      ]}
                      onPress={() => setPaymentAmount(String(amount))}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.presetButtonText,
                          isActive ? styles.presetButtonTextActive : null,
                        ]}
                      >
                        {formatNOK(amount)}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              <View style={styles.paymentFieldsRow}>
                <View style={styles.paymentField}>
                  <Text style={styles.paymentFieldLabel}>Payment (NOK)</Text>
                  <TextInput
                    style={styles.paymentInput}
                    keyboardType="numeric"
                    value={paymentAmount}
                    onChangeText={setPaymentAmount}
                    placeholder="0"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <View style={styles.paymentField}>
                  <Text style={styles.paymentFieldLabel}>
                    Interest ({formatRate(loan.interestRate)} APR)
                  </Text>
                  <TextInput
                    style={styles.paymentInput}
                    keyboardType="numeric"
                    value={interestAmount}
                    onChangeText={setInterestAmount}
                    placeholder="0"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View style={styles.paymentFieldsRow}>
                <View style={styles.paymentField}>
                  <Text style={styles.paymentFieldLabel}>Date</Text>
                  <TextInput
                    style={styles.paymentInput}
                    value={paymentDate}
                    onChangeText={setPaymentDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="none"
                  />
                </View>
                <View style={[styles.paymentField, styles.paymentBreakdownCard]}>
                  <Text style={styles.paymentFieldLabel}>Principal applied</Text>
                  <Text style={styles.paymentBreakdownValue}>{formatNOK(principalApplied)}</Text>
                  <Text style={styles.paymentBreakdownHint}>
                    This is what reduces the balance.
                  </Text>
                </View>
              </View>

              <View style={styles.paymentPanelActions}>
                <TouchableOpacity
                  style={styles.paymentCancelButton}
                  onPress={closePaymentPanel}
                  activeOpacity={0.85}
                  disabled={isSavingPayment}
                >
                  <Text style={styles.paymentCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.paymentSaveButton,
                    !paymentAmount ||
                    principalApplied <= 0 ||
                    parsedInterestAmount > parsedPaymentAmount ||
                    principalApplied > loan.currentBalance ||
                    isSavingPayment
                      ? styles.paymentSaveButtonDisabled
                      : null,
                  ]}
                  onPress={handleSavePayment}
                  activeOpacity={0.85}
                  disabled={
                    !paymentAmount ||
                    principalApplied <= 0 ||
                    parsedInterestAmount > parsedPaymentAmount ||
                    principalApplied > loan.currentBalance ||
                    isSavingPayment
                  }
                >
                  <Text style={styles.paymentSaveButtonText}>
                    {isSavingPayment ? 'Saving...' : 'Save payment'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

function EmptyMineLoansState() {
  return (
    <View style={styles.placeholderCard}>
      <View style={styles.placeholderIcon}>
        <Ionicons name="business-outline" size={22} color="#1d4ed8" />
      </View>
      <Text style={styles.placeholderTitle}>No personal loans yet</Text>
      <Text style={styles.placeholderText}>
        Add a loan you owe to track your balance, due date, and payment history.
      </Text>
    </View>
  )
}

export function LoansScreen() {
  const [tab, setTab] = useState<TabKey>('lent')
  const [loans, setLoans] = useState<Loan[]>([])
  const [borrowedLoans, setBorrowedLoans] = useState<BorrowedLoan[]>([])
  const [summary, setSummary] = useState<LoanSummary | null>(null)
  const [borrowedSummary, setBorrowedSummary] = useState<BorrowedLoanSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [lentError, setLentError] = useState('')
  const [borrowedError, setBorrowedError] = useState('')
  const [refetching, setRefetching] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isAddBorrowedModalOpen, setIsAddBorrowedModalOpen] = useState(false)
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null)
  const [editingBorrowedLoan, setEditingBorrowedLoan] = useState<BorrowedLoan | null>(null)
  const [confirmModal, setConfirmModal] = useState<LoansScreenConfirmModal | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [repaidExpanded, setRepaidExpanded] = useState(false)
  const [paidOffExpanded, setPaidOffExpanded] = useState(false)

  const fetchLoans = async () => {
    setLentError('')
    setBorrowedError('')

    const [lentListResult, lentSummaryResult, borrowedListResult, borrowedSummaryResult] =
      await Promise.allSettled([
        loanApi.list(),
        loanApi.getSummary(),
        borrowedLoanApi.list(),
        borrowedLoanApi.getSummary(),
      ])

    const nextState = resolveLoansScreenFetchState({
      lentListResult,
      lentSummaryResult,
      borrowedListResult,
      borrowedSummaryResult,
    })

    setLoans(nextState.loans)
    setSummary(nextState.summary)
    setBorrowedLoans(nextState.borrowedLoans)
    setBorrowedSummary(nextState.borrowedSummary)
    setLentError(nextState.lentError)
    setBorrowedError(nextState.borrowedError)

    if (nextState.lentError) {
      console.error('Error loading lent loans:', nextState.lentError)
    }

    if (nextState.borrowedError) {
      console.error('Error loading borrowed loans:', nextState.borrowedError)
    }

    setLoading(false)
    setRefetching(false)
  }

  useEffect(() => {
    fetchLoans()
  }, [])

  const onRefresh = async () => {
    setRefetching(true)
    await fetchLoans()
  }

  const handleAddLoan = async (payload) => {
    await loanApi.create(payload)
    setIsAddModalOpen(false)
    await fetchLoans()
  }

  const handleEditLoan = async (id, payload) => {
    await loanApi.update(id, payload)
    setEditingLoan(null)
    await fetchLoans()
  }

  const handleAddBorrowedLoan = async (payload) => {
    await borrowedLoanApi.create(payload)
    setIsAddBorrowedModalOpen(false)
    await fetchLoans()
  }

  const handleEditBorrowedLoan = async (id, payload) => {
    await borrowedLoanApi.update(id, payload)
    setEditingBorrowedLoan(null)
    await fetchLoans()
  }

  const handleRecordBorrowedPayment = async (
    loan: BorrowedLoan,
    paymentAmount: number,
    interestAmount: number,
  ) => {
    const principalAmount = Math.max(0, paymentAmount - interestAmount)
    const nextBalance = Math.max(0, loan.currentBalance - principalAmount)

    await borrowedLoanApi.update(loan.id, { currentBalance: nextBalance })

    if (nextBalance === 0) {
      setPaidOffExpanded(true)
    }

    await fetchLoans()
  }

  const handleConfirmAction = async () => {
    if (!confirmModal) return
    setIsConfirming(true)
    try {
      const action = resolveConfirmAction(confirmModal)

      if (action.type === 'repaid') {
        await loanApi.markRepaid(action.id)
      } else if (action.type === 'paid-off') {
        await borrowedLoanApi.markPaidOff(action.id)
      } else {
        await borrowedLoanApi.remove(action.id)
      }
      setConfirmModal(null)
      await fetchLoans()
    } catch (e) {
      console.error('Confirm action failed:', e)
    } finally {
      setIsConfirming(false)
    }
  }

  const toggleRepaid = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setRepaidExpanded((prev) => !prev)
  }

  const togglePaidOff = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setPaidOffExpanded((prev) => !prev)
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    )
  }

  const activeLoans = loans.filter((loan) => loan.status !== 'repaid')
  const repaidLoans = loans.filter((loan) => loan.status === 'repaid')
  const activeBorrowedLoans = borrowedLoans.filter((loan) => loan.status !== 'paid_off')
  const paidOffBorrowedLoans = borrowedLoans.filter((loan) => loan.status === 'paid_off')
  const totalLent = summary?.totalOutstandingAmount ?? activeLoans.reduce((sum, loan) => sum + loan.amount, 0)
  const totalBorrowed =
    borrowedSummary?.totalCurrentBalance ??
    activeBorrowedLoans.reduce((sum, loan) => sum + loan.currentBalance, 0)
  const currentError = tab === 'mine' ? borrowedError : lentError
  const openAddModal = () => {
    if (tab === 'mine') {
      setIsAddBorrowedModalOpen(true)
      return
    }
    setIsAddModalOpen(true)
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refetching} onRefresh={onRefresh} tintColor="#1d4ed8" />
        }
      >
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroEyebrow}>Overview</Text>
              <Text style={styles.heroTitle}>Loans</Text>
            </View>
            <View style={styles.heroActions}>
              <TouchableOpacity
                style={styles.heroIconButton}
                onPress={onRefresh}
                disabled={refetching}
                activeOpacity={0.8}
              >
                {refetching ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="refresh" size={18} color="#fff" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.heroIconButton, styles.heroAddButton]}
                onPress={openAddModal}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={20} color="#0f172a" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryTile}>
              <Text style={styles.summaryTileLabel}>My loans</Text>
              <Text style={styles.summaryTileValue} numberOfLines={1}>
                {borrowedError ? 'Not loaded' : formatNOK(totalBorrowed)}
              </Text>
              <Text style={styles.summaryTileMeta}>
                {borrowedError ? 'Pull down to try again' : `${activeBorrowedLoans.length} active`}
              </Text>
            </View>
            <View style={styles.summaryTile}>
              <Text style={styles.summaryTileLabel}>Lent out</Text>
              <Text style={styles.summaryTileValue}>{formatNOK(totalLent)}</Text>
              <Text style={styles.summaryTileMeta}>{activeLoans.length} active</Text>
            </View>
          </View>
        </View>

        {currentError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color="#991b1b" />
            <Text style={styles.errorText}>{currentError}</Text>
          </View>
        ) : null}

        <View style={styles.tabWrap}>
          {[
            { key: 'mine' as const, label: 'My loans', icon: 'business-outline' as const },
            { key: 'lent' as const, label: 'Lent out', icon: 'swap-horizontal-outline' as const },
          ].map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.tabButton, tab === item.key ? styles.tabButtonActive : null]}
              onPress={() => setTab(item.key)}
              activeOpacity={0.85}
            >
              <Ionicons
                name={item.icon}
                size={16}
                color={tab === item.key ? '#0f172a' : '#64748b'}
              />
              <Text style={[styles.tabLabel, tab === item.key ? styles.tabLabelActive : null]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'mine' ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionHint}>{activeBorrowedLoans.length} active personal loans</Text>
                <Text style={styles.sectionTitle}>My loans</Text>
              </View>
              <TouchableOpacity
                style={styles.inlineAddButton}
                onPress={() => setIsAddBorrowedModalOpen(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={15} color="#fff" />
                <Text style={styles.inlineAddButtonText}>New loan</Text>
              </TouchableOpacity>
            </View>

            {activeBorrowedLoans.length > 0 ? (
              activeBorrowedLoans.map((loan) => (
                <BorrowedLoanCard
                  key={loan.id}
                  loan={loan}
                  onEdit={setEditingBorrowedLoan}
                  onRecordPayment={handleRecordBorrowedPayment}
                  onDelete={(selectedLoan) =>
                    setConfirmModal({ type: 'delete-borrowed', loan: selectedLoan })
                  }
                />
              ))
            ) : !borrowedError ? (
              <EmptyMineLoansState />
            ) : null}

            {paidOffBorrowedLoans.length > 0 ? (
              <View style={styles.repaidSection}>
                <TouchableOpacity style={styles.repaidHeader} onPress={togglePaidOff} activeOpacity={0.8}>
                  <View>
                    <Text style={styles.sectionHint}>History</Text>
                    <Text style={styles.sectionTitle}>Paid off loans ({paidOffBorrowedLoans.length})</Text>
                  </View>
                  <Ionicons
                    name={paidOffExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#64748b"
                  />
                </TouchableOpacity>

                {paidOffExpanded
                  ? paidOffBorrowedLoans.map((loan) => (
                      <BorrowedLoanCard
                        key={loan.id}
                        loan={loan}
                        onEdit={setEditingBorrowedLoan}
                        onRecordPayment={handleRecordBorrowedPayment}
                        onDelete={(selectedLoan) =>
                          setConfirmModal({ type: 'delete-borrowed', loan: selectedLoan })
                        }
                      />
                    ))
                  : null}
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionHint}>{activeLoans.length} active loans</Text>
                <Text style={styles.sectionTitle}>Lent out loans</Text>
              </View>
              <TouchableOpacity
                style={styles.inlineAddButton}
                onPress={() => setIsAddModalOpen(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={15} color="#fff" />
                <Text style={styles.inlineAddButtonText}>New loan</Text>
              </TouchableOpacity>
            </View>

            {activeLoans.length > 0 ? (
              activeLoans.map((loan) => (
                <LentLoanCard
                  key={loan.id}
                  loan={loan}
                  onEdit={setEditingLoan}
                  onMarkRepaid={(selectedLoan) =>
                    setConfirmModal({ type: 'repaid', loan: selectedLoan })
                  }
                />
              ))
            ) : !lentError ? (
              <View style={styles.placeholderCard}>
                <Ionicons name="document-text-outline" size={36} color="#cbd5e1" />
                <Text style={styles.placeholderTitle}>No active loans</Text>
                <Text style={styles.placeholderText}>
                  Add your first loan to start tracking due dates and repayments.
                </Text>
              </View>
            ) : null}

            {repaidLoans.length > 0 ? (
              <View style={styles.repaidSection}>
                <TouchableOpacity
                  style={styles.repaidHeader}
                  onPress={toggleRepaid}
                  activeOpacity={0.8}
                >
                  <View>
                    <Text style={styles.sectionHint}>History</Text>
                    <Text style={styles.sectionTitle}>Repaid loans ({repaidLoans.length})</Text>
                  </View>
                  <Ionicons
                    name={repaidExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#64748b"
                  />
                </TouchableOpacity>

                {repaidExpanded
                  ? repaidLoans.map((loan) => (
                      <LentLoanCard
                        key={loan.id}
                        loan={loan}
                        onEdit={setEditingLoan}
                        onMarkRepaid={(selectedLoan) =>
                          setConfirmModal({ type: 'repaid', loan: selectedLoan })
                        }
                      />
                    ))
                  : null}
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      <AddLoanModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddLoan}
      />

      <AddBorrowedLoanModal
        isOpen={isAddBorrowedModalOpen}
        onClose={() => setIsAddBorrowedModalOpen(false)}
        onSubmit={handleAddBorrowedLoan}
      />

      <EditLoanModal
        isOpen={editingLoan !== null}
        loan={editingLoan}
        onClose={() => setEditingLoan(null)}
        onSubmit={handleEditLoan}
      />

      <EditBorrowedLoanModal
        isOpen={editingBorrowedLoan !== null}
        loan={editingBorrowedLoan}
        onClose={() => setEditingBorrowedLoan(null)}
        onSubmit={handleEditBorrowedLoan}
      />

      <ConfirmModal
        isOpen={confirmModal !== null}
        title={
          confirmModal?.type === 'delete-borrowed'
            ? 'Delete personal loan?'
            : confirmModal?.type === 'paid-off'
            ? 'Mark as paid off?'
            : 'Mark as repaid?'
        }
        body={
          confirmModal?.type === 'delete-borrowed'
            ? `Are you sure you want to delete the loan from ${confirmModal.loan.lender}?`
            : confirmModal?.type === 'paid-off'
            ? `Are you sure the loan from ${confirmModal.loan.lender} has been paid off?`
            : `Are you sure the loan to ${confirmModal?.loan.recipient ?? ''} has been repaid?`
        }
        confirmText={
          confirmModal?.type === 'delete-borrowed'
            ? 'Delete loan'
            : confirmModal?.type === 'paid-off'
            ? 'Mark as paid off'
            : 'Mark as repaid'
        }
        cancelText="Cancel"
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmModal(null)}
        isConfirming={isConfirming}
        confirmDestructive={confirmModal?.type === 'delete-borrowed'}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    paddingBottom: 28,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  hero: {
    paddingTop: 28,
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: '#0f172a',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroEyebrow: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    color: '#94a3b8',
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#f8fafc',
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
  },
  heroIconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  heroAddButton: {
    backgroundColor: '#e2e8f0',
    borderColor: '#e2e8f0',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryTile: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  summaryTileLabel: {
    fontSize: 12,
    color: '#cbd5e1',
    marginBottom: 8,
  },
  summaryTileValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  summaryTileMeta: {
    marginTop: 6,
    fontSize: 11,
    color: '#94a3b8',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#991b1b',
    fontWeight: '600',
  },
  tabWrap: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    marginHorizontal: 18,
    marginTop: 18,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  tabLabelActive: {
    color: '#0f172a',
  },
  section: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  sectionHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  inlineAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    gap: 6,
  },
  inlineAddButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  loanCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  borrowedLoanCard: {
    borderRadius: 22,
    borderColor: '#dbe4ee',
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  loanCardExpanded: {
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  loanCardRepaid: {
    opacity: 0.82,
  },
  loanTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  loanIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  borrowedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  loanIdentityText: {
    flex: 1,
  },
  loanName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
  },
  borrowedLoanName: {
    fontSize: 22,
    lineHeight: 24,
  },
  loanSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  loanRightBlock: {
    alignItems: 'flex-end',
    gap: 10,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 6,
  },
  borrowedStatusPill: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  remainingAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
  },
  balanceSection: {
    marginTop: 18,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: '#0f172a',
  },
  progressWrap: {
    marginTop: 14,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#22c55e',
  },
  progressPct: {
    marginTop: 6,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 16,
  },
  metricBlock: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
  },
  metricLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  metricValueWarning: {
    color: '#d97706',
  },
  notesBanner: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  borrowedNotesBanner: {
    backgroundColor: '#f8fafc',
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  loanExpandedSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#eef2f7',
  },
  loanExpandedGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  borrowedFootGrid: {
    marginTop: 2,
  },
  detailCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
  },
  borrowedFootCard: {
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  detailLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  primaryAction: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 10,
    backgroundColor: '#ecfdf5',
  },
  primaryActionOpen: {
    backgroundColor: '#fef9c3',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  primaryActionTextOpen: {
    color: '#854d0e',
  },
  dangerAction: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 10,
    backgroundColor: '#fef2f2',
  },
  dangerActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#b91c1c',
  },
  paymentPanel: {
    marginTop: 14,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e8eef5',
  },
  paymentPanelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  paymentPanelHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 14,
  },
  paymentPresets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 12,
  },
  presetButton: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#d7e0ea',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  presetButtonActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  presetButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  presetButtonTextActive: {
    color: '#fff',
  },
  paymentFieldsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  paymentField: {
    flex: 1,
  },
  paymentBreakdownCard: {
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e8eef5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  paymentFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 5,
  },
  paymentInput: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#d7e0ea',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0f172a',
  },
  paymentBreakdownValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  paymentBreakdownHint: {
    marginTop: 4,
    fontSize: 11,
    color: '#94a3b8',
  },
  paymentPanelActions: {
    flexDirection: 'row',
    gap: 10,
  },
  paymentCancelButton: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#d7e0ea',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentCancelButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  paymentSaveButton: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentSaveButtonDisabled: {
    opacity: 0.55,
  },
  paymentSaveButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  placeholderCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 20,
    alignItems: 'center',
  },
  placeholderIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  placeholderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: '#64748b',
    textAlign: 'center',
  },
  repaidSection: {
    marginTop: 10,
  },
  repaidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
})
