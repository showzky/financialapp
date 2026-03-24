import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import type { AccountActivity } from './types'

type Props = {
  activities: AccountActivity[]
}

const formatCurrency = (value: number) => {
  const prefix = value < 0 ? '-' : ''
  return `${prefix}kr ${Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

export function AccountActivityList({ activities }: Props) {
  if (activities.length === 0) {
    return <Text style={styles.empty}>no transactions</Text>
  }

  return (
    <View style={styles.list}>
      {activities.map((activity) => (
        <View key={activity.id} style={styles.row}>
          <View style={styles.left}>
            <View style={styles.iconWrap}>
              {activity.type === 'balance_adjustment' ? (
                <Ionicons name="settings-outline" size={16} color="rgba(245,248,253,0.68)" />
              ) : activity.type === 'income' ? (
                <Ionicons name="trending-up-outline" size={16} color="#72d39f" />
              ) : (
                <Ionicons name="receipt-outline" size={16} color="rgba(245,248,253,0.68)" />
              )}
            </View>
            <View>
              <Text style={styles.title}>{activity.title}</Text>
              <View style={styles.subtitleRow}>
                {activity.type !== 'balance_adjustment' ? (
                  <MaterialCommunityIcons
                    name={activity.isPaid ? 'check-circle' : 'circle-outline'}
                    size={12}
                    color={activity.isPaid ? '#72d39f' : 'rgba(245,248,253,0.34)'}
                  />
                ) : null}
                <Text style={styles.subtitle}>
                  {activity.subtitle ? `${activity.subtitle} · ` : ''}
                  {formatDate(activity.createdAt)}
                </Text>
              </View>
            </View>
          </View>
          <Text
            style={[
              styles.amount,
              activity.amount < 0 ? styles.amountNegative : styles.amountPositive,
            ]}
          >
            {formatCurrency(activity.amount)}
          </Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  list: {
    marginTop: 28,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#F5F8FD',
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
  },
  subtitle: {
    color: 'rgba(245,248,253,0.38)',
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
  },
  subtitleRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amount: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
  },
  amountPositive: {
    color: '#5CC487',
  },
  amountNegative: {
    color: '#F26F75',
  },
  empty: {
    marginTop: 32,
    color: 'rgba(245,248,253,0.24)',
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
  },
})
