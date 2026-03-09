import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
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
import type { CreateLoanPayload, UpdateLoanPayload } from '../services/loanApi'
import {
  borrowedLoanApi,
  type BorrowedLoan,
  type BorrowedLoanSummary,
} from '../services/borrowedLoanApi'
import type { CreateBorrowedLoanPayload, UpdateBorrowedLoanPayload } from '../services/borrowedLoanApi'
import { AddLoanModal } from '../components/AddLoanModal'
import { AddBorrowedLoanModal } from '../components/AddBorrowedLoanModal'
import { EditLoanModal } from '../components/EditLoanModal'
import { EditBorrowedLoanModal } from '../components/EditBorrowedLoanModal'
import { ConfirmModal } from '../components/ConfirmModal'
import { ScreenHero } from '../components/ScreenHero'
import { useScreenPalette } from '../customthemes'
import { useNotifications } from '../context/NotificationContext'
import { notificationApi } from '../services/notificationApi'
import { loanReminderScheduler } from '../services/loanReminderScheduler'
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
    text: '#b45309',
    bg: '#fef3c7',
    dot: '#f59e0b',
  },
  outstanding: {
    label: 'Outstanding',
    text: '#475569',
    bg: '#e2e8f0',
    dot: '#94a3b8',
  },
  overdue: {
    label: 'Overdue',
    text: '#b91c1c',
    bg: '#fee2e2',
    dot: '#ef4444',
  },
  repaid: {
    label: 'Repaid',
    text: '#047857',
    bg: '#d1fae5',
    dot: '#10b981',
  },
} as const

const BORROWED_STATUS_CONFIG = {
  due_soon: {
    label: 'Due soon',
    text: '#b45309',
    bg: '#fef3c7',
    dot: '#f59e0b',
  },
  active: {
    label: 'Active',
    text: '#047857',
    bg: '#d1fae5',
    dot: '#10b981',
  },
  overdue: {
    label: 'Overdue',
    text: '#b91c1c',
    bg: '#fee2e2',
    dot: '#ef4444',
  },
  paid_off: {
    label: 'Paid off',
    text: '#047857',
    bg: '#d1fae5',
    dot: '#10b981',
  },
} as const

type ScreenPalette = ReturnType<typeof useScreenPalette>['colors']
type ThemeColors = ReturnType<typeof useScreenPalette>['activeTheme']['colors']

function getStatusTheme(
  statusConfig: { bg?: string; text?: string; border?: string; dot?: string },
  colors: ScreenPalette,
) {
  return {
    backgroundColor: statusConfig.bg ?? colors.chipBackground,
    color: statusConfig.text ?? colors.chipText,
    borderColor: statusConfig.border ?? colors.surfaceBorder,
    dotColor: statusConfig.dot ?? statusConfig.text ?? colors.chipText,
  }
}

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
  const { colors, activeTheme } = useScreenPalette()
  const styles = useMemo(() => createStyles(colors, activeTheme.colors), [activeTheme.colors, colors])
  const [expanded, setExpanded] = useState(false)
  const status = STATUS_CONFIG[loan.status] ?? STATUS_CONFIG.outstanding
  const statusTheme = getStatusTheme(status, colors)
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
          <View style={[styles.statusPill, { backgroundColor: statusTheme.backgroundColor }]}>
            <View style={[styles.statusDot, { backgroundColor: statusTheme.dotColor }]} />
            <Text style={[styles.statusPillText, { color: statusTheme.color }]}>{status.label}</Text>
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
          <Ionicons name="chatbubble-ellipses-outline" size={14} color={activeTheme.colors.accent} />
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
                <Ionicons name="pencil" size={15} color={colors.mutedText} />
                <Text style={styles.secondaryActionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryAction}
                onPress={() => onMarkRepaid(loan)}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={16} color={activeTheme.colors.success} />
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

