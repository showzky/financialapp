import React, { useState } from 'react'
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import type { CategoryWithSpent } from '../services/dashboardApi'
import { useScreenPalette } from '../customthemes'

const { height: SCREEN_H } = Dimensions.get('window')

function fmtKr(n: number) {
  return `KR ${n.toLocaleString('nb-NO')}`
}

// ── Category icon/color mapping ───────────────────────────────
const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  'Mat & Dagligvarer': { icon: 'shopping-cart', color: 'rgba(94,189,151,0.9)' },
  'Transport': { icon: 'car', color: 'rgba(91,163,201,0.9)' },
  'Underholdning': { icon: 'film', color: 'rgba(201,168,76,0.9)' },
  'Helse': { icon: 'heartbeat', color: 'rgba(201,107,107,0.9)' },
  'Klær': { icon: 'tshirt', color: 'rgba(212,135,74,0.9)' },
  'Annet': { icon: 'ellipsis-h', color: 'rgba(180,160,200,0.9)' },
}
const DEFAULT_META = { icon: 'ellipsis-h', color: 'rgba(180,160,200,0.9)' }

function getCategoryMeta(name: string) {
  return CATEGORY_META[name] ?? DEFAULT_META
}

type Props = {
  visible: boolean
  categories: CategoryWithSpent[]
  onClose: () => void
  onCategoryPress: (category: CategoryWithSpent) => void
}

export function BudgetCategoriesSheet({ visible, categories, onClose, onCategoryPress }: Props) {
  const { activeTheme } = useScreenPalette()
  const c = activeTheme.colors
  const [period, setPeriod] = useState<'Monthly' | 'Weekly'>('Monthly')

  const totalBudget = categories.reduce((s, cat) => s + cat.allocated, 0)
  const totalSpent = categories.reduce((s, cat) => s + cat.monthSpent, 0)
  const totalPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
  const totalOver = totalSpent - totalBudget

  const now = new Date()
  const monthStart = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).format(
    new Date(now.getFullYear(), now.getMonth(), 1),
  )
  const monthEnd = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).format(
    new Date(now.getFullYear(), now.getMonth() + 1, 0),
  )

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={bs.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={bs.sheet}>
          <LinearGradient colors={[c.surfaceAlt, c.screenBackground]} style={StyleSheet.absoluteFill} />
          <View style={bs.handle} />
          <View style={bs.content}>

            {/* Title + period toggle */}
            <View style={bs.topRow}>
              <Text style={[bs.title, { color: c.text }]}>Budget</Text>
              <View style={[bs.periodToggle, { backgroundColor: c.heroCardSurface, borderColor: c.heroCardBorder }]}>
                {(['Monthly', 'Weekly'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[bs.periodBtn, period === p && { backgroundColor: c.skyTintBg, borderWidth: 1, borderColor: c.skyTintBorder }]}
                    onPress={() => setPeriod(p)}
                  >
                    <Text style={[bs.periodTxt, { color: c.ghostText }, period === p && { color: c.tertiary }]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Total budget card */}
            <View style={[bs.totalCard, { borderColor: c.heroCardBorder }]}>
              <LinearGradient
                colors={[c.heroCardSurface, 'rgba(255,255,255,0.02)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={bs.totalCardTop}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[bs.totalIcon, { backgroundColor: c.goldTintBg, borderColor: c.goldTintBorder }]}>
                    <MaterialCommunityIcons name="chart-donut" size={16} color={c.accent} />
                  </View>
                  <Text style={[bs.totalTitle, { color: c.mutedText }]}>Total budget</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[bs.totalPct, { color: c.subtleText }]}>{totalPct}%</Text>
                  <Text
                    style={[
                      bs.totalOver,
                      { color: totalOver > 0 ? c.danger : c.secondary },
                    ]}
                  >
                    {totalOver > 0
                      ? `-${fmtKr(totalOver)}`
                      : `${fmtKr(totalBudget - totalSpent)} left`}
                  </Text>
                </View>
              </View>
              <View style={[bs.totalCardBot, { borderTopColor: c.heroCardBorder }]}>
                <Text style={[bs.periodLbl, { color: c.subtleText }]}>Budget period</Text>
                <Text style={[bs.periodDates, { color: c.mutedText }]}>
                  {monthStart} – {monthEnd}
                </Text>
              </View>
            </View>

            {/* Category rows */}
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: SCREEN_H * 0.3 }}>
              {categories.map((cat, i) => {
                const meta = getCategoryMeta(cat.name)
                const spent = cat.monthSpent
                const pct = cat.allocated > 0 ? Math.round((spent / cat.allocated) * 100) : 0
                const remain = cat.allocated - spent
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[bs.row, i < categories.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.heroCardBorder }]}
                    onPress={() => onCategoryPress(cat)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        bs.icon,
                        {
                          backgroundColor: meta.color.replace('0.9', '0.12'),
                          borderColor: meta.color.replace('0.9', '0.25'),
                        },
                      ]}
                    >
                      <FontAwesome5 name={meta.icon} size={13} color={meta.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[bs.catLabel, { color: c.mutedText }]}>{cat.name}</Text>
                      <Text style={[bs.catBudget, { color: c.subtleText }]}>{fmtKr(cat.allocated)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                      <Text style={[bs.catPct, { color: c.ghostText }]}>{pct}%</Text>
                      <Text style={[bs.catRemain, { color: c.mutedText }]}>{fmtKr(remain)}</Text>
                    </View>
                    <TouchableOpacity style={bs.settingsBtn}>
                      <FontAwesome5 name="cog" size={13} color={c.ghostText} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>

            {/* Add category button */}
            <TouchableOpacity style={[bs.addBtn, { borderColor: c.skyTintBorder }]}>
              <LinearGradient
                colors={[c.skyTintBg, 'rgba(91,163,201,0.1)']}
                style={StyleSheet.absoluteFill}
              />
              <FontAwesome5 name="plus" size={13} color={c.tertiary} />
              <Text style={[bs.addTxt, { color: c.tertiary }]}>Add category budget</Text>
            </TouchableOpacity>

          </View>
        </View>
      </View>
    </Modal>
  )
}

const bs = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', maxHeight: SCREEN_H * 0.82 },
  handle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  content: { padding: 22, paddingBottom: 36 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: 'bold' },
  periodToggle: { flexDirection: 'row', borderRadius: 20, padding: 3, borderWidth: 1 },
  periodBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 17 },
  periodTxt: { fontSize: 12, fontWeight: '600' },
  totalCard: { borderRadius: 18, overflow: 'hidden', padding: 16, marginBottom: 16, borderWidth: 1 },
  totalCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  totalIcon: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  totalTitle: { fontSize: 14, fontWeight: '700' },
  totalPct: { fontSize: 12, fontWeight: '700' },
  totalOver: { fontSize: 15, fontWeight: '900' },
  totalCardBot: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1 },
  periodLbl: { fontSize: 11 },
  periodDates: { fontSize: 11, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  icon: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  catLabel: { fontSize: 13, fontWeight: '600' },
  catBudget: { fontSize: 11, marginTop: 1 },
  catPct: { fontSize: 11, fontWeight: '700' },
  catRemain: { fontSize: 12, fontWeight: '700' },
  settingsBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 16, overflow: 'hidden', paddingVertical: 16, marginTop: 14, borderWidth: 1 },
  addTxt: { fontSize: 14, fontWeight: '700' },
})
