import React, { useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import type { BillEntry, DailySpend } from '../../services/dashboardApi'

type Props = {
  pocketMoneyBudget: number
  pocketMoneySpent: number
  billEntries: BillEntry[]
  recentDailySpend: DailySpend[]
  selectedMonth: Date
}

function fmtKr(value: number) {
  const safe = Number.isFinite(value) ? value : 0
  return `KR ${Math.round(safe).toLocaleString('nb-NO')}`
}

function getDaysLeftInMonth(selectedMonth: Date): number {
  const now = new Date()
  const isCurrentMonth =
    now.getFullYear() === selectedMonth.getFullYear() &&
    now.getMonth() === selectedMonth.getMonth()

  if (!isCurrentMonth) {
    // For past/future months show total days
    return new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate()
  }

  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return lastDay - now.getDate() + 1 // inclusive of today
}

function getVelocityColor(percentUsed: number): {
  primary: string
  dim: string
  bg: string
  border: string
  barColors: [string, string]
} {
  if (percentUsed < 0.4) {
    return {
      primary: 'rgba(94,189,151,0.95)',
      dim: 'rgba(94,189,151,0.5)',
      bg: 'rgba(94,189,151,0.1)',
      border: 'rgba(94,189,151,0.22)',
      barColors: ['rgba(94,189,151,0.9)', 'rgba(94,189,151,0.6)'],
    }
  }
  if (percentUsed < 0.7) {
    return {
      primary: 'rgba(201,168,76,0.95)',
      dim: 'rgba(201,168,76,0.5)',
      bg: 'rgba(201,168,76,0.1)',
      border: 'rgba(201,168,76,0.22)',
      barColors: ['rgba(201,168,76,0.9)', 'rgba(212,135,74,0.7)'],
    }
  }
  return {
    primary: 'rgba(201,107,107,0.95)',
    dim: 'rgba(201,107,107,0.5)',
    bg: 'rgba(201,107,107,0.1)',
    border: 'rgba(201,107,107,0.22)',
    barColors: ['rgba(201,107,107,0.9)', 'rgba(180,80,80,0.7)'],
  }
}

function getStatusLabel(percentUsed: number, daysLeft: number): string {
  if (percentUsed > 0.7 || (percentUsed > 0.5 && daysLeft > 15)) return 'AT RISK'
  if (percentUsed >= 1) return 'OVER BUDGET'
  return 'ON TRACK'
}

function getProjectedSpend(pocketMoneySpent: number, selectedMonth: Date): number {
  const now = new Date()
  const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate()
  const dayOfMonth = now.getDate()
  if (dayOfMonth === 0) return pocketMoneySpent
  return (pocketMoneySpent / dayOfMonth) * daysInMonth
}

export function DashboardSpendingVelocityCard({
  pocketMoneyBudget,
  pocketMoneySpent,
  billEntries,
  recentDailySpend,
  selectedMonth,
}: Props) {
  const [activeState, setActiveState] = useState<0 | 1 | 2>(0)

  const pendingBills = billEntries
    .filter((b) => !b.isPaid)
    .reduce((s, b) => s + (Number.isFinite(b.amount) ? b.amount : 0), 0)

  const daysLeft = getDaysLeftInMonth(selectedMonth)
  const safeLeft = Math.max(daysLeft, 1)
  // Bills are already excluded from pocketMoneyBudget — no double-deduction
  const dailyLimit = (pocketMoneyBudget - pocketMoneySpent) / safeLeft
  const percentUsed = pocketMoneyBudget > 0 ? Math.min(pocketMoneySpent / pocketMoneyBudget, 1) : 0
  const remaining = pocketMoneyBudget - pocketMoneySpent

  const vc = getVelocityColor(percentUsed)
  const statusLabel = getStatusLabel(percentUsed, daysLeft)
  const projectedSpend = getProjectedSpend(pocketMoneySpent, selectedMonth)

  const maxDailySpend = Math.max(...recentDailySpend.map((d) => d.amount), 1)

  const cycleState = () => {
    setActiveState((prev) => ((prev + 1) % 3) as 0 | 1 | 2)
  }

  return (
    <TouchableOpacity activeOpacity={0.96} onPress={cycleState}>
      <LinearGradient
        colors={['rgba(24,22,38,0.98)', 'rgba(13,14,22,0.98)']}
        style={styles.card}
      >
        <LinearGradient
          colors={[vc.bg.replace('0.1', '0.14'), vc.bg.replace('0.1', '0.04'), 'transparent']}
          style={styles.cardBloom}
        />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Spending Velocity</Text>
            <Text style={styles.subtitle}>Pocket money · {daysLeft} days left</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: vc.bg, borderColor: vc.border }]}>
            <Text style={[styles.statusText, { color: vc.primary }]}>{statusLabel}</Text>
          </View>
        </View>

        {/* State 0 — Velocity view */}
        {activeState === 0 && (
          <>
            {/* Main amount */}
            <View style={styles.amountRow}>
              <View>
                <Text style={styles.amountLabel}>Daily limit</Text>
                <View style={styles.amountLine}>
                  <Text style={[styles.amountValue, { color: vc.primary }]}>
                    {fmtKr(Math.max(dailyLimit, 0))}
                  </Text>
                  <Text style={styles.amountDivider}>/</Text>
                  <Text style={styles.amountTotal}>{fmtKr(pocketMoneyBudget)}</Text>
                </View>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <LinearGradient
                colors={vc.barColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${Math.round(percentUsed * 100)}%` }]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLeft}>{fmtKr(remaining)} remaining</Text>
              <Text style={[styles.progressRight, { color: vc.primary }]}>
                {Math.round(percentUsed * 100)}% used
              </Text>
            </View>

            {/* Metrics strip */}
            <View style={styles.strip}>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>DAILY LIMIT</Text>
                <Text style={[styles.metricValue, { color: vc.primary }]}>
                  {fmtKr(Math.max(dailyLimit, 0))}
                </Text>
                <Text style={styles.metricSub}>available per day</Text>
              </View>
              <View style={styles.stripDivider} />
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>DAYS LEFT</Text>
                <Text style={[styles.metricValue, { color: 'rgba(255,255,255,0.88)' }]}>
                  {daysLeft}
                </Text>
                <Text style={styles.metricSub}>in this month</Text>
              </View>
            </View>

            {/* 7-day mini bar chart */}
            <View style={styles.barsRow}>
              {recentDailySpend.map((day) => {
                const heightPct = maxDailySpend > 0 ? day.amount / maxDailySpend : 0
                const isToday = day.date === new Date().toISOString().split('T')[0]
                return (
                  <View key={day.date} style={styles.barCol}>
                    <View style={styles.barTrack}>
                      <LinearGradient
                        colors={isToday ? ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.2)'] : vc.barColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={[
                          styles.barFill,
                          { height: `${Math.max(heightPct * 100, day.amount > 0 ? 8 : 2)}%` },
                          isToday && styles.barToday,
                        ]}
                      />
                    </View>
                    <Text style={[styles.barLabel, isToday && { color: 'rgba(255,255,255,0.55)' }]}>
                      {isToday
                        ? 'TODAY'
                        : new Date(day.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase().split(' ')[0] +
                          ' ' +
                          new Date(day.date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()}
                    </Text>
                  </View>
                )
              })}
            </View>
            <View style={styles.barAxisLabels}>
              <Text style={styles.barAxisText}>
                {recentDailySpend[0]
                  ? new Date(recentDailySpend[0].date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase()
                  : ''}
              </Text>
              <Text style={styles.barAxisCenter}>7-day spend</Text>
              <Text style={styles.barAxisText}>TODAY</Text>
            </View>

            {/* Pending bills note */}
            {pendingBills > 0 && (
              <View style={[styles.note, { borderColor: vc.border, backgroundColor: vc.bg }]}>
                <View style={[styles.noteDot, { backgroundColor: vc.primary }]} />
                <Text style={[styles.noteText, { color: vc.dim }]}>
                  <Text style={{ color: vc.primary }}>{fmtKr(pendingBills)}</Text>
                  {' '}in pending bills outside your pocket money pool
                </Text>
              </View>
            )}
          </>
        )}

        {/* State 1 — Breakdown view */}
        {activeState === 1 && (
          <>
            <View style={styles.amountRow}>
              <View>
                <Text style={styles.amountLabel}>Pocket money spent</Text>
                <View style={styles.amountLine}>
                  <Text style={[styles.amountValue, { color: vc.primary }]}>{fmtKr(pocketMoneySpent)}</Text>
                  <Text style={styles.amountDivider}>/</Text>
                  <Text style={styles.amountTotal}>{fmtKr(pocketMoneyBudget)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.strip}>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>REMAINING</Text>
                <Text style={[styles.metricValue, { color: 'rgba(255,255,255,0.88)' }]}>
                  {fmtKr(remaining)}
                </Text>
                <Text style={styles.metricSub}>pocket money left</Text>
              </View>
              <View style={styles.stripDivider} />
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>BILLS EXCLUDED</Text>
                <Text style={[styles.metricValue, { color: vc.primary }]}>
                  {fmtKr(pendingBills > 0 ? pendingBills : 0)}
                </Text>
                <Text style={styles.metricSub}>{pendingBills > 0 ? 'pending unpaid' : 'all clear'}</Text>
              </View>
            </View>

            {pendingBills > 0 ? (
              <View style={[styles.breakdownPending, { borderColor: vc.border, backgroundColor: vc.bg }]}>
                <View style={styles.breakdownPendingRow}>
                  <Ionicons name="receipt-outline" size={14} color={vc.primary} />
                  <Text style={[styles.breakdownPendingLabel, { color: vc.primary }]}>Pending bills</Text>
                  <Text style={[styles.breakdownPendingAmount, { color: vc.primary }]}>{fmtKr(pendingBills)}</Text>
                </View>
                <Text style={styles.breakdownPendingNote}>
                  {billEntries.filter((b) => !b.isPaid).length} unpaid bill{billEntries.filter((b) => !b.isPaid).length !== 1 ? 's' : ''} reduce your spendable balance
                </Text>
              </View>
            ) : (
              <View style={[styles.breakdownPending, { borderColor: 'rgba(94,189,151,0.22)', backgroundColor: 'rgba(94,189,151,0.08)' }]}>
                <View style={styles.breakdownPendingRow}>
                  <Ionicons name="checkmark-circle-outline" size={14} color="rgba(94,189,151,0.9)" />
                  <Text style={[styles.breakdownPendingLabel, { color: 'rgba(94,189,151,0.9)' }]}>All bills paid</Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* State 2 — Projection view */}
        {activeState === 2 && (
          <>
            <View style={styles.amountRow}>
              <View>
                <Text style={styles.amountLabel}>Projected pocket spend</Text>
                <View style={styles.amountLine}>
                  <Text style={[styles.amountValue, { color: projectedSpend > pocketMoneyBudget ? 'rgba(201,107,107,0.95)' : vc.primary }]}>
                    {fmtKr(projectedSpend)}
                  </Text>
                  <Text style={styles.amountDivider}>/</Text>
                  <Text style={styles.amountTotal}>{fmtKr(pocketMoneyBudget)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.strip}>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>BURN RATE</Text>
                <Text style={[styles.metricValue, { color: 'rgba(255,255,255,0.88)' }]}>
                  {fmtKr(pocketMoneySpent / Math.max(new Date().getDate(), 1))}/day
                </Text>
                <Text style={styles.metricSub}>avg last {new Date().getDate()} days</Text>
              </View>
              <View style={styles.stripDivider} />
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>FORECAST</Text>
                <Text style={[styles.metricValue, { color: projectedSpend > pocketMoneyBudget ? 'rgba(201,107,107,0.95)' : 'rgba(94,189,151,0.95)' }]}>
                  {projectedSpend > pocketMoneyBudget
                    ? fmtKr(projectedSpend - pocketMoneyBudget) + ' over'
                    : fmtKr(pocketMoneyBudget - projectedSpend) + ' saved'}
                </Text>
                <Text style={styles.metricSub}>{projectedSpend > pocketMoneyBudget ? 'projected overspend' : 'on track this month'}</Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <LinearGradient
                colors={projectedSpend > pocketMoneyBudget ? ['rgba(201,107,107,0.9)', 'rgba(180,80,80,0.7)'] : vc.barColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${Math.min(Math.round((projectedSpend / pocketMoneyBudget) * 100), 100)}%` }]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLeft}>End-of-month projection</Text>
              <Text style={[styles.progressRight, { color: projectedSpend > pocketMoneyBudget ? 'rgba(201,107,107,0.9)' : vc.primary }]}>
                {Math.round((projectedSpend / pocketMoneyBudget) * 100)}%
              </Text>
            </View>
          </>
        )}

        {/* State dots */}
        <View style={styles.dots}>
          {([0, 1, 2] as const).map((i) => (
            <View
              key={i}
              style={[styles.dot, activeState === i && { backgroundColor: vc.primary, width: 14 }]}
            />
          ))}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 18,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  cardBloom: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    color: 'rgba(255,255,255,0.93)',
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.34)',
    fontSize: 11,
    marginTop: 4,
  },
  statusBadge: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  amountRow: {
    marginBottom: 14,
  },
  amountLabel: {
    color: 'rgba(255,255,255,0.36)',
    fontSize: 11,
    marginBottom: 4,
  },
  amountLine: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  amountDivider: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 18,
    fontWeight: '300',
    marginBottom: 2,
  },
  amountTotal: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  progressTrack: {
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  progressLeft: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
  },
  progressRight: {
    fontSize: 10,
    fontWeight: '700',
  },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  metricBlock: {
    flex: 1,
  },
  stripDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 12,
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  metricSub: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: 9,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 48,
    marginBottom: 4,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: '100%',
    height: 36,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: 4,
  },
  barFill: {
    width: '100%',
    borderRadius: 3,
  },
  barToday: {
    borderRadius: 3,
  },
  barLabel: {
    color: 'rgba(255,255,255,0.18)',
    fontSize: 7,
    marginTop: 3,
    textAlign: 'center',
  },
  barAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  barAxisText: {
    color: 'rgba(255,255,255,0.22)',
    fontSize: 8,
  },
  barAxisCenter: {
    color: 'rgba(255,255,255,0.18)',
    fontSize: 8,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noteDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  noteText: {
    fontSize: 11,
    flex: 1,
  },
  breakdownPending: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  breakdownPendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakdownPendingLabel: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  breakdownPendingAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  breakdownPendingNote: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10,
    marginLeft: 22,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 14,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
})
