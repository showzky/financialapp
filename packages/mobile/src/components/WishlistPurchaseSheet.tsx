import React, { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { BottomSheet } from './BottomSheet'
import type { WishlistItem } from '../services/wishlistApi'

type WishlistPurchaseSheetProps = {
  visible: boolean
  item: WishlistItem | null
  isSubmitting: boolean
  onClose: () => void
  onConfirm: (amount: number) => Promise<void> | void
}

export function WishlistPurchaseSheet({
  visible,
  item,
  isSubmitting,
  onClose,
  onConfirm,
}: WishlistPurchaseSheetProps) {
  const [amount, setAmount] = useState('')
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)

  useEffect(() => {
    if (!visible) {
      setAmount('')
      setHasTriedSubmit(false)
      return
    }

    if (item?.purchasedAmount && item.purchasedAmount > 0) {
      setAmount(String(item.purchasedAmount))
    } else if (item?.price && item.price > 0) {
      setAmount(String(item.price))
    } else {
      setAmount('')
    }
    setHasTriedSubmit(false)
  }, [visible, item])

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
      title="Mark as Purchased"
      subtitle={item ? `Enter what you paid for ${item.title}.` : 'Enter the purchased amount.'}
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
            <Text style={styles.submitButtonText}>Confirm purchase</Text>
          )}
        </TouchableOpacity>
      }
    >
      <View style={styles.body}>
        <Text style={styles.label}>Purchased amount (NOK)</Text>
        <TextInput
          style={[styles.input, hasTriedSubmit && !isValidAmount && styles.inputError]}
          value={amount}
          onChangeText={setAmount}
          placeholder="4999"
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
    gap: 10,
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
    backgroundColor: '#0f172a',
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
