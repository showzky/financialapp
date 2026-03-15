import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { categoryApi, type CategoryDto, type CategoryKind } from '../../services/categoryApi'
import {
  CATEGORY_COLOR_OPTIONS,
  CATEGORY_ICON_COLOR_OPTIONS,
  CATEGORY_ICON_OPTIONS,
  PARENT_CATEGORY_OPTIONS,
  type CategoryIconName,
} from '../../features/categories/catalog'

type Props = {
  visible: boolean
  kind: CategoryKind
  category?: CategoryDto | null
  onClose: () => void
  onSaved: () => void
}

type PickerKey = 'parent' | 'icon' | null

function PickerSheet({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean
  title: string
  options: string[]
  selected: string
  onSelect: (value: string) => void
  onClose: () => void
}) {
  if (!visible) return null

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheetCard}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.sheetRow}
                onPress={() => {
                  onSelect(option)
                  onClose()
                }}
              >
                <Text style={styles.sheetRowText}>{option}</Text>
                {selected === option ? <Ionicons name="checkmark" size={18} color="#78d89c" /> : null}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

export function CategoryEditorModal({ visible, kind, category, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets()
  const [name, setName] = useState('')
  const [parentName, setParentName] = useState('')
  const [icon, setIcon] = useState<CategoryIconName>('ellipse-outline')
  const [color, setColor] = useState<string>(CATEGORY_COLOR_OPTIONS[0])
  const [iconColor, setIconColor] = useState<string>(CATEGORY_ICON_COLOR_OPTIONS[0])
  const [pickerKey, setPickerKey] = useState<PickerKey>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!visible) return
    setName(category?.name ?? '')
    setParentName(category && category.parentName !== category.name ? category.parentName : '')
    setIcon((category?.icon as CategoryIconName) ?? 'ellipse-outline')
    setColor(category?.color ?? CATEGORY_COLOR_OPTIONS[0])
    setIconColor(category?.iconColor ?? CATEGORY_ICON_COLOR_OPTIONS[0])
    setPickerKey(null)
    setSubmitting(false)
    setError('')
  }, [category, kind, visible])

  const title = category ? 'Edit category' : 'Add category'
  const cta = category ? 'Save' : 'Add'
  const nameError = !name.trim() ? 'Name is required' : ''

  const iconOptions = useMemo(() => CATEGORY_ICON_OPTIONS.map(String), [])

  const handleSubmit = async () => {
    if (nameError) {
      setError(nameError)
      return
    }

    try {
      setSubmitting(true)
      setError('')
      if (category) {
        await categoryApi.updateCategory(category.id, {
          kind,
          name: name.trim(),
          parentName: parentName.trim() || undefined,
          icon,
          color,
          iconColor,
        })
      } else {
        await categoryApi.createCategory({
          kind,
          name: name.trim(),
          parentName: parentName.trim() || undefined,
          icon,
          color,
          iconColor,
          type: kind === 'expense' ? 'budget' : undefined,
          allocated: kind === 'expense' ? 0 : undefined,
        })
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={styles.editorRoot}>
          <LinearGradient colors={['#171623', '#0a0a0e', '#101420']} style={StyleSheet.absoluteFill} />

          <View style={[styles.editorHeader, { paddingTop: Math.max(insets.top, 12) }]}>
            <TouchableOpacity style={styles.headerButton} onPress={onClose} activeOpacity={0.85}>
              <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.82)" />
            </TouchableOpacity>
            <Text style={styles.editorTitle}>{title}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView contentContainerStyle={[styles.editorContent, { paddingBottom: Math.max(insets.bottom, 18) + 110 }]}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Category name"
              placeholderTextColor="rgba(255,255,255,0.24)"
            />

            <Text style={styles.fieldLabel}>Parent category</Text>
            <TouchableOpacity style={styles.selectRow} onPress={() => setPickerKey('parent')} activeOpacity={0.88}>
              <Text style={[styles.selectText, !parentName && styles.placeholderText]}>
                {parentName || 'Parent category'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.38)" />
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Choose an icon</Text>
            <TouchableOpacity style={styles.selectRow} onPress={() => setPickerKey('icon')} activeOpacity={0.88}>
              <View style={[styles.iconPreviewWrap, { backgroundColor: color, borderColor: 'rgba(255,255,255,0.08)' }]}>
                <Ionicons name={icon} size={16} color={iconColor} />
              </View>
              <Text style={styles.selectText}>{icon}</Text>
              <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.38)" />
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Color</Text>
            <View style={styles.swatchRow}>
              {CATEGORY_COLOR_OPTIONS.map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.swatch, { backgroundColor: value }, color === value && styles.swatchSelected]}
                  onPress={() => setColor(value)}
                />
              ))}
            </View>

            <Text style={styles.fieldLabel}>Icon color</Text>
            <View style={styles.swatchRow}>
              {CATEGORY_ICON_COLOR_OPTIONS.map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.swatch, { backgroundColor: value }, iconColor === value && styles.swatchSelected]}
                  onPress={() => setIconColor(value)}
                />
              ))}
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity style={styles.saveButton} onPress={() => void handleSubmit()} activeOpacity={0.9}>
              <LinearGradient colors={['rgba(92,163,255,0.98)', 'rgba(70,138,230,0.98)']} style={styles.saveGradient}>
                {submitting ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.saveText}>{cta}</Text>}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} activeOpacity={0.82}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <PickerSheet
        visible={pickerKey === 'parent'}
        title="Parent category"
        options={PARENT_CATEGORY_OPTIONS[kind]}
        selected={parentName}
        onSelect={setParentName}
        onClose={() => setPickerKey(null)}
      />
      <PickerSheet
        visible={pickerKey === 'icon'}
        title="Choose an icon"
        options={iconOptions}
        selected={icon}
        onSelect={(value) => setIcon(value as CategoryIconName)}
        onClose={() => setPickerKey(null)}
      />
    </>
  )
}

