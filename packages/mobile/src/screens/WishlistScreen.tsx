// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { wishlistApi, type WishlistItem } from '../services/wishlistApi'
import { ScreenHero } from '../components/ScreenHero'
import { WishlistItemSheet } from '../components/WishlistItemSheet'
import { WishlistPurchaseSheet } from '../components/WishlistPurchaseSheet'
import { WishlistDepositSheet } from '../components/WishlistDepositSheet'
import { getWishlistProgressSnapshot } from '../shared'
import { screenThemes } from '../theme/screenThemes'

type WishlistStatusFilter = 'active' | 'purchased'

const formatNok = (value: number) => `NOK ${value.toLocaleString('nb-NO')}`

const getCategoryTone = (category?: string | null) => {
  const normalized = category?.trim().toLowerCase()

  if (normalized === 'technology' || normalized === 'tech') {
    return {
      backgroundColor: '#dbeafe',
      textColor: '#3b82f6',
    }
  }

  if (normalized === 'clothing' || normalized === 'fashion') {
    return {
      backgroundColor: '#fce7f3',
      textColor: '#db2777',
    }
  }

  return {
    backgroundColor: '#ffedd5',
    textColor: '#ea580c',
  }
}

export function WishlistScreen() {
  const theme = screenThemes.wishlist
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState<WishlistStatusFilter>('active')
  const [isItemSheetOpen, setIsItemSheetOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null)
  const [purchaseSheetItem, setPurchaseSheetItem] = useState<WishlistItem | null>(null)
  const [depositSheetItem, setDepositSheetItem] = useState<WishlistItem | null>(null)
  const [pendingActionItemId, setPendingActionItemId] = useState<string | null>(null)

  const loadWishlist = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await wishlistApi.list()
      setItems(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load wishlist'
      setError(message)
      console.error('Error loading wishlist:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadWishlist()
  }, [])

  const mergeSavedItem = (savedItem: WishlistItem) => {
    setItems((currentItems) => {
      const exists = currentItems.some((currentItem) => currentItem.id === savedItem.id)

      if (!exists) {
        return [savedItem, ...currentItems]
      }

      return currentItems.map((currentItem) =>
        currentItem.id === savedItem.id ? savedItem : currentItem,
      )
    })
  }

  const openAddItemSheet = () => {
    setEditingItem(null)
    setIsItemSheetOpen(true)
  }

  const openEditItemSheet = (item: WishlistItem) => {
    setEditingItem(item)
    setIsItemSheetOpen(true)
  }

  const closeItemSheet = () => {
    setIsItemSheetOpen(false)
    setEditingItem(null)
  }

  const closePurchaseSheet = () => {
    if (!pendingActionItemId) {
      setPurchaseSheetItem(null)
    }
  }

  const closeDepositSheet = () => {
    if (!pendingActionItemId) {
      setDepositSheetItem(null)
    }
  }

  const activeCount = items.filter((item) => !item.purchased).length
  const purchasedCount = items.filter((item) => item.purchased).length
  const activeRemainingTotal = items
    .filter((item) => !item.purchased)
    .reduce((sum, item) => sum + (item.price || 0), 0)
  const purchasedTotal = items
    .filter((item) => item.purchased)
    .reduce((sum, item) => sum + (item.purchasedAmount ?? item.price ?? 0), 0)

  const itemsInSelectedStatus = useMemo(
    () => items.filter((item) => item.purchased === (selectedStatus === 'purchased')),
    [items, selectedStatus],
  )

  const categories = useMemo(
    () => [
      'All',
      ...Array.from(
        new Set(
          itemsInSelectedStatus
            .map((item) => item.category?.trim())
            .filter((category): category is string => Boolean(category)),
        ),
      ),
    ],
    [itemsInSelectedStatus],
  )

  useEffect(() => {
    if (!categories.includes(selectedCategory)) {
      setSelectedCategory('All')
    }
  }, [categories, selectedCategory])

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'All') {
      return itemsInSelectedStatus
    }

    return itemsInSelectedStatus.filter((item) => item.category?.trim() === selectedCategory)
  }, [itemsInSelectedStatus, selectedCategory])

  const handleMarkPurchased = async (item: WishlistItem, purchasedAmount?: number) => {
    try {
      setPendingActionItemId(item.id)
      const updatedItem = await wishlistApi.markPurchased(item.id, purchasedAmount)
      mergeSavedItem(updatedItem)
      setError(null)
      setPurchaseSheetItem(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not move item to purchased archive')
    } finally {
      setPendingActionItemId(null)
    }
  }

  const handleRestorePurchased = async (item: WishlistItem) => {
    try {
      setPendingActionItemId(item.id)
      const updatedItem = await wishlistApi.restorePurchased(item.id)
      mergeSavedItem(updatedItem)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not restore purchased item')
    } finally {
      setPendingActionItemId(null)
    }
  }

  const handleAddFunds = async (item: WishlistItem, amount: number) => {
    try {
      setPendingActionItemId(item.id)
      const updatedItem = await wishlistApi.update(item.id, {
        savedAmount: Math.max(0, item.savedAmount + amount),
      })
      mergeSavedItem(updatedItem)
      setError(null)
      setDepositSheetItem(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update saved amount')
    } finally {
      setPendingActionItemId(null)
    }
  }

  const handleStatusPress = async (item: WishlistItem) => {
    if (pendingActionItemId) {
      return
    }

    if (item.purchased) {
      await handleRestorePurchased(item)
      return
    }

    if (item.price === null || item.price <= 0) {
      setPurchaseSheetItem(item)
      return
    }

    await handleMarkPurchased(item, item.price)
  }

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.screenBackground }]}> 
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading wishlist...</Text>
      </View>
    )
  }

  if (error && items.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.screenBackground }]}> 
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => void loadWishlist()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: theme.screenBackground }]}>
        <ScreenHero
          eyebrow="Collection"
          title="Wishlist"
          subtitle={
            selectedStatus === 'active'
              ? `${filteredItems.length} active item${filteredItems.length === 1 ? '' : 's'}`
              : `${filteredItems.length} purchased item${filteredItems.length === 1 ? '' : 's'}`
          }
          theme={theme.hero}
          actions={
            <TouchableOpacity
              style={[
                styles.heroAction,
                {
                  backgroundColor: theme.actionSurface,
                  borderColor: theme.actionBorder,
                },
              ]}
              activeOpacity={0.85}
              onPress={openAddItemSheet}
            >
              <Ionicons name="add" size={18} color={theme.actionText} />
            </TouchableOpacity>
          }
        >
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{selectedStatus === 'active' ? activeCount : purchasedCount}</Text>
              <Text style={styles.heroStatLabel}>{selectedStatus === 'active' ? 'Active list' : 'Purchased archive'}</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{selectedStatus === 'active' ? purchasedCount : activeCount}</Text>
              <Text style={styles.heroStatLabel}>{selectedStatus === 'active' ? 'Purchased archive' : 'Active list'}</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>
                {formatNok(selectedStatus === 'active' ? activeRemainingTotal : purchasedTotal)}
              </Text>
              <Text style={styles.heroStatLabel}>{selectedStatus === 'active' ? 'Remaining' : 'Purchased total'}</Text>
            </View>
          </View>
        </ScreenHero>

        <View style={styles.content}>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.segmentButton, selectedStatus === 'active' && styles.segmentButtonActive]}
              onPress={() => setSelectedStatus('active')}
              activeOpacity={0.85}
            >
              <Text style={[styles.segmentButtonText, selectedStatus === 'active' && styles.segmentButtonTextActive]}>
                Active ({activeCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentButton, selectedStatus === 'purchased' && styles.segmentButtonActive]}
              onPress={() => setSelectedStatus('purchased')}
              activeOpacity={0.85}
            >
              <Text style={[styles.segmentButtonText, selectedStatus === 'purchased' && styles.segmentButtonTextActive]}>
                Purchased ({purchasedCount})
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {categories.map((category) => {
              const isActive = category === selectedCategory

              return (
                <TouchableOpacity
                  key={category}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setSelectedCategory(category)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          <Text style={styles.resultsMeta}>
            {filteredItems.length} item{filteredItems.length === 1 ? '' : 's'} in {selectedStatus === 'active' ? 'active' : 'purchased'} view
          </Text>

          {error ? <Text style={styles.inlineErrorText}>{error}</Text> : null}

          {filteredItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name={selectedStatus === 'active' ? 'heart-outline' : 'archive-outline'}
                size={48}
                color="#d1d5db"
              />
              <Text style={styles.emptyText}>
                {selectedStatus === 'active'
                  ? 'No active wishlist items in this category'
                  : 'No purchased items in this category'}
              </Text>
            </View>
          ) : (
            <View style={styles.itemsList}>
              {filteredItems.map((item) => {
                const tone = getCategoryTone(item.category)
                const isPending = pendingActionItemId === item.id
                const progress = getWishlistProgressSnapshot(item.savedAmount, item.price)
                const actionLabel = item.purchased ? 'Restore' : progress.isReadyToBuy ? 'Purchase' : 'Add Funds'

                return (
                  <View key={item.id} style={[styles.itemCard, item.purchased && styles.itemCardPurchased]}>
                    <View style={styles.itemTopRow}>
                      <View style={styles.itemMediaWrap}>
                        {item.imageUrl ? (
                          <Image
                            source={{ uri: item.imageUrl }}
                            style={[styles.itemImage, item.purchased && styles.itemImagePurchased]}
                            resizeMode="contain"
                          />
                        ) : (
                          <View style={styles.placeholderMedia}>
                            <Ionicons name="image-outline" size={26} color="#cbd5e1" />
                          </View>
                        )}
                      </View>

                      <View style={styles.itemMain}>
                        <View style={styles.itemHeaderRow}>
                          {item.category ? (
                            <View style={[styles.categoryBadge, { backgroundColor: tone.backgroundColor }]}> 
                              <Text style={[styles.categoryText, { color: tone.textColor }]}>{item.category}</Text>
                            </View>
                          ) : null}

                          <View style={[styles.statusPill, item.purchased ? styles.statusPillPurchased : styles.statusPillActive]}>
                            <Text style={[styles.statusPillText, item.purchased ? styles.statusPillTextPurchased : styles.statusPillTextActive]}>
                              {item.purchased ? 'Purchased' : item.priority}
                            </Text>
                          </View>
                        </View>

                        <Text style={[styles.itemTitle, item.purchased && styles.itemPurchasedText]}>
                          {item.title}
                        </Text>

                        {item.price ? (
                          <Text style={[styles.priceValue, item.purchased && styles.itemPurchasedPrice]}>
                            {formatNok(item.price)}
                          </Text>
                        ) : (
                          <Text style={styles.mutedValue}>No price yet</Text>
                        )}
                      </View>

                      <TouchableOpacity
                        style={[styles.statusButton, item.purchased && styles.statusButtonPurchased]}
                        onPress={() =>
                          void (item.purchased
                            ? handleRestorePurchased(item)
                            : progress.isReadyToBuy
                              ? handleStatusPress(item)
                              : setDepositSheetItem(item))
                        }
                        activeOpacity={0.85}
                        disabled={isPending}
                      >
                        {isPending ? (
                          <ActivityIndicator size="small" color={item.purchased ? '#16a34a' : '#2563eb'} />
                        ) : (
                          <Ionicons
                            name={item.purchased ? 'arrow-undo-outline' : progress.isReadyToBuy ? 'cart-outline' : 'add'}
                            size={18}
                            color={item.purchased ? '#16a34a' : '#2563eb'}
                          />
                        )}
                      </TouchableOpacity>
                    </View>

                    {!item.purchased ? (
                      <View style={styles.progressWrap}>
                        {progress.hasTargetPrice ? (
                          <>
                            <View style={styles.progressMetaRow}>
                              <Text style={styles.progressMetaText}>Saved {formatNok(progress.savedAmount)}</Text>
                              <Text style={styles.progressMetaText}>{progress.roundedProgressPercent}%</Text>
                            </View>
                            <View style={styles.progressTrack}>
                              <View
                                style={[
                                  styles.progressFill,
                                  progress.isReadyToBuy && styles.progressFillReady,
                                  { width: `${progress.progressPercent}%` },
                                ]}
                              />
                            </View>
                            <Text style={styles.progressHint}>
                              {progress.isReadyToBuy
                                ? 'Ready to mark as purchased.'
                                : `Add ${formatNok(progress.remainingAmountToTarget ?? 0)} more to mark purchased.`}
                            </Text>
                          </>
                        ) : (
                          <Text style={styles.progressHint}>Set a target price to track savings progress.</Text>
                        )}
                      </View>
                    ) : item.purchasedAmount !== null ? (
                      <View style={styles.progressWrap}>
                        <Text style={styles.progressHint}>Purchased for {formatNok(item.purchasedAmount)}</Text>
                      </View>
                    ) : null}

                    <View style={styles.itemFooter}>
                      <View style={styles.noteRow}>
                        <Ionicons name="ellipse" size={8} color="#c4b5fd" />
                        <Text style={styles.notesText} numberOfLines={2}>
                          {item.notes?.trim() || (item.purchased ? 'Purchased item' : 'No notes yet')}
                        </Text>
                      </View>

                      <View style={styles.itemActionsRow}>
                        <TouchableOpacity
                          style={styles.secondaryActionButton}
                          activeOpacity={0.85}
                          onPress={() =>
                            void (item.purchased
                              ? handleRestorePurchased(item)
                              : progress.isReadyToBuy
                                ? handleStatusPress(item)
                                : setDepositSheetItem(item))
                          }
                          disabled={isPending}
                        >
                          <Text style={styles.secondaryActionText}>{actionLabel}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.editButton}
                          activeOpacity={0.85}
                          onPress={() => openEditItemSheet(item)}
                          disabled={isPending}
                        >
                          <Ionicons name="pencil" size={14} color="#f97316" />
                          <Text style={styles.editText}>Edit</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )
              })}
            </View>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <WishlistItemSheet
        visible={isItemSheetOpen}
        item={editingItem}
        categories={categories.filter((category) => category !== 'All')}
        onClose={closeItemSheet}
        onSaved={mergeSavedItem}
      />

      <WishlistPurchaseSheet
        visible={purchaseSheetItem !== null}
        item={purchaseSheetItem}
        isSubmitting={pendingActionItemId === purchaseSheetItem?.id}
        onClose={closePurchaseSheet}
        onConfirm={async (amount) => {
          if (!purchaseSheetItem) {
            return
          }

          await handleMarkPurchased(purchaseSheetItem, amount)
        }}
      />

      <WishlistDepositSheet
        visible={depositSheetItem !== null}
        item={depositSheetItem}
        isSubmitting={pendingActionItemId === depositSheetItem?.id}
        onClose={closeDepositSheet}
        onConfirm={async (amount) => {
          if (!depositSheetItem) {
            return
          }

          await handleAddFunds(depositSheetItem, amount)
        }}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'DMSans_500Medium',
  },
  heroAction: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroStatCard: {
    flex: 1,
    minHeight: 64,
    justifyContent: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  heroStatValue: {
    fontSize: 13,
    color: '#f8fafc',
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  heroStatLabel: {
    marginTop: 6,
    fontSize: 12,
    color: '#7f95b6',
    fontFamily: 'DMSans_500Medium',
  },
  content: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d9e1ea',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#1f2b44',
    borderColor: '#1f2b44',
  },
  segmentButtonText: {
    fontSize: 14,
    color: '#61708c',
    fontFamily: 'DMSans_700Bold',
  },
  segmentButtonTextActive: {
    color: '#ffffff',
  },
  filterRow: {
    gap: 10,
    paddingBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d9e1ea',
  },
  filterChipActive: {
    backgroundColor: '#1f2b44',
    borderColor: '#1f2b44',
  },
  filterChipText: {
    fontSize: 14,
    color: '#61708c',
    fontFamily: 'DMSans_600SemiBold',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  resultsMeta: {
    marginTop: 6,
    marginBottom: 12,
    fontSize: 14,
    color: '#8ea0bb',
    fontFamily: 'DMSans_500Medium',
  },
  inlineErrorText: {
    marginBottom: 14,
    fontSize: 14,
    color: '#dc2626',
    fontFamily: 'DMSans_500Medium',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#94a3b8',
    fontFamily: 'DMSans_500Medium',
    textAlign: 'center',
  },
  itemsList: {
    gap: 14,
  },
  itemCard: {
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  itemCardPurchased: {
    backgroundColor: '#f8fafc',
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 14,
  },
  itemMediaWrap: {
    width: 72,
    height: 72,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  itemImage: {
    width: 64,
    height: 64,
  },
  itemImagePurchased: {
    opacity: 0.55,
  },
  placeholderMedia: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemMain: {
    flex: 1,
    gap: 8,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  itemTitle: {
    fontSize: 17,
    lineHeight: 23,
    color: '#263248',
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  itemPurchasedText: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillActive: {
    backgroundColor: '#fee2e2',
  },
  statusPillPurchased: {
    backgroundColor: '#dcfce7',
  },
  statusPillText: {
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
  },
  statusPillTextActive: {
    color: '#dc2626',
  },
  statusPillTextPurchased: {
    color: '#15803d',
  },
  priceValue: {
    fontSize: 20,
    color: '#10b981',
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  itemPurchasedPrice: {
    color: '#94a3b8',
  },
  mutedValue: {
    fontSize: 14,
    color: '#94a3b8',
    fontFamily: 'DMSans_500Medium',
  },
  statusButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  statusButtonPurchased: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  progressWrap: {
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  progressMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressMetaText: {
    fontSize: 13,
    color: '#475569',
    fontFamily: 'DMSans_600SemiBold',
  },
  progressTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: '#dbe4f0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#3b82f6',
  },
  progressFillReady: {
    backgroundColor: '#10b981',
  },
  progressHint: {
    fontSize: 12,
    lineHeight: 18,
    color: '#64748b',
    fontFamily: 'DMSans_500Medium',
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#edf2f7',
  },
  noteRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notesText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#7c8aa5',
    fontFamily: 'DMSans_500Medium',
  },
  itemActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryActionButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  secondaryActionText: {
    fontSize: 13,
    color: '#475569',
    fontFamily: 'DMSans_600SemiBold',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d9e1ea',
    backgroundColor: '#ffffff',
  },
  editText: {
    fontSize: 13,
    color: '#64748b',
    fontFamily: 'DMSans_600SemiBold',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#ef4444',
    fontFamily: 'DMSans_500Medium',
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
    color: '#fff',
    fontFamily: 'DMSans_600SemiBold',
  },
})