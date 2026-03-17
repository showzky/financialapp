import React, { useMemo, useState } from 'react'
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import type { AccountActivity, FinancialAccount } from './types'
import { accountTypeOptions } from './accountTypes'
import { AdjustBalanceModal } from './AdjustBalanceModal'
import { AccountActivityList } from './AccountActivityList'

type Props = {
  visible: boolean
  account: FinancialAccount | null
  activities: AccountActivity[]
  onClose: () => void
  onEdit: (account: FinancialAccount) => void
  onUpdateBalance: (accountId: string, nextAmount: number) => void | Promise<void>
  onRemove: (accountId: string) => void | Promise<void>
}

const formatCurrency = (value: number) =>
  `$${Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

export function AccountDetailModal({
  visible,
  account,
  activities,
  onClose,
  onEdit,
  onUpdateBalance,
  onRemove,
}: Props) {
  const [menuVisible, setMenuVisible] = useState(false)
  const [adjustVisible, setAdjustVisible] = useState(false)

  const accountType = useMemo(
    () => accountTypeOptions.find((option) => option.id === account?.accountType),
    [account],
  )

  if (!account) return null

  const isCredit = account.mode === 'credit'
  const usedCredit = isCredit ? Math.abs(account.amount) : 0
  const limit = account.creditLimit ?? 0
  const availableCredit = Math.max(limit - usedCredit, 0)

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.root}>
          <LinearGradient
            colors={['#13111C', '#0A0A0E', '#0D1017', '#0A0A0E']}
            locations={[0, 0.28, 0.64, 1]}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(103,74,173,0.34)', 'rgba(57,96,178,0.12)', 'transparent']}
            locations={[0, 0.42, 1]}
            style={styles.heroGlow}
          />

          <View style={styles.header}>
            <TouchableOpacity style={styles.headerIcon} activeOpacity={0.85} onPress={onClose}>
              <Ionicons name="arrow-back" size={18} color="rgba(245,248,253,0.82)" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{account.name}</Text>
            <TouchableOpacity
              style={styles.headerIcon}
              activeOpacity={0.85}
              onPress={() => setMenuVisible((current) => !current)}
            >
              <Ionicons name="ellipsis-vertical" size={18} color="rgba(245,248,253,0.82)" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.summaryRow}>
              <View style={styles.balanceCard}>
                <View style={styles.balanceCardHeader}>
                  <View style={styles.identityRow}>
                    {account.icon?.imageUrl ? (
                      <Image source={{ uri: account.icon.imageUrl }} style={styles.avatar} />
                    ) : (
                      <View
                        style={[
                          styles.iconWrap,
                          { backgroundColor: accountType?.iconBackground ?? 'rgba(109,178,255,0.16)' },
                        ]}
                      >
                        <Ionicons
                          name={accountType?.iconName ?? 'wallet-outline'}
                          size={16}
                          color={accountType?.iconColor ?? '#6DB2FF'}
                        />
                      </View>
                    )}
                    <View>
                      <Text style={styles.balanceLabel}>Account balance</Text>
                      <Text style={styles.balanceValue}>{formatCurrency(Math.abs(account.amount))}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.pencilButton}
                    activeOpacity={0.85}
                    onPress={() => setAdjustVisible(true)}
                  >
                    <Ionicons name="pencil" size={14} color="rgba(245,248,253,0.72)" />
                  </TouchableOpacity>
                </View>
              </View>

              {isCredit ? (
                <View style={styles.balanceCardSecondary}>
                  <Text style={styles.balanceLabel}>Available balance</Text>
                  <Text style={styles.balanceValue}>{formatCurrency(availableCredit)}</Text>
                </View>
              ) : null}
            </View>

            <AccountActivityList activities={activities} />
          </View>

          {menuVisible ? (
            <View style={styles.menu}>
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.85}
                onPress={() => {
                  setMenuVisible(false)
                  onEdit(account)
                }}
              >
                <Ionicons name="pencil" size={16} color="#F5F8FD" />
                <Text style={styles.menuText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} activeOpacity={0.85}>
                <Ionicons name="analytics-outline" size={16} color="#F5F8FD" />
                <Text style={styles.menuText}>Analytics</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} activeOpacity={0.85}>
                <Ionicons name="share-outline" size={16} color="#F5F8FD" />
                <Text style={styles.menuText}>Data export</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.footer}>
            <TouchableOpacity activeOpacity={0.9} onPress={onClose}>
              <LinearGradient colors={['#6DB2FF', '#4C89E8']} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>OK</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removeButton}
              activeOpacity={0.85}
              onPress={() => {
                onRemove(account.id)
                onClose()
              }}
            >
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <AdjustBalanceModal
        visible={adjustVisible}
        mode={account.mode}
        value={account.amount}
        onClose={() => setAdjustVisible(false)}
        onSave={(nextValue) => {
          onUpdateBalance(account.id, account.mode === 'credit' ? -Math.abs(nextValue) : nextValue)
        }}
      />
    </>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A0E',
  },
  heroGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
  },
  header: {
    paddingTop: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#F5F8FD',
    fontSize: 22,
    fontFamily: 'DMSans_700Bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  balanceCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: 'rgba(24,28,39,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 14,
  },
  balanceCardSecondary: {
    minWidth: 132,
    borderRadius: 18,
    backgroundColor: 'rgba(24,28,39,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 14,
    justifyContent: 'center',
  },
  balanceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  identityRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceLabel: {
    color: 'rgba(245,248,253,0.46)',
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
  },
  balanceValue: {
    marginTop: 4,
    color: '#F5F8FD',
    fontSize: 24,
    fontFamily: 'DMSans_700Bold',
  },
  pencilButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  menu: {
    position: 'absolute',
    top: 62,
    right: 16,
    width: 170,
    borderRadius: 18,
    backgroundColor: '#1B202B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 8,
  },
  menuItem: {
    minHeight: 42,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuText: {
    color: '#F5F8FD',
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    gap: 8,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#F8FBFF',
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
  },
  removeButton: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: '#F26F75',
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
  },
})