const styles = StyleSheet.create({
  editorRoot: { flex: 1, backgroundColor: '#0a0a0e' },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  editorTitle: { color: 'rgba(255,255,255,0.92)', fontSize: 22, fontFamily: 'DMSans_700Bold' },
  headerSpacer: { width: 42 },
  editorContent: { paddingHorizontal: 20, paddingTop: 22 },
  fieldLabel: {
    marginTop: 14,
    marginBottom: 8,
    color: 'rgba(255,255,255,0.32)',
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
  },
  input: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 14,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontFamily: 'DMSans_500Medium',
  },
  selectRow: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectText: {
    flex: 1,
    color: 'rgba(255,255,255,0.88)',
    fontSize: 16,
    fontFamily: 'DMSans_500Medium',
  },
  placeholderText: {
    color: 'rgba(255,255,255,0.34)',
  },
  iconPreviewWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  swatchSelected: {
    borderColor: 'white',
    borderWidth: 2,
  },
  errorText: {
    marginTop: 16,
    color: '#ffb1a6',
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
  },
  footer: { paddingHorizontal: 20, gap: 14 },
  saveButton: { borderRadius: 22, overflow: 'hidden' },
  saveGradient: { minHeight: 58, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: 'white', fontSize: 20, fontFamily: 'DMSans_700Bold' },
  cancelText: { textAlign: 'center', color: 'rgba(255,255,255,0.82)', fontSize: 16, fontFamily: 'DMSans_700Bold' },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(6,8,16,0.55)',
  },
  sheetCard: {
    width: '86%',
    maxHeight: '70%',
    borderRadius: 24,
    backgroundColor: '#171623',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
  },
  sheetTitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 18,
    marginBottom: 10,
    fontFamily: 'DMSans_700Bold',
  },
  sheetRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  sheetRowText: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
  },
})
