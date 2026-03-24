import React, { useEffect, useRef, useState } from 'react'
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { ConfirmModal } from '../ConfirmModal'

import type { Loan } from '../../services/loanApi'

type Props = {
  visible: boolean
  item: Loan | null
  onClose: () => void
  onEdit: (item: Loan) => void
  onMarkRepaid: (itemId: string) => void | Promise<void>
  onDelete: (itemId: string) => void | Promise<void>
}

function formatKr(value: number) {
  return `KR ${value.toLocaleString('nb-NO')}`
}

function formatDate(value: string | null) {
  if (!value) return 'Not set'
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function LentLoanDetailModal({ visible, item, onClose, onEdit, onMarkRepaid, onDelete }: Props) {
  const lastItemRef = useRef<Loan | null>(null)
  if (item) lastItemRef.current = item
  const safeItem = item ?? lastItemRef.current

  const [menuVisible, setMenuVisible] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)

  useEffect(() => {
    setMenuVisible(false)
    setDeleteModalVisible(false)
  }, [item?.id, visible])

  const handleDeletePress = () => {
    if (!safeItem) return
    setMenuVisible(false)
    setDeleteModalVisible(true)
  }

  if (!safeItem) return null

  const isRepaid = safeItem.status === 'repaid'
  const dueLabel =
    safeItem.status === 'overdue'
      ? 'Overdue'
      : safeItem.status === 'due_soon'
        ? 'Due soon'
        : isRepaid
          ? 'Repaid'
          : 'Outstanding'

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        <LinearGradient
          colors={['#101626', '#0A0A0E', '#0D1017', '#0A0A0E']}
          locations={[0, 0.28, 0.64, 1]}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(76,137,232,0.34)', 'rgba(57,96,178,0.12)', 'transparent']}
          locations={[0, 0.42, 1]}
          style={styles.heroGlow}
        />

        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIcon} activeOpacity={0.85} onPress={onClose}>
            <Ionicons name="arrow-back" size={18} color="rgba(245,248,253,0.82)" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerPill} activeOpacity={0.85} onPress={() => setMenuVisible((current) => !current)}>
              <Ionicons name="pencil-outline" size={14} color="#F5F8FD" />
              <Text style={styles.headerPillText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteIconButton} activeOpacity={0.85} onPress={handleDeletePress}>
              <Ionicons name="trash-outline" size={17} color="#FF8D8F" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon} activeOpacity={0.85} onPress={() => setMenuVisible((current) => !current)}>
              <Ionicons name="ellipsis-vertical" size={18} color="rgba(245,248,253,0.82)" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.categoryChip}>
            <Ionicons name="arrow-forward-outline" size={15} color="#8DB8FF" />
            <Text style={styles.categoryChipText}>Lent Out</Text>
          </View>

          <Text style={styles.title}>{safeItem.recipient}</Text>
          {safeItem.notes ? <Text style={styles.notes}>{safeItem.notes}</Text> : null}

          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Ionicons name="cash-outline" size={18} color="rgba(245,248,253,0.54)" />
              <Text style={styles.metricLabel}>Amount</Text>
              <Text style={styles.metricValue}>{formatKr(safeItem.amount)}</Text>
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="timer-outline" size={18} color="rgba(245,248,253,0.54)" />
              <Text style={styles.metricLabel}>Status</Text>
              <Text style={styles.metricValue}>{dueLabel}</Text>
            </View>
          </View>

          <View style={styles.supportRow}>
            <Text style={styles.supportLabel}>Date given</Text>
            <View style={styles.datePill}>
              <Text style={styles.datePillText}>{formatDate(safeItem.dateGiven)}</Text>
            </View>
          </View>

          <View style={styles.supportRow}>
            <Text style={styles.supportLabel}>Expected repayment</Text>
            <View style={styles.datePill}>
              <Text style={styles.datePillText}>{formatDate(safeItem.expectedRepaymentDate)}</Text>
            </View>
          </View>

          <View style={styles.supportRow}>
            <Text style={styles.supportLabel}>Recorded repaid</Text>
            <View style={[styles.datePill, isRepaid ? styles.datePillSuccess : null]}>
              <Text style={[styles.datePillText, isRepaid ? styles.datePillTextSuccess : null]}>{formatDate(safeItem.repaidAt)}</Text>
            </View>
          </View>

          {!isRepaid ? (
            <TouchableOpacity style={styles.markButton} activeOpacity={0.88} onPress={() => onMarkRepaid(safeItem.id)}>
              <Text style={styles.markButtonText}>Mark as repaid</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.repaidBanner}>
              <Ionicons name="checkmark-circle" size={18} color="#74D88B" />
              <Text style={styles.repaidBannerText}>This loan is already marked as repaid.</Text>
            </View>
          )}
        </ScrollView>

        {menuVisible ? (
          <View style={styles.menu}>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.85} onPress={() => { setMenuVisible(false); onEdit(safeItem) }}>
              <Ionicons name="pencil" size={16} color="#F5F8FD" />
              <Text style={styles.menuText}>Edit</Text>
            </TouchableOpacity>
            {!isRepaid ? (
              <TouchableOpacity style={styles.menuItem} activeOpacity={0.85} onPress={() => { setMenuVisible(false); void onMarkRepaid(safeItem.id) }}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#F5F8FD" />
                <Text style={styles.menuText}>Mark as repaid</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.85} onPress={() => { setMenuVisible(false); handleDeletePress() }}>
              <Ionicons name="trash-outline" size={16} color="#FF8D8F" />
              <Text style={styles.menuDangerText}>Delete</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <ConfirmModal
          isOpen={deleteModalVisible}
          title="Are you sure you want to delete?"
          body={safeItem ? `This will remove ${safeItem.recipient} from Lent Out.` : ''}
          confirmText="OK"
          cancelText="Cancel"
          confirmDestructive
          onCancel={() => setDeleteModalVisible(false)}
          onConfirm={async () => {
            if (!safeItem) return
            setDeleteModalVisible(false)
            await onDelete(safeItem.id)
          }}
          theme={confirmTheme}
        />

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

const confirmTheme = {
  overlayColor: 'rgba(6,8,14,0.58)',
  cardBackground: '#171C27',
  borderColor: 'rgba(255,255,255,0.06)',
  titleColor: '#F5F8FD',
  bodyColor: 'rgba(245,248,253,0.62)',
  cancelBackground: 'rgba(255,255,255,0.04)',
  cancelBorder: 'rgba(255,255,255,0.08)',
  cancelTextColor: '#E9EEF8',
  destructiveBackground: '#C94B59',
  confirmTextColor: '#FFF7F8',
  iconDestructiveBackground: 'rgba(201,75,89,0.14)',
  iconDestructiveColor: '#FF8D8F',
  cardRadius: 28,
  buttonRadius: 999,
} as const

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0E' },
  heroGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 280 },
  header: { paddingTop: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  headerPill: { minHeight: 34, borderRadius: 15, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.08)' },
  headerPillText: { color: '#F5F8FD', fontSize: 13, fontFamily: 'DMSans_700Bold' },
  deleteIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,77,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,77,94,0.18)',
  },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 140 },
  categoryChip: { alignSelf: 'flex-start', minHeight: 30, borderRadius: 15, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.08)' },
  categoryChipText: { color: '#F5F8FD', fontSize: 13, fontFamily: 'DMSans_600SemiBold' },
  title: { marginTop: 16, color: '#F5F8FD', fontSize: 28, lineHeight: 32, fontFamily: 'DMSerifDisplay_400Regular' },
  notes: { marginTop: 8, color: 'rgba(245,248,253,0.54)', fontSize: 14, lineHeight: 20, fontFamily: 'DMSans_500Medium' },
  metricsRow: { marginTop: 18, flexDirection: 'row', gap: 10 },
  metricCard: { flex: 1, borderRadius: 16, backgroundColor: 'rgba(24,28,39,0.96)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', padding: 12 },
  metricLabel: { marginTop: 8, color: 'rgba(245,248,253,0.46)', fontSize: 11, fontFamily: 'DMSans_500Medium' },
  metricValue: { marginTop: 4, color: '#F5F8FD', fontSize: 22, fontFamily: 'DMSans_700Bold' },
  supportRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  supportLabel: { color: 'rgba(245,248,253,0.42)', fontSize: 13, fontFamily: 'DMSans_600SemiBold' },
  datePill: { minHeight: 30, borderRadius: 15, paddingHorizontal: 11, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  datePillSuccess: { backgroundColor: 'rgba(116,216,139,0.12)' },
  datePillText: { color: '#F5F8FD', fontSize: 12, fontFamily: 'DMSans_700Bold' },
  datePillTextSuccess: { color: '#74D88B' },
  markButton: { marginTop: 18, minHeight: 46, borderRadius: 16, backgroundColor: 'rgba(116,216,139,0.12)', borderWidth: 1, borderColor: 'rgba(116,216,139,0.22)', alignItems: 'center', justifyContent: 'center' },
  markButtonText: { color: '#F5F8FD', fontSize: 14, fontFamily: 'DMSans_700Bold' },
  repaidBanner: { marginTop: 18, minHeight: 46, borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(116,216,139,0.12)', borderWidth: 1, borderColor: 'rgba(116,216,139,0.22)' },
  repaidBannerText: { color: '#DDF8E3', fontSize: 13, fontFamily: 'DMSans_600SemiBold', flex: 1 },
  menu: { position: 'absolute', top: 62, right: 16, width: 190, borderRadius: 18, backgroundColor: '#1B202B', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', paddingVertical: 8 },
  menuItem: { minHeight: 42, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuText: { color: '#F5F8FD', fontSize: 15, fontFamily: 'DMSans_600SemiBold' },
  menuDangerText: { color: '#FF8D8F', fontSize: 15, fontFamily: 'DMSans_600SemiBold' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingBottom: 18, paddingTop: 12, backgroundColor: 'rgba(10,10,14,0.92)' },
  primaryButton: { minHeight: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#F8FBFF', fontSize: 16, fontFamily: 'DMSans_700Bold' },
})