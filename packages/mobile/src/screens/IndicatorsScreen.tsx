import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { ConfirmModal } from '../components/ConfirmModal'
import { ScreenHero } from '../components/ScreenHero'
import { SubscriptionModal } from '../components/SubscriptionModal'
import { useScreenPalette } from '../customthemes'
import {
  subscriptionApi,
  type CreateSubscriptionPayload,
  type Subscription,
  type SubscriptionStatus,
} from '../services/subscriptionApi'

type FilterStatus = 'all' | SubscriptionStatus

const monthlyEquivalentCents = (subscription: Subscription) =>
  subscription.cadence === 'monthly' ? subscription.priceCents : Math.round(subscription.priceCents / 12)

const parseIsoDate = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

const toStartOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()

const getDaysAway = (target: Date) => {
  const millisPerDay = 1000 * 60 * 60 * 24
  const today = toStartOfDay(new Date())
  const targetDay = toStartOfDay(target)
  return Math.round((targetDay - today) / millisPerDay)
}

const formatNokFromCents = (value: number) => {
  const amount = value / 100
  const usesDecimals = value % 100 !== 0

  return `NOK ${amount.toLocaleString('en-US', {
    minimumFractionDigits: usesDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`
}

const formatDateLabel = (value: string) => {
  const parsed = parseIsoDate(value)
  if (!parsed) return value
  return parsed.toLocaleDateString('en-CA')
}

const statusPriority: Record<SubscriptionStatus, number> = {
  active: 0,
  paused: 1,
  canceled: 2,
}

const sortSubscriptions = (subscriptions: Subscription[]) =>
  [...subscriptions].sort((left, right) => {
    const statusDelta = statusPriority[left.status] - statusPriority[right.status]
    if (statusDelta !== 0) return statusDelta

    const leftDate = parseIsoDate(left.nextRenewalDate)?.getTime() ?? Number.MAX_SAFE_INTEGER
    const rightDate = parseIsoDate(right.nextRenewalDate)?.getTime() ?? Number.MAX_SAFE_INTEGER
    if (leftDate !== rightDate) return leftDate - rightDate

    return left.name.localeCompare(right.name)
  })

const getStatusLabel = (status: SubscriptionStatus) =>
  status === 'active' ? 'Active' : status === 'paused' ? 'Paused' : 'Canceled'

