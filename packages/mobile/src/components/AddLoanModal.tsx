// @ts-nocheck
import React, { useState } from 'react'
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

type Props = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: CreateLoanPayload) => Promise<void>
}

// Why hasTriedSubmit? We only show validation errors *after* the user
// has pressed Submit at least once — avoids instant red fields on open.
export function AddLoanModal({ isOpen, onClose, onSubmit }: Props) {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [dateGiven, setDateGiven] = useState('')
  const [expectedRepaymentDate, setExpectedRepaymentDate] = useState('')
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const resetForm = () => {
    setRecipient('')
    setAmount('')
    setDateGiven('')
    setExpectedRepaymentDate('')
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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Card — stop overlay tap from bubbling into the card */}
          <TouchableOpacity activeOpacity={1} style={styles.card}>
            {/* Header */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Add Loan</Text>
              <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color="#6b7280" />
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
                  placeholderTextColor="#9ca3af"
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
                  placeholderTextColor="#9ca3af"
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
              <View style={styles.field}>
                <Text style={styles.label}>Date Given</Text>
                <TextInput
                  style={[
                    styles.input,
                    hasTriedSubmit && errors.dateGiven ? styles.inputError : null,
                  ]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9ca3af"
                  value={dateGiven}
                  onChangeText={setDateGiven}
                  keyboardType="numbers-and-punctuation"
                  returnKeyType="next"
                  maxLength={10}
                />
                {hasTriedSubmit && errors.dateGiven ? (
                  <Text style={styles.errorText}>{errors.dateGiven}</Text>
                ) : null}
              </View>

              {/* Expected Repayment Date */}
              <View style={styles.field}>
                <Text style={styles.label}>Expected Repayment Date</Text>
                <TextInput
                  style={[
                    styles.input,
                    hasTriedSubmit && errors.expectedRepaymentDate ? styles.inputError : null,
                  ]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9ca3af"
                  value={expectedRepaymentDate}
                  onChangeText={setExpectedRepaymentDate}
                  keyboardType="numbers-and-punctuation"
                  returnKeyType="done"
                  maxLength={10}
                />
                {hasTriedSubmit && errors.expectedRepaymentDate ? (
                  <Text style={styles.errorText}>{errors.expectedRepaymentDate}</Text>
                ) : null}
              </View>

              {/* API-level error */}
              {submitError ? (
                <View style={styles.submitErrorBanner}>
                  <Ionicons name="alert-circle" size={14} color="#dc2626" />
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    maxHeight: '90%',
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
    color: '#111827',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  submitErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    gap: 6,
  },
  submitErrorText: {
    fontSize: 13,
    color: '#dc2626',
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
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
})
