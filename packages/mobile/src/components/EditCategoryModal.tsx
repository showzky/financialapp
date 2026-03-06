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
  category: CategoryWithSpent | null
  onCategoryUpdated: () => void
}

export function EditCategoryModal({
  isOpen,
  onClose,
  category,
  onCategoryUpdated,
}: Props) {
  const [name, setName] = useState(category?.name ?? '')
  const [allocated, setAllocated] = useState(String(category?.allocated ?? ''))
  const [categoryType, setCategoryType] = useState<'budget' | 'fixed'>(category?.type ?? 'budget')
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  React.useEffect(() => {
    if (category) {
      setName(category.name)
      setAllocated(String(category.allocated))
      setCategoryType(category.type)
      setHasTriedSubmit(false)
      setSubmitError('')
    }
  }, [category, isOpen])

  const handleClose = () => {
    onClose()
  }

  const errors = {
    name: !name.trim() ? 'Category name is required' : '',
    allocated:
      !allocated || isNaN(Number(allocated)) || Number(allocated) < 0
        ? categoryType === 'budget'
          ? 'Enter a valid budget amount'
          : 'Enter a valid amount'
        : '',
  }

  const hasErrors = Object.values(errors).some(Boolean)

  const handleSubmit = async () => {
    setHasTriedSubmit(true)
    if (hasErrors || !category) return

    setSubmitting(true)
    setSubmitError('')

    try {
      await transactionApi.updateCategory(category.id, {
        name: name.trim(),
        type: categoryType,
        allocated: Number(allocated),
      })

      handleClose()
      onCategoryUpdated()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update category')
    } finally {
      setSubmitting(false)
    }
  }

  if (!category) return null

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
            <Text style={styles.title}>Edit Category</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.label}>Category Name</Text>
              <TextInput
                style={[
                  styles.input,
                  hasTriedSubmit && errors.name && styles.inputError,
                ]}
                placeholder="Category name"
                placeholderTextColor="#d1d5db"
                value={name}
                onChangeText={setName}
                editable={!submitting}
              />
              {hasTriedSubmit && errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Category Type</Text>
              <View style={styles.typeToggle}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    categoryType === 'budget' && styles.typeButtonActive,
                  ]}
                  onPress={() => setCategoryType('budget')}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      categoryType === 'budget' && styles.typeButtonTextActive,
                    ]}
                  >
                    💰 Budget
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    categoryType === 'fixed' && styles.typeButtonActive,
                  ]}
                  onPress={() => setCategoryType('fixed')}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      categoryType === 'fixed' && styles.typeButtonTextActive,
                    ]}
                  >
                    🔧 Fixed
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {categoryType === 'budget' && (
              <View style={styles.section}>
                <Text style={styles.label}>Budget Amount</Text>
                <TextInput
                  style={[
                    styles.input,
                    hasTriedSubmit && errors.allocated && styles.inputError,
                  ]}
                  placeholder="0"
                  placeholderTextColor="#d1d5db"
                  keyboardType="decimal-pad"
                  value={allocated}
                  onChangeText={setAllocated}
                  editable={!submitting}
                />
                {hasTriedSubmit && errors.allocated && (
                  <Text style={styles.errorText}>{errors.allocated}</Text>
                )}
              </View>
            )}

            {categoryType === 'fixed' && (
              <View style={styles.section}>
                <Text style={styles.label}>Fixed Amount</Text>
                <TextInput
                  style={[
                    styles.input,
                    hasTriedSubmit && errors.allocated && styles.inputError,
                  ]}
                  placeholder="0"
                  placeholderTextColor="#d1d5db"
                  keyboardType="decimal-pad"
                  value={allocated}
                  onChangeText={setAllocated}
                  editable={!submitting}
                />
                {hasTriedSubmit && errors.allocated && (
                  <Text style={styles.errorText}>{errors.allocated}</Text>
                )}
              </View>
            )}

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
                <Text style={styles.submitButtonText}>Save Changes</Text>
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
