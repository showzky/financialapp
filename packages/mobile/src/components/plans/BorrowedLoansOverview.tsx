import React, { useMemo, useState } from 'react'
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

import type { BorrowedLoanPlanItem } from './types'

type Props = {
  items: BorrowedLoanPlanItem[]
  onPressItem: (item: BorrowedLoanPlanItem) => void
}

function formatKr(value: number) {
  return `KR ${value.toLocaleString('nb-NO')}`
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const PAID_OFF_CARD_W = 188

function PaidOffMiniCard({
  item,
  onPress,
}: {
  item: BorrowedLoanPlanItem
  onPress: () => void
}) {
  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={{ width: PAID_OFF_CARD_W }}>
      <LinearGradient
        colors={['rgba(16,185,129,0.22)', 'rgba(16,185,129,0.08)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.paidCard}
      >
        <View style={styles.paidCardTopRow}>
          <View style={styles.paidCardIconWrap}>
            <Ionicons name="business-outline" size={16} color="#A7F3D0" />
          </View>
          <Ionicons name="checkmark-circle" size={18} color="#34D399" />
        </View>

        <Text style={styles.paidCardTitle} numberOfLines={1}>{item.lender}</Text>
        <Text style={styles.paidCardAmount}>{formatKr(item.originalAmount)}</Text>

        <View style={styles.paidCardProgressTrack}>
          <View style={styles.paidCardProgressFill} />
        </View>

        <View style={styles.paidCardBottomRow}>
          <Text style={styles.paidCardDate}>{formatDate(item.payoffDate)}</Text>
          <Text style={styles.paidCardReady}>Paid off</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
}

export function BorrowedLoansOverview({ items, onPressItem }: Props) {
  const totalBalance = useMemo(
    () => items.reduce((sum, item) => sum + item.currentBalance, 0),
    [items],
  )

  const activeItems = useMemo(
    () => items.filter((item) => item.currentBalance > 0),
    [items],
  )

  const paidOffItems = useMemo(
    () => items.filter((item) => item.currentBalance === 0),
    [items],
  )

  const paidOffTotal = useMemo(
    () => paidOffItems.reduce((sum, item) => sum + item.originalAmount, 0),
    [paidOffItems],
  )

  const [paidOffOpen, setPaidOffOpen] = useState(false)

  return (
    <View style={styles.wrap}>
      {/* Summary row */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total left</Text>
          <Text style={styles.summaryValue}>{formatKr(totalBalance)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Paid debts</Text>
          <Text style={styles.summaryValue}>
            {paidOffItems.length}/{items.length}
          </Text>
        </View>
      </View>

      {activeItems.length > 0 ? (
        <>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="stats-chart-outline" size={14} color="rgba(240,244,252,0.52)" />
            <Text style={styles.sectionTitle}>Actual</Text>
          </View>

          {activeItems.map((item) => {
        const paid = item.originalAmount - item.currentBalance
        const progress =
          item.originalAmount > 0 ? Math.min(paid / item.originalAmount, 1) : 0
        const isPaidOff = item.currentBalance === 0
        const progressPercent = isPaidOff ? 100 : Math.min(Math.floor(progress * 100), 99)

        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.9}
            onPress={() => onPressItem(item)}
          >
            <LinearGradient
              colors={['rgba(55,67,168,0.92)', 'rgba(34,44,130,0.92)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              {/* Top row: icon + lender + amount */}
              <View style={styles.cardTopRow}>
                <View style={styles.cardIdentity}>
                  {item.iconUrl ? (
                    <Image source={{ uri: item.iconUrl }} style={styles.lenderIconImg} />
                  ) : (
                    <View style={styles.lenderIcon}>
                      <Ionicons name="business-outline" size={20} color="#C7D8FF" />
                    </View>
                  )}
                  <View style={styles.cardCopy}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.lender}
                    </Text>
                    <Text style={styles.cardSubtitle} numberOfLines={1}>
                      {item.notes || `Due ${formatDate(item.payoffDate)}`}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardAmount}>{formatKr(item.currentBalance)}</Text>
              </View>

              {/* Metrics pills */}
              <View style={styles.metricsRow}>
                <View style={styles.metricPill}>
                  <Ionicons name="trending-up-outline" size={11} color="rgba(199,216,255,0.8)" />
                  <Text style={styles.metricText}>{item.interestRate}% APR</Text>
                </View>
                {isPaidOff ? (
                  <View style={[styles.metricPill, styles.paidPill]}>
                    <Ionicons name="checkmark-circle-outline" size={11} color="#34D399" />
                    <Text style={[styles.metricText, styles.paidText]}>Paid off</Text>
                  </View>
                ) : (
                  <Text style={styles.originalText}>of {formatKr(item.originalAmount)}</Text>
                )}
              </View>

              {/* Progress bar */}
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${Math.max(progressPercent, 2)}%` }]}
                />
              </View>

              {/* Bottom row */}
              <View style={styles.bottomRow}>
                <Text style={styles.paidAmountText}>{formatKr(paid)} paid</Text>
                <Text style={styles.leftText}>
                  {isPaidOff ? 'Fully repaid' : `${progressPercent}% · Left: ${formatKr(item.currentBalance)}`}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )
          })}
        </>
      ) : null}

      {paidOffItems.length > 0 ? (
        <View style={styles.paidOffSection}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setPaidOffOpen((current) => !current)}
            style={styles.paidOffToggle}
          >
            <View style={styles.paidOffToggleLeft}>
              <View style={styles.paidOffBadge}>
                <Ionicons name="checkmark-done" size={13} color="#34D399" />
                <Text style={styles.paidOffBadgeText}>{paidOffItems.length}</Text>
              </View>
              <View>
                <Text style={styles.paidOffToggleTitle}>Paid off</Text>
                <Text style={styles.paidOffToggleSub}>{formatKr(paidOffTotal)} closed debt</Text>
              </View>
            </View>
            <Ionicons
              name={paidOffOpen ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="rgba(240,244,252,0.45)"
            />
          </TouchableOpacity>

          {paidOffOpen ? (
            <FlatList
              data={paidOffItems}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.paidOffScrollContent}
              renderItem={({ item }) => (
                <PaidOffMiniCard item={item} onPress={() => onPressItem(item)} />
              )}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 18, gap: 18 },
  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryCard: {
    flex: 1,
    minHeight: 78,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  summaryLabel: {
    color: 'rgba(235,240,248,0.46)',
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
  },
  summaryValue: {
    marginTop: 8,
    color: '#F4F7FB',
    fontSize: 28,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    color: '#EAF0FA',
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
  },
  card: {
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardIdentity: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  lenderIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  lenderIconImg: {
    width: 52,
    height: 52,
    borderRadius: 16,
  },
  cardCopy: { flex: 1, gap: 3 },
  cardTitle: { color: '#EDF3FF', fontSize: 16, fontFamily: 'DMSans_700Bold' },
  cardSubtitle: {
    color: 'rgba(220,230,255,0.62)',
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
  },
  cardAmount: { color: '#FFFFFF', fontSize: 19, fontFamily: 'DMSans_700Bold' },
  metricsRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  paidPill: { backgroundColor: 'rgba(16,185,129,0.14)' },
  metricText: {
    color: 'rgba(199,216,255,0.9)',
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
  },
  paidText: { color: '#34D399' },
  originalText: {
    color: 'rgba(199,216,255,0.55)',
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
  },
  progressTrack: {
    marginTop: 12,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: '#6DB2FF' },
  bottomRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paidAmountText: {
    color: 'rgba(199,216,255,0.72)',
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
  },
  leftText: { color: '#EDF3FF', fontSize: 13, fontFamily: 'DMSans_700Bold' },
  paidOffSection: { gap: 12 },
  paidOffToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.18)',
    backgroundColor: 'rgba(16,185,129,0.07)',
  },
  paidOffToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paidOffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  paidOffBadgeText: {
    color: '#34D399',
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
  },
  paidOffToggleTitle: {
    color: '#A7F3D0',
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
  paidOffToggleSub: {
    color: 'rgba(167,243,208,0.6)',
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    marginTop: 1,
  },
  paidOffScrollContent: { gap: 12, paddingRight: 4 },
  paidCard: {
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.16)',
    gap: 6,
  },
  paidCardTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  paidCardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  paidCardTitle: { color: '#E0FFF0', fontSize: 13, fontFamily: 'DMSans_700Bold' },
  paidCardAmount: { color: '#34D399', fontSize: 16, fontFamily: 'DMSerifDisplay_400Regular' },
  paidCardProgressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(16,185,129,0.16)',
    overflow: 'hidden',
  },
  paidCardProgressFill: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#34D399',
  },
  paidCardBottomRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  paidCardDate: {
    color: 'rgba(167,243,208,0.8)',
    fontSize: 10,
    fontFamily: 'DMSans_600SemiBold',
  },
  paidCardReady: { color: '#34D399', fontSize: 11, fontFamily: 'DMSans_700Bold' },
})
