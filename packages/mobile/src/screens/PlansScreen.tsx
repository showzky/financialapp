import React, { useMemo, useState } from 'react'
import { Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuth } from '../auth/AuthContext'
import { useScreenPalette } from '../customthemes'
import { CreatePlanModal, type PlanCreateVariant } from '../components/plans/CreatePlanModal'
import { PlansEmptyState } from '../components/plans/PlansEmptyState'
import { PlansFab } from '../components/plans/PlansFab'
import { PlansTabBar } from '../components/plans/PlansTabBar'
import type { PlansTabKey, WishlistPlanItem } from '../components/plans/types'
import { WishlistCreateModal } from '../components/plans/WishlistCreateModal'
import { WishlistDetailModal } from '../components/plans/WishlistDetailModal'
import { WishlistOverview } from '../components/plans/WishlistOverview'

const APP_BG = '#0A0A0E'

const emptyLabels: Record<PlansTabKey, string> = {
  wishlist: 'No wishes',
  borrowed: 'No loans',
  lent: 'No debts',
}

export function PlansScreen() {
  useScreenPalette()
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState<PlansTabKey>('wishlist')
  const [createVisible, setCreateVisible] = useState(false)
  const [wishlistItems, setWishlistItems] = useState<WishlistPlanItem[]>([])
  const [selectedWishlistItem, setSelectedWishlistItem] = useState<WishlistPlanItem | null>(null)
  const [editingWishlistItem, setEditingWishlistItem] = useState<WishlistPlanItem | null>(null)

  const avatarSeed = user?.displayName || user?.email || 'OrionLedger'
  const counts = useMemo(
    () => ({
      wishlist: wishlistItems.length,
      borrowed: 0,
      lent: 0,
    }),
    [wishlistItems.length],
  )

  const createVariant: PlanCreateVariant = tab
  const hasWishlistItems = wishlistItems.length > 0

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
          onSave={(item) => {
            setWishlistItems((current) => {
              const existing = current.some((entry) => entry.id === item.id)
              if (existing) {
                return current.map((entry) => (entry.id === item.id ? item : entry))
              }
              return [item, ...current]
            })
            setEditingWishlistItem(null)
          }}
        />
      ) : (
        <CreatePlanModal
          visible={createVisible}
          variant={createVariant}
          onClose={() => setCreateVisible(false)}
        />
      )}

      <WishlistDetailModal
        visible={Boolean(selectedWishlistItem)}
        item={selectedWishlistItem}
        onClose={() => setSelectedWishlistItem(null)}
        onEdit={(item) => {
          setSelectedWishlistItem(null)
          setCreateVisible(false)
          setEditingWishlistItem(item)
        }}
        onMarkPurchased={(itemId) => {
          setWishlistItems((current) =>
            current.map((entry) =>
              entry.id === itemId
                ? {
                    ...entry,
                    savedAmount: entry.price,
                  }
                : entry,
            ),
          )
          setSelectedWishlistItem((current) =>
            current && current.id === itemId
              ? {
                  ...current,
                  savedAmount: current.price,
                }
              : current,
          )
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
