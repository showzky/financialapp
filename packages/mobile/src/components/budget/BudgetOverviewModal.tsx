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

import type { CategoryWithSpent } from '../../services/dashboardApi'
import { SetupBudgetModal } from './SetupBudgetModal'

type Props = {
  visible: boolean
  selectedMonth: Date
  totalIncome: number
  totalBudget: number
  freeToAssign: number
  categories: CategoryWithSpent[]
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
  onClose,
  onBudgetChanged,
}: Props) {
  const [selectedCategory, setSelectedCategory] = React.useState<CategoryWithSpent | null>(null)
  const [summaryTargetVisible, setSummaryTargetVisible] = React.useState(false)
  const budgetCategories = useMemo(
    () => categories.filter((category) => category.type === 'budget').slice(0, 5),
    [categories],
  )

  const spentBudget = useMemo(
    () => budgetCategories.reduce((sum, category) => sum + category.monthSpent, 0),
    [budgetCategories],
  )

  const budgetUsage = totalBudget > 0 ? Math.round((spentBudget / totalBudget) * 100) : 0
  const budgetRemaining = Math.max(0, 100 - Math.max(0, Math.min(budgetUsage, 100)))
  const periodLabel = formatPeriod(selectedMonth)

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
              {budgetCategories.map((category) => {
                const usage = category.allocated > 0 ? Math.round((category.monthSpent / category.allocated) * 100) : 0
                const accent = category.iconColor || category.color || '#78d89c'
                const fillPercent = Math.max(0, 100 - Math.max(0, Math.min(usage, 100)))

                return (
                  <View key={category.id} style={styles.categoryRowWrap}>
                    <TouchableOpacity
                      style={styles.categoryCard}
                      activeOpacity={0.88}
                      onPress={() => setSelectedCategory(category)}
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
                      onPress={() => setSelectedCategory(category)}
                    >
                      <Ionicons name="settings-outline" size={16} color="rgba(197,212,255,0.88)" />
                    </TouchableOpacity>
                  </View>
                )
              })}
            </ScrollView>

            <TouchableOpacity style={styles.addButton} activeOpacity={0.9}>
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
      </View>
    </Modal>
  )
}

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
})
