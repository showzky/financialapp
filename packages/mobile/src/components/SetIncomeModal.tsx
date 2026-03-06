// @ts-nocheck
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { authApi } from '../services/authApi'
import { setIncomeModalStyles as styles } from './SetIncomeModal.styles'

type Props = {
  isOpen: boolean
  currentIncome: number
  onClose: () => void
  onIncomeUpdated: () => void
}

export function SetIncomeModal({ isOpen, currentIncome, onClose, onIncomeUpdated }: Props) {
  const [income, setIncome] = useState(currentIncome > 0 ? String(currentIncome) : '')
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Pre-fill with current income each time the modal opens
  useEffect(() => {
    if (isOpen) {
      setIncome(currentIncome > 0 ? String(currentIncome) : '')
      setHasTriedSubmit(false)
      setSubmitting(false)
      setSubmitError('')
    }
  }, [isOpen, currentIncome])

  const incomeError =
    income === '' || isNaN(Number(income)) || Number(income) < 0
      ? 'Enter a valid income amount (0 or more)'
      : ''

  const handleClose = () => {
    setHasTriedSubmit(false)
    setSubmitError('')
    onClose()
  }

  const handleSubmit = async () => {
    setHasTriedSubmit(true)
    if (incomeError) return

    setSubmitting(true)
    setSubmitError('')
    try {
      await authApi.updateIncome(Number(income))
      onIncomeUpdated()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update income')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Set Income</Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={22} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.label}>Monthly Income</Text>
              <Text style={styles.hint}>
                This replaces your current income for this period.
              </Text>
              <TextInput
                style={[
                  styles.input,
                  hasTriedSubmit && incomeError ? styles.inputError : undefined,
                ]}
                placeholder="0"
                placeholderTextColor="#d1d5db"
                keyboardType="decimal-pad"
                value={income}
                onChangeText={setIncome}
                editable={!submitting}
                autoFocus
              />
              {hasTriedSubmit && incomeError ? (
                <Text style={styles.errorText}>{incomeError}</Text>
              ) : null}
            </View>

            {submitError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.errorBoxText}>{submitError}</Text>
              </View>
            ) : null}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                hasTriedSubmit && incomeError ? styles.submitButtonDisabled : undefined,
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Set Income</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
