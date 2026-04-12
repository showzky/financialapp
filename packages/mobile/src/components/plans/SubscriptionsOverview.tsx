import React, { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

import type { Subscription, SubscriptionStatus } from '../../services/subscriptionApi'

// ─── helpers ─────────────────────────────────────────────────────────────────

const monthlyEquiv = (sub: Subscription) =>
  sub.cadence === 'monthly' ? sub.priceCents : Math.round(sub.priceCents / 12)

const parseIsoDate = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const d = new Date(year, month - 1, day)
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day ? d : null
}

const toStartOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

const daysAway = (d: Date) => {
  const ms = 1000 * 60 * 60 * 24
  return Math.round((toStartOfDay(d) - toStartOfDay(new Date())) / ms)
}

const fmtNok = (cents: number) => {
  const amount = cents / 100
  return `NOK ${amount.toLocaleString('en-US', {
    minimumFractionDigits: cents % 100 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  })}`
}

const fmtDate = (value: string) => {
  const d = parseIsoDate(value)
  if (!d) return value
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const statusPriority: Record<SubscriptionStatus, number> = { active: 0, paused: 1, canceled: 2 }

const sortSubs = (list: Subscription[]) =>
  [...list].sort((a, b) => {
    const sd = statusPriority[a.status] - statusPriority[b.status]
    if (sd !== 0) return sd
    const ad = parseIsoDate(a.nextRenewalDate)?.getTime() ?? Number.MAX_SAFE_INTEGER
    const bd = parseIsoDate(b.nextRenewalDate)?.getTime() ?? Number.MAX_SAFE_INTEGER
    if (ad !== bd) return ad - bd
    return a.name.localeCompare(b.name)
  })

// ─── types ────────────────────────────────────────────────────────────────────

type FilterStatus = 'all' | SubscriptionStatus

type Props = {
  subscriptions: Subscription[]
  pendingToggleId: string | null
  onEdit: (sub: Subscription) => void
  onToggleStatus: (sub: Subscription) => void
  onDelete: (sub: Subscription) => void
}

// ─── sub-components ───────────────────────────────────────────────────────────

function SubscriptionLogo({
  iconUrl,
  name,
  size = 42,
}: {
  iconUrl?: string | null
  name: string
  size?: number
}) {
  const [errored, setErrored] = useState(false)
  const radius = size / 2
  const initial = (name[0] ?? '?').toUpperCase()

  if (iconUrl && !errored) {
    return (
      <Image
        source={{ uri: iconUrl }}
        style={{ width: size, height: size, borderRadius: radius }}
        onError={() => setErrored(true)}
      />
    )
  }

  return (
    <View style={[styles.logoFallback, { width: size, height: size, borderRadius: radius }]}>
      <Text style={[styles.logoInitial, { fontSize: size * 0.38 }]}>{initial}</Text>
    </View>
  )
}

function SpendBanner({
  activeMonthly,
  billableMonthly,
  yearlyProjection,
  activeCount,
  totalCount,
}: {
  activeMonthly: number
  billableMonthly: number
  yearlyProjection: number
  activeCount: number
  totalCount: number
}) {
  return (
    <LinearGradient
      colors={['rgba(103,74,173,0.28)', 'rgba(57,40,110,0.18)', 'rgba(20,18,38,0.10)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.spendBanner}
    >
      <View style={styles.spendBannerTop}>
        <View>
          <Text style={styles.spendBannerKicker}>ACTIVE MONTHLY SPEND</Text>
          <Text style={styles.spendBannerBig}>{fmtNok(activeMonthly)}</Text>
          {billableMonthly !== activeMonthly && (
            <Text style={styles.spendBannerSub}>
              incl. paused: {fmtNok(billableMonthly)} / mo
            </Text>
          )}
        </View>
        <View style={styles.spendBannerRight}>
          <Text style={styles.spendBannerMetaLabel}>YEARLY</Text>
          <Text style={styles.spendBannerMetaValue}>{fmtNok(yearlyProjection)}</Text>
        </View>
      </View>

      <View style={styles.spendBannerDivider} />

      <View style={styles.spendBannerRow}>
        <View style={styles.spendBannerPill}>
          <View style={styles.activeDot} />
          <Text style={styles.spendBannerPillText}>{activeCount} active</Text>
        </View>
        <View style={styles.spendBannerPill}>
          <Ionicons name="layers-outline" size={11} color="rgba(185,156,255,0.55)" />
          <Text style={styles.spendBannerPillText}>{totalCount} total</Text>
        </View>
      </View>
    </LinearGradient>
  )
}

function SubscriptionCard({
  item,
  isToggling,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  item: Subscription
  isToggling: boolean
  onEdit: () => void
  onToggleStatus: () => void
  onDelete: () => void
}) {
  const renewal = parseIsoDate(item.nextRenewalDate)
  const days = renewal !== null ? daysAway(renewal) : null
  const urgent = days !== null && days >= 0 && days <= 3
  const overdue = days !== null && days < 0

  const badgeStyle =
    item.status === 'active'
      ? styles.badgeActive
      : item.status === 'paused'
        ? styles.badgePaused
        : styles.badgeCanceled

  const badgeTextStyle =
    item.status === 'active'
      ? styles.badgeTextActive
      : item.status === 'paused'
        ? styles.badgeTextPaused
        : styles.badgeTextCanceled

  const renewalLabel = (() => {
    if (days === null) return 'Date unknown'
    if (overdue) return 'Overdue'
    if (days === 0) return 'Due today'
    return `In ${days}d`
  })()

  return (
    <View style={styles.card}>
      <View style={styles.cardMain}>
        <SubscriptionLogo iconUrl={item.iconUrl} name={item.name} size={42} />

        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
            <View style={[styles.badge, badgeStyle]}>
              <Text style={[styles.badgeText, badgeTextStyle]}>
                {item.status === 'active' ? 'Active' : item.status === 'paused' ? 'Paused' : 'Canceled'}
              </Text>
            </View>
          </View>

          <Text style={styles.cardProvider} numberOfLines={1}>
            {item.provider} · {item.category}
          </Text>

          <View style={styles.cardMeta}>
            <View style={styles.cardMetaBlock}>
              <Text style={styles.cardMetaLabel}>/ mo</Text>
              <Text style={styles.cardMetaValue}>{fmtNok(monthlyEquiv(item))}</Text>
            </View>

            <View style={styles.cardMetaDivider} />

            <View style={styles.cardMetaBlock}>
              <Text style={styles.cardMetaLabel}>Price</Text>
              <Text style={styles.cardMetaValue}>
                {fmtNok(item.priceCents)}/{item.cadence === 'monthly' ? 'mo' : 'yr'}
              </Text>
            </View>

            <View style={styles.cardMetaDivider} />

            <View style={styles.cardMetaBlock}>
              <Text style={styles.cardMetaLabel}>Next billing</Text>
              <Text
                style={[
                  styles.cardMetaValue,
                  urgent && styles.cardMetaValueUrgent,
                  overdue && styles.cardMetaValueOverdue,
                ]}
              >
                {renewal ? fmtDate(item.nextRenewalDate) : '—'}
                {'  '}
                <Text style={[styles.cardDaysAway, urgent && styles.cardDaysAwayUrgent, overdue && styles.cardDaysAwayOverdue]}>
                  {renewalLabel}
                </Text>
              </Text>
            </View>
          </View>

          {item.notes ? (
            <Text style={styles.cardNote} numberOfLines={2}>{item.notes}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.cardActionBtn} onPress={onEdit} activeOpacity={0.85}>
          <Ionicons name="create-outline" size={14} color="rgba(240,244,252,0.60)" />
          <Text style={styles.cardActionText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.cardActionBtn,
            item.status === 'active' ? styles.cardActionBtnPause : styles.cardActionBtnResume,
          ]}
          onPress={onToggleStatus}
          disabled={isToggling || item.status === 'canceled'}
          activeOpacity={0.85}
        >
          {isToggling ? (
            <ActivityIndicator size="small" color="rgba(185,156,255,0.8)" />
          ) : (
            <>
              <Ionicons
                name={item.status === 'active' ? 'pause-outline' : 'play-outline'}
                size={14}
                color={item.status === 'active' ? 'rgba(185,156,255,0.9)' : 'rgba(94,189,151,0.9)'}
              />
              <Text
                style={[
                  styles.cardActionText,
                  item.status === 'active' ? styles.cardActionTextPause : styles.cardActionTextResume,
                ]}
              >
                {item.status === 'active' ? 'Pause' : 'Resume'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cardActionBtn, styles.cardActionBtnDelete]}
          onPress={onDelete}
          activeOpacity={0.85}
        >
          <Ionicons name="trash-outline" size={14} color="rgba(201,107,107,0.85)" />
          <Text style={[styles.cardActionText, styles.cardActionTextDelete]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function UpcomingRenewals({ subscriptions }: { subscriptions: Subscription[] }) {
  const upcoming = useMemo(
    () =>
      subscriptions
        .filter((sub) => {
          if (sub.status !== 'active') return false
          const d = parseIsoDate(sub.nextRenewalDate)
          if (!d) return false
          const da = daysAway(d)
          return da >= 0 && da <= 14
        })
        .sort((a, b) => {
          const ad = parseIsoDate(a.nextRenewalDate)?.getTime() ?? Number.MAX_SAFE_INTEGER
          const bd = parseIsoDate(b.nextRenewalDate)?.getTime() ?? Number.MAX_SAFE_INTEGER
          return ad - bd
        }),
    [subscriptions],
  )

  if (upcoming.length === 0) return null

  return (
    <View style={styles.renewalsSection}>
      <View style={styles.renewalsSectionHeader}>
        <Ionicons name="time-outline" size={14} color="rgba(185,156,255,0.7)" />
        <Text style={styles.renewalsSectionTitle}>UPCOMING RENEWALS</Text>
        <Text style={styles.renewalsSectionHint}>next 14 days</Text>
      </View>

      {upcoming.map((sub) => {
        const d = parseIsoDate(sub.nextRenewalDate)
        const da = d !== null ? daysAway(d) : null
        const urgentRow = da !== null && da <= 3

        return (
          <View key={sub.id} style={styles.renewalRow}>
            <SubscriptionLogo iconUrl={sub.iconUrl} name={sub.name} size={28} />
            <View style={styles.renewalInfo}>
              <Text style={styles.renewalName} numberOfLines={1}>{sub.name}</Text>
              <Text style={styles.renewalAmount}>{fmtNok(sub.priceCents)}</Text>
            </View>
            <View style={styles.renewalRight}>
              <Text style={[styles.renewalDate, urgentRow && styles.renewalDateUrgent]}>
                {d ? fmtDate(sub.nextRenewalDate) : '—'}
              </Text>
              <Text style={[styles.renewalDays, urgentRow && styles.renewalDaysUrgent]}>
                {da === 0 ? 'Today' : da === 1 ? 'Tomorrow' : da !== null ? `${da} days` : ''}
              </Text>
            </View>
          </View>
        )
      })}
    </View>
  )
}

// ─── main export ─────────────────────────────────────────────────────────────

export function SubscriptionsOverview({
  subscriptions,
  pendingToggleId,
  onEdit,
  onToggleStatus,
  onDelete,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')

  const sorted = useMemo(() => sortSubs(subscriptions), [subscriptions])

  const activeSubscriptions = useMemo(
    () => sorted.filter((s) => s.status === 'active'),
    [sorted],
  )

  const billableSubscriptions = useMemo(
    () => sorted.filter((s) => s.status === 'active' || s.status === 'paused'),
    [sorted],
  )

  const activeMonthly = useMemo(
    () => activeSubscriptions.reduce((sum, s) => sum + monthlyEquiv(s), 0),
    [activeSubscriptions],
  )

  const billableMonthly = useMemo(
    () => billableSubscriptions.reduce((sum, s) => sum + monthlyEquiv(s), 0),
    [billableSubscriptions],
  )

  const yearlyProjection = useMemo(() => {
    const monthly = billableSubscriptions
      .filter((s) => s.cadence === 'monthly')
      .reduce((sum, s) => sum + s.priceCents, 0)
    const yearly = billableSubscriptions
      .filter((s) => s.cadence === 'yearly')
      .reduce((sum, s) => sum + s.priceCents, 0)
    return monthly * 12 + yearly
  }, [billableSubscriptions])

  const filterCounts = useMemo(() => {
    const counts: Record<FilterStatus, number> = {
      all: sorted.length,
      active: 0,
      paused: 0,
      canceled: 0,
    }
    sorted.forEach((s) => { counts[s.status] = (counts[s.status] ?? 0) + 1 })
    return counts
  }, [sorted])

  const normalizedQuery = searchQuery.trim().toLowerCase()

  const filtered = useMemo(
    () =>
      sorted.filter((sub) => {
        const matchStatus = statusFilter === 'all' || sub.status === statusFilter
        if (!matchStatus) return false
        if (!normalizedQuery) return true
        return `${sub.name} ${sub.provider} ${sub.category}`.toLowerCase().includes(normalizedQuery)
      }),
    [sorted, statusFilter, normalizedQuery],
  )

  const filterOptions: Array<{ value: FilterStatus; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'canceled', label: 'Canceled' },
  ]

  return (
    <View style={styles.root}>
      {/* Spend summary banner */}
      <SpendBanner
        activeMonthly={activeMonthly}
        billableMonthly={billableMonthly}
        yearlyProjection={yearlyProjection}
        activeCount={activeSubscriptions.length}
        totalCount={sorted.length}
      />

      {/* Search + filters */}
      <View style={styles.controlsWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={15} color="rgba(240,244,252,0.36)" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search subscriptions…"
            placeholderTextColor="rgba(240,244,252,0.24)"
            autoCapitalize="none"
            returnKeyType="search"
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={15} color="rgba(240,244,252,0.36)" />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.filterRow}>
          {filterOptions.map((opt) => {
            const active = statusFilter === opt.value
            const count = filterCounts[opt.value]
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setStatusFilter(opt.value)}
                activeOpacity={0.85}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {opt.label}
                  {count > 0 ? ` ${count}` : ''}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* Card list */}
      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name={sorted.length === 0 ? 'receipt-outline' : 'search-outline'}
            size={28}
            color="rgba(240,244,252,0.18)"
          />
          <Text style={styles.emptyTitle}>
            {sorted.length === 0 ? 'No subscriptions yet' : 'No matches'}
          </Text>
          <Text style={styles.emptyHint}>
            {sorted.length === 0
              ? 'Tap + to add your first recurring service'
              : 'Try a different filter or search term'}
          </Text>
        </View>
      ) : (
        <View style={styles.cardList}>
          {filtered.map((sub) => (
            <SubscriptionCard
              key={sub.id}
              item={sub}
              isToggling={pendingToggleId === sub.id}
              onEdit={() => onEdit(sub)}
              onToggleStatus={() => onToggleStatus(sub)}
              onDelete={() => onDelete(sub)}
            />
          ))}
        </View>
      )}

      {/* Upcoming renewals */}
      <UpcomingRenewals subscriptions={sorted} />
    </View>
  )
}

// ─── styles ───────────────────────────────────────────────────────────────────

const PURPLE_ACCENT = 'rgba(123,82,220,0.92)'
const PURPLE_SOFT = 'rgba(123,82,220,0.14)'
const PURPLE_LINE = 'rgba(185,156,255,0.22)'
const CARD_BG = 'rgba(255,255,255,0.04)'
const CARD_BORDER = 'rgba(255,255,255,0.07)'
const TEXT = 'rgba(240,244,252,0.92)'
const TEXT_MUTED = 'rgba(240,244,252,0.55)'
const TEXT_SUBTLE = 'rgba(240,244,252,0.28)'

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // ── spend banner ──
  spendBanner: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: PURPLE_LINE,
    padding: 18,
    marginBottom: 16,
  },
  spendBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  spendBannerKicker: {
    fontSize: 10,
    letterSpacing: 1.6,
    color: 'rgba(185,156,255,0.60)',
    fontFamily: 'DMSans_700Bold',
  },
  spendBannerBig: {
    fontSize: 36,
    marginTop: 4,
    color: '#F4F6FB',
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  spendBannerSub: {
    fontSize: 12,
    marginTop: 4,
    color: TEXT_MUTED,
    fontFamily: 'DMSans_500Medium',
  },
  spendBannerRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  spendBannerMetaLabel: {
    fontSize: 10,
    letterSpacing: 1.4,
    color: TEXT_SUBTLE,
    fontFamily: 'DMSans_700Bold',
  },
  spendBannerMetaValue: {
    fontSize: 16,
    color: TEXT_MUTED,
    fontFamily: 'DMSans_700Bold',
  },
  spendBannerDivider: {
    height: 1,
    backgroundColor: PURPLE_LINE,
    marginVertical: 14,
  },
  spendBannerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  spendBannerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(94,189,151,0.80)',
  },
  spendBannerPillText: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontFamily: 'DMSans_600SemiBold',
  },

  // ── controls ──
  controlsWrap: {
    marginBottom: 16,
    gap: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: TEXT,
    fontFamily: 'DMSans_500Medium',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  filterChipActive: {
    backgroundColor: PURPLE_SOFT,
    borderColor: PURPLE_LINE,
  },
  filterChipText: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 0.4,
  },
  filterChipTextActive: {
    color: 'rgba(185,156,255,0.95)',
  },

  // ── card list ──
  cardList: {
    gap: 12,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    overflow: 'hidden',
  },
  cardMain: {
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardName: {
    flex: 1,
    fontSize: 15,
    color: TEXT,
    fontFamily: 'DMSans_700Bold',
  },
  cardProvider: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontFamily: 'DMSans_500Medium',
    marginTop: 1,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 0,
  },
  cardMetaBlock: {
    gap: 2,
    flex: 1,
  },
  cardMetaDivider: {
    width: 1,
    height: 28,
    backgroundColor: CARD_BORDER,
    marginHorizontal: 10,
  },
  cardMetaLabel: {
    fontSize: 10,
    letterSpacing: 0.8,
    color: TEXT_SUBTLE,
    fontFamily: 'DMSans_600SemiBold',
    textTransform: 'uppercase',
  },
  cardMetaValue: {
    fontSize: 13,
    color: TEXT,
    fontFamily: 'DMSans_700Bold',
  },
  cardMetaValueUrgent: {
    color: 'rgba(248,190,80,0.95)',
  },
  cardMetaValueOverdue: {
    color: 'rgba(201,107,107,0.95)',
  },
  cardDaysAway: {
    fontSize: 11,
    color: TEXT_SUBTLE,
    fontFamily: 'DMSans_500Medium',
  },
  cardDaysAwayUrgent: {
    color: 'rgba(248,190,80,0.80)',
  },
  cardDaysAwayOverdue: {
    color: 'rgba(201,107,107,0.80)',
  },
  cardNote: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontFamily: 'DMSans_500Medium',
    marginTop: 8,
    fontStyle: 'italic',
  },

  // ── badge ──
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 0.5,
  },
  badgeActive: {
    backgroundColor: 'rgba(94,189,151,0.14)',
  },
  badgeTextActive: {
    color: 'rgba(94,189,151,0.95)',
  },
  badgePaused: {
    backgroundColor: PURPLE_SOFT,
  },
  badgeTextPaused: {
    color: 'rgba(185,156,255,0.90)',
  },
  badgeCanceled: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  badgeTextCanceled: {
    color: TEXT_SUBTLE,
  },

  // ── logo fallback ──
  logoFallback: {
    backgroundColor: 'rgba(123,82,220,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitial: {
    color: 'rgba(185,156,255,0.90)',
    fontFamily: 'DMSans_700Bold',
  },

  // ── card actions ──
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: CARD_BORDER,
  },
  cardActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 11,
  },
  cardActionBtnPause: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: CARD_BORDER,
    borderRightColor: CARD_BORDER,
  },
  cardActionBtnResume: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: CARD_BORDER,
    borderRightColor: CARD_BORDER,
  },
  cardActionBtnDelete: {},
  cardActionText: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontFamily: 'DMSans_600SemiBold',
  },
  cardActionTextPause: {
    color: 'rgba(185,156,255,0.85)',
  },
  cardActionTextResume: {
    color: 'rgba(94,189,151,0.85)',
  },
  cardActionTextDelete: {
    color: 'rgba(201,107,107,0.85)',
  },

  // ── empty ──
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 15,
    color: TEXT_MUTED,
    fontFamily: 'DMSans_700Bold',
  },
  emptyHint: {
    fontSize: 13,
    color: TEXT_SUBTLE,
    fontFamily: 'DMSans_500Medium',
    textAlign: 'center',
    maxWidth: 240,
  },

  // ── upcoming renewals ──
  renewalsSection: {
    marginTop: 24,
    backgroundColor: CARD_BG,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 16,
    gap: 2,
  },
  renewalsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  renewalsSectionTitle: {
    fontSize: 10,
    letterSpacing: 1.4,
    color: 'rgba(185,156,255,0.70)',
    fontFamily: 'DMSans_700Bold',
  },
  renewalsSectionHint: {
    fontSize: 11,
    color: TEXT_SUBTLE,
    fontFamily: 'DMSans_500Medium',
    marginLeft: 2,
  },
  renewalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: CARD_BORDER,
  },
  renewalInfo: {
    flex: 1,
    gap: 2,
  },
  renewalName: {
    fontSize: 13,
    color: TEXT,
    fontFamily: 'DMSans_600SemiBold',
  },
  renewalAmount: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontFamily: 'DMSans_500Medium',
  },
  renewalRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  renewalDate: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontFamily: 'DMSans_700Bold',
  },
  renewalDateUrgent: {
    color: 'rgba(248,190,80,0.95)',
  },
  renewalDays: {
    fontSize: 11,
    color: TEXT_SUBTLE,
    fontFamily: 'DMSans_500Medium',
  },
  renewalDaysUrgent: {
    color: 'rgba(248,190,80,0.70)',
  },
})
