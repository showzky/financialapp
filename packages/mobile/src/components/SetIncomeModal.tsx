// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { authApi } from '../services/authApi'
import { setIncomeModalStyles as styles } from './SetIncomeModal.styles'

const { height: SCREEN_H } = Dimensions.get('window')

const INCOME_CATEGORIES = [
  { id: 'salary', label: 'Salary', icon: 'cash-outline', color: 'rgba(94,189,151,0.9)' },
  { id: 'investment', label: 'Investment', icon: 'trending-up-outline', color: 'rgba(201,168,76,0.9)' },
  { id: 'rewards', label: 'Rewards', icon: 'star-outline', color: 'rgba(212,135,74,0.9)' },
  { id: 'gifts', label: 'Gifts', icon: 'gift-outline', color: 'rgba(201,107,107,0.9)' },
  { id: 'business', label: 'Business', icon: 'briefcase-outline', color: 'rgba(91,163,201,0.9)' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal', color: 'rgba(180,160,200,0.9)' },
]

type Props = {
  isOpen: boolean
  currentIncome: number
  onClose: () => void
  onIncomeUpdated: () => void
}

type IncomeCategory = (typeof INCOME_CATEGORIES)[number]

function IncomeCategoryPicker({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean
  selected: IncomeCategory
  onSelect: (category: IncomeCategory) => void
  onClose: () => void
}) {
  const translateY = useRef(new Animated.Value(0)).current
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 5,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy)
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 80) {
          Animated.timing(translateY, {
            toValue: SCREEN_H * 0.55,
            duration: 220,
            useNativeDriver: true,
          }).start(onClose)
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start()
        }
      },
    }),
  ).current

  useEffect(() => {
    if (visible) translateY.setValue(0)
  }, [translateY, visible])

  if (!visible) return null

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.categoryOverlay}>
        <TouchableOpacity style={styles.categoryBackdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.categorySheet, { transform: [{ translateY }] }]}>
          <LinearGradient colors={['#1e1c2e', '#13121e']} style={styles.sheetGradient} />
          <View {...panResponder.panHandlers} style={styles.categoryHandleArea}>
            <View style={styles.handle} />
          </View>
          <View style={styles.categoryContent}>
            <View style={styles.categoryTopRow}>
              <Text style={styles.categoryTitle}>Category</Text>
              <TouchableOpacity style={styles.editPill} activeOpacity={0.9}>
                <Text style={styles.editPillText}>Edit</Text>
              </TouchableOpacity>
            </View>
            {INCOME_CATEGORIES.map((category, index) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryRow, index < INCOME_CATEGORIES.length - 1 && styles.categoryRowBorder]}
                onPress={() => {
                  onSelect(category)
                  onClose()
                }}
                activeOpacity={0.9}
              >
                <View
                  style={[
                    styles.categoryRowIcon,
                    {
                      backgroundColor: category.color.replace('0.9', '0.12'),
                      borderColor: category.color.replace('0.9', '0.25'),
                    },
                  ]}
                >
                  <Ionicons name={category.icon as any} size={16} color={category.color} />
                </View>
                <Text style={styles.categoryRowLabel}>{category.label}</Text>
                {selected.id === category.id ? (
                  <Ionicons name="checkmark" size={18} color="rgba(94,189,151,0.85)" />
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

export function SetIncomeModal({ isOpen, currentIncome, onClose, onIncomeUpdated }: Props) {
  const [income, setIncome] = useState(currentIncome > 0 ? String(currentIncome) : '')
  const [incomeName, setIncomeName] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<IncomeCategory>(INCOME_CATEGORIES[0])
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false)
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Pre-fill with current income each time the modal opens
  useEffect(() => {
    if (isOpen) {
      setIncome(currentIncome > 0 ? String(currentIncome) : '')
      setIncomeName('')
      setSelectedCategory(INCOME_CATEGORIES[0])
      setHasTriedSubmit(false)
      setSubmitting(false)
      setSubmitError('')
      const timer = setTimeout(() => {
        setCategoryPickerOpen(true)
      }, 250)

      return () => clearTimeout(timer)
    }

    setCategoryPickerOpen(false)
  }, [isOpen, currentIncome])

  const incomeError =
    income === '' || isNaN(Number(income)) || Number(income) < 0
      ? 'Enter a valid income amount (0 or more)'
      : ''

  const handleClose = () => {
    setIncomeName('')
    setCategoryPickerOpen(false)
    setHasTriedSubmit(false)
    setSubmitError('')
    onClose()
  }

  const handleSubmit = async () => {
    setHasTriedSubmit(true)
    if (incomeError) return

    setSubmitting(true)
    setSubmitError('')
    try {
      await authApi.updateIncome(Number(income))
      onIncomeUpdated()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update income')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.sheet}>
            <LinearGradient colors={['#161524', '#0d0d18']} style={styles.sheetGradient} />
            <View style={styles.handle} />

            <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
              <View style={styles.header}>
                <TouchableOpacity
                  onPress={handleClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
                <Text style={styles.title}>Set Income</Text>
                <View style={styles.headerSpacer} />
              </View>

              <View style={styles.content}>
                <View style={styles.section}>
                  <Text style={styles.label}>CATEGORY</Text>
                  <TouchableOpacity
                    style={styles.selectRow}
                    activeOpacity={0.9}
                    onPress={() => setCategoryPickerOpen(true)}
                  >
                    <View
                      style={[
                        styles.selectIcon,
                        {
                          backgroundColor: selectedCategory.color.replace('0.9', '0.12'),
                          borderColor: selectedCategory.color.replace('0.9', '0.25'),
                        },
                      ]}
                    >
                      <Ionicons name={selectedCategory.icon as any} size={16} color={selectedCategory.color} />
                    </View>
                    <Text style={styles.selectText}>{selectedCategory.label}</Text>
                    <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.3)" />
                  </TouchableOpacity>
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>AMOUNT</Text>
                  <View style={styles.amountRow}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.amountInput,
                        hasTriedSubmit && incomeError ? styles.inputError : undefined,
                      ]}
                      placeholder="0"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      keyboardType="decimal-pad"
                      value={income}
                      onChangeText={setIncome}
                      editable={!submitting}
                      autoFocus
                    />
                    <View style={styles.currencyPill}>
                      <Text style={styles.currencyText}>KR</Text>
                    </View>
                  </View>
                  {hasTriedSubmit && incomeError ? (
                    <Text style={styles.errorText}>{incomeError}</Text>
                  ) : null}
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>ACCOUNT</Text>
                  <TouchableOpacity style={styles.selectRow} activeOpacity={0.9}>
                    <Text style={styles.placeholderText}>None</Text>
                    <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.2)" />
                  </TouchableOpacity>
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>DATE</Text>
                  <View style={styles.dateRow}>
                    <View style={[styles.input, styles.dateField]}>
                      <Text style={styles.dateText}>14 March 2026</Text>
                      <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.3)" />
                    </View>
                    <TouchableOpacity style={styles.todayPill} disabled>
                      <Text style={styles.todayText}>Today</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>TIME</Text>
                  <View style={styles.inlineField}>
                    <Text style={styles.dateText}>08:31</Text>
                    <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.3)" />
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>NAME (OPTIONAL)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. March salary"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={incomeName}
                    onChangeText={setIncomeName}
                    editable={!submitting}
                  />
                  <Text style={styles.hint}>This form still updates your current income total.</Text>
                </View>

                {submitError ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={16} color="rgba(201,107,107,0.9)" />
                    <Text style={styles.errorBoxText}>{submitError}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleClose}
                  disabled={submitting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  <LinearGradient
                    colors={
                      hasTriedSubmit && incomeError
                        ? ['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.1)']
                        : ['rgba(94,189,151,0.9)', 'rgba(60,150,110,0.9)']
                    }
                    style={styles.submitGradient}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#0a0a0e" />
                    ) : (
                      <Text style={styles.submitButtonText}>Create</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
        <IncomeCategoryPicker
          visible={categoryPickerOpen}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
          onClose={() => setCategoryPickerOpen(false)}
        />
      </View>
    </Modal>
  )
}
