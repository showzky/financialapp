import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  InteractionManager,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { categoryApi, type CategoryDto, type CategoryKind } from '../../services/categoryApi'
import { CategoryEditorModal } from './CategoryEditorModal'

type Props = {
  visible: boolean
  initialKind: CategoryKind
  selectedCategoryId?: string | null
  startInEditMode?: boolean
  onClose: () => void
  onSelect?: (category: CategoryDto, kind: CategoryKind) => void
  onCategoriesChanged?: () => void
}

type CategoryGroup = {
  parent: CategoryDto
  children: CategoryDto[]
}

function getIoniconName(icon: string | null | undefined): keyof typeof Ionicons.glyphMap {
  if (icon && icon in Ionicons.glyphMap) {
    return icon as keyof typeof Ionicons.glyphMap
  }

  return 'ellipse-outline'
}

function buildCategoryGroups(categories: CategoryDto[]) {
  const parentRows = categories.filter((category) => category.parentName === category.name)
  const childRows = categories.filter((category) => category.parentName !== category.name)
  const childrenByParent = new Map<string, CategoryDto[]>()

  for (const child of childRows) {
    const group = childrenByParent.get(child.parentName) ?? []
    group.push(child)
    childrenByParent.set(child.parentName, group)
  }

  const allParents = [...parentRows]

  for (const [parentName, children] of childrenByParent.entries()) {
    if (!allParents.some((row) => row.name === parentName)) {
      const firstChild = children[0]
      if (firstChild) {
        allParents.push({
          ...firstChild,
          id: `virtual-${parentName}`,
          name: parentName,
          parentName,
        })
      }
    }
  }

  return allParents
    .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name))
    .map(
      (parent): CategoryGroup => ({
        parent,
        children: (childrenByParent.get(parent.name) ?? []).sort(
          (left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name),
        ),
      }),
    )
}

