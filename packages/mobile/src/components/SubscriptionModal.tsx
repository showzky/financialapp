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

import { useScreenPalette } from '../customthemes'
import type { CreateSubscriptionPayload, Subscription, SubscriptionStatus } from '../services/subscriptionApi'

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
  }
}

export function SubscriptionModal({ isOpen, subscription, onClose, onSubmit }: Props) {
  const { activeTheme, colors } = useScreenPalette()
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
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.card,
              {
                backgroundColor: activeTheme.colors.surface,
                borderColor: activeTheme.colors.surfaceBorder,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.titleWrap}>
                <Text style={[styles.eyebrow, { color: activeTheme.colors.mutedText }]}>Subscriptions</Text>
                <Text style={[styles.cardTitle, { color: activeTheme.colors.text }]}>
                  {subscription ? 'Edit Subscription' : 'Add Subscription'}
                </Text>
              </View>
              <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color={activeTheme.colors.mutedText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.field}>
                <Text style={[styles.label, { color: activeTheme.colors.text }]}>Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: hasTriedSubmit && errors.name ? activeTheme.colors.danger : activeTheme.colors.surfaceBorder,
                      color: activeTheme.colors.text,
                    },
                  ]}
                  placeholder="Spotify Premium"
                  placeholderTextColor={activeTheme.colors.subtleText}
                  value={form.name}
                  onChangeText={(value) => setField('name', value)}
                  returnKeyType="next"
                />
                {hasTriedSubmit && errors.name ? <Text style={[styles.errorText, { color: activeTheme.colors.danger }]}>{errors.name}</Text> : null}
              </View>

              <View style={styles.row}>
                <View style={[styles.field, styles.rowField]}>
                  <Text style={[styles.label, { color: activeTheme.colors.text }]}>Provider</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: hasTriedSubmit && errors.provider ? activeTheme.colors.danger : activeTheme.colors.surfaceBorder,
                        color: activeTheme.colors.text,
                      },
                    ]}
                    placeholder="Spotify"
                    placeholderTextColor={activeTheme.colors.subtleText}
                    value={form.provider}
                    onChangeText={(value) => setField('provider', value)}
                    returnKeyType="next"
                  />
                  {hasTriedSubmit && errors.provider ? <Text style={[styles.errorText, { color: activeTheme.colors.danger }]}>{errors.provider}</Text> : null}
                </View>

                <View style={[styles.field, styles.rowField]}>
                  <Text style={[styles.label, { color: activeTheme.colors.text }]}>Category</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: hasTriedSubmit && errors.category ? activeTheme.colors.danger : activeTheme.colors.surfaceBorder,
                        color: activeTheme.colors.text,
                      },
                    ]}
                    placeholder="Streaming"
                    placeholderTextColor={activeTheme.colors.subtleText}
                    value={form.category}
                    onChangeText={(value) => setField('category', value)}
                    returnKeyType="next"
                  />
                  {hasTriedSubmit && errors.category ? <Text style={[styles.errorText, { color: activeTheme.colors.danger }]}>{errors.category}</Text> : null}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: activeTheme.colors.text }]}>Status</Text>
                <View style={styles.optionRow}>
                  {statusOptions.map((option) => {
                    const selected = form.status === option.value
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.choiceChip,
                          {
                            backgroundColor: selected ? activeTheme.colors.accentSoft : activeTheme.colors.surfaceAlt,
                            borderColor: selected ? activeTheme.colors.accentLine : activeTheme.colors.surfaceBorder,
                          },
                        ]}
                        onPress={() => setField('status', option.value)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.choiceChipText, { color: selected ? activeTheme.colors.accent : activeTheme.colors.mutedText }]}>{option.label}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: activeTheme.colors.text }]}>Billing cadence</Text>
                <View style={styles.optionRow}>
                  {cadenceOptions.map((option) => {
                    const selected = form.cadence === option.value
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.choiceChip,
                          {
                            backgroundColor: selected ? activeTheme.colors.secondarySoft : activeTheme.colors.surfaceAlt,
                            borderColor: selected ? activeTheme.colors.secondaryLine : activeTheme.colors.surfaceBorder,
                          },
                        ]}
                        onPress={() => setField('cadence', option.value)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.choiceChipText, { color: selected ? activeTheme.colors.secondary : activeTheme.colors.mutedText }]}>{option.label}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.field, styles.rowField]}>
                  <Text style={[styles.label, { color: activeTheme.colors.text }]}>Price (NOK)</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: hasTriedSubmit && errors.price ? activeTheme.colors.danger : activeTheme.colors.surfaceBorder,
                        color: activeTheme.colors.text,
                      },
                    ]}
                    placeholder="149"
                    placeholderTextColor={activeTheme.colors.subtleText}
                    value={form.price}
                    onChangeText={(value) => setField('price', value)}
                    keyboardType="decimal-pad"
                    returnKeyType="next"
                  />
                  {hasTriedSubmit && errors.price ? <Text style={[styles.errorText, { color: activeTheme.colors.danger }]}>{errors.price}</Text> : null}
                </View>

                <View style={[styles.field, styles.rowField]}>
                  <Text style={[styles.label, { color: activeTheme.colors.text }]}>Next renewal</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: hasTriedSubmit && errors.nextRenewalDate ? activeTheme.colors.danger : activeTheme.colors.surfaceBorder,
                        color: activeTheme.colors.text,
                      },
                    ]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={activeTheme.colors.subtleText}
                    value={form.nextRenewalDate}
                    onChangeText={(value) => setField('nextRenewalDate', value)}
                    keyboardType="numbers-and-punctuation"
                    maxLength={10}
                    returnKeyType="done"
                  />
                  {hasTriedSubmit && errors.nextRenewalDate ? <Text style={[styles.errorText, { color: activeTheme.colors.danger }]}>{errors.nextRenewalDate}</Text> : null}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: activeTheme.colors.text }]}>Notes</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.notesInput,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: hasTriedSubmit && errors.notes ? activeTheme.colors.danger : activeTheme.colors.surfaceBorder,
                      color: activeTheme.colors.text,
                    },
                  ]}
                  placeholder="Optional context"
                  placeholderTextColor={activeTheme.colors.subtleText}
                  value={form.notes}
                  onChangeText={(value) => setField('notes', value)}
                  multiline
                  textAlignVertical="top"
                  maxLength={2000}
                />
                <View style={styles.fieldFooter}>
                  {hasTriedSubmit && errors.notes ? <Text style={[styles.errorText, { color: activeTheme.colors.danger }]}>{errors.notes}</Text> : <View />}
                  <Text style={[styles.helperText, { color: activeTheme.colors.mutedText }]}>{form.notes.length}/2000</Text>
                </View>
              </View>

              {submitError ? (
                <View style={[styles.errorBanner, { backgroundColor: activeTheme.colors.surfaceAlt, borderColor: activeTheme.colors.danger }]}>
                  <Ionicons name="alert-circle" size={16} color={activeTheme.colors.danger} />
                  <Text style={[styles.errorBannerText, { color: activeTheme.colors.danger }]}>{submitError}</Text>
                </View>
              ) : null}

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    {
                      backgroundColor: activeTheme.colors.surfaceAlt,
                      borderColor: activeTheme.colors.surfaceBorder,
                    },
                  ]}
                  onPress={handleClose}
                  disabled={submitting}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.secondaryButtonText, { color: activeTheme.colors.text }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: activeTheme.colors.accentSoft,
                      borderColor: activeTheme.colors.accentLine,
                    },
                  ]}
                  onPress={handleSubmit}
                  disabled={submitting}
                  activeOpacity={0.85}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color={activeTheme.colors.accent} />
                  ) : (
                    <Text style={[styles.primaryButtonText, { color: activeTheme.colors.accent }]}>
                      {subscription ? 'Save changes' : 'Add subscription'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
  },
  card: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    maxHeight: '92%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleWrap: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontFamily: 'DMSans_700Bold',
  },
  cardTitle: {
    fontSize: 24,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  field: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowField: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    marginBottom: 8,
    fontFamily: 'DMSans_700Bold',
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
  },
  notesInput: {
    minHeight: 110,
    paddingTop: 14,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  choiceChip: {
    minWidth: 96,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  choiceChipText: {
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
  },
  fieldFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  helperText: {
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    fontFamily: 'DMSans_500Medium',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
  primaryButton: {
    flex: 1.2,
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
})