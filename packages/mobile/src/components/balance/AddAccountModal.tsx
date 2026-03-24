import React, { useEffect, useMemo, useState } from 'react'
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useNotifications } from '../../context/NotificationContext'
import type { AccountIconChoice, AccountMode, AccountReminder } from '../../shared/contracts/accounts'
import { AccountIconPickerModal } from './AccountIconPickerModal'
import { AccountTypePickerModal } from './AccountTypePickerModal'
import { PaymentDatePickerModal } from './PaymentDatePickerModal'
import { getAccountTypeOptionsForMode, type AccountTypeOption } from './accountTypes'
import type { FinancialAccount } from './types'

type CreateAccountDraft = {
  name: string
  mode: AccountMode
  amount: number
  creditLimit: number | null
  paymentDayOfMonth: number | null
  reminder: AccountReminder
  icon: AccountIconChoice | null
  accountType: string
  category: string
  color: string
  notes: string
}

type Props = {
  visible: boolean
  categories: string[]
  initialAccount?: FinancialAccount | null
  title?: string
  submitLabel?: string
  onClose: () => void
  onCreateAccount: (draft: CreateAccountDraft) => void | Promise<void>
}

const colorSwatches = ['#D35B5B', '#5DA2FF', '#4BB579', '#B27BFF', '#D0A552']
const defaultAccountCategory = 'Bills'
const reminderOptions = ["Don't remind", 'On the day at 9:00', '1 day before at 9:00', '2 days before at 9:00', '3 days before at 9:00', '4 days before at 9:00', '5 days before at 9:00', '7 days before at 9:00', 'Other...']

