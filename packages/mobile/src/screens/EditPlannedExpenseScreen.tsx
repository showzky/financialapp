import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Controller, useForm } from 'react-hook-form'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CategoryPickerModal } from '../components/categories/CategoryPickerModal'
import { type CategoryDto } from '../services/categoryApi'
import { incomeApi } from '../services/incomeApi'
import { transactionApi } from '../services/transactionApi'

type EditPlannedExpenseParams = {
  EditPlannedExpense: {
    entryType: 'expense' | 'income'
    entryId?: string
    transactionId?: string
    incomeCategoryId?: string | null
    categoryId?: string
    categoryLabel: string
    titleValue?: string
    amount: number
    dueDate: string
    accent: string
    recurring: boolean
    dueDayOfMonth: number | null
    autoFocusField?: 'amount'
  }
}

type EditEntryFormValues = {
  selectedCategory: CategoryDto | null
  nameValue: string
  amount: string
  date: Date
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
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

export function EditPlannedExpenseScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<RouteProp<EditPlannedExpenseParams, 'EditPlannedExpense'>>()
  const insets = useSafeAreaInsets()
  const params = route.params
  const initialDate = useMemo(() => new Date(params.dueDate), [params.dueDate])
  const amountInputRef = useRef<TextInput>(null)

  const [iosPickerMode, setIosPickerMode] = useState<null | 'date' | 'time'>(null)
  const [showMore, setShowMore] = useState(false)
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)
  const { control, watch, setValue, getValues } = useForm<EditEntryFormValues>({
    defaultValues: {
      selectedCategory:
        params.categoryId || params.incomeCategoryId
          ? {
              id: params.entryType === 'income' ? params.incomeCategoryId ?? '' : params.categoryId ?? '',
              userId: '',
              name: params.categoryLabel,
              parentName: 'Other',
              icon: 'ellipse-outline',
              color: params.accent,
              iconColor: params.accent,
              sortOrder: 0,
              isDefault: false,
              isArchived: false,
              createdAt: '',
            }
          : null,
      nameValue: params.titleValue ?? params.categoryLabel,
      amount: String(params.amount),
      date: initialDate,
    },
  })
  const selectedCategory = watch('selectedCategory')
  const nameValue = watch('nameValue')
  const amount = watch('amount')
  const date = watch('date')
  const categoryLabel = selectedCategory?.name ?? params.categoryLabel
  const categoryAccent = selectedCategory?.iconColor || selectedCategory?.color || params.accent
  const categoryIcon = (selectedCategory?.icon as keyof typeof Ionicons.glyphMap | null) ?? 'ellipse-outline'

  useEffect(() => {
    if (params.autoFocusField !== 'amount') return

    const timer = setTimeout(() => {
      amountInputRef.current?.focus()
    }, 250)

    return () => clearTimeout(timer)
  }, [params.autoFocusField])

  const amountError =
    !amount || Number.isNaN(Number(amount)) || Number(amount) < 0 ? 'Enter a valid amount' : ''
  const categoryError = !selectedCategory ? 'Choose a category' : ''
  const hasErrors = Boolean(amountError || categoryError)

  const openNativePicker = (pickerMode: 'date' | 'time') => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        mode: pickerMode,
        is24Hour: true,
        value: date,
        onChange: (_event, picked) => {
          if (!picked) return
          const current = getValues('date')
          setValue('date', pickerMode === 'date' ? mergeDatePart(current, picked) : mergeTimePart(current, picked))
        },
      })
      return
    }

    setIosPickerMode(pickerMode)
  }

  const handleSave = async () => {
    setHasTriedSubmit(true)
    if (hasErrors) return

    try {
      setSubmitting(true)
      setSubmitError('')
      if (params.entryType === 'income') {
        if (!params.entryId || !selectedCategory) {
          throw new Error('Missing income entry id')
        }

        await incomeApi.updateIncomeEntry(params.entryId, {
          incomeCategoryId: selectedCategory.id,
          category: selectedCategory.name,
          name: nameValue.trim() || selectedCategory.name,
          amount: Number(amount),
          receivedAt: date.toISOString(),
        })
      } else {
        if (!selectedCategory) {
          throw new Error('Missing category id')
        }

        if (params.transactionId) {
          await transactionApi.updateTransaction(params.transactionId, {
            categoryId: selectedCategory.id,
            amount: Number(amount),
            note: nameValue.trim() || undefined,
            transactionDate: date.toISOString().split('T')[0],
          })
        } else {
          if (!params.categoryId) {
            throw new Error('Missing category id')
          }

          await transactionApi.updateCategory(params.categoryId, {
            kind: 'expense',
            name: selectedCategory.name,
            parentName: selectedCategory.parentName,
            icon: selectedCategory.icon,
            color: selectedCategory.color,
            iconColor: selectedCategory.iconColor,
            sortOrder: selectedCategory.sortOrder,
            type: 'fixed',
            allocated: Number(amount),
            dueDayOfMonth: date.getDate(),
          })
        }
      }

      navigation.goBack()
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : params.entryType === 'income'
            ? 'Failed to save income entry'
            : 'Failed to save planned expense',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0e" />
      <LinearGradient colors={['#171623', '#0a0a0e', '#111728']} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top, 16), paddingBottom: 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
              <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.82)" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {params.entryType === 'income' ? 'Edit income' : 'Plan an outcome'}
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
              style={styles.inputShell}
              onPress={() => setCategoryPickerOpen(true)}
              activeOpacity={0.88}
              disabled={submitting}
            >
              <View
                style={[
                  styles.categoryIcon,
                  {
                    backgroundColor: `${categoryAccent}22`,
                    borderColor: `${categoryAccent}44`,
                  },
                ]}
              >
                <Ionicons name={categoryIcon} size={16} color={categoryAccent} />
              </View>
              <Text style={styles.inputText}>{categoryLabel}</Text>
              <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.26)" />
            </TouchableOpacity>
            {hasTriedSubmit && categoryError ? <Text style={styles.errorText}>{categoryError}</Text> : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Amount</Text>
            <View style={styles.amountRow}>
              <View style={[styles.inputShell, styles.amountShell]}>
                <TextInput
                  ref={amountInputRef}
                  style={styles.inputText}
                  value={amount}
                  onChangeText={(value) => setValue('amount', value)}
                  placeholder="0"
                  placeholderTextColor="rgba(255,255,255,0.24)"
                  keyboardType="decimal-pad"
                  editable={!submitting}
                  autoFocus={params.autoFocusField === 'amount'}
                />
                <Ionicons name="calculator-outline" size={16} color="rgba(255,255,255,0.28)" />
              </View>
              <View style={styles.currencyPill}>
                <Text style={styles.currencyText}>NOK</Text>
              </View>
            </View>
            {hasTriedSubmit && amountError ? <Text style={styles.errorText}>{amountError}</Text> : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Account</Text>
            <View style={styles.inputShell}>
              <Text style={[styles.inputText, styles.placeholderText]}>None</Text>
              <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.26)" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Date</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={[styles.inputShell, styles.dateShell]}
                activeOpacity={0.88}
                onPress={() => openNativePicker('date')}
              >
                <Text style={styles.inputText}>{formatDateLabel(date)}</Text>
                <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.28)" />
              </TouchableOpacity>
              <View style={styles.todayGroup}>
                <TouchableOpacity
                  style={styles.todayButton}
                  onPress={() => setValue('date', new Date())}
                  activeOpacity={0.9}
                >
                  <Text style={styles.todayButtonText}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.todayChevron}
                  onPress={() => setValue('date', new Date(date.getFullYear(), date.getMonth(), Math.min(date.getDate() + 1, 28)))}
                  activeOpacity={0.9}
                >
                  <Ionicons name="chevron-up" size={14} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Time</Text>
            <TouchableOpacity style={styles.inputShell} activeOpacity={0.88} onPress={() => openNativePicker('time')}>
              <Text style={styles.inputText}>
                {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.28)" />
            </TouchableOpacity>
          </View>

          {iosPickerMode && Platform.OS === 'ios' ? (
            <View style={styles.section}>
              <View style={styles.inputShell}>
                <DateTimePicker
                  mode={iosPickerMode}
                  display="spinner"
                  value={date}
                  is24Hour
                  onChange={(_event, picked) => {
                    if (!picked) return
                    const current = getValues('date')
                    setValue('date', iosPickerMode === 'date' ? mergeDatePart(current, picked) : mergeTimePart(current, picked))
                  }}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.label}>Name</Text>
            <View style={styles.inputShell}>
              <Controller
                control={control}
                name="nameValue"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.inputText}
                    value={value}
                    onChangeText={onChange}
                    placeholder="Name"
                    placeholderTextColor="rgba(255,255,255,0.24)"
                    editable={!submitting}
                  />
                )}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.moreButton} onPress={() => setShowMore((prev) => !prev)} activeOpacity={0.85}>
            <Text style={styles.moreButtonText}>MORE</Text>
            <Ionicons
              name={showMore ? 'chevron-up' : 'chevron-down'}
              size={14}
              color="rgba(92,163,255,0.94)"
            />
          </TouchableOpacity>

          {showMore ? (
            <View style={styles.morePanel}>
              <View style={styles.moreCard}>
                <Text style={styles.moreLabel}>Schedule</Text>
                <Text style={styles.moreValue}>{params.recurring ? 'Recurring fixed expense' : 'One-time'}</Text>
              </View>
              <View style={styles.moreCard}>
                <Text style={styles.moreLabel}>Due day</Text>
                <Text style={styles.moreValue}>{date.getDate()}</Text>
              </View>
            </View>
          ) : null}

          {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity style={styles.saveButton} onPress={() => void handleSave()} disabled={submitting} activeOpacity={0.9}>
            <LinearGradient colors={['rgba(92,163,255,0.98)', 'rgba(70,138,230,0.98)']} style={styles.saveGradient}>
              {submitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.82}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <CategoryPickerModal
        visible={categoryPickerOpen}
        initialKind={params.entryType === 'income' ? 'income' : 'expense'}
        selectedCategoryId={selectedCategory?.id}
        onClose={() => setCategoryPickerOpen(false)}
        onSelect={(category) => setValue('selectedCategory', category)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0e' },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 22,
    fontFamily: 'DMSans_700Bold',
  },
  headerSpacer: { width: 42 },
  section: { marginBottom: 16 },
  label: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: 12,
    marginBottom: 8,
    fontFamily: 'DMSans_500Medium',
  },
  inputShell: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputText: {
    flex: 1,
    color: 'rgba(255,255,255,0.88)',
    fontSize: 17,
    fontFamily: 'DMSans_500Medium',
    paddingVertical: 0,
  },
  placeholderText: {
    color: 'rgba(255,255,255,0.6)',
  },
  categoryIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountRow: { flexDirection: 'row', gap: 10 },
  amountShell: { flex: 1 },
  currencyPill: {
    minWidth: 96,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currencyText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 16,
    fontFamily: 'DMSans_600SemiBold',
  },
  dateRow: { flexDirection: 'row', gap: 10 },
  dateShell: { flex: 1 },
  todayGroup: {
    width: 120,
    flexDirection: 'row',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(92,163,255,0.94)',
  },
  todayButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  todayButtonText: { color: 'white', fontSize: 16, fontFamily: 'DMSans_700Bold' },
  todayChevron: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(10,10,14,0.24)',
  },
  moreButton: {
    marginTop: 4,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moreButtonText: {
    color: 'rgba(92,163,255,0.94)',
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
  },
  morePanel: {
    marginTop: 18,
    gap: 10,
  },
  moreCard: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  moreLabel: {
    color: 'rgba(255,255,255,0.34)',
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
  },
  moreValue: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.88)',
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
  },
  errorText: {
    marginTop: 6,
    color: '#ff9892',
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
  },
  submitError: {
    marginTop: 18,
    color: '#ffb1a6',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'DMSans_500Medium',
  },
  footer: {
    paddingHorizontal: 20,
    gap: 14,
  },
  saveButton: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  saveGradient: {
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: 'white',
    fontSize: 20,
    fontFamily: 'DMSans_700Bold',
  },
  cancelText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.82)',
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
  },
})
