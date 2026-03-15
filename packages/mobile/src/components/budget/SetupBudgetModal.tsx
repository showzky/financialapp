import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

import type { CategoryWithSpent } from '../../services/dashboardApi'
import { monthlyBudgetCategoryAssignmentApi } from '../../services/monthlyBudgetCategoryAssignmentApi'
import { monthlyBudgetTargetApi } from '../../services/monthlyBudgetTargetApi'

type BudgetSetupTarget = {
  id: string | null
  name: string
  icon: string | null
  color: string | null
  iconColor: string | null
  allocated: number
  canDelete: boolean
}

type Props = {
  visible: boolean
  category: CategoryWithSpent | null
  canDeleteCategoryBudget?: boolean
  target?: BudgetSetupTarget | null
  selectedMonth?: Date
  onClose: () => void
  onSaved: () => void
}

function getIoniconName(icon: string | null | undefined): keyof typeof Ionicons.glyphMap {
  if (icon && icon in Ionicons.glyphMap) {
    return icon as keyof typeof Ionicons.glyphMap
  }

  return 'ellipse-outline'
}

export function SetupBudgetModal({
  visible,
  category,
  canDeleteCategoryBudget = true,
  target,
  selectedMonth,
  onClose,
  onSaved,
}: Props) {
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const resolvedTarget = target ?? (category
    ? {
        id: category.id,
        name: category.name,
        icon: category.icon,
        color: category.color,
        iconColor: category.iconColor,
        allocated: category.allocated,
        canDelete: canDeleteCategoryBudget,
      }
    : null)
  const targetKey = resolvedTarget ? `${resolvedTarget.id ?? 'summary'}:${resolvedTarget.allocated}` : 'none'

  useEffect(() => {
    if (!visible || !resolvedTarget) {
      return
    }

    setAmount(resolvedTarget.allocated > 0 ? String(resolvedTarget.allocated) : '')
    setError('')
  }, [visible, targetKey])

  const parsedAmount = useMemo(() => Number(amount.replace(',', '.')), [amount])

  const handleSave = async () => {
    if (!resolvedTarget) {
      return
    }

    if (!amount.trim() || Number.isNaN(parsedAmount) || parsedAmount < 0) {
      setError('Enter a valid budget amount')
      return
    }

    if (!resolvedTarget.id) {
      if (!selectedMonth) {
        setError('Missing month for total budget')
        return
      }

      setSubmitting(true)
      setError('')

      try {
        await monthlyBudgetTargetApi.set(selectedMonth, parsedAmount)
        onSaved()
        onClose()
      } catch (err) {
        setError('Failed to save total budget')
      } finally {
        setSubmitting(false)
      }
      return
    }

    if (!selectedMonth) {
      setError('Missing month for category budget')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await monthlyBudgetCategoryAssignmentApi.set(selectedMonth, resolvedTarget.id, parsedAmount)
      onSaved()
      onClose()
    } catch (err) {
      setError('Failed to save budget')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!resolvedTarget?.id) {
      return
    }

    if (!selectedMonth) {
      setError('Missing month for category budget')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await monthlyBudgetCategoryAssignmentApi.remove(selectedMonth, resolvedTarget.id)
      onSaved()
      onClose()
    } catch (err) {
      setError('Failed to remove category budget')
    } finally {
      setSubmitting(false)
    }
  }

  if (!resolvedTarget) {
    return null
  }

  const accent = resolvedTarget.iconColor || resolvedTarget.color || '#7da8ff'

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={styles.card}>
          <LinearGradient colors={['rgba(42,40,66,0.98)', 'rgba(24,25,37,0.98)']} style={StyleSheet.absoluteFill} />

          <Text style={styles.title}>Setup budget</Text>

          <View style={styles.categoryRow}>
            <View style={[styles.categoryIconWrap, { backgroundColor: resolvedTarget.color || '#24324a' }]}>
              <Ionicons name={getIoniconName(resolvedTarget.icon)} size={16} color={accent} />
            </View>
            <Text style={styles.categoryName}>{resolvedTarget.name}</Text>
          </View>

          <Text style={styles.inputLabel}>Budget</Text>

          <View style={styles.inputRow}>
            <View style={styles.amountField}>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.22)"
                keyboardType="decimal-pad"
                style={styles.amountInput}
              />
              <Ionicons name="calculator-outline" size={16} color="rgba(255,255,255,0.32)" />
            </View>

            <View style={styles.currencyChip}>
              <Text style={styles.currencyText}>NOK</Text>
              <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.4)" />
            </View>

            {resolvedTarget.canDelete ? (
              <TouchableOpacity style={styles.deleteBtn} onPress={() => void handleDelete()} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator size="small" color="#ff6e6e" />
                ) : (
                  <Ionicons name="trash-outline" size={18} color="#ff6e6e" />
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.deleteSpacer} />
            )}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onClose} disabled={submitting}>
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryBtn} onPress={() => void handleSave()} disabled={submitting}>
              <LinearGradient colors={['#6eb3ff', '#4e97f2']} style={styles.primaryBtnGradient}>
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.primaryBtnText}>OK</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(6,6,10,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  card: {
    width: '100%',
    maxWidth: 336,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(115,126,188,0.22)',
    padding: 18,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 14,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  categoryIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    color: '#dfe7ff',
    fontSize: 16,
    fontWeight: '700',
  },
  inputLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  amountField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    minHeight: 48,
  },
  amountInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 12,
  },
  currencyChip: {
    minWidth: 78,
    minHeight: 48,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  currencyText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  deleteBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteSpacer: {
    width: 42,
    height: 42,
  },
  errorText: {
    color: '#ff8f8f',
    fontSize: 12,
    marginTop: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
  },
  secondaryBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  secondaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  primaryBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    overflow: 'hidden',
  },
  primaryBtnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
})
