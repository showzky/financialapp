import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { type CategoryWithSpent } from '../services/dashboardApi'
import { incomeApi } from '../services/incomeApi'
import { transactionApi } from '../services/transactionApi'
import { type CategoryDto } from '../services/categoryApi'
import { CategoryPickerModal } from './categories/CategoryPickerModal'
import { setIncomeModalStyles as styles } from './SetIncomeModal.styles'

type EntryMode = 'income' | 'expense'

type Props = {
  isOpen: boolean
  mode?: EntryMode
  selectedMonth: Date
  categories?: CategoryWithSpent[]
  onClose: () => void
  onEntryCreated: () => void
}

function formatDisplayDate(date: Date) {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatDisplayTime(date: Date) {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTransactionDate(date: Date) {
  return date.toISOString().split('T')[0]
}

function buildInitialDate(selectedMonth: Date) {
  const now = new Date()
  const isSelectedCurrentMonth =
    now.getFullYear() === selectedMonth.getFullYear() &&
    now.getMonth() === selectedMonth.getMonth()

  if (isSelectedCurrentMonth) {
    return now
  }

  return new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1, 9, 0, 0, 0)
}

function mergeDatePart(base: Date, picked: Date) {
  const next = new Date(base)
  next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate())
  return next
}

function mergeTimePart(base: Date, picked: Date) {
  const next = new Date(base)
  next.setHours(picked.getHours(), picked.getMinutes(), 0, 0)
  return next
}

function toCategoryDto(category: CategoryWithSpent): CategoryDto {
  return {
    id: category.id,
    userId: '',
    name: category.name,
    parentName: category.parentName,
    icon: category.icon,
    color: category.color,
    iconColor: category.iconColor,
    sortOrder: category.sortOrder,
    isDefault: category.isDefault,
    isArchived: category.isArchived,
    createdAt: '',
    type: category.type,
    allocated: category.allocated,
    spent: category.monthSpent,
    dueDayOfMonth: category.dueDayOfMonth ?? null,
  }
}

function getIoniconName(icon: string | null | undefined): keyof typeof Ionicons.glyphMap {
  if (icon && icon in Ionicons.glyphMap) {
    return icon as keyof typeof Ionicons.glyphMap
  }

  return 'ellipse-outline'
}

