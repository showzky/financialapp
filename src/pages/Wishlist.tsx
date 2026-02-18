// ADD THIS: Wishlist page visual-only UI (no data wiring yet)
export const Wishlist = () => {
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

        <button
          type="button"
          className="rounded-neo bg-surface px-5 py-3 text-sm font-semibold text-text-primary shadow-neo-sm transition hover:text-accent-strong"
        >
          {/* ADD THIS: keep button visual-only for now */}
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
