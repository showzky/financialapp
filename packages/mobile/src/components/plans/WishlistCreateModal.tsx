import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as ImagePicker from 'expo-image-picker'

import { CategoryPickerModal } from '../categories/CategoryPickerModal'
import type { CategoryDto } from '../../services/categoryApi'
import { wishlistApi } from '../../services/wishlistApi'
import type { WishlistPlanItem } from './types'

type Props = {
  visible: boolean
  initialItem?: WishlistPlanItem | null
  onClose: () => void
  onSave: (item: WishlistPlanItem) => void
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-GB', {
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

function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function WishlistCreateModal({ visible, initialItem, onClose, onSave }: Props) {
  const previewRequestIdRef = useRef(0)
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<CategoryDto | null>(null)
  const [productUrl, setProductUrl] = useState('')
  const [price, setPrice] = useState('')
  const [savedAmount, setSavedAmount] = useState('')
  const [date, setDate] = useState(new Date())
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false)
  const [showIosDatePicker, setShowIosDatePicker] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')

  const normalizedUrl = productUrl.trim()
  const canSubmit = name.trim().length > 0 && price.trim().length > 0 && !Number.isNaN(Number(price))

  useEffect(() => {
    if (!visible) {
      setCategoryPickerVisible(false)
      setShowIosDatePicker(false)
      setPreviewLoading(false)
      setPreviewError('')
      return
    }

    setName(initialItem?.name ?? '')
    setNotes(initialItem?.notes ?? '')
    setSelectedCategory(initialItem?.category ?? null)
    setProductUrl(initialItem?.productUrl ?? '')
    setPrice(initialItem ? String(initialItem.price) : '')
    setSavedAmount(initialItem ? String(initialItem.savedAmount) : '')
    setDate(initialItem ? new Date(initialItem.date) : new Date())
    setImageUri(initialItem?.imageUri ?? null)
  }, [visible, initialItem])

  useEffect(() => {
    if (!visible || normalizedUrl.length === 0) {
      setPreviewError('')
      setPreviewLoading(false)
      return
    }

    if (!isHttpUrl(normalizedUrl)) {
      setPreviewLoading(false)
      setPreviewError('Enter a valid product link')
      return
    }

    const requestId = previewRequestIdRef.current + 1
    previewRequestIdRef.current = requestId
    setPreviewLoading(true)
    setPreviewError('')

    const timeoutId = setTimeout(async () => {
      try {
        const preview = await wishlistApi.previewFromUrl(normalizedUrl)
        if (previewRequestIdRef.current !== requestId) return

        if (preview.title && name.trim().length === 0) {
          setName(preview.title)
        }
        if (preview.price !== null && price.trim().length === 0) {
          setPrice(String(preview.price))
        }
        if (preview.imageUrl && !imageUri) {
          setImageUri(preview.imageUrl)
        }
      } catch (error) {
        if (previewRequestIdRef.current !== requestId) return
        setPreviewError(error instanceof Error ? error.message : 'Could not fetch product details')
      } finally {
        if (previewRequestIdRef.current === requestId) {
          setPreviewLoading(false)
        }
      }
    }, 450)

    return () => clearTimeout(timeoutId)
  }, [visible, normalizedUrl, name, price, imageUri])

  const openDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: date,
        mode: 'date',
        onChange: (_event, picked) => {
          if (picked) setDate(picked)
        },
      })
      return
    }

    setShowIosDatePicker(true)
  }

  const handleImagePick = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) {
        Alert.alert('Allow photo access', 'Photo access is needed so you can attach an image to this wish.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        selectionLimit: 1,
      })

      if (result.canceled || result.assets.length === 0) {
        return
      }

      setImageUri(result.assets[0]?.uri ?? null)
    } catch (error) {
      console.error('Wishlist image pick failed:', error)
      Alert.alert('Unable to pick image', 'Try again in a moment.')
    }
  }

  const handleCreate = () => {
    if (!canSubmit) return

    const nextItem: WishlistPlanItem = {
      id: initialItem?.id ?? `wish-${Date.now()}`,
      name: name.trim(),
      notes: notes.trim(),
      category: selectedCategory,
      productUrl: normalizedUrl,
      imageUri,
      price: Number(price),
      savedAmount: savedAmount.trim() === '' ? 0 : Number(savedAmount),
      date: date.toISOString(),
      activities: initialItem?.activities ?? [],
    }

    onSave(nextItem)
    onClose()
  }

  const domainLabel = useMemo(() => {
    if (!normalizedUrl || !isHttpUrl(normalizedUrl)) return 'Paste a product link to auto-fill name and price'
    return formatDomain(normalizedUrl)
  }, [normalizedUrl])

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.root}>
          <View style={styles.overlay} />
          <View style={styles.sheet}>
            <LinearGradient colors={['#141324', '#0d0d18']} style={StyleSheet.absoluteFill} />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.header}>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}>
                  <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.45)" />
                </TouchableOpacity>
                <Text style={styles.title}>Create wish</Text>
                <View style={styles.headerSpacer} />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Name</Text>
                <TextInput value={name} onChangeText={setName} style={styles.textInput} placeholder=" " placeholderTextColor="rgba(255,255,255,0.12)" />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  style={[styles.textInput, styles.notesInput]}
                  multiline
                  placeholder=" "
                  placeholderTextColor="rgba(255,255,255,0.12)"
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Category</Text>
                <TouchableOpacity style={styles.selectField} activeOpacity={0.88} onPress={() => setCategoryPickerVisible(true)}>
                  <View style={styles.categoryPreview}>
                    <View style={styles.categoryIcon}>
                      <Ionicons
                        name={
                          selectedCategory?.icon && selectedCategory.icon in Ionicons.glyphMap
                            ? (selectedCategory.icon as keyof typeof Ionicons.glyphMap)
                            : 'shirt-outline'
                        }
                        size={15}
                        color={selectedCategory?.iconColor ?? '#8DB8FF'}
                      />
                    </View>
                    <Text style={styles.selectValue}>{selectedCategory?.name ?? 'Choose a category'}</Text>
                  </View>
                  <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.28)" />
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Product URL</Text>
                <TextInput
                  value={productUrl}
                  onChangeText={setProductUrl}
                  style={styles.textInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  placeholder="https://example.com/product"
                  placeholderTextColor="rgba(255,255,255,0.16)"
                />
                <View style={styles.linkHintRow}>
                  <Text style={styles.linkHint}>{domainLabel}</Text>
                  {previewLoading ? <ActivityIndicator size="small" color="#6DB2FF" /> : null}
                </View>
                {previewError ? <Text style={styles.errorText}>{previewError}</Text> : null}
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Color</Text>
                <View style={styles.colorTrack}>
                  <View style={styles.colorFill} />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Price</Text>
                <View style={styles.amountRow}>
                  <TextInput
                    value={price}
                    onChangeText={setPrice}
                    style={[styles.textInput, styles.amountInput]}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.16)"
                  />
                  <View style={styles.currencyPill}>
                    <Text style={styles.currencyText}>NOK</Text>
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Saved amount</Text>
                <View style={styles.amountRow}>
                  <TextInput
                    value={savedAmount}
                    onChangeText={setSavedAmount}
                    style={[styles.textInput, styles.amountInput]}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.16)"
                  />
                  <View style={styles.currencyPill}>
                    <Text style={styles.currencyText}>NOK</Text>
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Date</Text>
                <TouchableOpacity style={styles.selectField} activeOpacity={0.88} onPress={openDatePicker}>
                  <Text style={styles.selectValue}>{formatDate(date)}</Text>
                  <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.28)" />
                </TouchableOpacity>
              </View>

              {showIosDatePicker && Platform.OS === 'ios' ? (
                <View style={styles.iosDateWrap}>
                  <DateTimePicker
                    mode="date"
                    display="spinner"
                    value={date}
                    onChange={(_event, picked) => {
                      if (picked) setDate(picked)
                    }}
                  />
                </View>
              ) : null}

              <View style={styles.section}>
                <Text style={styles.label}>Image</Text>
                <View style={styles.imageRow}>
                  <View style={styles.imagePreview}>
                    {imageUri ? (
                      <Text style={styles.imageSelectedText}>Linked image ready</Text>
                    ) : (
                      <Text style={styles.imagePlaceholder}>None</Text>
                    )}
                  </View>
                  <TouchableOpacity style={styles.addImageButton} activeOpacity={0.88} onPress={handleImagePick}>
                    <Text style={styles.addImageText}>Add</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cameraButton} activeOpacity={0.88} onPress={handleImagePick}>
                    <Ionicons name="camera-outline" size={18} color="rgba(255,255,255,0.82)" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity activeOpacity={0.9} onPress={handleCreate} disabled={!canSubmit}>
                <LinearGradient colors={['#6DB2FF', '#4C89E8']} style={[styles.primaryButton, !canSubmit && styles.primaryButtonDisabled]}>
                <Text style={styles.primaryButtonText}>{initialItem ? 'Save' : 'Create'}</Text>
              </LinearGradient>
            </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} activeOpacity={0.85} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <CategoryPickerModal
        visible={categoryPickerVisible}
        initialKind="expense"
        selectedCategoryId={selectedCategory?.id}
        onClose={() => setCategoryPickerVisible(false)}
        onSelect={(category) => {
          setSelectedCategory(category)
          setCategoryPickerVisible(false)
        }}
      />
    </>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(0,0,0,0.42)', justifyContent: 'flex-end' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4,6,10,0.32)' },
  sheet: {
    maxHeight: '94%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 28 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  title: { color: '#F5F8FD', fontSize: 22, fontFamily: 'DMSans_700Bold' },
  headerSpacer: { width: 18 },
  section: { marginBottom: 14 },
  label: { marginBottom: 8, color: 'rgba(235,240,248,0.42)', fontSize: 11, fontFamily: 'DMSans_600SemiBold' },
  textInput: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    color: '#F5F8FD',
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
  },
  notesInput: { minHeight: 84, paddingTop: 14, textAlignVertical: 'top' },
  selectField: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryPreview: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(109,178,255,0.14)',
  },
  selectValue: { color: '#F5F8FD', fontSize: 15, fontFamily: 'DMSans_500Medium' },
  linkHintRow: { marginTop: 8, minHeight: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  linkHint: { flex: 1, color: 'rgba(198,213,240,0.5)', fontSize: 12, fontFamily: 'DMSans_500Medium' },
  errorText: { marginTop: 6, color: '#F5797E', fontSize: 12, fontFamily: 'DMSans_600SemiBold' },
  colorTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  colorFill: { width: '100%', height: '100%', opacity: 0.52, backgroundColor: '#4C89E8' },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  amountInput: { flex: 1 },
  currencyPill: {
    minWidth: 68,
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
  },
  currencyText: { color: 'rgba(245,248,253,0.82)', fontSize: 14, fontFamily: 'DMSans_700Bold' },
  iosDateWrap: { marginBottom: 14, borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.04)' },
  imageRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  imagePreview: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  imageSelectedText: { color: '#CFE1FF', fontSize: 13, fontFamily: 'DMSans_700Bold' },
  imagePlaceholder: { color: 'rgba(245,248,253,0.26)', fontSize: 14, fontFamily: 'DMSans_500Medium' },
  addImageButton: {
    minWidth: 68,
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(123,82,220,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(123,82,220,0.18)',
    paddingHorizontal: 12,
  },
  addImageText: { color: '#E3DAFF', fontSize: 14, fontFamily: 'DMSans_700Bold' },
  cameraButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  primaryButton: { minHeight: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  primaryButtonDisabled: { opacity: 0.45 },
  primaryButtonText: { color: '#F8FBFF', fontSize: 16, fontFamily: 'DMSans_700Bold' },
  cancelButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  cancelButtonText: { color: 'rgba(245,248,253,0.84)', fontSize: 15, fontFamily: 'DMSans_700Bold' },
})
