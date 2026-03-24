import React, { useState, useEffect, useMemo } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import type { Loan, UpdateLoanPayload } from '../services/loanApi'
import { LoanDateField } from './LoanDateField'

type Props = {
  isOpen: boolean
  loan: Loan | null
  onClose: () => void
  onSubmit: (id: string, payload: UpdateLoanPayload) => Promise<void>
}

// Why useEffect on loan?.id? When the parent swaps which loan is being edited,
// we need to re-seed the form fields from the new loan's data.
export function EditLoanModal({ isOpen, loan, onClose, onSubmit }: Props) {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [dateGiven, setDateGiven] = useState('')
  const [expectedRepaymentDate, setExpectedRepaymentDate] = useState('')
  const [notes, setNotes] = useState('')
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Seed/reset form fields each time a new loan is opened
  useEffect(() => {
    if (loan) {
      setRecipient(loan.recipient ?? '')
      setAmount(String(loan.amount ?? ''))
      // API returns full ISO date — slice to YYYY-MM-DD
      setDateGiven(loan.dateGiven ? loan.dateGiven.slice(0, 10) : '')
      setExpectedRepaymentDate(
        loan.expectedRepaymentDate ? loan.expectedRepaymentDate.slice(0, 10) : ''
      )
      setNotes(loan.notes ?? '')
      setHasTriedSubmit(false)
      setSubmitError('')
    }
  }, [loan?.id])

  const handleClose = () => {
    onClose()
  }

  const isValidDate = (val: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(val) && !isNaN(Date.parse(val))

  const errors = {
    recipient: !recipient.trim() ? 'Recipient is required' : '',
    amount:
      !amount || isNaN(Number(amount)) || Number(amount) <= 0
        ? 'Enter a valid amount'
        : '',
    dateGiven: !isValidDate(dateGiven) ? 'Use format YYYY-MM-DD' : '',
    expectedRepaymentDate: !isValidDate(expectedRepaymentDate)
      ? 'Use format YYYY-MM-DD'
      : dateGiven && isValidDate(dateGiven) && expectedRepaymentDate <= dateGiven
      ? 'Must be after date given'
      : '',
    notes: notes.length > 400 ? 'Max 400 characters' : '',
  }

  const hasErrors = Object.values(errors).some(Boolean)

  // Disable submit if nothing actually changed from the original loan data
  const hasChanges = useMemo(() => {
    if (!loan) return false
    return (
      recipient.trim() !== loan.recipient ||
      Number(amount) !== loan.amount ||
      dateGiven !== (loan.dateGiven ? loan.dateGiven.slice(0, 10) : '') ||
      expectedRepaymentDate !==
        (loan.expectedRepaymentDate ? loan.expectedRepaymentDate.slice(0, 10) : '') ||
      notes !== (loan.notes ?? '')
    )
  }, [recipient, amount, dateGiven, expectedRepaymentDate, notes, loan])

  const handleSubmit = async () => {
    setHasTriedSubmit(true)
    if (hasErrors || !loan) return

    setSubmitting(true)
    setSubmitError('')
    try {
      const payload: UpdateLoanPayload = {}
      if (recipient.trim() !== loan.recipient) payload.recipient = recipient.trim()
      if (Number(amount) !== loan.amount) payload.amount = Number(amount)
      if (dateGiven !== loan.dateGiven?.slice(0, 10)) payload.dateGiven = dateGiven
      if (expectedRepaymentDate !== loan.expectedRepaymentDate?.slice(0, 10))
        payload.expectedRepaymentDate = expectedRepaymentDate
      if (notes !== (loan.notes ?? '')) payload.notes = notes.trim() || null

      await onSubmit(loan.id, payload)
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.root}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={handleClose} />
        <View style={styles.sheet}>
          <LinearGradient colors={['#141324', '#0d0d18']} style={StyleSheet.absoluteFill} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.header}>
                <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}>
                  <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.45)" />
                </TouchableOpacity>
                <Text style={styles.title}>Edit Loan</Text>
                <View style={styles.headerSpacer} />
              </View>

              {/* Recipient */}
              <View style={styles.section}>
                <Text style={styles.label}>RECIPIENT</Text>
                <TextInput
                  style={[styles.textInput, hasTriedSubmit && errors.recipient ? styles.inputError : null]}
                  placeholder="Ola Nordmann"
                  placeholderTextColor="rgba(255,255,255,0.16)"
                  value={recipient}
                  onChangeText={setRecipient}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
                {hasTriedSubmit && errors.recipient ? (
                  <Text style={styles.errorText}>{errors.recipient}</Text>
                ) : null}
              </View>

              {/* Amount */}
              <View style={styles.section}>
                <Text style={styles.label}>AMOUNT (NOK)</Text>
                <TextInput
                  style={[styles.textInput, hasTriedSubmit && errors.amount ? styles.inputError : null]}
                  placeholder="5000"
                  placeholderTextColor="rgba(255,255,255,0.16)"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  returnKeyType="next"
                />
                {hasTriedSubmit && errors.amount ? (
                  <Text style={styles.errorText}>{errors.amount}</Text>
                ) : null}
              </View>

              {/* Date Given */}
              <LoanDateField
                label="Date Given"
                value={dateGiven}
                onChange={setDateGiven}
                placeholder="Select date"
                error={hasTriedSubmit ? errors.dateGiven : ''}
              />

              {/* Expected Repayment Date */}
              <LoanDateField
                label="Expected Repayment Date"
                value={expectedRepaymentDate}
                onChange={setExpectedRepaymentDate}
                placeholder="Select date"
                error={hasTriedSubmit ? errors.expectedRepaymentDate : ''}
              />

              {/* Notes */}
              <View style={styles.section}>
                <Text style={styles.label}>NOTES</Text>
                <TextInput
                  style={[styles.textInput, styles.notesInput, hasTriedSubmit && errors.notes ? styles.inputError : null]}
                  placeholder="Til husleie"
                  placeholderTextColor="rgba(255,255,255,0.16)"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  textAlignVertical="top"
                  maxLength={400}
                />
                <Text style={styles.counter}>{notes.length}/400</Text>
              </View>

              {submitError ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={14} color="#F5797E" />
                  <Text style={styles.errorBannerText}>{submitError}</Text>
                </View>
              ) : null}

              <TouchableOpacity activeOpacity={0.9} onPress={handleSubmit} disabled={submitting || !hasChanges}>
                <LinearGradient
                  colors={hasChanges ? ['#6DB2FF', '#4C89E8'] : ['rgba(109,178,255,0.3)', 'rgba(76,137,232,0.3)']}
                  style={styles.primaryButton}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Save Changes</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} activeOpacity={0.85} onPress={handleClose} disabled={submitting}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(0,0,0,0.42)', justifyContent: 'flex-end' },
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
  counter: {
    marginTop: 6,
    textAlign: 'right',
    color: 'rgba(235,240,248,0.32)',
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
  },
  errorText: { marginTop: 6, color: '#F5797E', fontSize: 12, fontFamily: 'DMSans_600SemiBold' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245,121,126,0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245,121,126,0.2)',
    padding: 10,
    marginBottom: 8,
  },
  errorBannerText: { flex: 1, color: '#F5797E', fontSize: 13, fontFamily: 'DMSans_500Medium' },
  primaryButton: {
    minHeight: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontFamily: 'DMSans_700Bold' },
  cancelButton: { marginTop: 12, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { color: 'rgba(235,240,248,0.38)', fontSize: 15, fontFamily: 'DMSans_600SemiBold' },
})
