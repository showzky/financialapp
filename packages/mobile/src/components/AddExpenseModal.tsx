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
import { transactionApi } from '../services/transactionApi'
import { addExpenseModalStyles as styles } from './AddExpenseModal.styles'
import type { CategoryWithSpent } from '../services/dashboardApi'

type Props = {
  isOpen: boolean
  onClose: () => void
  categories: CategoryWithSpent[]
  selectedMonth: Date
  onTransactionCreated: () => void
}

type Mode = 'existing' | 'new'

export function AddExpenseModal({
  isOpen,
  onClose,
  categories,
  selectedMonth,
  onTransactionCreated,
}: Props) {
  const [mode, setMode] = useState<Mode>('existing')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  // New category fields
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryType, setNewCategoryType] = useState<'budget' | 'fixed'>('budget')
  const [newCategoryAllocated, setNewCategoryAllocated] = useState('')

  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const resetForm = () => {
    setMode('existing')
    setSelectedCategoryId(categories[0]?.id ?? '')
    setAmount('')
    setNote('')
    setNewCategoryName('')
    setNewCategoryType('budget')
    setNewCategoryAllocated('')
    setHasTriedSubmit(false)
    setSubmitting(false)
    setSubmitError('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const existingErrors = {
    amount:
      !amount || isNaN(Number(amount)) || Number(amount) <= 0
        ? 'Enter a valid amount'
        : '',
  }

  const newCategoryErrors = {
    name: !newCategoryName.trim() ? 'Category name is required' : '',
    allocated:
      newCategoryType === 'budget' && (!newCategoryAllocated || isNaN(Number(newCategoryAllocated)) || Number(newCategoryAllocated) < 0)
        ? 'Enter a valid budget amount'
        : '',
    amount:
      !amount || isNaN(Number(amount)) || Number(amount) <= 0
        ? 'Enter a valid expense amount'
        : '',
  }

  const errors = mode === 'existing' ? existingErrors : newCategoryErrors
  const hasErrors = Object.values(errors).some(Boolean)

  const handleSubmit = async () => {
    setHasTriedSubmit(true)
    if (hasErrors) return

    setSubmitting(true)
    setSubmitError('')

    try {
      let categoryIdToUse = selectedCategoryId

      // If creating a new category first
      if (mode === 'new') {
        const newCategory = await transactionApi.createCategory({
          name: newCategoryName.trim(),
          type: newCategoryType,
          allocated: newCategoryType === 'budget' ? Number(newCategoryAllocated) : 0,
        })
        categoryIdToUse = newCategory.id
      }

      // Use today's date
      const today = new Date().toISOString().split('T')[0]

      // Then create the transaction
      await transactionApi.createTransaction({
        categoryId: categoryIdToUse,
        amount: Number(amount),
        transactionDate: today,
        note: note.trim() || undefined,
      })

      resetForm()
      onTransactionCreated()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create expense')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Expense</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Mode Tabs */}
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, mode === 'existing' && styles.tabActive]}
                onPress={() => setMode('existing')}
              >
                <Text
                  style={[
                    styles.tabText,
                    mode === 'existing' && styles.tabTextActive,
                  ]}
                >
                  Existing Category
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, mode === 'new' && styles.tabActive]}
                onPress={() => setMode('new')}
              >
                <Text
                  style={[styles.tabText, mode === 'new' && styles.tabTextActive]}
                >
                  New Category
                </Text>
              </TouchableOpacity>
            </View>

            {/* Existing Category Mode */}
            {mode === 'existing' && (
              <View style={styles.section}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryPicker}>
                  {categories.length > 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.categoryList}
                    >
                      {categories.map((cat) => (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            styles.categoryBubble,
                            selectedCategoryId === cat.id &&
                              styles.categoryBubbleActive,
                          ]}
                          onPress={() => setSelectedCategoryId(cat.id)}
                        >
                          <Text
                            style={[
                              styles.categoryBubbleText,
                              selectedCategoryId === cat.id &&
                                styles.categoryBubbleTextActive,
                            ]}
                            numberOfLines={2}
                          >
                            {cat.name}
                          </Text>
                          <Text style={styles.categoryTypeBadge}>
                            {cat.type === 'fixed' ? '🔧' : '💰'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : (
                    <Text style={styles.noCategoriesText}>No categories available</Text>
                  )}
                </View>
              </View>
            )}

            {/* New Category Mode */}
            {mode === 'new' && (
              <>
                <View style={styles.section}>
                  <Text style={styles.label}>Category Name</Text>
                  <TextInput
                    style={[
                      styles.input,
                      hasTriedSubmit && newCategoryErrors.name && styles.inputError,
                    ]}
                    placeholder="e.g., Groceries, Utilities"
                    placeholderTextColor="#d1d5db"
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    editable={!submitting}
                  />
                  {hasTriedSubmit && newCategoryErrors.name && (
                    <Text style={styles.errorText}>{newCategoryErrors.name}</Text>
                  )}
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>Category Type</Text>
                  <View style={styles.typeToggle}>
                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        newCategoryType === 'budget' && styles.typeButtonActive,
                      ]}
                      onPress={() => setNewCategoryType('budget')}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          newCategoryType === 'budget' &&
                            styles.typeButtonTextActive,
                        ]}
                      >
                        💰 Budget
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        newCategoryType === 'fixed' && styles.typeButtonActive,
                      ]}
                      onPress={() => setNewCategoryType('fixed')}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          newCategoryType === 'fixed' &&
                            styles.typeButtonTextActive,
                        ]}
                      >
                        🔧 Fixed
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {newCategoryType === 'budget' && (
                  <View style={styles.section}>
                    <Text style={styles.label}>Budget Amount</Text>
                    <TextInput
                      style={[
                        styles.input,
                        hasTriedSubmit && newCategoryErrors.allocated && styles.inputError,
                      ]}
                      placeholder="0"
                      placeholderTextColor="#d1d5db"
                      keyboardType="decimal-pad"
                      value={newCategoryAllocated}
                      onChangeText={setNewCategoryAllocated}
                      editable={!submitting}
                    />
                    {hasTriedSubmit && newCategoryErrors.allocated && (
                      <Text style={styles.errorText}>{newCategoryErrors.allocated}</Text>
                    )}
                  </View>
                )}
              </>
            )}

            {/* Common Fields */}
            <View style={styles.section}>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={[
                  styles.input,
                  hasTriedSubmit && errors.amount && styles.inputError,
                ]}
                placeholder="0.00"
                placeholderTextColor="#d1d5db"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                editable={!submitting}
              />
              {hasTriedSubmit && errors.amount && (
                <Text style={styles.errorText}>{errors.amount}</Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Note (optional)</Text>
              <TextInput
                style={[styles.input, styles.noteInput]}
                placeholder="What was this for?"
                placeholderTextColor="#d1d5db"
                value={note}
                onChangeText={setNote}
                maxLength={400}
                editable={!submitting}
              />
              <Text style={styles.charCount}>
                {note.length}/400
              </Text>
            </View>

            {submitError && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.errorBoxText}>{submitError}</Text>
              </View>
            )}
          </ScrollView>

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
              style={[styles.submitButton, hasErrors && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Add Expense</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
