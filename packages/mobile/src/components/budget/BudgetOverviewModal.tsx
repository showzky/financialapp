import React, { useMemo } from 'react'
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import { CategoryPickerModal } from '../categories/CategoryPickerModal'

import type { CategoryWithSpent } from '../../services/dashboardApi'
import type { CategoryDto } from '../../services/categoryApi'
import { SetupBudgetModal } from './SetupBudgetModal'

type Props = {
  visible: boolean
  selectedMonth: Date
  totalIncome: number
  totalBudget: number
  freeToAssign: number
  categories: CategoryWithSpent[]
  budgetAssignments: CategoryWithSpent[]
  onClose: () => void
  onBudgetChanged: () => void
}

function fmtKr(value: number) {
  return `KR ${value.toLocaleString('nb-NO')}`
}

function getIoniconName(icon: string | null | undefined): keyof typeof Ionicons.glyphMap {
  if (icon && icon in Ionicons.glyphMap) {
    return icon as keyof typeof Ionicons.glyphMap
  }

  return 'ellipse-outline'
}

function formatPeriod(selectedMonth: Date) {
  const start = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1)
  const end = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0)
  const formatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return `${formatter.format(start)} - ${formatter.format(end)}`
}

export function BudgetOverviewModal({
  visible,
  selectedMonth,
  totalIncome,
  totalBudget,
  freeToAssign,
  categories,
  budgetAssignments,
  onClose,
  onBudgetChanged,
}: Props) {
  const navigation = useNavigation<any>()
  const [selectedCategory, setSelectedCategory] = React.useState<CategoryWithSpent | null>(null)
  const [selectedCategoryCanDelete, setSelectedCategoryCanDelete] = React.useState(true)
  const [summaryTargetVisible, setSummaryTargetVisible] = React.useState(false)
  const [categoryPickerVisible, setCategoryPickerVisible] = React.useState(false)
  const [exampleInfoVisible, setExampleInfoVisible] = React.useState(false)
  const budgetCategories = useMemo(
    () => budgetAssignments,
    [budgetAssignments],
  )

  const spentBudget = useMemo(
    () => budgetCategories.reduce((sum, category) => sum + category.monthSpent, 0),
    [budgetCategories],
  )

  const budgetUsage = totalBudget > 0 ? Math.round((spentBudget / totalBudget) * 100) : 0
  const budgetRemaining = Math.max(0, 100 - Math.max(0, Math.min(budgetUsage, 100)))
  const periodLabel = formatPeriod(selectedMonth)

  const handleSelectBudgetCategory = (category: CategoryDto) => {
    const existingCategory = budgetAssignments.find((item) => item.id === category.id)

    setCategoryPickerVisible(false)
    setSelectedCategoryCanDelete(Boolean(existingCategory))
    setSelectedCategory(
      existingCategory ?? {
        id: category.id,
        name: category.name,
        parentName: category.parentName,
        icon: category.icon,
        color: category.color,
        iconColor: category.iconColor,
        type: category.type ?? 'budget',
        allocated: 0,
        monthSpent: 0,
        billCoveredAmount: 0,
        dueDayOfMonth: category.dueDayOfMonth ?? null,
        sortOrder: category.sortOrder,
        isDefault: category.isDefault,
        isArchived: category.isArchived,
      },
    )
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={styles.modalWrap}>
          <LinearGradient
            colors={['rgba(30,27,49,0.98)', 'rgba(18,19,31,0.98)']}
            style={styles.card}
          >
            <LinearGradient
              colors={['rgba(103,76,164,0.22)', 'rgba(103,76,164,0)', 'rgba(0,0,0,0)']}
              style={styles.cardBloom}
            />

            <View style={styles.headerRow}>
              <Text style={styles.title}>Budget</Text>
              <View style={styles.periodChip}>
                <Text style={styles.periodChipText}>Monthly</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.summaryCard}
              activeOpacity={0.9}
              onPress={() => setSummaryTargetVisible(true)}
            >
              <View style={styles.summaryFillTrack}>
                {budgetRemaining > 0 ? (
                  <View
                    style={[
                      styles.summaryFill,
                      { width: `${budgetRemaining}%` as const },
                    ]}
                  />
                ) : null}
              </View>

              <View style={styles.summaryTop}>
                <View style={styles.totalBudgetRow}>
                  <View style={styles.totalBudgetIcon}>
                    <MaterialCommunityIcons name="butterfly-outline" size={16} color="#9bc2ff" />
                  </View>
                  <View>
                    <Text style={styles.summaryLabel}>Total budget</Text>
                    <Text style={styles.summaryAmount}>{fmtKr(totalBudget)}</Text>
                  </View>
                </View>

                <View style={styles.summaryRight}>
                  <Text style={[styles.summaryPercent, budgetUsage > 100 ? styles.badValue : styles.goodValue]}>
                    {budgetUsage}%
                  </Text>
                  <Text style={styles.summarySpent}>{fmtKr(spentBudget)}</Text>
                </View>
              </View>

              <View style={styles.summaryMetaRow}>
                <View>
                  <Text style={styles.metaLabel}>Budget period</Text>
                  <Text style={styles.metaValue}>{periodLabel}</Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaBlockRight}>
                  <Text style={styles.metaLabel}>Free now</Text>
                  <Text style={styles.metaValue}>{fmtKr(freeToAssign)}</Text>
                </View>
              </View>
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
              {budgetCategories.length === 0
                ? EXAMPLE_BUDGET_ROWS.map((category) => {
                    const fillPercent = Math.max(0, 100 - Math.max(0, Math.min(category.usage, 100)))

                    return (
                      <View key={category.id} style={styles.categoryRowWrap}>
                        <TouchableOpacity
                          style={styles.categoryCard}
                          activeOpacity={0.88}
                          onPress={() => setExampleInfoVisible(true)}
                        >
                          <View style={styles.categoryFillTrack}>
                            {fillPercent > 0 ? (
                              <View
                                style={[
                                  styles.categoryFill,
                                  { width: `${fillPercent}%` as const },
                                ]}
                              />
                            ) : null}
                          </View>

                          <View style={[styles.categoryIconWrap, { backgroundColor: category.color }]}>
                            <Ionicons name={category.icon} size={16} color={category.iconColor} />
                          </View>

                          <View style={styles.categoryTextWrap}>
                            <Text style={styles.categoryName} numberOfLines={1}>
                              {category.name}
                            </Text>
                            <Text style={styles.categoryMeta}>{fmtKr(category.allocated)}</Text>
                          </View>

                          <View style={styles.categoryAmountWrap}>
                            <Text style={styles.categoryPercent}>{category.usage}%</Text>
                            <Text style={styles.categoryAmount}>{fmtKr(category.spent)}</Text>
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.cogButton}
                          activeOpacity={0.8}
                          onPress={() => setExampleInfoVisible(true)}
                        >
                          <Ionicons name="settings-outline" size={16} color="rgba(197,212,255,0.88)" />
                        </TouchableOpacity>
                      </View>
                    )
                  })
                : budgetCategories.map((category) => {
                const usage = category.allocated > 0 ? Math.round((category.monthSpent / category.allocated) * 100) : 0
                const accent = category.iconColor || category.color || '#78d89c'
                const fillPercent = Math.max(0, 100 - Math.max(0, Math.min(usage, 100)))

                return (
                  <View key={category.id} style={styles.categoryRowWrap}>
                    <TouchableOpacity
                      style={styles.categoryCard}
                      activeOpacity={0.88}
                      onPress={() => {
                        onClose()
                        navigation.navigate('BudgetCategoryAnalytics', {
                          categoryId: category.id,
                          categoryName: category.name,
                          accent,
                        })
                      }}
                    >
                      <View style={styles.categoryFillTrack}>
                        {fillPercent > 0 ? (
                          <View
                            style={[
                              styles.categoryFill,
                              { width: `${fillPercent}%` as const },
                            ]}
                          />
                        ) : null}
                      </View>

                      <View style={[styles.categoryIconWrap, { backgroundColor: category.color || '#1f2a3d' }]}>
                        <Ionicons name={getIoniconName(category.icon)} size={16} color={accent} />
                      </View>

                      <View style={styles.categoryTextWrap}>
                        <Text style={styles.categoryName} numberOfLines={1}>
                          {category.name}
                        </Text>
                        <Text style={styles.categoryMeta}>{fmtKr(category.allocated)}</Text>
                      </View>

                      <View style={styles.categoryAmountWrap}>
                        <Text style={styles.categoryPercent}>{usage}%</Text>
                        <Text style={styles.categoryAmount}>{fmtKr(category.monthSpent)}</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cogButton}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedCategoryCanDelete(true)
                        setSelectedCategory(category)
                      }}
                    >
                      <Ionicons name="settings-outline" size={16} color="rgba(197,212,255,0.88)" />
                    </TouchableOpacity>
                  </View>
                )
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.addButton}
              activeOpacity={0.9}
              onPress={() => setCategoryPickerVisible(true)}
            >
              <LinearGradient
                colors={['#70b5ff', '#4c97f3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addButtonGradient}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addButtonText}>Add category budget</Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.footerHint}>{fmtKr(totalIncome)} income available this month</Text>
          </LinearGradient>
        </View>

        <SetupBudgetModal
          visible={visible && selectedCategory !== null}
          category={selectedCategory}
          canDeleteCategoryBudget={selectedCategoryCanDelete}
          selectedMonth={selectedMonth}
          onClose={() => setSelectedCategory(null)}
          onSaved={onBudgetChanged}
        />

        <SetupBudgetModal
          visible={visible && summaryTargetVisible}
          category={null}
          target={{
            id: null,
            name: 'Total budget',
            icon: 'wallet-outline',
            color: '#24324a',
            iconColor: '#9bc2ff',
            allocated: totalBudget,
            canDelete: false,
          }}
          selectedMonth={selectedMonth}
          onClose={() => setSummaryTargetVisible(false)}
          onSaved={onBudgetChanged}
        />

        <CategoryPickerModal
          visible={categoryPickerVisible}
          initialKind="expense"
          defaultExpenseType="budget"
          onClose={() => setCategoryPickerVisible(false)}
          onSelect={(category) => {
            handleSelectBudgetCategory(category)
          }}
          onCategoriesChanged={() => {
            onBudgetChanged()
          }}
        />

        <Modal visible={visible && exampleInfoVisible} transparent animationType="fade" onRequestClose={() => setExampleInfoVisible(false)}>
          <View style={styles.infoOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setExampleInfoVisible(false)} />
            <View style={styles.infoCard}>
              <TouchableOpacity style={styles.infoClose} onPress={() => setExampleInfoVisible(false)} activeOpacity={0.85}>
                <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
              <Text style={styles.infoText}>
                This is the example state. You can add real category budgets from your category list.
              </Text>
              <View style={styles.infoActions}>
                <TouchableOpacity style={styles.infoSecondaryButton} onPress={() => setExampleInfoVisible(false)} activeOpacity={0.85}>
                  <Text style={styles.infoSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.infoPrimaryButton}
                  onPress={() => {
                    setExampleInfoVisible(false)
                    setCategoryPickerVisible(true)
                  }}
                  activeOpacity={0.9}
                >
                  <Text style={styles.infoPrimaryText}>Add category budget</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  )
}

