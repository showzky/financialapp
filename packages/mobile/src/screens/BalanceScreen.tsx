import React, { useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuth } from '../auth/AuthContext'
import { useScreenPalette } from '../customthemes'
import { AddAccountModal } from '../components/balance/AddAccountModal'
import { AccountDetailModal } from '../components/balance/AccountDetailModal'
import { BalanceCategorySection } from '../components/balance/BalanceCategorySection'
import { BalanceDonutChart } from '../components/balance/BalanceDonutChart'
import { CreateAccountCategoryModal } from '../components/balance/CreateAccountCategoryModal'
import { BalanceEmptyState } from '../components/balance/BalanceEmptyState'
import type { AccountActivity, BalanceCategory, FinancialAccount } from '../components/balance/types'
import { financialAccountApi } from '../services/financialAccountApi'

export function BalanceScreen() {
  useScreenPalette()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const [addAccountVisible, setAddAccountVisible] = useState(false)
  const [createCategoryVisible, setCreateCategoryVisible] = useState(false)
  const [editAccountVisible, setEditAccountVisible] = useState(false)
  const [categories, setCategories] = useState<BalanceCategory[]>([])
  const [accounts, setAccounts] = useState<FinancialAccount[]>([])
  const [activities, setActivities] = useState<AccountActivity[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [hiddenFromChartIds, setHiddenFromChartIds] = useState<Set<string>>(new Set())

  const chartAccounts = useMemo(
    () => accounts.filter((account) => !hiddenFromChartIds.has(account.categoryId)),
    [accounts, hiddenFromChartIds],
  )

  const toggleCategoryInChart = useCallback((categoryId: string, visible: boolean) => {
    setHiddenFromChartIds((prev) => {
      const next = new Set(prev)
      if (visible) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }, [])

  const avatarSeed = user?.displayName || user?.email || 'OrionLedger'
  const categoryNames = categories.map((category) => category.name)
  const hasAccounts = accounts.length > 0
  const selectedAccount = accounts.find((account) => account.id === selectedAccountId) ?? null
  const selectedAccountActivities = activities

  const loadBalanceData = useCallback(async () => {
    try {
      setLoading(true)
      const [nextCategories, nextAccounts] = await Promise.all([
        financialAccountApi.listCategories(),
        financialAccountApi.listAccounts(),
      ])
      setCategories(nextCategories)
      setAccounts(nextAccounts)
    } catch (err) {
      console.error('Balance load error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadAccountActivity = useCallback(async (accountId: string | null) => {
    if (!accountId) {
      setActivities([])
      return
    }

    try {
      const nextActivity = await financialAccountApi.listActivity(accountId)
      setActivities(nextActivity)
    } catch (err) {
      console.error('Account activity load error:', err)
      setActivities([])
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void loadBalanceData()
    }, [loadBalanceData]),
  )

  useFocusEffect(
    useCallback(() => {
      void loadAccountActivity(selectedAccountId)
    }, [loadAccountActivity, selectedAccountId]),
  )

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0e" />
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

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <View style={styles.headerLeft}>
          <Image
            source={{ uri: `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(avatarSeed)}` }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.eyebrow}>VAULT LAYER</Text>
            <Text style={styles.title}>Balance</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.88}
          onPress={() => setAddAccountVisible(true)}
        >
          <Ionicons name="add" size={16} color="rgba(241,244,255,0.88)" />
          <Text style={styles.addButtonText}>Add Account</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {!loading && hasAccounts ? (
          <BalanceDonutChart accounts={chartAccounts} />
        ) : null}

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#6DB2FF" />
          </View>
        ) : null}

        {!loading && (hasAccounts || categories.length > 0) ? (
          <Animated.View entering={FadeInUp.delay(60).duration(380)}>
            {categories.map((category) => (
              <BalanceCategorySection
                key={category.id}
                category={category}
                accounts={accounts.filter((account) => account.categoryId === category.id)}
                showInChart={!hiddenFromChartIds.has(category.id)}
                onToggleShowInChart={(val) => toggleCategoryInChart(category.id, val)}
                onPressAccount={(account) => setSelectedAccountId(account.id)}
                onRenameCategory={async (newName) => {
                  const updated = await financialAccountApi.renameCategory(category.id, newName)
                  setCategories((prev) =>
                    prev.map((c) => (c.id === updated.id ? updated : c)),
                  )
                }}
                onMoveCategoryToBottom={async () => {
                  await financialAccountApi.moveCategoryToBottom(category.id)
                  void loadBalanceData()
                }}
              />
            ))}

            {hasAccounts ? (
              <TouchableOpacity
                style={styles.addCategoryButton}
                activeOpacity={0.88}
                onPress={() => setCreateCategoryVisible(true)}
              >
                <Text style={styles.addCategoryText}>Add category</Text>
              </TouchableOpacity>
            ) : null}
          </Animated.View>
        ) : !loading ? (
          <Animated.View entering={FadeInUp.delay(60).duration(380)}>
            <BalanceEmptyState onAddAccount={() => setAddAccountVisible(true)} />
          </Animated.View>
        ) : null}
      </ScrollView>

      <AddAccountModal
        visible={addAccountVisible}
        categories={categoryNames}
        onClose={() => setAddAccountVisible(false)}
        onCreateAccount={async (draft) => {
          const category = categories.find(
            (item) => item.name.toLowerCase() === draft.category.trim().toLowerCase(),
          )
          if (!category) return

          const created = await financialAccountApi.createAccount({
            categoryId: category.id,
            name: draft.name,
            mode: draft.mode,
            amount: draft.amount,
            creditLimit: draft.creditLimit,
            paymentDayOfMonth: draft.paymentDayOfMonth,
            reminder: draft.reminder,
            icon: draft.icon,
            accountType: draft.accountType,
            color: draft.color,
            notes: draft.notes,
          })
          setAccounts((current) => [...current, created])
        }}
      />

      <AddAccountModal
        visible={editAccountVisible}
        categories={categoryNames}
        initialAccount={selectedAccount}
        title="Edit account"
        submitLabel="Save"
        onClose={() => setEditAccountVisible(false)}
        onCreateAccount={async (draft) => {
          if (!selectedAccount) return
          const category = categories.find(
            (item) => item.name.toLowerCase() === draft.category.trim().toLowerCase(),
          )
          if (!category) return

          const updated = await financialAccountApi.updateAccount(selectedAccount.id, {
            categoryId: category.id,
            name: draft.name,
            mode: draft.mode,
            amount: draft.amount,
            creditLimit: draft.creditLimit,
            paymentDayOfMonth: draft.paymentDayOfMonth,
            reminder: draft.reminder,
            icon: draft.icon,
            accountType: draft.accountType,
            color: draft.color,
            notes: draft.notes,
          })
          setAccounts((current) =>
            current.map((account) =>
              account.id === selectedAccount.id
                ? updated
                : account,
            ),
          )
        }}
      />

      <CreateAccountCategoryModal
        visible={createCategoryVisible}
        onClose={() => setCreateCategoryVisible(false)}
        onCreate={async (name) => {
          const created = await financialAccountApi.createCategory(name)
          setCategories((current) => [...current, created])
        }}
      />

      <AccountDetailModal
        visible={selectedAccount !== null && !editAccountVisible}
        account={selectedAccount}
        onClose={() => setSelectedAccountId(null)}
        onEdit={(account) => {
          setSelectedAccountId(account.id)
          setEditAccountVisible(true)
        }}
        activities={selectedAccountActivities}
        onUpdateBalance={async (accountId, nextAmount) => {
          const updated = await financialAccountApi.adjustBalance(accountId, nextAmount)
          setAccounts((current) =>
            current.map((account) => (account.id === accountId ? updated : account)),
          )
          await loadAccountActivity(accountId)
        }}
        onRemove={async (accountId) => {
          await financialAccountApi.deleteAccount(accountId)
          setAccounts((current) => current.filter((account) => account.id !== accountId))
          setSelectedAccountId(null)
        }}
      />
    </View>
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
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    opacity: 0.92,
  },
  eyebrow: {
    color: 'rgba(190,201,224,0.28)',
    fontSize: 9,
    letterSpacing: 1.8,
    fontFamily: 'DMSans_600SemiBold',
  },
  title: {
    color: '#F4F6FB',
    fontSize: 24,
    fontFamily: 'DMSerifDisplay_400Regular',
    marginTop: 1,
  },
  addButton: {
    minHeight: 42,
    borderRadius: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  addButtonText: {
    color: 'rgba(241,244,255,0.82)',
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 150,
  },
  loadingWrap: {
    paddingTop: 48,
    paddingBottom: 24,
  },
  addCategoryButton: {
    alignSelf: 'center',
    minHeight: 44,
    borderRadius: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5D9DFF',
    marginTop: 4,
  },
  addCategoryText: {
    color: '#F8FBFF',
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
  },
})
