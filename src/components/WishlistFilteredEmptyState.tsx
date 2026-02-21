import { type WishlistItemStatus } from '@/types/wishlist'

type WishlistFilteredEmptyStateProps = {
  selectedStatus: WishlistItemStatus
  onShowActive: () => void
  onResetFilters: () => void
}

export const WishlistFilteredEmptyState = ({
  selectedStatus,
  onShowActive,
  onResetFilters,
}: WishlistFilteredEmptyStateProps) => {
  if (selectedStatus === 'purchased') {
    return (
      <section className="mx-auto mt-8 grid w-full max-w-6xl place-items-center rounded-2xl bg-surface px-6 py-16 text-center shadow-neo-sm">
        <div className="space-y-3">
          {/* ADD THIS: richer purchased-empty copy so users understand what to do next */}
          <h2 className="text-2xl font-semibold text-text-primary">
            No purchased items in this view yet
          </h2>
          <p className="max-w-2xl text-base text-text-muted">
            Items appear here after they are marked as purchased from the Active items tab once
            savings reach the target price.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={onShowActive}
              className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Go to Active items
            </button>
            <button
              type="button"
              onClick={onResetFilters}
              className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Clear filters
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto mt-8 grid w-full max-w-6xl place-items-center rounded-2xl bg-surface px-6 py-16 text-center shadow-neo-sm">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-text-primary">
          No active products in this filter
        </h2>
        <p className="text-base text-text-muted">
          Switch your filters or add a new item that matches this view.
        </p>
      </div>
    </section>
  )
}
