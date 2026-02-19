import { useEffect, useState } from 'react'
import { wishlistApi } from '@/services/wishlistApi'
import { WishlistCategoryFilter } from '@/components/WishlistCategoryFilter'
import { WishlistItemCard } from '@/components/WishlistItemCard'
import {
  type WishlistItem,
  type WishlistPriority,
  wishlistPriorityOptions,
  wishlistPriorityWeight,
} from '@/types/wishlist'

type ProductFormState = {
  title: string
  url: string
  price: string
  imageUrl: string
  category: string
  priority: WishlistPriority
}

const emptyProductForm: ProductFormState = {
  title: '',
  url: '',
  price: '',
  imageUrl: '',
  category: '',
  priority: 'Medium',
}

const normalizeWishlistPriority = (value: string): WishlistPriority => {
  if (value === 'High' || value === 'Medium' || value === 'Low') {
    return value
  }

  return 'Medium'
}

const normalizeWishlistUrl = (value: string) => {
  const parsed = new URL(value.trim())
  parsed.hostname = parsed.hostname.toLowerCase()
  parsed.hash = ''

  const filteredParams = [...parsed.searchParams.entries()]
    .filter(([key]) => {
      const normalizedKey = key.toLowerCase()
      return !normalizedKey.startsWith('utm_') && normalizedKey !== 'fbclid' && normalizedKey !== 'gclid'
    })
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => {
      if (leftKey === rightKey) {
        return leftValue.localeCompare(rightValue)
      }

      return leftKey.localeCompare(rightKey)
    })

  parsed.search = ''
  filteredParams.forEach(([key, paramValue]) => {
    parsed.searchParams.append(key, paramValue)
  })

  if (parsed.pathname !== '/') {
    const normalizedPath = parsed.pathname.replace(/\/+$/g, '')
    parsed.pathname = normalizedPath === '' ? '/' : normalizedPath
  }

  return parsed.toString()
}

type UpsertWishlistItemDraft = {
  title: string
  url: string
  price: number | null
  imageUrl: string
  category: string
  priority: WishlistPriority
}

const getDomainFromUrl = (value: string) => {
  try {
    return new URL(value).hostname
  } catch {
    return value
  }
}

const formatWishlistPrice = (price: number | null) => {
  if (price === null) return 'No price yet'
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 2,
  }).format(price)
}

