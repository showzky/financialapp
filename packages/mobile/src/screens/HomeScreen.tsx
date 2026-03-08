// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { dashboardApi, type DashboardData, type CategoryWithSpent } from '../services/dashboardApi'
import { useCustomTheme } from '../customthemes'
import { usePeriod } from '../context/PeriodContext'
import { MonthPickerModal } from '../components/MonthPickerModal'
import { CategoryCard } from '../components/CategoryCard'
import { CategoryAccordionSection } from '../components/CategoryAccordionSection'
import { CategoryDetailModal } from '../components/CategoryDetailModal'
import { AddExpenseModal } from '../components/AddExpenseModal'
import { SetIncomeModal } from '../components/SetIncomeModal' // ADDED THIS
import { ScreenHero } from '../components/ScreenHero'
import { screenThemes } from '../theme/screenThemes'
import { inferEssentialBucket, inferPocketMoneyRole } from '../utils/pocketMoney'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

type PocketBucketKey = 'bills' | 'food' | 'fuel' | 'savings' | 'pocket' | 'other'

export function HomeScreen() {
  const theme = screenThemes.home
  const {
    activeTheme,
    resolvedThemeId,
    source,
    clearManualTheme,
    cycleTheme,
  } = useCustomTheme()
  const { selectedMonth, setSelectedMonth } = usePeriod()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMonthPickerVisible, setMonthPickerVisible] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithSpent | null>(null)
  const [isAddExpenseModalOpen, setAddExpenseModalOpen] = useState(false)
  const [isSetIncomeModalOpen, setSetIncomeModalOpen] = useState(false) // ADDED THIS
  const [expandedCategoryGroup, setExpandedCategoryGroup] = useState<'fixed' | 'budget' | null>('fixed')
  const hasInitializedCategoryAccordion = useRef(false)

  const selectedMonthLabel = selectedMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
  const selectedMonthName = selectedMonth.toLocaleDateString('en-US', {
    month: 'long',
  })

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await dashboardApi.get(selectedMonth)
      setDashboard(data)
    } catch (err) {
      console.error('Dashboard load error:', err)
      setError('Failed to load dashboard')
      setDashboard(null)
    } finally {
      setLoading(false)
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

  const groupedCategories = useMemo(() => {
    if (!dashboard) return []

    const groupConfigs = {
      fixed: {
        title: 'Fixed Costs',
        description: 'recurring essentials',
        accentColor: '#d97706',
      },
      budget: {
        title: 'Budget',
        description: 'flexible spending',
        accentColor: '#8b5cf6',
      },
    }

    return (['fixed', 'budget'] as const)
      .map((groupKey) => {
        const items = dashboard.categories.filter((category) => category.type === groupKey)
        const totalAllocated = items.reduce((sum, item) => sum + item.allocated, 0)
        const previewNames = items.slice(0, 2).map((item) => item.name)
        if (items.length > 2) {
          previewNames.push(`+${items.length - 2} more`)
        }

        return {
          key: groupKey,
          items,
          itemCount: items.length,
          totalAllocated,
          previewNames,
          ...groupConfigs[groupKey],
        }
      })
      .filter((group) => group.itemCount > 0)
  }, [dashboard])

  const pocketMoneySummary = useMemo(() => {
    if (!dashboard) return null

    const buckets: Record<PocketBucketKey, number> = {
      bills: 0,
      food: 0,
      fuel: 0,
      savings: 0,
      pocket: 0,
      other: 0,
    }

    for (const category of dashboard.categories) {
      const role = inferPocketMoneyRole(category)
      const bucket =
        role === 'essential'
          ? inferEssentialBucket(category.name)
          : role
      buckets[bucket] += category.allocated
    }

    const committedTotal =
      buckets.bills + buckets.food + buckets.fuel + buckets.savings + buckets.other
    const pocketMoneyLeft = dashboard.totalIncome - committedTotal

    return {
      ...buckets,
      committedTotal,
      pocketMoneyLeft,
    }
  }, [dashboard])

  useEffect(() => {
    if (groupedCategories.length === 0) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      setExpandedCategoryGroup(null)
      hasInitializedCategoryAccordion.current = false
      return
    }

    if (!hasInitializedCategoryAccordion.current) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      setExpandedCategoryGroup(groupedCategories[0].key)
      hasInitializedCategoryAccordion.current = true
      return
    }

    if (expandedCategoryGroup === null) {
      return
    }

    if (groupedCategories.some((group) => group.key === expandedCategoryGroup)) {
      return
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpandedCategoryGroup(groupedCategories[0].key)
  }, [expandedCategoryGroup, groupedCategories])

  const toggleCategoryGroup = useCallback((groupKey: 'fixed' | 'budget') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpandedCategoryGroup((current) => (current === groupKey ? null : groupKey))
  }, [])

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: activeTheme.colors.screenBackground }]}>
        <ActivityIndicator size="large" color={activeTheme.colors.accent} />
      </View>
    )
  }

  if (error || !dashboard) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: activeTheme.colors.screenBackground }]}>
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error ?? 'Failed to load dashboard'}</Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: activeTheme.colors.accent }]} onPress={loadDashboard}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const isOverAllocated = dashboard.freeToAssign < 0
  const allocationBalance = dashboard.totalIncome - dashboard.totalAllocated
  const allocationProgress = Math.max(
    0,
    Math.min(
      dashboard.totalAllocated > 0 ? (dashboard.totalSpent / dashboard.totalAllocated) * 100 : 0,
      100,
    ),
  )

  return (
    <ScrollView style={[styles.container, { backgroundColor: activeTheme.colors.screenBackground }]}>
      <ScreenHero
        eyebrow="Overview"
        title={'Financial\nOverview'}
        subtitle="Track income, allocations, and monthly momentum from one place."
        theme={theme.hero}
        actions={
          <View
            style={[
              styles.monthSwitcher,
              {
                backgroundColor: theme.actionSurface,
                borderColor: theme.actionBorder,
              },
            ]}
          >
            <TouchableOpacity style={styles.monthSwitchButton} onPress={() => handleShiftMonth(-1)} activeOpacity={0.8}>
              <Text style={[styles.monthSwitchGlyph, { color: theme.actionText }]}>{'<'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMonthPickerVisible(true)} activeOpacity={0.85}>
              <Text style={[styles.monthSwitchLabel, { color: theme.actionText }]}>{selectedMonthName}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.monthSwitchButton} onPress={() => handleShiftMonth(1)} activeOpacity={0.8}>
              <Text style={[styles.monthSwitchGlyph, { color: theme.actionText }]}>{'>'}</Text>
            </TouchableOpacity>
          </View>
        }
      >
        <View style={styles.heroMetricGrid}>
          {[
            { label: 'Income', value: dashboard.totalIncome, icon: 'arrow-down', accent: '#4ade80' },
            { label: 'Allocated', value: dashboard.totalAllocated, icon: 'albums-outline', accent: '#818cf8' },
            { label: 'Free to assign', value: dashboard.freeToAssign, icon: 'diamond-outline', accent: '#38bdf8' },
          ].map((item) => (
            <View key={item.label} style={styles.heroMetricCard}>
              <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={16} color={item.accent} />
              <Text style={styles.heroMetricValue}>{item.value.toLocaleString('nb-NO')}</Text>
              <Text style={styles.heroMetricLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.heroProgressSection}>
          <View style={styles.heroProgressMeta}>
            <Text style={styles.heroProgressHint}>
              {allocationBalance < 0
                ? `NOK ${Math.abs(allocationBalance).toLocaleString('nb-NO')} over-allocated`
                : `NOK ${allocationBalance.toLocaleString('nb-NO')} left to allocate`}
            </Text>
            <Text style={[styles.heroProgressHint, styles.heroProgressHintRight]}>
              {dashboard.totalSpent.toLocaleString('nb-NO')} / {dashboard.totalAllocated.toLocaleString('nb-NO')}
            </Text>
          </View>
          <View style={styles.heroProgressTrack}>
            <View style={[styles.heroProgressFill, { width: `${allocationProgress}%` }]} />
          </View>
        </View>
      </ScreenHero>

      <View style={styles.dashboardBody}>
        <View
          style={[
            styles.themePreviewCard,
            {
              backgroundColor: activeTheme.colors.surface,
              borderColor: activeTheme.colors.surfaceBorder,
            },
          ]}
        >
          <View style={styles.themePreviewCopy}>
            <Text style={[styles.themePreviewEyebrow, { color: activeTheme.colors.accent }]}>Theme engine preview</Text>
            <Text style={[styles.themePreviewTitle, { color: activeTheme.colors.text }]}>{activeTheme.label}</Text>
            <Text style={[styles.themePreviewMeta, { color: activeTheme.colors.mutedText }]}>
              {source === 'manual'
                ? `Manual override active. Auto season is ${resolvedThemeId}.`
                : `Automatic season match is ${resolvedThemeId}.`}
            </Text>
          </View>
          <View style={styles.themePreviewActions}>
            <TouchableOpacity
              style={[styles.themePreviewButton, { backgroundColor: activeTheme.colors.accentSoft }]}
              activeOpacity={0.85}
              onPress={cycleTheme}
            >
              <Text style={[styles.themePreviewButtonText, { color: activeTheme.colors.accent }]}>
                Cycle theme
              </Text>
            </TouchableOpacity>
            {source === 'manual' ? (
              <TouchableOpacity
                style={[
                  styles.themePreviewButton,
                  styles.themePreviewSecondaryButton,
                  { borderColor: activeTheme.colors.surfaceBorder },
                ]}
                activeOpacity={0.85}
                onPress={clearManualTheme}
              >
                <Text style={[styles.themePreviewSecondaryText, { color: activeTheme.colors.text }]}>
                  Back to auto
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {pocketMoneySummary ? (
          <View
            style={[
              styles.pocketMoneyCard,
              pocketMoneySummary.pocketMoneyLeft < 0 && styles.pocketMoneyCardWarning,
            ]}
          >
            <View style={styles.pocketMoneyHeader}>
              <View style={styles.pocketMoneyCopy}>
                <Text style={styles.pocketMoneyEyebrow}>Pocket money left</Text>
                <Text
                  style={[
                    styles.pocketMoneyAmount,
                    pocketMoneySummary.pocketMoneyLeft < 0 && styles.pocketMoneyAmountWarning,
                  ]}
                >
                  NOK {pocketMoneySummary.pocketMoneyLeft.toLocaleString('nb-NO')}
                </Text>
                <Text style={styles.pocketMoneyHint}>
                  {pocketMoneySummary.pocketMoneyLeft < 0
                    ? `Committed categories are NOK ${Math.abs(pocketMoneySummary.pocketMoneyLeft).toLocaleString('nb-NO')} above income.`
                    : 'Bills, food, fuel, savings, and other essentials reduce this first.'}
                </Text>
              </View>
              <View
                style={[
                  styles.pocketMoneyIconWrap,
                  pocketMoneySummary.pocketMoneyLeft < 0 && styles.pocketMoneyIconWrapWarning,
                ]}
              >
                <Ionicons
                  name={pocketMoneySummary.pocketMoneyLeft < 0 ? 'alert-circle-outline' : 'wallet-outline'}
                  size={20}
                  color={pocketMoneySummary.pocketMoneyLeft < 0 ? '#b91c1c' : '#2563eb'}
                />
              </View>
            </View>

            <View style={styles.pocketMoneyBreakdown}>
              {[
                { label: 'Bills', value: pocketMoneySummary.bills, tone: styles.pocketMoneyChipBills },
                { label: 'Food', value: pocketMoneySummary.food, tone: styles.pocketMoneyChipFood },
                { label: 'Fuel', value: pocketMoneySummary.fuel, tone: styles.pocketMoneyChipFuel },
                { label: 'Savings', value: pocketMoneySummary.savings, tone: styles.pocketMoneyChipSavings },
                { label: 'Other', value: pocketMoneySummary.other, tone: styles.pocketMoneyChipOther },
              ]
                .filter((item) => item.value > 0)
                .map((item) => (
                  <View key={item.label} style={[styles.pocketMoneyChip, item.tone]}>
                    <Text style={styles.pocketMoneyChipLabel}>{item.label}</Text>
                    <Text style={styles.pocketMoneyChipValue}>NOK {item.value.toLocaleString('nb-NO')}</Text>
                  </View>
                ))}
            </View>

            <View style={styles.pocketMoneyFooter}>
              <Text style={styles.pocketMoneyFooterLabel}>Planned pocket money</Text>
              <Text style={styles.pocketMoneyFooterValue}>
                NOK {pocketMoneySummary.pocket.toLocaleString('nb-NO')}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.insightGrid}>
          <View style={styles.insightCard}>
            <View style={[styles.insightIconWrap, styles.categoriesInsightIcon]}>
              <Ionicons name="pie-chart-outline" size={18} color="#7c3aed" />
            </View>
            <Text style={styles.insightValue}>{dashboard.categoryCount}</Text>
            <Text style={styles.insightLabel}>Categories</Text>
          </View>
          <View style={styles.insightCard}>
            <View style={[styles.insightIconWrap, styles.loanInsightIcon]}>
              <Ionicons name="document-text-outline" size={18} color="#f97316" />
            </View>
            <Text style={styles.insightValue}>{dashboard.activeLoans}</Text>
            <Text style={styles.insightLabel}>Active Loans</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.loanSpotlightCard} activeOpacity={0.85}>
          <View style={styles.loanSpotlightLeft}>
            <View style={styles.loanSpotlightIconWrap}>
              <Ionicons name="document-text-outline" size={16} color="#f97316" />
            </View>
            <View>
              <Text style={styles.loanSpotlightValue}>NOK {dashboard.loanBalance.toLocaleString('nb-NO')}</Text>
              <Text style={styles.loanSpotlightMeta}>
                {dashboard.activeLoans} active {dashboard.activeLoans === 1 ? 'loan' : 'loans'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* ── Phase 2: 3-Stat Row ── ADDED THIS */}
      <View style={styles.statRow}>
        <View style={[styles.statRowItem, styles.statRowIncome]}>
          <Ionicons name="arrow-down-circle" size={18} color="#10b981" />
          <Text style={styles.statRowValue}>
            {dashboard.totalIncome.toLocaleString()}
          </Text>
          <Text style={styles.statRowLabel}>Income</Text>
        </View>
        <View style={[styles.statRowItem, styles.statRowAllocated]}>
          <Ionicons name="layers" size={18} color="#8b5cf6" />
          <Text style={styles.statRowValue}>
            {dashboard.totalAllocated.toLocaleString()}
          </Text>
          <Text style={styles.statRowLabel}>Allocated</Text>
        </View>
        <View
          style={[
            styles.statRowItem,
            styles.statRowFree,
            isOverAllocated && styles.statRowFreeWarning,
          ]}
        >
          <Ionicons
            name="wallet-outline"
            size={18}
            color={isOverAllocated ? '#ef4444' : '#3b82f6'}
          />
          <Text style={[styles.statRowValue, isOverAllocated && styles.statRowValueWarning]}>
            {dashboard.freeToAssign.toLocaleString()}
          </Text>
          <Text style={[styles.statRowLabel, isOverAllocated && styles.statRowLabelWarning]}>
            Free to assign
          </Text>
        </View>
      </View>

      {/* ── Phase 2: Cash Flow Progress Bar ── ADDED THIS */}
      <View style={styles.cashFlowSection}>
        <View style={styles.cashFlowBarTrack}>
          <View
            style={[
              styles.cashFlowBarFill,
              {
                width: `${Math.max(0, Math.min(
                  dashboard.totalAllocated > 0
                    ? (dashboard.totalSpent / dashboard.totalAllocated) * 100
                    : 0,
                  100,
                ))}%`,
              },
            ]}
          />
        </View>
        <View style={styles.cashFlowLabels}>
          <Text style={[styles.cashFlowLeft, allocationBalance < 0 && styles.cashFlowLeftWarning]}>
            {allocationBalance < 0
              ? `NOK ${Math.abs(allocationBalance).toLocaleString()} over-allocated`
              : `NOK ${allocationBalance.toLocaleString()} left to allocate`}
          </Text>
          <Text style={styles.cashFlowRight}>
            {dashboard.totalSpent.toLocaleString()} / {dashboard.totalAllocated.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summarySection}>
        {/* Income Card */}
        <View style={[styles.card, styles.incomeCard]}>
          <View style={styles.cardTop}>
            <View style={styles.cardLabelRow}>
              <View style={[styles.cardIcon, styles.incomeIcon]}>
                <Ionicons name="arrow-down" size={16} color="#10b981" />
              </View>
              <Text style={[styles.cardLabel, styles.incomeLabel]}>Income</Text>
            </View>
            <Text style={[styles.cardTag, styles.incomeTag]}>Free money</Text>
          </View>

          <View style={styles.cardValueRow}>
            <Text style={[styles.cardCurrency, styles.incomeCurrency]}>NOK</Text>
            <Text style={[styles.cardValue, styles.incomeValue]}> {dashboard.totalIncome.toLocaleString()}</Text>
          </View>

          <View style={[styles.cardDivider, styles.incomeDivider]} />
          <Text style={[styles.cardFooter, styles.incomeFooter]}>Income minus all fixed costs</Text>
          <View style={[styles.cardOrb, styles.incomeOrb]} pointerEvents="none" />
        </View>

        {/* Spent Card */}
        <View style={[styles.card, styles.spentCard]}>
          <View style={styles.cardTop}>
            <View style={styles.cardLabelRow}>
              <View style={[styles.cardIcon, styles.spentIcon]}>
                <Ionicons name="arrow-up" size={16} color="#ef4444" />
              </View>
              <Text style={[styles.cardLabel, styles.spentLabel]}>Spent</Text>
            </View>
            <Text style={[styles.cardTag, styles.spentTag]}>Fixed costs</Text>
          </View>

          <View style={styles.cardValueRow}>
            <Text style={[styles.cardCurrency, styles.spentCurrency]}>NOK</Text>
            <Text style={[styles.cardValue, styles.spentValue]}> {dashboard.totalSpent.toLocaleString()}</Text>
          </View>

          <View style={[styles.cardDivider, styles.spentDivider]} />
          <Text style={[styles.cardFooter, styles.spentFooter]}>Transfer to your bills account</Text>
          <View style={[styles.cardOrb, styles.spentOrb]} pointerEvents="none" />
        </View>

        {/* Remaining Card */}
        <View style={[styles.card, styles.remainingCard]}>
          <View style={styles.cardTop}>
            <View style={styles.cardLabelRow}>
              <View style={[styles.cardIcon, styles.remainingIcon]}>
                <Ionicons name="wallet" size={16} color="#3b82f6" />
              </View>
              <Text style={[styles.cardLabel, styles.remainingLabel]}>Remaining</Text>
            </View>
            <Text style={[styles.cardTag, styles.remainingTag]}>Budgeted</Text>
          </View>

          <View style={styles.cardValueRow}>
            <Text style={[styles.cardCurrency, styles.remainingCurrency]}>NOK</Text>
            <Text style={[styles.cardValue, styles.remainingValue]}> {dashboard.remaining.toLocaleString()}</Text>
          </View>

          <View style={[styles.cardDivider, styles.remainingDivider]} />
          <Text style={[styles.cardFooter, styles.remainingFooter]}>Total across all budget categories</Text>
          <View style={[styles.cardOrb, styles.remainingOrb]} pointerEvents="none" />
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Ionicons name="pie-chart" size={24} color="#8b5cf6" />
          <Text style={styles.statLabel}>{dashboard.categoryCount}</Text>
          <Text style={styles.statDesc}>Categories</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="document-text" size={24} color="#f59e0b" />
          <Text style={styles.statLabel}>{dashboard.activeLoans}</Text>
          <Text style={styles.statDesc}>Active Loans</Text>
        </View>
      </View>

      {/* ── Phase 2: Compact Loan Summary ── CHANGED THIS */}
      <View style={styles.loanSection}>
        <TouchableOpacity style={styles.compactLoanCard} activeOpacity={0.7}>
          <View style={styles.compactLoanLeft}>
            <Ionicons name="document-text" size={20} color="#f59e0b" />
            <Text style={styles.compactLoanBalance}>
              NOK {dashboard.loanBalance.toLocaleString()}
            </Text>
          </View>
          <View style={styles.compactLoanRight}>
            <Text style={styles.compactLoanCount}>
              {dashboard.activeLoans} active {dashboard.activeLoans === 1 ? 'loan' : 'loans'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#3b82f6" />
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Phase 3: Categories Grid ── */}
      <View style={styles.categoriesSection}>
        <Text style={styles.dashboardSectionTitle}>Categories</Text>
        {groupedCategories.length === 0 ? (
          <Text style={styles.emptyCategories}>No categories yet</Text>
        ) : (
          groupedCategories.map((group) => (
            <CategoryAccordionSection
              key={group.key}
              title={group.title}
              subtitle={`${group.itemCount} ${group.itemCount === 1 ? 'item' : 'items'} - ${group.description}`}
              totalLabel={`NOK ${group.totalAllocated.toLocaleString()}`}
              accentColor={group.accentColor}
              previewLabels={group.previewNames}
              isOpen={expandedCategoryGroup === group.key}
              onToggle={() => toggleCategoryGroup(group.key)}
            >
              <View style={styles.categoriesGrid}>
                {group.items.map((item) => (
                  <CategoryCard
                    key={item.id}
                    category={item}
                    onPress={() => setSelectedCategory(item)}
                  />
                ))}
              </View>
            </CategoryAccordionSection>
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.dashboardSectionTitle}>Quick Actions</Text>
        <View style={styles.dashboardActionGrid}>
          <TouchableOpacity
            style={styles.dashboardActionCard}
            onPress={() => setAddExpenseModalOpen(true)}
            activeOpacity={0.85}
          >
            <View style={[styles.dashboardActionIcon, styles.dashboardActionIconBlue]}>
              <Ionicons name="add" size={22} color="#6d5bd0" />
            </View>
            <Text style={styles.dashboardActionLabel}>Add Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dashboardActionCard}
            onPress={() => setSetIncomeModalOpen(true)}
            activeOpacity={0.85}
          >
            <View style={[styles.dashboardActionIcon, styles.dashboardActionIconGreen]}>
              <Text style={styles.dashboardActionEmoji}>$</Text>
            </View>
            <Text style={styles.dashboardActionLabel}>Set income</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dashboardActionCard} activeOpacity={0.85}>
            <View style={[styles.dashboardActionIcon, styles.dashboardActionIconOrange]}>
              <Ionicons name="document-text-outline" size={20} color="#f97316" />
            </View>
            <Text style={styles.dashboardActionLabel}>Add Loan</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Spacing */}
      <View style={{ height: 32 }} />

      <MonthPickerModal
        visible={isMonthPickerVisible}
        selectedMonth={selectedMonth}
        onClose={() => setMonthPickerVisible(false)}
        onSelectMonth={handleSelectMonth}
      />

      {/* ── Phase 3: Category detail modal ── */}
      <CategoryDetailModal
        visible={selectedCategory !== null}
        category={selectedCategory}
        onClose={() => setSelectedCategory(null)}
        onCategoryUpdated={() => {
          setSelectedCategory(null)
          void loadDashboard()
        }}
        onCategoryDeleted={() => {
          setSelectedCategory(null)
          void loadDashboard()
        }}
      />

      {dashboard && isSetIncomeModalOpen && (
        <SetIncomeModal
          isOpen={isSetIncomeModalOpen}
          currentIncome={dashboard.totalIncome}
          onClose={() => setSetIncomeModalOpen(false)}
          onIncomeUpdated={() => {
            setSetIncomeModalOpen(false)
            void loadDashboard()
          }}
        />
      )}

      {/* ── Add Expense Modal ── */}
      {dashboard && (
        <AddExpenseModal
          isOpen={isAddExpenseModalOpen}
          onClose={() => setAddExpenseModalOpen(false)}
          categories={dashboard.categories}
          selectedMonth={selectedMonth}
          onTransactionCreated={() => {
            setAddExpenseModalOpen(false)
            void loadDashboard()
          }}
        />
      )}
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
  monthSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  monthSwitchButton: {
    paddingHorizontal: 2,
  },
  monthSwitchGlyph: {
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '700',
    fontFamily: 'DMSans_700Bold',
  },
  monthSwitchLabel: {
    minWidth: 72,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'DMSans_700Bold',
  },
  heroMetricGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  heroMetricCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroMetricValue: {
    marginTop: 6,
    fontSize: 16,
    color: '#f1f5f9',
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  heroMetricLabel: {
    marginTop: 2,
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
    fontFamily: 'DMSans_500Medium',
  },
  heroProgressSection: {
    marginTop: 14,
  },
  heroProgressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 5,
  },
  heroProgressHint: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'DMSans_500Medium',
    flexShrink: 1,
  },
  heroProgressHintRight: {
    textAlign: 'right',
  },
  heroProgressTrack: {
    height: 5,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#ef4444',
  },
  dashboardBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
  },
  themePreviewCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  themePreviewCopy: {
    gap: 4,
  },
  themePreviewEyebrow: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontFamily: 'DMSans_700Bold',
  },
  themePreviewTitle: {
    fontSize: 22,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  themePreviewMeta: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'DMSans_500Medium',
  },
  themePreviewActions: {
    flexDirection: 'row',
    gap: 10,
  },
  themePreviewButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  themePreviewSecondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
  },
  themePreviewButtonText: {
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
  },
  themePreviewSecondaryText: {
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
  },
  transferCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f3c38a',
    backgroundColor: '#fff8ef',
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  transferIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffedd5',
  },
  transferIcon: {
    fontSize: 22,
    lineHeight: 24,
    color: '#16a34a',
    fontFamily: 'DMSans_800ExtraBold',
  },
  transferCopy: {
    flex: 1,
    gap: 2,
  },
  transferEyebrow: {
    fontSize: 13,
    color: '#9a3412',
    fontFamily: 'DMSans_700Bold',
  },
  transferAmount: {
    fontSize: 18,
    color: '#7c2d12',
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  transferHint: {
    fontSize: 12,
    color: '#c2410c',
    fontFamily: 'DMSans_500Medium',
  },
  pocketMoneyCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#f8fbff',
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 14,
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  pocketMoneyCardWarning: {
    borderColor: '#fecaca',
    backgroundColor: '#fff8f8',
  },
  pocketMoneyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  pocketMoneyCopy: {
    flex: 1,
    gap: 2,
  },
  pocketMoneyEyebrow: {
    fontSize: 13,
    color: '#1d4ed8',
    fontFamily: 'DMSans_700Bold',
  },
  pocketMoneyAmount: {
    fontSize: 28,
    color: '#0f172a',
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  pocketMoneyAmountWarning: {
    color: '#b91c1c',
  },
  pocketMoneyHint: {
    fontSize: 12,
    lineHeight: 18,
    color: '#64748b',
    fontFamily: 'DMSans_500Medium',
  },
  pocketMoneyIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbeafe',
  },
  pocketMoneyIconWrapWarning: {
    backgroundColor: '#fee2e2',
  },
  pocketMoneyBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pocketMoneyChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    gap: 2,
  },
  pocketMoneyChipBills: {
    backgroundColor: '#fff7ed',
    borderColor: '#fed7aa',
  },
  pocketMoneyChipFood: {
    backgroundColor: '#ecfeff',
    borderColor: '#a5f3fc',
  },
  pocketMoneyChipFuel: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
  },
  pocketMoneyChipSavings: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  pocketMoneyChipOther: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
  },
  pocketMoneyChipLabel: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'DMSans_600SemiBold',
  },
  pocketMoneyChipValue: {
    fontSize: 12,
    color: '#0f172a',
    fontFamily: 'DMSans_700Bold',
  },
  pocketMoneyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#dbeafe',
    paddingTop: 12,
  },
  pocketMoneyFooterLabel: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'DMSans_500Medium',
  },
  pocketMoneyFooterValue: {
    fontSize: 15,
    color: '#1d4ed8',
    fontFamily: 'DMSans_700Bold',
  },
  insightGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  insightCard: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  insightIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  categoriesInsightIcon: {
    backgroundColor: '#f3f0ff',
  },
  loanInsightIcon: {
    backgroundColor: '#fff7ed',
  },
  insightValue: {
    fontSize: 18,
    color: '#1f2937',
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  insightLabel: {
    marginTop: 4,
    fontSize: 13,
    color: '#94a3b8',
    fontFamily: 'DMSans_500Medium',
  },
  loanSpotlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  loanSpotlightLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loanSpotlightIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff7ed',
  },
  loanSpotlightValue: {
    fontSize: 17,
    color: '#1f2937',
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  loanSpotlightMeta: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'DMSans_500Medium',
  },
  summarySection: {
    display: 'none',
  },
  card: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    backgroundColor: '#fff',
  },
  incomeCard: {
    backgroundColor: '#ecfdf5',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  spentCard: {
    backgroundColor: '#fff5f5',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  remainingCard: {
    backgroundColor: '#f0f6ff',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomeIcon: { backgroundColor: 'rgba(16,185,129,0.12)' },
  spentIcon: { backgroundColor: 'rgba(239,68,68,0.12)' },
  remainingIcon: { backgroundColor: 'rgba(59,130,246,0.12)' },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  incomeLabel: { color: '#15803d' },
  spentLabel: { color: '#dc2626' },
  remainingLabel: { color: '#1d4ed8' },
  cardTag: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    opacity: 0.85,
    overflow: 'hidden',
  },
  incomeTag: { backgroundColor: 'rgba(16,185,129,0.12)', color: '#15803d' },
  spentTag: { backgroundColor: 'rgba(239,68,68,0.12)', color: '#dc2626' },
  remainingTag: { backgroundColor: 'rgba(59,130,246,0.12)', color: '#1d4ed8' },
  cardValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  cardCurrency: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.6,
    fontFamily: 'JetBrains Mono',
  },
  cardValue: {
    fontFamily: 'JetBrains Mono',
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  incomeCurrency: { color: '#15803d' },
  spentCurrency: { color: '#dc2626' },
  remainingCurrency: { color: '#1d4ed8' },
  incomeValue: { color: '#14532d' },
  spentValue: { color: '#7f1d1d' },
  remainingValue: { color: '#1e3a8a' },
  cardDivider: {
    height: 1,
    marginVertical: 12,
    opacity: 0.15,
  },
  incomeDivider: { backgroundColor: '#16a34a' },
  spentDivider: { backgroundColor: '#ef4444' },
  remainingDivider: { backgroundColor: '#2563eb' },
  cardFooter: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.6,
  },
  incomeFooter: { color: '#15803d' },
  spentFooter: { color: '#dc2626' },
  remainingFooter: { color: '#1d4ed8' },
  cardOrb: {
    position: 'absolute',
    top: -28,
    right: -28,
    width: 90,
    height: 90,
    borderRadius: 999,
    opacity: 0.16,
    transform: [{ scale: 1 }],
  },
  incomeOrb: { backgroundColor: '#16a34a' },
  spentOrb: { backgroundColor: '#ef4444' },
  remainingOrb: { backgroundColor: '#2563eb' },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  /* legacy styles for other components (keep minimal to avoid override) */
  cardAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  statsGrid: {
    display: 'none',
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  statDesc: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  loanSection: {
    display: 'none',
  },
  // ── REMOVED old sectionHeader / loanCard / loanLabel / loanAmount / loanDesc ──
  // ── Phase 2: Compact loan styles ── ADDED THIS
  compactLoanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  compactLoanLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactLoanBalance: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  compactLoanRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactLoanCount: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  // ── Phase 2: Stats row styles ── ADDED THIS
  statRow: {
    display: 'none',
  },
  statRowItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statRowIncome: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  statRowAllocated: {
    backgroundColor: '#f5f3ff',
    borderColor: '#ddd6fe',
  },
  statRowFree: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  statRowFreeWarning: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  statRowValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  statRowValueWarning: {
    color: '#b91c1c',
  },
  statRowLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 2,
  },
  statRowLabelWarning: {
    color: '#b91c1c',
  },
  // ── Phase 2: Cash flow bar styles ── ADDED THIS
  cashFlowSection: {
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 14,
  },
  cashFlowBarTrack: {
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  cashFlowBarFill: {
    height: '100%',
    backgroundColor: '#ef4444',
    borderRadius: 6,
  },
  cashFlowLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  cashFlowLeft: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  cashFlowLeftWarning: {
    color: '#b91c1c',
  },
  cashFlowRight: {
    fontSize: 12,
    color: '#6b7280',
  },
  actionsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  // ── Phase 3: Categories grid styles ──
  categoriesSection: {
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 24,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginHorizontal: -4,
  },
  emptyCategories: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 16,
  },
  dashboardSectionTitle: {
    fontSize: 18,
    color: '#243043',
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  sectionTitle: {
    fontSize: 18,
    color: '#243043',
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  dashboardActionGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  dashboardActionCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  dashboardActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  dashboardActionIconBlue: {
    backgroundColor: '#eef2ff',
  },
  dashboardActionIconGreen: {
    backgroundColor: '#ecfdf5',
  },
  dashboardActionIconOrange: {
    backgroundColor: '#fff7ed',
  },
  dashboardActionEmoji: {
    fontSize: 18,
    lineHeight: 20,
    color: '#10b981',
    fontFamily: 'DMSans_800ExtraBold',
  },
  dashboardActionLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    fontFamily: 'DMSans_600SemiBold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    width: '30%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginTop: 12,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
})
