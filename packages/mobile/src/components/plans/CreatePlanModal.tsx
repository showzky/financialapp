import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import type { ComponentProps } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import * as ImagePicker from 'expo-image-picker'
import { AccountIconPickerModal } from '../balance/AccountIconPickerModal'
import type { AccountIconChoice } from '../../shared/contracts/accounts'
import { CategoryPickerModal } from '../categories/CategoryPickerModal'
import type { CategoryDto } from '../../services/categoryApi'

export type PlanCreateVariant = 'wishlist' | 'borrowed' | 'lent'

type Props = {
  visible: boolean
  variant: PlanCreateVariant
  onClose: () => void
}

const copyByVariant: Record<
  PlanCreateVariant,
  {
    title: string
    submitLabel: string
  }
> = {
  wishlist: {
    title: 'Create wish',
    submitLabel: 'Create',
  },
  borrowed: {
    title: 'Create loan',
    submitLabel: 'Create',
  },
  lent: {
    title: 'Create lent item',
    submitLabel: 'Create',
  },
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function CreatePlanModal({ visible, variant, onClose }: Props) {
  const config = copyByVariant[variant]
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<CategoryDto | null>(null)
  const [color, setColor] = useState('#4C89E8')
  const [requiredAmount, setRequiredAmount] = useState('')
  const [addProgress, setAddProgress] = useState(true)
  const [accumulatedAmount, setAccumulatedAmount] = useState('')
  const [date, setDate] = useState(new Date())
  const [selectedIcon, setSelectedIcon] = useState<AccountIconChoice | null>(null)
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null)
  const [iconPickerVisible, setIconPickerVisible] = useState(false)
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false)
  const [showIosDatePicker, setShowIosDatePicker] = useState(false)

  const fallbackIcon = useMemo(
    (): {
      name: ComponentProps<typeof Ionicons>['name']
      color: string
      backgroundColor: string
    } => ({
      name:
        variant === 'wishlist'
          ? 'sparkles-outline'
          : variant === 'borrowed'
            ? 'wallet-outline'
            : 'swap-horizontal-outline',
      color: '#8DB8FF',
      backgroundColor: 'rgba(109,178,255,0.16)',
    }),
    [variant],
  )

  useEffect(() => {
    if (!visible) {
      setName('')
      setNotes('')
      setSelectedCategory(null)
      setColor('#4C89E8')
      setRequiredAmount('')
      setAddProgress(true)
      setAccumulatedAmount('')
      setDate(new Date())
      setSelectedIcon(null)
      setSelectedImageUri(null)
      setIconPickerVisible(false)
      setCategoryPickerVisible(false)
      setShowIosDatePicker(false)
    }
  }, [visible])

  const openDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: date,
        mode: 'date',
        onChange: (_event, picked) => {
          if (picked) {
            setDate(picked)
          }
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
        Alert.alert('Allow photo access', 'Photo access is needed so you can attach an image to this item.')
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

      setSelectedImageUri(result.assets[0]?.uri ?? null)
    } catch (error) {
      console.error('Plan image pick failed:', error)
      Alert.alert('Unable to pick image', 'Try again in a moment.')
    }
  }

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
                <Text style={styles.title}>{config.title}</Text>
                <View style={styles.headerSpacer} />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  style={styles.textInput}
                  placeholder=" "
                  placeholderTextColor="rgba(255,255,255,0.12)"
                />
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
                <TouchableOpacity
                  style={styles.selectField}
                  activeOpacity={0.88}
                  onPress={() => setCategoryPickerVisible(true)}
                >
                  <View style={styles.categoryPreview}>
                    <View style={styles.categoryIcon}>
                      <Ionicons
                        name={
                          selectedCategory?.icon && selectedCategory.icon in Ionicons.glyphMap
                            ? (selectedCategory.icon as ComponentProps<typeof Ionicons>['name'])
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
                <Text style={styles.label}>Choose an icon</Text>
                <TouchableOpacity
                  style={styles.selectField}
                  activeOpacity={0.88}
                  onPress={() => setIconPickerVisible(true)}
                >
                  <View style={styles.categoryPreview}>
                    <View style={styles.categoryIcon}>
                      <Ionicons name="sparkles-outline" size={15} color="#8DB8FF" />
                    </View>
                    <Text style={styles.selectValue}>{selectedIcon?.label ?? 'Choose an icon'}</Text>
                  </View>
                  <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.28)" />
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Color</Text>
                <View style={styles.colorTrack}>
                  <View style={[styles.colorFill, { backgroundColor: color }]} />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Required amount</Text>
                <View style={styles.amountRow}>
                  <TextInput
                    value={requiredAmount}
                    onChangeText={setRequiredAmount}
                    style={[styles.textInput, styles.amountInput]}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.16)"
                  />
                  <View style={styles.currencyPill}>
                    <Text style={styles.currencyText}>USD</Text>
                  </View>
                </View>
              </View>

              <View style={styles.progressToggleRow}>
                <Text style={styles.progressLabel}>Add progress</Text>
                <Switch
                  value={addProgress}
                  onValueChange={setAddProgress}
                  trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(123,82,220,0.4)' }}
                  thumbColor={addProgress ? '#c65cff' : '#f4f4f8'}
                />
              </View>

              {addProgress ? (
                <View style={styles.section}>
                  <Text style={styles.label}>Accumulated amount</Text>
                  <View style={styles.amountRow}>
                    <TextInput
                      value={accumulatedAmount}
                      onChangeText={setAccumulatedAmount}
                      style={[styles.textInput, styles.amountInput]}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor="rgba(255,255,255,0.16)"
                    />
                    <View style={styles.currencyPill}>
                      <Text style={styles.currencyText}>USD</Text>
                    </View>
                  </View>
                </View>
              ) : null}

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
                      if (picked) {
                        setDate(picked)
                      }
                    }}
                  />
                </View>
              ) : null}

              <View style={styles.section}>
                <Text style={styles.label}>Image</Text>
                <View style={styles.imageRow}>
                  <View style={styles.imagePreview}>
                    {selectedImageUri ? (
                      <View style={styles.imagePreviewInner}>
                        <Text style={styles.imageSelectedText}>Selected</Text>
                      </View>
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

              <TouchableOpacity activeOpacity={0.9} onPress={onClose}>
                <LinearGradient colors={['#6DB2FF', '#4C89E8']} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>{config.submitLabel}</Text>
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

      <AccountIconPickerModal
        visible={iconPickerVisible}
        selectedIcon={selectedIcon}
        fallbackIcon={fallbackIcon}
        onClose={() => setIconPickerVisible(false)}
        onReset={() => setSelectedIcon(null)}
        onSelectIcon={(icon) => {
          setSelectedIcon(icon)
          setIconPickerVisible(false)
        }}
      />
    </>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4,6,10,0.32)',
  },
  sheet: {
    maxHeight: '94%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: {
    color: '#F5F8FD',
    fontSize: 22,
    fontFamily: 'DMSans_700Bold',
  },
  headerSpacer: {
    width: 18,
  },
  section: {
    marginBottom: 14,
  },
  label: {
    marginBottom: 8,
    color: 'rgba(235,240,248,0.42)',
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
  },
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
  notesInput: {
    minHeight: 84,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
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
  categoryPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(109,178,255,0.14)',
  },
  selectValue: {
    color: '#F5F8FD',
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
  },
  colorTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  colorFill: {
    width: '100%',
    height: '100%',
    opacity: 0.42,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  amountInput: {
    flex: 1,
  },
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
  currencyText: {
    color: 'rgba(245,248,253,0.82)',
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
  progressToggleRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  progressLabel: {
    color: 'rgba(245,248,253,0.76)',
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
  },
  iosDateWrap: {
    marginBottom: 14,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
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
  imagePreviewInner: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(109,178,255,0.12)',
  },
  imageSelectedText: {
    color: '#CFE1FF',
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
  },
  imagePlaceholder: {
    color: 'rgba(245,248,253,0.26)',
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
  },
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
  addImageText: {
    color: '#E3DAFF',
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
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
  primaryButton: {
    minHeight: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  primaryButtonText: {
    color: '#F8FBFF',
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
  },
  cancelButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: 'rgba(245,248,253,0.84)',
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
  },
})
