import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { ConfirmModal } from '../ConfirmModal'
import type { BorrowedLoanPaymentEntry, BorrowedLoanPlanItem } from './types'

type Props = {
  visible: boolean
  item: BorrowedLoanPlanItem | null
  onClose: () => void
  onEdit: (item: BorrowedLoanPlanItem) => void
  onMarkPaidOff: (itemId: string) => void | Promise<void>
  onRegisterPayment: (itemId: string, payment: BorrowedLoanPaymentEntry) => void | Promise<void>
  onDelete: (itemId: string) => void | Promise<void>
}

function formatKr(value: number) {
  return `KR ${value.toLocaleString('nb-NO')}`
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function BorrowedLoanDetailModal({ visible, item, onClose, onEdit, onMarkPaidOff, onRegisterPayment, onDelete }: Props) {
  // Keep the last non-null item alive during the slide-out close animation
  const lastItemRef = useRef<BorrowedLoanPlanItem | null>(null)
  if (item) lastItemRef.current = item
  const safeItem = item ?? lastItemRef.current

  const [menuVisible, setMenuVisible] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [paymentVisible, setPaymentVisible] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [interestAmount, setInterestAmount] = useState('')
  const [paymentError, setPaymentError] = useState('')

  // Reset modal-local UI when switching loans or reopening the same loan
  useEffect(() => {
    setMenuVisible(false)
    setDeleteModalVisible(false)
    setPaymentVisible(false)
    setPaymentAmount('')
    setInterestAmount('')
    setPaymentError('')
  }, [item?.id, visible])

  const paid = useMemo(() => {
    if (!safeItem) return 0
    return Math.max(safeItem.originalAmount - safeItem.currentBalance, 0)
  }, [safeItem])

  const progress = useMemo(() => {
    if (!safeItem || safeItem.originalAmount === 0) return 0
    return Math.min(paid / safeItem.originalAmount, 1)
  }, [safeItem, paid])

  const isPaidOff = safeItem ? safeItem.currentBalance === 0 : false
  const progressPercent = isPaidOff ? 100 : Math.min(Math.floor(progress * 100), 99)

  // Estimated monthly interest pre-fill (balance × APR / 12)
  const estimatedMonthlyInterest = safeItem
    ? Math.round(safeItem.currentBalance * (safeItem.interestRate / 100 / 12) * 100) / 100
    : 0

  const presetAmounts = [500, 1000, 2000, 5000].filter(
    (a) => safeItem && a <= safeItem.currentBalance,
  )

  const paymentNum = Number(paymentAmount)
  const interestNum = Number(interestAmount)
  const principalApplied =
    Number.isFinite(paymentNum) && Number.isFinite(interestNum)
      ? Math.max(0, paymentNum - interestNum)
      : 0

  const isPaymentValid =
    Number.isFinite(paymentNum) &&
    paymentNum > 0 &&
    Number.isFinite(interestNum) &&
    interestNum >= 0 &&
    interestNum <= paymentNum &&
    principalApplied > 0 &&
    safeItem !== null &&
    principalApplied <= safeItem.currentBalance

  const openPaymentPanel = () => {
    if (!safeItem) return
    setPaymentVisible(true)
    setPaymentAmount(String(Math.min(safeItem.currentBalance, 1500)))
    setInterestAmount(String(estimatedMonthlyInterest))
    setPaymentError('')
  }

  const handleRegisterPayment = async () => {
    if (!safeItem) return
    if (!isPaymentValid) {
      setPaymentError(
        principalApplied > (safeItem?.currentBalance ?? 0)
          ? 'Principal exceeds current balance'
          : 'Check payment and interest amounts',
      )
      return
    }
    setPaymentError('')
    await onRegisterPayment(safeItem.id, {
      id: `pmt-${Date.now()}`,
      amount: paymentNum,
      principalPortion: principalApplied,
      interestPortion: interestNum,
      date: new Date().toISOString(),
    })
    setPaymentAmount('')
    setInterestAmount('')
    setPaymentVisible(false)
  }

  const handleDeletePress = () => {
    if (!safeItem) return
    setMenuVisible(false)
    setDeleteModalVisible(true)
  }

  if (!safeItem) return null
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        <LinearGradient
          colors={['#0D1120', '#0A0A0E', '#0D1017', '#0A0A0E']}
          locations={[0, 0.28, 0.64, 1]}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(55,90,200,0.34)', 'rgba(34,68,160,0.12)', 'transparent']}
          locations={[0, 0.42, 1]}
          style={styles.heroGlow}
        />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIcon} activeOpacity={0.85} onPress={onClose}>
            <Ionicons name="arrow-back" size={18} color="rgba(245,248,253,0.82)" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerPill}
              activeOpacity={0.85}
              onPress={() => setMenuVisible((current) => !current)}
            >
              <Ionicons name="pencil-outline" size={14} color="#F5F8FD" />
              <Text style={styles.headerPillText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteIconButton}
              activeOpacity={0.85}
              onPress={handleDeletePress}
            >
              <Ionicons name="trash-outline" size={17} color="#FF8D8F" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIcon}
              activeOpacity={0.85}
              onPress={() => setMenuVisible((v) => !v)}
            >
              <Ionicons name="ellipsis-vertical" size={18} color="rgba(245,248,253,0.82)" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Category chip */}
          <View style={styles.categoryChip}>
            <Ionicons name="business-outline" size={15} color="#6DB2FF" />
            <Text style={styles.categoryChipText}>My Loans</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{safeItem.lender}</Text>
          {safeItem.notes ? <Text style={styles.notes}>{safeItem.notes}</Text> : null}

          {/* Metric cards */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Ionicons name="wallet-outline" size={18} color="rgba(245,248,253,0.54)" />
              <Text style={styles.metricLabel}>Current balance</Text>
              <Text style={styles.metricValue}>{formatKr(safeItem.currentBalance)}</Text>
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="cash-outline" size={18} color="rgba(245,248,253,0.54)" />
              <Text style={styles.metricLabel}>Original amount</Text>
              <Text style={styles.metricValue}>{formatKr(safeItem.originalAmount)}</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>{formatKr(paid)} repaid</Text>
              <Text style={styles.progressPct}>{progressPercent}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(progressPercent, 2)}%` }]} />
            </View>
          </View>

          {/* Payoff date */}
          <View style={styles.supportRow}>
            <Text style={styles.supportLabel}>Payoff date</Text>
            <View style={styles.datePill}>
              <Text style={styles.datePillText}>{formatDate(safeItem.payoffDate)}</Text>
            </View>
          </View>

          {/* APR row */}
          <View style={styles.supportRow}>
            <Text style={styles.supportLabel}>Interest rate</Text>
            <View style={styles.aprPill}>
              <Ionicons name="trending-up-outline" size={12} color="#6DB2FF" />
              <Text style={styles.aprPillText}>{safeItem.interestRate}% APR</Text>
            </View>
          </View>

          {/* Register payment toggle */}
          {!isPaidOff ? (
            <TouchableOpacity
              style={styles.paymentToggle}
              activeOpacity={0.88}
              onPress={() => {
                if (paymentVisible) {
                  setPaymentVisible(false)
                } else {
                  openPaymentPanel()
                }
              }}
            >
              <View style={styles.paymentToggleLeft}>
                <View style={styles.paymentToggleIcon}>
                  <Ionicons
                    name={paymentVisible ? 'close-circle-outline' : 'add-circle-outline'}
                    size={16}
                    color="#6DB2FF"
                  />
                </View>
                <Text style={styles.paymentToggleLabel}>
                  {paymentVisible ? 'Cancel payment' : 'Record payment'}
                </Text>
              </View>
              <Ionicons
                name={paymentVisible ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="rgba(245,248,253,0.42)"
              />
            </TouchableOpacity>
          ) : null}

          {paymentVisible ? (
            <View style={styles.paymentForm}>
              <Text style={styles.paymentFormHint}>
                Split the payment into interest and principal. Estimated monthly interest is
                pre-filled based on your current balance.
              </Text>

              {/* Preset amounts */}
              {presetAmounts.length > 0 ? (
                <View style={styles.presetsRow}>
                  {presetAmounts.map((amount) => (
                    <TouchableOpacity
                      key={amount}
                      style={[
                        styles.presetBtn,
                        paymentAmount === String(amount) ? styles.presetBtnActive : null,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => setPaymentAmount(String(amount))}
                    >
                      <Text
                        style={[
                          styles.presetBtnText,
                          paymentAmount === String(amount) ? styles.presetBtnTextActive : null,
                        ]}
                      >
                        {formatKr(amount)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}

              {/* Two fields side by side */}
              <View style={styles.fieldsRow}>
                <View style={styles.fieldCol}>
                  <Text style={styles.fieldLabel}>PAYMENT (NOK)</Text>
                  <TextInput
                    value={paymentAmount}
                    onChangeText={(v) => {
                      setPaymentAmount(v)
                      setPaymentError('')
                    }}
                    style={styles.paymentInput}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.16)"
                    returnKeyType="next"
                  />
                </View>
                <View style={styles.fieldCol}>
                  <Text style={styles.fieldLabel}>INTEREST ({safeItem.interestRate}% APR)</Text>
                  <TextInput
                    value={interestAmount}
                    onChangeText={(v) => {
                      setInterestAmount(v)
                      setPaymentError('')
                    }}
                    style={styles.paymentInput}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.16)"
                    returnKeyType="done"
                  />
                </View>
              </View>

              {/* Principal breakdown card */}
              <View style={styles.breakdownCard}>
                <View style={styles.breakdownCardLeft}>
                  <Text style={styles.breakdownLabel}>Principal applied</Text>
                  <Text style={styles.breakdownValue}>{formatKr(principalApplied)}</Text>
                </View>
                <Text style={styles.breakdownHint}>reduces your balance</Text>
              </View>

              {paymentError ? (
                <Text style={styles.breakdownError}>{paymentError}</Text>
              ) : null}

              <View style={styles.registerRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  activeOpacity={0.85}
                  onPress={() => setPaymentVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={[styles.registerBtn, !isPaymentValid ? styles.registerBtnDisabled : null]}
                  onPress={handleRegisterPayment}
                  disabled={!isPaymentValid}
                >
                  <LinearGradient
                    colors={isPaymentValid ? ['#6DB2FF', '#4C89E8'] : ['#2a2f3e', '#232838']}
                    style={styles.registerBtnGradient}
                  >
                    <Text style={styles.registerBtnText}>Save payment</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* Mark as paid off */}
          <TouchableOpacity
            style={[styles.markButton, isPaidOff && styles.markButtonDone]}
            activeOpacity={0.88}
            onPress={() => {
              void onMarkPaidOff(safeItem.id)
            }}
          >
            <Text style={styles.markButtonText}>
              {isPaidOff ? 'Paid off' : 'Mark as paid off'}
            </Text>
          </TouchableOpacity>

          {/* Payment history */}
          {safeItem.payments.length > 0 ? (
            <View style={styles.historyList}>
              <Text style={styles.historyTitle}>Payment history</Text>
              {[...safeItem.payments].reverse().map((payment) => (
                <View key={payment.id} style={styles.historyRow}>
                  <View style={styles.historyIconWrap}>
                    <Ionicons name="checkmark" size={13} color="#6DB2FF" />
                  </View>
                  <View style={styles.historyCopy}>
                    <View style={styles.historyTopRow}>
                      <Text style={styles.historyAmount}>{formatKr(payment.amount)}</Text>
                      <Text style={styles.historyDate}>{formatDate(payment.date)}</Text>
                    </View>
                    <Text style={styles.historySplit}>
                      {formatKr(payment.principalPortion)} principal
                      {'  ·  '}
                      {formatKr(payment.interestPortion)} interest
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>

        {/* Overflow menu */}
        {menuVisible ? (
          <View style={styles.menu}>
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.85}
              onPress={() => {
                setMenuVisible(false)
                onEdit(safeItem)
              }}
            >
              <Ionicons name="pencil" size={16} color="#F5F8FD" />
              <Text style={styles.menuText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.85}>
              <Ionicons name="analytics-outline" size={16} color="#F5F8FD" />
              <Text style={styles.menuText}>Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.85}>
              <Ionicons name="share-outline" size={16} color="#F5F8FD" />
              <Text style={styles.menuText}>Data export</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.85}
              onPress={handleDeletePress}
            >
              <Ionicons name="trash-outline" size={16} color="#FF8D8F" />
              <Text style={styles.menuDangerText}>Delete</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <ConfirmModal
          isOpen={deleteModalVisible}
          title="Are you sure you want to delete?"
          body={safeItem ? `This will remove ${safeItem.lender} from My Loans.` : ''}
          confirmText="OK"
          cancelText="Cancel"
          confirmDestructive
          onCancel={() => setDeleteModalVisible(false)}
          onConfirm={async () => {
            if (!safeItem) return
            setDeleteModalVisible(false)
            await onDelete(safeItem.id)
          }}
          theme={confirmTheme}
        />

        {/* Footer OK */}
        <View style={styles.footer}>
          <TouchableOpacity activeOpacity={0.9} onPress={onClose}>
            <LinearGradient colors={['#6DB2FF', '#4C89E8']} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>OK</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const confirmTheme = {
  overlayColor: 'rgba(6,8,14,0.58)',
  cardBackground: '#171C27',
  borderColor: 'rgba(255,255,255,0.06)',
  titleColor: '#F5F8FD',
  bodyColor: 'rgba(245,248,253,0.62)',
  cancelBackground: 'rgba(255,255,255,0.04)',
  cancelBorder: 'rgba(255,255,255,0.08)',
  cancelTextColor: '#E9EEF8',
  destructiveBackground: '#C94B59',
  confirmTextColor: '#FFF7F8',
  iconDestructiveBackground: 'rgba(201,75,89,0.14)',
  iconDestructiveColor: '#FF8D8F',
  cardRadius: 28,
  buttonRadius: 999,
} as const

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0E' },
  heroGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 280 },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPill: {
    minHeight: 34,
    borderRadius: 15,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerPillText: { color: '#F5F8FD', fontSize: 13, fontFamily: 'DMSans_700Bold' },
  deleteIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,77,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,77,94,0.18)',
  },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 140 },
  categoryChip: {
    alignSelf: 'flex-start',
    minHeight: 30,
    borderRadius: 15,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(109,178,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(109,178,255,0.16)',
  },
  categoryChipText: { color: '#A8CFFF', fontSize: 13, fontFamily: 'DMSans_600SemiBold' },
  title: {
    marginTop: 16,
    color: '#F5F8FD',
    fontSize: 28,
    lineHeight: 32,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  notes: {
    marginTop: 8,
    color: 'rgba(245,248,253,0.54)',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'DMSans_500Medium',
  },
  metricsRow: { marginTop: 18, flexDirection: 'row', gap: 10 },
  metricCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(24,28,39,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 12,
  },
  metricLabel: {
    marginTop: 8,
    color: 'rgba(245,248,253,0.46)',
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
  },
  metricValue: { marginTop: 4, color: '#F5F8FD', fontSize: 22, fontFamily: 'DMSans_700Bold' },
  progressSection: { marginTop: 18, gap: 8 },
  progressLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressLabel: { color: 'rgba(245,248,253,0.54)', fontSize: 12, fontFamily: 'DMSans_600SemiBold' },
  progressPct: { color: '#6DB2FF', fontSize: 12, fontFamily: 'DMSans_700Bold' },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: '#6DB2FF' },
  supportRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  supportLabel: {
    color: 'rgba(245,248,253,0.42)',
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
  },
  datePill: {
    minHeight: 30,
    borderRadius: 15,
    paddingHorizontal: 11,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePillText: { color: '#F5F8FD', fontSize: 12, fontFamily: 'DMSans_700Bold' },
  aprPill: {
    minHeight: 30,
    borderRadius: 15,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(109,178,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(109,178,255,0.14)',
  },
  aprPillText: { color: '#6DB2FF', fontSize: 12, fontFamily: 'DMSans_700Bold' },
  markButton: {
    marginTop: 24,
    minHeight: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markButtonDone: {
    backgroundColor: 'rgba(116,216,139,0.12)',
    borderColor: 'rgba(116,216,139,0.22)',
  },
  markButtonText: { color: '#F5F8FD', fontSize: 14, fontFamily: 'DMSans_700Bold' },
  // Payment toggle
  paymentToggle: {
    marginTop: 20,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(109,178,255,0.18)',
    backgroundColor: 'rgba(109,178,255,0.06)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  paymentToggleIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(109,178,255,0.12)',
  },
  paymentToggleLabel: { color: '#A8CFFF', fontSize: 14, fontFamily: 'DMSans_700Bold' },
  // Payment form
  paymentForm: {
    marginTop: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(109,178,255,0.12)',
    backgroundColor: 'rgba(20,24,36,0.98)',
    padding: 14,
    gap: 12,
  },
  paymentFormHint: {
    color: 'rgba(245,248,253,0.42)',
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    lineHeight: 17,
  },
  presetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  presetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  presetBtnActive: {
    backgroundColor: 'rgba(109,178,255,0.18)',
    borderColor: 'rgba(109,178,255,0.28)',
  },
  presetBtnText: {
    color: 'rgba(245,248,253,0.55)',
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
  },
  presetBtnTextActive: { color: '#A8CFFF' },
  fieldsRow: { flexDirection: 'row', gap: 10 },
  fieldCol: { flex: 1, gap: 6 },
  fieldLabel: {
    color: 'rgba(235,240,248,0.38)',
    fontSize: 10,
    letterSpacing: 0.9,
    fontFamily: 'DMSans_600SemiBold',
  },
  paymentInput: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    color: '#F5F8FD',
    fontSize: 17,
    fontFamily: 'DMSans_700Bold',
  },
  breakdownCard: {
    borderRadius: 12,
    backgroundColor: 'rgba(109,178,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(109,178,255,0.14)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakdownCardLeft: { gap: 2 },
  breakdownLabel: {
    color: 'rgba(245,248,253,0.42)',
    fontSize: 10,
    letterSpacing: 0.8,
    fontFamily: 'DMSans_600SemiBold',
  },
  breakdownValue: { color: '#6DB2FF', fontSize: 17, fontFamily: 'DMSans_700Bold' },
  breakdownHint: {
    color: 'rgba(109,178,255,0.55)',
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
  },
  breakdownError: { color: '#F5797E', fontSize: 12, fontFamily: 'DMSans_600SemiBold' },
  registerRow: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  cancelBtnText: {
    color: 'rgba(245,248,253,0.55)',
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
  },
  registerBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  registerBtnDisabled: { opacity: 0.5 },
  registerBtnGradient: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerBtnText: { color: '#fff', fontSize: 15, fontFamily: 'DMSans_700Bold' },
  // Payment history
  historyList: { marginTop: 24, gap: 12 },
  historyTitle: {
    color: 'rgba(245,248,253,0.42)',
    fontSize: 11,
    letterSpacing: 1.1,
    fontFamily: 'DMSans_600SemiBold',
    marginBottom: 4,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(24,28,39,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  historyIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(109,178,255,0.12)',
    marginTop: 1,
  },
  historyCopy: { flex: 1, gap: 4 },
  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyAmount: { color: '#F5F8FD', fontSize: 15, fontFamily: 'DMSans_700Bold' },
  historyDate: {
    color: 'rgba(245,248,253,0.42)',
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
  },
  historySplit: {
    color: 'rgba(245,248,253,0.52)',
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
  },
  menu: {
    position: 'absolute',
    top: 62,
    right: 16,
    width: 170,
    borderRadius: 18,
    backgroundColor: '#1B202B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 8,
  },
  menuItem: {
    minHeight: 42,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuText: { color: '#F5F8FD', fontSize: 15, fontFamily: 'DMSans_600SemiBold' },
  menuDangerText: { color: '#FF8D8F', fontSize: 15, fontFamily: 'DMSans_600SemiBold' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 18,
    paddingTop: 12,
    backgroundColor: 'rgba(10,10,14,0.92)',
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#F8FBFF', fontSize: 16, fontFamily: 'DMSans_700Bold' },
})
