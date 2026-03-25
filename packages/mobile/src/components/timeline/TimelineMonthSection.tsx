import React, { useMemo } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { FontAwesome5, Ionicons } from '@expo/vector-icons'
import type { TimelineSection } from '../../features/timeline/types'
import { buildWeekBands, formatTimelineCurrency, getTimelinePaymentMeta, getIncomePaymentMeta } from '../../features/timeline/utils'
import { TimelineLandscapeBanner } from './TimelineLandscapeBanner'

type Props = {
  section: TimelineSection
  onEntryPress?: (entry: TimelineSection['entries'][number]) => void
  now?: Date
}

export function TimelineMonthSection({ section, onEntryPress, now }: Props) {
  const today = useMemo(() => now ?? new Date(), [now])
  const [year, month] = section.id.split('-').map(Number)

  const weekBands = useMemo(
    () => buildWeekBands(year, month, section.entries, today),
    [year, month, section.entries, today],
  )

  return (
    <View style={styles.section}>
      <TimelineLandscapeBanner section={section} />

      <View style={styles.stack}>
        {weekBands.map((band, bandIndex) => {
          const isLastBand = bandIndex === weekBands.length - 1

          return (
            <View key={band.key} style={styles.bandGroup}>
              {/* Week header */}
              <View style={styles.weekHeaderRow}>
                <View style={[styles.weekDot, band.isCurrentWeek && styles.weekDotActive]} />
                <Text style={[styles.weekHeaderText, band.isCurrentWeek && styles.weekHeaderTextActive]}>
                  {band.label}
                </Text>
                {band.isCurrentWeek && (
                  <View style={styles.nowPill}>
                    <Text style={styles.nowPillText}>now</Text>
                  </View>
                )}
              </View>

              {band.entries.length === 0 ? (
                /* Empty week — subtle dashed divider */
                <View style={styles.emptyBand}>
                  <View style={styles.emptyDash} />
                  <Text style={styles.emptyBandText}>No payments</Text>
                  <View style={styles.emptyDash} />
                </View>
              ) : (
                /* Entry cards for this week */
                band.entries.map((entry, entryIndex) => {
                  const isIncome = entry.entryKind === 'income'
                  const isPressable = !isIncome || entry.source === 'income_entry'
                  const paymentMeta = isIncome
                    ? getIncomePaymentMeta(entry.paymentStatus)
                    : getTimelinePaymentMeta(entry.paymentStatus)
                  const isLastEntry = isLastBand && entryIndex === band.entries.length - 1
                  const iconName = (entry.icon as keyof typeof Ionicons.glyphMap | null) ?? 'ellipse-outline'

                  return (
                    <View key={entry.id} style={styles.timelineRow}>
                      <View style={styles.rail}>
                        <View
                          style={[
                            styles.timelineDot,
                            {
                              backgroundColor: paymentMeta.dotColor,
                              borderColor: entry.accent,
                            },
                          ]}
                        />
                        {!isLastEntry ? <View style={styles.timelineLine} /> : null}
                      </View>

                      <TouchableOpacity
                        style={[styles.card, isIncome && styles.cardIncome]}
                        activeOpacity={isPressable ? 0.88 : 1}
                        disabled={!isPressable}
                        onPress={() => onEntryPress?.(entry)}
                      >
                        <View style={styles.cardTop}>
                          <View style={[styles.categoryPill, isIncome && styles.categoryPillIncome]}>
                            <View style={[styles.categoryIconWrap, { backgroundColor: `${entry.accent}1d` }]}>
                              <Ionicons name={iconName} size={12} color={entry.accent} />
                            </View>
                            <Text style={styles.categoryText}>{entry.category}</Text>
                          </View>
                          <Text style={[styles.badge, { color: paymentMeta.textColor }]}>{paymentMeta.label}</Text>
                        </View>

                        <View style={styles.cardMiddle}>
                          <View style={styles.cardTextBlock}>
                            <Text style={styles.cardTitle}>{entry.title}</Text>
                          </View>
                          <Text style={styles.cardAmount}>{formatTimelineCurrency(entry.amount)}</Text>
                        </View>

                        <View style={styles.cardBottom}>
                          <View style={styles.recurringPill}>
                            <FontAwesome5 name="sync-alt" size={10} color="rgba(255,255,255,0.36)" />
                            <Text style={styles.recurringText}>{entry.recurring ? 'Recurring' : 'One-time'}</Text>
                          </View>
                          <Text style={styles.daysLeftText}>
                            {entry.paymentStatus === 'paid' || entry.paymentStatus === 'received'
                              ? ''
                              : entry.daysLeft === 0
                                ? 'Due today'
                                : entry.daysLeft === 1
                                  ? '1 day left'
                                  : entry.daysLeft < 0
                                    ? `${Math.abs(entry.daysLeft)}d overdue`
                                    : `${entry.daysLeft} days left`}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  )
                })
              )}
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
  },
  stack: {
    marginTop: 14,
    paddingHorizontal: 20,
  },
  bandGroup: {
    marginBottom: 4,
  },

  // Week header
  weekHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  weekDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  weekDotActive: {
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  weekHeaderText: {
    color: 'rgba(255,255,255,0.38)',
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  weekHeaderTextActive: {
    color: 'rgba(255,255,255,0.78)',
  },
  nowPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  nowPillText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 0.4,
  },

  // Empty band
  emptyBand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  emptyDash: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  emptyBandText: {
    color: 'rgba(255,255,255,0.18)',
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
  },

  // Timeline rail
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  rail: {
    width: 26,
    alignItems: 'center',
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 999,
    borderWidth: 3,
    marginTop: 22,
    zIndex: 2,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: 4,
    marginBottom: -4,
    minHeight: 8,
  },

  // Card
  card: {
    flex: 1,
    marginBottom: 12,
    borderRadius: 24,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardIncome: {
    backgroundColor: 'rgba(94,210,140,0.05)',
    borderColor: 'rgba(94,210,140,0.14)',
  },
  categoryPillIncome: {
    backgroundColor: 'rgba(94,210,140,0.08)',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(10,16,26,0.7)',
  },
  categoryIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
  },
  badge: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
  },
  cardMiddle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  cardTextBlock: {
    flex: 1,
  },
  cardTitle: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
  },
  cardAmount: {
    marginLeft: 10,
    color: 'rgba(255,255,255,0.92)',
    fontSize: 18,
    fontFamily: 'DMSans_800ExtraBold',
  },
  cardBottom: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recurringPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recurringText: {
    color: 'rgba(255,255,255,0.36)',
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
  },
  daysLeftText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
  },
})