const EXAMPLE_BUDGET_ROWS = [
  {
    id: 'example-supermarket',
    name: 'Supermarket (Example)',
    allocated: 500,
    spent: 81.85,
    usage: 88,
    icon: 'cart-outline' as keyof typeof Ionicons.glyphMap,
    color: '#4a2b2c',
    iconColor: '#ff7b63',
  },
  {
    id: 'example-clothing',
    name: 'Clothing (Example)',
    allocated: 1000,
    spent: 733.51,
    usage: 27,
    icon: 'shirt-outline' as keyof typeof Ionicons.glyphMap,
    color: '#3a4d8b',
    iconColor: '#82a7ff',
  },
  {
    id: 'example-house',
    name: 'House (Example)',
    allocated: 1500,
    spent: 974.85,
    usage: 36,
    icon: 'home-outline' as keyof typeof Ionicons.glyphMap,
    color: '#575766',
    iconColor: '#efeff6',
  },
  {
    id: 'example-entertainment',
    name: 'Entertainment (Example)',
    allocated: 600,
    spent: 588.36,
    usage: 98,
    icon: 'umbrella-outline' as keyof typeof Ionicons.glyphMap,
    color: '#6a3a5e',
    iconColor: '#ff96bb',
  },
]

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7,7,12,0.64)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalWrap: {
    width: '100%',
    maxWidth: 360,
  },
  card: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 18,
  },
  cardBloom: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  periodChip: {
    borderRadius: 14,
    backgroundColor: '#5fa8ff',
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  periodChipText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  summaryCard: {
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  summaryFillTrack: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 22,
  },
  summaryFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(97,167,255,0.34)',
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  totalBudgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flex: 1,
  },
  totalBudgetIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: 'rgba(106,133,204,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(147,173,247,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryAmount: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 3,
  },
  summaryRight: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  summaryPercent: {
    fontSize: 13,
    fontWeight: '800',
  },
  badValue: {
    color: '#ff7f84',
  },
  goodValue: {
    color: '#ffffff',
  },
  summarySpent: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 3,
  },
  summaryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 9,
  },
  metaLabel: {
    color: 'rgba(255,255,255,0.36)',
    fontSize: 10,
    marginBottom: 2,
  },
  metaValue: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 10,
    fontWeight: '700',
  },
  metaDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 14,
  },
  metaBlockRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  listContent: {
    gap: 10,
    paddingBottom: 8,
  },
  categoryRowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(122,134,208,0.16)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    position: 'relative',
  },
  categoryFillTrack: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 18,
  },
  categoryFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    backgroundColor: 'rgba(94,162,255,0.62)',
  },
  categoryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  categoryTextWrap: {
    flex: 1,
  },
  categoryName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  categoryMeta: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    marginTop: 2,
  },
  categoryAmountWrap: {
    marginLeft: 12,
    alignItems: 'flex-end',
  },
  categoryPercent: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 12,
    fontWeight: '800',
  },
  categoryAmount: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  cogButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  addButton: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 6,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  footerHint: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.28)',
    fontSize: 11,
    marginTop: 12,
  },
  infoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7,7,12,0.64)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  infoCard: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: '#262538',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
  },
  infoClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '800',
    marginRight: 20,
  },
  infoActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    gap: 12,
  },
  infoSecondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSecondaryText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  infoPrimaryButton: {
    flex: 1.4,
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: '#ff5f63',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  infoPrimaryText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
})