function buildLoanRepaidNotificationPayload(loan: Loan) {
  return {
    id: loan.id,
    topic: 'loans' as const,
    kind: 'loan_repaid' as const,
    title: 'Loan repaid',
    body: `${loan.recipient} has repaid ${formatNOK(loan.amount)}.`,
    route: 'Loans' as const,
    entityId: loan.id,
    sentAt: new Date().toISOString(),
    data: {
      recipient: loan.recipient,
      amount: loan.amount,
      status: 'repaid',
    },
  }
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
  const { colors, activeTheme } = useScreenPalette()
  const styles = useMemo(() => createStyles(colors, activeTheme.colors), [activeTheme.colors, colors])
  const [expanded, setExpanded] = useState(false)
  const [paymentPanelOpen, setPaymentPanelOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [interestAmount, setInterestAmount] = useState('0')
  const [paymentDate, setPaymentDate] = useState(getTodayIsoDate())
  const [isSavingPayment, setIsSavingPayment] = useState(false)
  const status = BORROWED_STATUS_CONFIG[loan.status] ?? BORROWED_STATUS_CONFIG.active
  const statusTheme = getStatusTheme(status, colors)
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
          <View
            style={[
              styles.statusPill,
              styles.borrowedStatusPill,
              { backgroundColor: statusTheme.backgroundColor, borderColor: statusTheme.borderColor },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: statusTheme.dotColor }]} />
            <Text style={[styles.statusPillText, { color: statusTheme.color }]}>{status.label}</Text>
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
            <Ionicons name="document-text-outline" size={14} color={colors.mutedText} />
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
                  color={paymentPanelOpen ? activeTheme.colors.warning : activeTheme.colors.success}
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
                <Ionicons name="pencil" size={15} color={colors.mutedText} />
                <Text style={styles.secondaryActionText}>Edit</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.dangerAction}
                onPress={() => onDelete(loan)}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={16} color={activeTheme.colors.danger} />
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
                    placeholderTextColor={colors.mutedText}
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
                    placeholderTextColor={colors.mutedText}
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
                    placeholderTextColor={colors.mutedText}
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
  const { colors, activeTheme } = useScreenPalette()
  const styles = useMemo(() => createStyles(colors, activeTheme.colors), [activeTheme.colors, colors])

  return (
    <View style={styles.placeholderCard}>
      <View style={styles.placeholderIcon}>
        <Ionicons name="business-outline" size={22} color={activeTheme.colors.accent} />
      </View>
      <Text style={styles.placeholderTitle}>No personal loans yet</Text>
      <Text style={styles.placeholderText}>
        Add a loan you owe to track your balance, due date, and payment history.
      </Text>
    </View>
  )
}

