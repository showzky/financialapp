import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Controller, useForm } from 'react-hook-form'
import { type CategoryWithSpent } from '../services/dashboardApi'
import { FinancialAccountPickerModal } from './balance/FinancialAccountPickerModal'
import { financialAccountApi } from '../services/financialAccountApi'
import { incomeApi, type RepeatOption } from '../services/incomeApi'
import { incomeReminderScheduler } from '../services/incomeReminderScheduler'
import { transactionApi } from '../services/transactionApi'
import { borrowedLoanApi } from '../services/borrowedLoanApi'
import { wishlistApi } from '../services/wishlistApi'
import { type CategoryDto } from '../services/categoryApi'
import type { FinancialAccount } from '../shared/contracts/accounts'
import { CategoryPickerModal } from './categories/CategoryPickerModal'
import { GoalDebtPickerSheet, type GoalDebtTarget } from './GoalDebtPickerSheet'
import { OptionPickerSheet } from './OptionPickerSheet'
import { setIncomeModalStyles as styles } from './SetIncomeModal.styles'

type EntryMode = 'income' | 'expense'

type RemindOption = 'none' | 'on_date' | 'custom'

type Props = {
  isOpen: boolean
  mode?: EntryMode
  selectedMonth: Date
  categories?: CategoryWithSpent[]
  onClose: () => void
  onEntryCreated: () => void
}

type EntryFormValues = {
  amount: string
  entryName: string
  selectedCategory: CategoryDto | null
  selectedDateTime: Date
  isPaid: boolean
  countsTowardBills: boolean
  selectedAccountId: string | null
  notes: string
  // Repeat
  repeatOption: RepeatOption
  repeatCustomDate: Date | null
  // Remind
  remindOption: RemindOption
  remindDate: Date | null
  // Goal or Debt
  goalDebtTarget: GoalDebtTarget | null
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

const REPEAT_OPTIONS = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'weekly', label: 'Every week' },
  { value: 'monthly', label: 'Every month' },
  { value: 'custom', label: 'Custom date…', hint: 'Pick a specific next occurrence date' },
] satisfies { value: RepeatOption; label: string; hint?: string }[]

const REMIND_OPTIONS = [
  { value: 'none', label: "Don't remind" },
  { value: 'on_date', label: 'On the day', hint: 'Notify at 9:00 AM on the income date' },
  { value: 'custom', label: 'Pick a date…', hint: 'Choose an exact reminder date and time' },
] satisfies { value: RemindOption; label: string; hint?: string }[]

function repeatLabel(option: RepeatOption, customDate: Date | null): string {
  if (option === 'weekly') return 'Every week'
  if (option === 'monthly') return 'Every month'
  if (option === 'custom') {
    return customDate ? `Next: ${formatDisplayDate(customDate)}` : 'Custom date…'
  }
  return 'Does not repeat'
}

function remindLabel(option: RemindOption, remindDate: Date | null): string {
  if (option === 'on_date') return 'On the day'
  if (option === 'custom') {
    return remindDate
      ? `${formatDisplayDate(remindDate)} ${formatDisplayTime(remindDate)}`
      : 'Pick a date…'
  }
  return "Don't remind"
}

function goalDebtLabel(target: GoalDebtTarget | null): string {
  if (!target) return 'None'
  if (target.type === 'wishlist') return `Goal: ${target.title}`
  return `Debt: ${target.lender}`
}

