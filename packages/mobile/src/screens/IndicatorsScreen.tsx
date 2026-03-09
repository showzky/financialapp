import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ScreenHero } from '../components/ScreenHero'
import { useScreenPalette } from '../customthemes'

interface Subscription {
  id: string
  name: string
  cost: number
  frequency: 'monthly' | 'yearly' | 'weekly' | 'daily'
  isActive: boolean
  nextBillingDate: string
}

export function IndicatorsScreen() {
  const { activeTheme } = useScreenPalette()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setSubscriptions([
        {
          id: '1',
          name: 'Spotify Premium',
          cost: 149,
          frequency: 'monthly',
          isActive: true,
          nextBillingDate: '2026-03-15',
        },
        {
          id: '2',
          name: 'Netflix',
          cost: 199,
          frequency: 'monthly',
          isActive: true,
          nextBillingDate: '2026-03-10',
        },
      ])
      setLoading(false)
    }, 500)
  }, [])

  const monthlyTotal = subscriptions
    .filter((s) => s.isActive && s.frequency === 'monthly')
    .reduce((sum, s) => sum + s.cost, 0)

  const yearlyBreakdown = subscriptions
    .filter((s) => s.isActive && s.frequency === 'yearly')
    .reduce((sum, s) => sum + (s.cost / 12), 0)

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: activeTheme.colors.screenBackground }]}>
        <ActivityIndicator size="large" color={activeTheme.colors.accent} />
      </View>
    )
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: activeTheme.colors.screenBackground }]}>
      <ScreenHero
        eyebrow="Overview"
        title="Subscriptions"
        subtitle="See recurring services, monthly weight, and annual drag at a glance."
        theme={{
          gradient: activeTheme.colors.heroGradient,
          eyebrow: activeTheme.colors.heroEyebrow,
          title: activeTheme.colors.heroTitle,
          subtitle: activeTheme.colors.heroSubtitle,
        }}
      />

      <View
        style={[
          styles.overviewCard,
          {
            backgroundColor: activeTheme.colors.surface,
            borderColor: activeTheme.colors.surfaceBorder,
          },
        ]}
      >
        <View style={styles.overviewItem}>
          <View style={[styles.iconContainer, { backgroundColor: activeTheme.colors.secondarySoft }]}>
            <Ionicons name="calendar" size={24} color={activeTheme.colors.secondary} />
          </View>
          <View>
            <Text style={[styles.overviewLabel, { color: activeTheme.colors.mutedText }]}>Monthly Cost</Text>
            <Text style={[styles.overviewAmount, { color: activeTheme.colors.text }]}>NOK {monthlyTotal.toLocaleString()}</Text>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: activeTheme.colors.surfaceBorder }]} />
        <View style={styles.overviewItem}>
          <View style={[styles.iconContainer, { backgroundColor: activeTheme.colors.accentSoft }]}>
            <Ionicons name="trending-up" size={24} color={activeTheme.colors.accent} />
          </View>
          <View>
            <Text style={[styles.overviewLabel, { color: activeTheme.colors.mutedText }]}>Annual Cost</Text>
            <Text style={[styles.overviewAmount, { color: activeTheme.colors.text }]}>
              NOK {((monthlyTotal + yearlyBreakdown) * 12).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: activeTheme.colors.text }]}>Active Subscriptions</Text>
          <View style={[styles.badge, { backgroundColor: activeTheme.colors.accentSoft }]}>
            <Text style={[styles.badgeText, { color: activeTheme.colors.accent }]}>
              {subscriptions.filter((s) => s.isActive).length}
            </Text>
          </View>
        </View>

        {subscriptions.filter((s) => s.isActive).length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: activeTheme.colors.mutedText }]}>No active subscriptions</Text>
          </View>
        ) : (
          <FlatList
            scrollEnabled={false}
            data={subscriptions.filter((s) => s.isActive)}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.subscriptionCard,
                  {
                    backgroundColor: activeTheme.colors.surface,
                    borderColor: activeTheme.colors.surfaceBorder,
                  },
                ]}
              >
                <View style={styles.subHeader}>
                  <Text style={[styles.subName, { color: activeTheme.colors.text }]}>{item.name}</Text>
                  <View style={[styles.activeBadge, { backgroundColor: activeTheme.colors.secondarySoft }]}>
                    <Ionicons name="checkmark-circle" size={16} color={activeTheme.colors.secondary} />
                    <Text style={[styles.activeText, { color: activeTheme.colors.secondary }]}>Active</Text>
                  </View>
                </View>

                <View style={[styles.subDetails, { borderBottomColor: activeTheme.colors.surfaceBorder }]}>
                  <View style={styles.subDetail}>
                    <Text style={[styles.detailLabel, { color: activeTheme.colors.subtleText }]}>Cost</Text>
                    <Text style={[styles.detailValue, { color: activeTheme.colors.text }]}>NOK {item.cost.toLocaleString()}</Text>
                  </View>
                  <View style={styles.subDetail}>
                    <Text style={[styles.detailLabel, { color: activeTheme.colors.subtleText }]}>Frequency</Text>
                    <Text style={[styles.detailValue, { color: activeTheme.colors.text }]}>
                      {item.frequency.charAt(0).toUpperCase() + item.frequency.slice(1)}
                    </Text>
                  </View>
                  <View style={styles.subDetail}>
                    <Text style={[styles.detailLabel, { color: activeTheme.colors.subtleText }]}>Next Billing</Text>
                    <Text style={[styles.detailValue, { color: activeTheme.colors.text }]}>{item.nextBillingDate}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: activeTheme.colors.accentSoft,
                      borderColor: activeTheme.colors.accentLine,
                    },
                  ]}
                >
                  <Text style={[styles.actionText, { color: activeTheme.colors.accent }]}>Manage</Text>
                  <Ionicons name="chevron-forward" size={16} color={activeTheme.colors.accent} />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: activeTheme.colors.text }]}>Financial Impact</Text>
        <View style={styles.summaryGrid}>
          <View
            style={[
              styles.summaryBox,
              {
                backgroundColor: activeTheme.colors.surface,
                borderColor: activeTheme.colors.surfaceBorder,
              },
            ]}
          >
            <Text style={[styles.summaryBoxLabel, { color: activeTheme.colors.mutedText }]}>This Month</Text>
            <Text style={[styles.summaryBoxValue, { color: activeTheme.colors.text }]}>NOK {monthlyTotal.toLocaleString()}</Text>
          </View>
          <View
            style={[
              styles.summaryBox,
              {
                backgroundColor: activeTheme.colors.surface,
                borderColor: activeTheme.colors.surfaceBorder,
              },
            ]}
          >
            <Text style={[styles.summaryBoxLabel, { color: activeTheme.colors.mutedText }]}>This Year</Text>
            <Text style={[styles.summaryBoxValue, { color: activeTheme.colors.text }]}>
              NOK {((monthlyTotal + yearlyBreakdown) * 12).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.addButton,
          {
            backgroundColor: activeTheme.colors.accentSoft,
            borderColor: activeTheme.colors.accentLine,
          },
        ]}
      >
        <Ionicons name="add" size={20} color={activeTheme.colors.accent} />
        <Text style={[styles.addButtonText, { color: activeTheme.colors.accent }]}>Add Subscription</Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overviewCard: {
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
  },
  overviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  divider: {
    height: 1,
  },
  overviewLabel: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
  },
  overviewAmount: {
    fontSize: 20,
    marginTop: 4,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
  },
  subscriptionCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  subName: {
    fontSize: 16,
    flex: 1,
    fontFamily: 'DMSans_700Bold',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
  },
  activeText: {
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
  },
  subDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  subDetail: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
  },
  detailValue: {
    fontSize: 13,
    marginTop: 4,
    fontFamily: 'DMSans_700Bold',
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  summaryBox: {
    flex: 1,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
  },
  summaryBoxLabel: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
  },
  summaryBoxValue: {
    fontSize: 16,
    marginTop: 8,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  addButton: {
    marginHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    gap: 6,
  },
  addButtonText: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
  },
})
