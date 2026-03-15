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
import { Ionicons } from '@expo/vector-icons'
import type { Loan, UpdateLoanPayload } from '../services/loanApi'
import { useScreenPalette } from '../customthemes'
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
  const { activeTheme, colors } = useScreenPalette()
  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          justifyContent: 'flex-end',
        },
        keyboardView: {
          justifyContent: 'flex-end',
        },
        card: {
          backgroundColor: activeTheme.colors.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 36,
          maxHeight: '90%',
          borderWidth: 1,
          borderColor: activeTheme.colors.surfaceBorder,
        },
        cardHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        },
        cardTitle: {
          fontSize: 20,
          fontWeight: '700',
          color: activeTheme.colors.text,
        },
        field: {
          marginBottom: 16,
        },
        label: {
          fontSize: 13,
          fontWeight: '600',
          color: activeTheme.colors.text,
          marginBottom: 6,
        },
        input: {
          borderWidth: 1,
          borderColor: activeTheme.colors.surfaceBorder,
          borderRadius: 10,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
          color: activeTheme.colors.text,
          backgroundColor: colors.inputBackground,
        },
        notesInput: {
          minHeight: 92,
          paddingTop: 12,
        },
        inputError: {
          borderColor: activeTheme.colors.danger,
          backgroundColor: `${activeTheme.colors.danger}10`,
        },
        fieldFooter: {
          marginTop: 4,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        errorText: {
          fontSize: 12,
          color: activeTheme.colors.danger,
        },
        counterText: {
          fontSize: 12,
          color: activeTheme.colors.mutedText,
        },
        submitErrorBanner: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: `${activeTheme.colors.danger}10`,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: `${activeTheme.colors.danger}40`,
          padding: 10,
          marginBottom: 16,
          gap: 6,
        },
        submitErrorText: {
          fontSize: 13,
          color: activeTheme.colors.danger,
          flex: 1,
        },
        actions: {
          flexDirection: 'row',
          gap: 12,
          marginTop: 4,
        },
        cancelButton: {
          flex: 1,
          paddingVertical: 13,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: activeTheme.colors.surfaceBorder,
          backgroundColor: activeTheme.colors.surfaceAlt,
          alignItems: 'center',
        },
        cancelButtonText: {
          fontSize: 15,
          fontWeight: '600',
          color: activeTheme.colors.text,
        },
        submitButton: {
          flex: 2,
          paddingVertical: 13,
          borderRadius: 10,
          backgroundColor: activeTheme.colors.accent,
          alignItems: 'center',
        },
        submitButtonDisabled: {
          backgroundColor: activeTheme.colors.accentSoft,
        },
        submitButtonText: {
          fontSize: 15,
          fontWeight: '600',
          color: '#fff',
        },
      }),
    [activeTheme.colors, colors.inputBackground],
  )
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
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <TouchableOpacity activeOpacity={1} style={styles.card}>
            {/* Header */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Edit Loan</Text>
              <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color={activeTheme.colors.mutedText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Recipient */}
              <View style={styles.field}>
                <Text style={styles.label}>Recipient</Text>
                <TextInput
                  style={[
                    styles.input,
                    hasTriedSubmit && errors.recipient ? styles.inputError : null,
                  ]}
                  placeholder="Ola Nordmann"
                  placeholderTextColor={activeTheme.colors.subtleText}
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
              <View style={styles.field}>
                <Text style={styles.label}>Amount (NOK)</Text>
                <TextInput
                  style={[
                    styles.input,
                    hasTriedSubmit && errors.amount ? styles.inputError : null,
                  ]}
                  placeholder="5000"
                  placeholderTextColor={activeTheme.colors.subtleText}
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

              <View style={styles.field}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.notesInput,
                    hasTriedSubmit && errors.notes ? styles.inputError : null,
                  ]}
                  placeholder="Til husleie"
                  placeholderTextColor={activeTheme.colors.subtleText}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  textAlignVertical="top"
                  maxLength={400}
                />
                <View style={styles.fieldFooter}>
                  {hasTriedSubmit && errors.notes ? (
                    <Text style={styles.errorText}>{errors.notes}</Text>
                  ) : (
                    <View />
                  )}
                  <Text style={styles.counterText}>{notes.length}/400</Text>
                </View>
              </View>

              {/* API-level error */}
              {submitError ? (
                <View style={styles.submitErrorBanner}>
                  <Ionicons name="alert-circle" size={14} color={activeTheme.colors.danger} />
                  <Text style={styles.submitErrorText}>{submitError}</Text>
                </View>
              ) : null}

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleClose} disabled={submitting}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    submitting || !hasChanges ? styles.submitButtonDisabled : null,
                  ]}
                  onPress={handleSubmit}
                  disabled={submitting || !hasChanges}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  )
}
