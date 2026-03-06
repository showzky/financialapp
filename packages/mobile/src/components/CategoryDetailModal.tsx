// @ts-nocheck
import React, { useState } from 'react'
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { getBarColor, getStatusLabel } from '../utils/budgetColors'
import { transactionApi } from '../services/transactionApi'
import { EditCategoryModal } from './EditCategoryModal'
import type { CategoryWithSpent } from '../services/dashboardApi'

type Props = {
  visible: boolean
  category: CategoryWithSpent | null
  onClose: () => void
  onCategoryUpdated?: () => void
  onCategoryDeleted?: () => void
}

export function CategoryDetailModal({ visible, category, onClose, onCategoryUpdated, onCategoryDeleted }: Props) {
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (!category) return null

  const handleEdit = () => {
    setEditModalVisible(true)
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"?`,
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            setDeleting(true)
            try {
              await transactionApi.deleteCategory(category.id)
              onClose()
              onCategoryDeleted?.()
            } catch (err) {
              Alert.alert('Error', 'Failed to delete category')
            } finally {
              setDeleting(false)
            }
          },
          style: 'destructive',
        },
      ]
    )
  }

  const handleEditClose = () => {
    setEditModalVisible(false)
  }

  const handleCategoryUpdated = () => {
    setEditModalVisible(false)
    onCategoryUpdated?.()
  }

  const safeSpent = Math.max(0, category.monthSpent)
  const rawPct = category.allocated > 0 ? (safeSpent / category.allocated) * 100 : 0
  const clampedPct = Math.min(rawPct, 100)
  const barColor = getBarColor(rawPct)
  const remaining = Math.max(0, category.allocated - safeSpent)
  const isBudget = category.type === 'budget'

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Title row with Edit and Delete buttons */}
          <View style={styles.titleRow}>
            <View style={[styles.iconWrap, { backgroundColor: category.type === 'budget' ? (category.monthSpent / category.allocated * 100 > 100 ? '#fef2f2' : '#f5f3ff') : '#fef3c7' }]}>
              <Ionicons
                name={category.type === 'budget' ? 'pie-chart' : 'repeat'}
                size={20}
                color={category.type === 'budget' ? (category.monthSpent / category.allocated * 100 > 100 ? '#ef4444' : '#8b5cf6') : '#ca8a04'}
              />
            </View>
            <Text style={styles.title}>{category.name}</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleEdit}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="pencil" size={20} color="#6b7280" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                disabled={deleting}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <Ionicons name="trash" size={20} color="#ef4444" />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

        {/* Budget Category: Stats + Progress */}
        {isBudget ? (
          <>
            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statBlock}>
                <Text style={styles.statLabel}>Spent</Text>
                <Text style={[styles.statValue, { color: barColor }]}>
                  NOK {safeSpent.toLocaleString()}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statBlock}>
                <Text style={styles.statLabel}>Budget</Text>
                <Text style={styles.statValue}>NOK {category.allocated.toLocaleString()}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statBlock}>
                <Text style={styles.statLabel}>Remaining</Text>
                <Text style={[styles.statValue, { color: '#10b981' }]}>
                  NOK {remaining.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.barSection}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${clampedPct}%`, backgroundColor: barColor },
                  ]}
                />
              </View>
              <View style={styles.barLabels}>
                <Text style={[styles.statusLabel, { color: barColor }]}>
                  {getStatusLabel(rawPct)}
                </Text>
                <Text style={styles.pctLabel}>{Math.round(Math.max(0, rawPct))}% used</Text>
              </View>
            </View>
          </>
        ) : (
          /* Fixed Category: Simple display */
          <View style={styles.fixedSection}>
            <View style={styles.fixedCard}>
              <Text style={styles.fixedCardLabel}>Fixed Cost</Text>
              <Text style={styles.fixedCardAmount}>NOK {category.allocated.toLocaleString()}</Text>
            </View>
            {safeSpent > 0 && (
              <View style={styles.fixedTransactions}>
                <Text style={styles.fixedTransLabel}>Recorded this month</Text>
                <Text style={styles.fixedTransAmount}>NOK {safeSpent.toLocaleString()}</Text>
              </View>
            )}
          </View>
        )}

        {/* Type badge */}
        <View style={styles.typeBadge}>
          <Ionicons
            name={category.type === 'fixed' ? 'repeat' : 'cash'}
            size={14}
            color="#6b7280"
          />
          <Text style={styles.typeText}>
            {category.type === 'fixed' ? 'Fixed expense' : 'Budget category'}
          </Text>
        </View>

        {/* Placeholder for future transaction list */}
        <View style={styles.placeholder}>
          <Ionicons name="receipt-outline" size={28} color="#d1d5db" />
          <Text style={styles.placeholderText}>
            Transaction history coming in a future phase
          </Text>
        </View>
      </View>
    </Modal>

      <EditCategoryModal
        isOpen={editModalVisible}
        onClose={handleEditClose}
        category={category}
        onCategoryUpdated={handleCategoryUpdated}
      />
    </>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  divider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 4,
  },
  barSection: {
    marginBottom: 16,
  },
  barTrack: {
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  pctLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  fixedSection: {
    marginBottom: 16,
  },
  fixedCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  fixedCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78350f',
    marginBottom: 4,
  },
  fixedCardAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ca8a04',
  },
  fixedTransactions: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fixedTransLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  fixedTransAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  typeText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  placeholder: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  placeholderText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
})
