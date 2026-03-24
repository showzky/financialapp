import React, { useEffect, useState } from 'react'
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

import { getBorrowedLoanFormErrors } from '../borrowedLoanForm'
import type { BorrowedLoanPlanItem } from './types'
import { LoanIconPickerField, type LoanIconValue } from './LoanIconPickerField'

type Props = {
  visible: boolean
  initialItem?: BorrowedLoanPlanItem | null
  onClose: () => void
  onSave: (item: BorrowedLoanPlanItem) => void | Promise<void>
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function BorrowedLoanCreateModal({ visible, initialItem, onClose, onSave }: Props) {
  const [lender, setLender] = useState('')
  const [originalAmount, setOriginalAmount] = useState('')
  const [currentBalance, setCurrentBalance] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [payoffDate, setPayoffDate] = useState(new Date())
  const [notes, setNotes] = useState('')
  const [selectedIcon, setSelectedIcon] = useState<LoanIconValue | null>(null)
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)
  const [showIosDatePicker, setShowIosDatePicker] = useState(false)

  useEffect(() => {
    if (!visible) {
      setShowIosDatePicker(false)
      return
    }
    setLender(initialItem?.lender ?? '')
    setOriginalAmount(initialItem ? String(initialItem.originalAmount) : '')
    setCurrentBalance(initialItem ? String(initialItem.currentBalance) : '')
    setInterestRate(initialItem ? String(initialItem.interestRate) : '')
    setPayoffDate(initialItem ? new Date(initialItem.payoffDate) : new Date())
    setNotes(initialItem?.notes ?? '')
    setSelectedIcon(initialItem?.iconUrl ? { label: initialItem.lender, imageUrl: initialItem.iconUrl } : null)
    setHasTriedSubmit(false)
  }, [visible, initialItem])

  const isoDate = toIsoDate(payoffDate)
  const errors = getBorrowedLoanFormErrors({
    lender,
    originalAmount,
    currentBalance,
    interestRate,
    payoffDate: isoDate,
    notes,
  })
  const hasErrors = Object.values(errors).some(Boolean)

  const openDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: payoffDate,
        mode: 'date',
        onChange: (_event, picked) => {
          if (picked) setPayoffDate(picked)
        },
      })
      return
    }
    setShowIosDatePicker(true)
  }

  const handleSave = async () => {
    setHasTriedSubmit(true)
    if (hasErrors) return

    const item: BorrowedLoanPlanItem = {
      id: initialItem?.id ?? `loan-${Date.now()}`,
      lender: lender.trim(),
      originalAmount: Number(originalAmount),
      currentBalance: Number(currentBalance),
      interestRate: Number(interestRate),
      payoffDate: isoDate,
      notes: notes.trim(),
      iconUrl: selectedIcon?.imageUrl ?? null,
      payments: initialItem?.payments ?? [],
    }

    await onSave(item)
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.overlay} />
        <View style={styles.sheet}>
          <LinearGradient colors={['#141324', '#0d0d18']} style={StyleSheet.absoluteFill} />

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}>
                <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.45)" />
              </TouchableOpacity>
              <Text style={styles.title}>{initialItem ? 'Edit loan' : 'Add loan'}</Text>
              <View style={styles.headerSpacer} />
            </View>

            {/* Lender */}
            <View style={styles.section}>
              <Text style={styles.label}>LENDER</Text>
              <TextInput
                value={lender}
                onChangeText={setLender}
                style={[styles.textInput, hasTriedSubmit && errors.lender ? styles.inputError : null]}
                placeholder="e.g. DNB, Santander"
                placeholderTextColor="rgba(255,255,255,0.16)"
                autoCapitalize="words"
                returnKeyType="next"
              />
              {hasTriedSubmit && errors.lender ? (
                <Text style={styles.errorText}>{errors.lender}</Text>
              ) : null}
            </View>

            {/* Lender logo */}
            <View style={styles.section}>
              <Text style={styles.label}>LOGO</Text>
              <LoanIconPickerField value={selectedIcon} onSelect={setSelectedIcon} />
            </View>

            {/* Original amount */}
            <View style={styles.section}>
              <Text style={styles.label}>ORIGINAL AMOUNT</Text>
              <View style={styles.amountRow}>
                <TextInput
                  value={originalAmount}
                  onChangeText={setOriginalAmount}
                  style={[
                    styles.textInput,
                    styles.amountInput,
                    hasTriedSubmit && errors.originalAmount ? styles.inputError : null,
                  ]}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor="rgba(255,255,255,0.16)"
                  returnKeyType="next"
                />
                <View style={styles.unitPill}>
                  <Text style={styles.unitText}>NOK</Text>
                </View>
              </View>
              {hasTriedSubmit && errors.originalAmount ? (
                <Text style={styles.errorText}>{errors.originalAmount}</Text>
              ) : null}
            </View>

            {/* Current balance */}
            <View style={styles.section}>
              <Text style={styles.label}>CURRENT BALANCE</Text>
              <View style={styles.amountRow}>
                <TextInput
                  value={currentBalance}
                  onChangeText={setCurrentBalance}
                  style={[
                    styles.textInput,
                    styles.amountInput,
                    hasTriedSubmit && errors.currentBalance ? styles.inputError : null,
                  ]}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor="rgba(255,255,255,0.16)"
                  returnKeyType="next"
                />
                <View style={styles.unitPill}>
                  <Text style={styles.unitText}>NOK</Text>
                </View>
              </View>
              {hasTriedSubmit && errors.currentBalance ? (
                <Text style={styles.errorText}>{errors.currentBalance}</Text>
              ) : null}
            </View>

            {/* Interest rate / APR */}
            <View style={styles.section}>
              <Text style={styles.label}>INTEREST RATE (APR)</Text>
              <View style={styles.amountRow}>
                <TextInput
                  value={interestRate}
                  onChangeText={setInterestRate}
                  style={[
                    styles.textInput,
                    styles.amountInput,
                    hasTriedSubmit && errors.interestRate ? styles.inputError : null,
                  ]}
                  keyboardType="decimal-pad"
                  placeholder="0.0"
                  placeholderTextColor="rgba(255,255,255,0.16)"
                  returnKeyType="next"
                />
                <View style={styles.unitPill}>
                  <Text style={styles.unitText}>% APR</Text>
                </View>
              </View>
              {hasTriedSubmit && errors.interestRate ? (
                <Text style={styles.errorText}>{errors.interestRate}</Text>
              ) : null}
            </View>

            {/* Payoff date */}
            <View style={styles.section}>
              <Text style={styles.label}>PAYOFF DATE</Text>
              <TouchableOpacity style={styles.selectField} activeOpacity={0.88} onPress={openDatePicker}>
                <Text style={styles.selectValue}>{formatDate(payoffDate)}</Text>
                <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.28)" />
              </TouchableOpacity>
            </View>

            {showIosDatePicker && Platform.OS === 'ios' ? (
              <View style={styles.iosDateWrap}>
                <DateTimePicker
                  mode="date"
                  display="spinner"
                  value={payoffDate}
                  onChange={(_event, picked) => {
                    if (picked) setPayoffDate(picked)
                  }}
                />
              </View>
            ) : null}

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.label}>NOTES</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                style={[styles.textInput, styles.notesInput]}
                multiline
                placeholder="Optional repayment context"
                placeholderTextColor="rgba(255,255,255,0.12)"
                textAlignVertical="top"
                maxLength={400}
              />
              <Text style={styles.counter}>{notes.length}/400</Text>
            </View>

            <TouchableOpacity activeOpacity={0.9} onPress={handleSave}>
              <LinearGradient
                colors={['#6DB2FF', '#4C89E8']}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>
                  {initialItem ? 'Save changes' : 'Add loan'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} activeOpacity={0.85} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(0,0,0,0.42)', justifyContent: 'flex-end' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4,6,10,0.32)' },
  sheet: {
    maxHeight: '94%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 28 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: { color: '#F5F8FD', fontSize: 22, fontFamily: 'DMSans_700Bold' },
  headerSpacer: { width: 18 },
  section: { marginBottom: 14 },
  label: {
    marginBottom: 8,
    color: 'rgba(235,240,248,0.42)',
    fontSize: 11,
    letterSpacing: 1.1,
    fontFamily: 'DMSans_600SemiBold',
  },
  textInput: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    color: '#F5F8FD',
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
  },
  inputError: { borderColor: 'rgba(245,121,126,0.45)' },
  notesInput: { minHeight: 84, paddingTop: 14, textAlignVertical: 'top' },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  amountInput: { flex: 1 },
  unitPill: {
    minWidth: 78,
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
  },
  unitText: { color: 'rgba(245,248,253,0.82)', fontSize: 13, fontFamily: 'DMSans_700Bold' },
  selectField: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectValue: { color: '#F5F8FD', fontSize: 15, fontFamily: 'DMSans_500Medium' },
  iosDateWrap: {
    marginBottom: 14,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  counter: {
    marginTop: 6,
    textAlign: 'right',
    color: 'rgba(235,240,248,0.32)',
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
  },
  errorText: { marginTop: 6, color: '#F5797E', fontSize: 12, fontFamily: 'DMSans_600SemiBold' },
  primaryButton: {
    minHeight: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontFamily: 'DMSans_700Bold' },
  cancelButton: { marginTop: 12, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: {
    color: 'rgba(235,240,248,0.38)',
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
  },
})