export function SetIncomeModal({
  isOpen,
  mode = 'income',
  selectedMonth,
  categories = [],
  onClose,
  onEntryCreated,
}: Props) {
  const defaultExpenseCategory = useMemo(
    () => (categories.length > 0 ? toCategoryDto(categories[0]) : null),
    [categories],
  )

  const [amount, setAmount] = useState('')
  const [entryName, setEntryName] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<CategoryDto | null>(defaultExpenseCategory)
  const [selectedDateTime, setSelectedDateTime] = useState(() => buildInitialDate(selectedMonth))
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false)
  const [iosPickerMode, setIosPickerMode] = useState<null | 'date' | 'time'>(null)
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const amountInputRef = useRef<TextInput>(null)

  useEffect(() => {
    if (!isOpen) {
      setCategoryPickerOpen(false)
      setIosPickerMode(null)
      return
    }

    setAmount('')
    setEntryName('')
    setSelectedCategory(mode === 'expense' ? defaultExpenseCategory : null)
    setSelectedDateTime(buildInitialDate(selectedMonth))
    setHasTriedSubmit(false)
    setSubmitting(false)
    setSubmitError('')
    setCategoryPickerOpen(false)
    setIosPickerMode(null)

    const timer = setTimeout(() => {
      amountInputRef.current?.focus()
    }, 250)

    return () => clearTimeout(timer)
  }, [defaultExpenseCategory, isOpen, mode, selectedMonth])

  const amountError =
    amount === '' || isNaN(Number(amount)) || Number(amount) <= 0
      ? `Enter a valid ${mode} amount`
      : ''
  const categoryError = !selectedCategory ? `Choose a ${mode} category` : ''

  const handleClose = () => {
    setCategoryPickerOpen(false)
    setIosPickerMode(null)
    setHasTriedSubmit(false)
    setSubmitError('')
    onClose()
  }

  const openNativePicker = (pickerMode: 'date' | 'time') => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        mode: pickerMode,
        is24Hour: true,
        value: selectedDateTime,
        onChange: (_event, picked) => {
          if (!picked) return
          setSelectedDateTime((current) =>
            pickerMode === 'date' ? mergeDatePart(current, picked) : mergeTimePart(current, picked),
          )
        },
      })
      return
    }

    setIosPickerMode(pickerMode)
  }

  const handleSubmit = async () => {
    setHasTriedSubmit(true)
    if (amountError || categoryError || !selectedCategory) return

    setSubmitting(true)
    setSubmitError('')
    try {
      if (mode === 'income') {
        await incomeApi.createIncomeEntry({
          incomeCategoryId: selectedCategory.id,
          category: selectedCategory.name,
          name: entryName.trim() || selectedCategory.name,
          amount: Number(amount),
          receivedAt: selectedDateTime.toISOString(),
          isPaid: true,
        })
      } else {
        await transactionApi.createTransaction({
          categoryId: selectedCategory.id,
          amount: Number(amount),
          transactionDate: formatTransactionDate(selectedDateTime),
          note: entryName.trim() || undefined,
        })
      }

      onEntryCreated()
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : mode === 'income'
            ? 'Failed to add income'
            : 'Failed to add expense',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Modal visible={isOpen} transparent animationType="slide" onRequestClose={handleClose}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose} />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
          >
            <View style={styles.sheet}>
              <LinearGradient colors={['#161524', '#0d0d18']} style={styles.sheetGradient} />
              <View style={styles.handle} />

              <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                  <TouchableOpacity
                    onPress={handleClose}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                  <Text style={styles.title}>{mode === 'income' ? 'Add Income' : 'Add Expense'}</Text>
                  <View style={styles.headerSpacer} />
                </View>

                <View style={styles.content}>
                  <View style={styles.section}>
                    <Text style={styles.label}>CATEGORY</Text>
                    <TouchableOpacity
                      style={styles.selectRow}
                      activeOpacity={0.9}
                      onPress={() => setCategoryPickerOpen(true)}
                    >
                      {selectedCategory ? (
                        <>
                          <View
                            style={[
                              styles.selectIcon,
                              {
                                backgroundColor: selectedCategory.color,
                                borderColor: 'rgba(255,255,255,0.08)',
                              },
                            ]}
                          >
                            <Ionicons
                              name={getIoniconName(selectedCategory.icon)}
                              size={16}
                              color={selectedCategory.iconColor}
                            />
                          </View>
                          <Text style={styles.selectText}>{selectedCategory.name}</Text>
                        </>
                      ) : (
                        <Text style={styles.placeholderText}>Choose a category</Text>
                      )}
                      <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.3)" />
                    </TouchableOpacity>
                    {hasTriedSubmit && categoryError ? <Text style={styles.errorText}>{categoryError}</Text> : null}
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.label}>AMOUNT</Text>
                    <View style={styles.amountRow}>
                      <TextInput
                        ref={amountInputRef}
                        style={[
                          styles.input,
                          styles.amountInput,
                          hasTriedSubmit && amountError ? styles.inputError : undefined,
                        ]}
                        placeholder="0"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        keyboardType="decimal-pad"
                        value={amount}
                        onChangeText={setAmount}
                        editable={!submitting}
                      />
                      <View style={styles.currencyPill}>
                        <Text style={styles.currencyText}>NOK</Text>
                      </View>
                    </View>
                    {hasTriedSubmit && amountError ? <Text style={styles.errorText}>{amountError}</Text> : null}
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.label}>DATE</Text>
                    <View style={styles.dateRow}>
                      <TouchableOpacity
                        style={[styles.input, styles.dateField]}
                        onPress={() => openNativePicker('date')}
                        activeOpacity={0.9}
                      >
                        <Text style={styles.dateText}>{formatDisplayDate(selectedDateTime)}</Text>
                        <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.3)" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.todayPill}
                        onPress={() => setSelectedDateTime(new Date())}
                        activeOpacity={0.9}
                      >
                        <Text style={styles.todayText}>Today</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.label}>TIME</Text>
                    <TouchableOpacity
                      style={styles.inlineField}
                      onPress={() => openNativePicker('time')}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.dateText}>{formatDisplayTime(selectedDateTime)}</Text>
                      <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.3)" />
                    </TouchableOpacity>
                  </View>

                  {iosPickerMode && Platform.OS === 'ios' ? (
                    <View style={styles.section}>
                      <View style={styles.inlineField}>
                        <DateTimePicker
                          mode={iosPickerMode}
                          display="spinner"
                          value={selectedDateTime}
                          is24Hour
                          onChange={(_event, picked) => {
                            if (!picked) return
                            setSelectedDateTime((current) =>
                              iosPickerMode === 'date'
                                ? mergeDatePart(current, picked)
                                : mergeTimePart(current, picked),
                            )
                          }}
                          style={{ flex: 1 }}
                        />
                      </View>
                    </View>
                  ) : null}

                  <View style={styles.section}>
                    <Text style={styles.label}>{mode === 'income' ? 'NAME (OPTIONAL)' : 'NOTE (OPTIONAL)'}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={mode === 'income' ? 'e.g. March salary' : 'e.g. Dinner, Uber, rent'}
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      value={entryName}
                      onChangeText={setEntryName}
                      editable={!submitting}
                    />
                    <Text style={styles.hint}>
                      {mode === 'income'
                        ? 'Choose any date and time. Future-dated income stays out of totals until that date arrives.'
                        : 'Choose any date and time. Future-dated expenses stay out of totals until that date arrives.'}
                    </Text>
                  </View>

                  {submitError ? (
                    <View style={styles.errorBox}>
                      <Ionicons name="alert-circle" size={16} color="rgba(201,107,107,0.9)" />
                      <Text style={styles.errorBoxText}>{submitError}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.footer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleClose}
                    disabled={submitting}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                    disabled={submitting}
                  >
                    <LinearGradient
                      colors={
                        hasTriedSubmit && (amountError || categoryError)
                          ? ['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.1)']
                          : mode === 'income'
                            ? ['rgba(94,189,151,0.9)', 'rgba(60,150,110,0.9)']
                            : ['rgba(91,163,201,0.92)', 'rgba(60,120,175,0.92)']
                      }
                      style={styles.submitGradient}
                    >
                      {submitting ? (
                        <ActivityIndicator size="small" color="#0a0a0e" />
                      ) : (
                        <Text style={styles.submitButtonText}>
                          {mode === 'income' ? 'Add Income' : 'Add Expense'}
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <CategoryPickerModal
        visible={categoryPickerOpen}
        initialKind={mode === 'income' ? 'income' : 'expense'}
        selectedCategoryId={selectedCategory?.id}
        onClose={() => setCategoryPickerOpen(false)}
        onSelect={(category) => {
          setSelectedCategory(category)
        }}
      />
    </>
  )
}