export function IndicatorsScreen() {
  const { activeTheme, colors } = useScreenPalette()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Subscription | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null)

  const loadSubscriptions = async (mode: 'initial' | 'refresh' | 'mutation' = 'initial') => {
    if (mode === 'initial') setLoading(true)
    if (mode === 'refresh') setRefreshing(true)
    setLoadError('')

    try {
      const rows = await subscriptionApi.list()
      setSubscriptions(sortSubscriptions(rows))
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load subscriptions')
    } finally {
      if (mode === 'initial') setLoading(false)
      if (mode === 'refresh') setRefreshing(false)
    }
  }

  useEffect(() => {
    void loadSubscriptions('initial')
  }, [])

  const billableSubscriptions = useMemo(
    () => subscriptions.filter((subscription) => subscription.status === 'active' || subscription.status === 'paused'),
    [subscriptions],
  )

  const activeSubscriptions = useMemo(
    () => subscriptions.filter((subscription) => subscription.status === 'active'),
    [subscriptions],
  )

  const pausedCount = useMemo(
    () => subscriptions.filter((subscription) => subscription.status === 'paused').length,
    [subscriptions],
  )

  const monthlyEquivalentSpendCents = useMemo(
    () => billableSubscriptions.reduce((sum, subscription) => sum + monthlyEquivalentCents(subscription), 0),
    [billableSubscriptions],
  )

  const yearlyProjectionCents = useMemo(() => {
    const monthlyTotal = billableSubscriptions
      .filter((subscription) => subscription.cadence === 'monthly')
      .reduce((sum, subscription) => sum + subscription.priceCents, 0)
    const yearlyTotal = billableSubscriptions
      .filter((subscription) => subscription.cadence === 'yearly')
      .reduce((sum, subscription) => sum + subscription.priceCents, 0)

    return monthlyTotal * 12 + yearlyTotal
  }, [billableSubscriptions])

  const renewalsNext7Days = useMemo(
    () =>
      activeSubscriptions.filter((subscription) => {
        const parsed = parseIsoDate(subscription.nextRenewalDate)
        if (!parsed) return false
        const daysAway = getDaysAway(parsed)
        return daysAway >= 0 && daysAway <= 7
      }).length,
    [activeSubscriptions],
  )

  const mostExpensiveMonthlyEquivalentCents = useMemo(() => {
    const candidates = subscriptions.filter((subscription) => subscription.status !== 'canceled')
    if (candidates.length === 0) return null

    return candidates.reduce((max, subscription) => Math.max(max, monthlyEquivalentCents(subscription)), 0)
  }, [subscriptions])

  const nextBillingSubscription = useMemo(() => {
    const sorted = [...activeSubscriptions].sort((left, right) => {
      const leftDate = parseIsoDate(left.nextRenewalDate)?.getTime() ?? Number.MAX_SAFE_INTEGER
      const rightDate = parseIsoDate(right.nextRenewalDate)?.getTime() ?? Number.MAX_SAFE_INTEGER
      return leftDate - rightDate
    })

    return sorted[0] ?? null
  }, [activeSubscriptions])

  const activeMonthlySpendCents = useMemo(
    () => activeSubscriptions.reduce((sum, subscription) => sum + monthlyEquivalentCents(subscription), 0),
    [activeSubscriptions],
  )

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const filteredSubscriptions = useMemo(
    () =>
      subscriptions.filter((subscription) => {
        const matchesStatus = statusFilter === 'all' ? true : subscription.status === statusFilter
        if (!matchesStatus) return false

        if (!normalizedQuery) return true

        const haystack = `${subscription.name} ${subscription.provider} ${subscription.category}`.toLowerCase()
        return haystack.includes(normalizedQuery)
      }),
    [subscriptions, statusFilter, normalizedQuery],
  )

  const handleRefresh = async () => {
    await loadSubscriptions('refresh')
  }

  const handleOpenCreate = () => {
    setEditingSubscription(null)
    setIsModalOpen(true)
  }

  const handleSave = async (payload: CreateSubscriptionPayload) => {
    if (editingSubscription) {
      await subscriptionApi.update(editingSubscription.id, payload)
    } else {
      await subscriptionApi.create(payload)
    }

    setIsModalOpen(false)
    setEditingSubscription(null)
    await loadSubscriptions('mutation')
  }

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription)
    setIsModalOpen(true)
  }

  const handleToggleStatus = async (subscription: Subscription) => {
    const nextStatus: SubscriptionStatus = subscription.status === 'active' ? 'paused' : 'active'
    setPendingToggleId(subscription.id)

    try {
      await subscriptionApi.toggleStatus(subscription.id, { status: nextStatus })
      await loadSubscriptions('mutation')
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not update subscription status')
    } finally {
      setPendingToggleId(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return
    setIsDeleting(true)

    try {
      await subscriptionApi.remove(pendingDelete.id)
      setPendingDelete(null)
      await loadSubscriptions('mutation')
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not delete subscription')
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: activeTheme.colors.screenBackground }]}>
        <ActivityIndicator size="large" color={activeTheme.colors.accent} />
      </View>
    )
  }

  const nextBillingDaysLabel = (() => {
    if (!nextBillingSubscription) return 'No active renewals'
    const parsed = parseIsoDate(nextBillingSubscription.nextRenewalDate)
    if (!parsed) return 'Date unavailable'
    const daysAway = getDaysAway(parsed)
    if (daysAway <= 0) return 'Due today'
    return `In ${daysAway} day${daysAway === 1 ? '' : 's'}`
  })()

  const summaryCards = [
    {
      id: 'monthly-spend',
      label: 'Total Monthly Spend',
      value: formatNokFromCents(activeMonthlySpendCents),
      detail: activeSubscriptions.length > 0 ? 'from active subscriptions' : 'No active subscriptions',
      icon: 'wallet-outline' as const,
    },
    {
      id: 'active-services',
      label: 'Active Services',
      value: `${activeSubscriptions.length} / ${subscriptions.length}`,
      detail:
        subscriptions.length > 0
          ? `${Math.round((activeSubscriptions.length / subscriptions.length) * 100)}% services active`
          : 'No services yet',
      icon: 'layers-outline' as const,
    },
    {
      id: 'next-billing',
      label: 'Next Billing',
      value: nextBillingSubscription ? formatDateLabel(nextBillingSubscription.nextRenewalDate) : 'No upcoming billing',
      detail: nextBillingDaysLabel,
      icon: 'calendar-outline' as const,
    },
  ]

  const filterOptions: Array<{ value: FilterStatus; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'canceled', label: 'Canceled' },
  ]

  const confirmTheme = {
    overlayColor: 'rgba(4, 6, 12, 0.72)',
    cardBackground: activeTheme.colors.surface,
    borderColor: activeTheme.colors.surfaceBorder,
    titleColor: activeTheme.colors.text,
    bodyColor: activeTheme.colors.mutedText,
    cancelBackground: activeTheme.colors.surfaceAlt,
    cancelBorder: activeTheme.colors.surfaceBorder,
    cancelTextColor: activeTheme.colors.text,
    confirmBackground: activeTheme.colors.accent,
    destructiveBackground: activeTheme.colors.danger,
    confirmTextColor: '#ffffff',
    iconNeutralBackground: activeTheme.colors.accentSoft,
    iconNeutralColor: activeTheme.colors.accent,
    iconDestructiveBackground: activeTheme.colors.surfaceAlt,
    iconDestructiveColor: activeTheme.colors.danger,
  }

  return (
    <>
      <FlatList
        style={[styles.container, { backgroundColor: activeTheme.colors.screenBackground }]}
        contentContainerStyle={styles.contentContainer}
        data={filteredSubscriptions}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={activeTheme.colors.accent}
          />
        }
        ListHeaderComponent={
          <>
            <ScreenHero
              eyebrow="Subscription Dashboard"
              title="Subscriptions"
              subtitle="Track recurring spend, next billing, and service status without leaving mobile."
              theme={{
                gradient: activeTheme.colors.heroGradient,
                eyebrow: activeTheme.colors.heroEyebrow,
                title: activeTheme.colors.heroTitle,
                subtitle: activeTheme.colors.heroSubtitle,
              }}
              actions={
                <View style={styles.heroActions}>
                  <TouchableOpacity
                    style={[
                      styles.heroActionButton,
                      {
                        backgroundColor: activeTheme.colors.heroActionSurface,
                        borderColor: activeTheme.colors.heroActionBorder,
                      },
                    ]}
                    onPress={handleRefresh}
                    activeOpacity={0.8}
                    disabled={refreshing}
                  >
                    {refreshing ? (
                      <ActivityIndicator size="small" color={activeTheme.colors.heroActionText} />
                    ) : (
                      <Ionicons name="refresh" size={18} color={activeTheme.colors.heroActionText} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.heroActionButton,
                      {
                        backgroundColor: activeTheme.colors.accentSoft,
                        borderColor: activeTheme.colors.accentLine,
                      },
                    ]}
                    onPress={handleOpenCreate}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={20} color={activeTheme.colors.accent} />
                  </TouchableOpacity>
                </View>
              }
            >
              <View
                style={[
                  styles.heroPrimaryCard,
                  {
                    backgroundColor: activeTheme.colors.heroCardSurface,
                    borderColor: activeTheme.colors.heroCardBorder,
                  },
                ]}
              >
                <View style={styles.heroPrimaryHeader}>
                  <View>
                    <Text style={[styles.heroKicker, { color: activeTheme.colors.heroSubtitle }]}>Estimated yearly spend</Text>
                    <Text style={[styles.heroHelper, { color: activeTheme.colors.heroSubtitle }]}>Estimated monthly spend</Text>
                  </View>
                  <Text style={[styles.heroProjectionValue, { color: activeTheme.colors.heroTitle }]}>{formatNokFromCents(yearlyProjectionCents)}</Text>
                </View>

                <Text style={[styles.heroPrimaryValue, { color: activeTheme.colors.heroTitle }]}>{formatNokFromCents(monthlyEquivalentSpendCents)}</Text>
                <Text style={[styles.heroBillableLabel, { color: activeTheme.colors.heroSubtitle }]}> 
                  {billableSubscriptions.length > 0 ? 'Active + paused subscriptions' : 'No active or paused subscriptions'}
                </Text>

                <View style={styles.heroMetricRow}>
                  <View
                    style={[
                      styles.heroMetricCard,
                      {
                        backgroundColor: activeTheme.colors.heroCardSurface,
                        borderColor: activeTheme.colors.heroCardBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.heroMetricLabel, { color: activeTheme.colors.heroSubtitle }]}>Active</Text>
                    <Text style={[styles.heroMetricValue, { color: activeTheme.colors.heroTitle }]}>{activeSubscriptions.length}</Text>
                  </View>
                  <View
                    style={[
                      styles.heroMetricCard,
                      {
                        backgroundColor: activeTheme.colors.heroCardSurface,
                        borderColor: activeTheme.colors.heroCardBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.heroMetricLabel, { color: activeTheme.colors.heroSubtitle }]}>Monthly equivalent</Text>
                    <Text style={[styles.heroMetricValue, { color: activeTheme.colors.heroTitle }]} numberOfLines={1}>{formatNokFromCents(monthlyEquivalentSpendCents)}</Text>
                  </View>
                  <View
                    style={[
                      styles.heroMetricCard,
                      {
                        backgroundColor: activeTheme.colors.heroCardSurface,
                        borderColor: activeTheme.colors.heroCardBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.heroMetricLabel, { color: activeTheme.colors.heroSubtitle }]}>Yearly projection</Text>
                    <Text style={[styles.heroMetricValue, { color: activeTheme.colors.heroTitle }]} numberOfLines={1}>{formatNokFromCents(yearlyProjectionCents)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.insightColumn}>
                {[
                  { label: 'Renewals next 7 days', value: String(renewalsNext7Days) },
                  { label: 'Paused', value: String(pausedCount) },
                  {
                    label: 'Most expensive',
                    value: mostExpensiveMonthlyEquivalentCents === null ? '—' : formatNokFromCents(mostExpensiveMonthlyEquivalentCents),
                  },
                  { label: 'Total subscriptions', value: String(subscriptions.length) },
                ].map((item) => (
                  <View
                    key={item.label}
                    style={[
                      styles.insightPill,
                      {
                        backgroundColor: activeTheme.colors.heroCardSurface,
                        borderColor: activeTheme.colors.heroCardBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.insightLabel, { color: activeTheme.colors.heroSubtitle }]}>{item.label}</Text>
                    <Text style={[styles.insightValue, { color: activeTheme.colors.heroTitle }]} numberOfLines={1}>{item.value}</Text>
                  </View>
                ))}
              </View>
            </ScreenHero>

            {loadError ? (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: activeTheme.colors.surface,
                    borderColor: activeTheme.colors.danger,
                  },
                ]}
              >
                <Ionicons name="alert-circle" size={16} color={activeTheme.colors.danger} />
                <Text style={[styles.errorText, { color: activeTheme.colors.danger }]}>{loadError}</Text>
              </View>
            ) : null}

            <View style={styles.summarySection}>
              {summaryCards.map((card) => (
                <View
                  key={card.id}
                  style={[
                    styles.summaryCard,
                    {
                      backgroundColor: activeTheme.colors.surface,
                      borderColor: activeTheme.colors.surfaceBorder,
                    },
                  ]}
                >
                  <View style={styles.summaryHeader}>
                    <Ionicons name={card.icon} size={16} color={activeTheme.colors.mutedText} />
                    <Text style={[styles.summaryLabel, { color: activeTheme.colors.mutedText }]}>{card.label}</Text>
                  </View>
                  <Text style={[styles.summaryValue, { color: activeTheme.colors.text }]}>{card.value}</Text>
                  <Text style={[styles.summaryDetail, { color: activeTheme.colors.mutedText }]}>{card.detail}</Text>
                </View>
              ))}
            </View>

            <View
              style={[
                styles.ledgerPanel,
                {
                  backgroundColor: activeTheme.colors.surface,
                  borderColor: activeTheme.colors.surfaceBorder,
                },
              ]}
            >
              <View style={styles.ledgerHeader}>
                <View style={styles.ledgerTitleWrap}>
                  <Text style={[styles.ledgerKicker, { color: activeTheme.colors.mutedText }]}>Subscription Ledger</Text>
                  <Text style={[styles.ledgerTitle, { color: activeTheme.colors.text }]}>Manage recurring services</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.addInlineButton,
                    {
                      backgroundColor: activeTheme.colors.accentSoft,
                      borderColor: activeTheme.colors.accentLine,
                    },
                  ]}
                  onPress={handleOpenCreate}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add" size={16} color={activeTheme.colors.accent} />
                  <Text style={[styles.addInlineButtonText, { color: activeTheme.colors.accent }]}>Add Subscription</Text>
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.searchField,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: activeTheme.colors.surfaceBorder,
                  },
                ]}
              >
                <Ionicons name="search" size={16} color={activeTheme.colors.mutedText} />
                <TextInput
                  style={[styles.searchInput, { color: activeTheme.colors.text }]}
                  placeholder="Search name, provider, or category"
                  placeholderTextColor={activeTheme.colors.subtleText}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <View style={styles.filterRow}>
                {filterOptions.map((option) => {
                  const selected = statusFilter === option.value
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: selected ? activeTheme.colors.accentSoft : activeTheme.colors.surfaceAlt,
                          borderColor: selected ? activeTheme.colors.accentLine : activeTheme.colors.surfaceBorder,
                        },
                      ]}
                      onPress={() => setStatusFilter(option.value)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.filterChipText, { color: selected ? activeTheme.colors.accent : activeTheme.colors.mutedText }]}>{option.label}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          <View
            style={[
              styles.emptyState,
              {
                backgroundColor: activeTheme.colors.surface,
                borderColor: activeTheme.colors.surfaceBorder,
              },
            ]}
          >
            <Ionicons
              name={subscriptions.length === 0 ? 'albums-outline' : 'search-outline'}
              size={32}
              color={activeTheme.colors.subtleText}
            />
            <Text style={[styles.emptyTitle, { color: activeTheme.colors.text }]}>
              {subscriptions.length === 0 ? 'No subscriptions yet' : 'No matching subscriptions'}
            </Text>
            <Text style={[styles.emptyText, { color: activeTheme.colors.mutedText }]}>
              {subscriptions.length === 0
                ? 'Add your first recurring service to start tracking its cost and renewal date.'
                : 'Try another search or status filter.'}
            </Text>
          </View>
        }
        ListFooterComponent={<View style={styles.footerSpacer} />}
        renderItem={({ item }) => {
          const badgeTheme =
            item.status === 'active'
              ? { backgroundColor: activeTheme.colors.secondarySoft, textColor: activeTheme.colors.secondary }
              : item.status === 'paused'
                ? { backgroundColor: activeTheme.colors.accentSoft, textColor: activeTheme.colors.accent }
                : { backgroundColor: activeTheme.colors.surfaceAlt, textColor: activeTheme.colors.mutedText }
          const isToggling = pendingToggleId === item.id

          return (
            <View
              style={[
                styles.subscriptionCard,
                {
                  backgroundColor: activeTheme.colors.surface,
                  borderColor: activeTheme.colors.surfaceBorder,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardIdentity}>
                  <Text style={[styles.cardTitle, { color: activeTheme.colors.text }]}>{item.name}</Text>
                  <Text style={[styles.cardSubtitle, { color: activeTheme.colors.mutedText }]}>{item.provider} · {item.category}</Text>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: badgeTheme.backgroundColor }]}>
                  <Text style={[styles.statusBadgeText, { color: badgeTheme.textColor }]}>{getStatusLabel(item.status)}</Text>
                </View>
              </View>

              <View style={[styles.detailGrid, { borderTopColor: activeTheme.colors.surfaceBorder }]}>
                <View style={styles.detailBlock}>
                  <Text style={[styles.detailLabel, { color: activeTheme.colors.subtleText }]}>Price</Text>
                  <Text style={[styles.detailValue, { color: activeTheme.colors.text }]}>{formatNokFromCents(item.priceCents)}</Text>
                  <Text style={[styles.detailMeta, { color: activeTheme.colors.mutedText }]}>/{item.cadence}</Text>
                </View>

                <View style={styles.detailBlock}>
                  <Text style={[styles.detailLabel, { color: activeTheme.colors.subtleText }]}>Equivalent</Text>
                  <Text style={[styles.detailValue, { color: activeTheme.colors.text }]}>{formatNokFromCents(monthlyEquivalentCents(item))}</Text>
                  <Text style={[styles.detailMeta, { color: activeTheme.colors.mutedText }]}>per month</Text>
                </View>

                <View style={styles.detailBlock}>
                  <Text style={[styles.detailLabel, { color: activeTheme.colors.subtleText }]}>Next billing</Text>
                  <Text style={[styles.detailValue, { color: activeTheme.colors.text }]}>{formatDateLabel(item.nextRenewalDate)}</Text>
                  <Text style={[styles.detailMeta, { color: activeTheme.colors.mutedText }]}>
                    {(() => {
                      const parsed = parseIsoDate(item.nextRenewalDate)
                      if (!parsed) return 'Date unavailable'
                      const daysAway = getDaysAway(parsed)
                      if (daysAway <= 0) return 'Due today'
                      return `In ${daysAway} day${daysAway === 1 ? '' : 's'}`
                    })()}
                  </Text>
                </View>
              </View>

              {item.notes ? <Text style={[styles.noteText, { color: activeTheme.colors.mutedText }]}>{item.notes}</Text> : null}

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[
                    styles.cardActionButton,
                    {
                      backgroundColor: activeTheme.colors.surfaceAlt,
                      borderColor: activeTheme.colors.surfaceBorder,
                    },
                  ]}
                  onPress={() => handleEdit(item)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.cardActionText, { color: activeTheme.colors.text }]}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.cardActionButton,
                    {
                      backgroundColor: activeTheme.colors.accentSoft,
                      borderColor: activeTheme.colors.accentLine,
                    },
                  ]}
                  onPress={() => handleToggleStatus(item)}
                  disabled={isToggling}
                  activeOpacity={0.85}
                >
                  {isToggling ? (
                    <ActivityIndicator size="small" color={activeTheme.colors.accent} />
                  ) : (
                    <Text style={[styles.cardActionText, { color: activeTheme.colors.accent }]}>
                      {item.status === 'active' ? 'Pause' : 'Resume'}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.cardActionButton,
                    {
                      backgroundColor: activeTheme.colors.surfaceAlt,
                      borderColor: activeTheme.colors.surfaceBorder,
                    },
                  ]}
                  onPress={() => setPendingDelete(item)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.cardActionText, { color: activeTheme.colors.danger }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        }}
      />

      <SubscriptionModal
        isOpen={isModalOpen}
        subscription={editingSubscription}
        onClose={() => {
          setIsModalOpen(false)
          setEditingSubscription(null)
        }}
        onSubmit={handleSave}
      />

      <ConfirmModal
        isOpen={pendingDelete !== null}
        title="Delete subscription?"
        body={pendingDelete ? `Are you sure you want to delete ${pendingDelete.name}?` : 'Are you sure you want to delete this subscription?'}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
        isConfirming={isDeleting}
        confirmDestructive
        theme={confirmTheme}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
  },
  heroActionButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPrimaryCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  heroPrimaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  heroKicker: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  heroHelper: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
  },
  heroProjectionValue: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
  heroPrimaryValue: {
    fontSize: 38,
    marginTop: 18,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  heroBillableLabel: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
  },
  heroMetricRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  heroMetricCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  heroMetricLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroMetricValue: {
    marginTop: 8,
    fontSize: 16,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  insightColumn: {
    gap: 10,
  },
  insightPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  insightLabel: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
  },
  insightValue: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
  },
  summarySection: {
    paddingHorizontal: 16,
    gap: 14,
    marginBottom: 20,
  },
  summaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
  },
  summaryValue: {
    fontSize: 24,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  summaryDetail: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
  },
  ledgerPanel: {
    marginHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  ledgerHeader: {
    gap: 14,
    marginBottom: 14,
  },
  ledgerTitleWrap: {
    gap: 4,
  },
  ledgerKicker: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.3,
    fontFamily: 'DMSans_700Bold',
  },
  ledgerTitle: {
    fontSize: 20,
    fontFamily: 'DMSans_700Bold',
  },
  addInlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
  },
  addInlineButtonText: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 50,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
  },
  subscriptionCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardIdentity: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
  },
  detailGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  detailBlock: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  detailValue: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
  detailMeta: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
  },
  noteText: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'DMSans_500Medium',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cardActionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActionText: {
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
  },
  emptyState: {
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 28,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
  },
  emptyText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'DMSans_500Medium',
  },
  footerSpacer: {
    height: 20,
  },
})
