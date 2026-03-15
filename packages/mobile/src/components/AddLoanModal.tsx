import React, { useMemo, useState } from 'react'
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
import type { CreateLoanPayload } from '../services/loanApi'
import { useScreenPalette } from '../customthemes'
import { LoanDateField } from './LoanDateField'

type Props = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: CreateLoanPayload) => Promise<void>
}

// Why hasTriedSubmit? We only show validation errors *after* the user
// has pressed Submit at least once — avoids instant red fields on open.
export function AddLoanModal({ isOpen, onClose, onSubmit }: Props) {
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

  const resetForm = () => {
    setRecipient('')
    setAmount('')
    setDateGiven('')
    setExpectedRepaymentDate('')
    setNotes('')
    setHasTriedSubmit(false)
    setSubmitting(false)
    setSubmitError('')
  }

  const handleClose = () => {
    resetForm()
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

  const handleSubmit = async () => {
    setHasTriedSubmit(true)
    if (hasErrors) return

    setSubmitting(true)
    setSubmitError('')
    try {
      await onSubmit({
        recipient: recipient.trim(),
        amount: Number(amount),
        dateGiven,
        expectedRepaymentDate,
        notes: notes.trim() || undefined,
      })
      resetForm()
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
      {/* Overlay — tap outside to dismiss */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          {/* Card — stop overlay tap from bubbling into the card */}
          <TouchableOpacity activeOpacity={1} style={styles.card}>
            {/* Header */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Add Loan</Text>
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
                  style={[styles.submitButton, submitting ? styles.submitButtonDisabled : null]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Add Loan</Text>
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
