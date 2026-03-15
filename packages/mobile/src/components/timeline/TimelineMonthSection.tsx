import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { FontAwesome5, Ionicons } from '@expo/vector-icons'
import type { TimelineSection } from '../../features/timeline/types'
import { formatDueLabel, formatTimelineCurrency, getTimelinePaymentMeta } from '../../features/timeline/utils'

type Props = {
  section: TimelineSection
  onEntryPress?: (entry: TimelineSection['entries'][number]) => void
}

export function TimelineMonthSection({ section, onEntryPress }: Props) {
  return (
    <View style={styles.section}>
      <LinearGradient
        colors={['rgba(108,210,214,0.9)', 'rgba(64,142,134,0.92)', 'rgba(23,41,63,0.98)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <View style={styles.bannerOrbA} />
        <View style={styles.bannerOrbB} />
        <View style={styles.bannerHorizon} />
        <View style={styles.bannerPill}>
          <Text style={styles.bannerPillText}>{section.monthLabel}</Text>
        </View>
      </LinearGradient>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{section.rangeLabel}</Text>
        <Text style={styles.metaText}>{section.itemCount} planned</Text>
      </View>

      <View style={styles.stack}>
        {section.entries.map((entry, index) => {
          const paymentMeta = getTimelinePaymentMeta(entry.paymentStatus)
          const isLast = index === section.entries.length - 1
          const iconName = (entry.icon as keyof typeof Ionicons.glyphMap | null) ?? 'ellipse-outline'

          return (
            <View key={entry.id} style={styles.timelineRow}>
              <View style={styles.timelineRail}>
                <View
                  style={[
                    styles.timelineDot,
                    {
                      backgroundColor: paymentMeta.dotColor,
                      borderColor: entry.accent,
                    },
                  ]}
                />
                {!isLast ? <View style={styles.timelineLine} /> : null}
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
                    <Text style={styles.cardDate}>Due {formatDueLabel(entry.dueDate)}</Text>
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
                        : `${entry.daysLeft} days left`}
                  </Text>
                </View>
              </TouchableOpacity>
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
  banner: {
    height: 148,
    marginHorizontal: 20,
    borderRadius: 30,
    overflow: 'hidden',
    justifyContent: 'flex-start',
    padding: 16,
  },
  bannerOrbA: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.18)',
    left: -24,
    top: 12,
  },
  bannerOrbB: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(116,240,173,0.18)',
    right: -52,
    bottom: -80,
  },
  bannerHorizon: {
    position: 'absolute',
    left: -10,
    right: -10,
    bottom: -24,
    height: 86,
    borderRadius: 80,
    backgroundColor: 'rgba(11,42,56,0.46)',
  },
  bannerPill: {
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(22,20,34,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  bannerPillText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
  },
  metaRow: {
    marginTop: 14,
    marginHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    color: 'rgba(255,255,255,0.36)',
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
  },
  stack: {
    marginTop: 18,
    paddingHorizontal: 20,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  timelineRail: {
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
    marginTop: 6,
    marginBottom: -6,
  },
  card: {
    flex: 1,
    marginBottom: 16,
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
  cardDate: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.44)',
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
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
