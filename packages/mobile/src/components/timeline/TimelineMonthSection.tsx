import React, { useMemo } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { FontAwesome5, Ionicons } from '@expo/vector-icons'
import type { TimelineSection } from '../../features/timeline/types'
import { formatDayHeader, formatTimelineCurrency, getTimelinePaymentMeta } from '../../features/timeline/utils'
import { TimelineLandscapeBanner } from './TimelineLandscapeBanner'

type Props = {
  section: TimelineSection
  onEntryPress?: (entry: TimelineSection['entries'][number]) => void
  now?: Date
}

type DayGroup = {
  dayDate: Date
  label: string
  entries: TimelineSection['entries']
}

export function TimelineMonthSection({ section, onEntryPress, now }: Props) {
  const today = useMemo(() => now ?? new Date(), [now])

  // Group entries by calendar day, preserving sorted order
  const dayGroups = useMemo<DayGroup[]>(() => {
    const groups: DayGroup[] = []
    const keyToIndex = new Map<string, number>()

    for (const entry of section.entries) {
      const key = entry.dueDate.toDateString()
      const idx = keyToIndex.get(key)
      if (idx !== undefined) {
        groups[idx].entries.push(entry)
      } else {
        keyToIndex.set(key, groups.length)
        groups.push({
          dayDate: entry.dueDate,
          label: formatDayHeader(entry.dueDate, today),
          entries: [entry],
        })
      }
    }
    return groups
  }, [section.entries, today])

  return (
    <View style={styles.section}>
      <TimelineLandscapeBanner section={section} />

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{section.itemCount} planned this month</Text>
      </View>

      <View style={styles.stack}>
        {dayGroups.map((group, groupIndex) => {
          const isLastGroup = groupIndex === dayGroups.length - 1

          return (
            <View key={group.dayDate.toDateString()}>
              {/* Day header */}
              <View style={styles.dayHeaderRow}>
                <View style={styles.railSpacer}>
                  <View style={styles.dayDot} />
                  <View style={styles.timelineLine} />
                </View>
                <Text style={styles.dayHeaderText}>{group.label}</Text>
              </View>

              {/* Entries for this day */}
              {group.entries.map((entry, entryIndex) => {
                const paymentMeta = getTimelinePaymentMeta(entry.paymentStatus)
                const isLastEntry = isLastGroup && entryIndex === group.entries.length - 1
                const iconName = (entry.icon as keyof typeof Ionicons.glyphMap | null) ?? 'ellipse-outline'

                return (
                  <View key={entry.id} style={styles.timelineRow}>
                    <View style={styles.railSpacer}>
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
                      style={styles.card}
                      activeOpacity={0.88}
                      onPress={() => onEntryPress?.(entry)}
                    >
                      <View style={styles.cardTop}>
                        <View style={styles.categoryPill}>
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
                          {entry.daysLeft === 0
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
              })}
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
  metaRow: {
    marginTop: 12,
    marginHorizontal: 24,
  },
  metaText: {
    color: 'rgba(255,255,255,0.36)',
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
  },
  stack: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  // Day header row
  dayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dayHeaderText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginLeft: 10,
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
    zIndex: 2,
  },
  // Shared rail column
  railSpacer: {
    width: 26,
    alignItems: 'center',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
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
  card: {
    flex: 1,
    marginBottom: 12,
    borderRadius: 24,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
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
