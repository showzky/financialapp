import React, { useEffect, useState } from 'react'
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
  Pressable,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { transactionApi } from '../services/transactionApi'
import { addExpenseModalStyles as styles } from './AddExpenseModal.styles'
import type { CategoryWithSpent } from '../services/dashboardApi'
import { CATEGORY_COLOR_OPTIONS, CATEGORY_ICON_COLOR_OPTIONS } from '../features/categories/catalog'
import { getPocketMoneyRoleLabel, inferPocketMoneyRole } from '../utils/pocketMoney'

type Props = {
  isOpen: boolean
  onClose: () => void
  categories: CategoryWithSpent[]
  selectedMonth: Date
  onTransactionCreated: () => void
}

type Mode = 'existing' | 'new'

function inferParentCategory(name: string) {
  const normalized = name.trim().toLowerCase()

  if (/(phone|mobile|telenor|telia|call|data)/.test(normalized)) return 'Mobile'
  if (/(food|grocery|grocer|supermarket|restaurant|takeaway|dinner)/.test(normalized)) return 'Food'
  if (/(home|rent|mortgage|electric|water|utility|internet)/.test(normalized)) return 'Home'
  if (/(car|fuel|transport|bus|train|parking|toll)/.test(normalized)) return 'Transport'
  if (/(travel|flight|hotel)/.test(normalized)) return 'Travel'
  if (/(gift)/.test(normalized)) return 'Gifts'
  if (/(doctor|health|medicine|pharmacy)/.test(normalized)) return 'Health'
  if (/(work|office)/.test(normalized)) return 'Work'
  if (/(school|course|education|study)/.test(normalized)) return 'Education'
  if (/(shop|shopping|clothing|clothes)/.test(normalized)) return 'Shopping'
  if (/(game|movie|stream|spotify|netflix|entertainment)/.test(normalized)) return 'Entertainment'

  return 'Other'
}

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
  const [newCategoryDueDayOfMonth, setNewCategoryDueDayOfMonth] = useState('')

  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (categories.length === 0) {
      setSelectedCategoryId('')
      return
    }

    const hasSelectedCategory = categories.some((category) => category.id === selectedCategoryId)
    if (!hasSelectedCategory) {
      setSelectedCategoryId(categories[0].id)
    }
  }, [categories, selectedCategoryId])

  const resetForm = () => {
    setMode('existing')
    setSelectedCategoryId(categories[0]?.id ?? '')
    setAmount('')
    setNote('')
    setNewCategoryName('')
    setNewCategoryType('budget')
    setNewCategoryAllocated('')
    setNewCategoryDueDayOfMonth('')
    setHasTriedSubmit(false)
    setSubmitting(false)
    setSubmitError('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const existingErrors = {
    category:
      categories.length > 0 && !selectedCategoryId
        ? 'Select a category'
        : '',
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
    dueDayOfMonth:
      newCategoryType === 'fixed' &&
      newCategoryDueDayOfMonth.trim().length > 0 &&
      (!Number.isInteger(Number(newCategoryDueDayOfMonth)) ||
        Number(newCategoryDueDayOfMonth) < 1 ||
        Number(newCategoryDueDayOfMonth) > 31)
        ? 'Enter a day between 1 and 31'
        : '',
    amount:
      !amount || isNaN(Number(amount)) || Number(amount) <= 0
        ? 'Enter a valid expense amount'
        : '',
  }

  const errors = mode === 'existing' ? existingErrors : newCategoryErrors
  const hasErrors = Object.values(errors).some(Boolean)
  const inferredPocketMoneyRole = inferPocketMoneyRole({
    name: newCategoryName,
    type: newCategoryType,
  })

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
          kind: 'expense',
          name: newCategoryName.trim(),
          parentName: inferParentCategory(newCategoryName),
          icon: newCategoryType === 'fixed' ? 'calendar-outline' : 'wallet-outline',
          color: CATEGORY_COLOR_OPTIONS[0],
          iconColor: CATEGORY_ICON_COLOR_OPTIONS[0],
          type: newCategoryType,
          allocated: newCategoryType === 'budget' ? Number(newCategoryAllocated) : Number(amount),
          dueDayOfMonth:
            newCategoryType === 'fixed' && newCategoryDueDayOfMonth.trim().length > 0
              ? Number(newCategoryDueDayOfMonth)
              : undefined,
        })
        categoryIdToUse = newCategory.id
      }

      const now = new Date()
      const isSelectedCurrentMonth =
        now.getFullYear() === selectedMonth.getFullYear() &&
        now.getMonth() === selectedMonth.getMonth()
      const transactionDate = isSelectedCurrentMonth
        ? now.toISOString().split('T')[0]
        : new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1)
            .toISOString()
            .split('T')[0]

      // Then create the transaction
      await transactionApi.createTransaction({
        categoryId: categoryIdToUse,
        amount: Number(amount),
        transactionDate,
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
      <View style={styles.root}>
        <Pressable style={styles.overlay} onPress={handleClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
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
                {hasTriedSubmit && existingErrors.category && (
                  <Text style={styles.errorText}>{existingErrors.category}</Text>
                )}
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
                  <View style={styles.roleHintBox}>
                    <Text style={styles.roleHintLabel}>Pocket money behavior</Text>
                    <Text style={styles.roleHintValue}>
                      {getPocketMoneyRoleLabel(inferredPocketMoneyRole)}
                    </Text>
                    <Text style={styles.roleHintText}>
                      Fixed categories count as bills. Budget names with words like saving count as
                      savings, and names like fun, personal, or pocket count as pocket money.
                    </Text>
                  </View>
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

                {newCategoryType === 'fixed' && (
                  <View style={styles.section}>
                    <Text style={styles.label}>Due Day Of Month</Text>
                    <TextInput
                      style={[
                        styles.input,
                        hasTriedSubmit && newCategoryErrors.dueDayOfMonth && styles.inputError,
                      ]}
                      placeholder="e.g., 20"
                      placeholderTextColor="#d1d5db"
                      keyboardType="number-pad"
                      value={newCategoryDueDayOfMonth}
                      onChangeText={setNewCategoryDueDayOfMonth}
                      editable={!submitting}
                    />
                    <Text style={styles.charCount}>
                      Optional. Used for the mobile upcoming timeline.
                    </Text>
                    {hasTriedSubmit && newCategoryErrors.dueDayOfMonth && (
                      <Text style={styles.errorText}>{newCategoryErrors.dueDayOfMonth}</Text>
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
      </View>
    </Modal>
  )
}