export function AddAccountModal({
  visible,
  categories,
  initialAccount,
  title,
  submitLabel,
  onClose,
  onCreateAccount,
}: Props) {
  const insets = useSafeAreaInsets()
  const { enablePushNotifications, preferences } = useNotifications()
  const [mode, setMode] = useState<AccountMode>('credit')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [creditLimit, setCreditLimit] = useState('0')
  const [paymentDayOfMonth, setPaymentDayOfMonth] = useState<number | null>(null)
  const [paymentDateModalVisible, setPaymentDateModalVisible] = useState(false)
  const [reminderValue, setReminderValue] = useState("Don't remind")
  const [reminderModalVisible, setReminderModalVisible] = useState(false)
  const [customReminderVisible, setCustomReminderVisible] = useState(false)
  const [customReminderUnit, setCustomReminderUnit] = useState<'days' | 'weeks'>('days')
  const [customReminderQuantity, setCustomReminderQuantity] = useState(1)
  const [customReminderHour, setCustomReminderHour] = useState(9)
  const [selectedIcon, setSelectedIcon] = useState<AccountIconChoice | null>(null)
  const [accountTypeModalVisible, setAccountTypeModalVisible] = useState(false)
  const [categoryModalVisible, setCategoryModalVisible] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(defaultAccountCategory)
  const [selectedColor, setSelectedColor] = useState(colorSwatches[0] ?? '#5DA2FF')
  const [notes, setNotes] = useState('')
  const accountTypeOptions = useMemo(() => getAccountTypeOptionsForMode(mode), [mode])
  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set([defaultAccountCategory, ...categories].map((entry) => entry.trim()).filter(Boolean)),
      ),
    [categories],
  )
  const [selectedAccountTypeId, setSelectedAccountTypeId] = useState<string | null>(null)

  useEffect(() => {
    if (accountTypeOptions.length === 0) return
    if (!accountTypeOptions.some((option) => option.id === selectedAccountTypeId)) {
      setSelectedAccountTypeId(accountTypeOptions[0]?.id ?? null)
    }
  }, [accountTypeOptions, selectedAccountTypeId])

  useEffect(() => {
    if (!categoryOptions.includes(selectedCategory)) setSelectedCategory(categoryOptions[0] ?? '')
  }, [categoryOptions, selectedCategory])

  useEffect(() => {
    if (visible) return
    setMode('credit')
    setName('')
    setAmount('')
    setCreditLimit('0')
    setPaymentDayOfMonth(null)
    setReminderValue("Don't remind")
    setReminderModalVisible(false)
    setCustomReminderVisible(false)
    setCustomReminderUnit('days')
    setCustomReminderQuantity(1)
    setCustomReminderHour(9)
    setSelectedIcon(null)
    setSelectedCategory(categoryOptions[0] ?? '')
    setSelectedColor(colorSwatches[0] ?? '#5DA2FF')
    setNotes('')
  }, [visible, categoryOptions])

  useEffect(() => {
    if (!visible || !initialAccount) return

    setMode(initialAccount.mode)
    setName(initialAccount.name)
    setAmount(String(Math.abs(initialAccount.amount)))
    setCreditLimit(String(initialAccount.creditLimit ?? 0))
    setPaymentDayOfMonth(initialAccount.paymentDayOfMonth)
    setReminderValue(
      initialAccount.reminder.type === 'none'
        ? "Don't remind"
        : initialAccount.reminder.label,
    )
    if (initialAccount.reminder.type === 'custom') {
      setCustomReminderUnit(initialAccount.reminder.unit)
      setCustomReminderQuantity(initialAccount.reminder.quantity)
      setCustomReminderHour(initialAccount.reminder.hour)
    }
    setSelectedIcon(initialAccount.icon)
    setSelectedCategory(initialAccount.categoryName)
    setSelectedColor(initialAccount.color)
    setNotes(initialAccount.notes)
    setSelectedAccountTypeId(initialAccount.accountType)
  }, [visible, initialAccount])

  const selectedAccountType: AccountTypeOption | null = accountTypeOptions.find((option) => option.id === selectedAccountTypeId) ?? null
  const customReminderLabel = `${customReminderQuantity} ${customReminderUnit === 'days' ? (customReminderQuantity === 1 ? 'day' : 'days') : (customReminderQuantity === 1 ? 'week' : 'weeks')} before at ${String(customReminderHour).padStart(2, '0')}:00`
  const reminderModel: AccountReminder = reminderValue === "Don't remind" ? { type: 'none' } : reminderValue === customReminderLabel ? { type: 'custom', quantity: customReminderQuantity, unit: customReminderUnit, hour: customReminderHour, label: customReminderLabel } : { type: 'preset', label: reminderValue }

  const handleOpenReminder = () => {
    if (preferences.enabled) {
      setReminderModalVisible(true)
      return
    }
    Alert.alert('Enable notifications', 'Allow notifications first so account reminders can be scheduled on your phone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Enable',
        onPress: () => {
          void enablePushNotifications().then((enabled) => {
            if (enabled) setReminderModalVisible(true)
            else Alert.alert('Notifications not enabled', 'Reminder scheduling needs notification access before you can choose a reminder.')
          })
        },
      },
    ])
  }

  const handleCreate = () => {
    const parsedAmount = Number(amount.replace(',', '.'))
    const normalizedAmount = Number.isFinite(parsedAmount) ? parsedAmount : 0
    const parsedCreditLimit = Number(creditLimit.replace(',', '.'))
    onCreateAccount({
      name: name.trim() || selectedAccountType?.label || 'Untitled account',
      mode,
      amount: mode === 'credit' ? -Math.abs(normalizedAmount) : normalizedAmount,
      creditLimit: mode === 'credit' && Number.isFinite(parsedCreditLimit) ? Math.abs(parsedCreditLimit) : null,
      paymentDayOfMonth,
      reminder: reminderModel,
      icon: selectedIcon,
      accountType: selectedAccountType?.id ?? accountTypeOptions[0]?.id ?? 'main-bank',
      category: selectedCategory,
      color: selectedColor,
      notes: notes.trim(),
    })
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardLayer}>
          <View style={[styles.sheet, { paddingTop: Math.max(insets.top, 12), paddingBottom: Math.max(insets.bottom, 22) }]}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.headerIcon} onPress={onClose} activeOpacity={0.85}>
                <Ionicons name="arrow-back" size={18} color="rgba(246,248,255,0.82)" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{title ?? 'Add new account'}</Text>
              <View style={styles.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Name</Text>
                <TextInput value={name} onChangeText={setName} placeholder="Name" placeholderTextColor="rgba(255,255,255,0.24)" style={styles.nameInput} />
              </View>

              <View style={styles.modeRow}>
                <TouchableOpacity activeOpacity={0.9} onPress={() => setMode('credit')} style={[styles.modeChip, mode === 'credit' && styles.modeChipActiveRed]}>
                  <Text style={[styles.modeChipText, mode === 'credit' && styles.modeChipTextActive]}>CREDIT</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.9} onPress={() => setMode('balance')} style={[styles.modeChip, mode === 'balance' && styles.modeChipActiveGreen]}>
                  <Text style={[styles.modeChipText, mode === 'balance' && styles.modeChipTextActive]}>BALANCE</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Amount</Text>
                <View style={styles.inputRow}>
                  {mode === 'credit' ? <Text style={styles.prefixText}>-</Text> : null}
                  <TextInput value={amount} onChangeText={setAmount} placeholder="0" placeholderTextColor="rgba(255,255,255,0.24)" keyboardType="decimal-pad" style={styles.inlineInput} />
                  <Text style={styles.currencyBadge}>NOK</Text>
                </View>
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Credit limit</Text>
                <View style={styles.inputRow}>
                  <TextInput value={creditLimit} onChangeText={setCreditLimit} placeholder="0" placeholderTextColor="rgba(255,255,255,0.24)" keyboardType="decimal-pad" style={styles.inlineInput} />
                  <View style={styles.inputAdornment}>
                    <Ionicons name="calculator-outline" size={16} color="rgba(255,255,255,0.3)" />
                  </View>
                </View>
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Payment date</Text>
                <TouchableOpacity activeOpacity={0.85} onPress={() => setPaymentDateModalVisible(true)}>
                  <View style={styles.selectField}>
                    <Text style={styles.selectValue}>{paymentDayOfMonth ? String(paymentDayOfMonth) : 'None'}</Text>
                    <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.4)" />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Remind</Text>
                <TouchableOpacity activeOpacity={0.85} onPress={handleOpenReminder}>
                  <View style={styles.selectField}>
                    <Text style={styles.selectValue}>{reminderModel.type === 'none' ? "Don't remind" : reminderValue}</Text>
                    <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.4)" />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Choose an icon</Text>
                <AccountIconPickerModal
                  visible={visible}
                  selectedIcon={selectedIcon}
                  fallbackIcon={selectedAccountType ? { name: selectedAccountType.iconName, color: selectedAccountType.iconColor, backgroundColor: selectedAccountType.iconBackground } : null}
                  onClose={() => undefined}
                  onReset={() => setSelectedIcon(null)}
                  onSelectIcon={setSelectedIcon}
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Account type</Text>
                <TouchableOpacity activeOpacity={0.85} onPress={() => setAccountTypeModalVisible(true)}>
                  <View style={styles.selectField}>
                    <View style={styles.accountTypeValueWrap}>
                      {selectedAccountType ? (
                        <View style={[styles.accountTypeIconWrap, { backgroundColor: selectedAccountType.iconBackground }]}>
                          <Ionicons name={selectedAccountType.iconName} size={16} color={selectedAccountType.iconColor} />
                        </View>
                      ) : null}
                      <Text style={styles.selectValue}>{selectedAccountType?.label ?? accountTypeOptions[0]?.label ?? 'Account type'}</Text>
                    </View>
                    <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.4)" />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Category</Text>
                <TouchableOpacity activeOpacity={0.85} onPress={() => setCategoryModalVisible(true)}>
                  <View style={styles.selectField}>
                    <Text style={styles.selectValue}>{selectedCategory || 'No categories yet'}</Text>
                    <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.4)" />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Color</Text>
                <View style={styles.swatchRow}>
                  {colorSwatches.map((swatch) => (
                    <TouchableOpacity key={swatch} activeOpacity={0.85} onPress={() => setSelectedColor(swatch)} style={[styles.swatch, { backgroundColor: swatch }, selectedColor === swatch && styles.swatchActive]} />
                  ))}
                </View>
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Notes</Text>
                <TextInput value={notes} onChangeText={setNotes} placeholder="Optional notes" placeholderTextColor="rgba(255,255,255,0.24)" multiline style={styles.notesInput} />
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity activeOpacity={0.92} onPress={handleCreate}>
                <LinearGradient colors={['#6DB2FF', '#4C89E8']} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>{submitLabel ?? 'Add'}</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.85}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>

      <PaymentDatePickerModal
        visible={paymentDateModalVisible}
        selectedDay={paymentDayOfMonth}
        onClose={() => setPaymentDateModalVisible(false)}
        onSelectDay={(day) => {
          setPaymentDayOfMonth(day)
          setPaymentDateModalVisible(false)
        }}
        onClear={() => {
          setPaymentDayOfMonth(null)
          setPaymentDateModalVisible(false)
        }}
      />

      <AccountTypePickerModal
        visible={accountTypeModalVisible}
        options={accountTypeOptions}
        selectedId={selectedAccountTypeId}
        onClose={() => setAccountTypeModalVisible(false)}
        onSelect={(option) => setSelectedAccountTypeId(option.id)}
      />

      <Modal visible={categoryModalVisible} transparent animationType="fade" onRequestClose={() => setCategoryModalVisible(false)}>
        <View style={styles.reminderBackdrop}>
          <View style={styles.reminderPanel}>
            <Text style={styles.reminderTitle}>Category</Text>
            <ScrollView style={styles.reminderList} contentContainerStyle={styles.reminderListContent} showsVerticalScrollIndicator={false}>
              {categoryOptions.map((option) => {
                const selected = option === selectedCategory
                return (
                  <TouchableOpacity key={option} style={styles.reminderOption} activeOpacity={0.85} onPress={() => { setSelectedCategory(option); setCategoryModalVisible(false) }}>
                    <Text style={[styles.reminderOptionText, selected && styles.reminderOptionTextActive]}>{option}</Text>
                    {selected ? <Ionicons name="checkmark" size={16} color="#6DB2FF" /> : null}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
            <TouchableOpacity style={styles.reminderClose} activeOpacity={0.85} onPress={() => setCategoryModalVisible(false)}>
              <Text style={styles.reminderCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={reminderModalVisible} transparent animationType="fade" onRequestClose={() => setReminderModalVisible(false)}>
        <View style={styles.reminderBackdrop}>
          <View style={styles.reminderPanel}>
            <Text style={styles.reminderTitle}>Remind before</Text>
            <ScrollView style={styles.reminderList} contentContainerStyle={styles.reminderListContent} showsVerticalScrollIndicator={false}>
              {reminderOptions.map((option) => {
                const selected = option === reminderValue
                return (
                  <TouchableOpacity key={option} style={styles.reminderOption} activeOpacity={0.85} onPress={() => {
                    if (option === 'Other...') {
                      setReminderModalVisible(false)
                      setCustomReminderVisible(true)
                      return
                    }
                    setReminderValue(option)
                    setReminderModalVisible(false)
                  }}>
                    <Text style={[styles.reminderOptionText, selected && styles.reminderOptionTextActive]}>{option}</Text>
                    {selected ? <Ionicons name="checkmark" size={16} color="#6DB2FF" /> : null}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
            <TouchableOpacity style={styles.reminderClose} activeOpacity={0.85} onPress={() => setReminderModalVisible(false)}>
              <Text style={styles.reminderCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={customReminderVisible} transparent animationType="fade" onRequestClose={() => setCustomReminderVisible(false)}>
        <View style={styles.reminderBackdrop}>
          <View style={styles.customPanel}>
            <Text style={styles.customTitle}>Remind before</Text>

            <View style={styles.customBlock}>
              <Text style={styles.customLabel}>Quantity</Text>
              <View style={styles.customModeRow}>
                <TouchableOpacity activeOpacity={0.88} onPress={() => setCustomReminderUnit('days')} style={[styles.customModeChip, customReminderUnit === 'days' && styles.customModeChipActive]}>
                  <View style={[styles.radioOuter, customReminderUnit === 'days' && styles.radioOuterActive]}>
                    {customReminderUnit === 'days' ? <View style={styles.radioInner} /> : null}
                  </View>
                  <Text style={[styles.customModeText, customReminderUnit === 'days' && styles.customModeTextActive]}>Days</Text>
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.88} onPress={() => setCustomReminderUnit('weeks')} style={[styles.customModeChip, customReminderUnit === 'weeks' && styles.customModeChipActive]}>
                  <View style={[styles.radioOuter, customReminderUnit === 'weeks' && styles.radioOuterActive]}>
                    {customReminderUnit === 'weeks' ? <View style={styles.radioInner} /> : null}
                  </View>
                  <Text style={[styles.customModeText, customReminderUnit === 'weeks' && styles.customModeTextActive]}>Weeks</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.customBlock}>
              <Text style={styles.customLabel}>Before</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity style={styles.stepperButton} activeOpacity={0.85} onPress={() => setCustomReminderQuantity((current) => Math.max(1, current - 1))}>
                  <Ionicons name="remove" size={16} color="rgba(255,255,255,0.76)" />
                </TouchableOpacity>
                <View style={styles.stepperValueWrap}>
                  <Text style={styles.stepperValue}>{customReminderQuantity}</Text>
                </View>
                <TouchableOpacity style={styles.stepperButton} activeOpacity={0.85} onPress={() => setCustomReminderQuantity((current) => Math.min(30, current + 1))}>
                  <Ionicons name="add" size={16} color="rgba(255,255,255,0.76)" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.customBlock}>
              <Text style={styles.customLabel}>At</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity style={styles.stepperButton} activeOpacity={0.85} onPress={() => setCustomReminderHour((current) => Math.max(0, current - 1))}>
                  <Ionicons name="remove" size={16} color="rgba(255,255,255,0.76)" />
                </TouchableOpacity>
                <View style={styles.stepperValueWrap}>
                  <Text style={styles.stepperValue}>{customReminderHour}</Text>
                </View>
                <TouchableOpacity style={styles.stepperButton} activeOpacity={0.85} onPress={() => setCustomReminderHour((current) => Math.min(23, current + 1))}>
                  <Ionicons name="add" size={16} color="rgba(255,255,255,0.76)" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.customPreview}>{customReminderLabel}</Text>

            <View style={styles.customFooter}>
              <TouchableOpacity style={styles.customSecondary} activeOpacity={0.85} onPress={() => setCustomReminderVisible(false)}>
                <Text style={styles.customSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.customPrimary} activeOpacity={0.9} onPress={() => {
                setReminderValue(customReminderLabel)
                setCustomReminderVisible(false)
              }}>
                <Text style={styles.customPrimaryText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(4,6,10,0.7)' },
  keyboardLayer: { flex: 1 },
  sheet: { flex: 1, backgroundColor: '#141820' },
  header: { height: 46, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#F4F6FB', fontSize: 18, fontFamily: 'DMSans_700Bold' },
  headerSpacer: { width: 32, height: 32 },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 20 },
  fieldBlock: { marginBottom: 14 },
  label: { color: 'rgba(235,240,248,0.42)', fontSize: 11, marginBottom: 8, fontFamily: 'DMSans_600SemiBold' },
  nameInput: { borderBottomWidth: 1.4, borderBottomColor: 'rgba(240,246,255,0.9)', color: '#F3F6FB', fontSize: 18, paddingVertical: 10, fontFamily: 'DMSans_600SemiBold' },
  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  modeChip: { flex: 1, minHeight: 42, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  modeChipActiveRed: { backgroundColor: '#F3565F', borderColor: '#F3565F' },
  modeChipActiveGreen: { backgroundColor: '#32B75C', borderColor: '#32B75C' },
  modeChipText: { color: 'rgba(244,246,251,0.75)', fontSize: 12, letterSpacing: 1.1, fontFamily: 'DMSans_700Bold' },
  modeChipTextActive: { color: '#FFFFFF' },
  inputRow: { minHeight: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', paddingLeft: 14, paddingRight: 10, flexDirection: 'row', alignItems: 'center' },
  inlineInput: { flex: 1, color: '#F4F7FB', fontSize: 15, fontFamily: 'DMSans_500Medium' },
  prefixText: { color: '#F4F7FB', fontSize: 16, marginRight: 10, fontFamily: 'DMSans_700Bold' },
  inputAdornment: { width: 28, alignItems: 'center', justifyContent: 'center' },
  currencyBadge: { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontFamily: 'DMSans_600SemiBold', marginRight: 2 },
  selectField: { minHeight: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  accountTypeValueWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  accountTypeIconWrap: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  selectValue: { color: '#EDF2FA', fontSize: 14, fontFamily: 'DMSans_500Medium' },
  swatchRow: { flexDirection: 'row', gap: 10 },
  swatch: { width: 32, height: 18, borderRadius: 999 },
  swatchActive: { borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)' },
  notesInput: { minHeight: 86, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 14, paddingVertical: 12, color: '#F4F7FB', textAlignVertical: 'top', fontSize: 14, fontFamily: 'DMSans_500Medium' },
  footer: { paddingHorizontal: 18, gap: 10 },
  primaryButton: { minHeight: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#F8FBFF', fontSize: 16, fontFamily: 'DMSans_700Bold' },
  cancelButton: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { color: 'rgba(248,251,255,0.8)', fontSize: 16, fontFamily: 'DMSans_600SemiBold' },
  reminderBackdrop: { flex: 1, backgroundColor: 'rgba(4,6,10,0.6)', justifyContent: 'center', paddingHorizontal: 18 },
  reminderPanel: { maxHeight: 420, borderRadius: 24, backgroundColor: '#1B202B', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
  reminderTitle: { color: '#F5F8FD', fontSize: 18, textAlign: 'center', paddingTop: 18, paddingBottom: 12, fontFamily: 'DMSans_700Bold' },
  reminderList: { maxHeight: 300 },
  reminderListContent: { paddingBottom: 10 },
  reminderOption: { minHeight: 48, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reminderOptionText: { color: 'rgba(241,245,252,0.82)', fontSize: 15, fontFamily: 'DMSans_500Medium' },
  reminderOptionTextActive: { color: '#FFFFFF', fontFamily: 'DMSans_700Bold' },
  reminderClose: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  reminderCloseText: { color: '#6DB2FF', fontSize: 15, fontFamily: 'DMSans_700Bold' },
  customPanel: { borderRadius: 24, backgroundColor: '#232833', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 16 },
  customTitle: { color: '#F6F8FD', fontSize: 19, textAlign: 'center', marginBottom: 18, fontFamily: 'DMSans_700Bold' },
  customBlock: { marginBottom: 16 },
  customLabel: { color: 'rgba(244,248,255,0.44)', fontSize: 12, marginBottom: 10, fontFamily: 'DMSans_600SemiBold' },
  customModeRow: { gap: 10 },
  customModeChip: { minHeight: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  customModeChipActive: { borderColor: 'rgba(181,111,255,0.32)', backgroundColor: 'rgba(181,111,255,0.08)' },
  radioOuter: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: 'rgba(255,255,255,0.34)', alignItems: 'center', justifyContent: 'center' },
  radioOuterActive: { borderColor: '#B56FFF' },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#B56FFF' },
  customModeText: { color: 'rgba(241,245,252,0.72)', fontSize: 14, fontFamily: 'DMSans_600SemiBold' },
  customModeTextActive: { color: '#FFFFFF' },
  stepperRow: { minHeight: 54, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  stepperButton: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  stepperValueWrap: { flex: 1, alignItems: 'center' },
  stepperValue: { color: '#F6F8FD', fontSize: 20, fontFamily: 'DMSans_700Bold' },
  customPreview: { color: '#8FC4FF', fontSize: 13, marginTop: 4, marginBottom: 16, textAlign: 'center', fontFamily: 'DMSans_600SemiBold' },
  customFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  customSecondary: { minWidth: 86, minHeight: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  customSecondaryText: { color: 'rgba(255,255,255,0.72)', fontSize: 14, fontFamily: 'DMSans_700Bold' },
  customPrimary: { minWidth: 86, minHeight: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#4C89E8' },
  customPrimaryText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'DMSans_700Bold' },
})
