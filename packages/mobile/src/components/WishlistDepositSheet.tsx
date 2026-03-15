import React, { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { BottomSheet } from './BottomSheet'
import type { WishlistItem } from '../services/wishlistApi'

type WishlistDepositSheetProps = {
  visible: boolean
  item: WishlistItem | null
  isSubmitting: boolean
  onClose: () => void
  onConfirm: (amount: number) => Promise<void> | void
}

const formatNok = (value: number) => `NOK ${value.toLocaleString('nb-NO')}`

export function WishlistDepositSheet({
  visible,
  item,
  isSubmitting,
  onClose,
  onConfirm,
}: WishlistDepositSheetProps) {
  const [amount, setAmount] = useState('')
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)

  useEffect(() => {
    if (!visible) {
      setAmount('')
      setHasTriedSubmit(false)
    }
  }, [visible])

  const normalizedAmount = amount.trim()
  const isValidAmount = normalizedAmount !== '' && !Number.isNaN(Number(normalizedAmount)) && Number(normalizedAmount) > 0

  const handleSubmit = async () => {
    setHasTriedSubmit(true)
    if (!isValidAmount || isSubmitting) {
      return
    }

    await onConfirm(Number(normalizedAmount))
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Add Funds"
      subtitle={item ? `Add money toward ${item.title}.` : 'Add money toward this wishlist item.'}
      footer={
        <TouchableOpacity
          style={[styles.submitButton, (!isValidAmount || isSubmitting) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isValidAmount || isSubmitting}
          activeOpacity={0.9}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Add Funds</Text>
          )}
        </TouchableOpacity>
      }
    >
      <View style={styles.body}>
        {item ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Target</Text>
            <Text style={styles.summaryValue}>{item.price !== null ? formatNok(item.price) : 'No target price'}</Text>
            <Text style={styles.summaryMeta}>Saved {formatNok(item.savedAmount)}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Deposit amount (NOK)</Text>
        <TextInput
          style={[styles.input, hasTriedSubmit && !isValidAmount && styles.inputError]}
          value={amount}
          onChangeText={setAmount}
          placeholder="250"
          placeholderTextColor="#94a3b8"
          keyboardType="numeric"
          editable={!isSubmitting}
        />
        {hasTriedSubmit && !isValidAmount ? (
          <Text style={styles.errorText}>Enter a valid amount greater than 0.</Text>
        ) : null}
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  body: {
    gap: 12,
  },
  summaryCard: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d9e1ea',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'DMSans_500Medium',
  },
  summaryValue: {
    fontSize: 18,
    color: '#0f172a',
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  summaryMeta: {
    fontSize: 13,
    color: '#475569',
    fontFamily: 'DMSans_600SemiBold',
  },
  label: {
    fontSize: 14,
    color: '#334155',
    fontFamily: 'DMSans_700Bold',
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d9e1ea',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0f172a',
    fontFamily: 'DMSans_500Medium',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 13,
    color: '#dc2626',
    fontFamily: 'DMSans_500Medium',
  },
  submitButton: {
    minHeight: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 15,
    color: '#ffffff',
    fontFamily: 'DMSans_700Bold',
  },
})
