import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { MonthPickerModal } from '../components/MonthPickerModal'
import { SetIncomeModal } from '../components/SetIncomeModal'
import { BudgetOverviewModal } from '../components/budget/BudgetOverviewModal'
import { DashboardBillsCard } from '../components/dashboard/DashboardBillsCard'
import { DashboardBudgetSnapshot } from '../components/dashboard/DashboardBudgetSnapshot'
import { DashboardHero } from '../components/dashboard/DashboardHero'
import { DashboardProfileModal } from '../components/dashboard/DashboardProfileModal'
import { DashboardSummaryCards } from '../components/dashboard/DashboardSummaryCards'
import { DashboardUpcomingPreview } from '../components/dashboard/DashboardUpcomingPreview'
import { useAuth } from '../auth/AuthContext'
import { usePeriod } from '../context/PeriodContext'
import { useScreenPalette } from '../customthemes'
import { dashboardApi, type CategoryWithSpent, type DashboardData } from '../services/dashboardApi'

function fmtKr(n: number) {
  return `KR ${n.toLocaleString('nb-NO')}`
}

function getDaysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

function getDueDateForMonth(baseMonth: Date, dueDayOfMonth: number) {
  const maxDay = getDaysInMonth(baseMonth)
  const clampedDay = Math.min(Math.max(1, dueDayOfMonth), maxDay)
  const date = new Date(baseMonth.getFullYear(), baseMonth.getMonth(), clampedDay)

  return {
    date,
    day: String(clampedDay).padStart(2, '0'),
    month: date
      .toLocaleDateString('en-US', { month: 'short' })
      .toUpperCase()
      .replace('.', ''),
  }
}

type UpcomingPreviewItem = CategoryWithSpent & {
  amount: number
  isDue: boolean
  preview: {
    date: Date
    day: string
    month: string
  }
}

