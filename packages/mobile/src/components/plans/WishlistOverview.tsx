import React, { useMemo } from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import type { WishlistPlanItem } from './types'

type Props = {
  items: WishlistPlanItem[]
  onPressItem: (item: WishlistPlanItem) => void
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

export function WishlistOverview({ items, onPressItem }: Props) {
  const totalLeft = useMemo(
    () => items.reduce((sum, item) => sum + Math.max(item.price - item.savedAmount, 0), 0),
    [items],
  )
  const purchasedCount = useMemo(
    () => items.filter((item) => item.savedAmount >= item.price && item.price > 0).length,
    [items],
  )

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string
        name: string
        total: number
        items: WishlistPlanItem[]
      }
    >()

    items.forEach((item) => {
      const key = item.category?.id ?? 'uncategorized'
      const name = item.category?.name ?? 'Unsorted'
      const existing = map.get(key)
      if (existing) {
        existing.total += item.price
        existing.items.push(item)
        return
      }
      map.set(key, { key, name, total: item.price, items: [item] })
    })

    return Array.from(map.values())
  }, [items])

  return (
    <View style={styles.wrap}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total left</Text>
          <Text style={styles.summaryValue}>{formatKr(totalLeft)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Purchased</Text>
          <Text style={styles.summaryValue}>{purchasedCount}/{items.length}</Text>
        </View>
      </View>

      {grouped.map((group) => (
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
            <TouchableOpacity style={styles.groupDots} activeOpacity={0.85}>
              <Ionicons name="ellipsis-vertical" size={16} color="rgba(240,244,252,0.52)" />
            </TouchableOpacity>
          </View>

          {group.items.map((item) => {
            const progress = item.price > 0 ? Math.min(item.savedAmount / item.price, 1) : 0
            const left = Math.max(item.price - item.savedAmount, 0)
            const purchased = item.savedAmount >= item.price && item.price > 0
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
                    <Text style={styles.bottomMetric}>{purchased ? 'Purchased' : `${Math.round(progress * 100)} %`}</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.max(progress * 100, 3)}%` }]} />
                  </View>
                  <View style={styles.bottomRow}>
                    <View style={styles.domainBadge}>
                      <Ionicons name="globe-outline" size={12} color="rgba(255,243,250,0.9)" />
                      <Text style={styles.domainText} numberOfLines={1}>{domain ?? 'No product link'}</Text>
                    </View>
                    <Text style={styles.leftText}>{purchased ? 'Ready to buy' : `Left: ${formatKr(left)}`}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )
          })}
        </View>
      ))}
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
})
