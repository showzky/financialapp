import React, { useMemo, useState } from 'react'
import { FlatList, Image, LayoutAnimation, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { OptionPickerSheet, type PickerOption } from '../OptionPickerSheet'
import { resolveGroupedActiveListPreview } from './activePreview'
import {
  DEFAULT_WISHLIST_SORT_OPTION,
  isWishlistSortOption,
  type WishlistCategoryDisplayPreference,
  type WishlistPlanItem,
  type WishlistSortOption,
} from './types'

type WishlistGroup = {
  key: string
  name: string
  category: WishlistPlanItem['category']
  total: number
  items: WishlistPlanItem[]
}

type Props = {
  items: WishlistPlanItem[]
  onPressItem: (item: WishlistPlanItem) => void
  activeExpanded: boolean
  onToggleActiveExpanded: () => void
  categoryPreferences: Record<string, WishlistCategoryDisplayPreference>
  onSetCategoryCollapsed: (categoryKey: string, collapsed: boolean) => void
  onSetCategorySort: (categoryKey: string, sort: WishlistSortOption) => void
  onAddWishInCategory: (category: WishlistPlanItem['category']) => void
}

type CategorySheetShellProps = {
  visible: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
}

function formatKr(value: number) {
  return `KR ${value.toLocaleString('nb-NO')}`
}

function formatDomain(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, '')
  } catch {
    return value
  }
}

function resolveItemProgress(item: WishlistPlanItem) {
  if (item.price <= 0) {
    return item.savedAmount > 0 ? 1 : 0
  }

  return Math.min(item.savedAmount / item.price, 1)
}

function resolveItemLeft(item: WishlistPlanItem) {
  return Math.max(item.price - item.savedAmount, 0)
}

function isFulfilledWishlistItem(item: WishlistPlanItem) {
  return item.price > 0 && item.savedAmount >= item.price
}

function resolveTimestamp(value: string) {
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function resolveSortLabel(value: WishlistSortOption) {
  switch (value) {
    case 'closest-funded':
      return 'Closest to funded'
    case 'highest-price':
      return 'Highest price'
    case 'lowest-left':
      return 'Lowest left'
    case 'newest':
    default:
      return 'Newest added'
  }
}

function compareNumbers(left: number, right: number) {
  return left - right
}

function sortWishlistItems(items: readonly WishlistPlanItem[], sort: WishlistSortOption) {
  const nextItems = [...items]

  nextItems.sort((left, right) => {
    const leftProgress = resolveItemProgress(left)
    const rightProgress = resolveItemProgress(right)
    const leftRemaining = resolveItemLeft(left)
    const rightRemaining = resolveItemLeft(right)

    switch (sort) {
      case 'closest-funded': {
        return (
          compareNumbers(rightProgress, leftProgress) ||
          compareNumbers(leftRemaining, rightRemaining) ||
          compareNumbers(resolveTimestamp(right.date), resolveTimestamp(left.date))
        )
      }
      case 'highest-price': {
        return (
          compareNumbers(right.price, left.price) ||
          compareNumbers(rightProgress, leftProgress) ||
          compareNumbers(resolveTimestamp(right.date), resolveTimestamp(left.date))
        )
      }
      case 'lowest-left': {
        return (
          compareNumbers(leftRemaining, rightRemaining) ||
          compareNumbers(rightProgress, leftProgress) ||
          compareNumbers(resolveTimestamp(right.date), resolveTimestamp(left.date))
        )
      }
      case 'newest':
      default:
        return compareNumbers(resolveTimestamp(right.date), resolveTimestamp(left.date))
    }
  })

  return nextItems
}

function resolveWishlistGroupInsights(group: WishlistGroup) {
  const savedTotal = group.items.reduce((sum, item) => sum + item.savedAmount, 0)
  const leftTotal = group.items.reduce((sum, item) => sum + resolveItemLeft(item), 0)
  const averageProgress = group.items.length === 0
    ? 0
    : group.items.reduce((sum, item) => sum + resolveItemProgress(item), 0) / group.items.length

  return {
    savedTotal,
    leftTotal,
    averageProgress,
    itemCount: group.items.length,
  }
}

function animateLayoutChanges() {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
}

function CategorySheetShell({ visible, title, subtitle, onClose, children }: CategorySheetShellProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheetWrap}>
          <LinearGradient colors={['#1A1928', '#0D0D18']} style={StyleSheet.absoluteFillObject} />

          <View style={styles.sheetHandleArea}>
            <View style={styles.sheetHandle} />
          </View>

          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderCopy}>
              <Text style={styles.sheetTitle}>{title}</Text>
              {subtitle ? <Text style={styles.sheetSubtitle}>{subtitle}</Text> : null}
            </View>

            <TouchableOpacity style={styles.sheetCloseButton} activeOpacity={0.85} onPress={onClose}>
              <Ionicons name="close" size={18} color="rgba(240,244,252,0.62)" />
            </TouchableOpacity>
          </View>

          <View style={styles.sheetBody}>{children}</View>
        </View>
      </View>
    </Modal>
  )
}

