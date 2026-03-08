// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BottomSheet } from './BottomSheet'
import { wishlistApi, type WishlistItem, type WishlistPriority, type WishlistPreview } from '../services/wishlistApi'

type WishlistItemSheetProps = {
  visible: boolean
  item?: WishlistItem | null
  categories: string[]
  onClose: () => void
  onSaved: (item: WishlistItem) => void
}

type SheetMode = 'url' | 'manual'

const priorityOptions: WishlistPriority[] = ['High', 'Medium', 'Low']
const fallbackCategories = ['Tech', 'Home', 'Fashion', 'Travel', 'Gaming', 'Other']

const isHttpUrl = (value: string) => {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const buildManualWishlistUrl = (title: string) => {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item'

  return `app://wishlist/manual/${slug}-${Date.now()}`
}

const formatPreviewPrice = (price: number | null) => {
  if (price === null) return 'Price unavailable'

  return `NOK ${price.toLocaleString('nb-NO')}`
}

export function WishlistItemSheet({
  visible,
  item,
  categories,
  onClose,
  onSaved,
}: WishlistItemSheetProps) {
  const { width } = useWindowDimensions()
  const pagerRef = useRef<ScrollView | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previewRequestIdRef = useRef(0)

  const [pageWidth, setPageWidth] = useState(width - 32)
  const [mode, setMode] = useState<SheetMode>('url')
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState<WishlistPriority>('Medium')
  const [notes, setNotes] = useState('')
  const [preview, setPreview] = useState<WishlistPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)

  const isEditing = Boolean(item)
  const normalizedUrl = url.trim()
  const normalizedName = name.trim()
  const normalizedCategory = category.trim()
  const normalizedNotes = notes.trim()
  const hasValidUrl = normalizedUrl.length > 0 && isHttpUrl(normalizedUrl)
  const hasValidManualName = normalizedName.length > 0
  const hasValidPrice = price.trim() === '' || (!Number.isNaN(Number(price)) && Number(price) >= 0)
  const canSubmitFromUrl = hasValidUrl && !previewLoading && preview !== null
  const canSubmitManual = hasValidManualName && hasValidPrice

  const availableCategories = useMemo(() => {
    const set = new Set([...fallbackCategories, ...categories.filter(Boolean)])
    return Array.from(set)
  }, [categories])

  useEffect(() => {
    if (!visible) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
      return
    }

    const nextMode: SheetMode = item ? 'manual' : 'url'
    const nextUrl = item && isHttpUrl(item.url) ? item.url : ''

    setMode(nextMode)
    setUrl(nextUrl)
    setName(item?.title ?? '')
    setPrice(item?.price === null || item?.price === undefined ? '' : String(item.price))
    setCategory(item?.category ?? '')
    setPriority(item?.priority ?? 'Medium')
    setNotes(item?.notes ?? '')
    setPreview(
      item && isHttpUrl(item.url)
        ? {
            title: item.title,
            imageUrl: item.imageUrl ?? null,
            price: item.price ?? null,
            sourceUrl: item.url,
          }
        : null,
    )
    setPreviewError('')
    setSubmitError('')
    setPreviewLoading(false)
    setSubmitting(false)
    setSubmitSuccess(false)
    setHasTriedSubmit(false)

    requestAnimationFrame(() => {
      pagerRef.current?.scrollTo({ x: nextMode === 'url' ? 0 : pageWidth, animated: false })
    })
  }, [visible, item, pageWidth])

  useEffect(() => {
    if (!visible || mode !== 'url') {
      return
    }

    if (!normalizedUrl) {
      setPreview(isEditing && item && isHttpUrl(item.url)
        ? {
            title: item.title,
            imageUrl: item.imageUrl ?? null,
            price: item.price ?? null,
            sourceUrl: item.url,
          }
        : null)
      setPreviewError('')
      setPreviewLoading(false)
      return
    }

    if (!hasValidUrl) {
      setPreview(null)
      setPreviewLoading(false)
      setPreviewError('Enter a valid http or https URL')
      return
    }

    const requestId = previewRequestIdRef.current + 1
    previewRequestIdRef.current = requestId
    setPreviewLoading(true)
    setPreviewError('')

    const timeoutId = setTimeout(async () => {
      try {
        const response = await wishlistApi.previewFromUrl(normalizedUrl)

        if (previewRequestIdRef.current !== requestId) {
          return
        }

        setPreview(response)
        if (!isEditing || !item || item.url !== normalizedUrl) {
          if (response.title) {
            setName(response.title)
          }
          if (response.price !== null) {
            setPrice(String(response.price))
          }
        }
      } catch (error) {
        if (previewRequestIdRef.current !== requestId) {
          return
        }

        setPreview(null)
        setPreviewError(error instanceof Error ? error.message : 'Could not fetch product details')
      } finally {
        if (previewRequestIdRef.current === requestId) {
          setPreviewLoading(false)
        }
      }
    }, 450)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [visible, mode, normalizedUrl, hasValidUrl, isEditing, item])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  const jumpToMode = (nextMode: SheetMode) => {
    setMode(nextMode)
    pagerRef.current?.scrollTo({ x: nextMode === 'url' ? 0 : pageWidth, animated: true })
  }

  const handlePagerEnd = (offsetX: number) => {
    if (!pageWidth) return
    setMode(Math.round(offsetX / pageWidth) === 0 ? 'url' : 'manual')
  }

  const handleClose = () => {
    if (submitting) return
    onClose()
  }

  const completeSave = (savedItem: WishlistItem) => {
    setSubmitSuccess(true)
    onSaved(savedItem)

    closeTimerRef.current = setTimeout(() => {
      setSubmitSuccess(false)
      onClose()
    }, 650)
  }

  const handleSubmit = async () => {
    setHasTriedSubmit(true)
    setSubmitError('')

    if (mode === 'url' && !canSubmitFromUrl) {
      return
    }

    if (mode === 'manual' && !canSubmitManual) {
      return
    }

    setSubmitting(true)

    try {
      let savedItem: WishlistItem

      if (mode === 'url') {
        const payload = {
          title: preview?.title?.trim() || normalizedName || item?.title || 'Wishlist item',
          url: normalizedUrl,
          price: preview?.price ?? item?.price ?? null,
          imageUrl: preview?.imageUrl ?? item?.imageUrl ?? '',
          category: item?.category ?? '',
          notes: item?.notes ?? null,
          priority: item?.priority ?? 'Medium',
          savedAmount: item?.savedAmount ?? 0,
        }

        savedItem = item
          ? await wishlistApi.update(item.id, payload)
          : await wishlistApi.create(payload)
      } else {
        const manualUrl = item?.url || buildManualWishlistUrl(normalizedName)
        const payload = {
          title: normalizedName,
          url: manualUrl,
          price: price.trim() === '' ? null : Number(price),
          imageUrl: item?.imageUrl ?? '',
          category: normalizedCategory,
          notes: normalizedNotes === '' ? null : normalizedNotes,
          priority,
          savedAmount: item?.savedAmount ?? 0,
        }

        savedItem = item
          ? await wishlistApi.update(item.id, payload)
          : await wishlistApi.create(payload)
      }

      completeSave(savedItem)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save wishlist item')
    } finally {
      setSubmitting(false)
    }
  }

  const footer = (
    <View style={styles.footerWrap}>
      {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}
      {submitSuccess ? (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={18} color="#166534" />
          <Text style={styles.successText}>{isEditing ? 'Changes saved' : 'Item added to wishlist'}</Text>
        </View>
      ) : null}
      <TouchableOpacity
        style={[
          styles.primaryButton,
          (!(mode === 'url' ? canSubmitFromUrl : canSubmitManual) || submitting) && styles.primaryButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!(mode === 'url' ? canSubmitFromUrl : canSubmitManual) || submitting}
        activeOpacity={0.9}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.primaryButtonText}>
            {submitSuccess ? 'Saved' : isEditing ? 'Save changes' : 'Add to Wishlist'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  )

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      title={isEditing ? 'Edit Wishlist Item' : 'Add Wishlist Item'}
      subtitle={isEditing ? 'Update the item and save changes.' : 'Add from a product URL or enter it manually.'}
      footer={footer}
    >
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, mode === 'url' && styles.tabActive]}
          onPress={() => jumpToMode('url')}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabText, mode === 'url' && styles.tabTextActive]}>🔗 From URL</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, mode === 'manual' && styles.tabActive]}
          onPress={() => jumpToMode('manual')}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabText, mode === 'manual' && styles.tabTextActive]}>✏️ Manual</Text>
        </TouchableOpacity>
      </View>

      <View
        style={styles.pagerShell}
        onLayout={(event) => {
          const measuredWidth = event.nativeEvent.layout.width
          if (measuredWidth > 0 && measuredWidth !== pageWidth) {
            setPageWidth(measuredWidth)
          }
        }}
      >
        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => handlePagerEnd(event.nativeEvent.contentOffset.x)}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.page, { width: pageWidth || width - 32 }]}> 
            <ScrollView contentContainerStyle={styles.pageContent} keyboardShouldPersistTaps="handled">
              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Product URL</Text>
                <TextInput
                  style={[styles.input, hasTriedSubmit && mode === 'url' && !hasValidUrl && styles.inputError]}
                  value={url}
                  onChangeText={setUrl}
                  placeholder="https://example.com/product"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  editable={!submitting}
                />
                <Text style={styles.helpText}>Paste a product URL and the app will fetch the title, price, and image automatically.</Text>
              </View>

              {previewLoading ? (
                <View style={styles.previewSkeleton}>
                  <View style={styles.skeletonImage} />
                  <View style={styles.skeletonCopy}>
                    <View style={styles.skeletonLineWide} />
                    <View style={styles.skeletonLine} />
                    <View style={styles.skeletonBadge} />
                  </View>
                </View>
              ) : null}

              {previewError ? <Text style={styles.inlineError}>{previewError}</Text> : null}

              {preview && !previewLoading ? (
                <View style={styles.previewCard}>
                  <View style={styles.previewImageWrap}>
                    {preview.imageUrl ? (
                      <Image source={{ uri: preview.imageUrl }} style={styles.previewImage} resizeMode="contain" />
                    ) : (
                      <View style={styles.previewImageBadgeEmpty}>
                        <Ionicons name="image-outline" size={18} color="#94a3b8" />
                      </View>
                    )}
                  </View>
                  <View style={styles.previewCopy}>
                    <Text style={styles.previewEyebrow}>Preview</Text>
                    <Text style={styles.previewTitle}>{preview.title || 'Untitled product'}</Text>
                    <Text style={styles.previewPrice}>{formatPreviewPrice(preview.price)}</Text>
                    <Text style={styles.previewMeta} numberOfLines={1}>{preview.sourceUrl}</Text>
                  </View>
                </View>
              ) : null}
            </ScrollView>
          </View>

          <View style={[styles.page, { width: pageWidth || width - 32 }]}> 
            <ScrollView contentContainerStyle={styles.pageContent} keyboardShouldPersistTaps="handled">
              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={[styles.input, hasTriedSubmit && !hasValidManualName && styles.inputError]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Nintendo Switch 2"
                  placeholderTextColor="#94a3b8"
                  editable={!submitting}
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Price (NOK)</Text>
                <TextInput
                  style={[styles.input, hasTriedSubmit && !hasValidPrice && styles.inputError]}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="4999"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  editable={!submitting}
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                  {availableCategories.map((option) => {
                    const isActive = option === category

                    return (
                      <TouchableOpacity
                        key={option}
                        style={[styles.pill, isActive && styles.pillActive]}
                        onPress={() => setCategory(option)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{option}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </ScrollView>
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Priority</Text>
                <View style={styles.priorityRow}>
                  {priorityOptions.map((option) => {
                    const isActive = option === priority

                    return (
                      <TouchableOpacity
                        key={option}
                        style={[styles.priorityPill, isActive && styles.priorityPillActive]}
                        onPress={() => setPriority(option)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.priorityText, isActive && styles.priorityTextActive]}>{option}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Note</Text>
                <TextInput
                  style={[styles.input, styles.noteInput]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Optional note or buying context"
                  placeholderTextColor="#94a3b8"
                  multiline
                  textAlignVertical="top"
                  editable={!submitting}
                />
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d9e1ea',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  tabText: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'DMSans_700Bold',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  pagerShell: {
    minHeight: 420,
    maxHeight: 520,
  },
  page: {
    paddingBottom: 4,
  },
  pageContent: {
    paddingBottom: 8,
    gap: 16,
  },
  fieldBlock: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#334155',
    fontFamily: 'DMSans_700Bold',
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d9e1ea',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0f172a',
    fontFamily: 'DMSans_500Medium',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  helpText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#64748b',
    fontFamily: 'DMSans_500Medium',
  },
  inlineError: {
    fontSize: 13,
    lineHeight: 18,
    color: '#dc2626',
    fontFamily: 'DMSans_500Medium',
  },
  previewSkeleton: {
    flexDirection: 'row',
    gap: 14,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },
  skeletonImage: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
  },
  skeletonCopy: {
    flex: 1,
    gap: 10,
    justifyContent: 'center',
  },
  skeletonLineWide: {
    height: 16,
    width: '82%',
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
  },
  skeletonLine: {
    height: 14,
    width: '55%',
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
  },
  skeletonBadge: {
    height: 12,
    width: '35%',
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
  },
  previewCard: {
    flexDirection: 'row',
    gap: 14,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d9e1ea',
    padding: 16,
  },
  previewImageWrap: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
  },
  previewImageBadgeEmpty: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCopy: {
    flex: 1,
    gap: 6,
  },
  previewEyebrow: {
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: '#3b82f6',
    fontFamily: 'DMSans_700Bold',
  },
  previewTitle: {
    fontSize: 18,
    lineHeight: 24,
    color: '#0f172a',
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  previewPrice: {
    fontSize: 15,
    color: '#059669',
    fontFamily: 'DMSans_700Bold',
  },
  previewMeta: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'DMSans_500Medium',
  },
  pillRow: {
    gap: 10,
    paddingVertical: 2,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d9e1ea',
    backgroundColor: '#ffffff',
  },
  pillActive: {
    backgroundColor: '#fff7ed',
    borderColor: '#fb923c',
  },
  pillText: {
    fontSize: 13,
    color: '#64748b',
    fontFamily: 'DMSans_600SemiBold',
  },
  pillTextActive: {
    color: '#c2410c',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityPill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d9e1ea',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  priorityPillActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  priorityText: {
    fontSize: 13,
    color: '#64748b',
    fontFamily: 'DMSans_700Bold',
  },
  priorityTextActive: {
    color: '#ffffff',
  },
  noteInput: {
    minHeight: 112,
  },
  footerWrap: {
    gap: 12,
  },
  submitError: {
    fontSize: 13,
    lineHeight: 18,
    color: '#dc2626',
    fontFamily: 'DMSans_500Medium',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  successText: {
    fontSize: 13,
    color: '#166534',
    fontFamily: 'DMSans_700Bold',
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: 15,
    color: '#ffffff',
    fontFamily: 'DMSans_700Bold',
  },
})