export const Wishlist = () => {
  const allCategoryFilterLabel = 'All'
  const allPriorityFilterLabel = 'All'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [productForm, setProductForm] = useState<ProductFormState>({ ...emptyProductForm })
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(allCategoryFilterLabel)
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState(allPriorityFilterLabel)
  const [isWishlistLoading, setIsWishlistLoading] = useState(true)
  const [wishlistError, setWishlistError] = useState('')
  const [addProductError, setAddProductError] = useState('')
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false)
  const [selectedDepositId, setSelectedDepositId] = useState<string | null>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [hasTriedDepositSubmit, setHasTriedDepositSubmit] = useState(false)

  const normalizedTitle = productForm.title.trim()
  const normalizedUrl = productForm.url.trim()
  const normalizedImageUrl = productForm.imageUrl.trim()
  const normalizedCategory = productForm.category.trim()
  const normalizedPriority = normalizeWishlistPriority(productForm.priority)
  const normalizedPrice = productForm.price.trim()
  const normalizedDepositAmount = depositAmount.trim()

  const updateProductForm = (updates: Partial<ProductFormState>) => {
    setProductForm((current) => ({ ...current, ...updates }))
  }

  const isDuplicateWishlistUrl = (candidateUrl: string) => {
    if (!isValidHttpUrl(candidateUrl)) {
      return false
    }

    const normalizedCandidateUrl = normalizeWishlistUrl(candidateUrl)

    return wishlistItems.some((item) => {
      if (editingProductId && item.id === editingProductId) {
        return false
      }

      const normalizedItemUrl = item.normalizedUrl || normalizeWishlistUrl(item.url)
      return normalizedItemUrl === normalizedCandidateUrl
    })
  }

  const isValidHttpUrl = (value: string) => {
    try {
      const parsed = new URL(value)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
      return false
    }
  }

  const isUrlPresent = normalizedUrl !== ''
  const hasValidUrlFormat = isUrlPresent && isValidHttpUrl(normalizedUrl)
  const isImageUrlPresent = normalizedImageUrl !== ''
  const hasValidImageUrlFormat = !isImageUrlPresent || isValidHttpUrl(normalizedImageUrl)
  const hasValidPriceFormat =
    normalizedPrice === '' || (!Number.isNaN(Number(normalizedPrice)) && Number(normalizedPrice) >= 0)
  const isFormValid = normalizedTitle !== '' && hasValidUrlFormat && hasValidImageUrlFormat && hasValidPriceFormat
  const hasValidDepositAmount =
    normalizedDepositAmount !== '' &&
    !Number.isNaN(Number(normalizedDepositAmount)) &&
    Number(normalizedDepositAmount) > 0

  const selectedDepositItem =
    selectedDepositId === null ? null : wishlistItems.find((item) => item.id === selectedDepositId) ?? null

  const availableCategoryFilters = [
    allCategoryFilterLabel,
    ...Array.from(
      new Set(
        wishlistItems
          .map((item) => item.category.trim())
          .filter((category) => category.length > 0),
      ),
    ).sort((leftCategory, rightCategory) => leftCategory.localeCompare(rightCategory)),
  ]

  const availablePriorityFilters = [allPriorityFilterLabel, ...wishlistPriorityOptions]

  const priorityAndCategoryFilteredItems = wishlistItems.filter((item) => {
    const matchesCategory =
      selectedCategoryFilter === allCategoryFilterLabel || item.category.trim() === selectedCategoryFilter
    const matchesPriority =
      selectedPriorityFilter === allPriorityFilterLabel || item.priority === selectedPriorityFilter

    return matchesCategory && matchesPriority
  })

  const filteredWishlistItems = priorityAndCategoryFilteredItems
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const rightWeight = wishlistPriorityWeight[right.item.priority]
      const leftWeight = wishlistPriorityWeight[left.item.priority]

      if (rightWeight !== leftWeight) {
        return rightWeight - leftWeight
      }

      return left.index - right.index
    })
    .map((entry) => entry.item)

  useEffect(() => {
    if (!availableCategoryFilters.includes(selectedCategoryFilter)) {
      setSelectedCategoryFilter(allCategoryFilterLabel)
    }
  }, [availableCategoryFilters, selectedCategoryFilter])

  useEffect(() => {
    let isMounted = true

    const loadWishlist = async () => {
      try {
        const items = await wishlistApi.list()
        if (!isMounted) return

        setWishlistItems(
          items.map((item) => ({
            id: item.id,
            title: item.title,
            url: item.url,
            price: item.price,
            imageUrl: item.imageUrl,
            category: item.category,
            priority: normalizeWishlistPriority(item.priority),
            savedAmount: item.savedAmount,
            normalizedUrl: item.normalizedUrl,
            metadataStatus: item.metadataStatus,
            metadataLastCheckedAt: item.metadataLastCheckedAt,
            metadataLastSuccessAt: item.metadataLastSuccessAt,
          })),
        )
        setWishlistError('')
      } catch (error) {
        if (!isMounted) return
        setWishlistError(error instanceof Error ? error.message : 'Could not load wishlist items')
      } finally {
        if (!isMounted) return
        setIsWishlistLoading(false)
      }
    }

    void loadWishlist()

    return () => {
      isMounted = false
    }
  }, [])

  const resetAddProductForm = () => {
    setProductForm({ ...emptyProductForm })
    setHasTriedSubmit(false)
    setEditingProductId(null)
    setAddProductError('')
    setPreviewError('')
    setIsPreviewLoading(false)
  }

  const closeAddProductModal = () => {
    setIsAddModalOpen(false)
    resetAddProductForm()
  }

  const closeDepositModal = () => {
    setIsDepositModalOpen(false)
    setSelectedDepositId(null)
    setDepositAmount('')
    setHasTriedDepositSubmit(false)
  }

  const upsertWishlistItem = async (item: UpsertWishlistItemDraft) => {
    if (editingProductId) {
      const existing = wishlistItems.find((wishlistItem) => wishlistItem.id === editingProductId)
      if (!existing) return

      const updated = await wishlistApi.update(editingProductId, {
        title: item.title,
        url: item.url,
        price: item.price,
        imageUrl: item.imageUrl,
        category: item.category,
        priority: item.priority,
        savedAmount: existing.savedAmount,
      })

      setWishlistItems((current) =>
        current.map((wishlistItem) =>
          wishlistItem.id === editingProductId
            ? {
                id: updated.id,
                title: updated.title,
                url: updated.url,
                price: updated.price,
                imageUrl: updated.imageUrl,
                category: updated.category,
                priority: normalizeWishlistPriority(updated.priority),
                savedAmount: updated.savedAmount,
                normalizedUrl: updated.normalizedUrl,
                metadataStatus: updated.metadataStatus,
                metadataLastCheckedAt: updated.metadataLastCheckedAt,
                metadataLastSuccessAt: updated.metadataLastSuccessAt,
              }
            : wishlistItem,
        ),
      )

      return
    }

    const created = await wishlistApi.create({
      title: item.title,
      url: item.url,
      price: item.price,
      imageUrl: item.imageUrl,
      category: item.category,
      priority: item.priority,
      savedAmount: 0,
    })

    setWishlistItems((current) => [
      {
        id: created.id,
        title: created.title,
        url: created.url,
        price: created.price,
        imageUrl: created.imageUrl,
        category: created.category,
        priority: normalizeWishlistPriority(created.priority),
        savedAmount: created.savedAmount,
        normalizedUrl: created.normalizedUrl,
        metadataStatus: created.metadataStatus,
        metadataLastCheckedAt: created.metadataLastCheckedAt,
        metadataLastSuccessAt: created.metadataLastSuccessAt,
      },
      ...current,
    ])
  }

  const handleOpenEditModal = (item: WishlistItem) => {
    setEditingProductId(item.id)
    setProductForm({
      title: item.title,
      url: item.url,
      price: item.price === null ? '' : String(item.price),
      imageUrl: item.imageUrl,
      category: item.category,
      priority: item.priority,
    })
    setHasTriedSubmit(false)
    setIsAddModalOpen(true)
  }

  const handleDeleteProduct = async (id: string) => {
    try {
      await wishlistApi.remove(id)
      setWishlistItems((current) => current.filter((item) => item.id !== id))
      setWishlistError('')
    } catch (error) {
      setWishlistError(error instanceof Error ? error.message : 'Could not delete wishlist item')
    }
  }

  const handleOpenDepositModal = (itemId: string) => {
    setSelectedDepositId(itemId)
    setDepositAmount('')
    setHasTriedDepositSubmit(false)
    setIsDepositModalOpen(true)
  }

  const handleAddFunds = async () => {
    setHasTriedDepositSubmit(true)
    if (!selectedDepositId || !hasValidDepositAmount) return

    const amountToAdd = Number(normalizedDepositAmount)

    const selectedItem = wishlistItems.find((item) => item.id === selectedDepositId)
    if (!selectedItem) return

    try {
      const updated = await wishlistApi.update(selectedDepositId, {
        savedAmount: Math.max(0, selectedItem.savedAmount + amountToAdd),
      })

      setWishlistItems((current) =>
        current.map((item) =>
          item.id === selectedDepositId
            ? {
                id: updated.id,
                title: updated.title,
                url: updated.url,
                price: updated.price,
                imageUrl: updated.imageUrl,
                category: updated.category,
                priority: normalizeWishlistPriority(updated.priority),
                savedAmount: updated.savedAmount,
                normalizedUrl: updated.normalizedUrl,
                metadataStatus: updated.metadataStatus,
                metadataLastCheckedAt: updated.metadataLastCheckedAt,
                metadataLastSuccessAt: updated.metadataLastSuccessAt,
              }
            : item,
        ),
      )

      setWishlistError('')
      closeDepositModal()
    } catch (error) {
      setWishlistError(error instanceof Error ? error.message : 'Could not update saved amount')
    }
  }

  const handleAutoFillFromUrl = async () => {
    if (!hasValidUrlFormat || isPreviewLoading) return

    setPreviewError('')
    setIsPreviewLoading(true)

    try {
      const preview = await wishlistApi.previewFromUrl(normalizedUrl)

      setProductForm((current) => ({
        ...current,
        title: current.title.trim() === '' && preview.title ? preview.title : current.title,
        imageUrl: current.imageUrl.trim() === '' && preview.imageUrl ? preview.imageUrl : current.imageUrl,
        price: current.price.trim() === '' && preview.price !== null ? String(preview.price) : current.price,
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not auto-fetch product info'
      setPreviewError(message)
    } finally {
      setIsPreviewLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] px-4 py-8 md:px-8 lg:px-12">
      <section className="mx-auto flex w-full max-w-6xl items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-surface shadow-neo-inset">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="var(--color-accent-strong)"
              strokeWidth="1.8"
            >
              <path
                d="M12 20.5s-6.7-4.17-8.68-8.03C1.58 9.23 3.32 6 6.48 6c2 0 3.03 1.1 3.62 2.05C10.68 7.1 11.71 6 13.71 6c3.16 0 4.9 3.23 3.16 6.47C18.9 16.33 12 20.5 12 20.5Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="space-y-1">
            <h1 className="text-4xl font-semibold leading-tight text-text-primary">My Wishlist</h1>
            <p className="text-base text-text-muted">Start adding your favorite items</p>
          </div>
        </div>

        {isAddModalOpen ? (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/35 p-3 sm:p-4">
            <div className="grid min-h-full place-items-start sm:place-items-center">
              <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl sm:p-5">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                      {editingProductId ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 sm:mt-2">
                      Add a product to your wishlist by entering the URL and a title.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeAddProductModal}
                    className="text-xl leading-none text-slate-500 hover:text-slate-800"
                    aria-label="Close modal"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-2">
                  <label htmlFor="wishlist-product-title" className="text-base font-semibold text-slate-900 sm:text-lg">
                    Product Title
                  </label>
                  <input
                    id="wishlist-product-title"
                    type="text"
                    placeholder="e.g., Wireless Headphones"
                    value={productForm.title}
                    onChange={(e) => updateProductForm({ title: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-700 outline-none focus:border-slate-500"
                  />
                  {hasTriedSubmit && normalizedTitle === '' ? (
                    <p className="text-sm text-red-600">Product title is required.</p>
                  ) : null}
                </div>

                <div className="mt-4 space-y-2">
                  <label htmlFor="wishlist-product-price" className="text-base font-semibold text-slate-900 sm:text-lg">
                    Price
                  </label>
                  <input
                    id="wishlist-product-price"
                    type="text"
                    inputMode="decimal"
                    placeholder="e.g., 99.99"
                    value={productForm.price}
                    onChange={(e) => updateProductForm({ price: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-700 outline-none focus:border-slate-500"
                  />
                  {hasTriedSubmit && !hasValidPriceFormat ? (
                    <p className="text-sm text-red-600">Price must be a valid non-negative number.</p>
                  ) : null}
                </div>

                <div className="mt-4 space-y-2">
                  <label htmlFor="wishlist-product-url" className="text-base font-semibold text-slate-900 sm:text-lg">
                    Product URL
                  </label>
                  <input
                    id="wishlist-product-url"
                    type="url"
                    placeholder="e.g., https://example.com/product"
                    value={productForm.url}
                    onChange={(e) => updateProductForm({ url: e.target.value })}
                    onBlur={() => {
                      void handleAutoFillFromUrl()
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-700 outline-none focus:border-slate-500"
                  />
                  <p className="text-xs text-slate-500">
                    {isPreviewLoading
                      ? 'Fetching title, image, and price from this URL...'
                      : 'Auto-fetch runs when you leave this URL field.'}
                  </p>
                  {previewError ? <p className="text-sm text-red-600">{previewError}</p> : null}
                  {hasTriedSubmit && !isUrlPresent ? (
                    <p className="text-sm text-red-600">Product URL is required.</p>
                  ) : null}
                  {hasTriedSubmit && isUrlPresent && !hasValidUrlFormat ? (
                    <p className="text-sm text-red-600">Enter a valid URL starting with http:// or https://.</p>
                  ) : null}
                </div>

                <div className="mt-4 space-y-2">
                  <label
                    htmlFor="wishlist-product-image-url"
                    className="text-base font-semibold text-slate-900 sm:text-lg"
                  >
                    Image URL (optional)
                  </label>
                  <input
                    id="wishlist-product-image-url"
                    type="url"
                    placeholder="e.g., https://example.com/image.jpg"
                    value={productForm.imageUrl}
                    onChange={(e) => updateProductForm({ imageUrl: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-700 outline-none focus:border-slate-500"
                  />
                  {hasTriedSubmit && isImageUrlPresent && !hasValidImageUrlFormat ? (
                    <p className="text-sm text-red-600">Image URL must start with http:// or https://.</p>
                  ) : null}
                </div>

                <div className="mt-4 space-y-2">
                  <label htmlFor="wishlist-category" className="text-base font-semibold text-slate-900 sm:text-lg">
                    Category (optional)
                  </label>
                  <select
                    id="wishlist-category"
                    value={productForm.category}
                    onChange={(e) => updateProductForm({ category: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-700 outline-none focus:border-slate-500"
                  >
                    <option value="">Select a category</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Home">Home</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="mt-4 space-y-2">
                  <label htmlFor="wishlist-priority" className="text-base font-semibold text-slate-900 sm:text-lg">
                    Priority
                  </label>
                  <select
                    id="wishlist-priority"
                    value={productForm.priority}
                    onChange={(e) =>
                      updateProductForm({ priority: normalizeWishlistPriority(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-700 outline-none focus:border-slate-500"
                  >
                    {wishlistPriorityOptions.map((priorityOption) => (
                      <option key={priorityOption} value={priorityOption}>
                        {priorityOption}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                  {addProductError ? (
                    <p className="w-full text-sm text-red-600 sm:mr-auto sm:w-auto">{addProductError}</p>
                  ) : null}

                  <button
                    type="button"
                    onClick={closeAddProductModal}
                    className="w-full rounded-xl bg-slate-200 px-6 py-3 text-base font-semibold text-slate-700 hover:bg-slate-300 sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setHasTriedSubmit(true)
                      setAddProductError('')
                      if (!isFormValid) return

                      if (isDuplicateWishlistUrl(normalizedUrl)) {
                        setAddProductError('This product URL is already in your wishlist.')
                        return
                      }

                      const parsedPrice = normalizedPrice === '' ? null : Number(normalizedPrice)

                      try {
                        await upsertWishlistItem({
                          title: normalizedTitle,
                          url: normalizedUrl,
                          price: parsedPrice,
                          imageUrl: normalizedImageUrl,
                          category: normalizedCategory,
                          priority: normalizedPriority,
                        })

                        setWishlistError('')
                        closeAddProductModal()
                      } catch (error) {
                        const errorMessage =
                          error instanceof Error ? error.message : 'Could not save wishlist item'

                        if (/already exists/i.test(errorMessage)) {
                          setAddProductError('This product URL is already in your wishlist.')
                          return
                        }

                        setWishlistError(errorMessage)
                      }
                    }}
                    className="w-full rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700 sm:w-auto"
                  >
                    {editingProductId ? 'Save Changes' : 'Add to Wishlist'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {wishlistError ? <p className="text-sm text-red-600">{wishlistError}</p> : null}

        {isDepositModalOpen && selectedDepositItem ? (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/35 p-3 sm:p-4">
            <div className="grid min-h-full place-items-start sm:place-items-center">
              <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl sm:p-5">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">Deposit Funds</h2>
                    <p className="mt-1 text-sm text-slate-500">Add money toward this product.</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeDepositModal}
                    className="text-xl leading-none text-slate-500 hover:text-slate-800"
                    aria-label="Close deposit modal"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-1 rounded-xl bg-slate-100 px-4 py-3">
                  <p className="text-sm text-slate-500">Product</p>
                  <p className="font-semibold text-slate-900">{selectedDepositItem.title}</p>
                  <p className="text-sm text-slate-600">
                    Target: {formatWishlistPrice(selectedDepositItem.price)} · Saved:{' '}
                    {formatWishlistPrice(selectedDepositItem.savedAmount)}
                  </p>
                </div>

                <div className="mt-4 space-y-2">
                  <label htmlFor="wishlist-deposit-amount" className="text-base font-semibold text-slate-900">
                    Deposit Amount
                  </label>
                  <input
                    id="wishlist-deposit-amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="e.g., 250"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-700 outline-none focus:border-slate-500"
                  />
                  {hasTriedDepositSubmit && !hasValidDepositAmount ? (
                    <p className="text-sm text-red-600">Enter a valid deposit amount greater than 0.</p>
                  ) : null}
                </div>

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                  <button
                    type="button"
                    onClick={closeDepositModal}
                    className="w-full rounded-xl bg-slate-200 px-6 py-3 text-base font-semibold text-slate-700 hover:bg-slate-300 sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddFunds}
                    className="w-full rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700 sm:w-auto"
                  >
                    Add Funds
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => {
            resetAddProductForm()
            setIsAddModalOpen(true)
          }}
          className="rounded-neo bg-surface px-5 py-3 text-sm font-semibold text-text-primary shadow-neo-sm transition hover:text-accent-strong"
        >
          + Add Product
        </button>
      </section>

      {!isWishlistLoading && wishlistItems.length > 0 ? (
        <WishlistCategoryFilter
          categories={availableCategoryFilters}
          selectedCategory={selectedCategoryFilter}
          onCategoryChange={setSelectedCategoryFilter}
          priorities={availablePriorityFilters}
          selectedPriority={selectedPriorityFilter}
          onPriorityChange={setSelectedPriorityFilter}
        />
      ) : null}

      {isWishlistLoading ? (
        <section className="mx-auto grid w-full max-w-6xl place-items-center py-28 text-center">
          <p className="text-base text-text-muted">Loading wishlist...</p>
        </section>
      ) : wishlistItems.length === 0 ? (
        <section className="mx-auto grid w-full max-w-6xl place-items-center py-28 text-center">
          <div className="space-y-4">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-surface shadow-neo-inset">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-8 w-8 text-text-muted"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <path d="M12 3 4 7.5 12 12l8-4.5L12 3Z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 7.5V16.5L12 21l8-4.5V7.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 12v9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-semibold text-text-primary">Your wishlist is empty</h2>
              <p className="max-w-2xl text-base leading-relaxed text-text-muted">
                Start building your wishlist by adding products you love. Click the “Add Product” button to get started.
              </p>
            </div>
          </div>
        </section>
      ) : filteredWishlistItems.length === 0 ? (
        <section className="mx-auto mt-8 grid w-full max-w-6xl place-items-center rounded-2xl bg-surface px-6 py-16 text-center shadow-neo-sm">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-text-primary">No products in this category</h2>
            <p className="text-base text-text-muted">
              Switch your filters or add a new item that matches this view.
            </p>
          </div>
        </section>
      ) : (
        <section className="mx-auto mt-8 grid w-full max-w-6xl gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredWishlistItems.map((item) => (
            <WishlistItemCard
              key={item.id}
              item={item}
              formatWishlistPrice={formatWishlistPrice}
              getDomainFromUrl={getDomainFromUrl}
              onDeposit={handleOpenDepositModal}
              onVisitEdit={handleOpenEditModal}
              onDelete={handleDeleteProduct}
            />
          ))}
        </section>
      )}
    </div>
  )
}
