import { useState } from 'react'
import { wishlistApi } from '@/services/wishlistApi'

type WishlistItem = {
  id: string
  title: string
  url: string
  price: number | null
  imageUrl: string
  category: string
}

const WISHLIST_STORAGE_KEY = 'finance-wishlist-items-v1'

const readWishlistFromStorage = (): WishlistItem[] => {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as WishlistItem[]
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

const persistWishlistToStorage = (items: WishlistItem[]) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items))
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
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(price)
}

export const Wishlist = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [productTitle, setProductTitle] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)
  const [productUrl, setProductUrl] = useState('')
  const [productImageUrl, setProductImageUrl] = useState('')
  const [productCategory, setProductCategory] = useState('')
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(readWishlistFromStorage)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')

  const normalizedTitle = productTitle.trim()
  const normalizedUrl = productUrl.trim()
  const normalizedImageUrl = productImageUrl.trim()
  const normalizedCategory = productCategory.trim()
  const normalizedPrice = productPrice.trim()

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
  const hasValidPriceFormat = normalizedPrice === '' || (!Number.isNaN(Number(normalizedPrice)) && Number(normalizedPrice) >= 0)
  const isFormValid = normalizedTitle !== '' && hasValidUrlFormat && hasValidImageUrlFormat && hasValidPriceFormat

  const resetAddProductForm = () => {
    setProductTitle('')
    setProductUrl('')
    setProductPrice('')
    setProductImageUrl('')
    setProductCategory('')
    setHasTriedSubmit(false)
    setEditingProductId(null)
    setPreviewError('')
    setIsPreviewLoading(false)
  }

  const closeAddProductModal = () => {
    setIsAddModalOpen(false)
    resetAddProductForm()
  }

  const upsertWishlistItem = (item: WishlistItem) => {
    setWishlistItems((current) => {
      const next = editingProductId
        ? current.map((existing) => (existing.id === editingProductId ? item : existing))
        : [item, ...current]
      persistWishlistToStorage(next)
      return next
    })
  }

  const handleOpenEditModal = (item: WishlistItem) => {
    setEditingProductId(item.id)
    setProductTitle(item.title)
    setProductUrl(item.url)
    setProductPrice(item.price === null ? '' : String(item.price))
    setProductImageUrl(item.imageUrl)
    setProductCategory(item.category)
    setHasTriedSubmit(false)
    setIsAddModalOpen(true)
  }

  const handleDeleteProduct = (id: string) => {
    setWishlistItems((current) => {
      const next = current.filter((item) => item.id !== id)
      persistWishlistToStorage(next)
      return next
    })
  }

  const handleAutoFillFromUrl = async () => {
    if (!hasValidUrlFormat || isPreviewLoading) return

    setPreviewError('')
    setIsPreviewLoading(true)

    try {
      const preview = await wishlistApi.previewFromUrl(normalizedUrl)

      if (!normalizedTitle && preview.title) {
        setProductTitle(preview.title)
      }

      if (!normalizedImageUrl && preview.imageUrl) {
        setProductImageUrl(preview.imageUrl)
      }

      if (!normalizedPrice && preview.price !== null) {
        setProductPrice(String(preview.price))
      }
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
            {/* ADD THIS: wishlist icon */}
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

        {isAddModalOpen && (
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
                  value={productTitle}
                  onChange={(e) => setProductTitle(e.target.value)}
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
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
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
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
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
                <label htmlFor="wishlist-product-image-url" className="text-base font-semibold text-slate-900 sm:text-lg">
                  Image URL (optional)
                </label>
                <input
                  id="wishlist-product-image-url"
                  type="url"
                  placeholder="e.g., https://example.com/image.jpg"
                  value={productImageUrl}
                  onChange={(e) => setProductImageUrl(e.target.value)}
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
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
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

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                <button
                  type="button"
                  onClick={closeAddProductModal}
                  className="w-full rounded-xl bg-slate-200 px-6 py-3 text-base font-semibold text-slate-700 hover:bg-slate-300 sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHasTriedSubmit(true)
                    if (!isFormValid) return

                    const parsedPrice = normalizedPrice === '' ? null : Number(normalizedPrice)

                    upsertWishlistItem({
                      id: editingProductId ?? `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
                      title: normalizedTitle,
                      url: normalizedUrl,
                      price: parsedPrice,
                      imageUrl: normalizedImageUrl,
                      category: normalizedCategory,
                    })

                    closeAddProductModal()
                  }}
                  className="w-full rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700 sm:w-auto"
                >
                  {editingProductId ? 'Save Changes' : 'Add to Wishlist'}
                </button>
              </div>
              </div>
            </div>
          </div>
        )}

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

      {wishlistItems.length === 0 ? (
        <section className="mx-auto grid w-full max-w-6xl place-items-center py-28 text-center">
          <div className="space-y-4">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-surface shadow-neo-inset">
              {/* ADD THIS: empty state box icon */}
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
      ) : (
        <section className="mx-auto mt-8 grid w-full max-w-6xl gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {wishlistItems.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-2xl bg-surface shadow-neo-sm">
              <div className="grid h-48 place-items-center border-b border-slate-200 bg-slate-100">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="grid place-items-center gap-3 text-text-muted">
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-surface shadow-neo-inset">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-7 w-7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="M14 5h5v5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M10 14 19 5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M19 13v6H5V5h6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="text-sm">Product Placeholder</p>
                  </div>
                )}
              </div>

              <div className="space-y-3 p-4">
                {item.category ? (
                  <span className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                    {item.category}
                  </span>
                ) : null}

                <h3 className="line-clamp-2 text-2xl font-semibold text-text-primary">{item.title}</h3>
                <p className="text-lg font-semibold text-text-primary">{formatWishlistPrice(item.price)}</p>

                <p className="inline-flex items-center gap-2 text-sm text-text-muted">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M14 5h5v5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10 14 19 5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M19 13v6H5V5h6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {getDomainFromUrl(item.url)}
                </p>

                <div className="flex items-center gap-3">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 font-semibold text-slate-800 transition hover:bg-slate-100"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M14 5h5v5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10 14 19 5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M19 13v6H5V5h6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Visit
                  </a>

                  <button
                    type="button"
                    aria-label="Edit product"
                    onClick={() => handleOpenEditModal(item)}
                    className="grid h-10 w-10 place-items-center rounded-lg text-blue-600 transition hover:bg-blue-50"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="m13.5 5.5 5 5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4 20h4l10-10a1.8 1.8 0 0 0-4-4L4 16v4Z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    aria-label="Delete product"
                    onClick={() => handleDeleteProduct(item.id)}
                    className="grid h-10 w-10 place-items-center rounded-lg text-red-600 transition hover:bg-red-50"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M3 6h18" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8 6V4h8v2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}
