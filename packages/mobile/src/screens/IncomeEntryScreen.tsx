import React, { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PlannedExpenseActionBar } from '../components/planned-expense/PlannedExpenseActionBar'
import { useScreenPalette } from '../customthemes'
import { formatTimelineCurrency } from '../features/timeline/utils'
import { incomeApi, type IncomeEntry } from '../services/incomeApi'

type IncomeEntryParams = {
  IncomeEntry: {
    incomeEntryId: string
    category: string
    accent: string
  }
}

export function IncomeEntryScreen() {
  useScreenPalette()
  const navigation = useNavigation<any>()
  const route = useRoute<RouteProp<IncomeEntryParams, 'IncomeEntry'>>()
  const insets = useSafeAreaInsets()
  const params = route.params

  const [incomeEntry, setIncomeEntry] = useState<IncomeEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadIncomeEntry = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const entry = await incomeApi.getIncomeEntry(params.incomeEntryId)
      setIncomeEntry(entry)
    } catch (err) {
      console.error('Income entry load error:', err)
      setError('Failed to load income entry')
      setIncomeEntry(null)
    } finally {
      setLoading(false)
    }
  }, [params.incomeEntryId])

  useFocusEffect(
    useCallback(() => {
      void loadIncomeEntry()
    }, [loadIncomeEntry]),
  )

  const receivedAt = useMemo(
    () => new Date(incomeEntry?.receivedAt ?? new Date().toISOString()),
    [incomeEntry?.receivedAt],
  )

  const handleTogglePayment = async () => {
    if (!incomeEntry || busy) return

    try {
      setBusy(true)
      setError(null)
      await incomeApi.updateIncomeEntry(incomeEntry.id, {
        isPaid: !incomeEntry.isPaid,
      })
      await loadIncomeEntry()
    } catch (err) {
      console.error('Income entry payment toggle error:', err)
      setError(incomeEntry.isPaid ? 'Failed to mark income as unpaid' : 'Failed to mark income as paid')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0e" />
        <ActivityIndicator size="large" color={params.accent} />
      </View>
    )
  }

  if (error && !incomeEntry) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0e" />
        <Ionicons name="alert-circle" size={48} color="rgba(201,107,107,0.9)" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => void loadIncomeEntry()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (!incomeEntry) return null

  const displayTitle = incomeEntry.name ?? incomeEntry.category
  const accent = incomeEntry.iconColor || incomeEntry.color || params.accent
  const categoryLabel = incomeEntry.parentName || incomeEntry.category
  const iconName = (incomeEntry.icon as keyof typeof Ionicons.glyphMap | null) ?? 'ellipse-outline'
  const effectivePaid = incomeEntry.isPaid && receivedAt <= new Date()
  const primaryLabel = incomeEntry.isPaid ? 'CANCEL PAYMENT' : 'PAY'
  const helperText = effectivePaid
    ? "Canceling this payment keeps the income entry, but removes it from this month's balance."
    : receivedAt > new Date() && incomeEntry.isPaid
      ? 'This income is scheduled for a future date and will count automatically when that date arrives.'
      : "Pay again to include this income in this month's balance and show it as completed."

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0e" />
      <LinearGradient colors={['#141324', '#0a0a0e', '#111728']} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(106,61,176,0.26)', 'transparent']} style={styles.topBloom} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top, 16), paddingBottom: 220 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>

          <View style={styles.headerDateBlock}>
            <Text style={styles.headerDate}>{receivedAt.getDate()} {receivedAt.toLocaleDateString('en-US', { month: 'short' })}</Text>
            <Text style={styles.headerWeekday}>{receivedAt.toLocaleDateString('en-US', { weekday: 'long' })}</Text>
          </View>

          <TouchableOpacity
            style={styles.editPill}
            onPress={() =>
              navigation.navigate('EditPlannedExpense', {
                entryType: 'income',
                entryId: incomeEntry.id,
                incomeCategoryId: incomeEntry.incomeCategoryId,
                categoryLabel: incomeEntry.category,
                titleValue: incomeEntry.name ?? incomeEntry.category,
                amount: incomeEntry.amount,
                dueDate: incomeEntry.receivedAt,
                accent,
                recurring: false,
                dueDayOfMonth: null,
              })
            }
            activeOpacity={0.88}
          >
            <Text style={styles.editPillText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={[styles.categoryBadge, { backgroundColor: `${accent}22`, borderColor: `${accent}55` }]}>
            <View style={[styles.categoryBadgeIconWrap, { backgroundColor: `${accent}22` }]}>
              <Ionicons name={iconName} size={14} color={accent} />
            </View>
            <Text style={styles.categoryBadgeText}>{categoryLabel}</Text>
          </View>

          <Text style={styles.title}>{displayTitle}</Text>

          <TouchableOpacity
            style={styles.totalCard}
            activeOpacity={0.88}
            onPress={() =>
              navigation.navigate('EditPlannedExpense', {
                entryType: 'income',
                entryId: incomeEntry.id,
                incomeCategoryId: incomeEntry.incomeCategoryId,
                categoryLabel: incomeEntry.category,
                titleValue: incomeEntry.name ?? incomeEntry.category,
                amount: incomeEntry.amount,
                dueDate: incomeEntry.receivedAt,
                accent,
                recurring: false,
                dueDayOfMonth: null,
                autoFocusField: 'amount',
              })
            }
          >
            <Text style={styles.totalLabel}>Total</Text>
            <View style={styles.totalValueRow}>
              <MaterialCommunityIcons
                name={effectivePaid ? 'check-circle' : 'circle-outline'}
                size={24}
                color={effectivePaid ? '#78d89c' : 'rgba(255,255,255,0.42)'}
              />
              <Text style={[styles.totalValue, !effectivePaid && styles.totalValueUnpaid]}>
                +{formatTimelineCurrency(incomeEntry.amount)}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.metaSection}>
            <Text style={styles.metaHeading}>Date</Text>
            <View style={styles.datePill}>
              <Text style={styles.datePillText}>
                {receivedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>
          </View>

          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Balance contribution</Text>
            <Text style={[styles.metaValue, !effectivePaid && styles.metaValueMuted]}>
              {effectivePaid ? `+${formatTimelineCurrency(incomeEntry.amount)}` : 'Excluded until paid date'}
            </Text>
          </View>

          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Status</Text>
            <Text style={[styles.metaValue, effectivePaid ? styles.statusPaid : styles.statusUnpaid]}>
              {effectivePaid ? 'Paid' : 'Unpaid'}
            </Text>
          </View>

          {error ? <Text style={styles.inlineError}>{error}</Text> : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <PlannedExpenseActionBar
          expanded={false}
          paid={incomeEntry.isPaid}
          amountLabel={formatTimelineCurrency(incomeEntry.amount)}
          dateLabel={receivedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          busy={busy}
          canMarkUnpaid
          helperText={helperText}
          onToggleExpanded={() => {}}
          onPrimaryAction={() => void handleTogglePayment()}
          primaryLabel={primaryLabel}
        />
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.82}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0e' },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0e',
    paddingHorizontal: 24,
  },
  topBloom: { position: 'absolute', top: 0, left: 0, right: 0, height: 280 },
  scrollContent: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
  headerDateBlock: { flex: 1, marginLeft: 14 },
  headerDate: {
    color: 'rgba(255,255,255,0.94)',
    fontSize: 28,
    fontFamily: 'DMSans_800ExtraBold',
  },
  headerWeekday: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.42)',
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
  },
  editPill: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  editPillText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
  content: { paddingTop: 26 },
  categoryBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  categoryBadgeIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadgeText: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
  title: {
    marginTop: 20,
    color: 'rgba(255,255,255,0.94)',
    fontSize: 38,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  totalCard: {
    marginTop: 22,
    alignSelf: 'flex-start',
    minWidth: 130,
    borderRadius: 26,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  totalLabel: {
    color: 'rgba(255,255,255,0.38)',
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
  },
  totalValue: {
    fontSize: 28,
    color: '#78d89c',
    fontFamily: 'DMSans_800ExtraBold',
  },
  totalValueRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  totalValueUnpaid: {
    color: 'rgba(255,255,255,0.74)',
  },
  metaSection: { marginTop: 36 },
  metaHeading: {
    color: 'rgba(255,255,255,0.38)',
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
  },
  datePill: {
    marginTop: 10,
    alignSelf: 'flex-end',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  datePillText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
  },
  metaBlock: {
    marginTop: 18,
  },
  metaLabel: {
    color: 'rgba(255,255,255,0.38)',
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
  },
  metaValue: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.86)',
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
  },
  metaValueMuted: {
    color: 'rgba(255,255,255,0.52)',
  },
  statusPaid: {
    color: '#78d89c',
  },
  statusUnpaid: {
    color: '#f0c45a',
  },
  inlineError: {
    marginTop: 18,
    color: '#ffb1a6',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'DMSans_500Medium',
  },
  footer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    gap: 14,
    paddingTop: 14,
    backgroundColor: 'transparent',
  },
  cancelText: {
    textAlign: 'center',
    color: 'rgba(92,163,255,0.94)',
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
  },
  errorText: {
    color: 'rgba(255,255,255,0.82)',
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'DMSans_600SemiBold',
  },
  retryButton: {
    marginTop: 16,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: 'rgba(92,163,255,0.92)',
  },
  retryText: {
    color: 'white',
    fontFamily: 'DMSans_700Bold',
  },
})
