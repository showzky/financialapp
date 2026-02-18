import { useState } from 'react'

export const Wishlist = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [productTitle, setProductTitle] = useState('')
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)
  const [productUrl, setProductUrl] = useState('')

  const normalizedTitle = productTitle.trim()
  const normalizedUrl = productUrl.trim()

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
  const isFormValid = normalizedTitle !== '' && hasValidUrlFormat

  const resetAddProductForm = () => {
    setProductTitle('')
    setProductUrl('')
    setHasTriedSubmit(false)
  }

  const closeAddProductModal = () => {
    setIsAddModalOpen(false)
    resetAddProductForm()
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
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-semibold text-slate-900">Add New Product</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Add a product to my wishlist
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
                <label htmlFor="wishlist-product-title" className="text-lg font-semibold text-slate-900">
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
              <div className="space-y-2">
                <label htmlFor="wishlist-product-url" className="text-lg font-semibold text-slate-900">
                  Product URL
                </label>
                <input
                  id="wishlist-product-url"
                  type="url"
                  placeholder="e.g., https://example.com/product"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-700 outline-none focus:border-slate-500"
                />
                {hasTriedSubmit && !isUrlPresent ? (
                  <p className="text-sm text-red-600">Product URL is required.</p>
                ) : null}
                {hasTriedSubmit && isUrlPresent && !hasValidUrlFormat ? (
                  <p className="text-sm text-red-600">Enter a valid URL starting with http:// or https://.</p>
                ) : null}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeAddProductModal}
                  className="rounded-xl bg-slate-200 px-6 py-3 text-base font-semibold text-slate-700 hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHasTriedSubmit(true)
                    if (!isFormValid) return

                    // TODO: Add submit logic here later
                    closeAddProductModal()
                  }}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700"
                >
                  Add Product
                </button>
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
    </div>
  )
}
