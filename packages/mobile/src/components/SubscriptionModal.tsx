import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

import type { CreateSubscriptionPayload, Subscription, SubscriptionStatus } from '../services/subscriptionApi'
import { LoanIconPickerField, type LoanIconValue } from './plans/LoanIconPickerField'

type Props = {
  isOpen: boolean
  subscription: Subscription | null
  onClose: () => void
  onSubmit: (payload: CreateSubscriptionPayload) => Promise<void>
}

type FormState = {
  name: string
  provider: string
  category: string
  status: SubscriptionStatus
  cadence: 'monthly' | 'yearly'
  price: string
  nextRenewalDate: string
  notes: string
  icon: LoanIconValue | null
}

const defaultFormState: FormState = {
  name: '',
  provider: '',
  category: '',
  status: 'active',
  cadence: 'monthly',
  price: '',
  nextRenewalDate: '',
  notes: '',
  icon: null,
}

const isValidIsoDate = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)

  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

const formatPriceFromCents = (value: number) => {
  const amount = value / 100
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2)
}

const buildFormState = (subscription: Subscription | null): FormState => {
  if (!subscription) return defaultFormState

  return {
    name: subscription.name,
    provider: subscription.provider,
    category: subscription.category,
    status: subscription.status,
    cadence: subscription.cadence,
    price: formatPriceFromCents(subscription.priceCents),
    nextRenewalDate: subscription.nextRenewalDate,
    notes: subscription.notes ?? '',
    icon: subscription.iconUrl ? { label: subscription.provider, imageUrl: subscription.iconUrl } : null,
  }
}

