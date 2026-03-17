import React, { useMemo, useState } from 'react'
import { Image, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import type { WishlistPlanItem } from './types'

type Props = {
  visible: boolean
  item: WishlistPlanItem | null
  onClose: () => void
  onEdit: (item: WishlistPlanItem) => void
  onMarkPurchased: (itemId: string) => void
}

function formatKr(value: number) {
  return `KR ${value.toLocaleString('nb-NO')}`
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatDomain(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, '')
  } catch {
    return value
  }
}

export function WishlistDetailModal({ visible, item, onClose, onEdit, onMarkPurchased }: Props) {
  const [menuVisible, setMenuVisible] = useState(false)

  const leftAmount = useMemo(() => {
    if (!item) return 0
    return Math.max(item.price - item.savedAmount, 0)
  }, [item])

  const purchased = item ? item.savedAmount >= item.price && item.price > 0 : false

  if (!item) return null

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.root}>
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

        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIcon} activeOpacity={0.85} onPress={onClose}>
            <Ionicons name="arrow-back" size={18} color="rgba(245,248,253,0.82)" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerPill} activeOpacity={0.85} onPress={() => onEdit(item)}>
              <Ionicons name="pencil-outline" size={14} color="#F5F8FD" />
              <Text style={styles.headerPillText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon} activeOpacity={0.85} onPress={() => setMenuVisible((current) => !current)}>
              <Ionicons name="ellipsis-vertical" size={18} color="rgba(245,248,253,0.82)" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.categoryChip}>
            <Ionicons
              name={
                item.category?.icon && item.category.icon in Ionicons.glyphMap
                  ? (item.category.icon as keyof typeof Ionicons.glyphMap)
                  : 'bag-handle-outline'
              }
              size={15}
              color={item.category?.iconColor ?? '#F4A62A'}
            />
            <Text style={styles.categoryChipText}>{item.category?.name ?? 'Wishlist'}</Text>
          </View>

          <Text style={styles.title}>{item.name}</Text>
          {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}

          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Ionicons name="wallet-outline" size={18} color="rgba(245,248,253,0.54)" />
              <Text style={styles.metricLabel}>Saved amount</Text>
              <Text style={styles.metricValue}>{formatKr(item.savedAmount)}</Text>
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="cash-outline" size={18} color="rgba(245,248,253,0.54)" />
              <Text style={styles.metricLabel}>Total price</Text>
              <Text style={styles.metricValue}>{formatKr(item.price)}</Text>
            </View>
          </View>

          <View style={styles.supportRow}>
            <Text style={styles.supportLabel}>Date</Text>
            <View style={styles.datePill}>
              <Text style={styles.datePillText}>{formatDate(item.date)}</Text>
            </View>
          </View>

          <View style={styles.imageSection}>
            <Text style={styles.supportLabel}>Image</Text>
            <View style={styles.imageCard}>
              {item.imageUri ? (
                <Image source={{ uri: item.imageUri }} style={styles.detailImage} resizeMode="cover" />
              ) : (
                <View style={styles.detailImageFallback}>
                  <Ionicons name="image-outline" size={22} color="rgba(245,248,253,0.34)" />
                </View>
              )}
            </View>
          </View>

          {item.productUrl ? (
            <TouchableOpacity
              style={styles.productButton}
              activeOpacity={0.88}
              onPress={() => {
                void Linking.openURL(item.productUrl)
              }}
            >
              <View>
                <Text style={styles.productButtonTitle}>Open product</Text>
                <Text style={styles.productButtonSubtitle}>{formatDomain(item.productUrl)}</Text>
              </View>
              <Ionicons name="open-outline" size={17} color="#D9E9FF" />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[styles.markButton, purchased && styles.markButtonDone]}
            activeOpacity={0.88}
            onPress={() => onMarkPurchased(item.id)}
          >
            <Text style={styles.markButtonText}>{purchased ? 'Purchased' : 'Mark as purchased'}</Text>
          </TouchableOpacity>

          {item.activities.length > 0 ? (
            <View style={styles.activityList}>
              {item.activities.map((activity) => (
                <View key={activity.id} style={styles.activityRow}>
                  <View style={styles.activityIdentity}>
                    <View style={styles.activityIconWrap}>
                      <Ionicons
                        name={activity.kind === 'purchased' ? 'checkmark-circle' : activity.kind === 'edited' ? 'create-outline' : 'bag-handle-outline'}
                        size={15}
                        color={activity.kind === 'purchased' ? '#74D88B' : '#F4A62A'}
                      />
                    </View>
                    <View>
                      <Text style={styles.activityTitle}>{activity.kind === 'purchased' ? 'Purchased' : activity.kind === 'edited' ? activity.title : activity.title}</Text>
                      <Text style={styles.activityDate}>{formatDate(activity.date)}</Text>
                    </View>
                  </View>
                  <Text style={styles.activityAmount}>{activity.kind === 'purchased' ? formatKr(activity.amount) : `-${formatKr(activity.amount).replace('KR ', 'KR ')}`}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>

        {menuVisible ? (
          <View style={styles.menu}>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.85} onPress={() => { setMenuVisible(false); onEdit(item) }}>
              <Ionicons name="pencil" size={16} color="#F5F8FD" />
              <Text style={styles.menuText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.85}>
              <Ionicons name="analytics-outline" size={16} color="#F5F8FD" />
              <Text style={styles.menuText}>Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.85}>
              <Ionicons name="share-outline" size={16} color="#F5F8FD" />
              <Text style={styles.menuText}>Data export</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.footer}>
          <TouchableOpacity activeOpacity={0.9} onPress={onClose}>
            <LinearGradient colors={['#6DB2FF', '#4C89E8']} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>OK</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0E' },
  heroGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 280 },
  header: { paddingTop: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  headerPill: { minHeight: 34, borderRadius: 15, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.08)' },
  headerPillText: { color: '#F5F8FD', fontSize: 13, fontFamily: 'DMSans_700Bold' },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 140 },
  categoryChip: { alignSelf: 'flex-start', minHeight: 30, borderRadius: 15, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.08)' },
  categoryChipText: { color: '#F5F8FD', fontSize: 13, fontFamily: 'DMSans_600SemiBold' },
  title: { marginTop: 16, color: '#F5F8FD', fontSize: 28, lineHeight: 32, fontFamily: 'DMSerifDisplay_400Regular' },
  notes: { marginTop: 8, color: 'rgba(245,248,253,0.54)', fontSize: 14, lineHeight: 20, fontFamily: 'DMSans_500Medium' },
  metricsRow: { marginTop: 18, flexDirection: 'row', gap: 10 },
  metricCard: { flex: 1, borderRadius: 16, backgroundColor: 'rgba(24,28,39,0.96)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', padding: 12 },
  metricLabel: { marginTop: 8, color: 'rgba(245,248,253,0.46)', fontSize: 11, fontFamily: 'DMSans_500Medium' },
  metricValue: { marginTop: 4, color: '#F5F8FD', fontSize: 22, fontFamily: 'DMSans_700Bold' },
  supportRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  supportLabel: { color: 'rgba(245,248,253,0.42)', fontSize: 13, fontFamily: 'DMSans_600SemiBold' },
  datePill: { minHeight: 30, borderRadius: 15, paddingHorizontal: 11, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  datePillText: { color: '#F5F8FD', fontSize: 12, fontFamily: 'DMSans_700Bold' },
  imageSection: { marginTop: 14, gap: 8 },
  imageCard: { borderRadius: 20, overflow: 'hidden', backgroundColor: 'rgba(24,28,39,0.96)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  detailImage: { width: '100%', height: 184 },
  detailImageFallback: { height: 184, alignItems: 'center', justifyContent: 'center' },
  productButton: { marginTop: 12, minHeight: 54, borderRadius: 18, backgroundColor: 'rgba(36,52,78,0.96)', borderWidth: 1, borderColor: 'rgba(109,178,255,0.16)', paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  productButtonTitle: { color: '#E7F1FF', fontSize: 15, fontFamily: 'DMSans_700Bold' },
  productButtonSubtitle: { marginTop: 3, color: 'rgba(215,230,255,0.58)', fontSize: 11, fontFamily: 'DMSans_600SemiBold' },
  markButton: { marginTop: 12, minHeight: 44, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  markButtonDone: { backgroundColor: 'rgba(116,216,139,0.12)', borderColor: 'rgba(116,216,139,0.22)' },
  markButtonText: { color: '#F5F8FD', fontSize: 14, fontFamily: 'DMSans_700Bold' },
  activityList: { marginTop: 16, gap: 12 },
  activityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  activityIdentity: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  activityIconWrap: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  activityTitle: { color: '#F5F8FD', fontSize: 13, fontFamily: 'DMSans_700Bold' },
  activityDate: { marginTop: 2, color: 'rgba(245,248,253,0.44)', fontSize: 12, fontFamily: 'DMSans_500Medium' },
  activityAmount: { color: '#F5F8FD', fontSize: 13, fontFamily: 'DMSans_700Bold' },
  menu: { position: 'absolute', top: 62, right: 16, width: 170, borderRadius: 18, backgroundColor: '#1B202B', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', paddingVertical: 8 },
  menuItem: { minHeight: 42, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuText: { color: '#F5F8FD', fontSize: 15, fontFamily: 'DMSans_600SemiBold' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingBottom: 18, paddingTop: 12, backgroundColor: 'rgba(10,10,14,0.92)' },
  primaryButton: { minHeight: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#F8FBFF', fontSize: 16, fontFamily: 'DMSans_700Bold' },
})
