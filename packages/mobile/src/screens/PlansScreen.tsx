import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuth } from '../auth/AuthContext'
import { AddLoanModal } from '../components/AddLoanModal'
import { EditLoanModal } from '../components/EditLoanModal'
import { useScreenPalette } from '../customthemes'
import { BorrowedLoanCreateModal } from '../components/plans/BorrowedLoanCreateModal'
import { BorrowedLoanDetailModal } from '../components/plans/BorrowedLoanDetailModal'
import { BorrowedLoansOverview } from '../components/plans/BorrowedLoansOverview'
import { LentLoanDetailModal } from '../components/plans/LentLoanDetailModal'
import { LentLoansOverview } from '../components/plans/LentLoansOverview'
import { PlansEmptyState } from '../components/plans/PlansEmptyState'
import { PlansFab } from '../components/plans/PlansFab'
import { PlansTabBar } from '../components/plans/PlansTabBar'
import type { BorrowedLoanPaymentEntry, BorrowedLoanPlanItem, PlansTabKey, WishlistPlanItem } from '../components/plans/types'
import { WishlistCreateModal } from '../components/plans/WishlistCreateModal'
import { WishlistDetailModal } from '../components/plans/WishlistDetailModal'
import { WishlistOverview } from '../components/plans/WishlistOverview'
import { borrowedLoanApi, type BorrowedLoan } from '../services/borrowedLoanApi'
import type { CategoryDto } from '../services/categoryApi'
import { loanApi, type Loan } from '../services/loanApi'
import { wishlistApi, type WishlistItem } from '../services/wishlistApi'

const APP_BG = '#0A0A0E'

const emptyLabels: Record<PlansTabKey, string> = {
  wishlist: 'No wishes',
  borrowed: 'No loans',
  lent: 'No debts',
}

function mapBorrowedLoanToPlanItem(
  loan: BorrowedLoan,
  paymentHistoryByLoanId: Record<string, BorrowedLoanPaymentEntry[]>,
): BorrowedLoanPlanItem {
  return {
    id: loan.id,
    lender: loan.lender,
    originalAmount: loan.originalAmount,
    currentBalance: loan.currentBalance,
    interestRate: loan.interestRate,
    payoffDate: loan.payoffDate,
    notes: loan.notes ?? '',
    iconUrl: loan.iconUrl ?? null,
    payments: paymentHistoryByLoanId[loan.id] ?? [],
  }
}

