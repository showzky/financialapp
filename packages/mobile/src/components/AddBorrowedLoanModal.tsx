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
import type { CreateBorrowedLoanPayload } from '../services/borrowedLoanApi'
import {
  buildCreateBorrowedLoanPayload,
  getBorrowedLoanFormErrors,
} from './borrowedLoanForm'

type Props = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: CreateBorrowedLoanPayload) => Promise<void>
}

export function AddBorrowedLoanModal({ isOpen, onClose, onSubmit }: Props) {
  const [lender, setLender] = useState('')
  const [originalAmount, setOriginalAmount] = useState('')
  const [currentBalance, setCurrentBalance] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [payoffDate, setPayoffDate] = useState('')
  const [notes, setNotes] = useState('')
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const resetForm = () => {
    setLender('')
    setOriginalAmount('')
    setCurrentBalance('')
    setInterestRate('')
    setPayoffDate('')
    setNotes('')
    setHasTriedSubmit(false)
    setSubmitting(false)
    setSubmitError('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const errors = getBorrowedLoanFormErrors({
    lender,
    originalAmount,
    currentBalance,
    interestRate,
    payoffDate,
    notes,
  })

  const hasErrors = Object.values(errors).some(Boolean)

  const handleSubmit = async () => {
    setHasTriedSubmit(true)
    if (hasErrors) return

    setSubmitting(true)
    setSubmitError('')
    try {
      await onSubmit(
        buildCreateBorrowedLoanPayload({
          lender,
          originalAmount,
          currentBalance,
          interestRate,
          payoffDate,
          notes,
        }),
      )
      resetForm()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <TouchableOpacity activeOpacity={1} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Add Personal Loan</Text>
              <TouchableOpacity
                onPress={handleClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.field}>
                <Text style={styles.label}>Lender</Text>
                <TextInput
                  style={[styles.input, hasTriedSubmit && errors.lender ? styles.inputError : null]}
                  placeholder="DNB"
                  placeholderTextColor="#9ca3af"
                  value={lender}
                  onChangeText={setLender}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
                {hasTriedSubmit && errors.lender ? (
                  <Text style={styles.errorText}>{errors.lender}</Text>
                ) : null}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Original Amount (NOK)</Text>
                <TextInput
                  style={[
                    styles.input,
                    hasTriedSubmit && errors.originalAmount ? styles.inputError : null,
                  ]}
                  placeholder="150000"
                  placeholderTextColor="#9ca3af"
                  value={originalAmount}
                  onChangeText={setOriginalAmount}
                  keyboardType="numeric"
                  returnKeyType="next"
                />
                {hasTriedSubmit && errors.originalAmount ? (
                  <Text style={styles.errorText}>{errors.originalAmount}</Text>
                ) : null}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Current Balance (NOK)</Text>
                <TextInput
                  style={[
                    styles.input,
                    hasTriedSubmit && errors.currentBalance ? styles.inputError : null,
                  ]}
                  placeholder="120000"
                  placeholderTextColor="#9ca3af"
                  value={currentBalance}
                  onChangeText={setCurrentBalance}
                  keyboardType="numeric"
                  returnKeyType="next"
                />
                {hasTriedSubmit && errors.currentBalance ? (
                  <Text style={styles.errorText}>{errors.currentBalance}</Text>
                ) : null}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Interest Rate (%)</Text>
                <TextInput
                  style={[
                    styles.input,
                    hasTriedSubmit && errors.interestRate ? styles.inputError : null,
                  ]}
                  placeholder="6"
                  placeholderTextColor="#9ca3af"
                  value={interestRate}
                  onChangeText={setInterestRate}
                  keyboardType="numeric"
                  returnKeyType="next"
                />
                {hasTriedSubmit && errors.interestRate ? (
                  <Text style={styles.errorText}>{errors.interestRate}</Text>
                ) : null}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Payoff Date</Text>
                <TextInput
                  style={[styles.input, hasTriedSubmit && errors.payoffDate ? styles.inputError : null]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9ca3af"
                  value={payoffDate}
                  onChangeText={setPayoffDate}
                  keyboardType="numbers-and-punctuation"
                  returnKeyType="done"
                  maxLength={10}
                />
                {hasTriedSubmit && errors.payoffDate ? (
                  <Text style={styles.errorText}>{errors.payoffDate}</Text>
                ) : null}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.notesInput,
                    hasTriedSubmit && errors.notes ? styles.inputError : null,
                  ]}
                  placeholder="Optional repayment context"
                  placeholderTextColor="#9ca3af"
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

              {submitError ? (
                <View style={styles.submitErrorBanner}>
                  <Ionicons name="alert-circle" size={14} color="#dc2626" />
                  <Text style={styles.submitErrorText}>{submitError}</Text>
                </View>
              ) : null}

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
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  notesInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '500',
  },
  fieldFooter: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counterText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  submitErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  submitErrorText: {
    flex: 1,
    fontSize: 13,
    color: '#b91c1c',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  submitButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#1d4ed8',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
})