export function SubscriptionModal({ isOpen, subscription, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<FormState>(defaultFormState)
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!isOpen) return

    setForm(buildFormState(subscription))
    setHasTriedSubmit(false)
    setSubmitting(false)
    setSubmitError('')
  }, [subscription, isOpen])

  const priceValue = Number.parseFloat(form.price.replace(',', '.'))
  const priceCents = Number.isFinite(priceValue) ? Math.round(priceValue * 100) : Number.NaN

  const errors = {
    name: !form.name.trim() ? 'Name is required' : form.name.trim().length > 120 ? 'Max 120 characters' : '',
    provider:
      !form.provider.trim()
        ? 'Provider is required'
        : form.provider.trim().length > 120
          ? 'Max 120 characters'
          : '',
    category:
      !form.category.trim()
        ? 'Category is required'
        : form.category.trim().length > 80
          ? 'Max 80 characters'
          : '',
    price: !Number.isFinite(priceCents) || priceCents <= 0 ? 'Enter a valid amount' : '',
    nextRenewalDate: !isValidIsoDate(form.nextRenewalDate) ? 'Use a real date in YYYY-MM-DD format' : '',
    notes: form.notes.length > 2000 ? 'Max 2000 characters' : '',
  }

  const hasErrors = Object.values(errors).some(Boolean)

  const handleClose = () => {
    if (submitting) return
    onClose()
  }

  const handleSubmit = async () => {
    setHasTriedSubmit(true)
    if (hasErrors || !Number.isFinite(priceCents)) return

    setSubmitting(true)
    setSubmitError('')
    try {
      await onSubmit({
        name: form.name.trim(),
        provider: form.provider.trim(),
        category: form.category.trim(),
        status: form.status,
        cadence: form.cadence,
        priceCents,
        nextRenewalDate: form.nextRenewalDate,
        iconUrl: form.icon?.imageUrl ?? null,
        notes: form.notes.trim() ? form.notes.trim() : null,
      })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save subscription')
    } finally {
      setSubmitting(false)
    }
  }

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const statusOptions: Array<{ value: SubscriptionStatus; label: string }> = [
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'canceled', label: 'Canceled' },
  ]

  const cadenceOptions: Array<{ value: 'monthly' | 'yearly'; label: string }> = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ]

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.root}>
        <View style={styles.overlay} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrap}
        >
          <View style={styles.sheet}>
            <LinearGradient colors={['#141324', '#0d0d18']} style={StyleSheet.absoluteFill} />

            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity
                  onPress={handleClose}
                  hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}
                >
                  <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.45)" />
                </TouchableOpacity>
                <Text style={styles.title}>
                  {subscription ? 'Edit subscription' : 'Add subscription'}
                </Text>
                <View style={styles.headerSpacer} />
              </View>

              {/* Service logo */}
              <View style={styles.section}>
                <Text style={styles.label}>SERVICE LOGO</Text>
                <LoanIconPickerField
                  value={form.icon}
                  onSelect={(icon) => setField('icon', icon)}
                />
              </View>

              {/* Name */}
              <View style={styles.section}>
                <Text style={styles.label}>NAME</Text>
                <TextInput
                  style={[styles.textInput, hasTriedSubmit && errors.name ? styles.inputError : null]}
                  placeholder="Spotify Premium"
                  placeholderTextColor="rgba(255,255,255,0.16)"
                  value={form.name}
                  onChangeText={(value) => setField('name', value)}
                  returnKeyType="next"
                />
                {hasTriedSubmit && errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
              </View>

              {/* Provider + Category */}
              <View style={styles.row}>
                <View style={[styles.section, styles.rowField]}>
                  <Text style={styles.label}>PROVIDER</Text>
                  <TextInput
                    style={[styles.textInput, hasTriedSubmit && errors.provider ? styles.inputError : null]}
                    placeholder="Spotify"
                    placeholderTextColor="rgba(255,255,255,0.16)"
                    value={form.provider}
                    onChangeText={(value) => setField('provider', value)}
                    returnKeyType="next"
                  />
                  {hasTriedSubmit && errors.provider ? <Text style={styles.errorText}>{errors.provider}</Text> : null}
                </View>

                <View style={[styles.section, styles.rowField]}>
                  <Text style={styles.label}>CATEGORY</Text>
                  <TextInput
                    style={[styles.textInput, hasTriedSubmit && errors.category ? styles.inputError : null]}
                    placeholder="Streaming"
                    placeholderTextColor="rgba(255,255,255,0.16)"
                    value={form.category}
                    onChangeText={(value) => setField('category', value)}
                    returnKeyType="next"
                  />
                  {hasTriedSubmit && errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}
                </View>
              </View>

              {/* Status */}
              <View style={styles.section}>
                <Text style={styles.label}>STATUS</Text>
                <View style={styles.chipRow}>
                  {statusOptions.map((opt) => {
                    const active = form.status === opt.value
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => setField('status', opt.value)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>

              {/* Cadence */}
              <View style={styles.section}>
                <Text style={styles.label}>BILLING CADENCE</Text>
                <View style={styles.chipRow}>
                  {cadenceOptions.map((opt) => {
                    const active = form.cadence === opt.value
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.chip, active && styles.chipActiveBlue]}
                        onPress={() => setField('cadence', opt.value)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActiveBlue]}>{opt.label}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>

              {/* Price + Next renewal */}
              <View style={styles.row}>
                <View style={[styles.section, styles.rowField]}>
                  <Text style={styles.label}>PRICE (NOK)</Text>
                  <View style={styles.amountRow}>
                    <TextInput
                      style={[styles.textInput, styles.amountInput, hasTriedSubmit && errors.price ? styles.inputError : null]}
                      placeholder="149"
                      placeholderTextColor="rgba(255,255,255,0.16)"
                      value={form.price}
                      onChangeText={(value) => setField('price', value)}
                      keyboardType="decimal-pad"
                      returnKeyType="next"
                    />
                    <View style={styles.unitPill}>
                      <Text style={styles.unitText}>NOK</Text>
                    </View>
                  </View>
                  {hasTriedSubmit && errors.price ? <Text style={styles.errorText}>{errors.price}</Text> : null}
                </View>

                <View style={[styles.section, styles.rowField]}>
                  <Text style={styles.label}>NEXT RENEWAL</Text>
                  <TextInput
                    style={[styles.textInput, hasTriedSubmit && errors.nextRenewalDate ? styles.inputError : null]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="rgba(255,255,255,0.16)"
                    value={form.nextRenewalDate}
                    onChangeText={(value) => setField('nextRenewalDate', value)}
                    keyboardType="numbers-and-punctuation"
                    maxLength={10}
                    returnKeyType="done"
                  />
                  {hasTriedSubmit && errors.nextRenewalDate ? <Text style={styles.errorText}>{errors.nextRenewalDate}</Text> : null}
                </View>
              </View>

              {/* Notes */}
              <View style={styles.section}>
                <Text style={styles.label}>NOTES</Text>
                <TextInput
                  style={[styles.textInput, styles.notesInput]}
                  placeholder="Optional context"
                  placeholderTextColor="rgba(255,255,255,0.12)"
                  value={form.notes}
                  onChangeText={(value) => setField('notes', value)}
                  multiline
                  textAlignVertical="top"
                  maxLength={2000}
                />
                <Text style={styles.counter}>{form.notes.length}/2000</Text>
              </View>

              {submitError ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={15} color="#F5797E" />
                  <Text style={styles.errorBannerText}>{submitError}</Text>
                </View>
              ) : null}

              {/* Submit */}
              <TouchableOpacity activeOpacity={0.9} onPress={() => void handleSubmit()} disabled={submitting}>
                <LinearGradient colors={['#7B52DC', '#5B3AB8']} style={styles.primaryButton}>
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {subscription ? 'Save changes' : 'Add subscription'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} activeOpacity={0.85} onPress={handleClose} disabled={submitting}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4,6,10,0.32)',
  },
  sheetWrap: {
    width: '100%',
  },
  sheet: {
    maxHeight: '94%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: {
    color: '#F5F8FD',
    fontSize: 22,
    fontFamily: 'DMSans_700Bold',
  },
  headerSpacer: { width: 18 },
  section: { marginBottom: 14 },
  row: { flexDirection: 'row', gap: 12 },
  rowField: { flex: 1 },
  label: {
    marginBottom: 8,
    color: 'rgba(235,240,248,0.42)',
    fontSize: 11,
    letterSpacing: 1.1,
    fontFamily: 'DMSans_600SemiBold',
  },
  textInput: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    color: '#F5F8FD',
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
  },
  inputError: { borderColor: 'rgba(245,121,126,0.45)' },
  notesInput: { minHeight: 84, paddingTop: 14, textAlignVertical: 'top' },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  amountInput: { flex: 1 },
  unitPill: {
    minWidth: 64,
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10,
  },
  unitText: {
    color: 'rgba(245,248,253,0.82)',
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  chipActive: {
    backgroundColor: 'rgba(123,82,220,0.22)',
    borderColor: 'rgba(185,156,255,0.30)',
  },
  chipActiveBlue: {
    backgroundColor: 'rgba(109,178,255,0.14)',
    borderColor: 'rgba(109,178,255,0.30)',
  },
  chipText: {
    fontSize: 13,
    color: 'rgba(235,240,248,0.50)',
    fontFamily: 'DMSans_700Bold',
  },
  chipTextActive: {
    color: 'rgba(185,156,255,0.95)',
  },
  chipTextActiveBlue: {
    color: 'rgba(109,178,255,0.95)',
  },
  counter: {
    marginTop: 6,
    textAlign: 'right',
    color: 'rgba(235,240,248,0.32)',
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
  },
  errorText: {
    marginTop: 6,
    color: '#F5797E',
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,121,126,0.30)',
    backgroundColor: 'rgba(245,121,126,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#F5797E',
    fontFamily: 'DMSans_500Medium',
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
  },
  cancelButton: {
    marginTop: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: 'rgba(235,240,248,0.38)',
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
  },
})