const SORT_OPTIONS: PickerOption[] = [
  {
    value: 'closest-funded',
    label: 'Closest to funded',
    hint: 'Show the wishes nearest completion first.',
  },
  {
    value: 'highest-price',
    label: 'Highest price',
    hint: 'Keep the largest targets at the top.',
  },
  {
    value: 'lowest-left',
    label: 'Lowest left',
    hint: 'Prioritize the wishes you can finish sooner.',
  },
  {
    value: 'newest',
    label: 'Newest added',
    hint: 'Keep the latest wishes at the top.',
  },
]

const FULFILLED_CARD_WIDTH = 164

function FulfilledMiniCard({
  item,
  onPress,
}: {
  item: WishlistPlanItem
  onPress: () => void
}) {
  const domain = item.productUrl ? formatDomain(item.productUrl) : null

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={{ width: FULFILLED_CARD_WIDTH }}>
      <LinearGradient
        colors={['rgba(16,185,129,0.22)', 'rgba(16,185,129,0.08)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fCard}
      >
        <View style={styles.fCardTopRow}>
          <View style={styles.fImageWrap}>
            {item.imageUri ? (
              <Image source={{ uri: item.imageUri }} style={styles.fProductImage} resizeMode="cover" />
            ) : (
              <View style={styles.fImageFallback}>
                <Ionicons name="bag-handle-outline" size={16} color="#A7F3D0" />
              </View>
            )}
          </View>
          <Ionicons name="checkmark-circle" size={18} color="#34D399" />
        </View>

        <Text style={styles.fCardTitle} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.fCardPrice}>{formatKr(item.price)}</Text>

        <View style={styles.fProgressTrack}>
          <View style={styles.fProgressFill} />
        </View>

        <View style={styles.fBottomRow}>
          {domain ? (
            <View style={styles.fDomainBadge}>
              <Ionicons name="globe-outline" size={10} color="rgba(167,243,208,0.9)" />
              <Text style={styles.fDomainText} numberOfLines={1}>{domain}</Text>
            </View>
          ) : null}
          <Text style={styles.fReadyText}>Ready to buy</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
}

export function WishlistOverview({
  items,
  onPressItem,
  activeExpanded,
  onToggleActiveExpanded,
  categoryPreferences,
  onSetCategoryCollapsed,
  onSetCategorySort,
  onAddWishInCategory,
}: Props) {
  const totalLeft = useMemo(
    () => items.reduce((sum, item) => sum + resolveItemLeft(item), 0),
    [items],
  )

  const activeItems = useMemo(
    () => items.filter((item) => !isFulfilledWishlistItem(item)),
    [items],
  )
  const fulfilledItems = useMemo(
    () => items.filter(isFulfilledWishlistItem),
    [items],
  )
  const fulfilledTotal = useMemo(
    () => fulfilledItems.reduce((sum, item) => sum + item.price, 0),
    [fulfilledItems],
  )

  const grouped = useMemo(() => {
    const map = new Map<string, WishlistGroup>()

    activeItems.forEach((item) => {
      const key = item.category?.id ?? 'uncategorized'
      const name = item.category?.name ?? 'Active'
      const existing = map.get(key)
      if (existing) {
        existing.total += item.price
        existing.items.push(item)
        return
      }
      map.set(key, {
        key,
        name,
        category: item.category,
        total: item.price,
        items: [item],
      })
    })

    return Array.from(map.values()).map((group) => ({
      ...group,
      items: sortWishlistItems(
        group.items,
        categoryPreferences[group.key]?.sort ?? DEFAULT_WISHLIST_SORT_OPTION,
      ),
    }))
  }, [activeItems, categoryPreferences])

  const activePreview = useMemo(
    () => resolveGroupedActiveListPreview<WishlistPlanItem, WishlistGroup>(grouped, activeExpanded),
    [activeExpanded, grouped],
  )

  const collapsedVisibleCategoryCount = useMemo(
    () => activePreview.visibleGroups.reduce(
      (sum, group) => sum + ((categoryPreferences[group.key]?.collapsed ?? false) ? 1 : 0),
      0,
    ),
    [activePreview.visibleGroups, categoryPreferences],
  )

  const activeToggleTitle = activePreview.showAllItems
    ? 'Show less'
    : `Show ${activePreview.hiddenCount} more`

  const collapsedCategoryNote = collapsedVisibleCategoryCount > 0
    ? ` • ${collapsedVisibleCategoryCount} ${collapsedVisibleCategoryCount === 1 ? 'category' : 'categories'} collapsed`
    : ''

  const activeToggleSub = activePreview.showAllItems
    ? `${activePreview.totalCount} active wishes visible${collapsedCategoryNote}`
    : `Showing ${activePreview.visibleCount} of ${activePreview.totalCount} active wishes${collapsedCategoryNote}`

  const [fulfilledOpen, setFulfilledOpen] = useState(false)
  const [menuGroupKey, setMenuGroupKey] = useState<string | null>(null)
  const [sortGroupKey, setSortGroupKey] = useState<string | null>(null)
  const [insightsGroupKey, setInsightsGroupKey] = useState<string | null>(null)

  const selectedMenuGroup = useMemo(
    () => grouped.find((group) => group.key === menuGroupKey) ?? null,
    [grouped, menuGroupKey],
  )
  const selectedSortGroup = useMemo(
    () => grouped.find((group) => group.key === sortGroupKey) ?? null,
    [grouped, sortGroupKey],
  )
  const selectedInsightsGroup = useMemo(
    () => grouped.find((group) => group.key === insightsGroupKey) ?? null,
    [grouped, insightsGroupKey],
  )

  const selectedMenuGroupPreference = selectedMenuGroup
    ? categoryPreferences[selectedMenuGroup.key]
    : undefined
  const selectedMenuGroupCollapsed = selectedMenuGroupPreference?.collapsed ?? false

  const selectedInsights = selectedInsightsGroup
    ? resolveWishlistGroupInsights(selectedInsightsGroup)
    : null

  return (
    <View style={styles.wrap}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total left</Text>
          <Text style={styles.summaryValue}>{formatKr(totalLeft)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Fulfilled Goals</Text>
          <Text style={styles.summaryValue}>{fulfilledItems.length}/{items.length}</Text>
        </View>
      </View>

      {activePreview.visibleGroups.map((group) => (
        <View key={group.key} style={styles.group}>
          <View style={styles.groupHeader}>
            <View>
              <View style={styles.groupFilterRow}>
                <Ionicons name="funnel-outline" size={14} color="rgba(240,244,252,0.52)" />
                <Text style={styles.groupName}>{group.name}</Text>
              </View>
              <View style={styles.groupTotalRow}>
                <Ionicons name="sparkles-outline" size={12} color="rgba(233,239,250,0.48)" />
                <Text style={styles.groupMeta}>{formatKr(group.total)}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.groupDots}
              activeOpacity={0.85}
              onPress={() => setMenuGroupKey(group.key)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${group.name} category actions`}
            >
              <Ionicons name="ellipsis-vertical" size={16} color="rgba(240,244,252,0.52)" />
            </TouchableOpacity>
          </View>

          {(categoryPreferences[group.key]?.collapsed ?? false) ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onSetCategoryCollapsed(group.key, false)}
              style={styles.collapsedGroupCard}
              accessibilityRole="button"
              accessibilityLabel={`Expand ${group.name} category`}
            >
              <View style={styles.collapsedGroupCopy}>
                <Text style={styles.collapsedGroupTitle}>
                  {`${group.items.length} ${group.items.length === 1 ? 'wish' : 'wishes'} hidden`}
                </Text>
                <Text style={styles.collapsedGroupSub}>{`${formatKr(group.total)} total • Tap to expand`}</Text>
              </View>
              <Ionicons name="chevron-down" size={16} color="rgba(240,244,252,0.52)" />
            </TouchableOpacity>
          ) : group.items.map((item) => {
            const progress = resolveItemProgress(item)
            const left = resolveItemLeft(item)
            const domain = item.productUrl ? formatDomain(item.productUrl) : null

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.9}
                onPress={() => onPressItem(item)}
              >
                <LinearGradient
                  colors={['rgba(151,37,115,0.95)', 'rgba(126,15,81,0.95)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.card}
                >
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardIdentity}>
                      <View style={styles.imageWrap}>
                        {item.imageUri ? (
                          <Image source={{ uri: item.imageUri }} style={styles.productImage} resizeMode="cover" />
                        ) : (
                          <View style={styles.imageFallback}>
                            <Ionicons name="bag-handle-outline" size={20} color="#FFF1FB" />
                          </View>
                        )}
                      </View>
                      <View style={styles.cardCopy}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.cardSubtitle} numberOfLines={1}>
                          {item.notes || domain || 'Wish item'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.cardPrice}>{formatKr(item.price)}</Text>
                  </View>

                  <View style={styles.progressRow}>
                    <Text style={styles.bottomMetric}>{formatKr(item.savedAmount)}</Text>
                    <Text style={styles.bottomMetric}>{`${Math.round(progress * 100)} %`}</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.max(progress * 100, 3)}%` }]} />
                  </View>
                  <View style={styles.bottomRow}>
                    <View style={styles.domainBadge}>
                      <Ionicons name="globe-outline" size={12} color="rgba(255,243,250,0.9)" />
                      <Text style={styles.domainText} numberOfLines={1}>{domain ?? 'No product link'}</Text>
                    </View>
                    <Text style={styles.leftText}>{`Left: ${formatKr(left)}`}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )
          })}
        </View>
      ))}

      {activePreview.hasOverflow ? (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onToggleActiveExpanded}
          style={styles.activeToggle}
          accessibilityRole="button"
          accessibilityState={{ expanded: activePreview.showAllItems }}
          accessibilityLabel={
            activePreview.showAllItems
              ? 'Show fewer active wishlist items'
              : `Show ${activePreview.hiddenCount} more active wishlist items`
          }
        >
          <View style={styles.activeToggleLeft}>
            <View style={styles.activeToggleBadge}>
              <Text style={styles.activeToggleBadgeText}>
                {activePreview.showAllItems ? activePreview.totalCount : `+${activePreview.hiddenCount}`}
              </Text>
            </View>
            <View style={styles.activeToggleCopy}>
              <Text style={styles.activeToggleTitle}>{activeToggleTitle}</Text>
              <Text style={styles.activeToggleSub}>{activeToggleSub}</Text>
            </View>
          </View>
          <Ionicons
            name={activePreview.showAllItems ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="rgba(240,244,252,0.52)"
          />
        </TouchableOpacity>
      ) : null}

      {/* Fulfilled — collapsible to prevent clutter */}
      {fulfilledItems.length > 0 ? (
        <View style={styles.fulfilledSection}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              animateLayoutChanges()
              setFulfilledOpen((v) => !v)
            }}
            style={styles.fulfilledToggle}
          >
            <View style={styles.fulfilledToggleLeft}>
              <View style={styles.fulfilledBadge}>
                <Ionicons name="checkmark-done" size={13} color="#34D399" />
                <Text style={styles.fulfilledBadgeText}>{fulfilledItems.length}</Text>
              </View>
              <View>
                <Text style={styles.fulfilledToggleTitle}>Fulfilled</Text>
                <Text style={styles.fulfilledToggleSub}>{formatKr(fulfilledTotal)} ready to purchase</Text>
              </View>
            </View>
            <Ionicons
              name={fulfilledOpen ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="rgba(240,244,252,0.45)"
            />
          </TouchableOpacity>

          {fulfilledOpen ? (
            <FlatList
              data={fulfilledItems}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.fScrollContent}
              renderItem={({ item }) => (
                <FulfilledMiniCard item={item} onPress={() => onPressItem(item)} />
              )}
            />
          ) : null}
        </View>
      ) : null}

      <CategorySheetShell
        visible={Boolean(selectedMenuGroup)}
        title={selectedMenuGroup?.name ?? 'Category actions'}
        subtitle={
          selectedMenuGroup
            ? `${selectedMenuGroup.items.length} active ${selectedMenuGroup.items.length === 1 ? 'wish' : 'wishes'} • ${formatKr(selectedMenuGroup.total)}`
            : undefined
        }
        onClose={() => setMenuGroupKey(null)}
      >
        <View style={styles.sheetActionList}>
          <TouchableOpacity
            style={[styles.sheetActionRow, styles.sheetActionRowBorder]}
            activeOpacity={0.85}
            onPress={() => {
              const category = selectedMenuGroup?.category ?? null
              setMenuGroupKey(null)
              onAddWishInCategory(category)
            }}
          >
            <Ionicons name="add-circle-outline" size={18} color="#F3F7FF" />
            <View style={styles.sheetActionCopy}>
              <Text style={styles.sheetActionTitle}>Add wish in this category</Text>
              <Text style={styles.sheetActionHint}>Open the create flow with this category preselected.</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sheetActionRow, styles.sheetActionRowBorder]}
            activeOpacity={0.85}
            onPress={() => {
              if (!selectedMenuGroup) return
              setSortGroupKey(selectedMenuGroup.key)
              setMenuGroupKey(null)
            }}
          >
            <Ionicons name="swap-vertical-outline" size={18} color="#F3F7FF" />
            <View style={styles.sheetActionCopy}>
              <Text style={styles.sheetActionTitle}>Sort wishes</Text>
              <Text style={styles.sheetActionHint}>Reorder the wishes inside this category.</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sheetActionRow, styles.sheetActionRowBorder]}
            activeOpacity={0.85}
            onPress={() => {
              if (!selectedMenuGroup) return
              setInsightsGroupKey(selectedMenuGroup.key)
              setMenuGroupKey(null)
            }}
          >
            <Ionicons name="stats-chart-outline" size={18} color="#F3F7FF" />
            <View style={styles.sheetActionCopy}>
              <Text style={styles.sheetActionTitle}>Category insights</Text>
              <Text style={styles.sheetActionHint}>Review progress, saved amount, and remaining total.</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sheetActionRow}
            activeOpacity={0.85}
            onPress={() => {
              if (!selectedMenuGroup) return
              onSetCategoryCollapsed(
                selectedMenuGroup.key,
                !selectedMenuGroupCollapsed,
              )
              setMenuGroupKey(null)
            }}
          >
            <Ionicons
              name={selectedMenuGroupCollapsed ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color="#F3F7FF"
            />
            <View style={styles.sheetActionCopy}>
              <Text style={styles.sheetActionTitle}>
                {selectedMenuGroupCollapsed ? 'Expand this category' : 'Collapse this category'}
              </Text>
              <Text style={styles.sheetActionHint}>Keep the header visible while hiding the category cards.</Text>
            </View>
          </TouchableOpacity>
        </View>
      </CategorySheetShell>

      <OptionPickerSheet
        visible={Boolean(selectedSortGroup)}
        title={selectedSortGroup ? `Sort ${selectedSortGroup.name}` : 'Sort wishes'}
        options={SORT_OPTIONS}
        selectedValue={selectedSortGroup ? (categoryPreferences[selectedSortGroup.key]?.sort ?? DEFAULT_WISHLIST_SORT_OPTION) : DEFAULT_WISHLIST_SORT_OPTION}
        onSelect={(value) => {
          if (!selectedSortGroup || !isWishlistSortOption(value)) return
          onSetCategorySort(selectedSortGroup.key, value)
        }}
        onClose={() => setSortGroupKey(null)}
      />

      <CategorySheetShell
        visible={Boolean(selectedInsights)}
        title={selectedInsightsGroup ? `${selectedInsightsGroup.name} insights` : 'Category insights'}
        subtitle={selectedInsightsGroup ? `Sorted by ${resolveSortLabel(categoryPreferences[selectedInsightsGroup.key]?.sort ?? DEFAULT_WISHLIST_SORT_OPTION)}` : undefined}
        onClose={() => setInsightsGroupKey(null)}
      >
        {selectedInsights ? (
          <View style={styles.insightsGrid}>
            <View style={styles.insightCard}>
              <Text style={styles.insightLabel}>Active wishes</Text>
              <Text style={styles.insightValue}>{selectedInsights.itemCount}</Text>
            </View>
            <View style={styles.insightCard}>
              <Text style={styles.insightLabel}>Saved so far</Text>
              <Text style={styles.insightValue}>{formatKr(selectedInsights.savedTotal)}</Text>
            </View>
            <View style={styles.insightCard}>
              <Text style={styles.insightLabel}>Total left</Text>
              <Text style={styles.insightValue}>{formatKr(selectedInsights.leftTotal)}</Text>
            </View>
            <View style={styles.insightCard}>
              <Text style={styles.insightLabel}>Average progress</Text>
              <Text style={styles.insightValue}>{`${Math.round(selectedInsights.averageProgress * 100)} %`}</Text>
            </View>
          </View>
        ) : null}
      </CategorySheetShell>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 18, gap: 18 },
  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryCard: {
    flex: 1,
    minHeight: 78,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  summaryLabel: { color: 'rgba(235,240,248,0.46)', fontSize: 12, fontFamily: 'DMSans_600SemiBold' },
  summaryValue: { marginTop: 8, color: '#F4F7FB', fontSize: 28, fontFamily: 'DMSerifDisplay_400Regular' },
  group: { gap: 10 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  groupFilterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupTotalRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 6 },
  groupName: { color: '#EAF0FA', fontSize: 16, textTransform: 'lowercase', fontFamily: 'DMSans_700Bold' },
  groupMeta: { marginTop: 4, color: 'rgba(233,239,250,0.72)', fontSize: 14, fontFamily: 'DMSans_600SemiBold' },
  groupDots: {
    width: 34,
    height: 34,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  collapsedGroupCard: {
    minHeight: 60,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  collapsedGroupCopy: {
    flex: 1,
  },
  collapsedGroupTitle: {
    color: '#F2F6FD',
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
  collapsedGroupSub: {
    marginTop: 2,
    color: 'rgba(233,239,250,0.58)',
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
  },
  card: {
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  cardIdentity: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  imageWrap: { width: 64, height: 64, borderRadius: 18, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.12)' },
  productImage: { width: '100%', height: '100%' },
  imageFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardCopy: { flex: 1, gap: 3 },
  cardTitle: { color: '#FFF5FC', fontSize: 16, fontFamily: 'DMSans_700Bold' },
  cardSubtitle: { color: 'rgba(255,240,249,0.64)', fontSize: 12, fontFamily: 'DMSans_500Medium' },
  cardPrice: { color: '#FFF8FC', fontSize: 19, fontFamily: 'DMSans_700Bold' },
  progressRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bottomMetric: { color: '#FFEAF7', fontSize: 13, fontFamily: 'DMSans_700Bold' },
  progressTrack: {
    marginTop: 8,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: '#FFF3FA' },
  bottomRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  domainBadge: { maxWidth: 160, minHeight: 28, borderRadius: 14, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.12)' },
  domainText: { flexShrink: 1, color: 'rgba(255,233,246,0.9)', fontSize: 12, fontFamily: 'DMSans_700Bold' },
  leftText: { color: '#FFF5FC', fontSize: 12, fontFamily: 'DMSans_700Bold' },
  activeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  activeToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  activeToggleBadge: {
    minWidth: 34,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  activeToggleBadgeText: {
    color: '#FFF5FC',
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'DMSans_700Bold',
  },
  activeToggleCopy: { flex: 1 },
  activeToggleTitle: { color: '#FFF5FC', fontSize: 14, fontFamily: 'DMSans_700Bold' },
  activeToggleSub: {
    color: 'rgba(255,240,249,0.64)',
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    marginTop: 1,
  },
  fulfilledSection: {
    gap: 12,
  },
  // fulfilled collapsible toggle bar
  fulfilledToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.18)',
    backgroundColor: 'rgba(16,185,129,0.07)',
  },
  fulfilledToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fulfilledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  fulfilledBadgeText: {
    color: '#34D399',
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
  },
  fulfilledToggleTitle: {
    color: '#A7F3D0',
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
  fulfilledToggleSub: {
    color: 'rgba(167,243,208,0.6)',
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    marginTop: 1,
  },
  fScrollContent: { gap: 12, paddingRight: 4 },
  fCard: {
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.16)',
    gap: 6,
  },
  fCardTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  fImageWrap: { width: 40, height: 40, borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(16,185,129,0.12)' },
  fProductImage: { width: '100%', height: '100%' },
  fImageFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fCardTitle: { color: '#E0FFF0', fontSize: 13, fontFamily: 'DMSans_700Bold' },
  fCardPrice: { color: '#34D399', fontSize: 16, fontFamily: 'DMSerifDisplay_400Regular' },
  fProgressTrack: { height: 4, borderRadius: 999, backgroundColor: 'rgba(16,185,129,0.16)', overflow: 'hidden' },
  fProgressFill: { width: '100%', height: '100%', borderRadius: 999, backgroundColor: '#34D399' },
  fBottomRow: { marginTop: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  fDomainBadge: { maxWidth: 80, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(16,185,129,0.10)' },
  fDomainText: { flexShrink: 1, color: 'rgba(167,243,208,0.8)', fontSize: 10, fontFamily: 'DMSans_600SemiBold' },
  fReadyText: { color: '#34D399', fontSize: 11, fontFamily: 'DMSans_700Bold' },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
  sheetWrap: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sheetHandleArea: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  sheetHeaderCopy: {
    flex: 1,
  },
  sheetTitle: {
    color: '#F4F7FB',
    fontSize: 22,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  sheetSubtitle: {
    marginTop: 4,
    color: 'rgba(233,239,250,0.58)',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'DMSans_500Medium',
  },
  sheetCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  sheetBody: {
    paddingHorizontal: 18,
    paddingBottom: 26,
  },
  sheetActionList: {
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  sheetActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  sheetActionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  sheetActionCopy: {
    flex: 1,
  },
  sheetActionTitle: {
    color: '#F4F7FB',
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
  },
  sheetActionHint: {
    marginTop: 2,
    color: 'rgba(233,239,250,0.54)',
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'DMSans_500Medium',
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  insightCard: {
    width: '48%',
    minHeight: 92,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  insightLabel: {
    color: 'rgba(233,239,250,0.54)',
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
  },
  insightValue: {
    marginTop: 10,
    color: '#F4F7FB',
    fontSize: 18,
    lineHeight: 22,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
})
