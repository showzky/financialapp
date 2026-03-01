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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  tabTextActive: {
    color: '#3b82f6',
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'right',
  },
  categoryPicker: {
    minHeight: 60,
  },
  categoryList: {
    flexGrow: 0,
  },
  categoryBubble: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  categoryBubbleActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  categoryBubbleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  categoryBubbleTextActive: {
    color: '#3b82f6',
  },
  categoryTypeBadge: {
    fontSize: 12,
    marginTop: 4,
  },
  noCategoriesText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 16,
  },
  typeToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  typeButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  typeButtonTextActive: {
    color: '#3b82f6',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  errorBoxText: {
    fontSize: 13,
    color: '#991b1b',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#3b82f6',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
})