function buildWishlistCategory(categoryName: string | null | undefined): CategoryDto | null {
  const normalizedName = categoryName?.trim()
  if (!normalizedName) return null

  return {
    id: `wishlist-category-${normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    userId: '',
    name: normalizedName,
    parentName: '',
    icon: 'bag-handle-outline',
    color: '#1B1F2A',
    iconColor: '#F4A62A',
    sortOrder: 0,
    isDefault: false,
    isArchived: false,
    createdAt: '',
  }
}

function mapWishlistItemToPlanItem(
  item: WishlistItem,
  firstSeenAtById: Record<string, string>,
): WishlistPlanItem {
  const basePrice = item.price ?? item.purchasedAmount ?? item.savedAmount ?? 0
  const effectiveSavedAmount = item.purchased ? Math.max(basePrice, item.savedAmount) : item.savedAmount

  return {
    id: item.id,
    name: item.title,
    notes: item.notes ?? '',
    category: buildWishlistCategory(item.category),
    productUrl: item.url,
    imageUri: item.imageUrl ?? null,
    price: basePrice,
    savedAmount: effectiveSavedAmount,
    date: firstSeenAtById[item.id] ?? new Date().toISOString(),
    activities: [],
  }
}

export function PlansScreen() {
  useScreenPalette()
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState<PlansTabKey>('wishlist')
  const [createVisible, setCreateVisible] = useState(false)
  const [wishlistItems, setWishlistItems] = useState<WishlistPlanItem[]>([])
  const wishlistFirstSeenAtRef = useRef<Record<string, string>>({})
  const [selectedWishlistItem, setSelectedWishlistItem] = useState<WishlistPlanItem | null>(null)
  const [editingWishlistItem, setEditingWishlistItem] = useState<WishlistPlanItem | null>(null)
  const [borrowedLoanItems, setBorrowedLoanItems] = useState<BorrowedLoanPlanItem[]>([])
  const [borrowedLoanMap, setBorrowedLoanMap] = useState<Record<string, BorrowedLoan>>({})
  const [paymentHistoryByLoanId, setPaymentHistoryByLoanId] = useState<Record<string, BorrowedLoanPaymentEntry[]>>({})
  const [selectedBorrowedLoanItem, setSelectedBorrowedLoanItem] = useState<BorrowedLoanPlanItem | null>(null)
  const [editingBorrowedLoanItem, setEditingBorrowedLoanItem] = useState<BorrowedLoanPlanItem | null>(null)
  const [lentLoanItems, setLentLoanItems] = useState<Loan[]>([])
  const [selectedLentLoanItem, setSelectedLentLoanItem] = useState<Loan | null>(null)
  const [editingLentLoanItem, setEditingLentLoanItem] = useState<Loan | null>(null)

  const loadWishlist = useCallback(async (selectedItemId?: string | null) => {
    try {
      const items = await wishlistApi.list()

      items.forEach((item) => {
        if (!wishlistFirstSeenAtRef.current[item.id]) {
          wishlistFirstSeenAtRef.current[item.id] = new Date().toISOString()
        }
      })

      const nextItems = items.map((item) =>
        mapWishlistItemToPlanItem(item, wishlistFirstSeenAtRef.current),
      )

      setWishlistItems(nextItems)

      if (selectedItemId) {
        setSelectedWishlistItem(nextItems.find((item) => item.id === selectedItemId) ?? null)
      }
    } catch (error) {
      console.error('Failed to load wishlist for Plans:', error)
    }
  }, [])

  const loadBorrowedLoans = useCallback(async (selectedItemId?: string | null) => {
    try {
      const loans = await borrowedLoanApi.list()

      const nextLoanMap = loans.reduce<Record<string, BorrowedLoan>>((accumulator, loan) => {
        accumulator[loan.id] = loan
        return accumulator
      }, {})

      const nextItems = loans.map((loan) => mapBorrowedLoanToPlanItem(loan, paymentHistoryByLoanId))

      setBorrowedLoanMap(nextLoanMap)
      setBorrowedLoanItems(nextItems)

      if (selectedItemId) {
        setSelectedBorrowedLoanItem(nextItems.find((item) => item.id === selectedItemId) ?? null)
      }
    } catch (error) {
      console.error('Failed to load borrowed loans for Plans:', error)
    }
  }, [paymentHistoryByLoanId])

  const loadLentLoans = useCallback(async (selectedItemId?: string | null) => {
    try {
      const items = await loanApi.list()

      setLentLoanItems(items)

      if (selectedItemId) {
        setSelectedLentLoanItem(items.find((item) => item.id === selectedItemId) ?? null)
      }
    } catch (error) {
      console.error('Failed to load lent loans for Plans:', error)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void loadWishlist(selectedWishlistItem?.id ?? null)
      void loadBorrowedLoans(selectedBorrowedLoanItem?.id ?? null)
      void loadLentLoans(selectedLentLoanItem?.id ?? null)
    }, [loadBorrowedLoans, loadLentLoans, loadWishlist, selectedBorrowedLoanItem?.id, selectedLentLoanItem?.id, selectedWishlistItem?.id]),
  )

  const avatarSeed = user?.displayName || user?.email || 'OrionLedger'
  const counts = useMemo(
    () => ({
      wishlist: wishlistItems.length,
      borrowed: borrowedLoanItems.length,
      lent: lentLoanItems.length,
    }),
    [wishlistItems.length, borrowedLoanItems.length, lentLoanItems.length],
  )

  const hasWishlistItems = wishlistItems.length > 0
  const hasBorrowedItems = borrowedLoanItems.length > 0
  const hasLentItems = lentLoanItems.length > 0

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={APP_BG} />
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
            <Text style={styles.eyebrow}>ORION PLANNING</Text>
            <Text style={styles.title}>Plans</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.headerGlyph} activeOpacity={0.85}>
          <Ionicons name="sparkles-outline" size={17} color="rgba(241,244,255,0.82)" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.delay(50).duration(360)}>
          <PlansTabBar value={tab} counts={counts} onChange={setTab} />
          {tab === 'wishlist' && hasWishlistItems ? (
            <WishlistOverview items={wishlistItems} onPressItem={setSelectedWishlistItem} />
          ) : tab === 'borrowed' && hasBorrowedItems ? (
            <BorrowedLoansOverview
              items={borrowedLoanItems}
              onPressItem={setSelectedBorrowedLoanItem}
            />
          ) : tab === 'lent' && hasLentItems ? (
            <LentLoansOverview items={lentLoanItems} onPressItem={setSelectedLentLoanItem} />
          ) : (
            <PlansEmptyState message={emptyLabels[tab]} onCreate={() => setCreateVisible(true)} />
          )}
        </Animated.View>
      </ScrollView>

      <PlansFab bottomOffset={Math.max(insets.bottom + 24, 112)} onPress={() => setCreateVisible(true)} />

      {tab === 'wishlist' ? (
        <WishlistCreateModal
          visible={createVisible || Boolean(editingWishlistItem)}
          initialItem={editingWishlistItem}
          onClose={() => {
            setCreateVisible(false)
            setEditingWishlistItem(null)
          }}
          onSave={async (item) => {
            if (editingWishlistItem) {
              await wishlistApi.update(editingWishlistItem.id, {
                title: item.name,
                url: item.productUrl,
                price: item.price,
                imageUrl: item.imageUri ?? undefined,
                category: item.category?.name,
                notes: item.notes || null,
                savedAmount: item.savedAmount,
              })
            } else {
              await wishlistApi.create({
                title: item.name,
                url: item.productUrl,
                price: item.price,
                imageUrl: item.imageUri ?? undefined,
                category: item.category?.name,
                notes: item.notes || null,
                savedAmount: item.savedAmount,
              })
            }

            setEditingWishlistItem(null)
            await loadWishlist(selectedWishlistItem?.id ?? null)
          }}
        />
      ) : tab === 'borrowed' ? (
        <BorrowedLoanCreateModal
          visible={createVisible || Boolean(editingBorrowedLoanItem)}
          initialItem={editingBorrowedLoanItem}
          onClose={() => {
            setCreateVisible(false)
            setEditingBorrowedLoanItem(null)
          }}
          onSave={async (item) => {
            const existingLoan = editingBorrowedLoanItem ? borrowedLoanMap[editingBorrowedLoanItem.id] : null

            if (existingLoan) {
              await borrowedLoanApi.update(existingLoan.id, {
                lender: item.lender,
                originalAmount: item.originalAmount,
                currentBalance: item.currentBalance,
                interestRate: item.interestRate,
                payoffDate: item.payoffDate,
                notes: item.notes || null,
                iconUrl: item.iconUrl ?? null,
              })
            } else {
              await borrowedLoanApi.create({
                lender: item.lender,
                originalAmount: item.originalAmount,
                currentBalance: item.currentBalance,
                interestRate: item.interestRate,
                payoffDate: item.payoffDate,
                notes: item.notes || undefined,
                iconUrl: item.iconUrl ?? null,
              })
            }

            setEditingBorrowedLoanItem(null)
            await loadBorrowedLoans(selectedBorrowedLoanItem?.id ?? null)
          }}
        />
      ) : null}

      <AddLoanModal
        isOpen={tab === 'lent' && createVisible}
        onClose={() => setCreateVisible(false)}
        onSubmit={async (payload) => {
          await loanApi.create(payload)
          setCreateVisible(false)
          await loadLentLoans(null)
        }}
      />

      <EditLoanModal
        isOpen={Boolean(editingLentLoanItem)}
        loan={editingLentLoanItem}
        onClose={() => setEditingLentLoanItem(null)}
        onSubmit={async (id, payload) => {
          await loanApi.update(id, payload)
          setEditingLentLoanItem(null)
          await loadLentLoans(selectedLentLoanItem?.id ?? null)
        }}
      />

      <BorrowedLoanDetailModal
        visible={Boolean(selectedBorrowedLoanItem)}
        item={selectedBorrowedLoanItem}
        onClose={() => setSelectedBorrowedLoanItem(null)}
        onEdit={(item) => {
          setSelectedBorrowedLoanItem(null)
          setCreateVisible(false)
          setEditingBorrowedLoanItem(item)
        }}
        onMarkPaidOff={async (itemId) => {
          await borrowedLoanApi.update(itemId, { currentBalance: 0 })
          await loadBorrowedLoans(itemId)
        }}
        onRegisterPayment={async (itemId, payment) => {
          const loan = borrowedLoanMap[itemId]
          if (!loan) return

          const nextBalance = Math.max(loan.currentBalance - payment.principalPortion, 0)

          setPaymentHistoryByLoanId((current) => ({
            ...current,
            [itemId]: [...(current[itemId] ?? []), payment],
          }))

          await borrowedLoanApi.update(itemId, { currentBalance: nextBalance })
          await loadBorrowedLoans(itemId)
        }}
        onDelete={async (itemId) => {
          await borrowedLoanApi.remove(itemId)
          setSelectedBorrowedLoanItem(null)
          setPaymentHistoryByLoanId((current) => {
            const next = { ...current }
            delete next[itemId]
            return next
          })
          await loadBorrowedLoans(null)
        }}
      />

      <WishlistDetailModal
        visible={Boolean(selectedWishlistItem)}
        item={selectedWishlistItem}
        onClose={() => setSelectedWishlistItem(null)}
        onEdit={(item) => {
          setSelectedWishlistItem(null)
          setCreateVisible(false)
          setEditingWishlistItem(item)
        }}
        onMarkPurchased={async (itemId) => {
          const selectedItem = selectedWishlistItem && selectedWishlistItem.id === itemId ? selectedWishlistItem : wishlistItems.find((entry) => entry.id === itemId)
          await wishlistApi.markPurchased(itemId, selectedItem?.price)
          await loadWishlist(itemId)
        }}
        onDelete={async (itemId) => {
          await wishlistApi.remove(itemId)
          setSelectedWishlistItem(null)
          await loadWishlist(null)
        }}
      />

      <LentLoanDetailModal
        visible={Boolean(selectedLentLoanItem)}
        item={selectedLentLoanItem}
        onClose={() => setSelectedLentLoanItem(null)}
        onEdit={(item) => {
          setSelectedLentLoanItem(null)
          setCreateVisible(false)
          setEditingLentLoanItem(item)
        }}
        onMarkRepaid={async (itemId) => {
          await loanApi.markRepaid(itemId)
          await loadLentLoans(itemId)
        }}
        onDelete={async (itemId) => {
          await loanApi.remove(itemId)
          setSelectedLentLoanItem(null)
          setEditingLentLoanItem(null)
          await loadLentLoans(null)
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: APP_BG,
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
  headerGlyph: {
    width: 42,
    height: 42,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 180,
  },
})