export function SetIncomeModal({
  isOpen,
  mode = 'income',
  selectedMonth,
  categories = [],
  onClose,
  onEntryCreated,
}: Props) {
  const defaultExpenseCategory = useMemo(() => {
    if (categories.length === 0) return null
    const preferredExpenseCategory =
      categories.find((category) => category.type === 'fixed') ?? categories[0]
    return toCategoryDto(preferredExpenseCategory)
  }, [categories])

  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false)
  const [accountPickerOpen, setAccountPickerOpen] = useState(false)
  const [repeatPickerOpen, setRepeatPickerOpen] = useState(false)
  const [remindPickerOpen, setRemindPickerOpen] = useState(false)
  const [goalDebtPickerOpen, setGoalDebtPickerOpen] = useState(false)
  const [iosPickerMode, setIosPickerMode] = useState<null | 'date' | 'time'>(null)
  // Separate iOS picker mode for remind date
  const [iosRemindPickerMode, setIosRemindPickerMode] = useState<null | 'date' | 'time'>(null)
  // Separate iOS picker mode for repeat custom date
  const [iosRepeatCustomPickerOpen, setIosRepeatCustomPickerOpen] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [accounts, setAccounts] = useState<FinancialAccount[]>([])
  const amountInputRef = useRef<TextInput>(null)

  const { control, watch, reset, setValue, getValues } = useForm<EntryFormValues>({
    defaultValues: {
      amount: '',
      entryName: '',
      selectedCategory: mode === 'expense' ? defaultExpenseCategory : null,
      selectedDateTime: buildInitialDate(selectedMonth),
      isPaid: true,
      countsTowardBills: false,
      selectedAccountId: null,
      notes: '',
      repeatOption: 'none',
      repeatCustomDate: null,
      remindOption: 'none',
      remindDate: null,
      goalDebtTarget: null,
    },
  })

  const amount = watch('amount')
  const entryName = watch('entryName')
  const selectedCategory = watch('selectedCategory')
  const selectedDateTime = watch('selectedDateTime')
  const isPaid = watch('isPaid')
  const countsTowardBills = watch('countsTowardBills')
  const selectedAccountId = watch('selectedAccountId')
  const notes = watch('notes')
  const repeatOption = watch('repeatOption')
  const repeatCustomDate = watch('repeatCustomDate')
  const remindOption = watch('remindOption')
  const remindDate = watch('remindDate')
  const goalDebtTarget = watch('goalDebtTarget')

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId],
  )

  useEffect(() => {
    if (!isOpen) {
      setCategoryPickerOpen(false)
      setAccountPickerOpen(false)
      setIosPickerMode(null)
      setIosRemindPickerMode(null)
      setIosRepeatCustomPickerOpen(false)
      return
    }

    reset({
      amount: '',
      entryName: '',
      selectedCategory: mode === 'expense' ? defaultExpenseCategory : null,
      selectedDateTime: buildInitialDate(selectedMonth),
      isPaid: true,
      countsTowardBills: false,
      selectedAccountId: null,
      notes: '',
      repeatOption: 'none',
      repeatCustomDate: null,
      remindOption: 'none',
      remindDate: null,
      goalDebtTarget: null,
    })
    setShowMore(false)
    setHasTriedSubmit(false)
    setSubmitting(false)
    setSubmitError('')
    setCategoryPickerOpen(false)
    setAccountPickerOpen(false)
    setIosPickerMode(null)
    setIosRemindPickerMode(null)
    setIosRepeatCustomPickerOpen(false)

    const timer = setTimeout(() => {
      amountInputRef.current?.focus()
    }, 250)

    return () => clearTimeout(timer)
  }, [defaultExpenseCategory, isOpen, mode, reset, selectedMonth])

  useEffect(() => {
    if (!isOpen) return
    void financialAccountApi
      .listAccounts()
      .then(setAccounts)
      .catch((err) => {
        console.error('Failed to load accounts for entry modal:', err)
        setAccounts([])
      })
  }, [isOpen])

  const amountError =
    amount === '' || isNaN(Number(amount)) || Number(amount) <= 0
      ? `Enter a valid ${mode} amount`
      : ''
  const categoryError = !selectedCategory ? `Choose a ${mode} category` : ''

  const handleClose = () => {
    setCategoryPickerOpen(false)
    setIosPickerMode(null)
    setIosRemindPickerMode(null)
    setIosRepeatCustomPickerOpen(false)
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
          const current = getValues('selectedDateTime')
          setValue(
            'selectedDateTime',
            pickerMode === 'date' ? mergeDatePart(current, picked) : mergeTimePart(current, picked),
          )
        },
      })
      return
    }
    setIosPickerMode(pickerMode)
  }

  const openRemindDatePicker = (pickerMode: 'date' | 'time') => {
    if (Platform.OS === 'android') {
      const current = getValues('remindDate') ?? new Date()
      DateTimePickerAndroid.open({
        mode: pickerMode,
        is24Hour: true,
        value: current,
        onChange: (_event, picked) => {
          if (!picked) return
          const base = getValues('remindDate') ?? new Date()
          setValue(
            'remindDate',
            pickerMode === 'date' ? mergeDatePart(base, picked) : mergeTimePart(base, picked),
          )
        },
      })
      return
    }
    setIosRemindPickerMode(pickerMode)
  }

  const openRepeatCustomPicker = () => {
    if (Platform.OS === 'android') {
      const current = getValues('repeatCustomDate') ?? new Date()
      DateTimePickerAndroid.open({
        mode: 'date',
        is24Hour: true,
        value: current,
        onChange: (_event, picked) => {
          if (!picked) return
          setValue('repeatCustomDate', picked)
        },
      })
      return
    }
    setIosRepeatCustomPickerOpen(true)
  }

  const handleSubmit = async () => {
    setHasTriedSubmit(true)
    if (amountError || categoryError || !selectedCategory) return

    setSubmitting(true)
    setSubmitError('')
    try {
      if (mode === 'income') {
        const entry = await incomeApi.createIncomeEntry({
          incomeCategoryId: selectedCategory.id,
          category: selectedCategory.name,
          name: entryName.trim() || selectedCategory.name,
          amount: Number(amount),
          receivedAt: selectedDateTime.toISOString(),
          accountId: selectedAccount?.id,
          accountName: selectedAccount?.name,
          isPaid,
          repeat: repeatOption !== 'none' ? repeatOption : undefined,
          repeatCustomDate:
            repeatOption === 'custom' && repeatCustomDate
              ? repeatCustomDate.toISOString().split('T')[0]
              : undefined,
        })

        // Schedule reminder notification
        if (remindOption !== 'none') {
          let reminderDate: Date | null = null
          if (remindOption === 'on_date') {
            reminderDate = new Date(selectedDateTime)
            reminderDate.setHours(9, 0, 0, 0)
          } else if (remindOption === 'custom' && remindDate) {
            reminderDate = remindDate
          }
          if (reminderDate) {
            await incomeReminderScheduler.scheduleAsync(
              entry.id,
              reminderDate,
              entryName.trim() || selectedCategory.name,
            ).catch((err) => {
              console.warn('Failed to schedule income reminder:', err)
            })
          }
        }

        // Apply to goal or debt
        if (goalDebtTarget) {
          const amountValue = Number(amount)
          if (goalDebtTarget.type === 'wishlist') {
            await wishlistApi
              .update(goalDebtTarget.id, {
                savedAmount: goalDebtTarget.savedAmount + amountValue,
              })
              .catch((err) => {
                console.warn('Failed to update wishlist saved amount:', err)
              })
          } else if (goalDebtTarget.type === 'borrowed_loan') {
            await borrowedLoanApi
              .update(goalDebtTarget.id, {
                currentBalance: Math.max(0, goalDebtTarget.currentBalance - amountValue),
              })
              .catch((err) => {
                console.warn('Failed to update borrowed loan balance:', err)
              })
          }
        }
      } else {
        await transactionApi.createTransaction({
          categoryId: selectedCategory.id,
          accountId: selectedAccount?.id ?? undefined,
          amount: Number(amount),
          transactionDate: formatTransactionDate(selectedDateTime),
          note: notes.trim() || entryName.trim() || undefined,
          isPaid,
          countsTowardBills,
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
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
          >
            <View style={styles.sheet}>
              <LinearGradient colors={['#161524', '#0d0d18']} style={styles.sheetGradient} />

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
                      <Controller
                        control={control}
                        name="amount"
                        render={({ field: { onChange, value } }) => (
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
                            value={value}
                            onChangeText={onChange}
                            editable={!submitting}
                          />
                        )}
                      />
                      <View style={styles.currencyPill}>
                        <Text style={styles.currencyText}>NOK</Text>
                      </View>
                      <View style={styles.paidPill}>
                        <Text style={styles.paidText}>Paid</Text>
                        <Switch
                          value={isPaid}
                          onValueChange={(value) => setValue('isPaid', value)}
                          trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(123,82,220,0.4)' }}
                          thumbColor={isPaid ? '#c65cff' : '#f4f4f8'}
                        />
                      </View>
                    </View>
                    {hasTriedSubmit && amountError ? <Text style={styles.errorText}>{amountError}</Text> : null}
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.label}>ACCOUNT</Text>
                    <TouchableOpacity
                      style={styles.inlineField}
                      activeOpacity={0.9}
                      onPress={() => setAccountPickerOpen(true)}
                    >
                      <Text style={styles.dateText}>{selectedAccount?.name ?? 'None'}</Text>
                      <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.3)" />
                    </TouchableOpacity>
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
                        onPress={() => setValue('selectedDateTime', new Date())}
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
                            const current = getValues('selectedDateTime')
                            setValue(
                              'selectedDateTime',
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
                    <Text style={styles.label}>NAME</Text>
                    <Controller
                      control={control}
                      name="entryName"
                      render={({ field: { onChange, value } }) => (
                        <TextInput
                          style={styles.input}
                          placeholder={mode === 'income' ? 'e.g. March salary' : 'e.g. Phone bill'}
                          placeholderTextColor="rgba(255,255,255,0.2)"
                          value={value}
                          onChangeText={onChange}
                          editable={!submitting}
                        />
                      )}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.moreToggle}
                    onPress={() => setShowMore((current) => !current)}
                    activeOpacity={0.86}
                  >
                    <Text style={styles.moreToggleText}>MORE</Text>
                    <Ionicons name={showMore ? 'chevron-up' : 'chevron-down'} size={14} color="rgba(92,163,255,0.92)" />
                  </TouchableOpacity>

                  {showMore ? (
                    <>
                      <View style={styles.section}>
                        <Text style={styles.label}>NOTES</Text>
                        <Controller
                          control={control}
                          name="notes"
                          render={({ field: { onChange, value } }) => (
                            <TextInput
                              style={[styles.input, styles.multilineInput]}
                              placeholder="Add a note"
                              placeholderTextColor="rgba(255,255,255,0.2)"
                              value={value}
                              onChangeText={onChange}
                              editable={!submitting}
                              multiline
                            />
                          )}
                        />
                      </View>

                      {/* REPEAT — income only */}
                      {mode === 'income' ? (
                        <View style={styles.section}>
                          <Text style={styles.label}>REPEAT</Text>
                          <TouchableOpacity
                            style={styles.inlineField}
                            activeOpacity={0.9}
                            onPress={() => setRepeatPickerOpen(true)}
                          >
                            <Text style={styles.dateText}>
                              {repeatLabel(repeatOption, repeatCustomDate)}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.3)" />
                          </TouchableOpacity>
                          {/* Show date picker for custom repeat date */}
                          {repeatOption === 'custom' ? (
                            <TouchableOpacity
                              style={[styles.inlineField, { marginTop: 8 }]}
                              activeOpacity={0.9}
                              onPress={openRepeatCustomPicker}
                            >
                              <Text style={styles.dateText}>
                                {repeatCustomDate ? formatDisplayDate(repeatCustomDate) : 'Pick next occurrence…'}
                              </Text>
                              <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.3)" />
                            </TouchableOpacity>
                          ) : null}
                          {iosRepeatCustomPickerOpen && Platform.OS === 'ios' ? (
                            <View style={[styles.inlineField, { marginTop: 8 }]}>
                              <DateTimePicker
                                mode="date"
                                display="spinner"
                                value={repeatCustomDate ?? new Date()}
                                onChange={(_event, picked) => {
                                  if (picked) setValue('repeatCustomDate', picked)
                                }}
                                style={{ flex: 1 }}
                              />
                            </View>
                          ) : null}
                        </View>
                      ) : null}

                      {/* REMIND — income only */}
                      {mode === 'income' ? (
                        <View style={styles.section}>
                          <Text style={styles.label}>REMIND</Text>
                          <TouchableOpacity
                            style={styles.inlineField}
                            activeOpacity={0.9}
                            onPress={() => setRemindPickerOpen(true)}
                          >
                            <Text style={styles.dateText}>
                              {remindLabel(remindOption, remindDate)}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.3)" />
                          </TouchableOpacity>
                          {/* Show date + time pickers when custom remind is selected */}
                          {remindOption === 'custom' ? (
                            <View style={{ marginTop: 8, gap: 8 }}>
                              <TouchableOpacity
                                style={styles.inlineField}
                                activeOpacity={0.9}
                                onPress={() => openRemindDatePicker('date')}
                              >
                                <Text style={styles.dateText}>
                                  {remindDate ? formatDisplayDate(remindDate) : 'Pick date…'}
                                </Text>
                                <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.3)" />
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.inlineField}
                                activeOpacity={0.9}
                                onPress={() => openRemindDatePicker('time')}
                              >
                                <Text style={styles.dateText}>
                                  {remindDate ? formatDisplayTime(remindDate) : 'Pick time…'}
                                </Text>
                                <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.3)" />
                              </TouchableOpacity>
                            </View>
                          ) : null}
                          {iosRemindPickerMode && Platform.OS === 'ios' ? (
                            <View style={[styles.inlineField, { marginTop: 8 }]}>
                              <DateTimePicker
                                mode={iosRemindPickerMode}
                                display="spinner"
                                value={remindDate ?? new Date()}
                                is24Hour
                                onChange={(_event, picked) => {
                                  if (!picked) return
                                  const base = getValues('remindDate') ?? new Date()
                                  setValue(
                                    'remindDate',
                                    iosRemindPickerMode === 'date'
                                      ? mergeDatePart(base, picked)
                                      : mergeTimePart(base, picked),
                                  )
                                }}
                                style={{ flex: 1 }}
                              />
                            </View>
                          ) : null}
                        </View>
                      ) : null}

                      {/* GOAL OR DEBT — income only */}
                      {mode === 'income' ? (
                        <View style={styles.section}>
                          <Text style={styles.label}>GOAL OR DEBT</Text>
                          <TouchableOpacity
                            style={styles.inlineField}
                            activeOpacity={0.9}
                            onPress={() => setGoalDebtPickerOpen(true)}
                          >
                            <Text style={styles.dateText}>{goalDebtLabel(goalDebtTarget)}</Text>
                            <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.3)" />
                          </TouchableOpacity>
                        </View>
                      ) : null}

                      <View style={styles.section}>
                        <Text style={styles.label}>COLOR</Text>
                        <TouchableOpacity style={styles.inlineField} activeOpacity={0.9}>
                          <Text style={styles.dateText}>Default</Text>
                          <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.3)" />
                        </TouchableOpacity>
                      </View>

                      {mode === 'expense' ? (
                        <View style={styles.section}>
                          <Text style={styles.label}>BILLS</Text>
                          <View style={styles.toggleRow}>
                            <View style={styles.toggleTextWrap}>
                              <Text style={styles.toggleTitle}>Counts toward bills</Text>
                              <Text style={styles.toggleHint}>
                                Use this for expenses that should reduce what you still need to transfer to bills.
                              </Text>
                            </View>
                            <Switch
                              value={countsTowardBills}
                              onValueChange={(value) => setValue('countsTowardBills', value)}
                              trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(91,163,201,0.45)' }}
                              thumbColor={countsTowardBills ? '#63aaff' : '#f4f4f8'}
                            />
                          </View>
                        </View>
                      ) : null}
                    </>
                  ) : null}

                  <Text style={styles.hint}>
                    {mode === 'income'
                      ? 'Choose any date and time. Future-dated income stays out of totals until that date arrives.'
                      : 'Choose any date and time. Future-dated expenses stay out of totals until that date arrives.'}
                  </Text>

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
        defaultExpenseType={mode === 'expense' ? 'fixed' : 'budget'}
        onClose={() => setCategoryPickerOpen(false)}
        onSelect={(category) => {
          setValue('selectedCategory', category)
        }}
      />

      <FinancialAccountPickerModal
        visible={accountPickerOpen}
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        onClose={() => setAccountPickerOpen(false)}
        onSelect={(account) => {
          setValue('selectedAccountId', account?.id ?? null)
          setAccountPickerOpen(false)
        }}
      />

      <OptionPickerSheet
        visible={repeatPickerOpen}
        title="Repeat"
        options={REPEAT_OPTIONS}
        selectedValue={repeatOption}
        onSelect={(value) => setValue('repeatOption', value as RepeatOption)}
        onClose={() => setRepeatPickerOpen(false)}
      />

      <OptionPickerSheet
        visible={remindPickerOpen}
        title="Remind me"
        options={REMIND_OPTIONS}
        selectedValue={remindOption}
        onSelect={(value) => {
          const next = value as RemindOption
          setValue('remindOption', next)
          // Pre-populate remindDate when switching to custom
          if (next === 'custom' && !getValues('remindDate')) {
            setValue('remindDate', new Date())
          }
        }}
        onClose={() => setRemindPickerOpen(false)}
      />

      <GoalDebtPickerSheet
        visible={goalDebtPickerOpen}
        selectedTarget={goalDebtTarget}
        onSelect={(target) => setValue('goalDebtTarget', target)}
        onClose={() => setGoalDebtPickerOpen(false)}
      />
    </>
  )
}
