import React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

import type { FinancialAccount } from './types'
import { accountTypeOptions } from './accountTypes'

type Props = {
  account: FinancialAccount
  onPress?: () => void
}

const formatAmount = (value: number) => {
  const prefix = value < 0 ? '-' : ''
  return `${prefix}$${Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function BalanceAccountCard({ account, onPress }: Props) {
  const accountType = accountTypeOptions.find((option) => option.id === account.accountType)
  const usedCredit = account.mode === 'credit' ? Math.abs(account.amount) : 0
  const creditLimit = account.creditLimit ?? 0
  const availableCredit = Math.max(creditLimit - usedCredit, 0)
  const utilization = creditLimit > 0 ? Math.min(usedCredit / creditLimit, 1) : 0
  const remainingPercent = 1 - utilization

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.88} onPress={onPress}>
      {account.mode === 'credit' ? (
        <>
          <View style={styles.primaryRow}>
            <View style={styles.identityRow}>
              {account.icon?.imageUrl ? (
                <Image source={{ uri: account.icon.imageUrl }} style={styles.avatar} />
              ) : (
                <View
                  style={[
                    styles.iconWrap,
                    {
                      backgroundColor: accountType?.iconBackground ?? 'rgba(109,178,255,0.16)',
                    },
                  ]}
                >
                  <Ionicons
                    name={accountType?.iconName ?? 'card-outline'}
                    size={18}
                    color={accountType?.iconColor ?? '#6DB2FF'}
                  />
                </View>
              )}

              <View style={styles.body}>
                <Text style={styles.title}>{account.name || 'Untitled account'}</Text>
                <Text style={styles.subtitle}>
                  {account.notes?.trim() ? account.notes : accountType?.label ?? 'Credit account'}
                </Text>
              </View>
            </View>

            <Text style={[styles.amount, styles.amountPositive]}>{formatAmount(availableCredit)}</Text>
          </View>

          <View style={styles.creditMetaRow}>
            <Text style={styles.creditMetaText}>{`${formatAmount(creditLimit)} limit`}</Text>
            <Text style={styles.creditMetaText}>{`used ${formatAmount(usedCredit)}`}</Text>
          </View>

          <View style={styles.progressTrack}>
            <LinearGradient
              colors={['rgba(190,84,255,0.95)', 'rgba(129,75,255,0.88)']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.progressFill, { width: `${Math.max(remainingPercent, 0.04) * 100}%` }]}
            />
          </View>
        </>
      ) : (
        <View style={styles.primaryRow}>
          <View style={styles.identityRow}>
            {account.icon?.imageUrl ? (
              <Image source={{ uri: account.icon.imageUrl }} style={styles.avatar} />
            ) : (
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: accountType?.iconBackground ?? 'rgba(109,178,255,0.16)',
                  },
                ]}
              >
                <Ionicons
                  name={accountType?.iconName ?? 'wallet-outline'}
                  size={18}
                  color={accountType?.iconColor ?? '#6DB2FF'}
                />
              </View>
            )}

            <View style={styles.body}>
              <Text style={styles.title}>{account.name || 'Untitled account'}</Text>
              <Text style={styles.subtitle}>
                {account.notes?.trim() ? account.notes : accountType?.label ?? 'Account'}
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.amount,
              account.amount < 0 ? styles.amountNegative : styles.amountPositive,
            ]}
          >
            {formatAmount(account.amount)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    minHeight: 68,
    borderRadius: 18,
    backgroundColor: 'rgba(23,27,38,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  title: {
    color: '#F5F8FD',
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
  subtitle: {
    marginTop: 2,
    color: 'rgba(245,248,253,0.42)',
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
  },
  amount: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
  },
  amountPositive: {
    color: '#5CC487',
  },
  amountNegative: {
    color: '#FF7C78',
  },
  creditMetaRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  creditMetaText: {
    color: 'rgba(245,248,253,0.48)',
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
  },
  progressTrack: {
    marginTop: 8,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.09)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
})
