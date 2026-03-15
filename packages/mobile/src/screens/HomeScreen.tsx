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
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { MonthPickerModal } from '../components/MonthPickerModal'
import { SetIncomeModal } from '../components/SetIncomeModal'
import { BudgetOverviewModal } from '../components/budget/BudgetOverviewModal'
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

export function HomeScreen() {
  useScreenPalette()
  const navigation = useNavigation<any>()
  const { selectedMonth, setSelectedMonth } = usePeriod()
  const insets = useSafeAreaInsets()

  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isMonthPickerVisible, setMonthPickerVisible] = useState(false)
  const [isAddExpenseModalOpen, setAddExpenseModalOpen] = useState(false)
  const [isSetIncomeModalOpen, setSetIncomeModalOpen] = useState(false)
  const [budgetModalVisible, setBudgetModalVisible] = useState(false)

  const [costsExpanded, setCostsExpanded] = useState(true)
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

  const budgetCategories = useMemo(
    () => (dashboard ? dashboard.categories.filter((category) => category.type === 'budget') : []),
    [dashboard],
  )

  const allocPct = useMemo(
    () =>
      dashboard && dashboard.totalIncome > 0
        ? Math.round((dashboard.totalAllocated / dashboard.totalIncome) * 100)
        : 0,
    [dashboard],
  )

  const upcomingCards = useMemo(
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
          isDue: index === 0,
        })),
    [fixedCategories, selectedMonth],
  )

  const handleOpenPlannedExpense = useCallback(
    (item: CategoryWithSpent & { preview: { date: Date } }) => {
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

  const fixedCostsTotal = dashboard.fixedCostsTotal

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
          <Image source={{ uri: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' }} style={s.avatar} />
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
        <View style={s.hero}>
          <Text style={s.heroLbl}>AVAILABLE NOW</Text>
          <Text style={s.heroAmt}>{fmtKr(dashboard.freeToAssign)}</Text>
          <View style={s.barTrack}>
            <LinearGradient
              colors={['rgba(94,189,151,0.7)', 'rgba(201,168,76,0.7)', 'rgba(212,135,74,0.5)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[s.barFill, { width: `${Math.min(allocPct, 100)}%` }]}
            />
          </View>
          <View style={s.barMeta}>
            <Text style={s.barMetaTxt}>{fmtKr(dashboard.totalAllocated)} allocated</Text>
            <Text style={s.barMetaTxt}>{allocPct}% of {fmtKr(dashboard.totalIncome)}</Text>
          </View>
        </View>

        <View style={s.statStrip}>
          <View style={s.statItem}>
            <Text style={s.statVal}>{dashboard.totalIncome.toLocaleString('nb-NO')}</Text>
            <Text style={[s.statLbl, { color: 'rgba(94,189,151,0.7)' }]}>INCOME</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statVal}>{dashboard.totalAllocated.toLocaleString('nb-NO')}</Text>
            <Text style={[s.statLbl, { color: 'rgba(201,168,76,0.7)' }]}>ALLOCATED</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statVal}>{dashboard.freeToAssign.toLocaleString('nb-NO')}</Text>
            <Text style={[s.statLbl, { color: 'rgba(91,163,201,0.7)' }]}>FREE</Text>
          </View>
        </View>

        <View style={s.section}>
          <View style={s.sectionHdr}>
            <TouchableOpacity onPress={() => navigation.navigate('Timeline')} activeOpacity={0.8}>
              <Text style={s.sectionTitle}>Upcoming</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Timeline')}>
              <Text style={s.seeAll}>See Timeline</Text>
            </TouchableOpacity>
          </View>

          {upcomingCards.length === 0 ? (
            <View style={s.emptyCard}>
              <Text style={s.emptyTitle}>No upcoming expenses</Text>
              <Text style={s.emptySub}>Set a due day on fixed costs to populate this section.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hScroll}>
              {upcomingCards.map((item) => {
                const isDue = item.isDue
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={s.billCard}
                    onPress={() => handleOpenPlannedExpense(item)}
                    activeOpacity={0.84}
                  >
                    <LinearGradient
                      colors={
                        isDue
                          ? ['rgba(212,135,74,0.12)', 'rgba(212,135,74,0.04)']
                          : ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.01)']
                      }
                      style={s.billCardGrad}
                    >
                      <View
                        style={[
                          s.dateCircle,
                          {
                            backgroundColor: isDue ? 'rgba(212,135,74,0.12)' : 'rgba(91,163,201,0.08)',
                            borderColor: isDue ? 'rgba(212,135,74,0.25)' : 'rgba(91,163,201,0.18)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            s.dateDay,
                            { color: isDue ? 'rgba(212,135,74,0.9)' : 'rgba(91,163,201,0.8)' },
                          ]}
                        >
                          {item.preview.day}
                        </Text>
                        <Text style={s.dateMon}>{item.preview.month}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.billAmt}>{fmtKr(item.allocated)}</Text>
                        <Text style={s.billLbl} numberOfLines={1}>
                          {item.name}
                        </Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          )}
        </View>

        <View style={s.listCard}>
          <LinearGradient colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.015)']} style={s.listCardGrad}>
            <TouchableOpacity style={s.listHdr} onPress={() => setCostsExpanded(!costsExpanded)}>
              <View style={s.listHdrRow}>
                <View style={[s.dot, { backgroundColor: 'rgba(212,135,74,0.7)' }]} />
                <Text style={s.listTitle}>Fixed Costs</Text>
                <FontAwesome5
                  name={costsExpanded ? 'chevron-up' : 'chevron-down'}
                  size={9}
                  color="rgba(255,255,255,0.25)"
                />
              </View>
              <Text style={s.listTotal}>{fmtKr(fixedCostsTotal)}</Text>
            </TouchableOpacity>
            {costsExpanded &&
              fixedCategories.map((item, index) => (
                <View
                  key={item.id}
                  style={[s.row, index < fixedCategories.length - 1 && s.rowBorder]}
                >
                  <View style={s.rowLeft}>
                    <View style={[s.dotMini, { backgroundColor: 'rgba(255,255,255,0.12)' }]} />
                    <Text style={s.rowLbl}>{item.name}</Text>
                  </View>
                  <Text style={s.rowAmt}>{item.allocated === 0 ? '---' : fmtKr(item.allocated)}</Text>
                </View>
              ))}
            {!costsExpanded && (
              <Text style={s.collapsedHint}>{fixedCategories.length} items - {fmtKr(fixedCostsTotal)}</Text>
            )}
          </LinearGradient>
        </View>
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
  hero: { alignItems: 'center', paddingTop: 40, paddingBottom: 32 },
  heroLbl: { color: 'rgba(255,255,255,0.22)', fontSize: 8, letterSpacing: 3, marginBottom: 12 },
  heroAmt: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 22,
  },
  barTrack: {
    width: '52%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: { height: '100%', borderRadius: 2 },
  barMeta: { flexDirection: 'row', justifyContent: 'space-between', width: '52%' },
  barMetaTxt: { color: 'rgba(255,255,255,0.2)', fontSize: 8, letterSpacing: 0.5 },
  statStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 32,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingVertical: 14,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700' },
  statLbl: { fontSize: 7, letterSpacing: 1.5, marginTop: 3 },
  statDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.06)' },
  section: { marginBottom: 24 },
  sectionHdr: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: { color: 'rgba(255,255,255,0.75)', fontSize: 15, fontWeight: '700' },
  seeAll: { color: 'rgba(201,168,76,0.7)', fontSize: 11, fontWeight: '600' },
  hScroll: { paddingHorizontal: 20, gap: 10 },
  billCard: {
    width: 158,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  billCardGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDay: { fontSize: 14, fontWeight: '900' },
  dateMon: { color: 'rgba(255,255,255,0.2)', fontSize: 7, fontWeight: '700', marginTop: -1 },
  billAmt: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '800' },
  billLbl: { color: 'rgba(255,255,255,0.3)', fontSize: 9, marginTop: 2 },
  emptyCard: {
    marginHorizontal: 20,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  emptyTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '700', marginBottom: 6 },
  emptySub: { color: 'rgba(255,255,255,0.3)', fontSize: 13 },
  listCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  listCardGrad: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  listHdr: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  listHdrRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  listTitle: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '700' },
  listTotal: { color: 'rgba(212,135,74,0.8)', fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dotMini: { width: 3, height: 3, borderRadius: 1.5 },
  rowLbl: { color: 'rgba(255,255,255,0.35)', fontSize: 11 },
  rowAmt: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '600' },
  collapsedHint: { color: 'rgba(255,255,255,0.2)', fontSize: 10, textAlign: 'center', paddingBottom: 8 },
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
