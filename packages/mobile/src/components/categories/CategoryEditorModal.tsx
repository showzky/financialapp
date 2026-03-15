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
  draftCategory?: Partial<CategoryDto> | null
  showSubcategorySection?: boolean
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

function getIoniconName(icon: string | null | undefined): keyof typeof Ionicons.glyphMap {
  if (icon && icon in Ionicons.glyphMap) {
    return icon as keyof typeof Ionicons.glyphMap
  }

  return 'ellipse-outline'
}

export function CategoryEditorModal({
  visible,
  kind,
  category,
  draftCategory,
  showSubcategorySection = true,
  onClose,
  onSaved,
}: Props) {
  const insets = useSafeAreaInsets()
  const [name, setName] = useState('')
  const [parentName, setParentName] = useState('')
  const [icon, setIcon] = useState<CategoryIconName>('ellipse-outline')
  const [color, setColor] = useState<string>(CATEGORY_COLOR_OPTIONS[0])
  const [iconColor, setIconColor] = useState<string>(CATEGORY_ICON_COLOR_OPTIONS[0])
  const [expenseType, setExpenseType] = useState<'budget' | 'fixed'>('budget')
  const [dueDayOfMonth, setDueDayOfMonth] = useState('')
  const [pickerKey, setPickerKey] = useState<PickerKey>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [childCategories, setChildCategories] = useState<CategoryDto[]>([])
  const [childEditorVisible, setChildEditorVisible] = useState(false)
  const [editingChildCategory, setEditingChildCategory] = useState<CategoryDto | null>(null)

  useEffect(() => {
    if (!visible) return
    setName(category?.name ?? draftCategory?.name ?? '')
    setParentName(category && category.parentName !== category.name ? category.parentName : draftCategory?.parentName ?? '')
    setIcon((category?.icon as CategoryIconName) ?? (draftCategory?.icon as CategoryIconName) ?? 'ellipse-outline')
    setColor(category?.color ?? draftCategory?.color ?? CATEGORY_COLOR_OPTIONS[0])
    setIconColor(category?.iconColor ?? draftCategory?.iconColor ?? CATEGORY_ICON_COLOR_OPTIONS[0])
    setExpenseType(
      kind === 'expense'
        ? (category?.type ?? draftCategory?.type ?? 'budget')
        : 'budget',
    )
    setDueDayOfMonth(
      kind === 'expense'
        ? category?.dueDayOfMonth?.toString() ?? draftCategory?.dueDayOfMonth?.toString() ?? ''
        : '',
    )
    setPickerKey(null)
    setSubmitting(false)
    setError('')
    setChildCategories([])
    setEditingChildCategory(null)
    setChildEditorVisible(false)
  }, [category, draftCategory, kind, visible])

  useEffect(() => {
    if (!visible || !category) return

    let active = true

    void categoryApi.listCategories(kind).then((categories) => {
      if (!active) return
      setChildCategories(
        categories.filter((item) => item.parentName === category.name && item.id !== category.id),
      )
    }).catch(() => {
      if (!active) return
      setChildCategories([])
    })

    return () => {
      active = false
    }
  }, [category, kind, visible])

  const title = category ? 'Edit category' : 'Add category'
  const cta = category ? 'Save' : 'Add'
  const nameError = !name.trim() ? 'Name is required' : ''
  const isSubcategoryFlow =
    kind === 'expense' &&
    Boolean(
      parentName.trim() ||
      (category && category.parentName !== category.name) ||
      draftCategory?.parentName?.trim(),
    )
  const dueDayError =
    isSubcategoryFlow && expenseType === 'fixed' && dueDayOfMonth.trim().length > 0
      ? !Number.isInteger(Number(dueDayOfMonth)) || Number(dueDayOfMonth) < 1 || Number(dueDayOfMonth) > 31
        ? 'Due day must be between 1 and 31'
        : ''
      : ''

  const iconOptions = useMemo(() => CATEGORY_ICON_OPTIONS.map(String), [])

  const handleSubmit = async () => {
    if (nameError) {
      setError(nameError)
      return
    }

    if (dueDayError) {
      setError(dueDayError)
      return
    }

    const resolvedDueDay =
      kind === 'expense'
        ? expenseType === 'fixed'
          ? dueDayOfMonth.trim().length > 0
            ? Number(dueDayOfMonth)
            : null
          : null
        : undefined

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
          type: kind === 'expense' ? expenseType : undefined,
          dueDayOfMonth: isSubcategoryFlow ? resolvedDueDay : undefined,
        })
      } else {
        await categoryApi.createCategory({
          kind,
          name: name.trim(),
          parentName: parentName.trim() || undefined,
          icon,
          color,
          iconColor,
          type: kind === 'expense' ? expenseType : undefined,
          allocated: kind === 'expense' ? 0 : undefined,
          dueDayOfMonth: isSubcategoryFlow ? resolvedDueDay : undefined,
        })
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!category) return

    try {
      setSubmitting(true)
      setError('')
      await categoryApi.deleteCategory(category.id, kind)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove category')
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

            {isSubcategoryFlow ? (
              <>
                <Text style={styles.fieldLabel}>Category type</Text>
                <View style={styles.typeToggle}>
                  <TouchableOpacity
                    style={[styles.typeButton, expenseType === 'budget' && styles.typeButtonActive]}
                    activeOpacity={0.88}
                    onPress={() => setExpenseType('budget')}
                  >
                    <Text style={[styles.typeButtonText, expenseType === 'budget' && styles.typeButtonTextActive]}>
                      Budget
                    </Text>
                    <Text style={styles.typeButtonHint}>Track spending</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeButton, expenseType === 'fixed' && styles.typeButtonActiveGreen]}
                    activeOpacity={0.88}
                    onPress={() => setExpenseType('fixed')}
                  >
                    <Text style={[styles.typeButtonText, expenseType === 'fixed' && styles.typeButtonTextActiveGreen]}>
                      Fixed
                    </Text>
                    <Text style={styles.typeButtonHint}>Set amount</Text>
                  </TouchableOpacity>
                </View>

                {expenseType === 'fixed' ? (
                  <>
                    <Text style={styles.fieldLabel}>Due day</Text>
                    <TextInput
                      style={styles.input}
                      value={dueDayOfMonth}
                      onChangeText={setDueDayOfMonth}
                      keyboardType="number-pad"
                      placeholder="Optional, e.g. 15"
                      placeholderTextColor="rgba(255,255,255,0.24)"
                    />
                  </>
                ) : null}
              </>
            ) : null}

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

            {category && showSubcategorySection ? (
              <View style={styles.subcategorySection}>
                <View style={styles.subcategoryHeader}>
                  <Text style={styles.subcategoryTitle}>Subcategories</Text>
                  <TouchableOpacity
                    style={styles.subcategoryAddButton}
                    activeOpacity={0.88}
                    onPress={() => {
                      setEditingChildCategory(null)
                      setChildEditorVisible(true)
                    }}
                  >
                    <Text style={styles.subcategoryAddText}>Add</Text>
                  </TouchableOpacity>
                </View>

                {childCategories.length > 0 ? (
                  childCategories.map((child) => (
                    <TouchableOpacity
                      key={child.id}
                      style={styles.subcategoryRow}
                      activeOpacity={0.88}
                      onPress={() => {
                        setEditingChildCategory(child)
                        setChildEditorVisible(true)
                      }}
                    >
                      <View style={[styles.subcategoryIconWrap, { backgroundColor: child.color }]}>
                        <Ionicons name={getIoniconName(child.icon)} size={14} color={child.iconColor} />
                      </View>
                      <Text style={styles.subcategoryRowText}>{child.name}</Text>
                      <Ionicons name="reorder-three-outline" size={18} color="rgba(255,255,255,0.28)" />
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.subcategoryEmpty}>No subcategories yet</Text>
                )}
              </View>
            ) : null}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity style={styles.saveButton} onPress={() => void handleSubmit()} activeOpacity={0.9}>
              <LinearGradient colors={['rgba(92,163,255,0.98)', 'rgba(70,138,230,0.98)']} style={styles.saveGradient}>
                {submitting ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.saveText}>{cta}</Text>}
              </LinearGradient>
            </TouchableOpacity>
            {category ? (
              <TouchableOpacity onPress={() => void handleDelete()} activeOpacity={0.82} disabled={submitting}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={onClose} activeOpacity={0.82}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
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

      {showSubcategorySection ? (
        <CategoryEditorModal
          visible={childEditorVisible}
          kind={kind}
          category={editingChildCategory}
          draftCategory={
            editingChildCategory
                ? null
              : {
                  parentName: category?.name ?? '',
                  color,
                  iconColor,
                  icon,
                  type: kind === 'expense' ? expenseType : undefined,
                  dueDayOfMonth: kind === 'expense' && expenseType === 'fixed' && dueDayOfMonth.trim()
                    ? Number(dueDayOfMonth)
                    : undefined,
                }
          }
          showSubcategorySection={false}
          onClose={() => setChildEditorVisible(false)}
          onSaved={() => {
            setChildEditorVisible(false)
            onSaved()
          }}
        />
      ) : null}
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
  typeToggle: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    minHeight: 74,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  typeButtonActive: {
    backgroundColor: 'rgba(201,168,76,0.12)',
    borderColor: 'rgba(201,168,76,0.24)',
  },
  typeButtonActiveGreen: {
    backgroundColor: 'rgba(94,189,151,0.12)',
    borderColor: 'rgba(94,189,151,0.24)',
  },
  typeButtonText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
  },
  typeButtonTextActive: {
    color: '#e2c06a',
  },
  typeButtonTextActiveGreen: {
    color: '#78d89c',
  },
  typeButtonHint: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.34)',
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
  },
  errorText: {
    marginTop: 16,
    color: '#ffb1a6',
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
  },
  subcategorySection: {
    marginTop: 22,
  },
  subcategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  subcategoryTitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 22,
    fontFamily: 'DMSans_700Bold',
  },
  subcategoryAddButton: {
    minWidth: 64,
    height: 38,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
  },
  subcategoryAddText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
  subcategoryRow: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  subcategoryIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subcategoryRowText: {
    flex: 1,
    color: 'rgba(255,255,255,0.88)',
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
  },
  subcategoryEmpty: {
    color: 'rgba(255,255,255,0.34)',
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
  },
  footer: { paddingHorizontal: 20, gap: 14 },
  saveButton: { borderRadius: 22, overflow: 'hidden' },
  saveGradient: { minHeight: 58, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: 'white', fontSize: 20, fontFamily: 'DMSans_700Bold' },
  cancelText: { textAlign: 'center', color: 'rgba(255,255,255,0.82)', fontSize: 16, fontFamily: 'DMSans_700Bold' },
  removeText: { textAlign: 'center', color: '#ff6f61', fontSize: 16, fontFamily: 'DMSans_700Bold' },
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
