import React, { useMemo, useState } from 'react'
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

import type { Loan } from '../../services/loanApi'

type Props = {
  items: Loan[]
  onPressItem: (item: Loan) => void
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

const REPAID_CARD_W = 188

function RepaidMiniCard({ item, onPress }: { item: Loan; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={{ width: REPAID_CARD_W }}>
      <LinearGradient
        colors={['rgba(16,185,129,0.22)', 'rgba(16,185,129,0.08)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.repaidCard}
      >
        <View style={styles.repaidTopRow}>
          <View style={styles.repaidIconWrap}>
            <Ionicons name="person-outline" size={16} color="#A7F3D0" />
          </View>
          <Ionicons name="checkmark-circle" size={18} color="#34D399" />
        </View>

        <Text style={styles.repaidTitle} numberOfLines={1}>{item.recipient}</Text>
        <Text style={styles.repaidAmount}>{formatKr(item.amount)}</Text>

        <View style={styles.repaidTrack}>
          <View style={styles.repaidFill} />
        </View>

        <View style={styles.repaidBottomRow}>
          <Text style={styles.repaidDate}>{formatDate(item.expectedRepaymentDate)}</Text>
          <Text style={styles.repaidText}>Repaid</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
}

export function LentLoansOverview({ items, onPressItem }: Props) {
  const activeItems = useMemo(() => items.filter((item) => item.status !== 'repaid'), [items])
  const repaidItems = useMemo(() => items.filter((item) => item.status === 'repaid'), [items])

  const totalOutstanding = useMemo(
    () => activeItems.reduce((sum, item) => sum + item.amount, 0),
    [activeItems],
  )

  const repaidTotal = useMemo(
    () => repaidItems.reduce((sum, item) => sum + item.amount, 0),
    [repaidItems],
  )

  const [repaidOpen, setRepaidOpen] = useState(false)

  return (
    <View style={styles.wrap}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total out</Text>
          <Text style={styles.summaryValue}>{formatKr(totalOutstanding)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Repaid</Text>
          <Text style={styles.summaryValue}>{repaidItems.length}/{items.length}</Text>
        </View>
      </View>

      {activeItems.length > 0 ? (
        <>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="arrow-forward-outline" size={14} color="rgba(240,244,252,0.52)" />
            <Text style={styles.sectionTitle}>Lent out</Text>
          </View>

          {activeItems.map((item) => {
            const overdue = item.status === 'overdue'
            const dueSoon = item.status === 'due_soon'

            return (
              <TouchableOpacity key={item.id} activeOpacity={0.9} onPress={() => onPressItem(item)}>
                <LinearGradient
                  colors={['rgba(76,114,232,0.92)', 'rgba(46,75,176,0.92)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.card}
                >
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardIdentity}>
                      <View style={styles.personIcon}>
                        <Ionicons name="person-outline" size={20} color="#DCE6FF" />
                      </View>
                      <View style={styles.cardCopy}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{item.recipient}</Text>
                        <Text style={styles.cardSubtitle} numberOfLines={1}>
                          {item.notes || `Due ${formatDate(item.expectedRepaymentDate)}`}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.cardAmount}>{formatKr(item.amount)}</Text>
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaPill}>
                      <Ionicons name="calendar-outline" size={11} color="rgba(220,230,255,0.8)" />
                      <Text style={styles.metaText}>{formatDate(item.dateGiven)}</Text>
                    </View>
                    <Text style={[styles.statusText, overdue ? styles.statusDanger : dueSoon ? styles.statusWarning : null]}>
                      {overdue ? 'Overdue' : dueSoon ? 'Due soon' : 'Outstanding'}
                    </Text>
                  </View>

                  <View style={styles.bottomRow}>
                    <Text style={styles.bottomLabel}>Expected: {formatDate(item.expectedRepaymentDate)}</Text>
                    <Text style={styles.bottomLabel}>Open</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )
          })}
        </>
      ) : null}

      {repaidItems.length > 0 ? (
        <View style={styles.repaidSection}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setRepaidOpen((current) => !current)}
            style={styles.repaidToggle}
          >
            <View style={styles.repaidToggleLeft}>
              <View style={styles.repaidBadge}>
                <Ionicons name="checkmark-done" size={13} color="#34D399" />
                <Text style={styles.repaidBadgeText}>{repaidItems.length}</Text>
              </View>
              <View>
                <Text style={styles.repaidToggleTitle}>Repaid</Text>
                <Text style={styles.repaidToggleSub}>{formatKr(repaidTotal)} closed loans</Text>
              </View>
            </View>
            <Ionicons name={repaidOpen ? 'chevron-up' : 'chevron-down'} size={16} color="rgba(240,244,252,0.45)" />
          </TouchableOpacity>

          {repaidOpen ? (
            <FlatList
              data={repaidItems}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.repaidScrollContent}
              renderItem={({ item }) => <RepaidMiniCard item={item} onPress={() => onPressItem(item)} />}
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
  summaryLabel: { color: 'rgba(235,240,248,0.46)', fontSize: 12, fontFamily: 'DMSans_600SemiBold' },
  summaryValue: { marginTop: 8, color: '#F4F7FB', fontSize: 28, fontFamily: 'DMSerifDisplay_400Regular' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 2 },
  sectionTitle: { color: '#EAF0FA', fontSize: 16, fontFamily: 'DMSans_700Bold' },
  card: {
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  cardIdentity: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  personIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  cardCopy: { flex: 1, gap: 3 },
  cardTitle: { color: '#EDF3FF', fontSize: 16, fontFamily: 'DMSans_700Bold' },
  cardSubtitle: { color: 'rgba(220,230,255,0.62)', fontSize: 12, fontFamily: 'DMSans_500Medium' },
  cardAmount: { color: '#FFFFFF', fontSize: 19, fontFamily: 'DMSans_700Bold' },
  metaRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  metaText: { color: 'rgba(220,230,255,0.9)', fontSize: 12, fontFamily: 'DMSans_600SemiBold' },
  statusText: { color: '#EDF3FF', fontSize: 12, fontFamily: 'DMSans_700Bold' },
  statusDanger: { color: '#FFB0B5' },
  statusWarning: { color: '#FFD99A' },
  bottomRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  bottomLabel: { color: 'rgba(220,230,255,0.75)', fontSize: 12, fontFamily: 'DMSans_600SemiBold' },
  repaidSection: { gap: 12 },
  repaidToggle: {
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
  repaidToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  repaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  repaidBadgeText: { color: '#34D399', fontSize: 13, fontFamily: 'DMSans_700Bold' },
  repaidToggleTitle: { color: '#A7F3D0', fontSize: 14, fontFamily: 'DMSans_700Bold' },
  repaidToggleSub: { color: 'rgba(167,243,208,0.6)', fontSize: 12, fontFamily: 'DMSans_500Medium', marginTop: 1 },
  repaidScrollContent: { gap: 12, paddingRight: 4 },
  repaidCard: {
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.16)',
    gap: 6,
  },
  repaidTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  repaidIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  repaidTitle: { color: '#E0FFF0', fontSize: 13, fontFamily: 'DMSans_700Bold' },
  repaidAmount: { color: '#34D399', fontSize: 16, fontFamily: 'DMSerifDisplay_400Regular' },
  repaidTrack: { height: 4, borderRadius: 999, backgroundColor: 'rgba(16,185,129,0.16)', overflow: 'hidden' },
  repaidFill: { width: '100%', height: '100%', borderRadius: 999, backgroundColor: '#34D399' },
  repaidBottomRow: { marginTop: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  repaidDate: { color: 'rgba(167,243,208,0.8)', fontSize: 10, fontFamily: 'DMSans_600SemiBold' },
  repaidText: { color: '#34D399', fontSize: 11, fontFamily: 'DMSans_700Bold' },
})