export function HomeScreen() {
  useScreenPalette()
  const navigation = useNavigation<any>()
  const { user, signOut } = useAuth()
  const { selectedMonth, setSelectedMonth } = usePeriod()
  const insets = useSafeAreaInsets()

  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isMonthPickerVisible, setMonthPickerVisible] = useState(false)
  const [isAddExpenseModalOpen, setAddExpenseModalOpen] = useState(false)
  const [isSetIncomeModalOpen, setSetIncomeModalOpen] = useState(false)
  const [budgetModalVisible, setBudgetModalVisible] = useState(false)
  const [profileModalVisible, setProfileModalVisible] = useState(false)

  const [fabOpen, setFabOpen] = useState(false)

  const selectedMonthLabel = selectedMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const loadDashboard = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false

    try {
      if (!silent) {
        setLoading(true)
      }
      setError(null)
      const data = await dashboardApi.get(selectedMonth)
      setDashboard(data)
    } catch (err) {
      console.error('Dashboard load error:', err)
      setError('Failed to load dashboard')
      setDashboard(null)
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [selectedMonth])

  const handleSelectMonth = useCallback(
    async (month: Date) => {
      await setSelectedMonth(month)
      setMonthPickerVisible(false)
    },
    [setSelectedMonth],
  )

  const handleShiftMonth = useCallback(
    async (delta: number) => {
      const nextMonth = new Date(selectedMonth)
      nextMonth.setDate(1)
      nextMonth.setMonth(nextMonth.getMonth() + delta)
      await setSelectedMonth(nextMonth)
    },
    [selectedMonth, setSelectedMonth],
  )

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  useFocusEffect(
    useCallback(() => {
      void loadDashboard({ silent: true })

      const intervalId = setInterval(() => {
        void loadDashboard({ silent: true })
      }, 30000)

      return () => {
        clearInterval(intervalId)
      }
    }, [loadDashboard]),
  )

  const fixedCategories = useMemo(
    () => (dashboard ? dashboard.categories.filter((category) => category.type === 'fixed') : []),
    [dashboard],
  )

  const upcomingCards = useMemo<UpcomingPreviewItem[]>(
    () =>
      fixedCategories
        .filter((item) => item.dueDayOfMonth && item.dueDayOfMonth > 0)
        .map((item) => ({
          ...item,
          preview: getDueDateForMonth(selectedMonth, item.dueDayOfMonth ?? 1),
        }))
        .sort((left, right) => left.preview.date.getTime() - right.preview.date.getTime())
        .slice(0, 5)
        .map((item, index) => ({
          ...item,
          amount: item.allocated,
          isDue: index === 0,
        })),
    [fixedCategories, selectedMonth],
  )

  const handleOpenPlannedExpense = useCallback(
    (item: UpcomingPreviewItem) => {
      navigation.navigate('PlannedExpense', {
        categoryId: item.id,
        title: item.name,
        amount: item.allocated,
        dueDate: item.preview.date.toISOString().split('T')[0],
        category: item.parentName,
        accent: item.iconColor || item.color,
        recurring: true,
      })
    },
    [navigation],
  )

  if (loading) {
    return (
      <View style={s.centerContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0e" />
        <ActivityIndicator size="large" color="rgba(201,168,76,1)" />
      </View>
    )
  }

  if (error || !dashboard) {
    return (
      <View style={s.centerContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0e" />
        <Ionicons name="alert-circle" size={48} color="rgba(201,107,107,0.9)" />
        <Text style={s.errorText}>{error ?? 'Failed to load dashboard'}</Text>
        <TouchableOpacity style={s.retryButton} onPress={() => void loadDashboard()}>
          <Text style={s.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const transferToBills = dashboard.billsTotal ?? 0
  const summaryItems = [
    {
      label: 'Income',
      value: dashboard.totalIncome,
      hint: 'This month',
      icon: 'arrow-up-outline' as const,
      accent: '#5ebd97',
    },
    {
      label: 'Transfer',
      value: transferToBills,
      hint: 'To bills',
      icon: 'swap-horizontal-outline' as const,
      accent: '#c9a84c',
    },
    {
      label: 'Free',
      value: dashboard.freeToAssign,
      hint: 'Pocket money',
      icon: 'sparkles-outline' as const,
      accent: '#5ba3c9',
    },
  ]

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0e" />
      <LinearGradient
        colors={['#0f0e1a', '#0a0a0e', '#0c0f14', '#0a0a0e']}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient colors={['rgba(80,50,120,0.18)', 'transparent']} style={s.bloom} />

      <View style={[s.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={s.headerLeft}>
          <TouchableOpacity activeOpacity={0.88} onPress={() => setProfileModalVisible(true)}>
            <Image
              source={{ uri: `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(user?.displayName || user?.email || 'OrionLedger')}` }}
              style={s.avatar}
            />
          </TouchableOpacity>
          <TouchableOpacity style={s.categoryBtn} onPress={() => setBudgetModalVisible(true)}>
            <Ionicons name="wallet-outline" size={15} color="rgba(201,168,76,0.84)" />
          </TouchableOpacity>
        </View>

        <View style={s.monthPill}>
          <TouchableOpacity onPress={() => handleShiftMonth(-1)} hitSlop={8}>
            <FontAwesome5 name="chevron-left" size={7} color="rgba(255,255,255,0.15)" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMonthPickerVisible(true)} activeOpacity={0.85}>
            <View style={{ alignItems: 'center' }}>
              <Text style={s.overviewLbl}>OVERVIEW</Text>
              <Text style={s.monthTxt}>{selectedMonthLabel}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleShiftMonth(1)} hitSlop={8}>
            <FontAwesome5 name="chevron-right" size={7} color="rgba(255,255,255,0.15)" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.bellBtn}>
          <MaterialCommunityIcons name="bell-outline" size={16} color="rgba(255,255,255,0.25)" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.delay(40).duration(360)}>
          <DashboardHero
            availableNow={dashboard.freeToAssign}
            totalAllocated={dashboard.totalAllocated}
            totalIncome={dashboard.totalIncome}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).duration(360)}>
          <DashboardSummaryCards items={summaryItems} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(160).duration(360)}>
          <DashboardBillsCard
            billsTotal={dashboard.billsTotal ?? 0}
            transferToBills={transferToBills}
            billEntries={dashboard.billEntries ?? []}
            onPressTimeline={() => navigation.navigate('Timeline')}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(220).duration(360)}>
          <DashboardUpcomingPreview
            items={upcomingCards.slice(0, 3)}
            onOpenTimeline={() => navigation.navigate('Timeline')}
            onOpenItem={handleOpenPlannedExpense}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(280).duration(360)}>
          <DashboardBudgetSnapshot
            totalBudget={dashboard.totalBudget}
            budgetAssignments={dashboard.budgetAssignments}
            onOpenBudget={() => setBudgetModalVisible(true)}
          />
        </Animated.View>
      </ScrollView>

      {fabOpen && <TouchableOpacity style={s.fabBackdrop} activeOpacity={1} onPress={() => setFabOpen(false)} />}

      {fabOpen && (
        <View style={[s.fabMenu, { bottom: 92 + Math.max(insets.bottom, 10) }]}>
          <TouchableOpacity
            style={s.fabMenuItem}
            onPress={() => {
              setFabOpen(false)
              setSetIncomeModalOpen(true)
            }}
          >
            <LinearGradient colors={['rgba(94,189,151,0.18)', 'rgba(94,189,151,0.08)']} style={s.fabMenuGrad}>
              <View
                style={[
                  s.fabMenuIcon,
                  { backgroundColor: 'rgba(94,189,151,0.2)', borderColor: 'rgba(94,189,151,0.3)' },
                ]}
              >
                <FontAwesome5 name="arrow-up" size={13} color="rgba(94,189,151,0.9)" />
              </View>
              <Text style={[s.fabMenuTxt, { color: 'rgba(94,189,151,0.9)' }]}>Income</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.fabMenuItem}
            onPress={() => {
              setFabOpen(false)
              setAddExpenseModalOpen(true)
            }}
          >
            <LinearGradient colors={['rgba(91,163,201,0.18)', 'rgba(91,163,201,0.08)']} style={s.fabMenuGrad}>
              <View
                style={[
                  s.fabMenuIcon,
                  { backgroundColor: 'rgba(91,163,201,0.2)', borderColor: 'rgba(91,163,201,0.3)' },
                ]}
              >
                <FontAwesome5 name="arrow-down" size={13} color="rgba(91,163,201,0.9)" />
              </View>
              <Text style={[s.fabMenuTxt, { color: 'rgba(91,163,201,0.9)' }]}>Expense</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      <View style={[s.fabWrap, { bottom: Math.max(insets.bottom, 10) + 68 }]}>
        <TouchableOpacity style={s.fab} onPress={() => setFabOpen(!fabOpen)} activeOpacity={0.92}>
          <LinearGradient
            colors={
              fabOpen
                ? ['rgba(201,107,107,0.9)', 'rgba(160,70,70,0.9)']
                : ['rgba(201,168,76,1)', 'rgba(180,148,56,1)']
            }
            style={s.fabGrad}
          >
            <FontAwesome5 name={fabOpen ? 'times' : 'plus'} size={14} color="#0a0a0e" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <MonthPickerModal
        visible={isMonthPickerVisible}
        selectedMonth={selectedMonth}
        onClose={() => setMonthPickerVisible(false)}
        onSelectMonth={handleSelectMonth}
      />

      {isSetIncomeModalOpen && (
        <SetIncomeModal
          isOpen={isSetIncomeModalOpen}
          mode="income"
          selectedMonth={selectedMonth}
          onClose={() => setSetIncomeModalOpen(false)}
          onEntryCreated={() => {
            setSetIncomeModalOpen(false)
            void loadDashboard()
          }}
        />
      )}

      {dashboard && isAddExpenseModalOpen && (
        <SetIncomeModal
          isOpen={isAddExpenseModalOpen}
          mode="expense"
          categories={dashboard.categories}
          selectedMonth={selectedMonth}
          onClose={() => setAddExpenseModalOpen(false)}
          onEntryCreated={() => {
            setAddExpenseModalOpen(false)
            void loadDashboard()
          }}
        />
      )}

      <BudgetOverviewModal
        visible={budgetModalVisible}
        selectedMonth={selectedMonth}
        totalIncome={dashboard.totalIncome}
        totalBudget={dashboard.totalBudget}
        freeToAssign={dashboard.freeToAssign}
        categories={dashboard.categories}
        budgetAssignments={dashboard.budgetAssignments}
        onClose={() => setBudgetModalVisible(false)}
        onBudgetChanged={() => {
          void loadDashboard()
        }}
      />

      <DashboardProfileModal
        visible={profileModalVisible}
        displayName={user?.displayName || 'Profile'}
        email={user?.email || 'Signed in'}
        avatarSeed={user?.displayName || user?.email || 'OrionLedger'}
        onOpenSettings={() => {
          setProfileModalVisible(false)
          navigation.navigate('SettingsDetail')
        }}
        onClose={() => setProfileModalVisible(false)}
        onSignOut={() => {
          setProfileModalVisible(false)
          void signOut()
        }}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0e' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0e' },
  bloom: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
  },
  errorText: { color: 'rgba(255,255,255,0.8)', fontSize: 15, marginTop: 12 },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(201,168,76,0.95)',
  },
  retryText: { color: '#0a0a0e', fontSize: 14, fontWeight: '700' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16, opacity: 0.85 },
  categoryBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  overviewLbl: { color: 'rgba(255,255,255,0.2)', fontSize: 6, letterSpacing: 2 },
  monthTxt: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  bellBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingBottom: 178 },
  fabBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  fabWrap: { position: 'absolute', right: 10, zIndex: 20 },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
  },
  fabGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  fabMenu: { position: 'absolute', right: 6, gap: 10, zIndex: 30 },
  fabMenuItem: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    width: 150,
  },
  fabMenuGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  fabMenuIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabMenuTxt: { fontSize: 14, fontWeight: '700' },
})
