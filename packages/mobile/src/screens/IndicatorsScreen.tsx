// @ts-nocheck
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

interface Subscription {
  id: string
  name: string
  cost: number
  frequency: 'monthly' | 'yearly' | 'weekly' | 'daily'
  isActive: boolean
  nextBillingDate: string
}

export function IndicatorsScreen() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock subscriptions data - in production, fetch from API
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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Subscriptions</Text>
      </View>

      {/* Monthly Overview */}
      <View style={styles.overviewCard}>
        <View style={styles.overviewItem}>
          <View style={styles.iconContainer}>
            <Ionicons name="calendar" size={24} color="#10b981" />
          </View>
          <View>
            <Text style={styles.overviewLabel}>Monthly Cost</Text>
            <Text style={styles.overviewAmount}>NOK {monthlyTotal.toLocaleString()}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.overviewItem}>
          <View style={styles.iconContainer}>
            <Ionicons name="trending-up" size={24} color="#f59e0b" />
          </View>
          <View>
            <Text style={styles.overviewLabel}>Annual Cost</Text>
            <Text style={styles.overviewAmount}>
              NOK {((monthlyTotal + yearlyBreakdown) * 12).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Active Subscriptions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Subscriptions</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {subscriptions.filter((s) => s.isActive).length}
            </Text>
          </View>
        </View>

        {subscriptions.filter((s) => s.isActive).length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No active subscriptions</Text>
          </View>
        ) : (
          <FlatList
            scrollEnabled={false}
            data={subscriptions.filter((s) => s.isActive)}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.subscriptionCard}>
                <View style={styles.subHeader}>
                  <Text style={styles.subName}>{item.name}</Text>
                  <View style={styles.activeBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.activeText}>Active</Text>
                  </View>
                </View>

                <View style={styles.subDetails}>
                  <View style={styles.subDetail}>
                    <Text style={styles.detailLabel}>Cost</Text>
                    <Text style={styles.detailValue}>NOK {item.cost.toLocaleString()}</Text>
                  </View>
                  <View style={styles.subDetail}>
                    <Text style={styles.detailLabel}>Frequency</Text>
                    <Text style={styles.detailValue}>
                      {item.frequency.charAt(0).toUpperCase() + item.frequency.slice(1)}
                    </Text>
                  </View>
                  <View style={styles.subDetail}>
                    <Text style={styles.detailLabel}>Next Billing</Text>
                    <Text style={styles.detailValue}>{item.nextBillingDate}</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionText}>Manage</Text>
                  <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* Financial Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial Impact</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryBoxLabel}>This Month</Text>
            <Text style={styles.summaryBoxValue}>NOK {monthlyTotal.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryBoxLabel}>This Year</Text>
            <Text style={styles.summaryBoxValue}>
              NOK {((monthlyTotal + yearlyBreakdown) * 12).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Add Subscription Button */}
      <TouchableOpacity style={styles.addButton}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.addButtonText}>Add Subscription</Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  overviewCard: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
  },
  overviewLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  overviewAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
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
    fontWeight: '700',
    color: '#111827',
  },
  badge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  subscriptionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 4,
  },
  subDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  subDetail: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginRight: 4,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  summaryBoxLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  summaryBoxValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  addButton: {
    marginHorizontal: 16,
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 16,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
})