export function LoansScreen() {
  const { activeTheme, colors } = useScreenPalette()
  const styles = useMemo(() => createStyles(colors, activeTheme.colors), [activeTheme.colors, colors])
  const { enablePushNotifications, permissionState, preferences } = useNotifications()
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

  useEffect(() => {
    if (loading) {
      return
    }

    if (!preferences.enabled || !preferences.topics.loans) {
      void loanReminderScheduler.clearAllAsync()
      return
    }

    void loanReminderScheduler.syncLoanDueSoonReminders(loans)
  }, [loading, loans, preferences.enabled, preferences.topics.loans])

  const onRefresh = async () => {
    setRefetching(true)
    await fetchLoans()
  }

  // ADDED THIS
  const maybePromptForLoanNotifications = () => {
    if (preferences.enabled) {
      return
    }

    Alert.alert(
      'Enable loan reminders?',
      'Turn on notifications to get future due soon and overdue loan alerts.',
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: permissionState === 'denied' ? 'Try again later' : 'Enable',
          onPress: () => {
            if (permissionState === 'denied') {
              return
            }

            void enablePushNotifications().then((enabled) => {
              if (!enabled) {
                Alert.alert(
                  'Notifications not enabled',
                  'You can always turn them on later from the Settings tab.',
                )
              }
            })
          },
        },
      ],
    )
  }

  const handleAddLoan = async (payload: CreateLoanPayload) => {
    const shouldPromptForNotifications = loans.length + borrowedLoans.length === 0 && !preferences.enabled
    await loanApi.create(payload)
    setIsAddModalOpen(false)
    await fetchLoans()

    if (shouldPromptForNotifications) {
      maybePromptForLoanNotifications()
    }
  }

  const handleEditLoan = async (id: string, payload: UpdateLoanPayload) => {
    await loanApi.update(id, payload)
    setEditingLoan(null)
    await fetchLoans()
  }

  const handleAddBorrowedLoan = async (payload: CreateBorrowedLoanPayload) => {
    const shouldPromptForNotifications = loans.length + borrowedLoans.length === 0 && !preferences.enabled
    await borrowedLoanApi.create(payload)
    setIsAddBorrowedModalOpen(false)
    await fetchLoans()

    if (shouldPromptForNotifications) {
      maybePromptForLoanNotifications()
    }
  }

  const handleEditBorrowedLoan = async (id: string, payload: UpdateBorrowedLoanPayload) => {
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
        const repaidLoan = await loanApi.markRepaid(action.id)
        if (preferences.enabled && preferences.topics.loans) {
          await notificationApi.scheduleNotificationAsync(
            buildLoanRepaidNotificationPayload(repaidLoan),
          )
        }
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
      <View style={[styles.centerContainer, { backgroundColor: activeTheme.colors.screenBackground }]}>
        <ActivityIndicator size="large" color={activeTheme.colors.accent} />
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
        style={[styles.container, { backgroundColor: activeTheme.colors.screenBackground }]}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refetching} onRefresh={onRefresh} tintColor={activeTheme.colors.accent} />
        }
      >
        <ScreenHero
          eyebrow="Overview"
          title="Loans"
          subtitle="Track what you owe and what you lent out in one place."
          theme={{
            gradient: activeTheme.colors.heroGradient,
            eyebrow: activeTheme.colors.heroEyebrow,
            title: activeTheme.colors.heroTitle,
            subtitle: activeTheme.colors.heroSubtitle,
          }}
          actions={
            <View style={styles.heroActions}>
              <TouchableOpacity
                style={[
                  styles.heroIconButton,
                  {
                    backgroundColor: activeTheme.colors.heroActionSurface,
                    borderColor: activeTheme.colors.heroActionBorder,
                  },
                ]}
                onPress={onRefresh}
                disabled={refetching}
                activeOpacity={0.8}
              >
                {refetching ? (
                  <ActivityIndicator size="small" color={activeTheme.colors.heroActionText} />
                ) : (
                  <Ionicons name="refresh" size={18} color={activeTheme.colors.heroActionText} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.heroIconButton,
                  {
                    backgroundColor: activeTheme.colors.accentSoft,
                    borderColor: activeTheme.colors.accentLine,
                  },
                ]}
                onPress={openAddModal}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={20} color={activeTheme.colors.accent} />
              </TouchableOpacity>
            </View>
          }
        >
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryTile, { backgroundColor: activeTheme.colors.heroCardSurface, borderColor: activeTheme.colors.heroCardBorder }]}>
              <Text style={[styles.summaryTileLabel, { color: activeTheme.colors.heroSubtitle }]}>My loans</Text>
              <Text style={[styles.summaryTileValue, { color: activeTheme.colors.heroTitle }]} numberOfLines={1}>
                {borrowedError ? 'Not loaded' : formatNOK(totalBorrowed)}
              </Text>
              <Text style={[styles.summaryTileMeta, { color: activeTheme.colors.heroSubtitle }]}>
                {borrowedError ? 'Pull down to try again' : `${activeBorrowedLoans.length} active`}
              </Text>
            </View>
            <View style={[styles.summaryTile, { backgroundColor: activeTheme.colors.heroCardSurface, borderColor: activeTheme.colors.heroCardBorder }]}>
              <Text style={[styles.summaryTileLabel, { color: activeTheme.colors.heroSubtitle }]}>Lent out</Text>
              <Text style={[styles.summaryTileValue, { color: activeTheme.colors.heroTitle }]}>{formatNOK(totalLent)}</Text>
              <Text style={[styles.summaryTileMeta, { color: activeTheme.colors.heroSubtitle }]}>{activeLoans.length} active</Text>
            </View>
          </View>
        </ScreenHero>

        {currentError ? (
          <View style={[styles.errorBanner, { backgroundColor: `${activeTheme.colors.danger}12`, borderColor: `${activeTheme.colors.danger}4D` }]}>
            <Ionicons name="alert-circle" size={16} color={activeTheme.colors.danger} />
            <Text style={[styles.errorText, { color: activeTheme.colors.danger }]}>{currentError}</Text>
          </View>
        ) : null}

        <View style={styles.tabWrap}>
          {[
            { key: 'mine' as const, label: 'My loans', icon: 'business-outline' as const },
            { key: 'lent' as const, label: 'Lent out', icon: 'swap-horizontal-outline' as const },
          ].map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.tabButton,
                {
                  backgroundColor: activeTheme.colors.surface,
                  borderColor: activeTheme.colors.surfaceBorder,
                },
                tab === item.key
                  ? {
                      backgroundColor: activeTheme.colors.accentSoft,
                      borderColor: activeTheme.colors.accentLine,
                    }
                  : null,
              ]}
              onPress={() => setTab(item.key)}
              activeOpacity={0.85}
            >
              <Ionicons
                name={item.icon}
                size={16}
                color={tab === item.key ? activeTheme.colors.accent : activeTheme.colors.mutedText}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: activeTheme.colors.mutedText },
                  tab === item.key ? { color: activeTheme.colors.accent } : null,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'mine' ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionHint, { color: activeTheme.colors.mutedText }]}>{activeBorrowedLoans.length} active personal loans</Text>
                <Text style={[styles.sectionTitle, { color: activeTheme.colors.text }]}>My loans</Text>
              </View>
              <TouchableOpacity
                style={[styles.inlineAddButton, { backgroundColor: activeTheme.colors.accentSoft, borderColor: activeTheme.colors.accentLine }]}
                onPress={() => setIsAddBorrowedModalOpen(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={15} color={activeTheme.colors.accent} />
                <Text style={[styles.inlineAddButtonText, { color: activeTheme.colors.accent }]}>New loan</Text>
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
                    <Text style={[styles.sectionHint, { color: activeTheme.colors.mutedText }]}>History</Text>
                    <Text style={[styles.sectionTitle, { color: activeTheme.colors.text }]}>Paid off loans ({paidOffBorrowedLoans.length})</Text>
                  </View>
                  <Ionicons
                    name={paidOffExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={activeTheme.colors.mutedText}
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
                <Text style={[styles.sectionHint, { color: activeTheme.colors.mutedText }]}>{activeLoans.length} active loans</Text>
                <Text style={[styles.sectionTitle, { color: activeTheme.colors.text }]}>Lent out loans</Text>
              </View>
              <TouchableOpacity
                style={[styles.inlineAddButton, { backgroundColor: activeTheme.colors.accentSoft, borderColor: activeTheme.colors.accentLine }]}
                onPress={() => setIsAddModalOpen(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={15} color={activeTheme.colors.accent} />
                <Text style={[styles.inlineAddButtonText, { color: activeTheme.colors.accent }]}>New loan</Text>
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
              <View style={[styles.placeholderCard, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.surfaceBorder }]}>
                <Ionicons name="document-text-outline" size={36} color={activeTheme.colors.subtleText} />
                <Text style={[styles.placeholderTitle, { color: activeTheme.colors.text }]}>No active loans</Text>
                <Text style={[styles.placeholderText, { color: activeTheme.colors.mutedText }]}>
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
                    <Text style={[styles.sectionHint, { color: activeTheme.colors.mutedText }]}>History</Text>
                    <Text style={[styles.sectionTitle, { color: activeTheme.colors.text }]}>Repaid loans ({repaidLoans.length})</Text>
                  </View>
                  <Ionicons
                    name={repaidExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={activeTheme.colors.mutedText}
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

function createStyles(colors: ScreenPalette, themeColors: ThemeColors) {
  const cardBackground = colors.cardBackground ?? colors.surfaceAlt
  const textPrimary = (colors as ScreenPalette & { textPrimary?: string }).textPrimary ?? themeColors.text

  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.screenBackground,
  },
  contentContainer: {
    paddingBottom: 28,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themeColors.screenBackground,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
  },
  heroIconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryTile: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  summaryTileLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  summaryTileValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  summaryTileMeta: {
    marginTop: 6,
    fontSize: 11,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  tabWrap: {
    flexDirection: 'row',
    backgroundColor: themeColors.surfaceAlt,
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
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
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
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  inlineAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    gap: 6,
  },
  inlineAddButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loanCard: {
    backgroundColor: cardBackground,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: themeColors.surfaceBorder,
    shadowColor: colors.cardShadow,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  borrowedLoanCard: {
    borderRadius: 22,
    borderColor: themeColors.surfaceBorder,
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
    color: textPrimary,
  },
  borrowedLoanName: {
    fontSize: 22,
    lineHeight: 24,
  },
  loanSubtext: {
    fontSize: 12,
    color: colors.mutedText,
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
    color: textPrimary,
  },
  balanceSection: {
    marginTop: 18,
  },
  balanceLabel: {
    fontSize: 12,
    color: colors.mutedText,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: textPrimary,
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
    color: colors.mutedText,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: themeColors.progressTrack,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: themeColors.success,
  },
  progressPct: {
    marginTop: 6,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '700',
    color: themeColors.success,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 16,
  },
  metricBlock: {
    flex: 1,
    backgroundColor: themeColors.surfaceAlt,
    borderRadius: 12,
    padding: 10,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.mutedText,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: textPrimary,
  },
  metricValueWarning: {
    color: themeColors.warning,
  },
  notesBanner: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    backgroundColor: themeColors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  borrowedNotesBanner: {
    backgroundColor: themeColors.surfaceAlt,
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    color: colors.mutedText,
    fontWeight: '500',
  },
  loanExpandedSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
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
    backgroundColor: themeColors.surfaceAlt,
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
    color: colors.mutedText,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: textPrimary,
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
    borderColor: themeColors.surfaceBorder,
    borderRadius: 12,
    paddingVertical: 10,
    backgroundColor: cardBackground,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.mutedText,
  },
  primaryAction: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 10,
    backgroundColor: themeColors.secondarySoft,
  },
  primaryActionOpen: {
    backgroundColor: `${themeColors.warning}20`,
    borderWidth: 1,
    borderColor: `${themeColors.warning}55`,
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: themeColors.success,
  },
  primaryActionTextOpen: {
    color: themeColors.warning,
  },
  dangerAction: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 10,
    backgroundColor: `${themeColors.danger}14`,
  },
  dangerActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: themeColors.danger,
  },
  paymentPanel: {
    marginTop: 14,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  paymentPanelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: textPrimary,
    marginBottom: 4,
  },
  paymentPanelHint: {
    fontSize: 12,
    color: colors.mutedText,
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
    borderColor: themeColors.surfaceBorder,
    backgroundColor: cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  presetButtonActive: {
    backgroundColor: themeColors.accent,
    borderColor: themeColors.accent,
  },
  presetButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mutedText,
  },
  presetButtonTextActive: {
    color: themeColors.heroTitle,
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
    backgroundColor: themeColors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  paymentFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mutedText,
    marginBottom: 5,
  },
  paymentInput: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: themeColors.surfaceBorder,
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 12,
    fontSize: 14,
    color: textPrimary,
  },
  paymentBreakdownValue: {
    fontSize: 18,
    fontWeight: '800',
    color: textPrimary,
  },
  paymentBreakdownHint: {
    marginTop: 4,
    fontSize: 11,
    color: colors.mutedText,
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
    borderColor: themeColors.surfaceBorder,
    backgroundColor: cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentCancelButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.mutedText,
  },
  paymentSaveButton: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: themeColors.accent,
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
    backgroundColor: cardBackground,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: themeColors.surfaceBorder,
    padding: 20,
    alignItems: 'center',
  },
  placeholderIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: themeColors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  placeholderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: textPrimary,
    textAlign: 'center',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: colors.mutedText,
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
}