export function CategoryPickerModal({
  visible,
  initialKind,
  selectedCategoryId,
  startInEditMode = false,
  onClose,
  onSelect,
  onCategoriesChanged,
}: Props) {
  const insets = useSafeAreaInsets()
  const [kind, setKind] = useState<CategoryKind>(initialKind)
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editMode, setEditMode] = useState(startInEditMode)
  const [editorVisible, setEditorVisible] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null)
  const [editorDraftCategory, setEditorDraftCategory] = useState<Partial<CategoryDto> | null>(null)
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({})

  const loadCategories = useCallback(async (options?: { showLoader?: boolean }) => {
    const showLoader = options?.showLoader ?? true

    try {
      if (showLoader) {
        setLoading(true)
      }
      setError('')
      const rows = await categoryApi.listCategories(kind)
      setCategories(rows)
    } catch (err) {
      if (categories.length === 0) {
        setError(err instanceof Error ? err.message : 'Failed to load categories')
      }
    } finally {
      if (showLoader) {
        setLoading(false)
      }
    }
  }, [categories.length, kind])

  useEffect(() => {
    if (!visible) return
    setKind(initialKind)
    setEditMode(startInEditMode)
  }, [initialKind, startInEditMode, visible])

  useEffect(() => {
    if (!visible) return

    const cached = categoryApi.getCachedCategories(kind)
    if (cached) {
      setCategories(cached)
      setLoading(false)
      setError('')
    }

    const task = InteractionManager.runAfterInteractions(() => {
      void loadCategories({ showLoader: !cached })
    })

    return () => {
      task.cancel()
    }
  }, [kind, loadCategories, visible])

  useEffect(() => {
    const nextExpanded: Record<string, boolean> = {}
    for (const category of categories) {
      if (category.parentName !== category.name) {
        nextExpanded[category.parentName] = false
      }
    }
    setExpandedParents(nextExpanded)
  }, [categories])

  const groups = useMemo(() => buildCategoryGroups(categories), [categories])
  const isSelectionPopup = !editMode

  const toggleExpanded = (parentName: string) => {
    setExpandedParents((current) => ({
      ...current,
      [parentName]: !current[parentName],
    }))
  }

  const renderGroup = (group: CategoryGroup) => {
    const parentSelected = selectedCategoryId === group.parent.id
    const isExpanded = expandedParents[group.parent.name] ?? group.children.length > 0
    const iconName = getIoniconName(group.parent.icon)
    const accent = group.parent.iconColor || group.parent.color

    return (
      <View key={group.parent.name} style={styles.groupBlock}>
        <TouchableOpacity
          style={[styles.row, parentSelected && styles.rowSelected]}
          activeOpacity={0.88}
          onPress={() => {
            if (editMode) {
              if (group.parent.id.startsWith('virtual-')) {
                const closestRealCategory =
                  group.children.find((child) => child.name === group.parent.name) ?? group.children[0] ?? null

                if (closestRealCategory) {
                  setEditingCategory(closestRealCategory)
                  setEditorDraftCategory(null)
                } else {
                  setEditingCategory(null)
                  setEditorDraftCategory({
                    name: group.parent.name,
                    parentName: '',
                    icon: group.parent.icon,
                    color: group.parent.color,
                    iconColor: group.parent.iconColor,
                  })
                }
              } else {
                setEditingCategory(group.parent)
                setEditorDraftCategory(null)
              }
              setEditorVisible(true)
              return
            }

            onSelect?.(group.parent, kind)
            onClose()
          }}
        >
          <View style={[styles.iconWrap, { backgroundColor: group.parent.color }]}>
            <Ionicons name={iconName} size={16} color={accent} />
          </View>
          <View style={styles.rowTextBlock}>
            <Text style={styles.rowTitle}>{group.parent.name}</Text>
            {editMode && group.children.length > 0 ? (
              <Text style={styles.rowSubtitle}>
                {group.children.length} {group.children.length === 1 ? 'subcategory' : 'subcategories'}
              </Text>
            ) : null}
          </View>
          {group.children.length > 0 && !editMode ? (
            <TouchableOpacity
              onPress={() => toggleExpanded(group.parent.name)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="rgba(255,255,255,0.42)"
              />
            </TouchableOpacity>
          ) : editMode ? (
            <MaterialCommunityIcons name="drag-vertical" size={18} color="rgba(255,255,255,0.28)" />
          ) : null}
        </TouchableOpacity>

        {isExpanded && group.children.length > 0 && !editMode ? (
          <View style={styles.childrenWrap}>
            {group.children.map((child) => {
              const childSelected = selectedCategoryId === child.id
              return (
                <TouchableOpacity
                  key={child.id}
                  style={[styles.childRow, childSelected && styles.rowSelected]}
                  activeOpacity={0.88}
                  onPress={() => {
                    if (editMode) {
                      setEditingCategory(child)
                      setEditorVisible(true)
                      return
                    }

                    onSelect?.(child, kind)
                    onClose()
                  }}
                >
                  <View style={[styles.childDot, { backgroundColor: child.iconColor || child.color }]} />
                  <Text style={styles.childTitle}>{child.name}</Text>
                  {editMode ? (
                    <MaterialCommunityIcons name="drag-vertical" size={16} color="rgba(255,255,255,0.24)" />
                  ) : null}
                </TouchableOpacity>
              )
            })}
          </View>
        ) : null}
      </View>
    )
  }

  return (
    <>
      <Modal visible={visible} transparent={isSelectionPopup} animationType="slide" onRequestClose={onClose}>
        <View style={isSelectionPopup ? styles.popupRoot : styles.fullscreenRoot}>
          {isSelectionPopup ? (
            <>
              <TouchableOpacity style={styles.popupBackdrop} activeOpacity={1} onPress={onClose} />
              <View style={styles.popupCard}>
                <LinearGradient colors={['#1a1826', '#12131d']} style={StyleSheet.absoluteFill} />
                <View style={styles.popupHeader}>
                  <Text style={styles.popupTitle}>Category</Text>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setEditMode(true)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                </View>

                {loading ? (
                  <View style={styles.centerState}>
                    <ActivityIndicator size="large" color="rgba(92,163,255,0.92)" />
                  </View>
                ) : error ? (
                  <View style={styles.centerState}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => void loadCategories()}>
                      <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <ScrollView contentContainerStyle={styles.popupContent}>{groups.map(renderGroup)}</ScrollView>
                )}
              </View>
            </>
          ) : (
            <>
              <LinearGradient colors={['#171623', '#0a0a0e', '#101420']} style={StyleSheet.absoluteFill} />

              <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
                <TouchableOpacity style={styles.headerButton} onPress={onClose} activeOpacity={0.85}>
                  <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.82)" />
                </TouchableOpacity>
                <Text style={styles.title}>Categories</Text>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setEditMode(false)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.editButtonText}>Done</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.tabsRow}>
                {(['expense', 'income'] as const).map((tab) => {
                  const active = tab === kind
                  return (
                    <TouchableOpacity
                      key={tab}
                      style={[styles.tab, active && styles.tabActive]}
                      onPress={() => setKind(tab)}
                      activeOpacity={0.88}
                    >
                      <Text style={[styles.tabText, active && styles.tabTextActive]}>
                        {tab === 'expense' ? 'Expenses' : 'Income'}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              {loading ? (
                <View style={styles.centerState}>
                  <ActivityIndicator size="large" color="rgba(92,163,255,0.92)" />
                </View>
              ) : error ? (
                <View style={styles.centerState}>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={() => void loadCategories()}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView
                  contentContainerStyle={[styles.fullscreenContent, { paddingBottom: Math.max(insets.bottom, 20) + 96 }]}
                >
                  {groups.map(renderGroup)}
                </ScrollView>
              )}

              <View style={[styles.fabWrap, { bottom: Math.max(insets.bottom, 16) + 18 }]}>
                <TouchableOpacity
                  style={styles.fab}
                  onPress={() => {
                    setEditingCategory(null)
                    setEditorDraftCategory(null)
                    setEditorVisible(true)
                  }}
                  activeOpacity={0.9}
                >
                  <LinearGradient colors={['rgba(92,163,255,0.98)', 'rgba(70,138,230,0.98)']} style={styles.fabGradient}>
                    <Ionicons name="add" size={22} color="white" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>

      <CategoryEditorModal
        visible={editorVisible}
        kind={kind}
        category={editingCategory}
        draftCategory={editorDraftCategory}
        onClose={() => setEditorVisible(false)}
        onSaved={() => {
          setEditorVisible(false)
          void loadCategories()
          onCategoriesChanged?.()
        }}
      />
    </>
  )
}

const styles = StyleSheet.create({
  popupRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(6,8,16,0.52)',
  },
  popupBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  popupCard: {
    maxHeight: '76%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 0,
  },
  popupHeader: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  popupTitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 22,
    fontFamily: 'DMSans_700Bold',
  },
  popupContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  fullscreenRoot: { flex: 1, backgroundColor: '#0a0a0e' },
  header: {
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
  title: { color: 'rgba(255,255,255,0.92)', fontSize: 22, fontFamily: 'DMSans_700Bold' },
  editButton: {
    minWidth: 54,
    height: 38,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
  },
  editButtonText: { color: 'rgba(255,255,255,0.82)', fontSize: 14, fontFamily: 'DMSans_700Bold' },
  tabsRow: {
    marginTop: 18,
    marginHorizontal: 20,
    flexDirection: 'row',
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 4,
  },
  tab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  tabActive: { backgroundColor: 'rgba(214,74,74,0.9)' },
  tabText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'DMSans_700Bold' },
  tabTextActive: { color: 'white' },
  fullscreenContent: { paddingHorizontal: 20, paddingTop: 18 },
  groupBlock: { marginBottom: 10 },
  row: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
  },
  rowSelected: {
    borderColor: 'rgba(92,163,255,0.44)',
    backgroundColor: 'rgba(92,163,255,0.08)',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
  },
  rowTextBlock: {
    flex: 1,
  },
  rowSubtitle: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.34)',
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
  },
  childrenWrap: {
    marginTop: 6,
    marginLeft: 28,
    gap: 6,
  },
  childRow: {
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  childDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  childTitle: {
    flex: 1,
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
  },
  fabWrap: { position: 'absolute', right: 18 },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 18,
    overflow: 'hidden',
  },
  fabGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorText: {
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
  },
  retryButton: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(92,163,255,0.92)',
  },
  retryButtonText: { color: 'white', fontFamily: 'DMSans_700Bold' },
})
