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
import { screenThemes } from '../theme/screenThemes'

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
  const [isItemSheetOpen, setIsItemSheetOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null)

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

  const handleItemSaved = (savedItem: WishlistItem) => {
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

  const categories = useMemo(
    () => [
      'All',
      ...Array.from(
        new Set(
          items
            .map((item) => item.category?.trim())
            .filter((category): category is string => Boolean(category)),
        ),
      ),
    ],
    [items],
  )

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'All') {
      return items
    }

    return items.filter((item) => item.category?.trim() === selectedCategory)
  }, [items, selectedCategory])

  const purchasedCount = filteredItems.filter((item) => item.purchased).length
  const remainingTotal = filteredItems
    .filter((item) => !item.purchased)
    .reduce((sum, item) => sum + (item.price || 0), 0)

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.screenBackground }]}> 
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading wishlist...</Text>
      </View>
    )
  }

  if (error) {
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
          subtitle={`${filteredItems.length} saved item${filteredItems.length === 1 ? '' : 's'}`}
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
              <Text style={styles.heroStatValue}>{filteredItems.length}</Text>
              <Text style={styles.heroStatLabel}>Total items</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{purchasedCount}</Text>
              <Text style={styles.heroStatLabel}>Purchased</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{formatNok(remainingTotal)}</Text>
              <Text style={styles.heroStatLabel}>Remaining</Text>
            </View>
          </View>
        </ScreenHero>

        <View style={styles.content}>
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
            {filteredItems.length} item{filteredItems.length === 1 ? '' : 's'} in this view
          </Text>

          {filteredItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No wishlist items in this category</Text>
            </View>
          ) : (
            <View style={styles.itemsList}>
              {filteredItems.map((item) => {
                const tone = getCategoryTone(item.category)

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
                        {item.category ? (
                          <View style={[styles.categoryBadge, { backgroundColor: tone.backgroundColor }]}> 
                            <Text style={[styles.categoryText, { color: tone.textColor }]}>{item.category}</Text>
                          </View>
                        ) : null}

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

                      <TouchableOpacity style={[styles.statusButton, item.purchased && styles.statusButtonPurchased]}>
                        <Ionicons
                          name={item.purchased ? 'checkmark' : 'cart-outline'}
                          size={18}
                          color={item.purchased ? '#22c55e' : '#64748b'}
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.itemFooter}>
                      <View style={styles.noteRow}>
                        <Ionicons name="ellipse" size={8} color="#c4b5fd" />
                        <Text style={styles.notesText} numberOfLines={2}>
                          {item.notes?.trim() || 'No notes yet'}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.editButton}
                        activeOpacity={0.85}
                        onPress={() => openEditItemSheet(item)}
                      >
                        <Ionicons name="pencil" size={14} color="#f97316" />
                        <Text style={styles.editText}>Edit</Text>
                      </TouchableOpacity>
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
        onSaved={handleItemSaved}
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
    marginBottom: 16,
    fontSize: 14,
    color: '#8ea0bb',
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
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#d9e1ea',
  },
  statusButtonPurchased: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
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